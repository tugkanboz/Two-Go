// GoClient performs requests via native fetch and returns a GoResponse.
// RequestBuilder is a thenable, chainable description of a single request
// together with a queue of assertions to run once the response arrives.

import { GoResponse } from "./response.js";

export class GoClient {
  constructor({ baseURL = "", headers = {}, timeout = 30000 } = {}) {
    // Strip a single trailing slash from the base URL.
    this.baseURL = String(baseURL).replace(/\/+$/, "");
    this.timeout = timeout;

    // Lowercase default header keys for consistent merging.
    this.headers = {};
    for (const [key, value] of Object.entries(headers)) {
      this.headers[key.toLowerCase()] = value;
    }
  }

  get(path) { return new RequestBuilder(this, "GET", path); }
  put(path) { return new RequestBuilder(this, "PUT", path); }
  post(path) { return new RequestBuilder(this, "POST", path); }
  patch(path) { return new RequestBuilder(this, "PATCH", path); }
  delete(path) { return new RequestBuilder(this, "DELETE", path); }
  head(path) { return new RequestBuilder(this, "HEAD", path); }
  options(path) { return new RequestBuilder(this, "OPTIONS", path); }

  // Execute a RequestBuilder and resolve it into a GoResponse.
  async send(req) {
    const url = this.#buildURL(req);

    // Merge default headers with per-request headers (all lowercase keys).
    const headers = { ...this.headers, ...req._headers };

    const controller = new AbortController();
    const timeout = req._timeout ?? this.timeout;
    const timer = setTimeout(() => controller.abort(), timeout);

    const start = performance.now();
    let res;
    try {
      res = await fetch(url, {
        method: req.method,
        headers,
        body: req._body,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err && err.name === "AbortError") {
        throw new Error(`${req.method} ${url} -> request timed out after ${timeout}ms`);
      }
      throw err;
    }
    clearTimeout(timer);

    const time = Math.round(performance.now() - start);

    // Collect response headers into a lowercase-keyed plain object.
    const resHeaders = {};
    for (const [key, value] of res.headers.entries()) {
      resHeaders[key.toLowerCase()] = value;
    }

    const text = await res.text();

    // Parse JSON when the content type indicates JSON; fall back to text.
    let body = text;
    const contentType = (resHeaders["content-type"] || "").toLowerCase();
    if (contentType.includes("application/json") || contentType.includes("+json")) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    return new GoResponse({
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
      body,
      text,
      time,
      url,
      method: req.method,
    });
  }

  // Resolve the final URL. Absolute http(s) paths skip the base URL.
  // Query params are appended last.
  #buildURL(req) {
    const path = req.path || "";
    const isAbsolute = /^https?:\/\//i.test(path);
    let url = isAbsolute ? path : this.baseURL + ensureLeadingSlash(path);

    const entries = Object.entries(req._query);
    if (entries.length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of entries) {
        if (Array.isArray(value)) {
          for (const item of value) params.append(key, item);
        } else {
          params.append(key, value);
        }
      }
      url += (url.includes("?") ? "&" : "?") + params.toString();
    }

    return url;
  }
}

function ensureLeadingSlash(path) {
  if (path === "") return "";
  return path.startsWith("/") ? path : "/" + path;
}

// The set of assertion method names that can be queued on a RequestBuilder.
// Each one maps to a same-named method on GoResponse.
const QUEUEABLE = [
  "expectStatus",
  "expectStatusIn",
  "expectOk",
  "expectHeader",
  "expectJson",
  "expectBody",
  "expectTimeBelow",
  "check",
];

export class RequestBuilder {
  constructor(client, method, path) {
    this.client = client;
    this.method = method;
    this.path = path;

    this._headers = {};
    this._query = {};
    this._body = undefined;
    this._timeout = undefined;

    // Queued assertions, replayed in order against the GoResponse.
    this._assertions = [];
  }

  // --- request configuration (chainable) ---

  headers(obj) {
    for (const [key, value] of Object.entries(obj)) {
      this._headers[key.toLowerCase()] = value;
    }
    return this;
  }

  header(name, value) {
    this._headers[String(name).toLowerCase()] = value;
    return this;
  }

  query(obj) {
    Object.assign(this._query, obj);
    return this;
  }

  bearer(token) {
    this._headers["authorization"] = `Bearer ${token}`;
    return this;
  }

  json(body) {
    this._body = JSON.stringify(body);
    this._headers["content-type"] = "application/json";
    return this;
  }

  form(obj) {
    this._body = new URLSearchParams(obj).toString();
    this._headers["content-type"] = "application/x-www-form-urlencoded";
    return this;
  }

  text(str) {
    this._body = String(str);
    if (this._headers["content-type"] === undefined) {
      this._headers["content-type"] = "text/plain";
    }
    return this;
  }

  timeout(ms) {
    this._timeout = ms;
    return this;
  }

  // --- run + thenable ---

  // Send the request, then replay every queued assertion in order.
  async run() {
    const response = await this.client.send(this);
    for (const { name, args } of this._assertions) {
      response[name](...args);
    }
    return response;
  }

  // Make the builder awaitable. Awaiting it triggers run().
  then(onFulfilled, onRejected) {
    return this.run().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.run().catch(onRejected);
  }

  finally(onFinally) {
    return this.run().finally(onFinally);
  }
}

// Install each queueable assertion as a chainable method that records the call.
for (const name of QUEUEABLE) {
  RequestBuilder.prototype[name] = function (...args) {
    this._assertions.push({ name, args });
    return this;
  };
}
