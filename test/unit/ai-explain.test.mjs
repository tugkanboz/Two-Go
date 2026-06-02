// Unit tests for AI failure explanation. The provider is stubbed, no network.
import { test } from "node:test";
import assert from "node:assert/strict";

import { explainFailure } from "../../src/ai/explain.js";
import { AssertionError } from "../../src/assertions.js";

test("explainFailure builds a prompt from the error and response, returns the reply", async () => {
  let seenPrompt = "";
  let seenSystem = "";
  const stub = {
    complete: async (prompt, opts) => {
      seenPrompt = prompt;
      seenSystem = opts.system;
      return "  The API returned 500 instead of 200, likely an unhandled error. Check the server logs.  ";
    },
  };

  const error = new AssertionError("GET /users -> expected status 200 but got 500", {
    expected: 200,
    actual: 500,
  });

  const out = await explainFailure(error, {
    provider: stub,
    response: {
      method: "GET",
      url: "https://api.example.com/users",
      status: 500,
      statusText: "Internal Server Error",
      time: 42,
      headers: { "content-type": "text/html" },
      text: "<html>boom</html>",
    },
  });

  // trims the reply
  assert.equal(out, "The API returned 500 instead of 200, likely an unhandled error. Check the server logs.");
  // system prompt frames it as triage
  assert.match(seenSystem, /triag/i);
  // prompt carries the assertion, expected/actual, status and body
  assert.match(seenPrompt, /expected status 200 but got 500/);
  assert.match(seenPrompt, /Expected: 200/);
  assert.match(seenPrompt, /Actual: 500/);
  assert.match(seenPrompt, /Status: 500 Internal Server Error/);
  assert.match(seenPrompt, /<html>boom<\/html>/);
});

test("explainFailure includes request context when provided", async () => {
  let seenPrompt = "";
  const stub = { complete: async (p) => { seenPrompt = p; return "ok"; } };

  await explainFailure(new Error("boom"), {
    provider: stub,
    request: { _headers: { authorization: "Bearer x" }, _body: '{"a":1}' },
  });

  assert.match(seenPrompt, /Sent headers:/);
  assert.match(seenPrompt, /Bearer x/);
  assert.match(seenPrompt, /Sent body:/);
});

test("explainFailure works with a plain error and no context", async () => {
  const stub = { complete: async () => "explanation" };
  const out = await explainFailure(new Error("something broke"), { provider: stub });
  assert.equal(out, "explanation");
});
