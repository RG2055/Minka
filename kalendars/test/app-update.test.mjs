import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../../js/app-update.js', import.meta.url), 'utf8');

// A small page: a registration whose new worker can be made "installed",
// visibility, media, timers run by hand, and records of reloads/badges.
function page({ now = 0 } = {}) {
  const listeners = {}, docListeners = {}, timers = [];
  const log = { reloads: 0, badge: [], skip: 0 };
  let clock = now;
  const body = { children: [], appendChild(el) { this.children.push(el); el.isConnected = true; } };
  const el = () => {
    const node = { style: {}, children: [], attrs: {}, listeners: {}, textContent: '', disabled: false,
      setAttribute(k, v) { this.attrs[k] = v; }, append(...c) { this.children.push(...c); },
      addEventListener(t, f) { this.listeners[t] = f; }, remove() { body.children = body.children.filter(x => x !== this); } };
    return node;
  };
  const media = [];
  const document = {
    body, visibilityState: 'visible', createElement: el,
    querySelectorAll: sel => (sel === 'audio,video' ? media : []),
    addEventListener(t, f) { docListeners[t] = f; }
  };
  const worker = () => ({ state: 'installing', listeners: {}, addEventListener(t, f) { this.listeners[t] = f; },
    postMessage(m) { if (m.type === 'SKIP_WAITING') log.skip++; } });
  const reg = { waiting: null, installing: null, listeners: {}, updates: 0,
    addEventListener(t, f) { this.listeners[t] = f; }, update() { this.updates++; return Promise.resolve(); } };
  const window = {
    addEventListener(t, f) { listeners[t] = f; },
    __mkRadioPlaybackState: () => ({ paused: true })
  };
  const ctx = {
    window, document, reg,
    navigator: { serviceWorker: { controller: {} }, setAppBadge: () => { log.badge.push(true); return Promise.resolve(); }, clearAppBadge: () => { log.badge.push(false); return Promise.resolve(); } },
    location: { reload: () => { log.reloads++; } },
    sessionStorage: { setItem() {} },
    Date: { now: () => clock },
    setInterval: (f, ms) => timers.push({ f, ms }),
    requestAnimationFrame: f => f()
  };
  ctx.window.__proto__ = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const api = ctx.window.__mkUpdates;
  return {
    api, reg, log, document, media, body,
    advance(ms) { clock += ms; },
    tick(ms) { timers.filter(t => t.ms === ms).forEach(t => t.f()); },
    input() { listeners.pointerdown(); },
    hide() { document.visibilityState = 'hidden'; docListeners.visibilitychange(); },
    show() { document.visibilityState = 'visible'; docListeners.visibilitychange(); },
    newVersion() {
      const w = worker(); reg.installing = w; reg.listeners.updatefound();
      w.state = 'installed'; reg.waiting = w; reg.installing = null; w.listeners.statechange();
      return w;
    },
    toast() { return body.children.find(c => c.attrs.role === 'status'); }
  };
}

test('a version found right after opening is taken at once', () => {
  const p = page();
  p.api.watch(p.reg);
  p.advance(2000);
  p.newVersion();
  assert.equal(p.log.skip, 1);
  assert.equal(p.toast(), undefined);
});

test('later: a note and an icon dot, applied when the app goes to the background', () => {
  const p = page();
  p.api.watch(p.reg);
  p.advance(60 * 60 * 1000);
  p.input();
  p.newVersion();
  assert.equal(p.log.skip, 0, 'waits while in use');
  assert.ok(p.toast(), 'shows the note');
  assert.ok(p.log.badge.includes(true), 'dot on the icon');
  p.hide();
  assert.equal(p.log.skip, 1, 'applied in the background');
  p.api.reloadWhenSafe();
  assert.equal(p.log.reloads, 1);
});

test('never while the radio plays; applied once it stops and nobody touches the app', () => {
  const p = page();
  p.api.watch(p.reg);
  p.advance(60 * 60 * 1000);
  p.input();
  p.newVersion();
  p.media.push({ paused: false, muted: false });
  p.hide();
  p.advance(11 * 60 * 1000); p.tick(60 * 1000);
  assert.equal(p.log.skip, 0, 'radio playing: waits');
  p.media[0].paused = true;
  p.show();
  p.tick(60 * 1000);
  assert.equal(p.log.skip, 1, 'idle for 10 min and quiet: applied');
});

test('the button applies it now; another tab taking over waits for quiet here', () => {
  const p = page();
  p.api.watch(p.reg);
  p.advance(60 * 60 * 1000);
  p.input();
  p.newVersion();
  const button = p.toast().children[1];
  button.listeners.click();
  assert.equal(p.log.skip, 1);
  p.api.reloadWhenSafe();
  assert.equal(p.log.reloads, 1, 'asked for: reloads even while in use');

  const q = page();
  q.api.watch(q.reg);
  q.media.push({ paused: false, muted: false });
  q.api.reloadWhenSafe();
  assert.equal(q.log.reloads, 0, 'taken over elsewhere while playing: no reload yet');
  q.media[0].paused = true;
  q.hide();
  assert.equal(q.log.reloads, 1, 'reloads once quiet and hidden');
});

test('looks for a new version every 15 minutes and when shown again', () => {
  const p = page();
  p.api.watch(p.reg);
  p.advance(2 * 60 * 1000);
  p.tick(15 * 60 * 1000);
  assert.equal(p.reg.updates, 1);
  p.advance(2 * 60 * 1000);
  p.show();
  assert.equal(p.reg.updates, 2);
});
