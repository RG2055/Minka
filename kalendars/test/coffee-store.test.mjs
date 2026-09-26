import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// The coffee store helper lives at the top of calendar.js; run just that block.
const source = fs.readFileSync(new URL('../js/calendar.js', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('(function initMinkaCoffeeStore()'), source.indexOf('})();', source.indexOf('(function initMinkaCoffeeStore()')) + 5);

function run(stored) {
  const storage = new Map(Object.entries(stored).map(([key, value]) => [key, JSON.stringify(value)]));
  const c = vm.createContext({ localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) } });
  c.window = c;
  vm.runInContext(block, c);
  const read = k => JSON.parse(storage.get(k) || 'null');
  return { store: c.MinkaCoffeeStore, counts: read('minkaCoffeeCountsV1'), details: read('minkaCoffeeDetailsV1') };
}

test('a person stored under both spellings counts once', () => {
  const { counts } = run({
    minkaCoffeeCountsV1: {
      '26.09.2026': { 'ANNA BĒRZIŅA': 1, 'anna bērziņa': 1, 'jānis ozols': 2 },
      '25.09.2026': { 'ANNA BĒRZIŅA': 3 }
    }
  });
  assert.deepEqual(counts['26.09.2026'], { 'anna bērziņa': 1, 'jānis ozols': 2 });
  assert.deepEqual(counts['25.09.2026'], { 'anna bērziņa': 3 });
  const month = Object.values(counts).flatMap(Object.values).reduce((a, b) => a + b, 0);
  assert.equal(month, 6);
});

test('duplicates keep the larger copy instead of adding them', () => {
  const { counts, details } = run({
    minkaCoffeeCountsV1: { '01.09.2026': { 'ANNA  BĒRZIŅA ': 2, 'anna bērziņa': 3 } },
    minkaCoffeeDetailsV1: { '01.09.2026': {
      'ANNA BĒRZIŅA': { sources: { philips: 1 }, spendCents: 0 },
      'anna bērziņa': { sources: { philips: 1, redbull: 2 }, spendCents: 298 }
    } }
  });
  assert.deepEqual(counts['01.09.2026'], { 'anna bērziņa': 3 });
  assert.equal(details['01.09.2026']['anna bērziņa'].spendCents, 298);
  assert.equal(Object.keys(details['01.09.2026']).length, 1);
});

test('clean stores are left untouched and the key matches the calendar', () => {
  const clean = { '01.09.2026': { 'anna bērziņa': 1 } };
  const { counts, store } = run({ minkaCoffeeCountsV1: clean });
  assert.deepEqual(counts, clean);
  assert.equal(store.key(' ANNA   Bērziņa '), 'anna bērziņa');
  assert.deepEqual({ ...store.counts({ 'ANNA BĒRZIŅA': 1500 }) }, { 'anna bērziņa': 999 });
});
