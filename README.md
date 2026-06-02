# twogo

Zero-dependency, fluent service / API testing for Node.js. Write expressive
HTTP tests with a chainable builder and inline assertions that **throw on
failure**, so the same tests run standalone (via the built-in runner) or inside
`node:test`, Jest, Vitest, and Mocha.

- Zero runtime dependencies. Uses the native `fetch`.
- ESM, Node >= 18.
- Fluent request building: headers, query, bearer auth, JSON/form/text bodies, timeouts.
- Inline assertions: status, headers, JSON paths, body, response time, custom checks.
- A tiny built-in runner plus a `twogo` CLI for standalone suites.

## Installation

```bash
npm install twogo --save-dev
```

## Quick start

```js
import { go } from "twogo";

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

## Request building

Every HTTP verb (`get`, `put`, `post`, `patch`, `delete`, `head`, `options`)
returns a chainable, thenable `RequestBuilder`:

```js
await api.post("/users")
  .header("x-request-id", "abc")     // single header
  .headers({ "x-trace": "1" })       // multiple headers
  .query({ page: 1, tags: ["a", "b"] }) // query params (arrays repeat the key)
  .bearer("TOKEN")                   // authorization: Bearer TOKEN
  .json({ name: "Ada" })             // JSON body + content-type
  .timeout(5000)                     // per-request timeout (ms)
  .expectStatus(201);
```

Body helpers (mutually exclusive):

| Method        | Effect                                                        |
| ------------- | ------------------------------------------------------------- |
| `.json(obj)`  | `JSON.stringify` body + `content-type: application/json`      |
| `.form(obj)`  | URL-encoded body + `content-type: application/x-www-form-urlencoded` |
| `.text(str)`  | raw text body (`content-type: text/plain` unless already set) |

Absolute `http(s)://` paths bypass the base URL. Responses whose
`content-type` contains `application/json` or `+json` are parsed automatically;
otherwise the body is left as text.

## Assertions

Assertions can be queued on the builder (replayed in order when awaited) or
called directly on a resolved `GoResponse`. Each returns the response for
chaining and throws an `AssertionError` on failure. The message format is:

```
<METHOD> <URL> -> <description>
```

| Assertion                       | Meaning                                                       |
| ------------------------------- | ------------------------------------------------------------- |
| `expectStatus(code)`            | status equals `code`                                          |
| `expectStatusIn(...codes)`      | status is one of `codes`                                      |
| `expectOk()`                    | status is 2xx                                                 |
| `expectHeader(name)`            | header is present                                             |
| `expectHeader(name, matcher)`   | header value matches (string / RegExp / predicate / object)   |
| `expectJson(path)`              | JSON value at `path` exists                                   |
| `expectJson(path, expected)`    | JSON value at `path` matches `expected`                       |
| `expectBody(matcher)`           | body matches (text for string/RegExp, parsed for object)      |
| `expectTimeBelow(ms)`           | response time is below `ms`                                   |
| `check(label, fn)`              | fails if `fn(response)` returns `false` or throws             |

### Matchers

`expectJson`, `expectHeader`, and `expectBody` accept a flexible matcher:

- **RegExp** — tested against `String(value)`
- **function** — predicate; a truthy return means match
- **object / array** — deep structural equality
- **primitive** — strict `===`

### Reading values

```js
const res = await api.get("/users").expectOk();
const firstId = res.get("data[0].id"); // dot + bracket path
console.log(res.status, res.time, res.headers["content-type"]);
```

`GoResponse` fields: `status`, `statusText`, `headers` (lowercase keys),
`body` (parsed), `text` (raw), `time` (ms), `url`, `method`.

## Running with node:test (or Jest / Vitest / Mocha)

Because assertions throw, no adapter is needed:

```js
import { test } from "node:test";
import { go } from "twogo";

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
Each file registers a suite with `suite()`; the CLI discovers them and runs
them.

```js
// test/users.twogo.mjs
import { go, suite } from "twogo";

const api = go("https://api.example.com");

suite("users API", ({ test, before, after }) => {
  test("lists users", async () => {
    await api.get("/users").expectStatus(200).expectJson("data[0].id");
  });
});
```

```bash
npx twogo            # discovers *.twogo.mjs under ./test
npx twogo path/to/dir
```

The CLI prints green `✓` for passes and red `✗` with the error for failures,
ends with `N passed, M failed`, and exits non-zero when anything fails.

### Programmatic runner

```js
import { suite, run } from "twogo";

suite("smoke", ({ test }) => {
  test("health", async () => {
    await go("https://api.example.com").get("/health").expectOk();
  });
});

const { passed, failed } = await run();
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
