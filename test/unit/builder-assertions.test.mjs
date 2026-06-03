// The extended HTTP assertions should be chainable on the (thenable) builder,
// not only on a resolved GoResponse.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { go } from "../../src/index.js";

let server;
let base;

test.before(async () => {
  server = http.createServer((req, res) => {
    if (req.url === "/users") {
      res.writeHead(201, { "content-type": "application/json", "set-cookie": "sid=abc" });
      res.end(JSON.stringify({ data: [{ id: 1 }, { id: 2 }], count: 2 }));
    } else {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
    }
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});

test.after(() => server.close());

test("extended assertions chain on the builder and replay on the response", async () => {
  await go(base)
    .post("/users")
    .json({ name: "Ada" })
    .expectStatus(201)
    .expectCreated()
    .expectContentType("json")
    .expectJsonSchema({ type: "object", required: ["data", "count"] })
    .expectJsonLength("data", 2)
    .expectJsonContains("data", { id: 2 })
    .expectCookie("sid");
});

test("a queued extended assertion still fails when it should", async () => {
  await assert.rejects(
    () => go(base).get("/users").expectNotFound(),
    /404/
  );
});

test("expectValue is not queued on the builder (only on the response)", async () => {
  const builder = go(base).get("/users");
  assert.equal(typeof builder.expectValue, "undefined");
  const res = await builder;
  res.expectValue("count").toBe(2);
});
