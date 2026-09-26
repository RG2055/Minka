/* /rad Nakts: the radiologist/resident night, in the same night panel the
   radiographers open from the dock (page/night-overlay.js), with its own data.
   - Radiologi and Rezidenti on night duty: 00:00–08:00 split into equal parts
     in the chosen order (↑ / ↓ moves a person).
   - Gultas: two in the kitchen, one in the new admission unit, one in the
     department; each gets one of the night's people.
   Saved to minka-api /api/rad/night (its own radnight:: key: the
   radiographers' night plan is never read or written here). */
(function () {
  'use strict';
  if (window.MINKA_APP !== 'rad') return;
  var content = document.getElementById('nsPanelContent');
  if (!content) return;

  var BEDS = [['virtuve1', 'Virtuve', 'gulta 1'], ['virtuve2', 'Virtuve', 'gulta 2'], ['uznemsana', 'Jaunā uzņemšana', ''], ['nodala', 'Nodaļa', '']];
  var CACHE_KEY = (window.__mkKey || function (k) { return k; })('minkaRadNightV1');
  var plans = {};            // date -> { rd, rs, beds, savedAt }
  var saveTimer = 0;
  try { plans = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (_e) { plans = {}; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function title(n) { return String(n || '').toLowerCase().replace(/(^|[\s-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  function day() { return String(window.__activeDateStr || window.__g_todayStr || '').trim(); }
  function nightOf(store, date) {
    var out = [];
    Object.keys(store || {}).forEach(function (m) {
      (store[m] || []).forEach(function (d) {
        if (!d || d.date !== date) return;
        (d.workers || []).forEach(function (w) {
          var t = String(w.type || '').toUpperCase(), h = parseFloat(w.shift) || 0;
          var night = t ? (t === 'NAKTS' || t === 'DIENNAKTS') : h >= 15;
          if (night && !w.carryOver && out.indexOf(w.name) < 0) out.push(w.name);
        });
      });
    });
    return out;
  }
  // Keep the saved order for people still on the roster, the rest after them.
  function ordered(saved, people) {
    var out = (saved || []).filter(function (n) { return people.indexOf(n) >= 0; });
    people.forEach(function (n) { if (out.indexOf(n) < 0) out.push(n); });
    return out;
  }
  function hhmm(minutes) {
    var h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
  function current() {
    var date = day();
    var rdPeople = nightOf(window.__grafiksStoreRad, date), rsPeople = nightOf(window.__grafiksStore, date);
    var p = plans[date] || {};
    return { date: date, rd: ordered(p.rd, rdPeople), rs: ordered(p.rs, rsPeople), beds: Object.assign({}, p.beds || {}) };
  }

  function group(key, label, list) {
    if (!list.length) return '<section class="rn-group"><h3>' + label + '</h3><p class="rn-empty">Šonakt nav dežūrā.</p></section>';
    var part = 480 / list.length;
    var bar = list.map(function (n, i) {
      return '<span class="rn-seg rn-seg-' + (i % 4) + '" style="flex:1"><b>' + esc(title(n).split(' ')[0]) + '</b><i>' + hhmm(i * part) + '–' + hhmm((i + 1) * part) + '</i></span>';
    }).join('');
    var rows = list.map(function (n, i) {
      return '<li class="rn-row"><span class="rn-dot rn-seg-' + (i % 4) + '" aria-hidden="true"></span>'
        + '<span class="rn-name">' + esc(title(n)) + '</span><span class="rn-time">' + hhmm(i * part) + '–' + hhmm((i + 1) * part) + '</span>'
        + '<span class="rn-move"><button type="button" data-rn-move="-1" data-rn-group="' + key + '" data-rn-i="' + i + '" aria-label="Uz augšu"' + (i ? '' : ' disabled') + '>↑</button>'
        + '<button type="button" data-rn-move="1" data-rn-group="' + key + '" data-rn-i="' + i + '" aria-label="Uz leju"' + (i < list.length - 1 ? '' : ' disabled') + '>↓</button></span></li>';
    }).join('');
    return '<section class="rn-group"><h3>' + label + '<small>00:00–08:00</small></h3><div class="rn-bar">' + bar + '</div><ol class="rn-rows">' + rows + '</ol></section>';
  }

  function render() {
    var c = current();
    var everyone = c.rd.concat(c.rs);
    var beds = BEDS.map(function (b) {
      var who = c.beds[b[0]] && everyone.indexOf(c.beds[b[0]]) >= 0 ? c.beds[b[0]] : '';
      var options = '<option value="">—</option>' + everyone.map(function (n) {
        return '<option value="' + esc(n) + '"' + (n === who ? ' selected' : '') + '>' + esc(title(n)) + '</option>';
      }).join('');
      return '<label class="rn-bed' + (who ? ' is-taken' : '') + '"><span class="rn-bed-art" aria-hidden="true"></span>'
        + '<span class="rn-bed-name"><b>' + b[1] + '</b>' + (b[2] ? '<small>' + b[2] + '</small>' : '') + '</span>'
        + '<select data-rn-bed="' + b[0] + '" aria-label="' + b[1] + ' ' + b[2] + '">' + options + '</select></label>';
    }).join('');
    var date = c.date ? c.date.slice(0, 5) : '';
    content.innerHTML = '<div class="rn-wrap">'
      + '<header class="rn-head"><h2>Nakts<small>' + esc(date) + '</small></h2></header>'
      + '<div class="rn-cols">' + group('rd', 'Radiologi', c.rd) + group('rs', 'Rezidenti', c.rs) + '</div>'
      + '<section class="rn-group rn-beds-wrap"><h3>Gultas</h3><div class="rn-beds">' + beds + '</div></section>'
      + '</div>';
  }

  function remember(c) {
    plans[c.date] = { rd: c.rd, rs: c.rs, beds: c.beds, savedAt: Date.now() };
    // Keep the cache small: the last three weeks of nights.
    var keys = Object.keys(plans).sort(function (a, b) { return a.split('.').reverse().join('').localeCompare(b.split('.').reverse().join('')); });
    while (keys.length > 21) delete plans[keys.shift()];
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(plans)); } catch (_e) {}
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { push(c.date); }, 400);
  }
  function api() { return window.MinkaApi && typeof window.MinkaApi.apiFetch === 'function' && window.MinkaApi.getToken && window.MinkaApi.getToken() ? window.MinkaApi : null; }
  function push(date) {
    var a = api(), p = plans[date];
    if (!a || !p) return;
    a.apiFetch('/api/rad/night', { method: 'POST', json: { date: date, rd: p.rd, rs: p.rs, beds: p.beds, savedAt: p.savedAt } })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (d) { if (d && d.plan && d.plan.savedAt > p.savedAt) { plans[date] = d.plan; render(); } })
      .catch(function () {});
  }
  function pull() {
    var a = api(), date = day();
    if (!a || !date) return;
    a.apiFetch('/api/rad/night?date=' + encodeURIComponent(date)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !Array.isArray(d.rd)) return;
      var local = plans[date];
      if (!local || d.savedAt > local.savedAt) { plans[date] = d; try { localStorage.setItem(CACHE_KEY, JSON.stringify(plans)); } catch (_e) {} render(); }
    }).catch(function () {});
  }

  content.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rn-move]');
    if (!b || b.disabled) return;
    var c = current(), list = c[b.dataset.rnGroup], i = +b.dataset.rnI, j = i + (+b.dataset.rnMove);
    if (!list || j < 0 || j >= list.length) return;
    var t = list[i]; list[i] = list[j]; list[j] = t;
    remember(c); render();
  });
  content.addEventListener('change', function (e) {
    var sel = e.target.closest && e.target.closest('[data-rn-bed]');
    if (!sel) return;
    var c = current(), bed = sel.dataset.rnBed, who = sel.value;
    // One bed per person: taking a bed frees the one they had.
    Object.keys(c.beds).forEach(function (k) { if (who && c.beds[k] === who) delete c.beds[k]; });
    if (who) c.beds[bed] = who; else delete c.beds[bed];
    remember(c); render();
  });

  // The night panel asks __ns to render when it opens (page/night-overlay.js).
  window.__ns = { _render: function () { render(); pull(); } };
  window.addEventListener('daySelected', function () { if (window.__nsOverlayOpen) { render(); pull(); } });
  render();
})();
