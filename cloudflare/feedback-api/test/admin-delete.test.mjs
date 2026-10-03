// The gallery's administrator removes any drawing's messages, but only with a ticket
// that minka-api (the AUTH service binding) says is valid.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)).default;
const ART = "0123456789abcdef0123456789abcdef";

function fakeEnv(ticketOk) {
  const rows = [
    { id: 1, body: "[[rgdraw;art=" + ART + ";f=2]]" },
    { id: 2, body: "Labs zīmējums!" },
    { id: 3, body: "[[rgdraw;art=ffffffffffffffffffffffffffffffff]]" }
  ];
  const seen = [];
  return {
    rows, seen,
    AUTH: { fetch: async (url, init) => {
      seen.push([String(url), JSON.parse(init.body), new Headers(init.headers).get("authorization")]);
      if (String(url).endsWith("/api/me")) return new Response(JSON.stringify({ ok: true }));
      return new Response(JSON.stringify({ ok: ticketOk }));
    } },
    DB: { prepare(sql) {
      const st = { values: [] };
      st.bind = (...v) => { st.values = v; return st; };
      st.all = async () => {
        if (/^DELETE FROM feedback_messages WHERE instr\(body, \?1\) > 0/.test(sql)) {
          const gone = rows.filter((r) => r.body.includes(st.values[0]));
          gone.forEach((r) => rows.splice(rows.indexOf(r), 1));
          return { results: gone.map((r) => ({ id: r.id })) };
        }
        return { results: [] };
      };
      return st;
    } }
  };
}
const del = (env, body) => worker.fetch(new Request("https://feedback.rgapp.page/api/feedback/admin", {
  method: "DELETE", headers: { authorization: "Bearer s1.token", "content-type": "application/json" }, body: JSON.stringify(body)
}), env);

test("a valid ticket removes the drawing's messages only", async () => {
  const env = fakeEnv(true);
  const r = await del(env, { artId: ART, ticket: "123.abc" });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).deleted, 1);
  assert.deepEqual(env.rows.map((x) => x.id), [2, 3]);
  const ask = env.seen.find((s) => s[0].endsWith("/api/admin/ticket"));
  assert.deepEqual(ask[1], { artId: ART, ticket: "123.abc" });
  assert.equal(ask[2], "Bearer s1.token");
});

test("without minka-api's yes nothing is removed", async () => {
  const env = fakeEnv(false);
  assert.equal((await del(env, { artId: ART, ticket: "123.abc" })).status, 403);
  assert.equal(env.rows.length, 3);
});

test("a bad request is refused before asking", async () => {
  const env = fakeEnv(true);
  assert.equal((await del(env, { artId: "nope", ticket: "x" })).status, 400);
  assert.equal(env.rows.length, 3);
});
