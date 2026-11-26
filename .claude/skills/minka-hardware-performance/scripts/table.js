// node table.js res/base res/after  → compares <prefix>-r1.json (load) and <prefix>-r4.json (latency)
const fs = require('fs');
const [A, B] = process.argv.slice(2);
const L = (p) => JSON.parse(fs.readFileSync(p));
const a1 = L(A + '-r1.json'), b1 = L(B + '-r1.json'), a4 = L(A + '-r4.json'), b4 = L(B + '-r4.json');
const pct = (x, y) => (x ? ((y - x) / x * 100).toFixed(0) + '%' : '');
const row = (cells) => '| ' + cells.join(' | ') + ' |';
console.log('Load (unthrottled): total CPU all Chrome processes ms/s · GPU process ms/s · RSS MB');
console.log(row(['scenario', 'total CPU', 'GPU proc', 'RSS']));
a1.scenarios.forEach((s, i) => { const t = b1.scenarios[i];
  console.log(row([s.label, `${s.totalCpuMs_perSec} → ${t.totalCpuMs_perSec} (${pct(s.totalCpuMs_perSec, t.totalCpuMs_perSec)})`, `${s.gpuProcessCpuMs_perSec} → ${t.gpuProcessCpuMs_perSec}`, `${s.rssMB} → ${t.rssMB}`])); });
console.log('\nWeak PC (main thread x4): busy % · style+layout ms · interaction p50/p90/max ms · hover p90/max · dropped+partial frames %');
console.log(row(['scenario', 'main busy', 'style+layout', 'interactions', 'hover', 'dropped']));
a4.scenarios.forEach((s, i) => { const t = b4.scenarios[i];
  console.log(row([s.label, `${s.mainThreadBusyPct_x4} → ${t.mainThreadBusyPct_x4}`, `${s.styleMs + s.layoutMs} → ${t.styleMs + t.layoutMs}`,
    s.interactions.n || t.interactions.n ? `${s.interactions.p50}/${s.interactions.p90}/${s.interactions.max} → ${t.interactions.p50}/${t.interactions.p90}/${t.interactions.max}` : '-',
    s.hover.n || t.hover.n ? `${s.hover.p90}/${s.hover.max} → ${t.hover.p90}/${t.hover.max}` : '-',
    `${s.frames.droppedPct} → ${t.frames.droppedPct}`])); });
console.log('\nerrors:', a1.errors.length, a4.errors.length, '→', b1.errors.length, b4.errors.length);
