# two-go

[![npm version](https://img.shields.io/npm/v/two-go.svg)](https://www.npmjs.com/package/two-go)
[![npm downloads](https://img.shields.io/npm/dm/two-go.svg)](https://www.npmjs.com/package/two-go)
[![CI](https://github.com/tugkanboz/two-go/actions/workflows/ci.yml/badge.svg)](https://github.com/tugkanboz/two-go/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/two-go.svg)](./LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](./package.json)
[![types](https://img.shields.io/badge/types-included-blue.svg)](./src/index.d.ts)

**two-go** is a zero-dependency, fluent toolkit for testing HTTP services and
APIs in Node.js. You describe a request with a chainable builder, attach inline
assertions, and `await` it. Assertions **throw on failure**, so the same tests
run standalone (built-in runner / CLI) or inside `node:test`, Jest, Vitest, and
Mocha — no adapter required.

On top of the HTTP core, two-go bundles the things real API test suites need:
a value-assertion API, soft assertions, polling, JSON snapshots, session
chaining, fake data, async control-flow, a general-purpose utility belt, and
JSON-schema validation/inference. All with **zero runtime dependencies** and
**TypeScript types included**.

```js
import { go } from "two-go";

await go("https://api.example.com")
  .get("/users")
  .bearer(token)
  .expectStatus(200)
  .expectHeader("content-type", /json/)
  .expectJson("data[0].id", 1);
```

---

## Who is it for?

| Audience | What they get |
| -------- | ------------- |
| **QA / automation engineers** | API, integration, e2e and regression tests; polling for async APIs; soft assertions; snapshots; session/auth chaining; fake data; a CLI to run suites |
| **Backend / full-stack developers** | Code-first integration tests in `node:test`/Jest/Vitest/Mocha; CI-friendly; a `expect()` for any value; a utility belt and schema tools reusable in app code |

two-go is an **API / service testing** library (integration & e2e). It is *not*
a unit-test runner itself — instead it plugs into the runner you already use,
and its assertions feel like the unit-test assertions you already know.

---

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Subpath exports](#subpath-exports)
- [Request building](#request-building)
- [HTTP assertions](#http-assertions)
- [Value assertions: expect()](#value-assertions-expect)
- [Soft assertions](#soft-assertions)
- [Polling: eventually / pollUntil](#polling-eventually--polluntil)
- [Snapshot testing](#snapshot-testing)
- [Session chaining](#session-chaining)
- [Fake data: faker](#fake-data-faker)
- [Async control-flow](#async-control-flow)
- [Utility belt](#utility-belt)
- [Schema validation & inference](#schema-validation--inference)
- [Debugging: curl export & logging](#debugging-curl-export--logging)
- [Running your tests](#running-your-tests)
- [TypeScript](#typescript)
- [Docker](#docker)
- [Recipes](#recipes)
- [How it compares](#how-it-compares)
- [API reference summary](#api-reference-summary)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Development](#development)
- [Publishing](#publishing)
- [License](#license)

---

## Installation

```bash
npm install two-go --save-dev
# or
pnpm add -D two-go
# or
yarn add -D two-go
```

Requirements: **Node.js >= 18** (uses the native `fetch`). ESM only
(`"type": "module"` or `.mjs`). Zero runtime dependencies.

---

## Quick start

```js
import { go } from "two-go";

const api = go("https://api.example.com");

// Awaiting the builder sends the request and replays the queued assertions.
const res = await api
  .get("/users")
  .query({ page: 1 })
  .expectStatus(200)
  .expectJson("data[0].id", 1);

// You also have the resolved response to inspect.
console.log(res.status, res.time, res.get("data[0].name"));
```

`go()` takes a base URL string, or an options object:

```js
const api = go({
  baseURL: "https://api.example.com",
  headers: { "x-api-key": "secret" }, // default headers for every request
  timeout: 10000,                     // default timeout (ms)
});
```

---

## Core concepts

three small pieces:

- **`GoClient`** — created by `go()`. Holds the base URL, default headers and
  timeout. Exposes one method per HTTP verb.
- **`RequestBuilder`** — returned by `client.get(...)` etc. A **thenable**:
  chain configuration and assertions, then `await` it (or call `.run()`) to send.
- **`GoResponse`** — the resolved result. Holds the parsed body and metadata,
  and carries every assertion method.

```js
const builder = api.get("/users");   // RequestBuilder (not sent yet)
const res = await builder;            // GoResponse (sent, assertions replayed)
```

A `GoResponse` has:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `status` | number | HTTP status code |
| `statusText` | string | HTTP status text |
| `headers` | object | response headers, **lowercase keys** |
| `body` | any | parsed JSON when the content-type is JSON, otherwise the raw text |
| `text` | string | the raw response body |
| `time` | number | round-trip time in ms |
| `url` | string | the final request URL |
| `method` | string | the HTTP method |
| `get(path)` | method | read a value from `body` via a dot/bracket path |

---

## Subpath exports

Import everything from `two-go`, or pull a focused area from a subpath. All
subpaths ship TypeScript types.

| Import | Contents |
| ------ | -------- |
| `two-go` | everything (default `go`, assertions, utilities, all features) |
| `two-go/utils` | the utility belt (flat named exports) |
| `two-go/expect` | the standalone `expect()` |
| `two-go/schema` | `validate` / `isValid` JSON-schema validator |
| `two-go/soft` | soft assertions |
| `two-go/eventually` | `eventually` / `pollUntil` |
| `two-go/snapshot` | snapshot testing |
| `two-go/session` | stateful request chaining |
| `two-go/faker` | fake data generator |
| `two-go/async` | async control-flow helpers |
| `two-go/curl` | curl export + logging |
| `two-go/infer-schema` | schema inference |

---

## Request building

Every verb (`get`, `put`, `post`, `patch`, `delete`, `head`, `options`) returns
a chainable, thenable `RequestBuilder`.

```js
await api.post("/users")
  .header("x-request-id", "abc")          // one header
  .headers({ "x-trace": "1", lang: "en" }) // many headers
  .query({ page: 1, tags: ["a", "b"] })    // query params (arrays repeat the key)
  .bearer("TOKEN")                         // authorization: Bearer TOKEN
  .json({ name: "Ada", role: "admin" })    // JSON body + content-type
  .timeout(5000)                           // per-request timeout (ms)
  .expectStatus(201);
```

### Configuration methods

| Method | Effect |
| ------ | ------ |
| `.header(name, value)` | set a single header |
| `.headers(obj)` | merge multiple headers |
| `.query(obj)` | append query params (array values repeat the key) |
| `.bearer(token)` | set `authorization: Bearer <token>` |
| `.json(obj)` | `JSON.stringify` body + `content-type: application/json` |
| `.form(obj)` | URL-encoded body + `content-type: application/x-www-form-urlencoded` |
| `.text(str)` | raw text body (`content-type: text/plain` unless already set) |
| `.timeout(ms)` | per-request timeout, overrides the client default |
| `.run()` | send explicitly and return a `Promise<GoResponse>` |

Notes:

- **Absolute URLs** (`http(s)://...`) passed to a verb bypass the base URL.
- The request **times out** via `AbortController`; a timeout rejects with a
  descriptive error.
- Header keys are normalized to lowercase for predictable merging.

---

## HTTP assertions

Assertions can be **queued on the builder** (replayed in order when awaited) or
**called on a resolved `GoResponse`**. Each returns the response for chaining
and throws an `AssertionError` on failure. Failure messages are formatted as:

```
<METHOD> <URL> -> <description>
```

### Status

| Assertion | Meaning |
| --------- | ------- |
| `expectStatus(code)` | status equals `code` |
| `expectStatusIn(...codes)` | status is one of `codes` |
| `expectOk()` | 2xx |
| `expectClientError()` | 4xx |
| `expectServerError()` | 5xx |
| `expectRedirect()` | 3xx |
| `expectCreated()` | 201 |
| `expectAccepted()` | 202 |
| `expectNoContent()` | 204 |
| `expectBadRequest()` | 400 |
| `expectUnauthorized()` | 401 |
| `expectForbidden()` | 403 |
| `expectNotFound()` | 404 |

### Headers & cookies

| Assertion | Meaning |
| --------- | ------- |
| `expectHeader(name, matcher?)` | header present / value matches |
| `expectHeaderContains(name, substr)` | header value contains substring |
| `expectHeaderAbsent(name)` | header is not present |
| `expectContentType(type)` | content-type contains `type` |
| `expectCookie(name, matcher?)` | a `set-cookie` is present / matches |

### Body & JSON

| Assertion | Meaning |
| --------- | ------- |
| `expectJson(path, expected?)` | value at `path` exists / matches |
| `expectJsonLength(path, n)` | array/string at `path` has length `n` |
| `expectArrayLength(path, n)` | alias for array length |
| `expectJsonContains(path, value)` | array contains item (objects match by **subset**) |
| `expectJsonSchema(schema)` | `body` validates against a JSON schema |
| `expectSorted(path, options?)` | array at `path` is sorted (`{ key?, order? }`) |
| `expectBody(matcher)` | whole body matches (deep for objects) |
| `expectBodyContains(substr)` | raw text body contains `substr` |
| `expectEmpty()` / `expectNotEmpty()` | body is empty / not |
| `expectTimeBelow(ms)` | round-trip time below `ms` |
| `check(label, fn)` | fails if `fn(response)` returns `false` or throws |
| `expectValue(path)` | returns an `expect()` bound to the value at `path` |

```js
const res = await api.get("/users").expectOk();

res.expectValue("data[0].id").toBeGreaterThan(0);
res.expectValue("data").toHaveLength(2);
res.expectJsonContains("users", { id: 2 });            // subset match
res.expectSorted("data", { key: "id", order: "asc" });
```

### Matchers

`expectHeader`, `expectJson`, and `expectBody` accept a flexible matcher:

- **RegExp** — tested against `String(value)`
- **function** — predicate; a truthy return means match
- **object / array** — deep structural equality
- **primitive** — strict `===`

```js
await api.get("/users")
  .expectJson("data[0].role", (role) => role === "admin")     // predicate
  .expectJson("meta", { page: 1, total: 2 })                  // deep object
  .expectHeader("x-trace-id", /^[0-9a-f-]+$/);                 // regex
```

---

## Value assertions: expect()

`expect(value)` works on **any value**, not just responses. The matcher API is
the familiar `expect(x).toBe(y)` shape, with `.not` negation and
`.resolves` / `.rejects` for promises.

```js
import { expect } from "two-go";

expect(2 + 2).toBe(4);
expect({ a: 1, b: 2 }).toMatchObject({ a: 1 });
expect([1, 2, 3]).toContain(2);
expect("hello").toMatch(/ell/);
expect(value).not.toBeNull();
expect(() => boom()).toThrow(/boom/);

await expect(Promise.resolve(5)).resolves.toBe(5);
await expect(Promise.reject(new Error("x"))).rejects.toMatch(/x/);
```

**Matchers:** `toBe`, `toEqual`, `toStrictEqual`, `toBeTruthy`, `toBeFalsy`,
`toBeNull`, `toBeUndefined`, `toBeDefined`, `toBeNaN`, `toBeGreaterThan`,
`toBeGreaterThanOrEqual`, `toBeLessThan`, `toBeLessThanOrEqual`, `toBeCloseTo`,
`toContain`, `toContainEqual`, `toMatch`, `toMatchObject`, `toHaveLength`,
`toHaveProperty`, `toBeInstanceOf`, `toBeType`, `toBeOneOf`, `toThrow`,
`toSatisfy`, `toBeEmpty` — each also available negated via `.not`.

---

## Soft assertions

Collect every failure and report them together, instead of stopping at the
first one. Ideal for verifying many fields of one response in a single run.

```js
import { softly } from "two-go";

softly((expect) => {
  expect(res.status).toBe(200);
  expect(res.get("data")).toHaveLength(2);
  expect(res.get("data[0].role")).toBe("admin");
}); // throws ONCE at the end, listing every failure (if any)
```

Manage the lifecycle yourself with `soft()`:

```js
import { soft } from "two-go";

const s = soft();
s.expect(res.status).toBe(200);
s.expect(res.get("total")).toBeGreaterThan(0);
console.log(s.failures);  // string[] of collected failures so far
s.verify();               // throws an aggregated AssertionError if any failed
```

---

## Polling: eventually / pollUntil

For eventual-consistency or async workflows (a job finishes, a record appears),
retry until it passes or a timeout elapses.

```js
import { eventually, pollUntil } from "two-go";

// Retry the whole assertion block until it stops throwing.
await eventually(async () => {
  await api.get("/jobs/123").expectJson("status", "done");
}, { timeout: 5000, interval: 200 });

// Poll a request until a predicate on the result is true; returns the result.
const done = await pollUntil(
  () => api.get("/jobs/123"),
  (r) => r.get("status") === "done",
  { timeout: 5000, interval: 200, message: "job never finished" },
);
```

Options: `{ timeout = 5000, interval = 100, message }`. `retryUntil` is an alias
of `eventually`.

---

## Snapshot testing

Record a response/value once, then detect drift on later runs.

```js
import { toMatchSnapshot } from "two-go";

const res = await api.get("/users");
toMatchSnapshot(res.body, "users-list");
```

- First run writes `__snapshots__/users-list.json` and **passes**.
- Later runs deep-compare and **throw** on any difference.
- Refresh with `{ update: true }` or the env var `TWO_GO_UPDATE_SNAPSHOTS=1`.
- Custom directory via `{ dir: "path/to/snapshots" }`.
- `readSnapshot(name, options?)` returns the stored value; `matchSnapshot` is an alias.

---

## Session chaining

Extract a value from one response and reuse it in later requests via `{{var}}`
interpolation. Great for login → token → authorized call.

```js
import { session } from "two-go";

const s = session("https://api.example.com");

// Store body.data.token as {{token}} in the session context.
await s.post("/login")
  .json({ user: "ada", pass: "secret" })
  .extract("token", "data.token");

// {{token}} is interpolated into headers/path/body before sending.
await s.get("/me")
  .header("authorization", "Bearer {{token}}")
  .expectOk()
  .expectJson("user", "ada");
```

- `extract("name", "json.path")` or `extract({ token: "data.token", id: "data.id" })`.
- Manual control: `s.set(name, value)`, `s.get(name)`, `s.vars` (the context object).
- `{{var}}` placeholders are interpolated in the path, header values, and string body.

---

## Fake data: faker

Zero-dependency fake data for test payloads.

```js
import { faker } from "two-go";

const payload = {
  id: faker.uuid(),
  email: faker.email(),
  name: faker.fullName(),
  age: faker.int(18, 80),
  active: faker.boolean(),
  tags: faker.arrayOf(() => faker.word(), 3),
  createdAt: faker.pastDate(),
};
```

Available: `uuid`, `email`, `firstName`, `lastName`, `fullName`, `username`,
`word`, `words(n)`, `sentence(n)`, `paragraph(n)`, `number({min,max})`,
`int(min,max)`, `float(min,max,decimals)`, `boolean`, `pick(array)`,
`pickMany(array,n)`, `date(options)`, `pastDate`, `futureDate`, `hexColor`,
`ipv4`, `url`, `phone`, `arrayOf(fn,n)`.

---

## Async control-flow

The area plain utility libraries are weak at.

```js
import {
  parallel, parallelLimit, series, waterfall, mapLimit, withTimeout,
} from "two-go";

await parallel([() => a(), () => b()]);            // all at once, ordered results
await parallelLimit(tasks, 4);                     // bounded concurrency
await series([() => step1(), () => step2()]);      // sequential
await waterfall([() => seed(), (v) => next(v)]);   // pass each result to the next
await mapLimit(ids, 5, (id) => api.get(`/items/${id}`));
await withTimeout(slowPromise, 1000, "too slow");  // reject if it takes too long
```

Also: `mapAsync(items, fn)` and `allSettledMap(items, fn)` (never rejects;
returns `{ status, value|reason }[]`).

---

## Utility belt

A general-purpose, zero-dependency toolkit (~170 functions). Import flat from
`two-go/utils`, or use the `_` namespace and `chain()` from the main entry.

```js
import { chunk, groupBy, get, set, camelCase, debounce, retry, sleep } from "two-go/utils";
import { _, chain } from "two-go";

_.uniqBy([{ id: 1 }, { id: 1 }, { id: 2 }], "id"); // [{id:1},{id:2}]

chain([1, 2, 2, 3, 4])
  .uniq()
  .filter((n) => n % 2 === 0)
  .map((n) => n * 10)
  .value(); // [20, 40]
```

Groups:

- **array** — `chunk`, `compact`, `difference(By)`, `drop`, `take`, `flatten(Deep)`, `uniq(By)`, `union(By)`, `intersection(By)`, `zip`, `without`, `head`, `last`, `nth`, ...
- **collection** — `map`, `filter`, `reduce`, `find`, `some`, `every`, `groupBy`, `keyBy`, `countBy`, `orderBy`, `sortBy`, `partition`, `sample`, `shuffle`, `size`, ...
- **object** — `get`, `set`, `has`, `unset`, `pick(By)`, `omit(By)`, `merge`, `mergeDeep`, `defaults`, `mapValues`, `mapKeys`, `invert`, `keys`, `values`, `entries`, ...
- **string** — `camelCase`, `kebabCase`, `snakeCase`, `startCase`, `capitalize`, `truncate`, `pad(Start|End)`, `words`, `escape`, `deburr`, `template`, ...
- **number** — `clamp`, `inRange`, `random`, `round`, `sum(By)`, `mean(By)`, `min(By)`, `max(By)`, `range`, ...
- **function** — `debounce`, `throttle`, `once`, `memoize`, `curry`, `partial`, `sleep`, `retry`, `negate`, ...
- **lang** — `isString`, `isNumber`, `isArray`, `isPlainObject`, `isEmpty`, `isEqual`, `cloneDeep`, ... (type guards as TS type predicates)
- **misc** — `identity`, `noop`, `times`, `uniqueId`, `flow`, `matches`, `iteratee`, ...

---

## Schema validation & inference

A tiny JSON-schema validator, plus inference from an example value for
lightweight contract testing.

```js
import { validate } from "two-go/schema";
import { inferSchema } from "two-go";

validate(
  { id: 1, name: "Ada" },
  { type: "object", required: ["id"], properties: { id: { type: "integer" } } },
);
// => { valid: true, errors: [] }

// Infer a schema from a real response, then reuse it as a contract.
const res = await api.get("/users");
const schema = res.toSchema();                 // or inferSchema(res.body)
await api.get("/users").expectJsonSchema(schema);
```

Supported keywords: `type`, `required`, `properties`, `items`, `enum`, `const`,
`minLength`, `maxLength`, `minimum`, `maximum`, `pattern`, `nullable`.

---

## Debugging: curl export & logging

```js
import { enableLogging } from "two-go";

// Print a copy-pasteable curl command (also importable into Postman).
console.log(api.get("/users").bearer("x").toCurl());

// Log every request/response (method, url, status, time).
const off = enableLogging(api);
await api.get("/users");
off(); // restore
```

---

## Running your tests

Because assertions throw, two-go works in any runner with no adapter.

### node:test

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

### Jest / Vitest / Mocha

```js
import { describe, it } from "vitest"; // or @jest/globals, or mocha
import { go } from "two-go";

describe("users API", () => {
  it("lists users", async () => {
    await go("https://api.example.com").get("/users").expectStatus(200);
  });
});
```

### Built-in CLI

Write suites in `*.twogo.mjs` files (the legacy `*.2go.mjs` suffix also works).
Each file registers a suite with `suite()`; the CLI discovers and runs them.

```js
// test/users.twogo.mjs
import { go, suite } from "two-go";

const api = go("https://api.example.com");

suite("users API", ({ test, before, after }) => {
  before(async () => { /* setup */ });
  test("lists users", async () => {
    await api.get("/users").expectStatus(200).expectJson("data[0].id");
  });
  after(async () => { /* teardown */ });
});
```

```bash
npx two-go            # discovers *.twogo.mjs under ./test
npx two-go path/to/dir
```

The CLI prints green `✓` / red `✗` with the error, ends with
`N passed, M failed`, and exits non-zero when anything fails.

### Programmatic runner

```js
import { suite, run, reset } from "two-go";

suite("smoke", ({ test }) => {
  test("health", async () => {
    await go("https://api.example.com").get("/health").expectOk();
  });
});

const { passed, failed } = await run();
```

---

## TypeScript

two-go ships hand-written `.d.ts` declarations for the entire public API, so you
get full autocomplete and type checking with **no `@types` package and no
runtime dependency** — from both `two-go` and every subpath.

```ts
import go, { expect, faker } from "two-go";
import { chunk } from "two-go/utils";

const res = await go("https://api.example.com").get("/users").expectOk();
res.expectValue("data[0].id").toBeGreaterThan(0); // typed end to end
const ids: number[][] = chunk([1, 2, 3, 4], 2);
```

---

## Docker

Run the suite in a reproducible container:

```bash
docker build -t two-go .
docker run --rm two-go
```

---

## Recipes

### Authenticated flow (login → use token)

```js
import { session } from "two-go";

const s = session(process.env.BASE_URL);
await s.post("/auth/login").json({ email, password }).extract("token", "data.token");
await s.get("/account").header("authorization", "Bearer {{token}}").expectOk();
```

### Retry a flaky / async endpoint

```js
import { eventually } from "two-go";

await eventually(() => api.get("/report/42").expectJson("ready", true),
  { timeout: 10000, interval: 500 });
```

### Data-driven (table) tests with node:test

```js
import { test } from "node:test";
import { go } from "two-go";

const api = go(process.env.BASE_URL);
const cases = [
  { id: 1, status: 200 },
  { id: 999999, status: 404 },
];

for (const c of cases) {
  test(`GET /users/${c.id} -> ${c.status}`, async () => {
    await api.get(`/users/${c.id}`).expectStatus(c.status);
  });
}
```

### Paginate and collect

```js
import { mapLimit } from "two-go";

const pages = await mapLimit([1, 2, 3, 4, 5], 2, (p) =>
  api.get("/users").query({ page: p }));
const all = pages.flatMap((r) => r.get("data"));
```

### Contract test from a known-good response

```js
import { inferSchema } from "two-go";

const golden = (await api.get("/users")).body;
const schema = inferSchema(golden);
// later, in CI:
await api.get("/users").expectJsonSchema(schema);
```

### CI (GitHub Actions)

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 20 }
- run: npm test
```

---

## How it compares

| | two-go | Postman | supertest | chai/jest only |
| --- | --- | --- | --- | --- |
| HTTP client built in | yes (native fetch) | yes (GUI) | yes (around an app) | no |
| Tests live as code in git | yes | collections (JSON) | yes | yes |
| Runs in node:test/Jest/Vitest/Mocha | yes | no (sandbox) | yes | yes |
| Inline HTTP assertions | yes | `pm.*` | partial | no |
| Value assertions (`expect`) | yes | Chai | no | yes |
| Polling / soft / snapshot / session | yes | partial | no | no |
| Utility belt + fake data | yes | limited | no | no |
| Runtime dependencies | 0 | n/a | several | several |

> two-go does not run *inside* Postman (Postman's sandbox forbids arbitrary npm
> packages). Use `toCurl()` to move a request from two-go into Postman.

---

## API reference summary

```text
go(baseURL | { baseURL, headers, timeout }) -> GoClient
GoClient: get put post patch delete head options (path) -> RequestBuilder; send(req)
RequestBuilder (thenable): header headers query bearer json form text timeout
                           + queued assertions + run()
GoResponse: status statusText headers body text time url method; get(path)
            + all HTTP assertions; expectValue(path) -> Expectation; toSchema(path?)
expect(value) -> Expectation (matchers + .not + .resolves/.rejects)
soft() -> { expect, verify, failures };  softly(fn)
eventually(fn, opts);  pollUntil(fn, predicate, opts);  retryUntil
toMatchSnapshot(value, name, opts);  matchSnapshot;  readSnapshot
session(baseURL) -> verbs -> SessionRequest(.extract, thenable); set/get/vars
faker.{ uuid email fullName int float boolean pick date arrayOf ... }
async: parallel parallelLimit series waterfall mapAsync mapLimit withTimeout allSettledMap
utils (two-go/utils, _ , chain): array/collection/object/string/number/function/lang/misc
validate(value, schema);  isValid(value, schema);  inferSchema(value)
toCurl(req);  req.toCurl();  enableLogging(client, opts)
suite(name, fn);  run();  reset()   // built-in runner
```

---

## FAQ

**Is this a unit-testing framework?** No — it is an API/service testing library
that runs inside your existing unit-test runner. (Its own internal functions are
covered by real unit tests.)

**Can I use it inside Postman scripts?** No. Postman's sandbox only allows a
fixed set of built-in libraries and no ESM imports. Use `toCurl()` to move a
request *to* Postman instead.

**Does it need TypeScript?** No. It is plain ESM JavaScript; types are shipped
for editors/TS users but never required.

**CommonJS support?** two-go is ESM-only. Use it from ESM (`import`) or a dynamic
`import()` in CommonJS.

**Why zero dependencies?** Faster installs, no supply-chain surface, and it runs
anywhere Node 18+ runs.

---

## Roadmap

Planned, in rough priority order (suggestions welcome via issues):

1. **OpenAPI / Postman importers** — generate `*.twogo.mjs` tests from an OpenAPI
   spec or a Postman collection.
2. **Reporters** — JUnit XML and JSON output from the built-in runner for CI.
3. **GraphQL helper** — `.graphql(query, variables)` on the builder.
4. **Cookie jar / persistent sessions** — automatic cookie carry-over.
5. **Retry/backoff at the request level** — `.retry({ attempts, backoff })`.
6. **Mock server helper** — a one-liner local server for fixtures.
7. **Performance assertions** — percentile/latency checks over repeated calls.

---

## Development

```bash
npm test          # unit tests (node:test) + end-to-end self test
npm run test:unit # unit tests only
npm run test:e2e  # self test only
npm run typecheck # type-check the .d.ts against a usage smoke test (tsc)
```

Contributions are welcome. Please keep the **zero-dependency** rule, add tests
for new behavior, and run `npm test` and `npm run typecheck` before opening a PR.

---

## Publishing

```bash
npm version patch          # bump version
npm pack --dry-run         # preview the published file list
npm publish --access public
```

`prepublishOnly` runs the full test suite before any publish. Only `src`, `bin`,
`README.md`, and `CHANGELOG.md` are published.

---

## License

[MIT](./LICENSE) (c) 2026 Tugkan Boz
