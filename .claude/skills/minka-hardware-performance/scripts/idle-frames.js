// Real time, target navigator: frames presented per second at idle, what is painted on each, and paint area.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  await ctx.addInitScript(`try{Object.defineProperty(Navigator.prototype,'hardwareConcurrency',{get:()=>12});Object.defineProperty(Navigator.prototype,'deviceMemory',{get:()=>8});}catch(_){}`);
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8012/index.html?visible=1' + (process.env.Q || ''), { waitUntil: 'load' });
  await p.waitForTimeout(15000);
  if (process.env.RADIO) { await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(3000); }
  const cdp = await ctx.newCDPSession(p);
  const ev = []; cdp.on('Tracing.dataCollected', (e) => ev.push(...e.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['benchmark', 'cc', 'viz', 'gpu', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking'] } });
  const S = 6; await p.waitForTimeout(S * 1000);
  await cdp.send('Tracing.end'); await done;
  const st = {}; ev.filter((e) => e.name === 'PipelineReporter').forEach((e) => { const s = JSON.stringify(e.args || {}).match(/STATE_[A-Z_]+/); if (s && e.ph !== 'e') st[s[0]] = (st[s[0]] || 0) + 1; });
  const X = ev.filter((e) => e.ph === 'X');
  const sum = (re) => X.filter((e) => re.test(e.name)).reduce((s, e) => s + e.dur, 0) / 1000 / S;
  const cnt = (re) => X.filter((e) => re.test(e.name)).length / S;
  const paints = {}; X.filter((e) => e.name === 'Paint').forEach((e) => { const d = e.args.data || {}; const k = (d.nodeName || '?').slice(0, 70); const q = d.clip || []; const area = q.length >= 8 ? Math.abs((q[2] - q[0]) * (q[5] - q[3])) : 0; (paints[k] ||= [0, 0]); paints[k][0]++; paints[k][1] += area; });
  const inv = {}; ev.filter((e) => /PaintInvalidationTracking|StyleRecalcInvalidationTracking|LayoutInvalidationTracking/.test(e.name)).forEach((e) => { const d = e.args.data || {}; const k = e.name.replace('InvalidationTracking', '') + ' ' + (d.reason || '') + ' @ ' + (d.nodeName || '').slice(0, 60); inv[k] = (inv[k] || 0) + 1; });
  console.log('frames/s', JSON.stringify(Object.fromEntries(Object.entries(st).map(([k, v]) => [k.replace('STATE_', ''), +(v / S).toFixed(1)]))));
  console.log('per second: style', sum(/^UpdateLayoutTree$/).toFixed(1), 'ms', cnt(/^UpdateLayoutTree$/).toFixed(1), 'x | layout', sum(/^Layout$/).toFixed(1), 'ms | paint', sum(/^Paint$/).toFixed(1), 'ms', cnt(/^Paint$/).toFixed(1), 'x | commit', cnt(/^Commit$/).toFixed(1), 'x | raster', sum(/RasterTask|RasterizerTaskImpl/).toFixed(1), 'ms | draw(viz)', cnt(/^Graphics.Pipeline.DrawAndSwap|^DirectRenderer::DrawFrame|^SkiaOutputSurfaceImplOnGpu::SwapBuffers|^Display::DrawAndSwap/).toFixed(1), 'x');
  console.log('paints (count/6s, clip area px):'); Object.entries(paints).sort((a, b) => b[1][1] - a[1][1]).slice(0, 10).forEach(([k, v]) => console.log('  ', String(v[0]).padStart(4), String(Math.round(v[1] / v[0])).padStart(8), 'px', k));
  console.log('invalidations:'); Object.entries(inv).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => console.log('  ', String(v).padStart(5), k));
  await b.close();
})();
