import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// A person's emoji must never go blank. It did on computers with reduced motion
// (Windows "show animations" off): hover hid the glyph for an animation strip that
// the CSS hid too, and after the mouse left the calendar the next clock tick started
// that again at the old cursor spot — blank until someone hovered the card again.
const js = fs.readFileSync(new URL('../js/page/emoji-hover-animation.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../css/page/mk-emoji-anim-v1.css', import.meta.url), 'utf8');

test('reduced motion: the still frame stays, nothing plays, hover does not hide the glyph', () => {
  assert.doesNotMatch(css, /prefers-reduced-motion[^}]*\.mk-emoji-film\s*\{\s*display:\s*none/);
  assert.match(css, /prefers-reduced-motion: reduce\)\s*\{\s*html \.mk-emoji-film\.is-playing\.is-playing\s*\{\s*animation:\s*none/);
  assert.match(js, /if \(stillOnly\(\)\) \{ stop\(\); return; \}/);
});

test('the glyph is hidden only when the picture is really drawn', () => {
  assert.match(js, /if \(!film\.naturalWidth \|\| getComputedStyle\(film\)\.display === 'none'\) \{ box\.remove\(\); return; \}/);
  assert.doesNotMatch(js, /decode\(\)\.then\(reveal, reveal\)/, 'a failed decode must not reveal an empty box');
});

test('leaving the calendar forgets the cursor, so a clock tick cannot restart an animation', () => {
  assert.match(js, /if \(!e\.relatedTarget\) lastX = lastY = -1;/);
  assert.match(js, /addEventListener\('blur', function \(\) \{ lastX = lastY = -1; stop\(\); \}\)/);
});
