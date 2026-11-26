// What keeps an integrated GPU busy while nobody touches the app: running animations (and which ones repaint
// rather than composite), frames produced per second, blur/filter area, composited layers and their memory.
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
const PAINT_PROPS = /^(box-shadow|filter|backdrop-filter|background|background-position|background-color|color|width|height|top|left|right|bottom|margin|padding|border|clip-path|mask|text-shadow|outline|stroke|fill|font|letter-spacing|inset)/;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx));
  const p = await ctx.newPage();
  await require('./variant.js').setClock(p);
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(12000);
  const cdp = await ctx.newCDPSession(p);
  let layers = [];
  cdp.on('LayerTree.layerTreeDidChange', (e) => { if (e.layers) layers = e.layers; });
  await cdp.send('LayerTree.enable');
  const census = () => {
    const out = { anims: {}, blur: [], filterArea: 0, blurArea: 0 };
    const vw = innerWidth, vh = innerHeight;
    const visArea = (el) => { const r = el.getBoundingClientRect(); const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)); const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)); return w * h; };
    out.total = document.getAnimations().map(a=>a.playState).join(',').slice(0,200);
    for (const a of document.getAnimations()) {
      if (a.playState !== 'running') continue;
      const eff = a.effect; const t = eff && eff.target; if (!t) continue;
      const props = new Set(); try { for (const k of eff.getKeyframes()) for (const p of Object.keys(k)) if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())); } catch (_) {}
      if (a.transitionProperty) props.add(a.transitionProperty);
      const timing = eff.getComputedTiming ? eff.getComputedTiming() : {};
      const paints = [...props].filter((p) => /^(box-shadow|filter|backdrop-filter|background|color|width|height|top|left|right|bottom|margin|padding|border|clip-path|mask|text-shadow|outline|stroke|fill|font|letter-spacing|inset)/.test(p));
      const shown = t.isConnected && t.getClientRects().length > 0 && getComputedStyle(t).visibility !== 'hidden';
      const key = (a.animationName || a.transitionProperty || 'waapi') + ' @' + (t.id ? '#' + t.id : t.tagName.toLowerCase() + '.' + String(t.className && t.className.baseVal !== undefined ? t.className.baseVal : t.className).split(' ').slice(0, 2).join('.'));
      const o = (out.anims[key] ||= { n: 0, infinite: timing.iterations === Infinity, paints: paints.join(','), props: [...props].join(','), shown: 0, area: 0 });
      o.n++; if (shown) { o.shown++; o.area += visArea(t); }
    }
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const bf = cs.backdropFilter || cs.webkitBackdropFilter;
      const hasBf = bf && bf !== 'none', hasF = cs.filter && cs.filter !== 'none';
      if (!hasBf && !hasF) continue;
      if (!el.getClientRects().length || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const a = visArea(el); if (!a) continue;
      if (hasBf) { out.blurArea += a; out.blur.push([(el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]).slice(0, 50), bf.slice(0, 40), Math.round(a)]); }
      else out.filterArea += a;
    }
    out.blur.sort((x, y) => y[2] - x[2]); out.blurN = out.blur.length; out.blur = out.blur.slice(0, 8);
    out.vp = vw * vh;
    return out;
  };
  async function frames(ms) {
    const ev = []; cdp.on('Tracing.dataCollected', (e) => ev.push(...e.value));
    const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['benchmark', 'cc', 'devtools.timeline', 'disabled-by-default-devtools.timeline'] } });
    await p.waitForTimeout(ms);
    await cdp.send('Tracing.end'); await done;
    const st = {}; ev.filter((e) => e.name === 'PipelineReporter' && (e.ph === 'b' || e.ph === 'X' || e.ph === 'B')).forEach((e) => { const s = (e.args && e.args.chrome_frame_reporter && e.args.chrome_frame_reporter.state) || (e.args && e.args.frame_reporter && e.args.frame_reporter.state) || '?'; st[s] = (st[s] || 0) + 1; });
    const paint = ev.filter((e) => e.ph === 'X' && e.name === 'Paint').length;
    const raster = ev.filter((e) => e.ph === 'X' && /RasterTask|RasterizerTaskImpl::RunOnWorkerThread/.test(e.name)).reduce((s, e) => s + e.dur, 0);
    return { perSec: Object.fromEntries(Object.entries(st).map(([k, v]) => [k, +(v / (ms / 1000)).toFixed(1)])), paintsPerSec: +(paint / (ms / 1000)).toFixed(1), rasterMsPerSec: +(raster / 1000 / (ms / 1000)).toFixed(1) };
  }
  async function report(label) {
    await p.waitForTimeout(2000);
    const fr = await frames(5000);
    const draw = layers.filter((l) => l.drawsContent);
    const area = draw.reduce((s, l) => s + l.width * l.height, 0);
    console.log(`\n===== ${label}`);
    console.log('frames/s:', JSON.stringify(fr));
    console.log(`layers: ${layers.length}, drawing ${draw.length}, ${(area / 1e6).toFixed(1)} Mpx ≈ ${(area * 4 / 1048576).toFixed(0)} MB of tiles`);
    for (const f of p.frames()) {
      let c; try { c = await f.evaluate(census); } catch (e) { console.log('census err', e.message.slice(0,120)); continue; }
      const name = f === p.mainFrame() ? 'shell' : f.url().replace(/.*8012\//, '').replace(/\?.*/, '');
      const a = Object.entries(c.anims);
      console.log('frame', name, 'anims', a.length, 'blur', c.blurN, 'all', c.total);
      console.log(`-- frame ${name}: ${a.length} running animation kinds; backdrop-filter ${c.blurN} el, ${(c.blurArea / c.vp).toFixed(2)} viewports; filter ${(c.filterArea / c.vp).toFixed(2)} viewports`);
      a.sort((x, y) => (y[1].shown ? 1 : 0) - (x[1].shown ? 1 : 0) || y[1].area - x[1].area).slice(0, 25).forEach(([k, v]) => console.log(`   ${v.infinite ? '∞' : ' '} ${v.paints ? 'REPAINT' : 'comp   '} ${String(v.n).padStart(3)}x shown:${String(v.shown).padStart(3)} area:${String(Math.round(v.area)).padStart(7)}  ${k.slice(0, 60).padEnd(60)} ${v.props.slice(0, 50)}`));
      c.blur.forEach((x) => console.log('   blur', JSON.stringify(x)));
    }
  }
  await report('idle, radio closed');
  await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(2500);
  await report('radio open, paused');
  await b.close();
})();
