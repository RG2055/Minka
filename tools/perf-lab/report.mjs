// Builds report.html next to results.json (a run folder of lab.mjs). Local file only; never published.
import fs from 'node:fs'; import path from 'node:path';
const RUN = process.argv[2]; const R = JSON.parse(fs.readFileSync(path.join(RUN, 'results.json'), 'utf8'));
const names = Object.keys(R.variants); const [A, B] = names;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const get = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
const scen = (v, cpu, name) => (R.variants[v]?.runs?.['x' + cpu] || []).find(x => x.name === name);
// rows: label, scenario, path, unit, lower is better
const ROWS = [
  ['Dienas pārslēgšana p50', 'dayswitch', 'switch.p50', 'ms'], ['Dienas pārslēgšana p95', 'dayswitch', 'switch.p95', 'ms'], ['Dienas pārslēgšana p99', 'dayswitch', 'switch.p99', 'ms'],
  ['Kadri pārslēdzot p95', 'dayswitch', 'frames.p95', 'ms'], ['Kadri pārslēdzot p99', 'dayswitch', 'frames.p99', 'ms'], ['Nomesti kadri pārslēdzot', 'dayswitch', 'frames.dropped', ''],
  ['Gari kadri >100 ms pārslēdzot', 'dayswitch', 'loaf.over100', ''], ['Izkārtojumi pārslēdzot', 'dayswitch', 'layouts', ''], ['Stila pārrēķins pārslēdzot', 'dayswitch', 'styleMs', 'ms'],
  ['Nakts atvēršana p95', 'windows', 'open.night.p95', 'ms'], ['Mēneša kalendārs p95', 'windows', 'open.month.p95', 'ms'], ['Statistika p95', 'windows', 'open.stats.p95', 'ms'], ['Darbinieka logs p95', 'windows', 'open.worker.p95', 'ms'],
  ['Logi: kadri p99', 'windows', 'frames.p99', 'ms'], ['Reakcija (INP) p95', 'windows', 'inp.p95', 'ms'],
  ['Hover kadri p95', 'hover', 'frames.p95', 'ms'], ['Hover kadri p99', 'hover', 'frames.p99', 'ms'], ['Hover nomesti kadri', 'hover', 'frames.dropped', ''], ['Hover izkārtojumi', 'hover', 'layouts', ''],
  ['Dīkstāve: renderer CPU', 'idle', 'cpuRendererPct', '%'], ['Dīkstāve: GPU CPU', 'idle', 'cpuGpuPct', '%'], ['Dīkstāve: galvenais pavediens', 'idle', 'mainThreadPct', '%'],
  ['Radio atvēršana p95', 'radio-cycles', 'radioOpen.p95', 'ms'], ['Radio spēlē: renderer CPU', 'radio-playing', 'cpuRendererPct', '%'], ['Radio spēlē: GPU CPU', 'radio-playing', 'cpuGpuPct', '%'], ['Radio spēlē: kadri p99', 'radio-playing', 'frames.p99', 'ms'],
  ['Renderer atmiņa (dīkstāvē)', 'idle', 'rendererMB', 'MB'], ['GPU procesa atmiņa', 'idle', 'gpuMB', 'MB']
];
const cell = v => v == null ? '<td class="na">–</td>' : `<td>${esc(v)}</td>`;
const delta = (a, b) => { if (a == null || b == null || !a) return '<td class="na">–</td>'; const d = (b - a) / Math.abs(a) * 100; const cls = Math.abs(d) < 3 ? 'same' : d < 0 ? 'good' : 'bad'; return `<td class="${cls}">${d > 0 ? '+' : ''}${d.toFixed(0)} %</td>`; };
let html = '';
for (const c of R.cpus) {
  html += `<h2>CPU ×${c}</h2><table><tr><th>Rādītājs</th><th>${esc(A)}</th><th>${esc(B ?? '')}</th><th>Izmaiņa</th></tr>`;
  for (const [label, sc, p, unit] of ROWS) { const a = get(scen(A, c, sc), p), b = B ? get(scen(B, c, sc), p) : null; html += `<tr><td>${esc(label)}${unit ? ' <small>' + unit + '</small>' : ''}</td>${cell(a)}${cell(b)}${B ? delta(a, b) : '<td></td>'}</tr>`; }
  html += '</table>';
}
// soak: heap, nodes, listeners, renderer memory over 1000 switches (a line per variant)
const chart = (key, label) => {
  const series = names.map(n => (R.variants[n].soak?.samples || []).map(s => s[key]));
  const all = [].concat(...series).filter(x => x != null); if (!all.length) return '';
  const lo = Math.min(...all), hi = Math.max(...all), W = 520, H = 140, pad = 24;
  const lines = series.map((s, i) => `<polyline fill="none" stroke-width="2" class="s${i}" points="${s.map((v, j) => `${pad + (W - 2 * pad) * j / Math.max(1, s.length - 1)},${H - pad - (H - 2 * pad) * ((v - lo) / Math.max(1e-9, hi - lo))}`).join(' ')}"/>`).join('');
  return `<figure><figcaption>${esc(label)} <small>${lo.toFixed(1)}–${hi.toFixed(1)}</small></figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${lines}</svg></figure>`;
};
let soak = '<h2>Ilgstoša darbība (dienu pārslēgšanas)</h2><table><tr><th>Rādītājs</th>' + names.map(n => `<th>${esc(n)}</th>`).join('') + '</tr>';
for (const [label, key] of [['JS heap MB', 'heapMB'], ['Kalendāra heap MB', 'calHeapMB'], ['DOM elementi', 'nodes'], ['Notikumu klausītāji', 'listeners'], ['Renderer MB', 'rendererMB'], ['GPU MB', 'gpuMB']]) {
  soak += `<tr><td>${label} <small>sākumā → beigās</small></td>` + names.map(n => { const s = R.variants[n].soak?.samples || []; return s.length ? `<td>${s[0][key]} → ${s[s.length - 1][key]}</td>` : '<td class="na">–</td>'; }).join('') + '</tr>';
}
soak += '<tr><td>Pārslēgšana soak laikā p95 <small>ms</small></td>' + names.map(n => cell(R.variants[n].soak?.switch?.p95)).join('') + '</tr></table>';
soak += `<div class="charts">${chart('heapMB', 'JS heap MB')}${chart('nodes', 'DOM elementi')}${chart('listeners', 'Klausītāji')}${chart('rendererMB', 'Renderer MB')}</div><p class="legend">${names.map((n, i) => `<span class="k s${i}"></span>${esc(n)}`).join(' ')}</p>`;
let vis = '';
if (R.visualDiff) {
  vis = '<h2>Vizuālā atbilstība</h2><table><tr><th>Stāvoklis</th><th>Mainīti pikseļi</th><th>Atšķirību attēls</th></tr>';
  for (const [k, d] of Object.entries(R.visualDiff)) vis += `<tr><td>${esc(k)}</td>${cell(d.changedPct != null ? d.changedPct + ' %' : d.error)}<td>${d.file ? `<a href="shots/${esc(path.basename(d.file))}">diff</a> · <a href="shots/${esc(A)}-${esc(k)}.png">${esc(A)}</a> · <a href="shots/${esc(B)}-${esc(k)}.png">${esc(B)}</a>` : ''}</td></tr>`;
  vis += '</table>';
}
const errs = names.map(n => (R.variants[n].errors || []).length ? `<p><b>${esc(n)} kļūdas:</b> ${R.variants[n].errors.map(esc).join('; ')}</p>` : '').join('');
const page = `<!doctype html><html lang="lv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RG Performance Lab</title>
<style>:root{--bg:#0f1214;--fg:#e4e8e6;--mut:#97a29e;--line:#2a3331;--good:#62d59a;--bad:#ff8f7a;--a:#9fc7ff;--b:#62d59a}
@media (prefers-color-scheme:light){:root{--bg:#fafbfa;--fg:#17201d;--mut:#55615d;--line:#d9e0dd;--good:#1d7a4a;--bad:#b3341f;--a:#2f6fc8;--b:#1d7a4a}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,-apple-system,sans-serif;padding:24px 16px 64px}main{max-width:980px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px}p.meta,small{color:var(--mut)}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
th,td{text-align:right;padding:6px 10px;border-bottom:1px solid var(--line)}th:first-child,td:first-child{text-align:left}td.good{color:var(--good)}td.bad{color:var(--bad)}td.same,td.na{color:var(--mut)}
.charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}figure{margin:0}svg{width:100%;height:auto;border:1px solid var(--line);border-radius:8px}
.s0{stroke:var(--a)}.s1{stroke:var(--b)}.k{display:inline-block;width:14px;height:3px;margin:0 6px 3px 12px;vertical-align:middle}.k.s0{background:var(--a)}.k.s1{background:var(--b)}a{color:var(--a)}</style></head>
<body><main><h1>RG Performance Lab</h1><p class="meta">${esc(R.host)}, Google Chrome ar GPU, reālie dati. ${esc(R.started)} → ${esc(R.finished || '')}. Izmaiņa: ${esc(B)} pret ${esc(A)} (zaļš = labāk).
CPU palēnināšana modelē tikai procesoru; tā nav Intel UHD 630 emulācija, GPU skaitļi salīdzina versijas, nevis datorus. Procesu CPU % ir jēgpilns tikai pie ×1: palēnināšanas mehānisms pats noslogo renderer procesu. Dīkstāves mērījumā kadru ierakstītājs ir izslēgts.</p>${html}${soak}${vis}${errs}</main></body></html>`;
fs.writeFileSync(path.join(RUN, 'report.html'), page);
console.log('report.html written');
