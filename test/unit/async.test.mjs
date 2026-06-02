// Unit tests for src/async.js - async control-flow helpers.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  parallel,
  parallelLimit,
  series,
  waterfall,
  mapAsync,
  mapLimit,
  withTimeout,
  allSettledMap
} from "../../src/async.js";

/** Resolves after the given number of milliseconds with an optional value. */
function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

test("parallel resolves to ordered results", async () => {
  const order = [];
  const results = await parallel([
    async () => {
      await delay(20);
      order.push("a");
      return 1;
    },
    async () => {
      await delay(5);
      order.push("b");
      return 2;
    },
    async () => {
      await delay(10);
      order.push("c");
      return 3;
    }
  ]);
  assert.deepEqual(results, [1, 2, 3]);
  // The faster tasks finish first even though results stay ordered.
  assert.deepEqual(order, ["b", "c", "a"]);
});

test("parallel with empty list resolves to empty array", async () => {
  const results = await parallel([]);
  assert.deepEqual(results, []);
});

test("parallel rejects on the first error", async () => {
  await assert.rejects(
    () =>
      parallel([
        async () => 1,
        async () => {
          throw new Error("boom");
        }
      ]),
    /boom/
  );
});

test("parallelLimit preserves order and bounds concurrency", async () => {
  let active = 0;
  let maxActive = 0;
  const tasks = [];
  for (let i = 0; i < 6; i += 1) {
    tasks.push(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await delay(10);
      active -= 1;
      return i;
    });
  }
  const results = await parallelLimit(tasks, 2);
  assert.deepEqual(results, [0, 1, 2, 3, 4, 5]);
  assert.ok(maxActive <= 2, `maxActive was ${maxActive}`);
});

test("parallelLimit with empty list resolves to empty array", async () => {
  const results = await parallelLimit([], 3);
  assert.deepEqual(results, []);
});

test("series runs sequentially and preserves order", async () => {
  const order = [];
  const results = await series([
    async () => {
      await delay(15);
      order.push("a");
      return 1;
    },
    async () => {
      await delay(5);
      order.push("b");
      return 2;
    }
  ]);
  assert.deepEqual(results, [1, 2]);
  // Sequential execution means the first task finishes before the second starts.
  assert.deepEqual(order, ["a", "b"]);
});

test("series with empty list resolves to empty array", async () => {
  const results = await series([]);
  assert.deepEqual(results, []);
});

test("waterfall passes each result to the next and returns the last", async () => {
  const result = await waterfall([
    async () => 2,
    async (prev) => prev + 3,
    async (prev) => prev * 10
  ]);
  assert.equal(result, 50);
});

test("waterfall first task receives undefined", async () => {
  const result = await waterfall([
    async (input) => {
      assert.equal(input, undefined);
      return "ok";
    }
  ]);
  assert.equal(result, "ok");
});

test("waterfall with empty list resolves to undefined", async () => {
  const result = await waterfall([]);
  assert.equal(result, undefined);
});

test("mapAsync maps with item and index, preserving order", async () => {
  const results = await mapAsync([10, 20, 30], async (item, index) => {
    await delay(item === 10 ? 15 : 1);
    return item + index;
  });
  assert.deepEqual(results, [10, 21, 32]);
});

test("mapAsync with empty list resolves to empty array", async () => {
  const results = await mapAsync([], async (x) => x);
  assert.deepEqual(results, []);
});

test("mapLimit bounds concurrency and preserves order", async () => {
  let active = 0;
  let maxActive = 0;
  const items = [0, 1, 2, 3, 4, 5, 6];
  const results = await mapLimit(items, 3, async (item) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await delay(10);
    active -= 1;
    return item * 2;
  });
  assert.deepEqual(results, [0, 2, 4, 6, 8, 10, 12]);
  assert.ok(maxActive <= 3, `maxActive was ${maxActive}`);
});

test("mapLimit passes correct index to fn", async () => {
  const results = await mapLimit(["a", "b", "c"], 2, async (item, index) => {
    return `${item}${index}`;
  });
  assert.deepEqual(results, ["a0", "b1", "c2"]);
});

test("mapLimit with empty list resolves to empty array", async () => {
  const results = await mapLimit([], 4, async (x) => x);
  assert.deepEqual(results, []);
});

test("mapLimit clamps limit below 1 to at least 1", async () => {
  const results = await mapLimit([1, 2, 3], 0, async (item) => item + 1);
  assert.deepEqual(results, [2, 3, 4]);
});

test("mapLimit handles limit larger than list length", async () => {
  const results = await mapLimit([1, 2], 100, async (item) => item * 3);
  assert.deepEqual(results, [3, 6]);
});

test("mapLimit accepts iterables", async () => {
  const set = new Set([5, 6, 7]);
  const results = await mapLimit(set, 2, async (item) => item + 1);
  assert.deepEqual(results, [6, 7, 8]);
});

test("withTimeout mirrors resolved value when in time", async () => {
  const value = await withTimeout(delay(5, "done"), 100);
  assert.equal(value, "done");
});

test("withTimeout mirrors rejection when in time", async () => {
  await assert.rejects(
    () => withTimeout(Promise.reject(new Error("inner")), 100),
    /inner/
  );
});

test("withTimeout rejects with default message on timeout", async () => {
  await assert.rejects(
    () => withTimeout(delay(100, "late"), 10),
    /Operation timed out after 10ms/
  );
});

test("withTimeout rejects with custom message on timeout", async () => {
  await assert.rejects(
    () => withTimeout(delay(100, "late"), 10, "too slow"),
    /too slow/
  );
});

test("withTimeout accepts non-promise values", async () => {
  const value = await withTimeout(42, 100);
  assert.equal(value, 42);
});

test("allSettledMap returns fulfilled and rejected entries without rejecting", async () => {
  const results = await allSettledMap([1, 2, 3], async (item) => {
    if (item === 2) {
      throw new Error("fail-2");
    }
    return item * 10;
  });
  assert.equal(results.length, 3);
  assert.deepEqual(results[0], { status: "fulfilled", value: 10 });
  assert.equal(results[1].status, "rejected");
  assert.ok(results[1].reason instanceof Error);
  assert.match(results[1].reason.message, /fail-2/);
  assert.deepEqual(results[2], { status: "fulfilled", value: 30 });
});

test("allSettledMap passes item and index to fn", async () => {
  const results = await allSettledMap(["x", "y"], async (item, index) => `${item}${index}`);
  assert.deepEqual(results, [
    { status: "fulfilled", value: "x0" },
    { status: "fulfilled", value: "y1" }
  ]);
});

test("allSettledMap with empty list resolves to empty array", async () => {
  const results = await allSettledMap([], async (x) => x);
  assert.deepEqual(results, []);
});

test("allSettledMap accepts iterables", async () => {
  const set = new Set([1, 2]);
  const results = await allSettledMap(set, async (item) => item + 1);
  assert.deepEqual(results, [
    { status: "fulfilled", value: 2 },
    { status: "fulfilled", value: 3 }
  ]);
});
