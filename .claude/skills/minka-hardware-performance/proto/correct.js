const { chromium } = require('playwright'); const route = require('./route.js');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1908, height: 986 } }); await route(ctx); const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8012/__rg2/pages/' + (process.env.V || 'rgmorph') + '.html', { waitUntil: 'load' }); await p.waitForTimeout(2500);
  const r = await p.evaluate(async () => {
    const D = await (await fetch('/__rg2/days.json')).json(); const bad = []; const seq = ['25-09-2026', '20-09-2026', '29-09-2026', '24-09-2026', '26-09-2026', '27-09-2026', '21-09-2026', '28-09-2026'];
    const norm = (h) => { const t = document.createElement('template'); t.innerHTML = h; return t.innerHTML; };
    for (const d of seq) { window.__rg2.switchTo(d); await new Promise((r) => setTimeout(r, 30));
      for (const id of D.regions) { const el = document.getElementById(id), want = D.days[d].regions[id]; if (!el || !want) continue; const a = el.cloneNode(true), t = document.createElement(el.tagName); t.innerHTML = want.html; for (const n of [a, t]) { const w = document.createTreeWalker(n, NodeFilter.SHOW_COMMENT); const c = []; while (w.nextNode()) c.push(w.currentNode); c.forEach((x) => x.remove()); n.normalize(); } for (const at of [...a.attributes]) a.removeAttribute(at.name); if (!a.isEqualNode(t)) bad.push(d + ' ' + id); } }
    return { checked: seq.length * D.regions.length, mismatches: bad.slice(0, 8), n: bad.length };
  });
  console.log(process.env.V || 'rgmorph', JSON.stringify(r)); await b.close(); })();
