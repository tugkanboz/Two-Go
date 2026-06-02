// Demo suite discovered and executed by the twogo CLI:
//   node bin/twogo.js test/
//
// This file only registers a suite via suite(); the CLI calls run() for us.
// It boots a tiny local service in before() and tears it down in after().

import http from "node:http";
import { go, suite } from "../src/index.js";

let server;
let base;

suite("twogo CLI demo", ({ test, before, after }) => {
  before(async () => {
    server = http.createServer((req, res) => {
      if (req.method === "GET" && req.url === "/ping") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ pong: true, ts: "static" }));
        return;
      }
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
    });
    await new Promise((r) => server.listen(0, r));
    base = `http://localhost:${server.address().port}`;
  });

  after(() => {
    if (server) server.close();
  });

  test("GET /ping responds 200 with pong", async () => {
    await go(base).get("/ping")
      .expectStatus(200)
      .expectOk()
      .expectJson("pong", true);
  });

  test("missing route is 404", async () => {
    await go(base).get("/missing")
      .expectStatus(404)
      .expectJson("error", /not found/);
  });
});
