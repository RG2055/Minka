// Prints the emoji picker's catalogue (kalendars/js/emoji.js: sections, emoji
// per section, Latvian names) as JSON, for scripts/build-noto-emoji.py.
// Runs emoji.js in a sandbox where the page objects do nothing.
import fs from 'fs';
import vm from 'vm';
const src = fs.readFileSync(new URL('../kalendars/js/emoji.js', import.meta.url), 'utf8');
const noop = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : noop), apply: () => noop, construct: () => noop });
const win = { document: noop, localStorage: { getItem: () => null, setItem() {} }, setTimeout() {}, setInterval() {}, addEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {} }), location: { origin: '', search: '', href: '' }, navigator: {} };
win.window = win;
vm.runInNewContext(src, win);
process.stdout.write(JSON.stringify(win.MinkaEmoji.catalogue()));
