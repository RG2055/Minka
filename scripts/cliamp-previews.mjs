#!/usr/bin/env node
/* Izskata paneļa priekšskatījumi cliamp spektriem (kalendars/data/radio-viz/term-NN.svg).
   Palaiž js/radio-cliamp.js ar izdomātu dziesmu un vienu kadru pārraksta SVG taisnstūros. */
import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
const ctx = { window: {} };
vm.runInNewContext(await readFile(new URL('../js/radio-cliamp.js', import.meta.url), 'utf8'), ctx);
const C = ctx.window.rgCliamp;
const MODES = { 40: 'stereo', 41: 'mirror', 42: 'retro', 43: 'terrain', 44: 'flame', 45: 'barsdot', 46: 'redsector' };
const W = 600, H = 80, pal = C.palette({ fg: '#bdbdbd', dim: '#6b6b6b', low: '#22c55e', mid: '#facc15', high: '#fb923c' });
class Path2D { constructor() { this.r = []; } rect(x, y, w, h) { this.r.push([x, y, w, h]); } }
ctx.Path2D = Path2D; globalThis.Path2D = Path2D;
for (const [idx, id] of Object.entries(MODES)) {
  const feed = new C.Feed(), src = C.fakeSource(), v = C.create(id), fit = C.fit(W, H, 5);
  for (let now = 1000; now < 7400; now += 16.7) { feed.update(src, now); v.step(feed, now, fit.cols, fit.rows, true); }
  const byColor = new Map(); let fill = '', path = null;
  const add = (x, y, w, h) => { if (!byColor.has(fill)) byColor.set(fill, []); byColor.get(fill).push(`M${+x.toFixed(1)} ${+y.toFixed(1)}h${+w.toFixed(1)}v${+h.toFixed(1)}h${-w.toFixed(1)}z`); };
  const g = {
    set fillStyle(c) { fill = c; }, get fillStyle() { return fill; }, font: '', textAlign: '', textBaseline: '',
    clearRect() {}, beginPath() { path = []; }, rect(x, y, w, h) { path.push([x, y, w, h]); },
    fill(p) { for (const r of (p ? p.r : path)) add(...r); },
    fillText() {},
  };
  C.paint(g, v.T, W, H, pal);
  const body = [...byColor].map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('');
  await writeFile(new URL(`../kalendars/data/radio-viz/term-${idx}.svg`, import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>\n`);
  console.log(idx, id, byColor.size, 'colors');
}
