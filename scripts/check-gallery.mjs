// Galerijas pārbaude headless Chrome pārlūkā, pirms commit:
//   node scripts/check-gallery.mjs
// Palaiž lokālo serveri, atver kalendars/test/gallery-harness.html (galerija ar
// izdomātiem zīmējumiem, bez pieteikšanās), iziet stacijas (pose), izdara
// darbības (act), mēra kadru (bench) un ziņo par kļūdām. Bez bibliotēkām: Chrome
// DevTools Protocol pa Node iebūvēto WebSocket; Chrome no Playwright keša.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 8093, DEBUG = 9233;
const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const shell = existsSync(cache) && readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop();
const chrome = process.env.CHROME || (shell && path.join(cache, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'));
if (!chrome || !existsSync(chrome)) { console.error('Nav Chrome: CHROME=/ceļš/uz/chrome node scripts/check-gallery.mjs'); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn(process.execPath, ['scripts/local-daybook-server.mjs', String(PORT)], { stdio: 'ignore' });
const browser = spawn(chrome, ['--headless', '--remote-debugging-port=' + DEBUG, '--window-size=1600,900', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const stop = () => { browser.kill(); server.kill(); };
process.on('exit', stop);

let ws = null, seq = 0;
const waiting = new Map(), errors = [];
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => waiting.set(id, { resolve, reject }));
}
async function run(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

const checks = [];
const check = (name, ok, info) => { checks.push({ name, ok: !!ok, info }); };

try {
  let target = null;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(150);
    try { target = (await (await fetch(`http://127.0.0.1:${DEBUG}/json/list`)).json()).find((t) => t.type === 'page'); } catch (_e) {}
  }
  if (!target) throw new Error('Chrome neatvērās');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && waiting.has(msg.id)) { const w = waiting.get(msg.id); waiting.delete(msg.id); msg.error ? w.reject(new Error(msg.error.message)) : w.resolve(msg.result); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: `http://localhost:${PORT}/kalendars/test/gallery-harness.html` });
  for (let i = 0; i < 40; i++) { await sleep(150); if (await run('!!(window.MinkaGallery3D && window.__harness)').catch(() => false)) break; }
  await run('window.__harness.open()');
  // the opening (~5 s): the game waits under it
  for (let i = 0; i < 80; i++) { await sleep(150); if (await run(`(() => { const l = document.querySelector('.mx-doom-intro'); return !l || l.hidden; })()`)) break; }
  check('ievads beidzas', await run(`(() => { const l = document.querySelector('.mx-doom-intro'); return !l || l.hidden; })()`));

  check('atveras', await run('MinkaGallery3D.isOpen()'));
  const size = await run(`(() => { const v = document.querySelector('.mx-doom-view'); return { w: v.width, h: v.height, k: parseFloat(v.style.width) * devicePixelRatio / v.width }; })()`);
  check('vesels mērogs', size.w > 0 && Math.abs(size.k - Math.round(size.k)) < 1e-6 && size.k >= 1, size);

  // stations: what the crosshair rests on there (x, y, angle, what it should say)
  const stations = [
    ['Löfbergs', 1.9, 2.55, Math.PI, 'machine'],
    ['galds', 3.1, 3.6, -Math.PI / 2, 'table'],
    ['gramofons', 2.0, 1.95, -2.4, 'gramophone'],
    ['molberts', 2.4, 5.3, Math.PI, 'easel'],
    ['Mona Liza', 3.5, 1.6, -Math.PI / 2, 'art'],
    ['Nakts plāns', 5.0, 5.5, 0, 'plan'],
    ['Venēra', 3.0, 11.2, -Math.PI / 2, 'statue']
  ];
  for (const [name, x, y, a, want] of stations) {
    const r = await run(`MinkaGallery3D.pose(${x}, ${y}, ${a})`);
    check('stacija: ' + name, r && r.aim === want, r);
  }
  // actions
  await run(`MinkaGallery3D.pose(1.9, 2.55, Math.PI)`);
  await run(`MinkaGallery3D.act()`);                          // the coffee menu
  check('kafijas izvēlne', await run(`!document.querySelector('.mx-doom-menu').hidden`));
  await run(`MinkaGallery3D.act(0)`);                         // brew the first
  await sleep(2100);
  const cup = await run(`MinkaGallery3D.act('status')`);
  check('kafija rokā', cup && cup.cup, cup);
  await run(`MinkaGallery3D.act('sip')`);
  await sleep(1300);
  const after = await run(`MinkaGallery3D.act('status')`);
  check('malks', after && after.left === cup.left - 1, after);
  // Tab: the map; Esc never closes the gallery
  await run(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true }))`);
  await run(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))`);
  check('Esc neaizver galeriju', await run('MinkaGallery3D.isOpen()'));
  // all drawings: the author's emoji is text, not HTML
  await run(`document.querySelector('.mx-doom-all-btn').click()`);
  await sleep(200);
  check('emoji kā teksts (XSS)', !(await run('window.__xss === 1')) && (await run(`!document.querySelector('.mx-doom-all-grid img[src="x"]')`)));
  await run(`document.querySelector('.mx-doom-all-close').click()`);
  // speed
  const bench = await run('MinkaGallery3D.bench(60)');
  check('kadrs < 16 ms', bench && bench.ms < 16, bench);
  check('bez kļūdām', errors.length === 0, errors.slice(0, 5));
} catch (e) {
  check('palaišana', false, String(e && e.message || e));
}

let bad = 0;
for (const c of checks) {
  if (!c.ok) bad++;
  console.log((c.ok ? '✔ ' : '✖ ') + c.name + (c.ok ? '' : '  ' + JSON.stringify(c.info)));
}
console.log(bad ? `\n${bad} no ${checks.length} neizdevās` : `\nVisas ${checks.length} pārbaudes izdevās`);
stop();
process.exit(bad ? 1 : 0);
