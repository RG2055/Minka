import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const source = await readFile(new URL('../../cloudflare/minka-api/src/index.js', import.meta.url), 'utf8');
const fixture = { '01.02.2040': [{ hours: 8, tokens: ['sample', 'alpha'] }] };
let calls = 0;
const worker = new Function('fetch', source.replace('export default worker;', 'return worker;'))(async () => {
  calls++;
  return Response.json({ radiographers: {}, radiologists: {} });
});
const env = { APP_PASSWORD: 'test-password', SOURCE_URL: 'https://example.test/schedule', KNOWN_CARRYOVERS_JSON: JSON.stringify(fixture) };
const request = token => new Request('https://example.test/api/schedule', { headers: token ? { authorization: 'Bearer ' + token } : {} });
test('anonymous and invalid sessions cannot read schedule exceptions or reach upstream', async () => {
  for (const token of ['', 'wrong']) {
    const r = await worker.fetch(request(token), env, {});
    assert.equal(r.status, 401);
    assert.equal((await r.text()).includes('sample'), false);
  }
  assert.equal(calls, 0);
  const r = await worker.fetch(request('undefined'), {}, {});
  assert.equal(r.status, 401);
});
test('authenticated schedule includes private exceptions in one no-store response', async () => {
  const r = await worker.fetch(request('test-password'), env, {});
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  const data = await r.json();
  assert.deepEqual(data.knownCarryovers, fixture);
  assert.deepEqual(data.radiographers, {});
  assert.equal(calls, 1);
});
test('missing or invalid secret fails explicitly rather than showing incorrect shifts', async () => {
  for (const value of [undefined, 'oops', 'null', '[]']) {
    const r = await worker.fetch(request('test-password'), { ...env, KNOWN_CARRYOVERS_JSON: value }, {});
    assert.equal(r.status, 503);
    assert.equal((await r.text()).includes('sample'), false);
  }
  assert.equal(calls, 1);
});

test('exception-only updates invalidate the schedule render fingerprint', async () => {
  const calendar = await readFile(new URL('../js/calendar.js', import.meta.url), 'utf8');
  const start = calendar.indexOf('  function __gScheduleFingerprint(');
  const code = calendar.slice(start, calendar.indexOf('  function __gHasAuth()', start));
  const fingerprint = new Function('getScheduleChannel', code + '; return __gScheduleFingerprint;')((data, channel) => data[channel]);
  const before = { radiographers: {}, radiologists: {}, knownCarryovers: {} };
  assert.notEqual(fingerprint(before), fingerprint({ ...before, knownCarryovers: fixture }));
  assert.equal(fingerprint(before), fingerprint(JSON.parse(JSON.stringify(before))));
});
