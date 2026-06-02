// Explain a failed assertion with an LLM. This is advisory only: it runs after
// a test already failed and never changes pass or fail. It takes the error plus
// whatever request and response context you have and asks for a short, specific
// likely cause and a concrete fix.

import { createProvider } from "./provider.js";

const SYSTEM = [
  "You are a senior API engineer triaging a failed test.",
  "Given the failed assertion and the request and response, explain the most",
  "likely cause in two to four sentences, then suggest one concrete fix.",
  "Be specific. Do not invent details that are not present in the input.",
].join("\n");

function truncate(value, max = 2000) {
  const s = value == null ? "" : String(value);
  return s.length > max ? s.slice(0, max) + "... (truncated)" : s;
}

function buildPrompt(error, options) {
  const lines = [];
  lines.push("Failed assertion:");
  lines.push(error && error.message ? error.message : String(error));
  if (error && error.expected !== undefined) {
    lines.push("Expected: " + truncate(JSON.stringify(error.expected), 500));
  }
  if (error && error.actual !== undefined) {
    lines.push("Actual: " + truncate(JSON.stringify(error.actual), 500));
  }

  const res = options.response;
  if (res) {
    lines.push("");
    lines.push("Response:");
    const line = `${res.method || ""} ${res.url || ""}`.trim();
    if (line) lines.push(line);
    if (res.status != null) {
      lines.push("Status: " + res.status + (res.statusText ? " " + res.statusText : ""));
    }
    if (res.time != null) lines.push("Time: " + res.time + "ms");
    if (res.headers) lines.push("Headers: " + truncate(JSON.stringify(res.headers), 800));
    const body = res.text != null ? res.text : res.body !== undefined ? JSON.stringify(res.body) : "";
    if (body) lines.push("Body: " + truncate(body));
  }

  const req = options.request;
  if (req) {
    lines.push("");
    lines.push("Request:");
    const headers = req._headers || req.headers;
    if (headers) lines.push("Sent headers: " + truncate(JSON.stringify(headers), 500));
    const reqBody = req._body != null ? req._body : req.body !== undefined ? JSON.stringify(req.body) : "";
    if (reqBody) lines.push("Sent body: " + truncate(reqBody, 800));
  }

  return lines.join("\n");
}

// Ask an LLM why a test failed. Pass options.provider (anything with complete())
// to reuse a provider or to stub it in tests; otherwise one is created.
export async function explainFailure(error, options = {}) {
  const provider =
    options.provider && typeof options.provider.complete === "function"
      ? options.provider
      : createProvider(options);

  const reply = await provider.complete(buildPrompt(error, options), {
    system: SYSTEM,
    maxTokens: options.maxTokens || 512,
  });
  return reply.trim();
}
