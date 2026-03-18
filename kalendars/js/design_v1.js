/* ═══════════════════════════════════════════════════════════════════
   MINKA DESIGN v1 — JavaScript runtime
   1. Ambient 24h hue cycle   (runs every 60s, single setInterval)
   2. Card-live / duty-live classes for currently-on-shift workers
   3. Hospital building loader animation
   ═══════════════════════════════════════════════════════════════════ */
(function MinkaDesignV1() {
  'use strict';

  /* ──────────────────────────────────────────────────────────────
     1. AMBIENT 24H HUE SHIFT
     Maps 00:00 → +0°  06:00 → +8° (dawn warmth)  14:00 → -10° (noon cool)
     22:00 → -18° (deep blue night)
     Total swing ≈ 28° across the day — barely perceptible, atmospheric
  ──────────────────────────────────────────────────────────────── */
  function computeAmbientHue() {
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60; // 0..24
    // Sine wave: peaks at 6 am (+12°), troughs at 18:00 (-15°)
    const hue = Math.round(12 * Math.sin((h - 6) * Math.PI / 12) - 5);
    return hue + 'deg';
  }

  function applyAmbientHue() {
    document.documentElement.style.setProperty('--ambient-hue', computeAmbientHue());
  }

  applyAmbientHue();
  setInterval(applyAmbientHue, 60_000); // update once per minute, CSS transition smooths it


  /* ──────────────────────────────────────────────────────────────
     2. LIVE PULSE CLASSES
     Marks cards and duty blocks of workers whose shift is active now.
     Runs on load + every 60s (no need for per-second precision here).
  ──────────────────────────────────────────────────────────────── */
  function applyLiveClasses() {
    const now = new Date();

    // Helper: parse HH:MM into today's Date
    function todayAt(timeStr) {
      if (!timeStr) return null;
      const [hh, mm] = String(timeStr).split(':').map(Number);
      const d = new Date(now);
      d.setHours(hh, mm, 0, 0);
      return d;
    }

    // ── Main grid cards ──
    document.querySelectorAll('.card[data-worker]').forEach(card => {
      // Skip if already marked done
      if (card.classList.contains('duty-done')) {
        card.classList.remove('card-live');
        return;
      }
      // Try to get start/end from a sibling duty-block (same worker)
      const worker = card.getAttribute('data-worker');
      // Look for matching duty-block with data-start / data-end
      const dutyBlock = document.querySelector(`.duty-block[data-worker="${CSS.escape(worker)}"]`);
      const timer = dutyBlock && dutyBlock.querySelector('.duty-timer');
      if (timer) {
        const start = todayAt(timer.getAttribute('data-start'));
        const end   = todayAt(timer.getAttribute('data-end'));
        if (start && end) {
          // Handle overnight shifts
          if (end < start) end.setDate(end.getDate() + 1);
          const isLive = now >= start && now < end;
          card.classList.toggle('card-live', isLive);
          return;
        }
      }
      // Fallback: if duty block has no done class, treat as live if today's date
      // (conservatively: don't pulse unless we're sure)
      card.classList.remove('card-live');
    });

    // ── Side panel duty blocks ──
    document.querySelectorAll('.duty-block[data-worker]').forEach(block => {
      if (block.classList.contains('duty-done')) {
        block.classList.remove('duty-live');
        return;
      }
      const timer = block.querySelector('.duty-timer');
      if (!timer) { block.classList.remove('duty-live'); return; }

      const start = todayAt(timer.getAttribute('data-start'));
      const end   = todayAt(timer.getAttribute('data-end'));
      if (start && end) {
        if (end < start) end.setDate(end.getDate() + 1);
        const isLive = now >= start && now < end;
        block.classList.toggle('duty-live', isLive);
      }
    });
  }

  // Run once DOM is ready, then every 60s
  function scheduleLive() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(applyLiveClasses, 800); // after calendar renders
        setInterval(applyLiveClasses, 60_000);
      });
    } else {
      setTimeout(applyLiveClasses, 800);
      setInterval(applyLiveClasses, 60_000);
    }
  }
  scheduleLive();

  // Also re-run whenever the calendar re-renders (grafiks-list changes)
  if (window.MutationObserver) {
    let liveDebounce = null;
    const observer = new MutationObserver(() => {
      clearTimeout(liveDebounce);
      liveDebounce = setTimeout(applyLiveClasses, 400);
    });
    function attachObserver() {
      const list = document.getElementById('grafiks-list');
      if (list) {
        observer.observe(list, { childList: true, subtree: false });
      } else {
        setTimeout(attachObserver, 500);
      }
    }
    attachObserver();
  }


  /* ──────────────────────────────────────────────────────────────
     3. MAIN LOADER WINDOW ANIMATION
     HTML already has the building structure — just animate the windows
  ──────────────────────────────────────────────────────────────── */
  function animateMainLoader() {
    const loader = document.getElementById('grafiks-loader');
    if (!loader) return;
    const COLORS = ['lit-warm', 'lit-cool', 'lit-purple'];
    const wins = Array.from(loader.querySelectorAll('.mlb-win'));
    let timer = null;

    function lightNext(idx) {
      if (loader.style.display === 'none' || loader.hidden) return;
      if (idx < wins.length) {
        wins[idx].classList.add(COLORS[Math.floor(Math.random() * COLORS.length)]);
        timer = setTimeout(() => lightNext(idx + 1), 90 + Math.random() * 60);
      } else {
        timer = setTimeout(() => {
          wins.forEach(w => w.className = 'mlb-win');
          timer = setTimeout(() => lightNext(0), 350);
        }, 900);
      }
    }

    timer = setTimeout(() => lightNext(0), 200);

    const obs = new MutationObserver(() => {
      if (loader.style.display === 'none' || loader.hidden) {
        clearTimeout(timer);
        obs.disconnect();
      }
    });
    obs.observe(loader, { attributes: true, attributeFilter: ['style', 'hidden'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateMainLoader);
  } else {
    animateMainLoader();
  }

  /* ──────────────────────────────────────────────────────────────
     4. RESIDENTS MODAL BUILDING LOADER ANIMATION
     Animates the rfl-win windows whenever the loading screen is visible
  ──────────────────────────────────────────────────────────────── */
  function initResidentsLoader() {
    const loading = document.getElementById('residents-frame-loading');
    if (!loading) { return; }

    const COLORS = ['lit-warm', 'lit-cool', 'lit-purple'];
    let timer = null;

    function runWindowSequence() {
      const wins = Array.from(loading.querySelectorAll('.rfl-win'));
      // reset all
      wins.forEach(w => w.className = 'rfl-win');
      let idx = 0;

      function lightNext() {
        if (!loading.classList.contains('is-visible')) return; // stop if hidden
        if (idx < wins.length) {
          wins[idx].classList.add(COLORS[Math.floor(Math.random() * COLORS.length)]);
          idx++;
          timer = setTimeout(lightNext, 80 + Math.random() * 55);
        } else {
          // all lit — pause then restart
          timer = setTimeout(() => {
            wins.forEach(w => w.className = 'rfl-win');
            idx = 0;
            timer = setTimeout(lightNext, 300);
          }, 800);
        }
      }
      lightNext();
    }

    // Watch for is-visible class toggle
    const obs = new MutationObserver(() => {
      if (loading.classList.contains('is-visible')) {
        clearTimeout(timer);
        runWindowSequence();
      } else {
        clearTimeout(timer);
        loading.querySelectorAll('.rfl-win').forEach(w => w.className = 'rfl-win');
      }
    });
    obs.observe(loading, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResidentsLoader);
  } else {
    initResidentsLoader();
  }

})();
