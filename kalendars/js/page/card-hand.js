/* Cards in hand (trial, desktop only; css/page/card-hand.css): each profession is one fanned
   row of large cards, overlapping like a hand of playing cards when they don't fit side by
   side; the card under the pointer rises to the front. The mood card stands on the right.
   On with ?hand=1 (remembered), off with ?hand=0. Not while the radio's Cover Flow is open. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (root.classList.contains('mk-mobile-shell')) return;
  var list = document.getElementById('grafiks-list');
  if (!list) return;
  var q = '';
  try { q = window.top.location.search + location.search; } catch (_e) { q = location.search; }
  try {
    if (/[?&]hand=1\b/.test(q)) localStorage.setItem('mkHand', '1');
    if (/[?&]hand=0\b/.test(q)) localStorage.removeItem('mkHand');
    if (localStorage.getItem('mkHand') !== '1') return;
  } catch (_e) { return; }

  var frame = 0;
  function active() { return !root.classList.contains('host-radio-open') && list.classList.contains('grid-view'); }
  function clear() {
    root.classList.remove('mk-hand');
    list.querySelectorAll('.cards-subgrid > .card').forEach(function (c) {
      ['--hand-ml', '--hand-r', '--hand-y', '--hand-z'].forEach(function (p) { c.style.removeProperty(p); });
    });
  }
  // shortcut: the dock's height is a fixed guess (100 px), measure it if it ever moves
  function place() {
    frame = 0;
    var was = root.classList.contains('mk-hand');
    if (!active()) { clear(); if (was && window.__minkaScheduleMoodSectionLayout) window.__minkaScheduleMoodSectionLayout(); return; }
    root.classList.add('mk-hand');
    // the mood section solver steps aside in hand mode (mood-feedback.js): let it clear its rows
    if (!was && window.__minkaScheduleMoodSectionLayout) window.__minkaScheduleMoodSectionLayout();
    var first = list.querySelector('.cards-section-label');
    var grids = [].slice.call(list.querySelectorAll('.cards-subgrid'));
    if (!first || !grids.length) return;
    var top = first.getBoundingClientRect().top, bottom = window.innerHeight - 100;
    var label = first.getBoundingClientRect().height + 10;
    // two rows (one per profession) fill the height between the headings and the dock
    var w = Math.round(Math.max(150, Math.min(240, (bottom - top - grids.length * label - 28) / grids.length)));
    var moodW = Math.round(Math.max(300, Math.min(360, list.clientWidth * 0.3)));
    list.style.setProperty('--hand-w', w + 'px');
    list.style.setProperty('--hand-mood-w', moodW + 'px');
    grids.forEach(function (grid) {
      var cards = [].slice.call(grid.querySelectorAll(':scope > .card.mk-mid-card:not(.rg-feedback-card)'));
      var n = cards.length, room = grid.clientWidth - moodW - 44, gap = 12;
      var step = n > 1 && n * w + (n - 1) * gap > room ? Math.max(28, (room - w) / (n - 1)) : w + gap;
      var fanned = step < w;
      cards.forEach(function (card, i) {
        var off = i - (n - 1) / 2;
        card.style.setProperty('--hand-ml', i ? (step - w).toFixed(1) + 'px' : '0px');
        card.style.setProperty('--hand-r', fanned ? (off * 1.4).toFixed(2) + 'deg' : '0deg');
        card.style.setProperty('--hand-y', fanned ? (off * off * 1.1).toFixed(1) + 'px' : '0px');
        card.style.setProperty('--hand-z', String(i + 1));
      });
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(place); }
  window.__mkHandPlace = schedule;
  // the roster is rebuilt as new sections (day switch, refresh); the root's class only
  // matters when the radio opens or closes (it changes for many other reasons)
  new MutationObserver(schedule).observe(list, { childList: true });
  var radio = root.classList.contains('host-radio-open');
  new MutationObserver(function () {
    var now = root.classList.contains('host-radio-open');
    if (now !== radio) { radio = now; schedule(); }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', schedule);
  schedule();
})();
