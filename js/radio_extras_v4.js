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
const PEAK_HOLD  = 38;
const PEAK_DECAY = 0.91;
const RG_EXTRA_LOW_SPEC = !!(window.__mkPerfProfile && window.__mkPerfProfile.lowSpec);
const RG_EXTRA_FRAME_MS = RG_EXTRA_LOW_SPEC ? 1000 / 24 : 0;
let RG_extraLastFrameTs = 0;
let RG_extraFreqData = null;

function updatePeaks(data, n) {
  for (let i = 0; i < n; i++) {
    const v = data[i] / 255;
    if (v > RG_peaks[i]) { RG_peaks[i] = v; RG_holdCnt[i] = PEAK_HOLD; }
    else if (RG_holdCnt[i] > 0) { RG_holdCnt[i]--; }
    else { RG_peaks[i] = Math.max(0, RG_peaks[i] * PEAK_DECAY); }
  }
}

/* ─ VU Meter (mode 8) ─ */
function drawVU(ctx, W, H, data) {
  ctx.clearRect(0, 0, W, H);

  const N = data.length;
  let L = 0, R = 0;
  for (let i = 0; i < N/2; i++) L += data[i];
  for (let i = N/2; i < N; i++) R += data[i];
  L = Math.min(1, (L / (N/2)) / 255 * 1.8);
  R = Math.min(1, (R / (N/2)) / 255 * 1.8);

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
    ctx.strokeStyle = 'rgba(0,255,136,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Colored arc zones (green / orange / red)
    const zones = [
      {s:0.00, e:0.80, c:'rgba(0,200,100,0.20)'},
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
      ctx.strokeStyle = isRed ? 'rgba(255,60,50,0.85)' : 'rgba(0,255,136,0.55)';
      ctx.lineWidth = isRed ? 2.5 : 1.5;
      ctx.stroke();
      // label only on major marks
      if (['-20','-10','-5','-1','0','+3'].includes(db)) {
        ctx.font = `bold ${Math.max(7, r*0.09)}px monospace`;
        ctx.fillStyle = isRed ? 'rgba(255,80,60,0.80)' : 'rgba(0,255,136,0.60)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(db, cx + cos*r*0.46, cy + sin*r*0.46);
      }
    });

    // Needle
    const powered = Math.pow(Math.min(1, val), 0.55);
    const ang = MIN_ANG + powered * (MAX_ANG-MIN_ANG);
    const nLen = r * 0.68;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang)*nLen, cy + Math.sin(ang)*nLen);
    ctx.strokeStyle = val > 0.88 ? '#ff4040' : 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = val > 0.88 ? '#ff3030' : 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    // Pivot
    ctx.beginPath();
    ctx.arc(cx, cy, r*0.046, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,255,136,0.75)';
    ctx.fill();

    // Label
    ctx.font = `900 ${Math.max(9, r*0.12)}px monospace`;
    ctx.fillStyle = 'rgba(0,255,136,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('VU', cx, H*0.03);
  });
}

/* ─ LED Bar (mode 9) ─ */
function drawLEDBar(ctx, W, H, data) {
  ctx.clearRect(0, 0, W, H);

  const COLS = 30, ROWS = 16;
  const GAP_X = 3, GAP_Y = 2;
  const ledW = (W - GAP_X*(COLS+1)) / COLS;
  const ledH = (H - GAP_Y*(ROWS+1)) / ROWS;

  updatePeaks(data, COLS);

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
        if (frac < 0.62)      ctx.fillStyle = `rgba(0,210,100,${0.65 + frac*0.35})`;
        else if (frac < 0.82) ctx.fillStyle = `rgba(255,155,0,${0.75 + frac*0.25})`;
        else                  ctx.fillStyle = `rgba(255,45,30,0.95)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 5;
      } else if (isPk) {
        ctx.fillStyle = 'rgba(255,255,220,0.92)';
        ctx.shadowColor = 'rgba(255,255,255,0.7)';
        ctx.shadowBlur = 7;
      } else {
        ctx.fillStyle = 'rgba(0,70,35,0.20)';
        ctx.shadowBlur = 0;
      }

      const pad = 1.2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x+pad, y+pad, ledW-pad*2, ledH-pad*2, 2);
      else ctx.rect(x+pad, y+pad, ledW-pad*2, ledH-pad*2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

/* ─ Dot Matrix VU (mode 10) ─ */
function drawDotMatrix(ctx, W, H, data) {
  ctx.clearRect(0, 0, W, H);

  // Subtle scanlines
  for (let y = 1; y < H; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, y, W, 1);
  }

  const COLS = 50, ROWS = 14;
  const dotR = Math.min(3.2, (W/COLS)*0.26);
  const colW = W/COLS, rowH = (H-8)/ROWS;

  updatePeaks(data, COLS);

  for (let c = 0; c < COLS; c++) {
    const di = Math.floor((c/COLS) * data.length * 0.72);
    const v  = Math.pow(data[di] / 255, 0.78);
    const lit = Math.max(0, Math.min(ROWS, Math.round(v * ROWS)));
    const pk  = Math.round(RG_peaks[c] * ROWS);

    for (let r = 0; r < ROWS; r++) {
      const x = (c+0.5) * colW;
      const y = H - 4 - (r+0.5) * rowH;
      const on = r < lit, isPk = r === pk && pk > 0 && !on;
      const top = r === lit-1;

      ctx.beginPath();
      ctx.arc(x, y, on ? (top ? dotR*1.25 : dotR) : (isPk ? dotR*1.1 : dotR*0.85), 0, Math.PI*2);

      if (on) {
        const bright = 0.28 + (r/ROWS)*0.72;
        ctx.fillStyle = `rgba(0,255,136,${bright})`;
        ctx.shadowColor = 'rgba(0,255,136,0.55)';
        ctx.shadowBlur = top ? dotR*4 : dotR*2;
      } else if (isPk) {
        ctx.fillStyle = 'rgba(220,255,200,0.85)';
        ctx.shadowColor = 'rgba(200,255,180,0.7)';
        ctx.shadowBlur = dotR*3.5;
      } else {
        ctx.fillStyle = 'rgba(0,255,136,0.04)';
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
  let hooked = false;
  let extraVizRaf = 0;

  function shouldRunExtraViz() {
    return !document.hidden &&
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
    RG_extraLastFrameTs = now;

    if (!RG_extraFreqData || RG_extraFreqData.length !== analyser.frequencyBinCount) {
      RG_extraFreqData = new Uint8Array(analyser.frequencyBinCount);
    }
    const data = RG_extraFreqData;
    analyser.getByteFrequencyData(data);

    const w = cvs.clientWidth | 0, h = cvs.clientHeight | 0;
    if (cvs.width !== w || cvs.height !== h) { cvs.width = w; cvs.height = h; }

    if      (vizStyle === 8)  drawVU(_ctx, w, h, data);
    else if (vizStyle === 9)  drawLEDBar(_ctx, w, h, data);
    else if (vizStyle === 10) drawDotMatrix(_ctx, w, h, data);

    extraVizRaf = requestAnimationFrame(extraLoop);
  }

  function scheduleExtraViz() {
    if (extraVizRaf || !shouldRunExtraViz()) return;
    extraVizRaf = requestAnimationFrame(extraLoop);
  }

  function tryHook(){
    if (hooked) return;
    if (typeof analyser === 'undefined' || !analyser) { setTimeout(tryHook, 500); return; }
    hooked = true;
    scheduleExtraViz();
  }
  tryHook();
  setInterval(scheduleExtraViz, 250);
  document.addEventListener('visibilitychange', scheduleExtraViz);
})();

// ─────────────────────────────────────────────────────────────
//  CUSTOM 5-BAND EQ PANEL
// ─────────────────────────────────────────────────────────────
(function CustomEQPanel(){
  let eqNodes  = null;
  let panelOpen = false;
  let currentGains = [0,0,0,0,0];

  const EQ_BANDS = [
    { freq:60,    type:'lowshelf',  label:'60Hz'  },
    { freq:250,   type:'peaking',   label:'250Hz' },
    { freq:1000,  type:'peaking',   label:'1kHz'  },
    { freq:4000,  type:'peaking',   label:'4kHz'  },
    { freq:12000, type:'highshelf', label:'12kHz' },
  ];

  const PRESETS = {
    'FLAT':     [0,0,0,0,0],
    'BASS+':    [9,4,-1,-2,-1],
    'VOCAL':    [-3,2,5,3,-1],
    'TREBLE+':  [-2,-2,0,4,8],
    'LOUDNESS': [6,2,-1,2,5],
    'NIGHT':    [4,2,0,-3,-5],
    'JAZZ':     [2,1,3,2,4],
    'ROCK':     [5,2,-1,3,4],
    'DANCE':    [6,-1,-3,-1,4],
    'CLASSIC':  [2,-1,-1,1,3],
  };

  function ensureNodes(){
    if (eqNodes) return true;
    if (typeof aCtx === 'undefined' || !aCtx) return false;
    try {
      eqNodes = EQ_BANDS.map(({freq, type}) => {
        const n = aCtx.createBiquadFilter();
        n.type = type; n.frequency.value = freq; n.Q.value = 1; n.gain.value = 0;
        return n;
      });
      if (typeof masterGain !== 'undefined' && masterGain &&
          typeof depthDryGain !== 'undefined' && depthDryGain &&
          typeof depthSplitter !== 'undefined' && depthSplitter) {
        masterGain.disconnect();
        masterGain.connect(eqNodes[0]);
        for (let i=0; i<eqNodes.length-1; i++) eqNodes[i].connect(eqNodes[i+1]);
        const last = eqNodes[eqNodes.length-1];
        last.connect(depthDryGain);
        last.connect(depthSplitter);
      }
      return true;
    } catch(e) { eqNodes = null; return false; }
  }

  function setGains(gains){
    currentGains = [...gains];
    if (!ensureNodes()) return;
    gains.forEach((g,i) => {
      eqNodes[i].gain.setTargetAtTime(g, aCtx.currentTime, 0.04);
    });
    syncUI();
  }

  function setPreset(name){
    const g = PRESETS[name];
    if (!g) return;
    setGains(g);
    document.querySelectorAll('.ceq-preset-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.preset === name));
  }

  function syncUI(){
    currentGains.forEach((g, i) => {
      const fill  = document.querySelector(`.ceq-band-fill[data-band="${i}"]`);
      const val   = document.querySelector(`.ceq-band-val[data-band="${i}"]`);
      const thumb = document.querySelector(`.ceq-band-thumb[data-band="${i}"]`);
      if (!fill) return;
      const pct = (g + 12) / 24; // 0→1
      if (g > 0) {
        fill.style.top    = 'auto';
        fill.style.bottom = '50%';
        fill.style.height = ((pct - 0.5) * 100) + '%';
        fill.style.background = 'linear-gradient(to top, rgba(0,255,136,0.88), rgba(0,180,90,0.50))';
      } else if (g < 0) {
        fill.style.bottom = 'auto';
        fill.style.top    = '50%';
        fill.style.height = ((0.5 - pct) * 100) + '%';
        fill.style.background = 'linear-gradient(to bottom, rgba(255,80,60,0.78), rgba(255,150,120,0.40))';
      } else {
        fill.style.height = '0%';
      }
      if (val) val.textContent = (g >= 0 ? '+' : '') + g.toFixed(0) + 'dB';
      if (thumb) thumb.style.top = `calc(${(1 - pct) * 100}% - 6px)`;
    });
  }

  function buildPanel(){
    if (document.getElementById('ceqPanel')) return document.getElementById('ceqPanel');
    const panel = document.createElement('div');
    panel.id = 'ceqPanel';
    panel.style.display = 'none';

    const presetHtml = Object.keys(PRESETS).map(k =>
      `<button class="ceq-preset-btn" data-preset="${k}">${k}</button>`).join('');

    const bandsHtml = EQ_BANDS.map((b,i) => `
      <div class="ceq-band">
        <div class="ceq-band-track" data-band="${i}">
          <div class="ceq-band-fill" data-band="${i}"></div>
          <div class="ceq-center-line"></div>
          <div class="ceq-band-thumb" data-band="${i}"></div>
        </div>
        <div class="ceq-band-val" data-band="${i}">0dB</div>
        <div class="ceq-band-label">${b.label}</div>
      </div>`).join('');

    panel.innerHTML = `
      <div class="ceq-head">
        <div class="ceq-title"><span class="ceq-dot"></span>CUSTOM EQ</div>
        <button class="ceq-close" id="ceqClose">×</button>
      </div>
      <div class="ceq-presets">${presetHtml}</div>
      <div class="ceq-body">
        <div class="ceq-bands">${bandsHtml}</div>
        <div class="ceq-bal">
          <div class="ceq-bal-track" id="ceqBalTrack">
            <div class="ceq-bal-thumb" id="ceqBalThumb"></div>
          </div>
          <div class="ceq-bal-label">BAL</div>
          <div class="ceq-bal-val" id="ceqBalVal">C</div>
        </div>
      </div>
      <div class="ceq-foot">
        <button class="ceq-fb" id="ceqFlatBtn">FLAT</button>
        <button class="ceq-fb" id="ceqRstBtn">RESET</button>
      </div>`;

    document.body.appendChild(panel);

    panel.querySelector('#ceqClose').onclick = closePanel;
    panel.querySelector('#ceqFlatBtn').onclick = () => setPreset('FLAT');
    panel.querySelector('#ceqRstBtn').onclick  = () => {
      setPreset('FLAT');
      setBalance(0);
    };
    panel.querySelectorAll('.ceq-preset-btn').forEach(b =>
      b.addEventListener('click', () => setPreset(b.dataset.preset)));

    // Band drag
    panel.querySelectorAll('.ceq-band-track').forEach(track => {
      const band = parseInt(track.dataset.band);
      let dragging = false;
      const handleMove = (clientY) => {
        const rect = track.getBoundingClientRect();
        let pct = 1 - (clientY - rect.top) / rect.height;
        pct = Math.max(0, Math.min(1, pct));
        const gain = Math.round(pct * 24 - 12);
        currentGains[band] = gain;
        if (ensureNodes()) {
          eqNodes[band].gain.setTargetAtTime(gain, aCtx.currentTime, 0.025);
        }
        const val   = panel.querySelector(`.ceq-band-val[data-band="${band}"]`);
        const fill  = panel.querySelector(`.ceq-band-fill[data-band="${band}"]`);
        const thumb = panel.querySelector(`.ceq-band-thumb[data-band="${band}"]`);
        if (val) val.textContent = (gain >= 0 ? '+' : '') + gain + 'dB';
        if (thumb) thumb.style.top = `calc(${(1-pct)*100}% - 6px)`;
        if (fill) {
          // Fill always anchored at center (50%), extends up (positive) or down (negative)
          if (gain >= 0) {
            const h = (pct - 0.5) * 100;
            fill.style.bottom = '50%';
            fill.style.height = h + '%';
            fill.style.top = 'auto';
            fill.style.background = 'linear-gradient(to top, rgba(0,255,136,.88), rgba(0,180,90,.50))';
          } else {
            const h = (0.5 - pct) * 100;
            fill.style.top = '50%';
            fill.style.height = h + '%';
            fill.style.bottom = 'auto';
            fill.style.background = 'linear-gradient(to bottom, rgba(255,80,60,.78), rgba(255,150,120,.40))';
          }
          if (gain === 0) { fill.style.height = '0%'; }
        }
        panel.querySelectorAll('.ceq-preset-btn').forEach(b => b.classList.remove('active'));
      };

      track.addEventListener('pointerdown', (e) => {
        dragging = true;
        track.setPointerCapture(e.pointerId);
        handleMove(e.clientY);
      });
      track.addEventListener('pointermove', (e) => { if (dragging) handleMove(e.clientY); });
      track.addEventListener('pointerup', () => { dragging = false; });
      track.addEventListener('pointercancel', () => { dragging = false; });
    });

    // Balance drag
    setupBalanceDrag(panel);

    // Click outside
    document.addEventListener('pointerdown', (e) => {
      if (!panelOpen) return;
      if (panel.contains(e.target)) return;
      const btn = document.getElementById('ceqTriggerBtn');
      if (btn && btn.contains(e.target)) return;
      closePanel();
    }, { passive: true });

    return panel;
  }

  let balVal = 0;
  function setBalance(v) {
    balVal = Math.max(-1, Math.min(1, v));
    const valEl = document.getElementById('ceqBalVal');
    if (valEl) valEl.textContent = balVal === 0 ? 'C' : (balVal < 0 ? 'L'+Math.abs(Math.round(balVal*100)) : 'R'+Math.round(balVal*100));
    const thumb = document.getElementById('ceqBalThumb');
    const track = document.getElementById('ceqBalTrack');
    if (thumb && track) {
      const pct = (balVal + 1) / 2;
      thumb.style.top = `calc(${(1-pct)*100}% - 6px)`;
    }
    // Apply stereo panner
    try {
      if (!window._rgPanner) {
        if (typeof aCtx !== 'undefined' && aCtx && typeof analyser !== 'undefined' && analyser) {
          const panner = aCtx.createStereoPanner();
          analyser.disconnect();
          analyser.connect(panner);
          panner.connect(aCtx.destination);
          window._rgPanner = panner;
        }
      } else {
        window._rgPanner.pan.setTargetAtTime(balVal, aCtx.currentTime, 0.05);
      }
    } catch(e) {}
  }

  function setupBalanceDrag(panel) {
    const track = panel.querySelector('#ceqBalTrack');
    const thumb = panel.querySelector('#ceqBalThumb');
    if (!track || !thumb) return;
    let dragging = false;
    track.addEventListener('pointerdown', (e) => {
      dragging = true;
      track.setPointerCapture(e.pointerId);
      const r = track.getBoundingClientRect();
      setBalance((1 - (e.clientY - r.top) / r.height) * 2 - 1);
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const r = track.getBoundingClientRect();
      setBalance((1 - (e.clientY - r.top) / r.height) * 2 - 1);
    });
    track.addEventListener('pointerup', () => { dragging = false; });
    track.addEventListener('pointercancel', () => { dragging = false; });
  }

  function position(){
    const panel = document.getElementById('ceqPanel');
    const btn   = document.getElementById('ceqTriggerBtn');
    if (!panel || !btn) return;
    const r = btn.getBoundingClientRect();
    const pw = 320, ph = panel.offsetHeight || 330;
    let left = r.left + r.width/2 - pw/2;
    left = Math.max(10, Math.min(window.innerWidth - pw - 10, left));
    let top = r.top - ph - 10;
    if (top < 10) top = r.bottom + 10;
    panel.style.left = left + 'px';
    panel.style.top  = top  + 'px';
    panel.style.width = pw + 'px';
  }

  function openPanel(){
    const panel = buildPanel();
    panelOpen = true;
    panel.style.display = 'block';
    position();
    syncUI();
    const btn = document.getElementById('ceqTriggerBtn');
    if (btn) btn.classList.add('active');
  }

  function closePanel(){
    const panel = document.getElementById('ceqPanel');
    if (panel) panel.style.display = 'none';
    panelOpen = false;
    const btn = document.getElementById('ceqTriggerBtn');
    if (btn) btn.classList.remove('active');
  }

  function injectBtn(){
    if (document.getElementById('ceqTriggerBtn')) return;
    const eqRow = document.getElementById('eqRow');
    if (!eqRow) { setTimeout(injectBtn, 400); return; }
    const btn = document.createElement('button');
    btn.id = 'ceqTriggerBtn';
    btn.className = 'eq-btn ceq-trigger';
    btn.type = 'button';
    btn.title = 'Custom EQ';
    btn.textContent = 'EQ+';
    btn.onclick = () => panelOpen ? closePanel() : openPanel();
    eqRow.appendChild(btn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectBtn);
  else setTimeout(injectBtn, 400);
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

  function resize() {
    if (!cvs) return;
    cvs.width  = cvs.clientWidth  || cvs.parentElement?.clientWidth  || 400;
    cvs.height = cvs.clientHeight || cvs.parentElement?.clientHeight || 100;
  }

  function draw() {
    if (!active || !cvs || !ctx) return;
    raf = requestAnimationFrame(draw);
    t += 1;

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
      ctx.shadowBlur = 10;
      ctx.stroke();
    });
  }

  function start() {
    if (active) return;
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
