import { test } from "node:test";
import assert from "node:assert/strict";

import {
  identity,
  noop,
  constant,
  times,
  uniqueId,
  attempt,
  defaultTo,
  property,
  propertyOf,
  matches,
  matchesProperty,
  iteratee,
  flow,
  flowRight,
  cond,
  over,
  overEvery,
  overSome,
  stubTrue,
  stubFalse,
  stubArray,
  stubObject,
  stubString,
} from "../../src/utils/util.js";

test("identity returns its first argument unchanged", () => {
  const obj = { a: 1 };
  assert.equal(identity(42), 42);
  assert.equal(identity("x"), "x");
  assert.equal(identity(obj), obj);
  assert.equal(identity(undefined), undefined);
});

test("noop returns undefined and ignores arguments", () => {
  assert.equal(noop(), undefined);
  assert.equal(noop(1, 2, 3), undefined);
});

test("constant returns a function that always returns the given value", () => {
  const always5 = constant(5);
  assert.equal(always5(), 5);
  assert.equal(always5("ignored"), 5);

  const ref = { a: 1 };
  const alwaysRef = constant(ref);
  assert.equal(alwaysRef(), ref);
});

test("times invokes fn n times collecting results, passing the index", () => {
  assert.deepEqual(
    times(3, (i) => i * 2),
    [0, 2, 4],
  );
});

test("times clamps non-positive and non-numeric counts to zero", () => {
  assert.deepEqual(
    times(0, () => 1),
    [],
  );
  assert.deepEqual(
    times(-5, () => 1),
    [],
  );
  assert.deepEqual(
    times("not a number", () => 1),
    [],
  );
});

test("times floors fractional counts", () => {
  assert.deepEqual(
    times(2.9, (i) => i),
    [0, 1],
  );
});

test("uniqueId returns distinct ids and honors an optional prefix", () => {
  const a = uniqueId();
  const b = uniqueId();
  assert.notEqual(a, b);
  assert.equal(typeof a, "string");

  const prefixed = uniqueId("user_");
  assert.equal(prefixed.startsWith("user_"), true);
  assert.notEqual(uniqueId("user_"), prefixed);
});

test("attempt returns the result when fn does not throw", () => {
  const result = attempt((a, b) => a + b, 2, 3);
  assert.equal(result, 5);
});

test("attempt returns the thrown Error instead of throwing", () => {
  const err = new Error("boom");
  const result = attempt(() => {
    throw err;
  });
  assert.equal(result, err);
});

test("attempt wraps non-Error throwables in an Error", () => {
  const result = attempt(() => {
    throw "string failure";
  });
  assert.ok(result instanceof Error);
  assert.equal(result.message, "string failure");
});

test("defaultTo returns the value when it is present", () => {
  assert.equal(defaultTo(0, 99), 0);
  assert.equal(defaultTo("", "fb"), "");
  assert.equal(defaultTo(false, true), false);
});

test("defaultTo returns the fallback for null, undefined, and NaN", () => {
  assert.equal(defaultTo(null, "fb"), "fb");
  assert.equal(defaultTo(undefined, "fb"), "fb");
  assert.equal(defaultTo(NaN, "fb"), "fb");
});

test("property returns an accessor resolving a path", () => {
  const getName = property("user.name");
  assert.equal(getName({ user: { name: "Ada" } }), "Ada");

  const getFirst = property("items[0]");
  assert.equal(getFirst({ items: ["a", "b"] }), "a");

  assert.equal(getName({ user: {} }), undefined);
});

test("propertyOf resolves paths against a captured object", () => {
  const lookup = propertyOf({ a: { b: 2 }, list: [10, 20] });
  assert.equal(lookup("a.b"), 2);
  assert.equal(lookup("list[1]"), 20);
  assert.equal(lookup("missing"), undefined);
});

test("matches builds a deep partial-match predicate over objects", () => {
  const isActiveAdmin = matches({ role: "admin", active: true });
  assert.equal(isActiveAdmin({ role: "admin", active: true, id: 1 }), true);
  assert.equal(isActiveAdmin({ role: "admin", active: false }), false);
  assert.equal(isActiveAdmin({ role: "user", active: true }), false);
});

test("matches deep-compares nested values", () => {
  const pred = matches({ meta: { tags: ["x"] } });
  assert.equal(pred({ meta: { tags: ["x"] }, other: 1 }), true);
  assert.equal(pred({ meta: { tags: ["y"] } }), false);
});

test("matches against a primitive source uses deep equality", () => {
  const isFive = matches(5);
  assert.equal(isFive(5), true);
  assert.equal(isFive(6), false);

  const isNull = matches(null);
  assert.equal(isNull(null), true);
  assert.equal(isNull({}), false);
});

test("matches returns false when the target is not an object", () => {
  const pred = matches({ a: 1 });
  assert.equal(pred(null), false);
  assert.equal(pred(42), false);
});

test("matchesProperty checks a path against a deep-equal value", () => {
  const hasName = matchesProperty("user.name", "Ada");
  assert.equal(hasName({ user: { name: "Ada" } }), true);
  assert.equal(hasName({ user: { name: "Bob" } }), false);

  const hasTags = matchesProperty("tags", ["a", "b"]);
  assert.equal(hasTags({ tags: ["a", "b"] }), true);
  assert.equal(hasTags({ tags: ["a"] }), false);
});

test("iteratee returns identity for null or undefined", () => {
  assert.equal(iteratee(null), identity);
  assert.equal(iteratee(undefined), identity);
});

test("iteratee passes functions through unchanged", () => {
  const fn = (x) => x;
  assert.equal(iteratee(fn), fn);
});

test("iteratee turns a string into a property accessor", () => {
  const fn = iteratee("a.b");
  assert.equal(fn({ a: { b: 7 } }), 7);
});

test("iteratee turns an object into a partial-match predicate", () => {
  const fn = iteratee({ active: true });
  assert.equal(fn({ active: true, id: 1 }), true);
  assert.equal(fn({ active: false }), false);
});

test("iteratee turns an array into a partial-match predicate", () => {
  // Arrays are objects, so matches treats them by index keys.
  const fn = iteratee(["a"]);
  assert.equal(fn(["a", "b"]), true);
  assert.equal(fn(["x"]), false);
});

test("iteratee turns a non-string/object value into a property accessor", () => {
  const fn = iteratee(0);
  assert.equal(fn(["first", "second"]), "first");
});

test("flow composes functions left-to-right", () => {
  const addOne = (x) => x + 1;
  const double = (x) => x * 2;
  const composed = flow(addOne, double);
  assert.equal(composed(3), 8);
});

test("flow forwards multiple args to the first function only", () => {
  const sum = (a, b) => a + b;
  const square = (x) => x * x;
  assert.equal(flow(sum, square)(2, 3), 25);
});

test("flow with no functions returns its first argument", () => {
  assert.equal(flow()(99, 1), 99);
});

test("flowRight composes functions right-to-left", () => {
  const addOne = (x) => x + 1;
  const double = (x) => x * 2;
  const composed = flowRight(addOne, double);
  assert.equal(composed(3), 7);
});

test("cond returns the first matching transform's result", () => {
  const classify = cond([
    [(n) => n < 0, () => "negative"],
    [(n) => n === 0, () => "zero"],
    [(n) => n > 0, () => "positive"],
  ]);
  assert.equal(classify(-1), "negative");
  assert.equal(classify(0), "zero");
  assert.equal(classify(7), "positive");
});

test("cond returns undefined when no predicate matches", () => {
  const fn = cond([[() => false, () => "never"]]);
  assert.equal(fn("anything"), undefined);
});

test("cond passes all arguments to predicates and transforms", () => {
  const fn = cond([[(a, b) => a < b, (a, b) => b - a]]);
  assert.equal(fn(2, 5), 3);
});

test("over runs every function over the args and collects results", () => {
  const fn = over(
    (n) => n + 1,
    (n) => n * 2,
  );
  assert.deepEqual(fn(4), [5, 8]);
});

test("over with no functions returns an empty array", () => {
  assert.deepEqual(over()(1), []);
});

test("overEvery is true only when every predicate passes", () => {
  const pred = overEvery(
    (n) => n > 0,
    (n) => n < 10,
  );
  assert.equal(pred(5), true);
  assert.equal(pred(-1), false);
  assert.equal(pred(20), false);
});

test("overEvery with no predicates is vacuously true", () => {
  assert.equal(overEvery()("anything"), true);
});

test("overSome is true when at least one predicate passes", () => {
  const pred = overSome(
    (n) => n < 0,
    (n) => n > 100,
  );
  assert.equal(pred(-5), true);
  assert.equal(pred(200), true);
  assert.equal(pred(50), false);
});

test("overSome with no predicates is false", () => {
  assert.equal(overSome()("anything"), false);
});

test("stub helpers return their fixed values", () => {
  assert.equal(stubTrue(), true);
  assert.equal(stubFalse(), false);
  assert.equal(stubString(), "");
  assert.deepEqual(stubArray(), []);
  assert.deepEqual(stubObject(), {});
});

test("stubArray and stubObject return fresh instances each call", () => {
  assert.notEqual(stubArray(), stubArray());
  assert.notEqual(stubObject(), stubObject());
});
