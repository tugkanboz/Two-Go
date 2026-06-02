// Unit tests for the OpenAPI and Postman importers.
import { test } from "node:test";
import assert from "node:assert/strict";

import { fromPostman } from "../../src/importers/postman.js";
import { fromOpenapi } from "../../src/importers/openapi.js";

test("fromPostman generates a suite with one test per request", () => {
  const collection = {
    info: { name: "Users API" },
    item: [
      {
        name: "List users",
        request: { method: "GET", url: { raw: "{{baseUrl}}/users", path: ["users"] } },
      },
      {
        name: "Create user",
        request: {
          method: "POST",
          url: { raw: "{{baseUrl}}/users", path: ["users"] },
          header: [{ key: "x-api-key", value: "secret" }],
          body: { mode: "raw", raw: '{"name":"Ada"}' },
        },
      },
    ],
  };

  const code = fromPostman(collection);
  assert.match(code, /import \{ go, suite \} from "two-go";/);
  assert.match(code, /suite\("Users API"/);
  assert.match(code, /api\.get\("\/users"\)/);
  assert.match(code, /api\.post\("\/users"\)/);
  assert.match(code, /\.headers\(\{"x-api-key":"secret"\}\)/);
  assert.match(code, /\.json\(\{"name":"Ada"\}\)/);
});

test("fromPostman flattens nested folders", () => {
  const collection = {
    info: { name: "Nested" },
    item: [
      { name: "Folder", item: [{ name: "Ping", request: { method: "GET", url: "https://x.test/ping" } }] },
    ],
  };
  const code = fromPostman(collection);
  assert.match(code, /api\.get\("\/ping"\)/);
});

test("fromPostman maps urlencoded bodies to .form", () => {
  const collection = {
    info: { name: "Form" },
    item: [
      {
        name: "Login",
        request: {
          method: "POST",
          url: { raw: "{{baseUrl}}/login", path: ["login"] },
          body: { mode: "urlencoded", urlencoded: [{ key: "user", value: "ada" }] },
        },
      },
    ],
  };
  const code = fromPostman(collection);
  assert.match(code, /\.form\(\{"user":"ada"\}\)/);
});

test("fromOpenapi generates a test per operation with documented status", () => {
  const spec = {
    info: { title: "Orders API" },
    servers: [{ url: "https://api.example.com" }],
    paths: {
      "/orders": {
        get: { operationId: "listOrders", responses: { 200: {} } },
        post: {
          operationId: "createOrder",
          requestBody: { content: { "application/json": {} } },
          responses: { 201: {} },
        },
      },
      "/orders/{id}": {
        get: { operationId: "getOrder", responses: { 200: {}, 404: {} } },
      },
    },
  };

  const code = fromOpenapi(spec);
  assert.match(code, /go\(process\.env\.BASE_URL \|\| "https:\/\/api\.example\.com"\)/);
  assert.match(code, /suite\("Orders API"/);
  assert.match(code, /api\.get\("\/orders"\)\n\s*\.expectStatus\(200\)/);
  assert.match(code, /api\.post\("\/orders"\)\n\s*\.json\(\{\}\)[^\n]*\n\s*\.expectStatus\(201\)/);
  // path param replaced with sample "1"
  assert.match(code, /api\.get\("\/orders\/1"\)/);
});

test("fromOpenapi defaults to status 200 when no 2xx is documented", () => {
  const spec = { info: { title: "X" }, paths: { "/x": { get: { responses: { 500: {} } } } } };
  const code = fromOpenapi(spec);
  assert.match(code, /\.expectStatus\(200\)/);
});
