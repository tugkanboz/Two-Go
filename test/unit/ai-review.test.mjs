// Unit tests for AI bug catching. The provider is stubbed, no network.
import { test } from "node:test";
import assert from "node:assert/strict";

import { aiReview, aiFuzz } from "../../src/ai/review.js";

test("aiReview parses a JSON array of findings and sends the body in the prompt", async () => {
  let seenPrompt = "";
  const stub = {
    complete: async (prompt) => {
      seenPrompt = prompt;
      return '[{"severity":"high","field":"token","message":"auth token leaked in body"}]';
    },
  };

  const findings = await aiReview(
    { method: "GET", url: "/me", status: 200, body: { id: 1, token: "secret" } },
    { provider: stub }
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "high");
  assert.equal(findings[0].field, "token");
  assert.match(seenPrompt, /"token": "secret"/);
  assert.match(seenPrompt, /Status: 200/);
});

test("aiReview tolerates markdown fences around the JSON", async () => {
  const stub = { complete: async () => "```json\n[{\"severity\":\"low\",\"field\":null,\"message\":\"x\"}]\n```" };
  const findings = await aiReview({ status: 200, body: {} }, { provider: stub });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].field, null);
});

test("aiReview returns an empty array when the model says nothing is wrong", async () => {
  const stub = { complete: async () => "[]" };
  assert.deepEqual(await aiReview({ status: 200, body: {} }, { provider: stub }), []);
});

test("aiReview returns an empty array on unparseable output instead of throwing", async () => {
  const stub = { complete: async () => "I could not find any issues, sorry." };
  assert.deepEqual(await aiReview({ status: 200 }, { provider: stub }), []);
});

test("aiFuzz returns an array of payloads and passes the schema in the prompt", async () => {
  let seenPrompt = "";
  const stub = {
    complete: async (prompt) => {
      seenPrompt = prompt;
      return '[{"name":""},{"name":null},{"name":"<script>"},{"age":-1}]';
    },
  };

  const payloads = await aiFuzz({
    provider: stub,
    endpoint: "/users",
    method: "POST",
    count: 4,
    schema: { type: "object", properties: { name: { type: "string" } } },
  });

  assert.equal(payloads.length, 4);
  assert.deepEqual(payloads[3], { age: -1 });
  assert.match(seenPrompt, /adversarial request payloads/);
  assert.match(seenPrompt, /POST \/users/);
  assert.match(seenPrompt, /"type": "string"/);
});
