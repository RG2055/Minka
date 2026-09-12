/* Supplement to the existing mood card; its face, orbit, reactions and comments
   stay owned by the original code. This adds the shift radio's presence to the
   face (headphones, a glass tint from the album art, a "now playing" caption)
   and lazy-loads the statistics view. */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var read = function (k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (_e) { return {}; } };
  var radioRecords = read('minkaShiftRadioV1');
  if (!Array.isArray(radioRecords)) radioRecords = [];
  var state = { name: '', playing: false, artist: '', title: '', tint: '', logo: '', cover: '' };
  var statsLoading = null;

  function selectedDay() { return MinkaDaybookModel.day(window.__activeDateStr) || MinkaDaybookModel.dutyDay(); }

  function headphonesSvg() {
    // Ear cups (in front of the glass) with a faint contact shadow under each;
    // the band is a separate layer behind the glass, see enhance().
    // Each part is an image plus a tint layer masked by the same image, so the
    // album colour lands on the metal while its reflections stay.
    var part = function (cls, file) {
      // The mask URL goes in the inline style: a url() inside a custom property
      // resolves against the stylesheet, not the document, in Chrome.
      var mask = 'url(assets/' + file + '?v=1)';
      return '<span class="' + cls + '"><img src="assets/' + file + '?v=1" alt="" decoding="async"><i class="rg-hp-tint" style="-webkit-mask-image:' + mask + ';mask-image:' + mask + '"></i></span>';
    };
    return '<span class="rg-hp-shadow rg-hp-shadow--l" aria-hidden="true"></span><span class="rg-hp-shadow rg-hp-shadow--r" aria-hidden="true"></span>'
      + part('rg-hp-cup rg-hp-cup--l', 'hp-cup-left.webp') + part('rg-hp-cup rg-hp-cup--r', 'hp-cup-right.webp');
  }

  /* Where the radio sits: a random free spot on the lower arc around the
     glass, chosen once per station. Candidates are tested against the real
     boxes of the staff bubbles, side chips, label and card edges, so nothing
     stacks. No animation — the cheap part of "floating" is only the place. */
  function placeBadge(stage, force) {
    var now = stage.querySelector('.rg-mood-now');
    var wrap = stage.querySelector('.rg-mood-blob-wrap');
    var card = stage.closest('.rg-feedback-card');
    if (!now || !wrap || !card) return;
    // One spot per station and selected day; a new day or station rolls again.
    var key = state.name + '|' + selectedDay();
    if (!force && now.dataset.placedFor === key) return;
    // Size varies a little too — never above the base size.
    now.style.setProperty('--b', 'calc(clamp(82px, 45cqw, 100px) * ' + (0.8 + Math.random() * 0.2).toFixed(2) + ')');
    var lens = stage.querySelector('.rg-mood-glass-lens') || wrap;
    var W = wrap.getBoundingClientRect(), L = lens.getBoundingClientRect(), C = card.getBoundingClientRect();
    var b = now.getBoundingClientRect();
    if (!W.width || !b.width) return;
    var bw = b.width, bh = b.height, ant = bh * 0.56; // antenna rises above the body
    var cx = L.left + L.width / 2 - W.left, cy = L.top + L.height / 2 - W.top;
    var R = L.width / 2 + bh * 0.6 + 4;
    var avoid = [];
    card.querySelectorAll('.rg-mood-person, .rg-mood-side, .rg-mood-label, .rg-mood-topbtn, .rg-feedback-card-title, .rg-pulse-taps, .rg-feedback-card-actions, .rg-hp-cup, .rg-mood-glass-lens').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width && r.height && !now.contains(el)) avoid.push(r);
    });
    var angles = [];
    for (var a = 30; a <= 150; a += 8) if (Math.abs(a - lastAngle) > 20) angles.push(a);
    for (var i = angles.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = angles[i]; angles[i] = angles[j]; angles[j] = t; }
    var best = null;
    angles.some(function (deg) {
      var rad = deg * Math.PI / 180;
      var x = cx + Math.cos(rad) * R - bw / 2, y = cy + Math.sin(rad) * R - bh / 2;
      var box = { left: W.left + x, top: W.top + y - ant, right: W.left + x + bw, bottom: W.top + y + bh };
      if (box.left < C.left + 4 || box.right > C.right - 4 || box.bottom > C.bottom - 4) return false;
      var hit = avoid.some(function (r) { return box.left < r.right && r.left < box.right && box.top < r.bottom && r.top < box.bottom; });
      if (hit) return false;
      best = { x: x, y: y };
      lastAngle = deg;
      return true;
    });
    if (!best) best = { x: cx - bw / 2, y: cy + L.height / 2 + bh * 0.14 };
    now.style.left = best.x.toFixed(1) + 'px';
    now.style.top = best.y.toFixed(1) + 'px';
    // A static tilt, left or right, rolled with the place. No motion.
    var tilt = (3 + Math.random() * 6) * (Math.random() < 0.5 ? -1 : 1);
    now.style.transform = 'rotate(' + tilt.toFixed(1) + 'deg)';
    now.classList.add('is-placed');
    now.dataset.placedFor = key;
    // Let the staff constellation re-flow around the new box.
    if (window.__minkaScheduleMoodSectionLayout) window.__minkaScheduleMoodSectionLayout();
  }
  var lastAngle = -999;
  var placeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(placeTimer);
    placeTimer = window.setTimeout(function () {
      var stage = document.querySelector('.rg-feedback-card .rg-mood-stage.is-radio');
      if (stage) placeBadge(stage, true);
    }, 200);
  }, { passive: true });

  function paint() {
    var stage = document.querySelector('.rg-feedback-card .rg-mood-stage');
    if (!stage) return;
    var on = !!(state.playing && state.name);
    stage.classList.toggle('is-radio', on);
    if (state.tint) stage.style.setProperty('--rg-radio-tint', state.tint);
    else stage.style.removeProperty('--rg-radio-tint');
    var now = stage.querySelector('.rg-mood-now');
    if (!now) return;
    var track = [state.artist, state.title].filter(Boolean).join(' — ');
    now.title = on ? 'Skan: ' + state.name + (track ? ' · ' + track : '') : '';
    // Album cover (or the station's logo) in the radio's left window.
    var art = now.querySelector('.rg-mood-now-cover');
    // Only absolute or data URLs count; a station's relative placeholder path
    // (Record's DefaultTrack_600.png) is not art. A failed load falls back to
    // the station logo, then hides the window.
    var pick = function (url) { return url && /^(https?:|data:)/.test(url) && !/radio-default\.svg(\?|$)|DefaultTrack/.test(url) ? url : ''; };
    var want = pick(state.cover) || pick(state.logo);
    var fallback = want === pick(state.cover) ? pick(state.logo) : '';
    if (!art._bound) {
      art._bound = true;
      art.addEventListener('error', function () {
        var next = art.dataset.fallback || '';
        art.dataset.fallback = '';
        if (next && art.getAttribute('src') !== next) art.src = next;
        else { art.setAttribute('hidden', ''); art.removeAttribute('src'); }
      });
    }
    art.dataset.fallback = fallback && fallback !== want ? fallback : '';
    if (want) { if (art.getAttribute('src') !== want) art.src = want; art.removeAttribute('hidden'); }
    else { art.setAttribute('hidden', ''); art.removeAttribute('src'); }
    // Only the station on the top band (the track lives in the tooltip);
    // a long station name scrolls.
    var top = now.querySelector('.rg-mood-now-station > span');
    if (top.textContent !== state.name) top.textContent = state.name;
    if (!on) return;
    placeBadge(stage, false);
    window.requestAnimationFrame(function () {
      [top].forEach(function (el) {
        var box = el.parentNode, over = el.scrollWidth - box.clientWidth;
        box.classList.toggle('is-overflow', over > 2);
        box.style.setProperty('--shift', over > 2 ? (-over - 8) + 'px' : '0px');
        box.style.setProperty('--dur', Math.max(5, Math.round((over + 40) / 14)) + 's');
      });
    });
  }

  function enhance(card) {
    if (!card) return;
    var stage = card.querySelector('.rg-mood-stage');
    var wrap = card.querySelector('.rg-mood-blob-wrap');
    if (stage && wrap && !wrap.querySelector('.rg-mood-headphones')) {
      // Band behind the glass so the orb overlaps it; cups in front, so the
      // emoji looks like it is wearing them rather than having them pasted on.
      var band = document.createElement('span');
      band.className = 'rg-mood-headband';
      band.setAttribute('aria-hidden', 'true');
      band.innerHTML = '<span class="rg-hp-band"><img src="assets/hp-band.webp?v=1" alt="" decoding="async"><i class="rg-hp-tint" style="-webkit-mask-image:url(assets/hp-band.webp?v=1);mask-image:url(assets/hp-band.webp?v=1)"></i></span>';
      wrap.prepend(band);
      var phones = document.createElement('span');
      phones.className = 'rg-mood-headphones';
      phones.setAttribute('aria-hidden', 'true');
      phones.innerHTML = headphonesSvg();
      wrap.append(phones);
    }
    if (stage && wrap && !stage.querySelector('.rg-mood-now')) {
      // Hangs from the bottom of the glass, so it reads as part of the sphere.
      var now = document.createElement('button');
      now.type = 'button';
      now.className = 'rg-mood-now';
      now.setAttribute('aria-live', 'polite');
      now.setAttribute('data-rg-now', '');
      // Glass radio (kalendars/assets/radio.webp): body spans the badge width;
      // the antenna sits above it. Tinted like the headphones.
      now.innerHTML = '<span class="rg-mood-now-radio"><img src="assets/radio.webp?v=1" alt="" decoding="async"><i class="rg-hp-tint" style="-webkit-mask-image:url(assets/radio.webp?v=1);mask-image:url(assets/radio.webp?v=1)"></i></span>'
        + '<img class="rg-mood-now-cover" alt="" decoding="async" hidden>'
        + '<span class="rg-mood-now-station"><span></span></span>';
      wrap.append(now);
    }
    paint();
  }

  async function refresh() {
    if (!window.MINKA_LOCAL_DAYBOOK) return;
    try {
      var r = await fetch('/__local/daybook');
      if (!r.ok) return;
      var d = await r.json();
      radioRecords = d.radio || [];
    } catch (_e) {}
  }

  function renderStats() {
    var wrap = document.getElementById('stats-table-wrap');
    if (!wrap) return;
    if (window.MinkaDaybookStats) { window.MinkaDaybookStats.render(); return; }
    wrap.innerHTML = '<div class="db-empty" role="status">Ielādē pārskatu…</div>';
    if (!statsLoading) {
      statsLoading = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'js/daybook-stats.js?v=20260912fix1';
        s.onload = resolve;
        s.onerror = function () { s.remove(); statsLoading = null; reject(new Error('daybook-stats')); };
        document.head.append(s);
      });
    }
    statsLoading.then(function () { window.MinkaDaybookStats.render(); })
      .catch(function () { wrap.innerHTML = '<div class="db-empty">Neizdevās ielādēt pārskatu. Aizver un atver vēlreiz.</div>'; });
    void refresh().then(function () {
      var modal = document.getElementById('stats-modal');
      if (window.MinkaDaybookStats && modal && modal.style.display !== 'none') window.MinkaDaybookStats.render();
    });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.rg-mood-stage [data-rg-now]')) return;
    e.preventDefault();
    window.parent.postMessage({ type: 'minka-shift-radio-control', action: 'focus' }, location.origin);
  });
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.type !== 'minka-shift-radio') return;
    state = Object.assign({ name: '', playing: false, artist: '', title: '', tint: '', logo: '', cover: '' }, e.data.state || {});
    try { radioRecords = window.parent.MinkaShiftRadio.history() || radioRecords; } catch (_e) {}
    paint();
    document.dispatchEvent(new CustomEvent('minka-shift-radio', { detail: state }));
  });
  window.addEventListener('storage', function (e) {
    if (e.key !== 'minkaShiftRadioV1') return;
    try { radioRecords = JSON.parse(e.newValue || '[]'); } catch (_e) {}
  });
  window.parent.postMessage({ type: 'minka-shift-radio-request' }, location.origin);

  window.MinkaDaybook = {
    enhance: enhance,
    renderStats: renderStats,
    radio: function () { return radioRecords; },
    ratings: function () { return read('minkaShiftPulseV2'); },
    refresh: refresh,
    selectedDay: selectedDay,
    esc: esc
  };
})();
