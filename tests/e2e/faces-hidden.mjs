// A hidden element is really hidden on every card face (no CSS display rule wins over
// [hidden]). Needs the audit server (port 8012). Run: node tests/e2e/faces-hidden.mjs
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.goto('http://localhost:8012/index.html?visible=1');
await p.waitForTimeout(9000);
const fr = p.frames().find(x => x.url().includes('kalendars/index.html'));
const r = await fr.evaluate(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const M = window.MinkaCardFaceModel, name = document.querySelectorAll('#grafiks-list .card[data-worker]')[0].getAttribute('data-worker');
  const out = [];
  for (const face of M.faces) {
    const f = M.preset(face); M.parts.forEach(k => { if (k !== 'hours') f.parts[k][3] = 0; });
    window.mkPatchWorkerSkin(name, { t: 'img', id: 'photo-wave', face: f }); await sleep(700);
    const c = [...document.querySelectorAll('#grafiks-list .card[data-worker]')].find(e => e.getAttribute('data-worker') === name);
    const shown = M.parts.filter(k => k !== 'hours').filter(k => { const e = c.querySelector('[data-wf-part="' + k + '"]'); if (!e) return false; const r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.width > 1 && r.height > 1; });
    out.push(face + ': ' + (shown.length ? 'STILL SHOWN ' + shown.join(',') : 'ok'));
  }
  return out;
});
console.log(r.join('\n'));
await b.close();
