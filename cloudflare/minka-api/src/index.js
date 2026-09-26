function nsTtl(dateStr) {
  const [dd, mm, yy] = dateStr.split(".").map(Number);
  const exp = new Date(Date.UTC(yy, mm - 1, dd + 1, 6, 0, 0));
  const ttl = Math.floor((exp.getTime() - Date.now()) / 1000);
  return Math.max(ttl, 120);
}

function cleanNsDate(value) {
  if (typeof value !== "string") return "";
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 2020 || year > 2100) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

function cleanNsName(value) {
  if (typeof value !== "string") return "";
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.length > 64 || /[<>&"'`\\\u0000-\u001f\u007f]/.test(name)) return "";
  return name;
}

function cleanNsOrder(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const entry of value.slice(0, 16)) {
    const name = cleanNsName(entry);
    const key = name.toLocaleUpperCase("lv-LV");
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

function cleanNightRevision(value, now) {
  if (!value || typeof value !== 'object') return null;
  const order = cleanNsOrder(value.order);
  if (order.length < 2 || order.length > 8 || order.length !== value.order?.length) return null;
  const sh = Number(value.sh), ei = Number(value.ei), from = Number(value.from);
  if (![23, 23.5, 0, 0.5, 1].includes(sh) || ![0, 1, 2].includes(ei)) return null;
  if (!Number.isFinite(from) || from <= 0) return null;
  return { order, sh, ei, from: Math.min(from, now) };
}
function sameNightPlan(a, b) {
  return a && b && a.sh === b.sh && a.ei === b.ei && JSON.stringify(a.order) === JSON.stringify(b.order);
}
function mergeNightHistory(previous, incoming, current, now) {
  const history = [];
  const source = previous?.revisions?.length ? previous.revisions : previous ? [{...previous, from:previous.savedAt}] : [];
  for (const raw of source) { const r=cleanNightRevision(raw,now); if(r)history.push(r); }
  // Retain offline changes after the last server-known revision. Earlier client
  // history cannot overwrite periods already recorded by this server.
  for (const raw of Array.isArray(incoming)?incoming:[]) {
    const r=cleanNightRevision(raw,now);
    if(r && (!history.length || r.from>history[history.length-1].from) && !sameNightPlan(history[history.length-1],r)) history.push(r);
  }
  if(!sameNightPlan(history[history.length-1],current)) history.push({...current,from:now});
  return history;
}

function cleanNsSavedAt(value) {
  const now = Date.now();
  const timestamp = Math.trunc(Number(value));
  if (!Number.isFinite(timestamp) || timestamp <= 0) return now;
  return Math.min(timestamp, now + 5 * 60 * 1000);
}

const BED_CARE_KEY = "bed-care:v1";
const BED_CARE_ITEMS = new Set(["all"]);

function cleanBedCareItem(value) {
  const item = typeof value === "string" ? value.trim() : "";
  return BED_CARE_ITEMS.has(item) ? item : "";
}

function cleanBedCareState(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const items = {};
  for (const item of BED_CARE_ITEMS) {
    const raw = source[item];
    const changedAt = Math.trunc(Number(raw && typeof raw === "object" ? raw.changedAt : raw));
    const rawUpdatedAt = Math.trunc(Number(raw && typeof raw === "object" ? raw.updatedAt : changedAt));
    if (Number.isFinite(changedAt) && changedAt > 0) {
      items[item] = {
        changedAt,
        updatedAt: Number.isFinite(rawUpdatedAt) && rawUpdatedAt > 0 ? rawUpdatedAt : changedAt,
      };
    }
  }
  return items;
}

async function readBedCare(env) {
  try {
    const raw = await env.MINKA_EMOJI.get(BED_CARE_KEY);
    return cleanBedCareState(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
}

const PAIR_TTL_SECONDS = 120;
const PAIR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createPairCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += PAIR_ALPHABET[byte & 31];
  return code;
}

async function hashPairCode(code) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function pairDatabase(env) {
  return typeof env.DB.withSession === "function" ? env.DB.withSession("first-primary") : env.DB;
}

async function ensurePairSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS pair_codes (
      code_hash TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      used_at INTEGER
    )
  `).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS pair_codes_expiry_idx ON pair_codes(expires_at)").run();
}

const SKINS_KEY = "skins:v1";
const SKIN_ART_PREFIX = "skin-art::";
const SKIN_ART_MAX_BYTES = 96 * 1024;
const SKIN_ART_ID_RE = /^[a-f0-9]{32}$/;
const SKIN_PART_RE = /^(img:[\w-]{1,24}|art:[a-f0-9]{32}|grad:[a-z]{1,16}|hue:\d{1,3},\d{1,3},\d{1,3}|txt:\d{1,3},\d{1,3},\d{1,3}|num:\d{1,3},\d{1,3},\d{1,3}|na:(0(\.\d{1,2})?|1)|em:(0(\.\d{1,2})?|1)|emn:[01]|dp:0|fx:[a-z]{1,12}|fxs:[0-3](\.\d{1,2})?|av:1|ad:[a-z0-9-]{1,40},(?:[6-9]\d|1[0-3]\d|140),[lr],-?(?:1000|[0-9]{1,3}),-?(?:1000|[0-9]{1,3}))$/;

function cleanSkinWorker(value) {
  if (typeof value !== "string") return "";
  const worker = value.trim().replace(/\s+/g, " ").toUpperCase();
  return worker.length >= 1 && worker.length <= 64 ? worker : "";
}

function cleanEmojiWorker(value) {
  if (typeof value !== "string") return "";
  const worker = value.trim().replace(/\s+/g, " ");
  if (!worker || worker.length > 64 || /[<>&"'`\\\u0000-\u001f\u007f]/.test(worker)) return "";
  return worker;
}

function cleanEmojiValue(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const emoji = value.trim();
  if (!emoji || emoji.length > 64 || /[<>&"'`\\\u0000-\u001f\u007f]/.test(emoji)) return undefined;
  return emoji;
}

// wf: is a compact, versioned card layout, never CSS or executable markup.
function validCardFacePart(part) {
  if (!part.startsWith("wf:")) return false;
  const a = part.slice(3).split("~");
  const coffee = a.length === 20 && a[0] === "3";
  // v4 adds per-element colours (hex or "-" per element) and a full-tint strength.
  const colored = a.length === 22 && a[0] === "4";
  if (!((a.length === 17 && a[0] === "1") || (a.length === 18 && a[0] === "2") || coffee || colored) || !/^[0-5]$/.test(a[1]) || !/^[a-f0-9]{6}$/.test(a[2])) return false;
  if ((coffee || colored) && (!/^[01]$/.test(a[18]) || !/^[0-2]$/.test(a[19]))) return false;
  const integer = (s, min, max) => /^(0|[1-9]\d{0,2})$/.test(s) && Number(s) >= min && Number(s) <= max;
  if (colored) {
    const look = a[21].split(",");
    if (!/^(-|[a-f0-9]{6})(,(-|[a-f0-9]{6})){9}$/.test(a[20]) || look.length !== 5 || !/^[0-3]$/.test(look[0])
      || !integer(look[1], 0, 360) || !integer(look[2], 0, 100) || !/^[01]$/.test(look[3]) || !/^[0-2]$/.test(look[4])) return false;
  }
  if (!integer(a[3],0,11) || !integer(a[4],0,5) || !integer(a[5],0,100) || !integer(a[6],0,100) || !integer(a[7],100,180)) return false;
  return a.slice(8, (coffee || colored) ? 18 : a.length).every((part, index) => {
    const p = part.split(",");
    return p.length === 4 && integer(p[0],5,95) && integer(p[1],5,95) && integer(p[2],50,index === 0 ? 300 : 170)
      && /^[01]$/.test(p[3]);
  });
}

function cleanSkinValue(value) {
  if (typeof value !== "string" || value.length > 640) return "";
  const skin = value.trim();
  const parts = skin.split(";");
  if (parts.length < 1 || parts.length > 12 || parts.filter(part => part.startsWith("wf:")).length > 1 || parts.filter(part => part.startsWith("dp:")).length > 1
    || parts.some((part) => !SKIN_PART_RE.test(part) && !validCardFacePart(part))) return "";
  return skin;
}

function skinArtId(skin) {
  const match = String(skin || "").match(/(?:^|;)art:([a-f0-9]{32})(?:;|$)/);
  return match ? match[1] : "";
}

function replaceSkinBackground(skin, backgroundPart) {
  const parts = String(skin || "").split(";").filter(Boolean);
  const rest = parts.filter((part) => !/^(?:img|art|grad|hue):/.test(part));
  return [backgroundPart, ...rest].join(";");
}

function createSkinArtId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function ascii(bytes, offset, length) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function webpDimensions(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") return null;
  const type = ascii(bytes, 12, 4);
  if (type === "VP8X") {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
    };
  }
  if (type === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff
    };
  }
  if (type === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10)
    };
  }
  return null;
}

async function readSkins(env, strict = false) {
  try {
    const raw = await env.MINKA_EMOJI.get(SKINS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (strict) throw error;
    return {};
  }
}

// The Apps Script web apps answer only callers that know APPS_SCRIPT_KEY (a
// Script Property there, a secret here), so their URLs alone no longer expose
// names. Without the secret the URL is used as before.
function appsScriptUrl(base, env, params) {
  const url = new URL(base);
  if (env.APPS_SCRIPT_KEY) url.searchParams.set("key", env.APPS_SCRIPT_KEY);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  return url.toString();
}

// Night plans and bed layouts are logged in D1 (night_stats_log) and the
// statistics are computed from it; the sheet keeps receiving a copy as an
// archive, as it did when it was the only store.
async function pushNightStats(env, payload) {
  const row = {
    date: payload.date || "",
    savedAt: payload.savedAt || Date.now(),
    order: Array.isArray(payload.order) ? payload.order : [],
    sh: typeof payload.sh === "number" ? payload.sh : 0,
    ei: typeof payload.ei === "number" ? payload.ei : 0,
    beds: payload.beds && typeof payload.beds === "object" ? payload.beds : {},
    source: "cloudflare"
  };
  try {
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO night_stats_log (date, saved_at, order_json, sh, ei, beds_json, source)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      `).bind(row.date, row.savedAt, JSON.stringify(row.order), row.sh, row.ei, JSON.stringify(row.beds), row.source).run();
    }
  } catch (err) {
    console.error(JSON.stringify({ message: "NS stats log failed", error: String(err) }));
  }
  try {
    if (!env.NS_STATS_URL) return;
    await fetch(appsScriptUrl(env.NS_STATS_URL, env), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(row)
    });
  } catch (err) {
    console.error(JSON.stringify({ message: "NS stats push failed", error: String(err) }));
  }
}

// The sheet script's statistics, unchanged: per date the newest non-empty
// order and bed layout; parts[name][i] counts the i-th place in the order,
// beds[name][bed] counts nights in each bed.
function computeNightStats(rows) {
  const lastOrder = {}, lastOrderT = {}, lastBeds = {}, lastBedsT = {};
  for (const row of rows) {
    const date = row.date, t = Number(row.saved_at) || 0;
    const oj = row.order_json, bj = row.beds_json;
    if (!date) continue;
    if (oj && oj !== "[]" && t >= (lastOrderT[date] || 0)) { lastOrderT[date] = t; lastOrder[date] = oj; }
    if (bj && bj !== "{}" && t >= (lastBedsT[date] || 0)) { lastBedsT[date] = t; lastBeds[date] = bj; }
  }
  const parts = {}, beds = {}, dates = {};
  Object.keys(lastOrder).forEach((d) => { dates[d] = 1; });
  Object.keys(lastBeds).forEach((d) => { dates[d] = 1; });
  let nights = 0;
  Object.keys(dates).forEach((d) => {
    nights++;
    try { JSON.parse(lastOrder[d] || "[]").forEach((n, i) => { if (n) (parts[n] = parts[n] || [0, 0, 0, 0])[i]++; }); } catch (_) {}
    try { const o = JSON.parse(lastBeds[d] || "{}"); Object.keys(o).forEach((bed) => { const n = o[bed]; if (n) (beds[n] = beds[n] || {})[bed] = (beds[n][bed] || 0) + 1; }); } catch (_) {}
  });
  return { ok: true, nights, parts, beds };
}

/* ── Schedule copy ──────────────────────────────────────────────────────
   The schedule itself stays in Google Sheets (colleagues edit it there); the
   Apps Script reply takes ~8 s. The cron (every 2 min) and any request that
   finds the copy older than SCHEDULE_REFRESH_MS fetch it again in the
   background. A reply replaces the copy only when it is complete, so a
   half-saved sheet or a Google outage keeps the last good schedule. */
const SCHEDULE_KEY = "schedule";
const SCHEDULE_REFRESH_MS = 90 * 1000;
const SCHEDULE_MAX_AGE_MS = 30 * 60 * 1000;
const SCHEDULE_LOCK_MS = 45 * 1000;

async function ensureUpstreamCache(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS upstream_cache (
      key TEXT PRIMARY KEY,
      body TEXT,
      hash TEXT,
      fetched_at INTEGER NOT NULL DEFAULT 0,
      changed_at INTEGER NOT NULL DEFAULT 0,
      lock_until INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    )
  `).run();
}

// A reply counts only if it has the radiographers with at least one full
// month of days that actually lists people.
function validSchedule(data) {
  if (!data || typeof data !== "object" || data.success !== true) return false;
  const tech = data.radiographers;
  if (!tech || typeof tech !== "object" || Array.isArray(tech)) return false;
  const months = Object.values(tech).filter(Array.isArray);
  if (!months.some((days) => days.length >= 28 && days.some((d) => d && Array.isArray(d.workers) && d.workers.length))) return false;
  const docs = data.radiologists;
  return docs === undefined || (docs && typeof docs === "object" && !Array.isArray(docs));
}

async function scheduleHash(data) {
  const text = JSON.stringify([data.radiographers, data.radiologists ?? null]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function readScheduleSnapshot(env) {
  const row = await env.DB.prepare("SELECT body, fetched_at FROM upstream_cache WHERE key = ?1").bind(SCHEDULE_KEY).first();
  if (!row || !row.body) return null;
  const data = JSON.parse(row.body);
  if (!validSchedule(data)) return null;
  return { data, age: Math.max(0, Math.round((Date.now() - Number(row.fetched_at || 0)) / 1000)), fetchedAt: Number(row.fetched_at || 0) };
}

async function refreshSchedule(env) {
  if (!env.SOURCE_URL || !env.DB) return false;
  const db = env.DB;
  await ensureUpstreamCache(db);
  const now = Date.now();
  // One refresh at a time across cron and requests, so Google is not asked
  // by every open device at once; a crashed refresh frees the lock in 45 s.
  const claim = await db.prepare(`
    INSERT INTO upstream_cache (key, lock_until) VALUES (?1, ?2)
    ON CONFLICT(key) DO UPDATE SET lock_until = excluded.lock_until WHERE upstream_cache.lock_until < ?3
  `).bind(SCHEDULE_KEY, now + SCHEDULE_LOCK_MS, now).run();
  if (Number(claim?.meta?.changes || 0) !== 1) return false;
  try {
    const upstream = await fetch(appsScriptUrl(env.SOURCE_URL, env), { headers: { accept: "application/json" }, signal: AbortSignal.timeout(40000) });
    if (!upstream.ok) throw new Error("upstream status " + upstream.status);
    const text = await upstream.text();
    const data = JSON.parse(text);
    if (!validSchedule(data)) throw new Error("incomplete schedule reply");
    const hash = await scheduleHash(data);
    const done = Date.now();
    await db.prepare(`
      UPDATE upstream_cache
      SET body = ?2, hash = ?3, fetched_at = ?4,
          changed_at = CASE WHEN hash IS ?3 THEN changed_at ELSE ?4 END,
          lock_until = 0, last_error = NULL
      WHERE key = ?1
    `).bind(SCHEDULE_KEY, text, hash, done).run();
    return true;
  } catch (error) {
    console.error(JSON.stringify({ message: "Schedule refresh failed", error: String(error) }));
    await db.prepare("UPDATE upstream_cache SET lock_until = 0, last_error = ?2 WHERE key = ?1")
      .bind(SCHEDULE_KEY, String(error).slice(0, 200)).run().catch(() => {});
    return false;
  }
}

async function serveScheduleSnapshot(env, ctx, knownCarryovers) {
  if (!env.DB || !ctx || typeof ctx.waitUntil !== "function") return null;
  try {
    // A missing table (first run) or unreadable row counts as "no copy yet".
    let snap = await readScheduleSnapshot(env).catch(() => null);
    if (!snap || Date.now() - snap.fetchedAt > SCHEDULE_MAX_AGE_MS) {
      // No copy yet, or the cron has not run for a while: give Google a
      // normal reply time to refresh it; an old copy still beats an error.
      const refresh = refreshSchedule(env);
      ctx.waitUntil(refresh);
      await Promise.race([refresh, new Promise((resolve) => setTimeout(resolve, 15000))]);
      snap = (await readScheduleSnapshot(env).catch(() => null)) || snap;
      if (!snap) return null;
    } else if (Date.now() - snap.fetchedAt > SCHEDULE_REFRESH_MS) {
      ctx.waitUntil(refreshSchedule(env));
    }
    return { body: { ...snap.data, knownCarryovers }, age: snap.age };
  } catch (error) {
    console.error(JSON.stringify({ message: "Schedule copy unavailable", error: String(error) }));
    return null;
  }
}

/* ── Bolus ────────────────────────────────────────────────────────────────
   The injector change log, formerly the Apps Script "Bolus" sheet. Reads and
   writes keep that script's exact rules and reply shape, so the client only
   changes where it asks. Every write is also sent to the sheet in the
   background, which stays a complete archive (and a way back). */
const BOLUS_ROOMS = ["ge", "philips"];

function bolusRoom(value) {
  const raw = String(value || "").toLowerCase().trim();
  if (raw.indexOf("ge") !== -1) return "ge";
  if (raw.indexOf("philips") !== -1 || raw.indexOf("ph") !== -1) return "philips";
  return "";
}

function bolusTs(value) {
  const ts = Math.floor(Number(value));
  if (!Number.isFinite(ts)) return null;
  // Past entries may be corrected later; only a practical future guard.
  if (ts < Date.UTC(2019, 11, 31) || ts > Date.now() + 366 * 86400000) return null;
  return Math.floor(ts / 60000) * 60000;
}

function bolusName(value) {
  const text = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  if (!text || text.length > 64) return "";
  return text.replace(/[<>&`\u0000-\u001f\u007f]/g, "").trim();
}

function bolusConc(value) {
  const match = String(value == null ? "" : value).match(/(?:^|\D)(300|370)(?:\D|$)/);
  return match ? Number(match[1]) : null;
}
function bolusContrastMl(value) { const ml = Number(value); return ml === 200 || ml === 500 ? ml : null; }
function bolusNaclMl(value) { const ml = Number(value); return ml === 500 || ml === 1000 ? ml : null; }

function bolusMedia(row) {
  if (!row.left_conc && !row.nacl_ml && !row.right_conc) return null;
  return {
    left: { enabled: !!(row.left_conc && row.left_ml), concentration: row.left_conc || 370, volumeMl: row.left_ml || 500 },
    // 500 for a NaCl that was not fitted: the value the live sheet script
    // has always answered with (the client only shows a fitted volume).
    nacl: { enabled: !!row.nacl_ml, volumeMl: row.nacl_ml || 500 },
    right: { enabled: !!(row.right_conc && row.right_ml), concentration: row.right_conc || 300, volumeMl: row.right_ml || 500 }
  };
}

async function readBolus(env) {
  const rows = await env.DB.prepare(
    "SELECT room, ts, name, left_conc, left_ml, nacl_ml, right_conc, right_ml FROM bolus_entries ORDER BY ts DESC, id ASC"
  ).all();
  const out = { ge: { changedAt: null, history: [] }, philips: { changedAt: null, history: [] } };
  for (const row of rows.results || []) {
    const room = out[row.room];
    if (!room) continue;
    room.history.push({ ts: Number(row.ts), name: String(row.name || "Anonīms"), media: bolusMedia(row) });
    if (!room.changedAt || row.ts > room.changedAt) room.changedAt = Number(row.ts);
  }
  return out;
}

// Keeps the sheet archive complete; failures are logged, never shown.
function mirrorBolusToSheet(env, ctx, params) {
  if (!env.BOLUS_SHEET_URL || !ctx || typeof ctx.waitUntil !== "function") return;
  const url = appsScriptUrl(env.BOLUS_SHEET_URL, env, params);
  ctx.waitUntil((async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
        const body = r.ok ? await r.json().catch(() => null) : null;
        if (body && body.ok) return;
      } catch (_) {}
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
    console.error(JSON.stringify({ message: "Bolus sheet mirror failed", action: params.action }));
  })());
}

async function handleBolusPost(env, ctx, body) {
  const action = String(body?.action || "");
  const room = bolusRoom(body?.room);
  if (!room) return { status: 400, body: { ok: false, error: "invalid_room" } };
  const now = Date.now();
  if (action === "write") {
    const ts = bolusTs(body.ts);
    if (!ts) return { status: 400, body: { ok: false, error: "invalid_bolus" } };
    const who = bolusName(body.name) || "Anonīms";
    const leftConc = bolusConc(body.leftConc), leftMl = bolusContrastMl(body.leftMl);
    const naclMl = bolusNaclMl(body.naclMl);
    const rightConc = bolusConc(body.rightConc), rightMl = bolusContrastMl(body.rightMl);
    const left = leftConc && leftMl, right = rightConc && rightMl;
    await env.DB.prepare(`
      INSERT INTO bolus_entries (room, ts, name, left_conc, left_ml, nacl_ml, right_conc, right_ml, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `).bind(room, ts, who, left ? leftConc : null, left ? leftMl : null, naclMl, right ? rightConc : null, right ? rightMl : null, now).run();
    const params = { action: "write", room, ts: String(body.ts), name: who };
    if (left) { params.leftConc = String(leftConc); params.leftMl = String(leftMl); }
    if (naclMl) params.naclMl = String(naclMl);
    if (right) { params.rightConc = String(rightConc); params.rightMl = String(rightMl); }
    mirrorBolusToSheet(env, ctx, params);
    return { status: 200, body: { ok: true } };
  }
  if (action === "edit_entry" || action === "delete_entry") {
    const matchTs = bolusTs(action === "edit_entry" ? (body.oldTs || body.ts) : body.ts);
    const nextTs = bolusTs(body.ts);
    if (!matchTs || !nextTs) return { status: 400, body: { ok: false, error: "invalid_timestamp" } };
    // The sheet matched the newest row of that room and minute; so does this.
    const row = await env.DB.prepare("SELECT id, name FROM bolus_entries WHERE room = ?1 AND ts = ?2 ORDER BY id DESC LIMIT 1")
      .bind(room, matchTs).first();
    if (!row) return { status: 404, body: { ok: false, error: "not_found" } };
    if (action === "delete_entry") {
      await env.DB.prepare("DELETE FROM bolus_entries WHERE id = ?1").bind(row.id).run();
      mirrorBolusToSheet(env, ctx, { action, room, ts: String(body.ts) });
    } else {
      const who = bolusName(body.name) || bolusName(row.name) || "Anonīms";
      await env.DB.prepare("UPDATE bolus_entries SET ts = ?2, name = ?3, updated_at = ?4 WHERE id = ?1").bind(row.id, nextTs, who, now).run();
      mirrorBolusToSheet(env, ctx, { action, room, ts: String(body.ts), oldTs: String(body.oldTs || body.ts), name: who });
    }
    return { status: 200, body: { ok: true, action } };
  }
  return { status: 400, body: { ok: false, error: "invalid_action" } };
}

/* ── Sign-in ──────────────────────────────────────────────────────────────
   The team password is exchanged once for a random per-device token (90 days,
   extended while the device is used); only its hash is stored. A device that
   still holds the password itself (signed in before this change) keeps
   working and is quietly given its own token on the next schedule load, so a
   later password change signs nobody out. Wrong passwords are limited per
   address. "Sign out every device": DELETE FROM sessions. */
const SESSION_DAYS = 90;
const SESSION_EXTEND_BELOW_DAYS = 60;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;
const SESSION_CACHE = new Map();

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "s1." + btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time comparison of two strings (compared as their hashes, so the
// lengths never leak either).
async function sameSecret(a, b) {
  const [x, y] = await Promise.all([sha256Hex(String(a)), sha256Hex(String(b))]);
  const ex = new TextEncoder().encode(x), ey = new TextEncoder().encode(y);
  if (crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(ex, ey);
  let diff = 0;
  for (let i = 0; i < ex.length; i++) diff |= ex[i] ^ ey[i];
  return diff === 0;
}

async function createSession(env, kind) {
  if (!env.DB) return env.APP_PASSWORD;
  const token = randomToken();
  const now = Date.now();
  await env.DB.prepare("INSERT INTO sessions (token_hash, kind, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)")
    .bind(await sha256Hex(token), kind, now, now + SESSION_DAYS * 86400000).run();
  return token;
}

function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
}

async function loginBlocked(env, ip) {
  if (!env.DB) return false;
  const row = await env.DB.prepare("SELECT window_start, count FROM login_failures WHERE ip = ?1").bind(ip).first().catch(() => null);
  return !!row && Date.now() - Number(row.window_start) < LOGIN_WINDOW_MS && Number(row.count) >= LOGIN_MAX_FAILURES;
}

async function noteLoginFailure(env, ip) {
  if (!env.DB) return;
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO login_failures (ip, window_start, count) VALUES (?1, ?2, 1)
    ON CONFLICT(ip) DO UPDATE SET
      count = CASE WHEN ?2 - login_failures.window_start >= ?3 THEN 1 ELSE login_failures.count + 1 END,
      window_start = CASE WHEN ?2 - login_failures.window_start >= ?3 THEN ?2 ELSE login_failures.window_start END
  `).bind(ip, now, LOGIN_WINDOW_MS).run().catch(() => {});
}

// "session" | "password" (a device from before per-device tokens) | "".
async function authKind(request, env) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return "";
  const token = header.slice(7);
  if (!token) return "";
  if (token.startsWith("s1.") && env.DB) {
    const now = Date.now();
    const cached = SESSION_CACHE.get(token);
    if (cached && cached > now) return "session";
    try {
      const hash = await sha256Hex(token);
      const row = await env.DB.prepare("SELECT expires_at FROM sessions WHERE token_hash = ?1").bind(hash).first();
      if (!row || Number(row.expires_at) <= now) return "";
      if (Number(row.expires_at) - now < SESSION_EXTEND_BELOW_DAYS * 86400000) {
        await env.DB.prepare("UPDATE sessions SET expires_at = ?2 WHERE token_hash = ?1").bind(hash, now + SESSION_DAYS * 86400000).run();
      }
      if (SESSION_CACHE.size > 200) SESSION_CACHE.clear();
      SESSION_CACHE.set(token, now + 5 * 60000);
      return "session";
    } catch (_e) {
      return "";
    }
  }
  if (typeof env.APP_PASSWORD === "string" && env.APP_PASSWORD.length > 0 && await sameSecret(token, env.APP_PASSWORD)) return "password";
  return "";
}

const worker = {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(refreshSchedule(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { headers: cors(request) });
    }

    const skinAssetMatch = url.pathname.match(/^\/skin-assets\/([a-f0-9]{32})\.webp$/);
    if (skinAssetMatch && method === "GET") {
      const image = await env.MINKA_EMOJI.get(SKIN_ART_PREFIX + skinAssetMatch[1], { type: "arrayBuffer", cacheTtl: 86400 });
      if (!image) return new Response("Not found", { status: 404 });
      const headers = new Headers(cors(request));
      headers.set("content-type", "image/webp");
      headers.set("cache-control", "public, max-age=31536000, immutable");
      headers.set("etag", '"' + skinAssetMatch[1] + '"');
      headers.set("x-content-type-options", "nosniff");
      return new Response(image, { headers });
    }

    if (url.pathname === "/api/login" && method === "POST") {
      const ip = clientIp(request);
      if (await loginBlocked(env, ip)) {
        return json(request, { ok: false, error: "Too many attempts, try again in a few minutes" }, 429);
      }
      const body = await readJson(request);
      const valid = typeof env.APP_PASSWORD === "string" && env.APP_PASSWORD.length > 0
        && !!body && typeof body.password === "string" && await sameSecret(body.password, env.APP_PASSWORD);
      if (!valid) {
        await noteLoginFailure(env, ip);
        return json(request, { ok: false, error: "Wrong password" }, 401);
      }
      if (env.DB) await env.DB.prepare("DELETE FROM login_failures WHERE ip = ?1").bind(ip).run().catch(() => {});
      return json(request, { ok: true, token: await createSession(env, "login") });
    }

    if (url.pathname === "/api/pair/claim" && method === "POST") {
      const body = await readJson(request);
      const code = String(body?.code || "").trim();
      if (!/^[A-Z2-9]{8}$/.test(code)) {
        return json(request, { ok: false, error: "Invalid or expired pairing code" }, 410);
      }

      const db = pairDatabase(env);
      try {
        await ensurePairSchema(db);
      } catch (error) {
        console.error(JSON.stringify({ message: "Pairing storage unavailable", error: String(error) }));
        return json(request, { ok: false, error: "Pairing storage unavailable" }, 500);
      }
      const now = Math.floor(Date.now() / 1000);
      let result;
      try {
        const codeHash = await hashPairCode(code);
        result = await db.prepare(`
          UPDATE pair_codes
          SET used_at = ?1
          WHERE code_hash = ?2
            AND used_at IS NULL
            AND expires_at >= ?1
        `).bind(now, codeHash).run();
      } catch (error) {
        console.error(JSON.stringify({ message: "Pairing claim failed", error: String(error) }));
        return json(request, { ok: false, error: "Pairing claim failed" }, 500);
      }

      if (Number(result?.meta?.changes || 0) !== 1) {
        return json(request, { ok: false, error: "Invalid or expired pairing code" }, 410);
      }

      return json(request, { ok: true, token: await createSession(env, "pair") });
    }

    const auth = await authKind(request, env);
    if (!auth) {
      return json(request, { ok: false, error: "Unauthorized" }, 401);
    }

    if (url.pathname === "/api/pair/new" && method === "POST") {
      const db = pairDatabase(env);
      await ensurePairSchema(db);
      const now = Math.floor(Date.now() / 1000);
      const code = createPairCode();
      const codeHash = await hashPairCode(code);
      const expiresAt = now + PAIR_TTL_SECONDS;

      await db.prepare("DELETE FROM pair_codes WHERE expires_at < ?1 OR used_at IS NOT NULL").bind(now).run();
      await db.prepare("INSERT INTO pair_codes (code_hash, expires_at, used_at) VALUES (?1, ?2, NULL)").bind(codeHash, expiresAt).run();

      return json(request, { ok: true, code, ttl: PAIR_TTL_SECONDS, expiresAt });
    }

    if (url.pathname === "/api/me" && method === "GET") {
      return json(request, { ok: true });
    }

    if (url.pathname === "/api/birthdays" && method === "GET") {
      let birthdays = [];
      try {
        const parsed = JSON.parse(env.BIRTHDAYS_JSON || "[]");
        const list = Array.isArray(parsed) ? parsed : parsed.birthdays;
        birthdays = Array.isArray(list) ? list.map((b) => {
          const d = String((b && (b.d || b.date || b.day)) || "").trim();
          const dm = d.match(/^(\d{1,2})\.(\d{1,2})(?:\.\d{4})?$/);
          const name = String((b && b.name) || "").trim();
          if (!dm || !name) return null;
          return { d: dm[1].padStart(2, "0") + "." + dm[2].padStart(2, "0"), name };
        }).filter(Boolean) : [];
      } catch (err) {
        birthdays = [];
      }
      return json(request, { ok: true, birthdays });
    }

    if (url.pathname === "/api/phones" && method === "GET") {
      const rows = await env.DB.prepare(
        "SELECT id, name, phone, cat, sub FROM phones WHERE hidden = 0 ORDER BY name ASC"
      ).all();
      return json(request, rows.results || []);
    }

    if (url.pathname === "/api/phones" && method === "POST") {
      const body = await readJson(request);
      if (!body?.name || !body?.phone) {
        return json(request, { ok: false, error: "name and phone required" }, 400);
      }
      await env.DB.prepare(
        "INSERT INTO phones (name, phone, cat, sub) VALUES (?, ?, ?, ?)"
      ).bind(body.name, body.phone, body.cat || "", body.sub || "").run();
      return json(request, { ok: true });
    }

    // Emoji live in D1 (one query, read-your-write) instead of one KV read per
    // person plus a list() on every poll. KV keeps a mirror of each write so a
    // rollback to the old worker still finds every emoji.
    if (url.pathname === "/api/emoji" && method === "GET") {
      const worker = cleanEmojiWorker(url.searchParams.get("worker"));
      if (worker) {
        const one = await env.DB.prepare("SELECT emoji FROM emoji_store WHERE worker = ?1").bind(worker).first();
        return json(request, { worker, emoji: cleanEmojiValue(one && one.emoji) || null });
      }
      const rows = await env.DB.prepare("SELECT worker, emoji FROM emoji_store").all();
      const out = Object.create(null);
      for (const row of rows.results || []) {
        const name = cleanEmojiWorker(row.worker);
        const emoji = cleanEmojiValue(row.emoji);
        if (name && emoji) out[name] = emoji;
      }
      return json(request, out);
    }

    if (url.pathname === "/api/emoji" && method === "POST") {
      const body = await readJson(request);
      const worker = cleanEmojiWorker(body?.worker);
      const emoji = cleanEmojiValue(body?.emoji);
      if (!worker) {
        return json(request, { ok: false, error: "invalid worker" }, 400);
      }
      if (emoji === undefined) {
        return json(request, { ok: false, error: "invalid emoji" }, 400);
      }
      if (!emoji) {
        await env.DB.prepare("DELETE FROM emoji_store WHERE worker = ?1").bind(worker).run();
        ctx.waitUntil(env.MINKA_EMOJI.delete(worker));
        return json(request, { ok: true, removed: true });
      }
      await env.DB.prepare(`
        INSERT INTO emoji_store (worker, emoji, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)
        ON CONFLICT(worker) DO UPDATE SET emoji = excluded.emoji, updated_at = excluded.updated_at
      `).bind(worker, emoji).run();
      ctx.waitUntil(env.MINKA_EMOJI.put(worker, emoji));
      return json(request, { ok: true });
    }

    if (url.pathname === "/api/skin-art" && method === "POST") {
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > SKIN_ART_MAX_BYTES + 48 * 1024) {
        return json(request, { ok: false, error: "image too large" }, 413);
      }

      let form;
      try {
        form = await request.formData();
      } catch (_error) {
        return json(request, { ok: false, error: "invalid form data" }, 400);
      }
      const workerName = cleanSkinWorker(form.get("worker"));
      const image = form.get("image");
      if (!workerName) {
        return json(request, { ok: false, error: "worker must be 1-64 characters" }, 400);
      }
      if (!image || typeof image.arrayBuffer !== "function" || image.type !== "image/webp") {
        return json(request, { ok: false, error: "384x384 WebP image required" }, 400);
      }
      if (image.size < 32 || image.size > SKIN_ART_MAX_BYTES) {
        return json(request, { ok: false, error: "image must be at most 96 KB" }, 413);
      }

      const imageBuffer = await image.arrayBuffer();
      const dimensions = webpDimensions(imageBuffer);
      const isCurrentSquare = dimensions && dimensions.width === 384 && dimensions.height === 384;
      const isLegacyWide = dimensions && dimensions.width === 480 && dimensions.height === 270;
      if (!isCurrentSquare && !isLegacyWide) {
        return json(request, { ok: false, error: "image must be exactly 384x384" }, 400);
      }

      const skins = await readSkins(env, true);
      const previousSkin = skins[workerName] || "";
      const previousArtId = skinArtId(previousSkin);
      const artId = createSkinArtId();
      const artKey = SKIN_ART_PREFIX + artId;
      const nextSkin = cleanSkinValue(replaceSkinBackground(previousSkin, "art:" + artId));
      if (!nextSkin) return json(request, { ok: false, error: "invalid resulting skin" }, 400);

      await env.MINKA_EMOJI.put(artKey, imageBuffer, { metadata: { worker: workerName, contentType: "image/webp" } });
      try {
        skins[workerName] = nextSkin;
        await env.MINKA_EMOJI.put(SKINS_KEY, JSON.stringify(skins));
      } catch (error) {
        await env.MINKA_EMOJI.delete(artKey);
        throw error;
      }
      if (previousArtId && previousArtId !== artId) {
        await env.MINKA_EMOJI.delete(SKIN_ART_PREFIX + previousArtId);
      }
      return json(request, {
        ok: true,
        worker: workerName,
        skin: nextSkin,
        artId,
        asset: "/skin-assets/" + artId + ".webp"
      });
    }

    if (url.pathname === "/api/skins" && method === "GET") {
      return json(request, await readSkins(env));
    }

    if (url.pathname === "/api/skins" && method === "POST") {
      const body = await readJson(request);
      const worker = cleanSkinWorker(body?.worker);
      if (!worker) {
        return json(request, { ok: false, error: "worker must be 1-64 characters" }, 400);
      }
      if (!Object.prototype.hasOwnProperty.call(body || {}, "skin")) {
        return json(request, { ok: false, error: "skin required" }, 400);
      }

      const skin = body.skin === null ? null : cleanSkinValue(body.skin);
      if (body.skin !== null && !skin) {
        return json(request, { ok: false, error: "invalid skin" }, 400);
      }

      const skins = await readSkins(env, true);
      const previousArtId = skinArtId(skins[worker]);
      const nextArtId = skinArtId(skin);
      if (skin === null) delete skins[worker];
      else skins[worker] = skin;
      await env.MINKA_EMOJI.put(SKINS_KEY, JSON.stringify(skins));
      if (previousArtId && previousArtId !== nextArtId) {
        await env.MINKA_EMOJI.delete(SKIN_ART_PREFIX + previousArtId);
      }
      return json(request, { ok: true, worker, skin });
    }

    if (url.pathname === "/api/bed-care" && method === "GET") {
      return json(request, { ok: true, items: await readBedCare(env) });
    }

    if (url.pathname === "/api/bed-care" && method === "POST") {
      const body = await readJson(request, 8 * 1024);
      const item = cleanBedCareItem(body?.item);
      if (!item) return json(request, { ok: false, error: "invalid item" }, 400);

      const now = Date.now();
      const requestedAt = Math.trunc(Number(body?.changedAt));
      const changedAt = Number.isFinite(requestedAt) && requestedAt > 0
        ? Math.min(requestedAt, now + 5 * 60 * 1000)
        : now;
      const items = await readBedCare(env);
      items[item] = { changedAt, updatedAt: now };
      await env.MINKA_EMOJI.put(BED_CARE_KEY, JSON.stringify(items));
      return json(request, { ok: true, items });
    }

    if (url.pathname === "/api/ns-order" && method === "GET") {
      const date = cleanNsDate(url.searchParams.get("date"));
      if (!date) return json(request, { ok: false, error: "valid date required" }, 400);
      const val = await env.MINKA_EMOJI.get("ns::" + date);
      return json(request, val ? JSON.parse(val) : {});
    }

    if (url.pathname === "/api/ns-order" && method === "POST") {
      const body = await readJson(request, 64 * 1024);
      const date = cleanNsDate(body?.date);
      if (!date) return json(request, { ok: false, error: "valid date required" }, 400);

      const previousRaw = await env.MINKA_EMOJI.get("ns::" + date);
      const previous = previousRaw ? JSON.parse(previousRaw) : null;
      if (previous?.savedAt > Number(body.savedAt || 0)) return json(request, {ok:false,error:"Newer night plan exists"}, 409);
      const now = Date.now();
      const current = cleanNightRevision({...body,from:now},now);
      if(!current) return json(request,{ok:false,error:"Invalid night plan"},400);
      const revisions=mergeNightHistory(previous,body.revisions,current,now);
      if(revisions.length>64) return json(request,{ok:false,error:"Night history limit reached"},409);
      // Retain authenticated plan history for the model's bounded lookback.
      const ttl = nsTtl(date) + 42 * 86400;
      const orderPayload = {
        order: current.order,
        sh: current.sh,
        ei: current.ei,
        revisions,
        mode: body.mode === "freq" ? "freq" : "fatigue",
        savedAt: cleanNsSavedAt(body.savedAt)
      };

      await env.MINKA_EMOJI.put(
        "ns::" + date,
        JSON.stringify(orderPayload),
        { expirationTtl: ttl }
      );

      ctx.waitUntil(pushNightStats(env, {
        date,
        savedAt: orderPayload.savedAt,
        order: orderPayload.order,
        sh: orderPayload.sh,
        ei: orderPayload.ei
      }));

      return json(request, { ok: true });
    }

    if (url.pathname === "/api/ns-rooms" && method === "GET") {
      const date = cleanNsDate(url.searchParams.get("date"));
      if (!date) return json(request, { ok: false, error: "valid date required" }, 400);
      const val = await env.MINKA_EMOJI.get("nsrooms::" + date);
      return json(request, val ? JSON.parse(val) : {});
    }

    if (url.pathname === "/api/ns-rooms" && method === "POST") {
      const body = await readJson(request, 16 * 1024);
      const date = cleanNsDate(body?.date);
      if (!date) return json(request, { ok: false, error: "valid date required" }, 400);

      const beds = (body.beds && typeof body.beds === "object") ? body.beds : {};
      const ttl = nsTtl(date);

      const roomsPayload = {
        beds: {
          main_left_top: cleanNsName(beds.main_left_top),
          main_left_bottom: cleanNsName(beds.main_left_bottom),
          main_right_top: cleanNsName(beds.main_right_top),
          nmp_center: cleanNsName(beds.nmp_center)
        },
        savedAt: cleanNsSavedAt(body.savedAt)
      };

      await env.MINKA_EMOJI.put(
        "nsrooms::" + date,
        JSON.stringify(roomsPayload),
        { expirationTtl: ttl }
      );

      ctx.waitUntil(pushNightStats(env, {
        date,
        savedAt: roomsPayload.savedAt,
        beds: roomsPayload.beds
      }));

      return json(request, { ok: true });
    }


    if (url.pathname === "/api/ns-stats" && method === "GET") {
      try {
        const rows = await env.DB.prepare(
          "SELECT date, saved_at, order_json, beds_json FROM night_stats_log ORDER BY id"
        ).all();
        return json(request, computeNightStats(rows.results || []));
      } catch (err) {
        console.error(JSON.stringify({ message: "Night stats from D1 failed", error: String(err) }));
      }
      // Fallback while D1 is unavailable: the sheet script computes the same.
      if (!env.NS_STATS_URL) {
        return json(request, { ok: false, error: "NS_STATS_URL missing" }, 500);
      }
      try {
        const upstream = await fetch(appsScriptUrl(env.NS_STATS_URL, env), {
          method: "GET",
          headers: { accept: "application/json" }
        });
        const text = await upstream.text();
        if (!upstream.ok) {
          return json(request, { ok: false, error: "Upstream night stats fetch failed", status: upstream.status }, 502);
        }
        try {
          return json(request, JSON.parse(text));
        } catch (err) {
          return json(request, { ok: false, error: "Upstream night stats returned invalid JSON" }, 502);
        }
      } catch (err) {
        return json(request, { ok: false, error: "Night stats proxy failed" }, 502);
      }
    }

    if (url.pathname === "/api/schedule" && method === "GET") {
      if (!env.SOURCE_URL) {
        return json(request, { ok: false, error: "SOURCE_URL missing" }, 500);
      }
      let knownCarryovers;
      try {
        knownCarryovers = JSON.parse(env.KNOWN_CARRYOVERS_JSON || 'null');
        if (!knownCarryovers || typeof knownCarryovers !== 'object' || Array.isArray(knownCarryovers)) throw new Error();
      } catch (_) {
        return json(request, { ok: false, error: "Schedule exceptions unavailable" }, 503);
      }
      // Serve the last good copy of the Apps Script reply (refreshed by the
      // cron and in the background), so a reload no longer waits ~8 s on
      // Google. Any problem with the copy falls through to the live fetch.
      // A device still signed in with the password itself gets its own token
      // here (the schedule is loaded once per start and every 2 minutes).
      const upgrade = auth === "password" && env.DB
        ? { "x-minka-token": await createSession(env, "upgrade") } : {};
      const cached = await serveScheduleSnapshot(env, ctx, knownCarryovers);
      if (cached) return json(request, cached.body, 200, { "x-schedule-age": String(cached.age), ...upgrade });
      const upstream = await fetch(appsScriptUrl(env.SOURCE_URL, env), {
        method: "GET",
        headers: { accept: "application/json" }
      });
      if (!upstream.ok) {
        return json(request, { ok: false, error: "Upstream schedule fetch failed", status: upstream.status }, 502);
      }
      const data = await upstream.json();
      return json(request, { ...data, knownCarryovers }, 200, upgrade);
    }

    if (url.pathname === "/api/bolus" && method === "GET") {
      return json(request, await readBolus(env));
    }

    if (url.pathname === "/api/bolus" && method === "POST") {
      const body = await readJson(request, 8 * 1024);
      if (!body) return json(request, { ok: false, error: "invalid body" }, 400);
      const result = await handleBolusPost(env, ctx, body);
      return json(request, result.body, result.status);
    }

    if (url.pathname === "/api/residents" && method === "GET") {
      if (!env.RESIDENTS_SOURCE_URL) {
        return json(request, { ok: false, error: "RESIDENTS_SOURCE_URL missing" }, 500);
      }
      const upstream = await fetch(appsScriptUrl(env.RESIDENTS_SOURCE_URL, env), {
        method: "GET",
        headers: { accept: "application/json" }
      });
      if (!upstream.ok) {
        return json(request, { ok: false, error: "Upstream residents fetch failed", status: upstream.status }, 502);
      }
      const data = await upstream.json();
      return json(request, data);
    }

    return json(request, { ok: false, error: "Not found" }, 404);
  }
};

export default worker;


function cors(request) {
  const origin = request.headers.get("origin") || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-expose-headers": "x-minka-token",
    // Without this the browser re-sends the OPTIONS preflight before nearly
    // every authorised call, which was half of this worker's traffic.
    "access-control-max-age": "86400",
    "vary": "Origin"
  };
}

function json(request, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors(request),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

async function readJson(request, maxBytes = 64 * 1024) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > maxBytes || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('body too large');
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (_e) {
    return null;
  } finally {
    reader.releaseLock();
  }
}
