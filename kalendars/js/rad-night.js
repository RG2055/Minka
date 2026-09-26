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

  var BEDS = [['virtuve1', 'Virtuve', 'dīvāns 1'], ['virtuve2', 'Virtuve', 'dīvāns 2'], ['uznemsana', 'Jaunā uzņemšana', 'rezidentu istabiņa'], ['nodala', 'Nodaļa', '']];
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
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" class="rn-floor"/>'
        + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" class="rn-wall"/>'
        + '<rect x="' + (x + 5) + '" y="' + (y + 5) + '" width="' + (w - 10) + '" height="' + (h - 10) + '" rx="1" class="rn-rim" stroke="' + rim + '"/>'
        + (label ? '<text x="' + (lx == null ? x + 12 : lx) + '" y="' + (ly == null ? y + 22 : ly) + '" class="rn-label">' + label + '</text>' : '');
    }
    function shape(d, rim) { return '<path d="' + d + '" class="rn-floor"/><path d="' + d + '" class="rn-wall"/><path d="' + d + '" class="rn-rim" stroke="' + rim + '" transform="translate(0 0)"/>'; }
    function door(x1, y1, x2, y2) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="rn-door"/>'; }
    var grey = '#9aa4b2';
    return '<svg class="rn-plan-svg" viewBox="' + VB.x + ' ' + VB.y + ' ' + VB.w + ' ' + VB.h + '" aria-hidden="true">'
      + '<defs><pattern id="rnPlanks" width="1400" height="12" patternUnits="userSpaceOnUse"><rect width="1400" height="12" fill="#0e131b"/><line x1="0" y1="11.5" x2="1400" y2="11.5" stroke="#161d28" stroke-width="1"/></pattern></defs>'
      // department: the crowned bed (a resident's or a doctor's)
      + room(140, 8, 190, 125, '#f5b73f', 'NODAĻA')
      // main room: kitchen units along the top wall (sink, hob), the Philips
      // coffee machine in the top right corner with the fridge right beside it, a corner sofa in the lower
      // left corner (the two places to sleep), the door low on the right
      + room(440, 165, 215, 265, '#5ecbff', 'GALVENĀ ISTABA', 520, 250)
      + '<rect x="452" y="172" width="158" height="30" rx="3" class="rn-counter-svg"/>'
      + [462, 492, 522, 552, 582].map(function (x) { return '<rect x="' + x + '" y="175" width="26" height="24" rx="2" class="rn-cabinet"/><circle cx="' + (x + 13) + '" cy="196" r="1.6" class="rn-knob"/>'; }).join('')
      + '<rect x="494" y="178" width="22" height="15" rx="5" class="rn-sink"/><circle cx="505" cy="185" r="2" class="rn-knob"/>'
      + [[529, 181], [543, 181], [529, 192], [543, 192]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" class="rn-hob"/>'; }).join('')
      + '<text x="512" y="216" class="rn-tiny rn-mid">VIRTUVE</text>'
      + '<rect x="614" y="172" width="32" height="30" rx="4" class="rn-appliance"/><rect x="623" y="187" width="14" height="8" rx="2" class="rn-cup"/><text x="630" y="182" class="rn-micro rn-mid">PHILIPS</text>'
      + '<rect x="612" y="206" width="34" height="50" rx="4" class="rn-appliance"/><line x1="618" y1="214" x2="618" y2="246" class="rn-handle"/><text x="604" y="268" class="rn-tiny rn-mid">LEDUSSK.</text>'
      + '<path d="M450 255 H486 V380 H600 V422 H450 Z" class="rn-sofa-frame"/><path d="M450 255 H462 V410 H600 V422 H450 Z" class="rn-sofa-back"/>'
      + door(655, 290, 655, 372)
      // New admission unit on one grid: one top line (y 185) for the residents'
      // room, the corridor, the workstation and CT; one bottom line (y 423) for
      // the corridor and RTG; shared walls. The workstation is open to the
      // corridor (no wall), shielded from CT by a lead wall with a door.
      + room(900, 185, 100, 90, '#ff9fc4', 'REZIDENTI', 908, 205)
      + shape('M865 365 H1000 V185 H1124 V336 H1250 V423 H865 Z', grey) + '<text x="880" y="400" class="rn-label">GAITENIS</text>'
      + '<text x="1068" y="205" class="rn-label">DARBA</text><text x="1068" y="221" class="rn-label">ST.</text>'
      + '<rect x="1068" y="232" width="48" height="12" rx="3" class="rn-appliance"/><rect x="1071" y="235" width="18" height="6" rx="1.5" class="rn-screen"/><rect x="1094" y="235" width="18" height="6" rx="1.5" class="rn-screen"/>'
      + room(1124, 185, 126, 151, grey, 'CT PHILIPS', 1134, 205)
      + '<circle cx="1187" cy="262" r="34" class="rn-gantry"/><circle cx="1187" cy="262" r="16" class="rn-gantry-hole"/><rect x="1181" y="262" width="12" height="62" rx="4" class="rn-table"/>'
      + '<line x1="1124" y1="190" x2="1124" y2="286" class="rn-lead"/><line x1="1124" y1="326" x2="1124" y2="331" class="rn-lead"/>'
      + room(1250, 336, 90, 87, grey, 'RTG', 1260, 358) + '<text x="1260" y="375" class="rn-label">PHILIPS</text>'
      + '<rect x="1262" y="384" width="66" height="30" rx="5" class="rn-table"/><circle cx="1295" cy="399" r="8" class="rn-gantry"/>'
      + room(1012, 423, 76, 80, grey, 'RADIOGR.', 1020, 495)
      + door(1000, 238, 1000, 268) + door(1124, 290, 1124, 322) + door(1250, 364, 1250, 404) + door(1034, 423, 1066, 423) + door(865, 378, 865, 412)
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
    // A place on the corner sofa: the cushion is the target, the sleeper's
    // name on it, their colour as the cushion's.
    function sofa(key, x, y, w, h) {
      var who = c.beds[key] && everyone.indexOf(c.beds[key]) >= 0 ? c.beds[key] : '';
      var colour = who ? BED_COLOURS[everyone.indexOf(who) % BED_COLOURS.length] : '';
      var options = '<option value="">Brīva</option>' + everyone.map(function (n) {
        return '<option value="' + esc(n) + '"' + (n === who ? ' selected' : '') + '>' + esc(title(n)) + '</option>';
      }).join('');
      var box = 'left:' + ((x - VB.x) / VB.w * 100).toFixed(2) + '%;top:' + ((y - VB.y) / VB.h * 100).toFixed(2) + '%;width:' + (w / VB.w * 100).toFixed(2) + '%;height:' + (h / VB.h * 100).toFixed(2) + '%';
      return '<div class="rn-sofa' + (w < h ? ' is-tall' : '') + (who ? ' is-taken is-' + colour : '') + '" style="' + box + '" data-rn-bed-drop="' + key + '">'
        + '<span class="rn-pbed-who">' + (who ? esc(title(who).split(' ')[0]) : 'Brīva') + '</span>'
        + '<select data-rn-bed="' + key + '" aria-label="Dīvāns">' + options + '</select></div>';
    }
    var beds = '<div class="rn-map">' + planSvg()
      + placed('nodala', 'is-up', 214, 30, 42, true)
      + sofa('virtuve1', 462, 262, 24, 118)
      + sofa('virtuve2', 486, 380, 114, 30)
      + placed('uznemsana', 'is-up', 930, 210, 32)
      + '<div class="rn-pbed is-up is-theirs" style="' + at(1038, 440, 24) + '"><img src="assets/rooms/bed-neutral-256.webp" alt="" draggable="false"></div>'
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
