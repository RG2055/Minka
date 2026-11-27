/* The maximized radio's one skeleton (index.html #rmx). It holds no player logic of its own: every key presses the
   radio engine's own control (js/radio.js: #playBtn, playPrev/playNext, rgListening, toggleMenu, the EQ buttons,
   #themeBtn, the profile button), and it follows the engine by events and observers only. The skin
   (#radioWindow[data-radio-skin]) picks how the spectrum is drawn; everything else about a skin is CSS. */
(function () {
  const rw = document.getElementById('radioWindow');
  const mx = document.getElementById('rmx');
  if (!rw || !mx) return;
  const $ = (s) => mx.querySelector(s);
  const byId = (id) => document.getElementById(id);
  let state = rw.dataset.playback || 'idle', muted = false;

  /* ---------- what is playing: copied from the engine's own now-playing nodes ---------- */
  function readMeta() {
    const station = (byId('curStation')?.textContent || '').trim();
    const title = (byId('npTitle')?.textContent || '').trim();
    const artist = (byId('npArtist')?.textContent || '').trim();
    const cover = byId('npCover')?.getAttribute('src') || '';
    const put = (sel, text) => { const el = $(sel); if (el.textContent !== text) el.textContent = text; };
    put('.rmx-station', title ? station : (station ? byId('curStation').dataset.sub || 'RG Radio' : ''));
    put('.rmx-title', title || station || 'RG Radio');
    put('.rmx-artist', title ? artist : (station ? '' : 'Izvēlies staciju'));
    slide();
    const img = $('.rmx-art img');
    if ((img.getAttribute('src') || '') !== cover) { if (cover) img.src = cover; else img.removeAttribute('src'); }
  }
  // Longer than its line, the song slides (index.html rmxMarq): measured only when it or the width changes.
  function slide() {
    const box = $('.rmx-song'), line = box.firstElementChild, over = line.offsetWidth - box.clientWidth;
    box.classList.toggle('rmx-run', over > 1);
    if (over > 1) { box.style.setProperty('--rmx-shift', -(over + 24) + 'px'); box.style.setProperty('--rmx-dur', (6 + (over + 24) / 18).toFixed(1) + 's'); }
  }
  if ('ResizeObserver' in window) new ResizeObserver(slide).observe($('.rmx-song'));
  const metaWatch = new MutationObserver(readMeta);
  ['curStation', 'npTitle', 'npArtist'].forEach((id) => { const el = byId(id); if (el) metaWatch.observe(el, { childList: true, characterData: true, subtree: true }); });
  if (byId('npCover')) metaWatch.observe(byId('npCover'), { attributes: true, attributeFilter: ['src'] });

  /* ---------- play state, mute and volume: the engine reports them with rg-radio-state ---------- */
  const vol = $('.rmx-vol');
  function paintVol(v) { vol.value = String(v); vol.style.setProperty('--v', Math.round(v * 100) + '%'); }
  function isWarm(c) {
    const v = (String(c).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    if (v.length < 3) return false;
    const [r, g, b] = v, mx_ = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx_ - mn < 8) return false;   // a true grey stays grey
    const h = mx_ === r ? (60 * (g - b) / (mx_ - mn) + 360) % 360 : mx_ === g ? 60 * (b - r) / (mx_ - mn) + 120 : 60 * (r - g) / (mx_ - mn) + 240;
    return h < 50 || h >= 345;
  }
  function render() {
    const playing = state === 'playing' || state === 'loading';
    mx.classList.toggle('rmx-playing', playing);
    mx.classList.toggle('rmx-wait', state === 'loading');
    const play = $('[data-rmx="play"]'), label = playing ? 'Pauze' : 'Atskaņot';
    if (play.getAttribute('aria-label') !== label) { play.setAttribute('aria-label', label); play.title = label; }
    const mute = $('[data-rmx="mute"]'), ml = muted ? 'Ieslēgt skaņu' : 'Izslēgt skaņu';
    mute.setAttribute('aria-pressed', String(muted));
    if (mute.getAttribute('aria-label') !== ml) { mute.setAttribute('aria-label', ml); mute.title = ml; }
    const engineVol = byId('vol');
    if (engineVol && document.activeElement !== vol) paintVol(+engineVol.value);
    // The list has started closing (the window's lift is undone first): ease back to the narrow place now.
    if (overlay && !(overlay.style.display === 'grid' && !overlay._mkClosing)) document.documentElement.classList.remove('mk-cd-st');
    // House rule: no violet. An album accent that reads as violet gives way to a neutral ice (the mini players' test).
    const rgb = getComputedStyle(rw).getPropertyValue('--radio-accent-rgb').trim();
    const violet = !!rgb && window.__mkMiniDock && window.__mkMiniDock.violet(rgb);
    if (violet !== (mx.dataset.violet === '1')) { mx.dataset.violet = violet ? '1' : ''; if (violet) mx.style.setProperty('--radio-accent-rgb', '200,222,238'); else mx.style.removeProperty('--radio-accent-rgb'); }
    // House rule: no brown. A warm accent (red, orange, amber, brown: hue under 50 or from 345) mixed into the dark
    // surfaces reads as brown, so those tones take a cool grey (index.html --rmx-tsrc); the wave, play key and volume keep it.
    const warm = isWarm(getComputedStyle(mx).getPropertyValue('--rmx-src'));
    if (warm !== (mx.dataset.warm === '1')) { mx.dataset.warm = warm ? '1' : ''; if (warm) mx.style.setProperty('--rmx-tsrc', '#8c9aa8'); else mx.style.removeProperty('--rmx-tsrc'); }
    spectrum.update();
    skinList();
  }
  document.addEventListener('rg-radio-state', (e) => { if (e.detail) { state = e.detail.state; muted = !!e.detail.muted; } render(); });
  vol.addEventListener('input', () => { paintVol(+vol.value); window.rgListening?.setVolume(+vol.value); });
  // The wheel over the volume nudges it, as on the old consoles.
  vol.addEventListener('wheel', (e) => { e.preventDefault(); const v = Math.max(0, Math.min(1, +vol.value - Math.sign(e.deltaY) * 0.05)); paintVol(v); window.rgListening?.setVolume(v); }, { passive: false });

  /* ---------- the EQ preset: one compact menu built from the engine's own preset buttons ---------- */
  const eqBtn = $('[data-rmx="eq"]'), eqMenu = $('.rmx-eq');
  const presets = () => [...document.querySelectorAll('#eqRow .epb')];
  function eqName(b) { return (b.querySelector('.epb-label')?.textContent || b.textContent || '').trim(); }
  function paintEq() {
    const on = document.querySelector('#eqRow .epb.active');
    const name = on ? eqName(on) : 'FLAT';
    const label = eqBtn.querySelector('b');
    if (label.textContent !== name) label.textContent = name;
    eqMenu.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === on?.id)));
  }
  function openEq(open) {
    if (open && !eqMenu.childElementCount) {
      eqMenu.innerHTML = presets().map((b) => `<button type="button" role="menuitemradio" data-id="${b.id}">${eqName(b)}</button>`).join('');
    }
    eqMenu.hidden = !open;
    eqBtn.setAttribute('aria-expanded', String(open));
    if (open) { paintEq(); eqMenu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true }); }
  }
  eqMenu.addEventListener('click', (e) => {
    const item = e.target.closest('button[data-id]');
    if (!item) return;
    openEq(false);
    byId(item.dataset.id)?.click();
    // SLOW opens the sound effects sheet: it was placed by a key that is hidden now, so put it over this button.
    if (item.dataset.id === 'eq-chilldeep') requestAnimationFrame(placeFx);
  });
  if (byId('eqRow')) new MutationObserver(paintEq).observe(byId('eqRow'), { attributes: true, attributeFilter: ['class'], subtree: true });
  // The sound effects sheet lived inside the old console, which is hidden: it moves to the page once (fixed anyway).
  const fx = byId('slowFxPanel');
  if (fx && fx.parentElement !== document.body) document.body.append(fx);
  // Wide and low (index.html .rmx-fx), above the window from the EQ button; with no room above it lies over the
  // radio itself rather than the dock under it.
  function placeFx() {
    if (!fx || !fx.classList.contains('open')) return;
    fx.classList.add('rmx-fx');
    const b = eqBtn.getBoundingClientRect(), w = rw.getBoundingClientRect(), p = fx.getBoundingClientRect();
    fx.style.left = Math.max(8, Math.min(window.innerWidth - p.width - 8, b.left)) + 'px';
    fx.style.top = Math.max(8, w.top - p.height - 10 >= 8 ? w.top - p.height - 10 : w.bottom - p.height) + 'px';
  }
  document.addEventListener('pointerdown', (e) => { if (!eqMenu.hidden && !eqMenu.contains(e.target) && !eqBtn.contains(e.target)) openEq(false); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !eqMenu.hidden) { openEq(false); eqBtn.focus(); } });

  /* ---------- the station list: the engine's own, joined under the window ---------- */
  const stBtn = $('[data-rmx="stations"]'), overlay = byId('stationOverlay');
  // It wears the skin: the skin's tokens, resolved on the skeleton, are copied onto it (index.html styles them).
  const TOKENS = ['--rmx-surface', '--rmx-acc', '--rmx-ink', '--rmx-sub', '--rmx-well', '--rmx-on', '--rmx-on-ink', '--rmx-font', '--rmx-label', '--rmx-track', '--rmx-case', '--rmx-r', '--rmx-tile-r', '--rmx-art-r'];
  function skinList() {
    if (!overlay) return;
    const skin = rw.dataset.radioSkin;
    if (!skin) { delete overlay.dataset.skin; return; }
    overlay.dataset.skin = skin;
    const cs = getComputedStyle(mx);
    TOKENS.forEach((t) => { const v = cs.getPropertyValue(t).trim(); if (v) overlay.style.setProperty(t, v); else overlay.style.removeProperty(t); });
  }
  if (overlay) new MutationObserver(() => {
    const openList = overlay.style.display === 'grid' && !overlay._mkClosing;
    stBtn.setAttribute('aria-expanded', String(openList));
    // The list is going: the player eases back to its narrow place in the dock's row (index.html html.mk-cd-st).
    if (!openList) document.documentElement.classList.remove('mk-cd-st');
  }).observe(overlay, { attributes: true, attributeFilter: ['style', 'class'] });

  /* ---------- every key presses the engine's own control ---------- */
  mx.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rmx]');
    if (!b) return;
    switch (b.dataset.rmx) {
      case 'play': byId('playBtn')?.click(); break;
      case 'prev': if (typeof playPrev === 'function') playPrev(); break;
      case 'next': if (typeof playNext === 'function') playNext(); break;
      case 'mute': window.rgListening?.toggleMute(); break;
      case 'stations': if (typeof toggleMenu === 'function') toggleMenu(); break;
      case 'eq': openEq(eqMenu.hidden); break;
      case 'look': byId('themeBtn')?.click(); break;
      case 'profile': (byId('mediaProfileButton') || byId('mediaRegisterButton'))?.click(); break;
      case 'min':
        // Minimized means all of it: the station list joined under the window closes first.
        if (overlay && overlay.style.display === 'grid' && typeof toggleMenu === 'function') toggleMenu(false);
        openEq(false);
        if (typeof window.toggleRadio === 'function') window.toggleRadio();
        break;
    }
  });

  /* ---------- the spectrum: the M3 wavy line played by the music (index.html window.__mkWavy) ---------- */
  const spectrum = (function () {
    const cv = $('.rmx-viz canvas'), ctx = cv.getContext('2d');
    let raf = 0, wake = 0, last = 0, W = 0, H = 0, d = 1, seen = false, ink = '#fff', wave = null;
    const analyser = () => (window.__mkRadioAnalyser ? window.__mkRadioAnalyser() : null);
    // Size and visibility are measured on a resize or a change (update), never in a frame.
    const shown = () => seen && !(typeof radioVisualsInactive === 'function' && radioVisualsInactive());
    const running = () => mx.classList.contains('rmx-playing') && shown() && !!analyser();
    function size() {
      d = Math.min(2, window.devicePixelRatio || 1);
      W = Math.round(cv.clientWidth * d); H = Math.round(cv.clientHeight * d); seen = !!(W && H);
      if (seen && (cv.width !== W || cv.height !== H)) { cv.width = W; cv.height = H; }
    }
    // Every skin: one 4 px round-capped stroke (M3's active thickness) in its accent; dither in its ink dots.
    function draw() {
      if (!W || !H || !wave) return;
      ctx.clearRect(0, 0, W, H);
      wave.path(ctx, 3 * d, W - 3 * d, H / 2, Math.max(1, H / 2 - 3 * d), d);
      ctx.strokeStyle = ink; ctx.lineWidth = 4 * d; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.stroke();
    }
    /* About 30 frames a second on every computer (15 on a weak one looked jerky). The loop sleeps on a timer between
       drawn frames and asks for the vsync only shortly before the next one is due: a requestAnimationFrame every
       vsync woke the page 60 times a second to draw 30, on the main thread the calendar's card hover shares with
       this page. */
    function later(ts) {
      // 12 ms early, so the frame that follows is the one due (vsync 16.7 ms; a late timer costs one frame)
      const wait = Math.max(0, last + 32 - ts - 12);
      if (!wait) { raf = requestAnimationFrame(frame); return; }
      wake = setTimeout(() => { wake = 0; if (!raf) raf = requestAnimationFrame(frame); }, wait);
    }
    function frame(ts) {
      raf = 0;
      if (!running()) return;
      if (ts - last >= 32) { last = ts; wave.read(analyser(), ts); draw(); }
      later(ts);
    }
    function dotFill(c) {
      const t = document.createElement('canvas'); t.width = t.height = 2;
      const x = t.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1);
      return ctx.createPattern(t, 'repeat');
    }
    return {
      // Colours and size once per change, then the loop runs only while it plays and shows (one still frame otherwise).
      update() {
        if (!wave && window.__mkWavy) wave = window.__mkWavy({ long: 54, short: 32 });
        if (!wave) return;
        ink = rw.dataset.radioSkin === 'dither' ? dotFill(getComputedStyle(cv).color) : getComputedStyle(cv).color;
        size();
        if (running()) { if (!raf && !wake) raf = requestAnimationFrame(frame); }
        else if (shown()) { wave.read(null, performance.now()); draw(); }
      }
    };
  })();

  // Shown, hidden, skin or accent changed: one repaint, and the loop decides again whether to run.
  new MutationObserver(() => {
    spectrum.update();
    // However the radio is hidden (the dock's RADIO, a phone swipe), its station list goes with it.
    const b = document.body.classList;
    if ((b.contains('radio-hidden') || b.contains('radio-idle')) && overlay && overlay.style.display === 'grid' && !overlay._mkClosing && typeof toggleMenu === 'function') toggleMenu(false);
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => requestAnimationFrame(render)).observe(rw, { attributes: true, attributeFilter: ['data-radio-skin', 'style'] });
  document.addEventListener('visibilitychange', () => spectrum.update());
  if ('ResizeObserver' in window) new ResizeObserver(() => spectrum.update()).observe($('.rmx-viz'));

  /* ---------- the center dock: the dock opens around the radio ----------
     Wide enough (desktop), the window stands centred in the dock's row, its bottom on the dock's bottom (index.html
     html.mk-cdock). Opening the radio splits the dock: Nakts..Plānotājs slide left, Statistika..Vairāk slide right,
     each over a pill of the dock's own glass, the Radio key fades where it stands (the window grows out of it, as
     before). Closing runs it all back. Only translate, the pills' box and opacity move; nothing remounts, the
     dock never rises, and the calendar is laid out as with the radio closed. */
  const cdock = (function () {
    const bar = byId('bottomBtnBar');
    if (!bar) return { sync() {} };
    const root = document.documentElement;
    const LEFT = ['nsToggleBtnParent', 'bolusDocBtn', 'monthCalDocBtn', 'planotajsDockBtn'];
    const RIGHT = ['statsDocBtn', 'pusdienasDockBtn', 'rgMusicDockBtn', 'dockMoreBtn'];
    // One motion with the window's own (index.html mkRadioReveal CDOCK): 380 ms, M3 standard, no overshoot.
    const EDGE = 12, GAP = 12, MAX_W = 1140, MIN_W = 540, MS = 380, EASE = 'cubic-bezier(.2,0,0,1)';
    let split = false, pills = null, anims = [];
    const shown = (ids) => ids.map(byId).filter((b) => b && b.offsetWidth);
    const radioKey = () => ['radioToggle', 'radioIdleBtn'].map(byId).find((b) => b && b.offsetWidth);
    const isOpen = () => { const c = document.body.classList; return !c.contains('radio-hidden') && !c.contains('radio-idle'); };
    const still = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // The whole bar as it stands closed: offsets ignore the translate, so this holds mid-animation too.
    function measure() {
      if (window.isRadioMobileView && window.isRadioMobileView()) return null;
      const B = bar.getBoundingClientRect(), L = shown(LEFT), R = shown(RIGHT);
      if (L.length < 4 || R.length < 4 || !B.width) return null;
      // offsetLeft counts from inside the bar's border: the keys' screen x and the pills' edges include it.
      const bw = parseFloat(getComputedStyle(bar).borderLeftWidth) || 0;
      const x = (b) => B.left + bw + b.offsetLeft, pad = L[0].offsetLeft + bw;
      const gap = L[1].offsetLeft - L[0].offsetLeft - L[0].offsetWidth;
      const lw = x(L[3]) + L[3].offsetWidth - x(L[0]) + 2 * pad;
      const rw2 = R.reduce((sum, b) => sum + b.offsetWidth, 0) + gap * (R.length - 1) + 2 * pad;
      // Both halves as wide as the wider one, their keys centred in it: the same margin at both screen edges and the
      // same gap on both sides of the radio.
      const M = Math.max(lw, rw2);
      const V = window.innerWidth, w = Math.floor(Math.min(MAX_W, V - 2 * (EDGE + GAP + M)));
      if (w < MIN_W) return null;
      const left = Math.round((V - w) / 2), lLeft = left - GAP - M, rLeft = left + w + GAP;
      let cum = 0;
      const rStart = rLeft + (M - rw2) / 2;
      const dR = R.map((b) => { const d = rStart + pad + cum - x(b); cum += b.offsetWidth + gap; return d; });
      return { B, L, R, dL: lLeft + (M - lw) / 2 + pad - x(L[0]), dR, w, left, lw: M, rw: M, lLeft, rLeft,
        seam: (x(L[3]) + L[3].offsetWidth + x(R[0])) / 2, radius: getComputedStyle(bar).borderTopLeftRadius,
        // The pills sit in the bar's padding box: inside its border.
        border: bw };
    }
    // Where the window stands: centred, as wide as the room between the halves. Without the room, the old place.
    function place() {
      const g = measure(), was = root.classList.contains('mk-cdock');
      root.classList.toggle('mk-cdock', !!g);
      // The calendar's room depends on it (index.html _doSync): tell it when it flips.
      if (was !== !!g && typeof window.syncShellLayout === 'function') window.syncShellLayout();
      if (g) { root.style.setProperty('--mkcd-left', g.left + 'px'); root.style.setProperty('--mkcd-w', g.w + 'px'); root.style.setProperty('--mkcd-bottom', (window.innerHeight - g.B.bottom) + 'px'); }
      return g;
    }
    function glass(pill) {
      const cs = getComputedStyle(bar);
      ['backgroundColor', 'backgroundImage', 'boxShadow', 'backdropFilter', 'webkitBackdropFilter', 'border'].forEach((k) => { pill.style[k] = cs[k]; });
    }
    function stop() { anims.forEach((a) => { try { a.cancel(); } catch (_) {} }); anims = []; }
    function go(el, frames) { if (!still()) anims.push(el.animate(frames, { duration: MS, easing: EASE })); }
    function toSplit(animate) {
      const g = place();
      if (!g) { if (split) toMerged(false); return; }
      stop();
      const rel = (v) => v - g.B.left - g.border + 'px', r = g.radius;
      if (!pills) {
        pills = [document.createElement('span'), document.createElement('span')];
        pills.forEach((p) => { p.className = 'mk-cd-pill'; p.setAttribute('aria-hidden', 'true'); glass(p); bar.prepend(p); });
        // No hairline on the sides that meet: the two halves close into one bar without a seam.
        pills[0].style.borderRightColor = 'transparent'; pills[1].style.borderLeftColor = 'transparent';
      }
      // The bar hands its glass to the pills in one frame: its own background transition would fade it out under them.
      bar.style.setProperty('transition', 'none', 'important');
      bar.style.setProperty('background', 'transparent', 'important');
      bar.style.setProperty('box-shadow', 'none', 'important');
      bar.style.setProperty('backdrop-filter', 'none', 'important');
      bar.style.setProperty('border-color', 'transparent', 'important');
      bar.classList.add('mk-split');
      const [pl, pr] = pills;
      // Over the bar's border too: the pills have the bar's outer edges (and the window's bottom).
      pills.forEach((p) => { p.style.top = -g.border + 'px'; p.style.height = g.B.height + 'px'; });
      const lTo = { left: rel(g.lLeft), width: g.lw + 'px', borderRadius: r }, rTo = { left: rel(g.rLeft), width: g.rw + 'px', borderRadius: r };
      Object.assign(pl.style, lTo); Object.assign(pr.style, rTo);
      g.L.forEach((b) => { b.style.translate = g.dL + 'px 0'; });
      g.R.forEach((b, i) => { b.style.translate = g.dR[i] + 'px 0'; });
      const key = radioKey();
      if (key) key.classList.add('mk-cd-gone');
      if (animate && !split) {
        // From one bar cut at the seam between Plānotājs and Statistika, to the two pills.
        go(pl, [{ left: '0px', width: rel(g.seam), borderRadius: `${r} 0 0 ${r}` }, lTo]);
        go(pr, [{ left: rel(g.seam), width: g.B.right - g.seam + 'px', borderRadius: `0 ${r} ${r} 0` }, rTo]);
        g.L.forEach((b) => go(b, [{ translate: '0px 0' }, { translate: g.dL + 'px 0' }]));
        g.R.forEach((b, i) => go(b, [{ translate: '0px 0' }, { translate: g.dR[i] + 'px 0' }]));
        // The window grows out of the Radio key (index.html mkRadioReveal): the key gives way at once.
        if (key) go(key, [{ opacity: 1 }, { opacity: 0, offset: .2 }, { opacity: 0 }]);
      }
      split = true;
    }
    function toMerged(animate) {
      if (!split) return;
      stop();
      split = false;
      const g = measure();
      const L = shown(LEFT), R = shown(RIGHT), key = radioKey();
      const done = () => {
        if (split) return;
        L.concat(R).forEach((b) => { b.style.translate = ''; });
        // The window has gone back into the Radio key: only now, with its neighbours home, does the key show again.
        if (key) { key.classList.remove('mk-cd-gone'); if (animate && !still()) key.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'linear' }); }
        // And takes it back in one frame (its transition off until the swap has painted).
        ['background', 'box-shadow', 'backdrop-filter', 'border-color'].forEach((k) => bar.style.removeProperty(k));
        void bar.offsetWidth;
        if (pills) { pills.forEach((p) => p.remove()); pills = null; }
        bar.classList.remove('mk-split');
        requestAnimationFrame(() => requestAnimationFrame(() => { if (!split) bar.style.removeProperty('transition'); }));
      };
      if (!animate || !g || !pills || still()) { done(); return; }
      const rel = (v) => v - g.B.left - g.border + 'px', r = g.radius, [pl, pr] = pills;
      L.forEach((b) => { const from = b.style.translate || '0px 0'; b.style.translate = ''; go(b, [{ translate: from }, { translate: '0px 0' }]); });
      R.forEach((b) => { const from = b.style.translate || '0px 0'; b.style.translate = ''; go(b, [{ translate: from }, { translate: '0px 0' }]); });
      const lEnd = { left: '0px', width: rel(g.seam), borderRadius: `${r} 0 0 ${r}` }, rEnd = { left: rel(g.seam), width: g.B.right - g.seam + 'px', borderRadius: `0 ${r} ${r} 0` };
      go(pl, [{ left: pl.style.left, width: pl.style.width, borderRadius: r }, lEnd]);
      go(pr, [{ left: pr.style.left, width: pr.style.width, borderRadius: r }, rEnd]);
      Object.assign(pl.style, lEnd); Object.assign(pr.style, rEnd);
      const all = anims.slice();
      Promise.all(all.map((a) => a.finished)).then(done, () => {});
    }
    // Opening anything else from the dock minimizes the radio first, so nothing lies over it; the music plays on
    // (the minimized player takes over beside the dock). Vairāk only opens its small menu, so it leaves the radio be.
    bar.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('#bottomBtnBar > button');
      if (!split || !b || b === radioKey() || b.id === 'dockMoreBtn' || b.id === 'radioToggle' || b.id === 'radioIdleBtn') return;
      if (typeof window.toggleRadio === 'function') window.toggleRadio();
    }, true);
    return {
      sync(animate) { if (isOpen() && measure()) toSplit(animate); else { toMerged(animate); place(); } },
      resize() { if (split) toSplit(false); else place(); }
    };
  })();
  let cdockOpen = null;
  new MutationObserver(() => { const now = !document.body.classList.contains('radio-hidden') && !document.body.classList.contains('radio-idle'); if (now !== cdockOpen) { cdockOpen = now; cdock.sync(true); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', () => cdock.resize());
  cdockOpen = !document.body.classList.contains('radio-hidden') && !document.body.classList.contains('radio-idle');
  cdock.sync(false);
  readMeta(); paintEq(); render();
})();
