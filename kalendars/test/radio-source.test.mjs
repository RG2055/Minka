import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
// The radio is the only source (music lives in RG Music): selecting it marks RADIO pressed and lets the radio play.
const source = fs.readFileSync(new URL('../../js/radio-source.js', import.meta.url), 'utf8');
function setup(hidden) {
  const nodes = new Map();
  const node = (id) => {
    if (!nodes.has(id)) {
      const classes = new Set();
      nodes.set(id, { style: {}, textContent: 'x', attributes: {}, parentElement: null,
        classList: { add: (...a) => a.forEach((x) => classes.add(x)), remove: (...a) => a.forEach((x) => classes.delete(x)), contains: (x) => classes.has(x) },
        setAttribute(k, v) { this.attributes[k] = v; }, addEventListener() {}, querySelector: () => null });
    }
    return nodes.get(id);
  };
  let layouts = 0;
  const document = { getElementById: node, body: node('body'), querySelector: () => null };
  if (hidden) document.body.classList.add('radio-hidden');
  const window = { matchMedia: () => ({ matches: false, addEventListener() {} }), syncShellLayout() { layouts++; }, __mkRadioSupersededByLacitis: true };
  vm.runInNewContext(source, { document, window, requestAnimationFrame() {} });
  return { window, node, layouts: () => layouts };
}
test('selecting the radio marks it pressed, clears the status and lets it play', () => {
  const s = setup(false);
  s.window.setRadioSource('radio');
  assert.equal(s.node('radioSourceBroadcast').attributes['aria-pressed'], 'true');
  assert.equal(s.node('radioSourceStatus').textContent, '');
  assert.equal(s.node('radioToggle').attributes['aria-expanded'], 'true');
  assert.equal(s.window.__mkRadioSupersededByLacitis, false);
  assert.equal(s.layouts(), 1);
});
test('a hidden radio reports itself collapsed; on desktop the dock toggle is not taken over', () => {
  const s = setup(true);
  s.window.setRadioSource('radio');
  assert.equal(s.node('radioToggle').attributes['aria-expanded'], 'false');
  assert.equal(s.window.toggleRadioMusicVisibility(), false);
});
