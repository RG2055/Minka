// Per day switch: how many elements are restyled in total (all style passes), against how many the calendar has,
// and which invalidations caused the large passes (element, reason, the JS that did it).
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx)); const p = await ctx.newPage(); await applyVariant.setClock(p);
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' }); await p.waitForTimeout(12000);
  if (process.env.RADIO) { await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(3000); }
  const cal = p.frame({ url: /kalendars\/index\.html/ });
  const docEls = await cal.evaluate(() => document.getElementsByTagName('*').length);
  const cdp = await ctx.newCDPSession(p); const ev = []; cdp.on('Tracing.dataCollected', (e) => ev.push(...e.value)); const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'disabled-by-default-devtools.timeline.invalidationTracking'] } });
  const days = ['25', '26', '27', '28', '10', '11']; for (const d of days) { await cal.click(`#p-${d}-09-2026`).catch(() => {}); await p.waitForTimeout(1000); }
  await cdp.send('Tracing.end'); await done;
  const tid = (() => { const c = {}; ev.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X').forEach((e) => { c[e.tid] = (c[e.tid] || 0) + 1; }); return +Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; })();
  const evs = ev.filter((e) => e.tid === tid || /Invalidation/.test(e.name)).sort((a, b) => a.ts - b.ts);
  let els = 0, n = 0, ms = 0, pending = []; const by = {};
  const short = (u) => (u || '').replace(/.*8012\//, '').replace(/\?.*/, '');
  for (const e of evs) {
    if (/InvalidationTracking/.test(e.name)) { pending.push(e); continue; }
    if (e.name !== 'UpdateLayoutTree' || e.ph !== 'X') continue;
    els += e.args.elementCount || 0; n++; ms += e.dur / 1000;
    if ((e.args.elementCount || 0) >= 150) for (const x of pending) { const d = x.args.data || {}; if (!d.nodeName) continue; const st = (d.stackTrace || [])[0]; const k = (d.reason || (d.changedClass && 'class .' + d.changedClass) || (d.changedAttribute && 'attr ' + d.changedAttribute) || (d.changedPseudo && 'pseudo') || 'set') + ' @ ' + d.nodeName.slice(0, 55) + (st ? ' ← ' + short(st.url) + ':' + st.lineNumber + ' ' + st.functionName : ''); (by[k] ||= [0, 0]); by[k][0]++; by[k][1] += e.args.elementCount; }
    pending = [];
  }
  console.log(`calendar elements ${docEls}; per switch: ${(els / days.length).toFixed(0)} elements restyled in ${(n / days.length).toFixed(1)} passes, ${(ms / days.length).toFixed(1)} ms (x1)`);
  console.log('invalidations before passes of 150+ elements (count, elements in those passes):');
  Object.entries(by).sort((a, b) => b[1][1] - a[1][1]).slice(0, 18).forEach(([k, v]) => console.log('  ', String(v[0]).padStart(4), String(v[1]).padStart(7), k.slice(0, 150)));
  await b.close();
})();
