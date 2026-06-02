// Unit tests for src/utils/function.js using node:test + node:assert/strict.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  debounce,
  throttle,
  once,
  memoize,
  curry,
  partial,
  partialRight,
  delay,
  defer,
  sleep,
  retry,
  flip,
  negate,
  wrap,
  after,
  before,
} from "../../src/utils/function.js";

test("debounce only invokes once after the wait period (trailing)", async () => {
  let calls = 0;
  let lastValue;
  const fn = debounce((value) => {
    calls += 1;
    lastValue = value;
  }, 20);

  fn("a");
  fn("b");
  fn("c");

  assert.equal(calls, 0);
  await sleep(40);
  assert.equal(calls, 1);
  assert.equal(lastValue, "c");
});

test("debounce leading edge fires immediately", async () => {
  let calls = 0;
  const fn = debounce(() => {
    calls += 1;
  }, 20, { leading: true, trailing: false });

  fn();
  assert.equal(calls, 1);
  fn();
  assert.equal(calls, 1);
  await sleep(40);
  assert.equal(calls, 1);
});

test("debounce preserves `this` and arguments", async () => {
  const obj = {
    value: 42,
    run: null,
  };
  let seen;
  obj.run = debounce(function (extra) {
    seen = this.value + extra;
  }, 10);

  obj.run(8);
  await sleep(30);
  assert.equal(seen, 50);
});

test("debounce .cancel() prevents the pending invocation", async () => {
  let calls = 0;
  const fn = debounce(() => {
    calls += 1;
  }, 20);

  fn();
  fn.cancel();
  await sleep(40);
  assert.equal(calls, 0);
});

test("throttle invokes immediately on the leading edge", () => {
  let calls = 0;
  const fn = throttle(() => {
    calls += 1;
  }, 50);

  fn();
  fn();
  fn();
  assert.equal(calls, 1);
});

test("throttle fires a trailing call after the window", async () => {
  let calls = 0;
  const fn = throttle(() => {
    calls += 1;
  }, 30);

  fn(); // leading
  fn(); // schedules trailing
  assert.equal(calls, 1);
  await sleep(60);
  assert.equal(calls, 2);
});

test("throttle .cancel() clears the pending trailing call", async () => {
  let calls = 0;
  const fn = throttle(() => {
    calls += 1;
  }, 30);

  fn(); // leading
  fn(); // schedules trailing
  assert.equal(calls, 1);
  fn.cancel();
  await sleep(60);
  assert.equal(calls, 1);
});

test("once invokes only the first time and caches the result", () => {
  let calls = 0;
  const fn = once((x) => {
    calls += 1;
    return x * 2;
  });

  assert.equal(fn(5), 10);
  assert.equal(fn(99), 10);
  assert.equal(fn(123), 10);
  assert.equal(calls, 1);
});

test("memoize caches by the first argument and exposes .cache", () => {
  let calls = 0;
  const fn = memoize((n) => {
    calls += 1;
    return n + 1;
  });

  assert.equal(fn(1), 2);
  assert.equal(fn(1), 2);
  assert.equal(calls, 1);
  assert.equal(fn(2), 3);
  assert.equal(calls, 2);
  assert.ok(fn.cache instanceof Map);
  assert.equal(fn.cache.get(1), 2);
});

test("memoize uses a custom resolver for the cache key", () => {
  let calls = 0;
  const fn = memoize(
    (a, b) => {
      calls += 1;
      return a + b;
    },
    (a, b) => `${a}:${b}`,
  );

  assert.equal(fn(1, 2), 3);
  assert.equal(fn(1, 2), 3);
  assert.equal(calls, 1);
  assert.equal(fn(2, 1), 3);
  assert.equal(calls, 2);
});

test("curry collects arguments until arity is satisfied", () => {
  const add = curry((a, b, c) => a + b + c);

  assert.equal(add(1)(2)(3), 6);
  assert.equal(add(1, 2)(3), 6);
  assert.equal(add(1, 2, 3), 6);
  assert.equal(add(1)(2, 3), 6);
});

test("curry respects an explicit arity", () => {
  const fn = curry((...args) => args.reduce((s, n) => s + n, 0), 2);
  assert.equal(fn(1)(2), 3);
  assert.equal(fn(1, 2), 3);
});

test("partial prepends bound arguments", () => {
  const greet = (greeting, name) => `${greeting}, ${name}`;
  const hello = partial(greet, "Hello");
  assert.equal(hello("World"), "Hello, World");
});

test("partialRight appends bound arguments", () => {
  const divide = (a, b) => a / b;
  const halve = partialRight(divide, 2);
  assert.equal(halve(10), 5);
});

test("delay invokes the function after the timeout and returns a timer id", async () => {
  let value;
  const id = delay((x) => {
    value = x;
  }, 10, "done");

  assert.notEqual(id, undefined);
  assert.equal(value, undefined);
  await sleep(30);
  assert.equal(value, "done");
});

test("defer runs the function after the current stack clears", async () => {
  let value = 0;
  defer(() => {
    value = 1;
  });
  assert.equal(value, 0);
  await sleep(10);
  assert.equal(value, 1);
});

test("sleep resolves after the given delay", async () => {
  const start = Date.now();
  await sleep(20);
  assert.ok(Date.now() - start >= 15);
});

test("retry resolves once the function succeeds", async () => {
  let attempts = 0;
  const result = await retry(
    () => {
      attempts += 1;
      if (attempts < 3) throw new Error("fail");
      return "ok";
    },
    { retries: 5, delay: 0 },
  );

  assert.equal(result, "ok");
  assert.equal(attempts, 3);
});

test("retry throws the last error after exhausting attempts", async () => {
  let attempts = 0;
  const errors = [];
  await assert.rejects(
    () =>
      retry(
        () => {
          attempts += 1;
          throw new Error(`boom ${attempts}`);
        },
        { retries: 2, delay: 0, onError: (e) => errors.push(e.message) },
      ),
    /boom 3/,
  );

  // initial attempt + 2 retries
  assert.equal(attempts, 3);
  assert.deepEqual(errors, ["boom 1", "boom 2", "boom 3"]);
});

test("flip swaps the first two arguments", () => {
  const subtract = (a, b) => a - b;
  const flipped = flip(subtract);
  assert.equal(flipped(2, 10), 8);
});

test("negate inverts the predicate result", () => {
  const isEven = (n) => n % 2 === 0;
  const isOdd = negate(isEven);
  assert.equal(isOdd(3), true);
  assert.equal(isOdd(4), false);
});

test("wrap passes the value as the first argument to the wrapper", () => {
  const wrapped = wrap("text", (value, prefix) => `${prefix}${value}`);
  assert.equal(wrapped(">>"), ">>text");
});

test("after only invokes once it has been called n or more times", () => {
  let calls = 0;
  const fn = after(3, () => {
    calls += 1;
    return "run";
  });

  assert.equal(fn(), undefined);
  assert.equal(fn(), undefined);
  assert.equal(fn(), "run");
  assert.equal(fn(), "run");
  assert.equal(calls, 2);
});

test("before invokes while under the limit then returns the last result", () => {
  let calls = 0;
  const fn = before(3, (x) => {
    calls += 1;
    return x;
  });

  assert.equal(fn("a"), "a");
  assert.equal(fn("b"), "b");
  // 3rd call is at the limit: returns last result, does not invoke
  assert.equal(fn("c"), "b");
  assert.equal(fn("d"), "b");
  assert.equal(calls, 2);
});
