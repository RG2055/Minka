import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const section = (source, start, end) => {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Missing section: ${start}`);
  return source.slice(a, b);
};
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const tick = () => new Promise(resolve => setImmediate(resolve));

test('radio ignores old-station metadata and coalesces same-station polls', async () => {
  const source = read('js/radio.js'), requests = [], painted = [];
  const c = vm.createContext({
    radioVisualsInactive: () => false, audio: { paused: false }, MK_LOW_SPEC: false,
    npTimer: null, npLastKey: '', npGeneration: 0, npInFlight: null, npMetadataController:null, npStationLogo:'', AbortController, window:{}, stationLogoUrl:()=> 'station-logo',
    deriveRRPrefix: s => s.prefix,
    setNowUI: (...args) => painted.push(args), setInterval: () => 1, clearInterval() {},
    fetchNowForStation: st => { const d = deferred(); requests.push({ st, ...d }); return d.promise; }
  });
  vm.runInContext(section(source, 'async function updateNowPlaying(', '\nfunction toggleMenu('), c);
  c.startNowPlaying({ prefix: 'old' });
  await c.updateNowPlaying({ prefix: 'old' });
  assert.equal(requests.length, 1);
  c.startNowPlaying({ prefix: 'new' });
  requests[1].resolve({ artist: 'New', title: 'Track' });
  await tick();
  requests[0].resolve({ artist: 'Old', title: 'Track' });
  await tick();
  assert.equal(painted.at(-1)[0], 'New');
  c.startNowPlaying({ prefix: 'another' });
  c.startNowPlaying({ prefix: '' });
  requests[2].resolve({ artist: 'Obsolete' });
  await tick();
  assert.equal(painted.at(-1)[0], '', 'unknown metadata leaves a blank line');
  c.startNowPlaying({ prefix: 'same' });
  requests[3].resolve({ artist: 'Same', title: 'Song', cover: 'cover' });
  await tick();
  const count = painted.length;
  const repeat = c.updateNowPlaying({ prefix: 'same' });
  requests[4].resolve({ artist: 'Same', title: 'Song', cover: 'cover' });
  await repeat;
  assert.equal(painted.length, count, 'unchanged metadata does not refit text or dispatch artwork events');
});

for (const path of ['index.html', 'mobile.html']) {
  test(`${path}: unchanged bolus polls share a request and perform no writes or repaint`, async () => {
    const source = read(path), reply = deferred();
    let calls = 0, saves = 0, paints = 0;
    const c = vm.createContext({
      window: {}, Date, AbortController, setTimeout, clearTimeout, GS_URL: 'https://local.test', ROOMS: [{ id: 'ge' }],
      _state: { ge: { changedAt: 123 } }, _history: { ge: [{ ts: 123, name: 'Worker' }] },
      _lastLocalWriteAt: {}, _lastLocalHistWriteAt: {},
      _remoteOverwriteAllowed: () => true, _remoteHistOverwriteAllowed: () => true,
      _syncMediaFromHistory: () => false, _save: () => saves++, _saveHistory: () => saves++,
      _mkToast() {}, fetch: () => { calls++; return reply.promise; }
    });
    vm.runInContext(section(source, 'var _pullPromise = null;', 'function _scheduleSync('), c);
    const first = c._kvPull(() => paints++), second = c._kvPull(() => paints++);
    reply.resolve({ ok: true, json: async () => ({ ge: { history: [{ ts: 123, name: 'Worker' }] } }) });
    await Promise.all([first, second]);
    assert.deepEqual({ calls, saves, paints }, { calls: 1, saves: 0, paints: 0 });
    const pending = deferred();
    c.fetch = () => pending.promise;
    const oldRead = c._kvPull(() => paints++);
    c._lastLocalWriteAt.ge = Date.now();
    c._state.ge.changedAt = 456;
    pending.resolve({ ok: true, json: async () => ({ ge: { history: [{ ts: 999 }] } }) });
    await oldRead;
    assert.equal(c._state.ge.changedAt, 456);
    assert.equal(saves, 0);
    c._lastLocalWriteAt.ge = 0;
    c.fetch = async () => ({ ok: true, json: async () => ({ ge: { history: [] } }) });
    await c._kvPull(() => paints++);
    assert.equal(c._state.ge.changedAt, null, 'remote deletion can move the clock backward');
    assert.equal(c._history.ge.length, 0);
    assert.equal(paints, 1);
  });

  test(`${path}: bolus save reports rejected responses as errors`, async () => {
    const source = read(path), messages = [];
    const c = vm.createContext({
      GS_URL: 'https://local.test', _state: { ge: { changedAt: 123 } }, _names: { ge: 'Worker' },
      _history: { ge: [] }, _bcSync() {}, _pendingThanks: null,
      _prettyFirst: () => '', _mkToast: (text, kind) => messages.push(kind),
      fetch: async () => ({ ok: true, json: async () => ({ ok: false }) })
    });
    vm.runInContext(section(source, 'function _kvPush(', path === 'index.html' ? '// Edit/delete' : 'var _pullPromise'), c);
    c._kvPush('ge');
    await tick();
    assert.deepEqual(messages, ['error']);
  });
}

test('mobile bolus default never synthesizes a future time from an older day', () => {
  const now = new Date(2026, 8, 8, 9, 0).getTime();
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const c = vm.createContext({ Date: Clock, _pick: { ge: null }, _state: { ge: { changedAt: new Date(2026, 8, 6, 17).getTime() } } });
  vm.runInContext(section(read('mobile.html'), 'function _shiftStart()', 'function _save()'), c);
  const selected = new Date(c._pickTs('ge'));
  assert.equal(selected.getDate(), 7);
  assert.equal(selected.getHours(), 17);
  assert.ok(selected.getTime() <= now);
});

test('calendar scheduled sizing uses container width instead of the rAF timestamp', () => {
  const callbacks = [], observers = [];
  const cards = Array.from({ length: 10 }, () => ({ style: {}, querySelector: () => null }));
  const grid = { dataset: {}, style: {}, clientHeight: 0, querySelectorAll: () => cards, querySelector: () => null };
  const container = { clientWidth: 600, clientHeight: 0, classList: { contains: () => true }, querySelectorAll: () => [grid] };
  const c = vm.createContext({
    window: {}, document: { getElementById: () => container },
    requestAnimationFrame: fn => callbacks.push(fn), applyStaffAccents() {},
    ResizeObserver: class { observe() {} },
    MutationObserver: class { constructor(fn) { observers.push(fn); } observe() {} }
  });
  vm.runInContext(section(read('kalendars/js/calendar_extras_v4.js'), '  function autoSizeCards(', '  /* ── 4.'), c);
  c.startCardObserver();
  delete grid.dataset.mkSizeSignature;
  observers[0]();
  callbacks[0](1000000);
  assert.equal(grid.style.gridTemplateColumns, 'repeat(4, minmax(0, 1fr))');
});

test('birthday reads recover after a failed request and cache successful results', async () => {
  let calls = 0, paints = 0;
  const c = vm.createContext({
    AbortController, setTimeout, clearTimeout, window: { MinkaApi: { apiFetch: async () => {
      calls++;
      return calls === 1 ? { ok: false } : { ok: true, json: async () => ({ birthdays: [{ d: '09.09', name: 'Test Worker' }] }) };
    } } }, BIRTHDAYS: [], _bdayLoadPromise: null, _bdayLoaded: false,
    setBirthdays(list) { c.BIRTHDAYS = list; c._bdayLoaded = true; }, refreshBirthdaysUi: () => paints++
  });
  vm.runInContext(section(read('kalendars/js/monthcal.js'), '  function loadBirthdays()', '  function birthdayMap()'), c);
  await c.loadBirthdays(); assert.equal(c._bdayLoaded, false);
  await c.loadBirthdays(); assert.equal(c.BIRTHDAYS.length, 1);
  await c.loadBirthdays(); assert.equal(calls, 2); assert.equal(paints, 1);
});

test('month overview preserves fractional shift hours', () => {
  const c = vm.createContext({});
  vm.runInContext(section(read('kalendars/js/monthcal.js'), '  function hoursOf(', '  function fatColor('), c);
  assert.equal(c.hoursOf({ shift: '7,5h' }), 7.5);
  assert.equal(c.hoursOf({ shift: '12.5h' }), 12.5);
});

test('month resize cancels both queued animation stages', () => {
  const frames = new Map(); let id = 0, fits = 0;
  const c = vm.createContext({
    _fitRaf: 0, fitAll: () => fits++, isOpen: () => true,
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: key => frames.delete(key)
  });
  vm.runInContext(section(read('kalendars/js/monthcal.js'), '  function scheduleFit()', '  function render('), c);
  const step = () => { const [key, fn] = frames.entries().next().value; frames.delete(key); fn(); };
  c.scheduleFit(); step(); c.scheduleFit();
  assert.equal(frames.size, 1);
  step(); step(); assert.equal(fits, 1); assert.equal(frames.size, 0);
});

test('emoji polling sleeps when hidden, coalesces reads, and preserves newer local edits', async () => {
  const source = read('kalendars/js/emoji.js');
  let calls = 0, paints = 0, writes = 0;
  let reply = deferred();
  const c = vm.createContext({
    document: { hidden: true }, _data: { Worker: '🐱' }, GIST_ID: '', LOCAL_KEY: 'emoji',
    hasApiAuth: () => true, sanitizeEmojiMap: x => x,
    refreshAllCards: () => paints++, localStorage: { setItem: () => writes++, removeItem() {} },
    AbortController, clearTimeout() {}, setTimeout() {}, window: { MinkaApi: { apiFetch: () => { calls++; return reply.promise; } } }
  });
  vm.runInContext(section(source, '  var emojiReadPending', '  function loadLocal()'), c);
  await c.loadFromGist(); assert.equal(calls, 0);
  c.document.hidden = false;
  const pending = c.loadFromGist(); await c.loadFromGist(); assert.equal(calls, 1);
  reply.resolve({ ok: true, json: async () => ({ Worker: '🐱' }) }); await pending;
  assert.deepEqual({ writes, paints }, { writes: 0, paints: 0 });
  reply = deferred(); const stale = c.loadFromGist();
  c._data.Worker = '🦊';
  const save = c.saveToGist('Worker');
  reply.resolve({ ok: true, json: async () => ({ Worker: '🐱' }) });
  await Promise.all([stale, save]);
  assert.equal(c._data.Worker, '🦊');
});

test('Apps Script returns both Date cells and text cells in bolus history', () => {
  const when = new Date(2026, 8, 7, 12, 30);
  const sheet = { getLastRow: () => 3, getLastColumn: () => 8,
    getDataRange: () => ({ getValues: () => [[], ['GE kabinets', when, 'One'], ['PHILIPS kabinets', '07.09.2026 12:30', 'Two']] }) };
  const c = vm.createContext({ Date,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) }
  });
  vm.runInContext(read('google_apps_script/minka_cloud.gs'), c);
  const result = c.doGet({ parameter: {} });
  assert.equal(result.ge.changedAt, when.getTime());
  assert.equal(result.philips.changedAt, when.getTime());
});

for (const path of ['cloudflare/minka-api/src/index.js', 'cloudflare/coffee-api/src/index.js']) {
  test(`${path}: oversized streaming JSON is cancelled before reading its remaining body`, async () => {
    const c = vm.createContext({ TextDecoder });
    const source = read(path), start = source.indexOf('async function readJson(');
    vm.runInContext(source.slice(start, source.indexOf('\n}', start) + 2), c);
    let reads = 0, cancelled = false, released = false;
    const request = { headers: new Headers(), body: { getReader: () => ({
      read: async () => { reads++; return { done: false, value: new Uint8Array(6) }; },
      cancel: async () => { cancelled = true; }, releaseLock: () => { released = true; }
    }) } };
    assert.equal(await c.readJson(request, 10), null);
    assert.equal(reads, 2); assert.ok(cancelled); assert.ok(released);
    const encoded = new TextEncoder().encode('{"name":"ā"}');
    let offset = 0;
    request.body.getReader = () => ({ read: async () => offset < encoded.length
      ? { done: false, value: encoded.slice(offset, ++offset) } : { done: true }, releaseLock() {} });
    assert.equal((await c.readJson(request)).name, 'ā');
  });
}

const api = (await import(new URL('cloudflare/minka-api/src/index.js', root))).default;
test('emoji API follows KV pages and skips internal plans without reading their bodies', async () => {
  const reads = [], cursors = [];
  const env = { APP_PASSWORD: 'test', MINKA_EMOJI: {
    async list(options) {
      cursors.push(options.cursor);
      return options.cursor ? { keys: [{ name: 'Worker Two' }], list_complete: true }
        : { keys: ['Worker One', 'ns::07.09.2026', 'nsrooms::07.09.2026', 'skin-art::test'].map(name => ({ name })), list_complete: false, cursor: 'page2' };
    }, async get(name) { reads.push(name); return '🐱'; }
  } };
  const response = await api.fetch(new Request('https://local.test/api/emoji', { headers: { authorization: 'Bearer test' } }), env, {});
  assert.deepEqual(await response.json(), { 'Worker One': '🐱', 'Worker Two': '🐱' });
  assert.deepEqual(reads, ['Worker One', 'Worker Two']);
  assert.deepEqual(cursors, [undefined, 'page2']);
});

test('login fails closed when the password binding is absent or empty', async () => {
  for (const [env, body] of [[{}, {}], [{ APP_PASSWORD: '' }, { password: '' }]]) {
    const result = await api.fetch(new Request('https://local.test/api/login', { method: 'POST', body: JSON.stringify(body) }), env, {});
    assert.equal(result.status, 401);
  }
});

test('coffee totals accept names colliding with Object.prototype', async () => {
  const coffee = (await import(new URL('cloudflare/coffee-api/src/index.js', root))).default;
  const env = { COFFEE_DB: { prepare(sql) { return {
    bind() { return this; }, async all() { return { results: sql.includes('coffee_counts')
      ? [{ worker: '__proto__', total: 2 }, { worker: 'constructor', total: 1 }]
      : [{ worker: '__proto__', source: 'philips', total: 2, spend_cents: 100 }, { worker: 'constructor', source: 'philips', total: 1, spend_cents: 50 }] }; }
  }; } } };
  const result = await coffee.fetch(new Request('https://local.test/api/coffee?totals=1'), env);
  const body = await result.json();
  assert.equal(body.totals.__proto__, 2);
  assert.equal(body.details.constructor.sources.philips, 1);
});
