// Type-only smoke test: exercises the public surface so tsc validates the
// .d.ts declarations and their cross-references. Not shipped, not executed.
import go, {
  expect,
  faker,
  chain,
  validate,
  soft,
  softly,
  eventually,
  pollUntil,
  session,
  parallel,
  series,
  withTimeout,
  toCurl,
  inferSchema,
  toMatchSnapshot,
  _,
} from "../src/index.js";
import { chunk, get, camelCase, debounce } from "../src/utils/index.js";
import { expect as expect2 } from "../src/expect.js";

async function main() {
  const api = go("https://example.com");

  // Thenable builder + chainable assertions
  const res = await api
    .get("/users")
    .bearer("t")
    .query({ page: 1 })
    .expectStatus(200)
    .expectJson("data[0].id", 1)
    .expectOk();

  res.expectClientError().expectContentType("json");
  const e: ReturnType<typeof expect> = res.expectValue("data[0].id");
  e.toBeGreaterThan(0);
  const schema = res.toSchema();
  const curl: string = api.get("/x").toCurl();

  // Jest-style expect
  expect(2).toBe(2);
  expect([1, 2, 3]).toContain(2);
  expect("x").not.toBe("y");
  await expect(Promise.resolve(1)).resolves.toBe(1);
  expect2(1).toBe(1);

  // utils
  const c: number[][] = chunk([1, 2, 3], 2);
  const v: unknown = get({ a: 1 }, "a");
  const cc: string = camelCase("hello world");
  const d = debounce(() => {}, 10);
  const chained: unknown = chain([1, 2, 2]).uniq().value();
  const id: typeof _.identity = _.identity;

  // schema + infer
  const r = validate({ id: 1 }, { type: "object", required: ["id"] });
  const inferred = inferSchema({ a: 1 });

  // differentiators
  const s = soft();
  s.expect(1).toBe(1);
  s.verify();
  softly((ex) => ex(1).toBe(1));
  await eventually(async () => res.expectOk(), { timeout: 100, interval: 10 });
  await pollUntil(() => api.get("/x"), (rr) => rr.status === 200, { timeout: 100 });
  const sess = session("https://example.com");
  await sess.post("/login").json({ u: "a" }).extract("token", "data.token");
  await parallel([() => api.get("/a"), () => api.get("/b")]);
  await series([() => api.get("/a")]);
  await withTimeout(api.get("/a"), 1000, "slow");
  const cu: string = toCurl(api.get("/a"));
  toMatchSnapshot({ a: 1 }, "snap", { dir: "/tmp" });

  // faker
  const uuid: string = faker.uuid();
  const n: number = faker.int(1, 10);

  void [res, schema, curl, c, v, cc, d, chained, id, r, inferred, uuid, n, cu];
}

void main;
