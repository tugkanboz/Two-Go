// Reporters for the built-in runner. Pass the object returned by run()
// (which carries a `tests` array) and get a CI-friendly string back.

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );
}

function seconds(ms) {
  return ((ms || 0) / 1000).toFixed(3);
}

// Produce JUnit XML from a run() result. Tests are grouped by suite.
export function toJUnit(result) {
  const tests = (result && result.tests) || [];
  const bySuite = new Map();
  for (const t of tests) {
    if (!bySuite.has(t.suite)) bySuite.set(t.suite, []);
    bySuite.get(t.suite).push(t);
  }

  const totalFailures = tests.filter((t) => t.status === "failed").length;
  const totalTime = seconds(tests.reduce((a, t) => a + (t.durationMs || 0), 0));

  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<testsuites tests="${tests.length}" failures="${totalFailures}" time="${totalTime}">`);
  for (const [suite, list] of bySuite) {
    const failures = list.filter((t) => t.status === "failed").length;
    const time = seconds(list.reduce((a, t) => a + (t.durationMs || 0), 0));
    lines.push(`  <testsuite name="${escapeXml(suite)}" tests="${list.length}" failures="${failures}" time="${time}">`);
    for (const t of list) {
      const open = `    <testcase name="${escapeXml(t.name)}" classname="${escapeXml(suite)}" time="${seconds(t.durationMs)}">`;
      if (t.status === "failed") {
        lines.push(open);
        lines.push(`      <failure message="${escapeXml(t.error || "assertion failed")}"></failure>`);
        lines.push("    </testcase>");
      } else {
        lines.push(open + "</testcase>");
      }
    }
    lines.push("  </testsuite>");
  }
  lines.push("</testsuites>");
  return lines.join("\n") + "\n";
}

// Produce a JSON report from a run() result.
export function toJSON(result) {
  const tests = (result && result.tests) || [];
  return (
    JSON.stringify(
      {
        passed: result ? result.passed : 0,
        failed: result ? result.failed : 0,
        total: tests.length,
        tests,
      },
      null,
      2
    ) + "\n"
  );
}
