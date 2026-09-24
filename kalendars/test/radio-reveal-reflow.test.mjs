import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readCalendarPage } from './calendar-page-source.mjs';

const shell = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const calendar = await readFile(new URL('../js/calendar.js', import.meta.url), 'utf8');
const calendarPage = readCalendarPage();
const bundle = await readFile(new URL('../css/bundle.css', import.meta.url), 'utf8');
const ambience = await readFile(new URL('../../js/radio-ambience.js', import.meta.url), 'utf8');
const radio = await readFile(new URL('../../js/radio.js', import.meta.url), 'utf8');
const extras = await readFile(new URL('../../js/radio_extras_v4.js', import.meta.url), 'utf8');

const reveal = shell.slice(shell.indexOf('const mkRadioReveal = (function () {'), shell.indexOf('window.__mkRadioReveal = mkRadioReveal;'));

test('the calendar reflows while the slab is still moving, not after it', () => {
  const run = reveal.slice(reveal.indexOf('function run(open)'));
  assert.match(run, /cardsFade\('out', DIM_MS\)/, 'the cards start dimming on frame 0');
  assert.match(run, /reflowTimer = setTimeout\(function \(\) \{ if \(running === me\) reflow\(me\); \}, REFLOW_AT_MS\)/,
    'the reflow is a timer inside the morph, so a blocked main thread only delays the cards, never the slab');
  const at = Number(/const REFLOW_AT_MS = (\d+)/.exec(reveal)[1]);
  const total = Number(/const TOTAL_MS = (\d+)/.exec(reveal)[1]);
  assert.ok(at > 0 && at < total / 2, 'well inside the morph');
});

test('the classes name the target state from frame 0', () => {
  const run = reveal.slice(reveal.indexOf('function run(open)'));
  assert.match(run, /else body\.classList\.add\('radio-hidden'\);/, 'a close is radio-hidden from the start');
  const finalize = reveal.slice(reveal.indexOf('function finalize(rw, open)'), reveal.indexOf('let settlePending'));
  assert.doesNotMatch(finalize, /classList\.add\('radio-hidden'\)/, 'so finalize has nothing left to flip');
});

test('the reflow is one task: layout, ambience, fade back in', () => {
  const reflow = reveal.slice(reveal.indexOf('function reflow(me)'), reveal.indexOf('function finalize'));
  assert.match(reflow, /_doSync\(true\)/, 'the reveal may resize the frame itself');
  assert.match(reflow, /__mkAmbienceSync/, 'the calendar transparency swap shares the pass');
  assert.match(reflow, /cardsFade\('in', 160\)/);
  assert.match(shell, /function _doSync\(duringReveal\)/);
  assert.match(shell, /if \(duringReveal !== true && document\.body\.classList\.contains\('radio-anim'\)\) return;/,
    'everyone else still waits for the reveal to end');
  assert.match(ambience, /function sync\(force\)/);
  assert.match(ambience, /if \(force === true \|\| !document\.body\.classList\.contains\('radio-anim'\)\)/);
  assert.match(ambience, /window\.__mkAmbienceSync = function \(\) \{ sync\(true\); \};/);
});

test('settle only reflows if that is still owed, and the guest look waits', () => {
  const settle = reveal.slice(reveal.indexOf('function settle()'), reveal.indexOf("document.addEventListener('visibilitychange'"));
  assert.match(settle, /reflow\(p\.me\)/);
  assert.match(reveal, /if \(me\.laidOut\) return;\s*me\.laidOut = true;/, 'a reflow runs once per reveal');
  const roll = reveal.slice(reveal.indexOf('function rollNextLook(rw)'), reveal.indexOf('function logicalOpen'));
  assert.match(roll, /setTimeout\(function \(\) \{\s*if \('requestIdleCallback' in window\) requestIdleCallback\(roll/,
    'the restyle of the hidden window waits for the cards to finish fading in');
});

test('the cards fade back in from wherever the dim currently is', () => {
  const fade = calendar.slice(calendar.indexOf('window.__minkaCardsFade = function'), calendar.indexOf('window.__minkaHostLayout = function'));
  const read = fade.indexOf('__mkFadeFrom = (v >= 0 && v <= 1) ? v : __fadeFloor');
  const cancel = fade.indexOf('__fadeAnims.forEach(function (a) { try { a.onfinish = a.oncancel = null; a.cancel(); }');
  assert.ok(read > 0 && cancel > read, 'the live value is read before the out-ramp is cancelled');
  assert.match(fade, /el\.animate\(portal \? \[\{ filter: 'opacity\(' \+ from \+ '\)' \}, \{ filter: 'opacity\(1\)' \}\] : \[\{ opacity: from \}, \{ opacity: 1 \}\]/);
});

test('a radio flip no longer restyles the whole document through :root', () => {
  assert.doesNotMatch(bundle, /:root\.host-radio-open\{--cards/, 'card sizing variables are not set on :root any more');
  assert.match(bundle, /:root\.host-radio-open #grafiks-list\{--cards-min-col/);
  const layout = calendar.slice(calendar.indexOf('window.__minkaHostLayout = function'), calendar.indexOf("window.addEventListener('message', function(e) {", calendar.indexOf('window.__minkaHostLayout = function')));
  assert.match(layout, /list\.style\.setProperty\('--host-radio-h'/);
  assert.doesNotMatch(layout, /root\.style\.setProperty\('--host-radio-h'/);
});

test('the closed night overlay is parked out of style and layout', () => {
  assert.match(calendarPage, /#nsOverlay\.ns-parked:not\(\.open\) \{ content-visibility: hidden; \}/);
  const toggle = calendarPage.slice(calendarPage.indexOf('window.toggleNsOverlay=function'), calendarPage.indexOf('function setNightRoomLight'));
  assert.match(toggle, /overlay\.classList\.remove\('ns-parked'\);\s*void overlay\.offsetWidth;/, 'unparked a style pass before .open so the slide-in transitions');
  assert.match(toggle, /overlay\.classList\.add\('ns-parked'\)/, 'parked again after the close transition');
});

test('the sleep model is warmed for the neighbouring days in idle time', () => {
  assert.match(calendar, /g_warmNeighbourFatigue\(date\);/);
  const warm = calendar.slice(calendar.indexOf('function g_warmNeighbourFatigue'), calendar.indexOf('function g_applyTodayUI'));
  assert.match(warm, /for \(const delta of \[1, -1\]\)/, 'the day after and the day before');
  assert.match(warm, /calculateFatigue\(name, ds\)/, 'computed as of that day, not the one on screen');
  assert.match(warm, /if \(token !== g_fatigueWarmToken\) return;/, 'a newer day cancels the old queue');
  assert.match(warm, /requestIdleCallback\(step/, 'idle time only');
});

test('nothing freezes the spectrum for a day switch any more', () => {
  for (const [name, src] of [['shell', shell], ['calendar', calendar], ['radio', radio], ['extras', extras]]) {
    assert.doesNotMatch(src, /roster-busy|__mkRadioQuietUntil/, name + ' has no quiet window');
  }
});

test('the visualizer does not force a layout per frame', () => {
  const size = radio.slice(radio.indexOf('function ensureCanvasSize()'), radio.indexOf('// Pixel Buddy uses'));
  assert.doesNotMatch(size, /clientWidth \* ratio/, 'the CSS size comes from the ResizeObserver, not a read per frame');
  assert.match(radio, /new ResizeObserver\(entries => \{[\s\S]*?\}\)\.observe\(cvs\);/);
  const draw = radio.slice(radio.indexOf('function draw(ts = 0)'), radio.indexOf("document.getElementById('playBtn').onclick"));
  assert.match(draw, /if \(__vizLedOn !== ledOn\)/, 'LED styles are written on change only');
});
