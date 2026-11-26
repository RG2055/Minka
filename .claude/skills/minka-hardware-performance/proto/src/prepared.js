// RG 2.0 engine B: no framework; the days next to the one shown are built ahead, while the app is idle
// (parsed into nodes, their pictures decoded), so a switch only swaps nodes in: no parsing, no waiting for
// pictures, no hold. A day picked before it was prepared is built on the spot inside an element-scoped View
// Transition on the calendar (the old day stays on screen until the new one is complete), not the whole document.
import { loadDays, setAttrs, applyRootAttrs, bindPills, startRadio, exposeApi } from './shared.js';
(async () => {
  const D = await loadDays();
  const order = Object.keys(D.days);
  const els = Object.fromEntries(D.regions.map((id) => [id, document.getElementById(id)]));
  const ready = new Map(); // date → { id: DocumentFragment }
  const tpl = document.createElement('template');
  function build(date) {
    if (ready.has(date)) return ready.get(date);
    const day = D.days[date], out = {};
    for (const id of D.regions) { const r = day.regions[id]; if (!r) continue; tpl.innerHTML = r.html; out[id] = tpl.content.cloneNode(true); }
    // decode its pictures now, off the click
    for (const f of Object.values(out)) for (const img of f.querySelectorAll('img[src]')) { const i = new Image(); i.src = img.getAttribute('src'); if (i.decode) i.decode().catch(() => {}); }
    ready.set(date, out);
    return out;
  }
  let current = null;
  function prepareAround(date) {
    const i = order.indexOf(date);
    const near = [order[i + 1], order[i - 1]].filter(Boolean).filter((d) => !ready.has(d));
    const step = () => { const d = near.shift(); if (!d) return; build(d); if (near.length) idle(step); };
    idle(step);
  }
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));
  function put(date) {
    const day = D.days[date], parts = build(date);
    ready.delete(date);                 // its nodes go into the page; built again if it is left and revisited
    applyRootAttrs(day);
    for (const id of D.regions) { const r = day.regions[id], el = els[id]; if (!el || !r) continue; setAttrs(el, r.attrs); el.replaceChildren(parts[id]); }
    current = date; prepareAround(date);
  }
  const app = document.getElementById('grafiks-app');
  function switchTo(date) {
    if (!D.days[date] || date === current) return;
    if (ready.has(date) || !app.startViewTransition) { put(date); return; }
    app.startViewTransition(() => put(date));
  }
  bindPills(switchTo); startRadio();
  current = order.find((d) => document.getElementById('p-' + d) && document.getElementById('p-' + d).className.includes('active')) || '24-09-2026';
  prepareAround(current);
  exposeApi(switchTo, D, { prepared: () => [...ready.keys()] });
  document.documentElement.setAttribute('data-rg2', 'prepared');
})();
