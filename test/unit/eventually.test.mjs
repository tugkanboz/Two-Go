// Unit tests for src/eventually.js: eventually, retryUntil, pollUntil.
import { test } from "node:test";
import assert from "node:assert/strict";
import { eventually, retryUntil, pollUntil } from "../../src/eventually.js";

test("eventually resolves immediately when fn does not throw", async () => {
  const result = await eventually(() => 42);
  assert.equal(result, 42);
});

test("eventually awaits a promise-returning fn", async () => {
  const result = await eventually(async () => "ok");
  assert.equal(result, "ok");
});

test("eventually retries until fn stops throwing", async () => {
  let calls = 0;
  const result = await eventually(
    () => {
      calls += 1;
      if (calls < 3) throw new Error("not yet");
      return calls;
    },
    { interval: 5, timeout: 1000 }
  );
  assert.equal(result, 3);
  assert.ok(calls === 3, "fn should be called exactly three times");
});

test("eventually rejects with the last error on timeout", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      eventually(
        () => {
          calls += 1;
          throw new Error(`fail ${calls}`);
        },
        { interval: 5, timeout: 30 }
      ),
    (err) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /^fail \d+$/);
      return true;
    }
  );
  assert.ok(calls >= 1, "fn should have been called at least once");
});

test("eventually decorates the last error message when message is provided", async () => {
  await assert.rejects(
    () =>
      eventually(
        () => {
          throw new Error("boom");
        },
        { interval: 5, timeout: 30, message: "state never converged" }
      ),
    (err) => {
      assert.equal(err.message, "state never converged: boom");
      return true;
    }
  );
});

test("eventually wraps a non-Error throw into an Error when decorating", async () => {
  await assert.rejects(
    () =>
      eventually(
        () => {
          throw "string failure";
        },
        { interval: 5, timeout: 30, message: "prefix" }
      ),
    (err) => {
      assert.ok(err instanceof Error);
      assert.equal(err.message, "prefix: string failure");
      return true;
    }
  );
});

test("eventually rethrows a non-Error throw unchanged when no message", async () => {
  await assert.rejects(
    () =>
      eventually(
        () => {
          throw "raw failure";
        },
        { interval: 5, timeout: 30 }
      ),
    (err) => {
      assert.equal(err, "raw failure");
      return true;
    }
  );
});

test("eventually uses default options when none are provided and succeeds first try", async () => {
  const result = await eventually(() => true);
  assert.equal(result, true);
});

test("retryUntil is an alias of eventually", async () => {
  assert.equal(retryUntil, eventually);
  const result = await retryUntil(() => "aliased");
  assert.equal(result, "aliased");
});

test("pollUntil resolves once the predicate is truthy", async () => {
  let value = 0;
  const result = await pollUntil(
    () => {
      value += 1;
      return value;
    },
    (v) => v >= 3,
    { interval: 5, timeout: 1000 }
  );
  assert.equal(result, 3);
});

test("pollUntil resolves immediately when predicate is truthy on first call", async () => {
  let calls = 0;
  const result = await pollUntil(
    () => {
      calls += 1;
      return "ready";
    },
    (v) => v === "ready",
    { interval: 5, timeout: 1000 }
  );
  assert.equal(result, "ready");
  assert.equal(calls, 1);
});

test("pollUntil awaits a promise-returning fn", async () => {
  let value = 0;
  const result = await pollUntil(
    async () => {
      value += 1;
      return value;
    },
    (v) => v === 2,
    { interval: 5, timeout: 1000 }
  );
  assert.equal(result, 2);
});

test("pollUntil throws a default message on timeout", async () => {
  await assert.rejects(
    () =>
      pollUntil(
        () => 1,
        (v) => v === 999,
        { interval: 5, timeout: 30 }
      ),
    (err) => {
      assert.ok(err instanceof Error);
      assert.equal(
        err.message,
        "pollUntil: predicate never became true within 30ms"
      );
      return true;
    }
  );
});

test("pollUntil prefixes the timeout message when message is provided", async () => {
  await assert.rejects(
    () =>
      pollUntil(
        () => 0,
        (v) => v > 0,
        { interval: 5, timeout: 30, message: "cache miss" }
      ),
    (err) => {
      assert.equal(
        err.message,
        "cache miss: pollUntil: predicate never became true within 30ms"
      );
      return true;
    }
  );
});

test("pollUntil treats any truthy predicate result as success", async () => {
  const result = await pollUntil(
    () => ({ done: true }),
    (v) => v.done,
    { interval: 5, timeout: 1000 }
  );
  assert.deepEqual(result, { done: true });
});
