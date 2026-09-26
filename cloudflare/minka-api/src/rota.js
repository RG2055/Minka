// Reads the raw sheet grids (Apps Script ?fn=grid) into a duty rota:
//   doc  – the radiologist mirror of GRAFIKS.xlsx: attending radiologists,
//          department doctors, emergency radiology (rotation + duties),
//          residents on admission and department duties, department interns;
//   tech – the radiographer schedule: absences only, plus the yearly leave
//          plan tab (shifts come from the
//          existing schedule API).
// Absences (DNL, ATV, A, X…) are kept as written; the app labels the known
// codes. Nothing here depends on names; every sheet is read by its layout.

/* ── colours (same rules as the sheet script that feeds Minka) ── */
function hexToRgb(hex) {
  const h = String(hex || "").trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2, d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return { h, s, l };
}
function dist(a, b) { return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b); }
export function isBlueTone(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hueBlue = hsl.h >= 190 && hsl.h <= 260;
  const nearBlue = dist(rgb, hexToRgb("#1a73e8")) < 95 || dist(rgb, hexToRgb("#0000ff")) < 95;
  return hsl.s >= 0.18 && hsl.l >= 0.15 && hsl.l <= 0.90 && (hueBlue || nearBlue);
}

// The residents' department legend: blue LOC, orange Jugla, pink GA.
export function departmentOf(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (s < 0.25 || l > 0.95 || l < 0.12) return "";
  if (h >= 190 && h <= 260) return "LOC";
  if (h >= 18 && h <= 50) return "Jugla";
  if (h >= 290 || h <= 10) return "GA";
  return "";
}

/* ── shift from hours + colour (identical to the sheet script) ── */
export function shiftOf(hours, isBlue, isLastDay) {
  if (hours === 24 || (isLastDay && hours === 16)) return { type: "DIENNAKTS", start: "08:00", end: "08:00" };
  if (hours === 12) return isBlue ? { type: "NAKTS", start: "20:00", end: "08:00" } : { type: "DIENA", start: "08:00", end: "20:00" };
  if (hours === 15) return { type: "NAKTS", start: "17:00", end: "08:00" };
  if (hours === 9) return { type: "DIENA", start: "08:00", end: "17:00" };
  return isBlue ? { type: "NAKTS", start: "20:00", end: "08:00" } : { type: "DIENA", start: "08:00", end: "20:00" };
}

/* ── sections of the radiologist sheet ── */
const SECTION_RULES = [
  [/atbild[īi]g/i, "atbildigie"],
  [/noda[ļl]u\s+[āa]rst/i, "nodalu_arsti"],
  [/rot[āa]cij/i, "neatliekama_rotacija"],
  [/sta[žz]ieru\s+de[žz]/i, "neatliekama_stazieri"],
  [/neatliekam/i, "neatliekama_dezuras"],
  [/rezident.*uz[ņn]em/i, "rezidenti_uznemsana"],
  [/rezident.*noda[ļl]/i, "rezidenti_nodalas"],
  [/noda[ļl]u\s+sta[žz]ier/i, "nodalu_stazieri"]
];
export function sectionKey(label) {
  const text = String(label || "").replace(/\s+/g, " ").trim();
  for (const [re, key] of SECTION_RULES) if (re.test(text)) return key;
  return "";
}

const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (day, month, year) => pad2(day) + "." + pad2(month) + "." + year;
// Values as displayed, without invisible characters some cells carry.
const cell = (sheet, r, c) => String(((sheet.values[r] || [])[c]) ?? "").replace(/[\u200b-\u200f\u2060-\u2064\ufeff]/g, "").trim();

// Absence codes as written, except case differences of the same word
// ("dnl"/"DNL"); a lone "*" or similar mark is a note, not an absence.
export function absenceCode(value) {
  const v = String(value || "").trim();
  if (!/[A-Za-zĀ-ž]/.test(v)) return "";
  return /^dnl$/i.test(v) ? "DNL" : v;
}
// How the app groups the codes (the code itself is always kept as written).
//   leave        – ATV, A (radiographers), PA additional, BA unpaid, BKA child care
//   sick         – DNL
//   away         – working or studying elsewhere: ERASMUS, LIEP(āja)
//   assignment   – MR (radiographer at the MR scanner that day)
//   unavailable  – X / N: cannot work that day
//   other        – anything not known yet (AD, AB, ATP, ARV…)
const CODE_GROUPS = {
  ATV: "leave", A: "leave", PA: "leave", BA: "leave", BKA: "leave",
  DNL: "sick",
  ERASMUS: "away", LIEP: "away",
  MR: "assignment",
  X: "unavailable", N: "unavailable"
};
export const codeGroup = (code) => CODE_GROUPS[String(code || "").toUpperCase()] || "other";

const color = (sheet, layer, r, c) => {
  const idx = ((sheet[layer] || [])[r] || [])[c];
  return idx === undefined ? "" : String((sheet.palette || [])[idx] || "");
};

// Row and first column of the day numbers (1, 2, 3 … in one row).
export function findDayHeader(sheet) {
  for (let r = 0; r < Math.min(15, sheet.values.length); r++) {
    const row = sheet.values[r] || [];
    for (let c = 0; c < Math.min(20, row.length); c++) {
      if (String(row[c]).trim() === "1" && String(row[c + 1] ?? "").trim() === "2") return { row: r, col: c };
    }
  }
  return null;
}

function dayColumns(sheet, header) {
  const lastDay = new Date(Date.UTC(sheet.year, sheet.month, 0)).getUTCDate();
  const cols = [];
  const row = sheet.values[header.row];
  for (let c = header.col; c < row.length; c++) {
    const day = parseInt(String(row[c]).trim(), 10);
    if (day >= 1 && day <= lastDay) cols.push({ col: c, day });
  }
  return { cols, lastDay };
}

// Merged range covering (r, c) (0-based), as [row, col, rows, cols] 1-based.
function mergeAt(sheet, r, c) {
  for (const m of sheet.merges || []) {
    if (r + 1 >= m[0] && r + 1 < m[0] + m[2] && c + 1 >= m[1] && c + 1 < m[1] + m[3]) return m;
  }
  return null;
}

// Blocks of the doc sheet: the vertical merges of column A. A block without a
// label takes the heading written above it, or continues the previous block.
export function docBlocks(sheet, header) {
  const merges = (sheet.merges || []).filter((m) => m[1] === 1 && m[3] <= 2 && m[2] >= 2 && m[0] > header.row + 1)
    .sort((a, b) => a[0] - b[0]);
  const blocks = [];
  let previous = null;
  for (const m of merges) {
    const top = m[0] - 1, bottom = m[0] - 1 + m[2] - 1;
    let label = cell(sheet, top, 0);
    let key = sectionKey(label);
    if (!key) {
      for (let r = top - 1; r > (previous ? previous.bottom : header.row); r--) {
        const text = [0, 1, 2, 3].map((c) => cell(sheet, r, c)).filter(Boolean).join(" ");
        const k = sectionKey(text);
        if (k) { key = k; label = text; break; }
      }
    }
    // The rotation block sometimes has no label; it is the one right after the
    // department doctors (always labelled). Any other unlabelled block
    // continues the previous one (the list goes on over a page break).
    if (!key && previous && previous.key === "nodalu_arsti") { key = "neatliekama_rotacija"; label = "Neatliekamās radioloģijas rotācija"; }
    if (!key && previous) { key = previous.key; label = previous.label; }
    const block = { key: key || "cits", label: String(label || "").replace(/\s+/g, " ").trim(), top, bottom };
    blocks.push(block);
    previous = block;
  }
  return blocks;
}

function personRow(sheet, r) {
  let name = cell(sheet, r, 2);
  if (!name || name.length <= 3 || /^(SUM|KOP[ĒE]JS|SLODZE)/i.test(name)) return null;
  if (sectionKey(name)) return null;
  let hoursNote = "";
  const m = name.match(/^(.*?)\s+(\d{1,2}\s*[-–]\s*\d{1,2})$/);
  if (m) { name = m[1].trim(); hoursNote = m[2].replace(/\s+/g, ""); }
  const yearText = cell(sheet, r, 1);
  const year = /^[1-6]$/.test(yearText) ? Number(yearText) : null;
  return { name, year, hoursNote };
}

// Most common background of a day column inside a block: weekend shading
// and plain white, so only a different colour means a department.
function columnDefault(sheet, col, top, bottom) {
  const count = {};
  for (let r = top; r <= bottom; r++) {
    const c = color(sheet, "bg", r, col);
    count[c] = (count[c] || 0) + 1;
  }
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

// A colour over most of a row's days marks the whole row (a highlighted
// person), not the department of one day.
function rowDefault(sheet, r, cols) {
  const count = {};
  for (const { col } of cols) {
    const c = color(sheet, "bg", r, col);
    count[c] = (count[c] || 0) + 1;
  }
  const [top, n] = Object.entries(count).sort((a, b) => b[1] - a[1])[0] || [];
  return n > cols.length / 2 ? top : "";
}

export function parseDocMonth(sheet) {
  const header = findDayHeader(sheet);
  if (!header || !sheet.month || !sheet.year) return null;
  const { cols, lastDay } = dayColumns(sheet, header);
  const blocks = docBlocks(sheet, header);
  const days = {};
  const people = [];
  const absences = [];
  const leads = [];
  for (const { day } of cols) days[dateKey(day, sheet.month, sheet.year)] = {};
  for (const block of blocks) {
    const defaults = {};
    for (const { col } of cols) defaults[col] = columnDefault(sheet, col, block.top, block.bottom);
    for (let r = block.top; r <= block.bottom; r++) {
      const person = personRow(sheet, r);
      if (!person) continue;
      people.push({ ...person, section: block.key });
      const rowColor = block.key === "rezidenti_nodalas" ? rowDefault(sheet, r, cols) : "";
      // A painted cell after a code carries the absence on: the code is
      // written once and the remaining days are coloured the same.
      const painted = (col, bg) => bg && bg !== "#ffffff" && bg !== defaults[col];
      const fillEnd = (i, bg) => {
        let end = i;
        while (end + 1 < cols.length && !cell(sheet, r, cols[end + 1].col) && color(sheet, "bg", r, cols[end + 1].col) === bg) end++;
        return end;
      };
      // Painted days from day 1 without a code continue last month's absence.
      const firstBg = cols.length ? color(sheet, "bg", r, cols[0].col) : "";
      if (cols.length && cols[0].day === 1 && !cell(sheet, r, cols[0].col) && painted(cols[0].col, firstBg)) {
        leads.push({ name: person.name, section: block.key, to: dateKey(cols[fillEnd(0, firstBg)].day, sheet.month, sheet.year) });
      }
      for (let i = 0; i < cols.length; i++) {
        const { col, day } = cols[i];
        const value = cell(sheet, r, col);
        if (!value || value === "-" || value === "?" || value === ".") continue;
        const key = dateKey(day, sheet.month, sheet.year);
        if (/^\d{1,2}$/.test(value)) {
          const hours = Number(value);
          const fg = color(sheet, "fg", r, col), bg = color(sheet, "bg", r, col);
          const entry = { name: person.name, shift: value, ...shiftOf(hours, isBlueTone(fg) || isBlueTone(bg), day === lastDay) };
          if (person.year) entry.year = person.year;
          if (person.hoursNote) entry.hoursNote = person.hoursNote;
          if (block.key === "rezidenti_nodalas" && bg !== defaults[col] && bg !== rowColor) {
            const dept = departmentOf(bg);
            if (dept) entry.dept = dept;
          }
          (days[key][block.key] || (days[key][block.key] = [])).push(entry);
          continue;
        }
        // A code: the absence runs over its merged cells (else that one day).
        const code = absenceCode(value);
        if (!code) continue;
        const merge = mergeAt(sheet, r, col);
        let last = i;
        if (merge) while (last + 1 < cols.length && cols[last + 1].col <= merge[1] - 1 + merge[3] - 1) last++;
        const bg = color(sheet, "bg", r, col);
        if (painted(col, bg)) last = Math.max(last, fillEnd(last, bg));
        const to = cols[last].day;
        absences.push({ src: "doc", name: person.name, section: block.key, code, from: key, to: dateKey(to, sheet.month, sheet.year) });
      }
    }
  }
  return { month: sheet.month, year: sheet.year, days, people, absences, leads, sections: blocks.map((b) => ({ key: b.key, label: b.label })) };
}

// A night that runs past midnight into the first day of the next month:
// someone on 16 h / 24 h on the last day is on the 00:00–08:00 part on day 1.
export function applyCarryOver(previous, current) {
  if (!previous || !current) return;
  const lastKey = dateKey(new Date(Date.UTC(previous.year, previous.month, 0)).getUTCDate(), previous.month, previous.year);
  const firstKey = dateKey(1, current.month, current.year);
  const last = previous.days[lastKey] || {}, first = current.days[firstKey];
  if (!first) return;
  for (const [section, entries] of Object.entries(last)) {
    for (const e of entries) {
      if (e.shift !== "16" && e.shift !== "24") continue;
      const list = first[section] || (first[section] = []);
      const existing = list.find((x) => x.name === e.name);
      if (existing) Object.assign(existing, { type: "NAKTS", start: "00:00", end: "08:00", carryOver: true });
      else list.push({ ...e, shift: "8", type: "NAKTS", start: "00:00", end: "08:00", carryOver: true });
    }
  }
}

/* ── radiographer absences: one code per day cell ── */
// Orderlies are listed as "Name Surname sanitārs/slimnieku kopējs".
function techPerson(raw) {
  const m = raw.match(/^(.*?)\s+(sanitār\S*|slimnieku\s+kopēj\S*)(\/.*)?$/i);
  return m ? { name: m[1].trim(), role: "sanitārs" } : { name: raw, role: "" };
}
export function parseTechAbsences(sheet) {
  const header = findDayHeader(sheet);
  if (!header || !sheet.month || !sheet.year) return [];
  const { cols } = dayColumns(sheet, header);
  const out = [];
  for (let r = header.row + 1; r < sheet.values.length; r++) {
    const raw = cell(sheet, r, 0);
    if (!raw || raw.length <= 3 || /^(SLODZE|SUM|KOP[ĒE]JS|DATUMS)/i.test(raw) || !/[a-zā-ž]/i.test(raw)) continue;
    const { name, role } = techPerson(raw);
    let run = null;
    const flush = () => { if (run) { out.push(run); run = null; } };
    for (const { col, day } of cols) {
      const value = absenceCode(cell(sheet, r, col));
      const isCode = !!value;
      if (isCode && run && run.code === value && run.lastDay === day - 1) { run.to = dateKey(day, sheet.month, sheet.year); run.lastDay = day; continue; }
      flush();
      if (isCode) run = { src: "tech", name, ...(role ? { role } : {}), code: value, from: dateKey(day, sheet.month, sheet.year), to: dateKey(day, sheet.month, sheet.year), lastDay: day };
    }
    flush();
  }
  return out.map(({ lastDay, ...rest }) => rest);
}

/* ── radiographer leave plan (ATVAĻINĀJUMI YYYY): one column per month ──
   "9-15" days 9–15, "29-" from the 29th on (ends in the next month's cell,
   "5" = up to the 5th), "30-07.01." up to 7 January, "PA17-19" with a code
   (plain ranges are "A"). */
const MONTH_NAMES = ["janv", "febr", "mart", "apr", "maij", "jūn", "jūl", "aug", "sept", "okt", "nov", "dec"];

export function parseTechLeave(sheet) {
  const year = Number((String(sheet.name || "").match(/(20\d\d)/) || [])[1]);
  if (!year) return [];
  let headRow = -1, nameCol = -1;
  const monthCol = {};
  for (let r = 0; r < Math.min(15, sheet.values.length) && headRow < 0; r++) {
    (sheet.values[r] || []).forEach((v, c) => {
      const t = cell(sheet, r, c).toLowerCase();
      const m = MONTH_NAMES.findIndex((p) => t.startsWith(p));
      if (m >= 0) monthCol[m + 1] = c;
      if (/vārds|uzvārds/.test(t)) nameCol = c;
    });
    if (Object.keys(monthCol).length >= 12) headRow = r;
    else for (const k of Object.keys(monthCol)) delete monthCol[k];
  }
  if (headRow < 0) return [];
  if (nameCol < 0) nameCol = 1;
  const lastDay = (m, y) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out = [];
  for (let r = headRow + 1; r < sheet.values.length; r++) {
    const raw = cell(sheet, r, nameCol);
    if (!raw || !/[a-zā-ž]/i.test(raw)) continue;
    const { name, role } = techPerson(raw);
    let open = null; // a range still running into the next month
    for (let m = 1; m <= 12; m++) {
      const text = cell(sheet, r, monthCol[m]);
      for (const token of text.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean)) {
        const t = token.match(/^([A-Za-zĀ-ž]*)\s*(\d{1,2})?\s*(-)?\s*(\d{1,2})?(?:\.(\d{1,2})\.?)?$/);
        if (!t) continue;
        const [, letters, a, dash, b, toMonth] = t;
        const code = letters ? letters.toUpperCase() : "A";
        if (open && !letters && ((a && !dash) || (!a && dash && b))) { // "5" or "-5" closes last month's "29-"
          open.to = dateKey(Number(a || b), m, year); out.push(open); open = null; continue;
        }
        if (open) { open.to = dateKey(lastDay(open.m, year), open.m, year); out.push(open); open = null; }
        if (!a) continue;
        const entry = { src: "tech-plan", name, ...(role ? { role } : {}), code, from: dateKey(Number(a), m, year) };
        if (!dash) { out.push({ ...entry, to: entry.from }); continue; }
        if (b && toMonth) {
          const tm = Number(toMonth);
          out.push({ ...entry, to: dateKey(Number(b), tm, tm < m ? year + 1 : year) });
        } else if (b) out.push({ ...entry, to: dateKey(Number(b), m, year) });
        else open = { ...entry, m };
      }
    }
    if (open) out.push({ ...open, to: dateKey(31, 12, year) });
  }
  return out.map(({ m, ...rest }) => rest);
}

const dayNumber = (key) => { const [d, m, y] = key.split(".").map(Number); return Date.UTC(y, m - 1, d) / 864e5; };

// Absences cut at the end of a month (one sheet per month) joined back.
export function joinAbsences(list) {
  const sorted = [...list].sort((a, b) => (a.src + a.name + a.code).localeCompare(b.src + b.name + b.code) || dayNumber(a.from) - dayNumber(b.from));
  const out = [];
  for (const a of sorted) {
    const prev = out[out.length - 1];
    if (prev && prev.src === a.src && prev.name === a.name && prev.code === a.code && dayNumber(a.from) <= dayNumber(prev.to) + 1) {
      if (dayNumber(a.to) > dayNumber(prev.to)) prev.to = a.to;
      continue;
    }
    out.push({ ...a });
  }
  return out.sort((a, b) => dayNumber(a.from) - dayNumber(b.from) || a.name.localeCompare(b.name));
}

const withGroup = (a) => ({ ...a, group: codeGroup(a.code) });

/* ── everything for the app ── */
export function buildRota(docGrid, techGrid) {
  const docMonths = (docGrid?.sheets || []).filter((s) => s.month && s.year)
    .map(parseDocMonth).filter(Boolean)
    .sort((a, b) => a.year - b.year || a.month - b.month);
  for (let i = 1; i < docMonths.length; i++) {
    const p = docMonths[i - 1], c = docMonths[i];
    if ((c.year * 12 + c.month) - (p.year * 12 + p.month) === 1) {
      applyCarryOver(p, c);
      // Painted days at the start continue an absence that ran to month end.
      const lastKey = dateKey(new Date(Date.UTC(p.year, p.month, 0)).getUTCDate(), p.month, p.year);
      for (const lead of c.leads) {
        const before = p.absences.find((a) => a.name === lead.name && a.to === lastKey);
        if (before) c.absences.push({ ...before, section: lead.section, from: dateKey(1, c.month, c.year), to: lead.to });
      }
    }
  }
  const techSheets = techGrid?.sheets || [];
  const techAbsences = techSheets.filter((s) => s.month && s.year && !s.leave).flatMap(parseTechAbsences);
  const leavePlan = techSheets.filter((s) => s.leave).flatMap(parseTechLeave);
  return {
    ok: true,
    months: docMonths.map(({ month, year, days, people, sections }) => ({ month, year, days, people, sections })),
    // What the monthly sheets say (doc + tech), and the radiographers'
    // yearly leave plan separately (it reaches past the monthly sheets).
    absences: joinAbsences(docMonths.flatMap((m) => m.absences).concat(techAbsences)).map(withGroup),
    leavePlan: joinAbsences(leavePlan).map(withGroup)
  };
}
