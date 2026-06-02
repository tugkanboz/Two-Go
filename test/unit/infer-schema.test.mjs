// Unit tests for src/infer-schema.js.
// Verifies schema inference for primitives, objects, arrays, and the
// GoResponse.toSchema plugin extension. Also confirms that any inferred
// schema is accepted by validate() against the example it was derived from.

import { test } from "node:test";
import assert from "node:assert/strict";

import { inferSchema } from "../../src/infer-schema.js";
import { GoResponse } from "../../src/response.js";
import { validate } from "../../src/schema.js";

test("infers null as the null type", () => {
  assert.deepEqual(inferSchema(null), { type: "null" });
});

test("infers integer vs number for whole and fractional values", () => {
  assert.deepEqual(inferSchema(42), { type: "integer" });
  assert.deepEqual(inferSchema(-7), { type: "integer" });
  assert.deepEqual(inferSchema(0), { type: "integer" });
  assert.deepEqual(inferSchema(3.14), { type: "number" });
});

test("infers primitive string and boolean types", () => {
  assert.deepEqual(inferSchema("hello"), { type: "string" });
  assert.deepEqual(inferSchema(""), { type: "string" });
  assert.deepEqual(inferSchema(true), { type: "boolean" });
  assert.deepEqual(inferSchema(false), { type: "boolean" });
});

test("falls back to string for bigint, symbol, and function", () => {
  assert.deepEqual(inferSchema(10n), { type: "string" });
  assert.deepEqual(inferSchema(Symbol("x")), { type: "string" });
  assert.deepEqual(inferSchema(() => {}), { type: "string" });
});

test("infers an object schema with properties and required keys", () => {
  const schema = inferSchema({ id: 1, name: "Ada", active: true });
  assert.deepEqual(schema, {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      active: { type: "boolean" },
    },
    required: ["id", "name", "active"],
  });
});

test("infers an empty object with empty properties and required", () => {
  assert.deepEqual(inferSchema({}), {
    type: "object",
    properties: {},
    required: [],
  });
});

test("infers nested object schemas recursively", () => {
  const schema = inferSchema({ user: { id: 1, tags: ["a", "b"] } });
  assert.deepEqual(schema, {
    type: "object",
    properties: {
      user: {
        type: "object",
        properties: {
          id: { type: "integer" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["id", "tags"],
      },
    },
    required: ["user"],
  });
});

test("infers an empty array as an array type with no items", () => {
  assert.deepEqual(inferSchema([]), { type: "array" });
});

test("infers array items from homogeneous elements", () => {
  assert.deepEqual(inferSchema([1, 2, 3]), {
    type: "array",
    items: { type: "integer" },
  });
  assert.deepEqual(inferSchema(["a", "b"]), {
    type: "array",
    items: { type: "string" },
  });
});

test("infers array of objects via merged item schema", () => {
  const schema = inferSchema([
    { id: 1, name: "a" },
    { id: 2, name: "b" },
  ]);
  assert.deepEqual(schema, {
    type: "array",
    items: {
      type: "object",
      properties: { id: { type: "integer" }, name: { type: "string" } },
      required: ["id", "name"],
    },
  });
});

test("falls back to the first element schema when items disagree", () => {
  // Mixed element types: implementation uses the first element's schema.
  assert.deepEqual(inferSchema([1, "two", true]), {
    type: "array",
    items: { type: "integer" },
  });
  assert.deepEqual(inferSchema(["a", 1]), {
    type: "array",
    items: { type: "string" },
  });
});

test("preserves object key order in the required array", () => {
  const schema = inferSchema({ b: 1, a: 2, c: 3 });
  assert.deepEqual(schema.required, ["b", "a", "c"]);
});

test("infers null property type for null-valued keys", () => {
  const schema = inferSchema({ value: null });
  assert.deepEqual(schema.properties.value, { type: "null" });
});

test("inferred schema validates against its own example", () => {
  const example = {
    id: 7,
    name: "Grace",
    score: 9.5,
    active: false,
    roles: ["admin", "user"],
    meta: { created: "2020-01-01", count: 3 },
  };
  const schema = inferSchema(example);
  const result = validate(example, schema);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("inferred array schema validates against its example", () => {
  const example = [
    { id: 1, label: "x" },
    { id: 2, label: "y" },
  ];
  const schema = inferSchema(example);
  const result = validate(example, schema);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("inferred schema rejects a value of the wrong type", () => {
  const schema = inferSchema({ id: 1 });
  const result = validate({ id: "not-an-integer" }, schema);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test("inferred schema rejects a missing required key", () => {
  const schema = inferSchema({ id: 1, name: "a" });
  const result = validate({ id: 1 }, schema);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("name")));
});

test("GoResponse.toSchema infers a schema from the full body", () => {
  const res = new GoResponse({
    status: 200,
    statusText: "OK",
    headers: {},
    body: { id: 1, name: "Ada" },
    text: '{"id":1,"name":"Ada"}',
    time: 1,
    url: "http://example.test/users/1",
    method: "GET",
  });
  assert.deepEqual(res.toSchema(), {
    type: "object",
    properties: { id: { type: "integer" }, name: { type: "string" } },
    required: ["id", "name"],
  });
});

test("GoResponse.toSchema narrows to a dot/bracket path", () => {
  const res = new GoResponse({
    status: 200,
    statusText: "OK",
    headers: {},
    body: { data: { items: [{ sku: "abc" }] } },
    text: "",
    time: 1,
    url: "http://example.test/data",
    method: "GET",
  });
  assert.deepEqual(res.toSchema("data.items[0]"), {
    type: "object",
    properties: { sku: { type: "string" } },
    required: ["sku"],
  });
  assert.deepEqual(res.toSchema("data.items"), {
    type: "array",
    items: {
      type: "object",
      properties: { sku: { type: "string" } },
      required: ["sku"],
    },
  });
});

test("GoResponse.toSchema treats an explicit null path as the full body", () => {
  const res = new GoResponse({
    status: 200,
    statusText: "OK",
    headers: {},
    body: { ok: true },
    text: "",
    time: 1,
    url: "http://example.test/",
    method: "GET",
  });
  assert.deepEqual(res.toSchema(null), {
    type: "object",
    properties: { ok: { type: "boolean" } },
    required: ["ok"],
  });
});

test("a body inferred via toSchema validates against itself", () => {
  const body = { id: 1, tags: ["a", "b"], nested: { flag: true } };
  const res = new GoResponse({
    status: 200,
    statusText: "OK",
    headers: {},
    body,
    text: "",
    time: 1,
    url: "http://example.test/",
    method: "GET",
  });
  const result = validate(body, res.toSchema());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});
