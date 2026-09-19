/* Event-driven ambience. No audio sampling, canvas, polling or animation loop. */
(function () {
  'use strict';
  const root = document.documentElement;
  const radio = document.getElementById('radioWindow');
  const frame = document.getElementById('calIframe');
  const overlay = document.getElementById('nsOverlay');
  const embedded = !radio && window.parent !== window;
  const origin = window.location.origin;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nav = window.navigator;
  // The drifting fog is a full-screen layer re-composited every frame for
  // as long as the radio is open. The work machines run the low-spec
  // profile (8 GB, an integrated GPU): they get the fog, but standing still.
  // Host only: the calendar copy of this module always runs low-spec, and
  // its night-scene walkers are not the fog.
  const modestDevice = (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4) ||
    (nav.deviceMemory > 0 && nav.deviceMemory <= 4) || !!nav.connection?.saveData ||
    (!!radio && (!!(window.__mkPerfProfile && window.__mkPerfProfile.lowSpec) || root.classList.contains('mk-low-spec')));
  let hostVisible = true, expanded = false, color = '83,201,232', lastMessage = '';
  const dreams = new Set();
  function updateDream(el) {
    if (!el.isConnected) { dreamObserver?.unobserve(el); dreams.delete(el); return; }
    const visible = !document.hidden && hostVisible && !expanded &&
      !!overlay?.classList.contains('open') && el.__dreamInView === true;
    el.classList.toggle('is-in-view', visible);
    if (!visible) return;
    const film = el.querySelector('.ns-dream-film');
    if (!film || film.hasAttribute('src')) return;
    film.onload = () => {
      if (!film.isConnected || !film.naturalWidth) return;
      const frames = Math.round(film.naturalHeight / film.naturalWidth);
      if (frames < 1) return;
      film.parentNode.style.setProperty('--dream-frames', frames);
      film.parentNode.style.setProperty('--dream-duration', (frames / 12) + 's');
      film.parentNode.classList.add('is-ready');
    };
    film.src = film.getAttribute('data-src');
  }
  const dreamObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    entries.forEach(entry => { entry.target.__dreamInView = entry.isIntersecting; updateDream(entry.target); });
  }, {threshold:0.1}) : null;
  window.__nsObserveDream = el => {
    if (!dreams.has(el)) {
      dreams.forEach(old => { if (!old.isConnected) { dreamObserver?.unobserve(old); dreams.delete(old); } });
      dreams.add(el);
      if (dreamObserver) dreamObserver.observe(el);
      else el.__dreamInView = true;
    }
    updateDream(el);
  };

  // One continuous background belongs to the host PWA. The calendar becomes
  // transparent instead of painting a second, visibly cropped copy of it.
  if (radio) {
    const glow = document.createElement('div');
    glow.className = 'minka-ambient-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
  }
  root.classList.toggle('minka-ambient-calendar', !radio);

  function sync(force) {
    if (radio) {
      // While the dock-button reveal runs (body.radio-anim) the previous state
      // stands for everyone but the reveal itself: it calls sync(true) in the
      // same task as the calendar's reflow, so the glow fade and the
      // calendar's transparency swap share that one style/layout pass.
      if (force === true || !document.body.classList.contains('radio-anim')) {
        expanded = !document.body.classList.contains('radio-hidden') &&
          !document.body.classList.contains('radio-idle') &&
          !document.body.classList.contains('lacitis-full') && radio.style.display !== 'none';
      }
      const palette = radio.style.getPropertyValue('--radio-ambient-rgb').trim();
      if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(palette)) color = palette;
    }
    const visible = !document.hidden && hostVisible && !document.body.classList.contains('lacitis-full');
    const active = visible && expanded;
    // Inherited custom property on :root = a style pass over every element.
    // The calendar reads the colour only in its two duty panels, so write it
    // there; the host keeps :root (its own document is small). Skip no-op writes.
    const colourHosts = embedded && typeof document.querySelectorAll === 'function'
      ? Array.from(document.querySelectorAll('#radiographers-duty, #radiologists-duty')) : [];
    for (const el of (colourHosts.length ? colourHosts : [root])) {
      if (el.style.getPropertyValue('--radio-ambient-rgb') !== color) el.style.setProperty('--radio-ambient-rgb', color);
    }
    root.classList.toggle('minka-ambient-active', active);
    root.classList.toggle('minka-ambient-moving', active && Number(radio?.style.getPropertyValue('--radio-glow-strength') || .45) > 0 && !motion.matches && !modestDevice);
    root.classList.toggle('minka-visuals-hidden', !visible);
    // The night scene and the expanded radio never animate at the same time.
    const nightActive = visible && !expanded && !!overlay?.classList.contains('open');
    root.classList.toggle('ns-motion-active', nightActive && !motion.matches && !modestDevice);
    dreams.forEach(updateDream);
    if (typeof window.__nsSyncWalkerMotion === 'function') window.__nsSyncWalkerMotion(nightActive);
    if (radio && frame?.contentWindow) {
      const state = JSON.stringify([expanded, visible, color]);
      if (state !== lastMessage) {
        lastMessage = state;
        const data = {type:'minka-radio-ambient', expanded, visible, color};
        // Same task as the caller (the host's layout pass), not a later message
        // task: the calendar's ambient and radio-open flips then share one recalc.
        let handed = false;
        try { const w = frame.contentWindow; if (typeof w.__minkaAmbientApply === 'function') { w.__minkaAmbientApply(data); handed = true; } } catch (_e) {}
        if (!handed) frame.contentWindow.postMessage(data, origin);
      }
    }
  }
  function applyFromHost(data) {
    if (!data || typeof data.expanded !== 'boolean' || typeof data.visible !== 'boolean' ||
        typeof data.color !== 'string' || !/^\d{1,3},\d{1,3},\d{1,3}$/.test(data.color)) return;
    expanded = data.expanded; hostVisible = data.visible; color = data.color;
    sync();
  }
  if (embedded) window.__minkaAmbientApply = applyFromHost;
  if (radio) window.__mkAmbienceSync = function () { sync(true); };
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  motion.addEventListener('change', sync);
  if (radio) {
    new MutationObserver(sync).observe(document.body, {attributes:true, attributeFilter:['class']});
    new MutationObserver(sync).observe(radio, {attributes:true, attributeFilter:['style']});
    frame?.addEventListener('load', () => { lastMessage = ''; sync(); });
  }
  if (overlay) new MutationObserver(sync).observe(overlay, {attributes:true, attributeFilter:['class']});
  window.addEventListener('message', event => {
    if (event.origin !== origin || !event.data) return;
    if (radio && event.source === frame?.contentWindow && event.data.type === 'minka-ambient-ready') {
      lastMessage = ''; sync();
    } else if (embedded && event.source === window.parent && event.data.type === 'minka-radio-ambient') {
      applyFromHost(event.data);
    }
  });
  sync();
  overlay?.querySelectorAll('.ns-bed-dream').forEach(window.__nsObserveDream);
  if (embedded) window.parent.postMessage({type:'minka-ambient-ready'}, origin);
})();
