// RG 2.0 engine D: no framework, no dependency. A day switch morphs each region into the new day with a small
// in-place diff: same node kind and tag (and same data-worker / id when present) → the node stays, only changed
// attributes and text are written; anything else is replaced. Unchanged nodes keep their style and layout.
// The days next to the shown one are parsed ahead while idle, with their pictures decoded.
import { loadDays, setAttrs, applyRootAttrs, bindPills, startRadio, exposeApi } from './shared.js';
const keyOf = (n) => (n.nodeType === 1 ? (n.getAttribute('data-worker') || n.id || '') : '');
function same(a, b) { return a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && keyOf(a) === keyOf(b))); }
function syncAttrs(a, b) {
  const want = b.attributes;
  for (let i = a.attributes.length - 1; i >= 0; i--) { const n = a.attributes[i].name; if (!b.hasAttribute(n)) a.removeAttribute(n); }
  for (let i = 0; i < want.length; i++) { const { name, value } = want[i]; if (a.getAttribute(name) !== value) a.setAttribute(name, value); }
}
export function morphChildren(from, to) {
  const next = [...to.childNodes];
  let cur = from.firstChild;
  for (const n of next) {
    if (cur && same(cur, n)) {
      if (n.nodeType === 1) { syncAttrs(cur, n); morphChildren(cur, n); }
      else if (cur.nodeValue !== n.nodeValue) cur.nodeValue = n.nodeValue;
      cur = cur.nextSibling;
    } else {
      // n moves in from the parsed day; the node it displaces goes
      if (cur) { const old = cur; cur = cur.nextSibling; from.replaceChild(n, old); } else from.appendChild(n);
    }
  }
  while (cur) { const old = cur; cur = cur.nextSibling; old.remove(); }
}
(async () => {
  const D = await loadDays();
  const order = Object.keys(D.days);
  const els = Object.fromEntries(D.regions.map((id) => [id, document.getElementById(id)]));
  const parsed = new Map();
  function parse(date) {
    if (parsed.has(date)) { const p = parsed.get(date); parsed.delete(date); return p; }   // used once: its nodes move into the page
    const day = D.days[date], out = {};
    for (const id of D.regions) { const r = day.regions[id]; if (!r) continue; const t = document.createElement('template'); t.innerHTML = r.html; out[id] = t.content; }
    return out;
  }
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));
  function prepareAround(date) {
    const i = order.indexOf(date), near = new Set([order[i + 1], order[i - 1]].filter(Boolean));
    for (const d of [...parsed.keys()]) if (!near.has(d)) parsed.delete(d);       // only the neighbours are kept
    near.forEach((d) => idle(() => { if (parsed.has(d)) return; const p = parse(d); parsed.set(d, p); for (const f of Object.values(p)) for (const img of f.querySelectorAll('img[src]')) { const i2 = new Image(); i2.src = img.getAttribute('src'); if (i2.decode) i2.decode().catch(() => {}); } }));
  }
  let current = '24-09-2026';
  function switchTo(date) {
    if (!D.days[date] || date === current) return;
    const day = D.days[date], parts = parse(date);
    applyRootAttrs(day);
    for (const id of D.regions) { const r = day.regions[id], el = els[id]; if (!el || !r) continue; setAttrs(el, r.attrs); morphChildren(el, parts[id]); }
    current = date; prepareAround(date);
  }
  bindPills(switchTo); startRadio(); prepareAround(current); exposeApi(switchTo, D);
  document.documentElement.setAttribute('data-rg2', 'rgmorph');
})();
