// Pārvērš slēgtas formas atsperes soļa reakciju CSS `linear()` easing virknē.
// Palaist: node scripts/build-spring-easing.mjs  → iekopēt css/mk-sys.css un js/mk-motion.js.
// ζ < 1 dod mazu pārsvidienu; ilgums (CSS pusē) nosaka stingrību, forma paliek tā pati.
function spring(zeta, t) {            // t: bezdimensiju laiks ω·t
  if (zeta >= 1) return 1 - Math.exp(-t) * (1 + t);
  const wd = Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * t) * (Math.cos(wd * t) + (zeta / wd) * Math.sin(wd * t));
}
function settle(zeta) {                // laiks, kad |1-x| paliek < 0.1 %
  let last = 0;
  for (let t = 0; t < 40; t += 0.01) if (Math.abs(1 - spring(zeta, t)) > 0.001) last = t;
  return last;
}
function toLinear(zeta, tol = 0.003) {
  const T = settle(zeta), N = 400;
  const pts = Array.from({ length: N + 1 }, (_, i) => [i / N, spring(zeta, (i / N) * T)]);
  pts[N][1] = 1;
  // Douglas–Peucker: tikai tik punktu, cik vajag, lai kļūda < tol.
  const keep = new Set([0, N]);
  (function dp(a, b) {
    let worst = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const f = (pts[i][0] - pts[a][0]) / (pts[b][0] - pts[a][0]);
      const d = Math.abs(pts[i][1] - (pts[a][1] + f * (pts[b][1] - pts[a][1])));
      if (d > worst) { worst = d; idx = i; }
    }
    if (worst > tol) { keep.add(idx); dp(a, idx); dp(idx, b); }
  })(0, N);
  const out = [...keep].sort((a, b) => a - b).map(i => {
    const [x, y] = pts[i];
    const v = +y.toFixed(4), p = +(x * 100).toFixed(1);
    return i === 0 || i === N ? String(v) : `${v} ${p}%`;
  });
  const peak = Math.max(...pts.map(p => p[1]));
  return { css: `linear(${out.join(', ')})`, points: out.length, overshoot: ((peak - 1) * 100).toFixed(2) + '%' };
}
for (const [name, z] of [['spring', 0.82], ['spring-flat', 1]]) {
  const r = toLinear(z);
  console.log(`/* ${name}: ζ=${z}, pārsvidiens ${r.overshoot}, ${r.points} punkti */`);
  console.log(`--mk-ease-${name}: ${r.css};`);
}
