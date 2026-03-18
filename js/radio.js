//  RADIO PLAYER – from stable (full)
// ------------------------------------------------------------
const RG_DEBUG = false; // Set true for development logging
const _log  = (...a) => { if (RG_DEBUG) console.log(...a); };
const _warn = (...a) => { if (RG_DEBUG) console.warn(...a); };
const _err  = (...a) => { if (RG_DEBUG) console.error(...a); };
let aCtx, analyser, src, lowNode, highNode, hls, masterGain, dryGain, wetGain, delayNode, feedbackNode, convolverNode, compressorNode, vinylNoiseSrc, vinylLPF, vinylGain, depthSplitter, depthMerger, depthDelayR, depthDryGain, depthWetGain, depthSumGain;
let stationsList = [];
let recordStations = [];
let latvianStations = [];
// Expose stationsList globally so lazy-load caller can detect when ready
Object.defineProperty(window, 'stationsList', { get(){ return stationsList; }, configurable:true });
Object.defineProperty(window, 'recordStations', { get(){ return recordStations; }, configurable:true });
Object.defineProperty(window, 'latvianStations', { get(){ return latvianStations; }, configurable:true });
// Station list loaded from external JSON (keeps this file readable)
let STATIONS_LOCAL = [];
async function loadLocalStationsJSON(){
    try {
        const r = await fetch('data/stations.json', { cache:'no-store' });
        if (!r.ok) throw new Error('stations.json fetch failed');
        STATIONS_LOCAL = await r.json();
    } catch(_e) { _warn('[Stations] Failed to load stations.json, using empty list'); STATIONS_LOCAL = []; }
}
function mergeUniqueStations(a,b){
    const out=[]; const seen=new Set();
    for (const src of [a||[], b||[]]) for (const s of src){
        if(!s || s.group === 'separator'){ out.push(s); continue; }
        const k = String((s.prefix||'').trim().toLowerCase()) || (String(s.title||'').trim().toLowerCase()+'|'+String(s.stream_hls||s.stream_128||s.stream_64||s.url||'').trim());
        if (seen.has(k)) continue;
        seen.add(k); out.push(s);
    }
    return out;
}
function refreshCombinedStations(){
    stationsList = mergeUniqueStations(recordStations, latvianStations);
}

let currentIndex = 0;
let vizStyle = 3; 
let isAdjustingVol = false;
let volTimeout;
let isFirstPlay = true; 

let peaks = Array(128).fill(0);
let __vizFreqData = null;

const cvs = document.getElementById('vizCanvas');
const ctx = cvs.getContext('2d');
const dGif = document.getElementById('dolphin-bg');
const ledPoint = document.getElementById('ledPoint');
const ledHalo = document.getElementById('ledHalo');
const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.preload = "none";
audio.addEventListener('play', () => requestAnimationFrame(draw));

// Pre-warm AudioContext on first user gesture anywhere — eliminates the
// "click twice" bug caused by suspended AudioContext on iOS/Chrome
(function() {
    function preWarm() {
        document.removeEventListener('pointerdown', preWarm, true);
        document.removeEventListener('keydown', preWarm, true);
        try {
            if (!aCtx) setupAudio();
            if (aCtx && aCtx.state === 'suspended') aCtx.resume().catch(()=>{});
        } catch(e){}
    }
    document.addEventListener('pointerdown', preWarm, { capture: true, once: true, passive: true });
    document.addEventListener('keydown',     preWarm, { capture: true, once: true, passive: true });
})();
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(draw); });


const segContainer = document.getElementById('osd-segments');
for(let i=0; i<50; i++) {
    const s = document.createElement('div');
    s.className = 'seg';
    segContainer.appendChild(s);
}

const iconMap = {'lo-fi': 'fa-mug-hot', 'deep': 'fa-keyboard', 'techno': 'fa-microchip', 'house': 'fa-home', 'dance': 'fa-bolt', 'chill': 'fa-leaf', 'rock': 'fa-guitar'};
function getIcon(title) {
    const t = title.toLowerCase();
    for (let key in iconMap) { if (t.includes(key)) return iconMap[key]; }
    return 'fa-compact-disc';
}

// ------------------------------------------------------------
//  NOW PLAYING (Radio Record) via CF Worker proxy
//  Keeps playback untouched, only updates UI.
// ------------------------------------------------------------
const RR_PROXY_BASE = "https://ancient-bush-28d0.gamernr1elite.workers.dev/api";
const RR_STATIONS_URL = `${RR_PROXY_BASE}/stations/`;
const RR_NOW_URL = `${RR_PROXY_BASE}/stations/now/`;

let rrPrefixToId = null;      // { prefix: id }
let rrMapPromise = null;
let npTimer = null;
let npLastKey = "";
let npFitTimer = null;

function npEl(id){ return document.getElementById(id); }

// Auto-fit Now Playing text so it stays inside the tech panel.
// We shrink font-size (within safe bounds) if the line would overflow.
function fitTextToWidth(el, maxPx, minPx){
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    // Reset to max, then shrink until it fits (or hits min).
    let size = maxPx;
    el.style.fontSize = size + "px";

    // Use parent width (np-lines) as the available area.
    const avail = parent.clientWidth || 0;
    if (!avail) return;

    // If it already fits, we’re done.
    if (el.scrollWidth <= avail) return;

    for (size = maxPx; size >= minPx; size -= 0.5){
        el.style.fontSize = size + "px";
        if (el.scrollWidth <= avail) break;
    }
}

function fitNowPlaying(){
    const a = npEl("npArtist");
    const t = npEl("npTitle");
    if (!a || !t) return;
    // Wait 1 frame so layout is up-to-date (important after text changes).
    requestAnimationFrame(() => {
        fitTextToWidth(a, 12, 8);
        fitTextToWidth(t, 11, 8);
    });
}

function deriveRRPrefix(st){
    // Prefer explicit prefix if present
    if (st && st.prefix) return st.prefix;

    const url = String(st?.hls || st?.url || "");
    // Typical: http(s)://hls-01-radiorecord.hostingradio.ru/<prefix>/playlist.m3u8
    const m = url.match(/hostingradio\.ru\/([^\/\?]+)\//i);
    if (m && m[1]) return m[1];
    return "";
}

function setNowUI(artist = "—", title = "—", coverUrl = ""){
    const a = npEl("npArtist");
    const t = npEl("npTitle");
    const cover = npEl("npCover");

    if (a) a.textContent = (artist && artist.trim()) ? artist : "—";
    if (t) t.textContent = (title && title.trim()) ? title : "—";

    // Keep both lines inside the box by shrinking text when needed.
    fitNowPlaying();

    if (!cover) return;
    if (coverUrl) {
        cover.crossOrigin = "anonymous";
        cover.src = coverUrl;
        cover.style.display = "block";
        cover.style.opacity = "0.92";
    } else {
        cover.removeAttribute("src");
        cover.style.display = "none";
    }
}

// Re-fit Now Playing text when the window / radio panel changes size (debounced).
window.addEventListener("resize", () => {
    clearTimeout(npFitTimer);
    npFitTimer = setTimeout(fitNowPlaying, 120);
});

async function ensureRRPrefixMap(){
    if (rrPrefixToId) return rrPrefixToId;
    if (rrMapPromise) return rrMapPromise;

    rrMapPromise = (async () => {
        try {
            const r = await fetch(RR_STATIONS_URL, { cache: "no-store" });
            const json = await r.json();
            const root = json?.result || json?.data || json;
            const list = Array.isArray(root) ? root : (Array.isArray(root?.stations) ? root.stations : []);
            const map = {};
            for (const s of list){
                const prefix = String(s?.prefix || s?.code || "").trim();
                const id = String(s?.id ?? s?.station_id ?? "").trim();
                if (prefix && id) map[prefix] = id;
            }
            rrPrefixToId = map;
            return rrPrefixToId;
        } catch(e) {
            rrPrefixToId = {};
            return rrPrefixToId;
        } finally {
            rrMapPromise = null;
        }
    })();

    return rrMapPromise;
}

function parseNowList(json){
    const arr = json?.result || json?.data || json;
    return Array.isArray(arr) ? arr : [];
}

function pickCover(tr){
    return tr?.image600 || tr?.image200 || tr?.image100 || tr?.cover || "";
}

async function fetchNowForStation(st){
    const prefix = deriveRRPrefix(st);
    if (!prefix) return null;

    const map = await ensureRRPrefixMap();
    const id = map?.[prefix];
    if (!id) return null;

    const r = await fetch(RR_NOW_URL, { cache: "no-store" });
    const json = await r.json();
    const list = parseNowList(json);
    const item = list.find(x => String(x?.id ?? x?.station_id ?? "") === String(id));
    const tr = item?.track || null;
    if (!tr) return null;

    const artist = String(tr.artist || "").trim();
    const title = String(tr.song || tr.title || "").trim();
    const cover = pickCover(tr);

    if (!artist && !title) return null;
    return { artist, title, cover };
}

async function updateNowPlaying(st){
    try {
        const hit = await fetchNowForStation(st);
        if (!hit) {
            setNowUI("—", "—", "");
            return;
        }
        const key = [hit.artist, hit.title].filter(Boolean).join(" — ");
        if (key && key !== npLastKey) npLastKey = key;
        setNowUI(hit.artist || "—", hit.title || "—", hit.cover || "");
    } catch(e) {
        // keep last value
    }
}

function startNowPlaying(st){
    if (npTimer) clearInterval(npTimer);
    npLastKey = "";
    setNowUI("—", "—", "");

    // Only poll for Radio Record stations (prefix from hostingradio.ru/...)
    const p = deriveRRPrefix(st);
    if (!p) return;

    updateNowPlaying(st);
    npTimer = setInterval(() => updateNowPlaying(st), 8000);
}

function toggleMenu() {
    const el = document.getElementById('stationOverlay');
    if (!el) return;
    const iframe = document.getElementById('calIframe');

    // Position near the radio window
    const win = document.getElementById('radioWindow');
    if (win) {
        const r = win.getBoundingClientRect();
        const ow = Math.max(420, Math.min(680, r.width - 30));
        const oh = 350;
        el.style.width = ow + "px";
        el.style.height = oh + "px";
        el.style.right = "auto";
        el.style.bottom = "auto";

        // Prefer above the window, fallback below if needed
        let left = r.left + r.width - ow - 16;
        left = Math.max(12, Math.min(left, window.innerWidth - ow - 12));

        let top = r.top - oh - 12;
        if (top < 58) top = r.bottom + 12;

        el.style.left = left + "px";
        el.style.top = top + "px";
    }

    const isNowOpen = el.style.display !== 'grid';
    el.style.display = isNowOpen ? 'grid' : 'none';
    // Disable iframe pointer events while overlay is open (prevents click-through)
    if (iframe) iframe.style.pointerEvents = isNowOpen ? 'none' : '';
}


function changeVizStyle() {
    // Cat controls ONLY the spectrum (always cycles). Milkdrop is separate.
    cycleVizMode();
}

// ---------------------------
// VIZ PICKER (cat menu)
// ---------------------------
let vizPickerOpen = false;

// Cat controls ONLY spectrum modes (no Milkdrop here).
const VIZ_MODES = [
    { idx: 0, label: "PIXEL", hint: "pixel bars" },
    { idx: 1, label: "MIRROR", hint: "mirror bars" },
    { idx: 2, label: "LINE", hint: "line scope" },
    { idx: 3, label: "CLASSIC", hint: "bars" },
    { idx: 4, label: "CENTER", hint: "center bars" },
    { idx: 5, label: "DOLPHIN", hint: "side peaks" },
    { idx: 6, label: "WAVE", hint: "smooth wave" },
    { idx: 7, label: "MATRIX", hint: "dot grid" },
];

function getVizMode(idx){
    return VIZ_MODES.find(m => m.idx === idx) || VIZ_MODES[3];
}

function ensureVizPicker(){
    let el = document.getElementById('vizPickerOverlay');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'vizPickerOverlay';
    el.style.display = 'none';
    el.innerHTML = `
      <div class="vizpick-head">
        <div class="vizpick-title">VISUALS</div>
        <button class="vizpick-x" type="button" aria-label="Close">×</button>
      </div>

      <div class="vizpick-grid" role="list">
        ${VIZ_MODES.map(m => `
          <button class="vizpick-btn" type="button" data-viz="${m.idx}">
            <span class="vizpick-name">${m.label}</span>
          </button>
        `).join('')}
      </div>

      <div class="vizpick-row">
        <button class="vizpick-mini" type="button" data-action="cycle">NEXT</button>
        <button class="vizpick-mini" type="button" data-action="random">RND</button>
        <div class="vizpick-status" id="vizPickStatus">—</div>
      </div>
    `;
    document.body.appendChild(el);

    // close button
    el.querySelector('.vizpick-x')?.addEventListener('click', closeVizPicker);

    // click outside to close
    document.addEventListener('pointerdown', (e) => {
        if (!vizPickerOpen) return;
        const panel = document.getElementById('vizPickerOverlay');
        const cat = document.querySelector('.pixel-cat');
        if (!panel) return;
        if (panel.contains(e.target)) return;
        if (cat && cat.contains(e.target)) return;
        closeVizPicker();
    }, { passive: true });

    // esc
    window.addEventListener('keydown', (e) => {
        if (!vizPickerOpen) return;
        if (e.key === 'Escape') closeVizPicker();
    });

    // mode buttons
    el.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-viz]');
        if (btn) {
            const idx = Number(btn.getAttribute('data-viz'));
            setVizStyle(idx);
            return;
        }

        const act = e.target.closest('[data-action]')?.getAttribute('data-action');
        if (act === 'cycle') {
            cycleVizMode();
            return;
        }
        if (act === 'random') {
            randomVizMode();
            return;
        }

    });

    return el;
}

function positionVizPicker(){
    const el = document.getElementById('vizPickerOverlay');
    if (!el) return;

    const cat = document.querySelector('.pixel-cat');
    const rect = cat ? cat.getBoundingClientRect() : null;

    const pad = 12;
    const w = Math.min(340, window.innerWidth - pad*2);
    el.style.width = w + 'px';

    // measure after width set
    el.style.visibility = 'hidden';
    el.style.display = 'block';
    const h = el.getBoundingClientRect().height;
    el.style.display = 'none';
    el.style.visibility = '';

    let left = rect ? (rect.right - w) : (window.innerWidth - w - pad);
    left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));

    let top;
    if (rect) {
        // Prefer above the cat, else below
        top = rect.top - h - 10;
        if (top < pad) top = rect.bottom + 10;
    } else {
        top = pad + 60;
    }
    // Clamp
    top = Math.max(pad, Math.min(top, window.innerHeight - h - pad));

    el.style.left = left + 'px';
    el.style.top = top + 'px';
}

function openVizPicker(){
    const el = ensureVizPicker();
    vizPickerOpen = true;
    positionVizPicker();
    el.style.display = 'block';
    updateVizPickerUI();
}

function closeVizPicker(){
    const el = document.getElementById('vizPickerOverlay');
    if (el) el.style.display = 'none';
    vizPickerOpen = false;
}

// ---------------------------
// MILKDROP WINDOW (separate toggle icon)
// ---------------------------
let milkdropOverlayOpen = false;
let milkdropEnabled = false;

function ensureMilkdropOverlay(){
    let el = document.getElementById('milkdropOverlay');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'milkdropOverlay';
    el.innerHTML = `
      <div class="vizpick-head">
        <div class="vizpick-title">MILKDROP</div>
        <button class="vizpick-x" type="button" aria-label="Close">×</button>
      </div>

      <div class="vizpick-row" style="margin-top:0">
        <button class="vizpick-mini" id="milkdropToggleBtn" type="button">OFF</button>
        <div class="vizpick-status" id="milkdropAvail">—</div>
      </div>

      <div class="milkdrop-controls" style="margin-top:10px">
        <button class="vizpick-mini" type="button" data-md="prev">⟵</button>
        <button class="vizpick-mini" type="button" data-md="rand">🎲</button>
        <button class="vizpick-mini" type="button" data-md="next">⟶</button>
      </div>

      <input class="vizpick-input" id="milkdropSearch" placeholder="Search preset…" />
      <select class="vizpick-select" id="milkdropSelect"></select>
      <div class="milkdrop-now" id="milkdropNow">Preset: —</div>
      <div class="milkdrop-hint">Hotkeys: <b>Ctrl+Shift+K</b> toggle, <b>N</b> next preset.</div>
    `;
    document.body.appendChild(el);

    // close button
    el.querySelector('.vizpick-x')?.addEventListener('click', closeMilkdropOverlay);

    // inside click handlers
    el.addEventListener('click', (e) => {
        const tgl = e.target.closest('#milkdropToggleBtn');
        if (tgl) {
            toggleMilkdrop();
            return;
        }
        const md = e.target.closest('[data-md]')?.getAttribute('data-md');
        if (md) {
            if (!milkdropEnabled) enableMilkdrop();
            if (md === 'next') milkdropNextPreset();
            if (md === 'prev') milkdropPrevPreset();
            if (md === 'rand') milkdropRandomPreset();
            updateMilkdropUI();
        }
    });

    // preset select/search
    const sel = el.querySelector('#milkdropSelect');
    const search = el.querySelector('#milkdropSearch');
    sel?.addEventListener('change', () => {
        const key = sel.value;
        if (!milkdropEnabled) enableMilkdrop();
        if (key) milkdropSetPresetByKey(key, 1.0);
        updateMilkdropUI();
    });
    search?.addEventListener('input', () => {
        fillMilkdropSelect(search.value || '');
    });

    // click outside to close
    document.addEventListener('pointerdown', (e) => {
        if (!milkdropOverlayOpen) return;
        const panel = document.getElementById('milkdropOverlay');
        const btn = document.getElementById('vizBtn');
        if (!panel) return;
        if (panel.contains(e.target)) return;
        if (btn && btn.contains(e.target)) return;
        closeMilkdropOverlay();
    }, { passive: true });

    // esc
    window.addEventListener('keydown', (e) => {
        if (!milkdropOverlayOpen) return;
        if (e.key === 'Escape') closeMilkdropOverlay();
    });

    return el;
}

function positionMilkdropOverlay(){
    const el = document.getElementById('milkdropOverlay');
    if (!el) return;
    const btn = document.getElementById('vizBtn');
    const rect = btn ? btn.getBoundingClientRect() : null;
    const pad = 12;
    const w = Math.min(380, window.innerWidth - pad*2);
    el.style.width = w + 'px';

    // measure height
    el.style.visibility = 'hidden';
    el.style.display = 'block';
    const h = el.getBoundingClientRect().height;
    el.style.display = 'none';
    el.style.visibility = '';

    let left = rect ? (rect.left + rect.width/2 - w/2) : (window.innerWidth - w - pad);
    left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));

    let top;
    if (rect) {
        top = rect.top - h - 12;
        if (top < pad) top = rect.bottom + 12;
    } else {
        top = pad + 60;
    }
    top = Math.max(pad, Math.min(top, window.innerHeight - h - pad));

    el.style.left = left + 'px';
    el.style.top = top + 'px';
}

function openMilkdropOverlay(){
    const el = ensureMilkdropOverlay();
    milkdropOverlayOpen = true;
    positionMilkdropOverlay();
    el.style.display = 'block';
    syncMilkdropToggleUI();
    // refresh preset list
    ensureMilkdrop();
    fillMilkdropSelect(el.querySelector('#milkdropSearch')?.value || '');
    updateMilkdropUI();
}

function closeMilkdropOverlay(){
    const el = document.getElementById('milkdropOverlay');
    if (el) el.style.display = 'none';
    milkdropOverlayOpen = false;
}

function toggleMilkdropOverlay(){
    if (milkdropOverlayOpen) closeMilkdropOverlay();
    else openMilkdropOverlay();
}

function syncMilkdropToggleUI(){
    // No context menu. Just reflect state on the small Milkdrop icon.
    const btn = document.getElementById("vizBtn");
    if (btn) {
        btn.classList.toggle("active", !!milkdropEnabled);
        btn.setAttribute("aria-pressed", milkdropEnabled ? "true" : "false");
        btn.title = milkdropEnabled ? "Milkdrop: ON (click to turn off)" : "Milkdrop Visuals";
    }

    updateMilkdropQuickUI();
}

// --- Milkdrop quick controls (arrows + preset button in the player strip) ---
let mdMiniEls = null;

function shortPresetName(name){
    if (!name) return "PRESET";
    // Prefer a distinctive tail (many presets share the same prefix).
    const max = 64;
    if (name.length <= max) return name;
    // If it has " - ", show the last segment (usually the unique part)
    const parts = name.split(' - ');
    if (parts.length >= 2) {
        const tail = parts[parts.length - 1];
        if (tail.length <= max) return tail;
        return '…' + tail.slice(-(max - 1));
    }
    // Fallback: keep the end
    return '…' + name.slice(-(max - 1));
}

function applyMarqueeIfNeeded(btn, span){
    if (!btn || !span) return;
    // Cancel old animation
    try {
        if (span.__marqueeAnim) { span.__marqueeAnim.cancel(); span.__marqueeAnim = null; }
    } catch(e) {}
    span.style.transform = 'translateX(0)';

    // Measure overflow after layout
    requestAnimationFrame(() => {
        const padding = 24; // matches button padding
        const available = Math.max(40, btn.clientWidth - padding);
        const overflow = span.scrollWidth - available;
        if (overflow <= 8) return;

        // Duration scales with overflow so it's readable (slower = easier to read).
        const duration = Math.min(34000, Math.max(12000, overflow * 85));
        try {
            span.__marqueeAnim = span.animate(
                [
                    { transform: 'translateX(0)' },
                    { transform: `translateX(${-overflow}px)` }
                ],
                {
                    duration,
                    direction: 'alternate',
                    iterations: Infinity,
                    easing: 'ease-in-out',
                    delay: 650
                }
            );
        } catch(e) {}
    });
}

function updateMilkdropQuickUI(){
    // Mini controls (prev/next + preset name) should be visible only when the Milkdrop window is expanded.
    const wrap = document.getElementById('mdMini');
    const btn = document.getElementById('mdPresetBtn');
    const showMini = !!(milkdropEnabled && milkdropExpanded);
    if (wrap) wrap.setAttribute('aria-hidden', showMini ? "false" : "true");
    if (btn) {
        const name = milkdropPresetKeys && milkdropPresetKeys[milkdropPresetIndex] ? milkdropPresetKeys[milkdropPresetIndex] : "PRESET";
        // Render text in a span so we can marquee-scroll long names.
        let span = btn.querySelector('.mdp-label');
        if (!span) {
            btn.textContent = '';
            span = document.createElement('span');
            span.className = 'mdp-label';
            btn.appendChild(span);
        }
        // Show full name (marquee will scroll if needed), keep full name in title.
        span.textContent = name;
        btn.title = name;
        applyMarqueeIfNeeded(btn, span);
    }
    // The small Milkdrop icon is the entry point when collapsed (Winamp-ish).
    // Hide it only when the big Milkdrop window is expanded.
    const vizBtn = document.getElementById('vizBtn');
    if (vizBtn) vizBtn.style.display = (milkdropEnabled && milkdropExpanded) ? 'none' : '';
}

function closeMdPresetPanel(){
    const panel = document.getElementById('mdPresetPanel');
    if (!panel) return;
    panel.setAttribute('aria-hidden', 'true');
}

function openMdPresetPanel(){
    const panel = document.getElementById('mdPresetPanel');
    const btn = document.getElementById('mdPresetBtn');
    if (!panel || !btn) return;
    if (!(milkdropEnabled && milkdropExpanded)) return; // only when expanded

    // Position near the PRESET button
    const r = btn.getBoundingClientRect();
    const padding = 10;
    panel.style.left = Math.max(padding, Math.min(window.innerWidth - panel.offsetWidth - padding, r.left)) + 'px';
    // prefer above; if not enough space, show below
    const desiredTop = r.top - (panel.offsetHeight || 380) - 8;
    const top = desiredTop < padding ? (r.bottom + 8) : desiredTop;
    panel.style.top = top + 'px';

    panel.setAttribute('aria-hidden', 'false');

    // focus search
    const search = document.getElementById('mdPresetSearch');
    if (search) {
        search.value = '';
        setTimeout(() => search.focus(), 0);
        renderMdPresetList('');
    }
}

function toggleMdPresetPanel(){
    const panel = document.getElementById('mdPresetPanel');
    if (!panel) return;
    if (!(milkdropEnabled && milkdropExpanded)) return;
    const open = panel.getAttribute('aria-hidden') === 'false';
    open ? closeMdPresetPanel() : openMdPresetPanel();
}

function renderMdPresetList(filterText){
    const list = document.getElementById('mdPresetList');
    if (!list) return;
    if (!milkdropPresetKeys || !milkdropPresetKeys.length) {
        list.innerHTML = '<div style="padding:10px;opacity:.8;">Loading presets…</div>';
        return;
    }
    const f = (filterText || '').trim().toLowerCase();
    const keys = f ? milkdropPresetKeys.filter(k => k.toLowerCase().includes(f)) : milkdropPresetKeys;
    // performance cap (still plenty)
    const capped = keys.slice(0, 600);

    const current = milkdropPresetKeys[milkdropPresetIndex];
    list.innerHTML = capped.map(k => {
        const active = k === current ? 'is-active' : '';
        return `<button class="mdp-item ${active}" type="button" data-mdkey="${escapeHtml(k)}">${escapeHtml(k)}</button>`;
    }).join('') + (keys.length > capped.length ? `<div style="padding:8px 10px;opacity:.7;font-size:12px;">Showing ${capped.length} of ${keys.length}. Refine search to narrow.</div>` : '');
}

function enableMilkdrop(){
    milkdropEnabled = true;
    applyVizMode();
    syncMilkdropToggleUI();
    // Winamp-style: open Milkdrop in its own window above the player.
    try { milkdropExpand(); } catch(e) {}
}

function disableMilkdrop(){
    try { milkdropCollapse(true); } catch(e) {}
    milkdropEnabled = false;
    applyVizMode();
    syncMilkdropToggleUI();
}

function toggleMilkdrop(){
    milkdropEnabled ? disableMilkdrop() : enableMilkdrop();
}

function cycleVizMode(){
    // Next spectrum mode only
    vizStyle = (vizStyle + 1) % VIZ_MODES.length;
    updateVizLabel();
    applyVizMode();
    updateVizPickerUI();
}

function randomVizMode(){
    // Pick random among spectrum modes
    const candidates = VIZ_MODES.map(m => m.idx);
    vizStyle = candidates[Math.floor(Math.random() * candidates.length)];
    updateVizLabel();
    applyVizMode();
    updateVizPickerUI();
}

function setVizStyle(idx){
    // Spectrum only
    vizStyle = Math.max(0, Math.min(idx, VIZ_MODES.length - 1));
    updateVizLabel();
    applyVizMode();
    updateVizPickerUI();
}

function updateVizPickerUI(forceWarn=false){
    const el = document.getElementById('vizPickerOverlay');
    if (!el) return;

    // active highlight
    el.querySelectorAll('[data-viz]').forEach(b => {
        const idx = Number(b.getAttribute('data-viz'));
        b.classList.toggle('active', idx === vizStyle);
    });

    const m = getVizMode(vizStyle);
    const status = el.querySelector('#vizPickStatus');
    if (status) status.textContent = `${m.label}`;
}

// Milkdrop UI is a separate window (toggled by a small icon).
function fillMilkdropSelect(filterText){
    const el = document.getElementById('milkdropOverlay');
    if (!el) return;
    const sel = el.querySelector('#milkdropSelect');
    const pill = el.querySelector('#milkdropAvail');
    if (!sel) return;

    const ok = canMilkdrop();
    if (pill) pill.textContent = !hasWebGL2() ? 'NO WEBGL2' : (ok ? 'READY' : 'MISSING LIBS');

    if (!ok || !milkdropPresetKeys || !milkdropPresetKeys.length) {
        sel.innerHTML = `<option value="">(no presets)</option>`;
        sel.disabled = true;
        return;
    }

    const q = (filterText || '').trim().toLowerCase();
    const keys = q ? milkdropPresetKeys.filter(k => k.toLowerCase().includes(q)) : milkdropPresetKeys;

    sel.disabled = false;
    sel.innerHTML = keys.slice(0, 600).map(k => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
    const cur = milkdropPresetKeys[milkdropPresetIndex];
    if (cur && keys.includes(cur)) sel.value = cur;
}

function updateMilkdropUI(){
    // Legacy overlay UI may not exist in newer builds.
    // Always keep the player-strip quick UI in sync.

    const key = (milkdropPresetKeys && milkdropPresetKeys.length)
        ? milkdropPresetKeys[milkdropPresetIndex]
        : null;

    const el = document.getElementById('milkdropOverlay');
    if (el) {
        const now = el.querySelector('#milkdropNow');
        if (now) now.textContent = key ? ('Preset: ' + key) : 'Preset: —';

        const sel = el.querySelector('#milkdropSelect');
        if (sel && key) sel.value = key;
    }

    updateMilkdropQuickUI();
}

// helpers for presets

function milkdropLoadPresetSafe(targetIndex, blend = 0.9) {
    if (!milkdropEnabled) return false;
    if (!ensureMilkdrop()) return false;
    if (!milkdrop || !milkdropPresets || !milkdropPresetKeys.length) return false;

    // Keep renderer sized correctly before loading presets (important after fullscreen transitions)
    try { milkdropResizeToContainer(); } catch(_) {}

    const total = milkdropPresetKeys.length;
    let idx = ((targetIndex % total) + total) % total;

    for (let tries = 0; tries < Math.min(total, 60); tries++) {
        const key = milkdropPresetKeys[idx];
        try {
            milkdrop.loadPreset(milkdropPresets[key], blend);
            milkdropPresetIndex = idx;
            // force a couple frames to avoid "stuck/black" after heavy presets
            try { milkdropStart(); } catch(_) {}
            // Sync preset title + selection UI
            try { updateMilkdropUI(); } catch(_) {}
            try {
                const panel = document.getElementById('mdPresetPanel');
                const filter = document.getElementById('mdPresetFilter');
                if (panel && panel.getAttribute('aria-hidden') === 'false') {
                    renderMdPresetList((filter && filter.value) ? filter.value : '');
                }
            } catch(_) {}
            return true;
        } catch(e) {
            _warn('[Milkdrop] preset failed:', key, e);
            idx = (idx + 1) % total;
        }
    }
    return false;
}
function milkdropPrevPreset() {
    if (!milkdropEnabled) return;
    if (!milkdrop || !milkdropPresets || !milkdropPresetKeys.length) return;
    const total = milkdropPresetKeys.length;
    const target = (milkdropPresetIndex - 1 + total) % total;
    // Try target first; if it fails, safe loader will fall forward to a working one.
    milkdropLoadPresetSafe(target, 1.0);
}

function milkdropRandomPreset() {
    if (!milkdrop || !milkdropPresets || !milkdropPresetKeys.length) return;
    const target = Math.floor(Math.random() * milkdropPresetKeys.length);
    milkdropLoadPresetSafe(target, 1.2);
}

function milkdropSetPresetByKey(key, blend=1.0){
    if (!milkdrop || !milkdropPresets || !milkdropPresetKeys.length) return;
    const idx = milkdropPresetKeys.indexOf(key);
    if (idx < 0) return;
    milkdropPresetIndex = idx;
    try { milkdrop.loadPreset(milkdropPresets[key], blend); } catch(e) {}
    // Sync preset title + highlight
    try { updateMilkdropUI(); } catch(_) {}
    try {
        const panel = document.getElementById('mdPresetPanel');
        const filter = document.getElementById('mdPresetFilter');
        if (panel && panel.getAttribute('aria-hidden') === 'false') {
            renderMdPresetList((filter && filter.value) ? filter.value : '');
        }
    } catch(_) {}
}

function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (m) => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
}

function updateVizLabel(){

    const el = document.getElementById('vizLabel');
    if(!el) return;
    el.textContent = '';
    el.style.display = 'none';
}


// ------------------------------------------------------------
// Butterchurn (Milkdrop) – optional viz mode (UI unchanged)
// Mode index: 8 (MILKDROP)
// ------------------------------------------------------------
let milkdrop = null;
let milkdropPresets = null;
let milkdropPresetKeys = [];
let milkdropPresetIndex = 0;
let milkdropRaf = 0;

function hasWebGL2() {
    try { return !!document.createElement('canvas').getContext('webgl2'); }
    catch(e){ return false; }
}

// butterchurn global can be either {createVisualizer} or {default:{createVisualizer}}
function getButterchurnApi() {
    const bc = window.butterchurn;
    if (!bc) return null;
    if (typeof bc.createVisualizer === 'function') return bc;
    if (bc.default && typeof bc.default.createVisualizer === 'function') return bc.default;
    return null;
}

function hasButterchurn() {
    return !!getButterchurnApi();
}

function milkdropLibsReady() {
    return hasButterchurn()
        && typeof window.butterchurnPresets !== 'undefined'
        && window.butterchurnPresets
        && (typeof window.butterchurnPresets.getPresets === 'function');
}

// Milkdrop is *possible* if WebGL2 exists. Libraries can be loaded (or fixed) afterwards.
function canMilkdrop() {
    return hasWebGL2() && milkdropLibsReady();
}


function ensureMilkdropCanvas() {
    const canvas = document.getElementById('milkdropCanvas');
    if (!canvas) return null;
    const frame = canvas.parentElement || canvas;
    const rect = frame.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
    return canvas;
}

function ensureMilkdrop() {
    if (!hasWebGL2()) {
        _warn('[Milkdrop] unavailable: no WebGL2');
        return false;
    }
    if (!milkdropLibsReady()) {
        _warn('[Milkdrop] libs missing', {
            butterchurn: !!window.butterchurn,
            presets: !!window.butterchurnPresets
        });
        return false;
    }

    if (!aCtx) setupAudio();

    // AudioContext often starts suspended until user interaction
    if (aCtx && aCtx.state === 'suspended') {
        aCtx.resume().catch(() => {});
    }

    if (!milkdropPresets) {
        try {
            milkdropPresets = window.butterchurnPresets.getPresets ? window.butterchurnPresets.getPresets() : null;
            milkdropPresetKeys = milkdropPresets ? Object.keys(milkdropPresets) : [];
            _log('[Milkdrop] presets:', milkdropPresetKeys.length);
            if (milkdropPresetKeys.length) milkdropPresetIndex = Math.floor(Math.random() * milkdropPresetKeys.length);
        } catch (e) {
            _err('[Milkdrop] presets load failed:', e);
            milkdropPresets = null;
            milkdropPresetKeys = [];
        }
    }

    const canvas = ensureMilkdropCanvas();
    if (!canvas) return false;

    if (!milkdrop) {
        try {
            const bcApi = getButterchurnApi();
            milkdrop = bcApi.createVisualizer(aCtx, canvas, {
                width: canvas.width,
                height: canvas.height,
                pixelRatio: (window.devicePixelRatio || 1)
            });
            _log('[Milkdrop] visualizer created');
        } catch (e) {
            _err('[Milkdrop] createVisualizer failed:', e);
            milkdrop = null;
            return false;
        }

        try {
            if (analyser) milkdrop.connectAudio(analyser);
            _log('[Milkdrop] audio connected');
        } catch (e) {
            _err('[Milkdrop] connectAudio failed:', e);
        }

        if (milkdropPresets && milkdropPresetKeys.length) {
            const key = milkdropPresetKeys[milkdropPresetIndex];
            try {
                milkdrop.loadPreset(milkdropPresets[key], 0.0);
                _log('[Milkdrop] preset loaded:', key);
            } catch (e) {
                _err('[Milkdrop] loadPreset failed:', e);
            }
        } else {
            _warn('[Milkdrop] no presets available');
        }
    }

    return true;
}


function milkdropNextPreset() {
    if (!milkdropEnabled) return;
    if (!milkdrop || !milkdropPresets || !milkdropPresetKeys.length) return;
    const total = milkdropPresetKeys.length;
    const target = (milkdropPresetIndex + 1) % total;
    milkdropLoadPresetSafe(target, 1.0);
}

function milkdropRender() {
    if (!milkdrop) return;
    ensureMilkdropCanvas();
    try { milkdrop.render(); } catch(e) {}
    milkdropRaf = requestAnimationFrame(milkdropRender);
}

function milkdropStart() {
    if (milkdropRaf) cancelAnimationFrame(milkdropRaf);
    milkdropRaf = requestAnimationFrame(milkdropRender);
}

function milkdropStop() {
    if (milkdropRaf) cancelAnimationFrame(milkdropRaf);
    milkdropRaf = 0;
}

function applyVizMode() {
    // Milkdrop overlay is controlled separately from the cat spectrum.
    if (milkdropEnabled) {
        const ready = ensureMilkdrop();
        document.body.classList.toggle('milkdrop-on', !!ready);
        if (ready) {
            milkdropStart();
        } else {
            // If missing libs / no WebGL2, auto-disable to avoid confusion.
            milkdropEnabled = false;
            document.body.classList.remove('milkdrop-on');
            document.body.classList.remove('milkdrop-open');
            milkdropStop();
            syncMilkdropToggleUI();
        }
    } else {
        document.body.classList.remove('milkdrop-on');
            document.body.classList.remove('milkdrop-open');
        milkdropStop();
    }
}

// Keyboard: Winamp-ish
// - Ctrl+Shift+K toggles Milkdrop
// - N switches to next preset (when Milkdrop is on)
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toggleMilkdrop();
        // If window is open, keep UI in sync
        if (milkdropOverlayOpen) {
            fillMilkdropSelect(document.getElementById('milkdropSearch')?.value || '');
            updateMilkdropUI();
        }
        return;
    }
    if (!milkdropEnabled) return;
    if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        milkdropNextPreset();
        updateMilkdropUI();
    }
});

function tick() { document.getElementById('timeDisp').textContent = new Date().toLocaleTimeString('en-GB'); }
setInterval(tick, 1000); tick();
updateVizLabel();
applyVizMode();

// Milkdrop toggle icon (small VIS button) + quick controls
// (arrows + preset square live in HTML; we just wire them)

function setupMilkdropQuickControls(){
    if (mdMiniEls) return;
    const mini = document.getElementById('mdMini');
    const prev = document.getElementById('mdPrevBtn');
    const next = document.getElementById('mdNextBtn');
    const presetBtn = document.getElementById('mdPresetBtn');
    const panel = document.getElementById('mdPresetPanel');
    const close = document.getElementById('mdPresetClose');
    const search = document.getElementById('mdPresetSearch');
    const list = document.getElementById('mdPresetList');

    mdMiniEls = { mini, prev, next, presetBtn, panel, close, search, list };

    if (prev) prev.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!milkdropEnabled) enableMilkdrop();
        if (!milkdropEnabled) return;
        milkdropPrevPreset();
        updateMilkdropUI();
    });

    if (next) next.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!milkdropEnabled) enableMilkdrop();
        if (!milkdropEnabled) return;
        milkdropNextPreset();
        updateMilkdropUI();
    });

    if (presetBtn) presetBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!milkdropEnabled) enableMilkdrop();
        toggleMdPresetPanel();
    });

    if (close) close.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeMdPresetPanel(); });

    if (search) search.addEventListener('input', () => renderMdPresetList(search.value));

    if (list) list.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest && e.target.closest('.mdp-item');
        if (!btn) return;
        const key = btn.getAttribute('data-mdkey');
        if (!key) return;
        milkdropSetPresetByKey(key);
        updateMilkdropUI();
        closeMdPresetPanel();
    });

    // click-outside closes
    window.addEventListener('pointerdown', (e) => {
        if (!panel) return;
        if (panel.getAttribute('aria-hidden') !== 'false') return;
        const t = e.target;
        if (panel.contains(t) || presetBtn?.contains(t)) return;
        closeMdPresetPanel();
    }, { passive: true });

    // ESC closes panel
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMdPresetPanel();
    });

    updateMilkdropQuickUI();
}

setupMilkdropQuickControls();

const __vizBtn = document.getElementById('vizBtn');
if (__vizBtn) {
    __vizBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Winamp-ish behavior:
        // - Spectrum ALWAYS runs in the main monitor
        // - Milkdrop opens as a separate window above the player
        // - If Milkdrop is already enabled but minimized, this re-opens it
        // - If Milkdrop is enabled and already open, this turns it off

        if (!milkdropEnabled) {
            enableMilkdrop();
            return;
        }

        if (milkdropEnabled && !milkdropExpanded) {
            try { milkdropExpand(); } catch(e) {}
            return;
        }

        disableMilkdrop();
    });
}



// ------------------------------------------------------------
// Milkdrop expanded window (Winamp-ish)
// - Click Milkdrop screen to expand above the player (same width as player)
// - Minimize returns canvas back to the small monitor
// - Fullscreen is available from the expanded window
// ------------------------------------------------------------
let milkdropExpanded = false;

let milkdropPanelEl = null;
let milkdropPanelBodyEl = null;
let milkdropCanvasHome = null;
let milkdropCanvasHomeNext = null;
let __md_exitByClick = false;
let __md_afterExit = null; // 'min' | 'close' | null


function ensureMilkdropPanel() {
    if (milkdropPanelEl) return milkdropPanelEl;

    const panel = document.createElement('div');
    panel.id = 'milkdropPanel';
    panel.style.display = 'none';
    panel.innerHTML = `
      <div class="md-head">
        <div class="md-title">MILKDROP</div>
        <div class="md-actions">
          <button class="md-btn" type="button" data-act="stations" title="Stations" aria-label="Stations">≡</button>
          <button class="md-btn" type="button" data-act="theme" title="Theme" aria-label="Theme">🎨</button>
          <button class="md-btn" type="button" data-act="min" title="Minimize" aria-label="Minimize">_</button>
          <button class="md-btn" type="button" data-act="fs" title="Fullscreen" aria-label="Fullscreen">[ ]</button>
          <button class="md-btn" type="button" data-act="close" title="Close" aria-label="Close">x</button>
        </div>
      </div>
      <div class="md-body" id="milkdropPanelBody"></div>
    `;
    document.body.appendChild(panel);

    milkdropPanelEl = panel;
    milkdropPanelBodyEl = panel.querySelector('#milkdropPanelBody');

    // Buttons: direct handlers (more reliable than delegated clicks across overlays)
    const btnStations = panel.querySelector('[data-act="stations"]');
    const btnTheme = panel.querySelector('[data-act="theme"]');
    const btnMin = panel.querySelector('[data-act="min"]');
    const btnFs = panel.querySelector('[data-act="fs"]');
    const btnClose = panel.querySelector('[data-act="close"]');

    const stopEvt = (e) => { try { e.preventDefault(); e.stopPropagation(); } catch(_) {} };

    // Allow opening Stations / Theme while Milkdrop is open
    if (btnStations) {
        btnStations.addEventListener('click', (e) => {
            stopEvt(e);
            try { toggleMenu(); } catch(_) {}
        });
    }
    if (btnTheme) {
        btnTheme.addEventListener('click', (e) => {
            stopEvt(e);
            try { document.getElementById('themeBtn')?.click(); } catch(_) {}
        });
    }

    btnMin?.addEventListener('click', (e) => {
        stopEvt(e);
        // Minimize: if fullscreen, exit fullscreen first, then collapse back into the small monitor.
        if (document.fullscreenElement === milkdropPanelEl) {
            __md_afterExit = 'min';
            try { document.exitFullscreen?.(); } catch(_) {}
            return;
        }
        milkdropCollapse();
    });

    btnClose?.addEventListener('click', (e) => {
        stopEvt(e);
        // Close: if fullscreen, exit fullscreen first, then disable Milkdrop.
        if (document.fullscreenElement === milkdropPanelEl) {
            __md_afterExit = 'close';
            try { document.exitFullscreen?.(); } catch(_) {}
            return;
        }
        try { milkdropCollapse(true); } catch(_) {}
        try { disableMilkdrop(); } catch(_) {}
    });

    btnFs?.addEventListener('click', (e) => {
        stopEvt(e);
        try {
            // Make sure the panel is visible before requesting fullscreen
            if (!milkdropExpanded) {
                try { milkdropExpand(); } catch(_) {}
            }
            if (document.fullscreenElement !== milkdropPanelEl) {
                const p = milkdropPanelEl.requestFullscreen ? milkdropPanelEl.requestFullscreen() : null;
                if (p && typeof p.catch === 'function') p.catch(() => {});
            } else {
                document.exitFullscreen?.();
            }
        } catch(_) {}
    });


    const rw = document.getElementById('radioWindow');
    if (rw && 'ResizeObserver' in window) {
        const ro = new ResizeObserver(() => {
            if (milkdropExpanded) positionMilkdropPanel();
        });
        ro.observe(rw);
    }
    window.addEventListener('resize', () => { if (milkdropExpanded) positionMilkdropPanel(); }, { passive: true });
    document.addEventListener('fullscreenchange', () => {
        const fs = (document.fullscreenElement === milkdropPanelEl);
        document.body.classList.toggle('milkdrop-fs', fs);

        // Always resync renderer on fullscreen transitions (prevents black frames)
        setTimeout(() => { try { milkdropResizeToContainer(); milkdropStart(); } catch(_) {} }, 30);

        // If we exited fullscreen because the visual was clicked, we keep the expanded window open.
        if (!fs && __md_exitByClick) {
            __md_exitByClick = false;
        }

        // If we exited fullscreen via window buttons, run the follow-up action.
        if (!fs && __md_afterExit) {
            const act = __md_afterExit;
            __md_afterExit = null;
            if (act === 'min') {
                milkdropCollapse();
            } else if (act === 'close') {
                try { milkdropCollapse(true) } catch(_) {}
                try { disableMilkdrop(); } catch(_) {}
            }
        }

        if (milkdropExpanded) {
            // Let layout settle first
            setTimeout(() => { try { positionMilkdropPanel(); milkdropResizeToContainer(); } catch(_) {} }, 40);
        }
    });

    return panel;
}

function positionMilkdropPanel() {
    if (!milkdropPanelEl) return;
    const rw = document.getElementById('radioWindow');
    if (!rw) return;

    // Fullscreen layout: take the whole viewport (Winamp-like).
    if (document.fullscreenElement === milkdropPanelEl) {
        milkdropPanelEl.style.top = '0px';
        milkdropPanelEl.style.left = '0px';
        milkdropPanelEl.style.width = '100vw';
        milkdropPanelEl.style.height = '100vh';
        try { milkdropPanelEl.style.borderRadius = '0px'; } catch(_) {}
        return;
    }

    const r = rw.getBoundingClientRect();
    const pad = 12;
    const h = 320;

    milkdropPanelEl.style.width = Math.floor(r.width) + 'px';
    milkdropPanelEl.style.left = Math.floor(r.left) + 'px';
    milkdropPanelEl.style.height = h + 'px';

    // place above the player; clamp to viewport
    const top = Math.max(pad, Math.floor(r.top - h - 12));
    milkdropPanelEl.style.top = top + 'px';
    try { milkdropPanelEl.style.borderRadius = '16px'; } catch(_) {}
}

// Keep Milkdrop "magnet-attached" to the radio window while dragging/resizing.
// We do this via a rAF scheduler so dragging stays smooth.
let __mdDockRaf = null;
function scheduleMilkdropDockUpdate() {
    try {
        if (!milkdropExpanded) return;
        if (document.fullscreenElement === milkdropPanelEl) return;
    } catch(_) {
        // ignore
    }
    if (__mdDockRaf) return;
    __mdDockRaf = requestAnimationFrame(() => {
        __mdDockRaf = null;
        try {
            positionMilkdropPanel();
            milkdropResizeToContainer();
        } catch(_) {}
    });
}

function milkdropResizeToContainer() {
    if (!milkdropEnabled) return;
    const canvas = document.getElementById('milkdropCanvas');
    if (!canvas) return;
    ensureMilkdropCanvas();
    if (milkdrop && typeof milkdrop.setRendererSize === 'function') {
        try { milkdrop.setRendererSize(canvas.width, canvas.height); } catch(_) {}
    }
}

function milkdropExpand() {
    if (milkdropExpanded) return;
    if (!milkdropEnabled) return;
    if (!ensureMilkdrop()) return;

    ensureMilkdropPanel();

    const canvas = document.getElementById('milkdropCanvas');
    if (!canvas || !milkdropPanelBodyEl) return;

    milkdropCanvasHome = canvas.parentElement;
    milkdropCanvasHomeNext = canvas.nextSibling;

    milkdropPanelBodyEl.appendChild(canvas);

    milkdropExpanded = true;
    try { document.body.classList.add('milkdrop-open'); } catch(_) {}

    milkdropPanelEl.style.display = 'block';
    positionMilkdropPanel();
    milkdropResizeToContainer();

    // Mini controls should appear only in expanded mode
    closeMdPresetPanel();
    updateMilkdropQuickUI();
}

function milkdropCollapse(force = false) {
    if (!milkdropExpanded && !force) return;

    const canvas = document.getElementById('milkdropCanvas');
    if (canvas && milkdropCanvasHome) {
        try {
            if (milkdropCanvasHomeNext && milkdropCanvasHomeNext.parentNode == milkdropCanvasHome) {
                milkdropCanvasHome.insertBefore(canvas, milkdropCanvasHomeNext);
            } else {
                milkdropCanvasHome.appendChild(canvas);
            }
        } catch(_) {}
    }

    milkdropExpanded = false;
    // IMPORTANT: 'milkdrop-open' must reflect the *window being visible*, not just enabled.
    // If we collapse the window, remove the class so the Milkdrop icon can re-appear.
    try { document.body.classList.remove('milkdrop-open'); } catch(_) {}
    if (milkdropPanelEl) milkdropPanelEl.style.display = 'none';
    milkdropResizeToContainer();

    // Hide mini controls when collapsed; show Milkdrop icon again
    closeMdPresetPanel();
    updateMilkdropQuickUI();
}

function toggleMilkdropExpand() {
    if (!milkdropEnabled) return;
    if (milkdropExpanded) milkdropCollapse();
    else milkdropExpand();
}

// Click on Milkdrop screen (only when Milkdrop is enabled) to expand.
(function bindMilkdropExpandClicks(){
    const mdCanvas = document.getElementById('milkdropCanvas');
    if (!mdCanvas) return;

    mdCanvas.addEventListener('click', (e) => {
        if (!milkdropEnabled) return;
        // Left click only
        if (typeof e.button === 'number' && e.button !== 0) return;

        // When fullscreen, a click should NOT move the canvas (that caused black screen).
        // Instead, just exit fullscreen back to the expanded window (Winamp-ish).
        if (document.fullscreenElement === milkdropPanelEl) {
            try {
                __md_exitByClick = true;
                document.exitFullscreen?.();
            } catch(_) {}
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Normal mode: click toggles expanded/collapsed.
        toggleMilkdropExpand();
    }, { passive: false });
    // Double-click -> toggle fullscreen (Winamp-ish)
    mdCanvas.addEventListener('dblclick', (e) => {
        if (!milkdropEnabled) return;
        if (typeof e.button === 'number' && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        try {
            if (!milkdropExpanded) milkdropExpand();
            ensureMilkdropPanel();
            if (document.fullscreenElement !== milkdropPanelEl) {
                const p = milkdropPanelEl.requestFullscreen ? milkdropPanelEl.requestFullscreen() : null;
                if (p && typeof p.catch === 'function') p.catch(() => {});
            } else {
                document.exitFullscreen?.();
            }
        } catch(_) {}
    }, { passive: false });

})();
// ── Latvian stations loaded from provided M3U file (embedded for offline/file://) ──
const LATVIAN_STATIONS = [
  {title:"──── LATVIJAS RADIO (M3U) ────",group:"separator",stream_128:"",stream_320:"",stream_hls:"",stream_64:"",prefix:"",id:""},
  {title:"ABC LOUNGE",group:"latvija",stream_128:"https://listen.openstream.co/4457/audio",stream_320:"https://listen.openstream.co/4457/audio",stream_hls:"",stream_64:"https://listen.openstream.co/4457/audio",prefix:"",id:""},
  {title:"ABSOLUTE CHILLOUT",group:"latvija",stream_128:"https://streaming.live365.com/b05055_128mp3",stream_320:"https://streaming.live365.com/b05055_128mp3",stream_hls:"",stream_64:"https://streaming.live365.com/b05055_128mp3",prefix:"",id:""},
  {title:"ALISE PLUS",group:"latvija",stream_128:"https://fm2inet.aliseplus.lv:8000",stream_320:"https://fm2inet.aliseplus.lv:8000",stream_hls:"",stream_64:"https://fm2inet.aliseplus.lv:8000",prefix:"",id:""},
  {title:"AVTORADIO",group:"latvija",stream_128:"https://live.relaxfm.lv/03",stream_320:"https://live.relaxfm.lv/03",stream_hls:"",stream_64:"https://live.relaxfm.lv/03",prefix:"",id:""},
  {title:"BALTKOM RADIO",group:"latvija",stream_128:"https://live.relaxfm.lv/08",stream_320:"https://live.relaxfm.lv/08",stream_hls:"",stream_64:"https://live.relaxfm.lv/08",prefix:"",id:""},
  {title:"BIG RADIO – 70s FM",group:"latvija",stream_128:"https://bigrradio.cdnstream1.com/5182_128?listenerid=ea4ef9d7-dc2d-496b-9f18-5bbd5ca7923a&cb=974096.mp3",stream_320:"https://bigrradio.cdnstream1.com/5182_128?listenerid=ea4ef9d7-dc2d-496b-9f18-5bbd5ca7923a&cb=974096.mp3",stream_hls:"",stream_64:"https://bigrradio.cdnstream1.com/5182_128?listenerid=ea4ef9d7-dc2d-496b-9f18-5bbd5ca7923a&cb=974096.mp3",prefix:"",id:""},
  {title:"CAPITAL FM",group:"latvija",stream_128:"https://media-ssl.musicradio.com/CapitalTeesside",stream_320:"https://media-ssl.musicradio.com/CapitalTeesside",stream_hls:"",stream_64:"https://media-ssl.musicradio.com/CapitalTeesside",prefix:"",id:""},
  {title:"CHILLTRAX",group:"latvija",stream_128:"https://streamssl.chilltrax.com/",stream_320:"https://streamssl.chilltrax.com/",stream_hls:"",stream_64:"https://streamssl.chilltrax.com/",prefix:"",id:""},
  {title:"DETSKOE",group:"latvija",stream_128:"https://pub0101.101.ru:8000/stream/air/aac/64/199",stream_320:"https://pub0101.101.ru:8000/stream/air/aac/64/199",stream_hls:"",stream_64:"https://pub0101.101.ru:8000/stream/air/aac/64/199",prefix:"",id:""},
  {title:"DFM",group:"latvija",stream_128:"https://dfm.hostingradio.ru/dfm128.mp3",stream_320:"https://dfm.hostingradio.ru/dfm128.mp3",stream_hls:"",stream_64:"https://dfm.hostingradio.ru/dfm128.mp3",prefix:"",id:""},
  {title:"DIVU KRASTU RADIO",group:"latvija",stream_128:"https://live.dkradio.lv/01",stream_320:"https://live.dkradio.lv/01",stream_hls:"",stream_64:"https://live.dkradio.lv/01",prefix:"",id:""},
  {title:"DOROZNOE RADIO",group:"latvija",stream_128:"https://dor2server.streamr.ru:8000/dor_64_no",stream_320:"https://dor2server.streamr.ru:8000/dor_64_no",stream_hls:"",stream_64:"https://dor2server.streamr.ru:8000/dor_64_no",prefix:"",id:""},
  {title:"EHR ACCOUSTIC",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_SUPER_HITS_CHILLOUT.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_SUPER_HITS_CHILLOUT.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_SUPER_HITS_CHILLOUT.mp3",prefix:"",id:""},
  {title:"EHR DANCE",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_DANCE.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_DANCE.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_DANCE.mp3",prefix:"",id:""},
  {title:"EHR FRESH",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_FRESH.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_FRESH.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_FRESH.mp3",prefix:"",id:""},
  {title:"EHR LATVIEŠU HITI",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_LATVIESU_HITI.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_LATVIESU_HITI.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_LATVIESU_HITI.mp3",prefix:"",id:""},
  {title:"EHR SUPERHITS",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_SUPERHITS.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_SUPERHITS.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_SUPERHITS.mp3",prefix:"",id:""},
  {title:"EIROPAS HĪTU RADIO",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR.mp3",prefix:"",id:""},
  {title:"ESC RADIO",group:"latvija",stream_128:"https://icepool.silvacast.com/ESCRADIO.mp3",stream_320:"https://icepool.silvacast.com/ESCRADIO.mp3",stream_hls:"",stream_64:"https://icepool.silvacast.com/ESCRADIO.mp3",prefix:"",id:""},
  {title:"EUROPA PLUS",group:"latvija",stream_128:"https://ep128.hostingradio.ru:8030/ep128",stream_320:"https://ep128.hostingradio.ru:8030/ep128",stream_hls:"",stream_64:"https://ep128.hostingradio.ru:8030/ep128",prefix:"",id:""},
  {title:"FIP RADIO",group:"latvija",stream_128:"https://icecast.radiofrance.fr/fip-midfi.mp3",stream_320:"https://icecast.radiofrance.fr/fip-midfi.mp3",stream_hls:"",stream_64:"https://icecast.radiofrance.fr/fip-midfi.mp3",prefix:"",id:""},
  {title:"GRADIO",group:"latvija",stream_128:"https://stream.gradio.lv/gradio.mp3",stream_320:"https://stream.gradio.lv/gradio.mp3",stream_hls:"",stream_64:"https://stream.gradio.lv/gradio.mp3",prefix:"",id:""},
  {title:"HIT FM",group:"latvija",stream_128:"https://hitfm.hostingradio.ru/hitfm128.mp3",stream_320:"https://hitfm.hostingradio.ru/hitfm128.mp3",stream_hls:"",stream_64:"https://hitfm.hostingradio.ru/hitfm128.mp3",prefix:"",id:""},
  {title:"JAZZ FM",group:"latvija",stream_128:"https://nashe1.hostingradio.ru/jazz-128.mp3",stream_320:"https://nashe1.hostingradio.ru/jazz-128.mp3",stream_hls:"",stream_64:"https://nashe1.hostingradio.ru/jazz-128.mp3",prefix:"",id:""},
  {title:"KISS KISS ITALIA",group:"latvija",stream_128:"https://kisskiss.fluidstream.eu/KKItalia.aac?FLID=8&type=.aac",stream_320:"https://kisskiss.fluidstream.eu/KKItalia.aac?FLID=8&type=.aac",stream_hls:"",stream_64:"https://kisskiss.fluidstream.eu/KKItalia.aac?FLID=8&type=.aac",prefix:"",id:""},
  {title:"KURZEMES RADIO",group:"latvija",stream_128:"https://31.170.16.6:8000/;stream.mp3",stream_320:"https://31.170.16.6:8000/;stream.mp3",stream_hls:"",stream_64:"https://31.170.16.6:8000/;stream.mp3",prefix:"",id:""},
  {title:"LATGALES RADIO",group:"latvija",stream_128:"https://www.radiolg.lv:8000/128_mp3",stream_320:"https://www.radiolg.lv:8000/128_mp3",stream_hls:"",stream_64:"https://www.radiolg.lv:8000/128_mp3",prefix:"",id:""},
  {title:"LATVIEŠU DEJU HITI",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/LATVIESU_HITI_DEJU_HITI.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/LATVIESU_HITI_DEJU_HITI.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/LATVIESU_HITI_DEJU_HITI.mp3",prefix:"",id:""},
  {title:"LATVIEŠU REPA HITI",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/LATVIESU_HITI_LV_REPS.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/LATVIESU_HITI_LV_REPS.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/LATVIESU_HITI_LV_REPS.mp3",prefix:"",id:""},
  {title:"LATVIJAS KRISTĪGAIS RADIO",group:"latvija",stream_128:"https://shoutcast.lkr.lv:7007/;stream.mp3",stream_320:"https://shoutcast.lkr.lv:7007/;stream.mp3",stream_hls:"",stream_64:"https://shoutcast.lkr.lv:7007/;stream.mp3",prefix:"",id:""},
  {title:"LATVIJAS RADIO 1",group:"latvija",stream_128:"https://lr1mp1.latvijasradio.lv:8012/;stream.mp3",stream_320:"https://lr1mp1.latvijasradio.lv:8012/;stream.mp3",stream_hls:"",stream_64:"https://lr1mp1.latvijasradio.lv:8012/;stream.mp3",prefix:"",id:""},
  {title:"LATVIJAS RADIO 2",group:"latvija",stream_128:"https://lr2mp1.latvijasradio.lv:8002/;stream.mp3",stream_320:"https://lr2mp1.latvijasradio.lv:8002/;stream.mp3",stream_hls:"",stream_64:"https://lr2mp1.latvijasradio.lv:8002/;stream.mp3",prefix:"",id:""},
  {title:"LATVIJAS RADIO 3 (KLASIKA)",group:"latvija",stream_128:"https://lr3mp0.latvijasradio.lv:8004/;stream.mp3",stream_320:"https://lr3mp0.latvijasradio.lv:8004/;stream.mp3",stream_hls:"",stream_64:"https://lr3mp0.latvijasradio.lv:8004/;stream.mp3",prefix:"",id:""},
  {title:"LATVIJAS RADIO 4 (DOMA LAUKUMS)",group:"latvija",stream_128:"https://lr4mp1.latvijasradio.lv:8020/;stream.mp3",stream_320:"https://lr4mp1.latvijasradio.lv:8020/;stream.mp3",stream_hls:"",stream_64:"https://lr4mp1.latvijasradio.lv:8020/;stream.mp3",prefix:"",id:""},
  {title:"LOUNGE FM",group:"latvija",stream_128:"https://streams.radioskonto.lv:8443/lounge",stream_320:"https://streams.radioskonto.lv:8443/lounge",stream_hls:"",stream_64:"https://streams.radioskonto.lv:8443/lounge",prefix:"",id:""},
  {title:"LOVE RADIO",group:"latvija",stream_128:"https://radioshahab.stream.laut.fm/radioshahab",stream_320:"https://radioshahab.stream.laut.fm/radioshahab",stream_hls:"",stream_64:"https://radioshahab.stream.laut.fm/radioshahab",prefix:"",id:""},
  {title:"LUSTĪGS RADIO",group:"latvija",stream_128:"https://stream.lustigsradio.lv/live",stream_320:"https://stream.lustigsradio.lv/live",stream_hls:"",stream_64:"https://stream.lustigsradio.lv/live",prefix:"",id:""},
  {title:"MARIJA",group:"latvija",stream_128:"https://195.122.25.178:8000/;stream.mp3",stream_320:"https://195.122.25.178:8000/;stream.mp3",stream_hls:"",stream_64:"https://195.122.25.178:8000/;stream.mp3",prefix:"",id:""},
  {title:"MARUSJA FM",group:"latvija",stream_128:"https://radio-holding.ru:9000/marusya_default",stream_320:"https://radio-holding.ru:9000/marusya_default",stream_hls:"",stream_64:"https://radio-holding.ru:9000/marusya_default",prefix:"",id:""},
  {title:"MAXIMUM",group:"latvija",stream_128:"https://maximum.hostingradio.ru/maximum128.mp3",stream_320:"https://maximum.hostingradio.ru/maximum128.mp3",stream_hls:"",stream_64:"https://maximum.hostingradio.ru/maximum128.mp3",prefix:"",id:""},
  {title:"MIX FM",group:"latvija",stream_128:"https://195.130.205.203:8000/07",stream_320:"https://195.130.205.203:8000/07",stream_hls:"",stream_64:"https://195.130.205.203:8000/07",prefix:"",id:""},
  {title:"NASHE",group:"latvija",stream_128:"https://nashe.streamr.ru/nashe-128.mp3",stream_320:"https://nashe.streamr.ru/nashe-128.mp3",stream_hls:"",stream_64:"https://nashe.streamr.ru/nashe-128.mp3",prefix:"",id:""},
  {title:"NEMIERS",group:"latvija",stream_128:"https://stream.radionemiers.com/nmrs/playlist.m3u8",stream_320:"https://stream.radionemiers.com/nmrs/playlist.m3u8",stream_hls:"https://stream.radionemiers.com/nmrs/playlist.m3u8",stream_64:"https://stream.radionemiers.com/nmrs/playlist.m3u8",prefix:"",id:""},
  {title:"NORDIC BEAT",group:"latvija",stream_128:"https://play.radioking.io/nordic-chillout-radio/736489",stream_320:"https://play.radioking.io/nordic-chillout-radio/736489",stream_hls:"",stream_64:"https://play.radioking.io/nordic-chillout-radio/736489",prefix:"",id:""},
  {title:"NORMA",group:"latvija",stream_128:"https://80.232.245.141:8000/norma",stream_320:"https://80.232.245.141:8000/norma",stream_hls:"",stream_64:"https://80.232.245.141:8000/norma",prefix:"",id:""},
  {title:"NOVOE RADIO",group:"latvija",stream_128:"https://icecast-newradio.cdnvideo.ru/newradio3",stream_320:"https://icecast-newradio.cdnvideo.ru/newradio3",stream_hls:"",stream_64:"https://icecast-newradio.cdnvideo.ru/newradio3",prefix:"",id:""},
  {title:"NRJ",group:"latvija",stream_128:"https://pub0302.101.ru:8443/stream/air/aac/64/99",stream_320:"https://pub0302.101.ru:8443/stream/air/aac/64/99",stream_hls:"",stream_64:"https://pub0302.101.ru:8443/stream/air/aac/64/99",prefix:"",id:""},
  {title:"ORFEI",group:"latvija",stream_128:"https://orfeyfm.hostingradio.ru:8034/orfeyfm128.mp3",stream_320:"https://orfeyfm.hostingradio.ru:8034/orfeyfm128.mp3",stream_hls:"",stream_64:"https://orfeyfm.hostingradio.ru:8034/orfeyfm128.mp3",prefix:"",id:""},
  {title:"PASAULES MŪZIKAS RADIO",group:"latvija",stream_128:"https://pmr.lt/streams/pmr-web?1622900449507",stream_320:"https://pmr.lt/streams/pmr-web?1622900449507",stream_hls:"",stream_64:"https://pmr.lt/streams/pmr-web?1622900449507",prefix:"",id:""},
  {title:"PIK",group:"latvija",stream_128:"https://91.90.255.85:8000/01",stream_320:"https://91.90.255.85:8000/01",stream_hls:"",stream_64:"https://91.90.255.85:8000/01",prefix:"",id:""},
  {title:"POWER FM",group:"latvija",stream_128:"https://radio.powerfm.lv:8000/;stream.mp3",stream_320:"https://radio.powerfm.lv:8000/;stream.mp3",stream_hls:"",stream_64:"https://radio.powerfm.lv:8000/;stream.mp3",prefix:"",id:""},
  {title:"POWER HIT RADIO",group:"latvija",stream_128:"https://stream.rcs.revma.com/f31w7e0fveuvv",stream_320:"https://stream.rcs.revma.com/f31w7e0fveuvv",stream_hls:"",stream_64:"https://stream.rcs.revma.com/f31w7e0fveuvv",prefix:"",id:""},
  {title:"RADIO 1 JĒKABPILS",group:"latvija",stream_128:"https://www.radio1.lv:8000/stream.aac",stream_320:"https://www.radio1.lv:8000/stream.aac",stream_hls:"",stream_64:"https://www.radio1.lv:8000/stream.aac",prefix:"",id:""},
  {title:"RADIO 9",group:"latvija",stream_128:"https://streams.radioskonto.lv:8010/radio9",stream_320:"https://streams.radioskonto.lv:8010/radio9",stream_hls:"",stream_64:"https://streams.radioskonto.lv:8010/radio9",prefix:"",id:""},
  {title:"RELAX FM",group:"latvija",stream_128:"https://live.relaxfm.lv/02",stream_320:"https://live.relaxfm.lv/02",stream_hls:"",stream_64:"https://live.relaxfm.lv/02",prefix:"",id:""},
  {title:"RETRO DISCO",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/RETRO_FM_LATVIJA_DISCO.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/RETRO_FM_LATVIJA_DISCO.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/RETRO_FM_LATVIJA_DISCO.mp3",prefix:"",id:""},
  {title:"RETRO FM",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/RETRO_FM.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/RETRO_FM.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/RETRO_FM.mp3",prefix:"",id:""},
  {title:"RĒZEKNE",group:"latvija",stream_128:"https://live.radio-rezekne.lv:8000/live.mp3",stream_320:"https://live.radio-rezekne.lv:8000/live.mp3",stream_hls:"",stream_64:"https://live.radio-rezekne.lv:8000/live.mp3",prefix:"",id:""},
  {title:"RMF FM",group:"latvija",stream_128:"https://rs202-krk.rmfstream.pl/RMFFM48",stream_320:"https://rs202-krk.rmfstream.pl/RMFFM48",stream_hls:"",stream_64:"https://rs202-krk.rmfstream.pl/RMFFM48",prefix:"",id:""},
  {title:"ROMANTIKA",group:"latvija",stream_128:"https://ic6.101.ru:8000/stream/air/aac/64/101",stream_320:"https://ic6.101.ru:8000/stream/air/aac/64/101",stream_hls:"",stream_64:"https://ic6.101.ru:8000/stream/air/aac/64/101",prefix:"",id:""},
  {title:"RUSSKIE PESNI",group:"latvija",stream_128:"https://listen.rusongs.ru/ru-aac-64",stream_320:"https://listen.rusongs.ru/ru-aac-64",stream_hls:"",stream_64:"https://listen.rusongs.ru/ru-aac-64",prefix:"",id:""},
  {title:"SEREBRJANIIJ DOZD",group:"latvija",stream_128:"https://silverrain.hostingradio.ru/silver128.mp3",stream_320:"https://silverrain.hostingradio.ru/silver128.mp3",stream_hls:"",stream_64:"https://silverrain.hostingradio.ru/silver128.mp3",prefix:"",id:""},
  {title:"SCHLAGER TIME",group:"latvija",stream_128:"https://schlagers.org:8760/;",stream_320:"https://schlagers.org:8760/;",stream_hls:"",stream_64:"https://schlagers.org:8760/;",prefix:"",id:""},
  {title:"SHOKOLAD",group:"latvija",stream_128:"https://choco.hostingradio.ru:10010/fm",stream_320:"https://choco.hostingradio.ru:10010/fm",stream_hls:"",stream_64:"https://choco.hostingradio.ru:10010/fm",prefix:"",id:""},
  {title:"SHANSON",group:"latvija",stream_128:"https://chanson.hostingradio.ru:8041/chanson64.mp3",stream_320:"https://chanson.hostingradio.ru:8041/chanson64.mp3",stream_hls:"",stream_64:"https://chanson.hostingradio.ru:8041/chanson64.mp3",prefix:"",id:""},
  {title:"SMOOTH",group:"latvija",stream_128:"https://media-ssl.musicradio.com/SmoothLondonMP3",stream_320:"https://media-ssl.musicradio.com/SmoothLondonMP3",stream_hls:"",stream_64:"https://media-ssl.musicradio.com/SmoothLondonMP3",prefix:"",id:""},
  {title:"SKONTO",group:"latvija",stream_128:"https://stream.radioskonto.lv:8443/stereo",stream_320:"https://stream.radioskonto.lv:8443/stereo",stream_hls:"",stream_64:"https://stream.radioskonto.lv:8443/stereo",prefix:"",id:""},
  {title:"SKONTO PLUS",group:"latvija",stream_128:"https://stream.radioskontoplus.lv:8443/st128",stream_320:"https://stream.radioskontoplus.lv:8443/st128",stream_hls:"",stream_64:"https://stream.radioskontoplus.lv:8443/st128",prefix:"",id:""},
  {title:"SOULSIDE RADIO",group:"latvija",stream_128:"https://radio2.vip-radios.fm:18068/stream-128kmp3-CafeSoulside",stream_320:"https://radio2.vip-radios.fm:18068/stream-128kmp3-CafeSoulside",stream_hls:"",stream_64:"https://radio2.vip-radios.fm:18068/stream-128kmp3-CafeSoulside",prefix:"",id:""},
  {title:"STAR FM",group:"latvija",stream_128:"https://starfm.live.advailo.com/audio/mp3/icecast.audio",stream_320:"https://starfm.live.advailo.com/audio/mp3/icecast.audio",stream_hls:"",stream_64:"https://starfm.live.advailo.com/audio/mp3/icecast.audio",prefix:"",id:""},
  {title:"SUNSHINE FM",group:"latvija",stream_128:"https://23203.live.streamtheworld.com/4SFM_SC",stream_320:"https://23203.live.streamtheworld.com/4SFM_SC",stream_hls:"",stream_64:"https://23203.live.streamtheworld.com/4SFM_SC",prefix:"",id:""},
  {title:"SUPER FM",group:"latvija",stream_128:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_SUPERHITS.mp3",stream_320:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_SUPERHITS.mp3",stream_hls:"",stream_64:"https://playerservices.streamtheworld.com/api/livestream-redirect/EHR_SUPERHITS.mp3",prefix:"",id:""},
  {title:"SVOBODA",group:"latvija",stream_128:"https://stream.radiojar.com/hcrb063nn3quv",stream_320:"https://stream.radiojar.com/hcrb063nn3quv",stream_hls:"",stream_64:"https://stream.radiojar.com/hcrb063nn3quv",prefix:"",id:""},
  {title:"SWH",group:"latvija",stream_128:"https://live.radioswh.lv:8443/swhmp3",stream_320:"https://live.radioswh.lv:8443/swhmp3",stream_hls:"",stream_64:"https://live.radioswh.lv:8443/swhmp3",prefix:"",id:""},
  {title:"SWH GOLD",group:"latvija",stream_128:"https://live.radioswh.lv:8443/goldmp3",stream_320:"https://live.radioswh.lv:8443/goldmp3",stream_hls:"",stream_64:"https://live.radioswh.lv:8443/goldmp3",prefix:"",id:""},
  {title:"SWH LV",group:"latvija",stream_128:"https://live.radioswh.lv:8443/swh_lv",stream_320:"https://live.radioswh.lv:8443/swh_lv",stream_hls:"",stream_64:"https://live.radioswh.lv:8443/swh_lv",prefix:"",id:""},
  {title:"SWH PLUS",group:"latvija",stream_128:"https://live.radioswh.lv:8443/plusmp3",stream_320:"https://live.radioswh.lv:8443/plusmp3",stream_hls:"",stream_64:"https://live.radioswh.lv:8443/plusmp3",prefix:"",id:""},
  {title:"SWH ROCK",group:"latvija",stream_128:"https://live.radioswh.lv:8443/rockmp3",stream_320:"https://live.radioswh.lv:8443/rockmp3",stream_hls:"",stream_64:"https://live.radioswh.lv:8443/rockmp3",prefix:"",id:""},
  {title:"SWH SPIN",group:"latvija",stream_128:"https://live.radioswh.lv:8443/spinmp3",stream_320:"https://live.radioswh.lv:8443/spinmp3",stream_hls:"",stream_64:"https://live.radioswh.lv:8443/spinmp3",prefix:"",id:""},
  {title:"TOP RADIO",group:"latvija",stream_128:"https://topradio.live.advailo.com/topradio/mp3/icecast.audio",stream_320:"https://topradio.live.advailo.com/topradio/mp3/icecast.audio",stream_hls:"",stream_64:"https://topradio.live.advailo.com/topradio/mp3/icecast.audio",prefix:"",id:""},
  {title:"TRANCE RADIO",group:"latvija",stream_128:"https://strmreg.1.fm/atr_mobile_mp3",stream_320:"https://strmreg.1.fm/atr_mobile_mp3",stream_hls:"",stream_64:"https://strmreg.1.fm/atr_mobile_mp3",prefix:"",id:""},
  {title:"VANJA",group:"latvija",stream_128:"https://listen.radio.tomsk.ru/vanya",stream_320:"https://listen.radio.tomsk.ru/vanya",stream_hls:"",stream_64:"https://listen.radio.tomsk.ru/vanya",prefix:"",id:""},
  {title:"VATIKĀNS",group:"latvija",stream_128:"https://media.vaticannews.va/media/audio/program/449/lettone_011122.mp3",stream_320:"https://media.vaticannews.va/media/audio/program/449/lettone_011122.mp3",stream_hls:"",stream_64:"https://media.vaticannews.va/media/audio/program/449/lettone_011122.mp3",prefix:"",id:""},
  {title:"VIKERRAADIO",group:"latvija",stream_128:"https://icecast.err.ee/vikerraadio.mp3",stream_320:"https://icecast.err.ee/vikerraadio.mp3",stream_hls:"",stream_64:"https://icecast.err.ee/vikerraadio.mp3",prefix:"",id:""},
  {title:"ZET",group:"latvija",stream_128:"https://25593.live.streamtheworld.com/RADIO_ZET.mp3",stream_320:"https://25593.live.streamtheworld.com/RADIO_ZET.mp3",stream_hls:"",stream_64:"https://25593.live.streamtheworld.com/RADIO_ZET.mp3",prefix:"",id:""},
  {title:"X RADIO",group:"latvija",stream_128:"https://185.8.60.5:8000/;stream.mp3",stream_320:"https://185.8.60.5:8000/;stream.mp3",stream_hls:"",stream_64:"https://185.8.60.5:8000/;stream.mp3",prefix:"",id:""},
  {title:"XOFM",group:"latvija",stream_128:"https://live.xo.fm/xofm128",stream_320:"https://live.xo.fm/xofm128",stream_hls:"",stream_64:"https://live.xo.fm/xofm128",prefix:"",id:""},
];

async function initStations() {
    // Load local JSON asynchronously first (non-blocking startup for page)
    await loadLocalStationsJSON();
    // 1) Instant fallback list (so play/menu works even if network is slow after radio opens)
    recordStations = (STATIONS_LOCAL || []).map(s => ({
        title: s.title,
        group: s.group || 'radiorecord',
        prefix: (() => {
            const stream = String(s.hls || s.url || '');
            const m = stream.match(/hostingradio\.ru\/([^\/\?]+)\//i);
            return (m && m[1]) ? m[1] : '';
        })(),
        stream_hls: s.hls || '',
        stream_128: s.url || s.hls || '',
        stream_64: s.url || '',
        stream_320: s.url || s.hls || '',
        id: ''
    }));

    // Keep Latvian stations as a separate source (embedded, works offline/file://)
    latvianStations = Array.isArray(LATVIAN_STATIONS) ? LATVIAN_STATIONS.slice() : [];
    refreshCombinedStations();
    renderStationOverlay();

    // 2) Upgrade record list from CF Worker (stations + proper stream qualities)
    loadStationsFromWorker().catch(() => {});
}

function renderStationOverlay() {
    const grid = document.getElementById('stationOverlay');
    if (!grid) return;

    grid.innerHTML = stationsList.map((s, index) => {
        if (s.group === 'separator') {
            return `<div class="station-separator"><span>${escapeHtml(s.title)}</span></div>`;
        }
        const isLV = s.group === 'latvija';
        return `<button class="station-tile${isLV ? ' station-lv' : ''}" type="button" onclick="selectStation(${index})" title="${escapeHtml(s.title)}">
            <div class="icon-box"><i class="fas ${getIcon(s.title)} fa-fw station-icon"></i></div>
            <h3>${escapeHtml(s.title)}</h3>
        </button>`;
    }).join('');
}

// Pull stations from the same Cloudflare Worker API used for "Now Playing".
// Keeps everything else intact (HLS/MP3 logic, UI, effects, etc.)
async function loadStationsFromWorker() {
    // If fetch is blocked/offline, we silently keep the local list.
    const r = await fetch(RR_STATIONS_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("stations fetch failed");

    const json = await r.json();
    const root = json?.result || json?.data || json;
    const list = Array.isArray(root) ? root : (Array.isArray(root?.stations) ? root.stations : []);
    if (!Array.isArray(list) || !list.length) throw new Error("no stations");

    const pick = (s) => s?.stream_320 || s?.stream_256 || s?.stream_192 || s?.stream_128 || s?.stream_96 || s?.stream_64 || s?.stream || s?.url || "";
    const derivePrefix = (s, url) => {
        const p = String(s?.prefix || s?.code || "").trim();
        if (p) return p;
        const u = String(url || "");
        const m = u.match(/hostingradio\.ru\/([^\/\?]+)\//i);
        return (m && m[1]) ? m[1] : "";
    };

    const fresh = list.map(s => {
        const title = (s?.title || s?.name || "Unnamed").trim();
        const bestUrl = pick(s);
        const prefix = derivePrefix(s, bestUrl);
        const streamHls = s?.hls || s?.stream_hls || (String(bestUrl).includes(".m3u8") ? bestUrl : "");
        return {
            id: String(s?.id ?? s?.station_id ?? "").trim(),
            title,
            prefix,
            stream_hls: streamHls || "",
            stream_320: String(s?.stream_320 || s?.stream_256 || s?.stream_192 || "").trim() || String(bestUrl).trim(),
            stream_128: String(s?.stream_128 || s?.stream_96 || s?.stream_64 || s?.stream || s?.url || "").trim() || String(bestUrl).trim(),
            stream_64: String(s?.stream_64 || "").trim(),
        };
    }).filter(s => s.title && (s.stream_320 || s.stream_128 || s.stream_hls));

    if (!fresh.length) throw new Error("normalized empty");

    // Keep current station selection if possible
    const current = stationsList[currentIndex] || null;

    stationsList = fresh;

    if (current) {
        const idx = stationsList.findIndex(s =>
            (current.prefix && s.prefix === current.prefix) ||
            (current.title && s.title === current.title)
        );
        if (idx >= 0) currentIndex = idx;
        else currentIndex = Math.min(currentIndex, stationsList.length - 1);
    } else {
        currentIndex = Math.min(currentIndex, stationsList.length - 1);
    }

    // Always append Latvian stations (embedded constant, always available)
    stationsList = stationsList.concat(LATVIAN_STATIONS);
    renderStationOverlay();
}


window.__slowFx = window.__slowFx || { volume:106, pitch:0, speed:100, reverb:40, keepPitch:false, panelInit:false };

function toggleSlowPanel(force){
    const p = document.getElementById('slowFxPanel');
    if(!p) return;
    const shouldOpen = (typeof force === 'boolean') ? force : !p.classList.contains('open');
    p.classList.toggle('open', shouldOpen);
    p.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    if (shouldOpen) { initSlowFxPanel(); setTimeout(positionSlowPanel, 0); }
    try{ document.body.classList.toggle('slowfx-open', shouldOpen); }catch(e){}
}


function positionSlowPanel(){
    try{
      const p = document.getElementById('slowFxPanel');
      const btn = document.getElementById('eq-chilldeep');
      const rw = document.getElementById('radioWindow');
      if(!p || !btn) return;
      // fixed-position popup so parent overflow can't clip it
      p.style.position = 'fixed';
      p.style.left = '8px';
      p.style.top = '8px';
      p.style.right = 'auto';
      p.style.bottom = 'auto';
      p.style.maxWidth = 'min(320px, calc(100vw - 16px))';
      const pRect = p.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const hostRect = rw ? rw.getBoundingClientRect() : { left: 0, right: window.innerWidth };
      const targetLeft = (btnRect.left + btnRect.width/2) - (pRect.width/2);
      const minLeft = Math.max(6, hostRect.left + 6);
      const maxLeft = Math.max(minLeft, Math.min(window.innerWidth - pRect.width - 6, hostRect.right - pRect.width - 6));
      const clampedLeft = Math.min(maxLeft, Math.max(minLeft, targetLeft));
      let top = btnRect.top - pRect.height - 10;
      if(top < 6){ top = Math.min(window.innerHeight - pRect.height - 6, btnRect.bottom + 10); }
      p.style.left = clampedLeft + 'px';
      p.style.top = top + 'px';
      // arrow aligns to button center inside panel
      const arrowX = Math.max(14, Math.min(pRect.width - 18, (btnRect.left + btnRect.width/2) - clampedLeft));
      p.style.setProperty('--slowfx-arrow-x', arrowX + 'px');
      p.classList.toggle('arrow-bottom', top < btnRect.top);
      p.classList.toggle('arrow-top', top >= btnRect.top);
    }catch(e){}
}

function refreshSlowFxLabels(){
    const v=document.getElementById('slowfxVolumeVal'); if(v) v.textContent = `${Math.round(__slowFx.volume)}%`;
    const p=document.getElementById('slowfxPitchVal'); if(p){ const x=(Math.round(__slowFx.pitch*100)/100).toFixed(2); p.textContent = `${__slowFx.pitch>=0?'+':''}${x}`; }
    const s=document.getElementById('slowfxSpeedVal'); if(s) s.textContent = `${Math.round(__slowFx.speed)}%`;
    const r=document.getElementById('slowfxReverbVal'); if(r) r.textContent = `${Math.round(__slowFx.reverb)}%`;
}

function applySlowFxCustom(){
    try{ if(!audio) return; }catch(e){ return; }
    const eqMode = window.__eqMode || 'none';
    // volume: keep user slider (audio.volume) as canonical value; apply preset boost only via post-gain
    const vol = Math.max(0, Math.min(200, +__slowFx.volume || 100));
    try{ if(masterGain) masterGain.gain.value = vol > 100 ? Math.min(1.6, vol / 100) : 1.0; }catch(e){}

    // playbackRate (HTML audio = speed and pitch linked)
    // pitch value is semitone-ish offset (approx).
    const pitchMul = Math.pow(2, ((+__slowFx.pitch || 0) / 12));
    const speedMul = Math.max(0.4, Math.min(2.0, (+__slowFx.speed || 100) / 100));
    const baseRate = eqMode === 'chilldeep' ? 0.88 : (eqMode === 'chill' ? 0.92 : 1.0);
    try{
      const keepPitch = !!__slowFx.keepPitch;
      audio.preservesPitch = keepPitch; audio.mozPreservesPitch = keepPitch; audio.webkitPreservesPitch = keepPitch;
      audio.playbackRate = Math.max(0.45, Math.min(1.8, baseRate * pitchMul * speedMul));
    }catch(e){}

    // reverb blend: scales wet + feedback around preset base
    try{
      const rv = Math.max(0, Math.min(100, +__slowFx.reverb || 0)) / 100;
      if (wetGain) wetGain.gain.value = (eqMode === 'chilldeep' ? 0.75 : (eqMode === 'chill' ? 0.55 : 0.0)) * rv;
      if (feedbackNode) feedbackNode.gain.value = (eqMode === 'chilldeep' ? 0.30 : (eqMode === 'chill' ? 0.22 : 0.0)) * rv;
    }catch(e){}
}

function initSlowFxPanel(){
    if(__slowFx.panelInit) {
      const keep = document.getElementById('slowfxKeepPitch');
      if (keep) keep.checked = !!__slowFx.keepPitch;
      refreshSlowFxLabels();
      return;
    }
    const ids = ['Volume','Pitch','Speed','Reverb'];
    ids.forEach((name)=>{
      const el = document.getElementById('slowfx'+name);
      if(!el) return;
      const key = name.toLowerCase();
      if (typeof __slowFx[key] !== 'undefined') el.value = __slowFx[key];
      el.addEventListener('input', ()=>{
        __slowFx[key] = parseFloat(el.value);
        refreshSlowFxLabels();
        applySlowFxCustom();
      });
    });
    const keepPitchEl = document.getElementById('slowfxKeepPitch');
    if (keepPitchEl) {
      keepPitchEl.checked = !!__slowFx.keepPitch;
      keepPitchEl.addEventListener('change', ()=>{
        __slowFx.keepPitch = !!keepPitchEl.checked;
        applySlowFxCustom();
      });
    }
    document.addEventListener('pointerdown', (e)=>{
      const p = document.getElementById('slowFxPanel');
      if (!p || !p.classList.contains('open')) return;
      const btn = document.getElementById('eq-chilldeep');
      if (p.contains(e.target) || (btn && btn.contains(e.target))) return;
      toggleSlowPanel(false);
    }, true);
    __slowFx.panelInit = true;
    refreshSlowFxLabels();
}

function setupAudio() {
    if (aCtx) return;
    aCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = aCtx.createAnalyser();
    analyser.fftSize = 256;
    lowNode = aCtx.createBiquadFilter();
    highNode = aCtx.createBiquadFilter();

    masterGain = aCtx.createGain();
    dryGain = aCtx.createGain();
    wetGain = aCtx.createGain();
    delayNode = aCtx.createDelay(2.0);
    feedbackNode = aCtx.createGain();
    convolverNode = aCtx.createConvolver();

    compressorNode = aCtx.createDynamicsCompressor();

    vinylLPF = aCtx.createBiquadFilter();
    vinylLPF.type = "lowpass";
    vinylLPF.frequency.value = 4200;
    vinylGain = aCtx.createGain();
    vinylGain.gain.value = 0.0;

    depthSplitter = aCtx.createChannelSplitter(2);
    depthMerger = aCtx.createChannelMerger(2);
    depthDelayR = aCtx.createDelay(0.05);
    depthDelayR.delayTime.value = 0.0;
    depthDryGain = aCtx.createGain();
    depthWetGain = aCtx.createGain();
    depthSumGain = aCtx.createGain();
    depthDryGain.gain.value = 1.0;
    depthWetGain.gain.value = 0.0;

    const buildImpulse = (seconds = 1.6, decay = 3.2) => {
        const rate = aCtx.sampleRate;
        const length = Math.floor(rate * seconds);
        const impulse = aCtx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return impulse;
    };
    convolverNode.buffer = buildImpulse();
    delayNode.delayTime.value = 0.12;
    feedbackNode.gain.value = 0.0;
    dryGain.gain.value = 1.0;
    wetGain.gain.value = 0.0;

    compressorNode.threshold.value = 0;
    compressorNode.knee.value = 0;
    compressorNode.ratio.value = 1;
    compressorNode.attack.value = 0.003;
    compressorNode.release.value = 0.25;

    setEQ('none');

    try {
        src = aCtx.createMediaElementSource(audio);

        src.connect(lowNode);
        lowNode.connect(highNode);

        highNode.connect(dryGain);
        dryGain.connect(masterGain);

        highNode.connect(delayNode);
        delayNode.connect(convolverNode);
        convolverNode.connect(wetGain);
        wetGain.connect(masterGain);

        delayNode.connect(feedbackNode);
        feedbackNode.connect(delayNode);

        try {
            const rate = aCtx.sampleRate;
            const len = Math.floor(rate * 2.0);
            const buf = aCtx.createBuffer(1, len, rate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                const r = (Math.random() * 2 - 1);
                data[i] = r * (Math.random() < 0.002 ? 0.9 : 0.08);
            }
            vinylNoiseSrc = aCtx.createBufferSource();
            vinylNoiseSrc.buffer = buf;
            vinylNoiseSrc.loop = true;
            vinylNoiseSrc.connect(vinylLPF);
            vinylLPF.connect(vinylGain);
            vinylGain.connect(masterGain);
            vinylNoiseSrc.start(0);
        } catch(e) {}

        masterGain.connect(depthDryGain);
        depthDryGain.connect(depthSumGain);

        masterGain.connect(depthSplitter);
        depthSplitter.connect(depthMerger, 0, 0);
        depthSplitter.connect(depthDelayR, 1);
        depthDelayR.connect(depthMerger, 0, 1);
        depthMerger.connect(depthWetGain);
        depthWetGain.connect(depthSumGain);

        depthSumGain.connect(compressorNode);
        compressorNode.connect(analyser);
        analyser.connect(aCtx.destination);
    } catch(e) {}

    draw();
}

function selectStation(index) {
    if (!stationsList[index] || stationsList[index].group === 'separator') return;
    currentIndex = index;
    isFirstPlay = false; 
    const s = stationsList[index];
    let url = s.stream_320 || s.stream_128;
    let kbps = s.stream_320 ? '320 KBPS' : '128 KBPS';
    let codec = 'MP3';
    if (!url && s.stream_hls) { url = s.stream_hls; kbps = 'STREAM'; codec = 'AAC'; }
    
    document.getElementById('curStation').style.opacity = 1;
    document.getElementById('metaWrap').style.visibility = 'visible';
    document.getElementById('ui-codec').textContent = codec;
    document.getElementById('ui-kbps').textContent = kbps;
    
    play(url, s.title);
    startNowPlaying(s);

    // Re-apply EQ button highlight — audio nodes persist, just sync the UI
    const savedMode = window.__eqMode || 'none';
    const idMap = {
        'none':'eq-none','bass':'eq-bass','clear':'eq-clear','radio':'eq-radio',
        'chill':'eq-chill','bassplus':'eq-bassplus','studio':'eq-studio',
        'depth':'eq-depth','lofi':'eq-lofi','chilldeep':'eq-chilldeep'
    };
    document.querySelectorAll('.eq-btn, .eq-seg-btn, .epb').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(idMap[savedMode] || 'eq-none');
    if (activeBtn) activeBtn.classList.add('active');
}

function play(url, name) {
    setupAudio();

    // Resume AudioContext and wait for it before playing
    const doPlay = () => {
        try { audio.pause(); } catch(e){}
        if (hls) { try { hls.destroy(); } catch(e){} hls = null; }
        audio.src = '';
        audio.load();

        const isHLS = url.includes('.m3u8');

        if (isHLS && Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 0,
            });
            hls.loadSource(url);
            hls.attachMedia(audio);
            let hlsPlayed = false;
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                if (!hlsPlayed) { hlsPlayed = true; audio.play().catch(()=>{}); }
            });
            hls.on(Hls.Events.FRAG_LOADED, function() {
                if (!hlsPlayed) { hlsPlayed = true; audio.play().catch(()=>{}); }
            });
            setTimeout(function() {
                if (!hlsPlayed && audio.paused) { hlsPlayed = true; audio.play().catch(()=>{}); }
            }, 1500);
            hls.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        hls.destroy(); hls = null;
                    }
                }
            });
        } else if (isHLS && audio.canPlayType('application/vnd.apple.mpegurl')) {
            audio.src = url;
            audio.play().catch(()=>{});
        } else {
            audio.src = url;
            audio.play().catch(()=>{});
        }
    };

    if (aCtx && aCtx.state === 'suspended') {
        aCtx.resume().then(doPlay).catch(doPlay);
    } else {
        doPlay();
    }

    document.getElementById('curStation').textContent = name;
    if(document.getElementById('stationOverlay').style.display === 'grid') toggleMenu();
    document.getElementById('playBtn').innerHTML = '<i class="fas fa-pause"></i>';
}

function playNext() { selectStation((currentIndex + 1) % stationsList.length); }
function playPrev() { selectStation((currentIndex - 1 + stationsList.length) % stationsList.length); }

function setChill(preset){
    if(!aCtx) return;
    const now = aCtx.currentTime;
    let wetTarget = 0.0, fbTarget  = 0.0, dly       = 0.0, rate      = 1.0;
    if (preset === 'chill') {
        wetTarget = 0.55; fbTarget  = 0.22; dly       = 0.12; rate      = 0.92;
    } else if (preset === 'chilldeep') {
        wetTarget = 0.75; fbTarget  = 0.30; dly       = 0.16; rate      = 0.88;
    }
    const t = now + 0.12;
    try{
        if (wetGain){
            wetGain.gain.cancelScheduledValues(now);
            wetGain.gain.setValueAtTime(wetGain.gain.value, now);
            wetGain.gain.linearRampToValueAtTime(wetTarget, t);
        }
        if (feedbackNode){
            feedbackNode.gain.cancelScheduledValues(now);
            feedbackNode.gain.setValueAtTime(feedbackNode.gain.value, now);
            feedbackNode.gain.linearRampToValueAtTime(fbTarget, t);
        }
        if (delayNode){
            delayNode.delayTime.setValueAtTime(dly, now);
        }
    }catch(e){}
    try{
        audio.preservesPitch = false;
        audio.mozPreservesPitch = false;
        audio.webkitPreservesPitch = false;
        audio.playbackRate = rate;
    }catch(e){}
}

function toggleMorePresets(){
    const panel = document.getElementById('morePanel');
    const btn = document.getElementById('eq-more');
    if(!panel) return;

    const willOpen = !panel.classList.contains('open');
    panel.classList.toggle('open', willOpen);
    panel.setAttribute('aria-hidden', willOpen ? 'false' : 'true');

    if(btn){
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        const moreModes = new Set(['bassplus','studio','depth','chilldeep','lofi']);
        const cur = window.__eqMode || 'none';
        if(willOpen) btn.classList.add('active');
        else {
            if(moreModes.has(cur)) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    }
}

function setEQ(mode) {
    if(!lowNode){
        try{ setupAudio(); }catch(e){}
        if(!lowNode){
            if (mode === 'chilldeep') { try{ initSlowFxPanel(); toggleSlowPanel(true); }catch(e){} }
            return;
        }
    }
    const moreModes = new Set(['bassplus','studio','depth','chilldeep','lofi']);

    lowNode.type = "lowshelf"; lowNode.frequency.value = 120; lowNode.gain.value = 0;
    highNode.type = "highshelf"; highNode.frequency.value = 4000; highNode.gain.value = 0;

    setChill('off');

    try{
        if (vinylGain) vinylGain.gain.value = 0.0;
        if (vinylLPF) vinylLPF.frequency.value = 4200;
    }catch(e){}

    try{
        if (depthWetGain) depthWetGain.gain.value = 0.0;
        if (depthDelayR) depthDelayR.delayTime.value = 0.0;
    }catch(e){}

    // Stop slowed-reverb wave effect (re-enabled below if mode === 'chilldeep')
    document.body.classList.remove('slowed-active');
    if (window.__slowedWave) window.__slowedWave.stop();
    try{
        if (compressorNode){
            compressorNode.threshold.value = 0;
            compressorNode.knee.value = 0;
            compressorNode.ratio.value = 1;
            compressorNode.attack.value = 0.003;
            compressorNode.release.value = 0.25;
        }
    }catch(e){}

    if (mode === 'bass') {
        lowNode.gain.value = 8;
    } else if (mode === 'clear') {
        lowNode.gain.value = -5;
        highNode.gain.value = 7;
    } else if (mode === 'radio') {
        lowNode.type = "highpass";
        lowNode.frequency.value = 500;
        highNode.type = "lowpass";
        highNode.frequency.value = 2500;
    } else if (mode === 'chill') {
        lowNode.gain.value = 3.5;
        highNode.gain.value = -4;
        highNode.frequency.value = 3500;
        setChill('chill');
    } else if (mode === 'bassplus') {
        lowNode.frequency.value = 95;
        lowNode.gain.value = 12;
    } else if (mode === 'studio') {
        lowNode.gain.value = -2.5;
        highNode.frequency.value = 6500;
        highNode.gain.value = 6;
        try{
            compressorNode.threshold.value = -24;
            compressorNode.knee.value = 20;
            compressorNode.ratio.value = 2.4;
            compressorNode.attack.value = 0.004;
            compressorNode.release.value = 0.18;
        }catch(e){}
    } else if (mode === 'vinyl') {
        lowNode.gain.value = 2;
        highNode.frequency.value = 5200;
        highNode.gain.value = -6;
        try{
            vinylLPF.frequency.value = 4800;
            vinylGain.gain.value = 0.006;
        }catch(e){}
    } else if (mode === 'depth') {
        try{
            depthDelayR.delayTime.value = 0.012;
            depthWetGain.gain.value = 0.35;
        }catch(e){}
    } else if (mode === 'lofi') {
        // Lo-Fi: warm low-pass, slight bass boost, vinyl crackle
        lowNode.type = 'lowshelf';
        lowNode.frequency.value = 200;
        lowNode.gain.value = 3.5;
        highNode.type = 'lowpass';
        highNode.frequency.value = 6000;
        highNode.gain.value = 0;
        try{
            vinylLPF.frequency.value = 5200;
            vinylGain.gain.value = 0.004;
        }catch(e){}
    } else if (mode === 'chilldeep') {
        lowNode.gain.value = 4.5;
        highNode.gain.value = -5.5;
        highNode.frequency.value = 3300;
        setChill('chilldeep');
        document.body.classList.add('slowed-active');
    }

    if (!window.__manualSlowPanelControl) {
        if (mode === 'chilldeep') { try{ initSlowFxPanel(); toggleSlowPanel(true); }catch(e){} } else { try{ toggleSlowPanel(false); }catch(e){} }
    }
    try{ applySlowFxCustom(); }catch(e){}

    // Update spectrum color: purple for slowed, green for everything else
    window.__vizSlowed = (mode === 'chilldeep');

    document.querySelectorAll('.eq-btn, .eq-seg-btn, .epb').forEach(b => b.classList.remove('active'));

    const idMap = {
        'none':'eq-none',
        'bass':'eq-bass',
        'clear':'eq-clear',
        'radio':'eq-radio',
        'chill':'eq-chill',
        'bassplus':'eq-bassplus',
        'studio':'eq-studio',
        'depth':'eq-depth',
        'lofi':'eq-lofi',
        'chilldeep':'eq-chilldeep'
    };

    const activeId = idMap[mode] || 'eq-none';
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');

    const moreBtn = document.getElementById('eq-more');
    const panel = document.getElementById('morePanel');
    window.__eqMode = mode;
    if (moreBtn){
        if (moreModes.has(mode)) moreBtn.classList.add('active');
        else moreBtn.classList.remove('active');
        moreBtn.setAttribute('aria-expanded', panel && panel.classList.contains('open') ? 'true' : 'false');
    }
    if (panel){
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden','true');
        if (moreBtn) moreBtn.setAttribute('aria-expanded','false');
    }
}

function ensureCanvasSize(){
    const w = cvs.clientWidth | 0;
    const h = cvs.clientHeight | 0;
    if (cvs.width !== w || cvs.height !== h) {
        cvs.width = w;
        cvs.height = h;
    }
}

function draw() {
    // Reduce CPU when hidden / paused / radio hidden
    const radioWinEl = document.getElementById('radioWindow');
    const shouldSleep = document.hidden || audio.paused || !analyser || (radioWinEl && getComputedStyle(radioWinEl).display === 'none');
    if (shouldSleep) {
        setTimeout(() => requestAnimationFrame(draw), 220);
        return;
    }
    requestAnimationFrame(draw);
    if (!__vizFreqData || __vizFreqData.length !== analyser.frequencyBinCount) __vizFreqData = new Uint8Array(analyser.frequencyBinCount);
    const data = __vizFreqData;
    analyser.getByteFrequencyData(data);

    // Spectrum color: purple when SLOW mode, green otherwise
    const _sl = window.__vizSlowed;
    const vC  = _sl ? [180, 90, 255] : [0, 255, 136];  // [r, g, b]
    const vRgb = `${vC[0]}, ${vC[1]}, ${vC[2]}`;
    const vHex = _sl ? '#b45aff' : '#00ff88';

    const bassSignal = data[2]; 
    const midSignal = data[10];
    const triggerPower = Math.max(bassSignal, midSignal * 0.8) / 255;
    
    if (triggerPower > 0.38) {
        ledPoint.style.background = "var(--led-on)";
        ledPoint.style.boxShadow = "0 0 8px rgba(0, 255, 136, 0.6)";
        ledHalo.style.opacity = 0.8;
    } else {
        ledPoint.style.background = "var(--led-off)";
        ledPoint.style.boxShadow = "none";
        ledHalo.style.opacity = 0;
    }

    if (vizStyle === 5) { dGif.style.opacity = 1; } 
    else { dGif.style.opacity = 0; }

    ensureCanvasSize();
    // Extra visualizers (VU/LED/DOT) own the canvas in radio_extras_v4.js
    if (vizStyle >= 8 && vizStyle <= 10) {
        return;
    }
    if (vizStyle === 6 || vizStyle === 7) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0,0,cvs.width,cvs.height);
    } else {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
    }

    if (!isAdjustingVol) {
        if (vizStyle === 0) { 
           const barW = 4; const barGap = 2; const pxH = 2; const pxGap = 1; for (let i = 0; i < data.length; i++) { const x = i * (barW + barGap); if (x > cvs.width) break; const val = (data[i] / 255) * cvs.height; for (let y = 0; y < val; y += (pxH + pxGap)) { ctx.fillStyle = `${`rgba(${vRgb},${(0.4 + y/cvs.height).toFixed(3)})`}`; ctx.fillRect(x, cvs.height - y - pxH, barW, pxH); } }
        } else if (vizStyle === 1) { 
           const barW = 12; const barGap = 4; const centerX = cvs.width / 2; for (let i = 0; i < 15; i++) { const val = (data[i*2] / 255) * cvs.height; ctx.fillStyle = `rgba(${vRgb},0.8)`; ctx.fillRect(centerX + (i * (barW + barGap)), cvs.height - val, barW, val); ctx.fillRect(centerX - ((i + 1) * (barW + barGap)), cvs.height - val, barW, val); }
        } else if (vizStyle === 2) { 
           ctx.beginPath(); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(${vRgb},0.8)`; for (let i = 0; i < data.length; i++) { const x = (i / data.length) * cvs.width; const y = cvs.height - (data[i] / 255) * cvs.height; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
        } else if (vizStyle === 3) { 
           const barW = 8; const barGap = 2; for (let i = 0; i < data.length; i++) { const x = i * (barW + barGap); if (x > cvs.width) break; const val = (data[i] / 255) * cvs.height; ctx.fillStyle = `rgba(${vRgb},0.7)`; ctx.fillRect(x, cvs.height - val, barW, val); }
        } else if (vizStyle === 4) { 
           const centerY = cvs.height / 2; const barW = 6; const barGap = 3; for (let i = 0; i < data.length; i++) { const x = i * (barW + barGap); if (x > cvs.width) break; const val = (data[i] / 255) * (cvs.height * 0.4); ctx.fillStyle = `rgba(${vRgb},0.7)`; ctx.fillRect(x, centerY - val, barW, val); ctx.fillRect(x, centerY, barW, val); }
        } else if (vizStyle === 5) { 
            const sideW = (cvs.width - 320) / 2;
            const barCount = 35;
            const barGap = 2;
            const barW = (sideW - (barCount * barGap)) / barCount;

            function drawSide(startX) {
                for (let i = 0; i < barCount; i++) {
                    const dataIdx = i;
                    const val = (data[dataIdx] / 255) * cvs.height;
                    const x = startX + (i * (barW + barGap));
                    const peakIdx = i + (startX > sideW ? barCount : 0);
                    if (val > peaks[peakIdx]) { peaks[peakIdx] = val; } else { peaks[peakIdx] -= 0.8; }
                    const pY = cvs.height - peaks[peakIdx];
                    ctx.fillStyle = vHex;
                    ctx.fillRect(x, cvs.height - val, barW, val);
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(x, pY - 1, barW, 1);
                }
            }
            drawSide(5);
            drawSide(cvs.width - sideW + 5);
        } else if (vizStyle === 6) {
            const n = 64;
            const step = cvs.width / (n - 1);
            const baseY = cvs.height * 0.58;
            const amp = cvs.height * 0.36;
            ctx.save();
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const v = data[i] / 255;
                const eased = Math.pow(v, 1.35);
                const y = baseY - (eased * amp);
                const x = i * step;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(${vRgb},0.18)`;
            ctx.lineWidth = 12;
            ctx.stroke();
            ctx.strokeStyle = `rgba(${vRgb},0.55)`;
            ctx.lineWidth = 4;
            ctx.stroke();
            for (let i = 0; i < n; i += 2) {
                const v = data[i] / 255;
                const eased = Math.pow(v, 1.35);
                const y = baseY - (eased * amp);
                const x = i * step;
                const r = 2 + eased * 3.5;
                ctx.fillStyle = `${`rgba(${vRgb},${(0.18+eased*0.65).toFixed(3)})`}`;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        } else if (vizStyle === 7) {
            const cols = 72;
            const rows = 18;
            const colW = cvs.width / cols;
            const gapY = (cvs.height - 12) / rows;
            const dotR = Math.max(1.1, Math.min(2.8, colW * 0.20));
            for (let c = 0; c < cols; c++) {
                const idx = Math.floor((c / cols) * data.length);
                const v = data[idx] / 255;
                const lit = Math.max(0, Math.min(rows, Math.floor(Math.pow(v, 1.15) * rows)));
                for (let r = 0; r < rows; r++) {
                    const x = (c + 0.5) * colW;
                    const y = cvs.height - 6 - (r * gapY);
                    const on = r < lit;
                    if (on) {
                        ctx.fillStyle = `${`rgba(${vRgb},${(0.12+(r/rows)*0.85).toFixed(3)})`}`;
                        ctx.beginPath();
                        ctx.arc(x, y, dotR + (r === lit - 1 ? dotR * 0.6 : 0), 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = `rgba(${vRgb},0.03)`;
                        ctx.beginPath();
                        ctx.arc(x, y, dotR, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
    }
}

document.getElementById('playBtn').onclick = () => {
    setupAudio();
    if (isFirstPlay) {
        // Find first valid (non-separator) station
        let startIdx = currentIndex;
        for (let i = 0; i < stationsList.length; i++) {
            const idx = (currentIndex + i) % stationsList.length;
            if (stationsList[idx] && stationsList[idx].group !== 'separator') {
                startIdx = idx;
                break;
            }
        }
        // First play: select once, then retry after 800ms if still not playing
        selectStation(startIdx);
        setTimeout(function() {
            if (audio.paused) selectStation(startIdx);
        }, 800);
    } else {
        if (audio.paused) { 
            audio.play().catch(()=>{}); 
            document.getElementById('playBtn').innerHTML = '<i class="fas fa-pause"></i>'; 
        } else { 
            audio.pause(); 
            document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i>'; 
        }
    }
};

document.getElementById('vol').oninput = (e) => {
    const val = e.target.value; audio.volume = val; isAdjustingVol = true;
    const osd = document.getElementById('volumeOSD'); const numDisplay = document.getElementById('osd-num');
    const segs = document.querySelectorAll('.seg'); osd.style.display = 'flex';
    const displayVal = Math.floor(val * 100); numDisplay.textContent = displayVal.toString().padStart(2, '0');
    const litSegments = Math.floor(displayVal / 2);
    segs.forEach((s, i) => { if(i < litSegments) s.classList.add('on'); else s.classList.remove('on'); });
    clearTimeout(volTimeout); volTimeout = setTimeout(() => { isAdjustingVol = false; osd.style.display = 'none'; }, 1200);
};

initStations();

// Focus radio (called from topbar)
function focusRadio(){
    const win = document.getElementById('radioWindow');
    if (!win) return;
    win.classList.remove('hidden');
    win.classList.add('attention');
    win.style.zIndex = 65000;
    setTimeout(()=>win.classList.remove('attention'), 650);
}

// ------------------------------------------------------------
//  TOPBAR OPTIONS (safe UI -> CSS variables) – but topbar hidden, so no need
// ------------------------------------------------------------
(function(){
  const $ = (id) => document.getElementById(id);
  // Topbar clock not needed, but keep for consistency
  function tickTopbar(){
    const d = new Date();
    const t = d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    const node = $('tbTime');
    if (node) node.textContent = t;
  }
  setInterval(tickTopbar, 1000); tickTopbar();

  // Open/close options – but topbar hidden, so skip
})();

// Draggable for grafiks (only)
(function(){
  const allowDesktopDragging = window.matchMedia && window.matchMedia('(pointer: fine)').matches && window.innerWidth > 900;
  const grafiksWin = document.getElementById("grafiks-app");
  const grafiksHandle = document.getElementById("grafiksDragZone");
  if(!allowDesktopDragging || !grafiksWin || !grafiksHandle) return;
  let draggingGrafiks = false;
  let startGrafiksPos = [0,0];
  grafiksHandle.onmousedown = (e) => {
    draggingGrafiks = true;
    startGrafiksPos = [grafiksWin.offsetLeft - e.clientX, grafiksWin.offsetTop - e.clientY];
  };
  document.addEventListener("mousemove", (e) => {
    if (!draggingGrafiks) return;
    grafiksWin.style.left = (e.clientX + startGrafiksPos[0]) + "px";
    grafiksWin.style.top = (e.clientY + startGrafiksPos[1]) + "px";
  });
  document.addEventListener("mouseup", () => { draggingGrafiks = false; });
})();

// Resize for grafiks-app (vertical and horizontal)
(function(){
  const allowDesktopResize = window.matchMedia && window.matchMedia('(pointer: fine)').matches && window.innerWidth > 900;
  const grafiksApp = document.getElementById("grafiks-app");
  const resizeBottom = document.getElementById("grafiksResizeBottom");
  const resizeRight = document.getElementById("grafiksResizeRight");
  if(!allowDesktopResize || !grafiksApp || !resizeBottom || !resizeRight) return;
  let resizing = false;
  let resizeType = null;
  let startX, startY, startWidth, startHeight;
  function startResize(e, type) {
    resizing = true;
    resizeType = type;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = grafiksApp.offsetWidth;
    startHeight = grafiksApp.offsetHeight;
    e.preventDefault();
  }
  resizeBottom.addEventListener("mousedown", (e) => startResize(e, "bottom"));
  resizeRight.addEventListener("mousedown", (e) => startResize(e, "right"));
  document.addEventListener("mousemove", (e) => {
    if (!resizing) return;
    if (resizeType === "bottom") {
      const dy = e.clientY - startY;
      grafiksApp.style.height = (startHeight + dy) + "px";
    } else if (resizeType === "right") {
      const dx = e.clientX - startX;
      grafiksApp.style.width = (startWidth + dx) + "px";
    }
  });
  document.addEventListener("mouseup", () => { resizing = false; });
})();

/* ============================================================
   RADIO WINDOW BEHAVIOR (drag / resize / persist)
   ============================================================ */
(function(){
  const win = document.getElementById('radioWindow');
  const header = document.getElementById('radioWinHeader');
  const btnClose = document.getElementById('radioWinClose');
  const btnMin = document.getElementById('radioWinMin');
  const btnReset = document.getElementById('radioWinReset');
  const btnStations = document.getElementById('radioWinStations');

  if (!win || !header) return;

  const key = "minka_radio_window_v1";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function save(){
    const r = win.getBoundingClientRect();
    win.style.transform = "none";
    win.style.left = r.left + "px";
    win.style.top = r.top + "px";
    win.style.bottom = "auto";
    const data = {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      minimized: win.classList.contains('minimized'),
      hidden: win.classList.contains('hidden')
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  function dock(resetSize=false){
    win.style.left = "50%";
    win.style.bottom = "calc(var(--dock-h) + 12px)";
    win.style.top = "auto";
    win.style.right = "auto";
    win.style.transform = "translateX(-50%)";
    if(resetSize){
      win.style.width = "";
      win.style.height = "";
    }
  }

  function load(){
    try{
      const raw = localStorage.getItem(key);
      if(raw){
        const d = JSON.parse(raw);
        if (typeof d.width === "number") win.style.width = clamp(d.width, 860, Math.min(1400, window.innerWidth - 24)) + "px";
        if (typeof d.height === "number") win.style.height = clamp(d.height, 170, Math.min(260, window.innerHeight - 80)) + "px";
        win.classList.toggle('minimized', !!d.minimized);
        win.classList.toggle('hidden', !!d.hidden)
        // Always show radio on startup (requested)
        win.classList.remove('hidden');
        win.classList.remove('minimized');;
      }
    }catch(e){}
    dock(false);
  }
  load();

// Drag
  let dragging = false, ox = 0, oy = 0;
  header.addEventListener('mousedown', (e)=>{
    if (e.target && (e.target.id === 'radioWinClose' || e.target.id === 'radioWinMin' || e.target.id === 'radioWinReset' || e.target.id === 'radioWinStations')) return;
    dragging = true;
    const r = win.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    win.style.zIndex = 65000;
    win.style.bottom = "auto";
    document.body.style.userSelect = "none";
  });
  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const left = clamp(e.clientX - ox, 8, window.innerWidth - 120);
    const top  = clamp(e.clientY - oy, 8, window.innerHeight - 44);
    win.style.left = left + "px";
    win.style.top  = top + "px";
    // If Milkdrop is open, keep it attached above the radio while dragging
    scheduleMilkdropDockUpdate();
  });
  window.addEventListener('mouseup', ()=>{
    if(!dragging) return;
    dragging = false;
    document.body.style.userSelect = "";
    save();
    scheduleMilkdropDockUpdate();
  });

  // Resize persistence (CSS resize)
  let ro;
  try{
    ro = new ResizeObserver(()=>{
      save();
      scheduleMilkdropDockUpdate();
    });
    ro.observe(win);
  }catch(e){
    window.addEventListener('mouseup', ()=>{ save(); scheduleMilkdropDockUpdate(); });
  }

  // Controls
  if (btnStations) btnStations.addEventListener('click', (e)=>{ e.stopPropagation(); toggleMenu(); });
  if (btnClose) btnClose.addEventListener('click', (e)=>{ e.stopPropagation(); win.classList.add('hidden'); save(); });
  if (btnMin) btnMin.addEventListener('click', (e)=>{ e.stopPropagation(); win.classList.toggle('minimized'); save(); });
  if (btnReset) btnReset.addEventListener('click', (e)=>{
    e.stopPropagation();
    win.classList.remove('hidden');
    win.classList.remove('minimized');
    win.style.left = "50%";
    win.style.bottom = "calc(var(--dock-h) + 12px)";
    win.style.top = "auto";
    win.style.right = "auto";
    win.style.transform = "translateX(-50%)";
    win.style.width = "min(1400px, 95vw)";
    win.style.height = "190px";
    save();
  });

  win.addEventListener('mousedown', ()=>{ win.style.zIndex = 65000; });

  const focusBtn = document.getElementById('tbFocusRadio');
  if (focusBtn) {
    focusBtn.addEventListener('click', ()=>{
      win.classList.remove('hidden');
      if (win.classList.contains('minimized')) win.classList.remove('minimized');
      focusRadio();
      save();
    });
  }
})();

/* MacScape: subtle background parallax (non-breaking) */
(function(){
  const enableParallax = window.matchMedia && window.matchMedia('(pointer: fine)').matches && window.innerWidth > 900 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!enableParallax) return;
  const root = document.documentElement;
  let raf = null;
  function onMove(e){
    const mx = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
    const my = Math.max(0, Math.min(1, e.clientY / window.innerHeight));
    if (raf) return;
    raf = requestAnimationFrame(()=>{
      raf = null;
      root.style.setProperty('--mx', mx.toFixed(4));
      root.style.setProperty('--my', my.toFixed(4));
    });
  }
  window.addEventListener('mousemove', onMove, {passive:true});
})();

window.addEventListener('resize', () => { if (milkdropEnabled) ensureMilkdropCanvas(); }, {passive:true});


// --- THEME SYSTEM (WindowGlass presets) ---

(function(){
  const themeBtn = document.getElementById('themeBtn');
  const panel = document.getElementById('themePanel');
  const closeBtn = document.getElementById('themeClose');
  const listEl = document.getElementById('themeList');
  const searchEl = document.getElementById('themeSearch');
  const accentEl = document.getElementById('accentPicker');
  const glassEl = document.getElementById('glassSlider');

  if (!themeBtn || !panel || !listEl || !searchEl || !accentEl || !glassEl) return;

  const STORAGE = {
    name: 'rg_theme_name',
    accent: 'rg_theme_accent',
    glass: 'rg_theme_glass',
    enabled: 'rg_theme_enabled'
  };

  const THEMES = [
    {
      name: 'WindowGlass',
      chip: '#00ff88',
      glassRGB: [28,28,30],
      vars: {
        '--bg-color': '#07070a',
        '--panel': '#101012',
        '--search-bar-bg': '#141416',
        '--search-border': '#2b2b2f',
        '--search-hover': '#1f1f23',
        '--glass-border': 'rgba(255,255,255,0.10)',
        '--glass-shadow': '0 20px 40px rgba(0,0,0,0.55)',
      }
    },

    // --- CSS.GLASS inspired presets (https://css.glass/) ---
    {
      name: 'CSS Glass • Frosted',
      chip: '#ffffff',
      glassRGB: [255,255,255],
      borderRGBA: [255,255,255,0.18],
      shadowRGBA: [31,38,135,0.37],
      vars: {
        '--bg-color': '#07080b',
        '--panel': '#0f1116',
        '--search-bar-bg': 'rgba(255,255,255,0.06)',
        '--search-border': 'rgba(255,255,255,0.14)',
        '--search-hover': 'rgba(255,255,255,0.08)',
        '--glass-shadow': '0 8px 32px rgba(31,38,135,0.37)',
        '--glass-border': 'rgba(255,255,255,0.18)'
      }
    },
    {
      name: 'CSS Glass • Neon Green',
      chip: '#00ff88',
      glassRGB: [8,18,14],
      borderRGBA: [0,255,136,0.22],
      shadowRGBA: [0,255,136,0.18],
      vars: {
        '--bg-color': '#040606',
        '--panel': '#081010',
        '--search-bar-bg': 'rgba(0,255,136,0.06)',
        '--search-border': 'rgba(0,255,136,0.22)',
        '--search-hover': 'rgba(0,255,136,0.09)',
        '--glass-border': 'rgba(0,255,136,0.22)'
      }
    },
    {
      name: 'CSS Glass • Purple Haze',
      chip: '#bf5af2',
      glassRGB: [40,16,56],
      borderRGBA: [255,255,255,0.14],
      shadowRGBA: [191,90,242,0.28],
      vars: {
        '--bg-color': '#06020a',
        '--panel': '#12081a',
        '--search-bar-bg': 'rgba(191,90,242,0.08)',
        '--search-border': 'rgba(255,255,255,0.14)',
        '--search-hover': 'rgba(191,90,242,0.12)',
        '--accent': '#bf5af2',
        '--search-accent': '#bf5af2'
      }
    },
    {
      name: 'CSS Glass • Ice Blue',
      chip: '#64d2ff',
      glassRGB: [10,22,34],
      borderRGBA: [100,210,255,0.18],
      shadowRGBA: [100,210,255,0.18],
      vars: {
        '--bg-color': '#04070a',
        '--panel': '#08131a',
        '--search-bar-bg': 'rgba(100,210,255,0.06)',
        '--search-border': 'rgba(100,210,255,0.18)',
        '--search-hover': 'rgba(100,210,255,0.09)'
      }
    },
    {
      name: 'Windows7',
      chip: '#4cc9ff',
      glassRGB: [12,18,28],
      vars: {
        '--bg-color': '#05070b',
        '--panel': '#0d121a',
        '--search-bar-bg': '#101722',
        '--search-accent': '#4cc9ff',
        '--glass-border': 'rgba(140,220,255,0.18)',
      }
    },
    {
      name: 'Aeris',
      chip: '#64d2ff',
      glassRGB: [6,15,22],
      vars: {
        '--bg-color': '#05080a',
        '--panel': '#0b1418',
        '--search-bar-bg': '#0f1b20',
        '--glass-border': 'rgba(100,210,255,0.18)',
      }
    },
    {
      name: 'Plasma',
      chip: '#bf5af2',
      glassRGB: [20,10,28],
      vars: {
        '--bg-color': '#06020a',
        '--panel': '#13091a',
        '--search-bar-bg': '#1a0f24',
        '--glass-border': 'rgba(191,90,242,0.18)',
        '--search-accent': '#bf5af2',
        '--accent': '#bf5af2',
      }
    },
    {
      name: 'xdark',
      chip: '#9affc7',
      glassRGB: [10,10,12],
      vars: {
        '--bg-color': '#000000',
        '--panel': '#0b0b0d',
        '--search-bar-bg': '#121216',
        '--glass-border': 'rgba(255,255,255,0.08)',
      }
    },
    {
      name: 'TaskbarXII',
      chip: '#00ff88',
      glassRGB: [10,12,14],
      vars: {
        '--bg-color': '#030406',
        '--panel': '#0a0c10',
        '--search-bar-bg': '#0f1217',
        '--glass-border': 'rgba(0,255,136,0.16)',
      }
    },
    {
      name: 'BottomDense',
      chip: '#30d158',
      glassRGB: [18,18,22],
      vars: {
        '--bg-color': '#050507',
        '--panel': '#0f0f12',
        '--dock-h': '64px',
        '--radio-h': '160px',
        '--glass-border': 'rgba(0,255,136,0.12)',
      }
    }
  ];

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function setVar(k,v){ document.documentElement.style.setProperty(k, v); }

  function applyGlassIntensity(intensity, theme){
    const t = clamp(Number(intensity)||0, 0, 100);

    // Slider semantics:
    // 0 = almost no glass -> more solid / less transparent
    // 100 = strong glass -> more blur / more transparency
    const blur = Math.round(2 + (t/100)*34); // 2..36
    const alpha = 0.86 - (t/100)*0.62; // 0.86..0.24

    const rgb = (theme && theme.glassRGB) ? theme.glassRGB : [28,28,30];
    const glassBg = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
    const panelAlpha = 0.72 - (t/100)*0.42;   // 0.72..0.30
    const monitorAlpha = 0.82 - (t/100)*0.44; // 0.82..0.38
    const controlAlpha = 0.68 - (t/100)*0.40; // 0.68..0.28
    const borderAlpha = 0.14 + (t/100)*0.12;  // 0.14..0.26
    const panelBg = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${panelAlpha.toFixed(3)})`;
    const monitorBg = `rgba(${Math.max(0, rgb[0]-10)},${Math.max(0, rgb[1]-10)},${Math.max(0, rgb[2]-10)},${monitorAlpha.toFixed(3)})`;
    const controlBg = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${controlAlpha.toFixed(3)})`;
    const border = `rgba(255,255,255,${borderAlpha.toFixed(3)})`;

    setVar('--glass-blur', blur + 'px');
    setVar('--glass-bg', glassBg);

    // Hard-apply with !important because several legacy rules already use !important.
    try {
      const rw = document.getElementById('radioWindow');
      const body = rw ? rw.querySelector('.radio-win-body') : null;
      const consoleEl = rw ? rw.querySelector('.bottom-console') : null;
      const techPanels = rw ? rw.querySelectorAll('.tech-panel') : [];
      const monitorFrames = rw ? rw.querySelectorAll('.monitor-frame') : [];
      const controlPanels = rw ? rw.querySelectorAll('.control-panel') : [];
      const stationButtons = rw ? rw.querySelectorAll('.station-btn, .viz-icon-btn, .nav-btn, .play-trigger, .md-mini-btn') : [];

      if (rw) {
        rw.style.setProperty('background', glassBg, 'important');
        rw.style.setProperty('border-color', border, 'important');
        rw.style.setProperty('backdrop-filter', `blur(${blur}px) saturate(160%)`, 'important');
        rw.style.setProperty('-webkit-backdrop-filter', `blur(${blur}px) saturate(160%)`, 'important');
      }
      if (body) body.style.setProperty('background', 'transparent', 'important');
      if (consoleEl) consoleEl.style.setProperty('background', 'transparent', 'important');
      techPanels.forEach(el => {
        el.style.setProperty('background', panelBg, 'important');
        el.style.setProperty('border-color', border, 'important');
        el.style.setProperty('backdrop-filter', `blur(${Math.max(8, blur-10)}px) saturate(150%)`, 'important');
        el.style.setProperty('-webkit-backdrop-filter', `blur(${Math.max(8, blur-10)}px) saturate(150%)`, 'important');
      });
      monitorFrames.forEach(el => {
        el.style.setProperty('background', monitorBg, 'important');
        el.style.setProperty('border-color', border, 'important');
        el.style.setProperty('box-shadow', `0 12px 38px rgba(0,0,0,${(0.18 + t/100*0.20).toFixed(3)})`, 'important');
      });
      controlPanels.forEach(el => {
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('border-color', 'transparent', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
        el.style.setProperty('backdrop-filter', 'none', 'important');
        el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      });
      stationButtons.forEach(el => {
        el.style.setProperty('border-color', border, 'important');
      });
    } catch(e) {}

    // Optional: scale border + shadow like css.glass
    if (theme && theme.borderRGBA) {
      const [br,bg,bb,bo] = theme.borderRGBA; // base opacity 0..1
      const borderA = clamp((bo || 0.18) * (0.75 + t/100*0.9), 0.06, 0.42);
      setVar('--glass-border', `rgba(${br},${bg},${bb},${borderA.toFixed(3)})`);
    }
    if (theme && theme.shadowRGBA) {
      const [sr,sg,sb,so] = theme.shadowRGBA;
      const shadowA = clamp((so || 0.35) * (0.6 + t/100*0.9), 0.12, 0.75);
      const y = Math.round(10 + (t/100)*16);       // 10..26
      const blurS = Math.round(24 + (t/100)*44);   // 24..68
      setVar('--glass-shadow', `0 ${y}px ${blurS}px rgba(${sr},${sg},${sb},${shadowA.toFixed(3)})`);
    }
  }

  function parseColorToRGBStr(color){
    const c = String(color||'').trim();
    // hex #rgb or #rrggbb
    let m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m){
      let h = m[1];
      if (h.length === 3) h = h.split('').map(ch=>ch+ch).join('');
      const r = parseInt(h.slice(0,2),16);
      const g = parseInt(h.slice(2,4),16);
      const b = parseInt(h.slice(4,6),16);
      return `${r},${g},${b}`;
    }
    // rgb/rgba
    m = c.match(/^rgba?\(([^)]+)\)$/i);
    if (m){
      const parts = m[1].split(',').map(s=>s.trim());
      const r = Math.max(0, Math.min(255, parseInt(parts[0],10)||0));
      const g = Math.max(0, Math.min(255, parseInt(parts[1],10)||0));
      const b = Math.max(0, Math.min(255, parseInt(parts[2],10)||0));
      return `${r},${g},${b}`;
    }
    return '0,255,136'; // fallback RG green
  }

  function applyAccent(color){
    if (!color) return;
    setVar('--radio-accent', color);
    setVar('--radio-accent-rgb', parseColorToRGBStr(color));
    setVar('--accent', color);
    // keep some older alias vars in sync (safe no-ops if unused)
    setVar('--search-accent', color);
  }

  function getSaved(){
    return {
      name: localStorage.getItem(STORAGE.name) || 'WindowGlass',
      accent: localStorage.getItem(STORAGE.accent) || '',
      glass: localStorage.getItem(STORAGE.glass) || '72',
      enabled: localStorage.getItem(STORAGE.enabled) === '1'
    };
  }

  function isEnabled(){
    return localStorage.getItem(STORAGE.enabled) === '1';
  }
  function setEnabled(v){
    localStorage.setItem(STORAGE.enabled, v ? '1' : '0');
  }

  function setSaved({name, accent, glass, enabled}){
    if (name) localStorage.setItem(STORAGE.name, name);
    if (accent != null) localStorage.setItem(STORAGE.accent, accent);
    if (glass != null) localStorage.setItem(STORAGE.glass, String(glass));
    if (enabled != null) localStorage.setItem(STORAGE.enabled, enabled ? '1' : '0');
  }

  // one-time migration: ensure we start with the default RG green look
  // (older bundles may have enabled skins in localStorage)
  (function themeMigration(){
    const VER_KEY = 'rg_theme_version';
    const VER = '2';
    if (localStorage.getItem(VER_KEY) === VER) return;
    localStorage.setItem(VER_KEY, VER);
    // reset all theme-related keys so the app boots with default colors
    localStorage.removeItem(STORAGE.name);
    localStorage.removeItem(STORAGE.accent);
    localStorage.removeItem(STORAGE.glass);
    localStorage.setItem(STORAGE.enabled, '0');
  })();

  function findTheme(name){
    return THEMES.find(t => t.name.toLowerCase() === String(name||'').toLowerCase()) || THEMES[0];
  }

  function applyTheme(name){
    const theme = findTheme(name);
    // Apply theme vars
    Object.entries(theme.vars || {}).forEach(([k,v]) => setVar(k,v));

    // Glass intensity
    const saved = getSaved();
    applyGlassIntensity(saved.glass, theme);

    // Accent override (user-picked)
    const accent = saved.accent || theme.chip;
    applyAccent(accent);

    // UI state
    accentEl.value = accent;
    glassEl.value = saved.glass;
    setSaved({name: theme.name});
    highlightActive(theme.name);
  }

  function highlightActive(name){
    [...listEl.querySelectorAll('.theme-item')].forEach(el => {
      el.classList.toggle('active', el.dataset.name === name);
    });
  }

  function renderList(filter=''){
    const q = filter.trim().toLowerCase();
    listEl.innerHTML = '';
    const saved = getSaved();
    const items = THEMES.filter(t => !q || t.name.toLowerCase().includes(q));

    items.forEach(t => {
      const row = document.createElement('div');
      row.className = 'theme-item' + (saved.name === t.name ? ' active' : '');
      row.dataset.name = t.name;
      row.innerHTML = `
        <div class="name">${t.name}</div>
        <div class="chip" style="background:${t.chip}"></div>
      `;
      row.addEventListener('click', (e)=>{
        e.stopPropagation();
        setEnabled(true);
        const cur = getSaved();
        setSaved({name: t.name, glass: cur.glass, accent: cur.accent});
        applyTheme(t.name);
      });
      listEl.appendChild(row);
    });
  }

  function positionPanel(){
    const b = themeBtn.getBoundingClientRect();
    const pw = 340;
    const ph = 430;
    panel.style.width = pw + 'px';

    let left = b.left + b.width - pw;
    left = clamp(left, 12, window.innerWidth - pw - 12);

    let top = b.top - ph - 12;
    if (top < 58) top = b.bottom + 12;
    top = clamp(top, 58, window.innerHeight - ph - 12);

    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }

  function openPanel(){
    positionPanel();
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    searchEl.value = '';
    renderList('');
    setTimeout(()=>searchEl.focus(), 0);
  }
  function closePanel(){
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
  }

  // init
  const saved = getSaved();
  renderList('');

  // IMPORTANT: keep the default look on start unless the user explicitly enabled skins.
  if (isEnabled()) {
    applyTheme(saved.name);
    if (saved.glass) glassEl.value = saved.glass;
  } else {
    // reflect current CSS defaults in controls (no visual changes on load)
    const cs = getComputedStyle(document.documentElement);
    const curAccent = (cs.getPropertyValue('--radio-accent') || '').trim() || '#00ff88';
    accentEl.value = curAccent;
    glassEl.value = saved.glass || '72';
    highlightActive(saved.name);
  }

  // events
  themeBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const open = panel.classList.contains('open');
    if (open) closePanel(); else openPanel();
  });
  closeBtn.addEventListener('click', (e)=>{ e.stopPropagation(); closePanel(); });

  searchEl.addEventListener('input', ()=> renderList(searchEl.value));

  accentEl.addEventListener('input', ()=>{
    const color = accentEl.value;
    applyAccent(color);
    setEnabled(true);
    const cur = getSaved();
    setSaved({accent: color, name: cur.name, glass: cur.glass});
  });

  glassEl.addEventListener('input', ()=>{
    const v = glassEl.value;
    const theme = findTheme(getSaved().name);
    applyGlassIntensity(v, theme);
    setEnabled(true);
    const cur = getSaved();
    setSaved({glass: v, name: cur.name, accent: cur.accent});
  });

  document.addEventListener('pointerdown', (e)=>{
    if (!panel.classList.contains('open')) return;
    if (panel.contains(e.target) || themeBtn.contains(e.target)) return;
    closePanel();
  });

  window.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });

  window.addEventListener('resize', ()=>{ if(panel.classList.contains('open')) positionPanel(); }, {passive:true});
})();

try{ window.toggleSlowPanel = toggleSlowPanel; }catch(e){}

try{ window.addEventListener('resize', ()=>{ const p=document.getElementById('slowFxPanel'); if(p && p.classList.contains('open')) positionSlowPanel(); }); }catch(e){}

function openSlowFxMenu(ev){
  try{
    if (ev && ev.preventDefault) ev.preventDefault();
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const p = document.getElementById('slowFxPanel');
    const btn = document.getElementById('eq-chilldeep');
    if(!p) return false;
    const isOpen = p.classList.contains('open');
    if (isOpen) { toggleSlowPanel(false); return false; }

    // OPEN FIRST (independent from audio/EQ init)
    initSlowFxPanel();
    toggleSlowPanel(true);
    try{ positionSlowPanel(); }catch(e){}

    // Try enabling SLOW preset, but never let it cancel the menu
    try {
      window.__manualSlowPanelControl = true;
      if (typeof setEQ === 'function') setEQ('chilldeep');
    } catch(e) {
      try{ console.warn('setEQ chilldeep failed, menu stays open', e); }catch(_){ }
    } finally {
      window.__manualSlowPanelControl = false;
    }

    // Force-open after any side effects and after paint
    try{
      initSlowFxPanel();
      p.classList.add('open');
      p.setAttribute('aria-hidden','false');
      requestAnimationFrame(()=>{ try{ p.classList.add('open'); positionSlowPanel(); }catch(e){} });
      setTimeout(()=>{ try{ p.classList.add('open'); positionSlowPanel(); }catch(e){} }, 0);
    }catch(e){}
    return false;
  }catch(e){
    try{ console.error('openSlowFxMenu error', e); }catch(_){ }
    return false;
  }
}

function handleSlowButton(){ return openSlowFxMenu(); }
try{ window.openSlowFxMenu = openSlowFxMenu; }catch(e){}
try{ window.handleSlowButton = handleSlowButton; }catch(e){}


(function bindSlowButtonPopup(){
  function attach(){
    const btn = document.getElementById('eq-chilldeep');
    if(!btn || btn.__slowPopupBound) return;
    btn.__slowPopupBound = true;
    btn.addEventListener('click', function(e){ if (window.openSlowFxMenu) return openSlowFxMenu(e); }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, {once:true}); else attach();
  window.addEventListener('load', attach, {once:true});
})();
