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
      if (saved.performance && PERFORMANCE[saved.performance]) state.performance = saved.performance;
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
    const perfMode = state.performance === 'auto' ? AUTO_PERF : state.performance;
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

  function swatchesHtml() {
    return Object.entries(THEMES).map(([key, theme]) => `
      <button class="tk-swatch ${state.theme === key ? 'active' : ''}" data-theme="${key}" title="${theme.label}" aria-label="${theme.label}">
        <span class="tk-swatch-dot" style="--sw:${theme.accent}"></span>
        <span class="tk-swatch-label">${theme.label}</span>
      </button>
    `).join('');
  }

  function segHtml(source, attr, active) {
    return Object.entries(source).map(([key, val]) => `<button class="tk-seg-btn ${active === key ? 'active' : ''}" data-${attr}="${key}">${val.label}</button>`).join('');
  }

  function buildPanel() {
    return `
      <div id="tk-panel" role="dialog" aria-label="Display settings">
        <div class="tk-panel-header">
          <div><div class="tk-heading">Iestatījumi</div><div class="tk-subheading">Kalendāra tēmas un izkārtojums</div></div>
          <button class="tk-close" id="tkClose" aria-label="Aizvērt">✕</button>
        </div>

        <div class="tk-preview">
          <div class="tk-preview-date">11.03.2026 · Šodien</div>
          <div class="tk-preview-cards">
            <div class="tk-preview-card">
              <div class="tk-preview-badge">24H</div>
              <div class="tk-preview-info">
                <div class="tk-preview-role">Radiogrāfers</div>
                <div class="tk-preview-name">Jānis Bērziņš</div>
              </div>
              <div class="tk-preview-dot"></div>
            </div>
            <div class="tk-preview-card rd">
              <div class="tk-preview-badge">12H</div>
              <div class="tk-preview-info">
                <div class="tk-preview-role">Radiologs</div>
                <div class="tk-preview-name">Anna Kalniņa</div>
              </div>
              <div class="tk-preview-dot"></div>
            </div>
          </div>
        </div>

        <div class="tk-divider"></div>

        <div class="tk-section">
          <div class="tk-label-row">
            <span class="tk-section-label">Teksta izmērs</span>
            <span class="tk-value" id="tkFontValue">${state.fontIndex + 1} / 5</span>
          </div>
          <div class="tk-font-row">
            <span class="tk-font-a small">Aa</span>
            <input id="tkFontRange" class="tk-range" type="range" min="0" max="4" step="1" value="${state.fontIndex}">
            <span class="tk-font-a">Aa</span>
          </div>
        </div>

        <div class="tk-section">
          <div class="tk-label-row"><span class="tk-section-label">Krāsa</span></div>
          <div class="tk-swatches">${swatchesHtml()}</div>
        </div>

        <div class="tk-divider"></div>

        <div class="tk-section two-col">
          <div>
            <div class="tk-label-row"><span class="tk-section-label">Blīvums</span></div>
            <div class="tk-seg">${segHtml(DENSITY, 'density', state.density)}</div>
          </div>
          <div>
            <div class="tk-label-row"><span class="tk-section-label">Ātrums</span></div>
            <div class="tk-seg">${segHtml(SPEED, 'speed', state.speed)}</div>
          </div>
        </div>

        <div class="tk-divider"></div>

        <div class="tk-section">
          <div class="tk-label-row">
            <span class="tk-section-label">Veiktspēja</span>
            <span class="tk-value" id="tkPerfHint">Auto: ${AUTO_PERF.toUpperCase()} · ${PERF.deviceMemory || '?'}GB · ${PERF.hardwareConcurrency || '?'} cores</span>
          </div>
          <div class="tk-seg">${segHtml(PERFORMANCE, 'performance', state.performance)}</div>
        </div>

        <div class="tk-divider"></div>

        <div class="tk-section">
          <div class="tk-label-row">
            <span class="tk-section-label">✦ Spīdums</span>
            <span class="tk-value" id="tkGlowValue">${state.glow === 0 ? 'Izslēgts' : Math.round(state.glow * 100) + '%'}</span>
          </div>
          <div class="tk-font-row">
            <span style="font-size:13px;opacity:0.28;color:#fff">◎</span>
            <input id="tkGlowRange" class="tk-range" type="range" min="0" max="1" step="0.05" value="${state.glow}">
            <span style="font-size:13px;color:var(--accent)">✦</span>
          </div>
        </div>

        <div class="tk-divider"></div>

        <div class="tk-section">
          <div class="tk-label-row"><span class="tk-section-label">⚡ Optimizācija</span></div>
          <label class="tk-toggle">
            <input type="checkbox" id="tkNoAnim" ${state.noAnim ? 'checked' : ''}>
            <div style="flex:1"><div class="tk-toggle-label">Bez animācijām</div><div class="tk-toggle-sub">Aptur pulsēšanu, mirgoņu, fona kustību — karšu hover paliek</div></div>
            <span class="tk-toggle-track"></span>
          </label>
        </div>

        <div class="tk-footer">Saglabājas automātiski · tikai kalendārs<span id="tkBuildVer" style="opacity:.5;margin-left:6px;"></span></div>
      </div>`;
  }

  let panelMounted = false;
  let panelVisible = false;

  function ensurePanelStyles() {
    if (document.getElementById('mk-theme-panel-inline-style')) return;
    const style = document.createElement('style');
    style.id = 'mk-theme-panel-inline-style';
    style.textContent = `
      #tk-wrap { position:fixed; inset:0; z-index:12000; pointer-events:none; }
      #tk-wrap::before { content:''; position:absolute; inset:0; background:rgba(3,5,12,.52); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); opacity:0; transition:opacity 180ms ease; }
      #tk-panel { position:fixed !important; top:50% !important; left:50% !important; right:auto !important; transform:translate(-50%,-48%) scale(var(--mk-panel-enter-scale, .98)); width:min(760px, calc(100vw - 32px)) !important; max-height:min(84vh, 980px); overflow:auto; border-radius:28px !important; padding:18px 18px 16px !important; pointer-events:auto; opacity:0; transition:transform 190ms ease, opacity 190ms ease; box-shadow:0 26px 80px rgba(0,0,0,.55) !important; background:#0d1220 !important; border:1px solid rgba(255,255,255,.08) !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important; }
      #tk-panel.visible { opacity:1; transform:translate(-50%,-50%) scale(1); }
      #tk-wrap:has(#tk-panel.visible)::before { opacity:1; }
      .tk-panel-header { align-items:flex-start !important; }
      .tk-heading { font-size:18px !important; font-weight:900 !important; letter-spacing:.02em; }
      .tk-subheading { margin-top:4px; font-size:12px; color:rgba(255,255,255,.58); font-weight:600; }
      .tk-section { border-radius:18px; padding:12px 12px 10px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.05); }
      .tk-preview { border-radius:20px !important; }
      .tk-swatches, .tk-bg-grid { gap:10px !important; }
      .tk-close { width:38px; height:38px; border-radius:14px; }
      .tk-value.is-auto-low { color:#fca5a5; }
      .tk-value.is-auto-medium { color:#fcd34d; }
      .tk-value.is-auto-high { color:#86efac; }
      @media (max-width: 700px) {
        #tk-panel { width:calc(100vw - 18px) !important; max-height:88vh; padding:14px 14px 12px !important; border-radius:22px !important; }
        .tk-section.two-col { grid-template-columns:1fr !important; }
      }
      .tk-toggle { display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none; }
      .tk-toggle input { display:none; }
      .tk-toggle-label { font-size:13px; font-weight:700; color:rgba(255,255,255,.9); }
      .tk-toggle-sub { font-size:11px; color:rgba(255,255,255,.42); margin-top:2px; }
      .tk-toggle-track { flex-shrink:0; width:36px; height:20px; border-radius:10px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.15); position:relative; transition:background .2s; }
      .tk-toggle-track::after { content:''; position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#fff; transition:transform .2s; }
      .tk-toggle input:checked ~ .tk-toggle-track { background:var(--accent,#b77bff); }
      .tk-toggle input:checked ~ .tk-toggle-track::after { transform:translateX(16px); }
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
    document.querySelectorAll('.tk-swatch').forEach((el) => el.classList.toggle('active', el.dataset.theme === state.theme));
    document.querySelectorAll('[data-density]').forEach((el) => el.classList.toggle('active', el.dataset.density === state.density));
    document.querySelectorAll('[data-performance]').forEach((el) => el.classList.toggle('active', el.dataset.performance === state.performance));
    document.querySelectorAll('[data-speed]').forEach((el) => el.classList.toggle('active', el.dataset.speed === state.speed));
    const cbAnim = document.getElementById('tkNoAnim');
    if (cbAnim) cbAnim.checked = !!state.noAnim;
    const range = document.getElementById('tkFontRange');
    if (range) range.value = String(state.fontIndex);
    const val = document.getElementById('tkFontValue');
    if (val) val.textContent = `${state.fontIndex + 1}/5`;
    const perfHint = document.getElementById('tkPerfHint');
    if (perfHint) {
      const effective = state.performance === 'auto' ? AUTO_PERF : state.performance;
      perfHint.textContent = state.performance === 'auto'
        ? `Auto: ${AUTO_PERF.toUpperCase()} · ${PERF.deviceMemory || '?'}GB · ${PERF.hardwareConcurrency || '?'} cores`
        : `Manual: ${effective.toUpperCase()}`;
      perfHint.classList.remove('is-auto-low', 'is-auto-medium', 'is-auto-high');
      perfHint.classList.add(
        effective === 'low' ? 'is-auto-low' :
        effective === 'medium' ? 'is-auto-medium' :
        'is-auto-high'
      );
    }
  }

  function mountGearButton() {
    const topRow = document.querySelector('.top-row > div:last-child') || document.querySelector('.top-row');
    if (!topRow || document.getElementById('tk-gear-btn')) return;

    const gear = document.createElement('button');
    gear.id = 'tk-gear-btn';
    gear.className = 'tk-gear';
    gear.type = 'button';
    gear.title = 'Display';
    gear.setAttribute('aria-label', 'Display settings');
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
    wrap.querySelectorAll('.tk-swatch').forEach((el) => {
      el.addEventListener('click', () => { state.theme = el.dataset.theme; save(); applyThemeDebounced(); }, { passive: true });
    });
    wrap.querySelectorAll('[data-density]').forEach((el) => {
      el.addEventListener('click', () => { state.density = el.dataset.density; save(); applyThemeDebounced(); }, { passive: true });
    });
    wrap.querySelectorAll('[data-performance]').forEach((el) => {
      el.addEventListener('click', () => { state.performance = el.dataset.performance; save(); applyThemeDebounced(); }, { passive: true });
    });
    wrap.querySelectorAll('[data-speed]').forEach((el) => {
      el.addEventListener('click', () => { state.speed = el.dataset.speed; save(); applyThemeDebounced(); }, { passive: true });
    });

    const range = wrap.querySelector('#tkFontRange');
    if (range) {
      range.addEventListener('input', () => {
        state.fontIndex = Number(range.value);
        save();
        applyTheme();
      }, { passive: true });
    }

    const glowRange = wrap.querySelector('#tkGlowRange');
    if (glowRange) {
      glowRange.addEventListener('input', () => {
        state.glow = Number(glowRange.value);
        setVar('--tk-glow', String(state.glow));
        const val = document.getElementById('tkGlowValue');
        if (val) val.textContent = state.glow === 0 ? 'Izslēgts' : Math.round(state.glow * 100) + '%';
        save();
      }, { passive: true });
    }

    [['#tkNoAnim','noAnim']].forEach(function(pair){
      const cb = wrap.querySelector(pair[0]);
      if (cb) cb.addEventListener('change', function(){
        state[pair[1]] = cb.checked;
        save();
        applyTheme();
      });
    });

    const closeBtn = wrap.querySelector('#tkClose');
    if (closeBtn) closeBtn.addEventListener('click', hidePanel, { passive: true });

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
    // Show the active service-worker cache version so it's clear which build is
    // actually running on this device (helps confirm updates have landed).
    try {
      const verEl = document.getElementById('tkBuildVer');
      if (verEl && 'caches' in window && caches.keys) {
        caches.keys().then(keys => {
          const mk = keys.filter(k => /^minka-/.test(k)).sort();
          verEl.textContent = mk.length ? '· ' + mk[mk.length - 1].replace('minka-', 'v') : '';
        }).catch(() => {});
      }
    } catch (e) {}
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
