// PIN-protected cards: only the signed-in owner locks, unlocks and changes a locked card.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)).default;
const locks = new Set(), emoji = new Map();
const DB = {
  prepare(sql) {
    const st = { sql: sql.replace(/\s+/g, " ").trim(), v: [] };
    st.bind = (...v) => { st.v = v; return st; };
    st.run = async () => {
      if (st.sql.startsWith("INSERT INTO card_locks")) locks.add(st.v[0]);
      if (st.sql.startsWith("DELETE FROM card_locks")) locks.delete(st.v[0]);
      if (st.sql.includes("INTO emoji_store")) emoji.set(st.v[0], st.v[1]);
      return {};
    };
    st.first = async () => st.sql.startsWith("SELECT 1 AS hit FROM card_locks") && locks.has(st.v[0]) ? { hit: 1 } : null;
    st.all = async () => ({ results: st.sql.startsWith("SELECT worker FROM card_locks") ? [...locks].map((w) => ({ worker: w })) : [] });
    return st;
  },
  batch: async () => []
};
const OWNER = "a".repeat(64), OTHER = "b".repeat(64);
const LACITIS = { async fetch(req) {
  const { sessionToken } = await req.json();
  const name = sessionToken === OWNER ? "Testa Lietotajs" : sessionToken === OTHER ? "Cits Darbinieks" : "";
  return name ? Response.json({ ok: true, session: { name } }) : Response.json({ error: "x" }, { status: 401 });
} };
const env = { APP_PASSWORD: "app-secret", DB, LACITIS, MINKA_EMOJI: { put: async () => {}, delete: async () => {} } };
const call = (path, body) => worker.fetch(new Request("https://api.rgapp.page" + path, {
  method: body ? "POST" : "GET", headers: { authorization: "Bearer app-secret", "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined
}), env, { waitUntil() {} });

test("someone else cannot lock my card", async () => {
  assert.equal((await call("/api/card-lock", { worker: "TESTA LIETOTAJS", locked: true, mediaSession: OTHER })).status, 403);
  assert.equal((await call("/api/card-lock", { worker: "TESTA LIETOTAJS", locked: true })).status, 403);
  assert.equal(locks.size, 0);
});
test("owner locks; others are refused, owner may still change it", async () => {
  assert.equal((await call("/api/card-lock", { worker: "TESTA LIETOTAJS", locked: true, mediaSession: OWNER })).status, 200);
  assert.deepEqual((await (await call("/api/card-locks")).json()).locked, ["testa lietotajs"]);
  assert.equal((await call("/api/emoji", { worker: "TESTA LIETOTAJS", emoji: "🎮" })).status, 423);
  assert.equal((await call("/api/emoji", { worker: "TESTA LIETOTAJS", emoji: "🎮", mediaSession: OTHER })).status, 423);
  assert.equal((await call("/api/skins", { worker: "Testa Lietotajs", skin: null })).status, 423);
  assert.equal((await call("/api/emoji", { worker: "TESTA LIETOTAJS", emoji: "🎮", mediaSession: OWNER })).status, 200);
  assert.equal(emoji.get("TESTA LIETOTAJS"), "🎮");
});
test("unlocked cards stay open to everyone", async () => {
  assert.equal((await call("/api/emoji", { worker: "CITS DARBINIEKS", emoji: "🍕" })).status, 200);
  assert.equal((await call("/api/card-lock", { worker: "TESTA LIETOTAJS", locked: false, mediaSession: OWNER })).status, 200);
  assert.equal((await call("/api/emoji", { worker: "TESTA LIETOTAJS", emoji: "🍕" })).status, 200);
});
