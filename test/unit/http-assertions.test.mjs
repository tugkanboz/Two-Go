// Unit tests for src/http-assertions.js.
// Importing the module installs extra assertion methods onto
// GoResponse.prototype, so we import it for its side effect and then build
// GoResponse instances to exercise each method.

import { test } from "node:test";
import assert from "node:assert/strict";

import "../../src/http-assertions.js";
import { GoResponse } from "../../src/response.js";
import { AssertionError } from "../../src/assertions.js";

// Build a GoResponse with sensible defaults that individual tests override.
function makeResponse(overrides = {}) {
  return new GoResponse({
    status: 200,
    statusText: "OK",
    headers: {},
    body: undefined,
    text: "",
    time: 0,
    url: "/x",
    method: "GET",
    ...overrides,
  });
}

// Assert that calling `fn` throws an AssertionError whose message starts with
// the standard `METHOD URL -> ` prefix.
function assertFails(fn, method, url) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof AssertionError, "should be AssertionError");
    assert.ok(
      err.message.startsWith(`${method} ${url} -> `),
      `message should start with prefix, got: ${err.message}`
    );
    return true;
  });
}

test("status range helpers pass and fail correctly", () => {
  assert.equal(makeResponse({ status: 404 }).expectClientError().status, 404);
  assert.equal(makeResponse({ status: 503 }).expectServerError().status, 503);
  assert.equal(makeResponse({ status: 301 }).expectRedirect().status, 301);

  assertFails(() => makeResponse({ status: 200 }).expectClientError(), "GET", "/x");
  assertFails(() => makeResponse({ status: 404 }).expectServerError(), "GET", "/x");
  assertFails(() => makeResponse({ status: 200 }).expectRedirect(), "GET", "/x");
});

test("exact status helpers pass and fail correctly", () => {
  assert.ok(makeResponse({ status: 201 }).expectCreated());
  assert.ok(makeResponse({ status: 202 }).expectAccepted());
  assert.ok(makeResponse({ status: 204 }).expectNoContent());
  assert.ok(makeResponse({ status: 400 }).expectBadRequest());
  assert.ok(makeResponse({ status: 401 }).expectUnauthorized());
  assert.ok(makeResponse({ status: 403 }).expectForbidden());
  assert.ok(makeResponse({ status: 404 }).expectNotFound());

  assertFails(() => makeResponse({ status: 200 }).expectCreated(), "GET", "/x");
  assertFails(() => makeResponse({ status: 200 }).expectNotFound(), "GET", "/x");
});

test("expectContentType matches substring and fails on mismatch", () => {
  const res = makeResponse({
    headers: { "content-type": "application/json; charset=utf-8" },
  });
  assert.ok(res.expectContentType("application/json"));
  assert.ok(res.expectContentType("json"));

  assertFails(() => res.expectContentType("text/html"), "GET", "/x");
  // Missing header.
  assertFails(() => makeResponse().expectContentType("json"), "GET", "/x");
});

test("expectHeaderContains is case-insensitive on header name", () => {
  const res = makeResponse({ headers: { "x-token": "abc-123" } });
  assert.ok(res.expectHeaderContains("X-Token", "abc"));
  assert.ok(res.expectHeaderContains("x-token", "123"));

  // Missing header.
  assertFails(() => res.expectHeaderContains("x-missing", "y"), "GET", "/x");
  // Present but no substring.
  assertFails(() => res.expectHeaderContains("x-token", "zzz"), "GET", "/x");
});

test("expectHeaderAbsent passes when missing and fails when present", () => {
  const res = makeResponse({ headers: { "x-present": "1" } });
  assert.ok(res.expectHeaderAbsent("x-gone"));
  assert.ok(res.expectHeaderAbsent("X-GONE"));

  assertFails(() => res.expectHeaderAbsent("X-Present"), "GET", "/x");
});

test("expectJsonLength checks array and string length", () => {
  const res = makeResponse({ body: { items: [1, 2, 3], name: "abcd" } });
  assert.ok(res.expectJsonLength("items", 3));
  assert.ok(res.expectJsonLength("name", 4));

  // Wrong length.
  assertFails(() => res.expectJsonLength("items", 2), "GET", "/x");
  // Not array or string.
  assertFails(
    () => makeResponse({ body: { n: 5 } }).expectJsonLength("n", 1),
    "GET",
    "/x"
  );
});

test("expectJsonContains matches array items and object subsets", () => {
  const res = makeResponse({
    body: {
      tags: ["a", "b", "c"],
      users: [{ id: 1, name: "x" }, { id: 2, name: "y" }],
      meta: { page: 1, size: 10 },
    },
  });

  // Array of primitives.
  assert.ok(res.expectJsonContains("tags", "b"));
  // Array of objects, partial match.
  assert.ok(res.expectJsonContains("users", { id: 2 }));
  // Object partial match.
  assert.ok(res.expectJsonContains("meta", { page: 1 }));

  // Array missing the value.
  assertFails(() => res.expectJsonContains("tags", "z"), "GET", "/x");
  // Object missing the key match.
  assertFails(() => res.expectJsonContains("meta", { page: 99 }), "GET", "/x");
  // Target neither array nor matchable object/value.
  assertFails(
    () => makeResponse({ body: { n: 5 } }).expectJsonContains("n", { a: 1 }),
    "GET",
    "/x"
  );
});

test("expectArrayLength requires an array of the right length", () => {
  const res = makeResponse({ body: { list: [1, 2] } });
  assert.ok(res.expectArrayLength("list", 2));

  // Not an array.
  assertFails(
    () => makeResponse({ body: { list: "ab" } }).expectArrayLength("list", 2),
    "GET",
    "/x"
  );
  // Wrong length.
  assertFails(() => res.expectArrayLength("list", 5), "GET", "/x");
});

test("expectSorted handles asc, desc, keyed, and out-of-order", () => {
  const asc = makeResponse({ body: { nums: [1, 2, 2, 3] } });
  assert.ok(asc.expectSorted("nums"));
  assert.ok(asc.expectSorted("nums", { order: "asc" }));

  const desc = makeResponse({ body: { nums: [9, 5, 5, 1] } });
  assert.ok(desc.expectSorted("nums", { order: "desc" }));

  const keyed = makeResponse({
    body: { rows: [{ age: 10 }, { age: 20 }, { age: 30 }] },
  });
  assert.ok(keyed.expectSorted("rows", { key: "age" }));

  // Out of order ascending.
  assertFails(
    () => makeResponse({ body: { nums: [1, 3, 2] } }).expectSorted("nums"),
    "GET",
    "/x"
  );
  // Not an array.
  assertFails(
    () => makeResponse({ body: { nums: 5 } }).expectSorted("nums"),
    "GET",
    "/x"
  );
});

test("expectCookie finds cookie by name and matches its value", () => {
  const res = makeResponse({
    headers: { "set-cookie": ["session=abc123; Path=/; HttpOnly", "theme=dark"] },
  });
  // Presence only.
  assert.ok(res.expectCookie("session"));
  assert.ok(res.expectCookie("theme"));
  // String value match.
  assert.ok(res.expectCookie("session", "abc123"));
  // RegExp value match.
  assert.ok(res.expectCookie("session", /^abc/));

  // Single-string set-cookie header is handled too.
  const single = makeResponse({ headers: { "set-cookie": "token=xyz; Secure" } });
  assert.ok(single.expectCookie("token", "xyz"));

  // Missing cookie.
  assertFails(() => res.expectCookie("nope"), "GET", "/x");
  // Wrong value.
  assertFails(() => res.expectCookie("session", "wrong"), "GET", "/x");
});

test("expectBodyContains checks the raw text body", () => {
  const res = makeResponse({ text: "hello world" });
  assert.ok(res.expectBodyContains("world"));

  assertFails(() => res.expectBodyContains("absent"), "GET", "/x");
  // Null text is treated as empty string and never contains a substring.
  assertFails(
    () => makeResponse({ text: null }).expectBodyContains("x"),
    "GET",
    "/x"
  );
});

test("expectEmpty and expectNotEmpty agree with isEmpty semantics", () => {
  assert.ok(makeResponse({ body: {} }).expectEmpty());
  assert.ok(makeResponse({ body: [] }).expectEmpty());
  assert.ok(makeResponse({ body: "" }).expectEmpty());
  assert.ok(makeResponse({ body: null }).expectEmpty());

  assert.ok(makeResponse({ body: { a: 1 } }).expectNotEmpty());
  assert.ok(makeResponse({ body: [1] }).expectNotEmpty());

  assertFails(() => makeResponse({ body: { a: 1 } }).expectEmpty(), "GET", "/x");
  assertFails(() => makeResponse({ body: {} }).expectNotEmpty(), "GET", "/x");
});

test("expectValue returns an expect() wrapper for chaining matchers", () => {
  const res = makeResponse({ body: { user: { name: "neo", roles: ["a", "b"] } } });

  // The wrapper exposes Jest-style matchers and returns truthy/throws.
  assert.ok(res.expectValue("user.name").toBe("neo"));
  assert.ok(res.expectValue("user.roles").toContain("a"));

  // A failing matcher throws an AssertionError.
  assert.throws(
    () => res.expectValue("user.name").toBe("trinity"),
    AssertionError
  );
});

test("expectJsonSchema passes when validation yields no errors", () => {
  // validate(schema, body) is invoked internally; when the effective schema
  // (the body) is not a plain object, validation short-circuits to valid.
  const res = makeResponse({ body: "plain-text-body" });
  assert.ok(res.expectJsonSchema({ type: "string" }));
});

test("expectJsonSchema fails and lists errors when validation fails", () => {
  // Here the body acts as the effective schema and the passed argument as the
  // value, so a non-matching pair produces validation errors.
  const res = makeResponse({ body: { type: "number" } });
  assertFails(() => res.expectJsonSchema("not-a-number"), "GET", "/x");
});

test("methods are installed as non-enumerable on the prototype and chain", () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    GoResponse.prototype,
    "expectCreated"
  );
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.configurable, true);

  // Returning `this` enables chaining across installed methods.
  const res = makeResponse({
    status: 201,
    headers: { "content-type": "application/json" },
    body: { items: [1] },
  });
  assert.equal(
    res.expectCreated().expectContentType("json").expectArrayLength("items", 1),
    res
  );
});

test("error info carries expected and actual for inspection", () => {
  try {
    makeResponse({ status: 200 }).expectCreated();
    assert.fail("should have thrown");
  } catch (err) {
    assert.ok(err instanceof AssertionError);
    assert.equal(err.expected, 201);
    assert.equal(err.actual, 200);
  }
});
