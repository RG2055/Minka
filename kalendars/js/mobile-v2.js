/* MOBILE V2 — DOM palīgs vizuālajam slānim css/mobile-v2.css (tikai
   :root.mk-mobile-v2). Nekādu polling ciklu: viss uz esošajiem notikumiem.
   Ja vizuālo slāni atslēdz (?mv2=0), šis skripts netiek ielādēts, un nekas
   no šejienes nav vajadzīgs funkcionalitātei. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('mk-mobile-v2')) return;

  /* 1. Galvene: trīs ikonu pogas vienā grupā (kalendārs pārnāk no datuma rindas,
        lai dienu lentei paliek visa rinda). Klausītāji uz pogām saglabājas. */
  var inner = document.getElementById('minkaBarInner');
  var miniCal = document.getElementById('miniCalBtn');
  var search = document.getElementById('mkSearchLaunch');
  var menu = document.getElementById('minkaBarMenu');
  if (inner && search && menu && !inner.querySelector('.mv2-actions')) {
    var group = document.createElement('div');
    group.className = 'mv2-actions';
    inner.insertBefore(group, search);
    if (miniCal) group.appendChild(miniCal);
    group.appendChild(search);
    group.appendChild(menu);
  }
  /* Dzimšanas dienas nozīmīte no datuma rindas uz meta rindu (viens datums = viena rinda) */
  var dateBox = document.getElementById('mkSearchDate');
  function placeBday() {
    var bday = document.getElementById('mkBdayBadge');
    var meta = dateBox && dateBox.querySelector('.mk-search-date-meta');
    if (!bday || !meta || bday.parentElement === meta) return;
    var today = document.getElementById('mkSearchToday');
    if (today && today.parentElement === meta) today.insertAdjacentElement('afterend', bday);
    else meta.insertBefore(bday, meta.firstChild);
  }
  placeBday();
  /* galvenes skripts nozīmīti periodiski pārbūvē datuma rindā — pārceļam atkal */
  if (dateBox && typeof MutationObserver === 'function') {
    var bdayQueued = 0;
    new MutationObserver(function () {
      if (bdayQueued) return;
      bdayQueued = requestAnimationFrame(function () { bdayQueued = 0; placeBday(); });
    }).observe(dateBox, { childList: true, subtree: true });
  }

  /* 2. Mēneša izvēle kā pilulis pie dienām: "SEPTEMBRIS" → "Sep" (pilnais
        nosaukums paliek title atribūtā un izvēlnē redzams ir tas pats saīsinājums). */
  var picker = document.getElementById('grafiks-monthPicker');
  function shortMonths() {
    if (!picker) return;
    for (var i = 0; i < picker.options.length; i++) {
      var o = picker.options[i];
      var full = o.getAttribute('data-mv2-full') || String(o.textContent || '').trim();
      if (!full) continue;
      o.setAttribute('data-mv2-full', full);
      var t = full.charAt(0).toUpperCase() + full.slice(1).toLowerCase();
      o.textContent = t.slice(0, 3);
    }
    var sel = picker.options[picker.selectedIndex];
    if (sel) picker.title = sel.getAttribute('data-mv2-full') || '';
  }
  shortMonths();
  if (picker) {
    if (typeof MutationObserver === 'function') new MutationObserver(shortMonths).observe(picker, { childList: true });
    picker.addEventListener('change', shortMonths);
  }

  /* 3. Sekciju virsraksti: "Radiologi" + skaits (CSS ::after no data-mv2-count) */
  var list = document.getElementById('grafiks-list');
  function countSections() {
    if (!list) return;
    var sections = list.querySelectorAll('.cards-section');
    for (var i = 0; i < sections.length; i++) {
      var label = sections[i].querySelector('.cards-section-label');
      var n = sections[i].querySelectorAll('.cards-subgrid > .card:not(.rg-feedback-card)').length;
      if (label) label.setAttribute('data-mv2-count', String(n));
    }
  }
  countSections();
  if (list && typeof MutationObserver === 'function') {
    var queued = 0;
    new MutationObserver(function () {
      if (queued) return;
      queued = requestAnimationFrame(function () { queued = 0; countSections(); });
    }).observe(list, { childList: true, subtree: true });
  }

  /* 4. Aktīvais dienas pilulis lentes vidū (calendar.js centrē tikai uz klikšķa,
        un to dara pirms šī slāņa izkārtojuma — lente tad bija citā platumā) */
  var scroller = document.getElementById('grafiks-scroller');
  function centerActive() {
    if (scroller && scroller.parentElement && scroller.parentElement.classList.contains('mv2-has-week')) return;
    var active = scroller && scroller.querySelector('.pill.active');
    if (!active) return;
    scroller.scrollLeft = active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2;
  }
  requestAnimationFrame(function () { requestAnimationFrame(centerActive); });
  document.addEventListener('minka:monthReady', function () { requestAnimationFrame(centerActive); });
  window.addEventListener('daySelected', function () { requestAnimationFrame(centerActive); });
  window.addEventListener('load', centerActive);

  /* 5. Pēc dienas maiņas saraksts sākas no augšas, ne no iepriekšējās dienas ritinājuma */
  var app = document.getElementById('grafiks-app');
  // Measured in the next frame: daySelected fires before the roster is rebuilt,
  // so reading here forced a layout of the old day that was thrown away at once.
  var topFrame = 0;
  window.addEventListener('daySelected', function () {
    if (!app || !list || topFrame) return;
    topFrame = requestAnimationFrame(function () {
      topFrame = 0;
      var top = list.getBoundingClientRect().top + app.scrollTop - 8;
      if (app.scrollTop > top) app.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    });
  });
  /* 6. Nedēļas josla dienu lentes vietā: 7 dienas (P–Sv) bez sānu ritināšanas.
        Pieskāriens → diena (arī citā mēnesī, window.g_goToDate), bultas vai
        vilkšana pa joslu → tā pati nedēļas diena blakus nedēļā, "Šodien" →
        atpakaļ uz šodienu. Vilkšana pa sarakstu → iepriekšējā/nākamā diena. */
  var row = scroller && scroller.parentElement;
  if (row && !row.querySelector('.mv2-week')) {
    var MONTHS = ['Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'];
    var WD = ['P', 'O', 'T', 'C', 'P', 'S', 'S'];
    var CHEV = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };
    var week = document.createElement('div');
    week.className = 'mv2-week';
    week.innerHTML = '<div class="mv2-week-head"><span class="mv2-week-month"></span>'
      + '<button type="button" class="mv2-week-btn mv2-week-today" hidden>Šodien</button>'
      + '<button type="button" class="mv2-week-btn" data-step="-7" aria-label="Iepriekšējā nedēļa">' + CHEV('M15 6l-6 6 6 6') + '</button>'
      + '<button type="button" class="mv2-week-btn" data-step="7" aria-label="Nākamā nedēļa">' + CHEV('M9 6l6 6-6 6') + '</button></div>'
      + '<div class="mv2-week-days" role="group" aria-label="Nedēļas dienas"></div>';
    row.appendChild(week);
    row.classList.add('mv2-has-week');
    var monthEl = week.querySelector('.mv2-week-month');
    var todayBtn = week.querySelector('.mv2-week-today');
    var daysEl = week.querySelector('.mv2-week-days');
    var dayBtns = [];
    for (var i = 0; i < 7; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mv2-day';
      b.innerHTML = '<small>' + WD[i] + '</small><span></span>';
      daysEl.appendChild(b);
      dayBtns.push(b);
    }
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var toStr = function (d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); };
    var parse = function (s) {
      var m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(s || '').trim());
      return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
    };
    var activeDate = function () { return parse(window.__activeDateStr) || parse(window.__g_todayStr) || new Date(); };
    var shown = '';
    function paintWeek() {
      var cur = activeDate();
      var curStr = toStr(cur);
      var today = window.__g_todayStr || toStr(new Date());
      var mon = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - (cur.getDay() + 6) % 7);
      var key = curStr + '|' + today + '|' + toStr(mon);
      todayBtn.hidden = curStr === today;
      if (key === shown) return;
      shown = key;
      monthEl.textContent = MONTHS[cur.getMonth()] + (cur.getFullYear() !== new Date().getFullYear() ? ' ' + cur.getFullYear() : '');
      dayBtns.forEach(function (btn, idx) {
        var d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + idx);
        var ds = toStr(d);
        var pill = document.getElementById('p-' + ds.replace(/\./g, '-'));
        btn.dataset.date = ds;
        btn.lastChild.textContent = d.getDate();
        btn.classList.toggle('is-active', ds === curStr);
        btn.classList.toggle('is-today', ds === today);
        btn.classList.toggle('is-weekend', idx > 4);
        btn.classList.toggle('is-holiday', !!(pill && pill.classList.contains('holiday-pill')));
        btn.setAttribute('aria-pressed', ds === curStr ? 'true' : 'false');
        btn.setAttribute('aria-label', d.getDate() + '. ' + MONTHS[d.getMonth()].toLowerCase());
      });
    }
    function nope(btn) {
      if (!btn) return;
      btn.classList.remove('is-nope');
      requestAnimationFrame(function () { btn.classList.add('is-nope'); });
      setTimeout(function () { btn.classList.remove('is-nope'); }, 300);
    }
    function go(ds, from) {
      var ok = typeof window.g_goToDate === 'function' ? window.g_goToDate(ds) : false;
      if (ok === false) { nope(from); return false; }
      paintWeek();
      return true;
    }
    function shiftDays(n, from) {
      var d = activeDate();
      d.setDate(d.getDate() + n);
      return go(toStr(d), from);
    }
    daysEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.mv2-day');
      if (btn && btn.dataset.date) go(btn.dataset.date, btn);
    });
    week.querySelectorAll('[data-step]').forEach(function (btn) {
      btn.addEventListener('click', function () { shiftDays(+btn.dataset.step, btn); });
    });
    todayBtn.addEventListener('click', function () { go(window.__g_todayStr || toStr(new Date()), todayBtn); });
    window.addEventListener('daySelected', function () { requestAnimationFrame(paintWeek); });
    document.addEventListener('minka:monthReady', function () { shown = ''; requestAnimationFrame(paintWeek); });
    paintWeek();

    /* Horizontāla vilkšana: pa nedēļas joslu ±7 dienas, pa sarakstu ±1 diena.
       Tikai skaidri horizontāls, ātrs vilciens; vertikālā ritināšana netiek
       aiztikta (pasīvi klausītāji, touch-action: pan-y paliek pārlūkam). */
    function swipe(el, days, slide) {
      if (!el) return;
      var x0 = 0, y0 = 0, t0 = 0, on = false;
      el.addEventListener('touchstart', function (e) {
        on = e.touches.length === 1 && !e.target.closest('input, textarea, select, [contenteditable], .rg-trend, .mk-card-addon, [data-no-swipe]');
        if (!on) return;
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
      }, { passive: true });
      el.addEventListener('touchend', function (e) {
        if (!on) return;
        on = false;
        var t = e.changedTouches[0];
        var dx = t.clientX - x0, dy = t.clientY - y0;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - t0 > 600) return;
        var dir = dx < 0 ? 1 : -1;
        if (shiftDays(dir * days) && slide && slide.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          slide.animate([{ transform: 'translateX(' + (dir * 28) + 'px)', opacity: .35 }, { transform: 'none', opacity: 1 }],
            { duration: 220, easing: 'cubic-bezier(.05, .7, .1, 1)' });
        }
      }, { passive: true });
      el.addEventListener('touchcancel', function () { on = false; }, { passive: true });
    }
    swipe(week, 7, daysEl);
    swipe(list, 1, list);
  }
})();
