// ------------------------------------------------------------
//  SUN/MOON widget (removed from UI)
//  Stub kept in case legacy code calls updateSunMoon()
// ------------------------------------------------------------
const LAT = 56.9496, LON = 24.1052;
function updateSunMoon(){}
// no interval needed (UI removed)

// ------------------------------------------------------------
//  SEARCH — smart, with history & quick suggestions
// ------------------------------------------------------------
const input = document.getElementById('minkaBarInput');
const resultsArea = document.getElementById('minkaResults');
const clearBtn = document.getElementById('searchClearBtn');
const GRAFIKS_LOADER_MIN_MS = 2600;
window.__minkaGrafiksLoaderStartedAt = window.__minkaGrafiksLoaderStartedAt || Date.now();
window.hospitalDatabase = Array.isArray(window.hospitalDatabase) ? window.hospitalDatabase : [];
var hospitalDatabase = window.hospitalDatabase;

function hideGrafiksLoader(loader) {
  if (!loader) return;
  if (loader.dataset.hideScheduled === '1') return;
  loader.dataset.hideScheduled = '1';
  const elapsed = Date.now() - window.__minkaGrafiksLoaderStartedAt;
  const delay = Math.max(0, GRAFIKS_LOADER_MIN_MS - elapsed);
  setTimeout(() => {
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    setTimeout(() => { loader.style.display = 'none'; }, 820);
  }, delay);
}

const HISTORY_KEY = 'minka_search_history_v2';
const MAX_HISTORY = 8;

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { return []; }
}
function saveHistory(query) {
  const q = (query || '').trim();
  if (!q || q.length < 2) return;
  let h = getHistory().filter(x => x.toLowerCase() !== q.toLowerCase());
  h.unshift(q);
  h = h.slice(0, MAX_HISTORY);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
}
function clearHistoryItem(query) {
  const h = getHistory().filter(x => x !== query);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
}
window.clearAllHistory = function() {
  try { localStorage.removeItem(HISTORY_KEY); } catch(e) {}
  render(input.value);
};

if (typeof hospitalDatabase === 'undefined') {
  resultsArea.innerHTML = `<div style="padding:20px; text-align:center; color:#e15555; font-size:14px;">Kļūda: Fails 'numuri.js' nav atrasts!</div>`;
}

async function loadHospitalDatabaseFromApi() {
  if (!window.MinkaApi || typeof window.MinkaApi.apiFetch !== 'function') return false;
  try {
    const res = await window.MinkaApi.apiFetch('/api/phones');
    if (!res.ok) return false;
    const data = await res.json();
    if (!Array.isArray(data)) return false;
    hospitalDatabase.length = 0;
    data.forEach(item => hospitalDatabase.push(item));
    window.hospitalDatabase = hospitalDatabase;
    if (typeof window.renderSearchResults === 'function') {
      window.renderSearchResults((input && input.textContent) || '');
    }
    return true;
  } catch (e) {
    console.warn('Minka phones API unavailable', e);
    return false;
  }
}

document.addEventListener('minka:auth-ok', function() {
  loadHospitalDatabaseFromApi();
});

window.addEventListener('load', function() {
  if (window.MinkaApi && window.MinkaApi.getToken && window.MinkaApi.getToken()) {
    loadHospitalDatabaseFromApi();
  }
});

function getCatIcon(cat) {
  if (!cat) return '🏥';
  const c = cat.toLowerCase();
  if (c.includes('neatliek')) return '🚨';
  if (c.includes('radioloģ') || c.includes('radiolog')) return '🩻';
  if (c.includes('ķirurg')) return '🩺';
  if (c.includes('kardio')) return '❤️';
  if (c.includes('bērn')) return '👶';
  if (c.includes('laborator')) return '🔬';
  if (c.includes('aptieka') || c.includes('farm')) return '💊';
  if (c.includes('admin')) return '📋';
  return '🏥';
}
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

window.matchesQuery = matchesQuery;
function matchesQuery(item, query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return true;
  const name = String((item && item.name) || '').toLowerCase();
  const cat = String((item && item.cat) || '').toLowerCase();
  const sub = String((item && item.sub) || '').toLowerCase();
  const phone = String((item && item.phone) || '').toLowerCase().replace(/\s+/g, '');
  const compactQ = q.replace(/\s+/g, '');
  const hay = [name, cat, sub, String((item && item.keywords) || '').toLowerCase()].join(' ');
  if (phone.includes(compactQ)) return true;
  if (hay.includes(q)) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every(t => hay.includes(t) || phone.includes(t.replace(/\s+/g, '')));
}


function renderHistorySection(hist) {
  const wrap = document.createElement('div');
  wrap.className = 'search-history-section';
  const label = document.createElement('div');
  label.className = 'section-label section-label-flex';
  label.innerHTML = `<span>🕐 Pēdējie meklējumi</span><button class="history-clear-all" onclick="clearAllHistory()">Dzēst visu</button>`;
  wrap.appendChild(label);
  const row = document.createElement('div');
  row.className = 'history-chips';
  hist.forEach(q => {
    const chip = document.createElement('div');
    chip.className = 'history-chip';
    chip.innerHTML = `<span class="hchip-icon">🕐</span><span class="hchip-text">${escapeHtml(q)}</span><span class="hchip-del" title="Noņemt">✕</span>`;
    chip.querySelector('.hchip-text').onclick = () => { input.textContent = q; input.dispatchEvent(new Event('input', {bubbles:true})); render(q); input.focus(); };
    chip.querySelector('.hchip-del').onclick = (e) => { e.stopPropagation(); clearHistoryItem(q); render(input.textContent); };
    row.appendChild(chip);
  });
  wrap.appendChild(row);
  resultsArea.appendChild(wrap);
}

function displayGroup(title, items, highlight = "") {
  const label = document.createElement("div");
  label.className = "section-label";
  label.innerText = title;
  resultsArea.appendChild(label);
  items.forEach(item => {
    const a = document.createElement("a");
    a.className = "list-item";
    a.href = "javascript:void(0)";
    a.addEventListener('click', function(e2) {
      e2.preventDefault();
      e2.stopPropagation();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(item.phone).catch(() => {});
        const orig = this.querySelector('.item-phone');
        if (orig) { const t = orig.textContent; orig.textContent = '✓ Nokopēts'; setTimeout(() => orig.textContent = t, 1400); }
      }
    });
    let nameHtml = escapeHtml(item.name);
    if (highlight) {
      const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
      nameHtml = nameHtml.replace(regex, "<b>$1</b>");
    }
    a.innerHTML = `
      <div class="item-icon-wrap">${getCatIcon(item.cat)}</div>
      <div class="item-body">
        <span class="item-name">${nameHtml}</span>
        <span class="item-desc">${item.cat}${item.sub ? ' · ' + item.sub : ''}</span>
      </div>
      <div class="item-phone">${item.phone}</div>`;
    a.addEventListener('click', () => saveHistory(item.name));
    resultsArea.appendChild(a);
  });
}

function render(query = "", opts = {}) {
  const val = query.toLowerCase().trim();
  const showEmpty = !!opts.showEmpty;
  if (!resultsArea) return;
  resultsArea.innerHTML = "";

  if (!val) {
    if (!showEmpty) {
      resultsArea.style.display = 'none';
      return;
    }
    resultsArea.style.display = 'block';
    const hist = getHistory();
    if (hist.length > 0) renderHistorySection(hist);
    if (typeof hospitalDatabase !== 'undefined') {
      const trends = hospitalDatabase.filter(i => i.cat === "TRENDI");
      if (trends.length > 0) displayGroup("⭐ Biežāk meklētie", trends);
    }
    return;
  }

  resultsArea.style.display = 'block';
  if (typeof hospitalDatabase === 'undefined') return;
  const filtered = hospitalDatabase.filter(i => matchesQuery(i, val));
  if (filtered.length > 0) {
    const groups = {};
    filtered.forEach(item => {
      const g = item.cat || 'Citi';
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    Object.keys(groups).forEach(cat => displayGroup(cat, groups[cat], val));
  } else {
    resultsArea.innerHTML = `<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Nav rezultātu par "<b>${escapeHtml(query)}</b>"</div><div class="search-empty-hint">Mēģini meklēt pēc nodaļas, vārda vai numura</div></div>`;
  }
}

let _searchDebounce;
// Minka bar owns live input handling; keep only a light Enter-to-save hook here.
if (input) {
  input.addEventListener('keydown', (e) => {
    const q = (input.textContent || '').trim();
    if (e.key === 'Enter' && q.length >= 2) saveHistory(q);
  });
}
// Expose render for Minka bar
window.renderSearchResults = function(q) { render(q||''); };
if (typeof hospitalDatabase !== 'undefined') { resultsArea.style.display = 'none'; resultsArea.innerHTML = ''; }

// ------------------------------------------------------------
//  FULL LIST MODAL
// ------------------------------------------------------------
function toggleFullListModal(ev){
  const modal = document.getElementById('full-list-modal');
  if(!modal) return;
  if(ev) ev.stopPropagation();
  if(modal.classList.contains('open')){
    closeFullListModal();
  } else {
    openFullListModal(ev);
  }
}

// ------------------------------------------------------------
//  FULL LIST MODAL
// ------------------------------------------------------------
function openFullListModal(ev) {
  const modal = document.getElementById('full-list-modal');
  const content = document.getElementById('full-list-content');
  if(!modal || !content) return;
  if(ev) ev.stopPropagation();
  if(modal.classList.contains('open')) return;

  const groups = {};
  hospitalDatabase.forEach(item => {
    const g = item.cat || 'Citi';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });

  function catIcon(cat) {
    if (!cat) return '🏥';
    const c = cat.toLowerCase();
    if (c.includes('neatliek')) return '🚨';
    if (c.includes('radioloģ') || c.includes('radiolog')) return '🩻';
    if (c.includes('ķirurg')) return '🩺';
    if (c.includes('kardio')) return '❤️';
    if (c.includes('bērn')) return '👶';
    if (c.includes('laborator')) return '🔬';
    if (c.includes('aptieka') || c.includes('farm')) return '💊';
    if (c.includes('admin') || c.includes('administr')) return '📋';
    if (c.includes('trendi') || c.includes('biežāk')) return '⭐';
    return '🏥';
  }

  let html = '<div class="fll-grid">';
  Object.keys(groups).sort((a,b) => {
    // Put TRENDI first, then alphabetical
    if (a === 'TRENDI') return -1;
    if (b === 'TRENDI') return 1;
    return a.localeCompare(b, 'lv');
  }).forEach(cat => {
    html += `
      <div class="fll-group">
        <div class="fll-group-header">
          <span class="fll-group-icon">${catIcon(cat)}</span>
          <span class="fll-group-name">${cat}</span>
          <span class="fll-group-count">${groups[cat].length}</span>
        </div>
        <div class="fll-group-items">`;
    groups[cat].forEach(item => {
      html += `
        <a class="fll-item" href="javascript:void(0)" onclick="event.stopPropagation();if(navigator.clipboard){navigator.clipboard.writeText('${item.phone}').catch(()=>{});var s=this.querySelector('.fll-phone-num');if(s){var t=s.textContent;s.textContent='✓';setTimeout(function(){s.textContent=t},1400);}}">
          <div class="fll-item-info">
            <span class="fll-item-name">${item.name}</span>
            ${item.sub ? `<span class="fll-item-sub">${item.sub}</span>` : ''}
          </div>
          <div class="fll-item-phone">
            <span class="fll-phone-icon">📞</span>
            <span class="fll-phone-num">${item.phone}</span>
          </div>
        </a>`;
    });
    html += `</div></div>`;
  });
  html += '</div>';
  content.innerHTML = html;

  modal.classList.add('open');
  setTimeout(() => {
    document.addEventListener('click', outsideFullListClose);
  }, 0);
}

function outsideFullListClose(e) {
  const modal = document.getElementById('full-list-modal');
  if (modal.classList.contains('open') && !modal.contains(e.target)) {
    // Don't close if clicked on the button itself
    const btn = document.querySelector('.full-list-btn');
    if (btn && btn.contains(e.target)) return;
    closeFullListModal();
    document.removeEventListener('click', outsideFullListClose);
  }
}
function closeFullListModal() {
  document.getElementById('full-list-modal').classList.remove('open');
  document.removeEventListener('click', outsideFullListClose);
}

// ------------------------------------------------------------
//  GRAFIKS – full logic (shortened for brevity, but identical to previous)
// ------------------------------------------------------------
(function(){
  const API_URL = ((window.MinkaApi && window.MinkaApi.base) ? window.MinkaApi.base : "") + "/api/schedule";
  const API_CACHE_KEY = "minka_schedule_cache_v2";
  const API_CACHE_TS_KEY = "minka_schedule_cache_ts_v2";
  function readCachedSchedule(){ try{ const raw = localStorage.getItem(API_CACHE_KEY); return raw ? JSON.parse(raw) : null; }catch(e){ return null; } }
  function writeCachedSchedule(data){ try{ localStorage.setItem(API_CACHE_KEY, JSON.stringify(data)); localStorage.setItem(API_CACHE_TS_KEY, String(Date.now())); }catch(e){} }
  let store = {}, storeRad = {}, activeMonth = "", activeDateStr = "", isGridView = true;
  let g_todayStr = null;
  let _nsBarOn = false;
  let g_shiftStopGroups = new Map();
  let g_shiftStopExits = new Map();
  let g_shiftStopsRenderKey = '';
  let g_shiftStopPopoverData = Object.create(null);
  let g_shiftStopPopoverEl = null;
  let g_shiftStopPopoverHideTimer = null;

  function ensureShiftStopPopover() {
    if (g_shiftStopPopoverEl) return g_shiftStopPopoverEl;
    g_shiftStopPopoverEl = document.getElementById('shift-stop-popover');
    if (!g_shiftStopPopoverEl) {
      g_shiftStopPopoverEl = document.createElement('div');
      g_shiftStopPopoverEl.id = 'shift-stop-popover';
      g_shiftStopPopoverEl.hidden = true;
      document.body.appendChild(g_shiftStopPopoverEl);
    }
    return g_shiftStopPopoverEl;
  }

  function hideShiftStopPopover() {
    if (g_shiftStopPopoverHideTimer) {
      clearTimeout(g_shiftStopPopoverHideTimer);
      g_shiftStopPopoverHideTimer = null;
    }
    var pop = ensureShiftStopPopover();
    pop.hidden = true;
    pop.innerHTML = '';
  }

  function scheduleHideShiftStopPopover() {
    if (g_shiftStopPopoverHideTimer) clearTimeout(g_shiftStopPopoverHideTimer);
    g_shiftStopPopoverHideTimer = setTimeout(hideShiftStopPopover, 90);
  }

  function showShiftStopPopover(pin) {
    if (!pin) return;
    if (g_shiftStopPopoverHideTimer) {
      clearTimeout(g_shiftStopPopoverHideTimer);
      g_shiftStopPopoverHideTimer = null;
    }
    var key = pin.getAttribute('data-stop-key');
    if (!key || !g_shiftStopPopoverData[key]) return;
    var payload = g_shiftStopPopoverData[key];
    var pop = ensureShiftStopPopover();
    pop.innerHTML =
      '<div class="shift-stop-popover-head"><div class="shift-stop-popover-time">' + payload.time + '</div></div>' +
      payload.rows.map(function(row) {
        return '<div class="shift-stop-popover-row"><div class="shift-stop-popover-name">' + row.name + '</div>' +
          (row.emoji ? '<div class="shift-stop-popover-emoji">' + row.emoji + '</div>' : '') +
        '</div>';
      }).join('');
    pop.hidden = false;
    var rect = pin.getBoundingClientRect();
    var popRect = pop.getBoundingClientRect();
    var left = rect.left + rect.width / 2 - popRect.width / 2;
    var top = rect.top - popRect.height - 12;
    var minLeft = 12;
    var maxLeft = window.innerWidth - popRect.width - 12;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;
    if (top < 12) top = rect.bottom + 12;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
  const normShift = (s) => String(s || "").toUpperCase().trim();
  const safeKeys = (obj) => (obj && typeof obj === "object") ? Object.keys(obj) : [];

  const isValidShift = (shift) => {
    const s = normShift(shift);
    return s !== 'N' && !s.includes('A');
  };

  function g_findDay(storeObj, dateStr){
    for(const m of safeKeys(storeObj)){
      const arr = storeObj[m];
      if(!Array.isArray(arr)) continue;
      const day = arr.find(e => e && e.date === dateStr);
      if(day) return { month: m, day };
    }
    return null;
  }

  // Normalize month keys like "Aprīlis 26" / "MARTS 26" → "APRĪLIS 2026"
  // Handles both "26" (short year) and "2026" (full year) formats, any case, with/without diacritics
  // Normalize any month key to "MĒNESIS YYYY" format
  // Handles "APRILIS 2026", "Aprilis 26", "Marts 26", mixed case, with/without diacritics
  function normalizeMonthKey(raw) {
    const s = String(raw || '').trim();
    const lower = s.toLowerCase();
    // Ordered by length desc to avoid prefix collisions (septembris before sept, etc)
    const monthPairs = [
      ['februāris','FEBRUĀRIS'],['februaris','FEBRUĀRIS'],
      ['septembris','SEPTEMBRIS'],
      ['novembris','NOVEMBRIS'],
      ['decembris','DECEMBRIS'],
      ['janvāris','JANVĀRIS'],['janvaris','JANVĀRIS'],
      ['oktobris','OKTOBRIS'],
      ['aprīlis','APRĪLIS'],['aprilis','APRĪLIS'],
      ['augusts','AUGUSTS'],
      ['jūnijs','JŪNIJS'],['junijs','JŪNIJS'],
      ['jūlijs','JŪLIJS'],['julijs','JŪLIJS'],
      ['maijs','MAIJS'],
      ['marts','MARTS'],
    ];
    let monthOut = '';
    for (const [k,v] of monthPairs) {
      if (lower.includes(k)) { monthOut = v; break; }
    }
    if (!monthOut) return s;
    // Extract year: 4-digit wins, else 2-digit → "20XX"
    const m4 = s.match(/20\d{2}/);
    if (m4) return monthOut + ' ' + m4[0];
    const m2 = s.match(/(\d{2})/);
    if (m2) return monthOut + ' 20' + m2[1];
    return monthOut;
  }

  // Normalize all store keys so "Aprilis 26" and "APRĪLIS 2026" merge into one
  function normalizeStoreKeys(storeObj) {
    const result = {};
    for (const raw of Object.keys(storeObj || {})) {
      const norm = normalizeMonthKey(raw);
      if (!result[norm]) result[norm] = storeObj[raw];
      else result[norm] = [...result[norm], ...storeObj[raw]];
    }
    return result;
  }

  function getAllMonths() {
    const monthsSet = new Set([...safeKeys(store), ...safeKeys(storeRad)]);

    // De-dupe case-insensitively
    const uniq = new Map();
    for (const raw of monthsSet) {
      const s = String(raw || "").trim();
      if (!s) continue;
      const k = s.toLowerCase();
      if (!uniq.has(k)) uniq.set(k, s);
    }

    const monthMap = {
      "JANVĀRIS": 0, "JANVARIS": 0,
      "FEBRUĀRIS": 1, "FEBRUARIS": 1,
      "MARTS": 2,
      "APRĪLIS": 3, "APRILIS": 3,
      "MAIJS": 4,
      "JŪNIJS": 5, "JUNIJS": 5,
      "JŪLIJS": 6, "JULIJS": 6,
      "AUGUSTS": 7,
      "SEPTEMBRIS": 8,
      "OKTOBRIS": 9,
      "NOVEMBRIS": 10,
      "DECEMBRIS": 11
    };

    const parseKey = (s) => {
      const up = String(s || "").trim().toUpperCase();
      const y = parseInt((up.match(/(20\d{2})/) || [])[1] || "0", 10);
      const mName = Object.keys(monthMap).find(n => up.includes(n)) || "";
      const m = (mName && monthMap[mName] !== undefined) ? monthMap[mName] : 99;
      return { y, m };
    };

    const arr = Array.from(uniq.values());
    arr.sort((a, b) => {
      const pa = parseKey(a);
      const pb = parseKey(b);
      if (pa.y !== pb.y) return pa.y - pb.y;
      return pa.m - pb.m;
    });

    return arr;
  }

  function getMergedDays(month) {
    const daysMap = new Map();
    if (store[month] && Array.isArray(store[month])) {
      store[month].forEach(d => daysMap.set(d.date, { ...d }));
    }
    if (storeRad[month] && Array.isArray(storeRad[month])) {
      storeRad[month].forEach(d => {
        if (daysMap.has(d.date)) {
          // Merge workers arrays instead of overwriting
          const existing = daysMap.get(d.date);
          const merged = [...(existing.workers || []), ...(d.workers || [])];
          daysMap.set(d.date, { ...existing, workers: merged });
        } else {
          daysMap.set(d.date, { ...d });
        }
      });
    }
    return Array.from(daysMap.values()).sort((a,b) => parseInt(a.date) - parseInt(b.date));
  }

  async function g_init(retryCount) {
    retryCount = retryCount || 0;
    const loader = document.getElementById('grafiks-loader');
    try {
      if (loader && retryCount > 0) {
        const loaderText = loader.querySelector('div[style*="letter-spacing"]');
        if (loaderText) loaderText.textContent = `Mēģinu vēlreiz... (${retryCount})`;
      }
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;
      const r = window.MinkaApi
        ? await window.MinkaApi.apiFetch('/api/schedule', { signal: controller ? controller.signal : undefined })
        : await fetch(API_URL, { cache: 'no-store', signal: controller ? controller.signal : undefined });
      if (timeoutId) clearTimeout(timeoutId);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      writeCachedSchedule(d);
      // Our shift "day" changes at 08:00 (not at midnight).
      // Before 08:00, we still consider the active shift to belong to the previous calendar day.
      const _now = new Date();
      const effective = new Date(_now);
      if (effective.getHours() < 8) effective.setDate(effective.getDate() - 1);
      g_todayStr = `${String(effective.getDate()).padStart(2,'0')}.${String(effective.getMonth()+1).padStart(2,'0')}.${effective.getFullYear()}`;
      window.__g_todayStr = g_todayStr;
      store = normalizeStoreKeys((d.radiographers && typeof d.radiographers === "object") ? d.radiographers : (d.allMonths || {}));
      storeRad = normalizeStoreKeys((d.radiologists && typeof d.radiologists === "object") ? d.radiologists : (d.radiologi || {}));

      window.__grafiksStore = store;
      window.__grafiksStoreRad = storeRad;
      // Signal search that worker data is now available
      document.dispatchEvent(new CustomEvent('minka:storeReady'));
      // Push workers index to parent for bolus tracker
      try {
        var _wIdx = {};
        for (var _m in store) {
          var _days = store[_m];
          if (Array.isArray(_days)) _days.forEach(function(day) {
            if (day && day.date && Array.isArray(day.workers)) {
              var seen = {};
              _wIdx[day.date] = day.workers
                .filter(function(w){ return w && w.name && !seen[w.name] && (seen[w.name]=1); })
                .map(function(w){ return String(w.name).trim(); });
            }
          });
        }
        window.parent.postMessage({ type: 'mk_workers_index', data: _wIdx }, '*');
      } catch(_e) {}

      const picker = document.getElementById('grafiks-monthPicker');
      picker.innerHTML = "";
      const months = getAllMonths();
      months.forEach(m => {
        const isCur = d.currentMonthName && m.toLowerCase().includes(d.currentMonthName.split(' ')[0].toLowerCase());
        if (isCur) { activeMonth = m; window.__activeMonth = m; }
        picker.innerHTML += `<option value="${m}" ${isCur ? 'selected' : ''}>${m.toUpperCase()}</option>`;
      });
      if(!activeMonth && months.length > 0) { activeMonth = months[0]; window.__activeMonth = months[0]; }
      const _ldr=document.getElementById('grafiks-loader'); if(_ldr) hideGrafiksLoader(_ldr);
      try { window.parent && window.parent.postMessage({type:'minka:appReady'}, '*'); } catch(_e) {}
      g_renderMonth();
      const todayExists = getMergedDays(activeMonth).some(day => day.date === g_todayStr);
      const firstDate = getMergedDays(activeMonth)[0]?.date || null;
      g_selectDay(todayExists ? g_todayStr : firstDate);
      g_updateLive();
      setInterval(g_updateLive, 1000);
      if (window.__nsKv) window.__nsKv.startPolling();
    } catch(e) {
      console.error('g_init fail:', e);
      const loader = document.getElementById('grafiks-loader');
      const cached = readCachedSchedule();
      if (cached) {
        try {
          const _now = new Date();
          const effective = new Date(_now);
          if (effective.getHours() < 8) effective.setDate(effective.getDate() - 1);
          g_todayStr = `${String(effective.getDate()).padStart(2,'0')}.${String(effective.getMonth()+1).padStart(2,'0')}.${effective.getFullYear()}`;
          window.__g_todayStr = g_todayStr;
          store = normalizeStoreKeys((cached.radiographers && typeof cached.radiographers === "object") ? cached.radiographers : (cached.allMonths || {}));
          storeRad = normalizeStoreKeys((cached.radiologists && typeof cached.radiologists === "object") ? cached.radiologists : (cached.radiologi || {}));
          window.__grafiksStore = store; window.__grafiksStoreRad = storeRad;
          document.dispatchEvent(new CustomEvent('minka:storeReady'));
          const picker = document.getElementById('grafiks-monthPicker');
          picker.innerHTML = '';
          const months = getAllMonths();
          months.forEach(m => {
            const isCur = cached.currentMonthName && m.toLowerCase().includes(cached.currentMonthName.split(' ')[0].toLowerCase());
            if (isCur) { activeMonth = m; window.__activeMonth = m; }
            picker.innerHTML += `<option value="${m}" ${isCur ? 'selected' : ''}>${m.toUpperCase()}</option>`;
          });
          if(!activeMonth && months.length > 0) { activeMonth = months[0]; window.__activeMonth = months[0]; }
          if(loader) hideGrafiksLoader(loader);
          try { window.parent && window.parent.postMessage({type:'minka:appReady'}, '*'); } catch(_e) {}
          g_renderMonth();
          const todayExists = getMergedDays(activeMonth).some(day => day.date === g_todayStr);
          const firstDate = getMergedDays(activeMonth)[0]?.date || null;
          g_selectDay(todayExists ? g_todayStr : firstDate);
          g_updateLive();
          if (!window.__minkaLiveStarted) { window.__minkaLiveStarted = true; setInterval(g_updateLive, 1000); }
          if (window.__nsKv) window.__nsKv.startPolling();
          return;
        } catch(_) {}
      }
      if (retryCount < 2) {
        const delay = 2500 * (retryCount + 1);
        if (loader) { const t = loader.querySelector('[style*="letter-spacing"]'); if(t) t.textContent = 'Savienojuma kļūda, mēģinu... (' + (retryCount+1) + '/2)'; }
        setTimeout(function(){ g_init(retryCount + 1); }, delay);
      } else {
        if (loader) {
          loader.style.pointerEvents = 'all';
          loader.innerHTML = '<div style="text-align:center;padding:24px;max-width:320px"><div style="font-size:22px;margin-bottom:10px">⚠️</div><div style="color:rgba(255,120,80,0.9);font-size:11px;font-weight:700;letter-spacing:.1em">NEVAR IELĀDĒT DATUS</div><div style="font-size:9px;color:rgba(255,255,255,0.4);margin-top:8px;line-height:1.5">Pārbaudiet internetu. Ja grafiks reiz jau bija atvērts šajā pārlūkā, tiks izmantots lokālais kešs.</div><button onclick="g_init(0)" style="margin-top:14px;padding:7px 16px;border:1px solid rgba(255,120,80,0.35);background:rgba(255,80,50,0.1);color:#fff;border-radius:10px;cursor:pointer;font-size:10px;font-weight:700">🔄 Mēģināt vēlreiz</button></div>';
        }
      }
    }
  }

  function g_scrollCal(dir) { document.getElementById('grafiks-scroller').scrollBy({ left: dir * 200, behavior: 'smooth' }); }
  function g_toggleView() { isGridView = !isGridView; document.getElementById('grafiks-viewIcon').innerText = isGridView ? 'format_list_bulleted' : 'grid_view'; g_updateList(); }

  function g_renderMonth() {
    const scroller = document.getElementById('grafiks-scroller');
    scroller.innerHTML = "";

    if (!activeMonth) return;

    // We still compute mergedDays (for logic elsewhere), yet the scroller must show ALL calendar days
    // even if a specific date has no workers (e.g. March 31).
    const mergedDays = getMergedDays(activeMonth);

    // Parse activeMonth like "FEBRUĀRIS 2026" / "MARTS 2026"
    const lower = String(activeMonth || '').toLowerCase().trim();
    const yearMatch = lower.match(/(20\d{2})/);
    let year = yearMatch ? parseInt(yearMatch[1], 10) : (new Date()).getFullYear();

    const monthToken = (lower.split(/\s+/)[0] || '').replace(/[^a-zāčēģīķļņōŗšūž]/g, '');

    const monthMap = {
      'janvāris': 0, 'janvaris': 0,
      'februāris': 1, 'februaris': 1,
      'marts': 2,
      'aprīlis': 3, 'aprilis': 3,
      'maijs': 4,
      'jūnijs': 5, 'junijs': 5,
      'jūlijs': 6, 'julijs': 6,
      'augusts': 7,
      'septembris': 8,
      'oktobris': 9,
      'novembris': 10,
      'decembris': 11
    };

    let monthIndex = monthMap[monthToken];

    // Fallback: derive month/year from first merged day if parsing failed
    if (monthIndex === undefined || monthIndex === null) {
      if (mergedDays.length && mergedDays[0]?.date) {
        const parts = mergedDays[0].date.split('.').map(Number);
        if (parts.length === 3) {
          monthIndex = parts[1] - 1;
          year = parts[2];
        }
      } else {
        const now = new Date();
        monthIndex = now.getMonth();
        year = now.getFullYear();
      }
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${String(d).padStart(2,'0')}.${String(monthIndex+1).padStart(2,'0')}.${year}`;
      const dateObj = new Date(year, monthIndex, d);
      const weekday = dateObj.toLocaleDateString('lv', { weekday: 'narrow' });

      const dow = dateObj.getDay(); // 0=Sun, 6=Sat
      const isWeekend = (dow === 0 || dow === 6);

      // Latvian public holidays (MM-DD format)
      const LV_HOLIDAYS = new Set([
        '01-01','05-01','05-04','06-23','06-24','11-18','12-24','12-25','12-26','12-31',
        '04-03','04-05','04-06' // Lieldienas 2026 (aprox)
      ]);
      const mmdd = String(monthIndex+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const isHoliday = LV_HOLIDAYS.has(mmdd);

      const div = document.createElement('div');
      let pillClass = 'pill';
      if (dateStr === g_todayStr) pillClass += ' today-pill';
      if (isHoliday) pillClass += ' holiday-pill';
      else if (isWeekend) pillClass += ' weekend-pill';
      div.className = pillClass;
      div.id = 'p-' + dateStr.replace(/\./g, '-');
      div.onclick = () => {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
          document.activeElement.blur();
        }
        g_selectDay(dateStr);
      };

      div.innerHTML = `<span class="weekday">${weekday}</span><span>${d}</span>`;
      scroller.appendChild(div);
    }
  }


  function normalizeDateStr(dateStr){
    const m = String(dateStr || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if(!m) return String(dateStr || '').trim();
    const dd = String(parseInt(m[1],10)).padStart(2,'0');
    const mm = String(parseInt(m[2],10)).padStart(2,'0');
    return `${dd}.${mm}.${m[3]}`;
  }

  function g_selectDay(date) {
    date = normalizeDateStr(date);
    if(!date) return;
    window.__minkaUiBusyUntil = Date.now() + 650;
    activeDateStr = date;
    window.__activeDateStr = date;
    try{window.dispatchEvent(new CustomEvent('daySelected', {detail:{date}}))}catch(e){}
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    const safeId = 'p-' + date.replace(/\./g, '-');
    const p = document.getElementById(safeId);
    if(p) { p.classList.add('active'); p.scrollIntoView({inline:'center', behavior:'smooth', block: 'nearest'}); }
    document.getElementById('grafiks-dateTitle').innerText = date;
    g_applyTodayUI();
    g_updateList();
    g_updatePanelsForDate();
    g_adjustDutyNameFontSize();
    try { setTimeout(() => { try { window.__minkaPostAssistantState && window.__minkaPostAssistantState(); } catch(e) {} }, 40); } catch(e) {}
    try { setTimeout(() => { try { window.__minkaPostAssistantState && window.__minkaPostAssistantState(); } catch(e) {} }, 280); } catch(e) {}
    try { setTimeout(() => { try { window.__minkaPostAssistantState && window.__minkaPostAssistantState(); } catch(e) {} }, 900); } catch(e) {}

    const isToday = (date === g_todayStr);
    const nextBoxes = document.querySelectorAll('.next-box');
    nextBoxes.forEach(box => {
      if (isToday) box.classList.remove('hidden');
      else box.classList.add('hidden');
    });
  }

  function g_applyTodayUI(){
    const title = document.getElementById('grafiks-dateTitle');
    const tag = document.getElementById('grafiks-todayTag');
    const isToday = !!(g_todayStr && activeDateStr === g_todayStr);
    if(title) title.classList.toggle('is-today', isToday);
    if(tag) tag.hidden = !isToday;
  }

  function createDateFromDateTime(dateStr, timeStr) {
    const [day, month, year] = dateStr.split('.').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month-1, day, hours, minutes, 0, 0);
  }


  // Compute real shift end — if endTime == startTime or end <= start,
  // use shift duration (hours) instead of blindly adding +1 day.
  function getShiftEnd(worker, dateStr) {
    if (!worker.startTime || !worker.endTime) return null;
    const start = createDateFromDateTime(dateStr, worker.startTime);
    let end = createDateFromDateTime(dateStr, worker.endTime);
    const shiftHours = parseFloat(String(worker.shift || '').replace(/[^0-9.]/g, '')) || 0;
    if (end <= start) {
      // end is next day (night shift) or bad data
      if (shiftHours > 0 && shiftHours < 24) {
        end = new Date(start.getTime() + shiftHours * 3600000);
      } else {
        end.setDate(end.getDate() + 1);
      }
    } else if (shiftHours > 0 && shiftHours <= 12) {
      // Validate: if actual end-start gap > shift hours, trust shift hours
      // e.g. Ance has shift=8h but endTime=20:00 startTime=08:00 (12h gap) — use 8h
      const actualHours = (end - start) / 3600000;
      if (actualHours > shiftHours + 0.5) {
        end = new Date(start.getTime() + shiftHours * 3600000);
      }
    }
    return end;
  }

  function isWorkerActive(worker, dateStr, now) {
    if (!worker.startTime || !worker.endTime) return false;
    const start = createDateFromDateTime(dateStr, worker.startTime);
    const end = getShiftEnd(worker, dateStr);
    if (!end) return false;
    return now >= start && now < end;
  }

  // Shift has completely ended (end time is in the past)
  function isWorkerShiftDone(worker, dateStr, now) {
    if (!worker.startTime || !worker.endTime) return false;
    const end = getShiftEnd(worker, dateStr);
    if (!end) return false;
    return now >= end;
  }

  function getRemainingMs(worker, dateStr, now) {
    if (!worker.startTime || !worker.endTime) return 0;
    const end = getShiftEnd(worker, dateStr);
    if (!end) return 0;
    return end - now;
  }

  function formatRemainingHHMMSS(ms) {
    if (ms < 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  }

  function getWorkersForDateWithDate(storeObj, dateStr) {
    const day = g_findDay(storeObj, dateStr)?.day;
    if (!day || !Array.isArray(day.workers)) return [];
    // deduplicate by worker name (same worker cannot appear twice on same day)
    const seen = new Set();
    return day.workers
      .filter(w => isValidShift(w.shift))
      .filter(w => {
        if (seen.has(w.name)) return false;
        seen.add(w.name);
        return true;
      })
      .map(w => ({ ...w, date: dateStr }));
  }

  function getPrevDateStr(dateStr) {
    const [d, m, y] = dateStr.split('.').map(Number);
    const prevDate = new Date(y, m-1, d-1);
    return `${prevDate.getDate().toString().padStart(2,'0')}.${(prevDate.getMonth()+1).toString().padStart(2,'0')}.${prevDate.getFullYear()}`;
  }

  function parseShiftHours(shiftValue) {
    const txt = String(shiftValue || '').trim();
    if (!txt) return 0;
    const m = txt.match(/(\d+(?:[.,]\d+)?)/);
    if (!m) return 0;
    return Math.round(parseFloat(m[1].replace(',', '.')) || 0);
  }

  const NIGHT_SPLIT_STORE_KEY = 'minkaNightSplitByDateV1';
  const NIGHT_SPLIT_ENDS = [
    { h: 7, m: 20, l: '07:20' },
    { h: 7, m: 30, l: '07:30' },
    { h: 8, m: 0, l: '08:00' }
  ];
  const NIGHT_SPLIT_COLORS = [
    { bg:'rgba(255,140,0,0.72)', accent:'#ffa032' },
    { bg:'rgba(0,170,255,0.68)', accent:'#1ec8ff' },
    { bg:'rgba(160,0,255,0.68)', accent:'#be50ff' },
    { bg:'rgba(0,220,80,0.68)', accent:'#00f064' },
    { bg:'rgba(255,30,90,0.68)', accent:'#ff3c6e' },
    { bg:'rgba(240,210,0,0.68)', accent:'#ffe628' },
    { bg:'rgba(0,210,190,0.68)', accent:'#00ebd7' },
    { bg:'rgba(255,80,200,0.68)', accent:'#ff6edc' }
  ];

  function getNightSplitSavedMap() {
    try {
      const raw = localStorage.getItem(NIGHT_SPLIT_STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch(_e) {
      return {};
    }
  }

  function getNightSplitColorOrder(workers) {
    const used = [];
    return (Array.isArray(workers) ? workers : []).map(function(w) {
      const key = String((w && w.name) || '').trim().toUpperCase();
      let h = 0;
      for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0x7fffffff;
      let idx = h % NIGHT_SPLIT_COLORS.length;
      for (let tries = 0; tries < NIGHT_SPLIT_COLORS.length; tries++) {
        if (used.indexOf(idx) === -1) break;
        idx = (idx + 1) % NIGHT_SPLIT_COLORS.length;
      }
      used.push(idx);
      return NIGHT_SPLIT_COLORS[idx];
    });
  }

  function getNightSplitWorkersForDate(dateStr) {
    const out = [];
    const seen = new Set();
    const stores = [store];
    stores.forEach(function(src) {
      Object.keys(src || {}).forEach(function(month) {
        const days = src[month];
        if (!Array.isArray(days)) return;
        days.forEach(function(day) {
          if (!day || day.date !== dateStr || !Array.isArray(day.workers)) return;
          day.workers.forEach(function(w) {
            const name = String((w && w.name) || '').trim();
            if (!name || seen.has(name)) return;
            const sh = String((w && w.shift) || '').toUpperCase().trim();
            if (sh === 'N' || sh.indexOf('A') >= 0 || sh === 'B' || !sh || sh === '0') return;
            const hrs = w.hours || parseInt(sh, 10) || 0;
            if (hrs < 12) return;
            const sH = w.startTime ? parseInt(String(w.startTime).split(':')[0], 10) : -1;
            const tp = String((w && w.type) || '').toUpperCase();
            let night = hrs >= 24 || tp === 'NAKTS' || tp === 'DIENNAKTS';
            if (!night && sH >= 0 && (sH >= 18 || sH <= 5)) night = true;
            if (!night && sH === -1 && hrs >= 12) night = true;
            if (!night) return;
            let fatigue = 50;
            try {
              if (window.__fatigue && typeof window.__fatigue.calculateFatigue === 'function') {
                const f = window.__fatigue.calculateFatigue(name);
                if (f && typeof f.score === 'number') fatigue = f.score;
              }
            } catch(_e) {}
            seen.add(name);
            out.push(Object.assign({}, w, { name, fs: fatigue }));
          });
        });
      });
    });
    out.sort(function(a, b) { return (b.fs || 0) - (a.fs || 0) || String(a.name).localeCompare(String(b.name)); });
    return out;
  }

  function getNightSplitPlan(dateStr) {
    const workers = getNightSplitWorkersForDate(dateStr);
    if (!workers.length) return null;

    const saved = getNightSplitSavedMap()[dateStr];
    const order = Array.isArray(saved && saved.order) ? saved.order.map(function(v){ return String(v || '').trim(); }).filter(Boolean) : [];
    const startHour = typeof (saved && saved.sh) === 'number' && isFinite(saved.sh) ? saved.sh : 0;
    const endOpt = NIGHT_SPLIT_ENDS[(typeof (saved && saved.ei) === 'number' && NIGHT_SPLIT_ENDS[saved.ei]) ? saved.ei : 2];

    let ordered = workers.slice();
    if (order.length) {
      const byName = new Map();
      ordered.forEach(function(w) { byName.set(String(w.name).trim(), w); });
      const next = [];
      order.forEach(function(name) {
        if (byName.has(name)) {
          next.push(byName.get(name));
          byName.delete(name);
        }
      });
      ordered = next.concat(Array.from(byName.values()));
    }

    const [dd, mm, yy] = String(dateStr || '').split('.').map(Number);
    if (!dd || !mm || !yy) return null;
    const start = new Date(yy, mm - 1, dd, 0, 0, 0, 0);
    if (startHour < 8) start.setDate(start.getDate() + 1);
    const wholeMinutes = Math.round(startHour * 60);
    start.setMinutes(wholeMinutes);
    const end = new Date(start);
    end.setHours(endOpt.h, endOpt.m, 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1);

    const totalMin = Math.max(1, Math.round((end - start) / 60000));
    const n = ordered.length;
    const base = Math.floor(totalMin / n);
    const rem = totalMin % n;
    let cursor = new Date(start);
    const resolvedColors = getNightSplitColorOrder(ordered);
    const segments = ordered.map(function(w, index) {
      const segStart = new Date(cursor);
      const len = base + (index < rem ? 1 : 0);
      cursor = new Date(cursor.getTime() + len * 60000);
      const segEnd = new Date(cursor);
      return {
        worker: w,
        name: String(w.name || ''),
        start: segStart,
        end: segEnd,
        color: resolvedColors[index] || NIGHT_SPLIT_COLORS[index % NIGHT_SPLIT_COLORS.length]
      };
    });

    return { start, end, segments };
  }

  function buildNightSplitGradient(segments, start, end) {
    if (!Array.isArray(segments) || !segments.length || !(start instanceof Date) || !(end instanceof Date)) return '';
    const total = Math.max(1, end - start);
    const stops = ['transparent 0%'];
    let cursorPct = 0;
    segments.forEach(function(seg) {
      const from = Math.max(0, Math.min(100, ((seg.start - start) / total) * 100));
      const to = Math.max(0, Math.min(100, ((seg.end - start) / total) * 100));
      if (from > cursorPct) {
        stops.push('transparent ' + from.toFixed(3) + '%');
      }
      stops.push(seg.color.bg + ' ' + from.toFixed(3) + '%');
      stops.push(seg.color.bg + ' ' + to.toFixed(3) + '%');
      cursorPct = to;
    });
    if (cursorPct < 100) {
      stops.push('transparent ' + cursorPct.toFixed(3) + '%');
      stops.push('transparent 100%');
    }
    return 'linear-gradient(90deg, ' + stops.join(', ') + ')';
  }

  function buildNightSplitLabels(segments, start, end) {
    if (!Array.isArray(segments) || !segments.length || !(start instanceof Date) || !(end instanceof Date)) return '';
    const total = Math.max(1, end - start);
    return segments.map(function(seg) {
      const from = Math.max(0, Math.min(100, ((seg.start - start) / total) * 100));
      const to = Math.max(0, Math.min(100, ((seg.end - start) / total) * 100));
      const mid = from + ((to - from) / 2);
      const firstName = String(seg.name || '').split(/\s+/)[0] || '—';
      const widthPct = Math.max(0, to - from);
      const cls = widthPct < 10 ? ' is-hidden' : (widthPct < 16 ? ' is-tight' : '');
      return '<span class="shift-progress-seg-label' + cls + '" style="left:' + mid.toFixed(3) + '%;--seg-color:' + seg.color.accent + '">' + firstName + '</span>';
    }).join('');
  }

  function buildNightSplitMeta(segments, start, end, now) {
    // Names above bar + draggable dividers
    if (!Array.isArray(segments) || !segments.length || !(start instanceof Date) || !(end instanceof Date)) return '';
    const total = Math.max(1, end - start);
    const parts = [];
    segments.forEach(function(seg, index) {
      const from = Math.max(0, Math.min(100, ((seg.start - start) / total) * 100));
      const to   = Math.max(0, Math.min(100, ((seg.end   - start) / total) * 100));
      const mid  = from + (to - from) / 2;
      const anchor = Math.max(4, Math.min(96, mid));
      const firstName = String(seg.name || '').split(/\s+/)[0] || '–';
      const widthPct  = Math.max(0, to - from);
      const isCurrent = now instanceof Date && now >= seg.start && now < seg.end;
      const isPast    = now instanceof Date && now >= seg.end;
      let cls = widthPct < 7 ? ' is-hidden' : '';
      if (to > 96) cls += ' is-end'; else if (from < 4) cls += ' is-start';
      if (isCurrent) cls += ' is-current';
      if (isPast) cls += ' is-past';
      parts.push(
        '<span class="shift-progress-seg-label' + cls + '"' +
          ' style="left:' + anchor.toFixed(2) + '%;--seg-color:' + seg.color.accent + '"' +
          ' data-seg-name="' + firstName + '" data-seg-idx="' + index + '">' +
          firstName +
        '</span>'
      );
      if (index < segments.length - 1) {
        parts.push('<span class="shift-progress-seg-divider" style="left:' + to.toFixed(2) + '%" data-div-idx="' + index + '"></span>');
      }
    });
    return parts.join('');
  }

  function buildNightSplitTimesBelow(segments, start, end) {
    // Time labels below bar (start time of each segment + end of last)
    if (!Array.isArray(segments) || !segments.length || !(start instanceof Date) || !(end instanceof Date)) return '';
    const total = Math.max(1, end - start);
    const parts = [];
    segments.forEach(function(seg, index) {
      const from = Math.max(0, Math.min(100, ((seg.start - start) / total) * 100));
      const to   = Math.max(0, Math.min(100, ((seg.end   - start) / total) * 100));
      const fmt  = function(d) { return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };
      const clsFrom = from < 2 ? ' is-start' : '';
      parts.push('<span class="shift-progress-time-label' + clsFrom + '" style="left:' + from.toFixed(2) + '%">' + fmt(seg.start) + '</span>');
      if (index === segments.length - 1) {
        const clsTo = to > 98 ? ' is-end' : '';
        parts.push('<span class="shift-progress-time-label' + clsTo + '" style="left:' + to.toFixed(2) + '%">' + fmt(seg.end) + '</span>');
      }
    });
    return parts.join('');
  }

  function saveNightSplitOrder(dateStr, newOrder) {
    try {
      const map = getNightSplitSavedMap();
      const saved = map[dateStr] || {};
      map[dateStr] = { sh: saved.sh || 0, ei: saved.ei !== undefined ? saved.ei : 2, order: newOrder, savedAt: Date.now() };
      localStorage.setItem(NIGHT_SPLIT_STORE_KEY, JSON.stringify(map));
      if (window.__nsKv) window.__nsKv.push(dateStr);
    } catch(e) {}
  }

  // ---------------------------------------------------------------------------
  // Night-split KV sync — push/pull via Cloudflare Worker for cross-device share
  // ---------------------------------------------------------------------------
  window.__nsKv = (function() {
    var STORE_KEY = 'minkaNightSplitByDateV1';
    var _bc = null;
    var _polling = false;
    try { _bc = new BroadcastChannel('minka-ns-sync'); } catch(e) {}

    function _api() {
      return (window.MinkaApi && typeof window.MinkaApi.apiFetch === 'function' && window.MinkaApi.getToken())
        ? window.MinkaApi : null;
    }
    function _activeDateStr() {
      return String(window.__activeDateStr || window.__todayDateStr || '').trim();
    }

    function push(dateStr) {
      var api = _api();
      if (!api || !dateStr) return;
      try {
        var map = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        var data = map[dateStr];
        if (!data) return;
        var payload = { date: dateStr, order: data.order || [], sh: data.sh || 0, ei: data.ei !== undefined ? data.ei : 2, savedAt: data.savedAt || Date.now() };
        api.apiFetch('/api/ns-order', { method: 'POST', json: payload }).catch(function(){});
        if (_bc) try { _bc.postMessage(payload); } catch(_e) {}
      } catch(e) {}
    }

    function pull(dateStr, cb) {
      var api = _api();
      if (!api || !dateStr) return;
      api.apiFetch('/api/ns-order?date=' + encodeURIComponent(dateStr))
        .then(function(r) { return r.json(); })
        .then(function(remote) {
          if (!remote || !Array.isArray(remote.order) || !remote.order.length) return;
          var map = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
          var local = map[dateStr];
          if (!local || !local.savedAt || (remote.savedAt && remote.savedAt > local.savedAt)) {
            map[dateStr] = { sh: remote.sh || 0, ei: remote.ei !== undefined ? remote.ei : 2, order: remote.order, savedAt: remote.savedAt || Date.now() };
            localStorage.setItem(STORE_KEY, JSON.stringify(map));
            if (cb) cb();
          }
        }).catch(function(){});
    }

    function startPolling() {
      if (_polling) return;
      _polling = true;
      if (_bc) {
        _bc.onmessage = function(evt) {
          try {
            var p = evt.data;
            if (!p || !p.date || !Array.isArray(p.order)) return;
            var map = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            var local = map[p.date];
            if (!local || !local.savedAt || (p.savedAt && p.savedAt > local.savedAt)) {
              map[p.date] = { sh: p.sh || 0, ei: p.ei !== undefined ? p.ei : 2, order: p.order, savedAt: p.savedAt || Date.now() };
              localStorage.setItem(STORE_KEY, JSON.stringify(map));
              if (p.date === _activeDateStr()) {
                try { if (window.__ns && window.__ns._update) window.__ns._update(); } catch(_e) {}
                try { if (window.__nsBarSync) window.__nsBarSync(); } catch(_e) {}
              }
            }
          } catch(_e) {}
        };
      }
      // Initial pull
      var d0 = _activeDateStr();
      if (d0) pull(d0, function() {
        try { if (window.__ns && window.__ns._update) window.__ns._update(); } catch(_e) {}
        try { if (window.__nsBarSync) window.__nsBarSync(); } catch(_e) {}
      });
      // 30s cross-device poll
      setInterval(function() {
        var d = _activeDateStr();
        if (!d) return;
        pull(d, function() {
          try { if (window.__ns && window.__ns._update) window.__ns._update(); } catch(_e) {}
          try { if (window.__nsBarSync) window.__nsBarSync(); } catch(_e) {}
        });
      }, 30000);
    }

    return { push: push, pull: pull, startPolling: startPolling };
  })();

  function playNightToggleSound(on) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      // ON:  soft A3→C4→E4 — low, calm, ascending like distant wind chimes
      // OFF: gentle E4→A3 descend — slow, quiet fade
      var notes = on ? [220.00, 261.63, 329.63] : [329.63, 220.00];
      var spacing = on ? 0.22 : 0.28;
      notes.forEach(function(freq, i) {
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        // slight shimmer via a second detuned oscillator for warmth
        var osc2  = ctx.createOscillator();
        var gain2 = ctx.createGain();
        var t0 = ctx.currentTime + i * spacing;
        var peak = on ? 0.06 : 0.045;
        var attack = 0.14;
        var release = on ? 2.8 : 2.0;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(peak, t0 + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + attack + release + 0.1);

        // shimmer layer — 2 Hz above, very quiet
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq + 2, t0);
        gain2.gain.setValueAtTime(0, t0);
        gain2.gain.linearRampToValueAtTime(peak * 0.25, t0 + attack + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(t0);
        osc2.stop(t0 + attack + release + 0.1);
      });
    } catch(e) {}
  }

  function initNsBarDrag(segmentsEl) {
    if (!segmentsEl || segmentsEl._nsDragWired) return;
    segmentsEl._nsDragWired = true;

    var dragging = null, overLabel = null, ghost = null, rafId = null;
    var mx = 0, my = 0;

    function getLabel(el) { return el && el.closest ? el.closest('.shift-progress-seg-label') : null; }

    // Same sounds as the nakts bottom panel
    function _tone(freq,dur,type,vol){try{var c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type=type||'triangle';o.frequency.value=freq;g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(vol||0.1,c.currentTime+0.01);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);o.start(c.currentTime);o.stop(c.currentTime+dur);}catch(e){}}
    function sndBarPickup(){ _tone(220,0.09,'triangle',0.13); setTimeout(function(){_tone(280,0.07,'triangle',0.07);},25); }
    function sndBarHover(){  _tone(600,0.03,'sine',0.035); }
    function sndBarDrop(){   _tone(240,0.13,'triangle',0.16); setTimeout(function(){_tone(300,0.09,'triangle',0.09);},55); }
    function sndBarReorder(){ _tone(420,0.07,'sine',0.06); setTimeout(function(){_tone(530,0.1,'sine',0.08);},85); }

    function updateDropTarget() {
      // Layout reads in RAF — doesn't block ghost movement
      var trackEl = segmentsEl.parentElement;
      var trackRect = trackEl ? trackEl.getBoundingClientRect() : null;
      var nearBar = trackRect && my >= trackRect.top - 50 && my <= trackRect.bottom + 50
                    && mx >= trackRect.left - 20 && mx <= trackRect.right + 20;
      if (ghost) ghost.style.opacity = nearBar ? '1' : '0.3';
      var labels = segmentsEl.querySelectorAll('.shift-progress-seg-label');
      var found = null;
      if (nearBar) {
        labels.forEach(function(el) {
          if (el === dragging) return;
          var r = el.getBoundingClientRect();
          if (mx >= r.left - 10 && mx <= r.right + 10) found = el;
        });
      }
      if (overLabel && overLabel !== found) overLabel.classList.remove('is-drag-over');
      overLabel = found;
      if (overLabel) overLabel.classList.add('is-drag-over');
    }

    segmentsEl.addEventListener('mousedown', function(e) {
      var lbl = getLabel(e.target);
      if (!lbl) return;
      e.preventDefault();
      dragging = lbl;
      mx = e.clientX; my = e.clientY;
      lbl.classList.add('is-dragging');
      ghost = document.createElement('div');
      ghost.className = 'ns-drag-ghost';
      ghost.textContent = lbl.dataset.segName || lbl.textContent;
      ghost.style.setProperty('--ghost-color', getComputedStyle(lbl).getPropertyValue('--seg-color').trim() || '#8b5cf6');
      document.body.appendChild(ghost);
      ghost.style.left = (mx + 14) + 'px';
      ghost.style.top  = (my - 20) + 'px';
      sndBarPickup();
    });

    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      mx = e.clientX; my = e.clientY;
      // Ghost follows mouse immediately — no frame delay
      if (ghost) { ghost.style.left = (mx + 14) + 'px'; ghost.style.top = (my - 20) + 'px'; }
      // Drop target detection deferred to RAF (needs getBoundingClientRect)
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function() {
        var prevOver = overLabel;
        updateDropTarget();
        if (overLabel && overLabel !== prevOver) sndBarHover();
      });
    });

    document.addEventListener('mouseup', function() {
      if (!dragging) return;
      cancelAnimationFrame(rafId);
      if (ghost) { ghost.remove(); ghost = null; }
      dragging.classList.remove('is-dragging');
      var target = overLabel;
      if (overLabel) { overLabel.classList.remove('is-drag-over'); overLabel = null; }

      if (target && target !== dragging) {
        var fromIdx = parseInt(dragging.dataset.segIdx, 10);
        var toIdx   = parseInt(target.dataset.segIdx, 10);
        if (!isNaN(fromIdx) && !isNaN(toIdx) && fromIdx !== toIdx) {
          sndBarDrop();
          setTimeout(sndBarReorder, 60);
          var plan = getNightSplitPlan(activeDateStr);
          if (plan && plan.segments) {
            var order = plan.segments.map(function(s) { return s.name; });
            var tmp = order[fromIdx]; order[fromIdx] = order[toIdx]; order[toIdx] = tmp;
            saveNightSplitOrder(activeDateStr, order);
            if (window.__ns) { if (window.__ns._update) window.__ns._update(); else if (window.__ns._render) window.__ns._render(); }
          }
        }
      }
      dragging = null;
    });
  }

  function mapNightSplitToRange(plan, rangeStart, rangeEnd) {
    if (!plan || !Array.isArray(plan.segments) || !plan.segments.length || !(rangeStart instanceof Date) || !(rangeEnd instanceof Date)) return null;
    const clipped = plan.segments.map(function(seg) {
      const start = seg.start > rangeStart ? seg.start : rangeStart;
      const end = seg.end < rangeEnd ? seg.end : rangeEnd;
      if (!(end > start)) return null;
      return {
        name: seg.name,
        start: new Date(start),
        end: new Date(end),
        color: seg.color
      };
    }).filter(Boolean);
    if (!clipped.length) return null;
    return { start: rangeStart, end: rangeEnd, segments: clipped };
  }

  function getShiftBadgeHtml(worker) {
    const hours = parseShiftHours(worker && worker.shift);
    if (hours > 0) {
      const cls = hours >= 24 ? 'duty-24h' : hours >= 15 ? 'duty-15h' : hours >= 12 ? 'duty-12h' : hours >= 9 ? 'duty-9h' : 'duty-8h';
      return `<span class="${cls}">${hours}h</span>`;
    }
    if (String(worker && worker.type || '').toUpperCase() === 'DIENA') return '<span class="duty-8h">8h</span>';
    return '';
  }

  function getWorkerUiState(worker, dateStr, now) {
    const out = {
      shiftHours: parseShiftHours(worker && worker.shift),
      shiftBadge: getShiftBadgeHtml(worker),
      isDone: false,
      isActive: false,
      isUpcoming: false,
      remainingMs: 0,
      timerText: '',
      statusText: 'Brīvs'
    };
    if (!worker || !worker.startTime || !worker.endTime || !dateStr || !(now instanceof Date)) return out;
    const start = createDateFromDateTime(dateStr, worker.startTime);
    const end = getShiftEnd(worker, dateStr);
    if (!start || !end) return out;
    out.isDone = now >= end;
    out.isActive = now >= start && now < end;
    out.isUpcoming = now < start;
    out.remainingMs = Math.max(0, end - now);
    if (out.isDone) out.statusText = 'Maiņa beigusies';
    else if (out.isActive) {
      out.timerText = formatRemainingHHMMSS(out.remainingMs);
      out.statusText = out.timerText;
    } else if (out.isUpcoming) {
      out.statusText = 'Sāksies vēlāk';
    }
    return out;
  }

  function getSideIconHtml(type) {
    if (type === 'DIENA') return '<span class="shift-icon-side sun-icon">☀️</span>';
    else if (type === 'NAKTS') return '<span class="shift-icon-side moon-icon">🌙</span>';
    else if (type === 'DIENNAKTS') return '';  // no extra 24h label (shiftBadge already shows it)
    return '';
  }

  function g_updatePanelsForDate() {
    const isToday = (activeDateStr === g_todayStr);
    const now = new Date();

    // RADIOGRAPHERS
    const radgContainer = document.getElementById('radiographers-duty');
    const radgNext = document.getElementById('radiographers-next');
    const radgBadge = document.getElementById('radiographers-today-badge');
    if (radgContainer) {
      // IMPORTANT: shift-day is already normalized to 08:00 rollover (see g_todayStr).
      // That means we no longer need to merge "active yesterday" at midnight.
      // We simply render the selected date's roster.
      let workersToShow = getWorkersForDateWithDate(store, activeDateStr);

      radgContainer.innerHTML = "";
      workersToShow.forEach(w => {
        const nameParts = String(w.name || "").trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] ? nameParts[0].toUpperCase() : "";
        const surname = nameParts.slice(1).join(' ');
        const uiState = getWorkerUiState(w, w.date, now);
        const shiftBadge = uiState.shiftBadge;
        let timerHtml = '';
        let isDone = false;
        if (isToday && w.startTime && w.endTime) {
          isDone = uiState.isDone;
          if (uiState.isActive && uiState.remainingMs > 0) {
            timerHtml = `<span class="duty-timer" data-worker="${w.name}" data-date="${w.date}" data-start="${w.startTime}" data-end="${w.endTime}" data-shift="${w.shift || ''}"><span class="ghost">88:88:88</span><span class="val">${uiState.timerText}</span></span>`;
          }
        }

        const iconHtml = getSideIconHtml(w.type);

        // Get fatigue for side panel
        let sideFatScore = 0, sideFatColor = '#30d158';
        try { if(window.__fatigue){ const sf=window.__fatigue.calculateFatigue(w.name); if(sf){ sideFatScore=sf.score; if(sideFatScore>70)sideFatColor='#ff3b30'; else if(sideFatScore>45)sideFatColor='#ff9500'; else if(sideFatScore>20)sideFatColor='#ffd60a'; else sideFatColor='#30d158'; } } }catch(e){}
        const fatLevel = sideFatScore > 85 ? 'crit' : sideFatScore > 65 ? 'high' : sideFatScore > 40 ? 'mid' : 'low';
        const sideFatBar = `<div style="display:flex;align-items:center;gap:5px;margin-top:5px;"><div class="side-fat-bar-wrap" style="flex:1;height:3px;border-radius:99px;background:rgba(255,255,255,0.07);overflow:hidden;"><div style="height:100%;width:${sideFatScore}%;background:${sideFatColor};border-radius:99px;"></div></div><span style="font-size:9px;font-weight:800;color:${sideFatColor};opacity:.85;min-width:24px;text-align:right;">${sideFatScore}%</span></div>`;
        radgContainer.innerHTML += `
          <div class="duty-block${isDone ? ' duty-done' : ''}" data-worker="${w.name}" data-shift="${w.shift}" data-type="${w.type || ''}" data-fatigue="${fatLevel}">
            <div class="name-row">
              <span class="duty-name">${firstName}</span>
            </div>
            ${surname ? `<span class="duty-surname">${surname}</span>` : ''}
            <div class="badge-row">
              ${iconHtml}
              ${shiftBadge}
              ${isDone ? '<span class="duty-done-badge">Maiņa beigusies</span>' : timerHtml}
            </div>
            ${sideFatBar}
          </div>`;
      });
      if (!radgContainer.innerHTML) radgContainer.innerHTML = "<span style='color:#666'>ATPŪTA</span>";
    }
    if (radgBadge) radgBadge.hidden = !isToday;
    // Hide next-card when not today
    const radgNextCard = radgNext && (radgNext.closest('.mk-next-card') || radgNext.closest('.next-box'));
    if (radgNextCard) radgNextCard.style.display = isToday ? '' : 'none';

    // RADIOLOGISTS (same dedupe)
    const radlContainer = document.getElementById('radiologists-duty');
    const radlNext = document.getElementById('radiologists-next');
    const radlBadge = document.getElementById('radiologists-today-badge');
    if (radlContainer) {
      // With the 08:00 rollover logic, "today" already points at the shift-start day,
      // so we don't need to mix in yesterday-at-midnight shifts (it created duplicates).
      let workersToShow = getWorkersForDateWithDate(storeRad, activeDateStr);

      const seen = new Set();
      workersToShow = workersToShow.filter(w => {
        if (seen.has(w.name)) return false;
        seen.add(w.name);
        return true;
      });

      radlContainer.innerHTML = "";
      workersToShow.forEach(w => {
        const nameParts = String(w.name || "").trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] ? nameParts[0].toUpperCase() : "";
        const surname = nameParts.slice(1).join(' ');
        const uiState = getWorkerUiState(w, w.date, now);
        const shiftBadge = uiState.shiftBadge;
        let timerHtml = '';
        let isDone = false;
        if (isToday && w.startTime && w.endTime) {
          isDone = uiState.isDone;
          if (uiState.isActive && uiState.remainingMs > 0) {
            timerHtml = `<span class="duty-timer" data-worker="${w.name}" data-date="${w.date}" data-start="${w.startTime}" data-end="${w.endTime}" data-shift="${w.shift || ''}"><span class="ghost">88:88:88</span><span class="val">${uiState.timerText}</span></span>`;
          }
        }

        const iconHtml = getSideIconHtml(w.type);

        let sideFatScoreL = 0, sideFatColorL = '#30d158';
        try { if(window.__fatigue){ const sf=window.__fatigue.calculateFatigue(w.name); if(sf){ sideFatScoreL=sf.score; if(sideFatScoreL>70)sideFatColorL='#ff3b30'; else if(sideFatScoreL>45)sideFatColorL='#ff9500'; else if(sideFatScoreL>20)sideFatColorL='#ffd60a'; else sideFatColorL='#30d158'; } } }catch(e){}
        const fatLevelL = sideFatScoreL > 85 ? 'crit' : sideFatScoreL > 65 ? 'high' : sideFatScoreL > 40 ? 'mid' : 'low';
        const sideFatBarL = `<div style="display:flex;align-items:center;gap:5px;margin-top:5px;"><div class="side-fat-bar-wrap" style="flex:1;height:3px;border-radius:99px;background:rgba(255,255,255,0.07);overflow:hidden;"><div style="height:100%;width:${sideFatScoreL}%;background:${sideFatColorL};border-radius:99px;"></div></div><span style="font-size:9px;font-weight:800;color:${sideFatColorL};opacity:.85;min-width:24px;text-align:right;">${sideFatScoreL}%</span></div>`;
        radlContainer.innerHTML += `
          <div class="duty-block${isDone ? ' duty-done' : ''}" data-worker="${w.name}" data-shift="${w.shift}" data-type="${w.type || ''}" data-fatigue="${fatLevelL}">
            <div class="name-row">
              <span class="duty-name">${firstName}</span>
            </div>
            ${surname ? `<span class="duty-surname">${surname}</span>` : ''}
            <div class="badge-row">
              ${iconHtml}
              ${shiftBadge}
              ${isDone ? '<span class="duty-done-badge">Maiņa beigusies</span>' : timerHtml}
            </div>
            ${sideFatBarL}
          </div>`;
      });
      if (!radlContainer.innerHTML) radlContainer.innerHTML = "<span style='color:#666'>ATPŪTA</span>";
    }
    if (radlBadge) radlBadge.hidden = !isToday;
    // Hide next-card when not today
    const radlNextCard = radlNext && (radlNext.closest('.mk-next-card') || radlNext.closest('.next-box'));
    if (radlNextCard) radlNextCard.style.display = isToday ? '' : 'none';

    // Next shifts (unchanged)
    if (radgNext) {
      if (isToday) {
        // "Next shift" means the next 08:00 day relative to the active shift-day.
        const [dd, mm, yy] = activeDateStr.split('.').map(Number);
        const base = new Date(yy, (mm||1) - 1, dd||1);
        base.setDate(base.getDate() + 1);
        const tomorrowStr = g_formatDate(base);
        const dNext = g_findDay(store, tomorrowStr)?.day;
        if (dNext && Array.isArray(dNext.workers)) {
          const next = dNext.workers.filter(w => isValidShift(w.shift)).map(w => String(w.name || "").split(' ')[0].toUpperCase());
          const txt = next.join(', ') || "--";
          radgNext.innerText = txt;
          // Auto-shrink font based on how many names
          radgNext.style.fontSize = next.length <= 2 ? '14px' : next.length <= 4 ? '12px' : next.length <= 6 ? '10px' : '9px';
        } else { radgNext.innerText = "--"; radgNext.style.fontSize = '14px'; }
      } else { radgNext.innerText = "--"; radgNext.style.fontSize = '14px'; }
    }

    if (radlNext) {
      if (isToday) {
        const [dd, mm, yy] = activeDateStr.split('.').map(Number);
        const base = new Date(yy, (mm||1) - 1, dd||1);
        base.setDate(base.getDate() + 1);
        const tomorrowStr = g_formatDate(base);
        const dNext = g_findDay(storeRad, tomorrowStr)?.day;
        if (dNext && Array.isArray(dNext.workers)) {
          const next = dNext.workers.filter(w => isValidShift(w.shift)).map(w => String(w.name || "").split(' ')[0].toUpperCase());
          const maxShowL = 6;
          const shownL = next.slice(0, maxShowL);
          radlNext.innerText = shownL.join(', ') + (next.length > maxShowL ? '...' : '') || "--";
          radlNext.style.fontSize = shownL.length <= 2 ? '13px' : shownL.length <= 4 ? '11px' : '10px';
        } else { radlNext.innerText = "--"; radlNext.style.fontSize = '14px'; }
      } else { radlNext.innerText = "--"; radlNext.style.fontSize = '14px'; }
    }
  }

  function updateTimers() {
    const now = new Date();
    let shouldRefresh = false;
    document.querySelectorAll('.duty-timer').forEach(timer => {
      const workerName = timer.dataset.worker;
      const dateStr = timer.dataset.date;
      const startTime = timer.dataset.start;
      const endTime = timer.dataset.end;
      if (!workerName || !dateStr || !startTime || !endTime) return;
      const uiState = getWorkerUiState({ startTime, endTime, shift: timer.dataset.shift || '' }, dateStr, now);
      const valEl = timer.querySelector('.val');
      if (uiState.isActive && uiState.remainingMs > 0) {
        if (valEl) valEl.textContent = uiState.timerText;
        const secsLeft = Math.floor(uiState.remainingMs / 1000);
        timer.classList.toggle('warning-critical', secsLeft <= 300);
        timer.classList.toggle('warning-low', secsLeft > 300 && secsLeft <= 900);
        return;
      }
      const block = timer.closest('.duty-block');
      const badgeRow = timer.closest('.badge-row');
      timer.remove();
      if (block) block.classList.add('duty-done');
      if (badgeRow && !badgeRow.querySelector('.duty-done-badge')) {
        badgeRow.insertAdjacentHTML('beforeend', '<span class="duty-done-badge">Maiņa beigusies</span>');
      }
      shouldRefresh = true;
    });

    if (shouldRefresh) {
      setTimeout(() => {
        try { g_updatePanelsForDate(); } catch(e) {}
        try { g_updateList(); } catch(e) {}
        try { window.__refreshFatigueBars && window.__refreshFatigueBars(); } catch(e) {}
      }, 60);
    }
  }

  window.__nsBarSync = function() { try { g_updateLive(); } catch(_e){} };

  function g_updateLive() {
    const now = new Date();

    // Recompute g_todayStr every tick — fixes month-boundary bug where page loaded
    // before 08:00 kept showing previous day's workers after the 08:00 rollover
    const _eff = new Date(now);
    if (_eff.getHours() < 8) _eff.setDate(_eff.getDate() - 1);
    const _newToday = `${String(_eff.getDate()).padStart(2,'0')}.${String(_eff.getMonth()+1).padStart(2,'0')}.${_eff.getFullYear()}`;
    if (_newToday !== g_todayStr) {
      g_todayStr = _newToday;
      // If user was viewing the old "today", switch to the new one
      if (activeDateStr !== _newToday) {
        const mergedDays = getMergedDays(activeMonth);
        if (mergedDays.some(d => d.date === _newToday)) g_selectDay(_newToday);
      }
      g_updatePanelsForDate();
      g_renderMonth();
    }

    // Try to find the currently active shift among today's workers
    let activeEnd = null;
    let activeStart = null;
    let activeDur = 0;
    let activeStops = [];
    const allStores = [store, storeRad];
    for (const s of allStores) {
      for (const month of Object.keys(s || {})) {
        const days = s[month];
        if (!Array.isArray(days)) continue;
        const today = days.find(d => d.date === g_todayStr);
        if (!today || !Array.isArray(today.workers)) continue;
        for (const w of today.workers) {
          if (!w.startTime || !w.endTime) continue;
          if (!isWorkerActive(w, g_todayStr, now)) continue;
          const end = getShiftEnd(w, g_todayStr);
          if (!end) continue;
          const [sh, sm] = w.startTime.split(':').map(Number);
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0);
          if (start > now) start.setDate(start.getDate() - 1);
          const dur = end - start;
          // Prefer the LONGEST shift (24h beats 12h nakts)
          if (dur > activeDur) {
            activeDur = dur;
            activeEnd = end;
            activeStart = start;
          }
          activeStops.push({
            name: w.name || '',
            emoji: window.MinkaEmoji && window.MinkaEmoji.get ? (window.MinkaEmoji.get(w.name || '') || '') : '',
            end: end,
            endLabel: `${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`,
            start: start,
            isRadiologist: s === storeRad
          });
        }
      }
    }

    activeStops.sort((a, b) => a.end - b.end || a.name.localeCompare(b.name));

    const splitPlan = (activeDateStr && activeDateStr === g_todayStr) ? getNightSplitPlan(activeDateStr) : null;

    // Fallback
    if (!activeEnd) {
      activeEnd = new Date(now);
      if (now.getHours() >= 8) activeEnd.setDate(activeEnd.getDate() + 1);
      activeEnd.setHours(8, 0, 0, 0);
    }
    if (!activeStart) {
      activeStart = new Date(now);
      if (now.getHours() >= 8) activeStart.setHours(8, 0, 0, 0);
      else { activeStart.setDate(activeStart.getDate() - 1); activeStart.setHours(8, 0, 0, 0); }
    }

    let diff = activeEnd - now;
    if (diff <= 0 && activeDateStr === g_todayStr) {
      const nextDate = g_getNextKnownDate(activeDateStr);
      if (nextDate) {
        g_selectDay(nextDate);
        return;
      }
    }
    const totalDur = Math.max(1, activeEnd - activeStart);
    const elapsed = Math.max(0, now - activeStart);
    const pct = Math.max(0, Math.min(100, (elapsed / totalDur) * 100));
    const splitOverlay = splitPlan ? mapNightSplitToRange(splitPlan, activeStart, activeEnd) : null;

    // Format helpers
    function fmtHM(ms) {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return h > 0 ? `${h}h ${String(m).padStart(2,'0')}m` : `${m}m`;
    }
    function fmtHHMM(d) {
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    function fmtHMS(ms) {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    // Update progress bar elements
    const wrap = document.getElementById('shift-progress-wrap');
    const track = document.getElementById('shift-bar-track');
    const fill = document.getElementById('shift-bar-fill');
    const labelsEl = document.getElementById('shift-progress-segments');
    const scrubber = document.getElementById('shift-bar-scrubber');
    const tooltip = document.getElementById('shift-bar-tooltip');
    const elapsedEl = document.getElementById('shift-elapsed-label');
    const remainEl = document.getElementById('grafiks-countdown');
    const startLbl = document.getElementById('shift-start-label');
    const endLbl = document.getElementById('shift-end-label');
    const stopsEl = document.getElementById('shift-progress-stops');

    if (wrap) {
      wrap.hidden = false;
      // Wire night-split bar toggle button
      const nsBarToggle = document.getElementById('ns-bar-toggle');
      if (nsBarToggle) {
        nsBarToggle.hidden = !splitPlan;
        wrap.classList.toggle('ns-bar-active', _nsBarOn && !!splitPlan);
        if (!nsBarToggle._wired) {
          nsBarToggle._wired = true;
          nsBarToggle.addEventListener('click', function() {
            _nsBarOn = !_nsBarOn;
            nsBarToggle.classList.toggle('is-on', _nsBarOn);
            var w = document.getElementById('shift-progress-wrap');
            if (w) w.classList.toggle('ns-bar-active', _nsBarOn);
            playNightToggleSound(_nsBarOn);
          });
        }
      }
      const effectiveOverlay = _nsBarOn ? splitOverlay : null;
      if (track) {
        if (effectiveOverlay && effectiveOverlay.segments && effectiveOverlay.segments.length) {
          const splitGradient = buildNightSplitGradient(effectiveOverlay.segments, effectiveOverlay.start, effectiveOverlay.end);
          track.style.setProperty('background', splitGradient + ', linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.00) 35%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.26) 50%, rgba(255,255,255,0.15) 52%, rgba(255,255,255,0.00) 65%, transparent 100%)', 'important');
          track.classList.add('has-night-split');
          track.style.setProperty('box-shadow', 'inset 0 0 0 1px rgba(255,255,255,0.05)', 'important');
        } else {
          track.classList.remove('has-night-split');
          track.style.setProperty('background', 'rgba(255,255,255,0.10)', 'important');
          track.style.setProperty('box-shadow', 'inset 0 1px 0 rgba(255,255,255,0.03)', 'important');
        }
      }
      if (fill) fill.style.width = pct + '%';
      if (fill) {
        if (effectiveOverlay && effectiveOverlay.segments && effectiveOverlay.segments.length) {
          fill.style.setProperty('background', 'linear-gradient(90deg, rgba(255,255,255,0.26), rgba(255,255,255,0.08))', 'important');
        } else {
          fill.style.setProperty('background', 'linear-gradient(90deg, #6f5cff 0%, #8b5cf6 45%, #b794ff 100%)', 'important');
        }
      }
      const belowEl = document.getElementById('shift-progress-below');
      if (labelsEl) {
        if (effectiveOverlay && effectiveOverlay.segments && effectiveOverlay.segments.length) {
          labelsEl.innerHTML = buildNightSplitMeta(effectiveOverlay.segments, effectiveOverlay.start, effectiveOverlay.end, now);
          labelsEl.hidden = false;
          initNsBarDrag(labelsEl);
        } else {
          labelsEl.innerHTML = '';
          labelsEl.hidden = true;
        }
      }
      if (belowEl) {
        if (effectiveOverlay && effectiveOverlay.segments && effectiveOverlay.segments.length) {
          belowEl.innerHTML = buildNightSplitTimesBelow(effectiveOverlay.segments, effectiveOverlay.start, effectiveOverlay.end);
          belowEl.hidden = false;
        } else {
          belowEl.innerHTML = '';
          belowEl.hidden = true;
        }
      }
      if (scrubber) scrubber.style.left = pct + '%';
      if (scrubber && effectiveOverlay && effectiveOverlay.segments && effectiveOverlay.segments.length) {
        let currentSeg = effectiveOverlay.segments.find(function(seg) { return now >= seg.start && now < seg.end; }) || null;
        if (currentSeg && currentSeg.color) {
          scrubber.style.setProperty('background', '#fff7f2', 'important');
          scrubber.style.setProperty('box-shadow', '0 0 0 3px ' + currentSeg.color.bg + ', 0 0 16px ' + currentSeg.color.bg, 'important');
          scrubber.style.setProperty('border', '1px solid rgba(255,255,255,0.72)', 'important');
        } else {
          scrubber.style.setProperty('background', '#f3edff', 'important');
          scrubber.style.setProperty('box-shadow', '0 0 0 3px rgba(139,92,246,0.18)', 'important');
          scrubber.style.setProperty('border', '1px solid rgba(255,255,255,0.62)', 'important');
        }
      } else if (scrubber) {
        scrubber.style.setProperty('background', '#f3edff', 'important');
        scrubber.style.setProperty('box-shadow', '0 0 0 3px rgba(139,92,246,0.18)', 'important');
        scrubber.style.setProperty('border', '1px solid rgba(255,255,255,0.62)', 'important');
      }
      if (tooltip) tooltip.textContent = fmtHHMM(now);
      if (elapsedEl) elapsedEl.textContent = 'Pagājis: ' + fmtHM(elapsed);
      if (remainEl) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const hm = h > 0 ? `${h}h ${String(m).padStart(2,'0')}m` : `${m}m`;
        remainEl.textContent = `Atlikušas: ${hm} ${String(s).padStart(2,'0')}s`;
        // Color urgency: green > 4h, amber 2-4h, red < 2h
        const hoursLeft = diff / 3600000;
        remainEl.dataset.urgency = hoursLeft > 4 ? 'ok' : hoursLeft > 2 ? 'warn' : 'crit';
      }
      if (startLbl) startLbl.textContent = fmtHHMM(activeStart);
      if (endLbl) endLbl.textContent = fmtHHMM(activeEnd);
      if (stopsEl) {
        if (activeStops.length) {
          var groupedStops = [];
          activeStops.forEach(function(stop) {
            var key = String(stop.end.getTime());
            var lastGroup = groupedStops[groupedStops.length - 1];
            if (lastGroup && lastGroup.key === key) {
              lastGroup.items.push(stop);
              if (stop.isRadiologist) lastGroup.hasRadiologist = true;
            } else {
              groupedStops.push({
                key: key,
                end: stop.end,
                endLabel: stop.endLabel,
                items: [stop],
                hasRadiologist: !!stop.isRadiologist
              });
            }
          });
          var nowMs = Date.now();
          g_shiftStopExits.forEach(function(exitGroup, key) {
            if (exitGroup.expiresAt <= nowMs) g_shiftStopExits.delete(key);
          });
          var nextGroups = new Map();
          groupedStops.forEach(function(group) {
            nextGroups.set(group.key, group);
          });
          g_shiftStopGroups.forEach(function(prevGroup, key) {
            if (!nextGroups.has(key) && !g_shiftStopExits.has(key)) {
              g_shiftStopExits.set(key, Object.assign({}, prevGroup, { exiting: true, expiresAt: nowMs + 700 }));
            }
          });
          g_shiftStopGroups = nextGroups;
          var displayGroups = groupedStops.concat(
            Array.from(g_shiftStopExits.values()).filter(function(group) {
              return !nextGroups.has(group.key);
            })
          ).sort(function(a, b) {
            return a.end - b.end;
          });
          var renderKey = JSON.stringify(displayGroups.map(function(group, index) {
            return {
              key: group.key,
              exiting: !!group.exiting,
              primary: index === 0 && !group.exiting,
              rad: !!group.hasRadiologist,
              items: group.items.map(function(stop) {
                return { name: stop.name, emoji: stop.emoji || '' };
              })
            };
          }));
          if (renderKey !== g_shiftStopsRenderKey) {
            g_shiftStopPopoverData = Object.create(null);
            stopsEl.innerHTML = displayGroups.map((group, index) => {
              const tone = index === 0 && !group.exiting ? ' is-primary' : '';
              const dept = group.hasRadiologist ? ' is-rad' : '';
              const stopPct = Math.max(0, Math.min(100, ((group.end - activeStart) / totalDur) * 100));
              g_shiftStopPopoverData[group.key] = {
                time: group.endLabel,
                rows: group.items.map(function(stop) {
                  return { name: stop.name, emoji: stop.emoji || '' };
                })
              };
              return `<div class="shift-stop${tone}${dept}${group.exiting ? ' is-exiting' : ''}">
                <button class="shift-stop-pin" type="button" data-stop-key="${group.key}" style="left:${stopPct}%" aria-label="${group.endLabel}">
                  <span class="shift-stop-dot"></span>
                </button>
              </div>`;
            }).join('');
            stopsEl.querySelectorAll('.shift-stop-pin[data-stop-key]').forEach(function(pin) {
              pin.addEventListener('mouseenter', function() { showShiftStopPopover(pin); });
              pin.addEventListener('mouseleave', function() { scheduleHideShiftStopPopover(); });
              pin.addEventListener('focus', function() { showShiftStopPopover(pin); });
              pin.addEventListener('blur', function() { scheduleHideShiftStopPopover(); });
              pin.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showShiftStopPopover(pin);
              });
            });
            g_shiftStopsRenderKey = renderKey;
          }
          stopsEl.hidden = false;
        } else {
          g_shiftStopGroups.forEach(function(prevGroup, key) {
            if (!g_shiftStopExits.has(key)) {
              g_shiftStopExits.set(key, Object.assign({}, prevGroup, { exiting: true, expiresAt: Date.now() + 700 }));
            }
          });
          g_shiftStopGroups = new Map();
          var exitOnly = Array.from(g_shiftStopExits.values()).filter(function(group) {
            return group.expiresAt > Date.now();
          }).sort(function(a, b) { return a.end - b.end; });
          if (exitOnly.length) {
            var exitRenderKey = JSON.stringify(exitOnly.map(function(group) {
              return { key: group.key, exiting: true, rad: !!group.hasRadiologist };
            }));
            if (exitRenderKey !== g_shiftStopsRenderKey) {
              g_shiftStopPopoverData = Object.create(null);
              stopsEl.innerHTML = exitOnly.map((group) => {
                const dept = group.hasRadiologist ? ' is-rad' : '';
                const stopPct = Math.max(0, Math.min(100, ((group.end - activeStart) / totalDur) * 100));
                return `<div class="shift-stop${dept} is-exiting"><button class="shift-stop-pin" type="button" style="left:${stopPct}%" tabindex="-1" aria-hidden="true"><span class="shift-stop-dot"></span></button></div>`;
              }).join('');
              g_shiftStopsRenderKey = exitRenderKey;
            }
            stopsEl.hidden = false;
          } else {
            stopsEl.innerHTML = '';
            stopsEl.hidden = true;
            g_shiftStopsRenderKey = '';
            g_shiftStopPopoverData = Object.create(null);
            hideShiftStopPopover();
          }
        }
      }
    }

    updateTimers();
  }

  function g_formatDate(date) { 
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`; 
  }

  function g_getNextKnownDate(dateStr) {
    const allDates = [];
    [store, storeRad].forEach(src => {
      Object.keys(src || {}).forEach(month => {
        (src[month] || []).forEach(day => {
          if (day && day.date) allDates.push(normalizeDateStr(day.date));
        });
      });
    });
    const uniq = Array.from(new Set(allDates)).sort((a, b) => {
      const [ad, am, ay] = a.split('.').map(Number);
      const [bd, bm, by] = b.split('.').map(Number);
      return new Date(ay, am - 1, ad) - new Date(by, bm - 1, bd);
    });
    const idx = uniq.indexOf(normalizeDateStr(dateStr));
    return idx >= 0 && idx < uniq.length - 1 ? uniq[idx + 1] : '';
  }

  function g_changeMonth() {
    activeMonth = document.getElementById('grafiks-monthPicker').value;
    window.__activeMonth = activeMonth;
    // Rebuild pills for new month FIRST, then select day
    g_renderMonth();
    document.getElementById('grafiks-scroller').scrollLeft = 0;
    const merged = getMergedDays(activeMonth);
    // Pick first day that has workers, else just first calendar day
    const firstWithWorkers = merged.find(d => (d.workers||[]).some(w => isValidShift(w.shift)));
    const firstDay = firstWithWorkers?.date || merged[0]?.date;
    if (firstDay) {
      g_selectDay(firstDay);
    } else {
      // Fallback: pick from radiologists if radiographers empty
      const radFirst = storeRad?.[activeMonth]?.[0]?.date;
      if (radFirst) g_selectDay(radFirst);
    }
  }

  // Called by fatigue.js once data is ready to refresh fatigue bars on cards
  window.__refreshFatigueBars = function() {
    document.querySelectorAll('.card[data-worker]').forEach(card => {
      const name = card.getAttribute('data-worker');
      if (!name || !window.__fatigue) return;
      try {
        const f = window.__fatigue.calculateFatigue(name);
        if (!f || !Number.isFinite(f.score)) return;
        const score = Math.max(0, f.score);
        // Krāsas: zaļš→dzeltens→oranžs→sarkans, katram līmenim skaidri atšķirīgs
        let color, glowColor, borderColor;
        if (score > 70) {
          color = '#ff3b30'; glowColor = 'rgba(255,59,48,0.25)'; borderColor = 'rgba(255,59,48,0.6)';
        } else if (score > 45) {
          color = '#ff9500'; glowColor = 'rgba(255,149,0,0.20)'; borderColor = 'rgba(255,149,0,0.5)';
        } else if (score > 20) {
          color = '#ffd60a'; glowColor = 'rgba(255,214,10,0.15)'; borderColor = 'rgba(255,214,10,0.4)';
        } else {
          color = '#30d158'; glowColor = 'rgba(48,209,88,0.12)'; borderColor = 'rgba(48,209,88,0.3)';
        }

        // Kartes border krāsa pēc noguruma līmeņa
        card.style.borderColor = borderColor;
        card.style.boxShadow = score > 45 ? `0 0 12px ${glowColor}, inset 0 0 20px ${glowColor}` : '';

        // Update bar fill — targets .fat-fill and .fat-pct classes
        const existingBar = card.querySelector('.card-fat-row');
        if (existingBar) {
          const fill = existingBar.querySelector('.fat-fill');
          const pct = existingBar.querySelector('.fat-pct');
          if (fill) { fill.style.width = score + '%'; fill.style.background = color; }
          if (pct) { pct.textContent = score + '%'; pct.style.color = color; pct.style.fontWeight = score > 45 ? '900' : '800'; }
          return;
        }
        // Fallback: add bar if not rendered yet
        const bar = document.createElement('div');
        bar.className = 'card-fat-row';
        bar.style.cssText = 'padding:2px 8px 7px;display:flex;align-items:center;gap:4px;';
        bar.innerHTML = `<div style="flex:1;height:3px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden;"><div class="fat-fill" style="height:100%;width:${score}%;background:${color};border-radius:99px;"></div></div><span class="fat-pct" style="font-size:8px;font-weight:900;color:${color};flex-shrink:0;">${score}%</span>`;
        card.appendChild(bar);
      } catch(e) {}
    });
  };

  function g_updateList() {
    const container = document.getElementById('grafiks-list');
    container.innerHTML = "";
    container.className = isGridView ? 'grid-view' : 'list-view';

    // Collect radiographers — search all months (same as g_findDay)
    const dayData = g_findDay(store, activeDateStr)?.day || null;
    // Collect radiologists — search all months
    const radDayData = g_findDay(storeRad, activeDateStr)?.day || null;

    const hasRg = dayData && (dayData.workers || []).some(w => isValidShift(w.shift));
    const hasRd = radDayData && (radDayData.workers || []).some(w => isValidShift(w.shift));

    if (!hasRg && !hasRd) {
      container.innerHTML = "<div style='color:#666;width:100%;text-align:center;margin-top:50px;'>Nav datu</div>";
      return;
    }

    const isToday = (activeDateStr === g_todayStr);
    const now = new Date();

    function buildCard(w, isRd) {
      const parts = String(w.name || "").trim().split(/\s+/).filter(Boolean);
      const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
      const firstName = capitalize(parts[0] || "");
      const surname = parts.slice(1).map(n => capitalize(n)).join(' ');
      let iconHtml = '';
      if (w.type === 'DIENA') iconHtml = '<span class="shift-icon static sun-icon">☀️</span>';
      else if (w.type === 'NAKTS') iconHtml = '<span class="shift-icon static moon-icon">🌙</span>';
      const isDoneCard = isToday && w.startTime && w.endTime && isWorkerShiftDone(w, activeDateStr, new Date());

      // Get fatigue score
      let fatigueScore = 0, fatigueColor = 'rgba(0,255,136,0.7)', hasFatigueScore = false;
      try {
        if (window.__fatigue) {
          const f = window.__fatigue.calculateFatigue(w.name);
          if (f && Number.isFinite(f.score)) {
            hasFatigueScore = true;
            fatigueScore = Math.max(0, f.score);
            if (fatigueScore > 70) fatigueColor = '#ff3b30';
            else if (fatigueScore > 45) fatigueColor = '#ff9500';
            else if (fatigueScore > 20) fatigueColor = '#ffd60a';
            else fatigueColor = '#30d158';
          }
        }
      } catch(e) {}

      if (isGridView) {
        const card = document.createElement('div');
        card.className = 'card' + (isDoneCard ? ' duty-done' : '') + (isRd ? ' card-rd' : '');
        card.setAttribute('data-worker', w.name);
        card.setAttribute('data-shift', w.shift);
        if (w.type) card.setAttribute('data-type', w.type);
        card.onclick = (e) => { e.stopPropagation(); showWorkerSchedule(w.name, w.shift); };

        // TOP: initials + icon
        const topDiv = document.createElement('div');
        topDiv.className = 'card-top';
        topDiv.innerHTML = `<div class="card-init${isRd ? ' card-init-rd' : ''}">${initials}</div>${iconHtml ? `<div class="shift-icons">${iconHtml}</div>` : ''}`;
        card.appendChild(topDiv);

        // MIDDLE: shift number + name (centered)
        const middleDiv = document.createElement('div');
        middleDiv.className = 'card-middle';
        const shiftEl = document.createElement('div');
        shiftEl.className = 'card-shift';
        shiftEl.textContent = w.shift;
        const nameWrap = document.createElement('div');
        nameWrap.className = 'card-name-wrap';
        nameWrap.innerHTML = `<span class="name-main">${firstName}</span><span class="name-sub">${surname}</span>`;
        middleDiv.appendChild(shiftEl);
        middleDiv.appendChild(nameWrap);
        card.appendChild(middleDiv);

        // FATIGUE BAR
        const fatRow = document.createElement('div');
        fatRow.className = 'card-fat-row';
        const fatColor = hasFatigueScore ? fatigueColor : 'rgba(255,255,255,0.1)';
        fatRow.innerHTML = `
          <div class="fat-track">
            <div class="fat-fill" style="width:${fatigueScore}%;background:${fatColor};"></div>
          </div>
          <span class="fat-pct" style="color:${fatColor};">${hasFatigueScore ? fatigueScore + '%' : ''}</span>`;
        card.appendChild(fatRow);

        return card;
      } else {
        const row = document.createElement('div');
        row.className = 'list-row' + (isRd ? ' list-row-rd' : '');
        row.setAttribute('data-worker', w.name);
        row.setAttribute('data-shift', w.shift);
        row.onclick = (e) => { e.stopPropagation(); showWorkerSchedule(w.name, w.shift); };
        row.innerHTML = `<b style="font-size:16px;">${isRd?'<span style="color:#ff6b6b;font-size:10px;margin-right:4px;">RD</span>':''}${firstName} ${surname}</b><span style="font-weight:900;color:${isRd?'#ff6b6b':'var(--accent)'};font-size:18px;">${w.shift}</span>`;
        return row;
      }
    }

    // Refresh fatigue bars after render (async, fatigue data may not be ready yet)
    setTimeout(function() {
      if (window.__refreshFatigueBars) window.__refreshFatigueBars();
    }, 200);

    // Add divider if both groups present
    function addDivider(label, color) {
      const d = document.createElement('div');
      d.className = 'cards-divider';
      d.style.cssText = `grid-column:1/-1;display:flex;align-items:center;gap:8px;padding:4px 0 2px;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:${color};opacity:.7;`;
      d.innerHTML = `<span style="width:20px;height:1px;background:currentColor;opacity:.4;display:block;flex-shrink:0;"></span>${label}<span style="flex:1;height:1px;background:currentColor;opacity:.15;display:block;"></span>`;
      container.appendChild(d);
    }

    // Radiologists FIRST (above)
    if (hasRd) {
      if (isGridView) {
        const sec = document.createElement('div');
        sec.className = 'cards-section';
        const lbl = document.createElement('div');
        lbl.className = 'cards-section-label cards-section-label-rd';
        lbl.style.cssText = '';
        lbl.innerHTML = `<span class="cards-lbl-line cards-lbl-line-rd"></span>RADIOLOGI`;
        sec.appendChild(lbl);
        const grid = document.createElement('div');
        grid.className = 'cards-subgrid';
        (radDayData.workers || []).filter(w => isValidShift(w.shift))
          .forEach(w => { grid.appendChild(buildCard(w, true)); });
        sec.appendChild(grid);
        container.appendChild(sec);
      } else {
        (radDayData.workers || []).filter(w => isValidShift(w.shift))
          .forEach(w => { container.appendChild(buildCard(w, true)); });
      }
    }

    // Radiographers below
    if (hasRg) {
      if (isGridView) {
        const sec = document.createElement('div');
        sec.className = 'cards-section';
        const lbl = document.createElement('div');
        lbl.className = 'cards-section-label cards-section-label-rg';
        lbl.style.cssText = '';
        lbl.innerHTML = `<span class="cards-lbl-line cards-lbl-line-rg"></span>RADIOGRĀFERI`;
        sec.appendChild(lbl);
        const grid = document.createElement('div');
        grid.className = 'cards-subgrid';
        (dayData.workers || []).filter(w => isValidShift(w.shift))
          .forEach(w => { grid.appendChild(buildCard(w, false)); });
        sec.appendChild(grid);
        container.appendChild(sec);
      } else {
        (dayData.workers || []).filter(w => isValidShift(w.shift))
          .forEach(w => { container.appendChild(buildCard(w, false)); });
      }
    }
  }

  function g_adjustDutyNameFontSize() {
    const containers = [document.getElementById('radiographers-duty'), document.getElementById('radiologists-duty')];
    containers.forEach(container => {
      if (!container) return;
      const dutyBlocks = container.querySelectorAll('.duty-block');
      dutyBlocks.forEach(block => {
        const nameSpan = block.querySelector('.duty-name');
        if (!nameSpan) return;
        const parentWidth = block.clientWidth;
        nameSpan.style.fontSize = '24px';
        if (nameSpan.scrollWidth > parentWidth) {
          let fontSize = 24;
          while (nameSpan.scrollWidth > parentWidth && fontSize > 12) {
            fontSize -= 1;
            nameSpan.style.fontSize = fontSize + 'px';
          }
        }
      });
    });
  }


  // Expose script-level selected day roster for parent-side assistant (same source as calendar/fatigue)
  function __minkaGetSelectedDayState() {
    const dateStr = activeDateStr || window.__activeDateStr || '';
    const isToday = !!(dateStr && g_todayStr && dateStr === g_todayStr);
    const now = new Date();

    function normalizeWorkers(list) {
      return (Array.isArray(list) ? list : []).map(w => {
        let done = false, active = false, remainingMs = 0;
        try {
          if (isToday && w && w.startTime && w.endTime) {
            done = !!isWorkerShiftDone(w, w.date || dateStr, now);
            active = !done && !!isWorkerActive(w, w.date || dateStr, now);
            if (active) remainingMs = Math.max(0, getRemainingMs(w, w.date || dateStr, now) || 0);
          }
        } catch(e) {}
        return {
          name: String((w && w.name) || '').trim(),
          shift: String((w && w.shift) || '').trim(),
          type: String((w && w.type) || '').trim(),
          date: String((w && (w.date || dateStr)) || dateStr || '').trim(),
          startTime: String((w && w.startTime) || '').trim(),
          endTime: String((w && w.endTime) || '').trim(),
          done, active, remainingMs
        };
      }).filter(w => w.name && isValidShift(w.shift));
    }

    const rg = normalizeWorkers(getWorkersForDateWithDate(store, dateStr));
    const rd = normalizeWorkers(getWorkersForDateWithDate(storeRad, dateStr));

    function nextNamesFor(storeObj) {
      if (!isToday || !dateStr) return [];
      try {
        const [dd, mm, yy] = String(dateStr).split('.').map(Number);
        const base = new Date(yy, (mm||1) - 1, dd||1);
        base.setDate(base.getDate() + 1);
        const tomorrowStr = g_formatDate(base);
        const dNext = g_findDay(storeObj, tomorrowStr)?.day;
        if (!dNext || !Array.isArray(dNext.workers)) return [];
        const seen = new Set();
        return dNext.workers
          .filter(w => isValidShift(w.shift))
          .map(w => String((w && w.name) || '').trim())
          .filter(Boolean)
          .map(n => {
            const first = String(n).split(/\s+/)[0] || '';
            return first ? first.toUpperCase() : '';
          })
          .filter(Boolean)
          .filter(n => {
            if (seen.has(n)) return false;
            seen.add(n);
            return true;
          });
      } catch(e) { return []; }
    }

    return {
      activeDateStr: dateStr,
      todayStr: g_todayStr || '',
      isToday,
      month: activeMonth || '',
      rg,
      rd,
      nextRg: nextNamesFor(store),
      nextRd: nextNamesFor(storeRad)
    };
  }


  window.__minkaCalendarState = window.__minkaCalendarState || {};
  window.__minkaCalendarState.getSelectedDayState = __minkaGetSelectedDayState;
  window.__minkaGetSelectedDayState = __minkaGetSelectedDayState;
  window.__minkaParseShiftHours = parseShiftHours;

  function __minkaPostAssistantState() {
    try {
      const state = __minkaGetSelectedDayState();
      let fatigue = [];
      try {
        const calc = window.__fatigue && window.__fatigue.calculateFatigue;
        if (typeof calc === 'function' && state) {
          const seen = new Set();
          const names = [];
          [ ...(state.rg || []), ...(state.rd || []) ].forEach(w => {
            const n = String((w && w.name) || '').trim();
            if (!n) return;
            const k = n.toLowerCase();
            if (seen.has(k)) return;
            seen.add(k);
            names.push(n);
          });
          fatigue = names.map(fullName => {
            try {
              const f = calc(fullName);
              if (!f || !Number.isFinite(f.score)) return null;
              return { fullName: String(f.workerName || fullName).trim(), score: Math.round(f.score) };
            } catch(e) { return null; }
          }).filter(Boolean).sort((a,b) => (b.score||0) - (a.score||0));
        }
      } catch(e) {}

      const payload = {
        activeDateStr: String((state && state.activeDateStr) || window.__activeDateStr || '').trim(),
        todayStr: String((state && state.todayStr) || '').trim(),
        isToday: !!(state && state.isToday),
        rg: Array.isArray(state && state.rg) ? state.rg : [],
        rd: Array.isArray(state && state.rd) ? state.rd : [],
        nextRg: Array.isArray(state && state.nextRg) ? state.nextRg : [],
        nextRd: Array.isArray(state && state.nextRd) ? state.nextRd : [],
        fatigue: Array.isArray(fatigue) ? fatigue : []
      };

      // Dedupe repeated bridge posts (fatigue/card observers can fire multiple times for same state)
      try {
        const digest = JSON.stringify({
          d: payload.activeDateStr,
          t: payload.isToday ? 1 : 0,
          rg: (payload.rg || []).map(w => [w && w.name, w && w.shift, !!(w && w.done), !!(w && w.active)]),
          rd: (payload.rd || []).map(w => [w && w.name, w && w.shift, !!(w && w.done), !!(w && w.active)]),
          nrg: payload.nextRg || [],
          nrd: payload.nextRd || [],
          f: (payload.fatigue || []).map(x => [x && x.fullName, x && x.score])
        });
        if (digest && digest === window.__minkaLastAssistantBridgeDigest) return;
        window.__minkaLastAssistantBridgeDigest = digest;
      } catch(e) {}

      window.parent && window.parent.postMessage({
        type: 'minka-calendar-selected-day-state',
        payload
      }, '*');
    } catch(e) {}
  }
  window.__minkaPostAssistantState = __minkaPostAssistantState;

  g_init(0);

  window.g_init = g_init;
  window.g_scrollCal = g_scrollCal;
  window.g_toggleView = g_toggleView;
  window.g_changeMonth = g_changeMonth;
  window.g_updatePanelsForDate = g_updatePanelsForDate;
  window.g_selectDay = g_selectDay;
})();

/* =============================
 * MINKA WINDOWING: GRAFIKS APP
 * - Drag by grabbing top bar (#grafiksDragZone)
 * - Resize via custom handles (bottom/right)
 * - Persists position/size in localStorage
 * ============================= */

(function initGrafiksWindowing(){
  const win = document.getElementById('grafiks-app');
  const dragZone = document.getElementById('grafiksDragZone');
  const rzTop = document.getElementById('grafiksResizeTop');
  const rzLeft = document.getElementById('grafiksResizeLeft');
  const rzRight = document.getElementById('grafiksResizeRight');
  const rzBottom = document.getElementById('grafiksResizeBottom');
  const rzTL = document.getElementById('grafiksResizeTL');
  const rzTR = document.getElementById('grafiksResizeTR');
  const rzBL = document.getElementById('grafiksResizeBL');
  const rzBR = document.getElementById('grafiksResizeBR');

  if(!win || !dragZone) return;

  const KEY = 'minka:grafiksWindow:v1';
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Restore saved state
  try {
    const raw = localStorage.getItem(KEY);
    if(raw){
      const s = JSON.parse(raw);
      if(Number.isFinite(s.left) && Number.isFinite(s.top)){
        win.style.left = s.left + 'px';
        win.style.top = s.top + 'px';
        win.style.transform = 'none';
        win.style.right = 'auto';
        win.style.bottom = 'auto';
      }
      if(Number.isFinite(s.width)) win.style.width = s.width + 'px';
      if(Number.isFinite(s.height)) win.style.height = s.height + 'px';
    }
  } catch(e) {}

  const saveState = () => {
    try {
      const r = win.getBoundingClientRect();
      localStorage.setItem(KEY, JSON.stringify({
        left: Math.round(r.left),
        top: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height)
      }));
    } catch(e) {}
  };

  // Drag
  let drag = null;
  const startDrag = (e) => {
    if(e.button !== undefined && e.button !== 0) return;

    // Safety: if the handle ever contains interactive controls, don't hijack clicks.
    const t = e.target;
    if (t && (t.closest('button') || t.closest('a') || t.closest('input') || t.closest('select') || t.closest('textarea'))) {
      return;
    }

    const r = win.getBoundingClientRect();
    // Convert from centered translateX layout to absolute pixels on first interaction
    if(getComputedStyle(win).transform !== 'none'){
      win.style.left = r.left + 'px';
      win.style.top = r.top + 'px';
      win.style.transform = 'none';
    }

    drag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: r.left,
      startTop: r.top
    };
    dragZone.setPointerCapture(e.pointerId);
    win.classList.add('is-dragging');
  };

  const moveDrag = (e) => {
    if(!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    // "Unlimited" feel: allow dragging partly off-screen.
    // Keep a small margin visible so you can always grab it back.
    const box = win.getBoundingClientRect();
    const minLeft = -box.width + 80;
    const minTop  = -20;
    const maxLeft = window.innerWidth - 80;
    const maxTop  = window.innerHeight - 40;

    const nextLeft = clamp(drag.startLeft + dx, minLeft, maxLeft);
    const nextTop  = clamp(drag.startTop + dy, minTop, maxTop);

    win.style.left = Math.round(nextLeft) + 'px';
    win.style.top  = Math.round(nextTop) + 'px';
    win.style.right = 'auto';
    win.style.bottom = 'auto';
  };

  const endDrag = (e) => {
    if(!drag || e.pointerId !== drag.id) return;
    // stop dragging
    drag = null;
    win.classList.remove('is-dragging');
    // persist
    saveState();
  };

  // Bind drag handlers (without this it feels "glued")
  dragZone.addEventListener('pointerdown', startDrag);
  dragZone.addEventListener('pointermove', moveDrag);
  dragZone.addEventListener('pointerup', endDrag);
  dragZone.addEventListener('pointercancel', endDrag);

  // ------------------------------------------------------------
  // Resize (all edges + corners, "unlimited" sizing)
  // ------------------------------------------------------------
  let resize = null;

  const getAbsBox = () => {
    const r = win.getBoundingClientRect();
    if(getComputedStyle(win).transform !== 'none'){
      win.style.left = r.left + 'px';
      win.style.top = r.top + 'px';
      win.style.transform = 'none';
      win.style.right = 'auto';
      win.style.bottom = 'auto';
    }
    return win.getBoundingClientRect();
  };

  const startResize = (edge) => (e) => {
    if(e.button !== undefined && e.button !== 0) return;
    e.preventDefault();

    const r = getAbsBox();

    resize = {
      id: e.pointerId,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: r.left,
      startTop: r.top,
      startW: r.width,
      startH: r.height
    };

    // capture on the handle itself if possible, fallback to window
    const handle = e.currentTarget || window;
    try { handle.setPointerCapture(e.pointerId); } catch(_){}
    win.classList.add('is-resizing');
  };

  const applyResize = (e) => {
    if(!resize || e.pointerId !== resize.id) return;

    const dx = e.clientX - resize.startX;
    const dy = e.clientY - resize.startY;

    // allow big sizes; only enforce small sane minimums
    const minW = 360;
    const minH = 260;

    let newLeft = resize.startLeft;
    let newTop  = resize.startTop;
    let newW = resize.startW;
    let newH = resize.startH;

    const edge = resize.edge;

    // horizontal
    if(edge.includes('right')) newW = resize.startW + dx;
    if(edge.includes('left'))  { newW = resize.startW - dx; newLeft = resize.startLeft + dx; }

    // vertical
    if(edge.includes('bottom')) newH = resize.startH + dy;
    if(edge.includes('top'))    { newH = resize.startH - dy; newTop = resize.startTop + dy; }

    // clamp mins (and adjust left/top when clamping from left/top)
    if(newW < minW){
      if(edge.includes('left')) newLeft -= (minW - newW);
      newW = minW;
    }
    if(newH < minH){
      if(edge.includes('top')) newTop -= (minH - newH);
      newH = minH;
    }

    win.style.left = Math.round(newLeft) + 'px';
    win.style.top  = Math.round(newTop) + 'px';
    win.style.width  = Math.round(newW) + 'px';
    win.style.height = Math.round(newH) + 'px';
    win.style.right = 'auto';
    win.style.bottom = 'auto';
  };

  const endResize = (e) => {
    if(!resize || e.pointerId !== resize.id) return;
    const handle = e.currentTarget || window;
    try { handle.releasePointerCapture(e.pointerId); } catch(_){}
    resize = null;
    win.classList.remove('is-resizing');
    saveState();
  };

  const bindResizeHandle = (el, edge) => {
    if(!el) return;
    el.addEventListener('pointerdown', startResize(edge));
    el.addEventListener('pointermove', applyResize);
    el.addEventListener('pointerup', endResize);
    el.addEventListener('pointercancel', endResize);
  };

  bindResizeHandle(rzRight, 'right');
  bindResizeHandle(rzLeft, 'left');
  bindResizeHandle(rzBottom, 'bottom');
  bindResizeHandle(rzTop, 'top');
  bindResizeHandle(rzBR, 'bottom right');
  bindResizeHandle(rzBL, 'bottom left');
  bindResizeHandle(rzTR, 'top right');
  bindResizeHandle(rzTL, 'top left');

  // Bolus tracker: parent requests workers for a date
  window.addEventListener('message', function(e) {
    if (!e || !e.data || e.data.type !== 'mk_get_workers') return;
    var dateStr = e.data.date;
    var workers = [];
    if (store) {
      outer: for (var month in store) {
        var days = store[month];
        if (!Array.isArray(days)) continue;
        for (var i = 0; i < days.length; i++) {
          if (days[i].date === dateStr && Array.isArray(days[i].workers)) {
            var seen = {};
            workers = days[i].workers
              .filter(function(w){ return w && w.name && !seen[w.name] && (seen[w.name]=1); })
              .map(function(w){ return String(w.name).trim(); });
            break outer;
          }
        }
      }
    }
    try { e.source.postMessage({ type: 'mk_workers_result', date: dateStr, workers: workers }, '*'); } catch(_){}
  });

  // Re-send full workers index on demand (handles race-condition where parent wasn't ready on first load)
  window.addEventListener('message', function(e) {
    if (!e || !e.data || e.data.type !== 'mk_request_workers_index') return;
    if (!store) return;
    try {
      var idx = {};
      for (var _m in store) {
        var _days = store[_m];
        if (Array.isArray(_days)) _days.forEach(function(day) {
          if (day && day.date && Array.isArray(day.workers)) {
            var seen = {};
            idx[day.date] = day.workers
              .filter(function(w){ return w && w.name && !seen[w.name] && (seen[w.name]=1); })
              .map(function(w){ return String(w.name).trim(); });
          }
        });
      }
      window.parent.postMessage({ type: 'mk_workers_index', data: idx }, '*');
    } catch(_e) {}
  });

})();
;

// ------------------------------------------------------------
//  WORKER MODAL (unchanged)
// ------------------------------------------------------------
let modalCurrentYear = null, modalCurrentMonth = null;
let modalWorkerDates = [];

function showWorkerSchedule(workerName, currentShift) {
  const stores = [window.__grafiksStore || {}, window.__grafiksStoreRad || {}];
  const allDates = [];
  const seenKeys = new Set();

  for (const store of stores) {
    for (const month in store) {
      const days = store[month];
      if (Array.isArray(days)) {
        days.forEach(day => {
          if (day.workers && Array.isArray(day.workers)) {
            day.workers.forEach(w => {
              if (w.name === workerName) {
                const key = day.date + '|' + w.shift;
                if (!seenKeys.has(key)) {
                  seenKeys.add(key);
                  allDates.push({ date: day.date, shift: w.shift, type: w.type || '', startTime: w.startTime || '', endTime: w.endTime || '' });
                }
              }
            });
          }
        });
      }
    }
  }

  allDates.sort((a,b) => {
    const [d1,m1,y1] = a.date.split('.').map(Number);
    const [d2,m2,y2] = b.date.split('.').map(Number);
    return new Date(y1,m1-1,d1) - new Date(y2,m2-1,d2);
  });

  modalWorkerDates = allDates;

  const parts = workerName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const surname = parts.slice(1).join(' ') || '';

  document.getElementById('modal-worker-name').innerText = firstName.toUpperCase();
  document.getElementById('modal-firstname').innerText = firstName;
  document.getElementById('modal-surname').innerText = surname;
  // New fields for redesigned modal
  const avatarEl = document.getElementById('modal-avatar-initials');
  const surnameLine = document.getElementById('modal-surname-line');
  const initials = ((firstName[0] || '') + (surname[0] || '')).toUpperCase();
  if (avatarEl) avatarEl.textContent = initials || '??';
  if (surnameLine) surnameLine.textContent = surname || '';

  const listContainer = document.getElementById('modal-dates-list');
  listContainer.innerHTML = '';
  if (allDates.length === 0) {
    listContainer.innerHTML = '<div style="padding:32px;text-align:center;color:rgba(255,255,255,0.25);font-size:13px;font-weight:600;">Nav datu</div>';
  } else {
    const LAT_MONTHS = ['Janv','Febr','Marts','Apr','Maijs','Jūn','Jūl','Aug','Sept','Okt','Nov','Dec'];
    const LAT_DAYS = ['Sv','P','O','T','C','Pk','S'];
    const todayStr = (() => { const n=new Date(); return `${String(n.getDate()).padStart(2,'0')}.${String(n.getMonth()+1).padStart(2,'0')}.${n.getFullYear()}`; })();

    // Group by month
    const byMonth = {};
    allDates.forEach(item => {
      const [dd,mm,yy] = item.date.split('.').map(Number);
      const key = `${yy}-${mm}`;
      if (!byMonth[key]) byMonth[key] = { year:yy, month:mm, items:[] };
      byMonth[key].items.push({ ...item, dd, mm, yy });
    });

    Object.values(byMonth).forEach(group => {
      // Month header
      const hdr = document.createElement('div');
      hdr.className = 'wl-month-hdr';
      hdr.innerHTML = `<span class="wl-month-name">${LAT_MONTHS[group.month-1]} ${group.year}</span><span class="wl-month-count">${group.items.length} maiņas</span>`;
      listContainer.appendChild(hdr);

      group.items.forEach(item => {
        const dateObj = new Date(item.yy, item.mm-1, item.dd);
        const dayOfWeek = LAT_DAYS[dateObj.getDay()];
        const isToday = item.date === todayStr;
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        let shiftNum = (item.shift+'').replace('h','');
        const typeIcon = shiftNum==='24' ? '🌙' : shiftNum==='12'||shiftNum==='15' ? '☀️' : '⏱';
        const shiftColor = shiftNum==='24' ? 'var(--accent,#b77bff)' : shiftNum==='12'||shiftNum==='15' ? '#ff9f0a' : 'rgba(255,255,255,0.5)';

        const div = document.createElement('div');
        div.className = 'wl-item' + (isToday ? ' wl-today' : '') + (isWeekend ? ' wl-weekend' : '');
        div.innerHTML = `
          <div class="wl-day-col">
            <span class="wl-day-num">${item.dd}</span>
            <span class="wl-day-name">${dayOfWeek}</span>
          </div>
          <div class="wl-center">
            <span class="wl-type-icon">${typeIcon}</span>
            ${item.type ? `<span class="wl-type">${item.type}</span>` : ''}
            ${isToday ? '<span class="wl-today-tag">ŠODIEN</span>' : ''}
          </div>
          <div class="wl-shift-col">
            <span class="wl-shift" style="color:${shiftColor}">${shiftNum}h</span>
          </div>`;
        listContainer.appendChild(div);
      });
    });
  }

  if (allDates.length > 0) {
    const [d,m,y] = allDates[0].date.split('.').map(Number);
    modalCurrentYear = y;
    modalCurrentMonth = m-1;
  } else {
    const now = new Date();
    modalCurrentYear = now.getFullYear();
    modalCurrentMonth = now.getMonth();
  }
  renderModalCalendar();
  updateModalTotalHours();

  __workerModalRestore();
  const modal = document.getElementById('worker-modal');

  // Reset any previously dragged position so it always opens centered
  modal.style.transition = '';
  modal.style.transform = '';
  modal.style.left = '';
  modal.style.top = '';

  // Compute exact px center to bypass any stacking context from iframe/backdrop-filter
  const mw = Math.min(560, window.innerWidth * 0.96);
  const mh = Math.min(window.innerHeight * 0.82, 700);
  const cx = Math.round((window.innerWidth  - mw) / 2);
  const cy = Math.round((window.innerHeight - mh) / 2);
  modal.style.width  = mw + 'px';
  modal.style.left   = cx + 'px';
  modal.style.top    = cy + 'px';
  modal.style.maxHeight = mh + 'px';
  // Override CSS transform to just scale (no translate since we set left/top directly)
  modal.style.transform = 'scale(0.94)';
  modal.offsetHeight; // force reflow
  modal.style.transition = 'opacity .22s ease, transform .22s cubic-bezier(.2,.9,.3,1)';

  modal.classList.add('open');
  const bd = document.getElementById('worker-modal-backdrop');
  if (bd) bd.classList.add('open');
  showModalView('fatigue');

  setTimeout(() => {
    document.addEventListener('click', outsideModalClose);
  }, 100);
}

function updateModalTotalHours() {
  const total = modalWorkerDates
    .filter(d => {
      const [dd, mm, yy] = d.date.split('.').map(Number);
      return mm-1 === modalCurrentMonth && yy === modalCurrentYear;
    })
    .reduce((acc, d) => {
      const shift = d.shift.toLowerCase();
      const match = shift.match(/\d+/);
      if (match) {
        const hours = parseInt(match[0], 10);
        return acc + hours;
      }
      return acc;
    }, 0);
  document.getElementById('modal-total-hours').innerText = `${total}h`;
}

function outsideModalClose(e) {
  const modal = document.getElementById('worker-modal');
  if (modal.classList.contains('open') && !modal.contains(e.target)) {
    closeWorkerModal();
    document.removeEventListener('click', outsideModalClose);
  }
}

function renderModalCalendar() {
  const year = modalCurrentYear;
  const month = modalCurrentMonth;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('modal-calendar-month-year').innerText = `${monthNames[month]} ${year}`;

  const daysContainer = document.getElementById('modal-calendar-days');
  daysContainer.innerHTML = '';

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // monday-first
  const lastDate = new Date(year, month + 1, 0).getDate();
  const lastDay = (new Date(year, month, lastDate).getDay() + 6) % 7; // monday-first
  const lastDatePrev = new Date(year, month, 0).getDate();

  let liTag = '';

  function pad2(n){ return String(n).padStart(2, '0'); }
  function dateKey(dd, mmZeroBased, yy){ return `${pad2(dd)}.${pad2(mmZeroBased + 1)}.${yy}`; }

  const shiftMap = new Map();
  modalWorkerDates.forEach(d => {
    const [dd, mm, yy] = d.date.split('.').map(Number);
    const key = `${pad2(dd)}.${pad2(mm)}.${yy}`;

    let shiftLabel = String(d.shift || '');
    if (/^(12|15|24|9)$/.test(shiftLabel) || /^(12|15|24|9)h$/i.test(shiftLabel)) {
      if (!/h$/i.test(shiftLabel)) shiftLabel += 'h';
    }

    let shiftKind = 'day';
    const t = String(d.type || '').toUpperCase();
    const sh = String(d.shift || '').toLowerCase();
    const st = String(d.startTime || '');
    if (t === 'DIENNAKTS' || sh === '24' || sh === '24h') shiftKind = 'allday';
    else if (t === 'NAKTS') shiftKind = 'night';
    else if (t === 'DIENA') shiftKind = 'day';
    else {
      const hr = parseInt(st.split(':')[0], 10);
      if (!isNaN(hr) && (hr >= 18 || hr <= 7)) shiftKind = 'night';
    }

    shiftMap.set(key, { label: shiftLabel, kind: shiftKind });
  });

  for (let i = firstDay; i > 0; i--) {
    const dayNum = lastDatePrev - i + 1;
    const prevMonthDate = new Date(year, month, 0);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();
    const key = dateKey(dayNum, prevMonth, prevYear);
    const shift = shiftMap.get(key);
    if (shift) liTag += `<li class="inactive worked shift-${shift.kind}">${dayNum}<span class="shift-label">${shift.label}</span></li>`;
    else liTag += `<li class="inactive">${dayNum}</li>`;
  }

  for (let i = 1; i <= lastDate; i++) {
    const key = dateKey(i, month, year);
    const shift = shiftMap.get(key);
    if (shift) liTag += `<li class="worked shift-${shift.kind}">${i}<span class="shift-label">${shift.label}</span></li>`;
    else liTag += `<li>${i}</li>`;
  }

  for (let i = lastDay; i < 6; i++) {
    const dayNum = i - lastDay + 1;
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = nextMonthDate.getMonth();
    const key = dateKey(dayNum, nextMonth, nextYear);
    const shift = shiftMap.get(key);
    if (shift) liTag += `<li class="inactive worked shift-${shift.kind}">${dayNum}<span class="shift-label">${shift.label}</span></li>`;
    else liTag += `<li class="inactive">${dayNum}</li>`;
  }

  daysContainer.innerHTML = liTag;
  updateModalTotalHours();
}

function modalCalendarMonth(delta) {
  modalCurrentMonth += delta;
  if (modalCurrentMonth < 0) {
    modalCurrentMonth = 11;
    modalCurrentYear -= 1;
  }
  if (modalCurrentMonth > 11) {
    modalCurrentMonth = 0;
    modalCurrentYear += 1;
  }
  renderModalCalendar();
}

function showModalView(view) {
  const listView = document.getElementById('modal-list-view');
  const calendarView = document.getElementById('modal-calendar-view');
  const fatigueView = document.getElementById('modal-fatigue-view');
  const toggleList = document.getElementById('toggle-list');
  const toggleCal = document.getElementById('toggle-calendar');
  const toggleFatigue = document.getElementById('toggle-fatigue');

  // Paslēpt visus
  if (listView) listView.classList.add('hide');
  if (calendarView) calendarView.classList.remove('show');
  if (fatigueView) fatigueView.classList.add('hide');
  const _emojiView = document.getElementById('modal-emoji-view');
  if (_emojiView) _emojiView.classList.add('hide');
  if (toggleList) toggleList.classList.remove('active');
  if (toggleCal) toggleCal.classList.remove('active');
  if (toggleFatigue) toggleFatigue.classList.remove('active');
  const _toggleEmoji = document.getElementById('toggle-emoji');
  if (_toggleEmoji) _toggleEmoji.classList.remove('active');

  // Parādīt izvēlēto
  if (view === 'list') {
    if (listView) listView.classList.remove('hide');
    if (toggleList) toggleList.classList.add('active');
  } else if (view === 'calendar') {
    if (calendarView) calendarView.classList.add('show');
    if (toggleCal) toggleCal.classList.add('active');
  } else if (view === 'fatigue') {
    if (fatigueView) fatigueView.classList.remove('hide');
    if (toggleFatigue) toggleFatigue.classList.add('active');
    if (typeof window.__fatigueRenderModal === 'function') window.__fatigueRenderModal();
  } else if (view === 'emoji') {
    const emojiView = document.getElementById('modal-emoji-view');
    const toggleEmoji = document.getElementById('toggle-emoji');
    if (emojiView) emojiView.classList.remove('hide');
    if (toggleEmoji) toggleEmoji.classList.add('active');
    if (window.MinkaEmoji && window.MinkaEmoji.renderInModal) {
      window.MinkaEmoji.renderInModal(emojiView);
    }
  }
}

function closeWorkerModal() {
  const modal = document.getElementById('worker-modal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => {
      modal.style.left = '';
      modal.style.top = '';
      modal.style.width = '';
      modal.style.maxHeight = '';
      modal.style.transform = '';
      modal.style.transition = '';
    }, 250);
  }
  const bd = document.getElementById('worker-modal-backdrop');
  if (bd) bd.classList.remove('open');
  document.removeEventListener('click', outsideModalClose);
}

// ------------------------------------------------------------


// ------------------------------------------------------------
//  WORKER MODAL WINDOWING (draggable + resizable)
// ------------------------------------------------------------
let __wmInitDone = false;
let __wmState = { left: null, top: null, width: null, height: null };

function __wmClamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

function __wmSave(modal){
  const r = modal.getBoundingClientRect();
  __wmState = { left: r.left, top: r.top, width: r.width, height: r.height };
  try { localStorage.setItem('minka_worker_modal_state_v1', JSON.stringify(__wmState)); } catch(e) {}
}

function __wmLoad(){
  try {
    const raw = localStorage.getItem('minka_worker_modal_state_v1');
    if(raw) {
      const s = JSON.parse(raw);
      if (s && Number.isFinite(s.left) && Number.isFinite(s.top) && Number.isFinite(s.width) && Number.isFinite(s.height)) {
        __wmState = s;
      }
    }
  } catch(e) {}
}

function __workerModalRestore(){}  // no-op, positioning handled in open

function __initWorkerModalWindowing(){
  if(__wmInitDone) return;
  __wmInitDone = true;

  const modal = document.getElementById('worker-modal');
  if (!modal) return;

  // ── Drag to move (header bar only) ──
  let dragging = false;
  let dragStartX = 0, dragStartY = 0;
  let modalStartLeft = 0, modalStartTop = 0;
  let didDrag = false;

  const getHeader = () => modal.querySelector('.modal-header');

  function onPointerDown(e) {
    const header = getHeader();
    if (!header) return;
    // Only start drag from header area
    if (!header.contains(e.target)) return;
    // Never steal clicks from interactive elements — close button, tabs, etc
    if (e.target.closest('button, a, input, select, [onclick]')) return;

    dragging = true;
    didDrag = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = modal.getBoundingClientRect();
    modalStartLeft = rect.left;
    modalStartTop  = rect.top;
    modal.style.transition = 'none';
    // Only capture AFTER confirming no button target
    modal.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    // Ignore tiny jitter
    if (!didDrag && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    didDrag = true;
    let newLeft = modalStartLeft + dx;
    let newTop  = modalStartTop  + dy;
    const mw = modal.offsetWidth;
    const mh = modal.offsetHeight;
    newLeft = Math.max(12, Math.min(window.innerWidth  - mw - 12, newLeft));
    newTop  = Math.max(12, Math.min(window.innerHeight - mh - 12, newTop));
    modal.style.left = newLeft + 'px';
    modal.style.top  = newTop  + 'px';
    modal.style.transform = 'scale(1)';
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    modal.style.transition = '';
    // If we barely moved, treat as a click — release capture so button onclick fires
    if (!didDrag) {
      modal.releasePointerCapture(e.pointerId);
    }
    didDrag = false;
  }

  modal.addEventListener('pointerdown',   onPointerDown);
  modal.addEventListener('pointermove',   onPointerMove);
  modal.addEventListener('pointerup',     onPointerUp);
  modal.addEventListener('pointercancel', onPointerUp);
}

__initWorkerModalWindowing();

// MINI_CAL_PLACEHOLDER
// Expose for Minka bar
if (typeof render === "function") window.renderSearchResults = function(q, el) { render(q); };

// ── MINI KALENDĀRS ──────────────────────────────────────────────
function positionMiniCalPopup() {
  const pop = document.getElementById('miniCalPopup');
  const btn = document.getElementById('miniCalBtn');
  if (!pop || !btn) return;
  if (pop.parentNode !== document.body) document.body.appendChild(pop);
  pop.style.position = 'fixed';
  pop.style.zIndex = '999999';
  const popW = 272;
  const btnR = btn.getBoundingClientRect();
  const top = Math.min(window.innerHeight - 16 - Math.max(pop.offsetHeight || 0, 320), btnR.bottom + 8);
  let left = btnR.right - popW;
  if (left < 12) left = 12;
  if (left + popW > window.innerWidth - 12) left = window.innerWidth - popW - 12;
  pop.style.top = Math.max(12, top) + 'px';
  pop.style.left = left + 'px';
  pop.style.right = 'auto';
}

function toggleMiniCal(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const pop = document.getElementById('miniCalPopup');
  if (!pop) return;
  // Always ensure popup is on body to avoid overflow:hidden clipping
  if (pop.parentNode !== document.body) document.body.appendChild(pop);
  if (pop.style.display === 'none' || !pop.style.display) {
    renderMiniCal();
    positionMiniCalPopup();
    pop.style.display = 'block';
  } else {
    pop.style.display = 'none';
  }
}

function renderMiniCal() {
  const pop = document.getElementById('miniCalPopup');
  if (!pop) return;
  const lower = String(window.__activeMonth || '').toLowerCase().trim();
  const yearMatch = lower.match(/(20\d{2})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  const monthToken = (lower.split(/\s+/)[0] || '').replace(/[^a-z\u0101\u010d\u0113\u0123\u012b\u0137\u013c\u0146\u014d\u0157\u0161\u016b\u017e]/g, '');
  const monthMap = {
    'janv\u0101ris':0,'janvaris':0,'febru\u0101ris':1,'februaris':1,'marts':2,
    'apr\u012blis':3,'aprilis':3,'maijs':4,'j\u016bnijs':5,'junijs':5,
    'j\u016blijs':6,'julijs':6,'augusts':7,'septembris':8,'oktobris':9,
    'novembris':10,'decembris':11
  };
  const monthIdx = (monthMap[monthToken] !== undefined) ? monthMap[monthToken] : new Date().getMonth();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIdx, 1).getDay();
  const startOffset = (firstWeekday === 0) ? 6 : firstWeekday - 1;
  const monthNames = ["Janv\u0101ris","Febru\u0101ris","Marts","Apr\u012blis","Maijs","J\u016bnijs",
                      "J\u016blijs","Augusts","Septembris","Oktobris","Novembris","Decembris"];

  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
    + '<button onclick="miniCalPrevMonth()" style="background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:20px;padding:0 8px;line-height:1;">&#8249;</button>'
    + '<span style="color:#fff;font-weight:600;font-size:13px;">' + monthNames[monthIdx] + ' ' + year + '</span>'
    + '<button onclick="miniCalNextMonth()" style="background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:20px;padding:0 8px;line-height:1;">&#8250;</button>'
    + '</div>';

  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;">';
  ['P','O','T','C','P','S','S'].forEach(function(d) {
    html += '<div style="font-size:10px;color:rgba(255,255,255,0.35);padding:2px 0;">' + d + '</div>';
  });
  for (var i = 0; i < startOffset; i++) html += '<div></div>';

  // Build fatigue map for this month once
  var heavyDays = new Set(); // dots disabled

  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = String(d).padStart(2,'0') + '.' + String(monthIdx+1).padStart(2,'0') + '.' + year;
    var isToday = (dateStr === (window.__g_todayStr || g_todayStr));
    var isActive = (dateStr === (window.__activeDateStr || activeDateStr));
    var style = 'font-size:13px;font-weight:600;padding:5px 2px;border-radius:8px;cursor:pointer;border:1px solid transparent;';
    if (isActive && isToday) {
      style += 'background:rgba(255,200,60,0.25);color:#ffc83c;border-color:rgba(255,200,60,0.7);';
    } else if (isActive) {
      style += 'background:rgba(183,123,255,0.35);color:#fff;border-color:rgba(183,123,255,0.5);';
    } else if (isToday) {
      style += 'border-color:rgba(255,200,60,0.6);color:#ffc83c;';
    } else {
      style += 'color:rgba(255,255,255,0.65);';
    }
    var dotHtml = '';
    html += '<div style="' + style + '" onclick="miniCalSelectDay(\'' + dateStr + '\')">' + d + dotHtml + '</div>';
  }
  html += '</div>';
  pop.innerHTML = html;
}

function miniCalSelectDay(dateStr) {
  var pop = document.getElementById('miniCalPopup');
  if (pop) pop.style.display = 'none';
  g_selectDay(dateStr);
}

function miniCalPrevMonth() {
  var picker = document.getElementById('grafiks-monthPicker');
  if (!picker || picker.selectedIndex <= 0) return;
  picker.selectedIndex--;
  g_changeMonth();
  setTimeout(renderMiniCal, 80);
}

function miniCalNextMonth() {
  var picker = document.getElementById('grafiks-monthPicker');
  if (!picker || picker.selectedIndex >= picker.options.length - 1) return;
  picker.selectedIndex++;
  g_changeMonth();
  setTimeout(renderMiniCal, 80);
}

document.addEventListener('click', function(e) {
  var pop = document.getElementById('miniCalPopup');
  var btn = document.getElementById('miniCalBtn');
  if (pop && pop.style.display !== 'none') {
    if (!pop.contains(e.target) && btn && !btn.contains(e.target)) {
      pop.style.display = 'none';
    }
  }
});

document.addEventListener('mouseover', function(e) {
  var pin = e.target && e.target.closest ? e.target.closest('.shift-stop-pin[data-stop-key]') : null;
  if (pin) showShiftStopPopover(pin);
});

document.addEventListener('click', function(e) {
  var pin = e.target && e.target.closest ? e.target.closest('.shift-stop-pin[data-stop-key]') : null;
  if (pin) {
    e.preventDefault();
    e.stopPropagation();
    showShiftStopPopover(pin);
    return;
  }
  var stopPopover = document.getElementById('shift-stop-popover');
  if (stopPopover && !stopPopover.hidden && !stopPopover.contains(e.target)) {
    hideShiftStopPopover();
  }
}, true);

document.addEventListener('mouseout', function(e) {
  var pin = e.target && e.target.closest ? e.target.closest('.shift-stop-pin[data-stop-key]') : null;
  if (pin && (!e.relatedTarget || !pin.contains(e.relatedTarget))) scheduleHideShiftStopPopover();
});

document.addEventListener('focusin', function(e) {
  var pin = e.target && e.target.closest ? e.target.closest('.shift-stop-pin[data-stop-key]') : null;
  if (pin) showShiftStopPopover(pin);
});

document.addEventListener('focusout', function(e) {
  var pin = e.target && e.target.closest ? e.target.closest('.shift-stop-pin[data-stop-key]') : null;
  if (pin) scheduleHideShiftStopPopover();
});

window.addEventListener('resize', function() {
  var pop = document.getElementById('miniCalPopup');
  if (pop && pop.style.display !== 'none') positionMiniCalPopup();
  if (typeof hideShiftStopPopover === 'function') hideShiftStopPopover();
});

window.addEventListener('message', function(e) {
  if (!e || !e.data || e.data.type !== 'hostLayoutChanged') return;
  var data = e.data || {};
  var root = document.documentElement;
  root.classList.toggle('host-radio-open', !!data.radioVisible);
  root.style.setProperty('--host-radio-h', String(Math.max(0, data.radioHeight || 0)) + 'px');
  root.style.setProperty('--host-btnbar-h', String(Math.max(0, data.buttonBarHeight || 0)) + 'px');
  requestAnimationFrame(function(){
    try { window.dispatchEvent(new Event('resize')); } catch(_e) {}
    var pop = document.getElementById('miniCalPopup');
    if (pop && pop.style.display !== 'none') positionMiniCalPopup();
  });
});
