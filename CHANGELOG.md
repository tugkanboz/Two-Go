# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Importers**: `fromOpenapi` and `fromPostman` generate runnable
  `*.twogo.mjs` suites from an OpenAPI 3 document or a Postman v2.1 collection
  (JSON). New CLI command `two-go gen <openapi|postman> <file> [-o <out>]` and
  the `two-go/importers` subpath.

## [0.4.0]

### Added

- **TypeScript types**: hand-checked `.d.ts` declarations for the entire public
  API (core, assertions, utilities, and every feature), wired through the
  `types` field and per-subpath `exports` conditions. Full editor autocomplete
  with no runtime dependency.
- **GitHub Actions CI** running the suite on Node 18 / 20 / 22.
- **Dockerfile** + `.dockerignore` to run the test suite in a container.
- `prepublishOnly` (tests gate publishing) and `typecheck` scripts.

## [0.3.0]

### Added

- **Soft assertions** (`soft` / `softly`): collect every failure and report
  them together instead of failing fast.
- **Polling** (`eventually`, `pollUntil`, `retryUntil`): retry an assertion or
  request until it passes or a timeout elapses.
- **Snapshot testing** (`toMatchSnapshot`, `matchSnapshot`, `readSnapshot`)
  with an update mode (`TWO_GO_UPDATE_SNAPSHOTS`).
- **Session chaining** (`session`): extract values from a response and reuse
  them in later requests via `{{var}}` interpolation.
- **Faker-lite** (`faker`): zero-dependency fake test data (uuid, email, names,
  numbers, dates, and more).
- **Async control-flow** (`parallel`, `parallelLimit`, `series`, `waterfall`,
  `mapAsync`, `mapLimit`, `withTimeout`, `allSettledMap`).
- **curl export** (`RequestBuilder.toCurl()`, `toCurl`) and request/response
  **logging** (`enableLogging`).
- **Schema inference** (`inferSchema`, `GoResponse.toSchema()`).
- Subpath exports for every feature area.

## [0.2.0]

### Added

- A lodash-inspired, zero-dependency **utility belt** (~170 functions) across
  array, collection, object, string, number, function, lang, and misc groups,
  plus an eager `chain()` wrapper. Available from `two-go/utils` and the `_`
  namespace.
- A **Jest-style `expect()`** with `.not` negation and `.resolves` / `.rejects`.
- Extended **HTTP assertions** on `GoResponse` (status classes, headers,
  cookies, JSON length/contains, schema, sorted, `expectValue`).
- A tiny **JSON-schema validator** (`validate`, `isValid`).
- Subpath exports `two-go/utils`, `two-go/expect`, `two-go/schema`.

## [0.1.0]

### Added

- Initial release: zero-dependency fluent HTTP client (`go`), thenable
  `RequestBuilder`, `GoResponse` with inline assertions, a minimal `suite()` /
  `run()` runner, and the `two-go` CLI.
