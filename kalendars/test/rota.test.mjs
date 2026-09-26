import test from 'node:test';
import assert from 'node:assert/strict';

const { parseDocMonth, parseTechAbsences, parseTechLeave, joinAbsences, buildRota, sectionKey, departmentOf, shiftOf } =
  await import(new URL('../../cloudflare/minka-api/src/rota.js', import.meta.url));

// A doc sheet laid out like the radiologist mirror: title row, day header
// (slodze/stundas/BE then 1..N from column H), blocks merged in column A.
function docSheet({ month = 9, year = 2026, rows, merges, colors = {} }) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const width = 7 + days;
  const blank = () => Array(width).fill('');
  const values = [blank(), blank()];
  values[0][2] = 'SEPTEMBRIS';
  values[1][4] = 'slodze'; values[1][5] = 'stundas'; values[1][6] = 'BE';
  for (let d = 1; d <= days; d++) values[1][6 + d] = String(d);
  const palette = ['#ffffff', '#1a73e8', '#ff9900', '#c9daf8', '#ea9999', '#999999'];
  const bg = [], fg = [];
  for (const r of rows) {
    const row = blank();
    row[0] = r.a || ''; row[1] = r.b || ''; row[2] = r.name || '';
    for (const [day, v] of Object.entries(r.cells || {})) row[6 + Number(day)] = v;
    values.push(row);
  }
  for (let r = 0; r < values.length; r++) {
    bg.push(Array(width).fill(0)); fg.push(Array(width).fill(0));
  }
  for (const [key, idx] of Object.entries(colors)) {
    const [layer, r, day] = key.split(':');
    (layer === 'fg' ? fg : bg)[Number(r)][6 + Number(day)] = idx;
  }
  return { name: 'Septembris 26', month, year, values, palette, bg, fg, merges };
}

test('sections come from column-A merges; an unlabelled block takes the heading above it', () => {
  const sheet = docSheet({
    rows: [
      { a: 'Atbildīgie ārsti', name: 'PERSONA A', cells: { 1: '12', 2: 'ATV' } },   // row 3
      { name: 'PERSONA B', cells: { 1: '12' } },                                       // row 4
      { name: 'SUM' },                                                                 // row 5
      { a: 'Nodaļu ārsti', name: 'Persona C 9-17', cells: { 3: '9' } },                // row 6
      { name: 'Persona D', cells: {} },                                                // row 7
      { a: 'Neatliekamās radioloģijas nodaļas dežūras' },                              // row 8 (heading)
      { name: 'Persona E', cells: { 5: '12' } },                                       // row 9
      { name: 'Persona F', cells: { 5: '15' } },                                       // row 10
      { a: 'REZIDENTI OBLIGĀTĀS DEŽŪRAS UZŅEMŠANĀ', b: '2', name: 'Persona G', cells: { 6: '7' } }, // row 11
      { b: '3', name: 'Persona H', cells: { 6: '12' } },                               // row 12
      { a: 'REZIDENTI OBLIGĀTĀS DEŽŪRAS NODAĻĀS', b: '1', name: 'Persona I', cells: { 7: '8' } }, // row 13
      { b: '1', name: 'Persona J', cells: { 7: '8' } }                                  // row 14
    ],
    // [row, col, rows, cols], 1-based: blocks in column A, ATV over days 2–4.
    merges: [[3, 1, 3, 1], [6, 1, 2, 1], [9, 1, 2, 1], [11, 1, 2, 1], [13, 1, 2, 1], [3, 9, 1, 3]],
    colors: { 'fg:2:1': 1, 'bg:13:7': 3 }  // 0-based rows: PERSONA A is values[2], Persona J values[13]
  });
  const m = parseDocMonth(sheet);
  assert.deepEqual(m.sections.map(s => s.key), ['atbildigie', 'nodalu_arsti', 'neatliekama_dezuras', 'rezidenti_uznemsana', 'rezidenti_nodalas']);
  const d1 = m.days['01.09.2026'];
  assert.deepEqual(d1.atbildigie.map(e => [e.name, e.type]), [['PERSONA A', 'NAKTS'], ['PERSONA B', 'DIENA']]);
  assert.equal(m.days['03.09.2026'].nodalu_arsti[0].name, 'Persona C');
  assert.equal(m.days['03.09.2026'].nodalu_arsti[0].hoursNote, '9-17');
  assert.deepEqual(m.days['05.09.2026'].neatliekama_dezuras.map(e => [e.name, e.start, e.end]), [['Persona E', '08:00', '20:00'], ['Persona F', '17:00', '08:00']]);
  assert.deepEqual(m.days['06.09.2026'].rezidenti_uznemsana.map(e => [e.name, e.year]), [['Persona G', 2], ['Persona H', 3]]);
  const dept = m.days['07.09.2026'].rezidenti_nodalas;
  assert.equal(dept.find(e => e.name === 'Persona J').dept, 'LOC');
  assert.equal(dept.find(e => e.name === 'Persona I').dept, undefined, 'the column default colour is no department');
  assert.deepEqual(m.absences, [{ src: 'doc', name: 'PERSONA A', section: 'atbildigie', code: 'ATV', from: '02.09.2026', to: '04.09.2026' }]);
  assert.ok(!m.people.some(p => p.name === 'SUM'));
});

test('a 24 h / 16 h on the last day continues as a night on day 1 of the next month', () => {
  const aug = docSheet({ month: 8, rows: [{ a: 'Atbildīgie ārsti', name: 'PERSONA A', cells: { 31: '24' } }, { name: 'PERSONA B' }], merges: [[3, 1, 2, 1]] });
  const sep = docSheet({ month: 9, rows: [{ a: 'Atbildīgie ārsti', name: 'PERSONA A', cells: { 1: '8' } }, { name: 'PERSONA B' }], merges: [[3, 1, 2, 1]] });
  const rota = buildRota({ sheets: [sep, aug] }, { sheets: [] });
  assert.deepEqual(rota.months.map(m => m.month), [8, 9]);
  const first = rota.months[1].days['01.09.2026'].atbildigie[0];
  assert.deepEqual([first.name, first.type, first.start, first.end, first.carryOver], ['PERSONA A', 'NAKTS', '00:00', '08:00', true]);
});

test('radiographer absences join consecutive days with the same code', () => {
  const days = 30, width = 4 + days;
  const values = [Array(width).fill(''), Array(width).fill(''), Array(width).fill('')];
  values[0][0] = 'SEPTEMBRIS 2026';
  values[1][3] = 'DATUMS';
  for (let d = 1; d <= days; d++) values[1][3 + d] = String(d);
  values[2][1] = 'SLODZE';
  const person = Array(width).fill('');
  person[0] = 'PERSONA A';
  person[4] = 'A'; person[5] = 'A'; person[6] = 'A'; person[7] = '12'; person[9] = 'dnl'; person[10] = 'X';
  values.push(person);
  const out = parseTechAbsences({ month: 9, year: 2026, values, palette: [], bg: [], fg: [], merges: [] });
  assert.deepEqual(out, [
    { src: 'tech', name: 'PERSONA A', code: 'A', from: '01.09.2026', to: '03.09.2026' },
    { src: 'tech', name: 'PERSONA A', code: 'DNL', from: '06.09.2026', to: '06.09.2026' },
    { src: 'tech', name: 'PERSONA A', code: 'X', from: '07.09.2026', to: '07.09.2026' }
  ]);
});

test('labels, departments and shifts', () => {
  assert.equal(sectionKey('Neatliekamās radioloģijas rotācija'), 'neatliekama_rotacija');
  assert.equal(sectionKey('STAŽIERU DEŽŪRAS'), 'neatliekama_stazieri');
  assert.equal(sectionKey('NODAĻU STAŽIERI'), 'nodalu_stazieri');
  assert.equal(sectionKey('Nodaļas (zils - LOC, oranžs- Jugla, roza- GA)'), '');
  assert.equal(departmentOf('#6fa8dc'), 'LOC');
  assert.equal(departmentOf('#ff9900'), 'Jugla');
  assert.equal(departmentOf('#ea9999'), 'GA');
  assert.equal(departmentOf('#ffffff'), '');
  assert.equal(shiftOf(12, true, false).type, 'NAKTS');
  assert.equal(shiftOf(16, false, true).type, 'DIENNAKTS');
  assert.deepEqual([shiftOf(7, false, false).start, shiftOf(7, false, false).end], ['08:00', '15:00']);
  assert.equal(shiftOf(8, true, false).type, 'NAKTS');
});

test('an unlabelled block after the department doctors is the rotation; marks are not absences', async () => {
  const { absenceCode } = await import(new URL('../../cloudflare/minka-api/src/rota.js', import.meta.url));
  const sheet = docSheet({
    rows: [
      { a: 'Nodaļu ārsti', name: 'Persona C 9-17', cells: { 2: '9' } },
      { name: 'Persona D' },
      { name: 'Persona R', cells: { 3: '12', 4: '*' } },
      { name: 'Persona S', cells: { 3: 'dnl' } }
    ],
    merges: [[3, 1, 2, 1], [5, 1, 2, 1]]
  });
  const m = parseDocMonth(sheet);
  assert.deepEqual(m.sections.map(s => s.key), ['nodalu_arsti', 'neatliekama_rotacija']);
  assert.equal(m.days['03.09.2026'].neatliekama_rotacija[0].name, 'Persona R');
  assert.deepEqual(m.absences.map(a => [a.name, a.code]), [['Persona S', 'DNL']]);
  assert.equal(absenceCode('AD⁣'.replace(/[⁠-⁤]/g, '')), 'AD');
  assert.equal(absenceCode('*'), '');
});

test('a colour over the whole row is a highlight, not a department', () => {
  const colors = {};
  for (let d = 1; d <= 30; d++) colors['bg:3:' + d] = 2;
  const sheet = docSheet({
    rows: [
      { a: 'REZIDENTI OBLIGĀTĀS DEŽŪRAS NODAĻĀS', b: '1', name: 'Persona I', cells: { 7: '8' } },
      { b: '1', name: 'Persona J', cells: { 7: '8' } },
      { b: '1', name: 'Persona K', cells: { 7: '8' } },
      { b: '1', name: 'Persona L' },
      { b: '1', name: 'Persona M' }
    ],
    merges: [[3, 1, 5, 1]],
    colors: { ...colors, 'bg:4:7': 2 }
  });
  const dept = parseDocMonth(sheet).days['07.09.2026'].rezidenti_nodalas;
  assert.equal(dept.find(e => e.name === 'Persona J').dept, undefined);
  assert.equal(dept.find(e => e.name === 'Persona K').dept, 'Jugla');
});

test('a code written once runs over the days painted the same colour, also into the next month', () => {
  const yellow = 2; // palette '#ff9900'
  const paint = (row, from, to) => Object.fromEntries(Array.from({ length: to - from + 1 }, (_, i) => ['bg:' + row + ':' + (from + i), yellow]));
  const aug = docSheet({ month: 8, rows: [{ a: 'Atbildīgie ārsti', name: 'PERSONA A', cells: { 28: 'ATV' } }, { name: 'PERSONA B' }, { name: 'PERSONA C' }],
    merges: [[3, 1, 3, 1]], colors: paint(2, 28, 31) });
  const sep = docSheet({ month: 9, rows: [{ a: 'Atbildīgie ārsti', name: 'PERSONA A', cells: { 5: '12' } }, { name: 'PERSONA B', cells: { 10: 'DNL' } }, { name: 'PERSONA C' }],
    merges: [[3, 1, 3, 1]], colors: paint(2, 1, 3) });
  const rota = buildRota({ sheets: [aug, sep] }, { sheets: [] });
  assert.deepEqual(rota.absences.map(a => [a.name, a.code, a.from, a.to]), [
    ['PERSONA A', 'ATV', '28.08.2026', '03.09.2026'],
    ['PERSONA B', 'DNL', '10.09.2026', '10.09.2026']
  ]);
});

test('radiographer leave plan: ranges per month, running over month ends, codes', () => {
  const head = ['Nr. pk.', 'Vārds Uzvārds', 'Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'];
  const row = (name, cells) => { const r = Array(14).fill(''); r[1] = name; for (const [m, v] of Object.entries(cells)) r[1 + Number(m)] = v; return r; };
  const sheet = { name: 'ATVAĻINĀJUMI 2026', month: null, year: null, leave: true, values: [
    ['Atvaļinājumu grafiks'], head,
    row('PERSONA A', { 3: '9-15', 6: '29-', 7: '5', 12: '30-07.01.' }),
    row('PERSONA B sanitārs/slimnieku kopējs', { 6: 'PA17-19', 8: '24-', 9: '-6' })
  ], merges: [] };
  assert.deepEqual(parseTechLeave(sheet).map(a => [a.name, a.role || '', a.code, a.from, a.to]), [
    ['PERSONA A', '', 'A', '09.03.2026', '15.03.2026'],
    ['PERSONA A', '', 'A', '29.06.2026', '05.07.2026'],
    ['PERSONA A', '', 'A', '30.12.2026', '07.01.2027'],
    ['PERSONA B', 'sanitārs', 'PA', '17.06.2026', '19.06.2026'],
    ['PERSONA B', 'sanitārs', 'A', '24.08.2026', '06.09.2026']
  ]);
  assert.deepEqual(joinAbsences([
    { src: 'tech', name: 'X', code: 'A', from: '28.08.2026', to: '31.08.2026' },
    { src: 'tech', name: 'X', code: 'A', from: '01.09.2026', to: '02.09.2026' }
  ]).map(a => a.from + '-' + a.to), ['28.08.2026-02.09.2026']);
});

test('codes keep their spelling and get a group', async () => {
  const { codeGroup } = await import(new URL('../../cloudflare/minka-api/src/rota.js', import.meta.url));
  assert.deepEqual(['ATV', 'x', 'Liep', 'DNL', 'MR', 'AD'].map(codeGroup), ['leave', 'unavailable', 'away', 'sick', 'assignment', 'other']);
});

test('/rad schedule: residents on the emergency duty left, responsible radiologists right, in /api/schedule shape', async () => {
  const { radSchedule } = await import(new URL('../../cloudflare/minka-api/src/rota.js', import.meta.url));
  const sheet = docSheet({
    rows: [
      { a: 'Atbildīgie ārsti', name: 'Persona A', cells: { 1: '24' } },
      { name: 'Persona B' },
      { a: 'Nodaļu ārsti', name: 'Persona C', cells: { 1: '9' } },
      { name: 'Persona D' },
      { a: 'Neatliekamās radioloģijas nodaļas dežūras' },
      { name: 'Persona E', cells: { 1: '12' } },
      { name: 'Persona F', cells: { 1: '15' } }
    ],
    merges: [[3, 1, 2, 1], [5, 1, 2, 1], [8, 1, 2, 1]]
  });
  const out = radSchedule(buildRota({ sheets: [sheet] }, { sheets: [] }));
  const day = (side) => out[side]['SEPTEMBRIS 2026'].find(d => d.date === '01.09.2026').workers;
  assert.deepEqual(day('radiologists').map(w => [w.name, w.type, w.startTime, w.endTime]), [['PERSONA A', 'DIENNAKTS', '08:00', '08:00']]);
  assert.deepEqual(day('radiographers').map(w => [w.name, w.section, w.startTime]), [['PERSONA E', 'neatliekama_dezuras', '08:00'], ['PERSONA F', 'neatliekama_dezuras', '17:00']]);
  assert.equal(out['radiographers']['SEPTEMBRIS 2026'].length, 30);
  assert.ok(!day('radiographers').some(w => w.name === 'PERSONA C'), 'department doctors are not in the default view');
});

test('/rad schedule: a year group split off above the labelled admission block belongs to it, and admission residents are on the left', async () => {
  const { radSchedule } = await import(new URL('../../cloudflare/minka-api/src/rota.js', import.meta.url));
  const sheet = docSheet({
    rows: [
      { a: 'Atbildīgie ārsti', name: 'Persona A', cells: { 1: '12' } },               // row 3
      { name: 'Persona B' },                                                           // row 4
      { a: 'Neatliekamās radioloģijas nodaļas dežūras' },                              // row 5 (heading)
      { name: 'Persona E', cells: { 1: '12' } },                                       // row 6
      { name: 'Persona F' },                                                           // row 7
      { b: '1', name: 'Persona G', cells: { 1: '12' } },                               // row 8 (year 1, own merge, no label)
      { b: '1', name: 'Persona H' },                                                   // row 9
      { a: 'REZIDENTI OBLIGĀTĀS DEŽŪRAS UZŅEMŠANĀ', b: '2', name: 'Persona I', cells: { 1: '12' } }, // row 10
      { b: '5', name: 'Persona E', cells: { 1: '12' } }                                // row 11 (also above: listed once)
    ],
    merges: [[3, 1, 2, 1], [6, 1, 2, 1], [8, 1, 2, 1], [10, 1, 2, 1]]
  });
  const m = parseDocMonth(sheet);
  assert.deepEqual(m.sections.map(s => s.key), ['atbildigie', 'neatliekama_dezuras', 'rezidenti_uznemsana', 'rezidenti_uznemsana']);
  const out = radSchedule(buildRota({ sheets: [sheet] }, { sheets: [] }));
  const left = out.radiographers['SEPTEMBRIS 2026'].find(d => d.date === '01.09.2026').workers;
  assert.deepEqual(left.map(w => [w.name, w.section]), [['PERSONA E', 'neatliekama_dezuras'], ['PERSONA G', 'rezidenti_uznemsana'], ['PERSONA I', 'rezidenti_uznemsana']]);
});

test('one person, one name: spelling variants of a resident merge, different people in the same list stay apart', () => {
  const sheet = docSheet({
    rows: [
      { a: 'Atbildīgie ārsti', name: 'PERSONA ALFA *', cells: { 1: '12' } },            // row 3: a mark after the name
      { name: 'PERSONA BETA', cells: { 2: '12' } },                                     // row 4
      { a: 'Neatliekamās radioloģijas nodaļas dežūras' },                              // row 5 (heading)
      { name: 'TESTS KĻAVIŅŠ', cells: { 3: '15' } },                                     // row 6
      { name: 'PROVE OZOLA', cells: { 4: '15' } },                                     // row 7
      { a: 'REZIDENTI OBLIGĀTĀS DEŽŪRAS UZŅEMŠANĀ', b: '3', name: 'Tests Kļaviņš', cells: { 5: '12' } }, // row 8
      { b: '3', name: 'Prove Ozolā', cells: { 6: '12' } },                             // row 9
      { b: '3', name: 'Ilze Lapa' },                                                   // row 10
      { b: '4', name: 'Ilga Lepa' },                                                   // row 11: another person
      { a: 'REZIDENTI OBLIGĀTĀS DEŽŪRAS NODAĻĀS', b: '3', name: 'Tests Kaļviņš', cells: { 7: '8' } }, // row 12: letters swapped
      { b: '3', name: 'Prove Ozolā' }                                                  // row 13
    ],
    merges: [[3, 1, 2, 1], [6, 1, 2, 1], [8, 1, 4, 1], [12, 1, 2, 1]]
  });
  const rota = buildRota({ sheets: [sheet] }, { sheets: [] });
  const m = rota.months[0];
  const names = (date, section) => (m.days[date][section] || []).map(e => e.name.toUpperCase());
  assert.deepEqual(names('01.09.2026', 'atbildigie'), ['PERSONA ALFA']);
  assert.deepEqual(names('03.09.2026', 'neatliekama_dezuras'), ['TESTS KĻAVIŅŠ']);
  assert.deepEqual(names('04.09.2026', 'neatliekama_dezuras'), ['PROVE OZOLĀ']);
  assert.deepEqual(names('07.09.2026', 'rezidenti_nodalas'), ['TESTS KĻAVIŅŠ']);
  const people = new Set(m.people.map(p => p.name));
  assert.ok(people.has('Ilze Lapa') && people.has('Ilga Lepa'), 'two people in one list are never merged');
});
