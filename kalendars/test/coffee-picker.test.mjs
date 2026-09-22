import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const calendar = await readFile(new URL('../js/calendar.js', import.meta.url), 'utf8');

// placePicker and its anchor helper live inside showCoffeePicker; lift the pair
// out and drive them the way a click does.
function harness({ innerWidth = 1280, innerHeight = 900 } = {}) {
  // Start at the anchor helper when it is there, at placePicker otherwise, so
  // this suite can be pointed at a build without the fix and show the corner.
  const helper = calendar.indexOf('      let anchorBox = null;');
  const placer = calendar.indexOf('      function placePicker() {');
  const from = helper >= 0 && helper < placer ? helper : placer;
  const to = calendar.indexOf('      function defaultPriceFor(src) {');
  assert.ok(from > 0 && to > from, 'calendar.js no longer contains the picker placement block');
  const picker = { style: {}, getBoundingClientRect: () => ({ height: 270 }) };
  const anchor = { rect: { top: 400, bottom: 424, right: 600, width: 17, height: 24 },
    getBoundingClientRect() { return this.rect; } };
  const context = vm.createContext({
    picker, anchor, window: { innerWidth, innerHeight },
    document: { documentElement: { classList: { contains: () => false } } },
    Math
  });
  vm.runInContext(calendar.slice(from, to), context);
  // The dialog's width is a Material 3 shape decision that may change; read it
  // from the code so these cases keep testing the placement, not the number.
  const width = Number(/const pw = (\d+)/.exec(calendar.slice(from, to))?.[1]);
  assert.ok(width > 0, 'the placement block no longer declares the picker width');
  return { context, picker, anchor, width, place: () => context.placePicker() };
}

test('the picker opens beside the button that asked for it', () => {
  const { picker, place, width } = harness();
  place();
  assert.equal(picker.style.top, '432px', 'just below the +');
  assert.equal(picker.style.left, (600 - width) + 'px', 'right edge lined up with the +');
});

test('a collapsed anchor does not throw the picker into the corner', () => {
  const { picker, anchor, place } = harness();
  place();
  const opened = { top: picker.style.top, left: picker.style.left };
  // Moving the pointer onto the picker un-hovers the card: on a watch face the
  // + is display:none, everywhere else it is zero-wide.
  for (const gone of [{ top: 0, bottom: 0, right: 0, width: 0, height: 0 },
                      { top: 400, bottom: 424, right: 600, width: 0, height: 24 }]) {
    anchor.rect = gone;
    place();
    assert.deepEqual({ top: picker.style.top, left: picker.style.left }, opened,
      'the picker stays where it opened instead of jumping to ' + JSON.stringify(picker.style));
  }
});

test('the picker follows the button again once it is measurable', () => {
  const { picker, anchor, place, width } = harness();
  place();
  anchor.rect = { top: 0, bottom: 0, right: 0, width: 0, height: 0 };
  place();
  anchor.rect = { top: 100, bottom: 124, right: 400, width: 17, height: 24 };
  place();
  assert.equal(picker.style.top, '132px');
  assert.equal(picker.style.left, (400 - width) + 'px');
});

test('without any anchor it still lands somewhere sensible', () => {
  const { context, picker } = harness();
  context.anchor = null;
  context.placePicker();
  assert.equal(picker.style.top, '20px');
  assert.equal(picker.style.left, '20px');
});

test('a short window flips the picker above the button rather than off-screen', () => {
  const { picker, anchor, place } = harness({ innerHeight: 560 });
  anchor.rect = { top: 420, bottom: 444, right: 600, width: 17, height: 24 };
  place();
  assert.equal(picker.style.top, '142px', 'above the + (420 - 270 - 8)');
});
