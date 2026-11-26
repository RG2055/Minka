// RG today vs the RG 2.0 prototypes, identical day data, identical stylesheets, same target navigator.
// VARIANT=current|vanilla|prepared|solid|lit  RADIO=1 (radio playing: today's radio window with the Pioneer skin /
// the prototypes' radio bar with the same skin code). Results appended to res/bench.jsonl.
const { chromium } = require('playwright');
const fs = require('fs');
const applyVariant = require('/home/user/Minka/.claude/skills/minka-hardware-performance/scripts/variant.js');
const route = require('./route.js');
const V = process.env.VARIANT || 'vanilla', RADIO = !!process.env.RADIO, TAG = 'rg2b' + process.pid;
const cpuOf = (pid) => { try { const f = fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' '); return (+f[11] + +f[12]) * 10; } catch (_) { return 0; } };
const pss = (pid) => { try { const m = /Pss:\s+(\d+)/.exec(fs.readFileSync(`/proc/${pid}/smaps_rollup`, 'utf8')); return m ? +m[1] / 1024 : 0; } catch (_) { return 0; } };
function tree() {
  const all = {}; for (const d of fs.readdirSync('/proc')) if (/^\d+$/.test(d)) { try { all[d] = { cmd: fs.readFileSync(`/proc/${d}/cmdline`, 'utf8'), ppid: fs.readFileSync(`/proc/${d}/stat`, 'utf8').split(') ')[1].split(' ')[1] }; } catch (_) {} }
  const root = Object.keys(all).find((p) => all[p].cmd.includes(TAG) && !all[p].cmd.includes('--type=')); const t = new Set([root]); let g = true;
  while (g) { g = false; for (const p in all) if (!t.has(p) && t.has(all[p].ppid)) { t.add(p); g = true; } }
  return [...t].map((p) => ({ p, type: (/--type=([a-z-]+)/.exec(all[p].cmd) || [0, 'browser'])[1] }));
}
async function cpuDuring(fn) {
  const procs = tree(), c0 = procs.map((x) => cpuOf(x.p)), t0 = Date.now(); await fn(); const s = (Date.now() - t0) / 1000;
  const by = {}; procs.forEach((x, i) => { by[x.type] = (by[x.type] || 0) + (cpuOf(x.p) - c0[i]) / s; });
  const total = Object.values(by).reduce((a, b) => a + b, 0);
  return { total: Math.round(total), renderer: Math.round(by.renderer || 0), gpu: Math.round(by['gpu-process'] || 0), browser: Math.round(by.browser || 0) };
}
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--' + TAG] });
  const cur = V === 'current';
  const ctx = await b.newContext({ viewport: cur ? { width: 1920, height: 1080 } : { width: 1908, height: 986 }, timezoneId: 'Europe/Riga' });
  await ctx.addInitScript(`(() => { let s = 1234567; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`);
  await applyVariant(ctx); await route(ctx);
  const p = await ctx.newPage(); await applyVariant.setClock(p);
  await p.goto(cur ? 'http://127.0.0.1:8012/index.html?visible=1' : `http://127.0.0.1:8012/__rg2/pages/${V}.html${RADIO ? '?radio=1' : ''}`, { waitUntil: 'load' });
  await p.waitForTimeout(cur ? 14000 : 6000);
  const F = cur ? p.frame({ url: /kalendars\/index\.html/ }) : p.mainFrame();
  if (cur && RADIO) {
    await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(3000);
    await p.evaluate(() => { const ac = new AudioContext(); const an = ac.createAnalyser(); an.fftSize = 1024; const o = ac.createOscillator(); o.type = 'sawtooth'; const l = ac.createOscillator(); l.frequency.value = 2; const lg = ac.createGain(); lg.gain.value = 300; l.connect(lg); lg.connect(o.frequency); l.start(); const g = ac.createGain(); g.gain.value = 0.001; o.connect(an); an.connect(g); g.connect(ac.destination); o.start(); window.__mkRadioAnalyser = () => an; document.getElementById('radioWindow').dataset.radioSkin = 'pioneer'; document.getElementById('rmx').classList.add('rmx-playing'); document.body.classList.add('radio-playing'); document.body.classList.remove('radio-idle'); });
    await p.waitForTimeout(2000);
  }
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  const out = { variant: V, radio: RADIO };
  // layers
  let layers = []; cdp.on('LayerTree.layerTreeDidChange', (e) => { if (e.layers) layers = e.layers; }); await cdp.send('LayerTree.enable'); await p.waitForTimeout(1200); await cdp.send('LayerTree.disable');
  out.layers = layers.length;
  // idle
  out.idleCpu = await cpuDuring(() => p.waitForTimeout(8000));
  // day switch latency at CPU x4: pointerdown → the new day on screen (pill active, no hold), then one more frame
  await F.evaluate(() => { window.__sw = []; document.addEventListener('pointerdown', (e) => { const pill = e.target.closest && e.target.closest('[id^="p-"]'); if (!pill) return; const t0 = performance.now(), id = pill.id;
    const check = () => { const el = document.getElementById(id); if (el && /\bactive\b/.test(el.className) && !document.documentElement.classList.contains('mk-day-vt')) requestAnimationFrame(() => window.__sw.push(performance.now() - t0)); else requestAnimationFrame(check); }; requestAnimationFrame(check); }, true); });
  const seq = ['25', '26', '27', '22', '23', '24', '29', '28', '27', '20', '21', '22', '26', '25'];
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  for (const d of seq) { await F.click(`#p-${d}-09-2026`).catch(() => {}); await p.waitForTimeout(1300); }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const sw = (await F.evaluate(() => window.__sw)).slice(1).sort((a, b) => a - b);
  out.switchMs = { median: Math.round(sw[sw.length >> 1]), p90: Math.round(sw[Math.floor(sw.length * .9)]), max: Math.round(sw[sw.length - 1]), n: sw.length };
  // CPU while switching once a second (x1)
  out.switchCpu = await cpuDuring(async () => { for (const d of ['26', '27', '28', '29', '20', '21', '22', '23']) { await F.click(`#p-${d}-09-2026`).catch(() => {}); await p.waitForTimeout(1000); } });
  // hover with the pointer moving (x1): frames and CPU
  await F.click('#p-24-09-2026').catch(() => {}); await p.waitForTimeout(1500);
  const off = cur ? await (await p.$('#calendarEmbed')).boundingBox() : { x: 0, y: 0 };
  const boxes = []; for (const c of (await F.locator('#grafiks-list .card').all()).slice(0, 6)) { const bb = await c.boundingBox().catch(() => null); if (bb) boxes.push(bb); }
  const ev = []; const onData = (e) => ev.push(...e.value); cdp.on('Tracing.dataCollected', onData); const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['benchmark', 'cc'] } });
  const t0 = Date.now();
  out.hoverCpu = await cpuDuring(async () => { for (const bb of boxes) { await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 5 }); for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 4; await p.mouse.move(bb.x + bb.width / 2 + Math.cos(a) * bb.width * .25, bb.y + bb.height / 2 + Math.sin(a) * bb.height * .2); await p.waitForTimeout(25); } } });
  const hs = (Date.now() - t0) / 1000;
  await cdp.send('Tracing.end'); await done; cdp.off('Tracing.dataCollected', onData);
  const st = {}; ev.filter((e) => e.name === 'PipelineReporter' && e.ph !== 'e').forEach((e) => { const s = JSON.stringify(e.args || {}).match(/STATE_([A-Z_]+)/); if (s) st[s[1]] = (st[s[1]] || 0) + 1; });
  out.hoverFrames = { presented: +(((st.PRESENTED_ALL || 0) + (st.PRESENTED_PARTIAL || 0)) / hs).toFixed(1), dropped: +((st.DROPPED || 0) / hs).toFixed(1) };
  await p.mouse.move(5, 5);
  // memory now, and after 60 more switches (growth = a leak candidate)
  const mem = async () => { await cdp.send('HeapProfiler.collectGarbage').catch(() => {}); const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value])); const r = tree().filter((x) => x.type === 'renderer').reduce((s, x) => s + pss(x.p), 0); return { rendererMB: Math.round(r), jsHeapMB: +(m.JSHeapUsedSize / 1048576).toFixed(1), nodes: m.Nodes, listeners: m.JSEventListeners }; };
  out.mem = await mem();
  for (let i = 0; i < 60; i++) { await F.click(`#p-${['25', '26', '27', '28'][i % 4]}-09-2026`).catch(() => {}); await p.waitForTimeout(120); }
  await p.waitForTimeout(2000);
  out.memAfter60 = await mem();
  // the look: day 25, the calendar only
  if (!RADIO) { await F.click('#p-25-09-2026').catch(() => {}); await p.waitForTimeout(2500); const shot = __dirname + `/res/look-${V}.png`; if (cur) await (await p.$('#calendarEmbed')).screenshot({ path: shot }); else await p.screenshot({ path: shot }); }
  fs.mkdirSync(__dirname + '/res', { recursive: true });
  fs.appendFileSync(__dirname + '/res/bench.jsonl', JSON.stringify(out) + '\n');
  console.log(JSON.stringify(out));
  await b.close();
})();
