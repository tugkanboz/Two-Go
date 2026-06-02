// Generate a two-go test suite from an endpoint description or a sample
// response, using an LLM provider. The model is told to emit a runnable
// *.twogo.mjs file; we strip any markdown fences from the reply.

import { createProvider } from "./provider.js";

const SYSTEM = [
  "You are a senior API test engineer.",
  "You write tests with the two-go library (zero dependency, ESM).",
  "Output ONLY the contents of a single *.twogo.mjs file, no prose, no markdown fences.",
  "The file must:",
  '- import { go, suite } from "two-go";',
  "- create a client: const api = go(process.env.BASE_URL || <baseUrl>);",
  '- call suite(<name>, ({ test }) => { ... }) with one test() per scenario.',
  "Use chainable checks: .expectStatus(), .expectOk(), .expectJson(path, value), .expectHeader(name, matcher), .expectJsonSchema(schema).",
  "Cover the happy path and the obvious error cases (missing/invalid input, not found, unauthorized) when they make sense.",
].join("\n");

// Build a generation prompt from the provided context.
function buildPrompt(options) {
  const lines = [];
  lines.push("Generate a two-go test suite.");
  if (options.baseUrl) lines.push(`Base URL: ${options.baseUrl}`);
  if (options.method || options.endpoint) {
    lines.push(`Endpoint: ${(options.method || "GET").toUpperCase()} ${options.endpoint || "/"}`);
  }
  if (options.description) lines.push(`Description: ${options.description}`);
  if (options.sample !== undefined) {
    const sample =
      typeof options.sample === "string" ? options.sample : JSON.stringify(options.sample, null, 2);
    lines.push("Here is a real sample response to base assertions on:");
    lines.push(sample);
  }
  if (options.instructions) lines.push(`Extra instructions: ${options.instructions}`);
  return lines.join("\n");
}

// Remove a surrounding ```...``` markdown fence if the model added one.
function stripFences(text) {
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$/);
  return (fenced ? fenced[1] : trimmed).trim() + "\n";
}

// Generate suite source. Pass options.provider (anything with complete()) to
// reuse a provider or to stub it in tests; otherwise one is created from the
// remaining options.
export async function aiGenerateTests(options = {}) {
  const provider =
    options.provider && typeof options.provider.complete === "function"
      ? options.provider
      : createProvider(options);

  const reply = await provider.complete(buildPrompt(options), {
    system: SYSTEM,
    maxTokens: options.maxTokens || 2048,
  });
  return stripFences(reply);
}
