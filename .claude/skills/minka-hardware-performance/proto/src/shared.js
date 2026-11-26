// Shared by every RG 2.0 prototype: the captured days (from the current RG, after all its decorators), the
// regions a day switch changes, the radio (one analyser, one 15 fps loop, the Pioneer skin's own drawing code)
// and the day pills. Each engine only decides HOW a day's regions get into the page.
export async function loadDays() {
  const r = await fetch('/__rg2/days.json');
  return r.json();
}
export function setAttrs(el, attrs) {
  for (const a of [...el.attributes]) if (!(a.name in attrs)) el.removeAttribute(a.name);
  for (const [k, v] of Object.entries(attrs)) if (el.getAttribute(k) !== v) el.setAttribute(k, v);
}
export function applyRootAttrs(day) {
  setAttrs(document.body, day.body);
  // <html> keeps the prototype's own markers
  const keep = { 'data-rg2': document.documentElement.getAttribute('data-rg2') };
  setAttrs(document.documentElement, Object.assign({}, day.html, keep));
}
// the day pills: delegated, as every engine shares the same pill markup
export function bindPills(switchTo) {
  document.addEventListener('click', (e) => {
    const pill = e.target.closest && e.target.closest('[id^="p-"]');
    if (!pill) return;
    const m = /^p-(\d{2}-\d{2}-\d{4})$/.exec(pill.id);
    if (m) switchTo(m[1]);
  });
}
/* ---------- the radio: one audio graph, one analyser, one loop, the skin only draws ---------- */
export function startRadio() {
  if (!/[?&]radio=1/.test(location.search)) return;
  const box = document.createElement('div');
  box.id = 'rg2-radio';
  box.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);width:1104px;height:110px;background:#0b0f15;border:1px solid #1c2633;border-radius:18px;z-index:60;contain:strict';
  const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;left:20px;top:10px;width:1064px;height:90px';
  box.appendChild(cv); document.body.appendChild(box);
  const ac = new AudioContext(), an = ac.createAnalyser(); an.fftSize = 1024;
  const o = ac.createOscillator(); o.type = 'sawtooth'; const l = ac.createOscillator(); l.frequency.value = 2; const lg = ac.createGain(); lg.gain.value = 300; l.connect(lg); lg.connect(o.frequency); l.start();
  const g = ac.createGain(); g.gain.value = 0.001; o.connect(an); an.connect(g); g.connect(ac.destination); o.start();
  const ctx = cv.getContext('2d'), N = 24, now = new Float32Array(N), slow = new Float32Array(N), peak = new Float32Array(N);
  let data = null, top = .12, last = 0, raf = 0, d = 1, W = 0, H = 0; const acc = '#7fd1ff';
  function read() {
    if (!data) data = new Uint8Array(an.frequencyBinCount);
    an.getByteFrequencyData(data);
    const ny = ac.sampleRate / 2, L = data.length, lv = []; let m = 0, f = 1;
    for (let i = 0; i < N; i++) { const lo = Math.floor(L * 50 * Math.pow(280, i / N) / ny), hi = Math.max(lo + 1, Math.floor(L * 50 * Math.pow(280, (i + 1) / N) / ny)); let v = 0; for (let j = lo; j < hi && j < L; j++) if (data[j] > v) v = data[j]; lv[i] = v / 255 + i / N * .26; if (lv[i] > m) m = lv[i]; if (lv[i] < f) f = lv[i]; }
    top = Math.max(m - f, top * .97, .12);
    for (let i = 0; i < N; i++) { const v = Math.pow(Math.max(0, lv[i] - f) / top, 1.6) * .95; now[i] = now[i] * .45 + v * .55; slow[i] = slow[i] * .88 + v * .12; peak[i] = Math.max(now[i], peak[i] - .012); }
  }
  const at = (lv, x) => { const p = x * (N - 1), i = Math.floor(p), t = p - i; return lv[i] * (1 - t) + lv[Math.min(N - 1, i + 1)] * t; };
  function hills(lv, off, base) { ctx.beginPath(); ctx.moveTo(0, base); let px = 0, py = base; for (let i = 0; i <= N; i++) { const x = i < N ? Math.min(W, (i + .5 + off) / N * W) : W, y = i < N ? base - Math.min(1, lv[i]) * (base - 2 * d) : base; ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2); px = x; py = y; } ctx.lineTo(W, base); }
  function pioneer() { // js/radio-max.js SKINS.pioneer, verbatim
    const base = H - d, n = Math.max(24, Math.round(W / (12.5 * d))), bw = W / n, seg = 6.4 * d, rows = Math.floor((base - 4 * d) / seg);
    ctx.fillStyle = acc;
    for (let i = 0; i < n; i++) { const lit = Math.round(at(now, i / (n - 1)) * rows); for (let k = 0; k < lit; k++) { ctx.globalAlpha = .3 + .7 * (k / rows); ctx.fillRect(i * bw + d, base - 6 * d - k * seg, bw - 3 * d, 3.4 * d); } }
    ctx.globalAlpha = .5; ctx.strokeStyle = acc; ctx.lineWidth = d; hills(peak, .45, base); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillRect(0, base, W, d);
  }
  function draw() { d = Math.min(2, devicePixelRatio || 1); W = Math.round(1064 * d); H = Math.round(90 * d); if (cv.width !== W) { cv.width = W; cv.height = H; } ctx.clearRect(0, 0, W, H); pioneer(); }
  // 15 frames a second (a low-spec PC), woken shortly before each is due (as js/radio-max.js now does)
  function frame(ts) { raf = 0; if (ts - last >= 66) { last = ts; read(); draw(); } const wait = Math.max(0, last + 66 - ts - 12); if (!wait) raf = requestAnimationFrame(frame); else setTimeout(() => { raf = requestAnimationFrame(frame); }, wait); }
  raf = requestAnimationFrame(frame);
}
// a switch's own measure: from the call to the next frame on screen (the time a person waits)
export function exposeApi(switchTo, days, extra) {
  window.__rg2 = Object.assign({ switchTo, days: Object.keys(days.days) }, extra || {});
}
