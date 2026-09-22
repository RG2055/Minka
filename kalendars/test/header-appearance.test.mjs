import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const appearance = require('../js/header-appearance.js');

test('background preferences are limited to Latvia and survive a daily skin shuffle', () => {
  assert.equal(appearance.normalize({ background: 'alps' }).background, 'mix', 'the collection is the default');
  assert.equal(appearance.normalize({ background: 'riga' }).background, 'riga');
  assert.equal(appearance.normalize({ background: 'coast' }).background, 'mix', 'the retired coast falls back to the collection');
  assert.equal(appearance.normalize({ version: 2, background: 'coast' }).background, 'mix', 'even a coast chosen on purpose is retired');
  assert.equal(appearance.normalize({ background: 'mix' }).background, 'mix');
  assert.equal(appearance.normalize({}).version, 2);
  assert.equal(appearance.shuffle({ background: 'riga' }).background, 'riga');
});

test('first visit keeps panorama; invalid saved values cannot change the layout', () => {
  assert.equal(appearance.normalize().skin, 'panorama');
  const state = appearance.normalize({ skin: 'unknown', palette: '<style>', daily: 'true' });
  assert.equal(state.skin, 'panorama');
  assert.equal(state.palette, 'scene');
  assert.equal(state.daily, false);
  assert.deepEqual(appearance.normalize(null), appearance.normalize());
});

test('daily random stays stable across reloads, then picks a different skin on a new day', () => {
  const state = appearance.resolveDay({ skin: 'hybrid', palette: 'mint', daily: true }, '2026-09-19', () => 0);
  assert.notEqual(state.skin, 'hybrid');
  assert.deepEqual(appearance.resolveDay(JSON.parse(JSON.stringify(state)), '2026-09-19', () => .99), state);
  const tomorrow = appearance.resolveDay(state, '2026-09-20', () => .99);
  assert.notEqual(tomorrow.skin, state.skin);
  assert.equal(tomorrow.day, '2026-09-20');
  assert.notEqual(tomorrow.palette, 'radio');
});

test('manual appearance never changes because the date changed', () => {
  const state = appearance.normalize({ skin: 'material', palette: 'rose', daily: false });
  assert.deepEqual(appearance.resolveDay(state, '2026-09-20'), state);
});

test('every skin keeps the panorama, including legacy Material choices and random rotation', () => {
  assert.equal(appearance.normalize({ skin: 'material' }).skin, 'hybrid');
  let state = appearance.normalize({ skin: 'material', daily: true });
  for (let day = 1; day <= 28; day++) {
    state = appearance.resolveDay(state, '2026-10-' + String(day).padStart(2, '0'));
    assert.ok(['panorama', 'hybrid'].includes(state.skin));
  }
});

test('all palettes keep body, secondary and selected-day text readable', () => {
  for (const seed of [...Object.values(appearance.seeds), '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff']) {
    const p = appearance.palette(seed);
    assert.ok(appearance.contrast(p.text, p.surface) >= 7, seed);
    assert.ok(appearance.contrast(p.muted, p.raised) >= 4.5, seed);
    assert.ok(appearance.contrast(p.ink, p.accent) >= 7, seed);
  }
  assert.deepEqual(appearance.palette('invalid'), appearance.palette(appearance.seeds.mint));
});

test('an open radio temporarily overrides every saved palette with the actual album color', () => {
  const saved = appearance.normalize({ skin: 'panorama', palette: 'olive' });
  const before = JSON.stringify(saved);
  assert.deepEqual(appearance.resolveColor(saved, { open: true, album: '#c83764' }, '#789abc', '#00ff00'), { source: 'album', seed: '#c83764' });
  assert.deepEqual(appearance.resolveColor(saved, { open: false, album: '#c83764' }, '#789abc', '#00ff00'), { source: 'palette', seed: appearance.seeds.olive });
  assert.deepEqual(appearance.resolveColor({ palette: 'scene' }, { open: true, album: '' }, '#789abc'), { source: 'palette', seed: '#789abc' });
  assert.equal(JSON.stringify(saved), before, 'temporary album following must not overwrite preferences');
});

test('storage failures and malformed data fall back safely; settings never use an account endpoint', () => {
  assert.equal(appearance.read({ getItem() { throw Error('blocked'); } }).skin, 'panorama');
  assert.equal(appearance.read({ getItem() { return '{broken'; } }).skin, 'panorama');
  let stored;
  assert.equal(appearance.write({ setItem(key, value) { stored = value; } }, { skin: 'hybrid', palette: 'olive' }), true);
  assert.equal(JSON.parse(stored).skin, 'hybrid');
  assert.equal(appearance.write({ setItem() { throw Error('quota'); } }, {}), false);
});
