// RG 2.0 soak: N day switches, M radio open/close cycles, then an idle window, on the hospital-PC proxy
// (deviceMemory 8, CPU throttled). Samples heap (after GC), DOM nodes, listeners every 100 switches.
// URLB=http://127.0.0.1:8012 SWITCHES=1000 RADIO=100 CPU=4 OUT=/tmp/x.json node rg2-soak.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const URLB = process.env.URLB || 'http://127.0.0.1:8012';
const SWITCHES = +(process.env.SWITCHES || 1000), RADIO = +(process.env.RADIO || 100), CPU = +(process.env.CPU || 4);
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(1); };
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--expose-gc'] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  await ctx.addInitScript(() => {
    try { Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 8, configurable: true }); Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 12, configurable: true }); } catch (_) {}
    // frame recorder: rAF deltas while recording, long animation frames always
    window.__rg2 = { on: false, d: [], loaf50: 0, loaf100: 0, last: 0 };
    const tick = (t) => { const r = window.__rg2; if (r.on && r.last) r.d.push(t - r.last); r.last = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!window.__rg2.on) return; if (e.duration > 50) window.__rg2.loaf50++; if (e.duration > 100) window.__rg2.loaf100++; })).observe({ type: 'long-animation-frame', buffered: false }); } catch (_) {}
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto(URLB + '/index.html?visible=1', { waitUntil: 'load' }); await p.waitForTimeout(10000);
  const cal = () => p.frame({ url: /kalendars\/index\.html/ });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const sample = async (label) => {
    await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(300);
    const m = await metrics(); const dc = await cdp.send('Memory.getDOMCounters').catch(() => ({}));
    const calHeap = await cal().evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
    return { label, jsHeapMB: +(m.JSHeapUsedSize / 1048576).toFixed(1), calHeapMB: +(calHeap / 1048576).toFixed(1), nodes: m.Nodes, docs: m.Documents, listeners: m.JSEventListeners, domNodes: dc.nodes, layoutObjects: m.LayoutObjects };
  };
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const samples = [await sample('start')];
  // day switches: every day of the month in a scrambled order (near and far jumps, cold and prepared days)
  const ids = await cal().evaluate(() => [...document.querySelectorAll('[id^="p-"]')].map(e => e.id));
  const order = ids.map((id, i) => ids[(i * 7) % ids.length]);
  await cal().evaluate(() => { window.__rg2.on = true; window.__rg2.d = []; window.__rg2.loaf50 = 0; window.__rg2.loaf100 = 0; });
  const lat = []; const t0 = Date.now(); const m0 = await metrics();
  for (let i = 0; i < SWITCHES; i++) {
    const id = order[i % order.length];
    const ms = await cal().evaluate((id) => new Promise((res) => {
      const el = document.getElementById(id); if (!el) return res(-1);
      const t = performance.now(); el.click();
      const done = () => requestAnimationFrame(() => requestAnimationFrame(() => res(performance.now() - t)));
      const wait = () => { if (document.documentElement.classList.contains('mk-day-vt')) setTimeout(wait, 5); else done(); };
      setTimeout(wait, 0);
    }), id);
    if (ms >= 0) lat.push(ms);
    await p.waitForTimeout(400);
    if ((i + 1) % 100 === 0) samples.push(await sample('switch ' + (i + 1)));
  }
  const m1 = await metrics();
  const fr = await cal().evaluate(() => { const r = window.__rg2; r.on = false; return { d: r.d, l50: r.loaf50, l100: r.loaf100 }; });
  const switching = { n: lat.length, p50: pct(lat, .5), p95: pct(lat, .95), p99: pct(lat, .99), max: +Math.max(...lat).toFixed(1),
    frameP95: pct(fr.d, .95), frameP99: pct(fr.d, .99), loaf50: fr.l50, loaf100: fr.l100,
    taskMsPerSwitch: +(((m1.TaskDuration - m0.TaskDuration) * 1000) / Math.max(1, lat.length)).toFixed(1),
    layoutsPerSwitch: +((m1.LayoutCount - m0.LayoutCount) / Math.max(1, lat.length)).toFixed(1),
    styleRecalcsPerSwitch: +((m1.RecalcStyleCount - m0.RecalcStyleCount) / Math.max(1, lat.length)).toFixed(1), wallMin: +((Date.now() - t0) / 60000).toFixed(1) };
  // radio: open (fed by an oscillator analyser, marked playing) and close, M times
  await p.evaluate(() => { const ac = new AudioContext(), o = ac.createOscillator(), an = ac.createAnalyser(), g = ac.createGain(); o.frequency.value = 110; g.gain.value = 0; o.connect(an); an.connect(g); g.connect(ac.destination); o.start(); window.__mkRadioAnalyser = () => an; window.__rg2.on = true; window.__rg2.d = []; window.__rg2.loaf50 = 0; window.__rg2.loaf100 = 0; });
  const rOpen = [];
  for (let i = 0; i < RADIO; i++) {
    const ms = await p.evaluate(() => new Promise(res => { const t = performance.now(); window.toggleRadio(); const mx = document.getElementById('rmx');
      const chk = () => { const rw = document.getElementById('radioWindow'); if (rw && rw.offsetWidth && getComputedStyle(rw).display !== 'none') requestAnimationFrame(() => requestAnimationFrame(() => res(performance.now() - t))); else setTimeout(chk, 5); }; chk();
      if (mx) mx.classList.add('rmx-playing'); }));
    rOpen.push(ms); await p.waitForTimeout(900);
    await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(600);
    if ((i + 1) % 50 === 0) samples.push(await sample('radio ' + (i + 1)));
  }
  const rf = await p.evaluate(() => { const r = window.__rg2; r.on = false; return { d: r.d, l50: r.loaf50, l100: r.loaf100 }; });
  const radio = { n: rOpen.length, openP50: pct(rOpen, .5), openP95: pct(rOpen, .95), frameP95: pct(rf.d, .95), frameP99: pct(rf.d, .99), loaf50: rf.l50, loaf100: rf.l100 };
  // idle: 30 s, nothing happening
  const i0 = await metrics(); await p.waitForTimeout(30000); const i1 = await metrics();
  const idle = { cpuPct: +(((i1.TaskDuration - i0.TaskDuration) / 30) * 100).toFixed(2), layouts: i1.LayoutCount - i0.LayoutCount, styleRecalcs: i1.RecalcStyleCount - i0.RecalcStyleCount };
  samples.push(await sample('end'));
  const out = { url: URLB, cpuThrottle: CPU, switching, radio, idle, samples, errors: [...new Set(errs)].slice(0, 10) };
  console.log(JSON.stringify(out, null, 1));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  await b.close();
})();
