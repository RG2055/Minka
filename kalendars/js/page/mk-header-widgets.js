/* Galvene X, tile layout: the extra widgets, the widget picker and editing in the header.
   Fetched by js/page/mk-header-x.js (needWidgets) only when a profile uses an extra widget or the picker is
   opened; styles in css/page/mk-header-widgets.css. Every widget shows something the app already knows (the
   clock, the shift, the calendar, the weather that is already loaded): no requests of its own, and nothing
   loops. Widgets are repainted once a minute with the shift tile, and when new weather arrives. */
(function () {
  'use strict';
  var X = window.MkHeaderX && window.MkHeaderX._w;
  if (!X) return;
  var doc = document, root = doc.documentElement, TILE = X.TILE;
  var MONTHS = ['Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'];

  function shiftPart() {
    var span = X.shiftSpan(), now = Date.now();
    return Math.max(0, Math.min(1, (now - span[0]) / (span[1] - span[0])));
  }
  function weather() { var w = window.__mkBarWeatherData; return w && w.t != null ? w : null; }
  // n dots, the first `done` of them lit (a part of the next one shows as a dimmer dot)
  function dots(n, done) {
    var full = Math.floor(done), html = '';
    for (var i = 0; i < n; i++) html += '<i' + (i < full ? ' class="on"' : i === full && done - full > .05 ? ' class="now"' : '') + '></i>';
    return html;
  }
  function minutes(hm) { var m = /^(\d{1,2}):(\d{2})/.exec(String(hm || '')); return m ? +m[1] * 60 + +m[2] : null; }

  /* id: { name, w: least width in px (as the CSS sizes it), html: the tile's fixed markup, paint(el) } */
  var DEFS = {
    clock: { name: 'Pulkstenis', w: 92,
      html: '<svg class="hxw-clock" viewBox="0 0 60 60" aria-hidden="true"><circle class="f" cx="30" cy="30" r="27"/>'
        + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { return '<path class="' + (i % 3 ? 't' : 't b') + '" d="M30 5.5v' + (i % 3 ? 3 : 5) + '" transform="rotate(' + i * 30 + ' 30 30)"/>'; }).join('')
        + '<path class="h" d="M30 30V16"/><path class="m" d="M30 30V9"/><circle class="p" cx="30" cy="30" r="2"/></svg>',
      paint: function (el) {
        var d = new Date(), m = d.getMinutes(), h = d.getHours() % 12 + m / 60;
        el.querySelector('.h').setAttribute('transform', 'rotate(' + (h * 30).toFixed(1) + ' 30 30)');
        el.querySelector('.m').setAttribute('transform', 'rotate(' + m * 6 + ' 30 30)');
        el.setAttribute('aria-label', 'Pulkstenis ' + X.pad(d.getHours()) + ':' + X.pad(m));
      } },
    dots: { name: 'Stundas', w: 132,
      html: '<span class="hxw-dots hxw-d8"></span><span class="hxw-cap"><span>Maiņa</span><b></b></span>',
      paint: function (el) {
        var p = shiftPart();
        el.querySelector('.hxw-dots').innerHTML = dots(24, p * 24);
        el.querySelector('b').textContent = Math.round(p * 100) + ' %';
        el.setAttribute('aria-label', 'Maiņas stundas: pagājuši ' + Math.round(p * 100) + ' %');
      } },
    ring: { name: 'Gredzens', w: 92,
      html: '<svg class="hxw-ring" viewBox="0 0 60 60" aria-hidden="true"><circle class="bg" cx="30" cy="30" r="24"/><circle class="fg" cx="30" cy="30" r="24" pathLength="100" transform="rotate(-90 30 30)"/></svg><b class="hxw-ring-n"></b>',
      paint: function (el) {
        var p = Math.round(shiftPart() * 100);
        el.querySelector('.fg').setAttribute('stroke-dasharray', p + ' 100');
        el.querySelector('b').textContent = p;
        el.setAttribute('aria-label', 'Maiņa: pagājuši ' + p + ' %');
      } },
    month: { name: 'Mēnesis', w: 144,
      html: '<span class="hxw-dots hxw-d11"></span><span class="hxw-cap"><span></span><b></b></span>',
      paint: function (el) {
        var d = new Date(), days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), done = d.getDate() - 1 + (d.getHours() * 60 + d.getMinutes()) / 1440;
        el.querySelector('.hxw-dots').innerHTML = dots(days, done);
        el.querySelector('.hxw-cap span').textContent = MONTHS[d.getMonth()];
        el.querySelector('b').textContent = Math.round(done / days * 100) + ' %';
        el.setAttribute('aria-label', MONTHS[d.getMonth()] + ': pagājuši ' + Math.round(done / days * 100) + ' %');
      } },
    year: { name: 'Gads', w: 158,
      html: '<span class="hxw-dots hxw-d13"></span><span class="hxw-cap"><span></span><b></b></span>',
      paint: function (el) {
        var d = new Date(), a = new Date(d.getFullYear(), 0, 1), b = new Date(d.getFullYear() + 1, 0, 1), p = (d - a) / (b - a);
        el.querySelector('.hxw-dots').innerHTML = dots(52, p * 52);   // one dot a week
        el.querySelector('.hxw-cap span').textContent = d.getFullYear();
        el.querySelector('b').textContent = Math.round(p * 100) + ' %';
        el.setAttribute('aria-label', d.getFullYear() + '. gads: pagājuši ' + Math.round(p * 100) + ' %');
      } },
    sun: { name: 'Saule', w: 132,
      html: '<svg class="hxw-sun" viewBox="0 0 100 34" aria-hidden="true"><path class="arc" d="M6 31A44 28 0 0 1 94 31"/><path class="hz" d="M2 31h96"/><circle class="s" r="4.5" cx="6" cy="31"/></svg>'
        + '<span class="hxw-cap"><b class="up"></b><b class="dn"></b></span>',
      paint: function (el) {
        var w = weather(), up = w && minutes(w.sunrise), dn = w && minutes(w.sunset), d = new Date(), now = d.getHours() * 60 + d.getMinutes();
        var t = up != null && dn != null && dn > up ? (now - up) / (dn - up) : -1, s = el.querySelector('.s');
        // along the arc while the sun is up; under the horizon line otherwise
        if (t >= 0 && t <= 1) { var a = Math.PI * (1 - t); s.setAttribute('cx', (50 + 44 * Math.cos(a)).toFixed(1)); s.setAttribute('cy', (31 - 28 * Math.sin(a)).toFixed(1)); s.setAttribute('class', 's'); }
        else { s.setAttribute('cx', t < 0 ? 6 : 94); s.setAttribute('cy', 31); s.setAttribute('class', 's is-down'); }
        el.querySelector('.up').textContent = w && w.sunrise ? '↑ ' + w.sunrise : '–';
        el.querySelector('.dn').textContent = w && w.sunset ? '↓ ' + w.sunset : '';
        el.setAttribute('aria-label', w && w.sunrise && w.sunset ? 'Saule lec ' + w.sunrise + ', riet ' + w.sunset : 'Saule: nav datu');
      } },
    hours: { name: 'Prognoze', w: 158,
      html: '<span class="hxw-hours"></span>',
      paint: function (el) {
        var w = weather(), list = (w && w.hours || []).slice(0, 3);
        el.querySelector('.hxw-hours').innerHTML = list.length ? list.map(function (h) {
          return '<span><small>' + X.esc(h.time) + '</small>' + X.wimg(h, 26) + '<b>' + X.esc(h.t) + '°</b></span>';
        }).join('') : '<b>–</b>';
        el.setAttribute('aria-label', list.length ? 'Prognoze: ' + list.map(function (h) { return h.time + ' ' + h.t + '°'; }).join(', ') : 'Prognoze: nav datu');
      } },
    wind: { name: 'Vējš', w: 104,
      html: '<b class="hxw-big"></b><span class="hxw-sub"></span>',
      paint: function (el) {
        var w = weather();
        el.querySelector('b').innerHTML = w && w.wind != null ? X.esc(w.wind) + '<small> m/s</small>' : '–';
        el.querySelector('span').textContent = w && w.feels != null ? 'jūtams ' + w.feels + '°' : '';
        el.setAttribute('aria-label', w && w.wind != null ? 'Vējš ' + w.wind + ' metri sekundē' + (w.feels != null ? ', jūtams ' + w.feels + ' grādi' : '') : 'Vējš: nav datu');
      } }
  };
  Object.keys(DEFS).forEach(function (id) { DEFS[id].html = '<span class="hxw-in" role="img">' + DEFS[id].html + '</span>'; });
  function paint() {
    var top = X.top();
    if (!top) return;
    Object.keys(DEFS).forEach(function (id) {
      var el = top.querySelector('.hx-w-' + id + ' .hxw-in');
      // only the ones standing in the row are repainted
      if (el && !el.parentElement.hasAttribute('data-hxt-off')) DEFS[id].paint(el);
    });
  }

  /* ── The picker and editing in the header ────────────────────────────────
     Rīki → Logrīki. A panel under the header shows every widget as a small picture: a press puts it in the
     row or takes it out. In the row each tile but the tools has a "−" and can be dragged to a new place.
     Any change makes the profile the user's own ("Mana"). Keyboard: Tab reaches the pictures and the "−",
     Alt+← / Alt+→ on a picture moves that widget, Esc ends. */
  var edit = { on: false, bar: null, drag: null };
  var NAME = { date: 'Datums', shift: 'Maiņa', wx: 'Laikapstākļi', news: 'Ziņas', tools: 'Rīki', rd: 'Radiologi' };
  var ICON = { rg: 'person', rd: 'person', date: 'calendar', shift: 'drop', wx: 'sun', news: 'news', tools: 'tune' };
  var ALL = X.core.concat(Object.keys(DEFS));
  function tileName(id) { return DEFS[id] ? DEFS[id].name : id === 'rg' ? ((window.__mkLeftRole && window.__mkLeftRole.many) || 'Radiogrāferi') : NAME[id]; }
  function tileEl(id) { return X.top().querySelector(TILE[id][0]); }
  function tileId(el) { return ALL.filter(function (id) { return el.matches(TILE[id][0]); })[0]; }
  function wantTiles() { return String(root.dataset.headerTiles || '').split(' ').filter(function (id) { return TILE[id]; }); }
  // the tiles in the row now, left to right (a narrow window may have left some of the profile's out)
  function shownTiles() {
    return ALL.filter(function (id) { var el = tileEl(id); return el && !el.hasAttribute('data-hxt-off'); })
      .sort(function (a, b) { return (+tileEl(a).style.order || 0) - (+tileEl(b).style.order || 0); });
  }
  function api() { return window.MinkaHeaderAppearance; }
  function saveTiles(list) { if (api()) api().set({ profile: 'own', ownTiles: list }); }
  function preview(id) {
    if (!DEFS[id]) return '<span class="hxp-ic">' + X.icon(ICON[id]) + '</span>';
    var el = doc.createElement('div');
    el.innerHTML = DEFS[id].html;
    DEFS[id].paint(el.firstChild);
    return '<span class="hxp-live hx-w-' + id + '">' + el.innerHTML + '</span>';
  }
  function sync() {
    if (!edit.on) return;
    var top = X.top();
    if (!top || root.dataset.headerLayout !== 'tiles') { exit(); return; }
    Array.prototype.forEach.call(top.querySelectorAll('.hxt-rm'), function (b) { b.remove(); });
    shownTiles().forEach(function (id, i, all) {
      if (id === 'tools') return;
      var b = doc.createElement('button');
      b.type = 'button'; b.className = 'hxt-rm'; b.dataset.rm = id;
      if (i === all.length - 1) b.setAttribute('data-last', '');
      b.setAttribute('aria-label', 'Noņemt: ' + tileName(id)); b.title = 'Noņemt';
      tileEl(id).appendChild(b);
    });
    var want = wantTiles(), cur = api() ? api().snapshot().profile : '', keep = doc.activeElement && doc.activeElement.dataset ? doc.activeElement.dataset.toggle : '';
    // chosen, but the row has no room for it at this window width
    var shown = shownTiles(), full = want.filter(function (id) { return shown.indexOf(id) < 0; });
    edit.bar.innerHTML = '<div class="hxp-head"><b>Logrīki</b><span class="hxp-profs" role="group" aria-label="Profils">'
      + [['full', 'Pilnā'], ['duty', 'Dežūra'], ['calm', 'Mierīgā'], ['own', 'Mana']].map(function (p) {
        return '<button type="button" data-profile="' + p[0] + '" aria-pressed="' + (p[0] === cur) + '">' + p[1] + '</button>';
      }).join('') + '</span><button type="button" class="hxt-done">Gatavs</button></div>'
      + (full.length ? '<p class="hxp-full" role="status">Rinda ir pilna. Izņem kādu, lai ietilptu pārējie.</p>' : '')
      + '<div class="hxp-grid">' + ALL.map(function (id) {
        var on = want.indexOf(id) >= 0;
        var out = full.indexOf(id) >= 0;
        return '<button type="button" class="hxp-it" data-toggle="' + id + '" aria-pressed="' + on + '"' + (out ? ' data-full' : '') + (id === 'tools' ? ' disabled' : '') + ' aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight" title="' + X.esc(tileName(id) + (out ? ': neietilpst' : '')) + '">'
          + '<span class="hxp-pv">' + preview(id) + '</span><span class="hxp-nm">' + X.esc(tileName(id)) + '</span></button>';
      }).join('') + '</div>';
    var again = keep && edit.bar.querySelector('[data-toggle="' + keep + '"]');
    if (again) again.focus({ preventScroll: true });
  }
  function enter() {
    var top = X.top();
    if (edit.on || !top) return;
    X.closeAll();
    edit.on = true;
    top.classList.add('hxt-edit');
    edit.bar = doc.createElement('div');
    edit.bar.id = 'hxEditBar';
    edit.bar.setAttribute('role', 'dialog');
    edit.bar.setAttribute('aria-label', 'Logrīki');
    doc.getElementById('minkaBarWrap').appendChild(edit.bar);
    edit.bar.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.toggle) { var want = wantTiles(), id = b.dataset.toggle; saveTiles(want.indexOf(id) >= 0 ? want.filter(function (t) { return t !== id; }) : want.concat(id)); }
      else if (b.dataset.profile && api()) api().set({ profile: b.dataset.profile });
      else if (b.classList.contains('hxt-done')) exit();
    });
    // Alt+← / Alt+→ on a widget's picture moves it in the row
    edit.bar.addEventListener('keydown', function (e) {
      var b = e.target.closest && e.target.closest('[data-toggle]'), step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      if (!b || !e.altKey || !step) return;
      var want = wantTiles(), at = want.indexOf(b.dataset.toggle), to = at + step;
      e.preventDefault();
      if (at >= 0 && to >= 0 && to < want.length) { want.splice(to, 0, want.splice(at, 1)[0]); saveTiles(want); }
    });
    sync();
    X.layerSync();
    var done = edit.bar.querySelector('.hxt-done');
    if (done) done.focus({ preventScroll: true });
  }
  function exit() {
    if (!edit.on) return;
    var top = X.top();
    edit.on = false; edit.drag = null;
    if (top) {
      top.classList.remove('hxt-edit');
      Array.prototype.forEach.call(top.querySelectorAll('.hxt-rm'), function (b) { b.remove(); });
    }
    if (edit.bar) edit.bar.remove();
    edit.bar = null;
    X.layerSync();
    if (X.toolsBtn()) X.toolsBtn().focus({ preventScroll: true });
  }
  // Dragging a tile: it follows the pointer, and a neighbour whose middle it passes steps to the other side.
  function editZoom() { return parseFloat(X.top().style.getPropertyValue('--hxt-z')) || 1; }
  function dragDown(e) {
    if (e.button > 0) return;
    var rm = e.target.closest('.hxt-rm');
    if (rm) { e.preventDefault(); saveTiles(wantTiles().filter(function (id) { return id !== rm.dataset.rm; })); return; }
    var el = e.target.closest('.hx-wing, .hx-dateblock, .hx-shift, .hx-wx, .hx-row-feed, .hx-row-tools, .hx-w');
    if (!el || !X.top().contains(el)) return;
    e.preventDefault();
    edit.drag = { el: el, id: tileId(el), x0: e.clientX, order: shownTiles(), moved: false, pid: e.pointerId };
    try { el.setPointerCapture(e.pointerId); } catch (_e) {}
    el.classList.add('is-drag');
  }
  function dragMove(e) {
    var g = edit.drag;
    if (!g || e.pointerId !== g.pid) return;
    var z = editZoom(), dx = (e.clientX - g.x0) / z;
    g.el.style.translate = dx + 'px 0';
    var r = g.el.getBoundingClientRect(), mid = (r.left + r.right) / 2, at = g.order.indexOf(g.id);
    var next = g.order[at + 1] && tileEl(g.order[at + 1]).getBoundingClientRect(), prev = g.order[at - 1] && tileEl(g.order[at - 1]).getBoundingClientRect();
    var to = next && mid > (next.left + next.right) / 2 ? at + 1 : prev && mid < (prev.left + prev.right) / 2 ? at - 1 : at;
    if (to === at) return;
    var other = tileEl(g.order[to]), was = other.getBoundingClientRect().left, base = r.left - dx * z;
    g.order.splice(to, 0, g.order.splice(at, 1)[0]);
    g.order.forEach(function (id, i) { tileEl(id).style.order = String(i); });
    g.moved = true;
    // the dragged tile's own place moved under it: keep it under the pointer
    g.x0 += g.el.getBoundingClientRect().left - dx * z - base;
    g.el.style.translate = (e.clientX - g.x0) / z + 'px 0';
    var now = other.getBoundingClientRect().left;
    if (other.animate && root.dataset.motion !== 'reduced') other.animate([{ translate: (was - now) / z + 'px 0' }, { translate: '0 0' }], { duration: 240, easing: 'cubic-bezier(.2, 0, 0, 1)' });
  }
  function dragUp(e) {
    var g = edit.drag;
    if (!g || e.pointerId !== g.pid) return;
    edit.drag = null;
    var from = g.el.style.translate || '0 0';
    g.el.style.translate = '';
    g.el.classList.remove('is-drag');
    if (g.el.animate && root.dataset.motion !== 'reduced') g.el.animate([{ translate: from }, { translate: '0 0' }], { duration: 240, easing: 'cubic-bezier(.2, 0, 0, 1)' });
    if (!g.moved) return;
    // the profile's tiles a narrow window left out keep their places among the ones that were moved
    var queue = g.order.slice();
    saveTiles(wantTiles().map(function (id) { return g.order.indexOf(id) < 0 ? id : queue.shift(); }));
  }
  function inRow(e) { var top = X.top(); return edit.on && top && top.contains(e.target); }
  doc.addEventListener('pointerdown', function (e) { if (inRow(e)) dragDown(e); }, true);
  doc.addEventListener('pointermove', dragMove, true);
  doc.addEventListener('pointerup', dragUp, true);
  doc.addEventListener('pointercancel', dragUp, true);
  // while editing, a click inside a tile does nothing of its own (no popovers, no day changes)
  doc.addEventListener('click', function (e) {
    if (!inRow(e)) return;
    var rm = e.target.closest('.hxt-rm');
    e.preventDefault(); e.stopPropagation();
    // a "−" pressed with the keyboard (the pointer's press was already taken in dragDown)
    if (rm && e.detail === 0) saveTiles(wantTiles().filter(function (id) { return id !== rm.dataset.rm; }));
  }, true);
  doc.addEventListener('keydown', function (e) { if (edit.on && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); exit(); } }, true);

  X.register({ defs: DEFS, paint: paint, sync: sync, enter: enter, exit: exit });
})();
