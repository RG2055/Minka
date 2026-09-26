import test from 'node:test';
import assert from 'node:assert/strict';

const { parseDocMonth, parseTechAbsences, buildRota, sectionKey, departmentOf, shiftOf } =
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
