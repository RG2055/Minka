//  RADIO PLAYER – from stable (full)
// ------------------------------------------------------------
const RG_DEBUG = false; // Set true for development logging
const _log  = (...a) => { if (RG_DEBUG) console.log(...a); };
const _warn = (...a) => { if (RG_DEBUG) console.warn(...a); };
const _err  = (...a) => { if (RG_DEBUG) console.error(...a); };
const MK_PERF = window.__mkPerfProfile || {};
const MK_LOW_SPEC = !!MK_PERF.lowSpec;
const MK_VIZ_FRAME_MS = MK_LOW_SPEC ? 1000 / 30 : 0;
// Buddy visualizer: a ~4fps pixel ghost instead of the 30-60fps FFT spectrum.
// Default on low-spec machines; the round dolphin button toggles spectrum back.
const MK_BUDDY_VIZ = 11;
let __mkLastSpectrum = 3;
let __mkBuddyStep = 0;
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
let vizStyle = (function(){
    try {
        const s = localStorage.getItem('mkRadioViz');
        if (s === 'buddy') return MK_BUDDY_VIZ;
        if (s && s.indexOf('spectrum:') === 0) { const n = +s.slice(9); if (n >= 0 && n < 8) { __mkLastSpectrum = n; return n; } }
    } catch(e){}
    return MK_LOW_SPEC ? MK_BUDDY_VIZ : 3;
})();
let isAdjustingVol = false;
let volTimeout;
let isFirstPlay = true; 

let peaks = Array(128).fill(0);
let __vizFreqData = null;
let __vizLastFrameTs = 0;

const cvs = document.getElementById('vizCanvas');
const ctx = cvs.getContext('2d');
const dGif = document.getElementById('dolphin-bg');
const ledPoint = document.getElementById('ledPoint');
const ledHalo = document.getElementById('ledHalo');
const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.preload = "none";
// Single-instance draw loop. Both the 'play' listener and visibilitychange
// used to call requestAnimationFrame(draw) directly; since draw() reschedules
// itself forever, every minimize/restore or play added one more parallel loop
// that never died — after a day of use dozens of loops were ticking at once.
let __drawScheduled = false;
function radioVisualsInactive() {
    return document.hidden ||
        document.body.classList.contains('radio-hidden') ||
        document.body.classList.contains('radio-idle');
}
function scheduleDraw(delayMs) {
    if (__drawScheduled) return;
    __drawScheduled = true;
    if (delayMs) setTimeout(() => requestAnimationFrame(draw), delayMs);
    else requestAnimationFrame(draw);
}
audio.addEventListener('play', () => {
    if (window.__mkRadioSupersededByLacitis) {
        audio.pause();
        return;
    }
    scheduleDraw();
});
// Idle the entire audio graph (EQ, reverb, compressor, vinyl noise, analyser)
// while paused; resume it on play. Frees CPU and stops the looping vinyl source.
audio.addEventListener('pause', () => {
    try { if (aCtx && aCtx.state === 'running') aCtx.suspend().catch(()=>{}); } catch(e) {}
});
audio.addEventListener('play', () => {
    if (window.__mkRadioSupersededByLacitis) return;
    try { if (aCtx && aCtx.state === 'suspended') aCtx.resume().catch(()=>{}); } catch(e) {}
});
window.__mkPauseRadioForLacitis = function() {
    window.__mkRadioSupersededByLacitis = true;
    const wasPlaying = !audio.paused;
    try { audio.pause(); } catch(e) {}
    const playButton = document.getElementById('playBtn');
    if (playButton) playButton.innerHTML = '<i class="fas fa-play"></i>';
    return wasPlaying;
};
window.__mkRadioPlaybackState = function() {
    return { paused: audio.paused, context: aCtx ? aCtx.state : 'none' };
};

function syncRadioVisualLoops() {
    if (radioVisualsInactive()) {
        try { if (typeof milkdropStop === 'function') milkdropStop(); } catch(e) {}
        return;
    }
    scheduleDraw();
    try { if (milkdropEnabled && typeof milkdropStart === 'function') milkdropStart(); } catch(e) {}
}
window.__mkSyncRadioVisuals = syncRadioVisualLoops;

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
document.addEventListener('visibilitychange', syncRadioVisualLoops, { passive: true });

// ── Buddy/Spectrum round toggle (sits over the viz screen) ───────────
function mkUpdateVizToggle(){
    const b = document.getElementById('mkVizToggle');
    if (!b) return;
    if (vizStyle === MK_BUDDY_VIZ) {
        b.innerHTML = '<svg width="30" height="15" viewBox="0 0 16 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="7" y="0" width="2" height="1" fill="#7dffc0"/><rect x="6" y="1" width="3" height="1" fill="#7dffc0"/><rect x="3" y="2" width="9" height="1" fill="#00ff88"/><rect x="2" y="3" width="12" height="1" fill="#00ff88"/><rect x="1" y="4" width="15" height="1" fill="#00ff88"/><rect x="0" y="5" width="2" height="1" fill="#00ff88"/><rect x="4" y="5" width="10" height="1" fill="#00ff88"/><rect x="0" y="6" width="1" height="1" fill="#00ff88"/><rect x="6" y="6" width="4" height="1" fill="#00ff88"/><rect x="7" y="7" width="2" height="1" fill="#00ff88"/></svg><span>SPECTRUM</span>';
        b.title = 'Ieslēgt spektra vizualizāciju';
    } else {
        b.innerHTML = '<svg width="22" height="16" viewBox="0 0 10 7" shape-rendering="crispEdges" aria-hidden="true">'
          + '<rect x="3" y="0" width="4" height="1" fill="#7dffc0"/><rect x="2" y="1" width="6" height="1" fill="#00ff88"/>'
          + '<rect x="1" y="2" width="1" height="1" fill="#00ff88"/><rect x="4" y="2" width="2" height="1" fill="#00ff88"/><rect x="8" y="2" width="1" height="1" fill="#00ff88"/>'
          + '<rect x="1" y="3" width="8" height="3" fill="#00ff88"/>'
          + '<rect x="1" y="6" width="1" height="1" fill="#00ff88"/><rect x="3" y="6" width="1" height="1" fill="#00ff88"/><rect x="6" y="6" width="1" height="1" fill="#00ff88"/><rect x="8" y="6" width="1" height="1" fill="#00ff88"/>'
          + '</svg><span>BUDDY</span>';
        b.title = 'Buddy režīms (viegls, taupa resursus)';
    }
}
function mkToggleBuddyViz(){
    if (vizStyle === MK_BUDDY_VIZ) {
        vizStyle = (__mkLastSpectrum >= 0 && __mkLastSpectrum < 8) ? __mkLastSpectrum : 3;
    } else {
        __mkLastSpectrum = vizStyle;
        vizStyle = MK_BUDDY_VIZ;
    }
    try { localStorage.setItem('mkRadioViz', vizStyle === MK_BUDDY_VIZ ? 'buddy' : ('spectrum:' + vizStyle)); } catch(e){}
    updateVizLabel(); applyVizMode(); updateVizPickerUI(); mkUpdateVizToggle();
}
(function mkVizToggleInit(){
    // Lives on the radio chassis, right next to the stations-list button.
    const stationsBtn = document.querySelector('.control-panel .station-btn');
    const host = stationsBtn && stationsBtn.parentElement;
    if (!host) return;
    const st = document.createElement('style');
    st.textContent = '#radioWindow .control-panel{flex-wrap:wrap;row-gap:6px;justify-content:flex-end;}'
      + '#mkVizToggle{flex:0 0 auto;width:44px;height:44px;border-radius:50%;border:1px solid rgba(0,255,136,.45);background:rgba(6,14,10,.9);color:#9fffd0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;font:700 5.5px/1 "Space Grotesk",system-ui;letter-spacing:.1em;padding:0;}'
      + '#mkVizToggle:hover{border-color:rgba(0,255,136,.85);background:rgba(8,20,14,.96);}'
      + '#mkVizToggle svg{display:block;}'
      + '@media (max-width:900px){#mkVizToggle{width:34px;height:34px;}#mkVizToggle span{display:none;}#mkVizToggle svg{width:22px;height:11px;}}';
    document.head.appendChild(st);
    const b = document.createElement('button');
    b.id = 'mkVizToggle';
    b.type = 'button';
    stationsBtn.insertAdjacentElement('afterend', b);
    b.addEventListener('click', (e) => { e.stopPropagation(); mkToggleBuddyViz(); });
    mkUpdateVizToggle();
})();


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
    // No crossOrigin on the visible cover: CORS-less art hosts made the image
    // fail outright (broken icon). Ambilight samples colors via its own
    // crossOrigin Image, so the visible img doesn't need it.
    if (!cover._mkErrBound) {
        cover._mkErrBound = true;
        cover.addEventListener('error', () => {
            if (cover.getAttribute('src') === MK_COVER_BUDDY) return;
            cover.src = MK_COVER_BUDDY;
            cover.style.display = "block";
            cover.style.opacity = "0.92";
        });
    }
    cover.removeAttribute("crossorigin");
    const nextSrc = coverUrl || MK_COVER_BUDDY;
    if (cover.getAttribute('src') !== nextSrc) cover.src = nextSrc;
    cover.style.display = "block";
    cover.style.opacity = "0.92";
    document.dispatchEvent(new CustomEvent('rg-now-playing-art', {
        detail: { artist, title, coverUrl: nextSrc }
    }));
}

// Static pixel buddy shown when a station has no cover or the art fails to load.
const MK_COVER_BUDDY = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' shape-rendering='crispEdges'%3E%3Crect width='16' height='16' fill='%230a140d'/%3E%3Crect x='6' y='4' width='4' height='1' fill='%237dffc0'/%3E%3Crect x='5' y='5' width='6' height='1' fill='%2300ff88'/%3E%3Crect x='4' y='6' width='1' height='1' fill='%2300ff88'/%3E%3Crect x='7' y='6' width='2' height='1' fill='%2300ff88'/%3E%3Crect x='11' y='6' width='1' height='1' fill='%2300ff88'/%3E%3Crect x='4' y='7' width='8' height='3' fill='%2300ff88'/%3E%3Crect x='4' y='10' width='1' height='1' fill='%2300ff88'/%3E%3Crect x='6' y='10' width='1' height='1' fill='%2300ff88'/%3E%3Crect x='9' y='10' width='1' height='1' fill='%2300ff88'/%3E%3Crect x='11' y='10' width='1' height='1' fill='%2300ff88'/%3E%3C/svg%3E";

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
    // Skip the network poll when nobody can see the result: tab hidden, audio
    // paused, or the radio panel hidden. The interval keeps ticking and resumes
    // fetching on the next tick once visible/playing again.
    if (radioVisualsInactive() || audio.paused) return;
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
    npTimer = setInterval(() => updateNowPlaying(st), MK_LOW_SPEC ? 20000 : 8000);
}

function toggleMenu(forceOpen) {
    const el = document.getElementById('stationOverlay');
    if (!el) return;
    const iframe = document.getElementById('calIframe');

    // Position near the radio window
    const win = document.getElementById('radioWindow');
    if (win) {
        const r = win.getBoundingClientRect();
        const ow = Math.max(300, Math.min(760, r.width - 24, window.innerWidth - 24));
        const dock = document.getElementById('dockShelf');
        const dockTop = dock?.getBoundingClientRect().top || window.innerHeight;
        // The picker always lives above the radio/dock. Opening it below the
        // player made its last rows disappear behind Minka's fixed toolbar.
        const overlayBottom = Math.max(192, Math.min(r.top - 12, dockTop - 12, window.innerHeight - 12));
        const oh = Math.max(180, Math.min(470, overlayBottom - 12));
        el.style.width = ow + "px";
        el.style.height = oh + "px";
        el.style.right = "auto";
        el.style.bottom = "auto";

        // Keep the picker visually balanced instead of pinning it to the
        // right edge like a side panel.
        const left = Math.max(12, (window.innerWidth - ow) / 2);

        const top = Math.max(12, overlayBottom - oh);

        el.style.left = left + "px";
        el.style.top = top + "px";
    }

    const isNowOpen = typeof forceOpen === 'boolean' ? forceOpen : el.style.display !== 'grid';
    if (isNowOpen) renderStationOverlay();
    el.style.display = isNowOpen ? 'grid' : 'none';
    el.setAttribute('aria-hidden', isNowOpen ? 'false' : 'true');
    // Disable iframe pointer events while overlay is open (prevents click-through)
    if (iframe) iframe.style.pointerEvents = isNowOpen ? 'none' : '';
    if (isNowOpen) {
        requestAnimationFrame(() => {
            const search = document.getElementById('stationPickerSearch');
            if (search) search.focus({ preventScroll: true });
        });
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const el = document.getElementById('stationOverlay');
    if (el && el.style.display === 'grid') toggleMenu(false);
});

document.addEventListener('pointerdown', (event) => {
    const overlay = document.getElementById('stationOverlay');
    if (!overlay || overlay.style.display !== 'grid') return;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const clickedOverlay = path.includes(overlay) || overlay.contains(event.target);
    const clickedTrigger = path.some(node => node?.classList?.contains('station-btn'));
    if (!clickedOverlay && !clickedTrigger) toggleMenu(false);
}, true);


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
    if (idx === MK_BUDDY_VIZ) return { idx: MK_BUDDY_VIZ, label: "BUDDY", hint: "pixel buddy" };
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
    // Populate the preset picker without creating the WebGL visualizer —
    // the heavy GL context is only spun up when Milkdrop is actually enabled.
    ensureMilkdropPresets();
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
    // Free the WebGL visualizer (the expensive GPU/RAM cost). Presets stay
    // cached so re-enabling rebuilds the context instantly via ensureMilkdrop().
    if (milkdrop) {
        try { milkdropStop(); } catch(e) {}
        milkdrop = null;
    }
    applyVizMode();
    syncMilkdropToggleUI();
}

function toggleMilkdrop(){
    milkdropEnabled ? disableMilkdrop() : enableMilkdrop();
}

function cycleVizMode(){
    // Next spectrum mode only
    vizStyle = (vizStyle + 1) % VIZ_MODES.length;
    mkSaveVizPref();
    updateVizLabel();
    applyVizMode();
    updateVizPickerUI();
    mkUpdateVizToggle();
}

function randomVizMode(){
    // Pick random among spectrum modes
    const candidates = VIZ_MODES.map(m => m.idx);
    vizStyle = candidates[Math.floor(Math.random() * candidates.length)];
    mkSaveVizPref();
    updateVizLabel();
    applyVizMode();
    updateVizPickerUI();
    mkUpdateVizToggle();
}

function setVizStyle(idx){
    // Spectrum only
    vizStyle = Math.max(0, Math.min(idx, VIZ_MODES.length - 1));
    mkSaveVizPref();
    updateVizLabel();
    applyVizMode();
    updateVizPickerUI();
    mkUpdateVizToggle();
}

function mkSaveVizPref(){
    try { localStorage.setItem('mkRadioViz', vizStyle === MK_BUDDY_VIZ ? 'buddy' : ('spectrum:' + vizStyle)); } catch(e){}
    if (vizStyle !== MK_BUDDY_VIZ) __mkLastSpectrum = vizStyle;
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
    const dpr = Math.min(window.devicePixelRatio || 1, MK_LOW_SPEC ? 1 : 2);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
    return canvas;
}

// Load preset definitions only (needed by the picker UI). This is the RAM-heavy
// part, but the far more expensive WebGL visualizer is created lazily in
// ensureMilkdrop() — only when Milkdrop is actually enabled.
function ensureMilkdropPresets() {
    if (milkdropPresets) return true;
    if (!milkdropLibsReady()) return false;
    try {
        milkdropPresets = window.butterchurnPresets.getPresets ? window.butterchurnPresets.getPresets() : null;
        milkdropPresetKeys = milkdropPresets ? Object.keys(milkdropPresets) : [];
        _log('[Milkdrop] presets:', milkdropPresetKeys.length);
        if (milkdropPresetKeys.length) milkdropPresetIndex = Math.floor(Math.random() * milkdropPresetKeys.length);
    } catch (e) {
        _err('[Milkdrop] presets load failed:', e);
        milkdropPresets = null;
        milkdropPresetKeys = [];
        return false;
    }
    return !!(milkdropPresets && milkdropPresetKeys.length);
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

    ensureMilkdropPresets();

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
    milkdropRaf = 0;
    if (!milkdrop || !milkdropEnabled || radioVisualsInactive()) return;
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

// July 2026 stream audit: old Icecast ports and forced-HTTPS variants were
// still shown as playable even though an HTTPS PWA cannot use them. Keep only
// verified web-safe stations and replace the few services that have moved.
const LV_STREAM_OVERRIDES = new Map([
    ['LATVIJAS RADIO 1', 'https://muste.latvijasradio.lv/shoutcast/mp4:lr1a.stream/playlist.m3u8'],
    ['LATVIJAS RADIO 2', 'https://muste.latvijasradio.lv/shoutcast/mp4:lr2a.stream/playlist.m3u8'],
    ['LATVIJAS RADIO 3 (KLASIKA)', 'https://60766ff53d5e6.streamlock.net/liveALR3/mp4:klasika/playlist.m3u8'],
    ['LATVIJAS KRISTIGAIS RADIO', 'https://radio.lkr.lv/;?type=http&nocache=40'],
    ['MIX FM', 'https://live.relaxfm.lv/07'],
    ['VATIKANS', 'https://radio.vaticannews.va/stream-lv']
]);

const LV_DISABLED_STATIONS = new Set([
    'ALISE PLUS',
    'DETSKOE',
    'KURZEMES RADIO',
    'LATGALES RADIO',
    'LATVIJAS RADIO 4 (DOMA LAUKUMS)',
    'LUSTIGS RADIO',
    'MARIJA',
    'MARUSJA FM',
    'NORMA',
    'PIK',
    'RADIO 9',
    'REZEKNE',
    'ROMANTIKA',
    'RUSSKIE PESNI',
    'SCHLAGER TIME',
    'SUNSHINE FM',
    'TRANCE RADIO',
    'X RADIO'
]);

const LV_STATION_ADDITIONS = [
    { title:'NABA', group:'latvija', tooltip:'Latvijas radio', stream_128:'https://muste.latvijasradio.lv/shoutcast/mp4:naba.stream/playlist.m3u8', stream_320:'https://muste.latvijasradio.lv/shoutcast/mp4:naba.stream/playlist.m3u8', stream_hls:'https://muste.latvijasradio.lv/shoutcast/mp4:naba.stream/playlist.m3u8', stream_64:'', prefix:'', id:'lv-naba' },
    { title:'NJOY RADIO', group:'latvija', tooltip:'Latvijas radio', stream_128:'https://live.njoyradio.lv/02', stream_320:'https://live.njoyradio.lv/02', stream_hls:'', stream_64:'https://live.njoyradio.lv/02', prefix:'', id:'lv-njoy' },
    { title:'RADIO ROKS', group:'latvija', tooltip:'Latvijas radio', stream_128:'https://live.relaxfm.lv/06', stream_320:'https://live.relaxfm.lv/06', stream_hls:'', stream_64:'https://live.relaxfm.lv/06', prefix:'', id:'lv-roks' },
    { title:'RADIO TEV', group:'latvija', tooltip:'Latvijas radio', stream_128:'https://stream.radiotev.lv:8443/radiov', stream_320:'https://stream.radiotev.lv:8443/radiov', stream_hls:'', stream_64:'https://stream.radiotev.lv:8443/radiov', prefix:'', id:'lv-tev' }
];

function buildLatvianStations() {
    const stations = (Array.isArray(LATVIAN_STATIONS) ? LATVIAN_STATIONS : [])
        .filter(station => !LV_DISABLED_STATIONS.has(normalizeStationText(station.title)))
        .map(station => {
            const key = normalizeStationText(station.title);
            const next = { ...station, tooltip: station.tooltip || 'Latvijas radio' };
            const replacement = LV_STREAM_OVERRIDES.get(key);
            if (replacement) {
                next.stream_128 = replacement;
                next.stream_320 = replacement;
                next.stream_64 = replacement;
                next.stream_hls = replacement.includes('.m3u8') ? replacement : '';
            }
            if (key === 'BALTKOM RADIO') next.title = 'RADIO MELODIJA';
            return next;
        });
    const known = new Set(stations.map(station => normalizeStationText(station.title)));
    LV_STATION_ADDITIONS.forEach(station => {
        if (!known.has(normalizeStationText(station.title))) stations.push(station);
    });
    return stations;
}

async function initStations() {
    // Load local JSON asynchronously first (non-blocking startup for page)
    await loadLocalStationsJSON();
    // 1) Instant fallback list (so play/menu works even if network is slow after radio opens)
    recordStations = (STATIONS_LOCAL || []).map(s => ({
        title: s.title,
        group: s.group || 'radiorecord',
        tooltip: s.tooltip || 'Radio Record',
        cover: s.cover || '',
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
    latvianStations = buildLatvianStations();
    refreshCombinedStations();
    renderStationOverlay();

    // 2) Upgrade record list from CF Worker (stations + proper stream qualities)
    loadStationsFromWorker().catch(() => {});
}

const LACITIS_RADIO_LOGO_BASE = 'https://lacitis.pages.dev/icons/radio/';
const LACITIS_RADIO_FALLBACK = 'https://lacitis.pages.dev/icons/radio-default.svg';
const LV_STATION_LOGO_RULES = [
    ['SWH GOLD', 'swhgold.png'], ['SWH PLUS', 'swhplus.png'], ['SWH ROCK', 'swhrock.png'],
    ['SWH SPIN', 'swhspin.png'], ['SWH LV', 'swhlv.jpg'], ['SKONTO PLUS', 'skontoplus.png'],
    ['EHR ACCOUSTIC', 'ehr.png'], ['EHR DANCE', 'ehrdance.png'],
    ['EHR FRESH', 'ehrfresh.png'], ['EHR LATVIESU', 'ehrlatviesu.png'],
    ['EHR SUPERHITS', 'ehrsuperhits.png'], ['LATVIESU DEJU HITI', 'dejuhiti.png'],
    ['LATVIESU REPA HITI', 'repahiti.png'], ['LATVIJAS RADIO 1', 'lr1.png'],
    ['LATVIJAS RADIO 2', 'lr2.png'], ['LATVIJAS RADIO 3', 'lr3.png'],
    ['ALISE PLUS', 'aliseplus.png'], ['AVTORADIO', 'avtoradio.png'],
    ['COMEDY RADIO', 'comedy.png'], ['DIVU KRASTU', 'efei.png'],
    ['EIROPAS HITU RADIO', 'ehr.png'], ['ENERGY', 'energyfm.png'],
    ['FLASH SOUND', 'flashsound.webp'], ['GRADIO', 'gradio.png'],
    ['JAZZ FM', 'jazzfm.jpg'], ['KURZEMES', 'kurzemes.png'],
    ['LATGALES', 'latgales.png'], ['KRISTIGAIS', 'lkr.png'],
    ['LOUNGE FM', 'loungefm.png'], ['LOVE RADIO', 'love.jpg'],
    ['LUSTIGS', 'lustigs.png'], ['MARIJA', 'marija.png'],
    ['MELODIJA', 'melodija.webp'], ['MIX FM', 'mixfm.png'],
    ['NEMIERS', 'nemiers.png'], ['NJOY', 'njoy.webp'],
    ['RADIO ROKS', 'radioroks.png'],
    ['NORDIC BEAT', 'nordicbeat.jpg'], ['NORMA', 'norma.png'],
    ['PIK', 'pikfm.png'], ['PASAULES MUZIKAS', 'pmr.png'],
    ['POWER FM', 'powerfm.png'], ['RADIO 9', 'radio9.png'],
    ['RELAX FM', 'relaxfm.png'], ['RETRO DISCO', 'retrodisco.png'],
    ['RETRO FM', 'retrofm.png'], ['REZEKNE', 'rezekne.png'],
    ['ROMANTIKA', 'romantika.jpg'], ['SHANSON', 'shanson.png'],
    ['SCHLAGER', 'schlagertime.png'], ['SKONTO', 'skonto.png'],
    ['STAR FM', 'starfm.png'], ['RADIO TEV', 'tev.png'],
    ['TOP RADIO', 'topradio.png'], ['VATIKAN', 'vatikans.png'],
    ['XOFM', 'xofm.png'], ['X RADIO', 'xradio.png'], ['SWH', 'swh.png'],
    ['EHR', 'ehr.png']
];
let stationPickerSource = 'record';
let stationPickerQuery = '';
let stationPickerSearchTimer = 0;

function normalizeStationText(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function stationLogoUrl(station) {
    const direct = String(station?.cover || station?.bg_image_mobile || station?.bg_image || '').trim();
    if (direct) return direct;
    if (station?.group !== 'latvija') return LACITIS_RADIO_FALLBACK;
    const key = normalizeStationText(station.title);
    const match = LV_STATION_LOGO_RULES.find(([needle]) => key.includes(needle));
    return match ? LACITIS_RADIO_LOGO_BASE + match[1] : LACITIS_RADIO_FALLBACK;
}

function stationPickerItems() {
    const query = normalizeStationText(stationPickerQuery);
    return stationsList
        .map((station, index) => ({ station, index }))
        .filter(({ station }) => station && station.group !== 'separator')
        .filter(({ station }) => stationPickerSource === 'latvija'
            ? station.group === 'latvija'
            : station.group !== 'latvija')
        .filter(({ station }) => !query || normalizeStationText(
            `${station.title || ''} ${station.tooltip || ''} ${station.prefix || ''}`
        ).includes(query));
}

function renderStationPickerList() {
    const list = document.getElementById('stationPickerList');
    if (!list) return;
    const items = stationPickerItems();
    if (!items.length) {
        list.innerHTML = '<div class="station-picker-empty">Neviena stacija neatbilst meklējumam.</div>';
        return;
    }
    list.innerHTML = items.map(({ station, index }) => {
        const isCurrent = index === currentIndex;
        const title = escapeHtml(station.title || 'Radio');
        const description = escapeHtml(station.tooltip || (station.group === 'latvija' ? 'Latvijas radio' : 'Radio Record'));
        const logo = escapeHtml(stationLogoUrl(station));
        return `<button class="station-tile${station.group === 'latvija' ? ' station-lv' : ''}${isCurrent ? ' is-current' : ''}"
            type="button" data-station-index="${index}" aria-label="Atskaņot ${title}" aria-current="${isCurrent ? 'true' : 'false'}">
            <span class="station-logo-wrap">
                <img class="station-logo" src="${logo}" alt="" loading="lazy" decoding="async"
                    onerror="this.onerror=null;this.src='${LACITIS_RADIO_FALLBACK}'">
            </span>
            <span class="station-copy"><strong>${title}</strong><small>${description}</small></span>
            <span class="station-play-mark" aria-hidden="true">${isCurrent ? '▮▮' : '▶'}</span>
        </button>`;
    }).join('');
}

function renderStationOverlay() {
    const overlay = document.getElementById('stationOverlay');
    if (!overlay) return;
    const recordCount = stationsList.filter(s => s && s.group !== 'latvija' && s.group !== 'separator').length;
    const latviaCount = stationsList.filter(s => s && s.group === 'latvija').length;
    overlay.innerHTML = `
        <div class="station-picker-head">
            <div class="station-picker-title"><strong>Stacijas</strong><span>Izvēlies tiešraidi</span></div>
            <label class="station-picker-search">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"/></svg>
                <input id="stationPickerSearch" type="search" placeholder="Meklēt staciju…" value="${escapeHtml(stationPickerQuery)}" autocomplete="off">
            </label>
            <button class="station-picker-close" type="button" aria-label="Aizvērt stacijas">×</button>
        </div>
        <div class="station-picker-tabs" role="tablist" aria-label="Staciju avots">
            <button type="button" data-station-source="record" role="tab" aria-selected="${stationPickerSource === 'record'}"
                class="${stationPickerSource === 'record' ? 'active' : ''}">Radio Record <span>${recordCount}</span></button>
            <button type="button" data-station-source="latvija" role="tab" aria-selected="${stationPickerSource === 'latvija'}"
                class="${stationPickerSource === 'latvija' ? 'active' : ''}">Latvija <span>${latviaCount}</span></button>
        </div>
        <div class="station-picker-list" id="stationPickerList"></div>`;
    overlay.querySelector('.station-picker-close')?.addEventListener('click', () => toggleMenu(false));
    overlay.querySelectorAll('[data-station-source]').forEach(button => {
        button.addEventListener('click', () => {
            stationPickerSource = button.dataset.stationSource === 'latvija' ? 'latvija' : 'record';
            // A search that made sense for one catalogue often produces an
            // apparently broken empty state in the other one. Source switches
            // should start from the complete station list.
            stationPickerQuery = '';
            const search = overlay.querySelector('#stationPickerSearch');
            if (search) search.value = '';
            overlay.querySelectorAll('[data-station-source]').forEach(item => {
                const active = item.dataset.stationSource === stationPickerSource;
                item.classList.toggle('active', active);
                item.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            renderStationPickerList();
        });
    });
    overlay.querySelector('#stationPickerSearch')?.addEventListener('input', event => {
        clearTimeout(stationPickerSearchTimer);
        stationPickerSearchTimer = setTimeout(() => {
            stationPickerQuery = event.target.value || '';
            renderStationPickerList();
        }, 80);
    });
    overlay.querySelector('#stationPickerList')?.addEventListener('click', event => {
        const button = event.target.closest('[data-station-index]');
        if (!button) return;
        selectStation(Number(button.dataset.stationIndex));
    });
    renderStationPickerList();
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
            tooltip: String(s?.tooltip || s?.description || 'Radio Record').trim(),
            cover: String(s?.bg_image_mobile || s?.bg_image || s?.cover || '').trim(),
            group: 'radiorecord',
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
    stationsList = stationsList.concat(latvianStations);
    renderStationOverlay();
}


window.__slowFx = window.__slowFx || { volume:100, pitch:0, speed:100, reverb:40, keepPitch:false, panelInit:false };

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
    // Every normal preset starts from the original-speed, unity-gain signal.
    // Custom pitch/speed/boost belongs only to the explicit SLOW mode.
    if (eqMode !== 'chilldeep') {
      try{ if(masterGain) masterGain.gain.value = 1.0; }catch(e){}
      try{
        const rate = eqMode === 'chill' ? 0.92 : 1.0;
        audio.preservesPitch = false;
        audio.mozPreservesPitch = false;
        audio.webkitPreservesPitch = false;
        audio.playbackRate = rate;
      }catch(e){}
      return;
    }
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
    analyser.fftSize = MK_LOW_SPEC ? 128 : 256;
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
    const url = s.stream_320 || s.stream_128 || s.stream_hls || s.stream_64;
    if (!url) return;
    const streamMeta = describeStationStream(url);
    
    document.getElementById('curStation').style.opacity = 1;
    document.getElementById('metaWrap').style.visibility = 'visible';
    document.getElementById('ui-codec').textContent = streamMeta.codec;
    document.getElementById('ui-kbps').textContent = streamMeta.quality;
    
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

        // hls.js ielādējas tikai uz pirmo HLS atskaņošanu (nevis katrā app startā)
        if (isHLS && !window.Hls) {
            let ld = document.getElementById('mk-hls-loader');
            if (!ld) {
                ld = document.createElement('script');
                ld.id = 'mk-hls-loader';
                ld.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
                document.head.appendChild(ld);
            }
            ld.addEventListener('load', doPlay, { once: true });
            ld.addEventListener('error', () => {
                // fallback: mēģinām tiešo straumi bez hls.js (Safari u.c. native HLS)
                audio.src = url;
                audio.load();
                audio.play().catch(()=>{});
            }, { once: true });
            return;
        }

        if (isHLS && window.Hls && Hls.isSupported()) {
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

function describeStationStream(url) {
    const value = String(url || '').toLowerCase();
    if (value.includes('.m3u8')) return { codec: 'AAC', quality: 'HLS' };
    const rate = value.match(/(?:^|[_-])(\d{2,3})(?=\.(?:aacp?|mp3)|(?:\?|$))/)?.[1];
    if (value.includes('.aac')) return { codec: 'AAC', quality: rate ? `${rate} KBPS` : 'LIVE' };
    if (value.includes('.mp3') || value.includes('stream.mp3')) return { codec: 'MP3', quality: rate ? `${rate} KBPS` : 'LIVE' };
    return { codec: 'AUDIO', quality: 'LIVE' };
}

function stepStation(direction) {
    if (!stationsList.length) return;
    for (let step = 1; step <= stationsList.length; step++) {
        const index = (currentIndex + direction * step + stationsList.length) % stationsList.length;
        if (stationsList[index] && stationsList[index].group !== 'separator') {
            selectStation(index);
            return;
        }
    }
}

function playNext() { stepStation(1); }
function playPrev() { stepStation(-1); }

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

// ── Buddy visualizer (green pixel ghost, ~4fps, no FFT) ──────────────
const MK_BUDDY_FRAMES = [
  ['...XXXX...','..XXXXXX..','.X..XX..X.','.XXXXXXXX.','.XXXXXXXX.','.XXXXXXXX.','.X.X..X.X.'],
  ['...XXXX...','..XXXXXX..','.X..XX..X.','.XXXXXXXX.','.XXXXXXXX.','.XXXXXXXX.','..X.X.X.X.']
];
function mkDrawBuddyViz(ts) {
    if (ts - __vizLastFrameTs < 240) return;
    __vizLastFrameTs = ts;
    ensureCanvasSize();
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    __mkBuddyStep = (__mkBuddyStep + 1) % 4;
    const st = [[0,0,0],[1,1,-1],[0,0,0],[1,-1,-1]][__mkBuddyStep];
    const map = MK_BUDDY_FRAMES[st[0]];
    const u = Math.max(2, Math.floor(Math.min(cvs.height / 9.5, cvs.width / 18)));
    const w = map[0].length * u, h = map.length * u;
    const ox = Math.floor((cvs.width - w) / 2 + st[1] * u * 0.5);
    const oy = Math.floor((cvs.height - h) / 2 + st[2] * u * 0.4 + u * 0.4);
    for (let r = 0; r < map.length; r++) {
        const row = map[r];
        for (let c = 0; c < row.length; c++) {
            if (row[c] !== 'X') continue;
            ctx.fillStyle = r < 1 ? '#7dffc0' : '#00ff88';
            ctx.fillRect(ox + c * u, oy + r * u, u, u);
        }
    }
}

function draw(ts = 0) {
    // Reduce CPU when hidden / paused / radio hidden. The radio panel hides via
    // transform+opacity (not display:none), so the old getComputedStyle().display
    // check never slept while hidden — and ran a style recalc every frame. A
    // cheap classList check fixes both. Audio plays via the <audio> element, so
    // sleeping the visualizer never stops the music.
    __drawScheduled = false;
    const shouldSleep = radioVisualsInactive() || audio.paused || !analyser;
    if (shouldSleep) {
        // Visibility/radio-toggle/play events restart the loop. Do not leave an
        // invisible 500 ms polling loop running for the whole minimized period.
        return;
    }
    scheduleDraw();
    if (vizStyle === MK_BUDDY_VIZ) {
        if (dGif) dGif.style.opacity = 0;
        mkDrawBuddyViz(ts || performance.now());
        return;
    }
    if (MK_VIZ_FRAME_MS && ts && (ts - __vizLastFrameTs) < MK_VIZ_FRAME_MS) return;
    __vizLastFrameTs = ts || performance.now();
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
        ledPoint.style.boxShadow = "none";
        ledHalo.style.opacity = 0;
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
            if (!window.__mkRadioSupersededByLacitis && audio.paused) selectStation(startIdx);
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
  const accentEl = document.getElementById('accentPicker');
  const accentModeEl = document.getElementById('accentModeList');

  if (!themeBtn || !panel || !listEl || !accentEl || !accentModeEl) return;

  const STORAGE = {
    name: 'rg_theme_name',
    accent: 'rg_theme_accent',
    accentMode: 'rg_theme_accent_mode',
    enabled: 'rg_theme_enabled'
  };

  const THEMES = [
    {
      name: 'Melns',
      description: 'Klasiskais RG skats',
      chip: '#1ed760',
      surfaceRGB: [5,7,6],
      image: '',
      isDefault: true,
      vars: {
        '--bg-color': '#000000',
        '--panel': '#070908',
        '--search-bar-bg': '#101311',
        '--search-border': 'rgba(255,255,255,.10)',
        '--search-hover': '#171b18'
      }
    },
    {
      name: 'Nakts studija',
      description: 'Tumšs un mierīgs',
      chip: '#1ed760',
      surfaceRGB: [10,14,12],
      image: 'kalendars/data/skins/skin-aesthetic-helmet.webp',
      vars: {
        '--bg-color': '#070a08',
        '--panel': '#101511',
        '--search-bar-bg': '#141a16',
        '--search-border': 'rgba(255,255,255,.10)',
        '--search-hover': '#1b241e'
      }
    },
    {
      name: 'Ledus ūdens',
      description: 'Gaiši zils un tīrs',
      chip: '#63c7ff',
      surfaceRGB: [9,18,24],
      image: 'kalendars/data/skins/skin-aesthetic-water.webp',
      vars: {
        '--bg-color': '#050a0e',
        '--panel': '#0c151b',
        '--search-bar-bg': '#111d25',
        '--search-border': 'rgba(99,199,255,.18)',
        '--search-hover': '#162832'
      }
    },
    {
      name: 'Saulriets',
      description: 'Silts vakara tonis',
      chip: '#ff9a45',
      surfaceRGB: [24,14,9],
      image: 'kalendars/data/skins/skin-aesthetic-sunset.webp',
      vars: {
        '--bg-color': '#0c0805',
        '--panel': '#19100a',
        '--search-bar-bg': '#21160e',
        '--search-border': 'rgba(255,154,69,.18)',
        '--search-hover': '#2b1b11'
      }
    },
    {
      name: 'Brīvs lidojums',
      description: 'Silti balts un kluss',
      chip: '#f1b76f',
      surfaceRGB: [18,16,12],
      image: 'kalendars/data/skins/skin-aesthetic-bird.webp',
      vars: {
        '--bg-color': '#0a0907',
        '--panel': '#15130f',
        '--search-bar-bg': '#1d1a14',
        '--search-border': 'rgba(241,183,111,.16)',
        '--search-hover': '#262219'
      }
    },
    {
      name: 'Chrome',
      description: 'Metālisks un moderns',
      chip: '#7dd4ff',
      surfaceRGB: [10,16,22],
      image: 'kalendars/data/skins/skin-aesthetic-cyborg.webp',
      vars: {
        '--bg-color': '#06090c',
        '--panel': '#0d141b',
        '--search-bar-bg': '#121c25',
        '--search-border': 'rgba(125,212,255,.18)',
        '--search-hover': '#182733'
      }
    }
  ];

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function setVar(k,v){ document.documentElement.style.setProperty(k, v); }

  function applyGlassIntensity(_intensity, theme){
    const rgb = theme?.surfaceRGB || [10,14,12];
    const border = 'rgba(255,255,255,.12)';
    const solidWin = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    const solidMonitor = `rgb(${Math.max(0,rgb[0]-5)},${Math.max(0,rgb[1]-5)},${Math.max(0,rgb[2]-5)})`;
    const image = theme?.image ? new URL(theme.image, document.baseURI).href : '';

    setVar('--glass-blur', '0px');
    setVar('--glass-bg', solidWin);
    setVar('--glass-border', border);
    setVar('--glass-shadow', '0 24px 64px rgba(0,0,0,.58)');

    try {
      const rw = document.getElementById('radioWindow');
      const body = rw?.querySelector('.radio-win-body');
      const consoleEl = rw?.querySelector('.bottom-console');
      const techPanels = rw?.querySelectorAll('.tech-panel') || [];
      const monitorFrames = rw?.querySelectorAll('.monitor-frame') || [];
      const controlPanels = rw?.querySelectorAll('.control-panel') || [];
      const stationButtons = rw?.querySelectorAll('.station-btn, .viz-icon-btn, .nav-btn, .play-trigger, .md-mini-btn') || [];

      if (rw) {
        rw.style.setProperty('background', solidWin, 'important');
        rw.style.setProperty(
          'background-image',
          image
            ? `linear-gradient(100deg, rgba(${rgb[0]},${rgb[1]},${rgb[2]},.92), rgba(${rgb[0]},${rgb[1]},${rgb[2]},.79) 58%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},.93)), url("${image}")`
            : 'none',
          'important'
        );
        rw.style.setProperty('background-position', 'center', 'important');
        rw.style.setProperty('background-size', 'cover', 'important');
        rw.style.setProperty('background-repeat', 'no-repeat', 'important');
        rw.style.setProperty('border-color', border, 'important');
        rw.style.setProperty('backdrop-filter', 'none', 'important');
        rw.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      }
      if (body) body.style.setProperty('background', 'transparent', 'important');
      if (consoleEl) consoleEl.style.setProperty('background', 'transparent', 'important');
      techPanels.forEach(el => {
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('border-color', 'transparent', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
        el.style.setProperty('backdrop-filter', 'none', 'important');
        el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      });
      monitorFrames.forEach(el => {
        el.style.setProperty('background', solidMonitor, 'important');
        el.style.setProperty('border-color', border, 'important');
        el.style.setProperty('box-shadow', '0 12px 34px rgba(0,0,0,.28)', 'important');
      });
      controlPanels.forEach(el => {
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('border-color', 'transparent', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
        el.style.setProperty('backdrop-filter', 'none', 'important');
        el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      });
      stationButtons.forEach(el => el.style.setProperty('border-color', border, 'important'));
    } catch(e) {}
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
    const rgb = parseColorToRGBStr(color);
    [
      document.getElementById('radioWindow'),
      document.getElementById('milkdropPanel'),
      document.getElementById('ceqPanel')
    ].filter(Boolean).forEach(target => {
      target.style.setProperty('--radio-accent', color);
      target.style.setProperty('--radio-accent-rgb', rgb);
    });
    accentEl.value = color;
  }

  function getSaved(){
    return {
      name: localStorage.getItem(STORAGE.name) || 'Melns',
      accent: localStorage.getItem(STORAGE.accent) || '#1ed760',
      accentMode: localStorage.getItem(STORAGE.accentMode) || 'off',
      enabled: localStorage.getItem(STORAGE.enabled) === '1'
    };
  }

  function isEnabled(){
    return localStorage.getItem(STORAGE.enabled) === '1';
  }
  function setEnabled(v){
    localStorage.setItem(STORAGE.enabled, v ? '1' : '0');
  }

  function setSaved({name, accent, accentMode, enabled}){
    if (name) localStorage.setItem(STORAGE.name, name);
    if (accent != null) localStorage.setItem(STORAGE.accent, accent);
    if (accentMode != null) localStorage.setItem(STORAGE.accentMode, accentMode);
    if (enabled != null) localStorage.setItem(STORAGE.enabled, enabled ? '1' : '0');
  }

  // Remove the old purple/glass presets once and start from the modern picker.
  (function themeMigration(){
    const VER_KEY = 'rg_theme_version';
    const VER = '5';
    if (localStorage.getItem(VER_KEY) === VER) return;
    localStorage.setItem(VER_KEY, VER);
    localStorage.setItem(STORAGE.name, 'Melns');
    localStorage.setItem(STORAGE.accent, '#1ed760');
    localStorage.setItem(STORAGE.accentMode, 'off');
    localStorage.removeItem('rg_theme_glass');
    localStorage.setItem(STORAGE.enabled, '1');
  })();

  const FIXED_ACCENTS = {
    green: '#1ed760',
    warm: '#f59a45',
    ice: '#58c7f3',
    mono: '#d7ded9'
  };
  const FALLBACK_ALBUM_ACCENTS = ['#1ed760', '#35c6a4', '#58c7f3', '#f59a45', '#f2c14e', '#ef6f5b'];
  let lastAlbumAccentKey = '';

  function setAccentModeActive(mode){
    accentModeEl.querySelectorAll('[data-accent-mode]').forEach(button => {
      const active = button.dataset.accentMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  function fallbackAlbumAccent(seed){
    let hash = 0;
    for (const char of String(seed || 'rg-radio')) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return FALLBACK_ALBUM_ACCENTS[Math.abs(hash) % FALLBACK_ALBUM_ACCENTS.length];
  }

  function applyAlbumSurface(color){
    const rw = document.getElementById('radioWindow');
    if (!rw) return;
    const values = parseColorToRGBStr(color).split(',').map(Number);
    const [r, g, b] = values;
    const theme = findTheme(getSaved().name);
    const base = theme?.surfaceRGB || [5,7,6];
    const image = theme?.image ? new URL(theme.image, document.baseURI).href : '';
    const dark = values.map(value => Math.max(3, Math.round(value * .13)));
    rw.style.setProperty('background-color', `rgb(${dark[0]},${dark[1]},${dark[2]})`, 'important');
    rw.style.setProperty(
      'background-image',
      image
        ? `linear-gradient(112deg, rgba(${r},${g},${b},.38), rgba(${base[0]},${base[1]},${base[2]},.84) 58%, rgba(${r},${g},${b},.20)), url("${image}")`
        : `linear-gradient(112deg, rgba(${r},${g},${b},.34), rgba(${dark[0]},${dark[1]},${dark[2]},.96) 72%)`,
      'important'
    );
    rw.style.setProperty('background-position', 'center', 'important');
    rw.style.setProperty('background-size', 'cover', 'important');
    rw.style.setProperty('background-repeat', 'no-repeat', 'important');
  }

  function applyAlbumColor(color){
    applyAccent(color);
    applyAlbumSurface(color);
  }

  function rgbToAccent(r, g, b){
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 54 || max - min < 22) return '#1ed760';
    const lift = max < 150 ? 150 / max : 1;
    const values = [r, g, b].map(value => clamp(Math.round(value * lift), 48, 235));
    return '#' + values.map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function updateAlbumAccent(detail = {}){
    if (getSaved().accentMode !== 'album') return;
    const visibleCover = document.getElementById('npCover');
    const coverUrl = String(detail.coverUrl || visibleCover?.currentSrc || visibleCover?.src || '');
    const seed = `${detail.artist || ''}|${detail.title || ''}|${coverUrl}`;
    if (seed === lastAlbumAccentKey) return;
    lastAlbumAccentKey = seed;

    const fallback = () => {
      if (getSaved().accentMode === 'album') applyAlbumColor(fallbackAlbumAccent(seed));
    };
    if (!coverUrl) {
      fallback();
      return;
    }

    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.decoding = 'async';
    probe.onload = () => {
      if (getSaved().accentMode !== 'album') return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(probe, 0, 0, 8, 8);
        const pixels = context.getImageData(0, 0, 8, 8).data;
        let r = 0, g = 0, b = 0, weight = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 180) continue;
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          if (brightness < 28 || brightness > 238) continue;
          const saturation = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
          const sampleWeight = 1 + saturation / 80;
          r += pixels[i] * sampleWeight;
          g += pixels[i + 1] * sampleWeight;
          b += pixels[i + 2] * sampleWeight;
          weight += sampleWeight;
        }
        if (!weight) return fallback();
        applyAlbumColor(rgbToAccent(r / weight, g / weight, b / weight));
      } catch (_) {
        fallback();
      }
    };
    probe.onerror = fallback;
    probe.src = coverUrl;
  }

  function applyAccentMode(mode, persist = true){
    const nextMode = ['off', 'album', 'green', 'warm', 'ice', 'mono', 'custom'].includes(mode) ? mode : 'off';
    if (persist) {
      setEnabled(true);
      setSaved({ accentMode: nextMode });
    }
    setAccentModeActive(nextMode);
    if (nextMode === 'album') {
      lastAlbumAccentKey = '';
      updateAlbumAccent({
        artist: document.getElementById('npArtist')?.textContent || '',
        title: document.getElementById('npTitle')?.textContent || '',
        coverUrl: document.getElementById('npCover')?.src || ''
      });
      return;
    }
    applyGlassIntensity(0, findTheme(getSaved().name));
    applyAccent(nextMode === 'custom' ? getSaved().accent : (nextMode === 'off' ? '#1ed760' : FIXED_ACCENTS[nextMode]));
  }

  document.addEventListener('rg-now-playing-art', event => updateAlbumAccent(event.detail || {}));

  function findTheme(name){
    return THEMES.find(t => t.name.toLowerCase() === String(name||'').toLowerCase()) || THEMES[0];
  }

  function applyTheme(name){
    const theme = findTheme(name);
    Object.entries(theme.vars || {}).forEach(([k,v]) => setVar(k,v));
    const saved = getSaved();
    applyGlassIntensity(0, theme);
    setSaved({name: theme.name});
    highlightActive(theme.name);
    applyAccentMode(saved.accentMode, false);
  }

  function highlightActive(name){
    [...listEl.querySelectorAll('.theme-item')].forEach(el => {
      const active = el.dataset.name === name;
      el.classList.toggle('active', active);
      el.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function renderList(){
    listEl.innerHTML = '';
    const saved = getSaved();

    THEMES.forEach(t => {
      const row = document.createElement('button');
      row.type = 'button';
      row.setAttribute('role', 'option');
      row.className = 'theme-item' + (saved.name === t.name ? ' active' : '');
      if (t.isDefault) row.classList.add('is-default');
      row.dataset.name = t.name;
      const previewUrl = t.image ? new URL(t.image, document.baseURI).href : '';
      row.style.setProperty('--theme-preview', previewUrl ? `url("${previewUrl}")` : 'none');
      row.innerHTML = `
        <span class="theme-card-shade"></span>
        <span class="theme-card-copy">
          <strong>${t.name}</strong>
          <small>${t.description}</small>
        </span>
        <span class="theme-check" aria-hidden="true">✓</span>
      `;
      row.addEventListener('click', (e)=>{
        e.stopPropagation();
        setEnabled(true);
        setSaved({name: t.name});
        applyTheme(t.name);
      });
      listEl.appendChild(row);
    });
  }

  function positionPanel(){
    const radio = document.getElementById('radioWindow');
    const radioRect = radio?.getBoundingClientRect();
    const pw = Math.min(680, window.innerWidth - 24);
    panel.style.width = pw + 'px';
    const ph = Math.min(panel.scrollHeight || 520, window.innerHeight - 24);
    const bottom = Math.min((radioRect?.top || window.innerHeight) - 12, window.innerHeight - 12);
    const top = Math.max(12, bottom - ph);
    panel.style.left = Math.max(12, (window.innerWidth - pw) / 2) + 'px';
    panel.style.top = top + 'px';
    panel.style.maxHeight = Math.max(260, bottom - 12) + 'px';
  }

  function openPanel(){
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    renderList();
    setAccentModeActive(getSaved().accentMode);
    requestAnimationFrame(positionPanel);
  }
  function closePanel(){
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
  }

  // init
  const saved = getSaved();
  renderList();

  if (isEnabled()) {
    applyTheme(saved.name);
  } else {
    accentEl.value = saved.accent;
    highlightActive(saved.name);
    applyAccentMode(saved.accentMode, false);
  }

  // events
  themeBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const open = panel.classList.contains('open');
    if (open) closePanel(); else openPanel();
  });
  closeBtn.addEventListener('click', (e)=>{ e.stopPropagation(); closePanel(); });

  accentEl.addEventListener('input', ()=>{
    const color = accentEl.value;
    applyAccent(color);
    setEnabled(true);
    setSaved({accent: color, accentMode: 'custom'});
    setAccentModeActive('custom');
  });

  accentModeEl.addEventListener('click', event => {
    const button = event.target.closest('[data-accent-mode]');
    if (!button) return;
    event.stopPropagation();
    applyAccentMode(button.dataset.accentMode);
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

/* ── Release audio + GPU resources on unload ──
   Without this, refreshing leaves the old AudioContext + WebGL context alive
   until Chrome lazily reclaims them, so the new page's memory stacks on top
   (the "310 → 510 on refresh" effect). Free them the instant we leave. */
(function(){
  let __mkCleaned = false;
  function mkReleaseResources(){
    if (__mkCleaned) return; __mkCleaned = true;
    // Stop the Milkdrop render loop
    try { if (milkdropRaf) cancelAnimationFrame(milkdropRaf); } catch(e){}
    // Free the WebGL visualizer context (only if it was ever created)
    if (typeof milkdrop !== 'undefined' && milkdrop) {
      try {
        const mc = document.getElementById('milkdropCanvas');
        const gl = mc && (mc.getContext('webgl2') || mc.getContext('webgl'));
        const ext = gl && gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      } catch(e){}
      milkdrop = null;
    }
    // Close the whole audio graph (EQ, reverb, vinyl, analyser, …)
    try { if (typeof aCtx !== 'undefined' && aCtx && aCtx.state !== 'closed') aCtx.close(); } catch(e){}
  }
  window.addEventListener('pagehide', function(e){
    // If the page is being frozen for back/forward cache, keep resources so
    // restoring is instant — only release on a real unload/refresh.
    if (e.persisted) return;
    mkReleaseResources();
  });
})();
