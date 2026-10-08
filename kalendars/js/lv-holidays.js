// ── Latvijas svētku dienas ─────────────────────────────────────────────────
//
// One place for the Latvian holiday calendar. The pill strip, the month grid,
// the monthly norm hours and the levels' holiday-shift count all ask here, so
// they can no longer disagree about which days are off.
//
//   list(year)            → [{ date:'DD.MM.YYYY', name, free }] sorted by date
//   get(date)             → that day's entry or null ('DD.MM.YYYY' or Date)
//   workHours(year, month) → monthly norm, 8 h per working day (month 0..11)
//
// free:true  = svētku diena by law, or the Monday a weekend 4 May / 18 Nov
//              moves to; free:false = atzīmējamā diena (shown, not a day off).
// Atceres / piemiņas dienas are left out on purpose.
// Dependency-free: no DOM, no storage, loads in node for tests.
(function (root) {
  'use strict';

  // Anonymous Gregorian computus (Meeus/Jones/Butcher).
  function easterSunday(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mo = Math.floor((h + l - 7 * m + 114) / 31);
    const da = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mo - 1, da);
  }

  const pad2 = n => String(n).padStart(2, '0');
  const fmt = dt => pad2(dt.getDate()) + '.' + pad2(dt.getMonth() + 1) + '.' + dt.getFullYear();
  const plus = (dt, n) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
  // n-th given weekday (0 = Sun) of a month (0..11).
  function nthWeekday(y, month, weekday, n) {
    const add = (weekday - new Date(y, month, 1).getDay() + 7) % 7;
    return new Date(y, month, 1 + add + (n - 1) * 7);
  }
  // 4 May / 18 Nov on a Saturday or Sunday: the day off moves to Monday.
  function movedOff(y, month, day) {
    const dow = new Date(y, month, day).getDay();
    if (dow === 6) return new Date(y, month, day + 2);
    if (dow === 0) return new Date(y, month, day + 1);
    return null;
  }

  function build(y) {
    const on = (m, d) => new Date(y, m - 1, d);
    const E = easterSunday(y);
    const rows = [
      [on(1, 1), 'Jaungada diena', true],
      [plus(E, -2), 'Lielā Piektdiena', true],
      [E, 'Pirmās Lieldienas', true],
      [plus(E, 1), 'Otrās Lieldienas', true],
      [on(5, 1), 'Darba svētki', true],
      [on(5, 4), 'Neatkarības atjaunošanas diena', true],
      [nthWeekday(y, 4, 0, 2), 'Mātes diena', true],
      [plus(E, 49), 'Vasarsvētki', true],
      [on(6, 23), 'Līgo diena', true],
      [on(6, 24), 'Jāņi (Vasaras saulgrieži)', true],
      [on(11, 18), 'Latvijas Republikas proklamēšanas diena', true],
      [on(12, 24), 'Ziemassvētku vakars', true],
      [on(12, 25), 'Pirmie Ziemassvētki', true],
      [on(12, 26), 'Otrie Ziemassvētki', true],
      [on(12, 31), 'Vecgada diena', true],
      // Atzīmējamās / svinamās dienas (not days off)
      [on(3, 8), 'Starptautiskā sieviešu diena', false],
      [on(5, 12), 'Mediķu diena (medmāsu diena)', false],
      [on(5, 15), 'Starptautiskā ģimenes diena', false],
      [on(6, 1), 'Bērnu aizsardzības diena', false],
      [on(9, 1), 'Zinību diena', false],
      [nthWeekday(y, 8, 0, 2), 'Tēvu diena', false],
      [on(11, 11), 'Lāčplēša diena', false]
    ];
    const may = movedOff(y, 4, 4), nov = movedOff(y, 10, 18);
    if (may) rows.push([may, 'Pārceltā brīvdiena (4. maijs)', true]);
    if (nov) rows.push([nov, 'Pārceltā brīvdiena (18. novembris)', true]);

    const list = rows
      .map(r => ({ t: +r[0], entry: { date: fmt(r[0]), name: r[1], free: r[2] } }))
      .sort((a, b) => a.t - b.t || (b.entry.free - a.entry.free))
      .map(r => r.entry);
    // Two entries can share a day (Mātes diena on 12 May); the day off wins.
    const byDate = new Map();
    list.forEach(h => { if (!byDate.has(h.date)) byDate.set(h.date, h); });
    return { list, byDate };
  }

  const cache = new Map();
  function year(y) {
    let v = cache.get(y);
    if (!v) { v = build(y); cache.set(y, v); }
    return v;
  }

  function list(y) {
    return year(Number(y)).list.slice();
  }

  function get(date) {
    let key = '';
    if (date instanceof Date) key = Number.isFinite(+date) ? fmt(date) : '';
    else {
      const m = String(date || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (m) key = pad2(+m[1]) + '.' + pad2(+m[2]) + '.' + m[3];
    }
    if (!key) return null;
    return year(+key.slice(6)).byDate.get(key) || null;
  }

  function workHours(y, month) {
    const days = year(y).byDate;
    const last = new Date(y, month + 1, 0).getDate();
    let norm = 0;
    for (let d = 1; d <= last; d++) {
      const dt = new Date(y, month, d), dow = dt.getDay();
      if (dow === 0 || dow === 6) continue;
      const h = days.get(fmt(dt));
      if (h && h.free) continue;
      norm += 8;
    }
    return norm;
  }

  root.MinkaLvHolidays = { list, get, workHours };
})(typeof window !== 'undefined' ? window : globalThis);
