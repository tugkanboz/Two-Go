// Unit tests for the runner-agnostic BDD layer.
import { test } from "node:test";
import assert from "node:assert/strict";

import { scenario, feature, given, when, then, and } from "../../src/bdd.js";

test("step builders carry a kind, text, and run", () => {
  const g = given("a thing", () => {});
  assert.equal(g.kind, "Given");
  assert.equal(g.text, "a thing");
  assert.equal(typeof g.run, "function");
  assert.equal(when("x", () => {}).kind, "When");
  assert.equal(then("x", () => {}).kind, "Then");
  assert.equal(and("x", () => {}).kind, "And");
});

test("scenario runs steps in order sharing one world", async () => {
  const order = [];
  const run = scenario([
    given("seed", (w) => { w.n = 1; order.push("g"); }),
    when("increment", (w) => { w.n += 1; order.push("w"); }),
    then("assert", (w) => { assert.equal(w.n, 2); order.push("t"); }),
  ]);
  const world = await run();
  assert.deepEqual(order, ["g", "w", "t"]);
  assert.equal(world.n, 2);
});

test("scenario awaits async steps", async () => {
  const run = scenario([
    when("async work", async (w) => { w.value = await Promise.resolve(42); }),
    then("value is set", (w) => assert.equal(w.value, 42)),
  ]);
  await run();
});

test("a throwing step rejects the scenario", async () => {
  const run = scenario([
    then("fails", () => { throw new Error("boom"); }),
  ]);
  await assert.rejects(run, /boom/);
});

test("scenario can seed the world and log step lines", async () => {
  const lines = [];
  const run = scenario(
    [given("uses seed", (w) => assert.equal(w.base, 10))],
    { world: { base: 10 }, log: (line) => lines.push(line) }
  );
  await run();
  assert.deepEqual(lines, ["Given uses seed"]);
});

test("feature builds a labelled, runnable list", async () => {
  const built = feature("Math", {
    "adds": [given("a", (w) => { w.a = 2; }), then("ok", (w) => assert.equal(w.a, 2))],
    "subtracts": [then("ok", () => {})],
  });
  assert.equal(built.length, 2);
  assert.equal(built[0].name, "Math: adds");
  assert.equal(built[1].name, "Math: subtracts");
  await built[0].run();
  await built[1].run();
});
