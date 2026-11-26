// The calendar's card list and side columns (DOM: tags, attributes, class tokens, inline style properties, text)
// after the same day clicks on two servers: A=8013 (e.g. a worktree of the old code) and B=8012. SEQ=25,26 DAY=24.
// Writes res/dom-a.txt and res/dom-b.txt; generated SVG ids (mkoN) are normalised. diff them.
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
const DAY = process.env.DAY || '24';
async function snap(seq, port) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  await ctx.addInitScript(`(() => { let s = 1234567; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`);
  await applyVariant(ctx);
  const p = await ctx.newPage(); await applyVariant.setClock(p);
  await p.goto(`http://127.0.0.1:${port}/index.html?visible=1`, { waitUntil: 'load' }); await p.waitForTimeout(10000);
  const cal = p.frame({ url: /kalendars\/index\.html/ });
  for (const d of seq) { await cal.click(`#p-${d}-09-2026`); await p.waitForTimeout(1500); }
  await p.waitForTimeout(3000);
  const r = await cal.evaluate(() => {
    const out = [];
    const walk = (n, depth) => {
      if (n.nodeType === 3) { const t = n.nodeValue.trim(); if (t) out.push(' '.repeat(depth) + '"' + t + '"'); return; }
      if (n.nodeType !== 1) return;
      const at = [...n.attributes].filter((a) => !/^(data-rg-key)$/.test(a.name)).map((a) => a.name === 'class' ? 'class=' + [...n.classList].filter((c) => !/^mk-cor-(hot|fresh)$/.test(c)).sort().join('.') : a.name === 'style' ? 'style=' + [...n.style].sort().map((k) => k + ':' + n.style.getPropertyValue(k)).join(';') : a.name + '=' + a.value).sort();
      out.push(' '.repeat(depth) + n.tagName + ' ' + at.join(' '));
      for (const c of n.childNodes) walk(c, depth + 1);
    };
    for (const id of ['grafiks-list', 'radiographers-duty', 'radiologists-duty']) walk(document.getElementById(id), 0);
    return out;
  });
  await b.close();
  return r;
}
(async () => {
  const SEQ = (process.env.SEQ || '25,26,27,23').split(',').concat([DAY]); const fresh = await snap(SEQ, +(process.env.A || 8013));
  const switched = await snap(SEQ, +(process.env.B || 8012));
  require('fs').writeFileSync(__dirname + '/res/dom-a.txt', fresh.join('\n').replace(/mko[0-9]+/g, 'mkoN')); require('fs').writeFileSync(__dirname + '/res/dom-b.txt', switched.join('\n').replace(/mko[0-9]+/g, 'mkoN'));
  console.log('lines', fresh.length, switched.length);
})();
