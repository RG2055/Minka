/* Collective station history plus a "what is on" snapshot for the mood card,
   driven by the existing audio element and now-playing events. No new player,
   no audio downloads, no animation timer; station and track names only, never
   a listener's identity. */
(function () {
  'use strict';
  var KEY = 'minkaShiftRadioV1';
  var M = window.MinkaDaybookModel;
  var records = [];
  try { records = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(records)) records = []; } catch (_e) {}
  var state = { name: '', playing: false, artist: '', title: '', tint: '', logo: '', cover: '' };
  var lastDay = '', nextDateCheck = 0, tintSeed = '';

  // Logos and covers may be paths relative to this document; the calendar
  // frame lives in a subfolder, so hand it absolute URLs.
  function absolute(url) {
    if (!url) return '';
    try { return new URL(url, location.href).href; } catch (_e) { return ''; }
  }
  function frameWindow() {
    var frame = document.getElementById('calIframe');
    return frame && frame.contentWindow;
  }
  function emit() {
    var w = frameWindow();
    if (w) w.postMessage({ type: 'minka-shift-radio', state: state }, location.origin);
  }
  var FEEDBACK_BASE = String(window.MINKA_FEEDBACK_API_BASE || 'https://minka-feedback-api.gamernr1elite.workers.dev').replace(/\/$/, '');
  // Shared history: day + station only, so every device's statistics agree.
  // Sent once per station and day per page load; the API ignores repeats.
  var shared = {};
  function share(day, name) {
    var key = day + '|' + M.norm(name);
    if (shared[key]) return;
    shared[key] = true;
    fetch(FEEDBACK_BASE + '/api/radio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: day, station: name }), keepalive: true })
      .then(function (r) { if (!r.ok) delete shared[key]; })
      .catch(function () { delete shared[key]; });
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(records)); } catch (_e) {}
    if (window.MINKA_LOCAL_DAYBOOK) {
      fetch('/__local/radio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day: M.dutyDay(), name: state.name }) }).catch(function () {});
    }
  }
  function update(playing) {
    var name = (document.getElementById('curStation') || {}).textContent || '';
    name = name.trim();
    var radioWindow = document.getElementById('radioWindow');
    if (radioWindow && radioWindow.classList.contains('music-source')) playing = false;
    state.name = name;
    state.playing = !!playing;
    // radio.js declares npStationLogo with `let` (a global binding, not a window property).
    state.logo = absolute(typeof npStationLogo === 'string' ? npStationLogo : '');
    if (playing && name) {
      var day = M.dutyDay();
      lastDay = day;
      share(day, name);
      var key = M.norm(name);
      var exists = records.some(function (e) { return e.day === day && M.norm(e.name) === key; });
      if (!exists) {
        records.push({ day: day, name: name, firstAt: Date.now() });
        records = records.slice(-3000);
        persist();
      }
    }
    emit();
  }

  /* Album art → one soft colour for the glass. Same sampling idea as the radio
     "album" accent: an 8×8 downscale, skipping near-black/white pixels and
     favouring saturated ones. Fails quietly (no tint) on CORS-less hosts. */
  /* When the art cannot be read (no CORS, grey art), a stable colour from the
     track text keeps the badge tinted the same way every time it plays. */
  function hashTint(seed) {
    var h = 0;
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    var hue = h % 360, sat = 0.55, lig = 0.52;
    var k = function (n) { var a = (n + hue / 30) % 12; var c = sat * Math.min(lig, 1 - lig); return lig - c * Math.max(-1, Math.min(a - 3, 9 - a, 1)); };
    return '#' + [k(0), k(8), k(4)].map(function (v) { return Math.round(v * 255).toString(16).padStart(2, '0'); }).join('');
  }
  function sampleTint(coverUrl, seed) {
    if (!coverUrl || /^data:/.test(coverUrl)) { state.tint = hashTint(seed); emit(); return; }
    var probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.decoding = 'async';
    probe.onload = function () {
      if (seed !== tintSeed) return;
      try {
        var canvas = document.createElement('canvas');
        canvas.width = 8; canvas.height = 8;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(probe, 0, 0, 8, 8);
        var px = ctx.getImageData(0, 0, 8, 8).data;
        var r = 0, g = 0, b = 0, weight = 0;
        for (var i = 0; i < px.length; i += 4) {
          if (px[i + 3] < 180) continue;
          var bright = (px[i] + px[i + 1] + px[i + 2]) / 3;
          if (bright < 28 || bright > 238) continue;
          var sat = Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
          var w = 1 + sat / 80;
          r += px[i] * w; g += px[i + 1] * w; b += px[i + 2] * w; weight += w;
        }
        if (!weight) { state.tint = hashTint(seed); emit(); return; }
        r /= weight; g /= weight; b /= weight;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max < 54 || max - min < 22) { state.tint = hashTint(seed); emit(); return; }
        var lift = max < 150 ? 150 / max : 1;
        state.tint = '#' + [r, g, b].map(function (v) { return Math.min(235, Math.max(48, Math.round(v * lift))).toString(16).padStart(2, '0'); }).join('');
      } catch (_e) { state.tint = ''; }
      emit();
    };
    probe.onerror = function () {
      if (seed !== tintSeed) return;
      // Many cover hosts send no CORS headers; the station logo is the next
      // best colour source before giving up on a tint.
      // radio.js declares npStationLogo with `let`, so it is a global binding, not a window property.
      var logo = typeof npStationLogo === 'string' ? npStationLogo : '';
      if (logo && logo !== coverUrl) { sampleTint(logo, seed); return; }
      state.tint = hashTint(seed); emit();
    };
    probe.src = coverUrl;
  }
  document.addEventListener('rg-now-playing-art', function (e) {
    var d = (e && e.detail) || {};
    state.artist = String(d.artist || '').trim();
    state.title = String(d.title || '').trim();
    state.logo = absolute(typeof npStationLogo === 'string' ? npStationLogo : '');
    state.cover = absolute(String(d.coverUrl || ''));
    var seed = state.artist + '|' + state.title + '|' + (d.coverUrl || '');
    if (seed === tintSeed) { emit(); return; }
    tintSeed = seed;
    emit();
    sampleTint(String(d.coverUrl || ''), seed);
  });

  var attached = false;
  function attach(player) {
    if (attached || !player) return;
    attached = true;
    player.addEventListener('playing', function () { update(true); });
    ['pause', 'ended', 'waiting', 'stalled', 'error', 'emptied'].forEach(function (type) {
      player.addEventListener(type, function () { update(false); });
    });
    player.addEventListener('timeupdate', function () {
      if (player.paused || Date.now() < nextDateCheck) return;
      nextDateCheck = Date.now() + 60000;
      if (M.dutyDay() !== lastDay) update(true);
    });
    update(!player.paused && player.readyState >= 3);
  }

  window.addEventListener('message', async function (e) {
    if (e.origin !== location.origin || e.source !== frameWindow() || !e.data) return;
    if (e.data.type === 'minka-shift-radio-request') emit();
    if (e.data.type === 'minka-shift-radio-control') {
      if (window.loadRadioScripts) await window.loadRadioScripts();
      if (e.data.action === 'toggle') { var play = document.getElementById('playBtn'); if (play) play.click(); }
      if (e.data.action === 'focus' && window.focusRadio) window.focusRadio();
      if (e.data.action === 'stations') { if (window.focusRadio) window.focusRadio(); if (window.toggleMenu) window.toggleMenu(); }
    }
  });
  window.MinkaShiftRadio = { attach: attach, snapshot: function () { return Object.assign({}, state); }, history: function () { return records; } };
})();
