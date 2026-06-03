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
import { existsSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { run } from "../src/runner.js";
import { fromPostman } from "../src/importers/postman.js";
import { fromOpenapi } from "../src/importers/openapi.js";
import { aiGenerateTests } from "../src/ai/generate.js";
import { toJUnit, toJSON } from "../src/reporters.js";

// Read the value following a flag in argv, or undefined.
function flag(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

// `two-go gen <postman|openapi> <file> [-o <out>]` generates a test suite from
// an API definition and writes it to <out> (or prints it to stdout).
if (process.argv[2] === "gen") {
  const type = process.argv[3];
  const input = process.argv[4];
  const oIndex = process.argv.indexOf("-o");
  const out = oIndex !== -1 ? process.argv[oIndex + 1] : null;

  if (!type || !input) {
    console.error("two-go: usage: two-go gen <postman|openapi> <file> [-o <out>]");
    process.exit(1);
  }
  if (!existsSync(input)) {
    console.error(`two-go: input "${input}" does not exist`);
    process.exit(1);
  }

  let spec;
  try {
    spec = JSON.parse(readFileSync(input, "utf8"));
  } catch (err) {
    console.error(`two-go: could not parse "${input}" as JSON: ${err.message}`);
    process.exit(1);
  }

  let code;
  if (type === "postman") code = fromPostman(spec);
  else if (type === "openapi") code = fromOpenapi(spec);
  else {
    console.error(`two-go: unknown gen type "${type}" (expected "postman" or "openapi")`);
    process.exit(1);
  }

  if (out) {
    writeFileSync(out, code, "utf8");
    console.log(`two-go: wrote ${out}`);
  } else {
    process.stdout.write(code);
  }
  process.exit(0);
}

// `two-go ai gen <url|file.json> [-o out] [--provider p] [--model m]` asks an
// LLM to generate a suite from a live endpoint or a sample response.
if (process.argv[2] === "ai" && process.argv[3] === "gen") {
  const input = process.argv[4];
  const out = flag("-o");
  const opts = { provider: flag("--provider"), model: flag("--model") };

  if (!input) {
    console.error(
      "two-go: usage: two-go ai gen <url|file.json> [-o out] [--provider openai|anthropic] [--model m]"
    );
    process.exit(1);
  }

  if (/^https?:\/\//i.test(input)) {
    opts.endpoint = input;
    opts.baseUrl = new URL(input).origin;
    try {
      const r = await fetch(input);
      const body = await r.text();
      try {
        opts.sample = JSON.parse(body);
      } catch {
        opts.sample = body;
      }
    } catch (err) {
      console.error(`two-go: could not fetch ${input}: ${err.message}`);
      process.exit(1);
    }
  } else {
    if (!existsSync(input)) {
      console.error(`two-go: input "${input}" does not exist`);
      process.exit(1);
    }
    const raw = readFileSync(input, "utf8");
    try {
      opts.sample = JSON.parse(raw);
    } catch {
      opts.sample = raw;
    }
  }

  let code;
  try {
    code = await aiGenerateTests(opts);
  } catch (err) {
    console.error(`two-go: ${err.message}`);
    process.exit(1);
  }

  if (out) {
    writeFileSync(out, code, "utf8");
    console.log(`two-go: wrote ${out}`);
  } else {
    process.stdout.write(code);
  }
  process.exit(0);
}

// The directory is the first non-flag argument; default to "test".
const target = process.argv[2] && !process.argv[2].startsWith("-") ? process.argv[2] : "test";
const root = resolve(process.cwd(), target);

if (!existsSync(root)) {
  console.error(`two-go: target "${target}" does not exist`);
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
  console.error(`two-go: no *.twogo.mjs test files found under "${target}"`);
  process.exit(1);
}

files.sort();
console.log(`two-go: found ${files.length} test file(s)`);

// Importing each file runs its top-level suite() calls.
for (const file of files) {
  await import(pathToFileURL(file).href);
}

const result = await run();

// Optional machine-readable report: --reporter junit|json [--out file].
const reporter = flag("--reporter");
if (reporter === "junit" || reporter === "json") {
  const report = reporter === "junit" ? toJUnit(result) : toJSON(result);
  const out = flag("--out");
  if (out) {
    writeFileSync(out, report, "utf8");
    console.log(`two-go: wrote ${out}`);
  } else {
    process.stdout.write(report);
  }
}

process.exit(result.failed > 0 ? 1 : 0);
