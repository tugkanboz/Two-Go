// Unit tests for the AI layer. No network: fetch and the provider are stubbed.
import { test } from "node:test";
import assert from "node:assert/strict";

import { createProvider } from "../../src/ai/provider.js";
import { aiGenerateTests } from "../../src/ai/generate.js";

// A fake fetch that records the call and returns a canned JSON response.
function fakeFetch(reply, record) {
  return async (url, init) => {
    if (record) {
      record.url = url;
      record.init = init;
      record.body = init && init.body ? JSON.parse(init.body) : undefined;
    }
    return {
      ok: true,
      status: 200,
      async json() {
        return reply;
      },
    };
  };
}

test("createProvider builds an OpenAI chat request and parses the reply", async () => {
  const record = {};
  const provider = createProvider({
    apiKey: "k",
    fetch: fakeFetch({ choices: [{ message: { content: "hello" } }] }, record),
  });
  const out = await provider.complete("hi", { system: "be terse" });

  assert.equal(out, "hello");
  assert.match(record.url, /\/chat\/completions$/);
  assert.equal(record.init.headers.authorization, "Bearer k");
  assert.equal(record.body.model, "gpt-5.3");
  assert.equal(record.body.messages[0].role, "system");
  assert.equal(record.body.messages[1].content, "hi");
});

test("createProvider supports the Anthropic messages API", async () => {
  const record = {};
  const provider = createProvider({
    provider: "anthropic",
    apiKey: "k",
    fetch: fakeFetch({ content: [{ text: "claude reply" }] }, record),
  });
  const out = await provider.complete("hi");

  assert.equal(out, "claude reply");
  assert.match(record.url, /\/messages$/);
  assert.equal(record.init.headers["x-api-key"], "k");
  assert.equal(record.body.model, "claude-opus-4-8");
});

test("createProvider throws a clear error when the cloud key is missing", () => {
  assert.throws(
    () => createProvider({ provider: "openai", apiKey: "", fetch: async () => ({}) }),
    /missing API key/
  );
});

test("createProvider allows a custom baseURL without a key", () => {
  const provider = createProvider({ baseURL: "http://localhost:11434/v1", fetch: async () => ({}) });
  assert.equal(provider.baseURL, "http://localhost:11434/v1");
});

test("createProvider surfaces a non-ok response as an error", async () => {
  const provider = createProvider({
    apiKey: "k",
    fetch: async () => ({ ok: false, status: 401, async json() { return { error: "bad key" }; } }),
  });
  await assert.rejects(() => provider.complete("hi"), /401/);
});

test("aiGenerateTests uses an injected provider and strips markdown fences", async () => {
  const stub = {
    complete: async (prompt, opts) => {
      assert.match(opts.system, /two-go/);
      assert.match(prompt, /\/users/);
      return "```js\nimport { go, suite } from \"two-go\";\n// generated\n```";
    },
  };
  const code = await aiGenerateTests({
    provider: stub,
    endpoint: "/users",
    method: "GET",
    baseUrl: "https://api.example.com",
    sample: { data: [{ id: 1 }] },
  });

  assert.match(code, /^import \{ go, suite \} from "two-go";/);
  assert.doesNotMatch(code, /```/);
  assert.match(code, /\/\/ generated/);
});
