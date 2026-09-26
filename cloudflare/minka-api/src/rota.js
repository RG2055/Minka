// Reads the raw sheet grids (Apps Script ?fn=grid) into a duty rota:
//   doc  – the radiologist mirror of GRAFIKS.xlsx: attending radiologists,
//          department doctors, emergency radiology (rotation + duties),
//          residents on admission and department duties, department interns;
//   tech – the radiographer schedule: absences only (shifts come from the
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
const cell = (sheet, r, c) => String(((sheet.values[r] || [])[c]) ?? "").trim();
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

export function parseDocMonth(sheet) {
  const header = findDayHeader(sheet);
  if (!header || !sheet.month || !sheet.year) return null;
  const { cols, lastDay } = dayColumns(sheet, header);
  const blocks = docBlocks(sheet, header);
  const days = {};
  const people = [];
  const absences = [];
  for (const { day } of cols) days[dateKey(day, sheet.month, sheet.year)] = {};
  for (const block of blocks) {
    const defaults = {};
    for (const { col } of cols) defaults[col] = columnDefault(sheet, col, block.top, block.bottom);
    for (let r = block.top; r <= block.bottom; r++) {
      const person = personRow(sheet, r);
      if (!person) continue;
      people.push({ ...person, section: block.key });
      for (const { col, day } of cols) {
        const value = cell(sheet, r, col);
        if (!value || value === "-" || value === "?" || value === ".") continue;
        const key = dateKey(day, sheet.month, sheet.year);
        if (/^\d{1,2}$/.test(value)) {
          const hours = Number(value);
          const fg = color(sheet, "fg", r, col), bg = color(sheet, "bg", r, col);
          const entry = { name: person.name, shift: value, ...shiftOf(hours, isBlueTone(fg) || isBlueTone(bg), day === lastDay) };
          if (person.year) entry.year = person.year;
          if (person.hoursNote) entry.hoursNote = person.hoursNote;
          if (block.key === "rezidenti_nodalas" && bg !== defaults[col]) {
            const dept = departmentOf(bg);
            if (dept) entry.dept = dept;
          }
          (days[key][block.key] || (days[key][block.key] = [])).push(entry);
          continue;
        }
        // A code: the absence runs over its merged cells (else that one day).
        const merge = mergeAt(sheet, r, col);
        const lastCol = merge ? merge[1] - 1 + merge[3] - 1 : col;
        const span = cols.filter((c) => c.col >= col && c.col <= lastCol);
        const to = span.length ? span[span.length - 1].day : day;
        absences.push({ src: "doc", name: person.name, section: block.key, code: value, from: key, to: dateKey(to, sheet.month, sheet.year) });
      }
    }
  }
  return { month: sheet.month, year: sheet.year, days, people, absences, sections: blocks.map((b) => ({ key: b.key, label: b.label })) };
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
export function parseTechAbsences(sheet) {
  const header = findDayHeader(sheet);
  if (!header || !sheet.month || !sheet.year) return [];
  const { cols } = dayColumns(sheet, header);
  const out = [];
  for (let r = header.row + 1; r < sheet.values.length; r++) {
    const name = cell(sheet, r, 0);
    if (!name || name.length <= 3 || /^(SLODZE|SUM|KOP[ĒE]JS|DATUMS)/i.test(name) || !/[a-zā-ž]/i.test(name)) continue;
    let run = null;
    const flush = () => { if (run) { out.push(run); run = null; } };
    for (const { col, day } of cols) {
      const value = cell(sheet, r, col);
      const isCode = value && !/^\d+([.,]\d+)?$/.test(value) && value !== "-" ;
      if (isCode && run && run.code === value && run.lastDay === day - 1) { run.to = dateKey(day, sheet.month, sheet.year); run.lastDay = day; continue; }
      flush();
      if (isCode) run = { src: "tech", name, code: value, from: dateKey(day, sheet.month, sheet.year), to: dateKey(day, sheet.month, sheet.year), lastDay: day };
    }
    flush();
  }
  return out.map(({ lastDay, ...rest }) => rest);
}

/* ── everything for the app ── */
export function buildRota(docGrid, techGrid) {
  const docMonths = (docGrid?.sheets || []).filter((s) => s.month && s.year)
    .map(parseDocMonth).filter(Boolean)
    .sort((a, b) => a.year - b.year || a.month - b.month);
  for (let i = 1; i < docMonths.length; i++) {
    const p = docMonths[i - 1], c = docMonths[i];
    if ((c.year * 12 + c.month) - (p.year * 12 + p.month) === 1) applyCarryOver(p, c);
  }
  const techAbsences = (techGrid?.sheets || []).filter((s) => s.month && s.year && !s.leave).flatMap(parseTechAbsences);
  return {
    ok: true,
    months: docMonths.map(({ month, year, days, people, sections }) => ({ month, year, days, people, sections })),
    absences: docMonths.flatMap((m) => m.absences).concat(techAbsences)
  };
}
