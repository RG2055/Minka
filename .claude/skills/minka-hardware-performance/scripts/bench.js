// Whole-app resource benchmark. One browser per variant; scenarios run in sequence.
// Total CPU = utime+stime of every Chrome process (renderer, GPU, compositor, raster, audio, workers), real work.
// Main thread runs CPU-throttled (x4, an old i5) so latencies and dropped frames look like a weak PC.
// usage: [BASE=1] node bench.js [rate=4] [out.json]
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const applyVariant = require('./variant.js');
const RATE = +(process.argv[2] || 4), OUT = process.argv[3];
const TICK = +execSync('getconf CLK_TCK').toString().trim();

function procTree(root) {
  const rows = execSync('ps -eo pid=,ppid=').toString().trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number));
  const kids = {}; rows.forEach(([pid, ppid]) => { (kids[ppid] ||= []).push(pid); });
  const out = []; const st = [root]; while (st.length) { const p = st.pop(); out.push(p); (kids[p] || []).forEach((c) => st.push(c)); }
  return out;
}
function cpuAndRss(root) {
  let ticks = 0, rss = 0; const byType = {};
  for (const pid of procTree(root)) {
    try {
      const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8'); const f = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
      const t = +f[11] + +f[12]; ticks += t; rss += +f[21] * 4096;
      const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8'); const type = (cmd.match(/--type=([\w-]+)/) || [, 'browser'])[1];
      const ut = (cmd.match(/--utility-sub-type=([\w.]+)/) || [, ''])[1];
      const k = type + (ut ? ':' + ut.split('.').pop() : ''); byType[k] = (byType[k] || 0) + t;
    } catch (_) {}
  }
  return { ms: (ticks / TICK) * 1000, rssMB: rss / 1048576, byType };
}

(async () => {
  const tag = 'bench' + process.pid;
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--user-agent-suffix-' + tag] });
  const root = +execSync('ps -eo pid=,args=').toString().split('\n').find((l) => l.includes(tag) && !/--type=/.test(l)).trim().split(/\s+/)[0];
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, timezoneId: 'Europe/Riga' });
  const variant = await applyVariant(ctx);
  // Event Timing in every frame: input → next paint, per interaction.
  await ctx.addInitScript(() => {
    window.__evt = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (/^(pointerdown|pointerup|click|keydown|pointerover|mouseover)$/.test(e.name)) window.__evt.push({ n: e.name, d: e.duration, delay: e.processingStart - e.startTime, proc: e.processingEnd - e.processingStart, t: e.startTime }); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch (_) {}
  });
  const p = await ctx.newPage();
  await require('./variant.js').setClock(p);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(10000);
  const cal = () => p.frame({ url: /kalendars\/index\.html/ });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const perf = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const drainEvt = async () => { const all = []; for (const f of p.frames()) { const e = await f.evaluate(() => { const x = window.__evt || []; window.__evt = []; return x; }).catch(() => []); all.push(...e); } return all; };

  // Spectrum feed (the radio has no stream here): a real AnalyserNode on oscillators, as music would give.
  async function spectrumOn() {
    await p.evaluate(() => {
      if (!window.__benchAn) {
        const ac = new AudioContext(); const an = ac.createAnalyser(); const g = ac.createGain(); g.gain.value = 0.0001;
        [110, 220, 660, 1800, 5200].forEach((f, i) => { const o = ac.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'square'; o.frequency.value = f; const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.7 + i; lg.gain.value = f * 0.05; lfo.connect(lg); lg.connect(o.frequency); lfo.start(); o.connect(an); o.start(); });
        an.connect(g); g.connect(ac.destination); window.__benchAn = an;
      }
      window.__mkRadioAnalyser = () => window.__benchAn;
      const mx = document.getElementById('rmx'); if (mx) mx.classList.add('rmx-playing');
      document.body.classList.toggle('mk-bench');
    });
  }

  async function measure(label, fn) {
    await drainEvt();
    const ev = []; const onData = (e) => ev.push(...e.value); cdp.on('Tracing.dataCollected', onData);
    const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'viz', 'gpu', 'benchmark', 'disabled-by-default-devtools.timeline.frame'] } });
    const c0 = cpuAndRss(root), m0 = await perf(), t0 = Date.now();
    await fn();
    const c1 = cpuAndRss(root), m1 = await perf(), wall = (Date.now() - t0) / 1000;
    await cdp.send('Tracing.end'); await done; cdp.off('Tracing.dataCollected', onData);
    const evt = await drainEvt();
    const X = ev.filter((e) => e.ph === 'X');
    const sum = (re) => X.filter((e) => re.test(e.name)).reduce((s, e) => s + e.dur, 0) / 1000;
    // frames: PipelineReporter (one per frame the compositor tried to produce)
    const rpid = (() => { const c = {}; X.filter((e) => e.name === 'UpdateLayoutTree').forEach((e) => { c[e.pid] = (c[e.pid] || 0) + 1; }); return +Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0]; })();
    const pr = ev.filter((e) => e.name === 'PipelineReporter' && e.ph === 'b' && e.pid === rpid);
    const states = {}; pr.forEach((e) => { const s = ((e.args.frame_reporter || {}).state || '?').replace('STATE_', ''); states[s] = (states[s] || 0) + 1; });
    const dropped = (states.DROPPED || 0), partial = (states.PRESENTED_PARTIAL || 0), presented = (states.PRESENTED_ALL || 0) + partial;
    const inter = evt.filter((e) => e.n !== 'pointerover' && e.n !== 'mouseover').map((e) => e.d).sort((a, b) => a - b);
    const hov = evt.filter((e) => e.n === 'pointerover' || e.n === 'mouseover').map((e) => e.d).sort((a, b) => a - b);
    const q = (a, f) => (a.length ? +a[Math.min(a.length - 1, Math.floor(a.length * f))].toFixed(0) : 0);
    const r = {
      label, wall: +wall.toFixed(1),
      totalCpuMs_perSec: +((c1.ms - c0.ms) / wall).toFixed(0),          // all processes, real CPU (1000 = one full core)
      //byProcess_perSec: Object.fromEntries(Object.keys(c1.byType).map((k) => [k, +((((c1.byType[k] - (c0.byType[k] || 0)) / TICK) * 1000) / wall).toFixed(0)]).filter(([, v]) => v > 0)),
      mainThreadBusyPct_x4: +(((m1.TaskDuration - m0.TaskDuration) / wall) * 100).toFixed(1),
      styleMs: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000).toFixed(0), layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(0),
      gpuProcessCpuMs_perSec: +((((c1.byType['gpu-process'] || 0) - (c0.byType['gpu-process'] || 0)) / TICK * 1000) / wall).toFixed(0), rasterMs: +(sum(/^RasterTask$/)).toFixed(0),
      paintCommitMs: +(sum(/^(Paint|PrePaint|Layerize|Commit)$/)).toFixed(0),
      frames: { presented, dropped, partial, droppedPct: presented + dropped ? +((100 * (dropped + partial)) / (presented + dropped)).toFixed(1) : 0 },
      interactions: { n: inter.length, p50: q(inter, .5), p90: q(inter, .9), max: inter.length ? +inter[inter.length - 1].toFixed(0) : 0 },
      hover: { n: hov.length, p90: q(hov, .9), max: hov.length ? +hov[hov.length - 1].toFixed(0) : 0 },
      rssMB: +c1.rssMB.toFixed(0), heapMB: +(m1.JSHeapUsedSize / 1048576).toFixed(1), nodes: m1.Nodes, listeners: m1.JSEventListeners
    };
    console.log(JSON.stringify(r));
    return r;
  }

  const pill = (d) => cal().locator(`#p-${d}-09-2026`);
  async function daySwitches(n, gap) { const days = ['25', '26', '27', '28', '29', '23', '22', '21', '10', '13', '16', '19']; for (let i = 0; i < n; i++) { await pill(days[i % days.length]).click(); await p.waitForTimeout(gap); } }
  async function hoverCards(rounds) {
    const cards = await cal().locator('#grafiks-list .card').all();
    for (let r = 0; r < rounds; r++) for (const c of cards.slice(0, 7)) { try { await c.hover({ timeout: 2000 }); } catch (_) {} await p.waitForTimeout(120); }
    await p.mouse.move(960, 1060);
  }
  async function windows() {
    const open = [['openMonthCalFromDock()', 1200], ['openStatsFromDock()', 1500], ['toggleNsFromParent()', 1500], ['openSettingsFromDock()', 1200]];
    for (const [fn, wait] of open) { await p.evaluate(fn).catch(() => {}); await p.waitForTimeout(wait); await p.keyboard.press('Escape'); await p.waitForTimeout(900); }
    await p.evaluate(() => { try { window.toggleNsFromParent && document.body && 0; } catch (_) {} });
  }

  const results = { variant, rate: RATE, scenarios: [] };
  const add = async (label, fn) => results.scenarios.push(await measure(label, fn));
  if (!process.env.ONLY_SPECTRUM) {
  await add('idle 10 s', () => p.waitForTimeout(10000));
  await add('day switching (8 clicks)', () => daySwitches(8, 900));
  await add('card hover', () => hoverCards(2));
  await add('dock windows open/close', windows);
  }
  await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(2500);
  if (process.env.SKIN) { await p.evaluate((s) => { document.getElementById('radioWindow').dataset.radioSkin = s; }, process.env.SKIN); await p.waitForTimeout(500); }
  await add('radio open, paused, idle 10 s', () => p.waitForTimeout(10000));
  await spectrumOn(); await p.waitForTimeout(1500);
  await add('radio spectrum, idle 10 s', () => p.waitForTimeout(10000));
  if (!process.env.ONLY_SPECTRUM) await add('ALL: spectrum + switching + hover + windows', async () => { await daySwitches(4, 700); await hoverCards(1); await windows(); await daySwitches(4, 700); });
  results.errors = [...new Set(errs)];
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  console.log('variant', variant, 'errors', results.errors.length);
  await b.close();
})();
