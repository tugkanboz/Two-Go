// Example: using twogo inside node:test.
//
// Run with:  node --test examples/api.test.js
//
// twogo assertions throw on failure, so node:test (and Jest, Vitest, Mocha)
// report them as normal test failures. Replace the placeholder base URL with
// your own service.

import { test } from "node:test";
import { go } from "two-go";

const api = go("https://api.example.com");

test("GET /users returns a list", async () => {
  await api.get("/users")
    .expectStatus(200)
    .expectHeader("content-type", /json/)
    .expectJson("data[0].id");
});

test("POST /users creates a user", async () => {
  await api.post("/users")
    .bearer("YOUR_TOKEN_HERE")
    .json({ name: "Ada", role: "admin" })
    .expectStatus(201)
    .expectJson("name", "Ada");
});

test("custom check on response time and shape", async () => {
  const res = await api.get("/users").expectOk();
  res
    .expectTimeBelow(2000)
    .check("has at least one user", (r) => Array.isArray(r.get("data")) && r.get("data").length > 0);
});
