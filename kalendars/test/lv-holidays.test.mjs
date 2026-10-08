import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/lv-holidays.js';
const H = globalThis.MinkaLvHolidays;

test('Easter-based days follow the computus, not a fixed date', () => {
  assert.equal(H.get('05.04.2026').name, 'Pirmās Lieldienas');
  assert.equal(H.get('03.04.2026').name, 'Lielā Piektdiena');
  assert.equal(H.get('06.04.2026').name, 'Otrās Lieldienas');
  assert.equal(H.get('21.04.2025').name, 'Otrās Lieldienas');
  assert.equal(H.get('24.05.2026').name, 'Vasarsvētki');
});

test('4 May / 18 Nov on a weekend move the day off to Monday', () => {
  assert.deepEqual(H.get('06.05.2024'), { date: '06.05.2024', name: 'Pārceltā brīvdiena (4. maijs)', free: true });
  assert.equal(H.get('20.11.2023').free, true);
  assert.equal(H.get('20.11.2028').free, true);
  assert.equal(H.get('05.05.2026'), null, 'a weekday 4 May moves nothing');
  assert.equal(H.list(2026).some(h => h.name.startsWith('Pārceltā')), false);
});

test('a day shared by two entries answers with the day off', () => {
  assert.equal(H.get('12.05.2024').name, 'Mātes diena');
  assert.equal(H.list(2024).filter(h => h.date === '12.05.2024').length, 2);
});

test('celebrated days are listed but not free; plain days are null', () => {
  assert.equal(H.get('11.11.2026').free, false);
  assert.equal(H.get('07.10.2026'), null);
  assert.equal(H.get('nav datums'), null);
  assert.equal(H.get('1.1.2027').name, 'Jaungada diena');
  assert.equal(H.get(new Date(2026, 11, 24)).name, 'Ziemassvētku vakars');
});

test('list is sorted and a copy', () => {
  const l = H.list(2026);
  const key = d => d.slice(6) + d.slice(3, 5) + d.slice(0, 2);
  assert.deepEqual(l.map(h => key(h.date)), l.map(h => key(h.date)).sort());
  l.length = 0;
  assert.ok(H.list(2026).length > 20);
});

test('monthly norm: 8 h per weekday that is not a day off', () => {
  assert.equal(H.workHours(2026, 9), 22 * 8);  // October, no holidays
  assert.equal(H.workHours(2026, 4), 19 * 8);  // May: 1 and 4 May
  assert.equal(H.workHours(2024, 4), 21 * 8);  // May 2024: 1 May + moved 6 May
  assert.equal(H.workHours(2026, 11), 20 * 8); // December: 24, 25, 31
});
