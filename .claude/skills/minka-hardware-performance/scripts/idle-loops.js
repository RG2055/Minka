// Who keeps the app awake when nobody touches it, on the TARGET PC's navigator values (12 threads, 8 GB):
// rAF callbacks, timer callbacks and observer callbacks per second, by the source line that scheduled them,
// plus per-process memory (PSS) of the Chrome tree. Scenarios: idle, radio open+paused, radio playing.
const { chromium } = require('playwright');
const fs = require('fs');
const applyVariant = require('./variant.js');
const TAG = 'mkidle' + process.pid;
const INIT = `(() => {
  try { Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 12, configurable: true }); } catch (_) {}
  try { Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 8, configurable: true }); } catch (_) {}
  const C = (window.__mkIdle = { on: false, n: {} });
  const where = () => { const s = (new Error().stack || '').split('\\n').slice(2, 7).map((l) => l.trim().replace(/^at /, '').replace(/https?:\\/\\/[^/]+\\//, '').replace(/\\?[^:)]*/, '')).filter((l) => l && !/__mkIdle|window\.(setTimeout|setInterval|requestAnimationFrame)|new window\.|^Error/.test(l)); return s[0] || '?'; };
  const hit = (kind, w) => { if (!C.on) return; const k = kind + ' ' + w; C.n[k] = (C.n[k] || 0) + 1; };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) { const w = where(); return raf((t) => { hit('rAF', w); return cb(t); }); };
  for (const name of ['setTimeout', 'setInterval']) {
    const orig = window[name].bind(window);
    window[name] = function (cb, ms, ...a) { if (typeof cb !== 'function') return orig(cb, ms, ...a); const w = where() + ' (' + (ms | 0) + 'ms)'; return orig(function () { hit(name === 'setTimeout' ? 'timeout' : 'interval', w); return cb.apply(this, arguments); }, ms, ...a); };
  }
  for (const O of ['MutationObserver', 'ResizeObserver', 'IntersectionObserver']) {
    const Orig = window[O]; if (!Orig) continue;
    window[O] = class extends Orig { constructor(cb, opt) { const w = where(); super(function () { hit(O, w); return cb.apply(this, arguments); }, opt); } };
  }
})();`;
function chromePids(tag) {
  const pids = fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d));
  const all = {};
  for (const pid of pids) { try { const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split(/[\0 ]/); all[pid] = { cmd, ppid: +fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' ')[1] }; } catch (_) {} }
  const root = Object.keys(all).find((p) => all[p].cmd.some((a) => a.includes(tag)) && !all[p].cmd.some((a) => a.startsWith('--type=')));
  const tree = new Set([root]); let grew = true;
  while (grew) { grew = false; for (const p of Object.keys(all)) if (!tree.has(p) && tree.has(String(all[p].ppid))) { tree.add(p); grew = true; } }
  return [...tree].filter(Boolean).map((p) => ({ pid: p, type: ((all[p].cmd.find((a) => a.startsWith('--type=')) || '--type=browser').slice(7)) + ((all[p].cmd.find((a) => a.startsWith('--utility-sub-type=')) || '').replace('--utility-sub-type=', ':')) }));
}
const pss = (pid) => { try { const m = /Pss:\s+(\d+)/.exec(fs.readFileSync(`/proc/${pid}/smaps_rollup`, 'utf8')); return m ? +m[1] / 1024 : 0; } catch (_) { return 0; } };
const cpu = (pid) => { try { const f = fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' '); return (+f[11] + +f[12]) * 10; } catch (_) { return 0; } };
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--' + TAG] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx));
  await ctx.addInitScript(INIT);
  const p = await ctx.newPage();
  await require('./variant.js').setClock(p);
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(15000);
  const cal = p.frame({ url: /kalendars\/index\.html/ });
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  console.log('profile seen by app:', JSON.stringify(await cal.evaluate(() => ({ prof: window.__mkPerfProfile, lowSpecClass: document.documentElement.classList.contains('mk-low-spec'), perf: document.documentElement.getAttribute('data-performance'), motion: document.documentElement.getAttribute('data-motion') }))));
  const out = {};
  async function measure(label, ms = 10000) {
    const frames = p.frames();
    for (const f of frames) await f.evaluate(() => { if (window.__mkIdle) { window.__mkIdle.n = {}; window.__mkIdle.on = true; } }).catch(() => {});
    const procs = chromePids(TAG); const c0 = Object.fromEntries(procs.map((x) => [x.pid, cpu(x.pid)]));
    await p.waitForTimeout(ms);
    const c1 = Object.fromEntries(procs.map((x) => [x.pid, cpu(x.pid)]));
    const counts = {};
    for (const f of frames) { const n = await f.evaluate(() => { if (!window.__mkIdle) return {}; window.__mkIdle.on = false; return window.__mkIdle.n; }).catch(() => ({})); const fn = f === p.mainFrame() ? 'shell' : f.url().replace(/.*8012\//, '').replace(/\?.*/, '').slice(0, 24) || 'blank'; for (const [k, v] of Object.entries(n)) counts[fn + ' | ' + k] = (counts[fn + ' | ' + k] || 0) + v; }
    const byType = {};
    for (const x of procs) { const t = x.type; (byType[t] ||= { n: 0, pssMB: 0, cpuMsPerS: 0 }); byType[t].n++; byType[t].pssMB += pss(x.pid); byType[t].cpuMsPerS += (c1[x.pid] - c0[x.pid]) / (ms / 1000); }
    for (const v of Object.values(byType)) { v.pssMB = +v.pssMB.toFixed(0); v.cpuMsPerS = +v.cpuMsPerS.toFixed(0); }
    const heap = {}; const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value])); heap.jsUsedMB = +(m.JSHeapUsedSize / 1048576).toFixed(1); heap.jsTotalMB = +(m.JSHeapTotalSize / 1048576).toFixed(1); heap.nodes = m.Nodes; heap.listeners = m.JSEventListeners; heap.documents = m.Documents; heap.frames = m.Frames;
    const rows = Object.entries(counts).map(([k, v]) => [k, +(v / (ms / 1000)).toFixed(1)]).sort((a, b) => b[1] - a[1]);
    const perSec = (kind) => +rows.filter(([k]) => k.includes('| ' + kind + ' ')).reduce((s, r) => s + r[1], 0).toFixed(1);
    console.log(`\n===== ${label}`);
    console.log('callbacks/s:', JSON.stringify({ rAF: perSec('rAF'), timeout: perSec('timeout'), interval: perSec('interval'), MutationObserver: perSec('MutationObserver'), ResizeObserver: perSec('ResizeObserver'), IntersectionObserver: perSec('IntersectionObserver') }));
    rows.slice(0, 22).forEach(([k, v]) => console.log('  ', String(v).padStart(6), '/s ', k.slice(0, 140)));
    console.log('processes:', JSON.stringify(byType));
    console.log('heap/dom:', JSON.stringify(heap));
    out[label] = { rows, byType, heap };
  }
  await measure('idle, radio closed');
  await p.evaluate(() => window.toggleRadio()).catch(() => {}); await p.waitForTimeout(3000);
  await measure('radio open, paused');
  await p.evaluate(() => { const ac = new AudioContext(); const an = ac.createAnalyser(); const o = ac.createOscillator(); const g = ac.createGain(); g.gain.value = 0.001; o.connect(an); an.connect(g); g.connect(ac.destination); o.start(); window.__mkRadioAnalyser = () => an; const mx = document.getElementById('rmx'); if (mx) mx.classList.add('rmx-playing'); document.body.classList.add('radio-playing'); }).catch(() => {});
  await p.waitForTimeout(3000);
  await measure('radio open, spectrum running');
  fs.writeFileSync(__dirname + '/res/idle-loops' + (process.env.BASE ? '-base' : '') + '.json', JSON.stringify(out, null, 1));
  await b.close();
})();
