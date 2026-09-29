/* ── Ziņas galvenei ──────────────────────────────────────────────────────
   Viena vieta visām ziņām: LSM (RSS) un Austrumu slimnīcas jaunumi
   (WordPress JSON). Worker tās savāc reizi 10 minūtēs visiem kopā, tāpēc
   katra ierīce vairs neprasa ārējam rss2json servisam divus RSS atsevišķi.
   Tas pats modulis darbojas arī lokālajā priekšskatījumā (Node fetch). */

export const NEWS_SOURCES = [
  { id: "lsm", cat: "Ziņas", kind: "rss", url: "https://www.lsm.lv/rss/?lang=lv&catid=14", take: 8, maxAgeHours: 36 },
  { id: "lsm-veseliba", cat: "Veselība", kind: "rss", url: "https://www.lsm.lv/rss/?lang=lv&catid=51", take: 5, maxAgeHours: 7 * 24 },
  // Slimnīcas jaunumi iznāk retāk (dažreiz reizi nedēļā), tāpēc tie drīkst būt vecāki.
  { id: "aslimnica", cat: "aslimnica", kind: "wp", url: "https://aslimnica.lv/wp-json/wp/v2/posts?per_page=6&_fields=date_gmt,link,title", take: 3, maxAgeHours: 14 * 24 }
];

const MAX_LSM = 10;
const MIN_HEALTH = 2;
// Slimnīcas ziņa rotācijā ir otrā, tad ik pēc četrām LSM ziņām.
const HOSPITAL_SLOTS = [1, 6, 11];

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’" };

export function decodeEntities(text) {
  return String(text || "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, code) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "";
    }
    const named = ENTITIES[code.toLowerCase()];
    return named === undefined ? all : named;
  });
}

function cleanTitle(value) {
  const raw = String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  // Divreiz: RSS mēdz saturēt &amp;quot; (kodēts divreiz).
  return decodeEntities(decodeEntities(raw.replace(/<[^>]*>/g, " "))).replace(/\s+/g, " ").trim();
}

function cleanLink(value) {
  try {
    const url = new URL(decodeEntities(String(value || "").trim()));
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    ["utm_source", "utm_campaign", "utm_medium"].forEach((key) => url.searchParams.delete(key));
    url.protocol = "https:";
    return url.href;
  } catch (_) {
    return "";
  }
}

function tag(block, name) {
  const m = block.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i"));
  return m ? m[1] : "";
}

export function parseRss(xml) {
  const items = [];
  const re = /<item[\s>][\s\S]*?<\/item>/gi;
  let m;
  while ((m = re.exec(String(xml || ""))) && items.length < 40) {
    const block = m[0];
    items.push({ title: cleanTitle(tag(block, "title")), link: cleanLink(tag(block, "link")), pub: Date.parse(cleanTitle(tag(block, "pubDate"))) || 0 });
  }
  return items;
}

export function parseWp(data) {
  return (Array.isArray(data) ? data : []).slice(0, 40).map((post) => ({
    title: cleanTitle(post && post.title && post.title.rendered),
    link: cleanLink(post && post.link),
    // date_gmt ir bez laika joslas, bet UTC.
    pub: Date.parse(String((post && post.date_gmt) || "") + "Z") || 0
  }));
}

async function fetchSource(source, fetchImpl, timeoutMs) {
  const res = await fetchImpl(source.url, {
    headers: { accept: source.kind === "wp" ? "application/json" : "application/rss+xml, text/xml", "user-agent": "rgapp.page news (+https://rgapp.page)" },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) throw new Error(source.id + " HTTP " + res.status);
  return source.kind === "wp" ? parseWp(await res.json()) : parseRss(await res.text());
}

function identity(item) {
  if (item.link) {
    try { const u = new URL(item.link); return u.host + u.pathname; } catch (_) {}
  }
  return item.title.toLowerCase();
}

/* Savāc visus avotus paralēli. Viena avota kļūme neaptur pārējos. */
export async function collectNews(fetchImpl = fetch, now = Date.now(), timeoutMs = 6000) {
  const status = {};
  const lists = await Promise.all(NEWS_SOURCES.map(async (source) => {
    try {
      const items = await fetchSource(source, fetchImpl, timeoutMs);
      status[source.id] = "ok";
      return items
        .filter((it) => it.title.length > 8 && it.link && (!it.pub || now - it.pub < source.maxAgeHours * 3600000) && it.pub <= now + 3600000)
        .sort((a, b) => b.pub - a.pub)
        .slice(0, source.take)
        .map((it) => ({ cat: source.cat, src: source.id, title: it.title, link: it.link, pub: it.pub }));
    } catch (error) {
      status[source.id] = String((error && error.message) || error).slice(0, 80);
      return [];
    }
  }));
  return { items: mixNews(lists), status, at: now };
}

/* LSM ziņas (bez dublikātiem starp "Ziņas" un "Veselība") pēc laika, un
   slimnīcas ziņas iestarpinātas noteiktās vietās, lai tās neapslīkst. */
export function mixNews(lists) {
  const seen = new Set();
  const unique = (it) => { const k = identity(it); if (seen.has(k)) return false; seen.add(k); return true; };
  const hospital = [];
  const general = [];
  lists.flat().forEach((it) => (it.src === "aslimnica" ? hospital : general).push(it));
  const byTime = general.sort((a, b) => b.pub - a.pub).filter(unique);
  // Vismaz divas veselības ziņas paliek, pat ja vispārējo ziņu ir daudz jaunāku.
  const kept = new Set(byTime.filter((it) => it.src === "lsm-veseliba").slice(0, MIN_HEALTH));
  byTime.forEach((it) => { if (kept.size < MAX_LSM) kept.add(it); });
  const lsm = byTime.filter((it) => kept.has(it));
  const out = lsm.slice();
  hospital.filter(unique).forEach((it, i) => {
    const at = HOSPITAL_SLOTS[i] === undefined ? out.length : Math.min(HOSPITAL_SLOTS[i], out.length);
    out.splice(at, 0, it);
  });
  return out;
}
