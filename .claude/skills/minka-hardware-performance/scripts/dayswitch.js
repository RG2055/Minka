// Day-switch cost: radio closed / open / open + spectrum running. CPU throttled to mimic an old i5.
const { chromium } = require('playwright');
const applyVariant = require('./variant.js');
const BASE = 'http://127.0.0.1:8012', RATE = +(process.argv[2] || 4), N = +(process.argv[3] || 12);
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx));
  const p = await ctx.newPage();
  await require('./variant.js').setClock(p);
  if (process.argv[4] === 'novt') await p.addInitScript(() => { if (/kalendars/.test(location.pathname)) Document.prototype.startViewTransition = undefined; });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
  await p.goto(BASE + '/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(9000);
  const cal = () => p.frame({ url: /kalendars\/index\.html/ });
  if (!cal()) { console.log('no calendar frame', errs); await b.close(); return; }
  await cal().evaluate(() => { window.__minkaMeasureDaySwitches = true; });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const days = process.env.COLD ? null : ['25', '26', '27', '28', '29', '23', '22', '21'];
  const coldDays = [['10','11','12','13','14','15','16','17','18','19','20','09'],['08','07','06','05','04','03','02','01','30','12','14','16'],['11','13','15','17','19','21','09','07','05','03','01','29']];
  let coldRun = 0;

  async function run(label) {
    await p.waitForTimeout(1500);
    const m0 = await metrics(); const t0 = Date.now();
    const lat = [];
    for (let i = 0; i < N; i++) {
      const d = days ? days[i % days.length] : coldDays[coldRun][i % 12];
      // click → the new day painted and the view transition (hold) finished
      const ms = await cal().evaluate((id) => new Promise((res) => {
        const t = performance.now();
        document.getElementById(id).click();
        const done = () => requestAnimationFrame(() => requestAnimationFrame(() => res(performance.now() - t)));
        const wait = () => { if (document.documentElement.classList.contains('mk-day-vt')) setTimeout(wait, 5); else done(); };
        setTimeout(wait, 0);
      }), `p-${d}-09-2026`);
      lat.push(ms);
      await p.waitForTimeout(700);
    }
    coldRun++;
    const m1 = await metrics(); const wall = (Date.now() - t0) / 1000;
    const per = (k) => +(((m1[k] - m0[k]) * 1000) / N).toFixed(1);
    const sw = await cal().evaluate(() => (window.__minkaDaySwitchMetrics || []).slice(-6));
    const avg = (k) => +(sw.reduce((s, x) => s + (x[k] || 0), 0) / sw.length).toFixed(1);
    lat.sort((a, b) => a - b);
    console.log(JSON.stringify({ label, clickToSettledMs_median: +lat[lat.length >> 1].toFixed(0), p90: +lat[Math.floor(lat.length * .9)].toFixed(0),
      perSwitch_scriptMs: per('ScriptDuration'), styleMs: per('RecalcStyleDuration'), layoutMs: per('LayoutDuration'), taskMs: per('TaskDuration'),
      cpuBusyPct: +(((m1.TaskDuration - m0.TaskDuration) / wall) * 100).toFixed(0),
      js_listMs: avg('listMs'), js_panelsMs: avg('panelsMs'), js_fontMs: avg('fontMs'), syncMs: avg('syncMs') }));
  }
  async function idle(label) {
    const m0 = await metrics(); await p.waitForTimeout(5000); const m1 = await metrics();
    console.log(JSON.stringify({ label, idleCpuPct: +(((m1.TaskDuration - m0.TaskDuration) / 5) * 100).toFixed(1) }));
  }

  await idle('idle radio closed'); await run('radio closed');
  await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(2500);
  console.log('radio state', await p.evaluate(() => ({ body: document.body.className.slice(0, 120), skin: document.getElementById('radioWindow').dataset.radioSkin, rmx: !!document.getElementById('rmx')?.offsetWidth })));
  await idle('idle radio open'); await run('radio open (paused)');
  // Spectrum running: feed the skeleton a real analyser on an oscillator and mark it playing.
  const ok = await p.evaluate(() => {
    try {
      const ac = new AudioContext(); const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(); const an = ac.createAnalyser();
      o.frequency.value = 110; o2.type = 'sawtooth'; o2.frequency.value = 880; g.gain.value = .3; o.connect(an); o2.connect(an); an.connect(g); o.start(); o2.start();
      window.__mkRadioAnalyser = () => an; document.getElementById('rmx').classList.add('rmx-playing');
      document.body.classList.toggle('mk-probe'); return ac.state;
    } catch (e) { return 'err ' + e.message; }
  });
  console.log('spectrum feed', ok);
  await idle('idle radio open + spectrum'); await run('radio open + spectrum');
  if (errs.length) console.log('page errors:', [...new Set(errs)].slice(0, 8));
  await b.close();
})();
