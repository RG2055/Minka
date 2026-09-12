import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../js/card-faces.js', import.meta.url), 'utf8');
// Exercise the real sizing closure with a roster replacement and hidden source.
const sizing = source.slice(source.indexOf('    var sourceWorker ='), source.indexOf('    if (options.source && window.ResizeObserver)'));
function fixture() {
  const style = () => ({setProperty(key, value) { this[key] = value; }});
  const card = () => ({isConnected: true, getAttribute: () => 'ALPHA TEST',
    getBoundingClientRect() { return this.isConnected ? {width: 400, height: 400} : {width: 0, height: 0}; }});
  const initial = card(), replacement = card(), options = {source: initial};
  const slot = {parentElement: {clientWidth: 320}, style: style(),
    get clientWidth() { return parseFloat(this.style.width) || 300; }};
  const preview = {isConnected: true, style: style(), classList: {add() {}}, querySelector: () => null,
    getBoundingClientRect: () => ({width: 300, height: 300})};
  const observed = [], unobserved = [];
  const observer = {observe: node => observed.push(node), unobserve: node => unobserved.push(node)};
  const doc = {querySelectorAll: () => replacement.isConnected ? [replacement] : []};
  const resize = new Function('options', 'preview', 'slot', 'host', 'document', 'getComputedStyle', 'previewObserver',
    sizing + '\nreturn sizePreview;')(options, preview, slot, {style: style()}, doc, () => ({padding: '0px'}), observer);
  return {resize, slot, initial, replacement, options, preview, observed, unobserved};
}

test('preview reconnects after the roster replaces its source card', () => {
  const f = fixture();
  f.resize();
  f.initial.isConnected = false;
  f.slot.parentElement.clientWidth = 190;
  f.resize();
  assert.equal(f.options.source, f.replacement);
  assert.deepEqual(f.observed, [f.replacement]);
  assert.deepEqual(f.unobserved, [f.initial]);
  assert.equal(f.slot.clientWidth, 178);
  assert.equal(400 * f.preview.style['--wf-preview-scale'], 178);
});

test('preview still fits a narrower column while the source is absent', () => {
  const f = fixture();
  f.resize();
  f.initial.isConnected = f.replacement.isConnected = false;
  f.slot.parentElement.clientWidth = 190;
  f.resize();
  assert.equal(f.slot.clientWidth, 178);
  assert.equal(f.slot.style.height, '178px');
  assert.equal(f.preview.style['--wf-preview-padding'], '0px');
  assert.equal(400 * f.preview.style['--wf-preview-scale'], 178);
});
