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
  window.addEventListener('daySelected', function () {
    if (!app || !list) return;
    var top = list.getBoundingClientRect().top + app.scrollTop - 8;
    if (app.scrollTop > top) app.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  });
})();
