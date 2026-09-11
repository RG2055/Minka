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

  function radioIconSvg() {
    return '<svg class="rg-mood-now-icon" viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M4 9.5 17.5 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>'
      + '<rect x="3" y="9" width="18" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="2"></rect>'
      + '<circle cx="15.5" cy="14.5" r="2.4" fill="currentColor"></circle>'
      + '<path d="M6.5 13h4M6.5 16.5h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>'
      + '</svg>';
  }
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
    // Album cover in the middle; the station logo, then the radio glyph, as fallbacks.
    var art = now.querySelector('.rg-mood-now-cover');
    var pick = function (url) { return url && !/radio-default\.svg$/.test(url) && !/^data:/.test(url) ? url : ''; };
    var want = pick(state.cover) || pick(state.logo);
    if (want) { if (art.getAttribute('src') !== want) art.src = want; art.removeAttribute('hidden'); }
    else { art.setAttribute('hidden', ''); art.removeAttribute('src'); }
    var icon = now.querySelector('.rg-mood-now-icon');
    if (want) icon.setAttribute('hidden', ''); else icon.removeAttribute('hidden');
    // Station on the top arc, track on the bottom arc. When the track does not
    // fit its arc the whole text goes on one slowly turning ring instead.
    var key = state.name + '|' + track;
    if (now.dataset.text === key) return;
    now.dataset.text = key;
    var top = now.querySelector('.rg-mood-now-top textPath');
    var bottom = now.querySelector('.rg-mood-now-bottom textPath');
    var ring = now.querySelector('.rg-mood-now-full textPath');
    top.textContent = state.name;
    bottom.textContent = track;
    ring.innerHTML = '';
    now.classList.remove('is-spinning', 'is-full');
    // Measured when visible; while the card is hidden the SVG reports 0, so a
    // per-character estimate (Inter bold ≈ 4.1 units at 6.6px) stands in.
    var arc = Math.PI * 29.5 * 0.92, fits = true;
    var measure = function (el, text) { var n = 0; try { n = el.getComputedTextLength(); } catch (_e) {} return n || text.length * 4.1; };
    fits = measure(top, state.name) <= arc && measure(bottom, track) <= arc;
    if (!fits) {
      now.classList.add('is-full', 'is-spinning');
      ring.innerHTML = '<tspan class="rg-mood-now-station">' + esc(state.name) + '</tspan><tspan>  ·  ' + esc(track) + '  ·  </tspan>';
    }
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
      now.innerHTML = '<span class="rg-mood-now-halo" aria-hidden="true"></span>'
        + '<img class="rg-mood-now-base" src="assets/radio-glass-base.webp?v=3" alt="" decoding="async" onerror="this.parentNode.classList.add(\'no-glass-image\')">'
        + '<span class="rg-mood-now-glass"></span>'
        + '<img class="rg-mood-now-cover" alt="" decoding="async" hidden>'
        + '<span class="rg-mood-now-content">' + radioIconSvg()
        + '<svg class="rg-mood-now-ring" viewBox="0 0 100 100" aria-hidden="true"><defs>'
        // The bubble image spans radius ~39 of this box; text runs just inside its rim.
        + '<path id="rgNowTop" d="M50 50 m-29.5 0 a29.5 29.5 0 1 1 59 0"></path>'
        // left → right along the bottom (counter-clockwise) so the text reads upright
        + '<path id="rgNowBottom" d="M50 50 m-35.5 0 a35.5 35.5 0 0 0 71 0"></path>'
        + '<path id="rgNowFull" d="M50 50 m-30 0 a30 30 0 1 1 60 0 a30 30 0 1 1 -60 0"></path></defs>'
        // dark translucent band under the text so it reads on the light glass
        + '<circle class="rg-mood-now-band" cx="50" cy="50" r="32.5" fill="none"></circle>'
        + '<text class="rg-mood-now-top"><textPath href="#rgNowTop" startOffset="50%" text-anchor="middle"></textPath></text>'
        + '<text class="rg-mood-now-bottom"><textPath href="#rgNowBottom" startOffset="50%" text-anchor="middle"></textPath></text>'
        + '<text class="rg-mood-now-full"><textPath href="#rgNowFull"></textPath></text></svg>'
        + '</span>'
        + '<img class="rg-mood-now-gloss" src="assets/radio-glass-gloss.webp?v=3" alt="" decoding="async" onerror="this.remove()">'
        + '<span class="rg-mood-now-tint"></span>';
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
        s.src = 'js/daybook-stats.js?v=20260911v';
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
