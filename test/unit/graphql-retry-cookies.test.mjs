// Tests for the cookie jar, request retry, and the graphql() helper.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { go } from "../../src/index.js";

let server;
let base;
let flakyHits = 0;

test.before(async () => {
  server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/login") {
      res.writeHead(200, { "content-type": "application/json", "set-cookie": "sid=abc123" });
      return res.end(JSON.stringify({ ok: true }));
    }
    if (req.method === "GET" && req.url === "/me") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ cookie: req.headers.cookie || null }));
    }
    if (req.method === "GET" && req.url === "/flaky") {
      flakyHits += 1;
      const status = flakyHits < 3 ? 503 : 200;
      res.writeHead(status, { "content-type": "application/json" });
      return res.end(JSON.stringify({ attempt: flakyHits }));
    }
    if (req.method === "POST" && req.url === "/graphql") {
      let raw = "";
      req.on("data", (c) => { raw += c; });
      req.on("end", () => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ echo: JSON.parse(raw || "{}") }));
      });
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});

test.after(() => server.close());

test("cookie jar replays a Set-Cookie on later requests", async () => {
  const api = go({ baseURL: base, cookies: true });
  await api.post("/login").expectStatus(200);
  await api.get("/me").expectStatus(200).expectJson("cookie", "sid=abc123");
});

test("without the jar, cookies are not carried over", async () => {
  const api = go(base); // no cookie jar
  await api.post("/login").expectStatus(200);
  await api.get("/me").expectJson("cookie", null);
});

test("retry recovers from transient 5xx responses", async () => {
  flakyHits = 0;
  const res = await go(base)
    .get("/flaky")
    .retry({ attempts: 3, delay: 1, on: (r) => r.status >= 500 })
    .expectStatus(200);
  res.expectJson("attempt", 3);
});

test("graphql posts query and variables as JSON", async () => {
  const res = await go(base)
    .graphql("{ user { id } }", { id: 1 }, { path: "/graphql" })
    .expectStatus(200);
  res.expectJson("echo.query", "{ user { id } }");
  res.expectJson("echo.variables.id", 1);
});
