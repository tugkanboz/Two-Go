// Unit tests for src/faker.js: deterministic shape/format assertions for the
// zero-dependency fake data generator.
import { test } from "node:test";
import assert from "node:assert/strict";
import { faker } from "../../src/faker.js";

test("uuid returns a valid RFC4122 v4 UUID string", () => {
  const id = faker.uuid();
  assert.equal(typeof id, "string");
  assert.match(
    id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  );
});

test("uuid produces distinct values across calls", () => {
  const ids = new Set(faker.arrayOf(() => faker.uuid(), 50));
  assert.equal(ids.size, 50);
});

test("email contains an @ and a dotted domain with a numeric suffix", () => {
  for (let i = 0; i < 100; i += 1) {
    const email = faker.email();
    assert.match(email, /^[a-z0-9.]+[0-9]+@(example\.com|test\.org|mail\.net|demo\.io)$/);
    assert.equal(email.split("@").length, 2);
  }
});

test("firstName returns a value from the known pool", () => {
  const pool = [
    "Ada", "Alan", "Grace", "Linus", "Margaret", "Dennis", "Barbara", "Ken",
    "Edsger", "Donald", "Anita", "Tim", "John", "Radia", "Vint", "Hedy"
  ];
  for (let i = 0; i < 100; i += 1) {
    assert.ok(pool.includes(faker.firstName()));
  }
});

test("lastName returns a value from the known pool", () => {
  const pool = [
    "Lovelace", "Turing", "Hopper", "Torvalds", "Hamilton", "Ritchie", "Liskov",
    "Thompson", "Dijkstra", "Knuth", "Borg", "Berners-Lee", "Cerf", "Lamarr"
  ];
  for (let i = 0; i < 100; i += 1) {
    assert.ok(pool.includes(faker.lastName()));
  }
});

test("fullName joins a first and last name with a single space", () => {
  const name = faker.fullName();
  const parts = name.split(" ");
  assert.equal(parts.length, 2);
  assert.ok(parts[0].length > 0);
  assert.ok(parts[1].length > 0);
});

test("username is lowercase alphanumeric with a numeric suffix", () => {
  for (let i = 0; i < 100; i += 1) {
    const name = faker.username();
    assert.match(name, /^[a-z0-9]+$/);
    assert.match(name, /[0-9]+$/);
  }
});

test("word returns a single lowercase word from the pool", () => {
  const word = faker.word();
  assert.equal(typeof word, "string");
  assert.match(word, /^[a-z]+$/);
});

test("words joins n words with single spaces (default 3)", () => {
  assert.equal(faker.words().split(" ").length, 3);
  assert.equal(faker.words(5).split(" ").length, 5);
});

test("words truncates and floors fractional counts", () => {
  assert.equal(faker.words(3.9).split(" ").length, 3);
});

test("words with zero or negative count yields an empty string", () => {
  assert.equal(faker.words(0), "");
  assert.equal(faker.words(-4), "");
});

test("sentence is capitalized and period-terminated", () => {
  const sentence = faker.sentence(4);
  assert.match(sentence, /^[A-Z]/);
  assert.ok(sentence.endsWith("."));
  // Default word count is 6.
  assert.equal(faker.sentence().slice(0, -1).split(" ").length, 6);
});

test("sentence clamps non-positive counts to at least one word", () => {
  const sentence = faker.sentence(0);
  assert.match(sentence, /^[A-Z][a-z]*\.$/);
  assert.equal(sentence.slice(0, -1).split(" ").length, 1);
});

test("paragraph joins n sentences (default 3)", () => {
  const paragraph = faker.paragraph();
  const sentences = paragraph.split(". ");
  assert.equal(sentences.length, 3);
  assert.ok(paragraph.endsWith("."));
});

test("paragraph respects an explicit sentence count", () => {
  const paragraph = faker.paragraph(5);
  assert.equal(paragraph.split(". ").length, 5);
});

test("number stays within default bounds [0, 100]", () => {
  for (let i = 0; i < 200; i += 1) {
    const n = faker.number();
    assert.ok(Number.isInteger(n));
    assert.ok(n >= 0 && n <= 100);
  }
});

test("number honors custom min and max bounds", () => {
  for (let i = 0; i < 200; i += 1) {
    const n = faker.number({ min: 10, max: 20 });
    assert.ok(n >= 10 && n <= 20);
  }
});

test("int returns an integer in the inclusive range", () => {
  for (let i = 0; i < 200; i += 1) {
    const n = faker.int(5, 9);
    assert.ok(Number.isInteger(n));
    assert.ok(n >= 5 && n <= 9);
  }
});

test("int with equal min and max returns that exact value", () => {
  assert.equal(faker.int(7, 7), 7);
});

test("int handles swapped bounds", () => {
  for (let i = 0; i < 100; i += 1) {
    const n = faker.int(10, 2);
    assert.ok(n >= 2 && n <= 10);
  }
});

test("float stays within range and respects decimal places", () => {
  for (let i = 0; i < 200; i += 1) {
    const value = faker.float(0, 10, 2);
    assert.ok(value >= 0 && value <= 10);
    const decimals = (String(value).split(".")[1] || "").length;
    assert.ok(decimals <= 2);
  }
});

test("float with zero decimals returns an integer value", () => {
  for (let i = 0; i < 100; i += 1) {
    const value = faker.float(0, 100, 0);
    assert.ok(Number.isInteger(value));
  }
});

test("boolean returns a boolean", () => {
  for (let i = 0; i < 50; i += 1) {
    assert.equal(typeof faker.boolean(), "boolean");
  }
});

test("pick returns a member of the array", () => {
  const arr = ["a", "b", "c"];
  for (let i = 0; i < 100; i += 1) {
    assert.ok(arr.includes(faker.pick(arr)));
  }
});

test("pick returns undefined for empty or non-array input", () => {
  assert.equal(faker.pick([]), undefined);
  assert.equal(faker.pick(null), undefined);
  assert.equal(faker.pick("not-an-array"), undefined);
});

test("pickMany returns n distinct members", () => {
  const arr = [1, 2, 3, 4, 5];
  const picked = faker.pickMany(arr, 3);
  assert.equal(picked.length, 3);
  assert.equal(new Set(picked).size, 3);
  for (const value of picked) {
    assert.ok(arr.includes(value));
  }
});

test("pickMany clamps the count to the array length", () => {
  const arr = [1, 2, 3];
  const picked = faker.pickMany(arr, 10);
  assert.equal(picked.length, 3);
  assert.equal(new Set(picked).size, 3);
});

test("pickMany returns an empty array for empty or non-array input", () => {
  assert.deepEqual(faker.pickMany([], 3), []);
  assert.deepEqual(faker.pickMany(null, 3), []);
});

test("pickMany with zero or negative count returns an empty array", () => {
  assert.deepEqual(faker.pickMany([1, 2, 3], 0), []);
  assert.deepEqual(faker.pickMany([1, 2, 3], -2), []);
});

test("date returns a Date within the provided range", () => {
  const from = new Date("2020-01-01T00:00:00Z");
  const to = new Date("2020-12-31T23:59:59Z");
  for (let i = 0; i < 100; i += 1) {
    const d = faker.date({ from, to });
    assert.ok(d instanceof Date);
    assert.ok(d.getTime() >= from.getTime());
    assert.ok(d.getTime() <= to.getTime());
  }
});

test("date with swapped from/to still returns a value within bounds", () => {
  const from = new Date("2020-12-31T00:00:00Z");
  const to = new Date("2020-01-01T00:00:00Z");
  const d = faker.date({ from, to });
  assert.ok(d.getTime() >= to.getTime());
  assert.ok(d.getTime() <= from.getTime());
});

test("date with no options returns a Date instance", () => {
  assert.ok(faker.date() instanceof Date);
});

test("pastDate returns a Date in the past", () => {
  const now = Date.now();
  for (let i = 0; i < 50; i += 1) {
    const d = faker.pastDate();
    assert.ok(d instanceof Date);
    assert.ok(d.getTime() < now + 1000);
  }
});

test("futureDate returns a Date in the future", () => {
  const now = Date.now();
  for (let i = 0; i < 50; i += 1) {
    const d = faker.futureDate();
    assert.ok(d instanceof Date);
    assert.ok(d.getTime() > now);
  }
});

test("hexColor returns a 6-digit hex string prefixed with #", () => {
  for (let i = 0; i < 100; i += 1) {
    assert.match(faker.hexColor(), /^#[0-9a-f]{6}$/);
  }
});

test("ipv4 returns four dot-separated octets in range", () => {
  for (let i = 0; i < 100; i += 1) {
    const ip = faker.ipv4();
    const octets = ip.split(".");
    assert.equal(octets.length, 4);
    for (const octet of octets) {
      const n = Number(octet);
      assert.ok(Number.isInteger(n));
      assert.ok(n >= 0 && n <= 255);
    }
  }
});

test("url returns an https URL with a known TLD and a path", () => {
  for (let i = 0; i < 100; i += 1) {
    const url = faker.url();
    assert.match(url, /^https:\/\/[a-z]+[0-9]+\.(com|org|io|net)\/[a-z]+$/);
    const parsed = new URL(url);
    assert.equal(parsed.protocol, "https:");
  }
});

test("phone returns a grouped +1 phone number", () => {
  for (let i = 0; i < 100; i += 1) {
    assert.match(faker.phone(), /^\+1-\d{3}-\d{3}-\d{4}$/);
  }
});

test("arrayOf builds an array of the requested length", () => {
  const arr = faker.arrayOf((i) => i * 2, 5);
  assert.deepEqual(arr, [0, 2, 4, 6, 8]);
});

test("arrayOf passes the index to the factory function", () => {
  const indexes = faker.arrayOf((i) => i, 4);
  assert.deepEqual(indexes, [0, 1, 2, 3]);
});

test("arrayOf with zero, negative, or fractional counts", () => {
  assert.deepEqual(faker.arrayOf(() => 1, 0), []);
  assert.deepEqual(faker.arrayOf(() => 1, -3), []);
  assert.deepEqual(faker.arrayOf(() => 1, 3.9), [1, 1, 1]);
});
