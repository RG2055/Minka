// The day reply lists when each drink was logged; a "minus" takes back the newest drink of its source.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)).default;
const events = [
  { worker: "TESTA LIETOTAJS", source: "philips", delta: 1, created_at: 1000 },
  { worker: "TESTA LIETOTAJS", source: "monster", delta: 2, created_at: 2000 },
  { worker: "TESTA LIETOTAJS", source: "philips", delta: 1, created_at: 3000 },
  { worker: "TESTA LIETOTAJS", source: "philips", delta: -1, created_at: 4000 },
  { worker: "CITS DARBINIEKS", source: "lofbergs", delta: 1, created_at: 0 }
];
const COFFEE_DB = {
  prepare(sql) {
    const st = { bind: () => st, run: async () => ({}), first: async () => null };
    st.all = async () => ({ results: /SELECT worker, source, delta, created_at/.test(sql) ? events : [] });
    return st;
  }
};
test("day reply carries the times of the drinks that are still counted", async () => {
  const res = await worker.fetch(new Request("https://coffee.rgapp.page/api/coffee?date=10.11.2026", { headers: { authorization: "Bearer x" } }), { COFFEE_DB }, { waitUntil() {} });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data.times["TESTA LIETOTAJS"], [["philips", 1000], ["monster", 2000]]);
  assert.deepEqual(data.times["CITS DARBINIEKS"], [["lofbergs", 0]]);
});
