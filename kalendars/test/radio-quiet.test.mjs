import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const shell = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const calendar = await readFile(new URL('../js/calendar.js', import.meta.url), 'utf8');
const radio = await readFile(new URL('../../js/radio.js', import.meta.url), 'utf8');
const extras = await readFile(new URL('../../js/radio_extras_v4.js', import.meta.url), 'utf8');
const ambilight = await readFile(new URL('../../js/ambilight.js', import.meta.url), 'utf8');

test('a roster rebuild tells the shell to stand the radio down', () => {
  const start = calendar.indexOf('function g_updateList()');
  const body = calendar.slice(start, start + 1400);
  assert.match(body, /postMessage\(\{ type: 'minka:roster-busy'/, 'the rebuild announces itself');
  assert.match(body, /window\.parent && window\.parent !== window/, 'and stays quiet when the calendar runs standalone');
  assert.match(body, /window\.location\.origin/, 'addressed to this origin only');
});

test('the shell trusts the message only within bounds', () => {
  const at = shell.indexOf("'minka:roster-busy'");
  const handler = shell.slice(at - 400, at + 700);
  assert.match(handler, /e\.origin !== window\.location\.origin/, 'a frame from anywhere else is ignored');
  assert.match(handler, /Math\.min\(1200, Math\.max\(120,/, 'the quiet window can never be talked into lasting');
  assert.match(handler, /clearTimeout\(window\.__mkRosterBusyTimer\)/, 'overlapping rebuilds do not strand the class');
  assert.match(handler, /classList\.remove\('mk-roster-busy'\)/, 'and it always ends');
});

test('the visualiser comes back by itself after standing down', () => {
  const start = radio.indexOf('function draw(ts = 0)');
  const draw = radio.slice(start, start + 1800);
  assert.ok(draw.includes('__mkRadioQuietUntil'), 'the loop knows about the quiet window');
  assert.match(draw.slice(draw.indexOf('__mkRadioQuietUntil'), draw.indexOf('__mkRadioQuietUntil') + 220), /scheduleDraw\(/,
    'it reschedules rather than returning for good');
  assert.ok(draw.indexOf('shouldSleep') < draw.indexOf('__mkRadioQuietUntil'),
    'a hidden or paused radio still sleeps outright instead of polling');
});

test('the other radio canvases stand down for a rebuild as well', () => {
  const loop = extras.slice(extras.indexOf('function extraLoop()'), extras.indexOf('function scheduleExtraViz'));
  assert.match(loop, /__mkRadioQuietUntil/, 'VU, LED and DOT run their own loop');
  assert.match(loop, /setTimeout\(scheduleExtraViz/, 'and come back on a timer');
  const wave = extras.slice(extras.lastIndexOf('function draw(ts = 0)'));
  assert.match(wave, /__mkRadioQuietUntil/, 'so does the slowed-wave backdrop');
  assert.match(wave, /WAVE_FRAME_MS/, 'which had no frame cap at all');
  assert.match(wave, /t \+= Math\.min\(4, elapsed \/ 16\.7\)/, 'capping the rate must not slow the wave itself');
});

test('the glow sleeps with the panel, without a style recalc every frame', () => {
  const canRender = ambilight.slice(ambilight.indexOf('function canRender()'), ambilight.indexOf('function stopRender()'));
  assert.doesNotMatch(canRender, /getComputedStyle/, 'asking for computed display cost a recalc per frame');
  assert.match(canRender, /radio-hidden/, 'the panel hides in place, which display never showed');
  assert.match(canRender, /radio-idle/);
  assert.match(ambilight, /__mkRadioQuietUntil/, 'the glow stands down for a rebuild too');
});

test('the panel holds its own animations while the roster rebuilds', () => {
  assert.match(shell, /body\.mk-roster-busy #radioWindow \*/);
  assert.match(shell, /animation-play-state: paused/);
});
