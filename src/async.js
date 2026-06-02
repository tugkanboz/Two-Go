// async.js - Async control-flow helpers (parallel, bounded concurrency, series,
// waterfall, async map, timeout, settled map). Zero dependencies, ESM only.

/** Runs all thunks concurrently and resolves to an ordered array; rejects on the first error. */
export async function parallel(tasks) {
  return Promise.all(tasks.map((task) => task()));
}

/** Runs thunks with bounded concurrency, never exceeding "limit" at once, preserving result order. */
export async function parallelLimit(tasks, limit) {
  return mapLimit(tasks, limit, (task) => task());
}

/** Runs thunks sequentially and resolves to an ordered array of their results. */
export async function series(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

/** Runs thunks sequentially, passing each result to the next; resolves to the last result. */
export async function waterfall(tasks) {
  let result;
  let first = true;
  for (const task of tasks) {
    result = first ? await task() : await task(result);
    first = false;
  }
  return result;
}

/** Concurrent map; calls fn(item, index) -> promise for each item, preserving order. */
export async function mapAsync(items, fn) {
  return Promise.all(items.map((item, index) => fn(item, index)));
}

/** Bounded-concurrency map; never runs more than "limit" calls of fn(item, index) at once, preserving order. */
export async function mapLimit(items, limit, fn) {
  const list = Array.from(items);
  const results = new Array(list.length);
  if (list.length === 0) {
    return results;
  }

  const max = Math.max(1, Math.min(limit, list.length));
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      if (index >= list.length) {
        return;
      }
      nextIndex += 1;
      results[index] = await fn(list[index], index);
    }
  }

  const workers = [];
  for (let i = 0; i < max; i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

/** Rejects with Error(message) if the promise does not settle within ms; otherwise mirrors the promise. */
export function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new Error(message != null ? message : `Operation timed out after ${ms}ms`));
    }, ms);

    Promise.resolve(promise).then(
      (value) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/** Runs fn over every item and resolves to an array of { status, value } or { status, reason }, never rejecting. */
export async function allSettledMap(items, fn) {
  const list = Array.from(items);
  return Promise.all(
    list.map(async (item, index) => {
      try {
        const value = await fn(item, index);
        return { status: "fulfilled", value };
      } catch (reason) {
        return { status: "rejected", reason };
      }
    })
  );
}
