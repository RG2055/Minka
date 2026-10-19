/* Corridor (trial, desktop; css/page/corridor.css). The mood card stands in the middle, close and
   full size; the radiographers line the left wall and the radiologists the right one, as in the
   header, gently turned toward it (22°), the far end going back. Each card gets one transform
   (compositor only), as in radio-coverflow.js. Pointing at a card turns it to face you and
   springs it forward. Not while the radio's Cover Flow is open.
   On with ?skats=koridors (remembered), off with ?skats=0. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (root.classList.contains('mk-mobile-shell')) return;
  var list = document.getElementById('grafiks-list');
  if (!list) return;
  var q = '';
  try { q = window.top.location.search + location.search; } catch (_e) { q = location.search; }
  try {
    if (/[?&]skats=koridors\b/.test(q)) localStorage.setItem('mkCorridor', '1');
    if (/[?&]skats=0\b/.test(q)) localStorage.removeItem('mkCorridor');
    if (localStorage.getItem('mkCorridor') !== '1') return;
  } catch (_e) { return; }

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
    var inner = moodHalf + 18, edge = w / 2 - 10, room = (edge - inner) / cos;
    var LABEL = 30, MIN = 150, MAX = 260;   // MIN: the usual grid's card; the wall's small heading above it
    var fresh = [], tooSmall = false, walls = [];
    [['rg', -1], ['rd', 1]].forEach(function (side) {
      var cards = cardsOf(side[0]), s = side[1], n = cards.length;
      var label = list.querySelector('.cards-section-label-' + side[0]);
      if (!n) return;
      // The largest cards whose wall fits the strip's height; when none at the usual size does (a
      // short window), the usual size in the fewest rows — the corridor then scrolls a little.
      var rows = 0, cols = 0, size = 0, fullFit = false;
      for (var r = 1; r <= n; r++) {
        var c = Math.ceil(n / r), byW = (room - (c - 1) * GAP) / c, byH = (vis - LABEL - (r - 1) * GAP) / r;
        if (byW < MIN) continue;
        if (byH >= MIN) {
          var sz = Math.min(byW, byH, MAX);
          if (!fullFit || sz > size) { size = sz; rows = r; cols = c; fullFit = true; }
        } else if (!fullFit && !rows) { size = Math.min(byW, MAX, Math.max(MIN, byH)); rows = r; cols = c; }
      }
      if (!rows) { tooSmall = true; return; }
      var span = cols * (size + GAP) - GAP;
      var start = inner + Math.max(0, (edge - inner) - span * cos) / 2;   // a short wall is centred in its room
      walls.push({ cards: cards, s: s, label: label, rows: rows, cols: cols, size: size, span: span, start: start, h: LABEL + rows * (size + GAP) - GAP });
    });
    // walls that would hold only tiny cards (a small window): the usual grid instead
    if (tooSmall) { clear(); if (window.__minkaScheduleMoodSectionLayout) window.__minkaScheduleMoodSectionLayout(); return; }
    // Both walls start at one height, their headings on one line: the taller wall is centred in the
    // strip (or starts at its top when it does not fit) and the shorter one hangs from the same top.
    var tallest = walls.reduce(function (m, wall) { return Math.max(m, wall.h); }, 0);
    var wallTop = tallest <= vis ? base + (vis - tallest) / 2 : base + 4;
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
