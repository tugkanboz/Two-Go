// Public entry point for twogo. The default export is the go() factory.

import { GoClient, RequestBuilder } from "./client.js";
import { GoResponse } from "./response.js";
import { AssertionError, resolvePath, matches, deepEqual } from "./assertions.js";
import { suite, run, reset } from "./runner.js";

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
};

export default go;
