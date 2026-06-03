// Unit tests for the JUnit and JSON reporters.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toJUnit, toJSON } from "../../src/reporters.js";

const sample = {
  passed: 2,
  failed: 1,
  tests: [
    { suite: "users", name: "lists users", status: "passed", durationMs: 12, error: null },
    { suite: "users", name: "creates a user", status: "passed", durationMs: 8, error: null },
    { suite: "auth", name: "rejects bad password", status: "failed", durationMs: 5, error: "expected 401 but got 200 <oops>" },
  ],
};

test("toJUnit produces well-formed grouped XML with failures and escaping", () => {
  const xml = toJUnit(sample);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<testsuites tests="3" failures="1"/);
  assert.match(xml, /<testsuite name="users" tests="2" failures="0"/);
  assert.match(xml, /<testsuite name="auth" tests="1" failures="1"/);
  assert.match(xml, /<testcase name="lists users" classname="users"[^>]*><\/testcase>/);
  assert.match(xml, /<failure message="expected 401 but got 200 &lt;oops&gt;">/);
});

test("toJSON produces a structured report", () => {
  const report = JSON.parse(toJSON(sample));
  assert.equal(report.passed, 2);
  assert.equal(report.failed, 1);
  assert.equal(report.total, 3);
  assert.equal(report.tests.length, 3);
  assert.equal(report.tests[2].status, "failed");
});

test("reporters handle an empty result", () => {
  const xml = toJUnit({ passed: 0, failed: 0, tests: [] });
  assert.match(xml, /<testsuites tests="0" failures="0"/);
  assert.equal(JSON.parse(toJSON({ passed: 0, failed: 0, tests: [] })).total, 0);
});
