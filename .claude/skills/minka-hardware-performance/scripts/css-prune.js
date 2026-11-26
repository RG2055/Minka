// EXPERIMENT ONLY (never ship its output): how much of the calendar's style work is the size of its cascade?
// Walks every rule of the calendar's own stylesheet files (CSSOM) and marks a style rule as live when its
// selector (with :hover/:focus/... and pseudo-elements taken off, so a hover rule counts if its element exists)
// matches some element at any step of realistic sessions: desktop with day switching, hover, every dock window,
// the worker window, the radio; rad; mobile. Then writes copies of the files without the never-live style rules
// (everything else kept: @keyframes, @font-face, @property, custom properties, media blocks) to res/pruned/, and
// a ROUTES string to res/pruned/routes.txt, to run dayswitch.js / forced.js / hover-radio.js against.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const applyVariant = require('./variant.js');
const BASE = 'http://127.0.0.1:8012/';
const SAMPLE = () => {
  const strip = (sel) => sel.replace(/::?(before|after|placeholder|selection|marker|backdrop|first-line|first-letter|-webkit-[\w-]+|-moz-[\w-]+|view-transition[\w-]*(\([^)]*\))?)/g, '')
    .replace(/:(hover|focus|focus-visible|focus-within|active|visited|target|checked|indeterminate|disabled|enabled|placeholder-shown|invalid|valid|user-invalid|autofill|popover-open|open|modal|fullscreen)/g, '');
  const live = (window.__cssLive ||= {});
  for (const sh of document.styleSheets) {
    const href = (sh.href || '').replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*/, '');
    if (!/^kalendars\/css\//.test(href)) continue;
    const walk = (rules, pfx) => { for (let i = 0; i < rules.length; i++) { const r = rules[i]; const id = href + '|' + pfx + i;
      if (r instanceof CSSStyleRule) { if (live[id]) continue; let ok = false; try { const s = strip(r.selectorText).trim(); ok = !s || !!document.querySelector(s); } catch (_) { ok = true; } if (ok) live[id] = 1; }
      if (r.cssRules && r.cssRules.length) walk(r.cssRules, pfx + i + '.'); } };
    try { walk(sh.cssRules, ''); } catch (_) {}
  }
  return Object.keys(live).length;
};
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const live = new Set();
  async function session(name, url, vp, steps) {
    const ctx = await b.newContext({ viewport: vp, timezoneId: 'Europe/Riga', isMobile: vp.width < 500, hasTouch: vp.width < 500 });
    await applyVariant(ctx);
    const p = await ctx.newPage();
    await applyVariant.setClock(p);
    await p.goto(BASE + url, { waitUntil: 'load' }); await p.waitForTimeout(9000);
    const f = () => p.frame({ url: /kalendars\/index\.html/ });
    const sample = async () => { const fr = f(); if (fr) await fr.evaluate(SAMPLE).catch(() => {}); };
    await sample();
    try { await steps(p, f, sample); } catch (e) { console.log(name, 'step error', e.message.slice(0, 100)); }
    await sample();
    const ids = await f().evaluate(() => Object.keys(window.__cssLive || {})).catch(() => []);
    ids.forEach((x) => live.add(x));
    await ctx.close();
    console.log('session done:', name, ids.length);
  }
  await session('desktop', 'index.html?visible=1', { width: 1920, height: 1080 }, async (p, f, sample) => {
    for (const d of ['25', '26', '27', '10', '23', '24']) { await f().click(`#p-${d}-09-2026`).catch(() => {}); await p.waitForTimeout(900); await sample(); }
    for (const c of (await f().locator('#grafiks-list .card').all()).slice(0, 8)) { await c.hover().catch(() => {}); await p.waitForTimeout(250); await sample(); }
    for (const fn of ['openMonthCalFromDock()', 'openStatsFromDock()', 'toggleNsFromParent()', 'openSettingsFromDock()', 'openPlanotajsLauncher()', 'openPusdienasLauncher()', 'toggleBolus()']) { await p.evaluate(fn).catch(() => {}); await p.waitForTimeout(1500); await sample(); await p.keyboard.press('Escape'); await p.waitForTimeout(700); }
    await f().locator('#grafiks-list .card').first().click().catch(() => {}); await p.waitForTimeout(1500); await sample(); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    await p.evaluate(() => window.toggleRadio()).catch(() => {}); await p.waitForTimeout(2500); await sample();
    for (const d of ['28', '24']) { await f().click(`#p-${d}-09-2026`).catch(() => {}); await p.waitForTimeout(900); await sample(); }
  });
  await session('rad', 'index.html?visible=1&app=rad', { width: 1920, height: 1080 }, async (p, f, sample) => { for (const d of ['25', '26']) { await f().click(`#p-${d}-09-2026`).catch(() => {}); await p.waitForTimeout(900); await sample(); } });
  // write the pruned copies from one more page (the rules' own text, serialised by the browser)
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  await applyVariant(ctx); const p = await ctx.newPage(); await applyVariant.setClock(p);
  await p.goto(BASE + 'index.html?visible=1', { waitUntil: 'load' }); await p.waitForTimeout(9000);
  const res = await p.frame({ url: /kalendars\/index\.html/ }).evaluate((liveIds) => {
    const L = new Set(liveIds), out = {}; let all = 0, kept = 0;
    for (const sh of document.styleSheets) {
      const href = (sh.href || '').replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*/, '');
      if (!/^kalendars\/css\//.test(href)) continue;
      const ser = (rules, pfx) => { let s = ''; for (let i = 0; i < rules.length; i++) { const r = rules[i], id = href + '|' + pfx + i;
        if (r instanceof CSSStyleRule) { all++; if (L.has(id)) { kept++; s += r.cssText + '\n'; } else if (r.cssRules && r.cssRules.length) { s += r.selectorText + '{' + ser(r.cssRules, pfx + i + '.') + '}\n'; } continue; }
        if (r instanceof CSSMediaRule) { s += '@media ' + r.conditionText + '{' + ser(r.cssRules, pfx + i + '.') + '}\n'; continue; }
        if (r instanceof CSSSupportsRule) { s += '@supports ' + r.conditionText + '{' + ser(r.cssRules, pfx + i + '.') + '}\n'; continue; }
        if (window.CSSContainerRule && r instanceof CSSContainerRule) { s += '@container ' + r.containerName + ' ' + r.containerQuery + '{' + ser(r.cssRules, pfx + i + '.') + '}\n'; continue; }
        if (window.CSSLayerBlockRule && r instanceof CSSLayerBlockRule) { s += '@layer ' + r.name + '{' + ser(r.cssRules, pfx + i + '.') + '}\n'; continue; }
        s += r.cssText + '\n'; } return s; };
      try { out[href] = ser(sh.cssRules, ''); } catch (_) {}
    }
    return { out, all, kept };
  }, [...live]);
  await ctx.close(); await b.close();
  const dir = path.join(__dirname, 'res', 'pruned'); const routes = [];
  for (const [u, s] of Object.entries(res.out)) { const dst = path.join(dir, u); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, s); routes.push(u + '=' + dst); }
  fs.writeFileSync(path.join(dir, 'routes.txt'), routes.join(';'));
  console.log(`calendar CSS files ${routes.length}: style rules ${res.all} → ${res.kept} live (${(100 * res.kept / res.all).toFixed(0)}%)`);
})();
