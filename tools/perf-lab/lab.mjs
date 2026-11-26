// RG Engine Performance Lab: real Google Chrome (GPU on), Playwright + CDP, real RG data, before/after.
// Not part of the PWA (scripts/build-pages.mjs ships a fixed list of folders) and its results live outside the repo
// (~/RG-perf-lab), never on GitHub: they hold real names. CPU throttling is a CPU model only; it is NOT an Intel
// UHD 630 (the GPU side is the M5's), so GPU numbers here compare versions, not machines.
//
//   node tools/perf-lab/lab.mjs --login                      once: log in to RG in both variants' windows
//   node tools/perf-lab/lab.mjs                              quick gate: 1x and 4x, every scenario, short counts
//   node tools/perf-lab/lab.mjs --full                       1x 2x 4x 6x, 1000-switch soak, 100 radio cycles
//   options: --a NAME=URL --b NAME=URL (default rg1 :8041, rg2 :8028), --cpu 1,4  --switches N  --radio N  --trace
import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const require = createRequire(new URL('../../tests/e2e/node_modules/', import.meta.url));
const { chromium } = require('playwright'); const { PNG } = require('pngjs'); const pixelmatch = require('pixelmatch');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const FULL = !!arg('full', false), LOGIN = !!arg('login', false), TRACE = !!arg('trace', false);
const pair = s => { const [n, u] = String(s).split('='); return { name: n, url: u.replace(/\/$/, '') }; };
const VARIANTS = [pair(arg('a', 'rg1=http://127.0.0.1:8041')), pair(arg('b', 'rg2=http://127.0.0.1:8028'))];
const CPUS = String(arg('cpu', FULL ? '1,2,4,6' : '1,4')).split(',').map(Number);
const ONLY = arg('only', '') ? String(arg('only', '')).split(',') : null, want = k => !ONLY || ONLY.includes(k);
const SWITCHES = +arg('switches', FULL ? 1000 : 60), RADIO = +arg('radio', FULL ? 100 : 5), WIN = FULL ? 10 : 3;
const HOME = path.join(os.homedir(), 'RG-perf-lab');
const RUN = path.join(HOME, 'runs', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
fs.mkdirSync(RUN, { recursive: true });
const log = (...a) => { const s = a.join(' '); console.log(s); fs.appendFileSync(path.join(RUN, 'log.txt'), s + '\n'); };
const pct = (a, p) => { if (!a.length) return null; const s = Float64Array.from(a).sort(); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(1); };
const stats = a => ({ n: a.length, p50: pct(a, .5), p95: pct(a, .95), p99: pct(a, .99), max: a.length ? +Math.max(...a).toFixed(1) : null });
const sleep = ms => new Promise(r => setTimeout(r, ms));
// a dock button as a person presses it; when that build hides it, the same handler it calls
const press = async (s, sel, fn) => { const b = s.p.locator(sel).first(); if (await b.isVisible().catch(() => false)) return b.click(); return s.p.evaluate(fn); };

// in every document: frame deltas, long animation frames and slow interactions while recording
const RECORDER = () => {
  // the frame recorder asks for frames only while recording (always asking made the page draw 60 times a second:
  // the idle numbers measured the recorder)
  const R = window.__lab = { on: false, d: [], loaf: [], ev: [], last: 0, start() { R.last = 0; const tick = t => { if (!R.on) return; if (R.last) R.d.push(t - R.last); R.last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick); } };
  try { new PerformanceObserver(l => { if (R.on) l.getEntries().forEach(e => R.loaf.push([e.duration, e.blockingDuration || 0])); }).observe({ type: 'long-animation-frame' }); } catch (_) {}
  try { new PerformanceObserver(l => { if (R.on) l.getEntries().forEach(e => { if (e.interactionId) R.ev.push(e.duration); }); }).observe({ type: 'event', durationThreshold: 16 }); } catch (_) {}
};

async function open(v) {
  const ctx = await chromium.launchPersistentContext(path.join(HOME, 'profile-' + v.name), {
    channel: 'chrome', headless: false, viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga',
    args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required', '--enable-precise-memory-info', '--js-flags=--expose-gc', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  await ctx.addInitScript(RECORDER);
  const p = ctx.pages()[0] || await ctx.newPage();
  p.__errs = []; p.on('pageerror', e => p.__errs.push(e.message.slice(0, 160)));
  await p.goto(v.url + '/index.html', { waitUntil: 'load' });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable').catch(() => {});
  return { v, ctx, p, cdp, cal: () => p.frame({ url: /kalendars\/index\.html/ }) };
}
async function ready(s, waitMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < waitMs) {
    const n = await s.cal()?.evaluate(() => document.querySelectorAll('#grafiks-list .card, #radiographers-duty .mk-side-card').length).catch(() => 0);
    if (n > 0) return true; await sleep(1000);
  }
  return false;
}
const metrics = async s => Object.fromEntries((await s.cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
async function procs(s) {   // per-process CPU time (s) and resident memory (MB) of this variant's Chrome (by its profile folder)
  let out = '';
  try { out = execFileSync('ps', ['-Ao', 'pid=,rss=,time=,command=']).toString(); } catch (_) { return []; }
  const tag = 'profile-' + s.v.name;
  return out.split('\n').filter(l => l.includes('Google Chrome') && (l.includes(tag) || l.includes('--type='))).map(l => {
    const m = l.trim().match(/^(\d+)\s+(\d+)\s+([\d:.]+)\s+(.*)$/); if (!m) return null;
    const cmd = m[4]; if (!cmd.includes(tag) && !s.pids?.has(+m[1])) return null;
    const t = m[3].split(':').map(Number); const sec = t.length === 3 ? t[0] * 3600 + t[1] * 60 + t[2] : t[0] * 60 + t[1];
    const type = /--type=renderer/.test(cmd) ? 'renderer' : /--type=gpu-process/.test(cmd) ? 'GPU' : /--type=/.test(cmd) ? 'other' : 'browser';
    return { type, id: +m[1], cpu: sec, rssMB: Math.round(+m[2] / 1024) };
  }).filter(Boolean);
}
const sumBy = (ps, type, k) => ps.filter(p => p.type === type).reduce((a, p) => a + p[k], 0);
async function record(s, on) {
  for (const f of [s.p.mainFrame(), s.cal()]) if (f) await f.evaluate(on => { const R = window.__lab; if (!R) return null; if (on) { R.on = true; R.d = []; R.loaf = []; R.ev = []; if (on !== 'quiet') R.start(); return null; } R.on = false; return { d: R.d, loaf: R.loaf, ev: R.ev }; }, on).catch(() => null);
  if (on) return null;
  const out = await Promise.all([s.p.mainFrame(), s.cal()].map(f => f ? f.evaluate(() => { const R = window.__lab; return R ? { d: R.d, loaf: R.loaf, ev: R.ev } : null; }).catch(() => null) : null));
  return out;
}
// one measured window around a scenario: frames, long frames, interactions, CPU (renderer/GPU), layouts, style
async function measure(s, name, fn, quiet) {
  const m0 = await metrics(s), p0 = await procs(s), t0 = Date.now();
  if (TRACE) await s.cdp.send('Tracing.start', { transferMode: 'ReturnAsStream', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'gpu', 'viz', 'blink'] } }).catch(() => {});
  await record(s, quiet ? 'quiet' : true);
  const extra = await fn();
  const fr = await record(s, false);
  let traceFile = null;
  if (TRACE) traceFile = await stopTrace(s, name);
  const m1 = await metrics(s), p1 = await procs(s), sec = (Date.now() - t0) / 1000;
  const frames = fr[0] ? fr[0].d : [], vsync = pct(frames, .5) || 16.7;
  const loaf = [].concat(...fr.filter(Boolean).map(x => x.loaf)), ev = [].concat(...fr.filter(Boolean).map(x => x.ev));
  const cpu = t => +(((sumBy(p1, t, 'cpu') - sumBy(p0, t, 'cpu')) / sec) * 100).toFixed(1);
  return { name, seconds: +sec.toFixed(1), frames: { ...stats(frames), dropped: frames.filter(x => x > vsync * 1.5).length, vsync },
    loaf: { n: loaf.length, over100: loaf.filter(x => x[0] > 100).length, blockingP95: pct(loaf.map(x => x[1]), .95) }, inp: stats(ev),
    cpuRendererPct: cpu('renderer'), cpuGpuPct: cpu('GPU'), mainThreadPct: +(((m1.TaskDuration - m0.TaskDuration) / sec) * 100).toFixed(1),
    layouts: m1.LayoutCount - m0.LayoutCount, layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(1),
    styleRecalcs: m1.RecalcStyleCount - m0.RecalcStyleCount, styleMs: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000).toFixed(1),
    scriptMs: +((m1.ScriptDuration - m0.ScriptDuration) * 1000).toFixed(1), rendererMB: sumBy(p1, 'renderer', 'rssMB'), gpuMB: sumBy(p1, 'GPU', 'rssMB'),
    traceFile, ...extra };
}
async function stopTrace(s, name) {
  const done = new Promise(r => s.cdp.once('Tracing.tracingComplete', r));
  await s.cdp.send('Tracing.end'); const { stream } = await done; let data = '';
  for (;;) { const c = await s.cdp.send('IO.read', { handle: stream }); data += c.data; if (c.eof) break; }
  await s.cdp.send('IO.close', { handle: stream });
  const f = path.join(RUN, `trace-${s.v.name}-cpu${s.cpu}-${name}.json`); fs.writeFileSync(f, data);
  // the counts a reader wants from it: forced layouts (a Layout inside script), paints, GPU main-thread time
  const ev = JSON.parse(data).traceEvents || JSON.parse(data);
  const scripts = ev.filter(e => e.ph === 'X' && /^(FunctionCall|EvaluateScript|TimerFire|FireAnimationFrame|EventDispatch|v8\.callFunction)$/.test(e.name));
  const inScript = e => scripts.some(x => x.tid === e.tid && x.pid === e.pid && x.ts <= e.ts && e.ts < x.ts + x.dur);
  const lay = ev.filter(e => e.ph === 'X' && e.name === 'Layout');
  const gpuTid = new Set(ev.filter(e => e.name === 'thread_name' && /CrGpuMain|VizCompositorThread/.test(e.args?.name || '')).map(e => e.pid + ':' + e.tid));
  return { file: path.basename(f), forcedLayouts: lay.filter(inScript).length, layouts: lay.length,
    paints: ev.filter(e => e.ph === 'X' && e.name === 'Paint').length, paintMs: +(ev.filter(e => e.ph === 'X' && e.name === 'Paint').reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1),
    gpuMs: +(ev.filter(e => e.ph === 'X' && gpuTid.has(e.pid + ':' + e.tid) && e.name === 'ThreadControllerImpl::RunTask').reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1) };
}
async function sample(s, label) {
  await s.cdp.send('HeapProfiler.collectGarbage').catch(() => {}); await sleep(300);
  const m = await metrics(s), ps = await procs(s);
  const calHeap = await s.cal()?.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0).catch(() => 0);
  return { label, t: Date.now(), heapMB: +(m.JSHeapUsedSize / 1048576).toFixed(1), calHeapMB: +((calHeap || 0) / 1048576).toFixed(1), nodes: m.Nodes, listeners: m.JSEventListeners, docs: m.Documents, rendererMB: sumBy(ps, 'renderer', 'rssMB'), gpuMB: sumBy(ps, 'GPU', 'rssMB') };
}

// ---------- scenarios ----------
const dayIds = s => s.cal().evaluate(() => [...document.querySelectorAll('[id^="p-"]')].map(e => e.id));
async function switchOnce(s, id) {
  const f = s.cal(); if (!f) return -1;
  await f.evaluate(() => { window.__labSw = new Promise(res => document.addEventListener('pointerdown', () => { const t = performance.now();
    const done = () => requestAnimationFrame(() => requestAnimationFrame(() => res(performance.now() - t)));
    const wait = () => { if (document.documentElement.classList.contains('mk-day-vt')) setTimeout(wait, 5); else done(); }; setTimeout(wait, 0); }, { once: true, capture: true })); });
  const el = f.locator('#' + id); if (!await el.isVisible().catch(() => false)) return -1;
  await el.click({ timeout: 5000 }).catch(() => {});
  return f.evaluate(() => Promise.race([window.__labSw, new Promise(r => setTimeout(() => r(-1), 8000))]));
}
const SCEN = {
  async idle(s) { return measure(s, 'idle', async () => { await sleep(20000); return {}; }, true); },   // no frame recorder: nothing may ask for frames
  async dayswitch(s, n = 40) {
    const ids = await dayIds(s), lat = [];
    return measure(s, 'dayswitch', async () => { for (let i = 0; i < n; i++) { const ms = await switchOnce(s, ids[(i * 7) % ids.length]); if (ms >= 0) lat.push(ms); await sleep(450); } return { switch: stats(lat) }; });
  },
  async hover(s) {
    return measure(s, 'hover', async () => {
      const W = 1920, H = 1080;
      for (let k = 0; k < 3; k++) for (let i = 0; i <= 40; i++) { await s.p.mouse.move(80 + (W - 160) * i / 40, 300 + 380 * Math.sin(i / 6), { steps: 3 }); await sleep(60); }
      return {};
    });
  },
  async windows(s) {
    const lat = {};
    const OPEN = { night: ['cal', '#nsOverlay.open'], month: ['cal', '#mcal-overlay[open], #mcal-overlay.open'], stats: ['cal', '#stats-modal[open], #stats-modal.open'], worker: ['cal', '#worker-modal[open], #worker-modal.open, #worker-modal.show'] };
    const one = async (key, openFn, closeFn) => {
      const [fr, sel] = OPEN[key], frame = fr === 'cal' ? s.cal() : s.p.mainFrame();
      const t0 = await s.p.evaluate(() => performance.timeOrigin + performance.now());
      await openFn();
      const tEnd = await frame.evaluate(sel => new Promise(res => { const until = performance.now() + 6000;
        const check = () => { const el = document.querySelector(sel); const vis = el && el.getBoundingClientRect().width > 0;
          if (vis) { const running = el.getAnimations({ subtree: true }).filter(a => a.playState === 'running' && isFinite(a.effect?.getComputedTiming().endTime));
            if (!running.length) return requestAnimationFrame(() => res(performance.timeOrigin + performance.now()));
            return Promise.all(running.map(a => a.finished.catch(() => {}))).then(() => requestAnimationFrame(() => res(performance.timeOrigin + performance.now()))); }
          if (performance.now() > until) return res(-1); setTimeout(check, 8); }; check(); }), sel).catch(() => -1);
      if (tEnd > 0) (lat[key] = lat[key] || []).push(tEnd - t0);
      await closeFn(); await sleep(900);
    };
    return measure(s, 'windows', async () => {
      for (let i = 0; i < WIN; i++) {
        await one('night', () => press(s, '#nsToggleBtnParent', () => window.toggleNsFromParent()), () => s.p.keyboard.press('Escape'));
        await one('month', () => press(s, '#monthCalDocBtn', () => window.openMonthCalFromDock()), () => s.p.keyboard.press('Escape'));
        await one('stats', () => press(s, '#statsDocBtn', () => window.openStatsFromDock()), () => s.p.keyboard.press('Escape'));
        await one('worker', async () => { const c = s.cal().locator('#grafiks-list .card').first(); await c.click(); }, () => s.p.keyboard.press('Escape'));
      }
      return { open: Object.fromEntries(Object.entries(lat).map(([k, a]) => [k, stats(a)])) };
    });
  },
  async radio(s, n = 5) {
    const openMs = []; let playing = false;
    const r = await measure(s, 'radio-cycles', async () => {
      for (let i = 0; i < n; i++) {
        const t = await s.p.evaluate(() => performance.now()); await s.p.evaluate(() => window.toggleRadio());
        await s.p.waitForFunction(() => { const w = document.getElementById('radioWindow'); return w && w.offsetWidth > 0; }, null, { timeout: 5000 }).catch(() => {});
        openMs.push((await s.p.evaluate(() => performance.now())) - t);
        if (i === 0) { await s.p.locator('#rmx .rmx-play, #playBtn').first().click().catch(() => {}); playing = await s.p.waitForFunction(() => !!document.querySelector('#rmx.rmx-playing'), null, { timeout: 12000 }).then(() => true, () => false); }
        await sleep(1500); await s.p.evaluate(() => window.toggleRadio()); await sleep(800);
      }
      return { radioOpen: stats(openMs), streamPlaying: playing };
    });
    // the radio playing for 15 s, open (the spectrum, the dancers in the mood bubble)
    await s.p.evaluate(() => window.toggleRadio()); await sleep(1500);
    const play = await measure(s, 'radio-playing', async () => { await sleep(15000); return {}; });
    await s.p.evaluate(() => window.toggleRadio()); await sleep(800);
    return [r, play];
  },
  async soak(s, n) {
    const ids = await dayIds(s), out = [await sample(s, 'start')], lat = [];
    for (let i = 0; i < n; i++) { const ms = await switchOnce(s, ids[(i * 11) % ids.length]); if (ms >= 0) lat.push(ms); await sleep(250); if ((i + 1) % 100 === 0) { out.push(await sample(s, 'switch ' + (i + 1))); log(`  ${s.v.name} soak ${i + 1}/${n}`); } }
    if (n % 100) out.push(await sample(s, 'end'));
    return { name: 'soak', switch: stats(lat), samples: out };
  },
  async visual(s) {   // fixed states, animations off; compared across variants by pixelmatch
    const shots = {}, dir = path.join(RUN, 'shots'); fs.mkdirSync(dir, { recursive: true });
    const snap = async k => { const f = path.join(dir, `${s.v.name}-${k}.png`); await s.p.screenshot({ path: f, animations: 'disabled', caret: 'hide' }); shots[k] = f; };
    await snap('day'); await press(s, '#nsToggleBtnParent', () => window.toggleNsFromParent()); await sleep(1500); await snap('night'); await s.p.keyboard.press('Escape'); await sleep(800);
    await s.p.evaluate(() => window.toggleRadio()); await sleep(1500); await snap('radio'); await s.p.evaluate(() => window.toggleRadio()); await sleep(800);
    await press(s, '#statsDocBtn', () => window.openStatsFromDock()); await sleep(1500); await snap('stats'); await s.p.keyboard.press('Escape'); await sleep(800);
    return shots;
  }
};

// ---------- run ----------
const results = { started: new Date().toISOString(), host: `${os.cpus()[0].model}, ${Math.round(os.totalmem() / 2 ** 30)} GB`, full: FULL, cpus: CPUS, switches: SWITCHES, radio: RADIO, variants: {}, visual: {} };
if (LOGIN) {
  log('Log in to RG in each window that opens (your own login; nothing is typed for you). Close nothing; this waits up to 10 minutes per window.');
  for (const v of VARIANTS) { const s = await open(v); const ok = await ready(s, 600000); log(v.name, ok ? 'logged in, cards visible' : 'still no cards'); await s.ctx.close(); }
  process.exit(0);
}
for (const v of VARIANTS) {
  const s = await open(v);
  if (!await ready(s, 60000)) { log(`${v.name}: no RG cards after 60 s at ${v.url} (log in first: --login)`); await s.ctx.close(); continue; }
  await sleep(6000);
  results.variants[v.name] = { url: v.url, runs: {} };
  if (want('visual')) results.visual[v.name] = await SCEN.visual(s);
  for (const c of CPUS) {
    s.cpu = c; await s.cdp.send('Emulation.setCPUThrottlingRate', { rate: c }); log(`${v.name} cpu x${c}`);
    const r = [];
    if (want('idle')) r.push(await SCEN.idle(s)); if (want('dayswitch')) r.push(await SCEN.dayswitch(s, FULL ? 100 : 40)); if (want('hover')) r.push(await SCEN.hover(s)); if (want('windows')) r.push(await SCEN.windows(s)); if (want('radio')) r.push(...await SCEN.radio(s, RADIO));
    results.variants[v.name].runs['x' + c] = r;
    fs.writeFileSync(path.join(RUN, 'results.json'), JSON.stringify(results, null, 1));
  }
  s.cpu = 1; await s.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  if (want('soak')) { log(`${v.name} soak ${SWITCHES} switches`); results.variants[v.name].soak = await SCEN.soak(s, SWITCHES); }
  results.variants[v.name].errors = [...new Set(s.p.__errs)].slice(0, 10);
  fs.writeFileSync(path.join(RUN, 'results.json'), JSON.stringify(results, null, 1));
  await s.ctx.close();
}
// visual comparison between the two variants, state by state
const [A, B] = VARIANTS.map(v => v.name);
if (results.visual[A] && results.visual[B]) {
  results.visualDiff = {};
  for (const k of Object.keys(results.visual[A])) {
    try {
      const a = PNG.sync.read(fs.readFileSync(results.visual[A][k])), b = PNG.sync.read(fs.readFileSync(results.visual[B][k]));
      const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height), d = new PNG({ width: w, height: h });
      const crop = (img) => { if (img.width === w && img.height === h) return img.data; const o = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) img.data.copy(o, y * w * 4, y * img.width * 4, y * img.width * 4 + w * 4); return o; };
      const n = pixelmatch(crop(a), crop(b), d.data, w, h, { threshold: 0.12 });
      const f = path.join(RUN, 'shots', `diff-${k}.png`); fs.writeFileSync(f, PNG.sync.write(d));
      results.visualDiff[k] = { changedPct: +((n / (w * h)) * 100).toFixed(2), file: f };
    } catch (e) { results.visualDiff[k] = { error: String(e).slice(0, 120) }; }
  }
}
results.finished = new Date().toISOString();
fs.writeFileSync(path.join(RUN, 'results.json'), JSON.stringify(results, null, 1));
execFileSync(process.execPath, [new URL('./report.mjs', import.meta.url).pathname, RUN], { stdio: 'inherit' });
log('report:', path.join(RUN, 'report.html'));
