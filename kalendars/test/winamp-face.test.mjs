import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const js = await readFile(new URL('../js/card-faces.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../css/card-winamp.css', import.meta.url), 'utf8');
const numbers = await readFile(new URL('../assets/winamp/numbers.png', import.meta.url));

function harness() {
  const context = vm.createContext({ document: { baseURI: 'https://example.test/kalendars/' }, URL, Math });
  const slice = (from, to) => {
    const start = js.indexOf(from), end = js.indexOf(to);
    assert.ok(start >= 0 && end > start, 'card-faces.js no longer contains ' + JSON.stringify(start < 0 ? from : to));
    return js.slice(start, end);
  };
  vm.runInContext(slice('  var WA_SHEET = new URL(', '  var WA_TEXT ='), context);
  vm.runInContext(slice('  function waLcdText(', '  function waLcdCell('), context);
  return context;
}
function card(width) {
  const style = new Map();
  return { clientWidth: width, getBoundingClientRect: () => ({ width }), dataset: {},
    querySelector: () => null, style: { setProperty: (k, v) => style.set(k, String(v)) }, read: k => style.get(k) };
}

test('the readout shows the timer as it runs, seconds and all', () => {
  const { waLcdText } = harness();
  // Nothing is ever dropped to make the row fit: whatever the shift clock
  // writes is what the panel shows.
  assert.equal(waLcdText('07:38:55'), '07:38:55');
  assert.equal(waLcdText(' 01:24:37 '), '01:24:37', 'the live timer arrives with the markup\u2019s whitespace');
  assert.equal(waLcdText('00:04:09'), '00:04:09');
  assert.equal(waLcdText('8\u201320'), '8\u201320', 'a shift window keeps its dash glyph');
  assert.equal(waLcdText(''), '');
  assert.equal(waLcdText.length, 1, 'no second argument can switch the seconds off again');
});

test('skin bitmaps are zoomed in whole steps, never stretched to fit', () => {
  const { waZoom } = harness();
  const zooms = width => { const el = card(width); waZoom(el); return { skin: Number(el.read('--wa-px')), lcd: Number(el.read('--wa-px-lcd')) }; };
  for (const width of [0, 80, 165, 200, 260, 340, 420, 520, 596, 900, 4000]) {
    const { skin, lcd } = zooms(width);
    for (const [name, value] of [['skin', skin], ['lcd', lcd]]) {
      assert.ok(Number.isInteger(value), width + 'px card got a fractional ' + name + ' zoom: ' + value);
      assert.ok(value >= 1, width + 'px card must still draw ' + name + ' at least 1:1');
    }
    assert.ok(lcd <= skin, 'the time display has the tighter box, so it can never zoom past the rest');
  }
  assert.equal(zooms(200).skin, 1, 'a small card stays at the sprite\u2019s own size');
  assert.equal(zooms(340).skin, 2);
  assert.equal(zooms(520).skin, 3);
  assert.equal(zooms(596).lcd, 2, 'a card the size of the one in the app fits H:MM:SS at double size');
  assert.ok(zooms(4000).skin <= 6, 'the zoom is capped so a huge card cannot blow the sprite up');
  // H:MM:SS is 65 skin px of digits, colons and gaps; the panel is 41.5 units
  // wide and 13.5 tall.
  for (const width of [232, 260, 340, 420, 464, 520, 596, 700]) {
    const { lcd } = zooms(width);
    assert.ok(65 * lcd <= 41.5 * (width / 148) + 1, 'time display too wide for the panel at ' + width + 'px');
    assert.ok(13 * lcd <= 13.5 * (width / 148), 'time display too tall for the panel at ' + width + 'px');
  }
});

test('a row wider than the panel is squeezed, never trimmed', () => {
  const { waFitLcd } = harness();
  const row = width => ({ scrollWidth: width, offsetWidth: width, style: { transform: '' } });
  let lcd = row(130);
  waFitLcd({ clientWidth: 167 }, lcd);
  assert.equal(lcd.style.transform, '', 'a row that already fits is left alone');
  lcd = row(65);
  waFitLcd({ clientWidth: 56 }, lcd);
  assert.equal(lcd.style.transform, 'scale(0.862)', 'a card too narrow for 1:1 digits');
  lcd = row(195);
  waFitLcd({ clientWidth: 167 }, lcd);
  assert.equal(lcd.style.transform, 'scale(0.856)', 'a page still running an older stylesheet');
  lcd = row(65);
  waFitLcd({ clientWidth: 0 }, lcd);
  assert.equal(lcd.style.transform, '', 'nothing to measure against before layout');
});

test('the zoom is only recomputed when it actually changes', () => {
  const { waZoom } = harness();
  const el = card(340);
  let writes = 0;
  el.style.setProperty = () => { writes++; };
  waZoom(el); waZoom(el); waZoom(el);
  assert.equal(writes, 2, 'both zoom variables, written once');
});

test('the time display is drawn from the real Winamp digit sprite', () => {
  // 11 cells of 9x13: the classic NUMBERS.BMP layout.
  assert.equal(numbers.readUInt32BE(16), 99, 'sprite width');
  assert.equal(numbers.readUInt32BE(20), 13, 'sprite height');
  assert.equal(numbers.readUInt8(25), 6, 'the mask needs an alpha channel (colour type 6)');
  assert.match(css, /--wa-nums/, 'the digits use the dedicated sprite, not the composed sheet');
  assert.doesNotMatch(css, /mask-source-type|mask-mode/, 'luminance masking is what browsers disagreed about');
  const lcd = css.slice(css.indexOf('.mk-wa-lcd b {'), css.indexOf('.mk-wa-lcd b.colon'));
  assert.match(lcd, /width:calc\(9px \* var\(--wa-px-lcd\)\)/, 'digit cells are whole skin pixels');
  assert.match(lcd, /image-rendering:pixelated/);
  assert.doesNotMatch(lcd, /drop-shadow/, 'a glow around a 9px digit only costs contrast');
});

test('the frame overlays are placed the way the frame itself is stretched', () => {
  // The frame is a square picture scaled to 100% x 100% of a card that is not
  // square, so anything that has to line up with it needs its vertical
  // coordinates in per cent of the card height, not in width-derived units.
  const rules = css.split('\n').filter(line => /\.mk-wa-(mqbox|pos|meter)|data-wf-part="(remaining|moon|month|clock|hours|fatigue|name|initials|emoji|coffee)"|\.mk-wf-depth/.test(line));
  assert.ok(rules.length >= 12, 'found ' + rules.length + ' frame-aligned rules');
  for (const rule of rules) {
    for (const [prop] of [['top'], ['bottom']]) {
      const match = new RegExp(prop + ':calc\\(var\\(--u\\)[^;]*').exec(rule);
      assert.equal(match, null, prop + ' still measured off the card width: ' + (match && match[0]));
    }
  }
  assert.match(css, /top:calc\(100% \* 120 \/ 148\)/, 'the time display sits on the panel the frame draws');
});

test('the shift numeral is lit on the same whole-pixel grid, without a halo', () => {
  const numeral = css.slice(css.indexOf('/* LED dot-matrix numeral. */'), css.indexOf('/* Name stays white'));
  const cells = numeral.match(/repeating-linear-gradient\([^)]*deg,#000 0 calc\((\d+)px \* var\(--wa-px\)\),transparent calc\(\d+px \* var\(--wa-px\)\) calc\((\d+)px \* var\(--wa-px\)\)\)/g);
  assert.equal(cells && cells.length, 4, 'both axes of both mask-image declarations run on whole pixels');
  assert.doesNotMatch(numeral, /var\(--u\) \* 2\.3/, 'a grid in card units is what smeared the dots');
  assert.doesNotMatch(numeral, /drop-shadow/, 'the glow was a blurred copy of the whole matrix');
});
