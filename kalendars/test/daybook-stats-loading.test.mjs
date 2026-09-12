import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL('../js/' + name, import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

function harness({ selected = '2026-09-02', stored = {} } = {}) {
  const storage = new Map(Object.entries(stored).map(([key, value]) => [key, JSON.stringify(value)]));
  const requests = [], events = {}, windowEvents = {};
  const modal = { style: { display: 'flex' } };
  const wrap = { innerHTML: '', classList: { add() {} } };
  class Clock extends Date { static now() { return Date.parse('2026-09-02T12:00:00Z'); } }
  const c = vm.createContext({
    Date: Clock, Intl, AbortSignal,
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    document: {
      getElementById: id => id === 'stats-modal' ? modal : id === 'stats-table-wrap' ? wrap : null,
      addEventListener: (type, fn) => { events[type] = fn; }
    },
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject, done: false }))
  });
  c.window = c;
  c.addEventListener = (type, fn) => { windowEvents[type] = fn; };
  c.MINKA_FEEDBACK_API_BASE = 'https://feedback.test';
  c.MINKA_COFFEE_API_BASE = 'https://coffee.test';
  c.MinkaDaybook = {
    esc: s => String(s ?? ''), selectedDay: () => selected,
    ratings: () => JSON.parse(storage.get('minkaShiftPulseV2') || '{}'), radio: () => []
  };
  vm.runInContext(read('daybook-model.js'), c);
  vm.runInContext(read('daybook-stats.js'), c);
  function reply(req, body = { ok: true, ratings: {}, counts: {}, details: {}, days: [], totals: {} }, ok = true) {
    req.done = true;
    req.resolve({ ok, json: async () => body });
  }
  return {
    c, modal, wrap, requests, storage, reply,
    render: () => c.MinkaDaybookStats.render(),
    click(selector, dataset = {}) {
      events.click({ target: { closest: s => s === '#stats-table-wrap' ? wrap : s === selector ? { dataset } : null } });
    },
    online: () => windowEvents.online(),
    async settle(handler = req => reply(req)) {
      // Bounded even when a regression keeps starting new requests.
      for (let round = 0; round < 40; round++) {
        const pending = requests.filter(req => !req.done);
        if (!pending.length) { await tick(); if (!requests.some(req => !req.done)) return; }
        for (const req of pending) handler(req);
        await tick();
      }
      modal.style.display = 'none';
      assert.fail('requests did not settle');
    }
  };
}

const isRating = req => req.url.includes('/api/feedback?');
const isCoffee = req => req.url.includes('/api/coffee?date=');

test('first lazy render uses the selected calendar month and late data preserves navigation', async () => {
  const h = harness({ selected: '2026-08-15' });
  h.render();
  assert.match(h.wrap.innerHTML, /Augusts 2026/);
  h.click('[data-db-nav]', { dbNav: 1 });
  assert.match(h.wrap.innerHTML, /Septembris 2026/);
  await h.settle();
  assert.match(h.wrap.innerHTML, /Septembris 2026/);
  h.modal.style.display = 'none';
  h.render(); // Existing modal opener renders before making the modal visible.
  h.modal.style.display = 'flex';
  await h.settle();
  assert.match(h.wrap.innerHTML, /Augusts 2026/);
});

for (const failure of ['network', 'http', 'invalid']) {
  test(`ratings ${failure} failure stops retrying and retains cached data until explicit retry`, async () => {
    const cached = { '2026-09-01': { good: 4 } };
    const h = harness({ stored: { minkaShiftPulseV2: cached, minkaShiftPulsePendingV2: { '2026-09-01': { good: 1 } } } });
    h.render();
    await h.settle(req => {
      if (!isRating(req)) return h.reply(req);
      if (failure === 'network') { req.done = true; req.reject(new Error('offline')); }
      else h.reply(req, { ok: false }, failure !== 'http');
    });
    assert.equal(h.requests.filter(isRating).length, 2);
    assert.deepEqual(JSON.parse(h.storage.get('minkaShiftPulseV2')), cached);
    assert.match(h.wrap.innerHTML, /pašsajūtas.*Mēģināt vēlreiz/);
    h.render(); await tick();
    assert.equal(h.requests.filter(isRating).length, 2);
    h.click('[data-db-retry]');
    await h.settle(req => h.reply(req, { ok: true, ratings: { good: 7 } }));
    assert.equal(h.requests.filter(isRating).length, 4);
    assert.equal(JSON.parse(h.storage.get('minkaShiftPulseV2'))['2026-09-01'].good, 8);
    assert.doesNotMatch(h.wrap.innerHTML, /Mēģināt vēlreiz/);
  });
}

test('failed coffee day remains retryable, preserves cache and does not reload successful days', async () => {
  const h = harness({ stored: { minkaCoffeeCountsV1: { '01.09.2026': { anna: 3 } } } });
  h.render();
  await h.settle(req => h.reply(req, { ok: !req.url.includes('date=01.09.2026'), counts: { anna: 4 } }));
  assert.equal(h.requests.filter(isCoffee).length, 2);
  assert.equal(JSON.parse(h.storage.get('minkaCoffeeCountsV1'))['01.09.2026'].anna, 3);
  h.click('[data-db-tab]', { dbTab: 'coffee' });
  await h.settle();
  assert.match(h.wrap.innerHTML, /kafijas.*Mēģināt vēlreiz/);
  assert.equal(h.requests.filter(isCoffee).length, 2);
  h.click('[data-db-retry]');
  await h.settle(req => h.reply(req, { ok: true, counts: { anna: 6 }, details: { anna: { spendCents: 250 } } }));
  const retried = h.requests.filter(isCoffee);
  assert.equal(retried.length, 3);
  assert.match(retried[2].url, /date=01.09.2026/);
  assert.equal(JSON.parse(h.storage.get('minkaCoffeeCountsV1'))['01.09.2026'].anna, 6);
  assert.equal(JSON.parse(h.storage.get('minkaCoffeeDetailsV1'))['01.09.2026'].anna.spendCents, 250);
  assert.doesNotMatch(h.wrap.innerHTML, /Mēģināt vēlreiz/);
});

test('restored connectivity retries failed days and hidden statistics do not fetch', async () => {
  const h = harness();
  h.render();
  await h.settle(req => h.reply(req, { ok: false }, false));
  const count = h.requests.length;
  h.modal.style.display = 'none';
  h.online(); await tick();
  assert.equal(h.requests.length, count);
  h.modal.style.display = 'flex';
  h.online(); await h.settle();
  assert.equal(h.requests.filter(isRating).length, 4);
  assert.equal(h.requests.filter(isCoffee).length, 4);
  assert.doesNotMatch(h.wrap.innerHTML, /Mēģināt vēlreiz/);
});

test('retry in a day detail fetches that day and keeps the detail open', async () => {
  const h = harness();
  h.render();
  await h.settle(req => h.reply(req, { ok: !isRating(req) }));
  h.click('[data-db-day]', { dbDay: '2026-09-01' });
  assert.match(h.wrap.innerHTML, /pašsajūtas.*Mēģināt vēlreiz/);
  h.click('[data-db-retry]');
  await h.settle(req => h.reply(req, { ok: true, ratings: { excellent: 3 } }));
  const ratings = h.requests.filter(isRating);
  assert.equal(ratings.length, 3);
  assert.match(ratings[2].url, /date=2026-09-01/);
  assert.match(h.wrap.innerHTML, /Dienas sajūta/);
  assert.doesNotMatch(h.wrap.innerHTML, /Mēģināt vēlreiz/);
});
