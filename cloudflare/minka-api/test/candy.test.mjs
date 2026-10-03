// Konfektes 98's day table: only signed-in devices, today or yesterday, sane scores, the best kept.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)).default;
const rows = new Map();
const DB = {
  prepare(sql) {
    const st = { sql: sql.replace(/\s+/g, " ").trim(), v: [] };
    st.bind = (...v) => { st.v = v; return st; };
    st.run = async () => {
      if (st.sql.startsWith("INSERT INTO candy_scores")) {
        const [day, voter, name, score, at] = st.v, k = day + voter, old = rows.get(k);
        rows.set(k, { day, voter, name, score: old ? Math.max(old.score, score) : score, created_at: at });
      }
      return {};
    };
    st.all = async () => ({ results: [...rows.values()].filter((r) => r.day === st.v[0]).sort((a, b) => b.score - a.score).slice(0, 10) });
    st.first = async () => null;
    return st;
  },
  batch: async () => []
};
const env = { APP_PASSWORD: "app-secret", DB };
const today = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
const call = (method, path, body, token = "app-secret") => worker.fetch(new Request("https://api.rgapp.page" + path, {
  method, headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined
}), env, { waitUntil() {} });

test("needs a login", async () => {
  assert.equal((await call("GET", "/api/candy?day=" + today, null, "nope")).status, 401);
});
test("keeps the best score and shows it as mine", async () => {
  assert.equal((await call("POST", "/api/candy", { day: today, score: 1200, name: "Anonīmais gulbis" })).status, 200);
  assert.equal((await call("POST", "/api/candy", { day: today, score: 800, name: "Anonīmais gulbis" })).status, 200);
  const d = await (await call("GET", "/api/candy?day=" + today)).json();
  assert.equal(d.top.length, 1); assert.equal(d.top[0].score, 1200); assert.equal(d.top[0].me, true);
  assert.equal(d.top[0].name, "Anonīmais gulbis");
});
test("refuses an old day, a silly score and strips markup from the name", async () => {
  assert.equal((await call("POST", "/api/candy", { day: "2020-01-01", score: 5 })).status, 400);
  assert.equal((await call("POST", "/api/candy", { day: today, score: 9e9 })).status, 400);
  await call("POST", "/api/candy", { day: today, score: 5000, name: "<b>x</b>" });
  const d = await (await call("GET", "/api/candy?day=" + today)).json();
  assert.ok(!/[<>]/.test(d.top[0].name));
});
