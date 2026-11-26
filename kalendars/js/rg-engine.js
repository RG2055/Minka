/* RG Engine 1.0: the day switch without rebuilding the page.
 *
 * RGEngine.morph(region, next): `next` (a DocumentFragment, or markup) is what the builder made for
 * `region` now. It is compared with what the builder made last time (kept as a detached copy, the
 * "shadow"), and only the difference is written into the page: changed attributes, class tokens,
 * inline style properties and text; nodes added or removed. Unchanged nodes stay as they are, with
 * their style, layout and listeners. What other modules added to a node (classes, inline properties,
 * child nodes) is left alone, because it is in neither the old nor the new build.
 * Nodes are paired by tag and key: data-worker, else id, else data-rg-key.
 * A card (data-worker) whose builder content a module rewrote (its own nodes gone from the page) is
 * replaced as a whole by the new build, so stale content never survives.
 * After a morph `rg:patched` is dispatched on the region (in a microtask, before the frame is painted;
 * with { quiet: true } the caller sends it with RGEngine.notify once its own finishing work is done),
 * detail { added: [elements put into the page], removed: [elements taken out] }. Modules that decorate
 * the cards listen to it instead of watching the list with a MutationObserver.
 *
 * RGEngine.idle(fn): run fn when the page is idle (prepared work for the days next to the shown one).
 * RGEngine.decode(urls): fetch and decode pictures ahead, so a switch never waits for them; returns
 * one promise per picture (settled when it is decoded or failed).
 */
(function () {
  'use strict';
  const SHADOW = new WeakMap();   // shadow node -> the page node it stands for
  const keyOf = (n) => (n.nodeType === 1 ? (n.getAttribute('data-worker') || n.id || n.getAttribute('data-rg-key') || '') : '');
  const same = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && keyOf(a) === keyOf(b)));

  function link(shadow, live, added) {
    SHADOW.set(shadow, live);
    if (added && live.nodeType === 1) added.push(live);
    let s = shadow.firstChild, l = live.firstChild;
    while (s && l) { link(s, l); s = s.nextSibling; l = l.nextSibling; }
  }
  function tokens(v) { return v ? v.split(/\s+/).filter(Boolean) : []; }
  function patchClass(live, was, now) {
    const a = tokens(was), b = tokens(now);
    for (const t of a) if (!b.includes(t)) live.classList.remove(t);
    for (const t of b) if (!a.includes(t) && !live.classList.contains(t)) live.classList.add(t);
  }
  function patchStyle(live, was, now) {
    const a = was.style, b = now.style;
    for (let i = 0; i < a.length; i++) { const p = a[i]; if (!b.getPropertyValue(p)) live.style.removeProperty(p); }
    for (let i = 0; i < b.length; i++) {
      const p = b[i], v = b.getPropertyValue(p), pr = b.getPropertyPriority(p);
      if (a.getPropertyValue(p) !== v || a.getPropertyPriority(p) !== pr || live.style.getPropertyValue(p) !== v) live.style.setProperty(p, v, pr);
    }
  }
  function patchAttrs(was, now, live) {
    const wa = was.attributes, na = now.attributes;
    for (let i = wa.length - 1; i >= 0; i--) {
      const n = wa[i].name;
      if (now.hasAttribute(n)) continue;
      if (n === 'class') patchClass(live, wa[i].value, '');
      else if (n === 'style') patchStyle(live, was, now);
      else live.removeAttribute(n);
    }
    for (let i = 0; i < na.length; i++) {
      const { name, value } = na[i], old = was.getAttribute(name);
      if (old === value) continue;
      if (name === 'class') patchClass(live, old, value);
      else if (name === 'style') patchStyle(live, was, now);
      else live.setAttribute(name, value);
    }
  }
  const textOnly = (el) => { for (let n = el.firstChild; n; n = n.nextSibling) if (n.nodeType !== 3) return false; return true; };
  // A module set the text of an element that holds only text (textContent): its text is the module's
  // until the build's own text changes.
  function retext(was, now, copy, live) {
    if (!textOnly(was) || !textOnly(now) || !textOnly(live)) return false;
    let moved = false;
    for (let n = was.firstChild; n && !moved; n = n.nextSibling) { const l = SHADOW.get(n); if (!l || l.parentNode !== live) moved = true; }
    if (!moved) return false;
    if (was.textContent !== now.textContent && live.textContent !== now.textContent) live.textContent = now.textContent;
    let c = copy.firstChild, l = live.firstChild;
    while (c) { SHADOW.set(c, l || live); c = c.nextSibling; l = l && l.nextSibling; }
    return true;
  }
  // Whether a module rewrote what the builder put inside `was` (its own nodes are no longer there).
  function rewritten(was, live) {
    if (textOnly(was) && textOnly(live)) return false;
    for (let s = was.firstChild; s; s = s.nextSibling) {
      const l = SHADOW.get(s);
      if (!l || l.parentNode !== live) return true;
      if (s.nodeType === 1 && rewritten(s, l)) return true;
    }
    return false;
  }

  // The new build is equal to the old one: its copy stands for the same page nodes.
  function carry(was, copy) {
    SHADOW.set(copy, SHADOW.get(was));
    let s = was.firstChild, c = copy.firstChild;
    while (s && c) { carry(s, c); s = s.nextSibling; c = c.nextSibling; }
  }
  // was: the old build's parent, now: the new build's parent (its nodes may move into the page),
  // copy: a copy of `now` that becomes the next shadow, live: the page's parent.
  function patchChildren(was, now, copy, live, out) {
    if (retext(was, now, copy, live)) return;
    const olds = [...was.childNodes], news = [...now.childNodes], copies = [...copy.childNodes];
    const byKey = new Map(), used = new Set(), pair = [];
    for (const o of olds) { const k = keyOf(o); if (k) { if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(o); } }
    // 1. pair each new node with an old one: by key, else the next unkeyed one of the same kind
    let free = 0;
    for (const n of news) {
      const k = keyOf(n);
      let o = null;
      if (k) { const list = byKey.get(k); while (list && list.length && !o) { const x = list.shift(); if (same(x, n)) o = x; } }
      else {
        while (free < olds.length && keyOf(olds[free])) free++;
        if (free < olds.length && same(olds[free], n)) o = olds[free++];
      }
      const ol = o && SHADOW.get(o);
      if (o && !(ol && ol.parentNode === live && !(o.nodeType === 1 && o.hasAttribute('data-worker') && rewritten(o, ol)))) o = null;
      if (o) used.add(o);
      pair.push(o);
    }
    // 2. what the new build no longer has leaves the page
    for (const o of olds) {
      if (used.has(o)) continue;
      const l = SHADOW.get(o);
      if (l && l.parentNode === live) { if (l.nodeType === 1) out.removed.push(l); l.remove(); }
    }
    // 3. in the builder's order: kept nodes get the difference, new nodes move in;
    //    nodes a module put in between are left where they are
    let prev = null;
    for (let i = 0; i < news.length; i++) {
      const n = news[i], c = copies[i], o = pair[i];
      let target;
      if (o) {
        target = SHADOW.get(o);
        if (n.nodeType === 1) {
          if (o.isEqualNode(n)) carry(o, c);
          else { SHADOW.set(c, target); patchAttrs(o, n, target); patchChildren(o, n, c, target, out); }
        } else {
          SHADOW.set(c, target);
          if (o.nodeValue !== n.nodeValue) target.nodeValue = n.nodeValue;
        }
      } else {
        target = n;
        link(c, target, out.added);
      }
      const want = prev ? prev.nextSibling : live.firstChild;
      if (target !== want) {
        let x = want;
        if (target.parentNode === live) while (x && x !== target && !owned(x)) x = x.nextSibling;
        if (x !== target) live.insertBefore(target, want);
      }
      prev = target;
    }
  }
  const OWNED = new WeakSet();
  const owned = (n) => OWNED.has(n);
  function own(n) { OWNED.add(n); for (let c = n.firstChild; c; c = c.nextSibling) own(c); }

  function toFragment(next) {
    if (typeof next !== 'string') return next;
    const t = document.createElement('template');
    t.innerHTML = next;
    return t.content;
  }

  function morph(region, next, opts) {
    if (!region) return null;
    const now = toFragment(next);
    const copy = now.cloneNode(true);
    const out = { added: [], removed: [] };
    const was = region.__rgShadow;
    if (!was) {
      // first build through the engine: whatever is there goes, the build moves in
      for (const el of region.children) out.removed.push(el);
      region.replaceChildren();
      for (const n of [...now.childNodes]) { own(n); if (n.nodeType === 1) out.added.push(n); region.appendChild(n); }
      SHADOW.set(copy, region);
      let s = copy.firstChild, l = region.firstChild;
      while (s && l) { link(s, l); s = s.nextSibling; l = l.nextSibling; }
    } else {
      patchChildren(was, now, copy, region, out);
      for (const el of out.added) own(el);
    }
    region.__rgShadow = copy;
    if (!(opts && opts.quiet)) notify(region, out);
    return out;
  }
  // rg:patched, after the current task's own work (where MutationObserver callbacks ran before)
  function notify(region, out) {
    if (!region || !out) return;
    queueMicrotask(() => {
      try { region.dispatchEvent(new CustomEvent('rg:patched', { detail: out })); } catch (e) { setTimeout(() => { throw e; }); }
    });
  }
  // The region was rewritten by other code: the next morph starts again from scratch.
  function forget(region) { if (region) region.__rgShadow = null; }

  const idle = (fn, timeout) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: timeout || 1500 }) : setTimeout(fn, 60));
  const decoded = new Map();      // url -> Image, kept while useful (the last 120)
  function decode(urls) {
    const done = [];
    for (const u of urls) {
      if (!u) continue;
      let entry = decoded.get(u);
      if (!entry) {
        const img = new Image();
        img.decoding = 'async';
        img.src = u;
        entry = { img, ready: img.decode ? img.decode().catch(() => {}) : Promise.resolve() };
      } else decoded.delete(u);
      decoded.set(u, entry);           // most recently used last
      done.push(entry.ready);
    }
    while (decoded.size > 120) decoded.delete(decoded.keys().next().value);
    return done;
  }

  window.RGEngine = { version: '1.0', morph, notify, forget, idle, decode };
})();
