// Every element on every card face can be dragged (and the move is saved). Needs the
// audit server (preview "minka-audit", port 8012). Run: node tests/e2e/faces-drag.mjs
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
await p.goto('http://localhost:8012/index.html?visible=1');
await p.waitForTimeout(9000);
const fr = p.frames().find(x => x.url().includes('kalendars/index.html'));
await fr.evaluate(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  document.querySelectorAll('#grafiks-list .card[data-worker]')[0].click(); await sleep(1500);
  document.getElementById('toggle-skin').click(); await sleep(1500);
  document.querySelector('[data-org-tab="layout"]').click(); await sleep(1200);
});
const faces = await fr.evaluate(() => window.MinkaCardFaceModel.faces);
const parts = ['hours','name','month','coffee','fatigue','remaining','emoji','moon','initials','clock'];
const report = [];
for (const face of faces) {
  const ok = await fr.evaluate(async (face) => { const b = document.querySelector('.wf-face-choice[data-face="' + face + '"]'); if (!b) return false; b.click(); await new Promise(r => setTimeout(r, 1500)); return true; }, face);
  if (!ok) { report.push(face + ': no tile'); continue; }
  const fails = [];
  for (const part of parts) {
    const el = await fr.$('.mk-skin-preview-list .card [data-wf-part="' + part + '"]:not([hidden])');
    if (!el) continue;
    const bb = await el.boundingBox(); if (!bb || bb.width < 2) continue;
    const before = await fr.evaluate((part) => { const sk = window.mkGetWorkerSkin(document.querySelector('#grafiks-list .card[data-worker]').getAttribute('data-worker')); return JSON.stringify(sk && sk.face && sk.face.parts[part]); }, part);
    // grab a point of the element that is really on top
    const pt = await fr.evaluate((part) => { const c = document.querySelector('.mk-skin-preview-list .card'); const e = c.querySelector('[data-wf-part="' + part + '"]'); const r = e.getBoundingClientRect();
      for (const [fx, fy] of [[.5,.5],[.3,.5],[.7,.5],[.5,.3],[.5,.7],[.2,.2],[.8,.8]]) { const x = r.x + r.width * fx, y = r.y + r.height * fy; const t = document.elementFromPoint(x, y); if (t && (t === e || e.contains(t))) return [x, y, 'own']; }
      const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return [r.x + r.width / 2, r.y + r.height / 2, (t && (t.className + '').slice(0, 40)) || '-']; }, part);
    const ib = await p.$('iframe#calIframe'); const ibb = await ib.boundingBox();
    const x = ibb.x + pt[0], y = ibb.y + pt[1];
    const dx = x > ibb.x + 700 ? -40 : 40, dy = y > ibb.y + 400 ? -30 : 30;
    await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x + dx, y + dy, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(900);
    const after = await fr.evaluate((part) => { const sk = window.mkGetWorkerSkin(document.querySelector('#grafiks-list .card[data-worker]').getAttribute('data-worker')); return JSON.stringify(sk && sk.face && sk.face.parts[part]); }, part);
    if (before === after) fails.push(part + (pt[2] !== 'own' ? '(covered by ' + pt[2] + ')' : ''));
  }
  report.push(face + ': ' + (fails.length ? 'NOT MOVED ' + fails.join(', ') : 'ok'));
}
console.log(report.join('\n'));
await b.close();
