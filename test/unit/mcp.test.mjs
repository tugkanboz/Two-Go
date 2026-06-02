// Unit tests for the MCP server. The handler is exercised directly with parsed
// JSON-RPC messages. http_request runs against a throwaway local server.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { createServer } from "../../src/mcp/server.js";

test("initialize returns the protocol version and server info", async () => {
  const s = createServer({ version: "1.2.3" });
  const res = await s.handle({ jsonrpc: "2.0", id: 1, method: "initialize" });
  assert.equal(res.id, 1);
  assert.equal(res.result.protocolVersion, "2024-11-05");
  assert.equal(res.result.serverInfo.name, "two-go");
  assert.equal(res.result.serverInfo.version, "1.2.3");
  assert.ok(res.result.capabilities.tools);
});

test("notifications/initialized produces no response", async () => {
  const s = createServer();
  assert.equal(await s.handle({ jsonrpc: "2.0", method: "notifications/initialized" }), null);
});

test("tools/list returns the tool names", async () => {
  const s = createServer();
  const res = await s.handle({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  const names = res.result.tools.map((t) => t.name);
  assert.deepEqual(
    names.sort(),
    ["gen_openapi", "gen_postman", "http_request", "infer_schema", "validate_schema"]
  );
});

test("tools/call infer_schema returns a schema", async () => {
  const s = createServer();
  const res = await s.handle({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "infer_schema", arguments: { value: { id: 1, name: "a" } } },
  });
  const schema = JSON.parse(res.result.content[0].text);
  assert.equal(schema.type, "object");
  assert.deepEqual(schema.required.sort(), ["id", "name"]);
});

test("tools/call gen_openapi returns suite source", async () => {
  const s = createServer();
  const res = await s.handle({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "gen_openapi",
      arguments: { spec: { info: { title: "X" }, paths: { "/x": { get: { responses: { 200: {} } } } } } },
    },
  });
  assert.match(res.result.content[0].text, /suite\("X"/);
});

test("tools/call on an unknown tool is reported as an error result", async () => {
  const s = createServer();
  const res = await s.handle({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: { name: "nope", arguments: {} },
  });
  assert.equal(res.result.isError, true);
  assert.match(res.result.content[0].text, /unknown tool/);
});

test("an unknown method returns a JSON-RPC error", async () => {
  const s = createServer();
  const res = await s.handle({ jsonrpc: "2.0", id: 6, method: "does/not/exist" });
  assert.equal(res.error.code, -32601);
});

test("http_request actually performs a request", async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(201, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, method: req.method }));
  });
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;

  const s = createServer();
  const res = await s.handle({
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: { name: "http_request", arguments: { method: "POST", url: `${base}/things`, json: { a: 1 } } },
  });
  server.close();

  const payload = JSON.parse(res.result.content[0].text);
  assert.equal(payload.status, 201);
  assert.equal(payload.body.ok, true);
  assert.equal(payload.body.method, "POST");
});
