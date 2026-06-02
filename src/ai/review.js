// Use an LLM to hunt for bugs. aiReview looks at a response and reports likely
// problems. aiFuzz generates adversarial request payloads you can send with the
// normal client. Both are advisory: they hand you findings or inputs, they do
// not change pass or fail on their own.

import { createProvider } from "./provider.js";

const REVIEW_SYSTEM = [
  "You are a senior API reviewer hunting for bugs in an HTTP response.",
  "Look for wrong or inconsistent types, missing or null fields that look required,",
  "suspicious values (negative amounts, future timestamps on created dates, ids of 0),",
  "leaked secrets, tokens, passwords or PII, mismatches between the status and the body,",
  "and pagination or count inconsistencies.",
  "Return ONLY a JSON array of findings. Each finding is",
  '{ "severity": "low" | "medium" | "high", "field": string | null, "message": string }.',
  "If nothing looks wrong, return [].",
].join("\n");

const FUZZ_SYSTEM = [
  "You generate adversarial request payloads to probe an API for bugs.",
  "Cover boundary values, wrong types, missing required fields, oversized input,",
  "unicode and injection-like strings, and malformed structures.",
  "Return ONLY a JSON array of payloads. Each item is the request body to send.",
].join("\n");

function truncate(value, max = 4000) {
  const s = value == null ? "" : String(value);
  return s.length > max ? s.slice(0, max) + "... (truncated)" : s;
}

// Pull a JSON array out of a model reply, tolerating markdown fences and prose.
function extractJsonArray(text) {
  const raw = String(text).trim();
  const fence = raw.match(/```[a-zA-Z]*\n([\s\S]*?)\n```/);
  const body = fence ? fence[1] : raw;
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    const parsed = JSON.parse(body.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resolveProvider(options) {
  return options.provider && typeof options.provider.complete === "function"
    ? options.provider
    : createProvider(options);
}

function buildReviewPrompt(response, options) {
  const lines = ["Review this HTTP response for bugs."];
  if (response) {
    const line = `${response.method || ""} ${response.url || ""}`.trim();
    if (line) lines.push(line);
    if (response.status != null) lines.push("Status: " + response.status);
    if (response.headers) lines.push("Headers: " + truncate(JSON.stringify(response.headers), 800));
    const body = response.text != null ? response.text : response.body !== undefined ? JSON.stringify(response.body, null, 2) : "";
    if (body) lines.push("Body:\n" + truncate(body));
  }
  if (options.context) lines.push("Context: " + options.context);
  return lines.join("\n");
}

// Review a response and return a list of findings (possibly empty).
export async function aiReview(response, options = {}) {
  const provider = resolveProvider(options);
  const reply = await provider.complete(buildReviewPrompt(response, options), {
    system: REVIEW_SYSTEM,
    maxTokens: options.maxTokens || 1024,
  });
  return extractJsonArray(reply);
}

function buildFuzzPrompt(options) {
  const lines = [];
  lines.push(`Generate ${options.count || 8} adversarial request payloads.`);
  if (options.method || options.endpoint) {
    lines.push(`Target: ${(options.method || "POST").toUpperCase()} ${options.endpoint || "/"}`);
  }
  if (options.schema !== undefined) {
    lines.push("Schema of the expected body:");
    lines.push(typeof options.schema === "string" ? options.schema : JSON.stringify(options.schema, null, 2));
  }
  if (options.sample !== undefined) {
    lines.push("A valid sample body to mutate:");
    lines.push(typeof options.sample === "string" ? options.sample : JSON.stringify(options.sample, null, 2));
  }
  if (options.instructions) lines.push("Extra instructions: " + options.instructions);
  return lines.join("\n");
}

// Generate an array of adversarial payloads to send with the normal client.
export async function aiFuzz(options = {}) {
  const provider = resolveProvider(options);
  const reply = await provider.complete(buildFuzzPrompt(options), {
    system: FUZZ_SYSTEM,
    maxTokens: options.maxTokens || 1024,
  });
  return extractJsonArray(reply);
}
