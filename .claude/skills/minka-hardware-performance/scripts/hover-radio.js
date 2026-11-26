// Card hover (WIGGLE=1: the pointer keeps moving on each card) with the radio closed / open / open + spectrum, CPU x4 (RATE), target navigator.
// Per state: main-thread time per hover (style, layout, paint, JS), frames presented vs dropped, the biggest
// style recalcs and what invalidated them, JS by entry point.
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
const RATE = +(process.env.RATE || 4);
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx), 'rate', RATE);
  const p = await ctx.newPage();
  await applyVariant.setClock(p);
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(12000);
  const cal = p.frame({ url: /kalendars\/index\.html/ });
  const cdp = await ctx.newCDPSession(p);
  const short = (u) => (u || '').replace(/.*8012\//, '').replace(/\?.*/, '');
  async function sweep(label) {
    await p.mouse.move(960, 1075); await p.waitForTimeout(1500);
    const cards = (await cal.locator('#grafiks-list .card').all()).slice(0, 7);
    const boxes = []; for (const c of cards) { const bb = await c.boundingBox().catch(() => null); if (bb) boxes.push(bb); }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    const ev = []; const onData = (e) => ev.push(...e.value); cdp.on('Tracing.dataCollected', onData);
    const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['benchmark', 'cc', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'disabled-by-default-devtools.timeline.invalidationTracking'] } });
    const t0 = Date.now(); let hovers = 0;
    for (let r = 0; r < 2; r++) for (const bb of boxes) {
      // glide in like a hand: a few steps from below, then rest on the card
      await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 6 }); hovers++;
      if (process.env.WIGGLE) {
        // a hand resting on the card still moves: 24 small moves over ~0.8 s
        for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 4; await p.mouse.move(bb.x + bb.width / 2 + Math.cos(a) * bb.width * 0.25, bb.y + bb.height / 2 + Math.sin(a) * bb.height * 0.2); await p.waitForTimeout(33); }
      } else await p.waitForTimeout(250);
    }
    await p.mouse.move(960, 1075, { steps: 4 }); await p.waitForTimeout(400);
    const secs = (Date.now() - t0) / 1000;
    await cdp.send('Tracing.end'); await done; cdp.off('Tracing.dataCollected', onData);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const X = ev.filter((e) => e.ph === 'X');
    const tid = (() => { const c = {}; X.filter((e) => e.name === 'UpdateLayoutTree').forEach((e) => { c[e.tid] = (c[e.tid] || 0) + e.dur; }); return +Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; })();
    const M = X.filter((e) => e.tid === tid);
    const sum = (n) => M.filter((e) => e.name === n).reduce((s, e) => s + e.dur, 0) / 1000;
    const st = {}; ev.filter((e) => e.name === 'PipelineReporter' && e.ph !== 'e').forEach((e) => { const s = JSON.stringify(e.args || {}).match(/STATE_([A-Z_]+)/); if (s) st[s[1]] = (st[s[1]] || 0) + 1; });
    const per = (v) => +(v / hovers).toFixed(1);
    const styleEl = M.filter((e) => e.name === 'UpdateLayoutTree').reduce((s, e) => s + (e.args.elementCount || 0), 0);
    console.log(`\n===== ${label}: ${hovers} hovers in ${secs.toFixed(1)} s`);
    console.log('per hover ms:', JSON.stringify({ task: per(sum('RunTask')), style: per(sum('UpdateLayoutTree')), styleElements: Math.round(styleEl / hovers), layout: per(sum('Layout')), paint: per(sum('Paint')), js: per(sum('FunctionCall') + sum('EvaluateScript')), hitTest: per(sum('HitTest')) }));
    console.log('frames/s:', JSON.stringify(Object.fromEntries(Object.entries(st).map(([k, v]) => [k, +(v / secs).toFixed(1)]))));
    const big = M.filter((e) => e.name === 'UpdateLayoutTree').sort((a, b) => b.dur - a.dur).slice(0, 5).map((e) => (e.dur / 1000).toFixed(1) + 'ms/' + e.args.elementCount + 'el ' + (((e.args.beginData || {}).stackTrace || [])[0] ? short(e.args.beginData.stackTrace[0].url) + ':' + e.args.beginData.stackTrace[0].lineNumber + ' ' + e.args.beginData.stackTrace[0].functionName : 'frame'));
    console.log('biggest style recalcs:', JSON.stringify(big));
    const fn = {}; M.filter((e) => e.name === 'FunctionCall' && e.args.data).forEach((e) => { const d = e.args.data; const k = short(d.url) + ':' + (d.lineNumber + 1) + ' ' + (d.functionName || ''); (fn[k] ||= [0, 0]); fn[k][0] += e.dur; fn[k][1]++; });
    console.log('JS by entry:'); Object.entries(fn).sort((a, b) => b[1][0] - a[1][0]).slice(0, 8).forEach(([k, v]) => console.log('  ', (v[0] / 1000).toFixed(0).padStart(6), 'ms', String(v[1]).padStart(4), 'x', k));
    const inv = {}; ev.filter((e) => /StyleRecalcInvalidationTracking|StyleInvalidatorInvalidationTracking/.test(e.name)).forEach((e) => { const d = e.args.data || {}; const k = (d.reason || (d.changedClass ? 'class .' + d.changedClass : d.changedPseudo ? 'pseudo ' + d.changedPseudo : d.changedAttribute ? 'attr ' + d.changedAttribute : '?')) + ' @ ' + (d.nodeName || '').slice(0, 60); inv[k] = (inv[k] || 0) + 1; });
    console.log('invalidations:'); Object.entries(inv).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log('  ', String(v).padStart(5), k));
    const paints = {}; M.filter((e) => e.name === 'Paint').forEach((e) => { const k = ((e.args.data || {}).nodeName || '?').slice(0, 60); (paints[k] ||= [0, 0]); paints[k][0] += e.dur; paints[k][1]++; });
    console.log('paints:'); Object.entries(paints).sort((a, b) => b[1][0] - a[1][0]).slice(0, 5).forEach(([k, v]) => console.log('  ', (v[0] / 1000).toFixed(0).padStart(6), 'ms', String(v[1]).padStart(4), 'x', k));
  }
  if (!process.env.ONLY_OPEN) await sweep('radio closed');
  await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(3000);
  await sweep('radio open, paused');
  await p.evaluate((SKIN) => { const ac = new AudioContext(); const an = ac.createAnalyser(); const o = ac.createOscillator(); const g = ac.createGain(); g.gain.value = 0.001; o.connect(an); an.connect(g); g.connect(ac.destination); o.start(); window.__mkRadioAnalyser = () => an; const mx = document.getElementById('rmx'); document.getElementById('radioWindow').dataset.radioSkin = SKIN; if (mx) mx.classList.add('rmx-playing'); document.body.classList.add('radio-playing'); document.body.classList.remove('radio-idle'); }, process.env.SKIN || 'pioneer');
  await p.waitForTimeout(3000);
  await sweep('radio open, spectrum running');
  await b.close();
})();
