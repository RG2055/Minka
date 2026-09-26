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
  // The rooms as they are: two beds in the main room (kitchen), one in the
  // new admission unit, one in the department (the crowned one: a resident's
  // or a doctor's). The radiographer's bed in the admission unit is theirs.
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
  function hash(text) { var h = 0; for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0; return h; }
  // Not planned yet: a random order, the same on every device (seeded by the
  // date), so it is plain that the order is there to be changed.
  // Planned: the saved order for people still on the roster, the rest after.
  function ordered(saved, people, date) {
    if (!saved) return people.slice().sort(function (a, b) { return hash(date + '|' + a) - hash(date + '|' + b); });
    var out = saved.filter(function (n) { return people.indexOf(n) >= 0; });
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
    return { date: date, rd: ordered(p.rd, rdPeople, date + 'rd'), rs: ordered(p.rs, rsPeople, date + 'rs'), beds: Object.assign({}, p.beds || {}) };
  }

  function group(key, label, list) {
    if (!list.length) return '<section class="rn-group"><h3>' + label + '</h3><p class="rn-empty">Šonakt nav dežūrā.</p></section>';
    var part = 480 / list.length;
    var bar = list.map(function (n, i) {
      return '<span class="rn-seg rn-seg-' + (i % 4) + '" style="flex:1"><b>' + esc(title(n).split(' ')[0]) + '</b><i>' + hhmm(i * part) + '–' + hhmm((i + 1) * part) + '</i></span>';
    }).join('');
    var rows = list.map(function (n, i) {
      return '<li class="rn-row" data-rn-group="' + key + '" data-rn-i="' + i + '"><span class="rn-grip" aria-hidden="true"></span><span class="rn-dot rn-seg-' + (i % 4) + '" aria-hidden="true"></span>'
        + '<span class="rn-name">' + esc(title(n)) + '</span><span class="rn-time">' + hhmm(i * part) + '–' + hhmm((i + 1) * part) + '</span>'
        + '<span class="rn-move"><button type="button" data-rn-move="-1" data-rn-group="' + key + '" data-rn-i="' + i + '" aria-label="Uz augšu"' + (i ? '' : ' disabled') + '>↑</button>'
        + '<button type="button" data-rn-move="1" data-rn-group="' + key + '" data-rn-i="' + i + '" aria-label="Uz leju"' + (i < list.length - 1 ? '' : ' disabled') + '>↓</button></span></li>';
    }).join('');
    return '<section class="rn-group"><h3>' + label + '<small>00:00–08:00</small></h3><div class="rn-bar">' + bar + '</div><ol class="rn-rows">' + rows + '</ol></section>';
  }

  // The plan uses the coordinates of the department's own sketch (viewBox
  // 120 0 1230 510): the department top left, the main room with the
  // kitchen in the middle, the new admission unit on the right.
  var VB = { x: 120, y: 0, w: 1230, h: 510 };
  function planSvg() {
    function room(x, y, w, h, rim, label, lx, ly) {
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" class="rn-floor"/>'
        + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" class="rn-wall"/>'
        + '<rect x="' + (x + 5) + '" y="' + (y + 5) + '" width="' + (w - 10) + '" height="' + (h - 10) + '" rx="5" class="rn-rim" stroke="' + rim + '"/>'
        + (label ? '<text x="' + (lx == null ? x + 12 : lx) + '" y="' + (ly == null ? y + 22 : ly) + '" class="rn-label">' + label + '</text>' : '');
    }
    function shape(d, rim) { return '<path d="' + d + '" class="rn-floor"/><path d="' + d + '" class="rn-wall"/><path d="' + d + '" class="rn-rim" stroke="' + rim + '" transform="translate(0 0)"/>'; }
    function door(x1, y1, x2, y2) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="rn-door"/>'; }
    var grey = '#9aa4b2';
    return '<svg class="rn-plan-svg" viewBox="' + VB.x + ' ' + VB.y + ' ' + VB.w + ' ' + VB.h + '" aria-hidden="true">'
      + '<defs><pattern id="rnPlanks" width="1400" height="12" patternUnits="userSpaceOnUse"><rect width="1400" height="12" fill="#0e131b"/><line x1="0" y1="11.5" x2="1400" y2="11.5" stroke="#161d28" stroke-width="1"/></pattern></defs>'
      // department: the crowned bed (a resident's or a doctor's)
      + room(140, 8, 190, 125, '#f5b73f', 'NODAĻA')
      // main room: kitchen along the top, coffee machine and fridge on the right wall, door low on the right
      + room(440, 165, 215, 265, '#5ecbff', 'GALVENĀ ISTABA', 452, 420)
      + '<rect x="462" y="174" width="150" height="26" rx="4" class="rn-counter-svg"/><text x="537" y="192" class="rn-label rn-mid">VIRTUVE</text>'
      + '<rect x="618" y="176" width="26" height="24" rx="4" class="rn-appliance"/><text x="631" y="194" class="rn-icon">☕</text>'
      + '<rect x="618" y="214" width="28" height="54" rx="4" class="rn-appliance"/><text x="632" y="245" class="rn-tiny rn-mid">LEDUS.</text>'
      + door(655, 290, 655, 372)
      // new admission unit
      + room(900, 185, 100, 90, '#ff9fc4', 'REZ./RAD.', 906, 203)
      + room(1000, 185, 90, 145, grey, 'CT D.ST.', 1008, 205)
      + '<rect x="1010" y="214" width="70" height="12" rx="3" class="rn-appliance"/>'
      + room(1090, 185, 110, 215, grey, 'CT PHILIPS', 1098, 205)
      + '<circle cx="1145" cy="290" r="36" class="rn-gantry"/><circle cx="1145" cy="290" r="17" class="rn-gantry-hole"/><rect x="1139" y="290" width="12" height="80" rx="4" class="rn-table"/>'
      + shape('M865 365 H1010 V330 H1090 V425 H865 Z', grey) + '<text x="880" y="400" class="rn-label">GAITENIS</text>'
      + room(1180, 345, 150, 90, grey, 'RTG PHILIPS', 1212, 368)
      + '<rect x="1230" y="380" width="70" height="36" rx="5" class="rn-table"/><circle cx="1265" cy="398" r="9" class="rn-gantry"/>'
      + room(1070, 410, 120, 88, grey, 'JAUNĀ UZŅ.', 1078, 490)
      + door(1000, 238, 1000, 268) + door(1030, 330, 1070, 330) + door(1090, 345, 1090, 390) + door(1200, 360, 1200, 395) + door(1100, 425, 1150, 425) + door(865, 378, 865, 412)
      + '</svg>';
  }
  // A bed's box in the plan's own coordinates → percentages of the map.
  function at(x, y, w) { return 'left:' + ((x - VB.x) / VB.w * 100).toFixed(2) + '%;top:' + ((y - VB.y) / VB.h * 100).toFixed(2) + '%;width:' + (w / VB.w * 100).toFixed(2) + '%'; }

  function render() {
    var c = current();
    var everyone = c.rd.concat(c.rs);
    // Beds drawn in the rooms as they are (the radiographers' room trays and
    // bed pictures), each in the colour of the person sleeping in it.
    var BED_COLOURS = ['cyan', 'pink', 'green', 'yellow', 'orange', 'teal', 'steel', 'copper'];
    function bed(key, pose, crown) {
      var who = c.beds[key] && everyone.indexOf(c.beds[key]) >= 0 ? c.beds[key] : '';
      var colour = who ? BED_COLOURS[everyone.indexOf(who) % BED_COLOURS.length] : 'neutral';
      var options = '<option value="">Brīva</option>' + everyone.map(function (n) {
        return '<option value="' + esc(n) + '"' + (n === who ? ' selected' : '') + '>' + esc(title(n)) + '</option>';
      }).join('');
      var b = BEDS.filter(function (x) { return x[0] === key; })[0];
      return '<div class="rn-pbed ' + pose + (who ? ' is-taken' : '') + '" data-rn-bed-drop="' + key + '">'
        + '<img src="assets/rooms/bed-' + colour + '-256.webp" alt="" draggable="false">'
        + (crown ? '<span class="rn-crown" aria-hidden="true">👑</span>' : '')
        + '<span class="rn-pbed-who">' + (who ? esc(title(who).split(' ')[0]) : 'Brīva') + '</span>'
        + '<select data-rn-bed="' + key + '" aria-label="' + esc(b[1] + (b[2] ? ' ' + b[2] : '')) + '">' + options + '</select></div>';
    }
    // The floor plan as it is (drawn after the department's own sketch):
    // the department with the crowned bed, the main room with the kitchen,
    // and the new admission unit with its CT/RTG rooms. Beds sit on top in
    // viewBox percentages, so they stay in place at every size.
    function placed(key, pose, x, y, w, crown) { return bed(key, pose, crown).replace('class="rn-pbed ' + pose, 'style="' + at(x, y, w) + '" class="rn-pbed ' + pose); }
    var beds = '<div class="rn-map">' + planSvg()
      + placed('nodala', 'is-up', 214, 30, 42, true)
      + placed('virtuve1', 'is-up', 452, 232, 40)
      + placed('virtuve2', 'is-side', 532, 330, 40)
      + placed('uznemsana', 'is-up', 930, 210, 32)
      + '<div class="rn-pbed is-up is-theirs" style="' + at(1112, 430, 30) + '"><img src="assets/rooms/bed-neutral-256.webp" alt="" draggable="false"><span class="rn-pbed-who">radiogr.</span></div>'
      + '</div>';
    var date = c.date ? c.date.slice(0, 5) : '';
    content.innerHTML = '<div class="rn-wrap">'
      + '<header class="rn-head"><h2>Nakts<small>' + esc(date) + '</small></h2></header>'
      + '<div class="rn-cols">' + group('rd', 'Radiologi', c.rd) + group('rs', 'Rezidenti', c.rs) + '</div>'
      + '<section class="rn-group rn-beds-wrap"><h3>Gultas<small>ievelc cilvēku gultā vai uzspied uz gultas</small></h3>' + beds + '</section>'
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
  // Drag a row (mouse or finger) to its place; the rows it passes make room.
  var drag = null;
  content.addEventListener('pointerdown', function (e) {
    var row = e.target.closest && e.target.closest('.rn-row');
    if (!row || e.button !== 0 || e.target.closest('button, select')) return;
    var rows = Array.prototype.slice.call(row.parentNode.children);
    drag = { row: row, rows: rows, from: rows.indexOf(row), to: rows.indexOf(row), y0: e.clientY, x0: e.clientX, bed: null, on: false, id: e.pointerId,
      h: row.getBoundingClientRect().height + 2, mids: rows.map(function (r) { var b = r.getBoundingClientRect(); return b.top + b.height / 2; }) };
  });
  content.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dy = e.clientY - drag.y0;
    if (!drag.on) {
      if (Math.abs(dy) < 6) return;
      drag.on = true;
      try { drag.row.setPointerCapture(e.pointerId); } catch (_e) {}
      drag.row.classList.add('is-dragging');
      drag.row.parentNode.classList.add('is-sorting');
    }
    e.preventDefault();
    drag.row.style.transform = 'translate(' + (e.clientX - drag.x0) + 'px,' + dy + 'px)';
    // new place = how many of the other rows are above the dragged one's middle
    var y = drag.mids[drag.from] + dy;
    drag.to = drag.mids.filter(function (m, i) { return i !== drag.from && m < y; }).length;
    // over a bed: this drop puts the person in that bed
    var over = document.elementsFromPoint(e.clientX, e.clientY).map(function (el) { return el.closest && el.closest('[data-rn-bed-drop]'); }).filter(Boolean)[0] || null;
    if (drag.bed !== over) { if (drag.bed) drag.bed.classList.remove('is-drop'); if (over) over.classList.add('is-drop'); drag.bed = over; }
    drag.rows.forEach(function (r, i) {
      if (r === drag.row) return;
      var shift = drag.from < drag.to && i > drag.from && i <= drag.to ? -drag.h : drag.from > drag.to && i >= drag.to && i < drag.from ? drag.h : 0;
      r.style.transform = shift ? 'translateY(' + shift + 'px)' : '';
    });
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag; drag = null;
    if (!d.on) return;
    var c = current(), list = c[d.row.dataset.rnGroup];
    if (d.bed && list) {                                  // dropped on a bed
      var who = list[d.from], key = d.bed.dataset.rnBedDrop;
      Object.keys(c.beds).forEach(function (k) { if (c.beds[k] === who) delete c.beds[k]; });
      c.beds[key] = who;
      remember(c);
    } else if (list && d.to !== d.from) {
      var moved = list.splice(d.from, 1)[0];
      list.splice(d.to, 0, moved);
      remember(c);
    }
    render();
  }
  content.addEventListener('pointerup', endDrag);
  content.addEventListener('pointercancel', endDrag);

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
