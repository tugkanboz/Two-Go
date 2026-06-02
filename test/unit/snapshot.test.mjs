// Unit tests for src/snapshot.js - JSON snapshot testing helpers.
// Each test uses a fresh temp directory (via the "dir" option) and cleans up,
// so nothing is ever written into the repository.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  readSnapshot,
  toMatchSnapshot,
  matchSnapshot
} from "../../src/snapshot.js";

// Creates a fresh temp directory and returns its path.
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "two-go-snap-"));
}

// Removes a temp directory recursively, ignoring errors.
function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// Ensures the update env var is not leaking between tests.
function clearUpdateEnv() {
  delete process.env.TWO_GO_UPDATE_SNAPSHOTS;
}

test("readSnapshot returns undefined when the file is missing", () => {
  const dir = makeTempDir();
  try {
    const result = readSnapshot("does-not-exist", { dir });
    assert.equal(result, undefined);
  } finally {
    cleanup(dir);
  }
});

test("toMatchSnapshot creates the snapshot file on first run", () => {
  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    const value = { name: "Alice", roles: ["admin", "user"], age: 30 };
    const returned = toMatchSnapshot(value, "user", { dir });

    // Returns the normalized value.
    assert.deepEqual(returned, value);

    // File exists on disk under dir/<name>.json.
    const file = path.join(dir, "user.json");
    assert.ok(fs.existsSync(file));

    // Stored content is pretty-printed JSON (2-space indent).
    const raw = fs.readFileSync(file, "utf8");
    assert.equal(raw, JSON.stringify(value, null, 2));
  } finally {
    cleanup(dir);
  }
});

test("toMatchSnapshot passes when value matches the stored snapshot", () => {
  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    const value = { a: 1, b: [1, 2, 3], c: { nested: true } };
    toMatchSnapshot(value, "match", { dir });

    // Second call with an equal value must not throw.
    assert.doesNotThrow(() => {
      toMatchSnapshot({ a: 1, b: [1, 2, 3], c: { nested: true } }, "match", { dir });
    });
  } finally {
    cleanup(dir);
  }
});

test("toMatchSnapshot throws AssertionError on mismatch", () => {
  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    toMatchSnapshot({ value: 1 }, "mismatch", { dir });

    assert.throws(
      () => toMatchSnapshot({ value: 2 }, "mismatch", { dir }),
      (err) => {
        assert.equal(err.name, "AssertionError");
        assert.match(err.message, /Snapshot mismatch for "mismatch"/);
        // Carries expected (stored) and actual (received) values.
        assert.deepEqual(err.expected, { value: 1 });
        assert.deepEqual(err.actual, { value: 2 });
        return true;
      }
    );
  } finally {
    cleanup(dir);
  }
});

test("toMatchSnapshot with update:true overwrites a mismatched snapshot", () => {
  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    toMatchSnapshot({ value: 1 }, "upd", { dir });

    // Update mode rewrites instead of throwing.
    const returned = toMatchSnapshot({ value: 99 }, "upd", { dir, update: true });
    assert.deepEqual(returned, { value: 99 });

    // Stored file now reflects the updated value.
    const stored = readSnapshot("upd", { dir });
    assert.deepEqual(stored, { value: 99 });
  } finally {
    cleanup(dir);
  }
});

test("update mode is honored via the TWO_GO_UPDATE_SNAPSHOTS env var", () => {
  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    toMatchSnapshot({ value: "old" }, "env", { dir });

    process.env.TWO_GO_UPDATE_SNAPSHOTS = "1";
    try {
      const returned = toMatchSnapshot({ value: "new" }, "env", { dir });
      assert.deepEqual(returned, { value: "new" });
      assert.deepEqual(readSnapshot("env", { dir }), { value: "new" });
    } finally {
      clearUpdateEnv();
    }
  } finally {
    cleanup(dir);
  }
});

test("toMatchSnapshot normalizes values through JSON (undefined fields dropped)", () => {
  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    const value = { keep: 1, drop: undefined, fn: () => {} };
    const returned = toMatchSnapshot(value, "normalize", { dir });

    // undefined-valued keys and functions are removed by JSON serialization.
    assert.deepEqual(returned, { keep: 1 });
    assert.deepEqual(readSnapshot("normalize", { dir }), { keep: 1 });

    // A subsequent equal comparison (with the same droppable fields) passes.
    assert.doesNotThrow(() => {
      toMatchSnapshot({ keep: 1, drop: undefined }, "normalize", { dir });
    });
  } finally {
    cleanup(dir);
  }
});

test("toMatchSnapshot creates nested parent directories as needed", () => {
  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    const nestedDir = path.join(dir, "deep", "nested");
    toMatchSnapshot({ ok: true }, "child", { dir: nestedDir });

    const file = path.join(nestedDir, "child.json");
    assert.ok(fs.existsSync(file));
  } finally {
    cleanup(dir);
  }
});

test("toMatchSnapshot supports primitive and array top-level values", () => {
  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    assert.equal(toMatchSnapshot(42, "num", { dir }), 42);
    assert.equal(toMatchSnapshot("hello", "str", { dir }), "hello");
    assert.deepEqual(toMatchSnapshot([1, 2, 3], "arr", { dir }), [1, 2, 3]);

    // Re-running matches without throwing.
    assert.doesNotThrow(() => toMatchSnapshot(42, "num", { dir }));
    assert.doesNotThrow(() => toMatchSnapshot([1, 2, 3], "arr", { dir }));

    // Mismatch on a primitive still throws.
    assert.throws(() => toMatchSnapshot(43, "num", { dir }), { name: "AssertionError" });
  } finally {
    cleanup(dir);
  }
});

test("matchSnapshot is an alias for toMatchSnapshot", () => {
  assert.equal(matchSnapshot, toMatchSnapshot);

  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    const returned = matchSnapshot({ aliased: true }, "alias", { dir });
    assert.deepEqual(returned, { aliased: true });
    assert.ok(fs.existsSync(path.join(dir, "alias.json")));
  } finally {
    cleanup(dir);
  }
});

test("array element order matters for snapshot equality", () => {
  const dir = makeTempDir();
  clearUpdateEnv();
  try {
    toMatchSnapshot([1, 2, 3], "order", { dir });
    assert.throws(
      () => toMatchSnapshot([3, 2, 1], "order", { dir }),
      { name: "AssertionError" }
    );
  } finally {
    cleanup(dir);
  }
});
