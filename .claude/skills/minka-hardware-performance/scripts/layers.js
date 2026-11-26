// Composited layers: count, total area (≈ GPU memory, 4 bytes/px), the biggest ones and why they exist.
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
  const cdp = await ctx.newCDPSession(p);
  let layers = [];
  cdp.on('LayerTree.layerTreeDidChange', (e) => { if (e.layers) layers = e.layers; });
  await cdp.send('DOM.enable'); await cdp.send('LayerTree.enable');
  async function report(label) {
    await p.waitForTimeout(1500);
    const draw = layers.filter((l) => l.drawsContent);
    const area = draw.reduce((s, l) => s + l.width * l.height, 0);
    console.log(`== ${label}: ${layers.length} layers, ${draw.length} drawing, area ${(area / 1e6).toFixed(1)} Mpx ≈ ${(area * 4 / 1048576).toFixed(0)} MB`);
    const top = draw.sort((a, b) => b.width * b.height - a.width * a.height).slice(0, +(process.env.TOP || 30));
    for (const l of top) {
      let reasons = [];
      try { const r = await cdp.send('LayerTree.compositingReasons', { layerId: l.layerId }); reasons = r.compositingReasonIds || r.compositingReasons || []; } catch (_) {}
      let node = '';
      if (l.backendNodeId) { try { const d = await cdp.send('DOM.describeNode', { backendNodeId: l.backendNodeId }); const n = d.node; const attrs = {}; for (let i = 0; i < (n.attributes || []).length; i += 2) attrs[n.attributes[i]] = n.attributes[i + 1]; node = n.nodeName.toLowerCase() + (attrs.id ? '#' + attrs.id : '') + (attrs.class ? '.' + attrs.class.split(' ').slice(0, 3).join('.') : ''); } catch (_) {} }
      console.log(`  ${String(l.width).padStart(5)}x${String(l.height).padEnd(5)} paints:${String(l.paintCount).padStart(4)}  ${node.slice(0, 70).padEnd(70)} ${reasons.slice(0, 4).join(',')}`);
    }
  }
  await report('idle, radio closed');
  await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(2500);
  await report('radio open');
  await b.close();
})();
