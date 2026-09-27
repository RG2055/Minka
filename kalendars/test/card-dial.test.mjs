import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// The analog shift timer reads like the Nakts clock: the shift's hours a soft arc
// on the rim, the worked part bright over it, a dot where it ends, hour and minute
// hands; a shift longer than the dial's 12 hours keeps an inner lap.
const src = fs.readFileSync(new URL('../js/card-faces.js', import.meta.url), 'utf8');
const code = src.slice(src.indexOf('  function hm(t)'), src.indexOf('  // Small previews for the skin picker'));
const c = vm.createContext({ window: {}, Date, Math, String, Number });
vm.runInContext(code, c);
function el(start, end, now) { return { dataset: { start, end, dialNow: String(now) }, textContent: '' }; }
const count = (html, re) => (html.match(re) || []).length;

test('a running shift: soft arc, bright worked part, end dot, two hands, hours left', () => {
  for (const skin of ['a', 'b', 'e']) {
    const html = c.dialMarkup(el('14:00', '20:00', 17 * 60), skin + '12');
    assert.equal(count(html, /class="trk"/g) + count(html, /class="seg rest"/g) > 0, true, skin + ' remaining arc');
    assert.ok(/class="dn"|class="seg on"/.test(html), skin + ' worked part');
    assert.equal(count(html, /class="end"/g), 1, skin + ' end dot');
    assert.equal(count(html, /class="hand min"/g), 1, skin + ' minute hand');
    assert.match(html, />3:00</);
    assert.doesNotMatch(html, /dial-done/, 'no pie sector any more');
  }
});

test('a 24-hour shift keeps its hours before the last twelve as an inner lap', () => {
  const early = c.dialMarkup(el('08:00', '08:00', 10 * 60), 'a12');
  assert.equal(count(early, /class="lap"/g), 1);
  assert.match(early, />22:00</);
  const late = c.dialMarkup(el('08:00', '08:00', 21 * 60), 'a12');
  assert.equal(count(late, /class="lap"/g), 0, 'within the last 12 hours: the rim alone');
});

test('the ring dial has no hands but marks the time now on the ring', () => {
  const html = c.dialMarkup(el('14:00', '20:00', 17 * 60), 'c12');
  assert.equal(count(html, /class="hand/g), 0);
  assert.equal(count(html, /class="knob now"/g), 1);
});
