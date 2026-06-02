#!/usr/bin/env node
// twogo CLI. Discovers test files, imports them (each file calls suite()),
// then runs the collected suites through the standalone runner.
//
// Usage:
//   twogo [dir]
//
// Discovers "*.twogo.mjs" (and the legacy "*.2go.mjs") files recursively under
// the given directory (defaults to "test"), imports each one, then runs them.

import { readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { run } from "../src/runner.js";

const target = process.argv[2] || "test";
const root = resolve(process.cwd(), target);

if (!existsSync(root)) {
  console.error(`twogo: target "${target}" does not exist`);
  process.exit(1);
}

// Recursively collect matching test files.
async function collect(dir) {
  const found = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      found.push(...(await collect(full)));
    } else if (/\.(twogo|2go)\.mjs$/.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

let files;
if (statSync(root).isDirectory()) {
  files = await collect(root);
} else {
  files = /\.(twogo|2go)\.mjs$/.test(root) ? [root] : [];
}

if (files.length === 0) {
  console.error(`twogo: no *.twogo.mjs test files found under "${target}"`);
  process.exit(1);
}

files.sort();
console.log(`twogo: found ${files.length} test file(s)`);

// Importing each file runs its top-level suite() calls.
for (const file of files) {
  await import(pathToFileURL(file).href);
}

const { failed } = await run();
process.exit(failed > 0 ? 1 : 0);
