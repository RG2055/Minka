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

  // Walls: a thick dark band with a thin lit edge (the look of the
  // radiographers' rooms), floors with faint planks, labels in small caps.
  function planSvg() {
    function room(x, y, w, h, rim, label, lx, ly) {
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" class="rn-floor"/>'
        + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" class="rn-wall"/>'
        + '<rect x="' + (x + 6) + '" y="' + (y + 6) + '" width="' + (w - 12) + '" height="' + (h - 12) + '" rx="6" class="rn-rim" stroke="' + rim + '"/>'
        + (label ? '<text x="' + (lx == null ? x + 16 : lx) + '" y="' + (ly == null ? y + 26 : ly) + '" class="rn-label">' + label + '</text>' : '');
    }
    function door(x1, y1, x2, y2) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="rn-door"/>'; }
    return '<svg class="rn-plan-svg" viewBox="0 0 1000 560" aria-hidden="true">'
      + '<defs><pattern id="rnPlanks" width="1000" height="14" patternUnits="userSpaceOnUse"><rect width="1000" height="14" fill="#0e131b"/><line x1="0" y1="13.5" x2="1000" y2="13.5" stroke="#161d28" stroke-width="1"/></pattern></defs>'
      // department (with the crowned bed)
      + room(30, 20, 230, 175, '#f5b73f', 'NODAĻA')
      // main room, kitchen along the top wall, coffee machine and fridge on the right
      + room(30, 225, 330, 320, '#5ecbff', 'GALVENĀ ISTABA', 46, 530)
      + '<rect x="70" y="244" width="232" height="30" rx="5" class="rn-counter-svg"/><text x="186" y="264" class="rn-label rn-mid">VIRTUVE</text>'
      + '<rect x="318" y="246" width="26" height="26" rx="5" class="rn-appliance"/><text x="331" y="264" class="rn-icon">☕</text>'
      + '<rect x="316" y="292" width="30" height="58" rx="5" class="rn-appliance"/><text x="331" y="326" class="rn-tiny rn-mid">LEDUS.</text>'
      + door(292, 545, 350, 545)
      // new admission unit
      + room(420, 20, 150, 170, '#ff9fc4', 'REZ./RADIOL.', 434, 44)
      + room(580, 20, 95, 260, '#9aa4b2', 'CT D.STAC.', 590, 44)
      + room(685, 20, 205, 290, '#9aa4b2', 'CT PHILIPS', 700, 44)
      + '<circle cx="788" cy="170" r="62" class="rn-gantry"/><circle cx="788" cy="170" r="30" class="rn-gantry-hole"/><rect x="778" y="170" width="20" height="110" rx="6" class="rn-table"/>'
      + room(420, 200, 150, 70, '#9aa4b2', 'GAITENIS', 434, 242)
      + room(580, 290, 95, 130, '#9aa4b2', '', 0, 0)
      + room(900, 250, 90, 180, '#9aa4b2', 'RTG', 914, 274) + '<text x="914" y="292" class="rn-label">PHILIPS</text>'
      + room(640, 425, 150, 125, '#9aa4b2', 'JAUNĀ UZŅ.', 654, 448)
      + door(560, 150, 560, 185) + door(480, 190, 530, 190) + door(610, 280, 650, 280) + door(685, 290, 685, 330) + door(900, 330, 900, 380) + door(680, 425, 730, 425)
      + '</svg>';
  }

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
    function at(x, y, w) { return 'left:' + (x / 10) + '%;top:' + (y / 5.6) + '%;width:' + (w / 10) + '%'; }
    function placed(key, pose, x, y, w, crown) { return bed(key, pose, crown).replace('class="rn-pbed ' + pose, 'style="' + at(x, y, w) + '" class="rn-pbed ' + pose); }
    var beds = '<div class="rn-map">' + planSvg()
      + placed('nodala', 'is-up', 112, 58, 56, true)
      + placed('virtuve1', 'is-up', 50, 318, 50)
      + placed('virtuve2', 'is-side', 170, 420, 50)
      + placed('uznemsana', 'is-up', 462, 60, 50)
      + '<div class="rn-pbed is-up is-theirs" style="' + at(678, 440, 44) + '"><img src="assets/rooms/bed-neutral-256.webp" alt="" draggable="false"><span class="rn-pbed-who">radiogrāfers</span></div>'
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
