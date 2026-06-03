// A tiny BDD layer, runner agnostic. given/when/then/and build step objects
// that share a `world`. scenario(steps) returns an async function you hand to
// your test runner's test() (node:test, Jest, Vitest, Mocha). This module does
// not import any runner, and two-go's throwing assertions decide pass or fail.

const makeStep = (kind) => (text, run) => ({ kind, text, run });

/** A "Given" step: set up state on the world. */
export const given = makeStep("Given");
/** A "When" step: perform the action, usually stashing a response on the world. */
export const when = makeStep("When");
/** A "Then" step: assert on what the When produced. */
export const then = makeStep("Then");
/** An "And" step: continue the previous Given/When/Then. */
export const and = makeStep("And");

// Turn a list of steps into an async function. Steps run in order and share a
// `world` object. options.world seeds the world; options.log(line) receives
// each step's "Given ..." description if you want to print it.
export function scenario(steps, options = {}) {
  return async function runScenario() {
    const world = options.world ? { ...options.world } : {};
    for (const step of steps) {
      if (typeof options.log === "function") options.log(`${step.kind} ${step.text}`);
      await step.run(world);
    }
    return world;
  };
}

// Build a labelled list of scenarios from a feature definition, so you can loop
// and register each one with your runner:
//
//   for (const s of feature("Login", { "valid creds": [given(...), ...] })) {
//     test(s.name, s.run);
//   }
export function feature(name, scenarios, options = {}) {
  return Object.entries(scenarios).map(([title, steps]) => ({
    name: `${name}: ${title}`,
    run: scenario(steps, options),
  }));
}
