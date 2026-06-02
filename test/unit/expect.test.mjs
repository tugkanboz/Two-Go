// Unit tests for src/expect.js, the Jest-style standalone assertion API.
// These tests use node:test + node:assert/strict and never assert with the
// library under test.

import { test } from "node:test";
import assert from "node:assert/strict";

import { expect, Expectation } from "../../src/expect.js";
import { AssertionError } from "../../src/assertions.js";

// Helper: assert that running `fn` throws an AssertionError.
function assertThrowsAssertion(fn) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof AssertionError, "should throw AssertionError");
    return true;
  });
}

test("expect returns an Expectation wrapping the value", () => {
  const exp = expect(42);
  assert.ok(exp instanceof Expectation);
  assert.equal(exp.value, 42);
  assert.equal(exp.negated, false);
});

test("not returns a negated Expectation without mutating original", () => {
  const exp = expect(1);
  const negated = exp.not;
  assert.equal(exp.negated, false);
  assert.equal(negated.negated, true);
  assert.notEqual(exp, negated);
});

test("matchers return the Expectation for chaining on success", () => {
  const exp = expect(5);
  const result = exp.toBe(5);
  assert.equal(result, exp);
});

test("toBe passes on Object.is equality and fails otherwise", () => {
  expect(3).toBe(3);
  expect(NaN).toBe(NaN);
  assertThrowsAssertion(() => expect(3).toBe(4));
  // -0 vs 0 distinguished by Object.is
  assertThrowsAssertion(() => expect(-0).toBe(0));
});

test("toBe with .not inverts the result", () => {
  expect(3).not.toBe(4);
  assertThrowsAssertion(() => expect(3).not.toBe(3));
});

test("toEqual performs deep equality", () => {
  expect({ a: 1, b: [1, 2] }).toEqual({ a: 1, b: [1, 2] });
  expect([1, 2, 3]).toEqual([1, 2, 3]);
  assertThrowsAssertion(() => expect({ a: 1 }).toEqual({ a: 2 }));
});

test("toStrictEqual distinguishes array from object shape", () => {
  expect({ a: 1 }).toStrictEqual({ a: 1 });
  // {} vs [] should differ under strict equality
  assertThrowsAssertion(() => expect({}).toStrictEqual([]));
});

test("toStrictEqual distinguishes class instances by prototype", () => {
  class Foo {
    constructor(x) {
      this.x = x;
    }
  }
  const a = new Foo(1);
  const b = new Foo(1);
  expect(a).toStrictEqual(b);
  // plain object with same keys but different prototype must fail
  assertThrowsAssertion(() => expect(a).toStrictEqual({ x: 1 }));
});

test("toBeTruthy and toBeFalsy", () => {
  expect(1).toBeTruthy();
  expect("x").toBeTruthy();
  expect(0).toBeFalsy();
  expect("").toBeFalsy();
  assertThrowsAssertion(() => expect(0).toBeTruthy());
  assertThrowsAssertion(() => expect(1).toBeFalsy());
});

test("toBeNull, toBeUndefined, toBeDefined", () => {
  expect(null).toBeNull();
  expect(undefined).toBeUndefined();
  expect(0).toBeDefined();
  assertThrowsAssertion(() => expect(0).toBeNull());
  assertThrowsAssertion(() => expect(undefined).toBeDefined());
});

test("toBeNaN", () => {
  expect(NaN).toBeNaN();
  expect(1).not.toBeNaN();
  assertThrowsAssertion(() => expect(1).toBeNaN());
});

test("numeric comparison matchers", () => {
  expect(5).toBeGreaterThan(3);
  expect(5).toBeGreaterThanOrEqual(5);
  expect(2).toBeLessThan(3);
  expect(2).toBeLessThanOrEqual(2);
  assertThrowsAssertion(() => expect(3).toBeGreaterThan(5));
  assertThrowsAssertion(() => expect(5).toBeLessThan(2));
});

test("toBeCloseTo with default and custom digits", () => {
  expect(0.1 + 0.2).toBeCloseTo(0.3);
  expect(3.14159).toBeCloseTo(3.14, 2);
  assertThrowsAssertion(() => expect(0.1).toBeCloseTo(0.2));
});

test("toContain for strings and arrays", () => {
  expect("hello world").toContain("world");
  expect([1, 2, 3]).toContain(2);
  assertThrowsAssertion(() => expect([1, 2, 3]).toContain(9));
  // non-string non-array values never contain
  assertThrowsAssertion(() => expect(123).toContain(2));
});

test("toContainEqual checks deep array membership", () => {
  expect([{ a: 1 }, { b: 2 }]).toContainEqual({ a: 1 });
  assertThrowsAssertion(() => expect([{ a: 1 }]).toContainEqual({ a: 2 }));
  // non-array fails
  assertThrowsAssertion(() => expect("nope").toContainEqual("n"));
});

test("toMatch with RegExp and substring", () => {
  expect("abc123").toMatch(/\d+/);
  expect("abc123").toMatch("bc1");
  assertThrowsAssertion(() => expect("abc").toMatch(/\d+/));
});

test("toMatchObject performs partial deep match", () => {
  expect({ a: 1, b: 2, c: 3 }).toMatchObject({ a: 1, c: 3 });
  expect({ user: { id: 1, name: "x" } }).toMatchObject({ user: { id: 1 } });
  assertThrowsAssertion(() =>
    expect({ a: 1 }).toMatchObject({ a: 1, missing: 2 })
  );
  assertThrowsAssertion(() => expect({ a: 1 }).toMatchObject({ a: 2 }));
});

test("toHaveLength for strings and arrays", () => {
  expect("abc").toHaveLength(3);
  expect([1, 2]).toHaveLength(2);
  assertThrowsAssertion(() => expect("abc").toHaveLength(2));
  // null/undefined length resolves to undefined and fails for a numeric n
  assertThrowsAssertion(() => expect(null).toHaveLength(0));
});

test("toHaveProperty existence and value at a path", () => {
  const obj = { data: { items: [{ id: 7 }] } };
  expect(obj).toHaveProperty("data.items");
  expect(obj).toHaveProperty("data.items[0].id", 7);
  assertThrowsAssertion(() => expect(obj).toHaveProperty("data.missing"));
  assertThrowsAssertion(() =>
    expect(obj).toHaveProperty("data.items[0].id", 8)
  );
});

test("toBeInstanceOf", () => {
  expect(new Date()).toBeInstanceOf(Date);
  expect([]).toBeInstanceOf(Array);
  assertThrowsAssertion(() => expect({}).toBeInstanceOf(Date));
});

test("toBeType special-cases array and null", () => {
  expect([]).toBeType("array");
  expect(null).toBeType("null");
  expect("x").toBeType("string");
  expect(1).toBeType("number");
  assertThrowsAssertion(() => expect([]).toBeType("object"));
});

test("toBeOneOf checks strict membership", () => {
  expect(2).toBeOneOf([1, 2, 3]);
  assertThrowsAssertion(() => expect(9).toBeOneOf([1, 2, 3]));
  // non-array argument means empty list -> always fails
  assertThrowsAssertion(() => expect(1).toBeOneOf(null));
});

test("toThrow passes when function throws and matches", () => {
  const boom = () => {
    throw new Error("kaboom happened");
  };
  expect(boom).toThrow();
  expect(boom).toThrow("kaboom");
  expect(boom).toThrow(/kaboom/);
  expect(boom).toThrow(Error);
});

test("toThrow fails when function does not throw", () => {
  const noop = () => 1;
  assertThrowsAssertion(() => expect(noop).toThrow());
});

test("toThrow with .not passes when function does not throw", () => {
  const noop = () => 1;
  expect(noop).not.toThrow();
});

test("toThrow fails when thrown error does not match constructor", () => {
  const boom = () => {
    throw new TypeError("bad type");
  };
  assertThrowsAssertion(() => expect(boom).toThrow(RangeError));
});

test("toThrow throws when value is not a function", () => {
  assertThrowsAssertion(() => expect(123).toThrow());
});

test("toSatisfy applies a predicate", () => {
  expect(4).toSatisfy((n) => n % 2 === 0);
  assertThrowsAssertion(() => expect(3).toSatisfy((n) => n % 2 === 0));
});

test("toBeEmpty for various empty and non-empty values", () => {
  expect("").toBeEmpty();
  expect([]).toBeEmpty();
  expect({}).toBeEmpty();
  expect(null).toBeEmpty();
  expect(undefined).toBeEmpty();
  expect(new Map()).toBeEmpty();
  expect(new Set()).toBeEmpty();
  assertThrowsAssertion(() => expect("x").toBeEmpty());
  assertThrowsAssertion(() => expect([1]).toBeEmpty());
  assertThrowsAssertion(() => expect({ a: 1 }).toBeEmpty());
});

test("AssertionError carries expected and actual", () => {
  try {
    expect(1).toBe(2);
    assert.fail("should have thrown");
  } catch (err) {
    assert.ok(err instanceof AssertionError);
    assert.equal(err.expected, 2);
    assert.equal(err.actual, 1);
    assert.match(err.message, /to be/);
  }
});

test("negated message includes 'not'", () => {
  try {
    expect(1).not.toBe(1);
    assert.fail("should have thrown");
  } catch (err) {
    assert.ok(err instanceof AssertionError);
    assert.match(err.message, /not /);
  }
});

test("resolves runs matcher against resolved value", async () => {
  await expect(Promise.resolve(5)).resolves.toBe(5);
  await expect(Promise.resolve({ a: 1 })).resolves.toEqual({ a: 1 });
});

test("resolves fails when promise rejects", async () => {
  await assert.rejects(
    () => expect(Promise.reject(new Error("nope"))).resolves.toBe(1),
    (err) => err instanceof AssertionError
  );
});

test("resolves matcher failure throws AssertionError", async () => {
  await assert.rejects(
    () => expect(Promise.resolve(5)).resolves.toBe(6),
    (err) => err instanceof AssertionError
  );
});

test("rejects runs matcher against rejection reason", async () => {
  await expect(Promise.reject(new Error("boom"))).rejects.toBeInstanceOf(Error);
});

test("rejects fails when promise resolves", async () => {
  await assert.rejects(
    () => expect(Promise.resolve(1)).rejects.toBeInstanceOf(Error),
    (err) => err instanceof AssertionError
  );
});

test("resolves.not inverts the async matcher", async () => {
  await expect(Promise.resolve(5)).resolves.not.toBe(6);
});
