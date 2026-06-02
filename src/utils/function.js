// Function utilities for control flow and timing: debounce, throttle, once,
// memoize, curry, partial application, delay/defer, sleep, retry, and small
// combinators (flip, negate, wrap, after, before). Zero dependencies.

// Debounce a function so it only fires after `wait` ms have passed since the
// last call. Supports { leading, trailing } edges. Returns a function with a
// .cancel() method to clear any pending invocation.
export function debounce(fn, wait, options = {}) {
  const leading = options.leading === true;
  const trailing = options.trailing !== false;

  let timer = null;
  let lastArgs = null;
  let lastThis = null;
  let result;

  function invoke() {
    const args = lastArgs;
    const context = lastThis;
    lastArgs = null;
    lastThis = null;
    result = fn.apply(context, args);
    return result;
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    const callNow = leading && timer === null;

    if (timer !== null) clearTimeout(timer);

    timer = setTimeout(() => {
      timer = null;
      if (trailing && lastArgs !== null) invoke();
    }, wait);

    if (callNow) return invoke();
    return result;
  }

  // Cancel any scheduled trailing invocation and reset internal state.
  debounced.cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    lastArgs = null;
    lastThis = null;
  };

  return debounced;
}

// Throttle a function so it fires at most once per `wait` ms. Supports
// { leading, trailing } edges. Returns a function with a .cancel() method.
export function throttle(fn, wait, options = {}) {
  const leading = options.leading !== false;
  const trailing = options.trailing !== false;

  let timer = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCallTime = 0;
  let result;

  function invoke(time) {
    lastCallTime = time;
    const args = lastArgs;
    const context = lastThis;
    lastArgs = null;
    lastThis = null;
    result = fn.apply(context, args);
    return result;
  }

  function throttled(...args) {
    const now = Date.now();
    if (lastCallTime === 0 && !leading) lastCallTime = now;

    const remaining = wait - (now - lastCallTime);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      return invoke(now);
    }

    if (timer === null && trailing) {
      timer = setTimeout(() => {
        timer = null;
        lastCallTime = leading ? Date.now() : 0;
        if (lastArgs !== null) invoke(Date.now());
      }, remaining);
    }

    return result;
  }

  // Cancel any scheduled trailing invocation and reset internal state.
  throttled.cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
  };

  return throttled;
}

// Create a function that invokes `fn` at most once. Subsequent calls return
// the value from the first invocation.
export function once(fn) {
  let called = false;
  let result;

  return function onced(...args) {
    if (called) return result;
    called = true;
    result = fn.apply(this, args);
    return result;
  };
}

// Memoize `fn`, caching results keyed by the first argument or by the value
// returned from an optional `resolver`. The cache is exposed as `.cache`.
export function memoize(fn, resolver) {
  const cache = new Map();

  function memoized(...args) {
    const key = typeof resolver === "function" ? resolver.apply(this, args) : args[0];
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  }

  memoized.cache = cache;
  return memoized;
}

// Curry `fn` so it can be called with fewer arguments than its arity, returning
// a new function until all arguments have been supplied. Defaults to fn.length.
export function curry(fn, arity = fn.length) {
  function curried(...args) {
    if (args.length >= arity) return fn.apply(this, args);
    return function next(...more) {
      return curried.apply(this, args.concat(more));
    };
  }

  return curried;
}

// Create a function that invokes `fn` with `args` prepended to the arguments
// it receives.
export function partial(fn, ...args) {
  return function partialled(...rest) {
    return fn.apply(this, args.concat(rest));
  };
}

// Create a function that invokes `fn` with `args` appended to the arguments
// it receives.
export function partialRight(fn, ...args) {
  return function partialledRight(...rest) {
    return fn.apply(this, rest.concat(args));
  };
}

// Invoke `fn` after `ms` milliseconds with the given args. Returns the timer id
// so the caller can clear it.
export function delay(fn, ms, ...args) {
  return setTimeout(() => {
    fn(...args);
  }, ms);
}

// Defer invoking `fn` until the current call stack has cleared (0ms timeout).
// Returns the timer id.
export function defer(fn, ...args) {
  return delay(fn, 0, ...args);
}

// Return a Promise that resolves after `ms` milliseconds.
export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Retry an async (or sync) function until it succeeds or attempts are
// exhausted. Options: { retries=3, delay=0, factor=1, onError? }. Waits
// `delay` ms between attempts, multiplying by `factor` each time. Resolves
// with the function's value or throws the last error encountered.
export async function retry(fn, options = {}) {
  const retries = options.retries ?? 3;
  const factor = options.factor ?? 1;
  const onError = options.onError;
  let wait = options.delay ?? 0;

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (typeof onError === "function") onError(error, attempt);
      if (attempt === retries) break;
      if (wait > 0) await sleep(wait);
      wait *= factor;
      attempt += 1;
    }
  }

  throw lastError;
}

// Create a function that invokes `fn` with its first two arguments flipped.
export function flip(fn) {
  return function flipped(a, b, ...rest) {
    return fn.call(this, b, a, ...rest);
  };
}

// Create a function that negates the boolean result of `predicate`.
export function negate(predicate) {
  return function negated(...args) {
    return !predicate.apply(this, args);
  };
}

// Wrap `value` with `wrapper`, calling wrapper(value, ...args) when invoked.
export function wrap(value, wrapper) {
  return function wrapped(...args) {
    return wrapper.call(this, value, ...args);
  };
}

// Create a function that invokes `fn` only once it has been called `n` or more
// times. Returns undefined for earlier calls.
export function after(n, fn) {
  let count = 0;
  return function afterFn(...args) {
    count += 1;
    if (count >= n) return fn.apply(this, args);
    return undefined;
  };
}

// Create a function that invokes `fn` while it has been called fewer than `n`
// times. After the limit, returns the result of the last allowed invocation.
export function before(n, fn) {
  let count = 0;
  let result;
  return function beforeFn(...args) {
    count += 1;
    if (count < n) {
      result = fn.apply(this, args);
    }
    return result;
  };
}
