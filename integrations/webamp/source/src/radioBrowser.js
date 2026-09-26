// Radio Browser search (https://www.radio-browser.info).
//
// The bundled catalogue in data/radio.json covers a hand-picked set of stations.
// This adds live search across the community database so any station can be
// found, not just the curated ones.
//
// Two constraints shape the queries:
//   * Webamp builds its <audio> element with crossOrigin="anonymous", so a
//     stream must send an Access-Control-Allow-Origin header. The API cannot
//     tell us that, so failing stations are reported when they are tried.
//   * On an https:// page the browser blocks plain http:// streams as mixed
//     content, so `is_https=true` keeps results usable.
//
// The service asks clients to identify themselves with a User-Agent. Browsers
// do not allow setting it, so a Referer is not sent either; requests stay
// anonymous and are limited in volume by the debounce on the search box.

const HOSTS = [
  "https://all.api.radio-browser.info",
  "https://de1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://at1.api.radio-browser.info"
];

const PAGE_SIZE = 60;
const CACHE_TTL = 5 * 60 * 1000;

const cache = new Map();
let preferredHost = 0;

async function request(path) {
  const cached = cache.get(path);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  let lastError = null;
  // Round-robin over the mirrors: they are independent and any one may be down.
  for (let attempt = 0; attempt < HOSTS.length; attempt += 1) {
    const index = (preferredHost + attempt) % HOSTS.length;
    const base = HOSTS[index];
    try {
      const response = await fetch(base + path, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      preferredHost = index;
      cache.set(path, { time: Date.now(), data });
      if (cache.size > 24) {
        cache.delete(cache.keys().next().value);
      }
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "Radio Browser is unavailable");
}

const isUuid = (value) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value ?? "");

// Only https streams can play on a secure page, and only these fields are used.
function normalize(row) {
  const url = row.url_resolved || row.url || "";
  if (!url.startsWith("https:")) {
    return null;
  }
  const name = String(row.name || "").trim();
  if (!name) {
    return null;
  }
  const tags = String(row.tags || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6);
  return {
    uuid: isUuid(row.stationuuid) ? row.stationuuid : "",
    title: name.slice(0, 180),
    url,
    homepage: String(row.homepage || "").startsWith("http") ? String(row.homepage).slice(0, 300) : "",
    // Only https favicons: an http one would be mixed content on an https page.
    favicon: /^https:\/\//i.test(row.favicon || "") ? String(row.favicon).slice(0, 300) : "",
    country: /^[A-Z]{2}$/.test(row.countrycode) ? row.countrycode : "",
    countryName: String(row.country || "").slice(0, 60),
    language: String(row.language || "").split(",")[0].trim().slice(0, 30),
    genre: (tags[0] || "Radio").slice(0, 40),
    tags,
    bitrate: Number(row.bitrate) || 0,
    codec: String(row.codec || "").slice(0, 12),
    votes: Number(row.votes) || 0,
    clicks: Number(row.clickcount) || 0,
    https: true,
    source: "radio-browser"
  };
}

// `order` is one of the database's own sort keys: clickcount, votes, name,
// bitrate. `bitrateMin` and `codec` map straight onto the directory filters
// Winamp offered (Filter > bitrate / format).
export async function searchStations({
  query = "",
  country = "",
  language = "",
  tag = "",
  bitrateMin = 0,
  codec = "",
  order = "clickcount",
  offset = 0,
  limit = PAGE_SIZE
} = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(Math.max(0, offset)),
    hidebroken: "true",
    is_https: "true",
    order,
    reverse: order === "name" ? "false" : "true"
  });
  if (query.trim()) params.set("name", query.trim().slice(0, 80));
  if (country) params.set("countrycode", country);
  if (language) params.set("language", language);
  if (tag) params.set("tag", tag);
  if (bitrateMin > 0) params.set("bitrateMin", String(bitrateMin));
  if (codec) params.set("codec", codec);

  const rows = await request(`/json/stations/search?${params}`);
  const seen = new Set();
  const items = [];
  for (const row of rows) {
    const station = normalize(row);
    // The database has many duplicates sharing a stream.
    if (!station || seen.has(station.url)) {
      continue;
    }
    seen.add(station.url);
    items.push(station);
  }
  return { items, hasMore: rows.length >= limit };
}

export async function topTags(limit = 40) {
  const rows = await request(`/json/tags?limit=${limit}&order=stationcount&reverse=true&hidebackground=true`);
  return rows
    .map((row) => ({ name: String(row.name || "").trim(), count: Number(row.stationcount) || 0 }))
    .filter((tag) => tag.name && /^[a-z0-9 -]+$/i.test(tag.name) && tag.count > 100)
    .slice(0, 24);
}

export async function countries() {
  const rows = await request("/json/countrycodes");
  return rows
    .filter((row) => /^[A-Z]{2}$/.test(row.name) && Number(row.stationcount) > 0)
    .map((row) => ({ code: row.name, count: Number(row.stationcount) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);
}

export async function languages(limit = 60) {
  const rows = await request(`/json/languages?order=stationcount&reverse=true&hidebroken=true&limit=${limit}`);
  return rows
    .map((row) => ({ name: String(row.name || "").trim(), count: Number(row.stationcount) || 0 }))
    .filter((row) => row.name && row.count > 50);
}

// Best-effort popularity ping, as the API asks clients to report playback.
export function reportPlay(station) {
  if (!station?.uuid) {
    return;
  }
  void fetch(`${HOSTS[preferredHost]}/json/url/${station.uuid}`, { method: "GET" }).catch(() => {});
}

export { PAGE_SIZE };
