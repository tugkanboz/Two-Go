// End-to-end self test. Spins up a small fake service on a random port,
// drives it through the twogo fluent API, and exits non-zero on any failure.

import http from "node:http";
import { go, suite, run, reset } from "../src/index.js";

// --- fake service ---

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === "GET" && url === "/users") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      data: [
        { id: 1, name: "Ada", role: "admin" },
        { id: 2, name: "Linus", role: "user" },
      ],
      count: 2,
    }));
    return;
  }

  if (method === "POST" && url === "/users") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      let body = {};
      try { body = JSON.parse(raw); } catch { body = {}; }
      res.writeHead(201, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: 3, ...body }));
    });
    return;
  }

  if (method === "GET" && url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

// Listen on a random free port.
await new Promise((resolveListen) => server.listen(0, resolveListen));
const port = server.address().port;
const base = `http://localhost:${port}`;

// --- suite ---

reset();

suite("twogo self test", ({ test }) => {
  const api = go(base);

  test("GET /users returns 200 with JSON body", async () => {
    await api.get("/users")
      .expectStatus(200)
      .expectHeader("content-type", /application\/json/)
      .expectJson("data[0].id", 1)
      .expectJson("data[1].name", "Linus")
      .expectJson("count", 2);
  });

  test("POST /users echoes the body with a new id", async () => {
    const res = await api.post("/users")
      .json({ name: "Grace", role: "admin" })
      .expectStatus(201)
      .expectJson("id", 3)
      .expectJson("name", "Grace");
    if (res.get("role") !== "admin") {
      throw new Error("expected echoed role to be admin");
    }
  });

  test("unknown route returns 404", async () => {
    await api.get("/nope")
      .expectStatus(404)
      .expectJson("error", "not found");
  });

  test("predicate matcher on user role", async () => {
    await api.get("/users")
      .expectOk()
      .expectJson("data", (arr) => Array.isArray(arr) && arr.length === 2)
      .expectJson("data[0].role", (role) => role === "admin")
      .expectTimeBelow(5000);
  });
});

const { failed } = await run();

server.close();

if (failed > 0) {
  process.exitCode = 1;
}
