/* ================================================================
   RG RADIO — EXTRAS v4
   New viz modes (VU meter, LED bar, dot-matrix) + Custom EQ panel
   + Worker fade-out on timer expiry
   ================================================================ */

// ── Extend VIZ_MODES with new entries ──
(function patchVizModes(){
  if (typeof VIZ_MODES === 'undefined') { setTimeout(patchVizModes, 500); return; }
  const toAdd = [
    { idx: 8,  label: "VU",      hint: "VU needle meters" },
    { idx: 9,  label: "LED",     hint: "LED bar spectrum" },
    { idx: 10, label: "DOT VU",  hint: "dot-matrix spectrum" },
  ];
  toAdd.forEach(m => {
    if (!VIZ_MODES.find(v => v.idx === m.idx)) VIZ_MODES.push(m);
  });
  // Re-render the viz picker if open
  if (typeof updateVizPickerUI === 'function') updateVizPickerUI();
})();

// ─────────────────────────────────────────────────────────────
//  DRAW ROUTINES
// ─────────────────────────────────────────────────────────────

const RG_peaks   = new Float32Array(128).fill(0);
const RG_holdCnt = new Int32Array(128).fill(0);
const PEAK_HOLD  = 380;
const PEAK_DECAY = 0.91;
const RG_EXTRA_LOW_SPEC = !!(window.__mkPerfProfile && window.__mkPerfProfile.lowSpec);
const RG_EXTRA_FRAME_MS = 1000 / (RG_EXTRA_LOW_SPEC ? 30 : 60);
let RG_extraLastFrameTs = 0;
let RG_extraFreqData = null;

function rgVizAccent(alpha = 1, lift = 0) {
  const source = window.__radioVizAccentRGB || [30, 215, 96];
  const rgb = source.map(value => Math.max(0, Math.min(255, Math.round(value + lift))));
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function updatePeaks(data, n, span=1, dt=16.7) {
  for (let i = 0; i < n; i++) {
    const v = data[Math.floor(i/n*data.length*span)] / 255;
    if (v > RG_peaks[i]) { RG_peaks[i] = v; RG_holdCnt[i] = PEAK_HOLD; }
    else if (RG_holdCnt[i] > 0) { RG_holdCnt[i]=Math.max(0,RG_holdCnt[i]-Math.round(dt)); }
    else { RG_peaks[i] = Math.max(0, RG_peaks[i] * Math.pow(PEAK_DECAY,dt/16.7)); }
  }
}

/* ─ VU Meter (mode 8) ─ */
function drawVU(ctx, W, H, data) {
  ctx.clearRect(0, 0, W, H);

  const N = data.length;
  let L = 0, R = 0;
  for (let i = 0; i < N/2; i++) L += data[i];
  for (let i = N/2; i < N; i++) R += data[i];
  L = Math.min(1, (L / (N/2)) / 255);
  R = Math.min(1, (R / (N/2)) / 255);

  const panels = [{ cx: W*0.27, val: L, lbl:'L' }, { cx: W*0.73, val: R, lbl:'R' }];

  panels.forEach(({ cx, val, lbl }) => {
    const r = Math.min(H * 0.82, W * 0.22);
    const cy = H * 0.80;
    const MIN_ANG = Math.PI * 1.10;
    const MAX_ANG = Math.PI * 1.90;

    // Meter body
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2*Math.PI);
    ctx.arc(cx, cy, r*0.55, 2*Math.PI, Math.PI, true);
    ctx.fillStyle = 'rgba(6,10,6,0.96)';
    ctx.fill();
    ctx.strokeStyle = rgVizAccent(.15);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Colored arc zones (green / orange / red)
    const zones = [
      {s:0.00, e:0.80, c:rgVizAccent(.20)},
      {s:0.80, e:0.92, c:'rgba(255,140,0,0.24)'},
      {s:0.92, e:1.00, c:'rgba(255,40,30,0.26)'},
    ];
    zones.forEach(({s,e,c}) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r*0.76, MIN_ANG + s*(MAX_ANG-MIN_ANG), MIN_ANG + e*(MAX_ANG-MIN_ANG));
      ctx.strokeStyle = c;
      ctx.lineWidth = r * 0.17;
      ctx.stroke();
    });

    // Scale marks + dB labels
    const marks = [
      {a:0.00,db:'-20'},{a:0.22,db:'-10'},{a:0.36,db:'-7'},
      {a:0.48,db:'-5'},{a:0.58,db:'-3'},{a:0.66,db:'-2'},
      {a:0.74,db:'-1'},{a:0.82,db:'0'},{a:0.88,db:'+1'},
      {a:0.93,db:'+2'},{a:1.00,db:'+3'},
    ];
    marks.forEach(({a, db}) => {
      const ang = MIN_ANG + a * (MAX_ANG-MIN_ANG);
      const cos = Math.cos(ang), sin = Math.sin(ang);
      const isRed = parseFloat(db) >= 0;
      ctx.beginPath();
      ctx.moveTo(cx + cos*r*0.60, cy + sin*r*0.60);
      ctx.lineTo(cx + cos*r*0.73, cy + sin*r*0.73);
      ctx.strokeStyle = isRed ? 'rgba(255,60,50,0.85)' : rgVizAccent(.55);
      ctx.lineWidth = isRed ? 2.5 : 1.5;
      ctx.stroke();
      // label only on major marks
      if (['-20','-10','-5','-1','0','+3'].includes(db)) {
        ctx.font = `bold ${Math.max(7, r*0.09)}px monospace`;
        ctx.fillStyle = isRed ? 'rgba(255,80,60,0.80)' : rgVizAccent(.60);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(db, cx + cos*r*0.46, cy + sin*r*0.46);
      }
    });

    // Needle
    const powered = Math.pow(Math.min(1, val), 0.85);
    const ang = MIN_ANG + powered * (MAX_ANG-MIN_ANG);
    const nLen = r * 0.68;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang)*nLen, cy + Math.sin(ang)*nLen);
    ctx.strokeStyle = val > 0.88 ? '#ff4040' : 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // Pivot
    ctx.beginPath();
    ctx.arc(cx, cy, r*0.046, 0, Math.PI*2);
    ctx.fillStyle = rgVizAccent(.75);
    ctx.fill();

    // Label
    ctx.font = `900 ${Math.max(9, r*0.12)}px monospace`;
    ctx.fillStyle = rgVizAccent(.60);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('VU', cx, H*0.03);
  });
}

/* ─ LED Bar (mode 9) ─ */
function drawLEDBar(ctx, W, H, data, dt=16.7) {
  ctx.clearRect(0, 0, W, H);

  const COLS = 30, ROWS = 16;
  const GAP_X = Math.min(3,W/180), GAP_Y = Math.min(2,H/64);
  const ledW = (W - GAP_X*(COLS+1)) / COLS;
  const ledH = (H - GAP_Y*(ROWS+1)) / ROWS;

  updatePeaks(data, COLS, .68, dt);

  for (let c = 0; c < COLS; c++) {
    const di = Math.floor((c/COLS) * data.length * 0.68);
    const v  = Math.pow(data[di] / 255, 0.72);
    const lit = Math.round(v * ROWS);
    const pk  = Math.round(RG_peaks[c] * ROWS);
    const x = GAP_X + c * (ledW + GAP_X);

    for (let r = 0; r < ROWS; r++) {
      const y = H - GAP_Y - (r+1)*(ledH+GAP_Y);
      const on  = r < lit;
      const isPk = r === pk && pk > 0;

      if (on) {
        const frac = r / (ROWS-1);
        if (frac < 0.62)      ctx.fillStyle = rgVizAccent(0.65 + frac*0.35);
        else if (frac < 0.82) ctx.fillStyle = `rgba(255,155,0,${0.75 + frac*0.25})`;
        else                  ctx.fillStyle = `rgba(255,45,30,0.95)`;
        ctx.shadowBlur = 0;
      } else if (isPk) {
        ctx.fillStyle = 'rgba(255,255,220,0.92)';
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = rgVizAccent(.07);
        ctx.shadowBlur = 0;
      }

      const pad = Math.min(1.2,ledW*.18,ledH*.18);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x+pad, y+pad, ledW-pad*2, ledH-pad*2, Math.min(1.5,(ledH-pad*2)/2));
      else ctx.rect(x+pad, y+pad, ledW-pad*2, ledH-pad*2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

/* ─ Dot Matrix VU (mode 10) ─ */
function drawDotMatrix(ctx, W, H, data, dt=16.7) {
  ctx.clearRect(0, 0, W, H);

  // Subtle scanlines
  for (let y = 1; y < H; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, y, W, 1);
  }

  const COLS = 50, ROWS = 14;
  const dotR = Math.min(3.2, (W/COLS)*0.26, (H-8)/ROWS*.3);
  const colW = W/COLS, rowH = (H-8)/ROWS;

  updatePeaks(data, COLS, .72, dt);

  for (let c = 0; c < COLS; c++) {
    const di = Math.floor((c/COLS) * data.length * 0.72);
    const v  = Math.pow(data[di] / 255, 0.78);
    const lit = Math.max(0, Math.min(ROWS, Math.round(v * ROWS)));
    const pk  = Math.round(RG_peaks[c] * ROWS);

    for (let r = 0; r < ROWS; r++) {
      const x = (c+0.5) * colW;
      const y = H - 4 - (r+0.5) * rowH;
      const on = r < lit, isPk = r === pk && pk > 0 && !on;
      const top = on && r === lit - 1;

      ctx.beginPath();
      ctx.arc(x, y, on ? (top ? dotR*1.25 : dotR) : (isPk ? dotR*1.1 : dotR*0.85), 0, Math.PI*2);

      if (on) {
        const bright = 0.28 + (r/ROWS)*0.72;
        ctx.fillStyle = rgVizAccent(bright);
        ctx.shadowBlur = 0;
      } else if (isPk) {
        ctx.fillStyle = rgVizAccent(.85, 45);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = rgVizAccent(.04);
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

// ─ Hook new viz modes into existing draw loop ─
(function hookExtraViz(){
  const cvs = document.getElementById('vizCanvas');
  if (!cvs) { setTimeout(hookExtraViz, 500); return; }
  const _ctx = cvs.getContext('2d');
  let extraVizRaf = 0;

  function shouldRunExtraViz() {
    return !document.hidden &&
      !document.body.classList.contains('radio-hidden') &&
      !document.body.classList.contains('radio-idle') &&
      !document.body.classList.contains('radio-anim') &&
      typeof audio !== 'undefined' && !audio.paused &&
      typeof analyser !== 'undefined' && !!analyser &&
      typeof vizStyle !== 'undefined' && vizStyle >= 8 && vizStyle <= 10 &&
      !(typeof isAdjustingVol !== 'undefined' && isAdjustingVol);
  }

  function extraLoop(){
    extraVizRaf = 0;
    if (!shouldRunExtraViz()) return;
    const now = performance.now();
    if (RG_EXTRA_FRAME_MS && (now - RG_extraLastFrameTs) < RG_EXTRA_FRAME_MS) {
      extraVizRaf = requestAnimationFrame(extraLoop);
      return;
    }
    const dt=Math.min(64,Math.max(8,now-RG_extraLastFrameTs));
    RG_extraLastFrameTs = now;

    if (!RG_extraFreqData || RG_extraFreqData.length !== analyser.frequencyBinCount) {
      RG_extraFreqData = new Uint8Array(analyser.frequencyBinCount);
    }
    const data = RG_extraFreqData;
    analyser.getByteFrequencyData(data);

    const w = cvs.clientWidth | 0, h = cvs.clientHeight | 0;
    const ratio=Math.min(window.devicePixelRatio||1,RG_EXTRA_LOW_SPEC?1.5:2);
    if(cvs.width!==Math.round(w*ratio)||cvs.height!==Math.round(h*ratio)){cvs.width=Math.round(w*ratio);cvs.height=Math.round(h*ratio);}
    _ctx.save();_ctx.scale(ratio,ratio);

    if      (vizStyle === 8)  drawVU(_ctx, w, h, data);
    else if (vizStyle === 9)  drawLEDBar(_ctx, w, h, data, dt);
    else if (vizStyle === 10) drawDotMatrix(_ctx, w, h, data, dt);
    _ctx.restore();

    extraVizRaf = requestAnimationFrame(extraLoop);
  }

  function scheduleExtraViz() {
    if (extraVizRaf || !shouldRunExtraViz()) return;
    extraVizRaf = requestAnimationFrame(extraLoop);
  }

  // Start only on real state changes; hidden/disabled visuals have no polling.
  if (typeof audio !== 'undefined') audio.addEventListener('play', scheduleExtraViz);
  window.addEventListener('rg-viz-change',()=>{RG_peaks.fill(0);RG_holdCnt.fill(0);RG_extraLastFrameTs=0;scheduleExtraViz();});
  new MutationObserver(scheduleExtraViz).observe(document.body,{attributes:true,attributeFilter:['class']});
  scheduleExtraViz();
  document.addEventListener('visibilitychange', scheduleExtraViz);
})();

// ─────────────────────────────────────────────────────────────
//  Shared ten-band EQ, applied once to every radio skin.
// ─────────────────────────────────────────────────────────────
(function CustomEQPanel(){
  const engine = window.MinkaEqualizer.create();
  let connected = false;
  function ensure(){
    setupAudio();
    if(!aCtx || !masterGain) throw new Error('Audio unavailable');
    if(!connected){
      masterGain.disconnect();
      engine.connect(aCtx, masterGain, [depthDryGain, depthSplitter]);
      connected = true;
    }
  }
  audio.addEventListener('play', ensure);
  if(!audio.paused) ensure();
  const trigger = document.createElement('button');
  trigger.id = 'ceqTriggerBtn'; trigger.className = 'epb ceq-trigger';
  trigger.type = 'button'; trigger.textContent = 'EQ';
  document.getElementById('eqRow').append(trigger);
  window.MinkaEqualizer.mount({engine, trigger, ensure, balance(value){
    if(!window._rgPanner){
      window._rgPanner = aCtx.createStereoPanner();
      analyser.disconnect(); analyser.connect(window._rgPanner); window._rgPanner.connect(aCtx.destination);
    }
    window._rgPanner.pan.setTargetAtTime(value,aCtx.currentTime,.035);
  }});
  window.rgEqualizer = engine;
})();

/* ═══════════════════════════════════════════════════
   SLOWED REVERB WAVE ANIMATION
   Activates on body.slowed-active, draws animated
   purple/violet sinusoidal waves like image reference
   ═══════════════════════════════════════════════════ */
(function SlowedWave() {
  'use strict';

  const WAVE_COLORS = [
    { r: 160, g: 60,  b: 255, a: 0.55 },  // violet
    { r: 210, g: 80,  b: 255, a: 0.35 },  // purple
    { r: 100, g: 40,  b: 200, a: 0.28 },  // deep blue-violet
    { r: 230, g: 100, b: 255, a: 0.20 },  // pink-violet
  ];

  const WAVES = WAVE_COLORS.map((c, i) => ({
    color: c,
    freq: 0.012 + i * 0.004,
    amp: 0.18 + i * 0.06,
    speed: 0.008 + i * 0.003,
    phase: (i / WAVE_COLORS.length) * Math.PI * 2,
    yOffset: 0.35 + i * 0.08,
  }));

  let raf = 0, t = 0, active = false;
  let cvs = null, ctx = null;
  let lastWaveTs = 0;
  // Five wave paths of several hundred segments each; a background this slow
  // carries nothing at 60 fps that it does not carry at 30, and on the work
  // machines those are frames the rest of the app needs.
  const WAVE_FRAME_MS = (window.__mkPerfProfile && window.__mkPerfProfile.lowSpec) ? 1000 / 20 : 1000 / 30;

  function resize() {
    if (!cvs) return;
    cvs.width  = cvs.clientWidth  || cvs.parentElement?.clientWidth  || 400;
    cvs.height = cvs.clientHeight || cvs.parentElement?.clientHeight || 100;
  }

  function draw(ts = 0) {
    if (!active || !cvs || !ctx) return;
    raf = requestAnimationFrame(draw);
    const now = ts || performance.now();
    const elapsed = lastWaveTs ? now - lastWaveTs : 16.7;
    if (WAVE_FRAME_MS && elapsed < WAVE_FRAME_MS) return;
    lastWaveTs = now;
    // Advance by elapsed time, not by frame, so capping the rate slows the
    // work and not the wave.
    t += Math.min(4, elapsed / 16.7);

    const W = cvs.width, H = cvs.height;
    ctx.clearRect(0, 0, W, H);

    WAVES.forEach(wave => {
      const phase = wave.phase + t * wave.speed;
      ctx.beginPath();
      const steps = Math.max(W, 120);
      for (let x = 0; x <= steps; x++) {
        const xPct = x / steps;
        const y = (wave.yOffset + Math.sin(xPct * Math.PI * 2 * wave.freq * W + phase) * wave.amp) * H;
        if (x === 0) ctx.moveTo(0, y);
        else ctx.lineTo((xPct) * W, y);
      }
      const { r, g, b, a } = wave.color;
      ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = `rgba(${r},${g},${b},${a * 0.8})`;
      ctx.shadowBlur = RG_EXTRA_LOW_SPEC ? 0 : 10;
      ctx.stroke();
    });
  }

  function start() {
    if (active || document.body.classList.contains('radio-viz-off')) return;
    if (!cvs) {
      cvs = document.getElementById('slowedWaveCanvas');
      if (!cvs) return;
      ctx = cvs.getContext('2d');
      resize();
      new ResizeObserver(resize).observe(cvs);
    }
    active = true;
    draw();
  }

  function stop() {
    active = false;
    cancelAnimationFrame(raf);
    if (ctx && cvs) ctx.clearRect(0, 0, cvs.width, cvs.height);
  }

  // Public API — called from setEQ
  window.__slowedWave = { start, stop };
})();
