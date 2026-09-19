import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let choose;
try { choose = require('../../js/image-palette.js').choose; } catch (_) {}
test('image palette retains Color Thief dominant and uses an observed Vibrant accent', () => {
  assert.equal(typeof choose, 'function');
  assert.deepEqual(choose('#223344', { Vibrant: { hex: '#bb4466', population: 8 } }), { dominant: '#223344', accent: '#bb4466' });
});
test('missing or synthesized Vibrant swatches retain the real dominant color', () => {
  assert.equal(typeof choose, 'function');
  assert.deepEqual(choose('#223344', { Vibrant: { hex: '#ffffff', population: 0 } }), { dominant: '#223344', accent: '#223344' });
  assert.equal(choose('#223344', null).accent, '#223344');
});
