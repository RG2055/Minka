import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const worker = (await import(new URL('../../cloudflare/minka-api/src/index.js', import.meta.url))).default;

// A D1 stand-in backed by a real in-memory SQLite, with the session tables.
function d1() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(new URL('../../cloudflare/minka-api/migrations/0004_sessions.sql', import.meta.url), 'utf8'));
  db.exec(fs.readFileSync(new URL('../../cloudflare/minka-api/migrations/0001_pair_codes.sql', import.meta.url), 'utf8'));
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { const r = db.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; }
  });
  return { raw: db, prepare: sql => stmt(sql) };
}

const env = () => ({ APP_PASSWORD: 'team-secret', DB: d1() });
const login = (e, password, ip = '10.0.0.1') => worker.fetch(new Request('https://api.test/api/login', {
  method: 'POST', headers: { 'cf-connecting-ip': ip }, body: JSON.stringify({ password })
}), e, { waitUntil() {} });
const me = (e, token) => worker.fetch(new Request('https://api.test/api/me', { headers: { authorization: 'Bearer ' + token } }), e, { waitUntil() {} });

test('signing in hands out a per-device token, never the password', async () => {
  const e = env();
  const r = await login(e, 'team-secret');
  const { token } = await r.json();
  assert.equal(r.status, 200);
  assert.notEqual(token, 'team-secret');
  assert.match(token, /^s1\./);
  assert.equal((await me(e, token)).status, 200);
  const stored = e.DB.raw.prepare('SELECT token_hash FROM sessions').all();
  assert.equal(stored.length, 1);
  assert.notEqual(stored[0].token_hash, token, 'only a hash is stored');
  assert.equal((await me(e, 's1.forged')).status, 401);
});

test('devices holding the password still work; an expired token does not', async () => {
  const e = env();
  assert.equal((await me(e, 'team-secret')).status, 200);
  const { token } = await (await login(e, 'team-secret')).json();
  e.DB.raw.prepare('UPDATE sessions SET expires_at = 1').run();
  assert.equal((await me(e, token)).status, 401);
});

test('a token close to expiry is extended while the device is used', async () => {
  const e = env();
  const { token } = await (await login(e, 'team-secret')).json();
  const soon = Date.now() + 10 * 86400000;
  e.DB.raw.prepare('UPDATE sessions SET expires_at = ?').run(soon);
  assert.equal((await me(e, token)).status, 200);
  const { expires_at } = e.DB.raw.prepare('SELECT expires_at FROM sessions').get();
  assert.ok(expires_at > Date.now() + 80 * 86400000);
});

test('ten wrong passwords from one address lock sign-in for that address only', async () => {
  const e = env();
  for (let i = 0; i < 10; i++) assert.equal((await login(e, 'wrong', '10.9.9.9')).status, 401);
  assert.equal((await login(e, 'team-secret', '10.9.9.9')).status, 429);
  assert.equal((await login(e, 'team-secret', '10.9.9.8')).status, 200);
});
