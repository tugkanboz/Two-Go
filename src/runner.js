// Minimal standalone test runner. Suites register tests into a global
// registry; run() executes them with before/after hooks and prints results.

const registry = [];

// Define a suite. The callback receives { test, before, after } helpers.
export function suite(name, fn) {
  const suiteEntry = {
    name,
    tests: [],
    beforeHooks: [],
    afterHooks: [],
  };

  const api = {
    test(testName, testFn) {
      suiteEntry.tests.push({ name: testName, fn: testFn });
    },
    before(hookFn) {
      suiteEntry.beforeHooks.push(hookFn);
    },
    after(hookFn) {
      suiteEntry.afterHooks.push(hookFn);
    },
  };

  fn(api);
  registry.push(suiteEntry);
  return suiteEntry;
}

// ANSI colors. Disabled automatically when not writing to a TTY or when
// NO_COLOR is set.
const useColor = process.stdout && process.stdout.isTTY && !process.env.NO_COLOR;
const green = (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
const red = (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);
const dim = (s) => (useColor ? `\x1b[2m${s}\x1b[0m` : s);

// Run all registered suites. Returns { passed, failed, tests } where tests is
// a flat list of { suite, name, status, durationMs, error } for reporters.
export async function run() {
  let passed = 0;
  let failed = 0;
  const tests = [];

  for (const s of registry) {
    console.log(`\n${s.name}`);

    for (const hook of s.beforeHooks) {
      await hook();
    }

    for (const t of s.tests) {
      const start = performance.now();
      try {
        await t.fn();
        const ms = Math.round(performance.now() - start);
        console.log(`  ${green("✓")} ${t.name} ${dim(`(${ms}ms)`)}`);
        passed++;
        tests.push({ suite: s.name, name: t.name, status: "passed", durationMs: ms, error: null });
      } catch (err) {
        const ms = Math.round(performance.now() - start);
        console.log(`  ${red("✗")} ${t.name} ${dim(`(${ms}ms)`)}`);
        const message = err && err.message ? err.message : String(err);
        console.log(`    ${red(message)}`);
        failed++;
        tests.push({ suite: s.name, name: t.name, status: "failed", durationMs: ms, error: message });
      }
    }

    for (const hook of s.afterHooks) {
      await hook();
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }

  return { passed, failed, tests };
}

// Clear the registry. Useful for tests that drive the runner themselves.
export function reset() {
  registry.length = 0;
}
