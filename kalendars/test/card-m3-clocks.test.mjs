import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// M3 clocks on the card (card-faces.js): the dials f–h are read at card size — one
// big number, a ring of what is left, nothing smaller — and the digital readouts
// p–t mirror the running timer text in digit groups.
const src = fs.readFileSync(new URL('../js/card-faces.js', import.meta.url), 'utf8');
const dialCode = src.slice(src.indexOf('  function hm(t)'), src.indexOf('  // Small previews for the skin picker'));
const c = vm.createContext({ window: {}, Date, Math, String, Number });
vm.runInContext(dialCode, c);
function el(start, end, now) { return { dataset: { start, end, dialNow: String(now) }, textContent: '' }; }
const count = (html, re) => (html.match(re) || []).length;

test('on duty: the time left as one big number and a ring of what is left', () => {
  for (const skin of ['f', 'g', 'h']) {
    const html = c.dialMarkup(el('14:00', '20:00', 17 * 60), skin + '11');
    assert.match(html, /class="m3num"[^>]*>3:00</, skin + ' big number');
    assert.equal(count(html, /class="m3ind"/g), 1, skin + ' progress ring');
    assert.doesNotMatch(html, /class="l"|ATLIKUŠAS/, skin + ' no small caption');
    assert.doesNotMatch(html, /class="hand/, skin + ' no hands');
  }
});

test('the ring depletes: half the shift left draws half a ring, with a gap before the track', () => {
  const html = c.dialMarkup(el('14:00', '20:00', 17 * 60), 'f11');
  assert.equal(count(html, /class="m3trk"/g), 1);
  const ind = /class="m3ind" d="M([\d.]+) ([\d.]+)A41 41 0 (\d) 1 ([\d.]+) ([\d.]+)"/.exec(html);
  assert.ok(ind, 'a flat arc from 12 o\'clock');
  assert.deepEqual([+ind[1], +ind[2]], [50, 9]);
  assert.ok(Math.abs(+ind[4] - 50) < .1 && Math.abs(+ind[5] - 91) < .1, 'ends at 6 o\'clock');
});

test('the wavy ring waves; the cookie fills its own outline', () => {
  const wave = c.dialMarkup(el('14:00', '20:00', 15 * 60), 'h11');
  assert.ok(count(/class="m3ind" d="([^"]+)"/.exec(wave)[1], /L/g) > 40, 'a wave is many small steps');
  const cookie = c.dialMarkup(el('14:00', '20:00', 17 * 60), 'g11');
  assert.match(cookie, /class="m3ind" pathLength="100" stroke-dasharray="50\.0 101"/);
});

test('not on duty: the start time or the window, quiet, no progress', () => {
  c.window.__activeDateStr = '29.09.2026'; c.window.__todayDateStr = '29.09.2026';
  const soon = c.dialMarkup({ dataset: { dialNow: String(12 * 60) }, textContent: '14–20' }, 'f11');
  assert.match(soon, /class="m3num q"[^>]*>14:00</);
  assert.equal(count(soon, /class="m3ind"/g), 0);
  assert.equal(count(soon, /class="m3dot"/g), 1, 'a dot at 12 marks where it will start');
  c.window.__activeDateStr = '30.09.2026';
  const plan = c.dialMarkup({ dataset: { dialNow: String(12 * 60) }, textContent: '20–08' }, 'h11');
  assert.match(plan, />20–08</);
});

test('skin codes: analog skin + hand + face, digital skin + "11"', () => {
  for (const ok of ['a11', 'e33', 'f11', 'h32', 'p11', 't11']) assert.ok(c.TM_RE.test(ok), ok);
  for (const bad of ['i11', 'p12', 'u11', 'f41', '']) assert.ok(!c.TM_RE.test(bad), bad);
  assert.ok(c.DIGIT_RE.test('q11') && !c.DIAL_RE.test('q11'));
});

const digitCode = src.slice(src.indexOf('  // Two-digit hours, as the M3 clock writes them'), src.indexOf('  function m3Source('));
const d = vm.createContext({ String, RegExp });
vm.runInContext(digitCode, d);

test('digital readouts: two-digit hours, dot colons, the timer fades its leading zeros once', () => {
  assert.equal(d.m3Markup('7:42:10', 'p'), '<b class="g">07</b><i class="cl"></i><b class="g mid">42</b><i class="cl"></i><b class="g mid">10</b>');
  assert.ok(d.m3Markup('7:42:10', 'q').startsWith('<i class="lead"></i><b class="g">07</b>'), 'the stopwatch: a cell for the separators, two-digit hours');
  // 00:42:10 — the zero group and its separator fade once, nothing is faded twice
  assert.equal(d.m3Markup('0:42:10', 's'), '<b class="g z">00</b><i class="cl z"></i><b class="g">42</b><i class="cl"></i><b class="g mid">10</b>');
  // 00:02:10 — the first live group fades its own leading zero; later groups never do
  assert.equal(d.m3Markup('0:02:05', 's'), '<b class="g z">00</b><i class="cl z"></i><b class="g"><u>0</u>2</b><i class="cl"></i><b class="g mid">05</b>');
  assert.equal(d.m3Markup('20–08', 't'), '<b class="g">20</b><i class="ds"></i><b class="g mid">08</b>');
});

test('the saved look keeps the new codes (client pack and the API both accept them)', () => {
  const skins = fs.readFileSync(new URL('../js/page/minka-skins.js', import.meta.url), 'utf8');
  assert.equal(count(skins, /\[a-h\]\[1-3\]\[1-3\]\|\[p-t\]11/g), 2, 'pack and unpack');
  const api = fs.readFileSync(new URL('../../cloudflare/minka-api/src/index.js', import.meta.url), 'utf8');
  assert.match(api, /tm:\(\?:\[a-h\]\[1-3\]\[1-3\]\|\[p-t\]11\)/);
});
