#!/usr/bin/env node
// two-go MCP server over stdio. Reads newline-delimited JSON-RPC messages on
// stdin and writes responses on stdout, so an MCP client (Claude and others)
// can use two-go's tools. Zero dependencies.

import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import { createServer } from "../src/mcp/server.js";

let version = "0.0.0";
try {
  version = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
} catch {
  // keep the default if package.json cannot be read
}

const server = createServer({ version });
const rl = createInterface({ input: process.stdin });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let message;
  try {
    message = JSON.parse(trimmed);
  } catch {
    return; // ignore unparseable lines
  }
  const response = await server.handle(message);
  if (response) process.stdout.write(JSON.stringify(response) + "\n");
});
