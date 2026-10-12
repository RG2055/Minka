/* Cover Flow while the radio is open (desktop; css/page/radio-coverflow.css).
   The day's cards stand in one ring: the middle one faces you, the others turn
   away on both sides in perspective and the row turns slowly by itself. Wheel, the ‹ ›
   buttons, a drag or a click on a side card turn it by hand (the arrow keys
   keep switching days).
   Each card gets one transform and nothing else (no layers kept around, no
   filters); cards further than four from the middle are not drawn. The slow turn
   pauses under the pointer, after any turn by hand, in a hidden tab and with
   reduced motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (root.classList.contains('mk-mobile-shell')) return;
  var list = document.getElementById('grafiks-list');
  if (!list) return;

  var on = false, cards = [], active = 0, size = 200, hover = false, pauseUntil = 0;
  var placeFrame = 0, collectFrame = 0, autoTimer = 0, ro = null, prev = null, next = null;
  var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var AUTO_MS = 5000, VISIBLE = 4;

  function collect() {
    return Array.prototype.slice.call(list.querySelectorAll('.cards-subgrid > .card.mk-mid-card:not(.rg-feedback-card)'));
  }
  // The row lives in the part of the roster that is really visible: the
  // header with the day strip lies over the list's top, and the frame ends
  // above the radio. The middle card is sized to that strip and the row is
  // centred in it (a short window left ~130 px: a card sized to the whole
  // list was cut off under the day strip).
  var header = document.getElementById('minkaBarWrap');
  function measure() {
    var L = list.getBoundingClientRect();
    var top = L.top, bottom = Math.min(L.bottom, window.innerHeight);
    if (header) {
      var H = header.getBoundingClientRect();
      if (H.height && H.right > L.left && H.left < L.right && H.bottom > top) top = Math.min(H.bottom, bottom);
    }
    var vis = Math.max(0, bottom - top), w = list.clientWidth || 800;
    // Room above the card for what sits on its top edge (a topper rises up to
    // 0.35 of the card's width, card-addons.js TOPPER_ROOM): card and that band
    // together are centred in the visible strip, so a cat on the middle card is
    // not cut by the day strip.
    var ROOM = 0.35;
    size = Math.round(Math.max(72, Math.min(vis * 0.96 / (1 + ROOM), w * 0.25, 280)));
    var block = size * (1 + ROOM);
    var cy = Math.round(top - L.top + Math.max(0, (vis - block) / 2) + size * ROOM + size / 2);
    // Written only when changed: the list's style is watched (radio height).
    if (list.style.getPropertyValue('--cf-size') !== size + 'px') list.style.setProperty('--cf-size', size + 'px');
    if (list.style.getPropertyValue('--cf-cy') !== cy + 'px') list.style.setProperty('--cf-cy', cy + 'px');
  }
  function offsetOf(i) {
    var n = cards.length, o = i - active;
    if (n > 2) { if (o > n / 2) o -= n; else if (o < -n / 2) o += n; }
    return o;
  }
  // Side cards share the width up to the ‹ › buttons, so a wide window has no
  // empty band between the row and the buttons (a turned card shows ~0.3 of
  // its width on each side of its centre).
  var spread = 60;
  function place() {
    placeFrame = 0;
    if (!on) return;
    // The same number of cards on both sides: with an even count the card
    // opposite the middle one waits unseen instead of making one side longer.
    var side = Math.min(VISIBLE, Math.floor((cards.length - 1) / 2));
    var half = (list.clientWidth || 800) / 2 - 64;
    var last = half - size * 0.32;
    spread = Math.max(size * 0.3, Math.min(size * 0.62, (last - size * 0.62) / Math.max(1, side - 1)));
    var jumped = [];
    cards.forEach(function (card, i) {
      var o = offsetOf(i), a = Math.abs(o), s = o < 0 ? -1 : 1;
      // Turned away in perspective like the iPod (the look that read best).
      var x = 0, z = 0, ry = 0;
      if (o) {
        x = s * (size * 0.62 + (a - 1) * spread);
        z = -size * 0.5 - (a - 1) * size * 0.06;
        ry = -s * 55;
      }
      if (card.__cfO != null && Math.abs(card.__cfO - o) > 2) { card.classList.add('mk-cf-jump'); jumped.push(card); }
      card.__cfO = o;
      // important: older card layers pin transform:none with !important.
      card.style.setProperty('transform', 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + ry + 'deg)', 'important');
      card.style.setProperty('z-index', String(100 - a), 'important');
      if (card.classList.contains('mk-cf-center') !== (o === 0)) card.classList.toggle('mk-cf-center', o === 0);
      if (card.classList.contains('mk-cf-side') !== (o !== 0)) card.classList.toggle('mk-cf-side', o !== 0);
      if (card.classList.contains('mk-cf-far') !== (a > side)) card.classList.toggle('mk-cf-far', a > side);
    });
    if (jumped.length) requestAnimationFrame(function () { requestAnimationFrame(function () {
      jumped.forEach(function (card) { card.classList.remove('mk-cf-jump'); });
    }); });
  }
  function schedulePlace() { if (!placeFrame) placeFrame = requestAnimationFrame(place); }
  function go(i, byHand) {
    var n = cards.length;
    if (!n) return;
    active = ((i % n) + n) % n;
    if (byHand) pauseUntil = Date.now() + 12000;
    schedulePlace();
  }
  function step(d) { go(active + d, true); }

  function clearCard(card) {
    card.style.removeProperty('transform');
    card.style.removeProperty('z-index');
    card.classList.remove('mk-cf-center', 'mk-cf-side', 'mk-cf-far', 'mk-cf-jump');
    card.__cfO = null;
  }
  // Day switch or a refresh rebuilds the roster: keep the same person in the
  // middle when they are on the new day too.
  function recollect() {
    collectFrame = 0;
    if (!on) return;
    var centerName = cards[active] && cards[active].getAttribute('data-worker');
    cards = collect();
    var keep = centerName ? cards.findIndex(function (c) { return c.getAttribute('data-worker') === centerName; }) : -1;
    active = keep >= 0 ? keep : Math.min(active, Math.max(0, cards.length - 1));
    cards.forEach(function (card) { card.__cfO = null; });
    ensureNav();
    place();
  }
  function scheduleCollect() { if (on && !collectFrame) collectFrame = requestAnimationFrame(recollect); }

  function navButton(cls, label, path, d) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mk-cf-nav ' + cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    b.addEventListener('click', function (e) { e.stopPropagation(); step(d); });
    return b;
  }
  function ensureNav() {
    if (!prev) prev = navButton('mk-cf-prev', 'Iepriekšējā kartīte', 'M15 6l-6 6 6 6', -1);
    if (!next) next = navButton('mk-cf-next', 'Nākamā kartīte', 'M9 6l6 6-6 6', 1);
    if (prev.parentNode !== list) list.appendChild(prev);
    if (next.parentNode !== list) list.appendChild(next);
  }

  function enable() {
    if (on) return;
    on = true;
    cards = collect();
    active = Math.min(active, Math.max(0, cards.length - 1));
    root.classList.add('mk-cf');
    measure();
    ensureNav();
    if (!ro && typeof ResizeObserver === 'function') {
      ro = new ResizeObserver(function () { if (!on) return; measure(); schedulePlace(); });
    }
    if (ro) ro.observe(list);
    place();
    if (!autoTimer) autoTimer = setInterval(function () {
      if (!on || hover || document.hidden || reduced.matches || Date.now() < pauseUntil || cards.length < 2) return;
      go(active + 1, false);
    }, AUTO_MS);
  }
  function disable() {
    if (!on) return;
    on = false;
    root.classList.remove('mk-cf');
    if (ro) ro.disconnect();
    clearInterval(autoTimer); autoTimer = 0;
    if (placeFrame) { cancelAnimationFrame(placeFrame); placeFrame = 0; }
    collect().forEach(clearCard);
    list.style.removeProperty('--cf-size');
    list.style.removeProperty('--cf-cy');
    if (prev && prev.parentNode) prev.remove();
    if (next && next.parentNode) next.remove();
  }
  function sync() { if (root.classList.contains('host-radio-open')) enable(); else disable(); }

  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  // Roster rebuilt (day switch, refresh): the nav buttons are thrown out with it.
  new MutationObserver(scheduleCollect).observe(list, { childList: true });
  // The radio's height arrives here as a style on the list.
  new MutationObserver(function () { if (on) { measure(); schedulePlace(); } }).observe(list, { attributes: true, attributeFilter: ['style'] });

  list.addEventListener('pointerenter', function () { hover = true; });
  list.addEventListener('pointerleave', function () { hover = false; });

  // A click on a side card brings it to the middle (and does nothing else);
  // the middle card keeps its own click.
  var dragged = false;
  list.addEventListener('click', function (e) {
    if (!on) return;
    var card = e.target.closest && e.target.closest('.card.mk-mid-card');
    if (dragged) { dragged = false; e.preventDefault(); e.stopPropagation(); return; }
    if (!card || card.classList.contains('mk-cf-center')) return;
    var i = cards.indexOf(card);
    if (i < 0) return;
    e.preventDefault(); e.stopPropagation();
    go(i, true);
  }, true);

  var wheelAcc = 0, wheelAt = 0;
  list.addEventListener('wheel', function (e) {
    if (!on) return;
    e.preventDefault();
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    var now = Date.now();
    if (now - wheelAt > 300) wheelAcc = 0;
    wheelAt = now;
    wheelAcc += d;
    if (Math.abs(wheelAcc) >= 60) { step(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
  }, { passive: false });

  var dragX = null, dragId = null;
  list.addEventListener('pointerdown', function (e) {
    if (!on || e.button !== 0 || (e.target.closest && e.target.closest('.mk-cf-nav, button, input, a'))) return;
    dragX = e.clientX; dragId = e.pointerId; dragged = false;
  });
  list.addEventListener('pointermove', function (e) {
    if (dragX == null || e.pointerId !== dragId) return;
    var dx = e.clientX - dragX;
    if (Math.abs(dx) >= Math.max(48, size * 0.3)) { step(dx < 0 ? 1 : -1); dragX = e.clientX; dragged = true; }
  });
  function endDrag() { dragX = null; dragId = null; }
  list.addEventListener('pointerup', endDrag);
  list.addEventListener('pointercancel', endDrag);

  sync();
})();

/* With the radio open both side columns share one scale (--mk-cf-z, never
   below 75 %): the fuller column decides, so the two sides always match.
   Re-checked when the radio opens, a column's size changes or a day switch
   brings other people. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (root.classList.contains('mk-mobile-shell')) return;
  var queued = 0, ro = null, watched = new Set();
  function cols() { return Array.prototype.slice.call(document.querySelectorAll('#grafiks-app .side-panel .duty-vertical')); }
  function fit() {
    queued = 0;
    var list = cols();
    list.forEach(function (c) {
      if (!watched.has(c)) { watched.add(c); if (ro) ro.observe(c); new MutationObserver(schedule).observe(c, { childList: true }); }
    });
    var panels = list.map(function (c) { return c.closest('.side-panel'); }).filter(Boolean);
    var set = function (z) { panels.forEach(function (p) { if (z) p.style.setProperty('--mk-cf-z', z); else p.style.removeProperty('--mk-cf-z'); }); };
    var tight = function (on) { panels.forEach(function (p) { p.classList.toggle('mk-cf-tight', on); }); };
    set(''); tight(false);
    if (!root.classList.contains('host-radio-open')) return;
    var over = function () { var w = 0; list.forEach(function (c) { if (c.clientHeight) w = Math.max(w, c.scrollHeight / c.clientHeight); }); return w; };
    var shrink = function () {
      var z = 1;
      for (var k = 0; k < 5 && over() > 1.002 && z > 0.75; k++) {
        z = Math.max(0.75, z / over() * 0.99);
        set(z.toFixed(3));
      }
    };
    shrink();
    /* Zemiem ekrāniem (MacBook): ja pat 75 % neietilpst, katrs cilvēks vienā
       zemākā rindā (maiņa aiz uzvārda) un mērogs no jauna – teksts nekļūst sīkāks. */
    if (over() > 1.002) { set(''); tight(true); shrink(); }
    /* Garš vārds + uzvārds: tikai tai kartītei burti par 1–4 px mazāki (ne zem
       11 px), lai uzvārds redzams pilnībā; pārējie paliek 15 px. */
    list.forEach(function (c) {
      Array.prototype.forEach.call(c.querySelectorAll(':scope > .mk-side-card'), function (card) {
        card.style.removeProperty('--mk-cf-fs');
        var n = card.querySelector('.duty-name'), s = card.querySelector('.duty-surname');
        if (!n || !s) return;
        var cut = function () { return n.scrollWidth > n.clientWidth + 1 || s.scrollWidth > s.clientWidth + 1; };
        for (var fs = 14; fs >= 11 && cut(); fs--) card.style.setProperty('--mk-cf-fs', fs + 'px');
      });
    });
  }
  function schedule() { if (!queued) queued = requestAnimationFrame(fit); }
  if (typeof ResizeObserver === 'function') {
    var last = new WeakMap();
    ro = new ResizeObserver(function (entries) {
      if (entries.some(function (e) { var h = Math.round(e.contentRect.height); var was = last.get(e.target); last.set(e.target, h); return was !== h; })) schedule();
    });
  }
  window.addEventListener('daySelected', function () { schedule(); setTimeout(schedule, 150); });
  var wasOpen = root.classList.contains('host-radio-open');
  new MutationObserver(function () {
    var open = root.classList.contains('host-radio-open');
    if (open !== wasOpen) { wasOpen = open; schedule(); }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  schedule();
})();
