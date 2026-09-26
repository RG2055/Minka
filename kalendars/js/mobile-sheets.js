/* Phone: every sheet closes the way phone sheets do.
   - Drag it down by its top edge: it follows the finger, closes past a
     threshold (or a quick flick) and springs back otherwise.
   - The system back (Android button, iOS edge swipe): the shell keeps one
     history entry per open sheet (mobile.html) and asks us to close the top
     one ({type:'mk-sheet-close', name}).
   The sheets are not changed: this watches their own open state and calls
   their own close functions. Loaded only in the phone shell. */
(function () {
  'use strict';
  if (!document.documentElement.classList.contains('mk-mobile-shell')) return;

  var SHEETS = [
    { name: 'night', host: '#nsOverlay', panel: '#nsPanel',
      isOpen: function (h) { return h.classList.contains('open'); },
      close: function () { if (typeof window.toggleNsOverlay === 'function') window.toggleNsOverlay(); } },
    { name: 'stats', host: '#stats-modal', panel: '.mk-stats-sheet',
      isOpen: function (h) { return h.dataset.state === 'open'; },
      close: function () { if (typeof window.closeStatsModal === 'function') window.closeStatsModal(); } },
    { name: 'worker', host: '#worker-modal', panel: '#worker-modal',
      isOpen: function (h) { return h.classList.contains('open'); },
      close: function () { if (typeof window.closeWorkerModal === 'function') window.closeWorkerModal(); } },
    { name: 'comments', host: '#rgFeedbackModal', panel: '.rg-feedback-dialog',
      isOpen: function (h) { return !h.hidden; },
      close: function (h) { var b = h.querySelector('[data-rg-close]'); if (b) b.click(); } },
    { name: 'settings', host: '#tk-panel', panel: '#tk-panel',
      isOpen: function (h) { return h.classList.contains('visible'); },
      close: function () { if (window.__themeEngine && window.__themeEngine.hidePanel) window.__themeEngine.hidePanel(); } }
  ];
  var DRAG_ZONE = 64;          // px from the sheet's top edge that start a drag
  var CLOSE_AT = 110;          // px of travel, or
  var FLICK = 0.8;             // px/ms downwards, that close on release

  function post(msg) {
    try { if (window.parent !== window) window.parent.postMessage(msg, location.origin); } catch (_e) {}
  }

  /* ── open state → shell history ─────────────────────────────────────── */
  var watched = {};
  function watch(sheet) {
    var host = document.querySelector(sheet.host);
    if (!host || watched[sheet.name] === host) return;
    watched[sheet.name] = host;
    var was = sheet.isOpen(host);
    if (was) post({ type: 'mk-sheet', name: sheet.name, open: true });
    new MutationObserver(function () {
      var now = sheet.isOpen(host);
      if (now === was) return;
      was = now;
      post({ type: 'mk-sheet', name: sheet.name, open: now });
      if (!now) resetDrag(sheet);
    }).observe(host, { attributes: true, attributeFilter: ['class', 'hidden', 'data-state'] });
    wireDrag(sheet, host);
  }
  function watchAll() { SHEETS.forEach(watch); }
  // Comments and settings are built on first use: pick them up when they appear.
  new MutationObserver(watchAll).observe(document.body, { childList: true });
  watchAll();

  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'mk-sheet-close') return;
    var sheet = SHEETS.filter(function (s) { return s.name === e.data.name; })[0];
    var host = sheet && document.querySelector(sheet.host);
    if (host && sheet.isOpen(host)) sheet.close(host);
  });

  /* ── drag down to close ─────────────────────────────────────────────── */
  function panelOf(sheet, host) {
    return sheet.panel === sheet.host ? host : host.querySelector(sheet.panel) || document.querySelector(sheet.panel);
  }
  function resetDrag(sheet) {
    var host = watched[sheet.name], panel = host && panelOf(sheet, host);
    if (!panel || !panel.dataset.mkDragged) return;
    // The sheet's own close animation has played by now: drop our offset.
    setTimeout(function () {
      panel.style.removeProperty('transform');
      panel.style.removeProperty('transition');
      delete panel.dataset.mkDragged;
    }, 700);
  }
  function wireDrag(sheet, host) {
    var panel = panelOf(sheet, host);
    if (!panel || panel.dataset.mkDragWired) return;
    panel.dataset.mkDragWired = '1';
    var drag = null, suppressClick = 0;
    panel.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !sheet.isOpen(host)) return;
      var r = panel.getBoundingClientRect();
      if (e.clientY - r.top > DRAG_ZONE) return;
      if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      var base = getComputedStyle(panel).transform;
      drag = { id: e.pointerId, y0: e.clientY, x0: e.clientX, t0: e.timeStamp, dy: 0, on: false,
               base: base && base !== 'none' ? base + ' ' : '', h: r.height };
    }, { passive: true });
    panel.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = e.clientY - drag.y0, dx = e.clientX - drag.x0;
      if (!drag.on) {
        // A tap on a button in the header stays a tap; only a clear pull down drags.
        if (dy < 8 || Math.abs(dx) > dy) { if (Math.abs(dx) > 12 || dy < -8) drag = null; return; }
        drag.on = true;
        try { panel.setPointerCapture(e.pointerId); } catch (_e) {}
        panel.style.transition = 'none';
      }
      drag.dy = Math.max(0, dy);
      drag.v = drag.dy / Math.max(1, e.timeStamp - drag.t0);
      panel.style.transform = drag.base + 'translateY(' + drag.dy + 'px)';
    }, { passive: true });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      if (!d.on) return;
      suppressClick = Date.now() + 350;
      var closeIt = d.dy > Math.min(CLOSE_AT, d.h * .3) || (d.v > FLICK && d.dy > 30);
      if (closeIt) {
        // Keep the dragged offset while the sheet's own close animation runs.
        panel.dataset.mkDragged = '1';
        sheet.close(host);
        return;
      }
      panel.style.transition = 'transform var(--mk-dur-spring-default, 560ms) var(--mk-ease-spring, ease)';
      panel.style.transform = d.base ? d.base.trim() : '';
      setTimeout(function () { if (!drag) { panel.style.removeProperty('transition'); panel.style.removeProperty('transform'); } }, 600);
    }
    panel.addEventListener('pointerup', end);
    panel.addEventListener('pointercancel', end);
    // Clicks right after a drag must not hit the button the finger started on.
    panel.addEventListener('click', function (e) {
      if (panel.dataset.mkDragged || Date.now() < suppressClick) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  }
})();
