// Unit tests for src/curl.js: toCurl, RequestBuilder.prototype.toCurl,
// and enableLogging/disableLogging.

import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { toCurl, enableLogging } from "../../src/curl.js";
import { GoClient, RequestBuilder } from "../../src/client.js";

// Build a fresh RequestBuilder against a client with the given baseURL.
function makeRequest(method, path, baseURL = "https://api.example.com") {
  const client = new GoClient({ baseURL });
  return new RequestBuilder(client, method, path);
}

// Start an in-process http server on an ephemeral port for live tests.
function startServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseURL: `http://127.0.0.1:${port}` });
    });
  });
}

test("toCurl builds a basic GET command with method and quoted url", () => {
  const req = makeRequest("GET", "/users");
  const cmd = toCurl(req);
  assert.equal(cmd, "curl -X GET 'https://api.example.com/users'");
});

test("toCurl adds a leading slash to paths that are missing one", () => {
  const req = makeRequest("GET", "users");
  const cmd = toCurl(req);
  assert.equal(cmd, "curl -X GET 'https://api.example.com/users'");
});

test("toCurl keeps absolute http(s) paths and ignores baseURL", () => {
  const req = makeRequest("GET", "https://other.example.org/thing");
  const cmd = toCurl(req);
  assert.equal(cmd, "curl -X GET 'https://other.example.org/thing'");
});

test("toCurl with empty path and empty base yields a quoted empty url", () => {
  const client = new GoClient({ baseURL: "" });
  const req = new RequestBuilder(client, "GET", "");
  const cmd = toCurl(req);
  assert.equal(cmd, "curl -X GET ''");
});

test("toCurl defaults the method to GET when method is missing", () => {
  const req = makeRequest("GET", "/x");
  // Simulate an absent method.
  req.method = undefined;
  const cmd = toCurl(req);
  assert.equal(cmd, "curl -X GET 'https://api.example.com/x'");
});

test("toCurl appends query parameters", () => {
  const req = makeRequest("GET", "/search").query({ q: "hello", page: 2 });
  const cmd = toCurl(req);
  assert.equal(cmd, "curl -X GET 'https://api.example.com/search?q=hello&page=2'");
});

test("toCurl appends array query parameters as repeated keys", () => {
  const req = makeRequest("GET", "/items").query({ tag: ["a", "b"] });
  const cmd = toCurl(req);
  assert.equal(cmd, "curl -X GET 'https://api.example.com/items?tag=a&tag=b'");
});

test("toCurl joins query with & when the path already has a query string", () => {
  const req = makeRequest("GET", "/search?existing=1").query({ q: "x" });
  const cmd = toCurl(req);
  assert.equal(cmd, "curl -X GET 'https://api.example.com/search?existing=1&q=x'");
});

test("toCurl includes headers with -H in lowercase keys", () => {
  const req = makeRequest("POST", "/users")
    .header("X-Custom", "value")
    .bearer("tok123");
  const cmd = toCurl(req);
  assert.match(cmd, /-H 'x-custom: value'/);
  assert.match(cmd, /-H 'authorization: Bearer tok123'/);
});

test("toCurl includes a JSON body with --data and content-type header", () => {
  const req = makeRequest("POST", "/users").json({ name: "Ada" });
  const cmd = toCurl(req);
  assert.match(cmd, /-X POST/);
  assert.match(cmd, /-H 'content-type: application\/json'/);
  assert.match(cmd, /--data '\{"name":"Ada"\}'/);
});

test("toCurl omits --data when there is no body", () => {
  const req = makeRequest("GET", "/users");
  const cmd = toCurl(req);
  assert.ok(!cmd.includes("--data"));
});

test("toCurl includes an empty body when _body is an empty string", () => {
  const req = makeRequest("POST", "/x").text("");
  const cmd = toCurl(req);
  assert.match(cmd, /--data ''/);
});

test("toCurl escapes embedded single quotes in body and url", () => {
  const req = makeRequest("POST", "/o'reilly").text("it's a test");
  const cmd = toCurl(req);
  // Single quote becomes the shell sequence '\'' inside the quoted string.
  assert.match(cmd, /'https:\/\/api\.example\.com\/o'\\''reilly'/);
  assert.match(cmd, /--data 'it'\\''s a test'/);
});

test("toCurl works when client is missing (no baseURL)", () => {
  const req = new RequestBuilder(null, "GET", "/path");
  const cmd = toCurl(req);
  assert.equal(cmd, "curl -X GET '/path'");
});

test("RequestBuilder.prototype.toCurl produces the same output as toCurl", () => {
  const req = makeRequest("DELETE", "/users/1").header("x-a", "b");
  assert.equal(req.toCurl(), toCurl(req));
  assert.equal(typeof RequestBuilder.prototype.toCurl, "function");
});

test("enableLogging logs request and response lines and returns response", async () => {
  const { server, baseURL } = await startServer((reqIn, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });

  try {
    const client = new GoClient({ baseURL });
    const lines = [];
    const logger = { log: (msg) => lines.push(msg) };

    const disable = enableLogging(client, { logger });
    const response = await client.get("/ping");

    assert.equal(response.status, 200);
    assert.equal(lines.length, 2);
    assert.equal(lines[0], `-> GET ${baseURL}/ping`);
    assert.match(lines[1], new RegExp(`^<- 200 ${baseURL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/ping \\(\\d+ms\\)$`));

    disable();
  } finally {
    server.close();
  }
});

test("enableLogging applies a label prefix when provided", async () => {
  const { server, baseURL } = await startServer((reqIn, res) => {
    res.writeHead(204);
    res.end();
  });

  try {
    const client = new GoClient({ baseURL });
    const lines = [];
    const logger = { log: (msg) => lines.push(msg) };

    enableLogging(client, { logger, label: "API" });
    await client.get("/x");

    assert.ok(lines[0].startsWith("[API] -> GET "));
    assert.ok(lines[1].startsWith("[API] <- 204 "));
  } finally {
    server.close();
  }
});

test("disableLogging restores the original send", async () => {
  const { server, baseURL } = await startServer((reqIn, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });

  try {
    const client = new GoClient({ baseURL });
    const original = client.send;
    const lines = [];
    const logger = { log: (msg) => lines.push(msg) };

    const disable = enableLogging(client, { logger });
    assert.notEqual(client.send, original);

    await client.get("/a");
    const countAfterEnabled = lines.length;
    assert.equal(countAfterEnabled, 2);

    disable();

    await client.get("/b");
    // No further log lines should be produced once logging is disabled.
    assert.equal(lines.length, countAfterEnabled);
  } finally {
    server.close();
  }
});

test("enableLogging defaults to console when no logger is given", async () => {
  const { server, baseURL } = await startServer((reqIn, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });

  const originalConsoleLog = console.log;
  const captured = [];
  console.log = (msg) => captured.push(msg);

  try {
    const client = new GoClient({ baseURL });
    const disable = enableLogging(client);
    await client.get("/c");
    disable();

    assert.equal(captured.length, 2);
    assert.ok(captured[0].startsWith("-> GET "));
  } finally {
    console.log = originalConsoleLog;
    server.close();
  }
});

test("enableLogging logs the query string in the url", async () => {
  const { server, baseURL } = await startServer((reqIn, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });

  try {
    const client = new GoClient({ baseURL });
    const lines = [];
    const logger = { log: (msg) => lines.push(msg) };

    const disable = enableLogging(client, { logger });
    await client.get("/search").query({ q: "z" });
    disable();

    assert.equal(lines[0], `-> GET ${baseURL}/search?q=z`);
  } finally {
    server.close();
  }
});
