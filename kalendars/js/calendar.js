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
const GRAFIKS_LOADER_MIN_MS = document.documentElement.classList.contains('mk-mobile-shell') ? 450 : 2600;
window.__minkaGrafiksLoaderStartedAt = window.__minkaGrafiksLoaderStartedAt || Date.now();
window.hospitalDatabase = Array.isArray(window.hospitalDatabase) ? window.hospitalDatabase : [];
var hospitalDatabase = window.hospitalDatabase;

(function initMinkaHeaderScenicBackground() {
  const assets = {
    morning: {
      src: 'data/header-backgrounds/header-morning-20260701.jpg',
      position: '54% 46%',
      next: 'day'
    },
    day: {
      src: 'data/header-backgrounds/header-day-20260701.jpg',
      position: '56% 48%',
      next: 'sunset'
    },
    sunset: {
      src: 'data/header-backgrounds/header-sunset-20260701.jpg',
      position: '58% 48%',
      next: 'night'
    },
    night: {
      src: 'data/header-backgrounds/header-night-20260701.jpg',
      position: '58% 48%',
      next: 'morning'
    }
  };
  const boundaries = [
    { hour: 5, period: 'morning' },
    { hour: 9, period: 'day' },
    { hour: 17, period: 'sunset' },
    { hour: 22, period: 'night' }
  ];
  let switchTimer = 0;
  let preloadTimer = 0;
  let preloadIdle = false;
  let currentPeriod = '';
  const preloaded = new Set();

  function rigaTimeParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Riga',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date);
    const read = type => Number(parts.find(part => part.type === type)?.value || 0);
    return { hour: read('hour'), minute: read('minute'), second: read('second') };
  }

  function getHeaderPeriod(date = new Date()) {
    const { hour } = rigaTimeParts(date);
    if (hour >= 5 && hour < 9) return 'morning';
    if (hour >= 9 && hour < 17) return 'day';
    if (hour >= 17 && hour < 22) return 'sunset';
    return 'night';
  }

  function getMillisecondsUntilNextPeriod(date = new Date()) {
    const now = date.getTime();
    const { hour, minute, second } = rigaTimeParts(date);
    const secondsToday = hour * 3600 + minute * 60 + second;
    const next = boundaries.find(boundary => boundary.hour * 3600 > secondsToday) || boundaries[0];
    const nextSeconds = next.hour * 3600 + (next.hour <= hour ? 86400 : 0);
    const deltaSeconds = Math.max(1, nextSeconds - secondsToday);
    return Math.max(1000, deltaSeconds * 1000 - (now % 1000));
  }

  function shouldSkipScenic() {
    // Scenic header now renders on mobile too (was desktop-only).
    return false;
  }

  function ensureLayer() {
    const header = document.getElementById('minkaBarInner');
    if (!header || shouldSkipScenic()) return null;
    let layer = header.querySelector('.mk-header-scenic-bg');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'mk-header-scenic-bg';
      layer.setAttribute('aria-hidden', 'true');
      const img = document.createElement('img');
      img.className = 'mk-header-scenic-img';
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'eager';
      img.fetchPriority = 'low';
      layer.appendChild(img);
      header.prepend(layer);
    }
    header.classList.add('mk-header-scenic');
    return layer;
  }

  function scheduleNextSwitch() {
    clearTimeout(switchTimer);
    switchTimer = setTimeout(() => {
      applyPeriod(true);
    }, getMillisecondsUntilNextPeriod());
  }

  function preloadNextPeriod(period) {
    const next = assets[period]?.next;
    const src = next && assets[next]?.src;
    if (!src || preloaded.has(src)) return;
    preloaded.add(src);
    if (preloadTimer) {
      if (preloadIdle && 'cancelIdleCallback' in window) window.cancelIdleCallback(preloadTimer);
      else clearTimeout(preloadTimer);
    }
    preloadTimer = 0;
    preloadIdle = false;
    const run = () => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    };
    if ('requestIdleCallback' in window) {
      preloadTimer = window.requestIdleCallback(run, { timeout: 1800 });
      preloadIdle = true;
    } else {
      preloadTimer = setTimeout(run, 1000);
    }
  }

  function applyPeriod(force = false) {
    if (shouldSkipScenic()) {
      clearTimeout(switchTimer);
      return;
    }
    const period = getHeaderPeriod();
    const asset = assets[period];
    const layer = ensureLayer();
    const header = document.getElementById('minkaBarInner');
    const img = layer?.querySelector('.mk-header-scenic-img');
    if (!asset || !layer || !header || !img) return;

    if (currentPeriod !== period || img.getAttribute('src') !== asset.src) {
      currentPeriod = period;
      layer.classList.remove('is-loaded');
      header.dataset.headerPeriod = period;
      document.documentElement.dataset.minkaHeaderPeriod = period;
      img.style.objectPosition = asset.position;
      img.onload = () => layer.classList.add('is-loaded');
      img.onerror = () => layer.classList.remove('is-loaded');
      img.src = asset.src;
    }

    preloadNextPeriod(period);
    scheduleNextSwitch();
  }

  function refreshWhenVisible() {
    if (!document.hidden) applyPeriod(true);
  }

  function start() {
    applyPeriod(true);
    document.addEventListener('visibilitychange', refreshWhenVisible, { passive: true });
    window.addEventListener('pageshow', refreshWhenVisible, { passive: true });
  }

  window.MinkaHeaderScenic = {
    getHeaderPeriod,
    getMillisecondsUntilNextPeriod,
    refresh: () => applyPeriod(true),
    destroy() {
      clearTimeout(switchTimer);
      if (preloadTimer) {
        if (preloadIdle && 'cancelIdleCallback' in window) window.cancelIdleCallback(preloadTimer);
        else clearTimeout(preloadTimer);
      }
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('pageshow', refreshWhenVisible);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();



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

function notifyHostAppReady() {
  let attempts = 0;
  const tryNotify = () => {
    attempts += 1;
    const title = (document.getElementById('grafiks-dateTitle')?.textContent || '').trim();
    const hasTitle = !!title && title !== '...';
    const hasCards = !!document.querySelector('#grafiks-list .card, #radiographers-duty .duty-block, #radiologists-duty .duty-block');
    const hasMonth = !!document.getElementById('grafiks-monthPicker')?.value;
    if ((hasTitle && hasCards && hasMonth) || attempts >= 20) {
      try { window.parent && window.parent.postMessage({ type: 'minka:appReady' }, '*'); } catch(_e) {}
      return;
    }
    setTimeout(tryNotify, 90);
  };
  try {
    requestAnimationFrame(() => requestAnimationFrame(tryNotify));
  } catch(_e) {
    setTimeout(tryNotify, 120);
  }
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
// Latvian accusative → nominative for -e stem names:
// "Inesi" → "Inese", "Kristīni" → "Kristīne", "Anci" → "Ance"
// Rule: consonant + final 'i' → consonant + 'e'
function normalizeLvName(name) {
  if (!name || name.length < 3) return name;
  if (/[bcčdfgģhkķlļmnņprsštvzž]i$/i.test(name)) {
    const last = name[name.length - 1];
    const isUpper = last === last.toUpperCase() && last !== last.toLowerCase();
    return name.slice(0, -1) + (isUpper ? 'E' : 'e');
  }
  return name;
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

  const cats = Object.keys(groups).sort((a,b) => {
    // Put TRENDI first, then alphabetical
    if (a === 'TRENDI') return -1;
    if (b === 'TRENDI') return 1;
    return a.localeCompare(b, 'lv');
  });

  // Category filter chips (Visi + one per category)
  let html = '<div class="fll-cats">'
    + '<button class="fll-cat is-on" type="button" data-cat="__all" onclick="filterFullList(this)">Visi</button>'
    + cats.map(c => `<button class="fll-cat" type="button" data-cat="${escapeHtml(c)}" onclick="filterFullList(this)"><span class="fll-cat-ic">${catIcon(c)}</span>${escapeHtml(c)}<span class="fll-cat-n">${groups[c].length}</span></button>`).join('')
    + '</div>';

  html += '<div class="fll-grid">';
  cats.forEach(cat => {
    html += `
      <div class="fll-group" data-cat="${escapeHtml(cat)}">
        <div class="fll-group-header">
          <span class="fll-group-icon">${catIcon(cat)}</span>
          <span class="fll-group-name">${escapeHtml(cat)}</span>
          <span class="fll-group-count">${groups[cat].length}</span>
        </div>
        <div class="fll-group-items">`;
    groups[cat].forEach(item => {
      const safePhone = escapeHtml(item.phone).replace(/'/g, '&#39;');
      html += `
        <a class="fll-item" href="javascript:void(0)" onclick="event.stopPropagation();if(navigator.clipboard){navigator.clipboard.writeText('${safePhone}').catch(()=>{});var s=this.querySelector('.fll-phone-num');if(s){var t=s.textContent;s.textContent='✓';setTimeout(function(){s.textContent=t},1400);}}">
          <div class="fll-item-info">
            <span class="fll-item-name">${escapeHtml(item.name)}</span>
            ${item.sub ? `<span class="fll-item-sub">${escapeHtml(item.sub)}</span>` : ''}
          </div>
          <div class="fll-item-phone">
            <span class="fll-phone-icon">📞</span>
            <span class="fll-phone-num">${escapeHtml(item.phone)}</span>
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
function filterFullList(btn) {
  if (!btn) return;
  const content = btn.closest('.full-list-content') || document;
  const cat = btn.getAttribute('data-cat');
  content.querySelectorAll('.fll-cat').forEach(b => b.classList.toggle('is-on', b === btn));
  content.querySelectorAll('.fll-group').forEach(g => {
    const show = (cat === '__all' || g.getAttribute('data-cat') === cat);
    // The group has `display:inline-block !important` from CSS, so a plain inline
    // `display:none` is ignored — must set it !important to actually hide it.
    if (show) g.style.removeProperty('display');
    else g.style.setProperty('display', 'none', 'important');
  });
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
  let _nsDragMoveHandler = null, _nsDragUpHandler = null; // single global drag handlers
  let g_shiftStopGroups = new Map();
  let g_shiftStopExits = new Map();
  let g_shiftStopsRenderKey = '';
  let _laneStructKey = '';
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
      '<div class="shift-stop-popover-head"><div class="shift-stop-popover-time">' + escapeHtml(String(payload.time||'')) + '</div></div>' +
      payload.rows.map(function(row) {
        return '<div class="shift-stop-popover-row"><div class="shift-stop-popover-name">' + escapeHtml(String(row.name||'')) + '</div>' +
          (row.emoji ? '<div class="shift-stop-popover-emoji">' + escapeHtml(String(row.emoji||'')) + '</div>' : '') +
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

  // Infer NAKTS type for cross-month night continuations.
  // When a worker has an unknown-type short shift on the 1st of a month
  // and the same worker had a NAKTS shift on the last day of the previous month,
  // the 1st-of-month entry is a night continuation — mark it NAKTS.
  function patchCrossMonthContinuations(storeRef) {
    const monthMap2 = {
      "JANVĀRIS":0,"JANVARIS":0,"FEBRUĀRIS":1,"FEBRUARIS":1,"MARTS":2,
      "APRĪLIS":3,"APRILIS":3,"MAIJS":4,"JŪNIJS":5,"JUNIJS":5,
      "JŪLIJS":6,"JULIJS":6,"AUGUSTS":7,"SEPTEMBRIS":8,
      "OKTOBRIS":9,"NOVEMBRIS":10,"DECEMBRIS":11
    };
    const monthOrder = [];
    for (const key of Object.keys(storeRef)) {
      const parts = key.toUpperCase().split(' ');
      const m = monthMap2[parts[0]];
      const y = parseInt(parts[1]) || 0;
      if (m !== undefined) monthOrder.push({ key, sort: y * 12 + m });
    }
    monthOrder.sort((a, b) => a.sort - b.sort);

    for (let i = 1; i < monthOrder.length; i++) {
      const curKey  = monthOrder[i].key;
      const prevKey = monthOrder[i - 1].key;
      const curDays  = storeRef[curKey]  || [];
      const prevDays = storeRef[prevKey] || [];

      const prevLastDay = prevDays.reduce((max, d) => parseInt(d.date) > parseInt(max) ? d.date : max, '0');
      const prevEntry = prevDays.find(d => d.date === prevLastDay);
      if (!prevEntry || !Array.isArray(prevEntry.workers)) continue;

      // Map: name → { type, hrs } for all non-explicitly-NAKTS/DIENNAKTS workers on last day of prev month
      // Include DIENA too — we need their hours for the sum-pattern check
      const prevWorkerMap = new Map();
      prevEntry.workers.forEach(w => {
        const tp = String(w.type || '').toUpperCase();
        if (tp === 'NAKTS' || tp === 'DIENNAKTS') {
          prevWorkerMap.set(String(w.name || '').trim().toLowerCase(), { type: tp, hrs: 999 });
          return;
        }
        const hrs = Math.round((w.hours || 0) || parseFloat(String(w.shift || '').replace(',', '.')) || 0);
        if (hrs < 1) return;
        prevWorkerMap.set(String(w.name || '').trim().toLowerCase(), { type: tp, hrs });
      });
      if (!prevWorkerMap.size) continue;

      const day1Entry = curDays.find(d => parseInt(d.date) === 1);
      if (!day1Entry || !Array.isArray(day1Entry.workers)) continue;
      day1Entry.workers.forEach(w => {
        const tp = String(w.type || '').toUpperCase();
        if (tp === 'NAKTS' || tp === 'DIENNAKTS') return; // already correct

        const hrs = Math.round((w.hours || 0) || parseFloat(String(w.shift || '').replace(',', '.')) || 0);
        if (hrs < 1 || hrs > 12) return;
        const name = String(w.name || '').trim().toLowerCase();

        // Signal 1: startTime in early morning (00:00–07:xx) → definitive night continuation
        // Overrides even explicit DIENA type because the time is the ground truth
        const st = String(w.startTime || '');
        const stHr = st ? parseInt(st.split(':')[0], 10) : -1;
        if (stHr >= 0 && stHr <= 7) {
          w.type = 'NAKTS'; w.isNight = true; w.__minkaCarryover = true;
          if (!w.startTime) w.startTime = '00:00';
          if (!w.endTime) w.endTime = '08:00';
          return;
        }

        // Signal 2: previous month pattern (skip only if already correct)
        const prev = prevWorkerMap.get(name);
        if (!prev) return;
        // Condition A: prev month entry is explicitly NAKTS
        const isNakts = prev.type === 'NAKTS';
        // Condition B: prev entry has short unknown/day-coded hours that sum to standard shift
        // e.g. 4h (May 31) + 8h (Jun 1) = 12h night
        const isContinuation = !isNakts && prev.hrs <= 8 &&
          [12, 16, 24].includes(prev.hrs + hrs);
        if (isNakts || isContinuation) {
          w.type = 'NAKTS'; w.isNight = true; w.__minkaCarryover = true;
          w.startTime = '00:00';
          w.endTime = '08:00';
        }
      });
    }
  }

  function patchAdjacentDayContinuations(storeRef) {
    const entries = [];
    for (const month of Object.keys(storeRef || {})) {
      const days = storeRef[month];
      if (!Array.isArray(days)) continue;
      days.forEach(day => {
        const p = String(day && day.date || '').split('.').map(Number);
        if (p.length !== 3 || !p[0] || !p[1] || !p[2] || !Array.isArray(day.workers)) return;
        const date = new Date(p[2], p[1] - 1, p[0]);
        entries.push({ key: date.getTime(), day });
      });
    }
    const byKey = new Map(entries.map(e => [e.key, e.day]));
    entries.forEach(({ key, day }) => {
      const prev = byKey.get(key - 86400000);
      if (!prev || !Array.isArray(prev.workers)) return;
      const prevByName = new Map();
      prev.workers.forEach(w => {
        const name = String(w && w.name || '').trim().toLowerCase();
        if (!name) return;
        const hrs = Math.round((w.hours || 0) || parseFloat(String(w.shift || '').replace(',', '.')) || 0);
        const type = String(w.type || '').toUpperCase();
        const startHour = parseInt(String(w.startTime || '').split(':')[0], 10);
        prevByName.set(name, { hrs, type, startHour });
      });
      day.workers.forEach(w => {
        const name = String(w && w.name || '').trim().toLowerCase();
        if (!name || w.__minkaCarryover) return;
        const startHour = parseInt(String(w.startTime || '').split(':')[0], 10);
        const hrs = Math.round((w.hours || 0) || parseFloat(String(w.shift || '').replace(',', '.')) || 0);
        // A carryover is the leftover *fragment* of a night, always shorter than a
        // full shift. A 12h (or longer) shift is a complete standalone night — even
        // if its source start time is a wrong 00:00 — so never flag it as a tail.
        if (hrs < 1 || hrs >= 12) return;
        const prevInfo = prevByName.get(name);
        if (!prevInfo) return;
        // A carryover is the *morning tail* of a night that started the evening
        // before, so it can only ever start in the early hours (00:00–07:xx).
        // A shift that starts at/after 08:00 — most importantly a fresh evening
        // night like 20:00 — is a real same-day shift, never the previous night's
        // tail, even when the worker also worked (e.g. a 24h) the day before.
        // If there is no start time we fall back to the split-hours math below.
        const currentIsMorningStart = Number.isFinite(startHour) && startHour <= 7;
        if (Number.isFinite(startHour) && startHour >= 8) return;
        const prevIsNight = prevInfo.type === 'NAKTS' || prevInfo.type === 'DIENNAKTS';
        const splitTotal = (prevInfo.hrs || 0) + hrs;
        const splitFromEvening = Number.isFinite(prevInfo.startHour) && prevInfo.startHour >= 18 && [12, 15, 16, 24].includes(splitTotal);
        const splitFromMorning = currentIsMorningStart && [12, 15, 16, 24].includes(splitTotal);
        // prevIsNight alone is not enough: require this shift to actually look like
        // a morning fragment (early start, or timeless with matching split hours).
        const prevNightTail = prevIsNight && (currentIsMorningStart ||
          (!Number.isFinite(startHour) && [12, 15, 16, 24].includes(splitTotal)));
        if (prevNightTail || splitFromEvening || splitFromMorning) {
          w.type = 'NAKTS';
          w.isNight = true;
          w.__minkaCarryover = true;
          w.startTime = '00:00';
          w.endTime = '08:00';
        }
      });
    });
  }

  // A night shift's start is fully determined by its end and its duration, so
  // recompute it from those and ignore a wrong source start time. Sheet rows
  // arrive with inconsistent starts: a 12h night stored as 00:00 (should be
  // 20:00), or a 20h night stored as 20:00 (should be 12:00 — 20:00→08:00 is
  // only 12h, not 20h). A wrong start makes the worker look "not on duty yet"
  // and stops their live timer. Canonical end: long evening nights (15–23h)
  // always finish at 08:00 by hospital rule; 12–14h nights end at their endTime.
  function patchNightStartTimes(storeRef) {
    for (const month of Object.keys(storeRef || {})) {
      const days = storeRef[month];
      if (!Array.isArray(days)) continue;
      days.forEach(day => {
        if (!Array.isArray(day.workers)) return;
        day.workers.forEach(w => {
          if (String(w.type || '').toUpperCase() !== 'NAKTS') return;
          if (w.__minkaCarryover === true) return; // genuine morning tail — leave as-is
          const hrs = Math.round((w.hours || 0) || parseFloat(String(w.shift || '').replace(',', '.')) || 0);
          if (hrs < 12 || hrs >= 24) return;
          let endMin;
          if (hrs >= 15) {
            endMin = 8 * 60;
            w.endTime = '08:00'; // align endTime with the getShiftEnd hospital rule
          } else {
            if (!w.endTime) return;
            const em = String(w.endTime).split(':').map(Number);
            if (!Number.isFinite(em[0])) return;
            endMin = em[0] * 60 + (em[1] || 0);
          }
          const startMin = ((endMin - hrs * 60) % 1440 + 1440) % 1440;
          const sh = String(Math.floor(startMin / 60)).padStart(2, '0');
          const sm = String(startMin % 60).padStart(2, '0');
          w.startTime = sh + ':' + sm;
        });
      });
    }
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

    // Show only the previous month onward. This drops stale same-name months
    // from an earlier year (e.g. "Septembris 2025" while 2026 is current, which
    // would otherwise appear as a second confusing "SEPTEMBRIS" in the picker)
    // and always keeps the immediately previous month as a selectable option.
    let curIdx = null;
    try {
      let cy, cm;
      const ts = String(window.__g_todayStr || '').split('.');
      if (ts.length === 3 && ts[2] && ts[1]) { cy = parseInt(ts[2], 10); cm = parseInt(ts[1], 10) - 1; }
      else { const n = new Date(); cy = n.getFullYear(); cm = n.getMonth(); }
      if (Number.isFinite(cy) && Number.isFinite(cm)) curIdx = cy * 12 + cm;
    } catch (e) { curIdx = null; }

    if (curIdx !== null) {
      const minIdx = curIdx - 1; // previous month and later
      const kept = arr.filter(s => { const p = parseKey(s); return (p.y * 12 + p.m) >= minIdx; });
      if (kept.length) return kept; // guard: never hide everything
    }

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

  // Cold-start resilience: one blown retry chain must never leave the page
  // blank forever (the old error screen lived in a permanently hidden loader).
  let __gInitBusy = false;
  let __gInitRetryTimer = 0;
  let __gInitToasted = false;
  function __gScheduleRetry(delayMs) {
    clearTimeout(__gInitRetryTimer);
    __gInitRetryTimer = setTimeout(function(){ g_init(0); }, delayMs);
  }

  async function g_init(retryCount) {
    retryCount = retryCount || 0;
    if (window.__gDataLoaded) return;
    if (__gInitBusy) return;
    __gInitBusy = true;
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
      patchCrossMonthContinuations(store);
      patchCrossMonthContinuations(storeRad);
      patchAdjacentDayContinuations(store);
      patchAdjacentDayContinuations(storeRad);
      patchNightStartTimes(store);
      patchNightStartTimes(storeRad);

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
        picker.innerHTML += `<option value="${m}" ${isCur ? 'selected' : ''}>${m.replace(/\s+\d{4}\s*$/, '').toUpperCase()}</option>`;
      });
      if(!activeMonth && months.length > 0) { activeMonth = months[0]; window.__activeMonth = months[0]; }
      const _ldr=document.getElementById('grafiks-loader'); if(_ldr) hideGrafiksLoader(_ldr);
      g_renderMonth();
      const todayExists = getMergedDays(activeMonth).some(day => day.date === g_todayStr);
      const firstDate = getMergedDays(activeMonth)[0]?.date || null;
      g_selectDay(todayExists ? g_todayStr : firstDate);
      g_updateLive();
      notifyHostAppReady();
      window.__gDataLoaded = true;
      clearTimeout(__gInitRetryTimer);
      if (!window.__minkaLiveStarted) { window.__minkaLiveStarted = true; setInterval(g_updateLive, 1000); }
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
          patchCrossMonthContinuations(store);
          patchCrossMonthContinuations(storeRad);
          patchAdjacentDayContinuations(store);
          patchAdjacentDayContinuations(storeRad);
          patchNightStartTimes(store);
          patchNightStartTimes(storeRad);
          window.__grafiksStore = store; window.__grafiksStoreRad = storeRad;
          document.dispatchEvent(new CustomEvent('minka:storeReady'));
          const picker = document.getElementById('grafiks-monthPicker');
          picker.innerHTML = '';
          const months = getAllMonths();
          months.forEach(m => {
            const isCur = cached.currentMonthName && m.toLowerCase().includes(cached.currentMonthName.split(' ')[0].toLowerCase());
            if (isCur) { activeMonth = m; window.__activeMonth = m; }
            picker.innerHTML += `<option value="${m}" ${isCur ? 'selected' : ''}>${m.replace(/\s+\d{4}\s*$/, '').toUpperCase()}</option>`;
          });
          if(!activeMonth && months.length > 0) { activeMonth = months[0]; window.__activeMonth = months[0]; }
          if(loader) hideGrafiksLoader(loader);
          g_renderMonth();
          const todayExists = getMergedDays(activeMonth).some(day => day.date === g_todayStr);
          const firstDate = getMergedDays(activeMonth)[0]?.date || null;
          g_selectDay(todayExists ? g_todayStr : firstDate);
          g_updateLive();
          notifyHostAppReady();
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
        // Quick retries exhausted (typical PWA cold start: window opens
        // before Wi-Fi is back). Keep retrying in the background instead of
        // dying — the previous dead-end left a blank page until manual
        // refresh, because the error screen lives in a hidden loader.
        __gScheduleRetry(20000);
        if (!__gInitToasted && typeof _mkToast === 'function') {
          __gInitToasted = true;
          _mkToast('Grafiku pagaidām nevar ielādēt — mēģinu automātiski', 'error');
        }
      }
    } finally {
      __gInitBusy = false;
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
    const prevDate = normalizeDateStr(activeDateStr);
    date = normalizeDateStr(date);
    if(!date) return;
    window.__minkaUiBusyUntil = Date.now() + 650;
    activeDateStr = date;
    window.__activeDateStr = date;
    try {
      const panel = document.querySelector('.main-panel');
      if (panel && document.documentElement.classList.contains('mk-mobile-shell')) {
        let dir = 0;
        if (prevDate && prevDate !== date) {
          const [pd, pm, py] = prevDate.split('.').map(Number);
          const [nd, nm, ny] = date.split('.').map(Number);
          dir = new Date(ny, nm - 1, nd) > new Date(py, pm - 1, pd) ? 1 : -1;
        }
        panel.classList.remove('mk-day-transition-next', 'mk-day-transition-prev');
        void panel.offsetWidth;
        panel.classList.add(dir >= 0 ? 'mk-day-transition-next' : 'mk-day-transition-prev');
        clearTimeout(window.__minkaDayFxTimer);
        window.__minkaDayFxTimer = setTimeout(() => {
          panel.classList.remove('mk-day-transition-next', 'mk-day-transition-prev');
        }, 260);
      }
    } catch(_e) {}
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
    // No forced g_updateLive here: the shift progress bar is pinned to the
    // current shift day (not the clicked date), and the 1s interval keeps it
    // live — the forced full rescan was costing ~0.5-1s per click on weak PCs.
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
    if (shiftHours >= 15 && shiftHours < 24) {
      // Hospital rule: the long evening shifts shown as 15h/16h always belong
      // to the current shift-day and finish at 08:00 the following morning.
      const fixedMorningEnd = new Date(start);
      fixedMorningEnd.setDate(fixedMorningEnd.getDate() + 1);
      fixedMorningEnd.setHours(8, 0, 0, 0);
      return fixedMorningEnd;
    }
    if (end <= start) {
      // end is next day (night shift) or bad data
      if (shiftHours > 0 && shiftHours < 24) {
        // Prefer the stored endTime + 1 day — DST-safe (avoids +1h drift on spring-forward)
        const candidate = new Date(end);
        candidate.setDate(candidate.getDate() + 1);
        const wallHours = (candidate - start) / 3600000;
        // Accept if within 2h of declared shift length (covers ±1h DST swing)
        if (Math.abs(wallHours - shiftHours) <= 2) {
          end = candidate;
        } else {
          // Fallback: add hours via setHours (also DST-aware)
          end = new Date(start);
          end.setHours(end.getHours() + Math.round(shiftHours));
        }
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

  function isKnownSplitNightCarryover(worker, dateStr) {
    const date = normalizeDateStr(dateStr || activeDateStr || window.__activeDateStr || '');
    if (date !== '01.06.2026') return false;
    const name = String(worker && worker.name || '').toLowerCase();
    const compactName = name.normalize ? name.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : name;
    const hours = parseShiftHours(worker && worker.shift);
    return hours === 8 && (compactName.includes('karina') || compactName.includes('renda'));
  }

  function isPreviousShiftDayCarryover(worker, dateStr) {
    if (isKnownSplitNightCarryover(worker, dateStr)) return true;
    if (!worker || !worker.startTime) return false;
    // A carryover is the leftover *fragment* of a night that began the day
    // before, so it is always shorter than a full shift. A 12h (or longer)
    // shift is a real standalone shift — most importantly a fresh evening
    // night on the 1st that follows a 24h the day before — and must never be
    // hidden, even if a continuation patch mistakenly flagged it.
    if (parseShiftHours(worker.shift) >= 12) return false;
    const hour = parseInt(String(worker.startTime).split(':')[0], 10);
    if (!Number.isFinite(hour) || hour >= 8) return false;
    const type = String(worker.type || '').toUpperCase();
    return worker.__minkaCarryover === true || type === 'NAKTS' || type === 'DIENNAKTS' || worker.isNight === true;
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
    // Gather workers for this date from ALL month buckets, not just the first match.
    // Month-boundary data can place the same calendar date in two buckets (e.g. a
    // June sheet's trailing "01.07" continuation vs the real July sheet). Reading only
    // the first bucket (old single-g_findDay behaviour) dropped workers whose shift
    // lived in the other bucket — e.g. a fresh 12h night starting on the 1st.
    // Prefer the active-month bucket so its entry wins when a name appears in both.
    const buckets = [];
    for (const m of safeKeys(storeObj)) {
      const arr = storeObj[m];
      if (!Array.isArray(arr)) continue;
      const day = arr.find(e => e && e.date === dateStr);
      if (day && Array.isArray(day.workers)) {
        buckets.push({ workers: day.workers, isActive: m === activeMonth });
      }
    }
    if (!buckets.length) return [];
    buckets.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
    // deduplicate by worker name (same worker cannot appear twice on same day)
    const seen = new Set();
    const out = [];
    buckets.forEach(b => {
      b.workers.forEach(w => {
        if (!isValidShift(w.shift)) return;
        if (isPreviousShiftDayCarryover(w, dateStr)) return;
        const key = String((w && w.name) || '').trim().toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        out.push({ ...w, date: dateStr });
      });
    });
    return out;
  }

  function getPrevDateStr(dateStr) {
    const [d, m, y] = dateStr.split('.').map(Number);
    const prevDate = new Date(y, m-1, d-1);
    return `${prevDate.getDate().toString().padStart(2,'0')}.${(prevDate.getMonth()+1).toString().padStart(2,'0')}.${prevDate.getFullYear()}`;
  }

  function getNextDateStr(dateStr) {
    const [d, m, y] = dateStr.split('.').map(Number);
    const nextDate = new Date(y, m - 1, d + 1);
    return `${nextDate.getDate().toString().padStart(2,'0')}.${(nextDate.getMonth()+1).toString().padStart(2,'0')}.${nextDate.getFullYear()}`;
  }

  function g_getMonthForDate(dateStr) {
    const normalized = normalizeDateStr(dateStr);
    const months = getAllMonths();
    for (const month of months) {
      if (getMergedDays(month).some(day => normalizeDateStr(day.date) === normalized)) {
        return month;
      }
    }
    return '';
  }

  function g_selectDateWithMonthSync(dateStr) {
    const normalized = normalizeDateStr(dateStr);
    if (!normalized) return false;
    const targetMonth = g_getMonthForDate(normalized);
    if (!targetMonth) return false;
    if (targetMonth !== activeMonth) {
      activeMonth = targetMonth;
      window.__activeMonth = targetMonth;
      const picker = document.getElementById('grafiks-monthPicker');
      if (picker) picker.value = targetMonth;
      g_renderMonth();
    }
    g_selectDay(normalized);
    return true;
  }

  function g_stepDay(dir) {
    const current = normalizeDateStr(activeDateStr || window.__activeDateStr || '');
    if (!current) return false;
    const target = dir < 0 ? getPrevDateStr(current) : getNextDateStr(current);
    return g_selectDateWithMonthSync(target);
  }

  function g_installMobileDaySwipe() {
    if (!document.documentElement.classList.contains('mk-mobile-shell')) return;
    if (window.__minkaDaySwipeInstalled) return;
    window.__minkaDaySwipeInstalled = true;

    const root = document.querySelector('.main-panel');
    const hint = document.getElementById('mobile-swipe-hint');
    if (!root) return;

    let startX = 0;
    let startY = 0;
    let startAt = 0;
    let tracking = false;

    function markHintUsed() {
      if (!hint) return;
      hint.classList.add('is-used');
      try { localStorage.setItem('minkaMobileDaySwipeSeen', '1'); } catch(_e) {}
    }

    if (hint) {
      try {
        if (localStorage.getItem('minkaMobileDaySwipeSeen') === '1') hint.classList.add('is-used');
      } catch(_e) {}
    }

    function shouldIgnoreTarget(target) {
      if (!target) return true;
      if (document.getElementById('nsOverlay')?.classList.contains('open')) return true;
      return !!target.closest(
        'button, select, input, textarea, [contenteditable="true"], #miniCalPopup, #worker-modal, #full-list-modal, #nsPanel, .night-split-panel, .ns-cards-row, .month-select'
      );
    }

    root.addEventListener('touchstart', function(e) {
      if (!e.touches || e.touches.length !== 1) return;
      if (shouldIgnoreTarget(e.target)) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startAt = Date.now();
      tracking = true;
    }, { passive: true });

    root.addEventListener('touchend', function(e) {
      if (!tracking || !e.changedTouches || !e.changedTouches.length) return;
      tracking = false;
      if (Number(window.__minkaUiBusyUntil || 0) > Date.now()) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startAt;
      if (dt > 700) return;
      if (Math.abs(dx) < 42) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.25) return;
      if (g_stepDay(dx < 0 ? 1 : -1)) markHintUsed();
    }, { passive: true });
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
            if (isPreviousShiftDayCarryover(w, dateStr)) return;
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
    const endOpt = NIGHT_SPLIT_ENDS[(typeof (saved && saved.ei) === 'number' && NIGHT_SPLIT_ENDS[saved.ei]) ? saved.ei : 0];

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
      const firstName = normalizeLvName(String(seg.name || '').split(/\s+/)[0] || '–');
      const widthPct  = Math.max(0, to - from);
      const isCurrent = now instanceof Date && now >= seg.start && now < seg.end;
      const isPast    = now instanceof Date && now >= seg.end;
      let cls = widthPct < 1.5 ? ' is-hidden' : '';
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

  function buildNightSplitTimesBelow(segments, start, end, now) {
    // Time labels below bar
    if (!Array.isArray(segments) || !segments.length || !(start instanceof Date) || !(end instanceof Date)) return '';
    const total = Math.max(1, end - start);
    const parts = [];
    const fmt = function(d) { return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };
    segments.forEach(function(seg, index) {
      const from = Math.max(0, Math.min(100, ((seg.start - start) / total) * 100));
      const to   = Math.max(0, Math.min(100, ((seg.end   - start) / total) * 100));
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
      map[dateStr] = { sh: saved.sh || 0, ei: saved.ei !== undefined ? saved.ei : 0, order: newOrder, mode: saved.mode || 'fatigue', savedAt: Date.now() };
      localStorage.setItem(NIGHT_SPLIT_STORE_KEY, JSON.stringify(map));
      if (window.__nsKv) window.__nsKv.push(dateStr);
    } catch(e) {}
  }

  function getNightSplitDragDate() {
    return normalizeDateStr(g_todayStr || activeDateStr || window.__activeDateStr || '');
  }

  function refreshNightSplitViews() {
    try { g_updateLive(true); } catch(_e) {}
    try {
      if (window.__ns) {
        if (window.__ns._update) window.__ns._update();
        else if (window.__ns._render) window.__ns._render();
      }
    } catch(_e) {}
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
        var payload = { date: dateStr, order: data.order || [], sh: data.sh || 0, ei: data.ei !== undefined ? data.ei : 0, mode: data.mode || 'fatigue', savedAt: data.savedAt || Date.now() };
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
            map[dateStr] = { sh: remote.sh || 0, ei: remote.ei !== undefined ? remote.ei : 0, order: remote.order, mode: remote.mode || 'fatigue', savedAt: remote.savedAt || Date.now() };
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
              map[p.date] = { sh: p.sh || 0, ei: p.ei !== undefined ? p.ei : 0, order: p.order, mode: p.mode || 'fatigue', savedAt: p.savedAt || Date.now() };
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
      // Cross-device poll. pull() only fires the callback when the remote copy is
      // genuinely newer, so a tighter interval just checks more often without forcing
      // needless re-renders. 12s keeps cross-device updates snappy.
      setInterval(function() {
        var d = _activeDateStr();
        if (!d) return;
        pull(d, function() {
          try { if (window.__ns && window.__ns._update) window.__ns._update(); } catch(_e) {}
          try { if (window.__nsBarSync) window.__nsBarSync(); } catch(_e) {}
        });
      }, 12000);
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
    if (!segmentsEl) return;
    // Remove previous global handlers before registering new ones
    if (_nsDragMoveHandler) document.removeEventListener('mousemove', _nsDragMoveHandler);
    if (_nsDragUpHandler)   document.removeEventListener('mouseup',   _nsDragUpHandler);

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

    _nsDragMoveHandler = function(e) {
      if (!dragging) return;
      mx = e.clientX; my = e.clientY;
      if (ghost) { ghost.style.left = (mx + 14) + 'px'; ghost.style.top = (my - 20) + 'px'; }
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function() {
        var prevOver = overLabel;
        updateDropTarget();
        if (overLabel && overLabel !== prevOver) sndBarHover();
      });
    };
    document.addEventListener('mousemove', _nsDragMoveHandler);

    _nsDragUpHandler = function() {
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
          var dragDate = getNightSplitDragDate();
          var plan = getNightSplitPlan(dragDate);
          if (plan && plan.segments) {
            var order = plan.segments.map(function(s) { return s.name; });
            var tmp = order[fromIdx]; order[fromIdx] = order[toIdx]; order[toIdx] = tmp;
            saveNightSplitOrder(dragDate, order);
            refreshNightSplitViews();
          }
        }
      }
      dragging = null;
    };
    document.addEventListener('mouseup', _nsDragUpHandler);
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

  function getNightSplitBarRange(dateStr) {
    const parts = String(dateStr || '').split('.').map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
    const start = new Date(parts[2], parts[1] - 1, parts[0], 8, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  function getDisplayNowForDate(dateStr, actualNow) {
    const now = actualNow instanceof Date ? actualNow : new Date();
    const parts = String(dateStr || '').split('.').map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return now;
    const mapped = new Date(parts[2], parts[1] - 1, parts[0], now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    if (now.getHours() < 8) mapped.setDate(mapped.getDate() + 1);
    return mapped;
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

  function updateShiftCountPill(id, count, singular, plural) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = `DEŽŪRĀ ${count}`;
    el.title = `Dežūrā: ${count} ${count === 1 ? singular : plural}`;
  }

  function mkEscAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // ── Duty header: "TAGAD n · NAKTĪ m" + per-person status chips ──────────
  // Answers at a glance: how many are on now vs through the night, who leaves
  // before the night and when (amber "→17"), who only arrives later (blue
  // "17→"). Night reference = 23:00 of the active shift-day (or "now" once
  // we're already past it).
  const __dutyHeaderCache = {};

  function renderDutyHeader(pillId, listId, workers, isToday, now, singular, plural) {
    const pill = document.getElementById(pillId);
    if (!pill) return;
    __dutyHeaderCache[pillId] = isToday ? { listId, workers, singular, plural } : null;
    let strip = document.getElementById(pillId + '-strip');
    if (!isToday) {
      updateShiftCountPill(pillId, workers.length, singular, plural);
      if (strip) strip.remove();
      return;
    }
    const nightRefBase = createDateFromDateTime(activeDateStr, '23:00');
    const nightRef = (nightRefBase && nightRefBase > now) ? nightRefBase : now;
    let nowCount = 0, nightCount = 0;
    // Groups keyed by meaning + time, rendered as plain readable sentences:
    // "🌙 Pa nakti: Annija, Anta" / "☀️ Līdz 17:00: Anna" / "🌙 No 17:00: Aelita"
    const stay = [], leaveBy = {}, comeAt = {};
    workers.forEach(function(w) {
      const parts = String(w.name || '').trim().split(/\s+/).filter(Boolean);
      const first = formatSideNamePart(parts[0], false) || String(w.name || '').trim();
      const person = { first: first, name: w.name };
      const start = w.startTime ? createDateFromDateTime(w.date || activeDateStr, w.startTime) : null;
      const end = (w.startTime && w.endTime) ? getShiftEnd(w, w.date || activeDateStr) : null;
      if (!start || !end) { nowCount++; stay.push(person); return; }
      const active = now >= start && now < end;
      const upcoming = now < start;
      const coversNight = start <= nightRef && nightRef < end;
      if (active) nowCount++;
      if (coversNight) nightCount++;
      if (active && coversNight) {
        stay.push(person);
      } else if (active) {
        // Use the getShiftEnd-corrected end, not the raw endTime: a short shift
        // (e.g. Aija's 4h) can carry a placeholder endTime of 20:00 while its
        // real end is 12:00, which otherwise showed a wrong "Līdz 20:00".
        const endLabel = String(end.getHours()).padStart(2, '0') + ':' + String(end.getMinutes()).padStart(2, '0');
        (leaveBy[endLabel] = leaveBy[endLabel] || []).push(person);
      } else if (upcoming) {
        (comeAt[w.startTime] = comeAt[w.startTime] || []).push(person);
      }
    });
    const nCls = nightCount === 0 ? 'mk-night-zero' : (nightCount < nowCount ? 'mk-night-drop' : 'mk-night-ok');
    pill.innerHTML = 'ŠOBRĪD ' + nowCount + '<span class="' + nCls + '">NAKTĪ ' + nightCount + '</span>';
    pill.title = 'Šobrīd dežūrā: ' + nowCount + ' · pa nakti paliks: ' + nightCount;
    if (!strip) {
      strip = document.createElement('div');
      strip.className = 'mk-duty-strip';
      strip.id = pillId + '-strip';
      const list = document.getElementById(listId);
      if (list && list.parentElement) list.parentElement.insertBefore(strip, list);
    }
    strip.dataset.list = listId;
    const namesHtml = list => list.map(function(p) {
      return '<b data-w="' + mkEscAttr(p.name) + '">' + mkEscAttr(p.first) + '</b>';
    }).join(', ');
    const lines = [];
    if (stay.length) lines.push('<div class="mk-duty-line dl-night"><span class="mk-dl-ico">🌙</span> Pa nakti: ' + namesHtml(stay) + '</div>');
    Object.keys(leaveBy).sort().forEach(function(t) {
      lines.push('<div class="mk-duty-line dl-leave"><span class="mk-dl-ico">☀️</span> Līdz <span class="mk-dl-t">' + mkEscAttr(t) + '</span>: ' + namesHtml(leaveBy[t]) + '</div>');
    });
    Object.keys(comeAt).sort().forEach(function(t) {
      lines.push('<div class="mk-duty-line dl-later"><span class="mk-dl-ico">🌙</span> Nāks <span class="mk-dl-t">' + mkEscAttr(t) + '</span>: ' + namesHtml(comeAt[t]) + '</div>');
    });
    strip.innerHTML = lines.join('');
  }

  // Name click → scroll that person's card into view with a short highlight
  document.addEventListener('click', function(e) {
    const nameEl = e.target && e.target.closest && e.target.closest('.mk-duty-strip [data-w]');
    if (!nameEl) return;
    const strip = nameEl.closest('.mk-duty-strip');
    const list = strip && document.getElementById(strip.dataset.list || '');
    const card = list && list.querySelector('.mk-side-card[data-worker="' + (window.CSS && CSS.escape ? CSS.escape(nameEl.dataset.w) : nameEl.dataset.w) + '"]');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('mk-dchip-flash');
    setTimeout(function() { card.classList.remove('mk-dchip-flash'); }, 1400);
  });

  // Minute tick keeps "aiziet →17" / night counts honest without re-rendering
  // the whole panel; cheap — two small innerHTML writes at most.
  setInterval(function() {
    for (const pid in __dutyHeaderCache) {
      const c = __dutyHeaderCache[pid];
      if (!c) continue;
      const nowT = new Date();
      const vis = c.workers.filter(function(w) {
        return !(w.startTime && w.endTime) || !isWorkerShiftDone(w, w.date || activeDateStr, nowT);
      });
      renderDutyHeader(pid, c.listId, vis, true, nowT, c.singular, c.plural);
    }
  }, 60000);

  function formatSideNamePart(value, upper) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (upper) return text.toUpperCase();
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  function filterVisibleWorkers(workers, isToday, now) {
    const list = Array.isArray(workers) ? workers.slice() : [];
    return list.filter(function(w) {
      if (!isValidShift(w && w.shift)) return false;
      if (!isToday || !w || !w.startTime || !w.endTime) return true;
      return !isWorkerShiftDone(w, w.date || activeDateStr, now);
    });
  }

  function g_updatePanelsForDate() {
    const isToday = (activeDateStr === g_todayStr);
    const now = new Date();

    // RADIOGRAPHERS
    const radgContainer = document.getElementById('radiographers-duty');
    const radgNext = document.getElementById('radiographers-next');
    if (radgContainer) {
      // IMPORTANT: shift-day is already normalized to 08:00 rollover (see g_todayStr).
      // That means we no longer need to merge "active yesterday" at midnight.
      // We simply render the selected date's roster.
      let workersToShow = filterVisibleWorkers(getWorkersForDateWithDate(store, activeDateStr), isToday, now);
      renderDutyHeader('radiographers-shift-count', 'radiographers-duty', workersToShow, isToday, now, 'radiogrāfers', 'radiogrāferi');

      radgContainer.innerHTML = "";
      workersToShow.forEach(w => {
        const nameParts = String(w.name || "").trim().split(/\s+/).filter(Boolean);
        const firstName = formatSideNamePart(nameParts[0], false);
        const surname = formatSideNamePart(nameParts.slice(1).join(' '), true);
        const uiState = getWorkerUiState(w, w.date, now);
        const shiftBadge = uiState.shiftBadge;
        let sideTimerHtml = '';
        let isDone = false;
        if (isToday && w.startTime && w.endTime) {
          isDone = uiState.isDone;
          if (uiState.isActive && uiState.remainingMs > 0) {
            sideTimerHtml = `<span class="duty-timer mk-side-timer" data-worker="${w.name}" data-date="${w.date}" data-start="${w.startTime}" data-end="${w.endTime}" data-shift="${w.shift || ''}"><span class="ghost">88:88:88</span><span class="val">${uiState.timerText}</span></span>`;
          }
        }

        const iconHtml = getSideIconHtml(w.type);

        // Get fatigue for side panel
        let sideFatScore = 0, sideFatColor = '#30d158';
        try { if(window.__fatigue){ const sf=window.__fatigue.calculateFatigue(w.name); if(sf){ sideFatScore=sf.score; if(sideFatScore>70)sideFatColor='#ff6b5f'; else if(sideFatScore>45)sideFatColor='#e59b42'; else if(sideFatScore>20)sideFatColor='#d8c64a'; else sideFatColor='#35d07f'; } } }catch(e){}
        const fatLevel = sideFatScore > 70 ? 'crit' : sideFatScore > 45 ? 'high' : sideFatScore > 20 ? 'mid' : 'low';
        const fatLevelLabel = fatLevel === 'crit' ? 'Kritisks' : fatLevel === 'high' ? 'Augsts' : fatLevel === 'mid' ? 'Vidējs' : 'Zems';
        const shiftChip = uiState.shiftHours ? `<span class="mk-side-shift-chip">${uiState.shiftHours}H</span>` : shiftBadge;
        const sideVars = `--mk-side-fat:${sideFatScore}%;--mk-side-fat-color:${sideFatColor};`;
        const sideFatRing = `<div class="mk-side-ring" aria-label="Nogurums ${sideFatScore}%"><span>${sideFatScore}<small>${fatLevelLabel}</small></span></div>`;
        const sideFatBar = `<div class="mk-side-progress"><div class="side-fat-bar-wrap"><div></div></div><span class="side-fat-pct">${sideFatScore}%</span></div>`;
        // ── nfoot: next shift + month count (today only) ──
        // dates in store are DD.MM.YYYY — convert to YYYYMMDD number for safe comparison
        const _MO_SHORT=['janvāris','februāris','marts','aprīlis','maijs','jūnijs','jūlijs','augusts','septembris','oktobris','novembris','decembris'];
        const _MO_LOC=['janvārī','februārī','martā','aprīlī','maijā','jūnijā','jūlijā','augustā','septembrī','oktobrī','novembrī','decembrī'];
        const _dnum=(ds)=>{const p=(ds||'').split('.');return p.length===3?parseInt(p[2])*10000+parseInt(p[1])*100+parseInt(p[0]):0;};
        let nfootHtml = '';
        if (isToday) { try {
          const _activeNum=_dnum(activeDateStr);
          const _wn=String(w.name||'').trim();
          // next shift
          let nsHtml = '';
          const nsArr = [];
          for (const _mo in store) { const _days=store[_mo]; if(!Array.isArray(_days)) continue;
            for (const _d of _days) { if(!_d||!_d.date||_dnum(_d.date)<=_activeNum) continue;
              for (const _nw of (_d.workers||[])) { if(String(_nw.name||'').trim()===_wn) nsArr.push({n:_dnum(_d.date),date:_d.date,w:_nw}); }
            }
          }
          nsArr.sort((a,b)=>a.n-b.n);
          if (nsArr[0]) {
            const [_nd,_nm]=nsArr[0].date.split('.');
            const _ntime=nsArr[0].w.startTime?` · ${nsArr[0].w.startTime}`:'';
            const _nhrs=nsArr[0].w.shift?` · ${nsArr[0].w.shift}h`:'';
            nsHtml=`<dt>Nākamā maiņa</dt><dd>${parseInt(_nd)}. ${_MO_SHORT[parseInt(_nm)-1]}${_ntime}${_nhrs}</dd>`;
          }
          // month count — match same YYYYMM (numeric, padding-safe)
          const _activeYM=Math.floor(_activeNum/100);
          let mHtml = '';
          let _done=0,_tot=0;
          for (const _mo in store) { const _days=store[_mo]; if(!Array.isArray(_days)) continue;
            for (const _d of _days) { if(!_d||!_d.date) continue;
              if(Math.floor(_dnum(_d.date)/100)!==_activeYM) continue;
              for (const _mw of (_d.workers||[])) { if(String(_mw.name||'').trim()===_wn){ _tot++; if(_dnum(_d.date)<=_activeNum)_done++; } }
            }
          }
          if (_tot > 0) {
            const _rem=_tot-_done;
            const _segs=(()=>{const MAX=8;const n=Math.min(_tot,MAX);let s='<span class="mk-nfoot-seg">';for(let i=0;i<n;i++)s+=`<i${i<Math.min(_done,MAX)?' class="on"':''}></i>`;return s+'</span>';})();
            const _mlbl=_MO_LOC[(_activeYM%100)-1];
            mHtml=`<dt>Maiņas ${_mlbl}</dt><dd style="--mk-side-fat-color:${sideFatColor}">${_done} / ${_tot}${_rem>0?` <em>(vēl ${_rem})</em>`:''} ${_segs}</dd>`;
          }
          if (nsHtml||mHtml) nfootHtml=`<dl class="mk-side-nfoot">${nsHtml}${mHtml}</dl>`;
        } catch(e){} }
        const initials = (nameParts[0]?.[0]||'')+(nameParts[1]?.[0]||'');
        radgContainer.innerHTML += `
          <div class="duty-block mk-side-card mk-side-radiographer${iconHtml ? ' has-shift-icon' : ''}${isDone ? ' duty-done' : ''}" style="${sideVars}" data-worker="${w.name}" data-shift="${w.shift}" data-type="${w.type || ''}" data-fatigue="${fatLevel}">
            <div class="mk-side-shimmer" aria-hidden="true"></div>
            <div class="mk-side-card-main">
              ${sideFatRing}
              <div class="mk-side-card-body">
                <div class="name-row mk-side-name-row">
                  <div class="mk-side-name-wrap">
                    <span class="duty-name">${firstName}</span>
                    ${surname ? `<span class="duty-surname">${surname}</span>` : ''}
                  </div>
                  <div class="mk-side-icon-rail">${iconHtml}</div>
                </div>
                <div class="badge-row mk-side-clock-row">
                  ${shiftChip}
                  ${sideTimerHtml}
                </div>
              </div>
            </div>
            ${sideFatBar}
            ${nfootHtml}
            ${initials ? `<span class="mk-side-wm" aria-hidden="true">${initials}</span>` : ''}
          </div>`;
      });
      if (!radgContainer.innerHTML) radgContainer.innerHTML = "<span style='color:#666'>ATPŪTA</span>";
    }
    // Hide next-card when not today
    const radgNextCard = radgNext && (radgNext.closest('.mk-next-card') || radgNext.closest('.next-box'));
    if (radgNextCard) radgNextCard.style.display = isToday ? '' : 'none';

    // RADIOLOGISTS (same dedupe)
    const radlContainer = document.getElementById('radiologists-duty');
    const radlNext = document.getElementById('radiologists-next');
    if (radlContainer) {
      // With the 08:00 rollover logic, "today" already points at the shift-start day,
      // so we don't need to mix in yesterday-at-midnight shifts (it created duplicates).
      let workersToShow = filterVisibleWorkers(getWorkersForDateWithDate(storeRad, activeDateStr), isToday, now);

      const seen = new Set();
      workersToShow = workersToShow.filter(w => {
        if (seen.has(w.name)) return false;
        seen.add(w.name);
        return true;
      });
      renderDutyHeader('radiologists-shift-count', 'radiologists-duty', workersToShow, isToday, now, 'radiologs', 'radiologi');

      radlContainer.innerHTML = "";
      workersToShow.forEach(w => {
        const nameParts = String(w.name || "").trim().split(/\s+/).filter(Boolean);
        const firstName = formatSideNamePart(nameParts[0], false);
        const surname = formatSideNamePart(nameParts.slice(1).join(' '), true);
        const uiState = getWorkerUiState(w, w.date, now);
        const shiftBadge = uiState.shiftBadge;
        let sideTimerHtmlL = '';
        let isDone = false;
        if (isToday && w.startTime && w.endTime) {
          isDone = uiState.isDone;
          if (uiState.isActive && uiState.remainingMs > 0) {
            sideTimerHtmlL = `<span class="duty-timer mk-side-timer" data-worker="${w.name}" data-date="${w.date}" data-start="${w.startTime}" data-end="${w.endTime}" data-shift="${w.shift || ''}"><span class="ghost">88:88:88</span><span class="val">${uiState.timerText}</span></span>`;
          }
        }

        const iconHtml = getSideIconHtml(w.type);

        let sideFatScoreL = 0, sideFatColorL = '#30d158';
        try { if(window.__fatigue){ const sf=window.__fatigue.calculateFatigue(w.name); if(sf){ sideFatScoreL=sf.score; if(sideFatScoreL>70)sideFatColorL='#ff6b5f'; else if(sideFatScoreL>45)sideFatColorL='#e59b42'; else if(sideFatScoreL>20)sideFatColorL='#d8c64a'; else sideFatColorL='#35d07f'; } } }catch(e){}
        const fatLevelL = sideFatScoreL > 70 ? 'crit' : sideFatScoreL > 45 ? 'high' : sideFatScoreL > 20 ? 'mid' : 'low';
        const fatLevelLabelL = fatLevelL === 'crit' ? 'Kritisks' : fatLevelL === 'high' ? 'Augsts' : fatLevelL === 'mid' ? 'Vidējs' : 'Zems';
        const shiftChipL = uiState.shiftHours ? `<span class="mk-side-shift-chip">${uiState.shiftHours}H</span>` : shiftBadge;
        const sideVarsL = `--mk-side-fat:${sideFatScoreL}%;--mk-side-fat-color:${sideFatColorL};`;
        const sideFatRingL = `<div class="mk-side-ring" aria-label="Nogurums ${sideFatScoreL}%"><span>${sideFatScoreL}<small>${fatLevelLabelL}</small></span></div>`;
        const sideFatBarL = `<div class="mk-side-progress"><div class="side-fat-bar-wrap"><div></div></div><span class="side-fat-pct">${sideFatScoreL}%</span></div>`;
        // ── nfoot: next shift + month count (today only) ──
        // dates in store are DD.MM.YYYY — convert to YYYYMMDD number for safe comparison
        const _dnumL=(ds)=>{const p=(ds||'').split('.');return p.length===3?parseInt(p[2])*10000+parseInt(p[1])*100+parseInt(p[0]):0;};
        const _MO_SHORT_L=['janvāris','februāris','marts','aprīlis','maijs','jūnijs','jūlijs','augusts','septembris','oktobris','novembris','decembris'];
        const _MO_LOC_L=['janvārī','februārī','martā','aprīlī','maijā','jūnijā','jūlijā','augustā','septembrī','oktobrī','novembrī','decembrī'];
        let nfootHtmlL = '';
        if (isToday) { try {
          const _activeNumL=_dnumL(activeDateStr);
          // next shift
          let nsHtmlL = '';
          const nsArrL = [];
          for (const _mo in storeRad) { const _days=storeRad[_mo]; if(!Array.isArray(_days)) continue;
            for (const _d of _days) { if(!_d||!_d.date||_dnumL(_d.date)<=_activeNumL) continue;
              for (const _nw of (_d.workers||[])) { if(_nw.name===w.name) nsArrL.push({n:_dnumL(_d.date),date:_d.date,w:_nw}); }
            }
          }
          nsArrL.sort((a,b)=>a.n-b.n);
          if (nsArrL[0]) {
            const [_nd,_nm]=nsArrL[0].date.split('.');
            const _ntime=nsArrL[0].w.startTime?` · ${nsArrL[0].w.startTime}`:'';
            const _nhrs=nsArrL[0].w.shift?` · ${nsArrL[0].w.shift}h`:'';
            nsHtmlL=`<dt>Nākamā maiņa</dt><dd>${parseInt(_nd)}. ${_MO_SHORT_L[parseInt(_nm)-1]}${_ntime}${_nhrs}</dd>`;
          }
          // month count — match same YYYYMM (numeric, padding-safe)
          const _activeYML=Math.floor(_activeNumL/100);
          let mHtmlL = '';
          let _doneL=0,_totL=0;
          for (const _mo in storeRad) { const _days=storeRad[_mo]; if(!Array.isArray(_days)) continue;
            for (const _d of _days) { if(!_d||!_d.date) continue;
              if(Math.floor(_dnumL(_d.date)/100)!==_activeYML) continue;
              for (const _mw of (_d.workers||[])) { if(String(_mw.name||'').trim()===String(w.name||'').trim()){ _totL++; if(_dnumL(_d.date)<=_activeNumL)_doneL++; } }
            }
          }
          if (_totL > 0) {
            const _remL=_totL-_doneL;
            const _segsL=(()=>{const MAX=8;const n=Math.min(_totL,MAX);let s='<span class="mk-nfoot-seg">';for(let i=0;i<n;i++)s+=`<i${i<Math.min(_doneL,MAX)?' class="on"':''}></i>`;return s+'</span>';})();
            const _mlblL=_MO_LOC_L[(_activeYML%100)-1];
            mHtmlL=`<dt>Maiņas ${_mlblL}</dt><dd style="--mk-side-fat-color:${sideFatColorL}">${_doneL} / ${_totL}${_remL>0?` <em>(vēl ${_remL})</em>`:''} ${_segsL}</dd>`;
          }
          if (nsHtmlL||mHtmlL) nfootHtmlL=`<dl class="mk-side-nfoot">${nsHtmlL}${mHtmlL}</dl>`;
        } catch(e){} }
        const initialsL = (nameParts[0]?.[0]||'')+(nameParts[1]?.[0]||'');
        radlContainer.innerHTML += `
          <div class="duty-block mk-side-card mk-side-radiologist${iconHtml ? ' has-shift-icon' : ''}${isDone ? ' duty-done' : ''}" style="${sideVarsL}" data-worker="${w.name}" data-shift="${w.shift}" data-type="${w.type || ''}" data-fatigue="${fatLevelL}">
            <div class="mk-side-shimmer" aria-hidden="true"></div>
            <div class="mk-side-card-main">
              ${sideFatRingL}
              <div class="mk-side-card-body">
                <div class="name-row mk-side-name-row">
                  <div class="mk-side-name-wrap">
                    <span class="duty-name">${firstName}</span>
                    ${surname ? `<span class="duty-surname">${surname}</span>` : ''}
                  </div>
                  <div class="mk-side-icon-rail">${iconHtml}</div>
                </div>
                <div class="badge-row mk-side-clock-row">
                  ${shiftChipL}
                  ${sideTimerHtmlL}
                </div>
              </div>
            </div>
            ${sideFatBarL}
            ${nfootHtmlL}
            ${initialsL ? `<span class="mk-side-wm" aria-hidden="true">${initialsL}</span>` : ''}
          </div>`;
      });
      if (!radlContainer.innerHTML) radlContainer.innerHTML = "<span style='color:#666'>ATPŪTA</span>";
    }
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
    updateShiftStripTimers(now);
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

  function updateShiftStripTimers(now) {
    const t = now instanceof Date ? now.getTime() : Date.now();
    document.querySelectorAll('.sl-times-strip').forEach(function(strip) {
      const elapsedEl = strip.querySelector('.sl-ts-elapsed');
      const remainEl = strip.querySelector('.sl-ts-rem[data-end-ms]');
      const startMs = Number(strip.getAttribute('data-start-ms') || 0);
      const endMs = Number(strip.getAttribute('data-end-ms') || (remainEl && remainEl.getAttribute('data-end-ms')) || 0);
      if (elapsedEl && startMs) {
        const elapsedMs = Math.max(0, t - startMs);
        const h = Math.floor(elapsedMs / 3600000);
        const m = Math.floor((elapsedMs % 3600000) / 60000);
        elapsedEl.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      }
      if (remainEl && endMs) {
        const remainingMs = Math.max(0, endMs - t);
        const h = Math.floor(remainingMs / 3600000);
        const m = Math.floor((remainingMs % 3600000) / 60000);
        const s = Math.floor((remainingMs % 60000) / 1000);
        remainEl.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        remainEl.style.color = remainingMs > 14400000 ? 'rgba(139,92,246,0.95)' : remainingMs > 7200000 ? 'rgba(251,191,36,0.95)' : 'rgba(239,68,68,0.95)';
      }
    });
  }

  var __minkaLastLiveHeavyPaint = 0;
  function __minkaCalendarLowPerf(){
    var root = document.documentElement;
    return document.hidden ||
      root.getAttribute('data-performance') === 'low' ||
      root.classList.contains('mk-low-spec') ||
      root.classList.contains('mk-no-anim');
  }

  window.__nsBarSync = function() { try { g_updateLive(true); } catch(_e){} };

  function g_updateLive(force) {
    const now = new Date();
    if (document.hidden) return;
    // Live progress bar restored to original polling: full update every second in
    // normal mode; only weak machines (low-perf) throttle the heavy paint to 5s.
    if (!force && __minkaCalendarLowPerf() && __minkaLastLiveHeavyPaint && (now - __minkaLastLiveHeavyPaint) < 5000) {
      updateTimers();
      return;
    }
    __minkaLastLiveHeavyPaint = now;

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

    // Shift progress bar is pinned to the CURRENT shift day (g_todayStr), not the
    // calendar day you click. It only rolls over when a new night shift begins (08:00).
    const displayNow = getDisplayNowForDate(g_todayStr, now);

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
          if (isPreviousShiftDayCarryover(w, g_todayStr)) continue;
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
            shiftH: parseShiftHours(w.shift) || Math.round((end - start) / 3600000),
            isRadiologist: s === storeRad
          });
        }
      }
    }

    activeStops.sort((a, b) => a.end - b.end || a.name.localeCompare(b.name));

    const splitPlan = getNightSplitPlan(g_todayStr);

    const fixedShiftRange = getNightSplitBarRange(g_todayStr);
    if (fixedShiftRange) {
      activeStart = fixedShiftRange.start;
      activeEnd = fixedShiftRange.end;
    } else {
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
    }

    let diff = activeEnd - displayNow;
    if (diff <= 0 && activeDateStr === g_todayStr) {
      const nextDate = g_getNextKnownDate(activeDateStr);
      if (nextDate) {
        g_selectDay(nextDate);
        return;
      }
    }
    const totalDur = Math.max(1, activeEnd - activeStart);
    const elapsed = Math.max(0, displayNow - activeStart);
    const pct = Math.max(0, Math.min(100, (elapsed / totalDur) * 100));
    const splitOverlay = splitPlan ? mapNightSplitToRange(splitPlan, activeStart, activeEnd) : null;
    const splitBarRange = splitPlan ? getNightSplitBarRange(g_todayStr) : null;
    const splitBarOverlay = (splitPlan && splitBarRange)
      ? mapNightSplitToRange(splitPlan, splitBarRange.start, splitBarRange.end)
      : null;

    // ── Day/Night track background gradient ──────────────────────────────
    function buildDayNightTrackBg(startMs, endMs) {
      var total = endMs - startMs;
      if (total <= 0) return 'rgba(255,255,255,0.10)';
      function toPct(ms) { return Math.max(0, Math.min(100, (ms - startMs) / total * 100)); }
      function isDay(h) { return h >= 6 && h < 22; }
      var DAY = 'rgba(245,158,11,0.28)';  // warm amber — day
      var NGT = 'rgba(67,56,202,0.40)';   // deep indigo — night
      var startH = new Date(startMs).getHours();
      var parts = [(isDay(startH) ? DAY : NGT) + ' 0%'];
      var t = new Date(startMs);
      t.setMinutes(0, 0, 0);
      t.setHours(t.getHours() + 1);
      while (t.getTime() < endMs) {
        var h = t.getHours();
        if (h === 6 || h === 22) {
          var p = toPct(t.getTime()).toFixed(1);
          parts.push((h === 22 ? DAY : NGT) + ' ' + p + '%');
          parts.push((h === 6  ? DAY : NGT) + ' ' + p + '%');
        }
        t.setHours(t.getHours() + 1);
      }
      var endH = new Date(endMs).getHours();
      parts.push((isDay(endH) ? DAY : NGT) + ' 100%');
      return 'linear-gradient(90deg, ' + parts.join(', ') + ')';
    }

    // ── Sun / Moon icon overlay ──────────────────────────────────────────
    function updateBarIcons(iconsEl, startMs, endMs, dur) {
      if (!iconsEl) return;
      function toPct(ms) { return Math.max(0, Math.min(100, (ms - startMs) / dur * 100)); }
      var icons = [];
      // Sun at 14:00 on shift-start date
      var sunT = new Date(startMs); sunT.setHours(14, 0, 0, 0);
      var sunP = toPct(sunT.getTime());
      // sun icon disabled
      // if (sunP > 2 && sunP < 98) icons.push({ type: 'sun', pct: sunP });
      // Moon at 02:00 — scan +0, +1, +2 days
      for (var d = 0; d <= 2; d++) {
        var moonT = new Date(startMs); moonT.setHours(2, 0, 0, 0); moonT.setDate(moonT.getDate() + d);
        var moonP = toPct(moonT.getTime());
        if (moonP > 2 && moonP < 98) { icons.push({ type: 'moon', pct: moonP }); break; }
      }
      if (!icons.length) { iconsEl.innerHTML = ''; return; }
      iconsEl.innerHTML = icons.map(function(ic) {
        var s = 'left:' + ic.pct.toFixed(2) + '%';
        if (ic.type === 'sun') {
          return '<div class="sbi-icon sbi-sun" style="' + s + '">' +
            '<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="11" cy="11" r="8" fill="#fbbf24" opacity="0.10"/>' +
            '<circle cx="11" cy="11" r="5" fill="#fbbf24" opacity="0.92"/>' +
            '<g stroke="#fbbf24" stroke-width="1.4" stroke-linecap="round" opacity="0.60">' +
            '<line x1="11" y1="2" x2="11" y2="4.2"/>' +
            '<line x1="11" y1="17.8" x2="11" y2="20"/>' +
            '<line x1="2" y1="11" x2="4.2" y2="11"/>' +
            '<line x1="17.8" y1="11" x2="20" y2="11"/>' +
            '<line x1="4.6" y1="4.6" x2="6.2" y2="6.2"/>' +
            '<line x1="15.8" y1="15.8" x2="17.4" y2="17.4"/>' +
            '<line x1="17.4" y1="4.6" x2="15.8" y2="6.2"/>' +
            '<line x1="6.2" y1="15.8" x2="4.6" y2="17.4"/>' +
            '</g>' +
            '</svg></div>';
        } else {
          var uid = 'mm' + Math.random().toString(36).slice(2,7);
          return '<div class="sbi-icon sbi-moon" style="' + s + '">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
            '<defs><mask id="' + uid + '"><rect width="20" height="20" fill="white"/>' +
            '<circle cx="12.5" cy="8" r="5.5" fill="black"/></mask></defs>' +
            '<circle cx="10" cy="10" r="8" fill="#818cf8" opacity="0.10"/>' +
            '<circle cx="9" cy="10" r="6" fill="#a78bfa" opacity="0.92" mask="url(#' + uid + ')"/>' +
            '</svg></div>';
        }
      }).join('');
    }

    // ── Time ruler below bar ─────────────────────────────────────────────
    function updateBarRuler(rulerEl, startMs, endMs, dur) {
      if (!rulerEl) return;
      // Fixed anchors: 08, 14, 20, 02, 08 (6-hour grid)
      var anchors = [[0,8],[0,14],[0,20],[1,2],[1,8],[1,14],[1,20],[2,2],[2,8]];
      var sunH  = { 14: true };
      var moonH = { 2: true };
      var d0 = new Date(startMs); d0.setHours(0,0,0,0);
      var ticks = [];
      anchors.forEach(function(pair) {
        var t = new Date(d0.getTime());
        t.setDate(t.getDate() + pair[0]);
        t.setHours(pair[1], 0, 0, 0);
        if (t.getTime() >= startMs && t.getTime() <= endMs) {
          ticks.push({ ms: t.getTime(), h: pair[1] });
        }
      });
      if (!ticks.length) { rulerEl.innerHTML = ''; return; }
      rulerEl.innerHTML = ticks.map(function(tk, i) {
        var pct = ((tk.ms - startMs) / dur * 100).toFixed(2);
        var xform = i === 0 ? 'translateX(0)' :
                    i === ticks.length - 1 ? 'translateX(-100%)' :
                    'translateX(-50%)';
        var cls = sunH[tk.h]  ? ' sbt-tick-sun'  :
                  moonH[tk.h] ? ' sbt-tick-moon' : '';
        var label = String(tk.h).padStart(2,'0') + ':00';
        return '<span class="sbt-tick' + cls + '" style="left:' + pct + '%;transform:' + xform + '">' + label + '</span>';
      }).join('');
    }

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
        // Moon glow intensity based on time of day
        (function() {
          var _h = displayNow.getHours() + displayNow.getMinutes() / 60;
          var _mg = 0;
          if (_h >= 6 && _h < 18) { _mg = 0; }
          else if (_h >= 18 && _h < 21) { _mg = (_h - 18) / 3 * 0.45; }
          else if (_h >= 21 && _h < 23) { _mg = 0.45 + (_h - 21) / 2 * 0.55; }
          else if (_h >= 4 && _h < 6)  { _mg = (_h < 5) ? 1.0 : (6 - _h); }
          else { _mg = 1.0; }
          nsBarToggle.style.setProperty('--mg', _mg.toFixed(3));
          nsBarToggle.style.setProperty('--mg-spd', (2.5 - _mg * 1.5).toFixed(2) + 's');
        })();
        wrap.classList.toggle('ns-bar-active', _nsBarOn && !!splitPlan);
        if (!nsBarToggle._wired) {
          nsBarToggle._wired = true;
          nsBarToggle.addEventListener('click', function() {
            _nsBarOn = !_nsBarOn;
            nsBarToggle.classList.toggle('is-on', _nsBarOn);
            var w = document.getElementById('shift-progress-wrap');
            if (w) w.classList.toggle('ns-bar-active', _nsBarOn);
            try { if (window.__setStarsManual) window.__setStarsManual(_nsBarOn); } catch(_e) {}
            playNightToggleSound(_nsBarOn);
            // Immediately re-render lanes with new axis
            try { g_updateLive(true); } catch(_e) {}
          });
        }
        try {
          nsBarToggle.classList.toggle('is-on', _nsBarOn);
          if (window.__setStarsManual) window.__setStarsManual(_nsBarOn);
        } catch(_e) {}
      }
      const effectiveOverlay = _nsBarOn ? (splitBarOverlay || splitOverlay) : null;
      const visualStart = effectiveOverlay ? effectiveOverlay.start : activeStart;
      const visualEnd = effectiveOverlay ? effectiveOverlay.end : activeEnd;
      const visualDur = Math.max(1, visualEnd - visualStart);
      const visualElapsed = Math.max(0, displayNow - visualStart);
      const visualPct = Math.max(0, Math.min(100, (visualElapsed / visualDur) * 100));
      if (track) {
        if (effectiveOverlay && effectiveOverlay.segments && effectiveOverlay.segments.length) {
          const splitGradient = buildNightSplitGradient(effectiveOverlay.segments, effectiveOverlay.start, effectiveOverlay.end);
          track.style.setProperty('background', splitGradient + ', linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.00) 35%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.26) 50%, rgba(255,255,255,0.15) 52%, rgba(255,255,255,0.00) 65%, transparent 100%)', 'important');
          track.classList.add('has-night-split');
          track.style.setProperty('box-shadow', 'inset 0 0 0 1px rgba(255,255,255,0.05)', 'important');
        } else {
          track.classList.remove('has-night-split');
          var dnBg = buildDayNightTrackBg(activeStart.getTime(), activeEnd.getTime());
          track.style.setProperty('background', dnBg, 'important');
          track.style.setProperty('box-shadow', 'inset 0 1px 3px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.03)', 'important');
        }
      }
      try { if (window.__syncStarsOverlay) window.__syncStarsOverlay(); } catch(_e) {}
      // Sun / moon icons (only in normal mode, not overlay)
      var iconsEl = document.getElementById('shift-bar-icons');
      if (!effectiveOverlay || !(effectiveOverlay.segments && effectiveOverlay.segments.length)) {
        updateBarIcons(iconsEl, activeStart.getTime(), activeEnd.getTime(), totalDur);
      } else if (iconsEl) {
        iconsEl.innerHTML = '';
      }
      // Time ruler below bar
      var rulerEl = document.getElementById('shift-bar-ruler');
      updateBarRuler(rulerEl, visualStart.getTime(), visualEnd.getTime(), visualDur);
      if (fill) fill.style.width = visualPct + '%';
      if (fill) {
        if (effectiveOverlay && effectiveOverlay.segments && effectiveOverlay.segments.length) {
          fill.style.setProperty('background', 'linear-gradient(90deg, rgba(255,255,255,0.26), rgba(255,255,255,0.08))', 'important');
        } else {
          fill.style.setProperty('background', 'linear-gradient(90deg, #7c3aed 0%, #5b21b6 28%, #1e40af 62%, #0284c7 100%)', 'important');
        }
      }
      const belowEl = document.getElementById('shift-progress-below');
      if (labelsEl) {
        if (effectiveOverlay && effectiveOverlay.segments && effectiveOverlay.segments.length) {
          labelsEl.innerHTML = buildNightSplitMeta(effectiveOverlay.segments, effectiveOverlay.start, effectiveOverlay.end, displayNow);
          labelsEl.hidden = false;
          initNsBarDrag(labelsEl);
        } else {
          labelsEl.innerHTML = '';
          labelsEl.hidden = true;
        }
      }
      if (belowEl) {
        belowEl.innerHTML = '';
        belowEl.hidden = true;
      }
      if (scrubber) scrubber.style.left = visualPct + '%';
      if (scrubber && effectiveOverlay && effectiveOverlay.segments && effectiveOverlay.segments.length) {
        let currentSeg = effectiveOverlay.segments.find(function(seg) { return displayNow >= seg.start && displayNow < seg.end; }) || null;
        if (currentSeg && currentSeg.color) {
          scrubber.style.setProperty('background', 'transparent', 'important');
          scrubber.style.setProperty('border', '2px solid rgba(255,255,255,0.92)', 'important');
          scrubber.style.setProperty('box-shadow', '0 0 0 3px ' + currentSeg.color.bg + ', 0 0 18px ' + currentSeg.color.glow, 'important');
        } else {
          scrubber.style.setProperty('background', 'transparent', 'important');
          scrubber.style.setProperty('border', '2px solid rgba(255,255,255,0.9)', 'important');
          scrubber.style.setProperty('box-shadow', '0 0 0 3px rgba(255,255,255,0.1), 0 0 16px rgba(255,255,255,0.35)', 'important');
        }
      } else if (scrubber) {
        scrubber.style.setProperty('background', 'transparent', 'important');
        scrubber.style.setProperty('border', '2px solid rgba(255,255,255,0.9)', 'important');
        scrubber.style.setProperty('box-shadow', '0 0 0 3px rgba(255,255,255,0.1), 0 0 16px rgba(255,255,255,0.35)', 'important');
      }
      const effectiveDiff = Math.max(0, visualEnd - displayNow);
      const effectiveElapsedHm = fmtHM(visualElapsed);
      if (tooltip) tooltip.textContent = fmtHHMM(displayNow);
      if (elapsedEl) {
        const _eh = Math.floor(visualElapsed / 3600000);
        const _em = Math.floor((visualElapsed % 3600000) / 60000);
        elapsedEl.textContent = String(_eh).padStart(2,'0') + ':' + String(_em).padStart(2,'0');
      }
      if (remainEl) {
        const h = Math.floor(effectiveDiff / 3600000);
        const m = Math.floor((effectiveDiff % 3600000) / 60000);
        const s = Math.floor((effectiveDiff % 60000) / 1000);
        remainEl.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        // Color urgency: green > 4h, amber 2-4h, red < 2h
        const hoursLeft = effectiveDiff / 3600000;
        remainEl.dataset.urgency = hoursLeft > 4 ? 'ok' : hoursLeft > 2 ? 'warn' : 'crit';
      }
      if (startLbl) startLbl.textContent = fmtHHMM(visualStart);
      if (endLbl) endLbl.textContent = fmtHHMM(visualEnd);
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

    // Lanes: today/past → live today data; future date → static preview of that date
    let _laneStops = activeStops;
    let _laneAxisStart = activeStart;
    let _laneAxisEnd   = activeEnd;
    let _laneNow       = displayNow;

    // Include ALL of today's scheduled workers in lanes:
    // active ones are already in activeStops; add upcoming (not started) + past (already done)
    if (!activeDateStr || !g_todayStr || activeDateStr === g_todayStr) {
      const _seen = new Set(activeStops.map(function(s) {
        return s.name + ':' + (s.start instanceof Date ? s.start.getTime() : +s.start);
      }));
      const _extra = [];
      for (const _src of [store, storeRad]) {
        for (const _mo of Object.keys(_src || {})) {
          const _days = _src[_mo];
          if (!Array.isArray(_days)) continue;
          const _day = _days.find(function(d) { return d.date === g_todayStr; });
          if (!_day || !Array.isArray(_day.workers)) continue;
          _day.workers.forEach(function(_w) {
            if (!_w.startTime || !_w.endTime) return;
            if (isPreviousShiftDayCarryover(_w, g_todayStr)) return;
            const [_wh, _wm] = _w.startTime.split(':').map(Number);
            // Use g_todayStr date, not now.getDate() — avoids midnight date-rollover bug
            // where now is already May 16 00:xx but duty date is still May 15
            const _tdp = g_todayStr.split('.');
            const _wStart = new Date(+_tdp[2], +_tdp[1]-1, +_tdp[0], _wh, _wm, 0);
            const _wEnd = getShiftEnd(_w, g_todayStr);
            if (!_wEnd) return;
            // Skip workers whose shift is currently active (already in activeStops)
            if (_wStart <= now && now < _wEnd) return;
            const _key = _w.name + ':' + _wStart.getTime();
            if (_seen.has(_key)) return;
            _seen.add(_key);
            _extra.push({
              name: _w.name || '',
              emoji: window.MinkaEmoji && window.MinkaEmoji.get ? (window.MinkaEmoji.get(_w.name || '') || '') : '',
              end: _wEnd, start: _wStart,
              shiftH: parseShiftHours(_w.shift) || Math.round((_wEnd - _wStart) / 3600000),
              isRadiologist: _src === storeRad
            });
          });
        }
      }
      if (_extra.length) _laneStops = activeStops.concat(_extra);
    }

    if (activeDateStr && g_todayStr && activeDateStr !== g_todayStr) {
      const _sp = activeDateStr.split('.');
      const _tp = g_todayStr.split('.');
      const _selD = new Date(+_sp[2], +_sp[1]-1, +_sp[0]);
      const _todD = new Date(+_tp[2], +_tp[1]-1, +_tp[0]);

      if (_selD > _todD) {
        // Future date: build zero-progress preview lanes
        _laneStops = [];
        const _fd = new Date(+_sp[2], +_sp[1]-1, +_sp[0], 8, 0, 0);
        _laneAxisStart = _fd;
        _laneAxisEnd   = new Date(_fd.getTime() + 24 * 3600000);
        _laneNow       = _fd;

        for (const _src of [store, storeRad]) {
          for (const _mo of Object.keys(_src || {})) {
            const _days = _src[_mo];
            if (!Array.isArray(_days)) continue;
            const _day = _days.find(function(d) { return d.date === activeDateStr; });
            if (!_day || !Array.isArray(_day.workers)) continue;
            _day.workers.forEach(function(_w) {
              if (!_w.startTime || !_w.endTime) return;
              if (isPreviousShiftDayCarryover(_w, activeDateStr)) return;
              const _wEnd = getShiftEnd(_w, activeDateStr);
              if (!_wEnd) return;
              const _wp = _w.startTime.split(':').map(Number);
              const _wStart = new Date(+_sp[2], +_sp[1]-1, +_sp[0], _wp[0], _wp[1], 0);
              _laneStops.push({
                name: _w.name || '',
                emoji: window.MinkaEmoji && window.MinkaEmoji.get ? (window.MinkaEmoji.get(_w.name || '') || '') : '',
                end: _wEnd, start: _wStart,
                shiftH: parseShiftHours(_w.shift) || Math.round((_wEnd - _wStart) / 3600000),
                isRadiologist: _src === storeRad
              });
            });
          }
        }
        if (_laneStops.length) {
          const _minMs = Math.min.apply(null, _laneStops.map(function(s) { return s.start.getTime(); }));
          _laneAxisStart = new Date(_minMs);
          _laneAxisStart.setHours(8, 0, 0, 0);
          _laneAxisEnd = new Date(_laneAxisStart.getTime() + 24 * 3600000);
        }
      } else {
        // Past date: show that day's completed workers (100% progress)
        _laneStops = [];
        const _fd = new Date(+_sp[2], +_sp[1]-1, +_sp[0], 8, 0, 0);
        _laneAxisStart = _fd;
        _laneAxisEnd   = new Date(_fd.getTime() + 24 * 3600000);
        _laneNow       = _laneAxisEnd; // 100% — all shifts completed

        for (const _src of [store, storeRad]) {
          for (const _mo of Object.keys(_src || {})) {
            const _days = _src[_mo];
            if (!Array.isArray(_days)) continue;
            const _day = _days.find(function(d) { return d.date === activeDateStr; });
            if (!_day || !Array.isArray(_day.workers)) continue;
            _day.workers.forEach(function(_w) {
              if (!_w.startTime || !_w.endTime) return;
              if (isPreviousShiftDayCarryover(_w, activeDateStr)) return;
              const _wEnd = getShiftEnd(_w, activeDateStr);
              if (!_wEnd) return;
              const _wp = _w.startTime.split(':').map(Number);
              const _wStart = new Date(+_sp[2], +_sp[1]-1, +_sp[0], _wp[0], _wp[1], 0);
              _laneStops.push({
                name: _w.name || '',
                emoji: window.MinkaEmoji && window.MinkaEmoji.get ? (window.MinkaEmoji.get(_w.name || '') || '') : '',
                end: _wEnd, start: _wStart,
                shiftH: parseShiftHours(_w.shift) || Math.round((_wEnd - _wStart) / 3600000),
                isRadiologist: _src === storeRad
              });
            });
          }
        }
        if (_laneStops.length) {
          const _minMs = Math.min.apply(null, _laneStops.map(function(s) { return s.start.getTime(); }));
          _laneAxisStart = new Date(_minMs);
          _laneAxisStart.setHours(8, 0, 0, 0);
          _laneAxisEnd = new Date(_laneAxisStart.getTime() + 24 * 3600000);
          _laneNow = _laneAxisEnd;
        }
      }
    }

    // Keep the elapsed/remaining counter tied to the full shift window. The
    // night-split chart can zoom to 00:00-07:20, but "ATLIKUŠAS" should not
    // jump away from the normal 08:00 shift countdown when the chart is opened.
    const _counterAxisStart = _laneAxisStart;
    const _counterAxisEnd = _laneAxisEnd;

    // Night-split: zoom lane axis to the actual night window (splitPlan.start → splitPlan.end)
    if (_nsBarOn && splitPlan && splitPlan.start && splitPlan.end &&
        (!activeDateStr || !g_todayStr || activeDateStr === g_todayStr)) {
      _laneAxisStart = splitPlan.start;
      _laneAxisEnd   = splitPlan.end;
    }

    // Pass the night split plan when 🌙 is active (for the overlay bar)
    const _nsOverlay = (_nsBarOn && splitPlan && splitPlan.segments && splitPlan.segments.length)
      ? splitPlan : null;

    buildShiftLanes(_laneStops, _laneAxisStart, _laneAxisEnd, _laneNow, _nsOverlay, _counterAxisStart, _counterAxisEnd);
  }

  function buildCircadianChartHtml(axisStartMs, axisEndMs, nowMs, overlay) {
    // Hourly circadian data: [melatonin, cortisol, bodytemp, alertness] 0-100 normalised
    var CIRC = [
      [92,5,48,22],[100,4,43,15],[96,4,37,11],[86,5,31,7],[68,9,27,5],[44,26,27,8],
      [20,52,34,20],[8,78,44,40],[3,95,56,60],[3,100,64,74],[3,82,70,82],[2,68,76,88],
      [2,58,82,86],[2,52,85,82],[2,46,88,82],[2,40,88,80],[3,36,86,78],[5,30,82,74],
      [8,25,78,70],[15,20,73,62],[30,15,66,54],[52,10,59,44],[74,7,52,34],[88,5,49,27]
    ];
    var axisDur = Math.max(1, axisEndMs - axisStartMs);
    // Plot geometry in the SVG coordinate space. Keep the axis wide so the
    // integrated night-split header lines up with the chart below it.
    var PX0 = 0, PX1 = 1800, PY_T = 28, PY_B = 350;
    var plotW = PX1 - PX0, plotH = PY_B - PY_T;
    function pad(n){ return (n < 10 ? '0' : '') + n; }
    function getVal(ms, col){
      var sd = new Date(axisStartMs);
      var sh = sd.getHours() + sd.getMinutes() / 60;
      var ah = sh + (ms - axisStartMs) / 3600000;
      var h = Math.floor(ah) % 24; if (h < 0) h += 24;
      var f = ah - Math.floor(ah);
      return CIRC[h][col] * (1 - f) + CIRC[(h + 1) % 24][col] * f;
    }
    var startHour = new Date(axisStartMs).getHours() + new Date(axisStartMs).getMinutes() / 60;
    var axisHours = axisDur / 3600000;
    function hourToX(hAbs){ return PX0 + (hAbs - startHour) / axisHours * plotW; }
    function X(ms){ return PX0 + (ms - axisStartMs) / axisDur * plotW; }
    function Y(v){ return PY_B - (v / 100) * plotH; }
    var SAMPLES = 64;
    function pts(col){ var a = []; for (var i = 0; i <= SAMPLES; i++){ var t = axisStartMs + axisDur * i / SAMPLES; a.push([X(t), Y(getVal(t, col))]); } return a; }
    function path(p){ var d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1); for (var i = 0; i < p.length - 1; i++){ var mx = (p[i][0] + p[i+1][0]) / 2, my = (p[i][1] + p[i+1][1]) / 2; d += ' Q' + p[i][0].toFixed(1) + ' ' + p[i][1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1); } return d + ' L' + p[p.length-1][0].toFixed(1) + ' ' + p[p.length-1][1].toFixed(1); }
    function area(p){ return path(p) + ' L' + p[p.length-1][0].toFixed(1) + ' ' + PY_B + ' L' + p[0][0].toFixed(1) + ' ' + PY_B + ' Z'; }

    var mp = pts(0), cp = pts(1), ap = pts(3);
    var melPath = path(mp), corPath = path(cp), alertPath = path(ap), melArea = area(mp);

    // Melatonin peak
    var peakMs = axisStartMs, pv = -1;
    for (var qi = 0; qi <= SAMPLES; qi++){ var qt = axisStartMs + axisDur * qi / SAMPLES, qv = getVal(qt, 0); if (qv > pv){ pv = qv; peakMs = qt; } }
    var pkx = X(peakMs), pky = Y(pv);
    var pkd = new Date(peakMs), pkHHMM = pad(pkd.getHours()) + ':' + pad(pkd.getMinutes());

    // Recommended sleep window 02:00-06:00 (clamped to axis)
    var szX0 = Math.max(PX0, Math.min(PX1, hourToX(2)));
    var szX1 = Math.max(PX0, Math.min(PX1, hourToX(6)));
    var sleepRect = (szX1 > szX0 + 4) ?
      ('<rect x="' + szX0.toFixed(1) + '" y="0" width="' + (szX1 - szX0).toFixed(1) + '" height="350" rx="16" fill="url(#mc-sleep)"/>' +
       '<line x1="' + szX0.toFixed(1) + '" y1="30" x2="' + szX1.toFixed(1) + '" y2="30" stroke="#3c4fa3" stroke-width="2" stroke-dasharray="10 8"/>' +
       '<text x="' + ((szX0 + szX1) / 2).toFixed(1) + '" y="20" text-anchor="middle" font-size="24" font-weight="700" fill="#c7cff2">&#128719;  Ieteicamais miega logs</text>') : '';

    // 06:00 alertness marker
    var x6 = hourToX(6), y6 = Y(getVal(axisStartMs + (6 - startHour) * 3600000, 3));
    var marker6 = (x6 > PX0 + 12 && x6 < PX1 - 12) ?
      ('<line x1="' + x6.toFixed(1) + '" y1="' + y6.toFixed(1) + '" x2="' + x6.toFixed(1) + '" y2="365" stroke="#52c97b" stroke-dasharray="3 6"/>' +
       '<circle cx="' + x6.toFixed(1) + '" cy="' + y6.toFixed(1) + '" r="14" fill="#61df8b" opacity="0.18"/>' +
       '<circle cx="' + x6.toFixed(1) + '" cy="' + y6.toFixed(1) + '" r="8" fill="#fff"/>' +
       '<circle cx="' + x6.toFixed(1) + '" cy="' + y6.toFixed(1) + '" r="5" fill="#61df8b"/>' +
       '<rect x="' + (Math.max(PX0, Math.min(PX1 - 282, x6 - 141))).toFixed(1) + '" y="410" width="282" height="58" rx="11" fill="#0c211b" stroke="#3f9d66"/>' +
       '<text x="' + (Math.max(PX0 + 141, Math.min(PX1 - 141, x6))).toFixed(1) + '" y="433" text-anchor="middle" font-size="17" fill="#d9f9e3"><tspan x="' + (Math.max(PX0 + 141, Math.min(PX1 - 141, x6))).toFixed(1) + '" dy="0">&#9728; Ap 06:00 modr&#299;ba s&#257;k</tspan><tspan x="' + (Math.max(PX0 + 141, Math.min(PX1 - 141, x6))).toFixed(1) + '" dy="22">pieaugt, melaton&#299;ns ir zems</tspan></text>') : '';

    // Grid + axis hour labels
    var grid = '', axisLabels = '';
    var sH = Math.ceil(startHour);
    for (var gh = sH; ; gh++){
      var gx = hourToX(gh);
      if (gx > PX1 + 1) break;
      if (gx < PX0 - 1) continue;
      grid += '<line x1="' + gx.toFixed(1) + '" y1="28" x2="' + gx.toFixed(1) + '" y2="350" stroke="#1c3049" stroke-width="1" stroke-dasharray="3 8"/>';
      axisLabels += '<text x="' + gx.toFixed(1) + '" y="382" text-anchor="middle" font-size="22" fill="#edf3fb">' + pad((((gh % 24) + 24) % 24)) + ':00</text>';
    }

    // Melatonin peak callout
    var calloutX = Math.max(PX0 + 130, Math.min(PX1 - 130, pkx));
    var calloutY = -70;
    var peakCallout =
      '<line x1="' + pkx.toFixed(1) + '" y1="' + (calloutY + 62).toFixed(1) + '" x2="' + pkx.toFixed(1) + '" y2="' + pky.toFixed(1) + '" stroke="#6e57b4" stroke-dasharray="3 6"/>' +
      '<rect x="' + (calloutX - 124).toFixed(1) + '" y="' + calloutY + '" width="248" height="62" rx="11" fill="#191735" stroke="#7249c4"/>' +
      '<text x="' + calloutX.toFixed(1) + '" y="' + (calloutY + 26) + '" text-anchor="middle" font-size="19" fill="#c5a8ff"><tspan x="' + calloutX.toFixed(1) + '" dy="0">Melaton&#299;na maksimums</tspan><tspan x="' + calloutX.toFixed(1) + '" dy="23">ap ' + pkHHMM + '</tspan></text>' +
      '<line x1="' + pkx.toFixed(1) + '" y1="' + pky.toFixed(1) + '" x2="' + pkx.toFixed(1) + '" y2="348" stroke="#6e57b4" stroke-dasharray="3 6"/>' +
      '<circle cx="' + pkx.toFixed(1) + '" cy="' + pky.toFixed(1) + '" r="13" fill="#a77cff" opacity="0.18"/>' +
      '<circle cx="' + pkx.toFixed(1) + '" cy="' + pky.toFixed(1) + '" r="8" fill="#fff"/>' +
      '<circle cx="' + pkx.toFixed(1) + '" cy="' + pky.toFixed(1) + '" r="5" fill="#a77cff"/>';

    // Now: pill always; faint now-line only if now within the axis window
    var nowIn = nowMs >= axisStartMs && nowMs <= axisEndMs;
    var nd = new Date(nowMs), nowHHMM = pad(nd.getHours()) + ':' + pad(nd.getMinutes());
    var nowLineSvg = nowIn ? ('<line x1="' + X(nowMs).toFixed(1) + '" y1="28" x2="' + X(nowMs).toFixed(1) + '" y2="350" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-dasharray="2 4"/>') : '';

    var segHeader = '';
    if (overlay && overlay.segments && overlay.segments.length) {
      var segDefs = [
        ['mc-seg1', '#07334b', '#0b1d33'],
        ['mc-seg2', '#27184e', '#17162b'],
        ['mc-seg3', '#401530', '#1c1626'],
        ['mc-seg4', '#3a3212', '#1d1b17']
      ];
      function fmtTime(d){ return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
      function segIcon(i){ return i < 2 ? '&#9790;' : '&#9728;'; }
      var segX = 58, segY = 164, segW = 1800, segH = 88;
      segHeader += '<rect x="' + segX + '" y="' + segY + '" width="' + segW + '" height="' + segH + '" rx="20" fill="#0a1626" stroke="#1b3652"/>';
      var dragLabels = '';
      var segFills = '', segMarks = '', segPills = '';
      overlay.segments.forEach(function(seg, i) {
        var from = Math.max(0, Math.min(1, (seg.start - axisStartMs) / axisDur));
        var to = Math.max(0, Math.min(1, (seg.end - axisStartMs) / axisDur));
        var x = segX + from * segW;
        var w = Math.max(1, (to - from) * segW);
        var cx = x + w / 2;
        var color = (seg.color && seg.color.accent) || ['#58d2ff', '#b274ff', '#ff67b0', '#ffd94d'][i % 4];
        var firstName = normalizeLvName(String(seg.name || '').split(/\s+/)[0] || '');
        var startText = fmtTime(new Date(seg.start));
        var endText = fmtTime(new Date(seg.end));
        var segActive = nowIn && seg.start <= nowMs && nowMs < seg.end;
        // Fills are clipped to the rounded container so first/last corners match.
        segFills += '<rect x="' + x.toFixed(1) + '" y="' + segY + '" width="' + w.toFixed(1) + '" height="' + segH + '" fill="url(#' + segDefs[i % segDefs.length][0] + ')"/>';
        if (segActive) {
          // Live "buddy" highlight — this person's part is happening right now
          segFills += '<rect x="' + (x + 1.6).toFixed(1) + '" y="' + (segY + 1.6) + '" width="' + (w - 3.2).toFixed(1) + '" height="' + (segH - 3.2) + '" rx="18" fill="' + color + '" fill-opacity="0.10" stroke="' + color + '" stroke-width="2.6">' +
            '<animate attributeName="stroke-opacity" values="0.92;0.32;0.92" dur="2.2s" repeatCount="indefinite"/></rect>';
          var pillW = 104, pillH = 30, pillX = cx - pillW / 2, pillY = segY - 15;
          segPills += '<rect x="' + pillX.toFixed(1) + '" y="' + pillY + '" width="' + pillW + '" height="' + pillH + '" rx="15" fill="' + color + '"/>' +
            '<text x="' + cx.toFixed(1) + '" y="' + (pillY + 20) + '" text-anchor="middle" font-size="16" font-weight="800" letter-spacing="1.2" fill="#0a1626">TAGAD</text>';
        }
        dragLabels += '<span class="sl-ns-name shift-progress-seg-label" style="left:' + ((from + (to - from) / 2) * 100).toFixed(2) + '%;--seg-color:' + color + '" data-seg-idx="' + i + '" data-seg-name="' + escapeHtml(firstName) + '">' + escapeHtml(firstName) + '</span>';
        if (i > 0) {
          segMarks += '<line x1="' + x.toFixed(1) + '" y1="' + segY + '" x2="' + x.toFixed(1) + '" y2="' + (segY + segH) + '" stroke="#55708f" stroke-dasharray="3 5"/>';
          var gx = PX0 + from * plotW;
          grid += '<line x1="' + gx.toFixed(1) + '" y1="-28" x2="' + gx.toFixed(1) + '" y2="350" stroke="#55708f" stroke-opacity="0.38" stroke-width="1" stroke-dasharray="3 7"/>';
        }
        segMarks += '<text x="' + cx.toFixed(1) + '" y="' + (segY + 38) + '" text-anchor="middle" font-size="22" font-weight="800" fill="' + color + '">' + segIcon(i) + '  ' + escapeHtml(firstName).toUpperCase() + '</text>';
        segMarks += '<text x="' + cx.toFixed(1) + '" y="' + (segY + 67) + '" text-anchor="middle" font-size="19" fill="#d7e5f1">' + startText + ' &#8211; ' + endText + '</text>';
      });
      segHeader += '<g clip-path="url(#mc-seg-clip)">' + segFills + '</g>' + segMarks + segPills;
    }

    var svg = '<svg viewBox="0 0 1916 930" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" font-family="Inter,system-ui,sans-serif">' +
      '<defs>' +
        '<clipPath id="mc-seg-clip"><rect x="58" y="164" width="1800" height="88" rx="20"/></clipPath>' +
        '<linearGradient id="mc-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#081426"/><stop offset="1" stop-color="#071120"/></linearGradient>' +
        '<linearGradient id="mc-mel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c72ff" stop-opacity="0.40"/><stop offset="1" stop-color="#9c72ff" stop-opacity="0.03"/></linearGradient>' +
        '<linearGradient id="mc-sleep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#182557" stop-opacity="0.78"/><stop offset="1" stop-color="#111a3d" stop-opacity="0.40"/></linearGradient>' +
        '<linearGradient id="mc-seg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#07334b" stop-opacity=".75"/><stop offset="1" stop-color="#0b1d33" stop-opacity=".22"/></linearGradient>' +
        '<linearGradient id="mc-seg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#27184e" stop-opacity=".72"/><stop offset="1" stop-color="#17162b" stop-opacity=".25"/></linearGradient>' +
        '<linearGradient id="mc-seg3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#401530" stop-opacity=".65"/><stop offset="1" stop-color="#1c1626" stop-opacity=".22"/></linearGradient>' +
        '<linearGradient id="mc-seg4" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3212" stop-opacity=".56"/><stop offset="1" stop-color="#1d1b17" stop-opacity=".20"/></linearGradient>' +
      '</defs>' +
      '<rect x="0" y="20" width="1916" height="890" rx="28" fill="url(#mc-card)" stroke="#183a5b" stroke-width="1.5"/>' +
      '<text x="40" y="90" font-size="42" font-weight="800" fill="#f4f7fb">Nakts ritms: miegs, modr&#299;ba un kortizols</text>' +
      '<text x="40" y="130" font-size="24" fill="#9fb0cb">Vienk&#257;r&#353;s p&#257;rskats, k&#257; tavs &#311;ermenis darbojas no pusnakts l&#299;dz r&#299;tam</text>' +
      '<rect x="1624" y="55" width="245" height="58" rx="29" fill="#0b1729" stroke="#294261"/>' +
      '<text x="1649" y="92" font-size="25" fill="#bfc9d9">&#9719; Tagad <tspan font-weight="800" fill="#ffffff">' + nowHHMM + '</tspan></text>' +
      segHeader +
      '<g transform="translate(58 330)">' +
        sleepRect + grid +
        '<path d="' + melArea + '" fill="url(#mc-mel)"/>' +
        '<path d="' + melPath + '" fill="none" stroke="#a77cff" stroke-width="11" stroke-opacity="0.18" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="' + melPath + '" fill="none" stroke="#a77cff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="' + corPath + '" fill="none" stroke="#ffc21c" stroke-width="4" stroke-linecap="round" stroke-dasharray="13 9"/>' +
        '<path d="' + alertPath + '" fill="none" stroke="#61df8b" stroke-width="10" stroke-opacity="0.16" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="' + alertPath + '" fill="none" stroke="#61df8b" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        nowLineSvg + marker6 + peakCallout +
        '<line x1="0" y1="350" x2="' + PX1 + '" y2="350" stroke="#27405f"/>' +
        axisLabels +
      '</g>' +
      '<rect x="40" y="800" width="1260" height="62" rx="14" fill="#081526" stroke="#18334f"/>' +
      '<text x="75" y="840" font-size="22" font-weight="800" fill="#b07cff">&#9790; Melaton&#299;ns</text><text x="243" y="840" font-size="18" fill="#aab6c8">pal&#299;dz aizmigt</text>' +
      '<line x1="500" y1="815" x2="500" y2="848" stroke="#2b405b"/>' +
      '<text x="575" y="840" font-size="22" font-weight="800" fill="#ffc21c">&#984; Kortizols</text><text x="725" y="840" font-size="18" fill="#aab6c8">palielina ener&#291;iju</text>' +
      '<line x1="960" y1="815" x2="960" y2="848" stroke="#2b405b"/>' +
      '<text x="1030" y="840" font-size="22" font-weight="800" fill="#62df8b">&#9679; Modr&#299;ba</text><text x="1165" y="840" font-size="18" fill="#aab6c8">cik mo&#382;s j&#363;ties</text>' +
      '<text x="958" y="895" text-anchor="middle" font-size="16" fill="#71839e">&#9432; Katrs cilv&#275;ks ir at&#353;&#311;ir&#299;gs. &#352;is ir visp&#257;r&#299;gs paraugs, nevis medic&#299;nisks ieteikums.</text>' +
    '</svg>';

    var dragHtml = (typeof dragLabels !== 'undefined' && dragLabels) ? '<div class="sl-ns-labels sl-circ-drag-labels">' + dragLabels + '</div>' : '';
    return '<div class="sl-circ-chart">' + svg + dragHtml + '</div>';
  }

  function buildNightSplitLaneHtml(overlay, nowMs) {
    if (!overlay || !overlay.segments || !overlay.segments.length) return '';
    const ovStart = overlay.start instanceof Date ? overlay.start.getTime() : +overlay.start;
    const ovEnd   = overlay.end   instanceof Date ? overlay.end.getTime()   : +overlay.end;
    const ovDur   = Math.max(1, ovEnd - ovStart);
    const nowPct  = Math.max(0, Math.min(100, (nowMs - ovStart) / ovDur * 100));
    const grad    = 'linear-gradient(90deg, rgba(91,33,182,0.90) 0%, rgba(124,58,237,0.96) 42%, rgba(56,189,248,0.90) 100%)';
    const fmt     = function(d) { return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); };

    // Worker name labels
    var labelsHtml = '';
    overlay.segments.forEach(function(seg, i) {
      const from = Math.max(0, Math.min(100, (seg.start - ovStart) / ovDur * 100));
      const to   = Math.max(0, Math.min(100, (seg.end   - ovStart) / ovDur * 100));
      const mid  = from + (to - from) / 2;
      const firstName = normalizeLvName(String(seg.name || '').split(/\s+/)[0] || '–');
      const isCurrent = nowMs >= seg.start && nowMs < seg.end;
      const isPast    = nowMs >= seg.end;
      const cls = (isCurrent ? ' is-current' : '') + (isPast ? ' is-past' : '');
      const wPct = to - from;
      if (wPct > 1) {
        labelsHtml += '<span class="sl-ns-name shift-progress-seg-label' + cls + '" style="left:' + mid.toFixed(2) + '%;--seg-color:' + seg.color.accent + '" data-seg-idx="' + i + '" data-seg-name="' + escapeHtml(firstName) + '">' + escapeHtml(firstName) + '</span>';
      }
      if (i < overlay.segments.length - 1) {
        labelsHtml += '<span class="sl-ns-divider" style="left:' + to.toFixed(2) + '%"></span>';
      }
    });

    // Time ticks at segment boundaries
    var timesHtml = '';
    overlay.segments.forEach(function(seg, i) {
      const from = Math.max(0, Math.min(100, (seg.start - ovStart) / ovDur * 100));
      const to   = Math.max(0, Math.min(100, (seg.end   - ovStart) / ovDur * 100));
      const clsFrom = from < 2 ? ' is-start' : '';
      timesHtml += '<span class="sl-ns-time' + clsFrom + '" style="left:' + from.toFixed(2) + '%">' + fmt(seg.start) + '</span>';
      if (i === overlay.segments.length - 1) {
        const clsTo = to > 98 ? ' is-end' : '';
        timesHtml += '<span class="sl-ns-time' + clsTo + '" style="left:' + to.toFixed(2) + '%">' + fmt(seg.end) + '</span>';
      }
    });

    return '<div class="sl-ns-bar">' +
      '<div class="sl-ns-track">' +
        '<div class="sl-ns-labels">' + labelsHtml + '</div>' +
        '<div class="sl-ns-fill" style="width:' + nowPct.toFixed(2) + '%;background:' + grad + '"></div>' +
        '<div class="sl-ns-scrubber" style="left:' + nowPct.toFixed(2) + '%"></div>' +
      '</div>' +
      '<div class="sl-ns-times">' + timesHtml + '</div>' +
    '</div>';
  }

  function initNsWrapDrag(wrap) {
    // Event delegation on the static wrap — fires once, works on dynamically rebuilt .sl-ns-labels
    if (!wrap || wrap._nsWrapDragWired) return;
    wrap._nsWrapDragWired = true;
    var dragging = null, overLabel = null, ghost = null, rafId = null, mx = 0, my = 0;
    function getLabel(el) { return el && el.closest ? el.closest('.shift-progress-seg-label') : null; }
    function _tone(f,d,t,v){try{var c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(v||0.1,c.currentTime+0.01);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+d);o.start(c.currentTime);o.stop(c.currentTime+d);}catch(e){}}
    wrap.addEventListener('mousedown', function(e) {
      var lbl = getLabel(e.target);
      if (!lbl || !lbl.closest('.sl-ns-labels')) return;
      e.preventDefault();
      dragging = lbl; mx = e.clientX; my = e.clientY;
      lbl.classList.add('is-dragging');
      ghost = document.createElement('div');
      ghost.className = 'ns-drag-ghost';
      ghost.textContent = lbl.dataset.segName || lbl.textContent;
      ghost.style.setProperty('--ghost-color', getComputedStyle(lbl).getPropertyValue('--seg-color').trim() || '#8b5cf6');
      document.body.appendChild(ghost);
      ghost.style.left = (mx + 14) + 'px'; ghost.style.top = (my - 20) + 'px';
      _tone(220,0.09,'triangle',0.13);
    });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      mx = e.clientX; my = e.clientY;
      if (ghost) { ghost.style.left = (mx + 14) + 'px'; ghost.style.top = (my - 20) + 'px'; }
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function() {
        var labelsEl = wrap.querySelector('.sl-ns-labels');
        if (!labelsEl) return;
        var trackRect = labelsEl.getBoundingClientRect();
        var nearBar = my >= trackRect.top - 50 && my <= trackRect.bottom + 50 && mx >= trackRect.left - 20 && mx <= trackRect.right + 20;
        if (ghost) ghost.style.opacity = nearBar ? '1' : '0.3';
        var labels = labelsEl.querySelectorAll('.shift-progress-seg-label');
        var found = null;
        if (nearBar) { labels.forEach(function(el) { if (el === dragging) return; var r = el.getBoundingClientRect(); if (mx >= r.left - 10 && mx <= r.right + 10) found = el; }); }
        if (overLabel && overLabel !== found) overLabel.classList.remove('is-drag-over');
        overLabel = found;
        if (overLabel) { overLabel.classList.add('is-drag-over'); }
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
          _tone(240,0.13,'triangle',0.16);
          setTimeout(function(){ _tone(300,0.09,'triangle',0.09); }, 55);
          var dragDate = getNightSplitDragDate();
          var plan = getNightSplitPlan(dragDate);
          if (plan && plan.segments) {
            var order = plan.segments.map(function(s) { return s.name; });
            var tmp = order[fromIdx]; order[fromIdx] = order[toIdx]; order[toIdx] = tmp;
            saveNightSplitOrder(dragDate, order);
            refreshNightSplitViews();
          }
        }
      }
      dragging = null;
    });
  }

  // Cheap per-second refresh of only the values that actually move, so the full
  // subtree (incl. the heavy night-split SVG) is not rebuilt every tick.
  function _laneLiveUpdate(wrap, sorted, nowMs, axisStartMs, axisEndMs, axisDur, isNs, isToday, counterStartMs, counterEndMs) {
    var scrubPct = Math.max(0, Math.min(100, (nowMs - axisStartMs) / axisDur * 100));
    var rEl = wrap.querySelector('.sl-ruler-elapsed'); if (rEl) rEl.style.width = scrubPct.toFixed(2) + '%';
    var rFut = wrap.querySelector('.sl-ruler-future'); if (rFut) rFut.style.left = scrubPct.toFixed(2) + '%';
    var rPct = wrap.querySelector('.sl-ruler-pct'); if (rPct) { rPct.style.right = 'calc(' + (100 - Math.max(6, scrubPct)).toFixed(2) + '% + 6px)'; rPct.textContent = Math.round(scrubPct) + '%'; }
    var rNow = wrap.querySelector('.sl-ruler-now');
    if (rNow) {
      var nd = new Date(nowMs);
      rNow.style.left = scrubPct.toFixed(2) + '%';
      rNow.style.transform = 'translateX(' + (scrubPct < 5 ? '0' : scrubPct > 95 ? '-100%' : '-50%') + ')';
      rNow.textContent = String(nd.getHours()).padStart(2, '0') + ':' + String(nd.getMinutes()).padStart(2, '0');
    }
    var scr = wrap.querySelector('.sl-scrubber'); if (scr) scr.style.left = scrubPct.toFixed(2) + '%';
    // Re-evaluate ruler tick hiding as the now-pill moves (same ~4.2% rule as the
    // full build) — otherwise a tick the pill drifts over stays visible and
    // overlaps it until the next full rebuild.
    wrap.querySelectorAll('.sl-rtick').forEach(function (t) {
      var lp = parseFloat(t.style.left) || 0;
      t.classList.toggle('sl-rtick-hidden', Math.abs(lp - scrubPct) < 4.2);
    });
    if (!isNs) {
      var lanes = wrap.querySelectorAll('.sl-bars-wrap > .sl');
      sorted.forEach(function (g, i) {
        var lane = lanes[i]; if (!lane) return;
        var laneStartMs = g.start instanceof Date ? g.start.getTime() : g.start;
        var laneEndMs = g.end instanceof Date ? g.end.getTime() : g.end;
        var laneDur = Math.max(1, laneEndMs - laneStartMs);
        var pct = Math.max(0, Math.min(100, (nowMs - laneStartMs) / laneDur * 100));
        var fill = lane.querySelector('.sl-fill'); if (fill) fill.style.width = pct.toFixed(1) + '%';
        var pctEl = lane.querySelector('.sl-pct'); if (pctEl) pctEl.textContent = Math.round(pct) + '%';
      });
    }
    if (isToday) {
      var _cStart = counterStartMs || axisStartMs;
      var _cEnd = counterEndMs || axisEndMs;
      var _elMs = Math.max(0, nowMs - _cStart), _reMs = Math.max(0, _cEnd - nowMs);
      var elEl = wrap.querySelector('.sl-ts-elapsed');
      if (elEl) elEl.textContent = String(Math.floor(_elMs / 3600000)).padStart(2, '0') + ':' + String(Math.floor((_elMs % 3600000) / 60000)).padStart(2, '0');
      var remEl = wrap.querySelector('.sl-ts-rem');
      if (remEl) {
        var _reH = Math.floor(_reMs / 3600000), _reM = Math.floor((_reMs % 3600000) / 60000), _reS = Math.floor((_reMs % 60000) / 1000);
        remEl.textContent = String(_reH).padStart(2, '0') + ':' + String(_reM).padStart(2, '0') + ':' + String(_reS).padStart(2, '0');
        remEl.style.color = _reMs > 14400000 ? 'rgba(139,92,246,0.95)' : _reMs > 7200000 ? 'rgba(251,191,36,0.95)' : 'rgba(239,68,68,0.95)';
      }
    }
  }

  function buildShiftLanes(stops, axisStart, axisEnd, nowDate, nsOverlay, counterStart, counterEnd) {
    const wrap = document.getElementById('shift-lanes-wrap');
    if (!wrap) return;
    // Wire NS bar drag once on the static wrap element (event delegation)
    initNsWrapDrag(wrap);
    if (!stops || !stops.length) { wrap.innerHTML = ''; _laneStructKey = ''; return; }

    const nowMs = nowDate instanceof Date ? nowDate.getTime() : nowDate;
    const axisStartMs = axisStart instanceof Date ? axisStart.getTime() : axisStart;
    const axisEndMs   = axisEnd   instanceof Date ? axisEnd.getTime()   : axisEnd;
    const axisDur = Math.max(1, axisEndMs - axisStartMs);
    const counterStartMs = counterStart instanceof Date ? counterStart.getTime() : (counterStart || axisStartMs);
    const counterEndMs   = counterEnd   instanceof Date ? counterEnd.getTime()   : (counterEnd || axisEndMs);

    // Group by [isRadiologist, shiftH, startHour] — separates day/night same-duration shifts
    const groups = new Map();
    stops.forEach(function(stop) {
      const startH = stop.start instanceof Date ? stop.start.getHours() : new Date(stop.start).getHours();
      const key = (stop.isRadiologist ? 'rad' : 'rg') + ':' + (stop.shiftH || 0) + ':' + startH;
      if (!groups.has(key)) {
        groups.set(key, {
          shiftH: stop.shiftH || 0,
          isRadiologist: !!stop.isRadiologist,
          workers: [],
          start: stop.start,
          end: stop.end
        });
      }
      const g = groups.get(key);
      g.workers.push(stop);
      if (stop.start < g.start) g.start = stop.start;
      if (stop.end   > g.end)   g.end   = stop.end;
    });

    // Long evening shifts (15h..<24h) are pinned to end at 08:00 by the
    // hospital rule (see getShiftEnd). Their bar START must be derived from
    // the declared duration, not the stored clock-in label: a 20H shift that
    // ends 08:00 begins at 12:00, even if its record says startTime 20:00.
    // Without this, the bar rendered from 20:00 (12h wide) instead of spanning
    // the full 20h from noon.
    groups.forEach(function(g) {
      if (g.shiftH >= 15 && g.shiftH < 24) {
        const endMs = g.end instanceof Date ? g.end.getTime() : g.end;
        const derived = endMs - g.shiftH * 3600000;
        const curStart = g.start instanceof Date ? g.start.getTime() : g.start;
        if (derived < curStart) g.start = new Date(derived);
      }
    });

    // Colors: Radiographers = violet family, Radiologists = cyan family
    const COL_RG = {  // violet/purple
      24: { bg:'rgba(139,92,246,0.13)',  border:'rgba(139,92,246,0.38)',  fill:'linear-gradient(90deg,rgba(109,40,217,0.55),rgba(139,92,246,0.32))', ink:'rgba(221,214,254,0.95)', badge:'rgba(139,92,246,0.28)' },
      12: { bg:'rgba(167,139,250,0.11)', border:'rgba(167,139,250,0.32)', fill:'linear-gradient(90deg,rgba(124,58,237,0.48),rgba(167,139,250,0.28))', ink:'rgba(221,214,254,0.90)', badge:'rgba(167,139,250,0.22)' },
       8: { bg:'rgba(196,181,253,0.09)', border:'rgba(196,181,253,0.28)', fill:'linear-gradient(90deg,rgba(139,92,246,0.40),rgba(196,181,253,0.22))', ink:'rgba(237,233,254,0.90)', badge:'rgba(196,181,253,0.18)' }
    };
    const COL_RAD = { // cyan/teal
      24: { bg:'rgba(34,211,238,0.11)',  border:'rgba(34,211,238,0.36)',  fill:'linear-gradient(90deg,rgba(8,145,178,0.55),rgba(34,211,238,0.30))',  ink:'rgba(165,243,252,0.95)', badge:'rgba(34,211,238,0.24)' },
      16: { bg:'rgba(94,224,224,0.10)',  border:'rgba(94,224,224,0.34)',  fill:'linear-gradient(90deg,rgba(14,116,144,0.52),rgba(94,224,224,0.28))', ink:'rgba(207,250,254,0.95)', badge:'rgba(94,224,224,0.22)' },
      15: { bg:'rgba(94,224,224,0.10)',  border:'rgba(94,224,224,0.34)',  fill:'linear-gradient(90deg,rgba(14,116,144,0.52),rgba(94,224,224,0.28))', ink:'rgba(207,250,254,0.95)', badge:'rgba(94,224,224,0.22)' },
      13: { bg:'rgba(56,189,248,0.10)',  border:'rgba(56,189,248,0.33)',  fill:'linear-gradient(90deg,rgba(3,105,161,0.52),rgba(56,189,248,0.27))',  ink:'rgba(186,230,253,0.95)', badge:'rgba(56,189,248,0.21)' },
      12: { bg:'rgba(45,212,191,0.10)',  border:'rgba(45,212,191,0.32)',  fill:'linear-gradient(90deg,rgba(15,118,110,0.50),rgba(45,212,191,0.26))', ink:'rgba(153,246,228,0.95)', badge:'rgba(45,212,191,0.20)' },
       9: { bg:'rgba(94,234,212,0.09)',  border:'rgba(94,234,212,0.30)',  fill:'linear-gradient(90deg,rgba(17,94,89,0.48),rgba(94,234,212,0.24))',   ink:'rgba(204,251,241,0.90)', badge:'rgba(94,234,212,0.18)' }
    };
    const DEF_RG  = { bg:'rgba(139,92,246,0.10)',  border:'rgba(139,92,246,0.30)',  fill:'linear-gradient(90deg,rgba(109,40,217,0.44),rgba(139,92,246,0.24))', ink:'rgba(221,214,254,0.90)', badge:'rgba(139,92,246,0.20)' };
    const DEF_RAD = { bg:'rgba(34,211,238,0.09)',  border:'rgba(34,211,238,0.28)',  fill:'linear-gradient(90deg,rgba(8,145,178,0.44),rgba(34,211,238,0.22))', ink:'rgba(165,243,252,0.90)', badge:'rgba(34,211,238,0.18)' };

    // Sort: longest shift first, radiographers before radiologists within same shift
    const sorted = Array.from(groups.values()).sort(function(a, b) {
      if (b.shiftH !== a.shiftH) return b.shiftH - a.shiftH;
      return (a.isRadiologist ? 1 : 0) - (b.isRadiologist ? 1 : 0);
    });

    // ── Render-key guard ──────────────────────────────────────────────
    // Only rebuild the DOM (incl. the heavy night-split SVG) when the structure
    // changes: roster, shift hours/order, day, axis — or, for the night-split
    // chart, every 30s so its slow "now" line still advances (≈2px/30s on an 8h
    // axis, so 1s rebuilds were pure waste). Otherwise just update the live
    // values (scrubber, fills, %s, clock) in place. A swapped worker changes the
    // signature below → full rebuild, so roster edits always show.
    var _isToday = !activeDateStr || !g_todayStr || activeDateStr === g_todayStr;
    var _stopsSig = sorted.map(function(g){ return (g.isRadiologist?'r':'g') + g.shiftH + ':' + g.workers.map(function(w){ return w.name; }).join('+'); }).join('|');
    // Time bucket forces a periodic full rebuild so any layout drift from the
    // light-update path self-heals quickly instead of persisting until a manual
    // refresh: 30s while the night-split chart is shown, 60s otherwise. Still
    // far cheaper than the old once-per-second full rebuild.
    var _timeBucket = Math.floor(nowMs / (nsOverlay ? 30000 : 60000));
    // Collapsed mode: the lanes are hidden, so don't build their DOM at all —
    // skipping construction (not just display:none) saves the per-rebuild work.
    // The ns chart ignores this: opening 🌙 is an explicit request to see it.
    var _wrapHost = document.getElementById('shift-progress-wrap');
    var _lanesMin = !nsOverlay && !!(_wrapHost && _wrapHost.classList.contains('lanes-collapsed'));
    var _structKey = _stopsSig + '#' + axisStartMs + '#' + axisEndMs + '#' + counterStartMs + '#' + counterEndMs + '#' + (_isToday ? 't' : 'h') + '#' + (nsOverlay ? 'ns' : 'n') + '#' + (_lanesMin ? 'min' : 'max') + '#' + _timeBucket;
    if (_structKey === _laneStructKey && wrap.children.length) {
      _laneLiveUpdate(wrap, sorted, nowMs, axisStartMs, axisEndMs, axisDur, !!nsOverlay, _isToday, counterStartMs, counterEndMs);
      return;
    }
    _laneStructKey = _structKey;

    // ── Ruler above bars ──
    const nowD = nowDate instanceof Date ? nowDate : new Date(nowDate);
    const nowH = nowD.getHours(), nowMin = nowD.getMinutes();
    const nowLabel = String(nowH).padStart(2,'0') + ':' + String(nowMin).padStart(2,'0');
    const scrubPctR = Math.max(0, Math.min(100, (nowMs - axisStartMs) / axisDur * 100));
    // Fixed ticks at axis anchors (08,14,20,02,08)
    const axisD0 = new Date(axisStartMs); axisD0.setHours(0,0,0,0);
    const tickAnchors = [[0,8],[0,14],[0,20],[1,2],[1,8]];
    let rulerTicks = '';
    tickAnchors.forEach(function(pair, i) {
      const t = new Date(axisD0.getTime());
      t.setDate(t.getDate() + pair[0]);
      t.setHours(pair[1], 0, 0, 0);
      const tMs = t.getTime();
      if (tMs < axisStartMs || tMs > axisEndMs) return;
      const lpNum = (tMs - axisStartMs) / axisDur * 100;
      const lp = lpNum.toFixed(2);
      const xf = i === 0 ? 'translateX(0)' : (tMs === axisEndMs ? 'translateX(-100%)' : 'translateX(-50%)');
      const isSun = pair[1] === 14, isMoon = pair[1] === 2;
      // Hide tick if current-time pill overlaps it (~4% threshold ≈ ~1h)
      const hidden = Math.abs(lpNum - scrubPctR) < 4.2;
      rulerTicks += '<span class="sl-rtick' + (isSun?' sl-rtick-sun':'') + (isMoon?' sl-rtick-moon':'') + (hidden?' sl-rtick-hidden':'') + '" style="left:' + lp + '%;transform:' + xf + '">' + String(pair[1]).padStart(2,'0') + ':00</span>';
    });
    // Elapsed / remaining strip
    var _elMs = Math.max(0, nowMs - counterStartMs);
    var _reMs = Math.max(0, counterEndMs - nowMs);
    var _elStr = String(Math.floor(_elMs/3600000)).padStart(2,'0') + ':' + String(Math.floor((_elMs%3600000)/60000)).padStart(2,'0');
    var _reH = Math.floor(_reMs/3600000), _reM = Math.floor((_reMs%3600000)/60000), _reS = Math.floor((_reMs%60000)/1000);
    var _reStr = String(_reH).padStart(2,'0') + ':' + String(_reM).padStart(2,'0') + ':' + String(_reS).padStart(2,'0');
    var _reColor = _reMs > 14400000 ? 'rgba(139,92,246,0.95)' : _reMs > 7200000 ? 'rgba(251,191,36,0.95)' : 'rgba(239,68,68,0.95)';

    var _pctInt = Math.round(scrubPctR);
    // % sits just left of the scrubber inside the elapsed zone
    var _pctRight = 'calc(' + (100 - Math.max(6, scrubPctR)).toFixed(2) + '% + 6px)';
    var html = '<div class="sl-ruler">' +
      '<div class="sl-ruler-band">' +
        '<div class="sl-tb-morning"></div><div class="sl-tb-day"></div><div class="sl-tb-evening"></div><div class="sl-tb-night"></div>' +
        '<div class="sl-ruler-elapsed" style="width:' + scrubPctR.toFixed(2) + '%"></div>' +
        '<div class="sl-ruler-future" style="left:' + scrubPctR.toFixed(2) + '%"></div>' +
      '</div>' +
      '<span class="sl-ruler-pct" style="right:' + _pctRight + '">' + _pctInt + '%</span>' +
      rulerTicks +
      '<span class="sl-ruler-now" style="left:' + scrubPctR.toFixed(2) + '%;transform:translateX(' + (scrubPctR < 5 ? '0' : scrubPctR > 95 ? '-100%' : '-50%') + ')">' + nowLabel + '</span>' +
    '</div>';

    var _timesStrip = '<div class="sl-times-strip" data-start-ms="' + counterStartMs + '" data-end-ms="' + counterEndMs + '">' +
      '<span id="sl-lanes-slot" class="sl-lanes-slot"></span>' +
      '<span id="sl-ns-slot" class="sl-ns-slot"></span>' +
      '<span class="sl-ts-label">PAGĀJIS</span><strong class="sl-ts-val sl-ts-elapsed">' + _elStr + '</strong>' +
      '<span class="sl-ts-sep"></span>' +
      '<span class="sl-ts-label">ATLIKUŠAS</span><strong class="sl-ts-val sl-ts-rem" data-end-ms="' + counterEndMs + '" style="color:' + _reColor + '">' + _reStr + '</strong>' +
    '</div>';

    // Night split overlay bar (shown when 🌙 is active)
    if (nsOverlay) {
      html += buildCircadianChartHtml(axisStartMs, axisEndMs, nowMs, nsOverlay);
    } else if (_lanesMin) {
      // Lanes collapsed: no bars DOM at all.
    } else {
      html += '<div class="sl-bars-wrap">';
      sorted.forEach(function(g) {
        const col = (g.isRadiologist ? COL_RAD[g.shiftH] || DEF_RAD : COL_RG[g.shiftH] || DEF_RG);
        const laneStartMs = g.start instanceof Date ? g.start.getTime() : g.start;
        const laneEndMs   = g.end   instanceof Date ? g.end.getTime()   : g.end;
        const laneDur  = Math.max(1, laneEndMs - laneStartMs);
        const elapsed  = Math.max(0, nowMs - laneStartMs);
        const pct      = Math.max(0, Math.min(100, elapsed / laneDur * 100));
        const leftPct  = Math.max(0, (laneStartMs - axisStartMs) / axisDur * 100);
        const widthPct = Math.min(100 - leftPct, laneDur / axisDur * 100);

        const badge = g.shiftH + 'H';
        const chips = g.workers.map(function(w) {
          const parts = String(w.name || '').trim().split(/\s+/);
          const init  = ((parts[0] || '').charAt(0) + (parts[1] || '').charAt(0)).toUpperCase();
          const first = escapeHtml(normalizeLvName(parts[0] || w.name || ''));
          const emoji = w.emoji ? '<span class="swc-emoji">' + w.emoji + '</span>' : '';
          return '<span class="swc">' +
            '<span class="swc-init" style="color:' + col.ink + ';">' + escapeHtml(init) + '</span>' +
            '<span class="swc-name">' + first + '</span>' +
            emoji + '</span>';
        }).join('<span class="swc-dot">·</span>');

        html += '<div class="sl" style="margin-left:' + leftPct.toFixed(2) + '%;width:' + widthPct.toFixed(2) + '%;background:' + col.bg + ';border-color:' + col.border + ';">' +
            '<div class="sl-fill" style="width:' + pct.toFixed(1) + '%;background:' + col.fill + ';"></div>' +
            '<div class="sl-row">' +
              '<span class="sl-badge" style="background:' + col.badge + ';color:' + col.ink + ';">' + badge + '</span>' +
              '<span class="sl-workers">' + chips + '</span>' +
              '<span class="sl-pct" style="color:' + col.ink + ';">' + Math.round(pct) + '%</span>' +
            '</div>' +
          '</div>';
      });

      // Shared scrubber line across all lanes
      const scrubPct = Math.max(0, Math.min(100, (nowMs - axisStartMs) / axisDur * 100));
      html += '<div class="sl-scrubber" style="left:' + scrubPct.toFixed(2) + '%;"></div>';
      html += '</div>'; // close sl-bars-wrap
    }

    // Only show elapsed/remaining for today
    var _isToday = !activeDateStr || !g_todayStr || activeDateStr === g_todayStr;
    if (_isToday) html += _timesStrip;

    // Rescue the buttons from wrap BEFORE innerHTML destroys them
    var _nsBtn = document.getElementById('ns-bar-toggle');
    var _lanesBtn = document.getElementById('lanes-mini-toggle');
    var _nsBtnRow = document.querySelector('.ns-btn-row');
    if (_nsBtn && wrap.contains(_nsBtn) && _nsBtnRow) _nsBtnRow.appendChild(_nsBtn);
    if (_lanesBtn && wrap.contains(_lanesBtn) && _nsBtnRow) _nsBtnRow.appendChild(_lanesBtn);
    wrap.innerHTML = html;

    // Re-slot the buttons into today's strip (keeps their event listeners alive)
    var _nsSlot = wrap.querySelector('#sl-ns-slot');
    if (_nsSlot && _nsBtn) _nsSlot.appendChild(_nsBtn);
    var _lanesSlot = wrap.querySelector('#sl-lanes-slot');
    if (_lanesSlot && _lanesBtn) _lanesSlot.appendChild(_lanesBtn);

  }

  // Called by the lanes toggle: the collapsed flag is part of the lane render
  // key, so clearing the key + one live tick rebuilds instantly on click
  // instead of waiting for the next 1s interval.
  window.__mkLanesRefresh = function() {
    _laneStructKey = '';
    // force=true: skip the low-perf 5s heavy-paint throttle — this runs on an
    // explicit user click, so the rebuild must be immediate.
    try { g_updateLive(true); } catch (e) {}
  };

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
        if (card.classList.contains('mk-mid-card')) {
          const level = score > 66 ? 'hi' : score >= 33 ? 'mid' : 'low';
          card.classList.remove('mk-mid-fat-none', 'mk-mid-fat-low', 'mk-mid-fat-mid', 'mk-mid-fat-hi');
          card.classList.add('mk-mid-fat-' + level);
          const filled = Math.max(0, Math.min(10, Math.ceil(score / 10)));
          card.querySelectorAll('.mk-mid-fat-seg').forEach((seg, i) => {
            seg.classList.toggle('on', i < filled);
            seg.classList.toggle('on-s', i === filled - 1);
          });
          const pct = card.querySelector('.mk-mid-fat-pct');
          if (pct) pct.textContent = score + '%';
          return;
        }
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

    const isToday = (activeDateStr === g_todayStr);
    const now = new Date();

    const visibleRgWorkers = filterVisibleWorkers(getWorkersForDateWithDate(store, activeDateStr), isToday, now);
    const visibleRdWorkers = filterVisibleWorkers(getWorkersForDateWithDate(storeRad, activeDateStr), isToday, now);
    const hasRg = visibleRgWorkers.length > 0;
    const hasRd = visibleRdWorkers.length > 0;

    if (!hasRg && !hasRd) {
      container.innerHTML = "<div style='color:#666;width:100%;text-align:center;margin-top:50px;'>Nav datu</div>";
      return;
    }

    function getPersonEmoji(worker) {
      try {
        if (window.MinkaEmoji && typeof window.MinkaEmoji.get === 'function') {
          const saved = window.MinkaEmoji.get(worker.name || '');
          if (saved) return saved;
        }
      } catch(e) {}
      return '';
    }

    function getShiftEmoji(worker) {
      const type = String(worker && worker.type || '').toUpperCase();
      if (type === 'DIENA') return '☀️';
      if (type === 'NAKTS') return '🌙';
      return '';
    }

    function getMonthHoursForWorker(workerName, isRd) {
      const targetStore = isRd ? storeRad : store;
      const targetName = String(workerName || '').trim();
      if (!targetName) return 0;
      let total = 0;
      const months = activeMonth && targetStore && targetStore[activeMonth] ? [activeMonth] : safeKeys(targetStore);
      months.forEach(month => {
        const days = targetStore && targetStore[month];
        if (!Array.isArray(days)) return;
        days.forEach(day => {
          if (!day || !Array.isArray(day.workers)) return;
          day.workers.forEach(item => {
            if (!item || String(item.name || '').trim() !== targetName) return;
            total += parseShiftHours(item.shift) || 0;
          });
        });
      });
      return total;
    }

    const coffeeStoreKey = 'minkaCoffeeCountsV1';
    const coffeeDetailStoreKey = 'minkaCoffeeDetailsV1';
    // eq = caffeine-equivalent coffee cups (1 cup ≈ 80 mg). Energy drinks carry
    // more caffeine, so they bump the coffee count by their equivalent: a 500ml
    // Monster ≈160 mg ≈2 cups, a 250ml Red Bull ≈80 mg ≈1 cup. All coffee/drink
    // totals are stored in these equivalent units; mg = units × 80.
    const COFFEE_MG_PER_CUP = 80;
    const coffeeSourceMeta = {
      philips: { label: 'Philips', priceCents: 0, eq: 1 },
      lofbergs: { label: 'LÖFBERGS', priceCents: 140, eq: 1 },
      narvesen: { label: 'Narvesen', prices: { M: 200, L: 220, XL: 250 }, eq: 1 },
      monster: { label: 'Monster', priceCents: 159, eq: 2 },
      monsterultra: { label: 'Monster Ultra', priceCents: 159, eq: 2 },
      redbull: { label: 'Red Bull', priceCents: 149, eq: 1 }
    };
    const COFFEE_SOURCES = ['philips', 'lofbergs', 'narvesen', 'monster', 'monsterultra', 'redbull'];
    function coffeeEq(source) { const m = coffeeSourceMeta[cleanCoffeeSource(source)]; return Math.max(1, (m && m.eq) || 1); }

    function getCoffeeStore() {
      try {
        return JSON.parse(localStorage.getItem(coffeeStoreKey) || '{}') || {};
      } catch(e) {
        return {};
      }
    }

    function saveCoffeeStore(data) {
      try {
        localStorage.setItem(coffeeStoreKey, JSON.stringify(data || {}));
      } catch(e) {}
    }

    function getCoffeeDetailStore() {
      try {
        return JSON.parse(localStorage.getItem(coffeeDetailStoreKey) || '{}') || {};
      } catch(e) {
        return {};
      }
    }

    function saveCoffeeDetailStore(data) {
      try {
        localStorage.setItem(coffeeDetailStoreKey, JSON.stringify(data || {}));
      } catch(e) {}
    }

    function getCoffeeDayKey() {
      return activeDateStr || window.__activeDateStr || 'unknown';
    }

    function getCoffeePersonKey(name) {
      return String(name || '').trim().toLocaleLowerCase('lv-LV');
    }

    function cleanCoffeeSource(source) {
      const s = String(source || 'philips').trim().toLowerCase();
      if (s === 'lofbergs' || s === 'löfbergs') return 'lofbergs';
      if (s === 'narvesen') return 'narvesen';
      if (s === 'monster') return 'monster';
      if (s === 'monsterultra' || s === 'monster-ultra' || s === 'monsterwhite' || s === 'ultra') return 'monsterultra';
      if (s === 'redbull' || s === 'red-bull' || s === 'redbul') return 'redbull';
      return 'philips';
    }

    function emptyCoffeeDetail() {
      return { sources: { philips: 0, lofbergs: 0, narvesen: 0, monster: 0, monsterultra: 0, redbull: 0 }, spendCents: 0 };
    }

    function normalizeCoffeeDetail(detail, count) {
      const out = emptyCoffeeDetail();
      const src = detail && detail.sources ? detail.sources : {};
      Object.keys(out.sources).forEach(k => {
        out.sources[k] = Math.max(0, Number(src[k]) || 0);
      });
      out.spendCents = Math.max(0, Number(detail && detail.spendCents) || 0);
      const total = Object.values(out.sources).reduce((a, b) => a + b, 0);
      const target = Math.max(0, Number(count) || 0);
      if (total < target) out.sources.philips += target - total;
      if (total > target) {
        let extra = total - target;
        COFFEE_SOURCES.forEach(k => {
          if (!extra) return;
          const take = Math.min(out.sources[k], extra);
          out.sources[k] -= take;
          extra -= take;
        });
      }
      return out;
    }

    function getCoffeeCount(name) {
      const day = getCoffeeDayKey();
      const key = getCoffeePersonKey(name);
      const data = getCoffeeStore();
      return Math.max(0, Number(data && data[day] && data[day][key]) || 0);
    }

    function setCoffeeCount(name, count) {
      const day = getCoffeeDayKey();
      const key = getCoffeePersonKey(name);
      if (!key) return 0;
      const data = getCoffeeStore();
      if (!data[day]) data[day] = {};
      data[day][key] = Math.max(0, Math.min(999, Number(count) || 0));
      saveCoffeeStore(data);
      return data[day][key];
    }

    function getCoffeeDetail(name) {
      const day = getCoffeeDayKey();
      const key = getCoffeePersonKey(name);
      const data = getCoffeeDetailStore();
      return normalizeCoffeeDetail(data && data[day] && data[day][key], getCoffeeCount(name));
    }

    function setCoffeeDetail(name, detail) {
      const day = getCoffeeDayKey();
      const key = getCoffeePersonKey(name);
      if (!day || !key) return;
      const data = getCoffeeDetailStore();
      if (!data[day]) data[day] = {};
      data[day][key] = normalizeCoffeeDetail(detail, getCoffeeCount(name));
      saveCoffeeDetailStore(data);
    }

    function addCoffeeDetail(name, entry) {
      const d = getCoffeeDetail(name);
      const source = cleanCoffeeSource(entry && entry.source);
      // Store equivalent units per source (1 drink = its eq); price is per drink.
      d.sources[source] = (d.sources[source] || 0) + coffeeEq(source);
      d.spendCents += Math.max(0, Number(entry && entry.priceCents) || 0);
      setCoffeeDetail(name, d);
      return d;
    }

    function removeCoffeeDetail(name) {
      const d = getCoffeeDetail(name);
      const pick = COFFEE_SOURCES
        .filter(s => (d.sources[s] || 0) > 0)
        .sort((a, b) => (d.sources[b] || 0) - (d.sources[a] || 0))[0];
      let removed = '';
      if (pick) { d.sources[pick] = Math.max(0, (d.sources[pick] || 0) - coffeeEq(pick)); removed = pick; }
      setCoffeeDetail(name, d);
      // Return the source that was decremented so the cloud delta can net it.
      return removed;
    }

    function getCoffeeApiBase() {
      return String(window.MINKA_COFFEE_API_BASE || 'https://minka-coffee-api.gamernr1elite.workers.dev').replace(/\/+$/, '');
    }

    function applyCoffeeCounts(day, counts) {
      if (!day || !counts || typeof counts !== 'object') return;
      const data = getCoffeeStore();
      if (!data[day]) data[day] = {};
      Object.keys(counts).forEach(name => {
        const key = getCoffeePersonKey(name);
        if (!key) return;
        data[day][key] = Math.max(0, Math.min(999, Number(counts[name]) || 0));
      });
      saveCoffeeStore(data);
    }

    function applyCoffeeDetails(day, details) {
      if (!day || !details || typeof details !== 'object') return;
      const data = getCoffeeDetailStore();
      if (!data[day]) data[day] = {};
      Object.keys(details).forEach(name => {
        const key = getCoffeePersonKey(name);
        if (!key) return;
        const count = getCoffeeStore()[day] && getCoffeeStore()[day][key];
        data[day][key] = normalizeCoffeeDetail(details[name], count);
      });
      saveCoffeeDetailStore(data);
    }

    function refreshVisibleCoffeeRows(day) {
      if (day && day !== getCoffeeDayKey()) return;
      document.querySelectorAll('#grafiks-list.grid-view .mk-mid-card[data-worker]').forEach(card => {
        updateCoffeeRow(card, card.getAttribute('data-worker') || '');
      });
      try { window.__minkaPostAssistantState && window.__minkaPostAssistantState(); } catch(e) {}
    }

    function getCoffeeSyncState() {
      if (!window.__minkaCoffeeSync) {
        window.__minkaCoffeeSync = { loadedDays: Object.create(null), loadingDays: Object.create(null) };
      }
      return window.__minkaCoffeeSync;
    }

    function syncCoffeeDay() {
      const day = getCoffeeDayKey();
      if (!day || day === 'unknown') return;
      const state = getCoffeeSyncState();
      if (state.loadedDays[day] || state.loadingDays[day]) return;
      state.loadingDays[day] = true;
      fetch(getCoffeeApiBase() + '/api/coffee?date=' + encodeURIComponent(day), { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || !data.ok || data.date !== day) return;
          applyCoffeeCounts(day, data.counts || {});
          applyCoffeeDetails(day, data.details || {});
          state.loadedDays[day] = true;
          refreshVisibleCoffeeRows(day);
        })
        .catch(function(){})
        .finally(() => { delete state.loadingDays[day]; });
    }

    // Cross-device live sync: re-fetch the active day's coffee on a timer so a
    // cup added on one computer shows on the others without a reload (bolus and
    // night-split already poll like this; coffee was only fetched once per day).
    function pollCoffeeDay() {
      if (document.hidden) return;
      const day = getCoffeeDayKey();
      if (!day || day === 'unknown') return;
      fetch(getCoffeeApiBase() + '/api/coffee?date=' + encodeURIComponent(day), { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || !data.ok || data.date !== day) return;
          applyCoffeeCounts(day, data.counts || {});
          applyCoffeeDetails(day, data.details || {});
          getCoffeeSyncState().loadedDays[day] = true;
          refreshVisibleCoffeeRows(day);
        })
        .catch(function(){});
    }
    function startCoffeePolling() {
      if (window.__minkaCoffeePollStarted) return;
      window.__minkaCoffeePollStarted = true;
      setInterval(pollCoffeeDay, 12000);
      document.addEventListener('visibilitychange', function(){ if (!document.hidden) pollCoffeeDay(); });
    }

    function postCoffeeDelta(name, delta, card, entry) {
      const day = getCoffeeDayKey();
      if (!day || day === 'unknown' || !name) return;
      const body = { date: day, worker: name, delta: delta };
      if (delta > 0 && entry) {
        body.source = cleanCoffeeSource(entry.source);
        body.size = String(entry.size || '').toUpperCase();
        body.priceCents = Math.max(0, Number(entry.priceCents) || 0);
      } else if (delta < 0 && entry && entry.source) {
        // Tell the server which source the minus removed, so its per-source total nets.
        body.source = cleanCoffeeSource(entry.source);
      }
      fetch(getCoffeeApiBase() + '/api/coffee', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body)
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || !data.ok || data.date !== day || data.worker !== name) return;
          setCoffeeCount(name, data.count);
          updateCoffeeRow(card, name);
          try { window.__minkaPostAssistantState && window.__minkaPostAssistantState(); } catch(_e) {}
        })
        .catch(function(){});
    }

    function formatCoffeeEuro(cents) {
      return (Math.max(0, Number(cents) || 0) / 100).toLocaleString('lv-LV', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' €';
    }

    function coffeeIcon(source) {
      source = cleanCoffeeSource(source);
      if (source === 'lofbergs') {
        // Löfbergs — tall purple vending machine: header panel, white wordmark,
        // a column of cream selection buttons, a side screen and the cup niche.
        return '<svg viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">'
          + '<rect x="7" y="2" width="18" height="27" fill="#461c69"/>'
          + '<rect x="7" y="2" width="18" height="5" fill="#5a2880"/>'
          + '<rect x="20" y="3" width="3" height="3" fill="#c79fe0"/>'
          + '<rect x="9" y="8" width="14" height="2" fill="#f1ecf6"/>'
          + '<rect x="9" y="11" width="7" height="2" fill="#e9d98f"/>'
          + '<rect x="9" y="14" width="7" height="2" fill="#e9d98f"/>'
          + '<rect x="9" y="17" width="7" height="2" fill="#e9d98f"/>'
          + '<rect x="9" y="20" width="7" height="2" fill="#e9d98f"/>'
          + '<rect x="18" y="11" width="5" height="6" fill="#16203a"/>'
          + '<rect x="20" y="13" width="2" height="2" fill="#55c7dc"/>'
          + '<rect x="13" y="23" width="8" height="6" fill="#2a1340"/>'
          + '<rect x="14" y="24" width="6" height="4" fill="#eef2f8"/>'
          + '<rect x="14" y="24" width="6" height="1" fill="#7a4a24"/>'
          + '</svg>';
      }
      if (source === 'narvesen') {
        // Narvesen takeaway cup — cream paper cup, red sleeve + lid, a little steam.
        return '<svg viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">'
          + '<rect x="13" y="2" width="1" height="2" fill="#aeb6c6"/>'
          + '<rect x="16" y="1" width="1" height="2" fill="#aeb6c6"/>'
          + '<rect x="19" y="2" width="1" height="2" fill="#aeb6c6"/>'
          + '<rect x="14" y="5" width="5" height="2" fill="#b8312a"/>'
          + '<rect x="9" y="7" width="15" height="3" fill="#d23b2b"/>'
          + '<rect x="10" y="10" width="13" height="16" fill="#f3efe6"/>'
          + '<rect x="10" y="15" width="13" height="5" fill="#d23b2b"/>'
          + '<rect x="10" y="15" width="13" height="1" fill="#e6584a"/>'
          + '<rect x="11" y="25" width="11" height="1" fill="#e7e1d4"/>'
          + '</svg>';
      }
      if (source === 'monster') {
        // Monster Energy — black can with the green claw "M".
        return '<svg viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">'
          + '<rect x="13" y="2" width="6" height="1" fill="#5a615a"/>'
          + '<rect x="11" y="3" width="10" height="1" fill="#3a3f3a"/>'
          + '<rect x="10" y="4" width="12" height="25" fill="#0c0f0c"/>'
          + '<rect x="12" y="8" width="2" height="12" fill="#7bdc3a"/>'
          + '<rect x="15" y="7" width="2" height="13" fill="#7bdc3a"/>'
          + '<rect x="18" y="8" width="2" height="12" fill="#7bdc3a"/>'
          + '<rect x="12" y="8" width="8" height="2" fill="#7bdc3a"/>'
          + '<rect x="11" y="24" width="10" height="2" fill="#e9f6df"/>'
          + '</svg>';
      }
      if (source === 'monsterultra') {
        // Monster Ultra (Zero Sugar White) — white can, soft grey claw.
        return '<svg viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">'
          + '<rect x="13" y="2" width="6" height="1" fill="#c4c9c4"/>'
          + '<rect x="11" y="3" width="10" height="1" fill="#d6dbd6"/>'
          + '<rect x="10" y="4" width="12" height="25" fill="#eef0ee"/>'
          + '<rect x="12" y="8" width="2" height="12" fill="#aab2aa"/>'
          + '<rect x="15" y="7" width="2" height="13" fill="#aab2aa"/>'
          + '<rect x="18" y="8" width="2" height="12" fill="#aab2aa"/>'
          + '<rect x="12" y="8" width="8" height="2" fill="#aab2aa"/>'
          + '<rect x="11" y="24" width="10" height="2" fill="#9aa39a"/>'
          + '</svg>';
      }
      if (source === 'redbull') {
        // Red Bull — slim 250ml can. Real proportions ≈53mm × 134mm (h/w ≈2.5),
        // so it's notably narrower than the chunky 500ml Monster cans.
        return '<svg viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">'
          + '<rect x="14" y="4" width="4" height="1" fill="#5a6170"/>'
          + '<rect x="12" y="5" width="8" height="2" fill="#9aa0ad"/>'
          + '<rect x="12" y="7" width="8" height="20" fill="#e2e6ec"/>'
          + '<rect x="12" y="7" width="8" height="9" fill="#23337a"/>'
          + '<rect x="12" y="16" width="5" height="2" fill="#23337a"/>'
          + '<rect x="13" y="10" width="6" height="2" fill="#d61f26"/>'
          + '<rect x="15" y="20" width="2" height="2" fill="#f4c20d"/>'
          + '<rect x="14" y="21" width="2" height="1" fill="#d61f26"/>'
          + '<rect x="16" y="21" width="2" height="1" fill="#d61f26"/>'
          + '</svg>';
      }
      // Philips bean-to-cup machine — body + blue display, dispenser spout and a cup.
      return '<svg viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">'
        + '<rect x="7" y="3" width="18" height="21" fill="#2b313c"/>'
        + '<rect x="7" y="3" width="18" height="3" fill="#363d4a"/>'
        + '<rect x="9" y="6" width="14" height="9" fill="#3c4452"/>'
        + '<rect x="11" y="8" width="10" height="3" fill="#2f7fe0"/>'
        + '<rect x="11" y="12" width="4" height="1" fill="#55c7dc"/>'
        + '<rect x="13" y="15" width="6" height="2" fill="#1b1f27"/>'
        + '<rect x="14" y="17" width="1" height="3" fill="#7a4a24"/>'
        + '<rect x="17" y="17" width="1" height="3" fill="#7a4a24"/>'
        + '<rect x="12" y="20" width="8" height="4" fill="#eef2f8"/>'
        + '<rect x="13" y="20" width="6" height="1" fill="#7a4a24"/>'
        + '<rect x="20" y="21" width="2" height="2" fill="#eef2f8"/>'
        + '<rect x="8" y="24" width="16" height="2" fill="#1b1f27"/>'
        + '</svg>';
    }

    function addCoffeeEntry(name, card, entry) {
      const source = cleanCoffeeSource(entry && entry.source);
      const size = String(entry && entry.size || '').toUpperCase();
      let priceCents = Math.max(0, Number(entry && entry.priceCents) || 0);
      if (source === 'lofbergs') priceCents = 140;
      const eq = coffeeEq(source);
      setCoffeeCount(name, getCoffeeCount(name) + eq);
      addCoffeeDetail(name, { source, size, priceCents });
      updateCoffeeRow(card, name);
      try { window.__minkaPostAssistantState && window.__minkaPostAssistantState(); } catch(_e) {}
      postCoffeeDelta(name, eq, card, { source, size, priceCents });
    }

    function setCoffeePickerBuddyFlag(open) {
      // The buddy mascot lives in the parent shell and can overlap the picker's
      // Saglabāt button. Ask the shell to hide it while the picker is open.
      try { window.parent && window.parent.postMessage({ type: 'mk_coffee_picker', open: !!open }, '*'); } catch (_e) {}
    }

    function closeCoffeePicker() {
      document.querySelectorAll('.mk-coffee-picker').forEach(el => el.remove());
      document.querySelectorAll('.mk-coffee-backdrop').forEach(el => el.remove());
      document.removeEventListener('keydown', onCoffeePickerKey, true);
      setCoffeePickerBuddyFlag(false);
    }

    // Outside clicks are caught by a transparent full-window backdrop that sits
    // just under the picker (so it can't cover the picker itself). If the click
    // actually landed on another card's "+" — even one the open picker was
    // painting over — we reopen the picker for that person, so no + ever goes
    // "dead" behind the popup.
    function onCoffeePickerBackdrop(e) {
      const backdrop = e.currentTarget;
      backdrop.style.pointerEvents = 'none';
      const under = document.elementFromPoint(e.clientX, e.clientY);
      backdrop.style.pointerEvents = '';
      const addBtn = under && under.closest ? under.closest('.mk-coffee-add') : null;
      closeCoffeePicker();
      if (addBtn) setTimeout(() => addBtn.click(), 0);
    }

    function onCoffeePickerKey(e) {
      if (e.key === 'Escape') closeCoffeePicker();
    }

    function showCoffeePicker(name, card, anchor) {
      closeCoffeePicker();
      let selected = 'philips';
      let size = 'M';
      let priceCents = 0;
      const picker = document.createElement('div');
      const backdrop = document.createElement('div');
      backdrop.className = 'mk-coffee-backdrop';
      backdrop.addEventListener('pointerdown', onCoffeePickerBackdrop, true);
      document.body.appendChild(backdrop);
      picker.className = 'mk-coffee-picker';
      setCoffeePickerBuddyFlag(true);
      picker.innerHTML = `
        <div class="mk-coffee-picker-title">Kafija</div>
        <div class="mk-coffee-source-row">
          ${COFFEE_SOURCES.map(source => `
            <button class="mk-coffee-source ${source === selected ? 'is-on' : ''}" type="button" data-source="${source}">
              <span class="mk-coffee-source-icon">${coffeeIcon(source)}</span>
              <span>${coffeeSourceMeta[source].label}</span>
            </button>`).join('')}
        </div>
        <div class="mk-coffee-size-row" hidden>
          ${['M', 'L', 'XL'].map(s => `<button type="button" class="${s === size ? 'is-on' : ''}" data-size="${s}">${s}</button>`).join('')}
        </div>
        <label class="mk-coffee-price-row">
          <span>Cena</span>
          <input class="mk-coffee-price" type="number" min="0" max="50" step="0.01" inputmode="decimal" value="0.00">
        </label>
        <div class="mk-coffee-caf"></div>
        <button class="mk-coffee-save" type="button">Saglabāt</button>`;
      document.body.appendChild(picker);

      function placePicker() {
        const rect = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
        const pw = 258;
        const ph = Math.ceil(picker.getBoundingClientRect().height || 270);
        const mobileShell = document.documentElement.classList.contains('mk-mobile-shell') || window.innerWidth <= 760;
        // Both shells have a bottom nav bar overlaying this (iframed) calendar, so
        // reserve room for it — otherwise the Saglabāt button can land behind the
        // nav and be untappable.
        const bottomGuard = mobileShell ? 126 : 96;
        const left = rect ? Math.max(8, Math.min(window.innerWidth - pw - 8, rect.right - pw)) : 20;
        const safeBottom = window.innerHeight - bottomGuard;
        let top;
        if (rect) {
          const below = rect.bottom + 8;
          if (below + ph <= safeBottom) top = below;                 // fits below the "+"
          else if (rect.top - ph - 8 >= 8) top = rect.top - ph - 8;  // else flip above it
          else top = Math.max(8, safeBottom - ph);                   // else clamp fully in view
        } else {
          top = 20;
        }
        picker.style.left = left + 'px';
        picker.style.top = top + 'px';
      }

      function sync() {
        picker.querySelectorAll('.mk-coffee-source').forEach(btn => btn.classList.toggle('is-on', btn.dataset.source === selected));
        const sizeRow = picker.querySelector('.mk-coffee-size-row');
        if (sizeRow) sizeRow.hidden = selected !== 'narvesen';
        picker.querySelectorAll('[data-size]').forEach(btn => btn.classList.toggle('is-on', btn.dataset.size === size));
        const input = picker.querySelector('.mk-coffee-price');
        if (!input) return;
        if (selected === 'philips') priceCents = 0;
        else if (selected === 'lofbergs') priceCents = 140;
        else if (selected === 'narvesen') { if (!priceCents) priceCents = coffeeSourceMeta.narvesen.prices[size] || 200; }
        else if (!priceCents) priceCents = coffeeSourceMeta[selected].priceCents || 0;
        input.value = (priceCents / 100).toFixed(2);
        // Price editable for everything except the fixed-price machines.
        input.readOnly = (selected === 'philips' || selected === 'lofbergs');
        const caf = picker.querySelector('.mk-coffee-caf');
        if (caf) {
          const eq = coffeeEq(selected);
          const mg = eq * COFFEE_MG_PER_CUP;
          const cups = eq === 1 ? '1 tasīte' : eq + ' tasītes';
          caf.textContent = '≈ ' + mg + ' mg kofeīna · ' + cups;
        }
      }

      function defaultPriceFor(src) {
        if (src === 'philips') return 0;
        if (src === 'lofbergs') return 140;
        if (src === 'narvesen') return coffeeSourceMeta.narvesen.prices[size] || 200;
        return coffeeSourceMeta[src].priceCents || 0;
      }
      picker.querySelectorAll('.mk-coffee-source').forEach(btn => {
        btn.addEventListener('click', () => {
          selected = cleanCoffeeSource(btn.dataset.source);
          priceCents = defaultPriceFor(selected);
          sync();
          placePicker();
        });
      });
      picker.querySelectorAll('[data-size]').forEach(btn => {
        btn.addEventListener('click', () => {
          size = btn.dataset.size || 'M';
          priceCents = coffeeSourceMeta.narvesen.prices[size] || 200;
          sync();
          placePicker();
        });
      });
      const input = picker.querySelector('.mk-coffee-price');
      if (input) {
        input.addEventListener('input', () => {
          const n = Number(String(input.value || '0').replace(',', '.'));
          priceCents = Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
        });
      }
      const save = picker.querySelector('.mk-coffee-save');
      if (save) {
        save.addEventListener('click', () => {
          addCoffeeEntry(name, card, { source: selected, size: selected === 'narvesen' ? size : '', priceCents });
          closeCoffeePicker();
        });
      }

      sync();
      placePicker();
      setTimeout(() => {
        document.addEventListener('keydown', onCoffeePickerKey, true);
      }, 0);
    }

    function buildCoffeeCup(mode) {
      const filled = mode !== 'hint';
      const body = filled ? '#c8842a' : 'rgba(160,166,184,.28)';
      const crema = filled ? '#f0b860' : 'rgba(160,166,184,.24)';
      return `<svg class="mk-coffee-cup${filled ? ' filled' : ' hint'}" width="13" height="13" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
        <rect x="3" y="4" width="8" height="8" fill="${body}"></rect>
        <rect x="4" y="12" width="6" height="1" fill="${body}"></rect>
        <rect x="11" y="5" width="2" height="1" fill="${body}"></rect>
        <rect x="13" y="5" width="1" height="4" fill="${body}"></rect>
        <rect x="11" y="8" width="2" height="1" fill="${body}"></rect>
        <rect x="4" y="5" width="6" height="1" fill="${crema}"></rect>
      </svg>`;
    }

    function buildCoffeeCups(count) {
      const total = Math.max(0, Number(count) || 0);
      const visible = Math.min(total, 6);
      if (!visible) return buildCoffeeCup('hint');
      return Array.from({ length: visible }, () => {
        return buildCoffeeCup('filled');
      }).join('');
    }

    function buildCoffeeRow(name) {
      const count = getCoffeeCount(name);
      const safeName = escapeHtml(name || '');
      return `
        <div class="mk-mid-coffee" data-coffee-name="${safeName}">
          <span class="mk-coffee-lbl">KAFIJA</span>
          <div class="mk-coffee-step">
            <button class="mk-coffee-sub" type="button" aria-label="Atņemt kafiju" title="Atņemt kafiju">−</button>
            <span class="mk-coffee-mid">${buildCoffeeCup('filled')}<span class="mk-coffee-num">${count}</span></span>
            <button class="mk-coffee-add" type="button" aria-label="Pievienot kafiju" title="Pievienot kafiju">+</button>
          </div>
        </div>`;
    }

    function updateCoffeeRow(card, name) {
      const row = card && card.querySelector('.mk-mid-coffee');
      if (!row) return;
      const count = getCoffeeCount(name);
      const cups = row.querySelector('.mk-coffee-cups');
      const numEl = row.querySelector('.mk-coffee-num');
      if (cups) cups.innerHTML = buildCoffeeCups(count);
      if (numEl) numEl.textContent = String(count);
    }

    window.__minkaCoffeeIcon = coffeeIcon;
    window.__minkaGetCoffeeCountForName = function(name) {
      return getCoffeeCount(name);
    };
    window.__minkaGetCoffeeTotalForNames = function(names) {
      const seen = new Set();
      return (Array.isArray(names) ? names : []).reduce((sum, name) => {
        const n = String(name || '').trim();
        const key = getCoffeePersonKey(n);
        if (!key || seen.has(key)) return sum;
        seen.add(key);
        return sum + getCoffeeCount(n);
      }, 0);
    };
    // The active day's coffee source breakdown for a set of people (deduped) —
    // powers the buddy widget's per-day "which machines" icons.
    window.__minkaGetCoffeeSourcesForNames = function(names) {
      // Sources are stored in caffeine-equivalent units; divide by each source's
      // eq so the buddy breakdown shows the real number of drinks (1 Monster, not 2).
      const equiv = {}; COFFEE_SOURCES.forEach(s => equiv[s] = 0);
      const seen = new Set();
      (Array.isArray(names) ? names : []).forEach(name => {
        const n = String(name || '').trim();
        const key = getCoffeePersonKey(n);
        if (!key || seen.has(key)) return;
        seen.add(key);
        const s = (getCoffeeDetail(n) || {}).sources || {};
        COFFEE_SOURCES.forEach(k => { equiv[k] += Math.max(0, Number(s[k]) || 0); });
      });
      const out = {};
      COFFEE_SOURCES.forEach(k => { out[k] = Math.round(equiv[k] / coffeeEq(k)); });
      return out;
    };
    // Total caffeine (mg) for a set of people on the active day — count is in
    // equivalent cups, so mg = units × per-cup mg.
    window.__minkaGetCoffeeCaffeineForNames = function(names) {
      const units = Math.max(0, Number(window.__minkaGetCoffeeTotalForNames(names)) || 0);
      return Math.round(units * COFFEE_MG_PER_CUP);
    };
    window.__minkaGetCoffeeLeaderboard = function(limit) {
      // All-time Top 5: sum every day in the local store, then merge with the
      // server's authoritative all-time totals (max per person) so it reflects the
      // whole history across days/devices — not just today.
      const totals = {};
      const store = getCoffeeStore();
      Object.keys(store).forEach(day => {
        const dayObj = store[day];
        if (!dayObj || typeof dayObj !== 'object') return;
        Object.keys(dayObj).forEach(key => {
          totals[key] = (totals[key] || 0) + Math.max(0, Number(dayObj[key]) || 0);
        });
      });
      const api = window.__mkCoffeeTotalsApi;
      if (api) {
        Object.keys(api).forEach(key => {
          totals[key] = Math.max(totals[key] || 0, Math.max(0, Number(api[key]) || 0));
        });
      }
      const namesByKey = {};
      document.querySelectorAll('#grafiks-list.grid-view .mk-mid-card[data-worker]').forEach(card => {
        const n = String(card.getAttribute('data-worker') || '').trim();
        const k = getCoffeePersonKey(n);
        if (k && !namesByKey[k]) namesByKey[k] = n;
      });
      function prettyName(key) {
        return String(key || '').split(/\s+/)
          .map(p => p ? p.charAt(0).toLocaleUpperCase('lv-LV') + p.slice(1) : p)
          .join(' ');
      }
      return Object.keys(totals)
        .map(key => {
          const count = Math.max(0, Number(totals[key]) || 0);
          return { name: namesByKey[key] || prettyName(key), count };
        })
        .filter(x => x.count > 0)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'lv'))
        .slice(0, Math.max(1, Number(limit) || 5));
    };

    function buildFatigueSegments(score) {
      const filled = Math.max(0, Math.min(10, Math.ceil((Number(score) || 0) / 10)));
      return Array.from({ length: 10 }, (_, i) => {
        const cls = i < filled ? (i === filled - 1 ? ' on on-s' : ' on') : '';
        return `<span class="mk-mid-fat-seg${cls}"></span>`;
      }).join('');
    }

    function buildCard(w, isRd) {
      const parts = String(w.name || "").trim().split(/\s+/).filter(Boolean);
      const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
      const firstName = capitalize(parts[0] || "");
      const surname = parts.slice(1).map(n => capitalize(n)).join(' ');
      const personEmoji = getPersonEmoji(w);
      const shiftEmoji = getShiftEmoji(w);
      const bgEmoji = personEmoji || shiftEmoji;
      const isDoneCard = isToday && w.startTime && w.endTime && isWorkerShiftDone(w, activeDateStr, now);

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
        const roleClass = isRd ? ' mk-mid-card-rd' : ' mk-mid-card-rg';
        const fatigueLevel = !hasFatigueScore ? 'none' : fatigueScore > 66 ? 'hi' : fatigueScore >= 33 ? 'mid' : 'low';
        const monthHours = getMonthHoursForWorker(w.name, isRd);
        card.className += ` mk-mid-card${roleClass} mk-mid-fat-${fatigueLevel}`;
        card.innerHTML = `
          <div class="mk-mid-top">
            <div class="mk-mid-left">
              <div class="mk-mid-initials">${initials}</div>
              <div class="mk-mid-status-icons">
                ${personEmoji ? `<span class="mk-mid-person-emoji" data-mk-emoji-click="1">${personEmoji}</span>` : ''}
                <button class="mk-emoji-edit-btn mk-mid-emoji-edit" type="button" title="Mainīt emoji" data-mk-edit="1">✨</button>
              </div>
            </div>
            <div class="mk-mid-month">
              <div class="mk-mid-month-num">${monthHours || parseShiftHours(w.shift) || 0}h</div>
              <div class="mk-mid-month-label">MĒNESĪ</div>
              ${shiftEmoji ? `<div class="mk-mid-shift-icons"><span class="mk-mid-shift-emoji">${shiftEmoji}</span></div>` : ''}
            </div>
          </div>
          <div class="mk-mid-center">
            ${bgEmoji ? `<div class="mk-mid-bg-emoji">${bgEmoji}</div>` : ''}
            <div class="card-shift mk-mid-hours">${parseShiftHours(w.shift) || w.shift}</div>
            <div class="card-name-wrap mk-mid-name-wrap">
              <span class="name-main">${firstName}</span>
              <span class="name-sub">${surname}</span>
            </div>
          </div>
          <div class="mk-mid-bottom">
            <div class="card-fat-row mk-mid-fatigue">
              <div class="mk-mid-fat-segs">${buildFatigueSegments(fatigueScore)}</div>
              <span class="fat-pct mk-mid-fat-pct">${hasFatigueScore ? fatigueScore + '%' : ''}</span>
            </div>
            ${buildCoffeeRow(w.name)}
          </div>`;

        const _wSkin = (typeof window.mkGetWorkerSkin === 'function') ? window.mkGetWorkerSkin(w.name) : null;
        if (_wSkin && typeof window.mkApplySkinToEl === 'function') window.mkApplySkinToEl(card, _wSkin);

        const coffeeBtn = card.querySelector('.mk-coffee-add');
        if (coffeeBtn) {
          coffeeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showCoffeePicker(w.name, card, coffeeBtn);
          };
        }
        const coffeeSub = card.querySelector('.mk-coffee-sub');
        if (coffeeSub) {
          coffeeSub.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (getCoffeeCount(w.name) <= 0) return;
            const removedSrc = removeCoffeeDetail(w.name);
            const remEq = removedSrc ? coffeeEq(removedSrc) : 1;
            setCoffeeCount(w.name, Math.max(0, getCoffeeCount(w.name) - remEq));
            updateCoffeeRow(card, w.name);
            try { window.__minkaPostAssistantState && window.__minkaPostAssistantState(); } catch(_e) {}
            postCoffeeDelta(w.name, -remEq, card, removedSrc ? { source: removedSrc } : null);
          };
        }
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
        visibleRdWorkers
          .forEach(w => { grid.appendChild(buildCard(w, true)); });
        sec.appendChild(grid);
        container.appendChild(sec);
      } else {
        visibleRdWorkers
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
        visibleRgWorkers
          .forEach(w => { grid.appendChild(buildCard(w, false)); });
        sec.appendChild(grid);
        container.appendChild(sec);
      } else {
        visibleRgWorkers
          .forEach(w => { container.appendChild(buildCard(w, false)); });
      }
    }

    syncCoffeeDay();
    startCoffeePolling();
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
        const w = nameSpan.scrollWidth;
        if (w > parentWidth) {
          // Proportional fit in one step instead of a -1px reflow loop
          // (the old loop forced up to ~12 layout passes per name on weak PCs).
          let fontSize = Math.max(12, Math.floor(24 * parentWidth / w));
          nameSpan.style.fontSize = fontSize + 'px';
          // Single verification nudge for rounding
          if (nameSpan.scrollWidth > parentWidth && fontSize > 12) {
            nameSpan.style.fontSize = (fontSize - 1) + 'px';
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
      let rgHeartColors = [];
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
          rgHeartColors = (Array.isArray(state.rg) ? state.rg : []).filter(w => !w || !w.done).map(w => {
            const fullName = String((w && w.name) || '').trim();
            if (!fullName) return null;
            try {
              const f = calc(fullName);
              const score = f && Number.isFinite(f.score) ? Math.round(f.score) : 0;
              let color = '#35d07f';
              if (score > 70) color = '#ff6b5f';
              else if (score > 45) color = '#e59b42';
              else if (score > 20) color = '#d8c64a';
              return { fullName, score, color };
            } catch(e) {
              return { fullName, score: 0, color: '#35d07f' };
            }
          }).filter(Boolean);
        }
      } catch(e) {}
      try {
        if ((!rgHeartColors || !rgHeartColors.length) && state) {
          const calc = window.__fatigue && window.__fatigue.calculateFatigue;
          rgHeartColors = (Array.isArray(state.rg) ? state.rg : []).filter(w => !w || !w.done).map(w => {
            const fullName = String((w && w.name) || '').trim();
            if (!fullName) return null;
            let score = 0;
            try {
              if (typeof calc === 'function') {
                const f = calc(fullName);
                if (f && Number.isFinite(f.score)) score = Math.round(f.score);
              }
            } catch(e) {}
            let color = '#35d07f';
            if (score > 70) color = '#ff6b5f';
            else if (score > 45) color = '#e59b42';
            else if (score > 20) color = '#d8c64a';
            return { fullName, score, color };
          }).filter(Boolean);
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
        fatigue: Array.isArray(fatigue) ? fatigue : [],
        rgHeartColors: Array.isArray(rgHeartColors) ? rgHeartColors : [],
        coffeeTotal: 0,
        coffeeSources: { philips: 0, lofbergs: 0, narvesen: 0 },
        coffeeLeaderboard: [],
        shiftFatigue: 0
      };

      try {
        const activeCoffeeNames = [];
        const seenCoffee = new Set();
        [ ...(payload.rg || []), ...(payload.rd || []) ].forEach(w => {
          if (!w || w.done) return;
          const n = String(w.name || '').trim();
          const k = n.toLowerCase();
          if (!n || seenCoffee.has(k)) return;
          seenCoffee.add(k);
          activeCoffeeNames.push(n);
        });
        if (typeof window.__minkaGetCoffeeTotalForNames === 'function') {
          payload.coffeeTotal = Math.max(0, Number(window.__minkaGetCoffeeTotalForNames(activeCoffeeNames)) || 0);
        }
        if (typeof window.__minkaGetCoffeeSourcesForNames === 'function') {
          payload.coffeeSources = window.__minkaGetCoffeeSourcesForNames(activeCoffeeNames) || payload.coffeeSources;
        }
        if (typeof window.__minkaGetCoffeeLeaderboard === 'function') {
          payload.coffeeLeaderboard = window.__minkaGetCoffeeLeaderboard(5) || [];
        }
        const fatigueByName = {};
        (payload.fatigue || []).forEach(f => {
          const k = String((f && f.fullName) || '').trim().toLowerCase();
          if (k) fatigueByName[k] = Math.max(0, Math.min(100, Number(f.score) || 0));
        });
        const activeRgNames = [];
        const seenRg = new Set();
        (payload.rg || []).forEach(w => {
          if (!w || w.done) return;
          const n = String(w.name || '').trim();
          const k = n.toLowerCase();
          if (!n || seenRg.has(k)) return;
          seenRg.add(k);
          activeRgNames.push(n);
        });
        const scores = activeRgNames.map(n => fatigueByName[n.toLowerCase()]).filter(v => Number.isFinite(v));
        if (scores.length) {
          payload.shiftFatigue = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
      } catch(e) {}

      // Dedupe repeated bridge posts (fatigue/card observers can fire multiple times for same state)
      try {
        const digest = JSON.stringify({
          d: payload.activeDateStr,
          t: payload.isToday ? 1 : 0,
          rg: (payload.rg || []).map(w => [w && w.name, w && w.shift, !!(w && w.done), !!(w && w.active)]),
          rd: (payload.rd || []).map(w => [w && w.name, w && w.shift, !!(w && w.done), !!(w && w.active)]),
          nrg: payload.nextRg || [],
          nrd: payload.nextRd || [],
          f: (payload.fatigue || []).map(x => [x && x.fullName, x && x.score]),
          hc: (payload.rgHeartColors || []).map(x => [x && x.fullName, x && x.score, x && x.color]),
          cf: payload.coffeeTotal,
          cl: (payload.coffeeLeaderboard || []).map(x => [x && x.name, x && x.count]),
          sf: payload.shiftFatigue
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
  // While nothing is rendered yet, jump on connectivity/visibility signals
  // instead of waiting for the 20s background retry.
  window.addEventListener('online', function(){ if (!window.__minkaLiveStarted) g_init(0); });
  document.addEventListener('visibilitychange', function(){ if (!document.hidden && !window.__minkaLiveStarted) g_init(0); });
  try { setTimeout(() => { try { window.__minkaPostAssistantState && window.__minkaPostAssistantState(); } catch(e) {} }, 80); } catch(e) {}
  try { setTimeout(() => { try { window.__minkaPostAssistantState && window.__minkaPostAssistantState(); } catch(e) {} }, 650); } catch(e) {}
  g_installMobileDaySwipe();

  window.g_init = g_init;
  window.g_scrollCal = g_scrollCal;
  window.g_toggleView = g_toggleView;
  window.g_changeMonth = g_changeMonth;
  window.g_updatePanelsForDate = g_updatePanelsForDate;
  window.g_selectDay = g_selectDay;
  window.g_stepDay = g_stepDay;
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
  const mw = Math.min(820, window.innerWidth * 0.86);
  const mh = Math.min(window.innerHeight * 0.90, 760);
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
  setWorkerModalBuddyFlag(true);
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

function setWorkerModalBuddyFlag(open) {
  try { window.parent && window.parent.postMessage({ type: 'mk_worker_modal', open: !!open }, '*'); } catch (_e) {}
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
  const _skinView = document.getElementById('modal-skin-view');
  if (_skinView) _skinView.classList.add('hide');
  const _toggleSkin = document.getElementById('toggle-skin');
  if (_toggleSkin) _toggleSkin.classList.remove('active');

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
  } else if (view === 'skin') {
    const skinView = document.getElementById('modal-skin-view');
    const toggleSkin = document.getElementById('toggle-skin');
    if (skinView) skinView.classList.remove('hide');
    if (toggleSkin) toggleSkin.classList.add('active');
    if (typeof window.mkRenderSkinPicker === 'function') window.mkRenderSkinPicker(skinView);
  }
}

function closeWorkerModal() {
  setWorkerModalBuddyFlag(false);
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
