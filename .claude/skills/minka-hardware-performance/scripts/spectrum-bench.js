// Radio spectrum cost and look. Phase 1 (cost, real AnalyserNode fed by an oscillator, CPU x1): per-process CPU,
// renderer main-thread busy time and commits per second while the radio plays and nothing else happens.
// Phase 2 (look): a deterministic analyser stub, every desktop skin settled, the spectrum canvas screenshotted
// to res/spectrum-<label>-<skin>.png for a pixel compare between variants. LABEL names the variant.
const { chromium } = require('playwright');
const fs = require('fs');
const applyVariant = require('./variant.js');
const TAG = 'mkspec' + process.pid, LABEL = process.env.LABEL || 'run';
const cpuOf = (pid) => { try { const f = fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' '); return (+f[11] + +f[12]) * 10; } catch (_) { return 0; } };
function tree() {
  const all = {}; for (const d of fs.readdirSync('/proc')) if (/^\d+$/.test(d)) { try { all[d] = { cmd: fs.readFileSync(`/proc/${d}/cmdline`, 'utf8'), ppid: fs.readFileSync(`/proc/${d}/stat`, 'utf8').split(') ')[1].split(' ')[1] }; } catch (_) {} }
  const root = Object.keys(all).find((p) => all[p].cmd.includes(TAG) && !all[p].cmd.includes('--type=')); const t = new Set([root]); let g = true;
  while (g) { g = false; for (const p in all) if (!t.has(p) && t.has(all[p].ppid)) { t.add(p); g = true; } }
  return [...t].map((p) => ({ p, type: (/--type=([a-z-]+)/.exec(all[p].cmd) || [0, 'browser'])[1] }));
}
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--' + TAG] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Europe/Riga' });
  console.log('variant:', await applyVariant(ctx), LABEL);
  const p = await ctx.newPage();
  await applyVariant.setClock(p);
  await p.goto('http://127.0.0.1:8012/index.html?visible=1', { waitUntil: 'load' });
  await p.waitForTimeout(12000);
  await p.evaluate(() => window.toggleRadio()); await p.waitForTimeout(3000);
  const skins = ['classic', 'pixel', 'pioneer', 'amp', 'dither'];
  if (!process.env.LOOK_ONLY) {
    await p.evaluate((process_SKIN) => { const ac = new AudioContext(); const an = ac.createAnalyser(); an.fftSize = 1024; const o = ac.createOscillator(); o.type = 'sawtooth'; const l = ac.createOscillator(); l.frequency.value = 2; const lg = ac.createGain(); lg.gain.value = 300; l.connect(lg); lg.connect(o.frequency); l.start(); const g = ac.createGain(); g.gain.value = 0.001; o.connect(an); an.connect(g); g.connect(ac.destination); o.start(); window.__mkRadioAnalyser = () => an; document.getElementById('radioWindow').dataset.radioSkin = process_SKIN; document.getElementById('rmx').classList.add('rmx-playing'); document.body.classList.add('radio-playing'); document.body.classList.remove('radio-idle'); }, process.env.SKIN || 'pioneer');
    await p.waitForTimeout(3000);
    console.log('loop check:', JSON.stringify(await p.evaluate(() => { const mx = document.getElementById('rmx'); return { mxW: mx.offsetWidth, inactive: radioVisualsInactive(), skin: document.getElementById('radioWindow').dataset.radioSkin }; })));
    const cdp = await ctx.newCDPSession(p);
    const procs = tree(); const c0 = procs.map((x) => cpuOf(x.p));
    const ev = []; cdp.on('Tracing.dataCollected', (e) => ev.push(...e.value)); const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'benchmark'] } });
    const S = 10; await p.waitForTimeout(S * 1000);
    await cdp.send('Tracing.end'); await done;
    const by = {}; procs.forEach((x, i) => { by[x.type] = (by[x.type] || 0) + (cpuOf(x.p) - c0[i]) / S; });
    const X = ev.filter((e) => e.ph === 'X');
    const names = {}; ev.filter((e) => e.name === 'thread_name').forEach((e) => { names[e.pid + ':' + e.tid] = e.args.name; });
    const mainKey = Object.keys(names).find((k) => names[k] === 'CrRendererMain');
    const [mpid, mtid] = mainKey.split(':').map(Number);
    const M = X.filter((e) => e.pid === mpid && e.tid === mtid);
    const busy = M.filter((e) => e.name === 'RunTask').reduce((s, e) => s + e.dur, 0) / 1000 / S;
    const commits = M.filter((e) => e.name === 'Commit').length / S, commitMs = M.filter((e) => e.name === 'Commit').reduce((s, e) => s + e.dur, 0) / 1000 / S;
    const wkThreads = Object.keys(names).filter((k) => /Worker/i.test(names[k]));
    const wkBusy = X.filter((e) => wkThreads.includes(e.pid + ':' + e.tid) && e.name === 'RunTask').reduce((s, e) => s + e.dur, 0) / 1000 / S;
    console.log('radio playing, CPU ms/s by process:', JSON.stringify(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, Math.round(v)]))));
    console.log(`renderer main thread: busy ${busy.toFixed(1)} ms/s, commits ${commits.toFixed(1)}/s (${commitMs.toFixed(1)} ms/s); worker threads busy ${wkBusy.toFixed(1)} ms/s`);
  }
  // look: a fixed spectrum, every skin
  await p.evaluate(() => {
    const bins = 512; const fake = { frequencyBinCount: bins, fftSize: bins * 2, context: { sampleRate: 48000 }, getByteFrequencyData(a) { for (let i = 0; i < a.length; i++) a[i] = Math.max(0, Math.min(255, Math.round(200 - 60 * Math.log2(1 + i / 6) + 40 * Math.sin(i / 7)))); } };
    window.__mkRadioAnalyser = () => fake; document.getElementById('rmx').classList.add('rmx-playing'); document.body.classList.add('radio-playing'); document.body.classList.remove('radio-idle');
  });
  for (const s of skins) {
    await p.evaluate((s) => { document.getElementById('radioWindow').dataset.radioSkin = s; }, s);
    await p.waitForTimeout(4000);
    const el = await p.$('#rmx .rmx-viz'); if (el) await el.screenshot({ path: `${__dirname}/res/spectrum-${LABEL}-${s}.png` });
  }
  await b.close();
})();
