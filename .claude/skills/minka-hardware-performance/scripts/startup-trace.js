// Cold start at CPU x4: style/layout passes during load, who forced them, and the biggest scripts by time.
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx));
  const p = await ctx.newPage();
  await require('./variant.js').setClock(p);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const ev = []; cdp.on('Tracing.dataCollected', (e) => ev.push(...e.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'v8.execute'] } });
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(12000);
  await cdp.send('Tracing.end'); await done;
  const X = ev.filter((e) => e.ph === 'X');
  const tids = {}; X.filter((e) => e.name === 'UpdateLayoutTree').forEach((e) => { tids[e.tid] = (tids[e.tid] || 0) + 1; });
  const tid = +Object.entries(tids).sort((a, b) => b[1] - a[1])[0][0];
  const short = (u) => (u || '').replace(/.*8012\//, '').replace(/\?.*/, '');
  let forced = 0, forcedN = 0, frame = 0, frameN = 0; const by = {};
  for (const e of X) {
    if (e.tid !== tid || (e.name !== 'Layout' && e.name !== 'UpdateLayoutTree')) continue;
    const st = (e.args.beginData && e.args.beginData.stackTrace) || null;
    if (st && st.length) { forced += e.dur; forcedN++; const f = st[0]; const k = (f.functionName || '(anon)') + ' ' + short(f.url) + ':' + f.lineNumber; (by[k] ||= [0, 0, 0]); by[k][0] += e.dur; by[k][1]++; by[k][2] += e.args.elementCount || 0; }
    else { frame += e.dur; frameN++; }
  }
  console.log(`load: forced style/layout ${(forced / 1000).toFixed(0)} ms in ${forcedN} passes; in-frame ${(frame / 1000).toFixed(0)} ms in ${frameN}`);
  Object.entries(by).sort((a, b) => b[1][0] - a[1][0]).slice(0, 20).forEach(([k, v]) => console.log((v[0] / 1000).toFixed(0).padStart(6), 'ms', String(v[1]).padStart(4), 'x', k));
  const ev8 = {}; X.filter((e) => e.tid === tid && (e.name === 'EvaluateScript' || e.name === 'v8.compile' || e.name === 'v8.parseOnBackground')).forEach((e) => { const u = short((e.args.data || {}).url); if (!u) return; ev8[u] = (ev8[u] || 0) + e.dur; });
  console.log('top scripts by evaluate time (ms, x4):'); Object.entries(ev8).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log('  ', (v / 1000).toFixed(0).padStart(5), k));
  const parseCss = X.filter((e) => e.tid === tid && /ParseAuthorStyleSheet|CSSParserImpl::ParseStyleSheet/.test(e.name)).reduce((s, e) => s + e.dur, 0);
  console.log('CSS parse ms (x4):', (parseCss / 1000).toFixed(0));
  await b.close();
})();
