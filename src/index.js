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

// Differentiating features (API-testing specific, beyond a utility belt).
import { soft, softly } from "./soft.js";
import { eventually, pollUntil, retryUntil } from "./eventually.js";
import { toMatchSnapshot, matchSnapshot, readSnapshot } from "./snapshot.js";
import { session } from "./session.js";
import { faker } from "./faker.js";
import {
  parallel,
  parallelLimit,
  series,
  waterfall,
  mapAsync,
  mapLimit,
  withTimeout,
  allSettledMap,
} from "./async.js";
// curl.js also augments RequestBuilder.prototype.toCurl on import.
import { toCurl, enableLogging } from "./curl.js";
// infer-schema.js also augments GoResponse.prototype.toSchema on import.
import { inferSchema } from "./infer-schema.js";
import { fromPostman } from "./importers/postman.js";
import { fromOpenapi } from "./importers/openapi.js";
import { createProvider } from "./ai/provider.js";
import { aiGenerateTests } from "./ai/generate.js";
import { explainFailure } from "./ai/explain.js";

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
  // differentiators
  soft,
  softly,
  eventually,
  pollUntil,
  retryUntil,
  toMatchSnapshot,
  matchSnapshot,
  readSnapshot,
  session,
  faker,
  parallel,
  parallelLimit,
  series,
  waterfall,
  mapAsync,
  mapLimit,
  withTimeout,
  allSettledMap,
  toCurl,
  enableLogging,
  inferSchema,
  fromPostman,
  fromOpenapi,
  createProvider,
  aiGenerateTests,
  explainFailure,
};

// Also expose the utility belt under the `utils` name.
export * as utils from "./utils/index.js";

export default go;
