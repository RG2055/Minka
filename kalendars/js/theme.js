(function ThemeEngine() {
  'use strict';

  const PERF = window.__mkPerfProfile || {};
  const LOW_SPEC = !!PERF.lowSpec;
  function detectPerformanceTier() {
    const mem = Number(PERF.deviceMemory || 0);
    const cores = Number(PERF.hardwareConcurrency || 0);
    const reduced = !!PERF.reducedMotion;
    if (reduced || (mem > 0 && mem <= 4) || (cores > 0 && cores <= 2)) return 'low';
    if ((mem > 0 && mem <= 8) || (cores > 0 && cores <= 4) || LOW_SPEC) return 'medium';
    return 'high';
  }
  const AUTO_PERF = detectPerformanceTier();

  const THEMES = {
    aurora:   { label: 'Aurora',   accent:'#b77bff', accentRgb:'183,123,255', accentSoft:'rgba(183,123,255,0.12)', radAccent:'#ff5f57', orb1:'rgba(163,71,255,0.22)', orb2:'rgba(255,79,129,0.18)', orb3:'rgba(92,225,230,0.14)', bgBase:'#06070b', gridColor:'rgba(163,71,255,0.14)' },
    ice:      { label: 'Ice',      accent:'#64d2ff', accentRgb:'100,210,255', accentSoft:'rgba(100,210,255,0.12)', radAccent:'#ff9f0a', orb1:'rgba(60,160,255,0.20)', orb2:'rgba(170,240,255,0.14)', orb3:'rgba(80,200,240,0.14)', bgBase:'#04070d', gridColor:'rgba(80,160,255,0.12)' },
    mint:     { label: 'Mint',     accent:'#33d17a', accentRgb:'51,209,122', accentSoft:'rgba(51,209,122,0.12)', radAccent:'#ff7b54', orb1:'rgba(40,200,120,0.18)', orb2:'rgba(70,255,210,0.12)', orb3:'rgba(20,120,110,0.14)', bgBase:'#05080a', gridColor:'rgba(51,209,122,0.11)' },
    ember:    { label: 'Ember',    accent:'#ff8c42', accentRgb:'255,140,66', accentSoft:'rgba(255,140,66,0.12)', radAccent:'#ff4d6d', orb1:'rgba(255,100,30,0.18)', orb2:'rgba(255,70,120,0.12)', orb3:'rgba(255,180,40,0.10)', bgBase:'#09060a', gridColor:'rgba(255,100,30,0.12)' },
    cobalt:   { label: 'Cobalt',   accent:'#00b7ff', accentRgb:'0,183,255', accentSoft:'rgba(0,183,255,0.12)', radAccent:'#ff6b6b', orb1:'rgba(0,140,255,0.18)', orb2:'rgba(0,220,190,0.12)', orb3:'rgba(0,90,200,0.14)', bgBase:'#04060d', gridColor:'rgba(0,183,255,0.12)' },
    mono:     { label: 'Mono',     accent:'#d7dbe8', accentRgb:'215,219,232', accentSoft:'rgba(215,219,232,0.08)', radAccent:'#ff5f57', orb1:'rgba(140,145,180,0.10)', orb2:'rgba(120,130,170,0.08)', orb3:'rgba(170,175,210,0.08)', bgBase:'#030305', gridColor:'rgba(160,165,190,0.08)' }
  };

  // Single background: always pure black, no wallpapers, no glass blur.
  // The old BACKGROUNDS gallery (Obsidian/Frosted/Aurora/mac wallpapers…) is
  // gone by request — wallpaper JPGs + orb layers cost GPU/RAM for nothing.
  const BACKGROUNDS = {
    void: {
      label: 'Void', orb: '0', grid: '0', noise: '0', motion: '0',
      bodyBg: '#000000',
      vars: {
        '--bg-color':'#000000','--panel':'#080809',
        '--search-bar-bg':'#0e0e10','--search-border':'#1e1e20','--search-hover':'#141416',
        '--glass-bg':'rgba(10,10,12,0.97)','--glass-border':'rgba(255,255,255,0.06)',
        '--glass-blur':'0px','--glass-shadow':'0 24px 60px rgba(0,0,0,0.90)',
        '--mk-panel-bg':'rgba(6,6,8,0.98)','--mk-glass-bg':'rgba(8,8,10,0.97)','--mk-panel-blur':'0px',
        '--tk-bg-base':'#000000','--tk-bg-deep':'#080809',
        '--tk-bg-panel':'rgba(6,6,8,0.98)','--tk-bg-card':'rgba(255,255,255,0.025)',
        '--tk-bg-side':'rgba(0,0,0,0.25)','--tk-bg-modal':'rgba(4,4,6,0.99)',
      }
    },
  };
  const DENSITY = {
    compact:  { label:'Compact', cardPad:'12px', gap:'10px', radius:'18px', cardShift:'46px', fontStep:'0.96' },
    balanced: { label:'Balanced', cardPad:'15px', gap:'12px', radius:'22px', cardShift:'52px', fontStep:'1' },
    airy:     { label:'Airy', cardPad:'18px', gap:'14px', radius:'24px', cardShift:'56px', fontStep:'1.03' }
  };

  const SPEED = {
    fast:   { label:'Fast', ui:'120ms', hover:'160ms', glow:'0.10' },
    normal: { label:'Normal', ui:'170ms', hover:'220ms', glow:'0.16' }
  };

  const PERFORMANCE = {
    auto:   { label:'Auto' },
    low:    { label:'Low' },
    medium: { label:'Medium' },
    high:   { label:'High' }
  };

  const FONT_STEPS = [0.92, 0.97, 1.00, 1.06, 1.12];

  let state = {
    theme: 'aurora',
    background: 'void',
    density: 'balanced',
    performance: 'low',
    speed: 'fast',
    fontIndex: 2,
    glow: 0,
    noBlur: true,   // blur is permanently off — glass effects removed app-wide
    noAnim: false
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem('mk_theme_v4') || '{}');
      if (saved.theme && THEMES[saved.theme]) state.theme = saved.theme;
      state.background = 'void';
      if (saved.density && DENSITY[saved.density]) state.density = saved.density;
      // performance is pinned to 'low'; any saved value is ignored
      if (saved.speed && SPEED[saved.speed]) state.speed = saved.speed;
      if (Number.isInteger(saved.fontIndex) && saved.fontIndex >= 0 && saved.fontIndex < FONT_STEPS.length) state.fontIndex = saved.fontIndex;
      if (typeof saved.glow === 'number' && saved.glow >= 0 && saved.glow <= 1) state.glow = saved.glow;
      if (typeof saved.noAnim === 'boolean') state.noAnim = saved.noAnim;
    } catch (e) {}
  }

  function save() {
    try { localStorage.setItem('mk_theme_v4', JSON.stringify(state)); } catch (e) {}
  }

  function setVar(name, value) {
    document.documentElement.style.setProperty(name, value);
  }

  function applyTheme() {
    const theme = THEMES[state.theme];
    const bg = BACKGROUNDS[state.background];
    const density = DENSITY[state.density];
    const speed = SPEED[state.speed];
    const perfMode = 'low'; // pinned: the app always runs in the light profile
    const fontScale = FONT_STEPS[state.fontIndex] * parseFloat(density.fontStep);
    const root = document.documentElement;

    setVar('--accent', theme.accent);
    setVar('--accent-rgb', theme.accentRgb);
    setVar('--accent-soft', theme.accentSoft);
    setVar('--rad-accent', theme.radAccent);
    setVar('--ms-primary', theme.accent);
    setVar('--rg-purple', theme.accent);
    setVar('--accent-glow', `0 0 20px rgba(${theme.accentRgb},0.22)`);

    setVar('--mk-ui-ms', speed.ui);
    setVar('--mk-ui-hover-ms', speed.hover);
    setVar('--mk-window-glow', speed.glow);
    setVar('--mk-font-scale', String(fontScale));
    // expose raw font scale for duty panel names
    setVar('--mk-fs', String(fontScale));
    setVar('--mk-card-pad', density.cardPad);
    setVar('--mk-grid-gap', density.gap);
    setVar('--mk-radius', density.radius);
    setVar('--mk-card-shift', density.cardShift);
    if (perfMode === 'low') {
      setVar('--mk-card-hover-y', '-1px');
      setVar('--mk-card-active-scale', '0.992');
      setVar('--mk-card-hover-shadow', '0 4px 12px rgba(0,0,0,0.20)');
      setVar('--mk-card-active-shadow', '0 2px 8px rgba(0,0,0,0.16)');
      setVar('--mk-duty-emoji-scale', '1.08');
      setVar('--mk-duty-emoji-x', '8%');
      setVar('--mk-duty-emoji-y', '-8%');
      setVar('--mk-stop-hover-scale', '1.05');
      setVar('--mk-stop-hover-shadow', '0 0 0 2px rgba(255,255,255,0.06), 0 0 8px rgba(255,255,255,0.08)');
      setVar('--mk-panel-enter-scale', '0.985');
    } else if (perfMode === 'medium') {
      setVar('--mk-card-hover-y', '-2px');
      setVar('--mk-card-active-scale', '0.988');
      setVar('--mk-card-hover-shadow', '0 8px 18px rgba(0,0,0,0.24)');
      setVar('--mk-card-active-shadow', '0 4px 10px rgba(0,0,0,0.20)');
      setVar('--mk-duty-emoji-scale', '1.16');
      setVar('--mk-duty-emoji-x', '14%');
      setVar('--mk-duty-emoji-y', '-12%');
      setVar('--mk-stop-hover-scale', '1.12');
      setVar('--mk-stop-hover-shadow', '0 0 0 2px rgba(255,255,255,0.08), 0 0 10px rgba(255,255,255,0.10)');
      setVar('--mk-panel-enter-scale', '0.982');
    } else {
      setVar('--mk-card-hover-y', '-2px');
      setVar('--mk-card-active-scale', '0.985');
      setVar('--mk-card-hover-shadow', '0 10px 24px rgba(0,0,0,0.28)');
      setVar('--mk-card-active-shadow', '0 6px 14px rgba(0,0,0,0.22)');
      setVar('--mk-duty-emoji-scale', '1.28');
      setVar('--mk-duty-emoji-x', '20%');
      setVar('--mk-duty-emoji-y', '-18%');
      setVar('--mk-stop-hover-scale', '1.18');
      setVar('--mk-stop-hover-shadow', '0 0 0 3px rgba(255,255,255,0.10), 0 0 14px rgba(255,255,255,0.12)');
      setVar('--mk-panel-enter-scale', '0.98');
    }
    // Apply all vars from background theme (black, blur already 0px)
    Object.entries(bg.vars || {}).forEach(([k,v]) => setVar(k,v));
    // macscapeBg (orbs/grid/noise) is display:none now — keep its vars at 0
    // so nothing animates even if a stale stylesheet still shows it.
    setVar('--ms-orb', '0');
    setVar('--ms-grid', '0');
    setVar('--ms-noise', '0');
    setVar('--ms-motion', '0');

    const glowShadow = (LOW_SPEC || perfMode === 'low')
      ? `0 0 0 1px rgba(${theme.accentRgb},0.08), 0 10px 28px rgba(0,0,0,0.44)`
      : perfMode === 'medium'
      ? `0 0 0 1px rgba(${theme.accentRgb},0.08), 0 0 26px rgba(${theme.accentRgb},0.08), 0 14px 34px rgba(0,0,0,0.50)`
      : `0 0 0 1px rgba(${theme.accentRgb},0.10), 0 0 54px rgba(${theme.accentRgb},${speed.glow}), 0 18px 48px rgba(0,0,0,0.56)`;
    setVar('--glass-shadow', glowShadow);
    setVar('--window-glow-shadow', glowShadow);
    // Glow intensity
    setVar('--tk-glow', String(state.glow));

    // ── Background: always black. No wallpaper, no orb overlay, no grid. ──
    const bodyBase = '#000000';
    const wpo = document.getElementById('wallpaperOrbOverlay');
    if (wpo) wpo.remove();

    // Tell the parent shell to stay black + pass perf flags along.
    try {
      window.parent.postMessage({ type: 'mk_wallpaper', wallpaper: null, bodyBase: bodyBase }, '*');
      window.parent.postMessage({
        type: 'mk_performance',
        performance: perfMode,
        noAnim: !!state.noAnim,
        noBlur: !!state.noBlur
      }, '*');
    } catch(e) {}

    // Keep iframe itself transparent (parent body is black behind it)
    document.documentElement.style.backgroundImage = '';
    document.body.style.background = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.classList.remove('has-wallpaper-bg');
    document.documentElement.style.setProperty('--tk-bg-base', bodyBase);

    root.setAttribute('data-theme', state.theme);
    root.setAttribute('data-bg', state.background);
    root.setAttribute('data-performance', perfMode);
    root.classList.toggle('mk-low-spec', perfMode === 'low');
    root.classList.toggle('mk-medium-spec', perfMode === 'medium');
    // Panels are always near-solid now — no glass, no blur.
    root.style.setProperty('--glass-opacity', '0.96');
    root.style.setProperty('--glass-bg', 'rgba(10,13,18,0.96)');
    root.style.setProperty('--mk-panel-bg', 'rgba(8,10,16,0.98)');
    root.setAttribute('data-density', state.density);
    root.setAttribute('data-speed', state.speed);

    root.classList.add('mk-no-blur');
    root.classList.toggle('mk-no-anim', !!state.noAnim);
    setVar('--glass-blur', '0px');
    setVar('--mk-panel-blur', '0px');

    updateUI();
  }

  function buildPanel() {
    return `
      <div id="tk-panel" role="dialog" aria-label="Par sistēmu">
        <div class="tk-panel-header">
          <div><div class="tk-heading">Par sistēmu</div><div class="tk-subheading">Būvējums un stāvoklis</div></div>
          <button class="tk-close" id="tkClose" aria-label="Aizvērt">✕</button>
        </div>

        <div class="tk-build">
          <div class="tk-build-label">Būvējums</div>
          <div class="tk-build-ver" id="tkVer">–</div>
          <div class="tk-build-sub" id="tkVerSub">–</div>
        </div>

        <div class="tk-rows" id="tkRows"></div>

        <button type="button" class="tk-reload" id="tkReload">Pārlādēt un atjaunot</button>
        <div class="tk-note">Notīra saglabāto kopiju un ielādē jaunāko versiju.</div>
      </div>`;
  }

  // Values are read once per open — no timers, no polling.
  function fillInfo() {
    const rows = document.getElementById('tkRows');
    const ver = document.getElementById('tkVer');
    const sub = document.getElementById('tkVerSub');
    if (!rows) return;

    let build = '';
    try {
      const m = (document.querySelector('script[src*="calendar.js"]') || {}).src || '';
      build = (m.match(/[?&]v=([\w.-]+)/) || [])[1] || '';
    } catch (e) {}
    if (sub) sub.textContent = build ? 'Kalendārs ' + build : '';

    let months = 0, saved = '';
    try { months = Object.keys(window.__grafiksStore || {}).length; } catch (e) {}
    try {
      const ts = Number(localStorage.getItem('minka_schedule_cache_ts_v2') || 0);
      if (ts) {
        const min = Math.round((Date.now() - ts) / 60000);
        saved = min < 1 ? 'tikko' : min < 60 ? 'pirms ' + min + ' min' : 'pirms ' + Math.round(min / 60) + ' h';
      }
    } catch (e) {}

    const online = navigator.onLine !== false;
    const dev = (PERF.deviceMemory ? PERF.deviceMemory + ' GB' : '?') + ' · ' + (PERF.hardwareConcurrency || '?') + ' kodoli';

    const items = [
      ['Savienojums', (online ? '<i class="ok"></i>tiešsaistē' : '<i class="off"></i>bezsaistē')],
      ['Grafiks', months ? months + (months === 1 ? ' mēnesis' : ' mēneši') : '–'],
      ['Atjaunots', saved || '–'],
      ['Ierīce', dev],
      ['Režīms', 'Zema slodze']
    ];
    rows.innerHTML = items.map(function (it) {
      return '<div class="tk-row"><span>' + it[0] + '</span><b>' + it[1] + '</b></div>';
    }).join('');

    if (ver && 'caches' in window && caches.keys) {
      caches.keys().then(function (keys) {
        const mk = keys.filter(function (k) { return /^minka-/.test(k); }).sort();
        ver.textContent = mk.length ? mk[mk.length - 1].replace('minka-', 'v') : '–';
      }).catch(function () { ver.textContent = '–'; });
    }
  }

  let panelMounted = false;
  let panelVisible = false;

  function ensurePanelStyles() {
    if (document.getElementById('mk-theme-panel-inline-style')) return;
    const style = document.createElement('style');
    style.id = 'mk-theme-panel-inline-style';
    style.textContent = `
      #tk-wrap { position:fixed; inset:0; z-index:12000; pointer-events:none; }
      /* Solid dim instead of backdrop-filter: a full-screen blur was the single
         most expensive effect left in the app, and it only existed here. */
      #tk-wrap::before { content:''; position:absolute; inset:0; background:rgba(3,5,12,.72); opacity:0; transition:opacity 150ms ease; }
      #tk-panel { position:fixed !important; top:50% !important; left:50% !important; right:auto !important; transform:translate(-50%,-48%); width:min(400px, calc(100vw - 32px)) !important; max-height:min(84vh, 720px); overflow:auto; border-radius:14px !important; padding:20px !important; pointer-events:auto; opacity:0; transition:transform 150ms ease, opacity 150ms ease; box-shadow:0 24px 70px rgba(0,0,0,.6) !important; background:#0d1220 !important; border:1px solid rgba(255,255,255,.08) !important; }
      #tk-panel.visible { opacity:1; transform:translate(-50%,-50%); }
      #tk-wrap:has(#tk-panel.visible)::before { opacity:1; }
      .tk-panel-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
      .tk-heading { font-size:16px !important; font-weight:700 !important; letter-spacing:.01em; color:#eef2f8; }
      .tk-subheading { margin-top:3px; font-size:12px; color:rgba(255,255,255,.5); font-weight:600; }
      .tk-close { width:32px; height:32px; border-radius:9px; flex:0 0 auto; border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.05); color:#cfe6f7; cursor:pointer; }
      .tk-close:hover { background:rgba(255,90,80,.16); color:#fff; }
      .tk-build { margin-top:16px; padding:14px 16px; border-radius:12px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.06); }
      .tk-build-label { font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.38); }
      .tk-build-ver { margin-top:5px; font:600 24px/1.1 ui-monospace,'SF Mono','JetBrains Mono',Menlo,monospace; letter-spacing:-.01em; color:#e9edf4; }
      .tk-build-sub { margin-top:4px; font:500 11.5px/1 ui-monospace,'SF Mono',Menlo,monospace; color:rgba(255,255,255,.38); }
      .tk-rows { margin-top:10px; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,.05); }
      .tk-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px; background:rgba(255,255,255,.025); }
      .tk-row + .tk-row { border-top:1px solid rgba(255,255,255,.045); }
      .tk-row span { font-size:12.5px; color:rgba(255,255,255,.55); }
      .tk-row b { font-size:12.5px; font-weight:700; color:rgba(255,255,255,.9); display:inline-flex; align-items:center; gap:6px; font-variant-numeric:tabular-nums; }
      .tk-row i { width:6px; height:6px; border-radius:50%; flex:0 0 auto; }
      .tk-row i.ok { background:#4ba76a; }
      .tk-row i.off { background:#ff453a; }
      .tk-reload { width:100%; margin-top:12px; height:40px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.05); color:#dfe5ee; font:600 13px Inter,system-ui,sans-serif; letter-spacing:.01em; cursor:pointer; transition:background 120ms ease; }
      .tk-reload:hover { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.18); }
      .tk-reload:disabled { opacity:.6; cursor:default; }
      .tk-note { margin-top:8px; font-size:11px; color:rgba(255,255,255,.34); text-align:center; }
      @media (max-width: 700px) { #tk-panel { width:calc(100vw - 18px) !important; padding:14px !important; } }
    `;
    document.head.appendChild(style);
  }

  function initGlobalListeners() {
    document.addEventListener('click', (e) => {
      if (!panelVisible) return;
      const wrap = document.getElementById('tk-wrap');
      if (!wrap) return;
      if (!wrap.contains(e.target) && !e.target.closest('#tk-gear-btn')) hidePanel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panelVisible) hidePanel();
    });
  }

  function updateUI() {
    // Nothing to sync — the panel is read-only now. Values are filled on open
    // by fillInfo(), so there is no state to reflect back into controls.
  }

  function mountGearButton() {
    const topRow = document.querySelector('.top-row > div:last-child') || document.querySelector('.top-row');
    if (!topRow || document.getElementById('tk-gear-btn')) return;

    const gear = document.createElement('button');
    gear.id = 'tk-gear-btn';
    gear.className = 'tk-gear';
    gear.type = 'button';
    gear.title = 'Par sistēmu';
    gear.setAttribute('aria-label', 'Par sistēmu');
    gear.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 10.5A2.5 2.5 0 1 0 8 5.5a2.5 2.5 0 0 0 0 5Z" stroke="currentColor" stroke-width="1.4"/><path d="M6.34 1.5a1.6 1.6 0 0 1 3.32 0l.2.72a5.4 5.4 0 0 1 1.14.66l.72-.2a1.6 1.6 0 0 1 1.66 2.66l-.5.58a5.5 5.5 0 0 1 0 1.32l.5.58a1.6 1.6 0 0 1-1.66 2.66l-.72-.2a5.4 5.4 0 0 1-1.14.66l-.2.72a1.6 1.6 0 0 1-3.32 0l-.2-.72a5.4 5.4 0 0 1-1.14-.66l-.72.2A1.6 1.6 0 0 1 2.62 7.52l.5-.58a5.5 5.5 0 0 1 0-1.32l-.5-.58A1.6 1.6 0 0 1 4.28 2.38l.72.2a5.4 5.4 0 0 1 1.14-.66l.2-.72Z" stroke="currentColor" stroke-width="1.4"/></svg>';
    const viewBtn = topRow.querySelector('.view-btn') || topRow.firstChild;
    if (viewBtn && viewBtn.parentNode === topRow) topRow.insertBefore(gear, viewBtn);
    else topRow.appendChild(gear);

    gear.addEventListener('click', (e) => {
      e.stopPropagation();
      panelVisible ? hidePanel() : showPanel();
    });
  }

  let _applyTimer = 0;
  function applyThemeDebounced() {
    clearTimeout(_applyTimer);
    _applyTimer = setTimeout(applyTheme, 30);
  }

  function bindPanelEvents(wrap) {
    const closeBtn = wrap.querySelector('#tkClose');
    if (closeBtn) closeBtn.addEventListener('click', hidePanel, { passive: true });

    const reload = wrap.querySelector('#tkReload');
    if (reload) reload.addEventListener('click', async function () {
      reload.disabled = true;
      reload.textContent = 'Atjauno...';
      // Deliberately NOT destructive. The earlier version deleted every cache and
      // unregistered the service worker before reloading — if the reload then
      // failed or landed in the wrong frame, the app was left with nothing and no
      // offline copy. Ask the worker to check for a new version instead; its own
      // activate step already drops stale caches, so nothing is lost if the
      // network is down.
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(function (r) {
            try { if (r.waiting) r.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch (e) {}
            return r.update().catch(function () {});
          }));
        }
      } catch (e) {}
      const target = (function () {
        try { if (window.parent && window.parent !== window && window.parent.location.origin === window.location.origin) return window.parent; }
        catch (e) {}
        return window;
      })();
      try { target.location.reload(); } catch (e) { window.location.reload(); }
    });
    // Outside-click and Escape are bound once globally (see initGlobalListeners)
  }

  function mountPanel() {
    ensurePanelStyles();
    // Build only once — don't rebuild on every open (that's the duplicate-listener bug)
    if (document.getElementById('tk-wrap')) {
      updateUI();
      return;
    }
    const wrap = document.createElement('div');
    wrap.id = 'tk-wrap';
    wrap.innerHTML = buildPanel();
    document.body.appendChild(wrap);
    panelMounted = true;
    bindPanelEvents(wrap);
    updateUI();
  }

  function showPanel() {
    mountPanel();
    const panel = document.getElementById('tk-panel');
    const gear = document.getElementById('tk-gear-btn');
    if (!panel) return;
    panel.style.pointerEvents = 'auto';
    panel.classList.add('visible');
    if (gear) gear.classList.add('active');
    panelVisible = true;
    fillInfo();
    try { window.parent.postMessage({ type: 'mk_settings_opened' }, '*'); } catch (e) {}
  }

  function hidePanel() {
    const panel = document.getElementById('tk-panel');
    const gear = document.getElementById('tk-gear-btn');
    if (panel) {
      panel.classList.remove('visible');
      // Disable pointer-events after transition so invisible panel doesn't block clicks
      setTimeout(() => {
        if (!panelVisible && panel) panel.style.pointerEvents = 'none';
      }, 220);
    }
    if (gear) gear.classList.remove('active');
    panelVisible = false;
    try { window.parent.postMessage({ type: 'mk_settings_closed' }, '*'); } catch (e) {}
  }

  function init() {
    load();
    initGlobalListeners();
    const tryMount = () => {
      const topRow = document.querySelector('.top-row');
      if (!topRow) return void setTimeout(tryMount, 120);
      mountGearButton();
      applyTheme();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryMount, { once: true });
    else tryMount();
  }

  init();
  window.__themeEngine = { apply: applyTheme, state, showPanel, hidePanel, togglePanel: () => (panelVisible ? hidePanel() : showPanel()) };
})();
