import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../js/card-addons.js', import.meta.url), 'utf8');
const functions = source.slice(source.indexOf('  function writeAddonGeometry('), source.indexOf('  function refreshAddonGeometry('));
const {addonDragPosition, writeAddonGeometry} = new Function(functions + ';return {addonDragPosition,writeAddonGeometry};')();

test('decor follows pointer distance at reduced and enlarged preview scales', () => {
  for (const scale of [0.45, 1, 2.2]) {
    const width = 396, height = 436, dx = 23, dy = -17;
    const p = addonDragPosition(10, -5, dx, dy, width * scale, height * scale);
    const image = {dataset: {addonX: p.x, addonY: p.y}, style: {setProperty(k,v) { this[k] = v; }}};
    writeAddonGeometry(image, width, height);
    assert.ok(Math.abs((parseFloat(image.style['--mk-addon-offset-x']) - width * .1) * scale - dx) < 1e-8);
    assert.ok(Math.abs((parseFloat(image.style['--mk-addon-offset-y']) + height * .05) * scale - dy) < 1e-8);
    const saved = {...image.style};
    writeAddonGeometry(image, width, height);
    assert.equal(image.style['--mk-addon-offset-x'], saved['--mk-addon-offset-x']);
    assert.equal(image.style['--mk-addon-offset-y'], saved['--mk-addon-offset-y']);
  }
});
test('decor positions remain within the stored bounds', () => {
  assert.deepEqual(addonDragPosition(0, 0, 1000, -1000, 100, 100), {x: 100, y: -100});
});
