// String utilities for two-go: case conversion, trimming, padding, escaping,
// diacritic removal, and lightweight mustache-style templating. The case
// converters all build on a single `words` splitter so their behavior stays
// consistent across camelCase / kebabCase / snakeCase / startCase.

import { isNil } from "./lang.js";

// Coerce a value into a string, treating null/undefined as an empty string.
function toStringSafe(value) {
  if (isNil(value)) return "";
  return String(value);
}

// Mapping of common Latin characters with diacritics to their plain forms.
// Used by `deburr` to strip accents without pulling in any dependencies.
const DEBURR_MAP = {
  "À": "A", "Á": "A", "Â": "A", "Ã": "A", "Ä": "A", "Å": "A",
  "à": "a", "á": "a", "â": "a", "ã": "a", "ä": "a", "å": "a",
  "Ç": "C", "ç": "c",
  "Ð": "D", "ð": "d",
  "È": "E", "É": "E", "Ê": "E", "Ë": "E",
  "è": "e", "é": "e", "ê": "e", "ë": "e",
  "Ì": "I", "Í": "I", "Î": "I", "Ï": "I",
  "ì": "i", "í": "i", "î": "i", "ï": "i",
  "Ñ": "N", "ñ": "n",
  "Ò": "O", "Ó": "O", "Ô": "O", "Õ": "O", "Ö": "O", "Ø": "O",
  "ò": "o", "ó": "o", "ô": "o", "õ": "o", "ö": "o", "ø": "o",
  "Ù": "U", "Ú": "U", "Û": "U", "Ü": "U",
  "ù": "u", "ú": "u", "û": "u", "ü": "u",
  "Ý": "Y", "ý": "y", "ÿ": "y",
  "ß": "ss", "Æ": "Ae", "æ": "ae", "Þ": "Th", "þ": "th"
};

// HTML entities used by `escape`. The reverse map drives `unescape`.
const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

const HTML_UNESCAPE_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
  "&#47;": "/"
};

// Escape characters that are special inside a regular expression source.
function escapeForCharClass(chars) {
  return chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Strip Latin diacritics from a string, returning a plain-ASCII variant.
export function deburr(s) {
  const str = toStringSafe(s);
  let result = "";
  for (const char of str) {
    result += DEBURR_MAP[char] !== undefined ? DEBURR_MAP[char] : char;
  }
  return result;
}

// Split a string into its component words, handling camelCase boundaries,
// digits, and any non-alphanumeric separators (spaces, dashes, underscores).
export function words(s) {
  const str = toStringSafe(s);
  if (str === "") return [];

  const pattern = new RegExp(
    [
      "[A-Z]+(?=[A-Z][a-z])", // acronym followed by a capitalized word: "HTTPServer"
      "[A-Z]?[a-z]+",          // capitalized or lowercase run: "Foo", "bar"
      "[A-Z]+",                // remaining uppercase run: "ABC"
      "[0-9]+"                 // numeric run: "42"
    ].join("|"),
    "g"
  );

  const matched = str.match(pattern);
  return matched === null ? [] : matched;
}

// Uppercase the first character of a string, leaving the rest untouched.
export function upperFirst(s) {
  const str = toStringSafe(s);
  if (str === "") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Lowercase the first character of a string, leaving the rest untouched.
export function lowerFirst(s) {
  const str = toStringSafe(s);
  if (str === "") return "";
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Capitalize a string: upper-case the first character, lower-case the rest.
export function capitalize(s) {
  const str = toStringSafe(s);
  if (str === "") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Convert a string to camelCase (e.g. "foo-bar baz" -> "fooBarBaz").
export function camelCase(s) {
  const parts = words(s);
  if (parts.length === 0) return "";
  return parts
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : upperFirst(lower);
    })
    .join("");
}

// Convert a string to kebab-case (e.g. "fooBar baz" -> "foo-bar-baz").
export function kebabCase(s) {
  return words(s)
    .map((word) => word.toLowerCase())
    .join("-");
}

// Convert a string to snake_case (e.g. "fooBar baz" -> "foo_bar_baz").
export function snakeCase(s) {
  return words(s)
    .map((word) => word.toLowerCase())
    .join("_");
}

// Convert a string to Start Case (e.g. "fooBar" -> "Foo Bar").
export function startCase(s) {
  return words(s)
    .map((word) => upperFirst(word))
    .join(" ");
}

// Convert a string to a space-separated, fully upper-cased phrase.
export function upperCase(s) {
  return words(s)
    .map((word) => word.toUpperCase())
    .join(" ");
}

// Convert a string to a space-separated, fully lower-cased phrase.
export function lowerCase(s) {
  return words(s)
    .map((word) => word.toLowerCase())
    .join(" ");
}

// Remove the given characters (default whitespace) from both ends of a string.
export function trim(s, chars) {
  return trimStart(trimEnd(s, chars), chars);
}

// Remove the given characters (default whitespace) from the start of a string.
export function trimStart(s, chars) {
  const str = toStringSafe(s);
  if (chars === undefined) return str.replace(/^\s+/, "");
  const pattern = new RegExp("^[" + escapeForCharClass(chars) + "]+");
  return str.replace(pattern, "");
}

// Remove the given characters (default whitespace) from the end of a string.
export function trimEnd(s, chars) {
  const str = toStringSafe(s);
  if (chars === undefined) return str.replace(/\s+$/, "");
  const pattern = new RegExp("[" + escapeForCharClass(chars) + "]+$");
  return str.replace(pattern, "");
}

// Truncate a string to a maximum length, appending an omission marker.
// Options: { length = 30, omission = "...", separator? }.
// When `separator` is provided, the cut is moved back to the last separator.
export function truncate(s, options = {}) {
  const str = toStringSafe(s);
  const length = options.length === undefined ? 30 : options.length;
  const omission = options.omission === undefined ? "..." : options.omission;
  const separator = options.separator;

  if (str.length <= length) return str;

  const end = Math.max(length - omission.length, 0);
  let result = str.slice(0, end);

  if (separator !== undefined) {
    if (separator instanceof RegExp) {
      const global = separator.global
        ? separator
        : new RegExp(separator.source, separator.flags + "g");
      let lastIndex = -1;
      let match;
      while ((match = global.exec(result)) !== null) {
        lastIndex = match.index;
        if (match.index === global.lastIndex) global.lastIndex += 1;
      }
      if (lastIndex > -1) result = result.slice(0, lastIndex);
    } else {
      const index = result.lastIndexOf(separator);
      if (index > -1) result = result.slice(0, index);
    }
  }

  return result + omission;
}

// Repeat the given padding to build a filler string of an exact length.
function buildFiller(length, chars) {
  if (length <= 0 || chars === "") return "";
  const repeated = chars.repeat(Math.ceil(length / chars.length));
  return repeated.slice(0, length);
}

// Pad both sides of a string so it reaches the target length.
// Extra padding (when uneven) is added to the end, matching common behavior.
export function pad(s, length, chars = " ") {
  const str = toStringSafe(s);
  if (str.length >= length || chars === "") return str;
  const total = length - str.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return buildFiller(left, chars) + str + buildFiller(right, chars);
}

// Pad the start of a string so it reaches the target length.
export function padStart(s, length, chars = " ") {
  const str = toStringSafe(s);
  if (str.length >= length || chars === "") return str;
  return buildFiller(length - str.length, chars) + str;
}

// Pad the end of a string so it reaches the target length.
export function padEnd(s, length, chars = " ") {
  const str = toStringSafe(s);
  if (str.length >= length || chars === "") return str;
  return str + buildFiller(length - str.length, chars);
}

// Repeat a string `n` times (n is clamped to a non-negative integer).
export function repeat(s, n) {
  const str = toStringSafe(s);
  const count = Math.floor(n);
  if (count <= 0 || str === "") return "";
  return str.repeat(count);
}

// Escape the HTML-special characters &, <, >, ", and '.
export function escape(s) {
  const str = toStringSafe(s);
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

// Reverse `escape`, converting HTML entities back to their characters.
export function unescape(s) {
  const str = toStringSafe(s);
  return str.replace(/&(?:amp|lt|gt|quot|#39|#x27|#x2F|#47);/g, (entity) => {
    return HTML_UNESCAPE_MAP[entity] !== undefined ? HTML_UNESCAPE_MAP[entity] : entity;
  });
}

// Escape characters that have special meaning in a regular expression.
export function escapeRegExp(s) {
  const str = toStringSafe(s);
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Check whether a string starts with `target`, optionally from a position.
export function startsWith(s, target, pos = 0) {
  const str = toStringSafe(s);
  const search = toStringSafe(target);
  const start = pos < 0 ? 0 : Math.floor(pos);
  return str.slice(start, start + search.length) === search;
}

// Check whether a string ends with `target`, optionally up to a position.
export function endsWith(s, target, pos) {
  const str = toStringSafe(s);
  const search = toStringSafe(target);
  const end = pos === undefined ? str.length : Math.min(Math.floor(pos), str.length);
  if (end < 0) return search === "";
  return str.slice(end - search.length, end) === search;
}

// Fill mustache-style {{ key }} placeholders from a data object.
// Missing keys are replaced with an empty string. Keys may contain surrounding
// whitespace inside the braces, e.g. "{{ name }}".
export function template(str, data = {}) {
  const source = toStringSafe(str);
  return source.replace(/\{\{\s*([\w$.]+)\s*\}\}/g, (match, key) => {
    const value = data[key];
    return isNil(value) ? "" : String(value);
  });
}
