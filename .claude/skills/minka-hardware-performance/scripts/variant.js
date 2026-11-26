// Shared by every measurement script in this folder.
//
// applyVariant(ctx)  call once per browser context, before the first page:
//   - TARGET emulation (default on): navigator.hardwareConcurrency = 12 and deviceMemory = 8, the values the
//     hospital PC (HP ProDesk 400 G6 Mini, i5-10500T, 8 GB) reports. The app picks code paths from them
//     (index.html __mkPerfProfile, theme.js tier, radio-dither-layout lowSpec, emoji-particles quality), so a
//     4-core cloud box otherwise measures different code. TARGET=cloud turns it off.
//   - BASE=1: every file changed in the working tree is served from git HEAD instead, so one server compares
//     before (BASE=1) and after (no BASE).
//   - INIT_CSS="...": a style element added to every document (restore an old rule without serving a page).
//   - ROUTES="js/radio-max.js=/abs/file;js/__w.js=/abs/file2": serve extra experimental files on top.
// setClock(page)  NIGHT=1 → 02:30 Riga with time flowing (star sky: the dearest idle state), else a fixed 10:30.
//   NOCLOCK=1 leaves the real clock: Playwright's fixed clock adds ~60 timer callbacks a second per frame of
//   its own, so idle/power numbers (idle-loops.js, idle-frames.js) should be taken with NOCLOCK=1.
// Results go to ./res (git-ignored). The app must be served by `node scripts/local-audit-server.mjs` (port 8012).
const { execSync } = require('child_process');
const fs = require('fs');
const REPO = execSync('git rev-parse --show-toplevel', { cwd: __dirname }).toString().trim();
fs.mkdirSync(__dirname + '/res', { recursive: true });
const TARGET_INIT = `try {
  Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 12, configurable: true });
  Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 8, configurable: true });
} catch (_) {}`;
async function applyVariant(ctx) {
  const notes = [];
  if (process.env.TARGET !== 'cloud') { await ctx.addInitScript(TARGET_INIT); notes.push('target(12 threads, 8 GB)'); }
  // INIT_CSS="css text": a style element added to every document of the page (e.g. to restore an old rule)
  if (process.env.INIT_CSS) { await ctx.addInitScript((css) => { const add = () => { const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st); }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add(); }, process.env.INIT_CSS); notes.push('+INIT_CSS'); }
  const extra = (process.env.ROUTES || '').split(';').filter(Boolean);
  for (const pair of extra) {
    const [url, file] = pair.split('=');
    const type = url.endsWith('.css') ? 'text/css' : url.endsWith('.html') ? 'text/html' : 'text/javascript';
    await ctx.route(new RegExp('^https?://[^/]+/' + url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\?|$)'), (r) => r.fulfill({ status: 200, contentType: type, body: fs.readFileSync(file) }));
  }
  if (extra.length) notes.push('+' + extra.map((p) => p.split('=')[0]).join('+'));
  if (!process.env.BASE) return ['after'].concat(notes).join(' ');
  const files = execSync('git diff --name-only HEAD', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  for (const f of files) {
    let body; try { body = execSync('git show HEAD:' + f, { cwd: REPO, maxBuffer: 64 << 20 }); } catch (_) { continue; }
    const type = f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream';
    const re = new RegExp('^https?://[^/]+/' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\?|$)');
    await ctx.route(re, (r) => r.fulfill({ status: 200, contentType: type, body }));
  }
  return ['base(' + files.length + ' files from HEAD)'].concat(notes).join(' ');
}
applyVariant.setClock = async (page) => {
  if (process.env.NIGHT) {
    // 02:30 Riga with time flowing: the star sky is on from 00:00 to 08:00 local (stars-overlay.js isAutoNight),
    // full strength until 04:30. A fixed clock would freeze the star drift and under-measure night idle.
    // Playwright's fake timers still add their own callbacks: compare NIGHT runs only with NIGHT runs.
    await page.clock.install({ time: new Date('2026-09-24T02:30:00+03:00') });
    await page.clock.resume();
    return;
  }
  if (process.env.NOCLOCK) return;
  await page.clock.setFixedTime(new Date('2026-09-24T10:30:00+03:00'));
};
applyVariant.REPO = REPO;
module.exports = applyVariant;
