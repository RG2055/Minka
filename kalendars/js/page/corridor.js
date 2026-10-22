/* Corridor (the desktop calendar's view; css/page/corridor.css). The mood card stands in the middle, close and
   full size; the radiographers line the left wall and the radiologists the right one, as in the
   header, gently turned toward it (22°), the far end going back. Each card gets one transform
   (compositor only), as in radio-coverflow.js. Pointing at a card turns it to face you and
   springs it forward. Not while the radio's Cover Flow is open; a screen too small for the walls
   (cards under the usual size, more than three rows) keeps the usual grid. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (root.classList.contains('mk-mobile-shell') || window.MINKA_APP === 'rad') return;   // RG only: /rad keeps its own layout
  var list = document.getElementById('grafiks-list');
  if (!list) return;
  try { localStorage.removeItem('mkCorridor'); } catch (_e) {}   // the old trial's switch: the corridor is simply the view now

  var ANGLE = 22, GAP = 14, P = 1300, frame = 0;   // P: the list's perspective (corridor.css)
  var cos = Math.cos(ANGLE * Math.PI / 180), sin = Math.sin(ANGLE * Math.PI / 180);
  var header = document.getElementById('minkaBarWrap');

  function active() { return !root.classList.contains('host-radio-open') && list.classList.contains('grid-view'); }
  function cardsOf(kind) {
    var label = list.querySelector('.cards-section-label-' + kind);
    var section = label && label.closest('.cards-section');
    return section ? [].slice.call(section.querySelectorAll('.card.mk-mid-card:not(.rg-feedback-card)')) : [];
  }
  function clear() {
    root.classList.remove('mk-corridor');
    list.querySelectorAll('.card.mk-mid-card').forEach(function (c) {
      ['--cs', '--cx', '--cyo', '--cz', '--cry', '--cin', 'z-index'].forEach(function (p) { c.style.removeProperty(p); });
    });
    list.querySelectorAll('.cards-section-label').forEach(function (l) { l.style.removeProperty('--lx'); l.style.removeProperty('--ly'); });
  }
  function place() {
    frame = 0;
    rests = null; hot = null;
    var was = root.classList.contains('mk-corridor');
    if (!active()) { if (was) { clear(); if (window.__minkaScheduleMoodSectionLayout) window.__minkaScheduleMoodSectionLayout(); } return; }
    root.classList.add('mk-corridor');
    if (!was && window.__minkaScheduleMoodSectionLayout) window.__minkaScheduleMoodSectionLayout();
    // the strip of the list really seen: under the header, above the dock
    // shortcut: the dock's height is a fixed guess (100 px), measure it if it ever moves
    var L = list.getBoundingClientRect(), top = L.top, bottom = Math.min(L.bottom, window.innerHeight - 100);
    if (header) { var H = header.getBoundingClientRect(); if (H.bottom > top) top = H.bottom; }
    // nothing to measure (a dialog over the calendar, the list hidden): leave the cards as they are,
    // else they shrink to the smallest size and the look editor copies a squashed card
    if (!L.width || bottom - top < 240 || list.clientWidth < 600) return;
    var vis = bottom - top, w = list.clientWidth;
    var base = top - L.top;   // the seen strip's top in the list's own box (the corridor's place does not follow its scrolling)
    var cy = base + vis / 2;
    list.style.setProperty('--cor-cy', cy.toFixed(1) + 'px');
    // The mood card keeps its own size (scaling it upsets its own layout of the pills and the
    // orbit); a card taller than the strip starts at the strip's top instead of being centred.
    var mood = list.querySelector('.rg-feedback-card');
    var moodH = mood ? mood.offsetHeight : 0, moodHalf = mood ? mood.offsetWidth / 2 : 0;
    list.style.setProperty('--cor-mcy', (moodH > vis ? base + moodH / 2 + 4 : cy).toFixed(1) + 'px');
    // The wall runs from beside the mood card to the list's edge. Its nearest (outer) card stands
    // at the screen's depth and the others go back into it, so the wall's width is exactly what it
    // takes on screen: cards as large as the usual grid's fit beside the mood card.
    // Measured as drawn (perspective P, origin at the list's centre): the far cards go back into
    // the screen and are drawn nearer the middle, the nearest card's outer edge comes forward and is
    // drawn further out. A wall of cols cards of this size fits when, on screen, its inner edge stays
    // clear of the mood card and its outer edge inside the list; startFor gives the room it can take.
    var gapIn = moodHalf + 16, edge = w / 2 - 6;
    function startFor(cols, size) {
      var span = cols * (size + GAP) - GAP;
      var zIn = (size / 2 - span) * sin, zOut = size / 2 * sin;           // depth of the inner and outer edges
      var lo = gapIn * (P - zIn) / P;                                      // nearest the mood it may start
      var hi = edge * (P - zOut) / P - span * cos;                         // furthest it may start
      return hi >= lo ? { lo: lo, hi: hi, span: span } : null;
    }
    function largest(cols) {                                               // the largest size whose wall fits across
      var lo = 0, hi = 400;
      for (var it = 0; it < 20; it++) { var mid = (lo + hi) / 2; if (startFor(cols, mid)) lo = mid; else hi = mid; }
      return lo;
    }
    // room for the wall's heading: its real height (icon included) and a gap, so neither the heading
    // nor a card lifted under the pointer covers the other
    var LABEL = [].slice.call(list.querySelectorAll('.cards-section-label')).reduce(function (m, l) { return Math.max(m, l.offsetHeight); }, 30) + 14;
    var MIN = 140, MAX = 240, MAXROWS = 3;   // MIN: about the usual grid's card; more rows than 3: the usual grid
    var fresh = [], tooSmall = false, walls = [];
    [['rg', -1], ['rd', 1]].forEach(function (side) {
      var cards = cardsOf(side[0]), s = side[1], n = cards.length;
      var label = list.querySelector('.cards-section-label-' + side[0]);
      if (!n) return;
      // The largest cards whose wall fits the strip's height; when none at the usual size does (a
      // short window), the usual size in the fewest rows — the corridor then scrolls a little.
      var rows = 0, cols = 0, size = 0, fits = [];
      for (var r = 1; r <= n; r++) {
        var c = Math.ceil(n / r), byW = largest(c), byH = (vis - LABEL - (r - 1) * GAP) / r;
        if (byW < MIN || r > MAXROWS) continue;
        if (byH >= MIN) fits.push({ r: r, c: c, size: Math.min(byW, byH, MAX) });
        else if (!fits.length && !rows) { size = Math.min(byW, MAX, Math.max(MIN, byH)); rows = r; cols = c; }
      }
      if (fits.length) {   // the largest cards that fit; between equal sizes (both at MAX), two to a row
        var best = fits.reduce(function (m, f) { return f.size > m.size + 0.5 || (Math.abs(f.size - m.size) <= 0.5 && f.c === 2 && m.c !== 2) ? f : m; });
        size = best.size; rows = best.r; cols = best.c;
      }
      if (!rows) { tooSmall = true; return; }
      var room = startFor(cols, size), span = room.span;
      var start = (room.lo + room.hi) / 2;   // a short wall is centred in the room it may take
      walls.push({ cards: cards, s: s, label: label, rows: rows, cols: cols, size: size, span: span, start: start, h: LABEL + rows * (size + GAP) - GAP });
    });
    // walls that would hold only tiny cards (a small window): the usual grid instead
    if (tooSmall) { clear(); if (window.__minkaScheduleMoodSectionLayout) window.__minkaScheduleMoodSectionLayout(); return; }
    // Both walls start at one height, their headings on one line: the taller wall is centred in the
    // strip (or starts at its top when it does not fit) and the shorter one hangs from the same top.
    var tallest = walls.reduce(function (m, wall) { return Math.max(m, wall.h); }, 0);
    var wallTop = tallest <= vis ? base + (vis - tallest) / 2 : base + 4;
    // the corridor's end lies a dock's height (and the lift of a card under the pointer) below the
    // lowest card, so the last row scrolls fully above the dock instead of staying cut under it
    var end = Math.max(wallTop + tallest, moodH > vis ? base + moodH + 8 : 0) + (L.bottom - bottom) + 24;
    list.style.setProperty('--cor-end', end.toFixed(0) + 'px');
    walls.forEach(function (wall) {
      var cards = wall.cards, s = wall.s, label = wall.label, rows = wall.rows, cols = wall.cols, size = wall.size, span = wall.span, start = wall.start;
      cards.forEach(function (card, i) {
        // a new day's cards stand in place at once: switching days has no motion
        if (!card.style.getPropertyValue('--cs')) { card.classList.add('mk-cor-fresh'); fresh.push(card); }
        var row = Math.floor(i / cols), col = i % cols;   // column 0 stands next to the mood card
        var along = col * (size + GAP) + size / 2;
        card.style.setProperty('--cs', size.toFixed(1) + 'px');
        card.style.setProperty('--cx', (s * (start + along * cos)).toFixed(1) + 'px');
        card.style.setProperty('--cyo', (wallTop + LABEL + row * (size + GAP) + size / 2 - cy).toFixed(1) + 'px');
        card.style.setProperty('--cz', ((along - span + size / 2) * sin).toFixed(1) + 'px');
        card.style.setProperty('--cry', (-s * ANGLE) + 'deg');
        // pointed at it comes forward and grows: it also moves that much toward the middle, so its
        // outer edge never passes the list's edge (which clips it)
        card.style.setProperty('--cin', (-s * size * 0.18).toFixed(1) + 'px');
        card.style.setProperty('z-index', String(10 + col), 'important');
      });
      if (label) {
        label.style.setProperty('--lx', (s * (start + span / 2 * cos)).toFixed(1) + 'px');
        label.style.setProperty('--ly', wallTop.toFixed(1) + 'px');
      }
    });
    if (fresh.length) requestAnimationFrame(function () { requestAnimationFrame(function () {
      fresh.forEach(function (card) { card.classList.remove('mk-cor-fresh'); });
    }); });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(place); }

  // The card under the pointer, found from where the cards stand at rest: with :hover the card
  // that turns and comes forward slid out from under the pointer and back, shaking.
  var rests = null, hot = null;
  function setHot(card) {
    if (card === hot) return;
    if (hot) hot.classList.remove('mk-cor-hot');
    hot = card;
    if (hot) hot.classList.add('mk-cor-hot');
  }
  list.addEventListener('pointermove', function (e) {
    if (!root.classList.contains('mk-corridor')) return;
    // still on the lifted card itself (its coffee buttons stick out past its resting place): it stays
    if (hot && hot.contains(e.target)) return;
    if (!rests) rests = [].slice.call(list.querySelectorAll('.card.mk-mid-card:not(.rg-feedback-card)')).map(function (c) {
      return [c, c === hot ? c.__corRest || c.getBoundingClientRect() : (c.__corRest = c.getBoundingClientRect())];
    });
    var found = null;
    for (var i = rests.length - 1; i >= 0 && !found; i--) {   // the later (inner) card is drawn on top
      var r = rests[i][1];
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) found = rests[i][0];
    }
    setHot(found);
  }, { passive: true });
  list.addEventListener('pointerleave', function () { setHot(null); });
  // scrolling moves the cards under a still pointer: their resting places are read again
  list.addEventListener('scroll', function () { rests = null; setHot(null); }, { passive: true });
  // the roster is rebuilt on a day switch: placed before that frame is painted (no flying in);
  // the root's class only matters when the radio opens or closes
  new MutationObserver(function () { if (frame) { cancelAnimationFrame(frame); frame = 0; } place(); }).observe(list, { childList: true });
  var radio = root.classList.contains('host-radio-open');
  new MutationObserver(function () {
    var now = root.classList.contains('host-radio-open');
    if (now !== radio) { radio = now; schedule(); }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', schedule);
  schedule();
})();
