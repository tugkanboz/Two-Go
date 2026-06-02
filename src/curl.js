// curl export and request/response logging for debugging.
// Provides toCurl(request) to build a copy-pasteable curl command from a
// RequestBuilder, plus enableLogging(client, options) to log each send.

import { RequestBuilder } from "./client.js";

// Resolve the full URL for a request the same way GoClient does.
function buildFullURL(request) {
  const path = request.path || "";
  const isAbsolute = /^https?:\/\//i.test(path);
  const base = request.client && request.client.baseURL ? request.client.baseURL : "";
  let url = isAbsolute ? path : base + ensureLeadingSlash(path);

  const entries = Object.entries(request._query || {});
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

// Add a leading slash to a non-empty path when one is missing.
function ensureLeadingSlash(path) {
  if (path === "") return "";
  return path.startsWith("/") ? path : "/" + path;
}

// Wrap a value in single quotes, escaping any embedded single quotes for shells.
function shellQuote(value) {
  return "'" + String(value).replace(/'/g, "'\\''") + "'";
}

// Build a copy-pasteable curl command string from a RequestBuilder.
export function toCurl(request) {
  const method = request.method || "GET";
  const url = buildFullURL(request);

  const parts = ["curl", "-X", method, shellQuote(url)];

  for (const [name, value] of Object.entries(request._headers || {})) {
    parts.push("-H", shellQuote(`${name}: ${value}`));
  }

  if (request._body !== undefined) {
    parts.push("--data", shellQuote(request._body));
  }

  return parts.join(" ");
}

// Allow any RequestBuilder to produce its own curl command via .toCurl().
RequestBuilder.prototype.toCurl = function () {
  return toCurl(this);
};

// Wrap client.send so each call logs method, url, then status and time (ms).
// Returns a function that restores the original send (disableLogging).
export function enableLogging(client, options = {}) {
  const { logger = console, label } = options;
  const originalSend = client.send.bind(client);
  const prefix = label ? `[${label}] ` : "";

  client.send = async function (req) {
    const url = buildFullURL(req);
    logger.log(`${prefix}-> ${req.method} ${url}`);
    const response = await originalSend(req);
    logger.log(`${prefix}<- ${response.status} ${url} (${response.time}ms)`);
    return response;
  };

  return function disableLogging() {
    client.send = originalSend;
  };
}
