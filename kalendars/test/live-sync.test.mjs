import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const calendar = await readFile(new URL('../js/calendar.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
const clone = value => JSON.parse(JSON.stringify(value));
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function environment() {
  const timers = new Map();
  let sequence = 0;
  const listeners = {};
  const document = {
    hidden: false, readyState: 'complete',
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    dispatchEvent(event) { (listeners[event.type] || []).forEach(fn => fn(event)); },
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    document, console, URL,
    setTimeout(fn, delay) { const id = ++sequence; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval() {},
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
  });
  context.window = context;
  context.addEventListener = document.addEventListener;
  return {
    context, document, timers,
    runTimer(delay) {
      const entry = [...timers].find(([, task]) => task.delay === delay);
      assert.ok(entry, `Expected a ${delay}ms timer`);
      timers.delete(entry[0]);
      entry[1].fn();
    }
  };
}

function coffeeClient() {
  const env = environment();
  const c = env.context;
  let day = '06.09.2026';
  let counts = {}, details = {}, calls = 0, paints = 0;
  let reply = { ok: true, date: day, counts: {}, details: {} };
  c.getCoffeeDayKey = () => day;
  c.getCoffeePersonKey = name => name.trim().toLowerCase();
  c.getCoffeeStore = () => counts;
  c.saveCoffeeStore = value => { counts = value; };
  c.getCoffeeDetailStore = () => details;
  c.saveCoffeeDetailStore = value => { details = value; };
  c.normalizeCoffeeDetail = value => value;
  c.cleanCoffeeSource = value => value;
  c.updateCoffeeRow = () => {};
  c.coffeeApiFetch = () => { calls++; return Promise.resolve({ ok: true, json: () => clone(reply) }); };
  c.__activeDateStr = day;
  c.moodStatsCache = {};
  c.paintMoodCoffee = force => { assert.equal(force, true); paints++; };
  vm.runInContext(calendar.slice(calendar.indexOf('    function applyCoffeeCounts('), calendar.indexOf('    function formatCoffeeEuro(')), c);
  const start = html.indexOf('  var moodCoffeeWatch = 0;');
  vm.runInContext(html.slice(start, html.indexOf('  syncFeedbackModalState(false);', start)), c);
  return Object.assign(env, {
    reply(value) { reply = value; },
    select(value) { day = value; c.__activeDateStr = value; },
    snapshot() { return { counts: clone(counts), details: clone(details), calls, paints }; }
  });
}

test('coffee polling and new roster renders share caches and one storage listener', async () => {
  const env = environment();
  const c = env.context;
  const store = new Map();
  let reads = 0, storageListeners = 0;
  c.localStorage = {
    getItem(key) { reads++; return store.get(key) || null; },
    setItem(key, value) { store.set(key, value); }
  };
  c.addEventListener = (name, fn) => {
    if (name === 'storage') storageListeners++;
    env.document.addEventListener(name, fn);
  };
  c.activeDateStr = '06.09.2026';
  c.fetch = () => Promise.resolve({ ok: true, json: () => ({
    ok: true, date: c.activeDateStr, counts: { ANNA: 2 },
    details: { ANNA: { sources: { philips: 2 } } }
  }) });
  const sharedStart = calendar.indexOf('  let coffeeStoreCache = null;');
  vm.runInContext(calendar.slice(sharedStart, calendar.indexOf('  function g_updateList()', sharedStart)), c);
  const core = calendar.slice(calendar.indexOf("    const coffeeStoreKey ="), calendar.indexOf('    function formatCoffeeEuro('));
  const readerStart = calendar.indexOf('    window.__minkaGetCoffeeDetailsForNames =');
  const reader = calendar.slice(readerStart, calendar.indexOf('    window.__minkaGetCoffeeTotalForNames =', readerStart));
  vm.runInContext('function renderCoffee() {' + core + reader +
    '; return { pollCoffeeDay, getCoffeeStore, getCoffeeDetailStore }; }', c);
  const firstRender = c.renderCoffee();
  firstRender.getCoffeeStore();
  firstRender.getCoffeeDetailStore();
  for (let i = 0; i < 10; i++) {
    c.renderCoffee();
    assert.equal(c.__minkaGetCoffeeDetailsForNames(['ANNA']).anna.count, 0);
  }
  const initialReads = reads;
  assert.equal(storageListeners, 1, 'day switches must not accumulate storage listeners');
  firstRender.pollCoffeeDay();
  await tick();
  assert.equal(c.__minkaGetCoffeeDetailsForNames(['ANNA']).anna.count, 2,
    'the latest mood reader must see the original polling callback’s update');
  assert.equal(c.__minkaGetCoffeeDetailsForNames(['ANNA']).anna.sources[0].count, 2);
  assert.equal(reads, initialReads, 'sharing updates must not reparse local history');
  store.set('minkaCoffeeCountsV1', JSON.stringify({ [c.activeDateStr]: { anna: 3 } }));
  env.document.dispatchEvent({ type: 'storage', key: 'minkaCoffeeCountsV1' });
  env.runTimer(0);
  assert.equal(c.__minkaGetCoffeeDetailsForNames(['ANNA']).anna.count, 3);
});

test('remote coffee snapshots notify mood without any visible worker-card mutation', async () => {
  const client = coffeeClient();
  client.reply({ ok: true, date: '06.09.2026', counts: { ANNA: 1 }, details: { ANNA: { sources: { philips: 1 } } } });
  client.context.pollCoffeeDay();
  await tick();
  client.runTimer(120);
  assert.equal(client.snapshot().counts['06.09.2026'].anna, 1);
  assert.equal(client.snapshot().paints, 1);
  // Identical totals, changed source: the orbit still needs fresh data.
  client.reply({ ok: true, date: '06.09.2026', counts: { ANNA: 1 }, details: { ANNA: { sources: { narvesen: 1 } } } });
  client.context.pollCoffeeDay();
  await tick();
  client.runTimer(120);
  assert.equal(client.snapshot().paints, 2);
  client.context.pollCoffeeDay();
  await tick();
  assert.equal(client.timers.size, 0, 'unchanged server data must not repaint mood');
});

test('coffee refreshes coalesce and wait while the document is hidden', async () => {
  const client = coffeeClient();
  for (let i = 0; i < 5; i++) client.context.notifyCoffeeChanged();
  assert.equal(client.timers.size, 1);
  client.runTimer(120);
  client.document.hidden = true;
  client.context.pollCoffeeDay();
  client.context.notifyCoffeeChanged();
  assert.equal(client.snapshot().calls, 0);
  assert.equal(client.timers.size, 0);
  client.document.hidden = false;
  client.document.dispatchEvent({ type: 'visibilitychange' });
  client.runTimer(120);
  assert.equal(client.snapshot().paints, 2);
});

test('coffee cannot overlap fetches or paint a response for an inactive day', async () => {
  const client = coffeeClient();
  const pending = deferred();
  let calls = 0;
  client.context.coffeeApiFetch = () => { calls++; return pending.promise; };
  client.context.pollCoffeeDay();
  client.context.pollCoffeeDay();
  assert.equal(calls, 1);
  client.select('07.09.2026');
  pending.resolve({ ok: true, json: () => ({ ok: true, date: '06.09.2026', counts: { ANNA: 2 } }) });
  await tick();
  assert.equal(client.timers.size, 0);
  assert.equal(client.snapshot().counts['06.09.2026'].anna, 2);
});

test('late coffee save acknowledgements stay on the day that was edited', async () => {
  const client = coffeeClient();
  const pending = deferred();
  client.context.coffeeApiFetch = () => pending.promise;
  client.context.postCoffeeDelta('ANNA', 1, null, { source: 'philips' });
  client.select('07.09.2026');
  pending.resolve({ ok: true, json: () => ({ ok: true, date: '06.09.2026', worker: 'ANNA', count: 3 }) });
  await tick();
  assert.equal(client.snapshot().counts['06.09.2026'].anna, 3);
  assert.equal(client.snapshot().counts['07.09.2026'], undefined);
  assert.equal(client.timers.size, 0);
});

function skinClient() {
  const env = environment();
  const c = env.context;
  const store = new Map();
  let writes = 0, calls = 0, addonWrites = 0, addons = {};
  const painted = [];
  let reply = {};
  c.localStorage = {
    getItem: key => store.get(key) || null,
    setItem(key, value) { writes++; store.set(key, value); }
  };
  c.MinkaCardAddons = {
    get: name => addons[name] || null,
    getAll: () => addons,
    replaceFromCloud(value) { addonWrites++; addons = clone(value); }
  };
  c.MinkaApi = {
    getToken: () => true,
    apiFetch(path, options) {
      calls++;
      if (options?.method === 'POST') return Promise.resolve({ ok: true });
      assert.equal(options.cache, 'no-store');
      return Promise.resolve({ ok: true, json: () => clone(reply) });
    }
  };
  const start = html.indexOf('(function MinkaSkins() {');
  const end = html.indexOf('\n})();', start);
  vm.runInContext(html.slice(start, end) + '\nwindow.skinTest = { cloudPull, setSkin, storeSkinLocal, loadAll };\n})();', c);
  c.mkApplySkinToEl = (card, skin) => painted.push({ name: card.getAttribute('data-worker'), skin: skin ? clone(skin) : null });
  env.document.querySelectorAll = () => ['ANNA', 'BERTA'].map(name => ({ getAttribute: () => name }));
  return Object.assign(env, {
    reply(value) { reply = value; },
    snapshot() { return { writes, calls, addonWrites, painted: clone(painted), skins: clone(c.skinTest.loadAll()) }; }
  });
}

test('skin polling updates changed people and clears deleted skins; unchanged polls do no DOM/storage work', async () => {
  const client = skinClient();
  client.reply({ ANNA: 'img:1;av:1', BERTA: 'img:2;av:1' });
  await client.context.skinTest.cloudPull(0);
  assert.equal(client.snapshot().painted.length, 2);
  const first = client.snapshot();
  await client.context.skinTest.cloudPull(0);
  assert.equal(client.snapshot().writes, first.writes);
  assert.equal(client.snapshot().painted.length, first.painted.length);
  assert.equal(client.snapshot().addonWrites, 0);
  client.reply({ ANNA: 'img:3;av:1', BERTA: 'av:1' });
  await client.context.skinTest.cloudPull(0);
  assert.deepEqual(client.snapshot().painted.slice(2), [
    { name: 'ANNA', skin: { t: 'img', id: '3' } }, { name: 'BERTA', skin: null }
  ]);
  assert.equal([...client.timers.values()].filter(t => t.delay === 30000).length, 1);
});

test('skin polling stops while hidden and resumes once on visibility, without overlapping requests', async () => {
  const client = skinClient();
  client.document.hidden = true;
  client.document.dispatchEvent({ type: 'visibilitychange' });
  await client.context.skinTest.cloudPull(0);
  assert.equal(client.snapshot().calls, 0);
  assert.equal(client.timers.size, 0);
  client.document.hidden = false;
  const pending = deferred();
  let calls = 0;
  client.context.MinkaApi.apiFetch = () => { calls++; return pending.promise; };
  client.document.dispatchEvent({ type: 'visibilitychange' });
  client.runTimer(100);
  client.context.skinTest.cloudPull(0);
  assert.equal(calls, 1);
  pending.resolve({ ok: true, json: () => ({}) });
  await tick();
  assert.equal([...client.timers.values()].filter(t => t.delay === 30000).length, 1);
});

test('a stale skin GET cannot overwrite a newer local edit, including clearing a skin', async () => {
  for (const next of [{ t: 'img', id: 'new' }, null]) {
    const client = skinClient();
    client.context.skinTest.storeSkinLocal('ANNA', { t: 'img', id: 'old' });
    const pending = deferred();
    client.context.MinkaApi.apiFetch = () => pending.promise;
    const pull = client.context.skinTest.cloudPull(0);
    client.context.skinTest.storeSkinLocal('ANNA', next);
    pending.resolve({ ok: true, json: () => ({ ANNA: 'img:old;av:1' }) });
    await pull;
    assert.deepEqual(client.snapshot().skins.ANNA || null, next);
  }
});

test('queued and in-flight local skin writes pause reads', async () => {
  const client = skinClient();
  client.context.skinTest.setSkin('ANNA', { t: 'img', id: 'new' }, true);
  await client.context.skinTest.cloudPull(0);
  assert.equal(client.snapshot().calls, 0);
  const pending = deferred();
  let calls = 0;
  client.context.MinkaApi.apiFetch = () => { calls++; return pending.promise; };
  client.runTimer(300);
  await client.context.skinTest.cloudPull(0);
  assert.equal(calls, 1, 'only the pending POST should exist');
  pending.resolve({ ok: true });
  await tick();
});
