// Where JavaScript time goes, per scenario, by function self time (V8 sampling profiler), next to the
// scenario's whole main-thread time. Answers: is there a pure-compute hotspot worth WASM / a worker, or is
// the JS time DOM/style work (forced reflows show up as the calling function's self time)?
// SCEN=switch,hover,radio,modals (default all). CPU x4 (RATE).
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
const RATE = +(process.env.RATE || 4);
const SCEN = (process.env.SCEN || 'switch,hover,radio,modals').split(',');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx));
  const p = await ctx.newPage();
  await applyVariant.setClock(p);
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(12000);
  const cal = p.frame({ url: /kalendars\/index\.html/ });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Performance.enable');
  const short = (u) => (u || '').replace(/.*8012\//, '').replace(/\?.*/, '');
  async function run(name, fn) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
    await cdp.send('Profiler.start');
    const t0 = Date.now(); await fn(); const secs = (Date.now() - t0) / 1000;
    const { profile } = await cdp.send('Profiler.stop');
    const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    const self = {}; const dt = profile.timeDeltas; let total = 0;
    profile.samples.forEach((id, i) => {
      const n = byId.get(id); const f = n.callFrame; const ms = (dt[i] || 0) / 1000; total += ms;
      const k = f.url ? short(f.url) + ':' + (f.lineNumber + 1) + ' ' + (f.functionName || '(anon)') : f.functionName || '(native)';
      self[k] = (self[k] || 0) + ms;
    });
    const d = (k) => +((m1[k] - m0[k]) * 1000).toFixed(0);
    const idle = self['(idle)'] || 0, prog = self['(program)'] || 0, gc = self['(garbage collector)'] || 0;
    console.log(`\n===== ${name} (${secs.toFixed(1)} s, x${RATE}) script ${d('ScriptDuration')} ms, style ${d('RecalcStyleDuration')} ms, layout ${d('LayoutDuration')} ms, task ${d('TaskDuration')} ms; profile: JS functions ${(total - idle - prog - gc).toFixed(0)} ms, GC ${gc.toFixed(0)} ms`);
    Object.entries(self).filter(([k]) => !/^\((idle|program|garbage collector|root)\)$/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 14)
      .forEach(([k, v]) => console.log('  ', v.toFixed(1).padStart(8), 'ms', k.slice(0, 110)));
  }
  const days = ['25', '26', '27', '28', '10', '11', '23', '24'];
  if (SCEN.includes('switch')) await run('day switch x8', async () => { for (const dd of days) { await cal.click(`#p-${dd}-09-2026`).catch(() => {}); await p.waitForTimeout(900); } });
  if (SCEN.includes('hover')) await run('hover, pointer moving, 5 cards', async () => {
    const boxes = []; for (const c of (await cal.locator('#grafiks-list .card').all()).slice(0, 5)) { const bb = await c.boundingBox().catch(() => null); if (bb) boxes.push(bb); }
    for (const bb of boxes) { await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 6 }); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 4; await p.mouse.move(bb.x + bb.width / 2 + Math.cos(a) * bb.width * .25, bb.y + bb.height / 2 + Math.sin(a) * bb.height * .2); await p.waitForTimeout(33); } }
    await p.mouse.move(960, 1075);
  });
  if (SCEN.includes('modals')) await run('dock windows open/close', async () => {
    for (const fn of ['openMonthCalFromDock()', 'openStatsFromDock()', 'openSettingsFromDock()', 'toggleNsFromParent()']) { await p.evaluate(fn).catch(() => {}); await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.waitForTimeout(700); }
  });
  if (SCEN.includes('radio')) {
    await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(2500);
    await p.evaluate(() => { const ac = new AudioContext(); const an = ac.createAnalyser(); const o = ac.createOscillator(); const g = ac.createGain(); g.gain.value = 0.001; o.connect(an); an.connect(g); g.connect(ac.destination); o.start(); window.__mkRadioAnalyser = () => an; document.getElementById('rmx').classList.add('rmx-playing'); document.body.classList.add('radio-playing'); });
    await p.waitForTimeout(1500);
    await run('radio playing, 6 s', async () => { await p.waitForTimeout(6000); });
    await run('radio playing + day switch x4', async () => { for (const dd of days.slice(0, 4)) { await cal.click(`#p-${dd}-09-2026`).catch(() => {}); await p.waitForTimeout(900); } });
  }
  await b.close();
})();
