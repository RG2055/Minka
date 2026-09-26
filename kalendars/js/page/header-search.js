/* v35 stable dropdown search + reliable news click */
(function(){
  'use strict';
  const input = document.getElementById('minkaBarInput');
  const results = document.getElementById('minkaResults');
  const bar = document.getElementById('minkaBar');
  const aiPanel = document.getElementById('minkaAiPanel');
  const mainPanel = document.querySelector('.main-panel');
  const topRow = document.querySelector('.main-panel .top-row');
  const scrollRow = document.querySelector('.main-panel .scroll-row');
  const shiftProgress = document.getElementById('shift-progress-wrap');
  if (!input || !results || !bar) return;

  window.__MINKA_SEARCH_OWNER = 'v35';

  let t = 0;
  let activeIndex = -1;
  let currentNodes = [];

  function getQuery(){ return String(input.textContent || '').replace(/\u00a0/g, ' ').trim(); }
  function isAiQuery(q){
    const s = String(q || '').trim();
    return !!s && (s[0] === '?' || /^(kur|kas|cik|vai|kāpēc|kapec|kādēļ|kadel|kā |kad |paskaidro|palīdzi|palidzi)/i.test(s));
  }
  const motion = () => window.__mkSearchResults;
  function showResults(){ if (motion()) motion().show(); else results.style.display = 'block'; }
  function hide(){
    if (motion()) motion().hide(); else { results.style.display = 'none'; results.innerHTML = ''; }
    activeIndex = -1;
    currentNodes = [];
    if (mainPanel) mainPanel.classList.remove('mk-search-open');
  }
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  }
  function getWorkers(){
    const seen = new Set();
    const out = [];
    const add = (name, shift, isRd) => {
      const n = String(name || '').trim();
      if (!n) return;
      const key = n.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ name:n, shift:String(shift || ''), isRd:!!isRd });
    };
    const collect = (store, isRd) => {
      try {
        Object.values(store || {}).forEach(months => (months || []).forEach(day => ((day && day.workers) || []).forEach(w => add(w.name, w.shift, isRd))));
      } catch(_e) {}
    };
    collect(window.__grafiksStore, false);
    collect(window.__grafiksStoreRad, true);
    // Scrape any rendered DOM cards (side panel + main grid) as fallback
    document.querySelectorAll('[data-worker]').forEach(el => {
      const isRd = el.classList.contains('card-rd') || !!el.closest('#radiologists-duty') || el.getAttribute('data-type') === 'rd';
      add(el.getAttribute('data-worker'), el.getAttribute('data-shift') || '', isRd);
    });
    return out;
  }
  function score(text, q){
    const src = String(text || '').toLowerCase();
    const needle = String(q || '').toLowerCase();
    if (!needle) return 9999;
    const idx = src.indexOf(needle);
    if (idx < 0) return 9999;
    return idx + Math.max(0, src.length - needle.length) * 0.01;
  }
  function pickData(q){
    const ql = q.toLowerCase();
    const workers = getWorkers()
      .filter(w => (w.name + ' ' + w.shift).toLowerCase().includes(ql))
      .sort((a,b) => score(a.name, q) - score(b.name, q))
      .slice(0, q.length < 2 ? 5 : 8);
    const db = Array.isArray(window.hospitalDatabase) ? window.hospitalDatabase : [];
    const phones = db
      .filter(item => (((item && item.name) || '') + ' ' + ((item && item.cat) || '') + ' ' + ((item && item.sub) || '') + ' ' + ((item && item.phone) || '')).toLowerCase().includes(ql))
      .sort((a,b) => score((a && a.name) || '', q) - score((b && b.name) || '', q))
      .slice(0, q.length < 2 ? 6 : 14);
    return { workers, phones };
  }
  function refreshActive(){
    currentNodes = Array.from(results.querySelectorAll('.search-item, .list-item'));
    currentNodes.forEach((el, idx) => el.classList.toggle('is-active', idx === activeIndex));
  }
  function setActive(idx){
    if (!currentNodes.length) { activeIndex = -1; return; }
    activeIndex = Math.max(0, Math.min(idx, currentNodes.length - 1));
    refreshActive();
    const el = currentNodes[activeIndex];
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block:'nearest' });
  }
  function wire(){
    currentNodes = Array.from(results.querySelectorAll('.search-item, .list-item'));
    currentNodes.forEach((el, idx) => {
      el.addEventListener('mouseenter', () => { activeIndex = idx; refreshActive(); }, { passive:true });
    });
    refreshActive();
  }
  function render(){
    const q = getQuery();
    if (!q || isAiQuery(q)) return hide();
    const { workers, phones } = pickData(q);
    const shortMode = q.length < 2;
    if (!workers.length && !phones.length) {
      if (shortMode) return hide();
    results.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Nav rezultātu par <b>' + esc(q) + '</b></div><div class="search-empty-hint">Mēģini pilnu vārdu, nodaļu vai numuru</div></div>';
      showResults();
      activeIndex = -1;
      currentNodes = [];
      if (mainPanel) mainPanel.classList.add('mk-search-open');
      return;
    }
    let html = '';
    if (workers.length) {
    html += '<div class="search-category">👤 Ieteikumi</div>';
      workers.forEach((w) => {
        const color = w.isRd ? '#ff7c6e' : '#1fe091';
        const role = w.isRd ? 'Radiologs' : 'Radiogrāfers';
        const initials = w.name.split(' ').map(p => p[0] || '').slice(0,2).join('');
        html += '<a class="search-item worker-result-item" href="#" data-kind="worker" data-name="' + esc(w.name) + '" data-shift="' + esc(w.shift) + '">'
          + '<div class="search-item-icon" style="background:' + color + '18;border-color:' + color + '33;color:' + color + ';">' + esc(initials) + '</div>'
          + '<div class="search-item-body"><div class="search-item-title">' + esc(w.name) + '</div><div class="search-item-sub">' + role + '</div></div>'
          + '<div class="search-item-badge" style="color:' + color + ';border-color:' + color + '33;background:' + color + '12;">' + esc(w.shift || '?') + 'h</div>'
          + '</a>';
      });
    }
    if (phones.length) {
    html += '<div class="search-category">📞 Nodaļas / numuri</div>';
      phones.forEach((item) => {
        const name = String((item && item.name) || '');
        const phone = String((item && item.phone) || '');
        const cat = esc((item && item.cat) || '');
        const sub = item && item.sub ? ' ' + esc(item.sub) : '';
    const initials = name.split(' ').map(p => p[0] || '').slice(0,1).join('') || '📞';
        html += '<a class="search-item" href="#" data-kind="phone" data-phone="' + esc(phone) + '">'
          + '<div class="search-item-icon">' + esc(initials) + '</div>'
          + '<div class="search-item-body"><div class="search-item-title">' + esc(name) + '</div><div class="search-item-sub">' + cat + sub + '</div></div>'
          + '<div class="search-item-phone">' + esc(phone) + '</div>'
          + '</a>';
      });
    }
    html += '<div class="search-hint-row">↓ ↑ pārvietošanās Enter atvērt Esc aizvērt</div>';
    results.innerHTML = html;
    showResults();
    activeIndex = -1;
    if (mainPanel) mainPanel.classList.add('mk-search-open');
    wire();
    results.querySelectorAll('[data-kind="worker"]').forEach(el => {
      el.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        const name = el.getAttribute('data-name') || '';
        const shift = el.getAttribute('data-shift') || '';
        hide();
        if (typeof window.showWorkerSchedule === 'function') window.showWorkerSchedule(name, shift);
      });
    });
    results.querySelectorAll('[data-kind="phone"]').forEach(el => {
      el.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        const phone = el.getAttribute('data-phone') || '';
        if (navigator.clipboard && phone) navigator.clipboard.writeText(phone).catch(function(){});
      });
    });
  }
  function schedule(){ clearTimeout(t); t = setTimeout(render, 220); }

  function captureSearchEvent(e){
    if (window.__MINKA_SEARCH_OWNER !== 'v35') return;
    const target = e.target;
    if (target !== input && !(input.contains && input.contains(target))) return;
    e.stopPropagation();
    schedule();
  }

  window.renderSearchResults = schedule;

  // Re-run search automatically once schedule data arrives from async g_init fetch
  document.addEventListener('minka:storeReady', function() {
    var q = getQuery();
    if (q && q.length >= 2 && !isAiQuery(q)) schedule();
  }, { once: true });

  ['input','paste','cut','keyup','focus'].forEach(function(ev){
    document.addEventListener(ev, captureSearchEvent, true);
  });
  input.addEventListener('keydown', function(e){
    if (results.style.display === 'none') return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex <= 0 ? currentNodes.length - 1 : activeIndex - 1); }
    else if (e.key === 'Enter') {
      const target = currentNodes[activeIndex >= 0 ? activeIndex : 0];
      if (target) { e.preventDefault(); target.click(); }
    } else if (e.key === 'Escape') {
      hide();
    }
  }, true);
  document.addEventListener('mousedown', function(e){
    if (!bar.contains(e.target) && !results.contains(e.target)) hide();
  }, true);

  aiPanel.addEventListener('click', function(e){
    const fn = typeof aiPanel.onclick === 'function' ? aiPanel.onclick : null;
    if (!fn) return;
    e.preventDefault();
    e.stopPropagation();
    fn.call(aiPanel, e);
  }, true);
})();
