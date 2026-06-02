// Public entry point for two-go. The default export is the go() factory.

import { GoClient, RequestBuilder } from "./client.js";
import { GoResponse } from "./response.js";
import { AssertionError, resolvePath, matches, deepEqual } from "./assertions.js";
import { suite, run, reset } from "./runner.js";
import { expect, Expectation } from "./expect.js";
import { validate, isValid } from "./schema.js";
import { chain } from "./utils/chain.js";

// Side-effect import: augments GoResponse.prototype with the extra HTTP
// assertions (expectClientError, expectJsonSchema, expectValue, ...).
import "./http-assertions.js";

// Namespace of all lodash-inspired utilities, available as both `_` and `utils`.
import * as _ from "./utils/index.js";

// Factory. Accepts a base URL string or an options object.
export function go(optionsOrBaseURL) {
  if (typeof optionsOrBaseURL === "string") {
    return new GoClient({ baseURL: optionsOrBaseURL });
  }
  return new GoClient(optionsOrBaseURL || {});
}

export {
  GoClient,
  RequestBuilder,
  GoResponse,
  AssertionError,
  resolvePath,
  matches,
  deepEqual,
  suite,
  run,
  reset,
  expect,
  Expectation,
  validate,
  isValid,
  chain,
  _,
};

// Also expose the utility belt under the `utils` name.
export * as utils from "./utils/index.js";

export default go;
