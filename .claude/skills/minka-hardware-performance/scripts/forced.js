// Every style/layout pass during day switches (CPU x4), with the JS that forced it.
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx));
  const p = await ctx.newPage();
  await require('./variant.js').setClock(p);
  if (process.env.NOVT) await p.addInitScript(() => { if (/kalendars/.test(location.pathname)) Document.prototype.startViewTransition = undefined; });
  if (process.env.PATCH) { const fs = require('fs'), path = require('path'); for (const f of process.env.PATCH.split(',')) { const [url, file] = f.split('='); await ctx.route(new RegExp(url.replace(/[.]/g, '\\.')), (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(file) })); } }
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(9000);
  const cal = p.frame({ url: /kalendars\/index\.html/ });
  for (const d of ['25', '26']) { await cal.click(`#p-${d}-09-2026`); await p.waitForTimeout(1500); }
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.RATE || 4) });
  const ev = []; cdp.on('Tracing.dataCollected', (e) => ev.push(...e.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack'] } });
  const days = ['27', '28', '29', '25']; const N = days.length;
  for (const d of days) { await cal.click(`#p-${d}-09-2026`); await p.waitForTimeout(2500); }
  await cdp.send('Tracing.end'); await done;
  const X = ev.filter((e) => e.ph === 'X'); const tid = (X.find((e) => e.name === 'UpdateLayoutTree') || {}).tid;
  const short = (u) => (u || '').replace(/.*8012\//, '').replace(/\?.*/, '');
  const by = {}, layoutInfo = {}; let forcedMs = 0, frameMs = 0, nForced = 0;
  for (const e of X) {
    if (e.tid !== tid || (e.name !== 'Layout' && e.name !== 'UpdateLayoutTree')) continue;
    const st = (e.args.beginData && e.args.beginData.stackTrace) || (e.args.data && e.args.data.stackTrace) || null;
    if (st && st.length) {
      nForced++; forcedMs += e.dur;
      const f = st[0]; const k = e.name + (e.name==='UpdateLayoutTree' ? '[~'+ (e.args.elementCount||0) +' el]' : '[' + ((e.args.endData && e.args.endData.layoutRoots && e.args.endData.layoutRoots.length) || '') + ' roots]') + ' ← ' + (f.functionName || '(anon)') + ' ' + short(f.url) + ':' + f.lineNumber + (st[1] ? '  ⟵ ' + (st[1].functionName || '(anon)') + ' ' + short(st[1].url) + ':' + st[1].lineNumber : '');
      (by[k] ||= [0, 0]); by[k][0] += e.dur; by[k][1]++; if (e.name==='Layout') { (layoutInfo[k] ||= []).push(JSON.stringify(e.args.beginData && {dirty:e.args.beginData.dirtyObjects,total:e.args.beginData.totalObjects,partial:e.args.beginData.partialLayout})); }
    } else frameMs += e.dur;
  }
  console.log('per switch: forced style/layout', (forcedMs / 1000 / N).toFixed(0), 'ms in', (nForced / N).toFixed(1), 'passes; in-frame style/layout', (frameMs / 1000 / N).toFixed(0), 'ms');
  Object.entries(by).sort((a, b) => b[1][0] - a[1][0]).slice(0, 25).forEach(([k, v]) => console.log((v[0] / 1000 / N).toFixed(1).padStart(7), 'ms', (v[1] / N).toFixed(1).padStart(5), 'x/switch ', k));
  Object.entries(layoutInfo).slice(0,8).forEach(([k,v])=>console.log('   layout', k.slice(0,60), v.slice(0,3).join(' ')));
  { const lastClick = X.filter((e) => e.tid === tid && e.name === 'EventDispatch' && e.args.data && e.args.data.type === 'click').pop();
    const t0 = lastClick ? lastClick.ts : 0; console.log('--- last switch, in order (ms after click):');
    const tasks = X.filter((e) => e.tid === tid && e.name === 'RunTask' && e.ts >= t0 && e.dur > 3000);
    const seq = X.filter((e) => e.tid === tid && e.ts >= t0 && e.ts < t0 + 2400000 && ((e.name === 'Layout' || e.name === 'UpdateLayoutTree') && e.dur > 1500 || ['FireAnimationFrame','TimerFire','EventDispatch','ViewTransition::ProcessCurrentState','Paint'].includes(e.name) && e.dur > 3000)).sort((a, b) => a.ts - b.ts);
    for (const e of seq) { const st = (e.args.beginData && e.args.beginData.stackTrace) || (e.args.data && e.args.data.stackTrace) || null; const f = st && st[0];
      console.log(String(((e.ts - t0) / 1000).toFixed(0)).padStart(6), String((e.dur / 1000).toFixed(1)).padStart(6), 'ms', e.name.padEnd(22), e.name==='UpdateLayoutTree' ? String(e.args.elementCount).padStart(4)+' el' : '       ', f ? 'forced by ' + (f.functionName || '(anon)') + ' ' + short(f.url) + ':' + f.lineNumber : (e.args.data && (e.args.data.type || e.args.data.timerId) ? JSON.stringify(e.args.data.type || ('timer ' + e.args.data.timerId)) : '')); }
    console.log('long tasks after click (>3ms):', tasks.map((t) => ((t.ts - t0) / 1000).toFixed(0) + '+' + (t.dur / 1000).toFixed(0)).join('  ')); }
  const busy = X.filter((e) => e.tid === tid && e.name === 'RunTask').reduce((s, e) => s + e.dur, 0);
  console.log('main thread busy per switch', (busy / 1000 / N).toFixed(0), 'ms');
  await b.close();
})();
