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
    put('.rmx-station', title ? station : (station ? 'RG Radio' : ''));
    put('.rmx-title', title || station || 'RG Radio');
    put('.rmx-artist', title ? artist : (station ? '' : 'Izvēlies staciju'));
    const img = $('.rmx-art img');
    if ((img.getAttribute('src') || '') !== cover) { if (cover) img.src = cover; else img.removeAttribute('src'); }
  }
  const metaWatch = new MutationObserver(readMeta);
  ['curStation', 'npTitle', 'npArtist'].forEach((id) => { const el = byId(id); if (el) metaWatch.observe(el, { childList: true, characterData: true, subtree: true }); });
  if (byId('npCover')) metaWatch.observe(byId('npCover'), { attributes: true, attributeFilter: ['src'] });

  /* ---------- play state, mute and volume: the engine reports them with rg-radio-state ---------- */
  const vol = $('.rmx-vol');
  function paintVol(v) { vol.value = String(v); vol.style.setProperty('--v', Math.round(v * 100) + '%'); }
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
  if (overlay) new MutationObserver(() => stBtn.setAttribute('aria-expanded', String(overlay.style.display === 'grid' && !overlay._mkClosing))).observe(overlay, { attributes: true, attributeFilter: ['style', 'class'] });

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

  /* ---------- the spectrum: each skin draws the same analysed bands its own way ---------- */
  const spectrum = (function () {
    const cv = $('.rmx-viz canvas'), ctx = cv.getContext('2d');
    const N = 24, now = new Float32Array(N), slow = new Float32Array(N), peak = new Float32Array(N), caps = new Float32Array(96);
    const STILL = [.22, .38, .52, .46, .68, .9, .76, .58, .64, .86, 1, .82, .6, .52, .66, .78, .58, .44, .5, .38, .3, .25, .18, .1];
    let raf = 0, last = 0, data = null, top = .12, W = 0, H = 0, d = 1, acc = '#fff', ink = '#fff', dots = [];
    const lowSpec = () => document.documentElement.classList.contains('mk-low-spec');
    const shown = () => !!mx.offsetWidth && !(typeof radioVisualsInactive === 'function' && radioVisualsInactive());
    const analyser = () => (window.__mkRadioAnalyser ? window.__mkRadioAnalyser() : null);
    const running = () => mx.classList.contains('rmx-playing') && shown() && !!analyser();
    function read() {
      const a = analyser();
      if (!a || !mx.classList.contains('rmx-playing')) { for (let k = 0; k < N; k++) { now[k] = STILL[k] * .7; slow[k] = STILL[(k + 3) % N] * .85; peak[k] = STILL[(k + 7) % N]; } return; }
      if (!data || data.length !== a.frequencyBinCount) data = new Uint8Array(a.frequencyBinCount);
      a.getByteFrequencyData(data);
      // Bands spaced as we hear (50 Hz to 14 kHz, log), each its loudest bin; music is quieter up high, so the levels
      // (decibels) get about 3 dB an octave; then each is measured from the quietest band up to a slowly falling
      // running maximum, so quiet or loud, broad or thin, there are always peaks and valleys.
      const ny = (a.context.sampleRate || 48000) / 2, L = data.length, lv = [];
      let m = 0, f = 1;
      for (let i = 0; i < N; i++) {
        const lo = Math.floor(L * 50 * Math.pow(280, i / N) / ny), hi = Math.max(lo + 1, Math.floor(L * 50 * Math.pow(280, (i + 1) / N) / ny));
        let v = 0;
        for (let j = lo; j < hi && j < L; j++) if (data[j] > v) v = data[j];
        lv[i] = v / 255 + i / N * .26;
        if (lv[i] > m) m = lv[i];
        if (lv[i] < f) f = lv[i];
      }
      top = Math.max(m - f, top * .97, .12);
      for (let i = 0; i < N; i++) {
        const v = Math.pow(Math.max(0, lv[i] - f) / top, 1.6) * .95;
        now[i] = now[i] * .45 + v * .55;
        slow[i] = slow[i] * .88 + v * .12;
        peak[i] = Math.max(now[i], peak[i] - .012);
      }
    }
    // The level at a fraction of the width, between bands.
    const at = (lv, x) => { const p = x * (N - 1), i = Math.floor(p), t = p - i; return lv[i] * (1 - t) + lv[Math.min(N - 1, i + 1)] * t; };
    function hills(lv, off, base) {
      ctx.beginPath(); ctx.moveTo(0, base);
      let px = 0, py = base;
      for (let i = 0; i <= N; i++) {
        const x = i < N ? Math.min(W, (i + .5 + off) / N * W) : W, y = i < N ? base - Math.min(1, lv[i]) * (base - 2 * d) : base;
        ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2); px = x; py = y;
      }
      ctx.lineTo(W, base);
    }
    const line = (base, h) => { ctx.globalAlpha = .9; ctx.fillStyle = acc; ctx.fillRect(0, base, W, h); ctx.globalAlpha = 1; };
    const SKINS = {
      // Klasiskais, Jauns: the minimized player's layered hills, full width.
      hills() {
        const base = H - 2 * d;
        ctx.fillStyle = acc;
        [[peak, .45, .2], [slow, -.3, .32], [now, 0, .6]].forEach(([lv, off, a]) => { ctx.globalAlpha = a; hills(lv, off, base); ctx.fill(); });
        line(base, 2 * d);
      },
      // Pixel: soft capsules, each as round as it is wide, stronger the louder.
      pixel() {
        const n = 40, bw = W / n, w = bw - 6 * d;
        ctx.fillStyle = acc;
        for (let i = 0; i < n; i++) {
          const v = at(now, i / (n - 1)), h = Math.max(w, v * (H - 2 * d)), x = i * bw + 3 * d;
          ctx.globalAlpha = .45 + .5 * v;
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, H - h, w, h, w / 2) : ctx.rect(x, H - h, w, h); ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
      // Pioneer: an OLED VU, lit segments in columns under a hairline of the falling peaks.
      pioneer() {
        const base = H - d, n = Math.max(24, Math.round(W / (12.5 * d))), bw = W / n, seg = 6.4 * d, rows = Math.floor((base - 4 * d) / seg);
        ctx.fillStyle = acc;
        for (let i = 0; i < n; i++) {
          const lit = Math.round(at(now, i / (n - 1)) * rows);
          for (let k = 0; k < lit; k++) { ctx.globalAlpha = .3 + .7 * (k / rows); ctx.fillRect(i * bw + d, base - 6 * d - k * seg, bw - 3 * d, 3.4 * d); }
        }
        ctx.globalAlpha = .5; ctx.strokeStyle = acc; ctx.lineWidth = d; hills(peak, .45, base); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillRect(0, base, W, d);
      },
      // Amp: Winamp's bars, dark to light in the one green, with caps that fall slower than the bars.
      amp() {
        const base = H - 2 * d, n = Math.min(96, Math.max(24, Math.round(W / (20 * d)))), bw = W / n;
        const g = ctx.createLinearGradient(0, base, 0, 0); g.addColorStop(0, 'rgba(60,140,90,.95)'); g.addColorStop(1, acc);
        for (let i = 0; i < n; i++) {
          const v = at(now, i / (n - 1)), h = v * (base - 8 * d), x = i * bw + 1.5 * d, w = bw - 4 * d;
          caps[i] = Math.max(v, caps[i] - .01);
          ctx.fillStyle = g; ctx.fillRect(x, base - h, w, h);
          ctx.fillStyle = ink; ctx.globalAlpha = .85; ctx.fillRect(x, base - caps[i] * (base - 8 * d) - 6 * d, w, 2 * d); ctx.globalAlpha = 1;
        }
        line(base, 2 * d);
      },
      // Dither: three layers of 1-bit dots on one ink, crisp.
      dither() {
        const base = H - 2 * d;
        [[peak, .45, dots[2]], [slow, -.3, dots[1]], [now, 0, dots[0]]].forEach(([lv, off, fill]) => { ctx.fillStyle = fill; hills(lv, off, base); ctx.fill(); });
        ctx.fillStyle = acc; ctx.fillRect(0, base, W, 2 * d);
      }
    };
    function draw() {
      d = Math.min(2, window.devicePixelRatio || 1);
      W = Math.round(cv.clientWidth * d); H = Math.round(cv.clientHeight * d);
      if (!W || !H) return;
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      ctx.clearRect(0, 0, W, H);
      const skin = rw.dataset.radioSkin;
      (SKINS[skin === 'classic' || skin === 'clean' ? 'hills' : skin] || SKINS.hills)();
    }
    function frame(ts) {
      raf = 0;
      if (!running()) return;
      raf = requestAnimationFrame(frame);
      // About 30 frames a second; a weak computer gets 15.
      if (ts - last < (lowSpec() ? 66 : 32)) return;
      last = ts; read(); draw();
    }
    function dotFill(step, size) {
      const t = document.createElement('canvas'); t.width = t.height = step;
      const c = t.getContext('2d'); c.fillStyle = acc; c.fillRect(0, 0, size, size); if (step === 2) c.fillRect(1, 1, 1, 1);
      return ctx.createPattern(t, 'repeat');
    }
    return {
      // Colours once per change, then the loop runs only while it plays and shows (one still frame otherwise).
      update() {
        const cs = getComputedStyle(cv);
        acc = cs.color; ink = getComputedStyle(mx).color;
        if (rw.dataset.radioSkin === 'dither') dots = [dotFill(2, 1), dotFill(4, 2), dotFill(3, 1)];
        if (running()) { if (!raf) raf = requestAnimationFrame(frame); } else if (shown()) { read(); draw(); }
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
  readMeta(); paintEq(); render();
})();
