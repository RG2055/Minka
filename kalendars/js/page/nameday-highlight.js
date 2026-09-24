/* NAMEDAY FIX ï¿½ local JSON only, selected day message, golden highlight */
(function(){
  'use strict';
  const getNamedayDB = () => (window.LATVIAN_NAMEDAYS && typeof window.LATVIAN_NAMEDAYS === 'object' ? window.LATVIAN_NAMEDAYS : {});
  function normalizeDateStr(dateStr){
    const m = String(dateStr || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if(!m) return String(dateStr || '').trim();
    const dd = String(parseInt(m[1],10)).padStart(2,'0');
    const mm = String(parseInt(m[2],10)).padStart(2,'0');
    return dd + '.' + mm + '.' + m[3];
  }


  function normalizeName(v){
    return String(v || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function cleanList(arr){
    return (Array.isArray(arr) ? arr : []).map(v => String(v || '').trim()).filter(v => v && v !== '—' && v !== '–' && v !== '-');
  }

  function keyFromDateStr(dateStr){
    const m = String(dateStr || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return '';
    const dd = String(parseInt(m[1],10)).padStart(2,'0');
    const mm = String(parseInt(m[2],10)).padStart(2,'0');
    return mm + '-' + dd;
  }

  function getSelectedInfo(){
    let st = null;
    try { if (typeof window.__minkaGetSelectedDayState === 'function') st = window.__minkaGetSelectedDayState(); } catch (_e) {}
    let dateStr = st && st.activeDateStr ? String(st.activeDateStr) : '';
    if (!dateStr && window.__activeDateStr) dateStr = String(window.__activeDateStr);
    if (!dateStr) {
      try {
        const cal = window.__minkaCalendarState && typeof window.__minkaCalendarState.getSelectedDayState === 'function'
          ? window.__minkaCalendarState.getSelectedDayState() : null;
        if (cal && cal.activeDateStr) {
          dateStr = String(cal.activeDateStr);
          st = st || cal;
        }
      } catch (_e) {}
    }
    dateStr = normalizeDateStr(dateStr);
    const key = dateStr ? keyFromDateStr(dateStr) : '';
    const names = cleanList(getNamedayDB()[key] || []);
    const now = new Date();
    const todayStr = String(now.getDate()).padStart(2,'0') + '.' + String(now.getMonth()+1).padStart(2,'0') + '.' + now.getFullYear();
    return {
      state: st,
      dateStr,
      key,
      names,
      isToday: dateStr ? (dateStr === todayStr || !!(st && st.isToday)) : true
    };
  }

  function ensureNamedayStyle(){
    if (document.getElementById('minkaNamedayGoldStyle')) return;
    const style = document.createElement('style');
    style.id = 'minkaNamedayGoldStyle';
    style.textContent = `
      .nameday-gold {
        box-shadow: 0 0 0 1px rgba(255, 210, 90, 0.32) inset, 0 0 18px rgba(255, 200, 70, 0.10) !important;
        border-color: rgba(255, 208, 92, 0.55) !important;
        background: linear-gradient(180deg, rgba(255,215,120,0.10), rgba(255,183,0,0.04)) !important;
      }
      .nameday-gold .duty-name,
      .nameday-gold .name-main,
      .nameday-gold.list-row b,
      .nameday-gold .duty-surname,
      .nameday-gold .name-sub {
        color: #ffd76a !important;
        text-shadow: 0 0 10px rgba(255, 205, 86, 0.20);
      }
    `;
    document.head.appendChild(style);
  }

  function applyNamedayHighlight(){
    ensureNamedayStyle();
    const info = getSelectedInfo();
    const namedaySet = new Set(info.names.map(normalizeName));

    document.querySelectorAll('.nameday-gold').forEach(el => el.classList.remove('nameday-gold'));
    if (!namedaySet.size) return info;

    document.querySelectorAll('[data-worker]').forEach(el => {
      const full = String(el.getAttribute('data-worker') || '').trim();
      const first = normalizeName(full.split(/\s+/)[0] || '');
      if (!first) return;
      if (namedaySet.has(first)) el.classList.add('nameday-gold');
    });

    return info;
  }

  let lastAnnounced = '';
  function announceSelectedDayNameday(force){
    const info = applyNamedayHighlight();
    if (!info.names.length) return;
  const text = (info.isToday ? 'Šodien vārdadienu svin ' : 'Šajā dienā vārdadienu svin ') + (info.names.length > 1 ? info.names.slice(0,-1).join(', ') + ' un ' + info.names[info.names.length-1] : info.names[0]) + '.';
    const sig = (info.dateStr || info.key || 'today') + '|' + text;
    if (!force && sig === lastAnnounced) return;
    lastAnnounced = sig;
    /* Message queue handled by v34 only. This block keeps highlight state in sync. */
  }

  function refreshNamedays(forceMsg){
    applyNamedayHighlight();
    if (forceMsg) announceSelectedDayNameday(true);
  }

  window.__minkaApplyNamedays = refreshNamedays;

  window.addEventListener('daySelected', (e) => {
    const date = e && e.detail && e.detail.date ? e.detail.date : null;
    if (date) window.__activeDateStr = normalizeDateStr(date); // ensure sync before highlight
    setTimeout(() => refreshNamedays(true), 180);
    setTimeout(() => applyNamedayHighlight(), 450);
  });

  window.addEventListener('load', () => {
    setTimeout(() => refreshNamedays(false), 600);
    setTimeout(() => applyNamedayHighlight(), 1500);
  });

  let namedayHighlightTimer = 0;
  function queueNamedayHighlight(delay){
    clearTimeout(namedayHighlightTimer);
    namedayHighlightTimer = setTimeout(applyNamedayHighlight, delay || 40);
  }

  if ('MutationObserver' in window) {
    const watchIds = ['radiographers-duty', 'radiologists-duty', 'grafiks-list'];
    watchIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      // Only a rebuilt card list needs another highlight pass. Watching the
      // whole subtree also catches every one-second timer text replacement.
      new MutationObserver(() => queueNamedayHighlight(40)).observe(el, { childList: true });
    });
  }

  setInterval(() => {
    if (!document.hidden) applyNamedayHighlight();
  }, 30000);
})();
