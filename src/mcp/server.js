// A tiny Model Context Protocol server for two-go, with no dependencies. It
// speaks JSON-RPC 2.0 and is transport agnostic: createServer().handle(message)
// takes one parsed message and returns the response object (or null for a
// notification). The bin wires it to stdio. Tools let an agent make real HTTP
// calls and use the importers and schema helpers.

import { go } from "../index.js";
import { fromOpenapi } from "../importers/openapi.js";
import { fromPostman } from "../importers/postman.js";
import { inferSchema } from "../infer-schema.js";
import { validate } from "../schema.js";

const PROTOCOL_VERSION = "2024-11-05";
const VERBS = new Set(["get", "put", "post", "patch", "delete", "head", "options"]);

const TOOLS = [
  {
    name: "http_request",
    description: "Send an HTTP request and return status, headers, timing and body.",
    inputSchema: {
      type: "object",
      properties: {
        method: { type: "string", description: "GET, POST, etc. Defaults to GET." },
        url: { type: "string", description: "Full URL, or a path when baseUrl is set." },
        baseUrl: { type: "string" },
        headers: { type: "object" },
        query: { type: "object" },
        bearer: { type: "string", description: "Bearer token for the authorization header." },
        json: { description: "Body to send as JSON." },
        body: { type: "string", description: "Raw text body (used when json is absent)." },
      },
      required: ["url"],
    },
  },
  {
    name: "gen_openapi",
    description: "Generate a two-go test suite source from an OpenAPI 3 document.",
    inputSchema: {
      type: "object",
      properties: { spec: { type: "object" }, baseUrl: { type: "string" } },
      required: ["spec"],
    },
  },
  {
    name: "gen_postman",
    description: "Generate a two-go test suite source from a Postman v2.1 collection.",
    inputSchema: {
      type: "object",
      properties: { collection: { type: "object" }, baseUrl: { type: "string" } },
      required: ["collection"],
    },
  },
  {
    name: "infer_schema",
    description: "Infer a JSON schema from an example value.",
    inputSchema: { type: "object", properties: { value: {} }, required: ["value"] },
  },
  {
    name: "validate_schema",
    description: "Validate a value against a JSON schema. Returns { valid, errors }.",
    inputSchema: {
      type: "object",
      properties: { value: {}, schema: { type: "object" } },
      required: ["value", "schema"],
    },
  },
];

function reply(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function errorReply(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

// Create a server. info: { name, version }.
export function createServer(info = {}) {
  const serverInfo = { name: info.name || "two-go", version: info.version || "0.0.0" };

  async function callTool(name, args = {}) {
    switch (name) {
      case "http_request": {
        const method = String(args.method || "GET").toLowerCase();
        const verb = VERBS.has(method) ? method : "get";
        const client = go({ baseURL: args.baseUrl || "" });
        let builder = client[verb](args.url || "/");
        if (args.query) builder = builder.query(args.query);
        if (args.headers) builder = builder.headers(args.headers);
        if (args.bearer) builder = builder.bearer(args.bearer);
        if (args.json !== undefined) builder = builder.json(args.json);
        else if (args.body !== undefined) {
          builder = builder.text(typeof args.body === "string" ? args.body : JSON.stringify(args.body));
        }
        const res = await builder;
        return JSON.stringify(
          {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
            time: res.time,
            url: res.url,
            body: res.body,
          },
          null,
          2
        );
      }
      case "gen_openapi":
        return fromOpenapi(args.spec || {}, { baseUrl: args.baseUrl });
      case "gen_postman":
        return fromPostman(args.collection || {}, { baseUrl: args.baseUrl });
      case "infer_schema":
        return JSON.stringify(inferSchema(args.value), null, 2);
      case "validate_schema":
        return JSON.stringify(validate(args.value, args.schema || {}), null, 2);
      default:
        throw new Error(`unknown tool: ${name}`);
    }
  }

  // Handle one JSON-RPC message. Returns the response object, or null when the
  // message is a notification (no id) and needs no reply.
  async function handle(message) {
    const id = message ? message.id : undefined;
    const method = message ? message.method : undefined;
    const isNotification = id === undefined || id === null;

    try {
      switch (method) {
        case "initialize":
          return reply(id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo,
          });
        case "notifications/initialized":
          return null;
        case "ping":
          return reply(id, {});
        case "tools/list":
          return reply(id, { tools: TOOLS });
        case "tools/call": {
          const params = message.params || {};
          const text = await callTool(params.name, params.arguments || {});
          return reply(id, { content: [{ type: "text", text: String(text) }] });
        }
        default:
          return isNotification ? null : errorReply(id, -32601, `method not found: ${method}`);
      }
    } catch (err) {
      const messageText = err && err.message ? err.message : String(err);
      if (isNotification) return null;
      // Tool failures are reported as a tool result with isError, per MCP.
      if (method === "tools/call") {
        return reply(id, { content: [{ type: "text", text: messageText }], isError: true });
      }
      return errorReply(id, -32603, messageText);
    }
  }

  return { handle, tools: TOOLS, serverInfo, protocolVersion: PROTOCOL_VERSION };
}
