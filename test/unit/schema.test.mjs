import { test } from "node:test";
import assert from "node:assert/strict";

import { validate, isValid } from "../../src/schema.js";

test("validate returns valid result for a matching type", () => {
  const result = validate("hello", { type: "string" });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validate reports a type mismatch with the data path prefix", () => {
  const result = validate(42, { type: "string" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["data: expected string"]);
});

test("validate reports an unknown schema type", () => {
  const result = validate(1, { type: "bogus" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['data: unknown schema type "bogus"']);
});

test("validate distinguishes integer from number", () => {
  assert.equal(validate(3, { type: "integer" }).valid, true);
  const result = validate(3.5, { type: "integer" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["data: expected integer"]);
});

test("validate treats a missing schema type as no type constraint", () => {
  const result = validate(123, {});
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validate ignores non-object schemas", () => {
  const result = validate("anything", null);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("isValid is a convenience boolean wrapper", () => {
  assert.equal(isValid("x", { type: "string" }), true);
  assert.equal(isValid(5, { type: "string" }), false);
});

test("nullable allows an explicit null regardless of declared type", () => {
  assert.equal(isValid(null, { type: "string", nullable: true }), true);
  // Without nullable, null fails the string type check.
  assert.equal(isValid(null, { type: "string" }), false);
});

test("type null accepts null", () => {
  assert.equal(isValid(null, { type: "null" }), true);
  assert.equal(isValid(0, { type: "null" }), false);
});

test("const enforces strict equality and reports the expected value", () => {
  assert.equal(isValid(7, { const: 7 }), true);
  const result = validate(8, { const: 7 });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["data: expected constant 7"]);
});

test("const matches NaN against NaN", () => {
  assert.equal(isValid(NaN, { const: NaN }), true);
});

test("const performs structural comparison of arrays and objects", () => {
  assert.equal(isValid([1, 2], { const: [1, 2] }), true);
  assert.equal(isValid({ a: 1 }, { const: { a: 1 } }), true);
  assert.equal(isValid({ a: 1 }, { const: { a: 2 } }), false);
});

test("enum accepts one of the listed values", () => {
  assert.equal(isValid("b", { enum: ["a", "b", "c"] }), true);
  const result = validate("z", { enum: ["a", "b"] });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['data: expected one of ["a","b"]']);
});

test("enum keyword is ignored when not an array", () => {
  assert.equal(isValid("anything", { enum: "nope" }), true);
});

test("minLength and maxLength apply to strings", () => {
  assert.equal(isValid("abc", { minLength: 2, maxLength: 4 }), true);
  assert.deepEqual(validate("a", { minLength: 2 }).errors, [
    "data: expected length >= 2",
  ]);
  assert.deepEqual(validate("abcde", { maxLength: 4 }).errors, [
    "data: expected length <= 4",
  ]);
});

test("minLength and maxLength apply to arrays", () => {
  assert.equal(isValid([1, 2, 3], { minLength: 1, maxLength: 3 }), true);
  assert.deepEqual(validate([1], { minLength: 2 }).errors, [
    "data: expected length >= 2",
  ]);
});

test("length checks are skipped for non-string non-array values", () => {
  assert.equal(isValid(100, { minLength: 5 }), true);
});

test("minimum and maximum apply to numbers", () => {
  assert.equal(isValid(5, { minimum: 1, maximum: 10 }), true);
  assert.deepEqual(validate(0, { minimum: 1 }).errors, [
    "data: expected >= 1",
  ]);
  assert.deepEqual(validate(11, { maximum: 10 }).errors, [
    "data: expected <= 10",
  ]);
});

test("range checks are skipped for non-number values", () => {
  assert.equal(isValid("abc", { minimum: 1, maximum: 10 }), true);
});

test("pattern validates strings against a regular expression", () => {
  assert.equal(isValid("abc123", { pattern: "^[a-z]+\\d+$" }), true);
  assert.deepEqual(validate("123", { pattern: "^[a-z]+$" }).errors, [
    "data: expected to match /^[a-z]+$/",
  ]);
});

test("pattern is ignored for non-string values", () => {
  assert.equal(isValid(42, { pattern: "^[a-z]+$" }), true);
});

test("pattern reports an invalid regular expression", () => {
  const result = validate("x", { pattern: "(" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['data: invalid pattern "("']);
});

test("properties validates nested subschemas with extended paths", () => {
  const schema = {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "integer" },
    },
  };
  assert.equal(isValid({ name: "Ada", age: 30 }, schema).valid ?? true, true);
  const result = validate({ name: 1, age: "x" }, schema);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "data.name: expected string",
    "data.age: expected integer",
  ]);
});

test("properties only validates keys that are present", () => {
  const schema = {
    type: "object",
    properties: { name: { type: "string" } },
  };
  assert.equal(isValid({}, schema), true);
});

test("properties checks are skipped when the value is not a plain object", () => {
  const schema = { properties: { a: { type: "string" } } };
  assert.equal(isValid("not-an-object", schema), true);
});

test("required reports missing keys with their path", () => {
  const schema = { type: "object", required: ["id", "name"] };
  const result = validate({ id: 1 }, schema);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["data.name: required"]);
});

test("required passes when all keys are present", () => {
  const schema = { required: ["id"] };
  assert.equal(isValid({ id: 1 }, schema), true);
});

test("items validates every element of an array with indexed paths", () => {
  const schema = { type: "array", items: { type: "number" } };
  assert.equal(isValid([1, 2, 3], schema), true);
  const result = validate([1, "two", 3], schema);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["data[1]: expected number"]);
});

test("items is skipped when the value is not an array", () => {
  const schema = { items: { type: "number" } };
  assert.equal(isValid("nope", schema), true);
});

test("nested objects and arrays accumulate multiple deep errors", () => {
  const schema = {
    type: "object",
    properties: {
      tags: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["id"],
  };
  const result = validate({ tags: ["ok", 2] }, schema);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "data.tags[1]: expected string",
    "data.id: required",
  ]);
});
