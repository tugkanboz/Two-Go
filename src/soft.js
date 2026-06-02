// Soft assertions: collect all failures instead of failing fast. A soft()
// instance exposes the same matcher names as Expectation, but each matcher runs
// inside try/catch, recording any failure message and returning the wrapper so
// chaining continues. verify() throws once with every collected failure.

import { expect, Expectation } from "./expect.js";
import { AssertionError } from "./assertions.js";

// Matcher method names taken directly from Expectation.prototype so the soft
// wrapper stays in sync with expect.js. Excludes the constructor and accessor
// getters such as "not", "resolves", and "rejects".
const MATCHER_NAMES = Object.getOwnPropertyNames(Expectation.prototype).filter(
  (name) => {
    if (name === "constructor") return false;
    const descriptor = Object.getOwnPropertyDescriptor(Expectation.prototype, name);
    return descriptor && typeof descriptor.value === "function";
  }
);

// Build a soft wrapper around a value. `negated` mirrors Expectation's "not"
// state and `failures` is the shared array collecting messages for one soft()
// instance.
function makeSoftWrapper(value, negated, failures) {
  const wrapper = {};

  for (const name of MATCHER_NAMES) {
    wrapper[name] = (...args) => {
      try {
        let expectation = expect(value);
        if (negated) expectation = expectation.not;
        expectation[name](...args);
      } catch (err) {
        failures.push(err && err.message ? err.message : String(err));
      }
      return wrapper;
    };
  }

  // Negated view: returns a soft wrapper sharing the same failures array.
  Object.defineProperty(wrapper, "not", {
    get() {
      return makeSoftWrapper(value, !negated, failures);
    }
  });

  return wrapper;
}

// Create a soft assertion context. Returns { expect, verify, failures } where
// expect(value) yields a chainable soft wrapper, failures holds recorded
// messages, and verify() throws a single AssertionError if any were recorded.
export function soft() {
  const failures = [];

  // Wrap a value in a soft wrapper bound to this context's failures array.
  const softExpect = (value) => makeSoftWrapper(value, false, failures);

  // Throw a single AssertionError listing all collected failures (numbered).
  // Does nothing when there are no failures.
  const verify = () => {
    if (failures.length === 0) return;
    const lines = failures.map((message, index) => `${index + 1}) ${message}`);
    const message = `${failures.length} soft assertion${
      failures.length === 1 ? "" : "s"
    } failed:\n${lines.join("\n")}`;
    throw new AssertionError(message, { expected: undefined, actual: failures });
  };

  return { expect: softExpect, verify, failures };
}

// Run `fn` with a soft context, passing the soft expect as the first argument
// and the full soft instance as the second, then verify() so all failures
// surface together. Returns nothing on success.
export function softly(fn) {
  const instance = soft();
  fn(instance.expect, instance);
  instance.verify();
}
