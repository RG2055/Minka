// JS + CSS coverage over realistic sessions (desktop with every dock window, radio and day switching; rad; mobile).
// Per file: bytes never executed / CSS rules never matched in ANY session. Candidates, not proof.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://127.0.0.1:8012';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const jsUsed = {}, jsSize = {}, cssUsed = {}, cssSize = {}, cssRules = {}, cssRulesUsed = {};
  const merge = (map, url, ranges) => { (map[url] ||= []).push(...ranges); };
  async function session(name, url, vp, steps) {
    const ctx = await b.newContext({ viewport: vp, timezoneId: 'Europe/Riga', isMobile: vp.width < 500, hasTouch: vp.width < 500 });
    const p = await ctx.newPage();
    await require('./variant.js').setClock(p);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Debugger.enable'); await cdp.send('Profiler.enable'); await cdp.send('Profiler.startPreciseCoverage', { callCount: false, detailed: true });
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); await cdp.send('CSS.startRuleUsageTracking');
    const sheets = {}; cdp.on('CSS.styleSheetAdded', (e) => { sheets[e.header.styleSheetId] = e.header; });
    await p.goto(BASE + url, { waitUntil: 'load' }); await p.waitForTimeout(9000);
    try { await steps(p); } catch (e) { console.log(name, 'step error', e.message.slice(0, 120)); }
    const { result } = await cdp.send('Profiler.takePreciseCoverage');
    for (const s of result) {
      if (!/^http:\/\/127\.0\.0\.1:8012\//.test(s.url)) continue;
      const u = s.url.replace(/^http:\/\/127\.0\.0\.1:8012\//, '').replace(/\?.*/, '');
      if (!jsSize[u]) { try { jsSize[u] = (await cdp.send('Debugger.getScriptSource', { scriptId: s.scriptId }).catch(() => null))?.scriptSource?.length || 0; } catch (_) {} }
      // used = ranges with count>0 at function granularity (block coverage: the innermost wins)
      for (const f of s.functions) for (const r of f.ranges) merge(jsUsed, u, [[r.startOffset, r.endOffset, r.count]]);
    }
    const delta = await cdp.send('CSS.takeCoverageDelta').catch(() => ({ coverage: [] }));
    const stop = await cdp.send('CSS.stopRuleUsageTracking');
    const ruleUsage = [...(delta.coverage || []), ...(stop.ruleUsage || [])];
    console.log(name, 'css usage records', ruleUsage.length, 'used', ruleUsage.filter((r) => r.used).length);
    for (const h of Object.values(sheets)) {
      const u = (h.sourceURL || '').replace(/^http:\/\/127\.0\.0\.1:8012\//, '').replace(/\?.*/, '');
      if (!u || /^(blob|data):/.test(u)) continue;
      cssSize[u] = Math.max(cssSize[u] || 0, h.length || 0);
    }
    for (const r of ruleUsage) {
      const h = sheets[r.styleSheetId]; if (!h || !r.used) continue;
      const u = (h.sourceURL || '').replace(/^http:\/\/127\.0\.0\.1:8012\//, '').replace(/\?.*/, '');
      if (!u) continue;
      (cssUsed[u] ||= []).push([r.startOffset, r.endOffset]);
    }
    await ctx.close();
    console.log('session done:', name);
  }
  const cal = (p) => p.frame({ url: /kalendars\/index\.html/ });
  const desktop = async (p) => {
    const f = cal(p);
    for (const d of ['25', '26', '27', '10', '24']) { await f.click(`#p-${d}-09-2026`).catch(() => {}); await p.waitForTimeout(900); }
    for (const c of (await f.locator('#grafiks-list .card').all()).slice(0, 6)) { await c.hover().catch(() => {}); await p.waitForTimeout(200); }
    for (const fn of ['openMonthCalFromDock()', 'openStatsFromDock()', 'toggleNsFromParent()', 'openSettingsFromDock()', 'openPlanotajsLauncher()', 'openPusdienasLauncher()', 'toggleBolus()']) { await p.evaluate(fn).catch(() => {}); await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.waitForTimeout(700); }
    await f.locator('#grafiks-list .card').first().click().catch(() => {}); await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    await f.click('#hxTop .hx-search').catch(() => {}); await p.keyboard.type('alpha'); await p.waitForTimeout(800); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
    await p.evaluate(() => window.toggleRadio()).catch(() => {}); await p.waitForTimeout(2500);
    await p.evaluate(() => { const ac = new AudioContext(); const an = ac.createAnalyser(); const o = ac.createOscillator(); o.connect(an); o.start(); window.__mkRadioAnalyser = () => an; const mx = document.getElementById('rmx'); if (mx) mx.classList.add('rmx-playing'); document.body.classList.toggle('x'); }).catch(() => {});
    await p.waitForTimeout(2000);
    await p.evaluate(() => { try { toggleMenu(true); } catch (_) {} }); await p.waitForTimeout(1500); await p.keyboard.press('Escape');
    for (const d of ['28', '23']) { await f.click(`#p-${d}-09-2026`).catch(() => {}); await p.waitForTimeout(900); }
  };
  await session('desktop', '/index.html?visible=1', { width: 1920, height: 1080 }, desktop);
  await session('rad', '/index.html?visible=1&app=rad', { width: 1920, height: 1080 }, async (p) => { const f = cal(p); for (const d of ['25', '26']) { await f.click(`#p-${d}-09-2026`).catch(() => {}); await p.waitForTimeout(900); } });
  await session('mobile', '/mobile.html', { width: 390, height: 844 }, async (p) => { await p.waitForTimeout(3000); });
  // JS: unused bytes = source length minus union of ranges that ran (count>0 innermost)
  const out = [];
  for (const u of Object.keys(jsUsed)) {
    const len = jsSize[u] || Math.max(...jsUsed[u].map((r) => r[1]));
    const arr = new Int8Array(len + 1); // 1 = ran, -1 = not run, applied outer→inner by range size
    jsUsed[u].sort((a, b) => (b[1] - b[0]) - (a[1] - a[0])).forEach(([s, e, c]) => { arr.fill(c > 0 ? 1 : -1, s, Math.min(e, len)); });
    let ran = 0; for (let i = 0; i < len; i++) if (arr[i] === 1) ran++;
    out.push({ u, kb: +(len / 1024).toFixed(1), unusedPct: +(100 - (100 * ran) / len).toFixed(0), unusedKB: +((len - ran) / 1024).toFixed(1) });
  }
  out.sort((a, b) => b.unusedKB - a.unusedKB);
  const cssOut = Object.keys(cssSize).filter((u) => cssSize[u] > 0).map((u) => {
    const len = cssSize[u], arr = new Uint8Array(len); (cssUsed[u] || []).forEach(([s0, e0]) => arr.fill(1, s0, Math.min(e0, len)));
    let used = 0; for (let i = 0; i < len; i++) used += arr[i];
    return { u, kb: +(len / 1024).toFixed(1), unusedPct: +(100 - (100 * used) / len).toFixed(0), unusedKB: +((len - used) / 1024).toFixed(1) };
  }).sort((x, y) => y.unusedKB - x.unusedKB);
  fs.writeFileSync(__dirname + '/res/coverage.json', JSON.stringify({ js: out, css: cssOut }, null, 1));
  const tot = (a) => [a.reduce((s, x) => s + x.kb, 0), a.reduce((s, x) => s + x.unusedKB, 0)];
  const [jt, ju] = tot(out), [ct, cu] = tot(cssOut);
  console.log(`JS: ${jt.toFixed(0)} KB loaded, ${ju.toFixed(0)} KB never ran in any session (${(100 * ju / jt).toFixed(0)}%)`);
  out.slice(0, 25).forEach((x) => console.log('  ', String(x.unusedKB).padStart(6), 'KB of', String(x.kb).padStart(6), `(${x.unusedPct}%)`, x.u));
  console.log(`CSS: ${ct.toFixed(0)} KB of rules, ${cu.toFixed(0)} KB never matched (${(100 * cu / ct).toFixed(0)}%)`);
  cssOut.slice(0, 25).forEach((x) => console.log('  ', String(x.unusedKB).padStart(6), 'KB of', String(x.kb).padStart(6), `(${x.unusedPct}%)`, x.u));
  await b.close();
})();
