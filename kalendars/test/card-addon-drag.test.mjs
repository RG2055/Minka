import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../js/card-addons.js', import.meta.url), 'utf8');
const functions = source.slice(source.indexOf('  var TOPPER_ROOM'), source.indexOf('  function refreshAddonGeometry('));
const ITEM_BY_ID = {
  tall: {group: 'topper', dockY: 6, aspect: '601 / 640'},
  small: {group: 'topper', dockY: 5, aspect: '640 / 404'}
};
const {addonDragPosition, writeAddonGeometry, topperBase, TOPPER_ROOM} = new Function('ITEM_BY_ID',
  functions + ';return {addonDragPosition,writeAddonGeometry,topperBase,TOPPER_ROOM};')(ITEM_BY_ID);
const topper = (id, scale, y) => ({
  dataset: {addonGroup: 'topper', addonId: id, addonScale: String(scale), addonX: '0', addonY: String(y)},
  style: {setProperty(k, v) { this[k] = v; }}
});
// How far the drawn topper rises above its card (px), as the CSS places it.
const rise = (image, width) => topperBase(image, width, 0).h * Number(image.style['--mk-addon-scale'])
  - ITEM_BY_ID[image.dataset.addonId].dockY - parseFloat(image.style['--mk-addon-offset-y']);

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
test('a topper keeps its place and size when it fits above its card', () => {
  const image = topper('small', .85, 0);
  writeAddonGeometry(image, 200, 200);
  assert.equal(image.style['--mk-addon-scale'], .85);
  assert.equal(image.style['--mk-addon-offset-y'], '0px');
  assert.ok(rise(image, 200) <= TOPPER_ROOM * 200);
});
test('a topper too tall for the room is drawn smaller on the edge, never pushed into its card', () => {
  for (const [width, height] of [[149, 164], [183, 183], [206, 206], [320, 260]]) {
    const image = topper('tall', 1, 0);
    writeAddonGeometry(image, width, height);
    assert.equal(image.style['--mk-addon-offset-y'], '0px');
    assert.ok(Number(image.style['--mk-addon-scale']) < 1);
    assert.ok(rise(image, width) <= TOPPER_ROOM * width);
    assert.ok(rise(image, width) >= TOPPER_ROOM * width - ITEM_BY_ID.tall.dockY - 1e-6);
  }
});
test('a topper fits the same way at every card size, so the preview matches the calendar', () => {
  const ratios = [149, 183, 206, 300].map((width) => {
    const image = topper('tall', 1, 0);
    writeAddonGeometry(image, width, width);
    return Number(image.style['--mk-addon-scale']);
  });
  for (const r of ratios) assert.ok(Math.abs(r - ratios[0]) < 1e-9);
});
test('other decorations are never limited', () => {
  const image = {dataset: {addonGroup: 'sticker', addonId: 'x', addonScale: '2', addonX: '0', addonY: '-80'},
    style: {setProperty(k, v) { this[k] = v; }}};
  writeAddonGeometry(image, 200, 200);
  assert.equal(image.style['--mk-addon-offset-y'], '-160px');
  assert.equal(image.style['--mk-addon-scale'], undefined);
});
