// Night idle (star sky on): composited layers, renderer main-thread busy time and commits, per-process CPU
// (CPU x1, 10 s, time flowing), then a deterministic look: Math.random seeded, the clock paused at a fixed
// moment, the calendar screenshotted to res/night-<LABEL>.png for a pixel compare between variants.
const { chromium } = require('playwright');
const fs = require('fs');
const applyVariant = require('./variant.js');
const TAG = 'mknight' + process.pid, LABEL = process.env.LABEL || 'run';
const cpuOf = (pid) => { try { const f = fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' '); return (+f[11] + +f[12]) * 10; } catch (_) { return 0; } };
function tree() {
  const all = {}; for (const d of fs.readdirSync('/proc')) if (/^\d+$/.test(d)) { try { all[d] = { cmd: fs.readFileSync(`/proc/${d}/cmdline`, 'utf8'), ppid: fs.readFileSync(`/proc/${d}/stat`, 'utf8').split(') ')[1].split(' ')[1] }; } catch (_) {} }
  const root = Object.keys(all).find((p) => all[p].cmd.includes(TAG) && !all[p].cmd.includes('--type=')); const t = new Set([root]); let g = true;
  while (g) { g = false; for (const p in all) if (!t.has(p) && t.has(all[p].ppid)) { t.add(p); g = true; } }
  return [...t].map((p) => ({ p, type: (/--type=([a-z-]+)/.exec(all[p].cmd) || [0, 'browser'])[1] }));
}
const SEED = `(() => { let s = 1234567; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`;
(async () => {
  const b = await chromium.launch({ args: ['--' + TAG] });
  async function page(seeded) {
    const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
    const v = await applyVariant(ctx);
    if (seeded) await ctx.addInitScript(SEED);
    const p = await ctx.newPage();
    return { ctx, p, v };
  }
  if (!process.env.LOOK_ONLY) {
    const { ctx, p, v } = await page(false);
    console.log('variant:', v, LABEL);
    await p.clock.install({ time: new Date('2026-09-24T02:30:00+03:00') }); await p.clock.resume();
    await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
    await p.waitForTimeout(15000);
    const cdp = await ctx.newCDPSession(p);
    let layers = []; cdp.on('LayerTree.layerTreeDidChange', (e) => { if (e.layers) layers = e.layers; }); await cdp.send('LayerTree.enable'); await p.waitForTimeout(1500);
    const stars = await p.frame({ url: /kalendars/ }).evaluate(() => document.querySelectorAll('#stars-overlay .s-star').length);
    const procs = tree(); const c0 = procs.map((x) => cpuOf(x.p));
    const ev = []; cdp.on('Tracing.dataCollected', (e) => ev.push(...e.value)); const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'benchmark'] } });
    const S = 10; await p.waitForTimeout(S * 1000);
    await cdp.send('Tracing.end'); await done;
    const by = {}; procs.forEach((x, i) => { by[x.type] = (by[x.type] || 0) + (cpuOf(x.p) - c0[i]) / S; });
    const names = {}; ev.filter((e) => e.name === 'thread_name').forEach((e) => { names[e.pid + ':' + e.tid] = e.args.name; });
    const [mpid, mtid] = Object.keys(names).find((k) => names[k] === 'CrRendererMain').split(':').map(Number);
    const M = ev.filter((e) => e.ph === 'X' && e.pid === mpid && e.tid === mtid);
    const sum = (n) => M.filter((e) => e.name === n).reduce((s, e) => s + e.dur, 0) / 1000 / S;
    const cnt = (n) => M.filter((e) => e.name === n).length / S;
    console.log(`stars ${stars}, layers ${layers.length} (drawing ${layers.filter((l) => l.drawsContent).length})`);
    console.log('night idle CPU ms/s by process:', JSON.stringify(Object.fromEntries(Object.entries(by).map(([k, vv]) => [k, Math.round(vv)]))));
    console.log(`main thread: busy ${sum('RunTask').toFixed(1)} ms/s, style ${sum('UpdateLayoutTree').toFixed(1)}, paint ${sum('Paint').toFixed(1)} ms/s (${cnt('Paint').toFixed(1)}/s), commits ${cnt('Commit').toFixed(1)}/s (${sum('Commit').toFixed(1)} ms/s), layerize ${sum('PaintArtifactCompositor::Update').toFixed(1)} ms/s`);
    await ctx.close();
  }
  // look: seeded stars, paused at one moment after a fixed run of the clock
  const { ctx, p } = await page(true);
  await p.clock.install({ time: new Date('2026-09-24T02:30:00+03:00') });
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.clock.runFor(20000);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${__dirname}/res/night-${LABEL}.png` });
  await ctx.close();
  await b.close();
})();
