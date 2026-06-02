// Unit tests for src/utils/string.js
// Uses node:test + node:assert/strict only (not the library under test).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  deburr,
  words,
  upperFirst,
  lowerFirst,
  capitalize,
  camelCase,
  kebabCase,
  snakeCase,
  startCase,
  upperCase,
  lowerCase,
  trim,
  trimStart,
  trimEnd,
  truncate,
  pad,
  padStart,
  padEnd,
  repeat,
  escape,
  unescape,
  escapeRegExp,
  startsWith,
  endsWith,
  template
} from "../../src/utils/string.js";

test("deburr strips Latin diacritics and keeps plain characters", () => {
  assert.equal(deburr("déjà vu"), "deja vu");
  assert.equal(deburr("Ærøskøbing"), "Aeroskobing");
  assert.equal(deburr("straße"), "strasse");
  assert.equal(deburr("plain"), "plain");
});

test("deburr treats nil as empty string", () => {
  assert.equal(deburr(null), "");
  assert.equal(deburr(undefined), "");
});

test("words splits on case boundaries, separators, and digits", () => {
  assert.deepEqual(words("fooBar"), ["foo", "Bar"]);
  assert.deepEqual(words("foo-bar baz"), ["foo", "bar", "baz"]);
  assert.deepEqual(words("HTTPServer"), ["HTTP", "Server"]);
  assert.deepEqual(words("abc42def"), ["abc", "42", "def"]);
});

test("words returns empty array for empty/separator-only input", () => {
  assert.deepEqual(words(""), []);
  assert.deepEqual(words("---"), []);
  assert.deepEqual(words(null), []);
});

test("upperFirst and lowerFirst only touch the first character", () => {
  assert.equal(upperFirst("foo"), "Foo");
  assert.equal(upperFirst("FOO"), "FOO");
  assert.equal(lowerFirst("Foo"), "foo");
  assert.equal(lowerFirst("FOO"), "fOO");
  assert.equal(upperFirst(""), "");
  assert.equal(lowerFirst(""), "");
});

test("capitalize upper-cases first char and lower-cases the rest", () => {
  assert.equal(capitalize("fOO bAR"), "Foo bar");
  assert.equal(capitalize("HELLO"), "Hello");
  assert.equal(capitalize(""), "");
});

test("camelCase produces lower-first joined words", () => {
  assert.equal(camelCase("foo-bar baz"), "fooBarBaz");
  assert.equal(camelCase("FooBar"), "fooBar");
  assert.equal(camelCase("__FOO_BAR__"), "fooBar");
  assert.equal(camelCase(""), "");
});

test("kebabCase joins lower-cased words with dashes", () => {
  assert.equal(kebabCase("fooBar baz"), "foo-bar-baz");
  assert.equal(kebabCase("Foo Bar"), "foo-bar");
  assert.equal(kebabCase(""), "");
});

test("snakeCase joins lower-cased words with underscores", () => {
  assert.equal(snakeCase("fooBar baz"), "foo_bar_baz");
  assert.equal(snakeCase("Foo-Bar"), "foo_bar");
  assert.equal(snakeCase(""), "");
});

test("startCase upper-cases each word and joins with spaces", () => {
  assert.equal(startCase("fooBar"), "Foo Bar");
  assert.equal(startCase("foo_bar-baz"), "Foo Bar Baz");
  assert.equal(startCase(""), "");
});

test("upperCase and lowerCase produce space-separated phrases", () => {
  assert.equal(upperCase("fooBar baz"), "FOO BAR BAZ");
  assert.equal(lowerCase("FooBar Baz"), "foo bar baz");
  assert.equal(upperCase(""), "");
  assert.equal(lowerCase(""), "");
});

test("trim variants default to whitespace", () => {
  assert.equal(trim("  hi  "), "hi");
  assert.equal(trimStart("  hi  "), "hi  ");
  assert.equal(trimEnd("  hi  "), "  hi");
});

test("trim variants accept a custom character set", () => {
  assert.equal(trim("--hi--", "-"), "hi");
  assert.equal(trimStart("xxhi", "x"), "hi");
  assert.equal(trimEnd("hixx", "x"), "hi");
  // Characters special in a char class must be treated literally.
  assert.equal(trim("..hi..", "."), "hi");
});

test("truncate respects default length and omission", () => {
  const short = "short";
  assert.equal(truncate(short), short);

  const long = "a".repeat(40);
  const result = truncate(long);
  assert.equal(result.length, 30);
  assert.ok(result.endsWith("..."));
});

test("truncate honors custom length and omission", () => {
  assert.equal(truncate("hello world", { length: 8 }), "hello...");
  assert.equal(truncate("hello world", { length: 8, omission: "_" }), "hello w_");
});

test("truncate with string separator cuts at last separator", () => {
  const result = truncate("hello there friend", { length: 12, separator: " " });
  assert.equal(result, "hello...");
});

test("truncate with regexp separator cuts at last match", () => {
  const result = truncate("hi, there, friend", { length: 12, separator: /,\s*/ });
  assert.equal(result, "hi...");
});

test("pad centers the string, extra padding on the right", () => {
  assert.equal(pad("ab", 6), "  ab  ");
  assert.equal(pad("ab", 5), " ab  ");
  assert.equal(pad("abcdef", 4), "abcdef");
  assert.equal(pad("ab", 6, "-"), "--ab--");
});

test("padStart and padEnd reach the target length", () => {
  assert.equal(padStart("5", 3, "0"), "005");
  assert.equal(padEnd("5", 3, "0"), "500");
  assert.equal(padStart("abc", 2), "abc");
  assert.equal(padEnd("abc", 2), "abc");
});

test("pad with multi-char filler is sliced to exact length", () => {
  assert.equal(padStart("x", 4, "ab"), "abax");
  assert.equal(padEnd("x", 4, "ab"), "xaba");
});

test("repeat clamps to non-negative integer count", () => {
  assert.equal(repeat("ab", 3), "ababab");
  assert.equal(repeat("ab", 0), "");
  assert.equal(repeat("ab", -2), "");
  assert.equal(repeat("", 5), "");
  assert.equal(repeat("a", 2.9), "aa");
});

test("escape converts HTML-special characters", () => {
  assert.equal(escape(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  assert.equal(escape("plain"), "plain");
});

test("unescape reverses entities including variants", () => {
  assert.equal(unescape("&lt;a&gt; &amp; &quot;b&quot; &#39;c&#39;"), `<a> & "b" 'c'`);
  assert.equal(unescape("&#x2F;path&#47;to"), "/path/to");
});

test("escape and unescape round-trip for the core five entities", () => {
  const original = `<tag attr="v">a & b 'c'</tag>`;
  assert.equal(unescape(escape(original)), original);
});

test("escapeRegExp escapes regex metacharacters", () => {
  assert.equal(escapeRegExp("a.b*c"), "a\\.b\\*c");
  assert.equal(escapeRegExp("(1+1)"), "\\(1\\+1\\)");
});

test("startsWith honors target and position", () => {
  assert.equal(startsWith("hello", "he"), true);
  assert.equal(startsWith("hello", "lo"), false);
  assert.equal(startsWith("hello", "ll", 2), true);
  assert.equal(startsWith("hello", "he", -5), true);
});

test("endsWith honors target and position", () => {
  assert.equal(endsWith("hello", "lo"), true);
  assert.equal(endsWith("hello", "he"), false);
  assert.equal(endsWith("hello", "ll", 4), true);
  assert.equal(endsWith("hello", "", 0), true);
});

test("template fills mustache placeholders and tolerates whitespace", () => {
  assert.equal(template("Hi {{ name }}!", { name: "Ada" }), "Hi Ada!");
  assert.equal(template("{{a}}-{{b}}", { a: 1, b: 2 }), "1-2");
});

test("template replaces missing or nil keys with empty string", () => {
  assert.equal(template("Hi {{ name }}!", {}), "Hi !");
  assert.equal(template("v={{x}}", { x: null }), "v=");
  assert.equal(template("v={{x}}", { x: undefined }), "v=");
});
