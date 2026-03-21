/* ================================================================
   RADIO AMBILIGHT v4 — JBL PULSE STYLE + FULL CONTROLS
   ================================================================ */
(function RadioAmbilight() {
  'use strict';

  // ── DEFAULTS (user can adjust all of these) ──
  const DEFAULTS = {
    enabled: false,
    speed: 35,          // 0–100 slider
    intensity: 55,      // 0–100
    size: 50,           // 0–100 (glow thickness)
    reactivity: 40,     // 0–100 (audio response)
    breathing: 50,      // 0–100 (idle breathing)
    effect: 'flow',     // flow | pulse | aurora | wave
  };

  const STORAGE_KEY = 'rg_ambilight_cfg';

  // ── STATE ──
  let cfg = { ...DEFAULTS };
  let canvas = null, ctx = null;
  let phase = 0, breathPhase = 0;
  let targetColors = [];
  let activeColors = [];
  let sBass = 0, sMid = 0, sHigh = 0;
  let lastCoverUrl = '';
  let dpr = 1;
  let panelAdded = false;
  let renderRaf = 0;
  let lastRenderTs = 0;
  const PERF = window.__mkPerfProfile || {};
  const LOW_SPEC = !!PERF.lowSpec;
  const FRAME_MS = LOW_SPEC ? 1000 / 24 : 0;

  const FALLBACK = [[138,43,226],[255,60,180],[75,0,200],[220,40,255],[100,20,180]];

  // ── HELPERS ──
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpC(a, b, t) { return [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)]; }

  // map slider 0–100 to a usable range
  function m(val, lo, hi) { return lo + (val / 100) * (hi - lo); }

  // ── SAVE / LOAD ──
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch(e){} }
  function load() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) { const p = JSON.parse(s); Object.assign(cfg, p); }
    } catch(e){}
    if (!targetColors.length) targetColors = [...FALLBACK];
    if (!activeColors.length) activeColors = FALLBACK.map(c => [...c]);
  }

  // ── COLOR EXTRACTION ──
  function extractColors(img) {
    return new Promise(resolve => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(img, 0, 0, 64, 64);
        const px = cx.getImageData(0, 0, 64, 64).data;
        const buckets = new Map();
        for (let i = 0; i < px.length; i += 8) {
          const r = px[i], g = px[i+1], b = px[i+2], a = px[i+3];
          if (a < 100) continue;
          const br = (r+g+b)/3;
          if (br < 20 || br > 240) continue;
          const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
          if (mx-mn < 15) continue;
          const qr = Math.round(r/24)*24, qg = Math.round(g/24)*24, qb = Math.round(b/24)*24;
          const k = (qr<<16)|(qg<<8)|qb;
          buckets.set(k, (buckets.get(k)||0)+1);
        }
        const sorted = [...buckets.entries()].sort((a,b) => b[1]-a[1]);
        const out = [];
        for (const [k] of sorted) {
          if (out.length >= 6) break;
          const r=(k>>16)&0xff, g=(k>>8)&0xff, b=k&0xff;
          if (out.some(e => Math.abs(e[0]-r)+Math.abs(e[1]-g)+Math.abs(e[2]-b)<60)) continue;
          const avg=(r+g+b)/3;
          out.push([
            Math.min(255, Math.max(0, Math.round(avg+(r-avg)*1.5))),
            Math.min(255, Math.max(0, Math.round(avg+(g-avg)*1.5))),
            Math.min(255, Math.max(0, Math.round(avg+(b-avg)*1.5))),
          ]);
        }
        resolve(out.length >= 3 ? out : FALLBACK);
      } catch(e) { resolve(FALLBACK); }
    });
  }

  // ── AUDIO ──
  function getAudio() {
    if (typeof analyser === 'undefined' || !analyser) return {bass:0,mid:0,high:0};
    try {
      const d = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(d);
      const avg=(s,e)=>{let sum=0,n=0;for(let i=Math.min(s,d.length);i<Math.min(e,d.length);i++){sum+=d[i];n++;}return n?sum/n/255:0;};
      return { bass:avg(0,6), mid:avg(6,24), high:avg(24,60) };
    } catch(e) { return {bass:0,mid:0,high:0}; }
  }

  // ── CANVAS ──
  function createCanvas() {
    const radio = document.getElementById('radioWindow');
    if (!radio || canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'ambilight-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0;transition:opacity 0.8s ease;border-radius:inherit;';
    radio.style.overflow = 'hidden';
    if (getComputedStyle(radio).position === 'static') radio.style.position = 'relative';
    radio.appendChild(canvas);
    ctx = canvas.getContext('2d');
    onResize();
    window.addEventListener('resize', onResize);
  }

  function onResize() {
    if (!canvas) return;
    const r = document.getElementById('radioWindow');
    if (!r) return;
    dpr = Math.min(window.devicePixelRatio || 1, LOW_SPEC ? 1 : 2);
    canvas.width = Math.round(r.offsetWidth * dpr);
    canvas.height = Math.round(r.offsetHeight * dpr);
  }

  function canRender() {
    const radio = document.getElementById('radioWindow');
    return !!(cfg.enabled && canvas && ctx && radio && !document.hidden && getComputedStyle(radio).display !== 'none');
  }

  function stopRender() {
    if (renderRaf) {
      cancelAnimationFrame(renderRaf);
      renderRaf = 0;
    }
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function scheduleRender() {
    if (renderRaf || !canRender()) return;
    renderRaf = requestAnimationFrame(render);
  }

  // ── EFFECTS ──

  function drawBlob(x, y, color, size, alpha, scaleX, scaleY) {
    const r = Math.round(color[0]), g = Math.round(color[1]), b = Math.round(color[2]);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX || 1, scaleY || 1);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    grad.addColorStop(0, `rgba(${r},${g},${b},${(alpha*0.9).toFixed(3)})`);
    grad.addColorStop(0.25, `rgba(${r},${g},${b},${(alpha*0.6).toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(${r},${g},${b},${(alpha*0.2).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function perimPos(w, h, t) {
    const p = ((t % 1) + 1) % 1;
    const perim = 2 * (w + h);
    const d = p * perim;
    if (d < w) return { x: d, y: 0, edge: 'top' };
    if (d < w + h) return { x: w, y: d - w, edge: 'right' };
    if (d < 2*w + h) return { x: w - (d-w-h), y: h, edge: 'bottom' };
    return { x: 0, y: h - (d-2*w-h), edge: 'left' };
  }

  // EFFECT: Flow — blobs flowing around edges
  function effectFlow(w, h, nc, intensity, glowW, flowSpeed, breathAmt) {
    const waves = 5;
    for (let i = 0; i < waves; i++) {
      const ci = i % nc;
      const color = activeColors[ci] || FALLBACK[0];
      const spd = 0.7 + (i/waves)*0.6;
      const t = phase * spd + i/waves;
      const breath = Math.sin(breathPhase * (1 + i*0.3) + i*1.7) * breathAmt * 0.15 + 1;
      const auFrq = i%3===0 ? sBass : i%3===1 ? sMid : sHigh;
      const a = (intensity + auFrq * m(cfg.reactivity, 0, 0.6)) * breath;
      const sz = glowW * (1 + auFrq * 0.8);
      const pos = perimPos(w, h, t);
      const isVert = pos.edge==='left' || pos.edge==='right';
      drawBlob(pos.x, pos.y, color, sz, Math.min(1, a), isVert ? 0.5 : 1.4, isVert ? 1.4 : 0.5);
      // Mirror
      const pos2 = perimPos(w, h, t + 0.5);
      const isV2 = pos2.edge==='left' || pos2.edge==='right';
      drawBlob(pos2.x, pos2.y, color, sz*0.6, Math.min(1, a*0.5), isV2?0.5:1.2, isV2?1.2:0.5);
    }
  }

  // EFFECT: Pulse — all edges glow together, pulsing with bass
  function effectPulse(w, h, nc, intensity, glowW) {
    const pulse = 0.4 + sBass * m(cfg.reactivity, 0.2, 1.2);
    const breath = Math.sin(breathPhase) * m(cfg.breathing, 0, 0.15) + 1;
    const a = intensity * pulse * breath;

    for (let ci = 0; ci < Math.min(nc, 3); ci++) {
      const color = activeColors[ci] || FALLBACK[0];
      const offset = ci * 0.33;
      // Distribute around
      for (let j = 0; j < 8; j++) {
        const t = j/8 + offset + phase * 0.3;
        const pos = perimPos(w, h, t);
        const isV = pos.edge==='left'||pos.edge==='right';
        drawBlob(pos.x, pos.y, color, glowW * (0.8 + sBass*0.5), Math.min(1, a * 0.7), isV?0.4:1.5, isV?1.5:0.4);
      }
    }
  }

  // EFFECT: Aurora — slow morphing large color fields
  function effectAurora(w, h, nc, intensity, glowW) {
    const breath = Math.sin(breathPhase) * m(cfg.breathing, 0, 0.2) + 1;
    for (let i = 0; i < nc; i++) {
      const color = activeColors[i] || FALLBACK[0];
      // Large slow-moving blobs
      const t = phase * 0.4 + i/nc;
      const wobble = Math.sin(breathPhase * 0.7 + i * 2.3) * 0.08;
      const pos = perimPos(w, h, t + wobble);
      const isV = pos.edge==='left'||pos.edge==='right';
      const auMix = (sBass*0.3 + sMid*0.4 + sHigh*0.3);
      const a = intensity * (0.7 + auMix * m(cfg.reactivity, 0.1, 0.5)) * breath;
      const sz = glowW * (1.5 + Math.sin(breathPhase + i) * 0.3);
      drawBlob(pos.x, pos.y, color, sz, Math.min(1, a), isV?0.6:1.8, isV?1.8:0.6);
    }
  }

  // EFFECT: Wave — sine wave pattern along edges
  function effectWave(w, h, nc, intensity, glowW) {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const t = i / count + phase;
      const ci = i % nc;
      const color = activeColors[ci] || FALLBACK[0];
      const waveAmp = Math.sin(phase * 6 + i * 0.8) * 0.5 + 0.5;
      const auFrq = i%3===0 ? sBass : i%3===1 ? sMid : sHigh;
      const breath = Math.sin(breathPhase + i*0.4) * m(cfg.breathing, 0, 0.1) + 1;
      const a = intensity * (0.3 + waveAmp * 0.4 + auFrq * m(cfg.reactivity, 0.1, 0.5)) * breath;
      const pos = perimPos(w, h, t);
      const isV = pos.edge==='left'||pos.edge==='right';
      const sz = glowW * (0.4 + waveAmp * 0.6);
      drawBlob(pos.x, pos.y, color, sz, Math.min(1, a*0.8), isV?0.4:1, isV?1:0.4);
    }
  }

  // ── MAIN RENDER ──
  function render(ts = 0) {
    renderRaf = 0;
    if (!canRender()) return;
    if (FRAME_MS && ts && (ts - lastRenderTs) < FRAME_MS) {
      renderRaf = requestAnimationFrame(render);
      return;
    }
    lastRenderTs = ts || performance.now();
    const radio = document.getElementById('radioWindow');
    if (!radio) return;

    const ew = Math.round(radio.offsetWidth * dpr);
    if (canvas.width !== ew) onResize();
    const w = canvas.width / dpr, h = canvas.height / dpr;

    // Smooth audio
    const au = getAudio();
    const audioSm = m(cfg.reactivity, 0.03, 0.25);
    sBass = lerp(sBass, au.bass, audioSm);
    sMid = lerp(sMid, au.mid, audioSm);
    sHigh = lerp(sHigh, au.high, audioSm);

    // Smooth colors
    while (activeColors.length < targetColors.length) activeColors.push([...targetColors[activeColors.length]]);
    if (activeColors.length > targetColors.length) activeColors.length = targetColors.length;
    for (let i = 0; i < targetColors.length; i++) {
      if (!activeColors[i]) activeColors[i] = [...targetColors[i]];
      activeColors[i] = lerpC(activeColors[i], targetColors[i], 0.01);
    }

    // Advance phases
    const flowSpeed = m(cfg.speed, 0.0005, 0.012);
    const breathSpeed = m(cfg.breathing, 0.0003, 0.004);
    phase += flowSpeed + sBass * flowSpeed * 0.8;
    breathPhase += breathSpeed;

    // Derived values
    const intensity = m(cfg.intensity, 0.15, 0.85);
    const glowW = m(cfg.size, 12, 60);
    const nc = activeColors.length || 1;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';

    // Run selected effect
    switch (cfg.effect) {
      case 'pulse':  effectPulse(w, h, nc, intensity, glowW); break;
      case 'aurora':  effectAurora(w, h, nc, intensity, glowW); break;
      case 'wave':    effectWave(w, h, nc, intensity, glowW); break;
      default:        effectFlow(w, h, nc, intensity, glowW, flowSpeed, m(cfg.breathing, 0, 1)); break;
    }

    // Bass flash overlay (for all effects)
    if (sBass > 0.45 && cfg.reactivity > 20) {
      const flashA = (sBass - 0.45) * m(cfg.reactivity, 0.1, 0.5);
      const fc = activeColors[0] || FALLBACK[0];
      const r=Math.round(fc[0]), g=Math.round(fc[1]), b=Math.round(fc[2]);
      const gw = glowW * 1.5;
      // Top
      let gr = ctx.createLinearGradient(0,0,0,gw); gr.addColorStop(0,`rgba(${r},${g},${b},${flashA.toFixed(3)})`); gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=gr; ctx.fillRect(0,0,w,gw);
      // Bottom
      gr=ctx.createLinearGradient(0,h,0,h-gw); gr.addColorStop(0,`rgba(${r},${g},${b},${flashA.toFixed(3)})`); gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=gr; ctx.fillRect(0,h-gw,w,gw);
      // Left
      gr=ctx.createLinearGradient(0,0,gw,0); gr.addColorStop(0,`rgba(${r},${g},${b},${(flashA*0.6).toFixed(3)})`); gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=gr; ctx.fillRect(0,0,gw,h);
      // Right
      gr=ctx.createLinearGradient(w,0,w-gw,0); gr.addColorStop(0,`rgba(${r},${g},${b},${(flashA*0.6).toFixed(3)})`); gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=gr; ctx.fillRect(w-gw,0,gw,h);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    renderRaf = requestAnimationFrame(render);
  }

  // ── COVER WATCHER ──
  function watchCover() {
    const cover = document.getElementById('npCover');
    if (!cover) return;
    new MutationObserver(() => {
      const url = cover.src || '';
      if (url && url !== lastCoverUrl && !url.startsWith('data:')) { lastCoverUrl = url; onCoverChange(cover); }
      else if (!url || cover.style.display === 'none') { targetColors = [...FALLBACK]; lastCoverUrl = ''; }
    }).observe(cover, { attributes: true, attributeFilter: ['src'] });
    if (cover.src && cover.complete && cover.naturalWidth > 0) { lastCoverUrl = cover.src; onCoverChange(cover); }
  }

  async function onCoverChange(img) {
    if (!img.complete) await new Promise(r => { img.onload = r; img.onerror = r; });
    if (img.naturalWidth === 0) return;
    try { const c = await extractColors(img); if (c !== FALLBACK) { targetColors = c; return; } } catch(e){}
    try {
      const f = new Image(); f.crossOrigin = 'anonymous';
      await new Promise((res,rej) => { f.onload=res; f.onerror=rej; f.src=img.src; });
      if (f.naturalWidth > 0) { targetColors = await extractColors(f); return; }
    } catch(e){}
    targetColors = [...FALLBACK];
  }

  // ── TOGGLE ──
  function setEnabled(on) {
    cfg.enabled = on;
    if (canvas) canvas.style.opacity = on ? '1' : '0';
    if (on) scheduleRender();
    else stopRender();
    save();
    syncUI();
  }

  // ── THEME PANEL UI ──
  function syncUI() {
    const cb = document.getElementById('amb-enabled'); if (cb) cb.checked = cfg.enabled;
    const sp = document.getElementById('amb-speed'); if (sp) sp.value = cfg.speed;
    const it = document.getElementById('amb-intensity'); if (it) it.value = cfg.intensity;
    const sz = document.getElementById('amb-size'); if (sz) sz.value = cfg.size;
    const re = document.getElementById('amb-reactivity'); if (re) re.value = cfg.reactivity;
    const br = document.getElementById('amb-breathing'); if (br) br.value = cfg.breathing;
    // Effect buttons
    document.querySelectorAll('.amb-fx-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.fx === cfg.effect);
    });
    // Show/hide sliders
    const panel = document.getElementById('amb-settings');
    if (panel) panel.style.display = cfg.enabled ? 'block' : 'none';
  }

  function addPanel() {
    const controls = document.querySelector('.theme-controls');
    if (!controls || panelAdded) return;
    panelAdded = true;

    const hint = controls.querySelector('.theme-hint');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:8px;padding-top:8px;">
        <label class="trow" style="margin-bottom:2px;">
          <span style="font-weight:700;letter-spacing:1px;font-size:11px;color:rgba(200,180,255,0.95);">⚡ LED AMBILIGHT</span>
          <input id="amb-enabled" type="checkbox" ${cfg.enabled?'checked':''} style="width:17px;height:17px;accent-color:#b77bff;cursor:pointer;" />
        </label>
        <div id="amb-settings" style="display:${cfg.enabled?'block':'none'};">
          <div style="display:flex;gap:3px;margin:4px 0 6px 0;flex-wrap:wrap;" id="amb-fx-row">
            <button class="amb-fx-btn${cfg.effect==='flow'?' active':''}" data-fx="flow">Flow</button>
            <button class="amb-fx-btn${cfg.effect==='pulse'?' active':''}" data-fx="pulse">Pulse</button>
            <button class="amb-fx-btn${cfg.effect==='aurora'?' active':''}" data-fx="aurora">Aurora</button>
            <button class="amb-fx-btn${cfg.effect==='wave'?' active':''}" data-fx="wave">Wave</button>
          </div>
          <label class="trow" style="padding:4px 2px;"><span>Speed</span><input id="amb-speed" type="range" min="0" max="100" value="${cfg.speed}" style="width:130px;accent-color:#b77bff;" /></label>
          <label class="trow" style="padding:4px 2px;"><span>Glow</span><input id="amb-intensity" type="range" min="0" max="100" value="${cfg.intensity}" style="width:130px;accent-color:#b77bff;" /></label>
          <label class="trow" style="padding:4px 2px;"><span>Size</span><input id="amb-size" type="range" min="0" max="100" value="${cfg.size}" style="width:130px;accent-color:#b77bff;" /></label>
          <label class="trow" style="padding:4px 2px;"><span>Reactivity</span><input id="amb-reactivity" type="range" min="0" max="100" value="${cfg.reactivity}" style="width:130px;accent-color:#b77bff;" /></label>
          <label class="trow" style="padding:4px 2px;"><span>Breathing</span><input id="amb-breathing" type="range" min="0" max="100" value="${cfg.breathing}" style="width:130px;accent-color:#b77bff;" /></label>
        </div>
      </div>
    `;

    if (hint) controls.insertBefore(wrapper, hint); else controls.appendChild(wrapper);

    // Style effect buttons
    const style = document.createElement('style');
    style.textContent = `.amb-fx-btn{padding:5px 12px;border-radius:10px;border:1px solid rgba(183,123,255,0.2);background:rgba(183,123,255,0.05);color:rgba(200,180,255,0.85);font-size:11px;font-weight:600;cursor:pointer;letter-spacing:0.5px;transition:all .2s ease;font-family:inherit;}.amb-fx-btn:hover{background:rgba(183,123,255,0.12);border-color:rgba(183,123,255,0.35);}.amb-fx-btn.active{background:rgba(183,123,255,0.2);border-color:rgba(183,123,255,0.5);color:#d4b5ff;box-shadow:0 0 12px rgba(183,123,255,0.15);}`;
    document.head.appendChild(style);

    // Events
    document.getElementById('amb-enabled').addEventListener('change', e => setEnabled(e.target.checked));

    ['speed','intensity','size','reactivity','breathing'].forEach(id => {
      const el = document.getElementById('amb-' + id);
      if (el) el.addEventListener('input', e => { cfg[id] = parseInt(e.target.value); save(); });
    });

    document.getElementById('amb-fx-row').addEventListener('click', e => {
      const btn = e.target.closest('.amb-fx-btn');
      if (!btn) return;
      cfg.effect = btn.dataset.fx;
      save();
      syncUI();
    });
  }

  // ── INIT ──
  function init() {
    const radio = document.getElementById('radioWindow');
    if (!radio) { setTimeout(init, 500); return; }
    load();
    if (!targetColors.length) targetColors = [...FALLBACK];
    if (!activeColors.length) activeColors = FALLBACK.map(c => [...c]);
    createCanvas();
    if (cfg.enabled && canvas) canvas.style.opacity = '1';
    watchCover();
    scheduleRender();
    addPanel();
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', () => setTimeout(addPanel, 100));
    const tp = document.getElementById('themePanel');
    if (tp) new MutationObserver(() => addPanel()).observe(tp, { attributes: true, attributeFilter: ['aria-hidden'] });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopRender();
      else scheduleRender();
    });
    window.__ledAmbilight = { toggle:()=>{setEnabled(!cfg.enabled);return cfg.enabled;}, setEnabled, isEnabled:()=>cfg.enabled, setCfg:(k,v)=>{cfg[k]=v;save();syncUI();} };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 400);
})();
