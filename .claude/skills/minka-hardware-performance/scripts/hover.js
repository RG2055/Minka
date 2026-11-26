// Hovering cards: what runs (JS by function, style recalcs and their causes, paints by element, animations started).
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx));
  const p = await ctx.newPage();
  await require('./variant.js').setClock(p);
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(12000);
  const cal = p.frame({ url: /kalendars\/index\.html/ });
  const cards = await cal.locator('#grafiks-list .card').all();
  const side = await cal.locator('.mk-side-card').all();
  const cdp = await ctx.newCDPSession(p);
  const ev = []; cdp.on('Tracing.dataCollected', (e) => ev.push(...e.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'disabled-by-default-devtools.timeline.invalidationTracking'] } });
  for (let r = 0; r < 2; r++) for (const c of [...cards.slice(0, 7), ...side.slice(0, 4)]) { try { await c.hover({ timeout: 2000 }); } catch (_) {} await p.waitForTimeout(150); }
  await p.mouse.move(960, 1070); await p.waitForTimeout(500);
  const anims = await cal.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.animationName || a.transitionProperty || a.constructor.name))).catch(() => []);
  await cdp.send('Tracing.end'); await done;
  const X = ev.filter((e) => e.ph === 'X');
  const tid = (X.find((e) => e.name === 'UpdateLayoutTree') || {}).tid;
  const short = (u) => (u || '').replace(/.*8012\//, '').replace(/\?.*/, '');
  const sum = (n) => +(X.filter((e) => e.name === n && e.tid === tid).reduce((s, e) => s + e.dur, 0) / 1000).toFixed(1);
  const cnt = (n) => X.filter((e) => e.name === n && e.tid === tid).length;
  console.log('main thread during hover:', { tasks: sum('RunTask'), style: sum('UpdateLayoutTree'), styleN: cnt('UpdateLayoutTree'), layout: sum('Layout'), layoutN: cnt('Layout'), paint: sum('Paint'), paintN: cnt('Paint'), hitTest: sum('HitTest'), js: sum('FunctionCall'), events: sum('EventDispatch') });
  const big = X.filter((e) => e.tid === tid && e.name === 'UpdateLayoutTree').sort((a, b) => b.dur - a.dur).slice(0, 6).map((e) => [(e.dur / 1000).toFixed(1) + 'ms', e.args.elementCount + 'el', ((e.args.beginData && e.args.beginData.stackTrace) || [])[0] ? short(e.args.beginData.stackTrace[0].url) + ':' + e.args.beginData.stackTrace[0].lineNumber : 'frame']);
  console.log('biggest style recalcs:', JSON.stringify(big));
  const fn = {}; X.filter((e) => e.tid === tid && e.name === 'FunctionCall' && e.args.data && e.args.data.url).forEach((e) => { const k = short(e.args.data.url) + ':' + (e.args.data.lineNumber + 1) + ' ' + (e.args.data.functionName || ''); (fn[k] ||= [0, 0]); fn[k][0] += e.dur; fn[k][1]++; });
  console.log('JS by entry:'); Object.entries(fn).sort((a, b) => b[1][0] - a[1][0]).slice(0, 10).forEach(([k, v]) => console.log('  ', (v[0] / 1000).toFixed(1).padStart(6), 'ms', String(v[1]).padStart(4), 'x', k));
  const inv = {}; ev.filter((e) => /StyleInvalidatorInvalidationTracking|ScheduleStyleInvalidationTracking/.test(e.name)).forEach((e) => { const d = e.args.data || {}; const k = (d.changedPseudo ? 'pseudo ' + d.changedPseudo : d.changedClass ? 'class .' + d.changedClass : d.changedAttribute ? 'attr ' + d.changedAttribute : d.reason || '?') + ' @ ' + (d.nodeName || '').slice(0, 70); inv[k] = (inv[k] || 0) + 1; });
  console.log('invalidations:'); Object.entries(inv).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => console.log('  ', String(v).padStart(4), k));
  const paints = {}; X.filter((e) => e.name === 'Paint' && e.tid === tid).forEach((e) => { const d = e.args.data || {}; const k = (d.nodeName || '?').slice(0, 80); (paints[k] ||= [0, 0]); paints[k][0] += e.dur; paints[k][1]++; });
  console.log('paints:'); Object.entries(paints).sort((a, b) => b[1][0] - a[1][0]).slice(0, 8).forEach(([k, v]) => console.log('  ', (v[0] / 1000).toFixed(1).padStart(6), 'ms', String(v[1]).padStart(4), 'x', k));
  console.log('animations still running after leaving:', JSON.stringify(anims.reduce((o, k) => { o[k] = (o[k] || 0) + 1; return o; }, {})));
  await b.close();
})();
