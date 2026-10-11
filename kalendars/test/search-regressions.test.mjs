import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const core = require('../js/page/mk-search-core.js');

// Phone search (header-search.js): the matching part, without the DOM.
const searchSource = await readFile(new URL('../js/page/header-search.js', import.meta.url), 'utf8');
const matching = searchSource.slice(searchSource.indexOf('  function getQuery('), searchSource.indexOf('  function refreshActive('));
function phoneSearch(withCore) {
  const window = {
    MkSearchCore: withCore ? core : undefined,
    __grafiksStore: {'OKTOBRIS 2026': [{workers: [{name: 'Jānis Bērziņš', shift: '24'}, {name: 'Kaspars Ozols', shift: '12'}]}]},
    hospitalDatabase: [
      {name: 'Vaira Liepa', cat: 'Uzņemšana', phone: '67000001'},
      {name: 'Kurts Egle', cat: 'Ķirurģija', phone: '67000002'},
      {name: 'Kase', cat: 'Administrācija', phone: '67000003'}
    ]
  };
  const document = {querySelectorAll: () => []};
  return new Function('window', 'document', 'input', 'results', 'mainPanel', matching + ';return pickData;')(window, document, {}, {}, null);
}
const names = r => r.workers.map(w => w.name).concat(r.phones.map(p => p.name));

test('phone search ignores diacritics, with and without the desktop fold', () => {
  for (const withCore of [true, false]) {
    const pick = phoneSearch(withCore);
    assert.deepEqual(names(pick('berzins')), ['Jānis Bērziņš']);
    assert.deepEqual(names(pick('janis')), ['Jānis Bērziņš']);
    assert.deepEqual(names(pick('kirurg')), ['Kurts Egle']);
    assert.deepEqual(names(pick('Bērz')), ['Jānis Bērziņš']);
  }
});

test('names that start like a question are searched, not hidden', () => {
  const pick = phoneSearch(true);
  for (const [q, want] of [['Kaspars', 'Kaspars Ozols'], ['Vaira', 'Vaira Liepa'], ['Kurts', 'Kurts Egle'], ['Kase', 'Kase']]) {
    assert.ok(names(pick(q)).includes(want), q);
  }
  assert.ok(!/isAiQuery/.test(searchSource), 'the removed AI gate is back');
});

// Duty summary (calendar.js): stored at once, announced once per role after the
// render (a microtask, so it also comes in a page that reports itself hidden).
const calSource = await readFile(new URL('../js/calendar.js', import.meta.url), 'utf8');
const publish = calSource.slice(calSource.indexOf('  let __dutySummaryQueue'), calSource.indexOf('  function dutyPerson('));

test('duty summary is stored at once and announced after the render, once per role', async () => {
  const events = [];
  const window = {dispatchEvent: e => events.push(e)};
  class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } }
  const publishDutySummary = new Function('window', 'CustomEvent', 'activeDateStr',
    publish + ';return publishDutySummary;')(window, CustomEvent, '24.09.2026');
  publishDutySummary('radiographers-shift-count', {count: 3});
  publishDutySummary('radiologists-shift-count', {count: 2});
  publishDutySummary('radiographers-shift-count', {count: 4});
  assert.equal(window.__mkDutySummary.rg.count, 4);
  assert.equal(window.__mkDutySummary.rd.date, '24.09.2026');
  assert.equal(events.length, 0, 'nothing is announced inside the render');
  await Promise.resolve();
  assert.deepEqual(events.map(e => [e.type, e.detail.role, e.detail.count]), [['minka:duty-summary', 'rg', 4], ['minka:duty-summary', 'rd', 2]]);
  publishDutySummary('radiologists-shift-count', {count: 1});
  await Promise.resolve();
  assert.deepEqual(events.slice(2).map(e => [e.detail.role, e.detail.count]), [['rd', 1]], 'a later publish is announced again');
});
