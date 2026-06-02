// Unit tests for src/soft.js: soft assertions that collect all failures
// instead of failing fast, plus the softly() convenience wrapper.

import { test } from "node:test";
import assert from "node:assert/strict";

import { soft, softly } from "../../src/soft.js";
import { AssertionError } from "../../src/assertions.js";

test("soft() returns an object with expect, verify, and failures", () => {
  const ctx = soft();
  assert.equal(typeof ctx.expect, "function");
  assert.equal(typeof ctx.verify, "function");
  assert.ok(Array.isArray(ctx.failures));
  assert.equal(ctx.failures.length, 0);
});

test("verify() does nothing when all assertions pass", () => {
  const { expect, verify, failures } = soft();
  expect(1).toBe(1);
  expect("hello").toContain("ell");
  expect([1, 2, 3]).toHaveLength(3);
  assert.equal(failures.length, 0);
  assert.doesNotThrow(() => verify());
});

test("a single failure is recorded but does not throw immediately", () => {
  const { expect, failures } = soft();
  expect(1).toBe(2);
  assert.equal(failures.length, 1);
  assert.equal(typeof failures[0], "string");
});

test("multiple failures are all collected", () => {
  const { expect, failures } = soft();
  expect(1).toBe(2);
  expect("abc").toContain("z");
  expect([1]).toHaveLength(5);
  assert.equal(failures.length, 3);
});

test("verify() throws an AssertionError listing all failures", () => {
  const { expect, verify } = soft();
  expect(1).toBe(2);
  expect("abc").toContain("z");

  assert.throws(
    () => verify(),
    (err) => {
      assert.ok(err instanceof AssertionError);
      assert.match(err.message, /^2 soft assertions failed:/);
      assert.match(err.message, /1\)/);
      assert.match(err.message, /2\)/);
      return true;
    }
  );
});

test("verify() uses singular wording for exactly one failure", () => {
  const { expect, verify } = soft();
  expect(true).toBe(false);

  assert.throws(
    () => verify(),
    (err) => {
      assert.match(err.message, /^1 soft assertion failed:/);
      assert.doesNotMatch(err.message, /assertions failed/);
      return true;
    }
  );
});

test("verify() error carries the failures array as actual", () => {
  const ctx = soft();
  ctx.expect(1).toBe(2);

  assert.throws(
    () => ctx.verify(),
    (err) => {
      assert.equal(err.actual, ctx.failures);
      assert.equal(err.expected, undefined);
      return true;
    }
  );
});

test("matchers are chainable and return the wrapper", () => {
  const { expect, failures } = soft();
  const wrapper = expect(5);
  const returned = wrapper.toBeGreaterThan(1).toBeLessThan(10).toBe(5);
  assert.equal(returned, wrapper);
  assert.equal(failures.length, 0);
});

test("chaining continues collecting after a failure in the middle", () => {
  const { expect, failures } = soft();
  expect(5)
    .toBe(99) // fails
    .toBeGreaterThan(1) // passes
    .toBe(100); // fails
  assert.equal(failures.length, 2);
});

test("not negation works and records failures when the negated check fails", () => {
  const { expect, failures } = soft();
  expect(1).not.toBe(2); // passes (1 is not 2)
  expect(1).not.toBe(1); // fails (1 is 1)
  assert.equal(failures.length, 1);
});

test("not view shares the same failures array", () => {
  const { expect, failures } = soft();
  const wrapper = expect(1);
  const negated = wrapper.not;
  negated.toBe(1); // fails
  assert.equal(failures.length, 1);
});

test("double negation via chained not getters", () => {
  const { expect, failures } = soft();
  // not.not should behave like the original (non-negated) assertion.
  expect(1).not.not.toBe(1); // passes
  expect(1).not.not.toBe(2); // fails
  assert.equal(failures.length, 1);
});

test("matcher return value exposes a not getter again", () => {
  const { expect, failures } = soft();
  // expect(5).not returns a negated wrapper; its matcher returns that same
  // wrapper, whose `not` getter toggles negation back off.
  const negated = expect(5).not;
  const returned = negated.toBe(6); // negated: 5 is not 6 -> passes
  assert.equal(returned, negated);
  assert.equal(failures.length, 0);
  // The wrapper returned from a matcher exposes a `not` getter again.
  assert.equal(typeof negated.not, "object");
});

test("recorded failure message matches the underlying expect message", () => {
  const { expect, failures } = soft();
  expect(1).toBe(2);
  assert.match(failures[0], /expected 1 to be 2/);
});

test("separate soft() contexts keep independent failures", () => {
  const a = soft();
  const b = soft();
  a.expect(1).toBe(2);
  assert.equal(a.failures.length, 1);
  assert.equal(b.failures.length, 0);
  assert.doesNotThrow(() => b.verify());
});

test("softly() runs the function and passes expect plus the instance", () => {
  let receivedExpect;
  let receivedInstance;
  softly((expect, instance) => {
    receivedExpect = expect;
    receivedInstance = instance;
    expect(1).toBe(1);
  });
  assert.equal(typeof receivedExpect, "function");
  assert.equal(typeof receivedInstance.verify, "function");
  assert.ok(Array.isArray(receivedInstance.failures));
});

test("softly() returns undefined on success", () => {
  const result = softly((expect) => {
    expect(true).toBeTruthy();
  });
  assert.equal(result, undefined);
});

test("softly() throws an aggregated AssertionError on failure", () => {
  assert.throws(
    () =>
      softly((expect) => {
        expect(1).toBe(2);
        expect("a").toContain("b");
      }),
    (err) => {
      assert.ok(err instanceof AssertionError);
      assert.match(err.message, /^2 soft assertions failed:/);
      return true;
    }
  );
});

test("softly() collects all failures before throwing (not fail-fast)", () => {
  const seen = [];
  assert.throws(() =>
    softly((expect, instance) => {
      expect(1).toBe(2);
      seen.push(instance.failures.length);
      expect(3).toBe(4);
      seen.push(instance.failures.length);
    })
  );
  // The function body ran fully, observing failures accumulate.
  assert.deepEqual(seen, [1, 2]);
});

test("verify() can be called multiple times; second call still throws", () => {
  const { expect, verify } = soft();
  expect(1).toBe(2);
  assert.throws(() => verify());
  assert.throws(() => verify());
});

test("soft wrapper supports a variety of matchers", () => {
  const { expect, failures } = soft();
  expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
  expect("hello world").toMatch(/world/);
  expect([1, 2, 3]).toContain(2);
  expect(3.14159).toBeCloseTo(3.14, 2);
  expect(null).toBeNull();
  expect(undefined).toBeUndefined();
  expect({ user: { id: 7 } }).toHaveProperty("user.id", 7);
  assert.equal(failures.length, 0);
});

test("toThrow matcher works inside the soft wrapper", () => {
  const { expect, failures } = soft();
  expect(() => {
    throw new Error("boom");
  }).toThrow("boom");
  expect(() => {}).toThrow(); // fails: does not throw
  assert.equal(failures.length, 1);
});

test("failures array reference is stable across the context lifetime", () => {
  const ctx = soft();
  const ref = ctx.failures;
  ctx.expect(1).toBe(2);
  assert.equal(ctx.failures, ref);
  assert.equal(ref.length, 1);
});