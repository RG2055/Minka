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

  function clampPx(value, fallback, max) {
    const raw = String(value == null ? fallback : value).trim();
    const num = parseFloat(raw);
    const safe = Number.isFinite(num) ? num : fallback;
    return Math.min(safe, max) + 'px';
  }

  const THEMES = {
    aurora:   { label: 'Aurora',   accent:'#b77bff', accentRgb:'183,123,255', accentSoft:'rgba(183,123,255,0.12)', radAccent:'#ff5f57', orb1:'rgba(163,71,255,0.22)', orb2:'rgba(255,79,129,0.18)', orb3:'rgba(92,225,230,0.14)', bgBase:'#06070b', gridColor:'rgba(163,71,255,0.14)' },
    ice:      { label: 'Ice',      accent:'#64d2ff', accentRgb:'100,210,255', accentSoft:'rgba(100,210,255,0.12)', radAccent:'#ff9f0a', orb1:'rgba(60,160,255,0.20)', orb2:'rgba(170,240,255,0.14)', orb3:'rgba(80,200,240,0.14)', bgBase:'#04070d', gridColor:'rgba(80,160,255,0.12)' },
    mint:     { label: 'Mint',     accent:'#33d17a', accentRgb:'51,209,122', accentSoft:'rgba(51,209,122,0.12)', radAccent:'#ff7b54', orb1:'rgba(40,200,120,0.18)', orb2:'rgba(70,255,210,0.12)', orb3:'rgba(20,120,110,0.14)', bgBase:'#05080a', gridColor:'rgba(51,209,122,0.11)' },
    ember:    { label: 'Ember',    accent:'#ff8c42', accentRgb:'255,140,66', accentSoft:'rgba(255,140,66,0.12)', radAccent:'#ff4d6d', orb1:'rgba(255,100,30,0.18)', orb2:'rgba(255,70,120,0.12)', orb3:'rgba(255,180,40,0.10)', bgBase:'#09060a', gridColor:'rgba(255,100,30,0.12)' },
    cobalt:   { label: 'Cobalt',   accent:'#00b7ff', accentRgb:'0,183,255', accentSoft:'rgba(0,183,255,0.12)', radAccent:'#ff6b6b', orb1:'rgba(0,140,255,0.18)', orb2:'rgba(0,220,190,0.12)', orb3:'rgba(0,90,200,0.14)', bgBase:'#04060d', gridColor:'rgba(0,183,255,0.12)' },
    mono:     { label: 'Mono',     accent:'#d7dbe8', accentRgb:'215,219,232', accentSoft:'rgba(215,219,232,0.08)', radAccent:'#ff5f57', orb1:'rgba(140,145,180,0.10)', orb2:'rgba(120,130,170,0.08)', orb3:'rgba(170,175,210,0.08)', bgBase:'#030305', gridColor:'rgba(160,165,190,0.08)' }
  };

  // Full background themes — each sets ALL global CSS vars
  const BACKGROUNDS = {
    void: {
      label: 'Void', orb: '0.08', grid: '0.02', noise: '0.02', motion: '0.20',
      bodyBg: '#000000',
      vars: {
        '--bg-color':'#000000','--panel':'#080809',
        '--search-bar-bg':'#0e0e10','--search-border':'#1e1e20','--search-hover':'#141416',
        '--glass-bg':'rgba(10,10,12,0.96)','--glass-border':'rgba(255,255,255,0.06)',
        '--glass-blur':'10px','--glass-shadow':'0 24px 60px rgba(0,0,0,0.90)',
        '--mk-panel-bg':'rgba(6,6,8,0.98)','--mk-glass-bg':'rgba(8,8,10,0.97)','--mk-panel-blur':'8px',
        '--tk-bg-base':'#000000','--tk-bg-deep':'#080809',
        '--tk-bg-panel':'rgba(6,6,8,0.98)','--tk-bg-card':'rgba(255,255,255,0.025)',
        '--tk-bg-side':'rgba(0,0,0,0.25)','--tk-bg-modal':'rgba(4,4,6,0.99)',
      }
    },
    obsidian: {
      label: 'Obsidian', orb: '0.20', grid: '0.04', noise: '0.03', motion: '0.45',
      bodyBg: '#06070b',
      vars: {
        '--bg-color':'#06070b','--panel':'#0e0f15',
        '--search-bar-bg':'#13141c','--search-border':'#282a36','--search-hover':'#1c1e28',
        '--glass-bg':'rgba(14,15,22,0.92)','--glass-border':'rgba(255,255,255,0.09)',
        '--glass-blur':'16px','--glass-shadow':'0 20px 48px rgba(0,0,0,0.65)',
        '--mk-panel-bg':'rgba(10,11,18,0.95)','--mk-glass-bg':'rgba(10,11,18,0.92)','--mk-panel-blur':'14px',
        '--tk-bg-base':'#06070b','--tk-bg-deep':'#0a0d15',
        '--tk-bg-panel':'rgba(10,11,18,0.95)','--tk-bg-card':'rgba(255,255,255,0.035)',
        '--tk-bg-side':'rgba(0,0,0,0.15)','--tk-bg-modal':'rgba(8,10,18,0.985)',
      }
    },
    frosted: {
      label: 'Frosted', orb: '0.38', grid: '0.09', noise: '0.06', motion: '0.65',
      bodyBg: '#07080b',
      vars: {
        '--bg-color':'#07080b','--panel':'#0f1116',
        '--search-bar-bg':'rgba(255,255,255,0.06)','--search-border':'rgba(255,255,255,0.14)','--search-hover':'rgba(255,255,255,0.08)',
        '--glass-bg':'rgba(255,255,255,0.07)','--glass-border':'rgba(255,255,255,0.18)',
        '--glass-blur':'24px','--glass-shadow':'0 8px 40px rgba(31,38,135,0.30)',
        '--mk-panel-bg':'rgba(255,255,255,0.06)','--mk-glass-bg':'rgba(255,255,255,0.05)','--mk-panel-blur':'24px',
        '--tk-bg-base':'#07080b','--tk-bg-deep':'rgba(255,255,255,0.04)',
        '--tk-bg-panel':'rgba(255,255,255,0.06)','--tk-bg-card':'rgba(255,255,255,0.04)',
        '--tk-bg-side':'rgba(255,255,255,0.04)','--tk-bg-modal':'rgba(10,12,20,0.90)',
      }
    },
    aurora: {
      label: 'Aurora', orb: '0.55', grid: '0.14', noise: '0.08', motion: '0.90',
      bodyBg: '#060710',
      vars: {
        '--bg-color':'#060710','--panel':'#0d0e1a',
        '--search-bar-bg':'rgba(183,123,255,0.07)','--search-border':'rgba(183,123,255,0.22)','--search-hover':'rgba(183,123,255,0.10)',
        '--glass-bg':'rgba(20,16,38,0.90)','--glass-border':'rgba(183,123,255,0.18)',
        '--glass-blur':'20px','--glass-shadow':'0 12px 48px rgba(100,60,200,0.30)',
        '--mk-panel-bg':'rgba(16,12,30,0.94)','--mk-glass-bg':'rgba(14,10,26,0.91)','--mk-panel-blur':'18px',
        '--tk-bg-base':'#060710','--tk-bg-deep':'#0d0e1a',
        '--tk-bg-panel':'rgba(16,12,30,0.94)','--tk-bg-card':'rgba(183,123,255,0.04)',
        '--tk-bg-side':'rgba(100,50,200,0.10)','--tk-bg-modal':'rgba(10,8,22,0.96)',
      }
    },
    deep_sea: {
      label: 'Deep Sea', orb: '0.42', grid: '0.10', noise: '0.05', motion: '0.55',
      bodyBg: '#03070d',
      vars: {
        '--bg-color':'#03070d','--panel':'#08111a',
        '--search-bar-bg':'rgba(0,150,255,0.06)','--search-border':'rgba(0,180,255,0.18)','--search-hover':'rgba(0,180,255,0.09)',
        '--glass-bg':'rgba(8,18,32,0.91)','--glass-border':'rgba(0,180,255,0.14)',
        '--glass-blur':'18px','--glass-shadow':'0 12px 44px rgba(0,80,160,0.35)',
        '--mk-panel-bg':'rgba(6,14,28,0.96)','--mk-glass-bg':'rgba(5,12,24,0.93)','--mk-panel-blur':'16px',
        '--tk-bg-base':'#03070d','--tk-bg-deep':'#08111a',
        '--tk-bg-panel':'rgba(6,14,28,0.96)','--tk-bg-card':'rgba(0,140,255,0.04)',
        '--tk-bg-side':'rgba(0,80,160,0.12)','--tk-bg-modal':'rgba(4,10,20,0.97)',
      }
    },
    ember: {
      label: 'Ember', orb: '0.45', grid: '0.08', noise: '0.06', motion: '0.60',
      bodyBg: '#0a0604',
      vars: {
        '--bg-color':'#0a0604','--panel':'#140a06',
        '--search-bar-bg':'rgba(255,120,40,0.07)','--search-border':'rgba(255,120,40,0.20)','--search-hover':'rgba(255,120,40,0.10)',
        '--glass-bg':'rgba(28,14,8,0.91)','--glass-border':'rgba(255,120,40,0.16)',
        '--glass-blur':'16px','--glass-shadow':'0 12px 44px rgba(180,60,0,0.32)',
        '--mk-panel-bg':'rgba(22,10,6,0.95)','--mk-glass-bg':'rgba(20,8,4,0.93)','--mk-panel-blur':'14px',
        '--tk-bg-base':'#0a0604','--tk-bg-deep':'#140a06',
        '--tk-bg-panel':'rgba(22,10,6,0.95)','--tk-bg-card':'rgba(255,100,30,0.04)',
        '--tk-bg-side':'rgba(180,60,0,0.12)','--tk-bg-modal':'rgba(14,6,2,0.97)',
      }
    },
    // ── Mac Wallpapers ──
    mac_sonoma: {
      label: 'Sonoma', orb: '0.30', grid: '0.05', noise: '0.03', motion: '0.50',
      wallpaper: 'https://raw.githubusercontent.com/LAYTAT/macOS-Wallpapers/main/14-Sonoma-Dark.jpg',
      bodyBg: '#0a0d12',
      vars: {
        '--bg-color':'transparent','--panel':'rgba(10,13,18,0.55)',
        '--search-bar-bg':'rgba(255,255,255,0.07)','--search-border':'rgba(255,255,255,0.15)','--search-hover':'rgba(255,255,255,0.10)',
        '--glass-bg':'rgba(10,13,18,0.55)','--glass-border':'rgba(255,255,255,0.14)',
        '--glass-blur':'28px','--glass-shadow':'0 8px 40px rgba(0,0,0,0.45)',
        '--mk-panel-bg':'rgba(8,10,16,0.60)','--mk-glass-bg':'rgba(8,10,16,0.55)','--mk-panel-blur':'28px',
        '--tk-bg-base':'transparent','--tk-bg-deep':'rgba(0,0,0,0.30)',
        '--tk-bg-panel':'rgba(8,10,16,0.60)','--tk-bg-card':'rgba(255,255,255,0.05)',
        '--tk-bg-side':'rgba(0,0,0,0.20)','--tk-bg-modal':'rgba(6,8,14,0.88)',
      }
    },
    mac_ventura: {
      label: 'Ventura', orb: '0.25', grid: '0.04', noise: '0.03', motion: '0.45',
      wallpaper: 'https://raw.githubusercontent.com/LAYTAT/macOS-Wallpapers/main/13-Ventura-Dark.jpg',
      bodyBg: '#080b10',
      vars: {
        '--bg-color':'transparent','--panel':'rgba(8,11,16,0.55)',
        '--search-bar-bg':'rgba(255,255,255,0.07)','--search-border':'rgba(255,255,255,0.15)','--search-hover':'rgba(255,255,255,0.10)',
        '--glass-bg':'rgba(8,11,16,0.55)','--glass-border':'rgba(255,255,255,0.14)',
        '--glass-blur':'28px','--glass-shadow':'0 8px 40px rgba(0,0,0,0.45)',
        '--mk-panel-bg':'rgba(6,9,14,0.60)','--mk-glass-bg':'rgba(6,9,14,0.55)','--mk-panel-blur':'28px',
        '--tk-bg-base':'transparent','--tk-bg-deep':'rgba(0,0,0,0.30)',
        '--tk-bg-panel':'rgba(6,9,14,0.60)','--tk-bg-card':'rgba(255,255,255,0.05)',
        '--tk-bg-side':'rgba(0,0,0,0.20)','--tk-bg-modal':'rgba(4,6,12,0.88)',
      }
    },
    mac_monterey: {
      label: 'Monterey', orb: '0.20', grid: '0.04', noise: '0.03', motion: '0.40',
      wallpaper: 'https://raw.githubusercontent.com/LAYTAT/macOS-Wallpapers/main/12-Dark.jpg',
      bodyBg: '#060810',
      vars: {
        '--bg-color':'transparent','--panel':'rgba(6,8,16,0.55)',
        '--search-bar-bg':'rgba(255,255,255,0.07)','--search-border':'rgba(255,255,255,0.15)','--search-hover':'rgba(255,255,255,0.10)',
        '--glass-bg':'rgba(6,8,16,0.55)','--glass-border':'rgba(255,255,255,0.14)',
        '--glass-blur':'28px','--glass-shadow':'0 8px 40px rgba(0,0,0,0.45)',
        '--mk-panel-bg':'rgba(4,6,14,0.60)','--mk-glass-bg':'rgba(4,6,14,0.55)','--mk-panel-blur':'28px',
        '--tk-bg-base':'transparent','--tk-bg-deep':'rgba(0,0,0,0.30)',
        '--tk-bg-panel':'rgba(4,6,14,0.60)','--tk-bg-card':'rgba(255,255,255,0.05)',
        '--tk-bg-side':'rgba(0,0,0,0.20)','--tk-bg-modal':'rgba(3,5,12,0.88)',
      }
    },
    mac_bigsur: {
      label: 'Big Sur', orb: '0.35', grid: '0.06', noise: '0.04', motion: '0.55',
      wallpaper: 'https://raw.githubusercontent.com/LAYTAT/macOS-Wallpapers/main/11-0-Big-Sur-Color-Night.jpg',
      bodyBg: '#05080e',
      vars: {
        '--bg-color':'transparent','--panel':'rgba(5,8,14,0.55)',
        '--search-bar-bg':'rgba(255,255,255,0.07)','--search-border':'rgba(255,255,255,0.15)','--search-hover':'rgba(255,255,255,0.10)',
        '--glass-bg':'rgba(5,8,14,0.55)','--glass-border':'rgba(255,255,255,0.14)',
        '--glass-blur':'28px','--glass-shadow':'0 8px 40px rgba(0,0,0,0.45)',
        '--mk-panel-bg':'rgba(4,6,12,0.60)','--mk-glass-bg':'rgba(4,6,12,0.55)','--mk-panel-blur':'28px',
        '--tk-bg-base':'transparent','--tk-bg-deep':'rgba(0,0,0,0.30)',
        '--tk-bg-panel':'rgba(4,6,12,0.60)','--tk-bg-card':'rgba(255,255,255,0.05)',
        '--tk-bg-side':'rgba(0,0,0,0.20)','--tk-bg-modal':'rgba(3,5,11,0.88)',
      }
    },
    mac_sequoia: {
      label: 'Sequoia', orb: '0.28', grid: '0.05', noise: '0.03', motion: '0.48',
      wallpaper: 'https://raw.githubusercontent.com/LAYTAT/macOS-Wallpapers/main/15-Sequoia-Dark-6K.jpg',
      bodyBg: '#060a0e',
      vars: {
        '--bg-color':'transparent','--panel':'rgba(6,10,14,0.55)',
        '--search-bar-bg':'rgba(255,255,255,0.07)','--search-border':'rgba(255,255,255,0.15)','--search-hover':'rgba(255,255,255,0.10)',
        '--glass-bg':'rgba(6,10,14,0.55)','--glass-border':'rgba(255,255,255,0.14)',
        '--glass-blur':'28px','--glass-shadow':'0 8px 40px rgba(0,0,0,0.45)',
        '--mk-panel-bg':'rgba(4,8,12,0.60)','--mk-glass-bg':'rgba(4,8,12,0.55)','--mk-panel-blur':'28px',
        '--tk-bg-base':'transparent','--tk-bg-deep':'rgba(0,0,0,0.30)',
        '--tk-bg-panel':'rgba(4,8,12,0.60)','--tk-bg-card':'rgba(255,255,255,0.05)',
        '--tk-bg-side':'rgba(0,0,0,0.20)','--tk-bg-modal':'rgba(3,6,11,0.88)',
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
    background: 'obsidian',
    density: 'balanced',
    performance: 'low',
    speed: 'fast',
    fontIndex: 2,
    glow: 0,
    glassOpacity: 0.55
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem('mk_theme_v4') || '{}');
      if (saved.theme && THEMES[saved.theme]) state.theme = saved.theme;
      if (saved.background && BACKGROUNDS[saved.background]) state.background = saved.background; else state.background = 'obsidian';
      if (saved.density && DENSITY[saved.density]) state.density = saved.density;
      if (saved.performance && PERFORMANCE[saved.performance]) state.performance = saved.performance;
      if (saved.speed && SPEED[saved.speed]) state.speed = saved.speed;
      if (Number.isInteger(saved.fontIndex) && saved.fontIndex >= 0 && saved.fontIndex < FONT_STEPS.length) state.fontIndex = saved.fontIndex;
      if (typeof saved.glow === 'number' && saved.glow >= 0 && saved.glow <= 1) state.glow = saved.glow;
      if (typeof saved.glassOpacity === 'number') state.glassOpacity = saved.glassOpacity;
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
    // Apply all vars from background theme
    Object.entries(bg.vars || {}).forEach(([k,v]) => setVar(k,v));
    if (LOW_SPEC || perfMode === 'low') {
      setVar('--glass-blur', clampPx((bg.vars || {})['--glass-blur'], 12, 10));
      setVar('--mk-panel-blur', clampPx((bg.vars || {})['--mk-panel-blur'], 10, 8));
    } else if (perfMode === 'medium') {
      setVar('--glass-blur', clampPx((bg.vars || {})['--glass-blur'], 14, 14));
      setVar('--mk-panel-blur', clampPx((bg.vars || {})['--mk-panel-blur'], 12, 12));
    }
    setVar('--ms-orb', (LOW_SPEC || perfMode === 'low') ? String(Math.min(parseFloat(bg.orb) || 0.30, 0.18)) : (perfMode === 'medium' ? String(Math.min(parseFloat(bg.orb) || 0.30, 0.30)) : bg.orb));
    setVar('--ms-grid', (LOW_SPEC || perfMode === 'low') ? String(Math.min(parseFloat(bg.grid) || 0.04, 0.03)) : (perfMode === 'medium' ? String(Math.min(parseFloat(bg.grid) || 0.04, 0.06)) : bg.grid));
    setVar('--ms-noise', (LOW_SPEC || perfMode === 'low') ? String(Math.min(parseFloat(bg.noise || '0.04') || 0.04, 0.015)) : (perfMode === 'medium' ? String(Math.min(parseFloat(bg.noise || '0.04') || 0.04, 0.03)) : (bg.noise || '0.04')));
    setVar('--ms-motion', (LOW_SPEC || perfMode === 'low') ? '0' : (perfMode === 'medium' ? String(Math.min(parseFloat(bg.motion) || 0.45, 0.45)) : bg.motion));

    const glowShadow = (LOW_SPEC || perfMode === 'low')
      ? `0 0 0 1px rgba(${theme.accentRgb},0.08), 0 10px 28px rgba(0,0,0,0.44)`
      : perfMode === 'medium'
      ? `0 0 0 1px rgba(${theme.accentRgb},0.08), 0 0 26px rgba(${theme.accentRgb},0.08), 0 14px 34px rgba(0,0,0,0.50)`
      : `0 0 0 1px rgba(${theme.accentRgb},0.10), 0 0 54px rgba(${theme.accentRgb},${speed.glow}), 0 18px 48px rgba(0,0,0,0.56)`;
    setVar('--glass-shadow', glowShadow);
    setVar('--window-glow-shadow', glowShadow);
    // Glow intensity
    setVar('--tk-glow', String(state.glow));

    // ── Apply background: body base color + orb gradients on top ──
    const orbV = (LOW_SPEC || perfMode === 'low')
      ? Math.min(parseFloat(bg.orb) || 0.30, 0.18)
      : perfMode === 'medium'
      ? Math.min(parseFloat(bg.orb) || 0.30, 0.30)
      : (parseFloat(bg.orb) || 0.30);
    const alpha1 = (orbV * 0.55).toFixed(2);
    const alpha2 = (orbV * 0.40).toFixed(2);
    const alpha3 = (orbV * 0.30).toFixed(2);
    const bodyBase = bg.bodyBg || theme.bgBase || '#06070b';

    const macBg = document.getElementById('macscapeBg');
    let wpo = document.getElementById('wallpaperOrbOverlay');
    if (!wpo) {
      wpo = document.createElement('div');
      wpo.id = 'wallpaperOrbOverlay';
      wpo.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1;';
      document.body.prepend(wpo);
    }

    // Notify parent to apply wallpaper (wallpaper div lives in parent)
    try {
      window.parent.postMessage({
        type: 'mk_wallpaper',
        wallpaper: bg.wallpaper || null,
        bodyBase: bodyBase
      }, '*');
    } catch(e) {}

    // Keep iframe itself transparent
    document.documentElement.style.backgroundImage = '';
    document.body.style.background = 'transparent';
    document.body.style.backgroundColor = 'transparent';

    if (bg.wallpaper) {
      document.documentElement.classList.add('has-wallpaper-bg');
      wpo.style.background = `
        radial-gradient(ellipse 70% 55% at 18% 14%, ${theme.orb1.replace(/[\d.]+\)$/, alpha1 + ')')}, transparent 60%),
        radial-gradient(ellipse 65% 50% at 83% 17%, ${theme.orb2.replace(/[\d.]+\)$/, alpha2 + ')')}, transparent 62%),
        radial-gradient(ellipse 70% 55% at 50% 88%, ${theme.orb3.replace(/[\d.]+\)$/, alpha3 + ')')}, transparent 64%)`;
    } else {
      document.documentElement.classList.remove('has-wallpaper-bg');
      wpo.style.background = '';
    }
    document.documentElement.style.setProperty('--tk-bg-base', bodyBase);

    const grid = document.querySelector('#macscapeBg .ms-grid');
    if (grid) {
      grid.style.backgroundImage = `
        linear-gradient(${theme.gridColor} 1px, transparent 1px),
        linear-gradient(90deg, ${theme.gridColor.replace(/0\.\d+\)/, '0.05)')} 1px, transparent 1px)`;
    }

    const orb1 = document.querySelector('#macscapeBg .orb1');
    const orb2 = document.querySelector('#macscapeBg .orb2');
    const orb3 = document.querySelector('#macscapeBg .orb3');
    if (orb1) orb1.style.background = `radial-gradient(circle at 30% 30%, ${theme.orb1}, transparent 72%)`;
    if (orb2) orb2.style.background = `radial-gradient(circle at 30% 30%, ${theme.orb2}, transparent 72%)`;
    if (orb3) orb3.style.background = `radial-gradient(circle at 30% 30%, ${theme.orb3}, transparent 72%)`;

    root.setAttribute('data-theme', state.theme);
    root.setAttribute('data-bg', state.background);
    root.setAttribute('data-performance', perfMode);
    root.classList.toggle('mk-low-spec', perfMode === 'low');
    root.classList.toggle('mk-medium-spec', perfMode === 'medium');
    // Apply glass opacity
    const go = (LOW_SPEC || perfMode === 'low')
      ? Math.min(state.glassOpacity ?? 0.55, 0.70)
      : perfMode === 'medium'
      ? Math.min(state.glassOpacity ?? 0.55, 0.62)
      : (state.glassOpacity ?? 0.55);
    root.style.setProperty('--glass-opacity', String(go));
    root.style.setProperty('--glass-bg', `rgba(10,13,18,${go})`);
    root.style.setProperty('--mk-panel-bg', `rgba(8,10,16,${Math.min(go + 0.05, 0.98)})`);
    root.setAttribute('data-density', state.density);
    root.setAttribute('data-speed', state.speed);

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

  function bgCardsHtml() {
    return Object.entries(BACKGROUNDS).map(([key, bg]) => {
      const wpStyle = bg.wallpaper
        ? `background-image:url('${bg.wallpaper}');background-size:cover;background-position:center;`
        : '';
      return `
      <button class="tk-bg-card ${state.background === key ? 'active' : ''}" data-bg="${key}">
        <span class="tk-bg-preview tk-bg-${key}" style="${wpStyle}"></span>
        <span class="tk-bg-title">${bg.label}</span>
      </button>`;
    }).join('');
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

        <div class="tk-section">
          <div class="tk-label-row"><span class="tk-section-label">Fons</span></div>
          <div class="tk-bg-grid">${bgCardsHtml()}</div>
        </div>

        <div class="tk-divider"></div>

        <div class="tk-section">
          <div class="tk-label-row">
            <span class="tk-section-label">🪟 Glass</span>
            <span class="tk-value" id="tkGlassValue">${Math.round((1 - (state.glassOpacity ?? 0.55)) * 100)}%</span>
          </div>
          <div class="tk-font-row">
            <span style="font-size:11px;opacity:0.4;color:#fff">▪</span>
            <input id="tkGlassRange" class="tk-range" type="range" min="0.05" max="0.95" step="0.01" value="${state.glassOpacity ?? 0.55}">
            <span style="font-size:11px;opacity:0.9;color:#fff">□</span>
          </div>
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

        <div class="tk-footer">Saglabājas automātiski · tikai kalendārs</div>
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
    document.querySelectorAll('.tk-bg-card').forEach((el) => el.classList.toggle('active', el.dataset.bg === state.background));
    document.querySelectorAll('[data-density]').forEach((el) => el.classList.toggle('active', el.dataset.density === state.density));
    document.querySelectorAll('[data-performance]').forEach((el) => el.classList.toggle('active', el.dataset.performance === state.performance));
    document.querySelectorAll('[data-speed]').forEach((el) => el.classList.toggle('active', el.dataset.speed === state.speed));
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
    wrap.querySelectorAll('.tk-bg-card').forEach((el) => {
      el.addEventListener('click', () => { state.background = el.dataset.bg; save(); applyThemeDebounced(); }, { passive: true });
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

    const glassRange = wrap.querySelector('#tkGlassRange');
    if (glassRange) {
      glassRange.addEventListener('input', () => {
        const go = parseFloat(glassRange.value);
        state.glassOpacity = go;
        const pct = Math.round((1 - go) * 100);
        const lbl = wrap.querySelector('#tkGlassValue');
        if (lbl) lbl.textContent = pct + '%';
        // Set glass opacity — same approach as radio
        const blur = Math.round(8 + (1 - go) * 24);
        document.documentElement.style.setProperty('--glass-bg',    `rgba(10,13,18,${go.toFixed(2)})`);
        document.documentElement.style.setProperty('--glass-blur',  `${blur}px`);
        document.documentElement.style.setProperty('--mk-panel-bg', `rgba(8,10,16,${Math.min(go+0.05,0.98).toFixed(2)})`);
        const app = document.getElementById('grafiks-app');
        if (app) {
          app.style.setProperty('background',              `rgba(10,13,18,${go.toFixed(2)})`, 'important');
          app.style.setProperty('backdrop-filter',         `blur(${blur}px) saturate(180%)`,  'important');
          app.style.setProperty('-webkit-backdrop-filter', `blur(${blur}px) saturate(180%)`,  'important');
        }
        document.querySelectorAll('.side-panel').forEach(el => {
          el.style.setProperty('background',              `rgba(4,6,14,${(go*0.85).toFixed(2)})`, 'important');
          el.style.setProperty('backdrop-filter',         `blur(${blur}px) saturate(160%)`,        'important');
          el.style.setProperty('-webkit-backdrop-filter', `blur(${blur}px) saturate(160%)`,        'important');
        });
        save();
      });
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
    // Update slider values to current state each time panel opens
    const glassR = document.getElementById('tkGlassRange');
    if (glassR) glassR.value = state.glassOpacity ?? 0.55;
    const glassV = document.getElementById('tkGlassValue');
    if (glassV) glassV.textContent = Math.round((1-(state.glassOpacity??0.55))*100) + '%';
    const panel = document.getElementById('tk-panel');
    const gear = document.getElementById('tk-gear-btn');
    if (!panel) return;
    panel.style.pointerEvents = 'auto';
    panel.classList.add('visible');
    if (gear) gear.classList.add('active');
    panelVisible = true;
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
