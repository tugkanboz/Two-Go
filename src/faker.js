// Tiny zero-dependency fake data generator for building test payloads.
// Produces UUIDs, names, words, numbers, dates, colors, and more. The shapes
// and ranges are stable so tests can assert format without exact values.

import { randomUUID, randomInt } from "node:crypto";

const FIRST_NAMES = [
  "Ada", "Alan", "Grace", "Linus", "Margaret", "Dennis", "Barbara", "Ken",
  "Edsger", "Donald", "Anita", "Tim", "John", "Radia", "Vint", "Hedy"
];

const LAST_NAMES = [
  "Lovelace", "Turing", "Hopper", "Torvalds", "Hamilton", "Ritchie", "Liskov",
  "Thompson", "Dijkstra", "Knuth", "Borg", "Berners-Lee", "Cerf", "Lamarr"
];

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
  "elit", "sed", "tempor", "labore", "magna", "aliqua", "enim", "minim",
  "veniam", "quis", "nostrud", "ullamco", "laboris", "aliquip", "commodo"
];

// Return a random integer in the inclusive range [min, max].
function intInclusive(min, max) {
  if (min > max) {
    const temp = min;
    min = max;
    max = temp;
  }
  return randomInt(min, max + 1);
}

// Capitalize the first character of a string.
function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const faker = {
  // Generate an RFC4122 version 4 UUID string.
  uuid() {
    return randomUUID();
  },

  // Generate a random email address with an "@" and a dotted domain.
  email() {
    const user = `${this.firstName()}.${this.lastName()}`
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "");
    const domains = ["example.com", "test.org", "mail.net", "demo.io"];
    return `${user}${intInclusive(1, 999)}@${this.pick(domains)}`;
  },

  // Pick a random first name from the pool.
  firstName() {
    return this.pick(FIRST_NAMES);
  },

  // Pick a random last name from the pool.
  lastName() {
    return this.pick(LAST_NAMES);
  },

  // Combine a random first and last name.
  fullName() {
    return `${this.firstName()} ${this.lastName()}`;
  },

  // Generate a lowercase username with a numeric suffix.
  username() {
    const base = `${this.firstName()}${this.lastName()}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return `${base}${intInclusive(1, 9999)}`;
  },

  // Pick a single random word from the pool.
  word() {
    return this.pick(WORDS);
  },

  // Build a space-joined string of n random words (default 3).
  words(n = 3) {
    const count = Math.max(0, Math.trunc(n));
    return this.arrayOf(() => this.word(), count).join(" ");
  },

  // Build a capitalized, period-terminated sentence of n words (default 6).
  sentence(n = 6) {
    const count = Math.max(1, Math.trunc(n));
    return `${capitalize(this.words(count))}.`;
  },

  // Build a paragraph of n sentences joined by spaces (default 3).
  paragraph(n = 3) {
    const count = Math.max(1, Math.trunc(n));
    return this.arrayOf(() => this.sentence(intInclusive(4, 9)), count).join(" ");
  },

  // Return a random number within { min, max } bounds (default [0, 100]).
  number(options = {}) {
    const { min = 0, max = 100 } = options;
    return this.int(min, max);
  },

  // Return a random integer in the inclusive range [min, max].
  int(min = 0, max = 100) {
    return intInclusive(Math.trunc(min), Math.trunc(max));
  },

  // Return a random float in [min, max] rounded to the given decimals.
  float(min = 0, max = 1, decimals = 2) {
    const value = min + Math.random() * (max - min);
    const factor = 10 ** Math.max(0, Math.trunc(decimals));
    return Math.round(value * factor) / factor;
  },

  // Return a random boolean.
  boolean() {
    return Math.random() < 0.5;
  },

  // Return a random member of the given array.
  pick(array) {
    if (!Array.isArray(array) || array.length === 0) return undefined;
    return array[intInclusive(0, array.length - 1)];
  },

  // Return n distinct random members of the array (clamped to array length).
  pickMany(array, n) {
    if (!Array.isArray(array) || array.length === 0) return [];
    const count = Math.min(Math.max(0, Math.trunc(n)), array.length);
    const pool = array.slice();
    const result = [];
    for (let i = 0; i < count; i += 1) {
      const index = intInclusive(0, pool.length - 1);
      result.push(pool.splice(index, 1)[0]);
    }
    return result;
  },

  // Return a random Date within { from, to } (defaults span +/- one year).
  date(options = {}) {
    const now = Date.now();
    const year = 365 * 24 * 60 * 60 * 1000;
    const from = options.from instanceof Date ? options.from.getTime() : now - year;
    const to = options.to instanceof Date ? options.to.getTime() : now + year;
    const low = Math.min(from, to);
    const high = Math.max(from, to);
    return new Date(low + Math.floor(Math.random() * (high - low + 1)));
  },

  // Return a random Date in the past (within the last year).
  pastDate() {
    const now = Date.now();
    const year = 365 * 24 * 60 * 60 * 1000;
    return this.date({ from: new Date(now - year), to: new Date(now - 1000) });
  },

  // Return a random Date in the future (within the next year).
  futureDate() {
    const now = Date.now();
    const year = 365 * 24 * 60 * 60 * 1000;
    return this.date({ from: new Date(now + 1000), to: new Date(now + year) });
  },

  // Return a random hex color string like "#a1b2c3".
  hexColor() {
    let hex = "";
    for (let i = 0; i < 6; i += 1) {
      hex += intInclusive(0, 15).toString(16);
    }
    return `#${hex}`;
  },

  // Return a random IPv4 address string.
  ipv4() {
    return this.arrayOf(() => intInclusive(0, 255), 4).join(".");
  },

  // Return a random https URL string.
  url() {
    const tlds = ["com", "org", "io", "net"];
    return `https://${this.word()}${intInclusive(1, 99)}.${this.pick(tlds)}/${this.word()}`;
  },

  // Return a random phone number string in a simple grouped format.
  phone() {
    const part = (len) => this.arrayOf(() => intInclusive(0, 9), len).join("");
    return `+1-${part(3)}-${part(3)}-${part(4)}`;
  },

  // Build an array of length n by invoking fn(index) for each element.
  arrayOf(fn, n) {
    const count = Math.max(0, Math.trunc(n));
    const result = new Array(count);
    for (let i = 0; i < count; i += 1) {
      result[i] = fn(i);
    }
    return result;
  }
};