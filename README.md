# two-go

[![npm version](https://img.shields.io/npm/v/two-go.svg)](https://www.npmjs.com/package/two-go)
[![npm downloads](https://img.shields.io/npm/dm/two-go.svg)](https://www.npmjs.com/package/two-go)
[![CI](https://github.com/tugkanboz/two-go/actions/workflows/ci.yml/badge.svg)](https://github.com/tugkanboz/two-go/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/two-go.svg)](./LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](./package.json)

Zero-dependency, fluent service / API testing for Node.js. Write expressive
HTTP tests with a chainable builder and inline assertions that **throw on
failure**, so the same tests run standalone (via the built-in runner) or inside
`node:test`, Jest, Vitest, and Mocha.

On top of the HTTP core, two-go ships a batteries-included toolkit that plain
assertion libraries do not have:

- **Zero runtime dependencies.** Native `fetch`, ESM, Node >= 18.
- **Fluent requests** with headers, query, bearer auth, JSON/form/text bodies, timeouts.
- **Inline HTTP assertions** plus a **Jest-style `expect()`** for any value.
- **A lodash-inspired utility belt** (~170 functions) with optional chaining.
- **Soft assertions**, **`eventually`/`pollUntil`** polling, **JSON snapshots**.
- **Session chaining** (extract a value, reuse it in the next request).
- **Faker-lite** test data, **async control-flow** helpers, **curl export + logging**.
- **JSON-schema validation** and **schema inference** for contract testing.

## Installation

```bash
npm install two-go --save-dev
```

## Quick start

```js
import { go } from "two-go";

const api = go("https://api.example.com");

// Awaiting the builder sends the request and replays all queued assertions.
await api.get("/users")
  .expectStatus(200)
  .expectHeader("content-type", /json/)
  .expectJson("data[0].id", 1);
```

`go()` accepts either a base URL string or an options object:

```js
const api = go({
  baseURL: "https://api.example.com",
  headers: { "x-api-key": "secret" },
  timeout: 10000,
});
```

## Subpath exports

Import the whole surface from `two-go`, or pull a single area from a subpath:

| Import | Contents |
| ------ | -------- |
| `two-go` | everything (default `go`, assertions, utilities, all features) |
| `two-go/utils` | the lodash-inspired utility belt (flat named exports) |
| `two-go/expect` | the Jest-style `expect()` |
| `two-go/schema` | `validate` / `isValid` JSON-schema validator |
| `two-go/soft` | soft assertions |
| `two-go/eventually` | `eventually` / `pollUntil` |
| `two-go/snapshot` | snapshot testing |
| `two-go/session` | stateful request chaining |
| `two-go/faker` | fake data generator |
| `two-go/async` | async control-flow helpers |
| `two-go/curl` | curl export + logging |
| `two-go/infer-schema` | schema inference |

## Request building

Every HTTP verb (`get`, `put`, `post`, `patch`, `delete`, `head`, `options`)
returns a chainable, thenable `RequestBuilder`:

```js
await api.post("/users")
  .header("x-request-id", "abc")        // single header
  .headers({ "x-trace": "1" })          // multiple headers
  .query({ page: 1, tags: ["a", "b"] }) // query params (arrays repeat the key)
  .bearer("TOKEN")                      // authorization: Bearer TOKEN
  .json({ name: "Ada" })                // JSON body + content-type
  .timeout(5000)                        // per-request timeout (ms)
  .expectStatus(201);
```

Body helpers (mutually exclusive): `.json(obj)`, `.form(obj)`, `.text(str)`.
Absolute `http(s)://` paths bypass the base URL. Responses whose
`content-type` contains `application/json` or `+json` are parsed automatically.

## HTTP assertions

Assertions can be queued on the builder (replayed in order when awaited) or
called directly on a resolved `GoResponse`. Each returns the response for
chaining and throws an `AssertionError` on failure, formatted as
`<METHOD> <URL> -> <description>`.

| Assertion | Meaning |
| --------- | ------- |
| `expectStatus(code)` | status equals `code` |
| `expectStatusIn(...codes)` | status is one of `codes` |
| `expectOk()` | status is 2xx |
| `expectClientError()` / `expectServerError()` / `expectRedirect()` | 4xx / 5xx / 3xx |
| `expectCreated()` / `expectAccepted()` / `expectNoContent()` | 201 / 202 / 204 |
| `expectBadRequest()` / `expectUnauthorized()` / `expectForbidden()` / `expectNotFound()` | 400 / 401 / 403 / 404 |
| `expectHeader(name, matcher?)` | header present / value matches |
| `expectHeaderContains(name, substr)` / `expectHeaderAbsent(name)` | header substring / absence |
| `expectContentType(type)` | content-type contains `type` |
| `expectCookie(name, matcher?)` | `set-cookie` present / value matches |
| `expectJson(path, expected?)` | JSON value at `path` exists / matches |
| `expectJsonLength(path, n)` / `expectArrayLength(path, n)` | length at `path` |
| `expectJsonContains(path, value)` | array contains item (object values match by subset) |
| `expectJsonSchema(schema)` | `body` validates against a JSON schema |
| `expectSorted(path, options?)` | array at `path` is sorted |
| `expectBody(matcher)` / `expectBodyContains(substr)` | body matches / contains |
| `expectEmpty()` / `expectNotEmpty()` | body is empty / not |
| `expectTimeBelow(ms)` | response time below `ms` |
| `check(label, fn)` | fails if `fn(response)` returns `false` or throws |
| `expectValue(path)` | returns a Jest-style `expect()` bound to the value at `path` |

```js
const res = await api.get("/users").expectOk();
res.expectValue("data[0].id").toBeGreaterThan(0);
res.expectValue("data").toHaveLength(2);
```

## Jest-style expect()

`expect(value)` works on any value (not just responses), with `.not` negation
and `.resolves` / `.rejects` for promises:

```js
import { expect } from "two-go";

expect(2 + 2).toBe(4);
expect({ a: 1, b: 2 }).toMatchObject({ a: 1 });
expect([1, 2, 3]).toContain(2);
expect("hello").toMatch(/ell/);
expect(value).not.toBeNull();
await expect(Promise.resolve(5)).resolves.toBe(5);
await expect(Promise.reject(new Error("x"))).rejects.toMatch(/x/);
```

Matchers include: `toBe`, `toEqual`, `toStrictEqual`, `toBeTruthy/Falsy`,
`toBeNull/Undefined/Defined/NaN`, `toBeGreaterThan(OrEqual)`,
`toBeLessThan(OrEqual)`, `toBeCloseTo`, `toContain`, `toContainEqual`,
`toMatch`, `toMatchObject`, `toHaveLength`, `toHaveProperty`, `toBeInstanceOf`,
`toBeType`, `toBeOneOf`, `toThrow`, `toSatisfy`, `toBeEmpty`.

## Soft assertions

Collect every failure and report them together instead of stopping at the first:

```js
import { softly } from "two-go";

softly((expect) => {
  expect(res.status).toBe(200);
  expect(res.get("data")).toHaveLength(2);
  expect(res.get("data[0].role")).toBe("admin");
}); // throws once at the end listing all failures, if any
```

Or manage the lifecycle yourself with `soft()` -> `{ expect, verify, failures }`.

## Polling: eventually / pollUntil

For eventual-consistency APIs, retry until an assertion passes or a timeout hits:

```js
import { eventually, pollUntil } from "two-go";

// retry the whole assertion block until it stops throwing
await eventually(async () => {
  await api.get("/jobs/123").expectJson("status", "done");
}, { timeout: 5000, interval: 200 });

// poll a request until a predicate on the result is true
const res = await pollUntil(
  () => api.get("/jobs/123"),
  (r) => r.get("status") === "done",
  { timeout: 5000, interval: 200 },
);
```

## Snapshot testing

```js
import { toMatchSnapshot } from "two-go";

const res = await api.get("/users");
toMatchSnapshot(res.body, "users-list");
// First run writes __snapshots__/users-list.json and passes.
// Later runs deep-compare and throw on drift.
// Set TWO_GO_UPDATE_SNAPSHOTS=1 (or { update: true }) to refresh.
```

## Session chaining

Extract a value from one response and reuse it in subsequent requests via
`{{var}}` interpolation:

```js
import { session } from "two-go";

const s = session("https://api.example.com");

await s.post("/login").json({ user: "ada", pass: "x" })
  .extract("token", "data.token");      // store body.data.token as {{token}}

await s.get("/me")
  .header("authorization", "Bearer {{token}}")  // interpolated from the session
  .expectOk();
```

## Faker-lite test data

```js
import { faker } from "two-go";

const payload = {
  id: faker.uuid(),
  email: faker.email(),
  name: faker.fullName(),
  age: faker.int(18, 80),
  tags: faker.arrayOf(() => faker.word(), 3),
};
```

Includes `uuid`, `email`, `firstName/lastName/fullName`, `username`, `word(s)`,
`sentence`, `paragraph`, `number/int/float`, `boolean`, `pick/pickMany`,
`date/pastDate/futureDate`, `hexColor`, `ipv4`, `url`, `phone`, `arrayOf`.

## Async control-flow

```js
import { parallel, parallelLimit, series, waterfall, mapLimit, withTimeout } from "two-go";

await parallel([() => a(), () => b()]);          // all at once, ordered results
await parallelLimit(tasks, 4);                   // bounded concurrency
await series([() => step1(), () => step2()]);    // sequential
await waterfall([() => seed(), (v) => next(v)]); // pass result to the next
await mapLimit(ids, 5, (id) => api.get(`/x/${id}`));
await withTimeout(slowPromise, 1000, "too slow");
```

## Utility belt

A lodash-inspired, zero-dependency toolkit. Import flat from `two-go/utils`, or
use the `_` namespace and `chain()` from the main entry:

```js
import { chunk, groupBy, get, set, camelCase, debounce, retry } from "two-go/utils";
import { _, chain } from "two-go";

_.uniqBy([{ id: 1 }, { id: 1 }, { id: 2 }], "id"); // [{id:1},{id:2}]

chain([1, 2, 2, 3, 4])
  .uniq()
  .filter((n) => n % 2 === 0)
  .map((n) => n * 10)
  .value(); // [20, 40]
```

Groups: array, collection, object, string, number, function (incl. `debounce`,
`throttle`, `memoize`, `retry`, `sleep`), lang (type guards, `isEqual`,
`cloneDeep`), and misc (`identity`, `flow`, `times`, `uniqueId`, ...).

## Schema validation & inference

```js
import { validate } from "two-go/schema";
import { inferSchema } from "two-go";

validate({ id: 1 }, { type: "object", required: ["id"], properties: { id: { type: "integer" } } });
// { valid: true, errors: [] }

const res = await api.get("/users");
const schema = res.toSchema();          // infer a JSON schema from the response
await api.get("/users").expectJsonSchema(schema); // reuse it as a contract
```

## Debugging: curl export & logging

```js
import { enableLogging } from "two-go";

console.log(api.get("/users").bearer("x").toCurl()); // copy-paste curl command

const off = enableLogging(api);   // log every request/response (method, url, status, time)
// ... run requests ...
off();                            // restore
```

## Running with node:test (or Jest / Vitest / Mocha)

Because assertions throw, no adapter is needed:

```js
import { test } from "node:test";
import { go } from "two-go";

const api = go("https://api.example.com");

test("GET /users", async () => {
  await api.get("/users").expectStatus(200).expectJson("data[0].id");
});
```

```bash
node --test
```

## Running with the built-in CLI

Write suites in `*.twogo.mjs` files (the legacy `*.2go.mjs` suffix also works).
Each file registers a suite with `suite()`; the CLI discovers and runs them.

```js
// test/users.twogo.mjs
import { go, suite } from "two-go";

const api = go("https://api.example.com");

suite("users API", ({ test, before, after }) => {
  test("lists users", async () => {
    await api.get("/users").expectStatus(200).expectJson("data[0].id");
  });
});
```

```bash
npx two-go            # discovers *.twogo.mjs under ./test
npx two-go path/to/dir
```

The CLI prints green `✓` for passes and red `✗` with the error for failures,
ends with `N passed, M failed`, and exits non-zero when anything fails.

### Programmatic runner

```js
import { suite, run } from "two-go";

suite("smoke", ({ test }) => {
  test("health", async () => {
    await go("https://api.example.com").get("/health").expectOk();
  });
});

const { passed, failed } = await run();
```

## TypeScript

two-go ships hand-written `.d.ts` declarations for the entire public API, so
editors get full autocomplete and type checking with **no `@types` package and
no runtime dependency**. It works from both `two-go` and every subpath:

```ts
import go, { expect, faker } from "two-go";
import { chunk } from "two-go/utils";

const res = await go("https://api.example.com").get("/users").expectOk();
res.expectValue("data[0].id").toBeGreaterThan(0); // typed end to end
```

## Docker

Run the suite in a reproducible container:

```bash
docker build -t two-go .
docker run --rm two-go
```

## Development

```bash
npm test          # unit tests (node:test) + end-to-end self test
npm run test:unit # unit tests only
npm run test:e2e  # self test only
npm run typecheck # type-check the .d.ts against a usage smoke test (tsc)
```

## Publishing

```bash
npm version patch          # bump version
npm pack --dry-run         # preview the published file list
npm publish --access public
```

Only `src`, `bin`, and `README.md` are published (see the `files` field).

## License

MIT (c) 2026 Tugkan Boz
