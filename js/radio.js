//  RADIO PLAYER – from stable (full)
// ------------------------------------------------------------
const RG_DEBUG = false; // Set true for development logging
const _log  = (...a) => { if (RG_DEBUG) console.log(...a); };
const _warn = (...a) => { if (RG_DEBUG) console.warn(...a); };
const _err  = (...a) => { if (RG_DEBUG) console.error(...a); };
const MK_PERF = window.__mkPerfProfile || {};
const MK_LOW_SPEC = !!MK_PERF.lowSpec;
const MK_VIZ_FRAME_MS = 1000 / (MK_LOW_SPEC ? 30 : 60);
// Buddy is an optional lightweight Classic visualizer.
const MK_BUDDY_VIZ = 11;
const MK_NO_VIZ = 12;
const MK_FLOW_VIZ = 13;
const flowLevels = new Float32Array(24);
const isModernViz = mode => mode === MK_FLOW_VIZ || (mode >= 20 && mode <= 30);
const modernBaseMode = mode => mode === MK_FLOW_VIZ ? 4 : mode - 20;
let modernWaveData = null;
const modernMeter = {level:0};
const MK_DEFAULT_VIZ = 7;
let __mkLastSpectrum = MK_DEFAULT_VIZ;
let aCtx, analyser, src, lowNode, highNode, hls, masterGain, dryGain, wetGain, delayNode, feedbackNode, convolverNode, compressorNode, vinylNoiseSrc, vinylLPF, vinylGain, depthSplitter, depthMerger, depthDelayR, depthDryGain, depthWetGain, depthSumGain;
let stationsList = [];
let recordStations = [];
let latvianStations = [];
let worldStations = [];
let extraLatvianStations = [];
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
        const k = s.catalogKey || String((s.prefix||'').trim().toLowerCase()) || (String(s.title||'').trim().toLowerCase()+'|'+String(s.stream_hls||s.stream_128||s.stream_64||s.url||'').trim());
        if (seen.has(k)) continue;
        seen.add(k); out.push(s);
    }
    return out;
}
function refreshCombinedStations(){
    const currentKey = stationsList[currentIndex] && radioStationKey(stationsList[currentIndex]);
    stationsList = mergeUniqueStations(mergeUniqueStations(recordStations, latvianStations), worldStations);
    if (currentKey) { const index = stationsList.findIndex(s => s && radioStationKey(s) === currentKey); if (index >= 0) currentIndex = index; }
    window.dispatchEvent(new Event('rg-stations-ready'));
}

let currentIndex = 0;
let vizStyle = (function(){
    try {
        const defaultsVersion = '3';
        if (localStorage.getItem('mkRadioVizDefaultsVersion') !== defaultsVersion) {
            localStorage.setItem('mkRadioVizDefaultsVersion', defaultsVersion);
            localStorage.setItem('mkRadioViz', `spectrum:${MK_DEFAULT_VIZ}`);
        }
        const s = localStorage.getItem('mkRadioViz');
        if (s === 'buddy') return MK_BUDDY_VIZ;
        if (s && s.indexOf('spectrum:') === 0) { const n = +s.slice(9); if ((n >= 0 && n < MK_BUDDY_VIZ) || n === MK_NO_VIZ || isModernViz(n)) { __mkLastSpectrum = n; return n; } }
    } catch(e){}
    return MK_DEFAULT_VIZ;
})();
let vizFamily = isModernViz(vizStyle) ? 'new' : 'classic';
let isAdjustingVol = false;
let volTimeout;
let isFirstPlay = true; 

let peaks = Array(128).fill(0);
let __vizFreqData = null;
let __vizLastFrameTs = 0;
let __radioVizAccentRGB = [30, 215, 96];
let __radioImageSkin = false;
window.__radioVizAccentRGB = __radioVizAccentRGB;

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
    return document.hidden || window.__mkRadioSupersededByLacitis ||
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
    try { if (aCtx && aCtx.state === 'running') aCtx.suspend().then(()=>{if(!audio.paused&&!window.__mkRadioSupersededByLacitis)return aCtx.resume();}).catch(()=>{}); } catch(e) {}
});
audio.addEventListener('play', () => {
    if (window.__mkRadioSupersededByLacitis) return;
    try { if (aCtx) aCtx.resume().catch(()=>{}); } catch(e) {}
});
window.__mkPauseRadioForLacitis = function() {
    window.__mkRadioSupersededByLacitis = true;
    const wasPlaying = !audio.paused;
    try { audio.pause(); } catch(e) {}
    syncRadioVisualLoops();
    const playButton = document.getElementById('playBtn');
    if (playButton) playButton.innerHTML = '<i class="fas fa-play"></i>';
    return wasPlaying;
};
window.__mkRadioPlaybackState = function() {
    return { paused: audio.paused, context: aCtx ? aCtx.state : 'none' };
};

function syncRadioVisualLoops() {
    window.rgPioneer?.sync();
    if (radioVisualsInactive()) {
        return;
    }
    scheduleDraw();
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
let npGeneration = 0;
let npInFlight = null;
let npFitTimer = null;
let npStationLogo = "";
let npMetadataController = null;
audio.addEventListener('pause', () => npMetadataController?.abort());
audio.addEventListener('playing', () => {
    const station = stationsList[currentIndex];
    if (station) void updateNowPlaying(station);
});
document.addEventListener('visibilitychange', () => {
    if (document.hidden) npMetadataController?.abort();
});

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

    const url = String(st?.stream_hls || st?.hls || st?.url || "");
    // Typical: http(s)://hls-01-radiorecord.hostingradio.ru/<prefix>/playlist.m3u8
    const m = url.match(/hostingradio\.ru\/([^\/\?]+)\//i);
    if (m && m[1]) return m[1];
    return "";
}

function setNowUI(artist = "", title = "", coverUrl = ""){
    const a = npEl("npArtist");
    const t = npEl("npTitle");
    const cover = npEl("npCover");

    if (a) a.textContent = String(artist || "").trim();
    if (t) t.textContent = String(title || "").trim();

    // Keep both lines inside the box by shrinking text when needed.
    fitNowPlaying();

    if (!cover) return;
    // No crossOrigin on the visible cover: CORS-less art hosts made the image
    // fail outright (broken icon). Ambilight samples colors via its own
    // crossOrigin Image, so the visible img doesn't need it.
    if (!cover._mkErrBound) {
        cover._mkErrBound = true;
        cover.addEventListener('error', () => {
            const fallback = cover._mkStationLogo || MK_COVER_BUDDY;
            if (cover.getAttribute('src') === MK_COVER_BUDDY) return;
            cover.src = cover.getAttribute('src') === fallback ? MK_COVER_BUDDY : fallback;
            cover.style.display = "block";
            cover.style.opacity = "0.92";
        });
    }
    cover.removeAttribute("crossorigin");
    cover._mkStationLogo = npStationLogo;
    const nextSrc = coverUrl || npStationLogo || MK_COVER_BUDDY;
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

async function fetchRadioJson(url){
    const controller = new AbortController();
    let timer;
    const deadline = new Promise((_resolve, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('Radio metadata timed out')); }, 20000);
    });
    const request = Promise.resolve().then(() => fetch(url, { cache: 'no-store', signal: controller.signal }))
        .then(r => { if (!r.ok) throw new Error('Radio metadata unavailable'); return r.json(); });
    try { return await Promise.race([request, deadline]); }
    finally { clearTimeout(timer); }
}

async function ensureRRPrefixMap(){
    if (rrPrefixToId) return rrPrefixToId;
    if (rrMapPromise) return rrMapPromise;

    rrMapPromise = (async () => {
        try {
            const json = await fetchRadioJson(RR_STATIONS_URL);
            const root = json?.result || json?.data || json;
            const list = Array.isArray(root) ? root : (Array.isArray(root?.stations) ? root.stations : null);
            if (!list || !list.length) throw new Error("Invalid radio station list");
            const map = {};
            for (const s of list){
                const prefix = String(s?.prefix || s?.code || "").trim();
                const id = String(s?.id ?? s?.station_id ?? "").trim();
                if (prefix && id) map[prefix] = id;
                // The embedded HLS list uses paths such as record-rmx, while
                // the API's canonical prefix is rmx. Both identify one station.
                if (id) {
                    for (const url of [s?.stream_hls, s?.hls, s?.url]) {
                        const streamPrefix = deriveRRPrefix({url});
                        if (streamPrefix) map[streamPrefix] = id;
                    }
                }
            }
            rrPrefixToId = map;
            return rrPrefixToId;
        } catch(e) {
            return {}; // A temporary failure must not permanently cache an empty map.
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
    if (!prefix) return window.rgRadioMetadata?.fetch(st, npMetadataController?.signal) || null;

    const map = await ensureRRPrefixMap();
    const id = map?.[prefix];
    if (!id) return null;

    const json = await fetchRadioJson(RR_NOW_URL);
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
    if (radioVisualsInactive() || audio.paused || npInFlight === npGeneration) return;
    const generation = npGeneration;
    if (!npMetadataController || npMetadataController.signal.aborted) npMetadataController = new AbortController();
    npInFlight = generation;
    try {
        const hit = await fetchNowForStation(st);
        if (generation !== npGeneration || radioVisualsInactive() || audio.paused) return;
        const key = hit ? JSON.stringify([hit.artist, hit.title, hit.cover || '']) : 'none';
        if (key === npLastKey) return;
        npLastKey = key;
        if (!hit) {
            setNowUI("", "", "");
            return;
        }
        setNowUI(hit.artist || "", hit.title || "", hit.cover || "");
    } catch(e) {
        // keep last value
    } finally {
        if (npInFlight === generation) npInFlight = null;
    }
}

function startNowPlaying(st){
    if (npTimer) clearInterval(npTimer);
    npTimer = null;
    npGeneration++;
    npMetadataController?.abort();
    npMetadataController = new AbortController();
    npStationLogo = stationLogoUrl(st);
    npLastKey = "";
    setNowUI("", "", "");

    // Record keeps its existing metadata path and cadence. Other providers
    // are queried only for the selected station, while visible and playing.
    const p = deriveRRPrefix(st);
    if (!p && !window.rgRadioMetadata) return;

    updateNowPlaying(st);
    npTimer = setInterval(() => updateNowPlaying(st), p ? (MK_LOW_SPEC ? 20000 : 8000) : 30000);
}

function toggleMenu(forceOpen) {
    const el = document.getElementById('stationOverlay');
    if (!el) return;
    const iframe = document.getElementById('calIframe');
    const isNowOpen = typeof forceOpen === 'boolean' ? forceOpen : el.style.display !== 'grid';

    if (isNowOpen) {
        if (el.style.display !== 'grid') {
            const profile = window.__mkUnifiedMedia;
            stationPickerSource = profile?.getSession() && profile.getRadio()?.favorites?.length ? 'favorites' : 'featured';
            stationPickerQuery = '';
            clearTimeout(stationPickerSearchTimer);
            const search = el.querySelector('#stationPickerSearch');
            if (search) search.value = '';
        }
        positionStationPicker(el);
    }

    el.style.display = isNowOpen ? 'grid' : 'none';
    if (isNowOpen) {
        renderStationOverlay();
        if (stationPickerSource === 'featured') void loadFeaturedStations();
        el.querySelectorAll('[data-station-source]').forEach(button => {
            const active = button.dataset.stationSource === stationPickerSource;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', String(active));
        });
    }
    el.setAttribute('aria-hidden', isNowOpen ? 'false' : 'true');
    document.querySelectorAll('.station-btn').forEach(button => button.setAttribute('aria-expanded', String(isNowOpen)));
    // Disable iframe pointer events while overlay is open (prevents click-through)
    if (iframe) iframe.style.pointerEvents = isNowOpen ? 'none' : '';
    if (isNowOpen) {
        requestAnimationFrame(() => {
            if (el.style.display !== 'grid') return;
            const search = document.getElementById('stationPickerSearch');
            if (search) search.focus({ preventScroll: true });
        });
    }
}

function positionStationPicker(el) {
    // Position near the radio window
    const win = document.getElementById('radioWindow');
    if (win) {
        const r = win.getBoundingClientRect();
        const ow = Math.min(window.innerWidth - 24, Math.max(280, Math.min(760, r.width - 24)));
        const dock = document.getElementById('dockShelf');
        const dockTop = dock?.getBoundingClientRect().top || window.innerHeight;
        // The picker always lives above the radio/dock. Opening it below the
        // player made its last rows disappear behind Minka's fixed toolbar.
        const overlayBottom = Math.min(window.innerHeight - 12, Math.max(192, Math.min(r.top - 12, dockTop - 12)));
        const oh = Math.min(window.innerHeight - 24, Math.max(180, Math.min(470, overlayBottom - 12)));
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

}

window.addEventListener('resize', () => {
    const overlay = document.getElementById('stationOverlay');
    if (overlay?.style.display === 'grid') positionStationPicker(overlay);
});

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
    // Cycle the current spectrum family.
    cycleVizMode();
}

// ---------------------------
// VIZ PICKER (cat menu)
// ---------------------------
let vizPickerOpen = false;

// Spectrum modes, including the original Pioneer dolphin.
const VIZ_MODES = [
    ...['PIXEL','MIRROR','LINE','CLASSIC','CENTER','PEAKS','WAVE','MATRIX','VU','LED','DOT VU'].map((label,i)=>({idx:20+i,label,hint:'Jaunais skats'})),
    { idx: 0, label: "PIXEL", hint: "pixel bars" },
    { idx: 1, label: "MIRROR", hint: "mirror bars" },
    { idx: 2, label: "LINE", hint: "line scope" },
    { idx: 3, label: "CLASSIC", hint: "bars" },
    { idx: 4, label: "CENTER", hint: "center bars" },
    { idx: 5, label: "DOLPHIN", hint: "side peaks" },
    { idx: 6, label: "WAVE", hint: "smooth wave" },
    { idx: 7, label: "MATRIX", hint: "dot grid" },
    { idx: MK_BUDDY_VIZ, label: "BUDDY", hint: "Viegls pikseļu tēls" },
    { idx: MK_NO_VIZ, label: "Bez vizualizācijas", hint: "Nekas netiek zīmēts" },
];

function getVizMode(idx){
    if(idx === MK_FLOW_VIZ) idx = 24;
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

      <div class="radio-viz-families"><button type="button" data-viz-family="new">Jaunais skats</button><button type="button" data-viz-family="classic">Classic</button></div>
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
        const family=e.target.closest('[data-viz-family]');if(family){switchVizFamily(family.dataset.vizFamily);return;}
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

function cycleVizMode(){
    // Next spectrum mode only
    const modes=VIZ_MODES.filter(m=>m.idx!==MK_NO_VIZ&&isModernViz(m.idx)===(vizFamily==='new'));
    vizStyle = modes[(modes.findIndex(m => m.idx === vizStyle) + 1) % modes.length].idx;
    mkSaveVizPref();
    updateVizLabel();
    applyVizMode();
    updateVizPickerUI();
}

function randomVizMode(){
    // Pick random among spectrum modes
    const candidates = VIZ_MODES.filter(m=>m.idx!==MK_NO_VIZ&&isModernViz(m.idx)===(vizFamily==='new')).map(m => m.idx);
    vizStyle = candidates[Math.floor(Math.random() * candidates.length)];
    mkSaveVizPref();
    updateVizLabel();
    applyVizMode();
    updateVizPickerUI();
}

function setVizStyle(idx){
    if(idx===MK_FLOW_VIZ)idx=24;
    if(idx!==MK_NO_VIZ)vizFamily=isModernViz(idx)?'new':'classic';
    // Spectrum only
    vizStyle = VIZ_MODES.some(m => m.idx === idx) || idx === MK_BUDDY_VIZ ? idx : MK_DEFAULT_VIZ;
    mkSaveVizPref();
    updateVizLabel();
    applyVizMode();
    updateVizPickerUI();
}

function switchVizFamily(family){
    const base=isModernViz(vizStyle)?modernBaseMode(vizStyle):(vizStyle<=10?vizStyle:4);
    setVizStyle(family==='new'?20+base:base);
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
        b.hidden=idx!==MK_NO_VIZ&&isModernViz(idx)!==(vizFamily==='new');
    });

    el.querySelectorAll('[data-viz-family]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vizFamily===vizFamily)));
    const m = getVizMode(vizStyle);
    const status = el.querySelector('#vizPickStatus');
    if (status) status.textContent = `${m.label}`;
}

// Shared by station names, search fields and appearance controls.
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


let pioneerPlayerPromise = null;
function ensurePioneerPlayer() {
    if (!pioneerPlayerPromise) pioneerPlayerPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'js/radio-pioneer.js?v=20260910oel1';
        script.onload = () => {
            window.rgPioneer.init({image:dGif, button:document.getElementById('vizBtn'), audio,
                isActive:() => vizStyle === 5, getAnalyser:() => analyser,
                isCovered:() => isAdjustingVol,
                isRunning:() => !audio.paused && !radioVisualsInactive(),
                selectMode:() => setVizStyle(5), disable:() => setVizStyle(MK_NO_VIZ)});
            resolve(window.rgPioneer);
        };
        script.onerror = () => { script.remove(); pioneerPlayerPromise = null; reject(new Error('Pioneer load failed')); };
        document.head.appendChild(script);
    });
    return pioneerPlayerPromise;
}
document.getElementById('vizBtn')?.addEventListener('click', async event => {
    event.preventDefault();event.stopPropagation();
    try { (await ensurePioneerPlayer()).open(); }
    catch (_) { event.currentTarget?.setAttribute('title','Neizdevās ielādēt skatus. Nospied vēlreiz.'); }
});

function applyVizMode() {
    const disabled = vizStyle === MK_NO_VIZ;
    document.body.classList.toggle('radio-viz-off', disabled);
    document.body.classList.toggle('radio-viz-flow', isModernViz(vizStyle));
    document.body.classList.toggle('radio-viz-dolphin', vizStyle === 5);
    if(analyser){const modern=isModernViz(vizStyle);analyser.fftSize=modern?(MK_LOW_SPEC?512:1024):(MK_LOW_SPEC?128:256);analyser.minDecibels=modern?-85:-100;analyser.maxDecibels=modern?-5:-30;analyser.smoothingTimeConstant=modern?.12:.8;}
    // Clear previous layers at selection time, even while paused or in an extra renderer.
    if(dGif){dGif.style.display=vizStyle===5?'block':'none';dGif.style.opacity=vizStyle===5?'1':'0';}
    if(ctx&&cvs)ctx.clearRect(0,0,cvs.width,cvs.height);
    if(typeof peaks!=='undefined')peaks.fill(0);
    __vizLastFrameTs=0;
    if (vizStyle === 5) void ensurePioneerPlayer().then(player => player.sync()).catch(() => {});
    window.dispatchEvent(new Event('rg-viz-change'));
    if (disabled) {
        try { window.__slowedWave?.stop(); } catch (_) {}
        if (dGif) dGif.style.opacity = 0;
        if (ctx && cvs) ctx.clearRect(0, 0, cvs.width, cvs.height);
    } else {
        scheduleDraw();
    }

}

function tick() { document.getElementById('timeDisp').textContent = new Date().toLocaleTimeString('en-GB'); }
setInterval(tick, 1000); tick();
updateVizLabel();
applyVizMode();

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
    ['VIKERRAADIO', 'https://sb.err.ee/live/vikerraadio.m3u8'],
    ['CHILLTRAX', 'https://streamssl.chilltrax.com/;'],
    ['PASAULES MUZIKAS RADIO', 'https://stream.pmr.lt/pmr.mp3'],
    ['NRJ', 'https://hls-01-gpm.hostingradio.ru/energyfm495/playlist.m3u8'],
    ['LATVIJAS RADIO 3 (KLASIKA)', 'https://muste.latvijasradio.lv/shoutcast/mp4:lr3a.stream/playlist.m3u8'],
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
    [...LV_STATION_ADDITIONS, ...extraLatvianStations].forEach(station => {
        if (!known.has(normalizeStationText(station.title))) stations.push(station);
    });
    return stations;
}

async function initStations() {
    // Load local JSON asynchronously first (non-blocking startup for page)
    await Promise.all([loadLocalStationsJSON(), (async () => {
        try {
            const response = await fetch('data/latvia-extra.json?v=20260910');
            if (!response.ok) return;
            const rows = await response.json();
            extraLatvianStations = rows.filter(s => s.title && /^https:\/\//.test(s.url)).map(s => ({
                title: s.title, cover: s.cover || '', tooltip: s.tooltip || 'Latvijas radio', group: 'latvija',
                stream_128: s.url, stream_320: s.url, stream_64: s.url,
                stream_hls: s.url.includes('.m3u8') ? s.url : '', prefix: '', id: ''
            }));
        } catch (_) { /* The embedded stations remain usable offline. */ }
    })()]);
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

const LACITIS_RADIO_LOGO_BASE = 'data/radio-logos/';
const LACITIS_RADIO_FALLBACK = 'data/radio-default.svg';
const LV_STATION_LOGO_RULES = [
    ['POWER HIT RADIO', 'powerfm.png'], ['RADIO 1 JEKABPILS', 'radio1.jpg'], ['SUPER FM', 'ehrsuperhits.png'],
    ['NABA', 'naba.png'],
    ['SWH GOLD', 'swhgold.png'], ['SWH PLUS', 'swhplus.png'], ['SWH ROCK', 'swhrock.png'],
    ['SWH SPIN', 'swhspin.png'], ['SWH LV', 'swhlv.jpg'], ['SKONTO PLUS', 'skontoplus.png'],
    ['EHR ACCOUSTIC', 'ehraccoustic.png'], ['EHR DANCE', 'ehrdance.png'],
    ['EHR FRESH', 'ehrfresh.png'], ['EHR LATVIESU', 'ehrlatviesu.png'],
    ['EHR SUPERHITS', 'ehrsuperhits.png'], ['LATVIESU DEJU HITI', 'dejuhiti.png'],
    ['LATVIESU REPA HITI', 'repahiti.png'], ['LATVIJAS RADIO 1', 'lr1.png'],
    ['LATVIJAS RADIO 2', 'lr2.png'], ['LATVIJAS RADIO 3', 'lr3.png'],
    ['ALISE PLUS', 'aliseplus.png'], ['AVTORADIO', 'avtoradio.png'],
    ['COMEDY RADIO', 'comedy.png'], ['DIVU KRASTU', 'divukrastu.png'],
    ['EIROPAS HITU RADIO', 'ehr.png'], ['ENERGY', 'energyfm.png'],
    ['FLASH SOUND', 'flashsound.webp'], ['GRADIO', 'gradio.png'],
    ['JAZZ FM', 'jazzfm.png'], ['KURZEMES', 'kurzemes.png'],
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
    ['SHANSON', 'shanson.png'],
    ['SCHLAGER', 'schlagertime.png'], ['SKONTO', 'skonto.png'],
    ['STAR FM', 'starfm.png'], ['RADIO TEV', 'tev.png'],
    ['TOP RADIO', 'topradio.png'], ['VATIKAN', 'vatikans.png'],
    ['XOFM', 'xofm.png'], ['X RADIO', 'xradio.png'], ['SWH', 'swh.png'],
    ['EHR', 'ehr.png']
];
const LV_STATION_EXTRA_LOGOS = {
    "ABSOLUTE CHILLOUT": "extra-0.ico",
    "CAPITAL FM": "extra-2.jpg",
    "CHILLTRAX": "extra-3.png",
    "DFM": "extra-4.ico",
    "ESC RADIO": "extra-6.png",
    "EUROPA PLUS": "extra-7.jpg",
    "HIT FM": "extra-9.png",
    "KISS KISS ITALIA": "extra-10.png",
    "MAXIMUM": "extra-11.ico",
    "NASHE": "extra-12.png",
    "NOVOE RADIO": "extra-13.ico",
    "ORFEI": "extra-14.png",
    "RMF FM": "extra-15.png",
    "SEREBRJANIIJ DOZD": "extra-16.ico",
    "SHOKOLAD": "extra-17.ico",
    "SVOBODA": "extra-18.png",
    "VIKERRAADIO": "extra-19.png",
    "ZET": "extra-20.png",
    "ABC LOUNGE": "extra-21.png"
};

let stationPickerSource = 'record';
let stationPickerQuery = '';
let stationPickerSearchTimer = 0;
let stationPickerCatalogue = null;
let stationPickerEntries = [];

let featuredKeys = new Set();
let discoveryGenres = [], discoveryStations = [], discoveryLoaded = false, discoveryLoading = false, discoveryRevision = 0;
let worldPageKeys = new Set(), worldCountry = '', worldGenre = '', worldQuality = 0, worldOffset = 0;
let worldLoading = false, worldError = '', worldHasNext = false, worldRevision = 0, worldRequest = 0;
let worldCatalogLoad = null, worldCountries = null, worldStats = null;
const worldFavoriteAttempts = new Set(), worldFavoritePending = new Set();
function loadWorldCatalog() {
    if (window.rgRadioCatalog) return Promise.resolve(window.rgRadioCatalog);
    if (worldCatalogLoad) return worldCatalogLoad;
    worldCatalogLoad = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'js/radio-catalog.js?v=20260910world2';
        script.onload = () => resolve(window.rgRadioCatalog);
        script.onerror = () => { script.remove(); worldCatalogLoad = null; reject(new Error('Neizdevās ielādēt staciju katalogu.')); };
        document.head.appendChild(script);
    });
    return worldCatalogLoad;
}
function installWorldStations(rows, page = false) {
    const base = stationsList.filter(s => s && s.group !== 'world' && s.group !== 'separator');
    const keys = [];
    for (const row of rows) {
        const existing = base.find(s => [s.stream_320, s.stream_128, s.stream_hls].includes(row.stream_128)
            || (row.country === 'LV' && s.group === 'latvija' && normalizeStationText(s.title) === normalizeStationText(row.title)));
        if (existing && page) { keys.push(radioStationKey(existing)); continue; }
        keys.push(row.catalogKey);
        const at = worldStations.findIndex(s => s.catalogKey === row.catalogKey);
        if (at >= 0) worldStations[at] = row; else worldStations.push(row);
    }
    if (page) worldPageKeys = new Set(keys);
    // Keep only this page, current playback and this profile's favorites.
    const keep = new Set([...featuredKeys, ...worldPageKeys, ...(window.__mkUnifiedMedia?.getRadio()?.favorites || []),
        stationsList[currentIndex] && radioStationKey(stationsList[currentIndex]), ...keys]);
    worldStations = worldStations.filter(s => keep.has(s.catalogKey));
    refreshCombinedStations();
    renderStationOverlay();
}
async function loadFeaturedStations() {
    try {
        const api = await loadWorldCatalog(), rows = await api.featured();
        featuredKeys = new Set(rows.map(s => s.catalogKey));
        installWorldStations(rows);
        void loadDiscoveryOverview(api);
    } catch (_) {
        const list = document.getElementById('stationPickerList');
        if (stationPickerSource === 'featured' && list) list.innerHTML = '<div class="station-picker-empty">Neizdevās ielādēt. Atver cilni vēlreiz.</div>';
    }
}
const DISCOVERY_GENRE_NAMES = {pop:'Pop', rock:'Roks', news:'Ziņas', oldies:'Retro', latin:'Latīņu', talk:'Sarunas', public:'Sabiedriskais', dance:'Dance', electronic:'Elektroniskā', jazz:'Džezs', classical:'Klasika', 'classical music':'Klasika', chillout:'Chillout', ambient:'Ambient', house:'House', techno:'Techno', trance:'Trance', 'hip hop':'Hiphops', soul:'Soul', blues:'Blūzs', metal:'Metāls', reggae:'Reggae', country:'Kantrī', '80s':'80. gadi', '90s':'90. gadi'};
async function loadDiscoveryOverview(api) {
    if (discoveryLoaded || discoveryLoading) return;
    discoveryLoading = true;
    const results = await Promise.allSettled([api.stats(), api.countries(), api.genres(), api.search()]);
    if (results[0].status === 'fulfilled') worldStats = results[0].value;
    if (results[1].status === 'fulfilled') worldCountries = results[1].value;
    if (results[2].status === 'fulfilled') discoveryGenres = results[2].value;
    if (results[3].status === 'fulfilled') {
        discoveryStations = results[3].value.items.slice(0, 12);
        installWorldStations(discoveryStations);
    }
    discoveryLoaded = results.every(r => r.status === 'fulfilled');
    discoveryLoading = false; discoveryRevision++;
    if (stationPickerSource === 'featured') renderStationPickerList();
}
function discoveryCount(value) {
    return Number(value).toLocaleString('lv-LV', {notation:'compact', maximumFractionDigits:1});
}
function discoveryRail(content, label) {
    return `<div class="discovery-rail"><button type="button" data-discovery-scroll="-1" aria-label="${label}: ritināt pa kreisi">‹</button><div class="discovery-rail-content">${content}</div><button type="button" data-discovery-scroll="1" aria-label="${label}: ritināt pa labi">›</button></div>`;
}
function enableDiscoveryDrag(list) {
    const selector = '.discovery-rail-content, .discovery-featured-row';
    let cancelGesture = null;
    list.addEventListener('dragstart', event => {
        if (event.target.closest(selector)) event.preventDefault();
    });
    list.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary) return;
        cancelGesture?.();
        const row = event.target.closest(selector);
        if (!row || row.scrollWidth <= row.clientWidth + 1) return;
        const x = event.clientX, y = event.clientY, start = row.scrollLeft, pointer = event.pointerId;
        let dragging = false, suppressClick = false, clickTimer;
        const blockClick = click => {
            if (!suppressClick || click.detail === 0) return;
            click.preventDefault(); click.stopImmediatePropagation();
            suppressClick = false;
        };
        const removeClickGuard = () => { window.removeEventListener('click', blockClick, true); clearTimeout(clickTimer); };
        const finish = up => {
            if (up && up.pointerId !== pointer) return;
            row.classList.remove('is-dragging');
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', finish);
            window.removeEventListener('pointercancel', cancel);
            window.removeEventListener('blur', cancel);
            cancelGesture = null;
            // The click generated by this release must not select a chip,
            // start a station or toggle a favorite, including outside the row.
            if (up?.type === 'pointerup' && dragging) clickTimer = setTimeout(removeClickGuard, 0);
            else removeClickGuard();
        };
        const cancel = () => finish();
        const move = next => {
            if (next.pointerId !== pointer) return;
            if (!row.isConnected || !(next.buttons & 1)) { finish(); return; }
            const dx = next.clientX-x, dy = next.clientY-y;
            if (!dragging) {
                if (Math.abs(dx) < 7) return;
                if (Math.abs(dy) > Math.abs(dx)) { finish(); return; }
                dragging = true; suppressClick = true;
                row.classList.add('is-dragging');
                window.addEventListener('click', blockClick, true);
            }
            next.preventDefault(); row.scrollLeft = start-dx;
        };
        cancelGesture = cancel;
        window.addEventListener('pointermove', move, {passive:false});
        window.addEventListener('pointerup', finish);
        window.addEventListener('pointercancel', cancel);
        window.addEventListener('blur', cancel);
    });
}
function discoveryOverviewHTML() {
    const knownGenres = discoveryGenres.filter(t => Object.hasOwn(DISCOVERY_GENRE_NAMES, t.name));
    const tags = knownGenres.length ? knownGenres : Object.keys(DISCOVERY_GENRE_NAMES).slice(0, 12).map(name => ({name}));
    const countries = [...(worldCountries || [])].sort((a,b) => b.count - a.count).slice(0, 20);
    const logos = [...stationsList.filter(s => s && featuredKeys.has(radioStationKey(s))), ...discoveryStations];
    return `<div class="discovery-intro"><strong>Atklāj radio</strong><span class="discovery-mouse-hint">Rindas vari vilkt ar peli ↔</span><span>${worldStats ? `${worldStats.stations.toLocaleString('lv-LV')} stacijas pasaules katalogā · ${worldStats.countries} valstis` : 'Mūzika un balsis no visas pasaules'}</span></div>
        <section class="discovery-section"><h3>Pēc žanra</h3>${discoveryRail(tags.map(t => `<button type="button" class="discovery-chip" data-discovery-genre="${escapeHtml(t.name)}"><span>${escapeHtml(DISCOVERY_GENRE_NAMES[t.name] || t.name)}</span>${t.count ? `<small>${discoveryCount(t.count)}</small>` : ''}</button>`).join(''), 'Žanri')}</section>
        <section class="discovery-section"><div class="discovery-section-head"><h3>Pēc valsts</h3><button type="button" class="discovery-link" data-discovery-countries>Visas valstis ↗</button></div>${countries.length ? discoveryRail(countries.map(c => `<button type="button" class="discovery-chip" data-discovery-country="${c.code}">${countryFlag(c.code)}<span>${escapeHtml(c.code === 'US' ? 'ASV' : c.name)}</span><small>${discoveryCount(c.count)}</small></button>`).join(''), 'Valstis') : '<span class="discovery-muted">Valstu saraksts ielādējas, vai atver “Visas valstis”.</span>'}</section>
        <section class="discovery-section"><div class="discovery-section-head"><h3>Stacijas visā pasaulē</h3><button type="button" class="discovery-link" data-discovery-all>Skatīt visas ↗</button></div>${discoveryRail(logos.map(station => `<button type="button" class="discovery-logo" data-discovery-play="${escapeHtml(radioStationKey(station))}" aria-label="Atskaņot ${escapeHtml(station.title)}" title="${escapeHtml(station.title)}"><img src="${escapeHtml(stationLogoUrl(station))}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${LACITIS_RADIO_FALLBACK}'"></button>`).join(''), 'Stacijas')}</section>
        <div class="discovery-section-head"><h3>Izcelts klausīšanai</h3><span class="discovery-muted">Katrai savs raksturs</span></div>`;
}
let stationKeyPlayRequest = 0;
function playStationKey(key) {
    const request = ++stationKeyPlayRequest;
    const index = stationsList.findIndex(s => s && radioStationKey(s) === key);
    if (index >= 0) { selectStation(index); return; }
    if (!/^(rb:|featured:)/.test(key)) return;
    loadWorldCatalog().then(api => api.resolve([key])).then(rows => {
        if (request !== stationKeyPlayRequest) return;
        installWorldStations(rows);
        const index = stationsList.findIndex(s => s && radioStationKey(s) === key);
        if (index >= 0) selectStation(index);
    }).catch(() => {});
}
function ensureWorldFavorites(favorites) {
    const missing = (favorites || []).filter(key => /^(?:rb:[a-f0-9-]{36}|featured:[a-z0-9-]+)$/i.test(key) && !stationsList.some(s => s && radioStationKey(s) === key));
    const fresh = missing.filter(key => !worldFavoriteAttempts.has(key) && !worldFavoritePending.has(key));
    if (fresh.length) {
        fresh.forEach(key => worldFavoritePending.add(key));
        loadWorldCatalog().then(api => api.resolve(fresh)).then(rows => {
            fresh.forEach(key => { worldFavoritePending.delete(key); worldFavoriteAttempts.add(key); });
            installWorldStations(rows);
        }).catch(() => {
            fresh.forEach(key => { worldFavoritePending.delete(key); worldFavoriteAttempts.add(key); });
            window.dispatchEvent(new Event('rg-stations-ready'));
        });
    }
    return missing.some(key => worldFavoritePending.has(key));
}
function countryFlag(code) {
    return /^[A-Z]{2}$/.test(code) ? `<img class="station-country-flag" src="https://flagcdn.com/w40/${code.toLowerCase()}.png" width="24" height="16" alt="" loading="lazy" decoding="async" onerror="this.hidden=true">` : '<span aria-hidden="true">🌍</span>';
}
function renderWorldCountries() {
    const controls = document.getElementById('worldStationControls');
    const list = controls?.querySelector('#worldCountryList'); if (!list) return;
    const query = normalizeStationText(controls.querySelector('#worldCountrySearch').value);
    const countries = [{code:'',name:'Visas valstis'}, ...(worldCountries || [])]
        .filter(c => !query || normalizeStationText(c.name + ' ' + c.code).includes(query));
    list.innerHTML = countries.map(c => `<button type="button" data-country="${c.code}" aria-pressed="${worldCountry === c.code}">${countryFlag(c.code)}<span>${escapeHtml(c.name)}</span></button>`).join('') || '<span class="world-country-empty">Valsts nav atrasta.</span>';
}
function syncWorldPicker() {
    const controls = document.getElementById('worldStationControls');
    if (!controls) return;
    const visible = stationPickerSource === 'world';
    controls.hidden = !visible;
    if (!visible) { const details = controls.querySelector('details'); if (details) details.open = false; return; }
    if (!controls.querySelector('select')) {
        controls.innerHTML = `<div class="world-directory-heading"><strong>Radio visā pasaulē</strong><span id="worldStationTotal" aria-live="polite">Katalogs no Radio Browser</span></div>
            <div class="world-directory-filters"><details class="world-country-picker"><summary aria-label="Izvēlēties valsti"><span id="worldCountrySelected"></span><span aria-hidden="true">⌄</span></summary>
              <div class="world-country-popover"><input id="worldCountrySearch" type="search" placeholder="Meklēt valsti…" aria-label="Meklēt valsti" autocomplete="off"><div id="worldCountryList" class="world-country-list" role="group" aria-label="Valstis"></div></div>
            </details>
            <label class="world-genre-label"><span>Žanrs</span><select id="worldStationGenre" aria-label="Stacijas žanrs"><option value="">Visi žanri</option>${[['pop','Pop'],['rock','Roks'],['dance','Dance'],['electronic','Elektroniskā'],['jazz','Džezs'],['classical','Klasika'],['chillout','Chillout'],['ambient','Ambient'],['house','House'],['techno','Techno'],['trance','Trance'],['hip hop','Hiphops'],['soul','Soul'],['blues','Blūzs'],['metal','Metāls'],['reggae','Reggae'],['country','Kantrī'],['80s','80. gadi'],['90s','90. gadi'],['news','Ziņas']].map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>
            <label><span>Kvalitāte</span><select id="worldStationQuality" aria-label="Straumes kvalitāte"><option value="0">Jebkura</option><option value="128">128+ kb/s</option><option value="192">192+ kb/s</option><option value="256">256+ kb/s</option></select></label>
            <div class="world-station-pages"><button type="button" data-world-page="prev" aria-label="Iepriekšējās stacijas">‹</button><span id="worldStationPage" aria-live="polite"></span><button type="button" data-world-page="next" aria-label="Nākamās stacijas">›</button><button type="button" data-world-retry aria-label="Atjaunot staciju katalogu">↻</button></div></div>`;
        const details = controls.querySelector('details');
        details.addEventListener('toggle', () => { if (details.open) { renderWorldCountries(); controls.querySelector('#worldCountrySearch').focus(); } });
        details.addEventListener('keydown', event => { if (event.key === 'Escape' && details.open) { event.stopPropagation(); details.open = false; details.querySelector('summary').focus(); } });
        controls.querySelector('#worldCountrySearch').addEventListener('input', renderWorldCountries);
        controls.querySelector('#worldCountryList').addEventListener('click', event => {
            const button = event.target.closest('[data-country]'); if (!button) return;
            worldCountry = button.dataset.country; worldOffset = 0; details.open = false;
            controls.querySelector('#worldCountrySearch').value = ''; details.querySelector('summary').focus();
            void loadWorldPage();
        });
        controls.querySelector('#worldStationQuality').addEventListener('change', event => { worldQuality = Number(event.target.value); worldOffset = 0; void loadWorldPage(); });
        controls.querySelector('#worldStationGenre').addEventListener('change', event => { worldGenre = event.target.value; worldOffset = 0; void loadWorldPage(); });
        controls.querySelector('[data-world-page="prev"]').addEventListener('click', () => { worldOffset = Math.max(0, worldOffset - 60); void loadWorldPage(); });
        controls.querySelector('[data-world-page="next"]').addEventListener('click', () => { worldOffset += 60; void loadWorldPage(); });
        controls.querySelector('[data-world-retry]').addEventListener('click', () => { worldFavoriteAttempts.clear(); ensureWorldFavorites(window.__mkUnifiedMedia?.getRadio()?.favorites || []); void loadWorldPage(); });
    }
    const genreSelect = controls.querySelector('#worldStationGenre');
    if (worldGenre && !Array.from(genreSelect.options).some(o => o.value === worldGenre)) { const option = document.createElement('option'); option.value = worldGenre; option.textContent = DISCOVERY_GENRE_NAMES[worldGenre] || worldGenre; genreSelect.appendChild(option); }
    genreSelect.value = worldGenre;
    controls.querySelector('#worldStationQuality').value = String(worldQuality);
    const selected = worldCountries?.find(c => c.code === worldCountry);
    controls.querySelector('#worldCountrySelected').innerHTML = countryFlag(worldCountry) + `<span>${escapeHtml(selected?.name || 'Visas valstis')}</span>`;
    if (worldStats) controls.querySelector('#worldStationTotal').textContent = `${worldStats.stations.toLocaleString('lv-LV')} stacijas katalogā · ${worldStats.countries} valstis`;
    if (controls.querySelector('details').open) renderWorldCountries();
    controls.querySelector('[data-world-page="prev"]').disabled = worldLoading || worldOffset === 0;
    controls.querySelector('[data-world-page="next"]').disabled = worldLoading || !worldHasNext;
    controls.querySelector('[data-world-retry]').disabled = worldLoading;
    controls.querySelector('#worldStationPage').textContent = worldLoading ? '…' : `${Math.floor(worldOffset / 60) + 1}. lapa`;
}

async function loadWorldPage() {
    const request = ++worldRequest;
    worldLoading = true; worldError = ''; worldRevision++;
    syncWorldPicker(); renderStationPickerList();
    try {
        const api = await loadWorldCatalog();
        if (request !== worldRequest || stationPickerSource !== 'world') return;
        if (!worldStats) api.stats().then(stats => { worldStats = stats; syncWorldPicker(); }).catch(() => {});
        if (!worldCountries) api.countries().then(rows => { worldCountries = rows; syncWorldPicker(); }).catch(() => {});
        const result = await api.search({country: worldCountry, genre: worldGenre, query: stationPickerQuery, offset: worldOffset, bitrateMin: worldQuality});
        if (request !== worldRequest || stationPickerSource !== 'world') return;
        worldHasNext = result.hasNext; worldLoading = false; worldRevision++;
        installWorldStations(result.items, true);
    } catch (error) {
        if (request !== worldRequest || stationPickerSource !== 'world') return;
        worldLoading = false; worldHasNext = false; worldError = error.message; worldPageKeys = new Set(); worldRevision++;
    }
    if (request === worldRequest) {
        syncWorldPicker(); renderStationPickerList();
        const list = document.getElementById('stationPickerList'); if (list) list.scrollTop = 0;
    }
}


// Prepare search strings once per catalogue, not once per keystroke/open.
function stationPickerIndex() {
    if (stationPickerCatalogue !== stationsList) {
        stationPickerCatalogue = stationsList;
        stationPickerEntries = stationsList.flatMap((station, index) =>
            !station || station.group === 'separator' ? [] : [{ station, index,
                search: normalizeStationText(`${station.title || ''} ${station.tooltip || ''} ${station.prefix || ''}`)
            }]);
    }
    return stationPickerEntries;
}

function normalizeStationText(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function stationLogoUrl(station) {
    if (station?.group === 'latvija') {
        const key = normalizeStationText(station.title);
        if (LV_STATION_EXTRA_LOGOS[key]) return LACITIS_RADIO_LOGO_BASE + LV_STATION_EXTRA_LOGOS[key];
        const match = LV_STATION_LOGO_RULES.find(([needle]) => key.includes(needle));
        if (match) return LACITIS_RADIO_LOGO_BASE + match[1];
    }
    const direct = String(station?.cover || station?.bg_image_mobile || station?.bg_image || '').trim();
    return direct || LACITIS_RADIO_FALLBACK;
}

function radioStationKey(station){return station.catalogKey || (station.group==='latvija'?'lv:':'record:')+String(station.title||'').normalize('NFC').trim().toLocaleLowerCase('lv-LV');}
function updateStationFavorites(){
    const favoriteIds=window.__mkUnifiedMedia?.getRadio()?.favorites||[];
    document.querySelectorAll('#stationPickerList .station-entry').forEach(entry=>{
        const index=Number(entry.querySelector('[data-station-index]')?.dataset.stationIndex),station=stationsList[index];if(!station)return;
        const position=favoriteIds.indexOf(radioStationKey(station)),on=position>=0,button=entry.querySelector('.station-favorite');
        if(button){button.setAttribute('aria-pressed',String(on));button.textContent=on?'★':'☆';button.setAttribute('aria-label',(on?'Noņemt no favorītiem ':'Pievienot favorītiem ')+station.title);}
        entry.style.order=String(on?position:1000+index);
    });
    const count=document.querySelector('[data-station-source="favorites"] span');if(count)count.textContent=favoriteIds.length;
}
function favoriteStationIndex(favorites){
    for(const id of favorites||[]){const index=stationsList.findIndex(s=>s&&s.group!=='separator'&&radioStationKey(s)===id);if(index>=0)return index;}
    return -1;
}
window.rgStations={startInitial(){
    const profile=window.__mkUnifiedMedia;
    if(profile?.getSession()&&!profile.isLoaded())return false;
    // A profile or an explicit station selection may finish before lazy loading.
    // Never replace that selection with the default catalogue entry.
    if(!isFirstPlay){if(audio.paused)requestRadioPlayback();return true;}
    // Playback defaults to Record Remix, independently of the open catalogue
    // tab and favorite order. Late profile loading preserves an explicit choice.
    const remix = stationsList.findIndex(s => s && s.group !== 'world' && s.group !== 'latvija' && String(s.title).trim().toLowerCase() === 'remix');
    const index = remix >= 0 ? remix : stationsList.findIndex(s => s && s.group !== 'separator');
    if(index<0)return false;
    selectStation(index);return true;
},startFavorite(favorites){
    if(document.body.classList.contains('radio-idle')||document.body.classList.contains('radio-hidden')||window.__mkRadioSupersededByLacitis||window.isRadioMobileView?.())return false;
    // Compatibility hook used when the profile finishes signing in.
    return window.rgStations.startInitial();
},list:()=>stationsList.filter(s=>s&&s.group!=='separator').map(s=>({key:radioStationKey(s),title:s.title})),play:playStationKey};
document.addEventListener('media-profile-change',()=>{
    ensureWorldFavorites(window.__mkUnifiedMedia?.getRadio()?.favorites || []);
    const list=document.getElementById('stationPickerList');if(!list)return;
    const open=document.getElementById('stationOverlay')?.style.display==='grid';
    if(stationPickerSource==='favorites'){list.__filter=null;if(open)renderStationPickerList();}
    if(open)updateStationFavorites();
});

function stationPickerItems() {
    const query = normalizeStationText(stationPickerQuery);
    return stationPickerIndex()
        .filter(({ station }) => stationPickerSource === 'featured' ? featuredKeys.has(radioStationKey(station)) : stationPickerSource === 'world' ? worldPageKeys.has(radioStationKey(station)) : stationPickerSource === 'favorites' ? (window.__mkUnifiedMedia?.getRadio()?.favorites||[]).includes(radioStationKey(station)) : stationPickerSource === 'latvija'
            ? station.group === 'latvija'
            : station.group !== 'latvija' && station.group !== 'world')
        .filter(({ search }) => !query || search.includes(query));
}

const STATION_PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5a1.5 1.5 0 0 1 2.3-1.27l9 5.5a1.5 1.5 0 0 1 0 2.54l-9 5.5A1.5 1.5 0 0 1 8 16.5Z"/></svg>';
const STATION_SELECTED_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function updateStationPickerSelection() {
    const list = document.getElementById('stationPickerList');
    if (!list) return;
    const next = list.querySelector(`[data-station-index="${currentIndex}"]`);
    const previous = list.querySelector('.is-current');
    if (previous === next) return;
    for (const [button, selected] of [[previous, false], [next, true]]) {
        if (!button) continue;
        button.classList.toggle('is-current', selected);
        button.setAttribute('aria-current', String(selected));
        button.querySelector('.station-play-mark').innerHTML = selected ? STATION_SELECTED_ICON : STATION_PLAY_ICON;
    }
}

function renderStationPickerList() {
    const list = document.getElementById('stationPickerList');
    if (!list) return;
    const key = stationPickerSource + '|' + normalizeStationText(stationPickerQuery) + (stationPickerSource === 'world' ? '|' + worldRevision : stationPickerSource === 'featured' ? '|' + discoveryRevision : '');
    if (list.__catalogue === stationsList && list.__filter === key) {
        updateStationPickerSelection();
        updateStationFavorites();
        return;
    }
    list.__catalogue = stationsList;
    list.__filter = key;
    const scrollTop = list.scrollTop;
    const items = stationPickerItems();
    if (stationPickerSource === 'world' && worldLoading) { list.innerHTML = '<div class="station-picker-empty" role="status">Ielādē stacijas…</div>'; return; }
    if (!items.length) {
        list.innerHTML = '<div class="station-picker-empty" role="status">' + escapeHtml(stationPickerSource === 'world' && worldError ? worldError : 'Neviena stacija neatbilst meklējumam.') + '</div>';
        return;
    }
    const discovery = stationPickerSource === 'featured' && !stationPickerQuery;
    list.innerHTML = (discovery ? discoveryOverviewHTML() + '<div class="discovery-featured-row">' : '') + items.map(({ station, index }) => {
        const isCurrent = index === currentIndex;
        const title = escapeHtml(station.title || 'Radio');
        const description = escapeHtml(station.group === 'latvija' && (!station.tooltip || station.tooltip === 'Radio Record')
            ? 'Latvijas radio' : (station.tooltip || 'Radio Record'));
        const logo = escapeHtml(stationLogoUrl(station));
        return `<div class="station-entry"><button class="station-tile${station.group === 'latvija' ? ' station-lv' : ''}${isCurrent ? ' is-current' : ''}"
            type="button" data-station-index="${index}" title="${title}&#10;${description}" aria-label="Atskaņot ${title}" aria-description="${description}" aria-current="${isCurrent ? 'true' : 'false'}">
            <span class="station-logo-wrap">
                <img class="station-logo" src="${logo}" alt="" width="44" height="44" loading="lazy" decoding="async" fetchpriority="low"
                    onerror="this.onerror=null;this.src='${LACITIS_RADIO_FALLBACK}'">
            </span>
            <span class="station-copy"><strong>${title}</strong><small>${station.group === 'world' ? countryFlag(station.country) : ''}${description}</small></span>
            <span class="station-play-mark" aria-hidden="true">${isCurrent ? STATION_SELECTED_ICON : STATION_PLAY_ICON}</span>
        </button><button type="button" class="station-favorite" data-favorite-index="${index}" aria-pressed="false" aria-label="Pievienot favorītiem ${title}">☆</button></div>`;
    }).join('') + (discovery ? '</div>' : '');
    updateStationFavorites();
    list.scrollTop = scrollTop;
}

function renderStationOverlay() {
    const overlay = document.getElementById('stationOverlay');
    if (!overlay || overlay.style.display !== 'grid') return;
    const recordCount = stationsList.filter(s => s && s.group !== 'latvija' && s.group !== 'world' && s.group !== 'separator').length;
    const latviaCount = stationsList.filter(s => s && s.group === 'latvija').length;
    overlay.setAttribute?.('data-station-view', stationPickerSource);
    syncWorldPicker();
    if (overlay.querySelector('#stationPickerList')) {
        overlay.querySelector('[data-station-source="record"] span').textContent = recordCount;
        overlay.querySelector('[data-station-source="latvija"] span').textContent = latviaCount;
        renderStationPickerList();
        return;
    }
    overlay.innerHTML = `
        <div class="station-picker-head">
            <div class="station-picker-title"><strong>Stacijas</strong><span>Izvēle neaizver sarakstu</span></div>
            <label class="station-picker-search">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"/></svg>
                <input id="stationPickerSearch" type="search" aria-label="Meklēt staciju" placeholder="Meklēt staciju…" value="${escapeHtml(stationPickerQuery)}" autocomplete="off">
            </label>
            <button class="station-picker-close" type="button" aria-label="Aizvērt stacijas"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </div>
        <div class="station-picker-tabs" role="tablist" aria-label="Staciju avots">
            <button type="button" data-station-source="favorites" role="tab" aria-selected="${stationPickerSource === 'favorites'}">Favorīti <span>0</span></button>
            <button type="button" data-station-source="featured" role="tab" aria-selected="false">Atklāj</button>
            <button type="button" data-station-source="record" role="tab" aria-selected="${stationPickerSource === 'record'}"
                class="${stationPickerSource === 'record' ? 'active' : ''}">Radio Record <span>${recordCount}</span></button>
            <button type="button" data-station-source="latvija" role="tab" aria-selected="${stationPickerSource === 'latvija'}"
                class="${stationPickerSource === 'latvija' ? 'active' : ''}">Latvija <span>${latviaCount}</span></button>
            <button type="button" data-station-source="world" role="tab" aria-selected="false">Pasaule</button>
        </div>
        <div id="worldStationControls" class="world-station-controls" hidden></div>
        <div class="station-picker-list" id="stationPickerList"></div>`;
    overlay.querySelector('.station-picker-close')?.addEventListener('click', () => toggleMenu(false));
    overlay.querySelectorAll('[data-station-source]').forEach(button => {
        button.addEventListener('click', () => {
            clearTimeout(stationPickerSearchTimer);
            if(button.dataset.stationSource==='favorites'&&!window.__mkUnifiedMedia?.getSession()){window.__mkUnifiedMedia?.open();return;}
            stationPickerSource = ['latvija','favorites','featured','world'].includes(button.dataset.stationSource) ? button.dataset.stationSource : 'record';
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
            overlay.setAttribute('data-station-view', stationPickerSource);
            syncWorldPicker();
            if (stationPickerSource === 'world') { worldOffset = 0; void loadWorldPage(); }
            else { ++worldRequest; worldLoading = false; if (stationPickerSource === 'featured') void loadFeaturedStations(); }
            renderStationPickerList();
            overlay.querySelector('#stationPickerList').scrollTop = 0;
        });
    });
    overlay.querySelector('#stationPickerSearch')?.addEventListener('input', event => {
        clearTimeout(stationPickerSearchTimer);
        stationPickerQuery = event.target.value || '';
        stationPickerSearchTimer = setTimeout(() => {
            if (overlay.style.display !== 'grid') return;
            if (stationPickerSource === 'world') { worldOffset = 0; void loadWorldPage(); return; }
            renderStationPickerList();
            overlay.querySelector('#stationPickerList').scrollTop = 0;
        }, stationPickerSource === 'world' ? 350 : 80);
    });
    enableDiscoveryDrag(overlay.querySelector('#stationPickerList'));
    overlay.querySelector('#stationPickerList')?.addEventListener('click', event => {
        const scroll = event.target.closest('[data-discovery-scroll]');
        if (scroll) { scroll.parentElement.querySelector('.discovery-rail-content').scrollBy({left:Number(scroll.dataset.discoveryScroll)*320, behavior:'smooth'}); return; }
        const shortcut = event.target.closest('[data-discovery-country],[data-discovery-genre],[data-discovery-all],[data-discovery-countries]');
        if (shortcut) {
            worldCountry = shortcut.dataset.discoveryCountry || ''; worldGenre = shortcut.dataset.discoveryGenre || ''; worldQuality = 0;
            overlay.querySelector('[data-station-source="world"]').click();
            if (shortcut.hasAttribute('data-discovery-countries')) overlay.querySelector('.world-country-picker').open = true;
            return;
        }
        const preview = event.target.closest('[data-discovery-play]');
        if (preview) { playStationKey(preview.dataset.discoveryPlay); return; }
        const favorite=event.target.closest('[data-favorite-index]');
        if(favorite){const station=stationsList[Number(favorite.dataset.favoriteIndex)];if(station){const id=radioStationKey(station),on=(window.__mkUnifiedMedia?.getRadio()?.favorites||[]).includes(id);window.__mkUnifiedMedia?.change({type:on?'favorite-remove':'favorite-add',id});}return;}
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

    // Rebuild around the stable station key, including local and saved world stations.
    recordStations = fresh;
    refreshCombinedStations();
    renderStationOverlay();
}


window.__slowFx = window.__slowFx || { volume:100, pitch:0, speed:88, reverb:40, keepPitch:false, panelInit:false };

function toggleSlowPanel(force){
    const p = document.getElementById('slowFxPanel');
    if(!p) return;
    const shouldOpen = (typeof force === 'boolean') ? force : !p.classList.contains('open');
    p.classList.toggle('open', shouldOpen);
    p.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    if (shouldOpen) {
      if(p.parentElement!==document.body)document.body.append(p);
      initSlowFxPanel();positionSlowPanel();
    }
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
    const p=document.getElementById('slowfxPitchVal'); if(p){ const x=(Math.round(__slowFx.pitch*100)/100).toFixed(2); p.textContent = __slowFx.keepPitch?'Oriģinālais':`${__slowFx.pitch>=0?'+':''}${x}`; }
    const s=document.getElementById('slowfxSpeedVal'); if(s) s.textContent = `${Math.round(__slowFx.speed)}%`;
    const r=document.getElementById('slowfxReverbVal'); if(r) r.textContent = `${Math.round(__slowFx.reverb)}%`;
    const pitchInput=document.getElementById('slowfxPitch');if(pitchInput)pitchInput.disabled=!!__slowFx.keepPitch;
    const pitchHint=document.getElementById('slowfxPitchHint');if(pitchHint)pitchHint.textContent=__slowFx.keepPitch?'Tonis ir saglabāts. Izslēdz slēdzi augšā, lai to mainītu.':'Maina balss augstumu un arī ātrumu.';
    for(const id of ['Volume','Pitch','Speed','Reverb']){const input=document.getElementById('slowfx'+id);if(input)input.style.setProperty('--slowfx-fill',((Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100)+'%');}
}

function applySlowFxCustom(){
    if(!audio)return;
    const mode=window.__eqMode||'none',slow=mode==='chilldeep';
    const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
    const keepPitch=slow&&!!__slowFx.keepPitch;
    const pitch=keepPitch?1:Math.pow(2,Math.max(-6,Math.min(6,finite(__slowFx.pitch,0)))/12);
    const speed=Math.max(.6,Math.min(1.3,finite(__slowFx.speed,88)/100));
    const rate=slow?Math.max(.45,Math.min(1.8,speed*pitch)):mode==='chill'?.92:1;
    // One final rate per action. Do not bounce through 1.0 and the base preset:
    // each write can make a streaming decoder refill/reconfigure its buffer.
    try{
      for(const property of ['preservesPitch','mozPreservesPitch','webkitPreservesPitch'])if(audio[property]!==keepPitch)audio[property]=keepPitch;
      if(Math.abs(audio.playbackRate-rate)>.000001)audio.playbackRate=rate;
    }catch(_){}
    const rv=Math.max(0,Math.min(100,finite(__slowFx.reverb,40)))/100;
    const smooth=(param,target)=>{
      if(!param)return;
      const now=aCtx?.currentTime||0;
      if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(now);
      else{const current=param.value;param.cancelScheduledValues(now);param.setValueAtTime(current,now);}
      param.linearRampToValueAtTime(target,now+.08);
    };
    smooth(masterGain?.gain,slow?Math.max(.5,Math.min(1.6,finite(__slowFx.volume,100)/100)):1);
    smooth(wetGain?.gain,slow?.75*rv:mode==='chill'?.55:0);
    smooth(feedbackNode?.gain,slow?.30*rv:mode==='chill'?.22:0);
}

function initSlowFxPanel(){
    if(__slowFx.panelInit) {
      const keep = document.getElementById('slowfxKeepPitch');
      if (keep) keep.checked = !!__slowFx.keepPitch;
      refreshSlowFxLabels();
      return;
    }
    document.getElementById('slowfxClose')?.addEventListener('click',()=>toggleSlowPanel(false));
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
        refreshSlowFxLabels();applySlowFxCustom();
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
    aCtx = new (window.AudioContext || window.webkitAudioContext)({latencyHint: 'playback'});
    analyser = aCtx.createAnalyser();
    analyser.fftSize = MK_LOW_SPEC ? 128 : 256;
    if(isModernViz(vizStyle)){analyser.fftSize=MK_LOW_SPEC?512:1024;analyser.minDecibels=-85;analyser.maxDecibels=-5;analyser.smoothingTimeConstant=.12;}
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

    setEQ(window.__eqMode || 'none');

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
    ++stationKeyPlayRequest;
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
    updateStationPickerSelection();
    startNowPlaying(s);
    if(window.__mkUnifiedMedia?.getSession())window.__mkUnifiedMedia.change({type:'station',id:radioStationKey(s)});

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

let radioPlayAttempt = 0;
function requestRadioPlayback() {
    const attempt = ++radioPlayAttempt;
    const button = document.getElementById('playBtn');
    const paint = (playing, blocked = false) => {
        if (attempt !== radioPlayAttempt || window.__mkRadioSupersededByLacitis) return;
        button.innerHTML = playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        button.title = blocked ? 'Nospied, lai sāktu atskaņošanu' : playing ? 'Pauze' : 'Atskaņot';
        button.setAttribute('aria-label', button.title);
    };
    // A blocked resume promise can stay pending until a gesture. Start the
    // media request in the same gesture instead of waiting for that promise.
    if (aCtx && aCtx.state === 'suspended') {
        aCtx.resume().then(() => { if (!audio.paused) paint(true); }).catch(() => paint(false, true));
    }
    paint(false);
    return audio.play().then(() => {
        const blocked = aCtx && aCtx.state === 'suspended';
        paint(!audio.paused && !blocked, blocked);
    }).catch(error => {
        paint(false, error?.name === 'NotAllowedError');
    });
}

let radioStreamGeneration = 0, radioStreamURL = '', radioStreamCleanup = null;
function play(url, name) {
    setupAudio();
    document.getElementById('curStation').textContent = name;
    // Re-selecting the playing station must not reopen its network stream.
    if (url === radioStreamURL && !audio.error) {
        if (audio.paused && (audio.src || hls)) requestRadioPlayback();
        return;
    }
    radioStreamCleanup?.();
    const generation = ++radioStreamGeneration;
    ++radioPlayAttempt;
    radioStreamURL = url;
    const cleanup = [];
    const active = () => generation === radioStreamGeneration && !window.__mkRadioSupersededByLacitis;
    radioStreamCleanup = () => { for (const dispose of cleanup) dispose(); };
    try { audio.pause(); } catch (_) {}
    // An empty src URL emits a spurious error while the lazy HLS script loads.
    if (typeof audio.removeAttribute === 'function') audio.removeAttribute('src');
    else audio.src = '';
    audio.load();
    const failedPlayback = () => {
        if (!active()) return;
        console.warn('[radio] Media playback failed '+JSON.stringify({code:audio.error?.code,message:audio.error?.message,rate:audio.playbackRate,readyState:audio.readyState,format:url.includes('.m3u8')?'hls':'direct',engine:hls?'hls.js':'native'}));
        const title = document.getElementById('npTitle');
        if (title) { title.textContent = 'Stacija pašlaik nav sasniedzama. Mēģini citu staciju.'; title.setAttribute?.('role', 'status'); }
        const button = document.getElementById('playBtn');
        if (button) { button.innerHTML = '<i class="fas fa-play"></i>'; button.title = 'Mēģināt atskaņot vēlreiz'; button.setAttribute('aria-label',button.title); }
    };
    audio.addEventListener?.('error', failedPlayback);
    cleanup.push(() => audio.removeEventListener?.('error', failedPlayback));
    const direct = () => { if (!active()) return; audio.src = url; requestRadioPlayback(); };
    const isHLS = url.includes('.m3u8');
    // Chrome advertises native HLS, but changing a live stream to .88 speed
    // can fail with DEMUXER_ERROR_COULD_NOT_PARSE (observed on Record Remix).
    // Use MSE/hls.js there from the start so SLOW never switches decoders.
    // Safari keeps native HLS; non-HLS stations need no extra library.
    const chromiumHls = typeof navigator !== 'undefined' && /(?:Chrome|Chromium|Edg|OPR)\//.test(navigator.userAgent || '');
    const needsHlsParser = chromiumHls || url.startsWith('https://sb.err.ee/');
    if (!isHLS || (!needsHlsParser && audio.canPlayType('application/vnd.apple.mpegurl'))) { direct(); return; }
    const connectHls = () => {
        if (!active()) return;
        if (!window.Hls || !Hls.isSupported()) { direct(); return; }
        const player = new Hls({enableWorker:true, lowLatencyMode:true, backBufferLength:0});
        hls = player;
        let loadingPaused = false;
        const pauseLoading = () => { if (generation !== radioStreamGeneration) return; loadingPaused = true; player.stopLoad(); };
        const resumeLoading = () => { if (active() && loadingPaused) { loadingPaused = false; player.startLoad(-1); } };
        audio.addEventListener('pause', pauseLoading);
        audio.addEventListener('play', resumeLoading);
        cleanup.push(() => { audio.removeEventListener('pause', pauseLoading); audio.removeEventListener('play', resumeLoading); });
        cleanup.push(() => { player.destroy(); if (hls === player) hls = null; });
        let started = false;
        const start = () => { if (!active() || started) return; started = true; requestRadioPlayback(); };
        player.on(Hls.Events.MANIFEST_PARSED, start);
        player.on(Hls.Events.FRAG_LOADED, start);
        const timer = setTimeout(start, 1500);
        cleanup.push(() => clearTimeout(timer));
        player.on(Hls.Events.ERROR, (_event, data) => {
            if (!active() || !data.fatal) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) player.startLoad();
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) player.recoverMediaError();
            else { player.destroy(); if (hls === player) hls = null; radioStreamURL = ''; }
        });
        player.loadSource(url);
        player.attachMedia(audio);
    };
    if (window.Hls) { connectHls(); return; }
    let loader = document.getElementById('mk-hls-loader');
    if (!loader) {
        loader = document.createElement('script');
        loader.id = 'mk-hls-loader';
        loader.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
        document.head.appendChild(loader);
    }
    const failed = () => { loader.remove(); direct(); };
    loader.addEventListener('load', connectHls, {once:true});
    loader.addEventListener('error', failed, {once:true});
    cleanup.push(() => { loader.removeEventListener('load', connectHls); loader.removeEventListener('error', failed); });
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
    if(!aCtx||!delayNode)return;
    // Speed and wet/feedback gains are committed once by applySlowFxCustom.
    const delay=preset==='chilldeep'?.16:preset==='chill'?.12:0;
    if(delayNode.delayTime.value!==delay)delayNode.delayTime.setValueAtTime(delay,aCtx.currentTime);
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
    // Set the requested mode before initialization or custom rate/gain reads it.
    window.__eqMode = mode;
    if(!lowNode){
        try{ setupAudio(); }catch(e){}
        if(!lowNode){
            if (mode === 'chilldeep') { try{ initSlowFxPanel(); toggleSlowPanel(true); }catch(e){} }
            return;
        }
    }
    if(!audio.paused&&aCtx?.state==='suspended')void aCtx.resume().catch(()=>{});
    const moreModes = new Set(['bassplus','studio','depth','chilldeep','lofi']);

    lowNode.type = "lowshelf"; lowNode.frequency.value = 120; lowNode.gain.value = 0;
    highNode.type = "highshelf"; highNode.frequency.value = 4000; highNode.gain.value = 0;

    setChill(mode==='chilldeep'?'chilldeep':mode==='chill'?'chill':'off');

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
        document.body.classList.add('slowed-active');
    }

    if (!window.__manualSlowPanelControl) {
        if (mode === 'chilldeep') { try{ initSlowFxPanel(); toggleSlowPanel(true); }catch(e){} } else { try{ toggleSlowPanel(false); }catch(e){} }
    }
    try{ applySlowFxCustom(); }catch(e){}

    // Keep the selected visualizer informed of the active speed effect.
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
    const ratio = Math.min(window.devicePixelRatio || 1, MK_LOW_SPEC ? 1.5 : 2);
    const w = Math.round(cvs.clientWidth * ratio);
    const h = Math.round(cvs.clientHeight * ratio);
    if (cvs.width !== w || cvs.height !== h) {
        cvs.width = w;
        cvs.height = h;
    }
}

// Pixel Buddy uses a small sprite and a capped 24 fps timer, without FFT work.
const MK_BUDDY_FRAMES = [
  ['...XXXX...','..XXXXXX..','.XXXXXXXX.','.X..XX..X.','.X..XX..X.','.XXXXXXXX.','.XXXXXXXX.','.X.X..X.X.'],
  ['...XXXX...','..XXXXXX..','.XXXXXXXX.','.X..XX..X.','.X..XX..X.','.XXXXXXXX.','.XXXXXXXX.','..X.X.X.X.']
];
function drawBuddySprite(context,width,height,ts,rgb){
    const phase=ts/650,map=MK_BUDDY_FRAMES[Math.floor(ts/180)%2];
    const unit=Math.max(2,Math.floor(Math.min(height/12,width/28)));
    const ox=Math.round((width-map[0].length*unit)/2+Math.sin(phase*.7)*unit*1.5);
    const oy=Math.round((height-map.length*unit)/2+Math.sin(phase)*unit*.65);
    context.fillStyle=`rgba(${rgb.join(',')},.09)`;
    context.beginPath();context.ellipse(width/2,height*.91,unit*4,unit*.35,0,0,Math.PI*2);context.fill();
    for(let r=0;r<map.length;r++)for(let c=0;c<map[r].length;c++){
        if(map[r][c]!=='X')continue;
        context.fillStyle=r<2?`rgb(${rgb.map(v=>Math.min(255,v+38)).join(',')})`:`rgb(${rgb.join(',')})`;
        context.fillRect(ox+c*unit,oy+r*unit,unit,unit);
    }
}
function mkDrawBuddyViz(ts){
    __vizLastFrameTs=ts;ensureCanvasSize();ctx.clearRect(0,0,cvs.width,cvs.height);
    drawBuddySprite(ctx,cvs.width,cvs.height,ts,__radioVizAccentRGB);
}

// One lightweight renderer for the entire new collection. Attack responds to
// transients quickly; release is time-based so 30 and 60 fps feel consistent.
function drawModernSpectrum(mode,ctx,w,h,data,dt,color,levels=flowLevels,wave=null,meter=modernMeter){
    const count=24,step=w/count,bw=step*.58;
    if(!wave){
        if(!modernWaveData||modernWaveData.length!==analyser.fftSize)modernWaveData=new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(modernWaveData);wave=modernWaveData;
    }
    let sum=0;for(let i=0;i<wave.length;i++){const sample=(wave[i]-128)/128;sum+=sample*sample;}
    const rms=Math.sqrt(sum/wave.length),db=20*Math.log10(Math.max(rms,.00001));
    const loudness=Math.max(0,Math.min(1,(db+48)/48));
    meter.level+=(loudness-meter.level)*(1-Math.exp(-dt/(loudness>meter.level?18:95)));
    for(let i=0;i<count;i++){
        const bin=Math.min(data.length-1,Math.round(Math.pow(data.length-1,i/(count-1))));
        const target=Math.pow(data[bin]/255,1.05);
        const rate=1-Math.exp(-dt/(target>levels[i]?24:120));
        levels[i]+=(target-levels[i])*rate;
    }
    ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=1;
    if(mode===2||mode===6){
        const points=mode===6?32:24,dx=w/(points-1);ctx.beginPath();ctx.lineWidth=Math.max(1.5,h*.035);
        let previousY=h/2;
        for(let i=0;i<points;i++){
            const y=h/2+(wave[Math.floor(i*(wave.length-1)/(points-1))]-128)/128*h*.43;
            if(!i)ctx.moveTo(0,y);
            else if(mode===6)ctx.quadraticCurveTo((i-.5)*dx,previousY,i*dx,y);
            else ctx.lineTo(i*dx,y);
            previousY=y;
        }
        ctx.stroke();return;
    }
    if(mode===8){
        const radius=Math.min(w*.3,h*.78),cx=w/2,cy=h*.91;
        ctx.lineWidth=Math.max(2,h*.04);ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(cx,cy,radius,Math.PI,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
        const angle=Math.PI+meter.level*Math.PI;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(angle)*radius*.9,cy+Math.sin(angle)*radius*.9);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,ctx.lineWidth,0,Math.PI*2);ctx.fill();return;
    }
    for(let i=0;i<count;i++){
        let value=levels[i];
        if(mode===1||mode===5){const mirror=Math.min(23,Math.round(Math.abs(i-11.5)*2));value=levels[mode===1?23-mirror:mirror];}
        const height=Math.max(2,value*h*.92),x=i*step+(step-bw)/2;
        if(mode===9){ctx.globalAlpha=(i+.5)/count<meter.level?1:.12;ctx.beginPath();ctx.roundRect(x,h*.29,bw,h*.42,bw*.25);ctx.fill();continue;}
        if(mode===0||mode===7||mode===10){
            const rows=8,dy=h/rows,on=Math.round(value*rows);
            for(let row=0;row<rows;row++){
                if(row>=on&&mode!==10)continue;
                ctx.globalAlpha=row<on?1:.1;const y=h-(row+.5)*dy;ctx.beginPath();
                if(mode===0)ctx.roundRect(x,y-dy*.3,bw,dy*.6,Math.min(1.5,dy*.12));
                else ctx.arc(x+bw/2,y,Math.min(bw*.35,dy*.26),0,Math.PI*2);
                ctx.fill();
            }
        }else{ctx.globalAlpha=1;ctx.beginPath();ctx.roundRect(x,mode===4?(h-height)/2:h-height,bw,height,Math.min(bw/2,height/2));ctx.fill();}
    }
    ctx.globalAlpha=1;
}

function drawClassicSpectrum(vizStyle,ctx,cvs,data,vRgb,peaks,dt=16.7){
    const vHex=`rgb(${vRgb})`;
    if (vizStyle === 0) {
           const count=Math.min(96,Math.max(12,Math.floor(cvs.width/6))),step=cvs.width/count,barW=Math.max(1,step-2);
           for(let i=0;i<count;i++){const val=data[Math.floor(i/count*data.length)]/255*cvs.height;for(let y=0;y<val;y+=3){ctx.fillStyle=`rgba(${vRgb},${Math.min(1,.4+y/cvs.height)})`;ctx.fillRect(i*step,cvs.height-y-2,barW,2);}}
        } else if (vizStyle === 1) {
           const count=20,step=cvs.width/(count*2),barW=Math.max(1,step*.72),center=cvs.width/2;
           for(let i=0;i<count;i++){const val=data[Math.floor(i/count*data.length)]/255*cvs.height;ctx.fillStyle=`rgba(${vRgb},.8)`;ctx.fillRect(center+i*step,cvs.height-val,barW,val);ctx.fillRect(center-(i+1)*step,cvs.height-val,barW,val);}
        } else if (vizStyle === 2) {
           ctx.beginPath();ctx.lineWidth=2;ctx.strokeStyle=`rgba(${vRgb},.8)`;
           for(let i=0;i<data.length;i++){const x=i/(data.length-1)*cvs.width,y=cvs.height-data[i]/255*cvs.height;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
        } else if (vizStyle === 3 || vizStyle === 4) {
           const count=Math.min(96,Math.max(12,Math.floor(cvs.width/9))),step=cvs.width/count,barW=Math.max(1,step*.72);
           ctx.fillStyle=`rgba(${vRgb},.76)`;
           for(let i=0;i<count;i++){const val=data[Math.floor(i/count*data.length)]/255*cvs.height*(vizStyle===4?.8:1);ctx.fillRect(i*step,vizStyle===4?(cvs.height-val)/2:cvs.height-val,barW,val);}
        } else if (vizStyle === 5) {
            // The animated artwork owns this mode; no spectrum bars around it.
            return;
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
            const dotR = Math.max(.45, Math.min(2.3, colW * .20, gapY*.28));
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

function draw(ts = 0) {
    // Reduce CPU when hidden / paused / radio hidden. The radio panel hides via
    // transform+opacity (not display:none), so the old getComputedStyle().display
    // check never slept while hidden — and ran a style recalc every frame. A
    // cheap classList check fixes both. Audio plays via the <audio> element, so
    // sleeping the visualizer never stops the music.
    __drawScheduled = false;
    const shouldSleep = vizStyle === MK_NO_VIZ || vizStyle === 5 || (vizStyle >= 8 && vizStyle <= 10) || radioVisualsInactive() || audio.paused || !analyser;
    if (shouldSleep) {
        // Visibility/radio-toggle/play events restart the loop. Do not leave an
        // invisible 500 ms polling loop running for the whole minimized period.
        return;
    }
    if (isAdjustingVol) {
        // The volume OSD owns the monitor while the slider is moving. Poll
        // slowly instead of analysing and repainting audio behind it.
        scheduleDraw(120);
        return;
    }
    if (vizStyle === MK_BUDDY_VIZ) {
        scheduleDraw(1000 / (MK_LOW_SPEC ? 15 : 24));
        if (dGif) dGif.style.opacity = 0;
        mkDrawBuddyViz(ts || performance.now());
        return;
    }
    scheduleDraw();
    const frameMs = isModernViz(vizStyle) ? 1000 / (MK_LOW_SPEC ? 30 : 60) : MK_VIZ_FRAME_MS;
    if (frameMs && ts && (ts - __vizLastFrameTs) < frameMs - .5) return;
    const frameDelta=Math.min(64,Math.max(8,(ts||performance.now())-__vizLastFrameTs));
    __vizLastFrameTs = ts || performance.now();
    if (!__vizFreqData || __vizFreqData.length !== analyser.frequencyBinCount) __vizFreqData = new Uint8Array(analyser.frequencyBinCount);
    const data = __vizFreqData;
    analyser.getByteFrequencyData(data);

    // Spectrum follows the current album/theme accent. The cached value avoids
    // reading computed styles on every animation frame.
    const vC = __radioVizAccentRGB;
    const vRgb = `${vC[0]}, ${vC[1]}, ${vC[2]}`;
    const vHex = `rgb(${vRgb})`;

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
    if ((vizStyle === 6 || vizStyle === 7) && !__radioImageSkin) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0,0,cvs.width,cvs.height);
    } else {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
    }

    if (isModernViz(vizStyle)) {
        drawModernSpectrum(modernBaseMode(vizStyle),ctx,cvs.width,cvs.height,data,frameDelta,vHex);
    } else {
        const ratio=cvs.width/cvs.clientWidth;
        ctx.save();ctx.scale(ratio,ratio);
        drawClassicSpectrum(vizStyle,ctx,{width:cvs.clientWidth,height:cvs.clientHeight},data,vRgb,peaks,frameDelta);
        ctx.restore();
    }
}

document.getElementById('playBtn').onclick = () => {
    setupAudio();
    if (isFirstPlay) {
        // Find first valid (non-separator) station
        const favoriteIndex=window.__mkUnifiedMedia?.getSession()?favoriteStationIndex(window.__mkUnifiedMedia.getRadio()?.favorites):-1;
        if(favoriteIndex>=0)currentIndex=favoriteIndex;
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
            if (!window.__mkRadioSupersededByLacitis && audio.paused && currentIndex === startIdx) selectStation(startIdx);
        }, 800);
    } else {
        if (audio.error && radioStreamURL) {
            play(radioStreamURL, document.getElementById('curStation').textContent);
        } else if (audio.paused) {
            requestRadioPlayback();
        } else { 
            audio.pause(); 
            const button=document.getElementById('playBtn');
            button.innerHTML = '<i class="fas fa-play"></i>';
            button.title='Atskaņot';button.setAttribute('aria-label','Atskaņot');
        }
    }
};

document.getElementById('vol').oninput = (e) => {
    const val = e.target.value; audio.volume = val; isAdjustingVol = true;
    const osd = document.getElementById('volumeOSD'); const numDisplay = document.getElementById('osd-num');
    const monitor = document.querySelector('#radioWindow .monitor-frame');
    if (monitor) monitor.classList.add('volume-adjusting');
    const segs = document.querySelectorAll('.seg'); osd.style.display = 'flex';
    const displayVal = Math.floor(val * 100); numDisplay.textContent = displayVal.toString().padStart(2, '0');
    const litSegments = Math.floor(displayVal / 2);
    segs.forEach((s, i) => { if(i < litSegments) s.classList.add('on'); else s.classList.remove('on'); });
    clearTimeout(volTimeout); volTimeout = setTimeout(() => {
        isAdjustingVol = false;
        osd.style.display = 'none';
        if (monitor) monitor.classList.remove('volume-adjusting');
        scheduleDraw();
    }, 1200);
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
      height: win.dataset.radioLayout ? 190 : r.height,
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
  });
  window.addEventListener('mouseup', ()=>{
    if(!dragging) return;
    dragging = false;
    document.body.style.userSelect = "";
    save();
  });

  // Resize persistence (CSS resize)
  let ro;
  try{
    ro = new ResizeObserver(()=>{
      save();
    });
    ro.observe(win);
  }catch(e){
    window.addEventListener('mouseup', save);
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
      vars: {
        '--bg-color': '#000000',
        '--panel': '#070908',
        '--search-bar-bg': '#101311',
        '--search-border': 'rgba(255,255,255,.10)',
        '--search-hover': '#171b18'
      }
    },
    {
      name: 'Neon pilsēta',
      description: 'Tumšs kino neons',
      chip: '#ef5f45',
      surfaceRGB: [9,8,16],
      image: 'kalendars/data/radio-skins/neon-city-2400x400.jpg',
      preview: 'kalendars/data/radio-skins/neon-city-preview.jpg',
      vars: {
        '--bg-color': '#07060b',
        '--panel': '#100d16',
        '--search-bar-bg': '#17121d',
        '--search-border': 'rgba(239,95,69,.16)',
        '--search-hover': '#211827'
      }
    },
    {
      name: 'Dziļais okeāns',
      description: 'Tumšs un mierīgs',
      chip: '#53c9e8',
      surfaceRGB: [5,16,20],
      image: 'kalendars/data/radio-skins/deep-ocean-2400x400.jpg',
      preview: 'kalendars/data/radio-skins/deep-ocean-preview.jpg',
      isDefault: true,
      vars: {
        '--bg-color': '#030a0d',
        '--panel': '#081317',
        '--search-bar-bg': '#0d1b20',
        '--search-border': 'rgba(83,201,232,.16)',
        '--search-hover': '#12252b'
      }
    },
    {
      name: 'Miglas mežs',
      description: 'Kluss un dziļš',
      chip: '#66a58b',
      surfaceRGB: [6,14,14],
      image: 'kalendars/data/radio-skins/mist-forest-2400x400.jpg',
      preview: 'kalendars/data/radio-skins/mist-forest-preview.jpg',
      vars: {
        '--bg-color': '#040a09',
        '--panel': '#0a1412',
        '--search-bar-bg': '#101c19',
        '--search-border': 'rgba(102,165,139,.16)',
        '--search-hover': '#15251f'
      }
    },
    {
      name: 'Zelta horizonts',
      description: 'Silta vakara gaisma',
      chip: '#f2ad62',
      surfaceRGB: [20,13,7],
      image: 'kalendars/data/radio-skins/golden-horizon-2400x400.jpg',
      preview: 'kalendars/data/radio-skins/golden-horizon-preview.jpg',
      vars: {
        '--bg-color': '#0b0704',
        '--panel': '#171008',
        '--search-bar-bg': '#1e160e',
        '--search-border': 'rgba(242,173,98,.16)',
        '--search-hover': '#291d12'
      }
    },
    {
      name: 'Sarkanā vētra',
      description: 'Tumšs un dramatisks',
      chip: '#e33d35',
      surfaceRGB: [18,5,7],
      image: 'kalendars/data/radio-skins/red-storm-2400x400.jpg',
      preview: 'kalendars/data/radio-skins/red-storm-preview.jpg',
      vars: {
        '--bg-color': '#0b0304',
        '--panel': '#160708',
        '--search-bar-bg': '#1e0b0c',
        '--search-border': 'rgba(227,61,53,.16)',
        '--search-hover': '#2a0f11'
      }
    }
  ];

  [
    ['Pusnakts','Tumši zils miers','#729cde','linear-gradient(125deg,#172b46,#080f1d 65%,#21394e)'],
    ['Grafīts','Neitrāls un atturīgs','#b7c1c8','linear-gradient(135deg,#343b42,#101418 65%,#242d33)'],
    ['Dzintars','Maigs vakara siltums','#e5b67d','linear-gradient(125deg,#473420,#181411 65%,#372517)'],
    ['Jūras stikls','Mierīgi zaļi toņi','#8fd3bd','linear-gradient(125deg,#23473f,#0b1b1b 65%,#20403c)'],
    ['Plūme','Dziļš violets tonis','#c4a5d7','linear-gradient(125deg,#3c2c49,#16131e 65%,#30243b)'],
    ['Sudraba migla','Vēss un maigs','#c1d5de','linear-gradient(125deg,#4a5c68,#1b262d 65%,#364b57)']
  ].forEach(([name,description,chip,background])=>THEMES.push({name,description,chip,background,surfaceRGB:[9,16,21],vars:{}}));

  [
    ['Grieķu kolonnas','Akmens un silta gaisma','greek-columns','#c8b293'],
    ['Marmora seja','Tumšs antīkais portrets','marble-face','#c6bda5'],
    ['Antīkais marmors','Skulptūra melnā telpā','marble-bust','#c9c9c3'],
    ['Filozofs','Dramatiskas marmora ēnas','marble-shadow','#b4bac0'],
    ['Klusās arkas','Ritms un dziļas ēnas','stone-arches','#b5bfc6'],
    ['Saules galerija','Kolonnas un mierīgs pagalms','quiet-gallery','#d2b390'],
    ['Kāpu ēnas','Smilšu raksti un vakara gaisma','dune-shadows','#cba679'],
    ['Kalni miglā','Vēss akmens un mākoņi','mist-peaks','#97b8c4'],
    ['Pilsēta miglā','Kluss, sapņains siluets','fog-city','#9ab9a9'],
    ['Ziemeļblāzma','Nakts debesis un zaļa gaisma','aurora','#87c9b0']
  ].forEach(([name,description,file,chip])=>THEMES.push({name,description,chip,surfaceRGB:[8,14,18],vars:{},image:`kalendars/data/radio-skins/${file}.webp`,preview:`kalendars/data/radio-skins/${file}-preview.webp`}));

  THEMES.sort((a,b)=>Number(!!b.image?.endsWith('.webp'))-Number(!!a.image?.endsWith('.webp')));

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
        rw.style.setProperty('--radio-ambient-rgb', parseColorToRGBStr(theme?.chip || '#53c9e8'));
        __radioImageSkin = !!image;
        rw.classList.toggle('radio-image-skin', __radioImageSkin);
        rw.classList.toggle('radio-black-skin', !__radioImageSkin);
        rw.style.setProperty('background', solidWin, 'important');
        rw.style.setProperty(
          'background-image',
          image
            ? `linear-gradient(100deg, rgba(${rgb[0]},${rgb[1]},${rgb[2]},.94), rgba(${rgb[0]},${rgb[1]},${rgb[2]},.84) 58%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},.94)), url("${image}")`
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
        // Keep theme defaults separate from the user's spectrum window choice.
        el.style.setProperty('--radio-monitor-background', image ? 'rgba(0,0,0,.12)' : solidMonitor);
        el.style.setProperty('--radio-monitor-border', image ? 'rgba(var(--radio-accent-rgb,30,215,96),.13)' : border);
        el.style.setProperty('--radio-monitor-shadow', image ? 'none' : '0 12px 34px rgba(0,0,0,.28)');
        ['background','border-color','box-shadow'].forEach(property => el.style.removeProperty(property));
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
    __radioVizAccentRGB = rgb.split(',').map(Number);
    window.__radioVizAccentRGB = __radioVizAccentRGB;
    if (dGif) {
      const [r, g, b] = __radioVizAccentRGB.map(value => value / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      let hue = 0;
      if (delta) {
        if (max === r) hue = 60 * (((g - b) / delta) % 6);
        else if (max === g) hue = 60 * (((b - r) / delta) + 2);
        else hue = 60 * (((r - g) / delta) + 4);
      }
      if (hue < 0) hue += 360;
      dGif.style.filter = `grayscale(1) brightness(.8) sepia(1) saturate(3) hue-rotate(${Math.round(hue - 39)}deg)`;
      window.rgPioneer?.sync();
    }
    [
      document.getElementById('radioWindow'),
      document.getElementById('pioneerPicker'),
      document.getElementById('ceqPanel')
    ].filter(Boolean).forEach(target => {
      target.style.setProperty('--radio-accent', color);
      target.style.setProperty('--radio-accent-rgb', rgb);
    });
    accentEl.value = color;
  }

  function getSaved(){
    return {
      name: localStorage.getItem(STORAGE.name) || 'Dziļais okeāns',
      accent: localStorage.getItem(STORAGE.accent) || '#1ed760',
      accentMode: localStorage.getItem(STORAGE.accentMode) || 'album',
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
    const VER = '7';
    if (localStorage.getItem(VER_KEY) === VER) return;
    localStorage.setItem(VER_KEY, VER);
    localStorage.setItem(STORAGE.name, 'Dziļais okeāns');
    localStorage.setItem(STORAGE.accent, '#1ed760');
    localStorage.setItem(STORAGE.accentMode, 'album');
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
    rw.style.setProperty('--radio-ambient-rgb', parseColorToRGBStr(color));
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
        ? `linear-gradient(112deg, rgba(${r},${g},${b},.28), rgba(${base[0]},${base[1]},${base[2]},.86) 58%, rgba(${r},${g},${b},.17)), url("${image}")`
        : `linear-gradient(112deg, rgba(${r},${g},${b},.34), rgba(${dark[0]},${dark[1]},${dark[2]},.96) 72%)`,
      'important'
    );
    rw.style.setProperty('background-position', 'center', 'important');
    rw.style.setProperty('background-size', 'cover', 'important');
    rw.style.setProperty('background-repeat', 'no-repeat', 'important');
  }

  function applyAlbumColor(color){
    albumColor=color;
    applyAccent(color);
    applyAlbumSurface(color);
    paintAppearance();
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
    if (getSaved().accentMode !== 'album' && appearance.layout !== 'pioneer') return;
    const visibleCover = document.getElementById('npCover');
    const coverUrl = String(detail.coverUrl || visibleCover?.currentSrc || visibleCover?.src || '');
    const seed = `${detail.artist || ''}|${detail.title || ''}|${coverUrl}`;
    if (seed === lastAlbumAccentKey) return;
    lastAlbumAccentKey = seed;

    const fallback = () => {
      if ((getSaved().accentMode === 'album' || appearance.layout === 'pioneer') && seed === lastAlbumAccentKey) applyAlbumColor(safeColor(appearance.cardAccent,fallbackAlbumAccent(seed)));
    };
    if (!coverUrl) {
      fallback();
      return;
    }

    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.decoding = 'async';
    probe.onload = () => {
      if ((getSaved().accentMode !== 'album' && appearance.layout !== 'pioneer') || seed !== lastAlbumAccentKey) return;
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
    const nextMode = ['off', 'album', 'green', 'warm', 'ice', 'mono', 'custom', 'card'].includes(mode) ? mode : 'off';
    if (persist) {
      setEnabled(true);
      setSaved({ accentMode: nextMode });
    }
    setAccentModeActive(nextMode);
    if (nextMode === 'album' || appearance.layout === 'pioneer') {
      lastAlbumAccentKey = '';
      updateAlbumAccent({
        artist: document.getElementById('npArtist')?.textContent || '',
        title: document.getElementById('npTitle')?.textContent || '',
        coverUrl: document.getElementById('npCover')?.src || ''
      });
      return;
    }
    applyGlassIntensity(0, findTheme(getSaved().name));
    applyAccent(nextMode === 'card' ? safeColor(appearance.cardAccent,'#53c9e8') : nextMode === 'custom' ? getSaved().accent : (nextMode === 'off' ? '#1ed760' : FIXED_ACCENTS[nextMode]));
    paintAppearance();
  }

  document.addEventListener('rg-now-playing-art', event => updateAlbumAccent(event.detail || {}));

  function findTheme(name){
    if(name==='Mana kartīte')return {...THEMES[0],name,chip:safeColor(appearance.cardAccent,'#53c9e8')};
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
    paintAppearance();
  }

  function highlightActive(name){
    [...listEl.querySelectorAll('.theme-item')].forEach(el => {
      const active = el.dataset.name === name;
      el.classList.toggle('active', active);
      el.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    syncCardChoice();
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
      row.dataset.category = t.image ? 'photos' : 'colors';
      const previewAsset = t.preview || t.image;
      const previewUrl = previewAsset ? new URL(previewAsset, document.baseURI).href : '';
      row.style.setProperty('--theme-preview',t.background||'linear-gradient(#16211d,#070b09)');
      row.innerHTML = `
        <span class="theme-card-shade"></span>
        <span class="theme-card-copy">
          <strong>${t.name}</strong>
          <small>${t.description}</small>
        </span>
        <span class="theme-check" aria-hidden="true">✓</span>
      `;
      if(previewUrl){const img=document.createElement('img');img.className='theme-photo';img.alt='';img.loading='lazy';img.decoding='async';img.width=480;img.height=96;img.src=previewUrl;row.prepend(img);}
      row.addEventListener('click', (e)=>{
        e.stopPropagation();
        setEnabled(true);
        setSaved({
          name: t.name,
          accentMode: getSaved().accentMode
        });
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
    // Measure after applying the new constraints. A short-to-tall resize used
    // the old panel height, then expanded it below the bottom of the screen.
    const availableHeight = Math.max(100, Math.min(900, window.innerHeight - 24));
    panel.style.maxHeight = availableHeight + 'px';
    const ph = Math.min(panel.getBoundingClientRect().height || 520, availableHeight);
    const bottom = Math.min((radioRect?.top || window.innerHeight) - 12, window.innerHeight - 12);
    const top = Math.max(12, bottom - ph);
    panel.style.left = Math.max(12, (window.innerWidth - pw) / 2) + 'px';
    panel.style.top = top + 'px';
  }

  function openPanel(){
    spectrumMoveEnabled=false;spectrumDrag=null;
    lookVizFamily=null;lookPioneerBefore=localStorage.getItem('mkRadioPioneer')||'original';
    lookBefore=lookSnapshot();
    imageCropDraft={...appearance.imageCrops};
    buildLookControls();
    syncLookControls();
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    renderList();
    setAccentModeActive(getSaved().accentMode);
    requestAnimationFrame(()=>{positionPanel();syncLayoutPreview();paintImagePosition();});
  }
  function closePanel(){
    imageCropDraft=null;imageDrag=null;spectrumMoveEnabled=false;spectrumDrag=null;
    if(lookBefore){const previous=lookBefore;lookBefore=null;if(window.rgPioneer&&localStorage.getItem('mkRadioPioneer')!==lookPioneerBefore)window.rgPioneer.select(lookPioneerBefore);lookVizFamily=null;applyLookSettings(previous);}
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
  }

  // Image framing is part of the shared profile. Read the old device store only for migration.
  const IMAGE_CROP_KEY='rg_radio_image_crop_v1';
  function cleanImageCrop(value){
    if(!value||![value.x,value.y,value.zoom].every(Number.isFinite))return null;
    return {x:clamp(value.x,-.75,.75),y:clamp(value.y,-2,2),zoom:clamp(value.zoom,.6,2)};
  }
  function readImageCrops(){
    try{const data=JSON.parse(localStorage.getItem(IMAGE_CROP_KEY)||'{}');return Object.fromEntries(Object.entries(data).slice(-100).filter(([key,value])=>key.length<2000&&cleanImageCrop(value)).map(([key,value])=>[key,cleanImageCrop(value)]));}catch(_){return {};}
  }
  function stableImageKey(source){
    try{const url=new URL(source,document.baseURI),start=url.pathname.indexOf('/kalendars/');return start<0?'':url.pathname.slice(start+1);}catch(_){return '';}
  }
  function cleanImageCrops(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    return Object.fromEntries(Object.entries(value).filter(([key,crop])=>key.startsWith('kalendars/')&&key.length<=500&&cleanImageCrop(crop)).slice(-32).map(([key,crop])=>[key,cleanImageCrop(crop)]));
  }
  function legacyImageCrops(owner){
    const result={};for(const [key,crop] of Object.entries(readImageCrops())){try{const [person,source]=JSON.parse(key),image=stableImageKey(source);if(person===owner&&image)result[image]=crop;}catch(_){}}
    return cleanImageCrops(result);
  }
  let imageCropDraft=null,imageDrag=null,imageSource='',imageMetrics=null,imageLoading='';
  const imageSizes=new Map();
  function imageCropKey(){return stableImageKey(imageSource);}
  function imageGeometry(width,height,naturalWidth,naturalHeight,crop,position='center'){
    const scale=Math.max(width/naturalWidth,height/naturalHeight),zoom=crop?.zoom||1;
    const w=naturalWidth*scale*zoom,h=naturalHeight*scale*zoom;
    const limitX=(w/width+1)/2-Math.min(w/width,1)*.25,limitY=(h/height+1)/2-Math.min(h/height,1)*.25;
    const x=clamp(crop?.x??(position==='left'?(w-width)/(2*width):position==='right'?(width-w)/(2*width):0),-limitX,limitX);
    const y=clamp(crop?.y??(position==='top'?(h-height)/(2*height):position==='bottom'?(height-h)/(2*height):0),-limitY,limitY);
    return {width:w,height:h,left:(width-w)/2+x*width,top:(height-h)/2+y*height,x,y,zoom};
  }
  function currentImageCrop(){
    const rw=document.getElementById('radioWindow'),r=rw?.getBoundingClientRect?.();
    if(!r?.width||!r.height||!imageMetrics)return null;
    return imageGeometry(r.width,r.height,imageMetrics.width,imageMetrics.height,(imageCropDraft||appearance.imageCrops)[imageCropKey()],appearance.position);
  }
  function paintImagePosition(){
    const rw=document.getElementById('radioWindow'),preview=document.getElementById('radioLookPreview'),tools=document.getElementById('radioImageTools');
    const geometry=currentImageCrop(),enabled=appearance.layout!=='pioneer'&&!!imageSource;
    if(tools)tools.hidden=!enabled;
    if(preview){preview.classList.toggle('is-positionable',enabled&&!!geometry);preview.tabIndex=spectrumMoveEnabled||(enabled&&geometry)?0:-1;}
    const slider=document.getElementById('radioImageZoom'),reset=document.getElementById('radioImageReset'),hint=document.getElementById('radioImageHint');
    if(slider){slider.disabled=!geometry;slider.value=Math.round((geometry?.zoom||1)*100);document.getElementById('radioImageZoomValue').textContent=slider.value+'%';}
    if(reset)reset.disabled=!geometry;
    if(hint)hint.textContent=geometry?(window.__mkUnifiedMedia?.getSession()?'Velc attēlu priekšskatījumā. Saglabājas tavā profilā visās ierīcēs.':'Velc attēlu priekšskatījumā. Ielogojies, lai saglabātu visās ierīcēs.'):'Ielādē attēlu…';
    if(!enabled||!geometry||!rw)return;
    const r=rw.getBoundingClientRect();
    for(const el of [rw,preview]){
      if(!el)continue;
      const ratio=el===rw?1:el.getBoundingClientRect().width/r.width;if(!ratio)continue;
      el.style.setProperty('background-size',`100% 100%,100% 100%,${geometry.width*ratio}px ${geometry.height*ratio}px`,'important');
      el.style.setProperty('background-position',`center,center,${geometry.left*ratio}px ${geometry.top*ratio}px`,'important');
      el.style.setProperty('background-repeat','no-repeat','important');
      el.style.setProperty('background-color','#0a1015','important');
    }
  }
  function prepareImagePosition(background){
    const url=appearance.layout==='pioneer'?'':background.match(/^url\("([^"]+)"\)$/)?.[1]||'';
    imageSource=url;imageMetrics=imageSizes.get(url)||null;
    if(url&&!imageMetrics&&imageLoading!==url&&typeof Image==='function'){
      imageLoading=url;const img=new Image();img.decoding='async';
      img.onload=()=>{if(img.naturalWidth&&img.naturalHeight){imageSizes.set(url,{width:img.naturalWidth,height:img.naturalHeight});if(imageSizes.size>24)imageSizes.delete(imageSizes.keys().next().value);}if(imageSource===url){imageMetrics=imageSizes.get(url);paintImagePosition();}if(imageLoading===url)imageLoading='';};
      img.onerror=()=>{if(imageLoading===url)imageLoading='';if(imageSource===url){const hint=document.getElementById('radioImageHint');if(hint)hint.textContent='Attēlu neizdevās ielādēt.';}};
      img.src=url;
    }
    paintImagePosition();
  }
  function changeImageCrop(value){
    if(!imageCropDraft||!imageSource)return;
    imageCropDraft[imageCropKey()]=cleanImageCrop(value);paintImagePosition();
  }
  function cleanVizPositions(value){
    const result={};
    for(const layout of ['classic','clean','pioneer']){
      const point=value?.[layout];if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y))result[layout]={x:clamp(point.x,-1,1),y:clamp(point.y,-1,1)};
    }
    return result;
  }
  function placeSpectrum(){
    const rw=document.getElementById('radioWindow'),monitor=rw?.querySelector?.('.monitor-frame');
    if(!monitor||!rw.getBoundingClientRect)return;
    monitor.style.removeProperty('translate');
    const frame=rw.getBoundingClientRect(),box=monitor.getBoundingClientRect();if(!frame.width||!frame.height)return;
    const boundary=(appearance.layout==='pioneer'?rw.querySelector('.pioneer-display'):rw).getBoundingClientRect();
    const point=appearance.vizPositions?.[appearance.layout]||{x:0,y:0};
    const x=clamp(point.x*frame.width,Math.min(0,boundary.left+6-box.left),Math.max(0,boundary.right-6-box.right));
    const y=clamp(point.y*frame.height,Math.min(0,boundary.top+6-box.top),Math.max(0,boundary.bottom-6-box.bottom));
    monitor.style.setProperty('translate',`${x}px ${y}px`,'important');
    window.rgPioneerLayout?.syncMatrix?.();
    return {x:x/frame.width,y:y/frame.height};
  }
  function changeSpectrumPosition(point){
    appearance.vizPositions={...appearance.vizPositions,[appearance.layout]:{x:clamp(point.x,-1,1),y:clamp(point.y,-1,1)}};
    const actual=placeSpectrum();if(actual)appearance.vizPositions[appearance.layout]=actual;
    syncLayoutPreview();
  }
  function syncSpectrumMoveControls(){
    const preview=document.getElementById('radioLookPreview'),toggle=document.getElementById('radioMoveSpectrum');
    if(!preview||!toggle)return;
    toggle.setAttribute('aria-pressed',String(spectrumMoveEnabled));
    preview.classList.toggle('is-spectrum-positionable',spectrumMoveEnabled);
    const hint=document.getElementById('radioSpectrumMoveHint');
    if(hint)hint.textContent=spectrumMoveEnabled?'Velc spektru priekšskatījumā. Fons šajā režīmā paliek savā vietā.':'Ieslēdz, lai priekšskatījumā pārvietotu spektru.';
    preview.setAttribute('aria-label',spectrumMoveEnabled?'Spektra novietojums. Velc vai lieto bulttaustiņus.':appearance.layout==='pioneer'?'Pioneer atskaņotāja priekšskatījums.':'Fona attēla novietojums. Velc attēlu vai lieto bulttaustiņus.');
    if(spectrumMoveEnabled)preview.tabIndex=0;
  }
  function wireImagePosition(){
    const preview=document.getElementById('radioLookPreview'),slider=document.getElementById('radioImageZoom');
    preview.addEventListener('pointerdown',event=>{
      if(spectrumMoveEnabled){
        if(event.button!==0||vizStyle===MK_NO_VIZ)return;
        const rect=preview.getBoundingClientRect(),point=placeSpectrum()||{x:0,y:0};
        spectrumDrag={id:event.pointerId,x:event.clientX,y:event.clientY,width:rect.width,height:rect.height,point};
        preview.setPointerCapture(event.pointerId);event.preventDefault();preview.focus({preventScroll:true});return;
      }
      const crop=currentImageCrop();if(event.button!==0||!crop||!imageSource)return;
      const rect=preview.getBoundingClientRect();
      imageDrag={id:event.pointerId,key:imageCropKey(),x:event.clientX,y:event.clientY,width:rect.width,height:rect.height,crop};
      preview.setPointerCapture(event.pointerId);preview.classList.add('is-dragging');event.preventDefault();preview.focus({preventScroll:true});
    });
    preview.addEventListener('pointermove',event=>{
      if(spectrumMoveEnabled){
        const drag=spectrumDrag;if(drag?.id===event.pointerId)changeSpectrumPosition({x:drag.point.x+(event.clientX-drag.x)/drag.width,y:drag.point.y+(event.clientY-drag.y)/drag.height});return;
      }
      if(!imageDrag||imageDrag.id!==event.pointerId||imageDrag.key!==imageCropKey())return;
      const drag=imageDrag;
      changeImageCrop({x:drag.crop.x+(event.clientX-drag.x)/drag.width,y:drag.crop.y+(event.clientY-drag.y)/drag.height,zoom:drag.crop.zoom});
    });
    const end=()=>{imageDrag=null;spectrumDrag=null;preview.classList.remove('is-dragging');};
    preview.addEventListener('pointerup',end);preview.addEventListener('pointercancel',end);preview.addEventListener('lostpointercapture',end);
    preview.addEventListener('keydown',event=>{
      if(spectrumMoveEnabled){
        const step=event.shiftKey?.05:.01,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];
        if(delta||event.key==='Home'){event.preventDefault();const point=placeSpectrum()||{x:0,y:0};changeSpectrumPosition(event.key==='Home'?{x:0,y:0}:{x:point.x+delta[0],y:point.y+delta[1]});}return;
      }
      const crop=currentImageCrop();if(!crop||!imageSource)return;
      const step=event.shiftKey?.05:.01,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];
      if(!delta&&event.key!=='Home')return;event.preventDefault();
      changeImageCrop(event.key==='Home'?{x:0,y:0,zoom:1}:{x:crop.x+delta[0],y:crop.y+delta[1],zoom:crop.zoom});
    });
    slider.addEventListener('input',()=>{const crop=currentImageCrop();if(crop)changeImageCrop({x:crop.x,y:crop.y,zoom:Number(slider.value)/100});});
    document.getElementById('radioImageReset').onclick=()=>changeImageCrop({x:0,y:0,zoom:1});
  }

  const LOOK_KEY='rg_radio_appearance_v1';
  const LOOK_DEFAULTS={darkness:64,tint:28,glass:24,glow:45,layout:'classic',metalColor:'#9ca4aa',metalLight:50,metalShine:65,pioneerPixels:false,vizFrame:'auto',position:'center',text:'#f3f7f5',background:'',cardName:'',imageCrops:{},vizPositions:{}};
  let appearance;try{appearance={...LOOK_DEFAULTS,...JSON.parse(localStorage.getItem(LOOK_KEY)||'{}')};}catch(_){appearance={...LOOK_DEFAULTS};}
  appearance.imageCrops=cleanImageCrops(appearance.imageCrops);
  appearance.vizPositions=cleanVizPositions(appearance.vizPositions);
  let spectrumMoveEnabled=false,spectrumDrag=null;
  let lookVizFamily=null,lookPioneerBefore='original';
  let lookBefore=null,albumColor='#53c9e8',applyingProfile=false;
  const safeColor=(value,fallback='#f3f7f5')=>/^#[\da-f]{6}$/i.test(value||'')?value:fallback;
  function safeBackground(value){
    if(typeof value!=='string'||value.length>1600)return '';
    if(/^linear-gradient\([\w\s.,%#()+-]+\)$/.test(value)&&CSS.supports('background-image',value))return value;
    const m=value.match(/^url\("([^"]+)"\)$/);if(m){try{const u=new URL(m[1],location.href);if(u.origin===location.origin&&u.pathname.includes('/kalendars/')&&!/[\n\r]/.test(value))return `url("${u.href}")`;}catch(_){}}
    return '';
  }
  function paintAppearance(){
    const rw=document.getElementById('radioWindow');if(!rw)return;
    rw.dataset.radioLayout=['classic','clean','pioneer'].includes(appearance.layout)?appearance.layout:'classic';
    rw.dataset.vizFrame=['on','off'].includes(appearance.vizFrame)?appearance.vizFrame:'auto';
    const lookButton=document.getElementById('themeBtn');
    if(lookButton){const home=rw.querySelector(rw.dataset.radioLayout==='pioneer'?'.bottom-console':rw.dataset.radioLayout==='clean'?'.control-panel':'.tech-panel .branding');if(home&&lookButton.parentElement!==home)home.prepend(lookButton);}
    const saved=getSaved(),theme=findTheme(saved.name);
    const background=saved.name==='Mana kartīte'?safeBackground(appearance.background):(theme.image?`url("${new URL(theme.image,document.baseURI).href}")`:theme.background||'');
    const color=(appearance.layout==='pioneer'||saved.accentMode==='album')?albumColor:saved.accentMode==='card'?safeColor(appearance.cardAccent,'#53c9e8'):saved.accentMode==='custom'?saved.accent:(FIXED_ACCENTS[saved.accentMode]||theme.chip);
    const rgb=parseColorToRGBStr(color),dark=clamp(Number(appearance.darkness)/100,.30,.92),tint=clamp(Number(appearance.tint)/100,0,.65),glass=clamp(Number(appearance.glass)/100,0,1);
    rw.style.setProperty('background-image',`linear-gradient(to top,rgba(6,13,19,.8),rgba(6,13,19,0) 24px),linear-gradient(110deg,rgba(${rgb},${tint}),rgba(4,9,13,${dark}) 62%),${background||'linear-gradient(#0a1419,#0a1419)'}`,'important');
    if(appearance.layout==='pioneer'){
      rw.style.removeProperty('background');rw.style.removeProperty('background-image');
      if(__radioVizAccentRGB.join(',')!==rgb)applyAccent(color);
    }
    window.rgPioneerLayout?.apply(rw,appearance);
    rw.style.setProperty('background-position',['left','center','right','top','bottom'].includes(appearance.position)?appearance.position:'center','important');
    rw.style.setProperty('background-size','cover','important');
    if(appearance.layout==='pioneer'){['border-color','border-top-color','box-shadow'].forEach(p=>rw.style.removeProperty(p));}
    else{rw.style.setProperty('border-color','transparent','important');
    rw.style.setProperty('border-top-color',`rgba(225,239,246,${glass*.42})`,'important');
    rw.style.setProperty('box-shadow',`inset 0 ${glass*2}px ${glass*12}px rgba(224,243,255,${glass*.22}),0 8px 24px rgba(0,0,0,.16)`,'important');
    }
    // A restrained text fallback keeps names legible on the dark overlay.
    const text=safeColor(appearance.text),v=parseColorToRGBStr(text).split(',').map(Number);
    rw.style.setProperty('--radio-personal-text',(.2126*v[0]+.7152*v[1]+.0722*v[2])<150?'#f3f7f5':text);
    const strength=clamp(Number(appearance.glow)/100,0,1);document.documentElement.style.setProperty('--radio-glow-strength',String(strength));
    rw.style.setProperty('--radio-glow-strength',String(strength));
    const preview=document.getElementById('radioLookPreview');if(preview){preview.style.backgroundImage=appearance.layout==='pioneer'?getComputedStyle(rw).backgroundImage:rw.style.backgroundImage;preview.style.setProperty('background-position',rw.style.backgroundPosition,'important');preview.style.setProperty('background-size','cover','important');preview.style.color=rw.style.getPropertyValue('--radio-personal-text');preview.style.setProperty('--radio-preview-accent',color);preview.style.boxShadow=rw.style.getPropertyValue('box-shadow');renderLookPreviews();syncLayoutPreview();}
    prepareImagePosition(background);placeSpectrum();syncSpectrumMoveControls();
    const displayControls=document.getElementById('pioneerDisplayControls');
    if(displayControls){displayControls.hidden=appearance.layout!=='pioneer';document.getElementById('pioneerPixelGrid').setAttribute('aria-checked',String(appearance.pioneerPixels===true));}
    const metalControls=document.getElementById('pioneerMetalControls');
    if(metalControls){metalControls.hidden=appearance.layout!=='pioneer';metalControls.querySelectorAll('[data-metal-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.metalColor===appearance.metalColor)));for(const input of metalControls.querySelectorAll('[data-look]'))input.value=appearance[input.dataset.look]??LOOK_DEFAULTS[input.dataset.look];}
    const themePanel=document.getElementById('themePanel');
    if(themePanel)themePanel.dataset.radioLayout=rw.dataset.radioLayout;
    const framed=appearance.vizFrame==='on'||(appearance.vizFrame!=='off'&&!isModernViz(vizStyle));
    themePanel?.querySelectorAll('[data-viz-frame-choice]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.vizFrameChoice==='on')===framed)));
    themePanel?.querySelectorAll('[data-radio-layout-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.radioLayoutChoice===rw.dataset.radioLayout)));
    const family=lookVizFamily||(vizStyle===5?'pioneer':vizFamily);
    themePanel?.querySelectorAll('[data-viz-choice]').forEach(b=>{const idx=Number(b.dataset.vizChoice);b.setAttribute('aria-pressed',String(idx===vizStyle||(vizStyle===MK_FLOW_VIZ&&idx===24)));b.hidden=idx!==MK_NO_VIZ&&(family==='pioneer'||isModernViz(idx)!==(family==='new'));});
    themePanel?.querySelectorAll('[data-viz-family]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vizFamily===family)));
    const gallery=themePanel?.querySelector('[data-pioneer-gallery]');
    if(gallery){gallery.hidden=family!=='pioneer';if(!gallery.hidden)void ensurePioneerPlayer().then(player=>player.mountGallery(gallery,()=>{lookVizFamily='pioneer';paintAppearance();})).catch(()=>{gallery.textContent='Neizdevās ielādēt Pioneer. Atver cilni vēlreiz.';});}
    const familyNote=themePanel?.querySelector('.radio-viz-choices .radio-viz-family-note');if(familyNote)familyNote.textContent=family==='pioneer'?'Pioneer animācijas un audio indikatori.':family==='new'?'Gludas formas. Ātra reakcija uz mūziku.':'Iepriekšējie efekti, delfīni un Buddy.';
  }
  function lookSnapshot(){const s=getSaved();return {...appearance,theme:s.name,accent:s.accent,accentMode:s.accentMode,eq:window.__eqMode||'none',viz:String(vizStyle)};}
  const GUEST_LOOK_KEY='rg_radio_guest_look_v1';
  function storedGuestLook(){
    try{const value=JSON.parse(localStorage.getItem(GUEST_LOOK_KEY)||'null');return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}catch(_){return null;}
  }
  function captureGuestLook(){
    const value=storedGuestLook()||lookSnapshot();
    try{localStorage.setItem(GUEST_LOOK_KEY,JSON.stringify(value));}catch(_){}
    return value;
  }
  function restoreGuestLook(fallback){
    const value=storedGuestLook()||fallback;
    if(value)applyLookSettings(value);
    try{localStorage.removeItem(GUEST_LOOK_KEY);}catch(_){}
  }
  function applyLookSettings(data={}){
    applyingProfile=true;
    appearance={...LOOK_DEFAULTS,...data,background:safeBackground(data.background),imageCrops:cleanImageCrops(data.imageCrops),vizPositions:cleanVizPositions(data.vizPositions)};
    appearance.layout=['classic','clean','pioneer'].includes(data.layout)?data.layout:'classic';
    appearance.vizFrame=['on','off'].includes(data.vizFrame)?data.vizFrame:'auto';
    appearance.metalColor=safeColor(data.metalColor,LOOK_DEFAULTS.metalColor);
    appearance.pioneerPixels=data.pioneerPixels===true;
    for(const key of ['metalLight','metalShine'])appearance[key]=clamp(Number.isFinite(Number(data[key]))?Number(data[key]):LOOK_DEFAULTS[key],0,100);
    for(const key of ['darkness','tint','glass','glow'])appearance[key]=clamp(Number(appearance[key])||0,0,100);
    localStorage.setItem(LOOK_KEY,JSON.stringify(appearance));
    setSaved({name:data.theme||'Dziļais okeāns',accent:safeColor(data.accent,'#1ed760'),accentMode:data.accentMode||'album',enabled:true});
    if(/^(none|bass|bassplus|clear|studio|radio|chill|depth|lofi)$/.test(data.eq||'')){window.__eqMode=data.eq;if(lowNode)setEQ(data.eq);}
    if(/^\d+$/.test(data.viz||''))setVizStyle(Number(data.viz));
    applyTheme(getSaved().name);paintAppearance();applyingProfile=false;
  }
  function vizPreviewSource(mode){
    return `kalendars/data/radio-viz/${mode===MK_FLOW_VIZ?24:mode}.webp?v=${mode===5?'20260908d1':'20260908c2'}`;
  }
  function vizPreview(mode){
    if(mode===MK_NO_VIZ)return '';
    return `<img class="radio-viz-thumbnail" src="${vizPreviewSource(mode)}" width="600" height="80" loading="lazy" decoding="async" alt="" aria-hidden="true">`;
  }
  function renderLookPreviews(){
    const preview=document.getElementById('radioLookVizImage');if(!preview)return;
    preview.hidden=vizStyle===MK_NO_VIZ;
    const sample=preview.parentElement,modern=isModernViz(vizStyle);
    sample.classList.toggle('is-modern',modern&&!preview.hidden);
    sample.classList.toggle('has-frame',!preview.hidden&&(appearance.vizFrame==='on'||(appearance.vizFrame!=='off'&&!modern)));
    if(!preview.hidden){const src=vizPreviewSource(vizStyle);if(preview.getAttribute('src')!==src)preview.src=src;sample.style.setProperty('--viz-preview-mask',modern?`url("${new URL(src,document.baseURI).href}")`:'none');}else sample.style.setProperty('--viz-preview-mask','none');
  }
  function syncLayoutPreview(){
    const rw=document.getElementById('radioWindow'),preview=document.getElementById('radioLookPreview');
    if(!rw||!preview||!panel.classList.contains('open'))return;
    const rect=rw.getBoundingClientRect();if(!rect.width||!rect.height)return;
    placeSpectrum();syncSpectrumMoveControls();
    preview.style.aspectRatio=`${rect.width} / ${rect.height}`;
    preview.dataset.layout=['classic','clean','pioneer'].includes(appearance.layout)?appearance.layout:'classic';
    if(appearance.layout==='pioneer'){window.rgPioneerLayout?.renderPreview(preview);return;}
    preview.querySelector('.pioneer-real-preview')?.remove();
    const station=preview.querySelector('.radio-preview-station');
    if(station)station.textContent=document.getElementById('curStation')?.textContent||'Radio';
    // Match the displayed monitor rectangle, including the chosen layout.
    const monitor=rw.querySelector('.monitor-frame')?.getBoundingClientRect(),sample=preview.querySelector('.radio-viz-sample');
    if(monitor&&sample){sample.style.left=((monitor.left-rect.left)/rect.width*100)+'%';sample.style.top=((monitor.top-rect.top)/rect.height*100)+'%';sample.style.width=(monitor.width/rect.width*100)+'%';sample.style.height=(monitor.height/rect.height*100)+'%';}
  }
  function buildLookControls(){
    if(document.getElementById('radioLookControls'))return;
    const box=document.createElement('section');box.id='radioLookControls';box.innerHTML=`
      <button type="button" id="radioUseCard">Kā mana kartīte</button><p id="radioLookNote" role="status">Fons paliek tavs. Albuma režīmā krāsa mainās līdzi mūzikai.</p>
      <fieldset class="radio-layout-choices"><legend>Izkārtojums</legend><div class="radio-viz-families"><button type="button" data-radio-layout-choice="classic" aria-pressed="true">Pašreizējais</button><button type="button" data-radio-layout-choice="clean" aria-pressed="false">Jauns izkārtojums</button><button type="button" data-radio-layout-choice="pioneer" aria-pressed="false">Pioneer</button></div><p class="radio-viz-family-note">Jaunajā izkārtojumā pogas ir pa kreisi un spektrs pa labi.</p></fieldset>
      <div id="radioLookPreview" role="group" aria-label="Fona attēla novietojums. Velc attēlu vai lieto bulttaustiņus." aria-describedby="radioImageHint"><div class="radio-preview-copy"><strong class="radio-preview-station">Radio</strong><span>Tava mūzika</span></div><div class="radio-preview-toolbar" aria-hidden="true">◉ &nbsp; RADIO &nbsp; MŪZIKA</div><div class="radio-preview-buttons" aria-hidden="true">▣ &nbsp; ♫ &nbsp; ◀ &nbsp; <b>▶</b> &nbsp; ▶ &nbsp; ━━</div><div class="radio-viz-sample"><img id="radioLookVizImage" width="600" height="80" decoding="async" alt="Izvēlētās vizualizācijas momentuzņēmums"></div></div>
      <div class="radio-spectrum-position"><button type="button" id="radioMoveSpectrum" aria-pressed="false">Pārvietot spektru</button><button type="button" id="radioResetSpectrum">Atiestatīt pozīciju</button><div id="pioneerDisplayControls" hidden><button type="button" id="pioneerPixelGrid" role="switch" aria-checked="false" title="OEL pikseļu matrica"><span>Pikseļu matrica</span><i aria-hidden="true"></i></button></div><p id="radioSpectrumMoveHint">Ieslēdz, lai priekšskatījumā pārvietotu spektru.</p></div>
      <fieldset id="pioneerMetalControls" hidden><legend>Pioneer korpuss</legend><p>Metāla tonis korpusam un pogām. Displeja izgaismojums seko albumam.</p><div class="pioneer-metal-presets">${(window.rgPioneerLayout?.finishes||[]).map(f=>`<button type="button" data-metal-color="${f.color}" style="--metal-swatch:${f.color}" aria-pressed="false"><i aria-hidden="true"></i><span>${f.name}</span></button>`).join('')}</div><div class="pioneer-metal-custom"><label>Sava krāsa<input type="color" data-look="metalColor" aria-label="Korpusa krāsa"></label><label>Gaišums<input type="range" min="0" max="100" data-look="metalLight"></label><label>Spīdums<input type="range" min="0" max="100" data-look="metalShine"></label><button type="button" id="pioneerMetalReset">Atiestatīt metālu</button></div></fieldset>
      <div id="radioImageTools" class="radio-image-tools" hidden><p id="radioImageHint">Velc attēlu priekšskatījumā.</p><div><label for="radioImageZoom">Attēla izmērs</label><input id="radioImageZoom" type="range" min="60" max="200" step="1" value="100"><output id="radioImageZoomValue" for="radioImageZoom">100%</output><button type="button" id="radioImageReset">Atiestatīt</button></div></div>
      <fieldset class="radio-viz-choices"><legend>Vizualizācija</legend><div class="radio-viz-families"><button type="button" data-viz-family="new">Jaunais skats</button><button type="button" data-viz-family="classic">Classic</button><button type="button" data-viz-family="pioneer">Pioneer</button></div><p class="radio-viz-family-note"></p><div data-pioneer-gallery hidden></div><div class="radio-viz-grid">${[...VIZ_MODES.filter(m=>m.idx!==MK_NO_VIZ),getVizMode(MK_NO_VIZ)].map(m=>`<button type="button" data-viz-choice="${m.idx}" aria-pressed="false">${vizPreview(m.idx)}<span>${m.label}</span></button>`).join('')}</div></fieldset>
      <fieldset class="radio-layout-choices"><legend>Spektra logs</legend><div class="radio-viz-families"><button type="button" data-viz-frame-choice="off">Bez loga</button><button type="button" data-viz-frame-choice="on">Ar logu</button></div></fieldset>
      <div class="radio-clean-actions"><button type="button" id="radioEffectsOff">Izslēgt visus efektus</button><button type="button" id="radioBackgroundOff">Bez fona attēla</button></div>
      <details><summary>Pielāgot vairāk</summary>
       <label data-radio-background-only>Fona tumšums<input type="range" min="30" max="92" data-look="darkness"></label>
       <label data-radio-background-only>Krāsas pārklājums<input type="range" min="0" max="65" data-look="tint"></label>
       <label>Stikla maliņa<input type="range" min="0" max="100" data-look="glass"></label>
       <label>Apkārtējā gaisma<input type="range" min="0" max="100" data-look="glow"></label>
       <label>Burtu krāsa<input type="color" data-look="text"></label>
      </details><div class="radio-look-actions"><button type="button" id="radioLookReset">Atiestatīt izskatu</button><button type="button" id="radioLookCancel">Atcelt</button><button type="button" id="radioLookApply">Lietot</button></div>`;
    panel.append(box);
    if(typeof ResizeObserver==='function')new ResizeObserver(()=>{placeSpectrum();syncLayoutPreview();paintImagePosition();}).observe(document.getElementById('radioWindow'));
    const footer=box.querySelector('.radio-look-actions');
    const scroll=document.createElement('div');scroll.className='radio-theme-scroll';
    const filters=document.createElement('div');filters.className='radio-theme-filters';filters.setAttribute('aria-label','Fonu veids');
    filters.innerHTML='<button type="button" data-theme-filter="all" aria-pressed="true">Visi foni</button><button type="button" data-theme-filter="photos" aria-pressed="false">Attēli</button><button type="button" data-theme-filter="colors" aria-pressed="false">Vienkārši toņi</button>';
    filters.addEventListener('click',e=>{const b=e.target.closest('[data-theme-filter]');if(!b)return;filters.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));listEl.querySelectorAll('.theme-item').forEach(x=>x.hidden=b.dataset.themeFilter!=='all'&&x.dataset.category!==b.dataset.themeFilter);});
    const displayOptions=document.createElement('div');displayOptions.className='radio-display-options';
    displayOptions.append(box.querySelector('[data-radio-layout-choice]').closest('fieldset'),box.querySelector('[data-viz-frame-choice]').closest('fieldset'));
    box.prepend(displayOptions);
    box.querySelector('#radioImageTools').after(filters,listEl,panel.querySelector('.theme-controls'));
    wireImagePosition();
    if(typeof ResizeObserver==='function')new ResizeObserver(()=>{paintImagePosition();syncLayoutPreview();}).observe(box.querySelector('#radioLookPreview'));
    scroll.append(box);panel.append(scroll,footer);
    const quick=box.querySelector('#radioUseCard');quick.className='radio-card-shortcut';panel.insertBefore(quick,scroll);
    quick.innerHTML='<span class="radio-card-preview" aria-hidden="true"><span class="radio-card-emoji"></span></span><span class="radio-card-copy"><strong>Mana kartīte</strong><span class="radio-card-owner"></span><small class="radio-card-hint"></small></span><span class="radio-card-check" aria-hidden="true">✓</span>';
    const cardMode=document.createElement('button');cardMode.type='button';cardMode.dataset.accentMode='card';cardMode.innerHTML='<b>Kartītes krāsas</b><small>Nemainīgas</small>';accentModeEl.append(cardMode);
    const customMode=document.createElement('button');customMode.type='button';customMode.dataset.accentMode='custom';customMode.innerHTML='<b>Sava krāsa</b><small>Izvēlies toni</small>';accentModeEl.append(customMode);
    const more=document.createElement('details');more.className='radio-more-colors';const summary=document.createElement('summary');summary.textContent='Vēl krāsu režīmi';more.append(summary);
    ['off','green','warm','ice','mono'].forEach(mode=>{const b=accentModeEl.querySelector('[data-accent-mode="'+mode+'"]');if(b)more.append(b);});accentModeEl.append(more);

    box.addEventListener('input',e=>{
      const key=e.target.dataset.look;if(!key)return;
      appearance[key]=e.target.type==='range'?Number(e.target.value):e.target.value;
      if(key==='viz')setVizStyle(Number(e.target.value));
      paintAppearance();
    });
    box.querySelectorAll('[data-metal-color]').forEach(button=>button.onclick=()=>{appearance.metalColor=button.dataset.metalColor;paintAppearance();});
    document.getElementById('radioMoveSpectrum').onclick=()=>{spectrumMoveEnabled=!spectrumMoveEnabled;imageDrag=null;spectrumDrag=null;paintImagePosition();syncSpectrumMoveControls();};
    document.getElementById('radioResetSpectrum').onclick=()=>changeSpectrumPosition({x:0,y:0});
    document.getElementById('pioneerPixelGrid').onclick=()=>{appearance.pioneerPixels=appearance.pioneerPixels!==true;paintAppearance();};
    document.getElementById('pioneerMetalReset').onclick=()=>{for(const key of ['metalColor','metalLight','metalShine'])appearance[key]=LOOK_DEFAULTS[key];paintAppearance();};
    document.getElementById('radioUseCard').onclick=()=>{
      const person=window.__mkUnifiedMedia?.getSession();if(!person){closePanel();window.__mkUnifiedMedia?.open();return;}
      let skin;try{skin=document.getElementById('calIframe')?.contentWindow?.mkGetRadioSkin?.(person.name);}catch(_){}
      if(!skin||!safeBackground(skin.background)){document.getElementById('radioLookNote').textContent='Vispirms izvēlies fonu savas darbinieka kartītes sadaļā Izskats.';return;}
      appearance={...appearance,background:safeBackground(skin.background),text:skin.text||'#f3f7f5',cardAccent:skin.accent||'#53c9e8',cardName:person.name};
      setSaved({name:'Mana kartīte',accent:appearance.cardAccent,accentMode:'album'});applyTheme('Mana kartīte');syncLookControls();
      document.getElementById('radioLookNote').textContent='Pārņemts '+document.querySelector('#radioUseCard .radio-card-owner').textContent+' izskats. Krāsas turpina mainīties pēc albuma.';
    };
    box.querySelectorAll('[data-viz-frame-choice]').forEach(b=>b.onclick=()=>{appearance.vizFrame=b.dataset.vizFrameChoice==='on'?'on':'off';paintAppearance();});
    box.querySelectorAll('[data-radio-layout-choice]').forEach(b=>b.onclick=()=>{appearance.layout=['classic','clean','pioneer'].includes(b.dataset.radioLayoutChoice)?b.dataset.radioLayoutChoice:'classic';paintAppearance();if(appearance.layout==='pioneer'){lastAlbumAccentKey='';updateAlbumAccent();}});
    box.querySelectorAll('[data-viz-family]').forEach(b=>b.onclick=()=>{lookVizFamily=b.dataset.vizFamily;if(lookVizFamily!=='pioneer')switchVizFamily(lookVizFamily);paintAppearance();});
    box.querySelectorAll('[data-viz-choice]').forEach(b=>b.onclick=()=>{lookVizFamily=null;setVizStyle(Number(b.dataset.vizChoice));paintAppearance();});
    document.getElementById('radioEffectsOff').onclick=()=>{
      appearance={...appearance,tint:0,glass:0,glow:0,vizFrame:'off'};setVizStyle(MK_NO_VIZ);syncLookControls();
      document.getElementById('radioLookNote').textContent='Vizualizācija, krāsas pārklājums, stikls un apkārtējā gaisma ir izslēgti. Fons un skaņa paliek.';
    };
    document.getElementById('radioBackgroundOff').onclick=()=>{appearance.background='';appearance.cardName='';setSaved({name:'Melns'});applyTheme('Melns');syncLookControls();};
    document.getElementById('radioLookReset').onclick=()=>{setVizStyle(MK_DEFAULT_VIZ);applyLookSettings({});syncLookControls();};
    document.getElementById('radioLookCancel').onclick=()=>closePanel();
    document.getElementById('radioLookApply').onclick=()=>{
      const data={...lookSnapshot(),imageCrops:cleanImageCrops(imageCropDraft||appearance.imageCrops)};
      if(window.__mkUnifiedMedia?.getSession()&&!window.__mkUnifiedMedia.change({type:'settings',settings:data}))return;
      appearance.imageCrops=data.imageCrops;
      localStorage.setItem(LOOK_KEY,JSON.stringify(appearance));
      lookBefore=null;closePanel();
    };
  }
  function syncCardChoice(){
    const quick=document.getElementById('radioUseCard');if(!quick)return;
    const person=window.__mkUnifiedMedia?.getSession();let skin=null,emoji='';
    try{const calendar=document.getElementById('calIframe')?.contentWindow;if(person){skin=calendar?.mkGetRadioSkin?.(person.name);emoji=calendar?.MinkaEmoji?.get(person.name)||'';}}catch(_){}
    const background=safeBackground(skin?.background),name=person?person.name.toLocaleLowerCase('lv-LV').replace(/(^|[\s-])([a-zāčēģīķļņōŗšūž])/g,(_,a,b)=>a+b.toLocaleUpperCase('lv-LV')):'';
    quick.querySelector('.radio-card-owner').textContent=name||'Tavs personīgais izskats';
    quick.querySelector('.radio-card-hint').textContent=!person?'Ielogojies, lai izmantotu savu kartīti':background?'Pārņemt fonu un krāsas':'Kartītei vēl nav izvēlēts fons';
    const preview=quick.querySelector('.radio-card-preview');preview.style.backgroundImage=background||'linear-gradient(135deg,#243c37,#10202b)';
    quick.querySelector('.radio-card-emoji').textContent=emoji||(person?person.name.trim().split(/\s+/).map(p=>p[0]).slice(0,2).join(''):'');
    preview.style.color=safeColor(skin?.text);quick.querySelector('.radio-card-emoji').classList.toggle('has-emoji',!!emoji);
    quick.setAttribute('aria-pressed',String(!!person&&getSaved().name==='Mana kartīte'&&appearance.cardName===person.name));
    quick.setAttribute('aria-label',person?'Izmantot savu kartītes izskatu '+name:'Ielogoties, lai izmantotu savu kartītes izskatu');
  }
  function syncLookControls(){
    syncCardChoice();const data=lookSnapshot();panel.querySelectorAll('[data-look]').forEach(e=>{e.value=data[e.dataset.look]??LOOK_DEFAULTS[e.dataset.look]??'0';});paintAppearance();
  }
  const closeProfileLook=()=>{lookBefore=null;imageCropDraft=null;imageDrag=null;panel.classList.remove('open');panel.setAttribute('aria-hidden','true');};
  window.rgTheme={snapshot:lookSnapshot,captureGuest:captureGuestLook,restoreGuest:data=>{closeProfileLook();restoreGuestLook(data);},applyProfile:data=>{closeProfileLook();applyLookSettings({...data,imageCrops:data.imageCrops??legacyImageCrops(window.__mkUnifiedMedia?.getSession()?.workerId)});}};
  document.getElementById('eqRow')?.addEventListener('click',e=>{if(e.target.closest('button')&&window.__mkUnifiedMedia?.getSession())window.__mkUnifiedMedia.change({type:'settings',settings:{eq:window.__eqMode||'none'}});});

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

  // A reload must not turn the last person's persisted appearance into the guest default.
  // Older builds did not keep a guest snapshot; discard their personal card background.
  restoreGuestLook(getSaved().name==='Mana kartīte'?{}:null);
  window.dispatchEvent(new Event('rg-theme-ready'));
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
    paintAppearance();
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
      if(window.__eqMode!=='chilldeep')setEQ('chilldeep');
      else if(!audio.paused&&aCtx?.state==='suspended')void aCtx.resume().catch(()=>{});
    } catch(e) {
      try{ console.warn('setEQ chilldeep failed, menu stays open', e); }catch(_){ }
    } finally {
      window.__manualSlowPanelControl = false;
    }

    positionSlowPanel();
    return false;
  }catch(e){
    try{ console.error('openSlowFxMenu error', e); }catch(_){ }
    return false;
  }
}

function handleSlowButton(){ return openSlowFxMenu(); }
try{ window.openSlowFxMenu = openSlowFxMenu; }catch(e){}
try{ window.handleSlowButton = handleSlowButton; }catch(e){}


/* ── Release audio + GPU resources on unload ──
   Without this, refreshing leaves the old AudioContext + WebGL context alive
   until Chrome lazily reclaims them, so the new page's memory stacks on top
   (the "310 → 510 on refresh" effect). Free them the instant we leave. */
(function(){
  let __mkCleaned = false;
  function mkReleaseResources(){
    if (__mkCleaned) return; __mkCleaned = true;
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

window.MinkaShiftRadio?.attach(audio);
