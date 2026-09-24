import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const shell = await read('../../index.html');
const calendarPage = await read('../index.html');
const motion = await read('../../js/mk-motion.js');
const tokens = await read('../../css/mk-sys.css');
const authCss = await read('../css/page/auth-overlay.css');

function loadMotion({ stored = null, reduce = false } = {}) {
  const store = new Map(stored ? [['minkaMotionV1', JSON.stringify(stored)]] : []);
  const attrs = {};
  const window = {
    parent: null,
    matchMedia: () => ({ matches: reduce, addEventListener() {} }),
    addEventListener() {},
    requestAnimationFrame: () => 0
  };
  window.parent = window;
  const context = {
    window,
    document: { documentElement: { getAttribute: (k) => attrs[k] ?? null, setAttribute: (k, v) => { attrs[k] = v; } }, hidden: false, addEventListener() {} },
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    location: { origin: 'http://x' },
    performance: { now: () => 0 },
    Promise, JSON, Math, Date, Number, String
  };
  vm.runInNewContext(motion, context);
  return { api: window.MinkaMotion, attrs, store };
}

test('both documents load the shared tokens and motion layer', () => {
  assert.match(shell, /<link rel="stylesheet" href="css\/mk-sys\.css\?v=[^"]+">\s*<script src="js\/mk-motion\.js\?v=[^"]+"><\/script>/);
  assert.match(calendarPage, /<link rel="stylesheet" href="\.\.\/css\/mk-sys\.css\?v=[^"]+">\s*<script src="\.\.\/js\/mk-motion\.js\?v=[^"]+"><\/script>/);
});

test('the first paint already carries a motion level, separate from low-spec', () => {
  for (const page of [shell, calendarPage]) {
    assert.match(page, /setAttribute\('data-motion', reduceMotion \? 'reduced' : \(motionStore\.level === 'lite' \? 'lite' : 'full'\)\)/);
  }
  assert.doesNotMatch(shell, /var lowSpec = reduceMotion \|\|/, 'reduced motion is no longer folded into lowSpec');
});

test('decorative CSS loops stop by motion level, not by the always-on low-spec class', () => {
  assert.doesNotMatch(authCss, /html\.mk-low-spec \*,\s*html\.mk-low-spec \*::before,\s*html\.mk-low-spec \*::after \{\s*animation-duration/);
  assert.match(authCss, /html\[data-motion="lite"\] \*,[\s\S]*?html\[data-motion="reduced"\] \*::after \{\s*animation-duration: 0\.01ms !important;/);
});

test('tokens: lite drops the overshoot, reduced drops travel', () => {
  assert.match(tokens, /--mk-ease-expressive-default: cubic-bezier\(\.38, 1\.21, \.22, 1\.00\);/);
  assert.match(tokens, /:root\[data-motion="lite"\] \{[\s\S]*?--mk-ease-expressive-default: var\(--mk-ease-standard\);[\s\S]*?--mk-motion-travel: \.5;/);
  assert.match(tokens, /:root\[data-motion="reduced"\] \{[\s\S]*?--mk-motion-travel: 0;/);
});

test('level: full by default, lite only from stored evidence, reduced from the media query', () => {
  assert.equal(loadMotion().api.level(), 'full');
  assert.equal(loadMotion({ stored: { level: 'lite', at: Date.now() } }).api.level(), 'lite');
  assert.equal(loadMotion({ stored: { level: 'lite', at: Date.now() - 20 * 86400000 } }).api.level(), 'full', 're-probed after two weeks');
  assert.equal(loadMotion({ reduce: true, stored: { level: 'lite', at: Date.now() } }).api.level(), 'reduced');
  const { attrs } = loadMotion({ stored: { level: 'lite', at: Date.now() } });
  assert.equal(attrs['data-motion'], 'lite');
});

test('one janky transition never switches the level; three do', () => {
  const { api, attrs } = loadMotion();
  api.report({ frames: 30, long: 20, worst: 90 });
  api.report({ frames: 30, long: 0, worst: 17 });
  api.report({ frames: 30, long: 12, worst: 60 });
  assert.equal(api.level(), 'full');
  api.report({ frames: 30, long: 1, worst: 180 });
  assert.equal(api.level(), 'lite');
  assert.equal(attrs['data-motion'], 'lite');
});

test('the radio grows out of and back into the dock button as itself', () => {
  const reveal = shell.slice(shell.indexOf('const mkRadioReveal = (function () {'), shell.indexOf('window.__mkRadioReveal = mkRadioReveal;'));
  assert.doesNotMatch(reveal, /radioMorph|getShell/, 'no empty stand-in slab any more');
  assert.doesNotMatch(shell, /#radioMorph/);
  const run = reveal.slice(reveal.indexOf('function run(open)'));
  assert.match(run, /rw\.animate\(\[\s*\{ translate: from \? from\.translate : pose\.translate, scale: from \? from\.scale : pose\.scale \}/, 'open starts on the button');
  assert.match(run, /\{ translate: pose\.translate, scale: pose\.scale \}/, 'close ends on the button');
  assert.match(run, /motionToken\('spatial-default'\)/);
  assert.match(run, /motionToken\('spatial-fast', true\)/);
  assert.match(run, /if \(running\) \{\s*if \(running\.open === open\) return true;[\s\S]*?from = livePose\(running\);\s*abandon\(running\);/,
    'a click mid-way reverses from the live pose');
  const pose = reveal.slice(reveal.indexOf('function buttonPose(rw)'), reveal.indexOf('function run(open)'));
  assert.match(pose, /Math\.max\(b\.width \/ r\.width, b\.height \/ r\.height\)/, 'one uniform scale, nothing stretches');
  assert.match(pose, /transformOrigin/, 'the skins\' bottom origin is accounted for');
});
