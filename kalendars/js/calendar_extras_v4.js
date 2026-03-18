/* ================================================================
   CALENDAR EXTRAS v4 JS  – clean rewrite
   1. Worker expiry fade + warning colours
   2. Full-list modal fix (never auto-close on open)
   3. Cards auto-resize to fill available space
   ================================================================ */
(function CalendarExtrasV4() {
  'use strict';

  /* ── 1. WORKER TIMER WARNING + FADE ── */
  function enhanceTimers() {
    document.querySelectorAll('.duty-timer').forEach(timer => {
      const val = timer.querySelector('.val');
      if (!val) return;
      const parts = val.textContent.trim().split(':').map(Number);
      if (parts.length !== 3 || isNaN(parts[0])) return;
      const s = parts[0]*3600 + parts[1]*60 + parts[2];
      if (s <= 0) {
        const block = timer.closest('.duty-block');
        if (block && !block.__fading) {
          block.__fading = true;
          block.classList.add('fading-out');
          setTimeout(() => {
            block.style.transition = 'max-height .5s ease, margin .5s ease, padding .5s ease';
            block.style.maxHeight = block.offsetHeight + 'px';
            block.style.overflow = 'hidden';
            requestAnimationFrame(() => {
              block.style.maxHeight = '0';
              block.style.marginBottom = '0';
              block.style.padding = '0';
              setTimeout(() => block.remove(), 520);
            });
          }, 420);
        }
      } else if (s <= 300) {
        timer.classList.add('warning-critical'); timer.classList.remove('warning-low');
      } else if (s <= 900) {
        timer.classList.add('warning-low'); timer.classList.remove('warning-critical');
      } else {
        timer.classList.remove('warning-low','warning-critical');
      }
    });
  }
  setInterval(enhanceTimers, 1000);

  /* ── 2. FULL-LIST MODAL: guaranteed open on click ── */
  function fixFullListModal() {
    const btn   = document.querySelector('.full-list-btn');
    const modal = document.getElementById('full-list-modal');
    if (!btn || !modal) { setTimeout(fixFullListModal, 300); return; }
    if (btn.__v4fixed) return;
    btn.__v4fixed = true;

    // Remove the inline onclick so we own the click
    btn.onclick = null; // clear inline handler
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (modal.classList.contains('open')) {
        if (typeof closeFullListModal === 'function') closeFullListModal();
      } else {
        if (typeof openFullListModal === 'function') openFullListModal(e);
      }
    });

    // Escape closes it
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open'))
        if (typeof closeFullListModal === 'function') closeFullListModal();
    });
  }

  /* ── 3. CARDS AUTO-RESIZE (square, fill grid neatly) ── */
  function autoSizeCards() {
    const container = document.getElementById('grafiks-list');
    if (!container || !container.classList.contains('grid-view')) return;

    const grids = Array.from(container.querySelectorAll('.cards-subgrid'));
    if (!grids.length) return;

    grids.forEach(grid => {
      const cards = Array.from(grid.querySelectorAll('.card'));
      if (!cards.length) return;

      const count = cards.length;
      const containerW = Math.max(0, grid.clientWidth || container.clientWidth || 0);
      const containerH = Math.max(0, grid.clientHeight || container.clientHeight || 0);
      const gap = 9;
      if (!containerW) return;

      let cols = Math.max(1, Math.min(count, Math.floor((containerW + gap) / 145)));
      if (containerH > 0 && count > cols) {
        const maxRows = Math.max(1, Math.floor(containerH / 136));
        cols = Math.max(cols, Math.ceil(count / maxRows));
      }

      const cardW = (containerW - gap * Math.max(0, cols - 1)) / cols;
      const cardH = Math.max(136, Math.min(182, Math.round(cardW * 0.82)));
      const shiftFontSize = Math.max(24, Math.min(56, Math.round(cardH * 0.34)));

      grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      cards.forEach(card => {
        card.style.aspectRatio = '1 / 0.82';
        card.style.minHeight = cardH + 'px';
        const shiftEl = card.querySelector('.card-shift');
        if (shiftEl) shiftEl.style.fontSize = shiftFontSize + 'px';
      });
    });
  }

  // Observe grafiks-list for changes and run auto-size
  function startCardObserver() {
    const container = document.getElementById('grafiks-list');
    if (!container) { setTimeout(startCardObserver, 400); return; }

    const ro = new ResizeObserver(() => autoSizeCards());
    ro.observe(container);

    const mo = new MutationObserver(() => {
      requestAnimationFrame(autoSizeCards);
      requestAnimationFrame(applyStaffAccents);
    });
    mo.observe(container, { childList: true, subtree: false });

    autoSizeCards();
  }



  /* ── 4. STAFF COLOUR ACCENTS + ACTIVE GLOW (flat, low-lag) ── */
  function staffPalette(role) {
    if (role === 'rd') {
      // Radiologists use rad-accent
      const radAccent = getComputedStyle(document.documentElement).getPropertyValue('--rad-accent').trim();
      return radAccent || '#ff7c6e';
    } else {
      // Radiographers use accent color from theme
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      return accent || '#b77bff';
    }
  }

  function applyStaffAccents() {
    const activeNames = new Set();

    document.querySelectorAll('.duty-block').forEach((block) => {
      const name = block.getAttribute('data-worker') || '';
      const isRdBlock = !!block.closest('#radiologists-duty');
      const accent = staffPalette(isRdBlock ? 'rd' : 'rg');
      block.style.setProperty('--staff-accent', accent);
      block.classList.remove('is-active-duty', 'is-up-next-duty');
      const timer = block.querySelector('.duty-timer');
      const done  = block.classList.contains('duty-done');
      if (timer && !done) {
        block.classList.add('is-active-duty');
        activeNames.add(name);
      }
    });

    // mark first non-done card in each duty column as UP NEXT only if there is no active timer
    ['radiographers-duty','radiologists-duty'].forEach((id) => {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      const hasActive = !!wrap.querySelector('.duty-block.is-active-duty');
      if (hasActive) return;
      const firstReady = Array.from(wrap.querySelectorAll('.duty-block:not(.duty-done)'))[0];
      if (firstReady) firstReady.classList.add('is-up-next-duty');
    });

    document.querySelectorAll('.card').forEach((card) => {
      const name = card.getAttribute('data-worker') || '';
      const accent = staffPalette(card.classList.contains('card-rd') ? 'rd' : 'rg');
      card.style.setProperty('--staff-accent', accent);
      card.classList.toggle('is-active-duty', activeNames.has(name));
    });
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      fixFullListModal();
      startCardObserver();
      // Delay initial apply so theme.js has time to set CSS vars first
      setTimeout(applyStaffAccents, 50);
      setInterval(applyStaffAccents, 3000);
      // Re-apply immediately when theme changes
      new MutationObserver(applyStaffAccents).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    });
  } else {
    fixFullListModal();
    startCardObserver();
    setTimeout(applyStaffAccents, 50);
    setInterval(applyStaffAccents, 3000);
    new MutationObserver(applyStaffAccents).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
})();
