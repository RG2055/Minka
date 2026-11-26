// Capture from the current RG (synthetic data, target navigator, fixed 10:30): for each day, every region that a
// day switch changes (attributes + inner HTML, after all of RG's decorators ran), the <html>/<body> attributes,
// and one static skeleton of the calendar document (scripts removed, same stylesheets) for the prototypes.
const { chromium } = require('playwright');
const fs = require('fs');
const applyVariant = require('/home/user/Minka/.claude/skills/minka-hardware-performance/scripts/variant.js');
const OUT = __dirname + '/data';
const DAYS = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'].map((d) => d + '-09-2026');
const REGIONS = ['grafiks-list', 'nsOverlay', 'minkaBarWrap', 'grafiks-scroller', 'radiographers-duty', 'radiologists-duty', 'shift-progress-wrap', 'radiographers-next-container', 'radiologists-next-container', 'radiographers-shift-count', 'radiologists-shift-count', 'grafiks-dateTitle', 'grafiks-todayTag', 'mkDailyCatPet'];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  await ctx.addInitScript(`(() => { let s = 1234567; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`);
  await applyVariant(ctx);
  const p = await ctx.newPage(); await applyVariant.setClock(p);
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' }); await p.waitForTimeout(12000);
  const cal = p.frame({ url: /kalendars\/index\.html/ });

  const inlineBlobs = (frame) => frame.evaluate(async () => {
    window.__blobData ||= {};
    const urls = new Set(); const scan = (t) => { for (const m of t.matchAll(/blob:http[^"')\s&]+/g)) urls.add(m[0]); };
    scan(document.documentElement.outerHTML);
    for (const u of urls) { if (window.__blobData[u]) continue; try { const b = await (await fetch(u)).blob(); window.__blobData[u] = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); }); } catch (_) {
      // revoked already: take the pixels of a decoded <img> that shows it
      const img = [...document.images].find((i) => i.src === u && i.complete && i.naturalWidth);
      if (img) { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); try { window.__blobData[u] = c.toDataURL('image/png'); } catch (_e) {} }
    } }
    window.__blobMissing = [...urls].filter((u) => !window.__blobData[u]).length;
    return Object.keys(window.__blobData).length;
  });
  const swapBlobs = (frame, obj) => frame.evaluate((json) => json.replace(/blob:http[^"')\s&\\]+/g, (u) => window.__blobData[u] || u), JSON.stringify(obj)).then((j) => JSON.parse(j));
  const regions = await cal.evaluate((R) => R.filter((id) => { const el = document.getElementById(id); return el && !R.some((o) => o !== id && document.getElementById(o) && document.getElementById(o).contains(el) && document.getElementById(o) !== el); }), REGIONS);
  console.log('regions (outermost):', regions.join(', '));
  const days = {};
  for (const d of DAYS) {
    await cal.click('#p-' + d).catch(() => {}); await p.waitForTimeout(2200);
    days[d] = await cal.evaluate((R) => {
      const attrs = (el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]));
      const r = {}; for (const id of R) { const el = document.getElementById(id); if (el) r[id] = { attrs: attrs(el), html: el.innerHTML }; }
      // the card list as units (its direct children), each with a key: the person, else its class and index
      const list = document.getElementById('grafiks-list');
      r['grafiks-list'].units = [...list.children].map((c, i) => ({ key: (c.getAttribute('data-worker') || c.className.split(' ').slice(0, 2).join('.') || c.tagName) + '#' + ([...list.children].slice(0, i).filter((x) => x.className === c.className && x.getAttribute('data-worker') === c.getAttribute('data-worker')).length), html: c.outerHTML }));
      return { html: attrs(document.documentElement), body: attrs(document.body), regions: r, elements: document.getElementsByTagName('*').length };
    }, regions);
    await inlineBlobs(cal); days[d] = await swapBlobs(cal, days[d]);
    console.log(d, 'elements', days[d].elements, 'list units', days[d].regions['grafiks-list'].units.length, 'blob left', (JSON.stringify(days[d]).match(/blob:http/g) || []).length);
  }
  fs.writeFileSync(OUT + '/days.json', JSON.stringify({ regions, days }));
  // skeleton: day 24 again, scripts out, a <base> so the same stylesheet/asset URLs resolve
  await cal.click('#p-24-09-2026'); await p.waitForTimeout(2200);
  const skel = await cal.evaluate(() => {
    const doc = document.documentElement.cloneNode(true);
    doc.querySelectorAll('script').forEach((s) => s.remove());
    const head = doc.querySelector('head'); const base = document.createElement('base'); base.href = '/kalendars/'; head.prepend(base);
    // the inline <style> elements that scripts added stay (they are part of the look)
    return '<!DOCTYPE html>\n' + doc.outerHTML;
  });
  await inlineBlobs(cal); const skel2 = await swapBlobs(cal, skel);
  fs.writeFileSync(OUT + '/skeleton.html', skel2);
  console.log('skeleton blob left', (skel2.match(/blob:http/g) || []).length);
  console.log('skeleton bytes', skel.length);
  await b.close();
})();
