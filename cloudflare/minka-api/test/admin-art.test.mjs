// The gallery's administrator: password from the ADMIN_PASSWORD secret, wrong ones
// counted and blocked, only mood-sky pictures deleted, a ticket the feedback API checks.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)).default;

function fakeEnv() {
  const kv = new Map(), failures = new Map(), likes = [];
  const DB = {
    prepare(sql) {
      const st = { sql: sql.replace(/\s+/g, " ").trim(), values: [] };
      st.bind = (...v) => { st.values = v; return st; };
      st.first = async () => {
        if (st.sql.startsWith("SELECT window_start, count FROM login_failures")) return failures.get(st.values[0]) || null;
        return null;
      };
      st.run = async () => {
        if (st.sql.startsWith("INSERT INTO login_failures")) {
          const [ip, now] = st.values, row = failures.get(ip);
          failures.set(ip, row ? { window_start: row.window_start, count: row.count + 1 } : { window_start: now, count: 1 });
        }
        if (st.sql.startsWith("DELETE FROM art_likes WHERE art_id")) likes.push(st.values[0]);
        return { meta: { changes: 1 } };
      };
      st.all = async () => ({ results: [] });
      return st;
    },
    batch: async () => []
  };
  const MINKA_EMOJI = {
    getWithMetadata: async (key) => kv.has(key) ? kv.get(key) : { value: null, metadata: null },
    get: async (key) => kv.has(key) ? kv.get(key).value : null,
    delete: async (key) => { kv.delete(key); },
    put: async (key, value, opts) => { kv.set(key, { value, metadata: opts && opts.metadata }); }
  };
  return { APP_PASSWORD: "app-secret", ADMIN_PASSWORD: "777", DB, MINKA_EMOJI, kv, failures, likes };
}
const ART = "0123456789abcdef0123456789abcdef", CARD = "fedcba9876543210fedcba9876543210";
const call = (env, path, body, ip = "1.2.3.4") => worker.fetch(new Request("https://api.rgapp.page" + path, {
  method: "POST", headers: { authorization: "Bearer app-secret", "content-type": "application/json", "cf-connecting-ip": ip }, body: JSON.stringify(body)
}), env, { waitUntil() {} });

test("only a logged-in device may try", async () => {
  const env = fakeEnv();
  const r = await worker.fetch(new Request("https://api.rgapp.page/api/admin/check", { method: "POST", body: "{}" }), env, { waitUntil() {} });
  assert.equal(r.status, 401);
});

test("the password is checked on the server and wrong ones are counted, then blocked", async () => {
  const env = fakeEnv();
  assert.equal((await call(env, "/api/admin/check", { password: "777" })).status, 200);
  for (let i = 0; i < 10; i++) assert.equal((await call(env, "/api/admin/check", { password: "000" }, "9.9.9.9")).status, 403);
  assert.equal((await call(env, "/api/admin/check", { password: "777" }, "9.9.9.9")).status, 429);
  assert.equal((await call(env, "/api/admin/check", { password: "777" }, "1.2.3.4")).status, 200);
});

test("without the secret set nothing can be deleted", async () => {
  const env = fakeEnv(); delete env.ADMIN_PASSWORD;
  assert.equal((await call(env, "/api/admin/check", { password: "" })).status, 503);
});

test("a gallery drawing's picture is deleted and a ticket given; a card's own picture is not", async () => {
  const env = fakeEnv();
  env.kv.set("skin-art::" + ART, { value: new ArrayBuffer(8), metadata: { sky: true } });
  env.kv.set("skin-art::" + CARD, { value: new ArrayBuffer(8), metadata: null });
  const r = await call(env, "/api/admin/art-delete", { password: "777", artId: ART });
  const d = await r.json();
  assert.equal(r.status, 200);
  assert.ok(!env.kv.has("skin-art::" + ART));
  assert.deepEqual(env.likes, [ART]);
  assert.match(d.ticket, /^\d{13}\.[a-f0-9]{64}$/);
  // the feedback API's check
  assert.equal((await (await call(env, "/api/admin/ticket", { artId: ART, ticket: d.ticket })).json()).ok, true);
  assert.equal((await (await call(env, "/api/admin/ticket", { artId: CARD, ticket: d.ticket })).json()).ok, false);
  assert.equal((await (await call(env, "/api/admin/ticket", { artId: ART, ticket: d.ticket.replace(/.$/, "0") })).json()).ok, d.ticket.endsWith("0"));
  const card = await call(env, "/api/admin/art-delete", { password: "777", artId: CARD });
  assert.equal(card.status, 400);
  assert.ok(env.kv.has("skin-art::" + CARD));
});

test("a wrong password deletes nothing", async () => {
  const env = fakeEnv();
  env.kv.set("skin-art::" + ART, { value: new ArrayBuffer(8), metadata: { sky: true } });
  assert.equal((await call(env, "/api/admin/art-delete", { password: "778", artId: ART })).status, 403);
  assert.ok(env.kv.has("skin-art::" + ART));
});
