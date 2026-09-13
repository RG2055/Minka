import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const js = await readFile(new URL('../js/card-faces.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../css/card-winamp.css', import.meta.url), 'utf8');
const numbers = await readFile(new URL('../assets/winamp/numbers.png', import.meta.url));

function harness() {
  const context = vm.createContext({ document: { baseURI: 'https://example.test/kalendars/' }, URL, Math });
  const slice = (from, to) => js.slice(js.indexOf(from), js.indexOf(to));
  vm.runInContext(slice('  var WA_SHEET = new URL(', '  var WA_TEXT ='), context);
  vm.runInContext(slice('  function waLcdText(', '  // Shift time as Winamp'), context);
  return context;
}
function card(width) {
  const style = new Map();
  return { clientWidth: width, getBoundingClientRect: () => ({ width }), dataset: {},
    style: { setProperty: (k, v) => style.set(k, String(v)) }, read: k => style.get(k) };
}

test('the shift timer keeps to the five cells a Winamp display has', () => {
  const { waLcdText } = harness();
  assert.equal(waLcdText('07:38:55'), '07:38', 'hours and minutes while more than an hour is left');
  assert.equal(waLcdText('7:05:09'), '07:05', 'a single-digit hour still fills both digit cells');
  assert.equal(waLcdText('00:04:09'), '04:09', 'under an hour the seconds are the useful part');
  assert.equal(waLcdText('00:00:07'), '00:07');
  assert.equal(waLcdText('8–20'), '8–20', 'a shift window is passed through for the dash glyph');
  assert.equal(waLcdText(' 12:30 '), '12:30', 'a plain clock reading is left alone');
  assert.equal(waLcdText(''), '');
});

test('skin bitmaps are zoomed in whole steps, never stretched to fit', () => {
  const { waZoom } = harness();
  const zoom = width => { const el = card(width); waZoom(el); return Number(el.read('--wa-px')); };
  for (const width of [0, 80, 165, 200, 260, 340, 420, 520, 900, 4000]) {
    const value = zoom(width);
    assert.ok(Number.isInteger(value), width + 'px card got a fractional zoom: ' + value);
    assert.ok(value >= 1, width + 'px card must still draw at least 1:1');
  }
  assert.equal(zoom(200), 1, 'a small card stays at the sprite’s own size');
  assert.equal(zoom(340), 2);
  assert.equal(zoom(520), 3);
  assert.ok(zoom(4000) <= 6, 'the zoom is capped so a huge card cannot blow the sprite up');
  // 43 skin px of digits and gaps have to fit the 41.5 units of the transport
  // bar's panel, and 13 of height its 13.5 units.
  for (const width of [180, 260, 312, 340, 420, 520, 700]) {
    assert.ok(43 * zoom(width) <= 41.5 * (width / 148), 'time display too wide for the panel at ' + width + 'px');
    assert.ok(13 * zoom(width) <= 13.5 * (width / 148), 'time display too tall for the panel at ' + width + 'px');
  }
});

test('the zoom is only recomputed when it actually changes', () => {
  const { waZoom } = harness();
  const el = card(340);
  let writes = 0;
  el.style.setProperty = () => { writes++; };
  waZoom(el); waZoom(el); waZoom(el);
  assert.equal(writes, 1);
});

test('the time display is drawn from the real Winamp digit sprite', () => {
  // 11 cells of 9x13: the classic NUMBERS.BMP layout.
  assert.equal(numbers.readUInt32BE(16), 99, 'sprite width');
  assert.equal(numbers.readUInt32BE(20), 13, 'sprite height');
  assert.equal(numbers.readUInt8(25), 6, 'the mask needs an alpha channel (colour type 6)');
  assert.match(css, /--wa-nums/, 'the digits use the dedicated sprite, not the composed sheet');
  assert.doesNotMatch(css, /mask-source-type|mask-mode/, 'luminance masking is what browsers disagreed about');
  const lcd = css.slice(css.indexOf('.mk-wa-lcd b {'), css.indexOf('.mk-wa-lcd b.colon'));
  assert.match(lcd, /width:calc\(9px \* var\(--wa-px\)\)/, 'digit cells are whole skin pixels');
  assert.match(lcd, /image-rendering:pixelated/);
  assert.doesNotMatch(lcd, /drop-shadow/, 'a glow around a 9px digit only costs contrast');
});

test('the shift numeral is lit on the same whole-pixel grid, without a halo', () => {
  const numeral = css.slice(css.indexOf('/* LED dot-matrix numeral. */'), css.indexOf('/* Name stays white'));
  const cells = numeral.match(/repeating-linear-gradient\([^)]*deg,#000 0 calc\((\d+)px \* var\(--wa-px\)\),transparent calc\(\d+px \* var\(--wa-px\)\) calc\((\d+)px \* var\(--wa-px\)\)\)/g);
  assert.equal(cells && cells.length, 4, 'both axes of both mask-image declarations run on whole pixels');
  assert.doesNotMatch(numeral, /var\(--u\) \* 2\.3/, 'a grid in card units is what smeared the dots');
  assert.doesNotMatch(numeral, /drop-shadow/, 'the glow was a blurred copy of the whole matrix');
});
