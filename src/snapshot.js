// snapshot.js - JSON snapshot testing for responses and arbitrary values.
// Stores values as pretty-printed JSON files and deep-compares on later runs.

import fs from "node:fs";
import path from "node:path";
import { isEqual } from "./utils/lang.js";
import { AssertionError } from "./assertions.js";

/** Resolves the snapshot file path for a given name and options. */
function snapshotPath(name, options = {}) {
  const dir = options.dir === undefined ? "__snapshots__" : options.dir;
  return path.join(dir, name + ".json");
}

/** Returns true when update mode is active via option or environment variable. */
function shouldUpdate(options = {}) {
  if (options.update === true) {
    return true;
  }
  return Boolean(process.env.TWO_GO_UPDATE_SNAPSHOTS);
}

/** Writes the value to the snapshot file, creating parent directories as needed. */
function writeSnapshot(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

/** Reads and parses a stored snapshot by name, or returns undefined when missing. */
export function readSnapshot(name, options = {}) {
  const file = snapshotPath(name, options);
  if (!fs.existsSync(file)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Compares a value against a stored snapshot, creating or updating the file as appropriate. */
export function toMatchSnapshot(value, name, options = {}) {
  const file = snapshotPath(name, options);

  // Normalize the value through JSON so comparisons match the stored form.
  const normalized = JSON.parse(JSON.stringify(value));

  if (shouldUpdate(options) || !fs.existsSync(file)) {
    writeSnapshot(file, normalized);
    return normalized;
  }

  const stored = JSON.parse(fs.readFileSync(file, "utf8"));

  if (!isEqual(normalized, stored)) {
    const expectedJson = JSON.stringify(stored, null, 2);
    const actualJson = JSON.stringify(normalized, null, 2);
    throw new AssertionError(
      "Snapshot mismatch for \"" + name + "\".\n" +
        "Expected (stored):\n" + expectedJson + "\n" +
        "Actual (received):\n" + actualJson,
      { expected: stored, actual: normalized }
    );
  }

  return normalized;
}

/** Alias for toMatchSnapshot. */
export const matchSnapshot = toMatchSnapshot;
