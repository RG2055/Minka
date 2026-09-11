import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)).default;

function fakeEnv() {
  const rows = [];
  const statement = (sql) => {
    const s = sql.replace(/\s+/g, " ").trim();
    let values = [];
    return {
      bind(...v) { values = v; return this; },
      async run() {
        if (s.startsWith("INSERT INTO radio_days")) {
          const [day, station, firstAt] = values;
          if (!rows.some((r) => r.shift_day === day && r.station === station)) rows.push({ shift_day: day, station, first_at: firstAt });
        }
        return { success: true };
      },
      async all() {
        if (s.startsWith("SELECT shift_day, station, first_at FROM radio_days")) {
          const [from, to] = values;
          return { results: rows.filter((r) => r.shift_day >= from && r.shift_day <= to) };
        }
        return { results: [] };
      }
    };
  };
  return { rows, DB: { prepare: statement } };
}

const post = (body) => new Request("https://feedback.test/api/radio", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
});

test("a station is recorded once per shift day and read back by range", async () => {
  const env = fakeEnv();
  assert.equal((await worker.fetch(post({ date: "2026-09-10", station: "Remix" }), env)).status, 200);
  assert.equal((await worker.fetch(post({ date: "2026-09-10", station: "Remix" }), env)).status, 200);
  assert.equal((await worker.fetch(post({ date: "2026-09-11", station: "  Gop  FM " }), env)).status, 200);
  assert.equal(env.rows.length, 2);
  assert.equal(env.rows[1].station, "Gop FM");
  const res = await worker.fetch(new Request("https://feedback.test/api/radio?from=2026-09-01&to=2026-09-30"), env);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.deepEqual(data.days.map((d) => d.day + "|" + d.station), ["2026-09-10|Remix", "2026-09-11|Gop FM"]);
});

test("invalid input is rejected", async () => {
  const env = fakeEnv();
  assert.equal((await worker.fetch(post({ date: "2026-13-01", station: "Remix" }), env)).status, 400);
  assert.equal((await worker.fetch(post({ date: "2026-09-10", station: "<b>x</b>" }), env)).status, 400);
  assert.equal((await worker.fetch(post({ date: "2099-01-01", station: "Remix" }), env)).status, 400);
  assert.equal((await worker.fetch(new Request("https://feedback.test/api/radio?from=2026-01-01&to=2026-12-31"), env)).status, 400);
  assert.equal(env.rows.length, 0);
});
