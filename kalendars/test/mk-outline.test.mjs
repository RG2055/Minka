import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// The caffeine's tone on a progress outline (js/page/mk-outline.js): taken from the last drink's colour, but never
// the colour of the fatigue beside it, never violet, and one lightness and chroma range for every drink.
const src = fs.readFileSync(new URL('../js/page/mk-outline.js', import.meta.url), 'utf8');
function fn(name) { const m = new RegExp('function ' + name + '\\s*\\(').exec(src); let i = src.indexOf('{', m.index), depth = 0, j = i; for (; j < src.length; j++) { if (src[j] === '{') depth++; else if (src[j] === '}' && --depth === 0) break; } return src.slice(m.index, j + 1); }
const ctx = vm.createContext({});
vm.runInContext(fn('oklchOf') + '\n' + fn('outlineTone'), ctx);
const hueOf = s => +/oklch\([\d.]+ [\d.]+ ([\d.]+)\)/.exec(s)[1], lumOf = s => +/oklch\(([\d.]+)/.exec(s)[1];
const far = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const drinks = { philips: '#c8905a', lofbergs: '#a678e0', narvesen: '#f08a24', monster: '#7bdc3a', monsterultra: '#e6edf5', redbull: '#e5484d', brite: '#d8e84a', dynamit: '#ffe14a', kongstrong: '#4f8dff', cupcoffee: '#a9825f', mycoffee: '#ff8fb0' };
const levels = ['#42d991', '#e7d34b', '#f5e548', '#f5df4d', '#ff9f43', '#ff5c70', '#ff6b5f', '#35d07f'];

test('every drink beside every fatigue colour: apart from it, not violet, deep then bright', () => {
  for (const [name, hex] of Object.entries(drinks)) for (const lvl of levels) {
    const [deep, bright] = ctx.outlineTone(hex, lvl), h = hueOf(deep), base = ctx.oklchOf(lvl)[2];
    assert.ok(far(h, base) >= 47.5, `${name} beside ${lvl}: ${h.toFixed(0)} against ${base.toFixed(0)}`);
    assert.ok(!(h > 275 && h < 330), `${name} beside ${lvl} is violet: ${h}`);
    assert.equal(hueOf(bright), h);
    assert.ok(lumOf(bright) > lumOf(deep) && lumOf(deep) >= .6, `${name}: ${deep} ${bright}`);
  }
});
test('a drink keeps its own hue where nothing is in its way', () => {
  assert.ok(far(hueOf(ctx.outlineTone('#4f8dff', '#f5df4d')[0]), ctx.oklchOf('#4f8dff')[2]) < 1);     // a blue can beside yellow
  assert.ok(far(hueOf(ctx.outlineTone('#7bdc3a', '#ff5c70')[0]), ctx.oklchOf('#7bdc3a')[2]) < 1);     // a green can beside red
});
test('a colourless drink is an icy blue; no colour at all still gives a tone', () => {
  assert.ok(far(hueOf(ctx.outlineTone('#e6edf5', '#f5df4d')[0]), 232) < 1);
  assert.match(ctx.outlineTone('', '')[0], /^oklch\(/);
});
