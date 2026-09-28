import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const core = require('../js/page/mk-search-core.js');

const MON = new Date(2026, 8, 28); // pirmdiena, 28.09.2026
const ymd = d => d && [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-');

test('fold ignores Latvian diacritics and case', () => {
  assert.equal(core.fold('Jevgēnija ĶĒĶIS šņūļģ'), 'jevgenija kekis snulg');
});

test('match prefers word starts, then substrings, then letters in order', () => {
  const start = core.match('jev', 'Jevgēnija').score;
  const inner = core.match('gen', 'Jevgēnija').score;
  const loose = core.match('jvgn', 'Jevgēnija').score;
  assert.ok(start > inner && inner > loose && loose > 0, [start, inner, loose].join());
  assert.equal(core.match('xyz', 'Testa Persona').score, 0);
  assert.ok(core.match('ns', 'Nakts sadalījums').score > 0, 'initials');
  assert.ok(core.match('sadal', 'Nakts sadalījums').score > 0);
  assert.deepEqual(core.match('be', 'Berta').hits, [0, 1]);
  // Every word of the query must match somewhere.
  assert.ok(core.match('nakts sad', 'Nakts sadalījums').score > 0);
  assert.equal(core.match('nakts radio', 'Nakts sadalījums').score, 0);
  // Shorter text wins a tie.
  assert.ok(core.match('ber', 'Berta').score > core.match('ber', 'Bermudu salas').score);
});

test('parseDate understands relative words and weekdays', () => {
  assert.equal(ymd(core.parseDate('šodien', MON)), '2026-9-28');
  assert.equal(ymd(core.parseDate('rit', MON)), '2026-9-29');
  assert.equal(ymd(core.parseDate('Parīt', MON)), '2026-9-30');
  assert.equal(ymd(core.parseDate('vakar', MON)), '2026-9-27');
  assert.equal(ymd(core.parseDate('piektdien', MON)), '2026-10-2');
  assert.equal(ymd(core.parseDate('pk', MON)), '2026-10-2');
  assert.equal(ymd(core.parseDate('pirmdien', MON)), '2026-9-28');
  assert.equal(ymd(core.parseDate('nākamā pirmdiena', MON)), '2026-10-5');
  assert.equal(ymd(core.parseDate('+3', MON)), '2026-10-1');
  assert.equal(ymd(core.parseDate('-2', MON)), '2026-9-26');
  assert.equal(ymd(core.parseDate('pēc 10 dienām', MON)), '2026-10-8');
});

test('parseDate understands numeric and month-name dates, nearest year', () => {
  assert.equal(ymd(core.parseDate('15.10', MON)), '2026-10-15');
  assert.equal(ymd(core.parseDate('15.10.2027', MON)), '2027-10-15');
  assert.equal(ymd(core.parseDate('1/2', MON)), '2027-2-1');
  assert.equal(ymd(core.parseDate('3.1.', MON)), '2027-1-3');
  assert.equal(ymd(core.parseDate('15. okt', MON)), '2026-10-15');
  assert.equal(ymd(core.parseDate('15 oktobrī', MON)), '2026-10-15');
  assert.equal(ymd(core.parseDate('okt 15', MON)), '2026-10-15');
  assert.equal(ymd(core.parseDate('augusts', MON)), '2026-8-1');
  assert.equal(core.parseDate('31.02', MON), null);
  assert.equal(core.parseDate('berta', MON), null);
  assert.equal(core.parseDate('', MON), null);
});

test('relative and long labels read naturally', () => {
  const day = n => new Date(2026, 8, 28 + n);
  assert.equal(core.relativeLabel(day(0), MON), 'Šodien');
  assert.equal(core.relativeLabel(day(1), MON), 'Rīt');
  assert.equal(core.relativeLabel(day(3), MON), 'Pēc 3 dienām');
  assert.equal(core.relativeLabel(day(21), MON), 'Pēc 21 dienas');
  assert.equal(core.relativeLabel(day(-1), MON), 'Vakar');
  assert.equal(core.relativeLabel(day(-5), MON), 'Pirms 5 dienām');
  assert.equal(core.longLabel(day(4)), 'Piektdiena, 2. oktobris');
});
