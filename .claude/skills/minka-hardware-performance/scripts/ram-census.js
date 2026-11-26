// Where the renderer's memory goes when the JS heap is small: documents/iframes and the CSS each one parses,
// decoded image pixels, canvas backing stores, DOM size. Target navigator values (12 threads, 8 GB).
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx));
  await ctx.addInitScript(`try{Object.defineProperty(Navigator.prototype,'hardwareConcurrency',{get:()=>12});Object.defineProperty(Navigator.prototype,'deviceMemory',{get:()=>8});}catch(_){}`);
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(15000);
  const per = async (label) => {
    let tot = { rules: 0, cssKB: 0, imgMB: 0, cvMB: 0, nodes: 0 };
    console.log(`\n===== ${label}: ${p.frames().length} frames`);
    for (const f of p.frames()) {
      const r = await f.evaluate(() => {
        let rules = 0, cssLen = 0;
        for (const s of document.styleSheets) { try { const walk = (list) => { for (const x of list) { rules++; if (x.cssRules) walk(x.cssRules); } }; walk(s.cssRules); } catch (_) {} }
        for (const s of document.querySelectorAll('style')) cssLen += s.textContent.length;
        let img = 0, imgN = 0; for (const i of document.images) if (i.complete && i.naturalWidth) { img += i.naturalWidth * i.naturalHeight * 4; imgN++; }
        let cv = 0, cvN = 0, cvBig = []; for (const c of document.querySelectorAll('canvas')) { const a = c.width * c.height * 4; cv += a; cvN++; cvBig.push([(c.id || c.className || 'canvas').toString().slice(0, 30), c.width + 'x' + c.height]); }
        const vis = !!(window.frameElement ? window.frameElement.getClientRects().length && getComputedStyle(window.frameElement).display !== 'none' : true);
        return { url: location.pathname + location.search.slice(0, 30), vis, sheets: document.styleSheets.length, rules, inlineCssKB: +(cssLen / 1024).toFixed(0), nodes: document.getElementsByTagName('*').length, imgN, imgMB: +(img / 1048576).toFixed(1), cvN, cvMB: +(cv / 1048576).toFixed(1), cvBig: cvBig.slice(0, 4) };
      }).catch((e) => ({ url: f.url().slice(0, 60), err: e.message.slice(0, 60) }));
      if (r.err || (r.url === 'blank' || /about:blank/.test(f.url())) && !r.nodes) { console.log('  ', f.url().slice(0, 50), r.err || 'empty'); continue; }
      tot.rules += r.rules || 0; tot.imgMB += r.imgMB || 0; tot.cvMB += r.cvMB || 0; tot.nodes += r.nodes || 0;
      console.log('  ', JSON.stringify(r).slice(0, 330));
    }
    console.log('TOTAL', JSON.stringify(tot));
  };
  await per('idle, radio closed');
  await p.evaluate(() => window.toggleRadio()).catch(() => {}); await p.waitForTimeout(3000);
  await per('radio open');
  await b.close();
})();
