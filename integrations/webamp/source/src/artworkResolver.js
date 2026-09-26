// Album artwork for what a station is playing, looked up only when the match
// is unambiguous: the iTunes Search API (no key, CORS-enabled) is asked for
// "artist title" and a result counts only if artist and title both match
// after normalisation. Results — including misses — are cached in
// localStorage so a song is never looked up twice, and lookups are spaced
// out so a chatty station cannot cause a request storm.

const ENDPOINT = "https://itunes.apple.com/search";
const CACHE_KEY = "webamp.artwork.v1";
const CACHE_LIMIT = 200;
const MIN_GAP_MS = 4000;

let cache = null;
let lastLookupAt = 0;

function readCache() {
  if (!cache) {
    try {
      cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") ?? {};
    } catch {
      cache = {};
    }
  }
  return cache;
}

function remember(key, url) {
  const store = readCache();
  store[key] = { url, at: Date.now() };
  const keys = Object.keys(store);
  if (keys.length > CACHE_LIMIT) {
    keys.sort((a, b) => store[a].at - store[b].at).slice(0, keys.length - CACHE_LIMIT).forEach((k) => delete store[k]);
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {}
}

export function normalizeName(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/\((feat|ft|with)\.?[^)]*\)|\[[^\]]*\]/g, "")
    .replace(/\b(feat|ft)\.?\s.*$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

// Titles that are clearly not songs (station slogans, adverts, empty).
export function looksLikeSong(artist, title) {
  const a = normalizeName(artist);
  const t = normalizeName(title);
  if (!a || !t || a === t) return false;
  if (/\b(radio|fm|live|jingle|advert|reklama|station|news|ziņas|top ?40)\b/.test(a) && !/\b(radio)head\b/.test(a)) return false;
  if (t.length < 2 || a.length < 2) return false;
  return true;
}

/**
 * Resolves an artwork URL (600x600) or "" when nothing reliable was found.
 * Returns undefined when the pair does not look like a song at all.
 */
export async function resolveArtwork(artist, title) {
  if (!looksLikeSong(artist, title)) {
    return undefined;
  }
  const key = `${normalizeName(artist)}|${normalizeName(title)}`;
  const cached = readCache()[key];
  if (cached) {
    return cached.url;
  }
  const wait = MIN_GAP_MS - (Date.now() - lastLookupAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastLookupAt = Date.now();

  try {
    const params = new URLSearchParams({ term: `${artist} ${title}`, entity: "song", limit: "5", media: "music" });
    const response = await fetch(`${ENDPOINT}?${params}`, { cache: "force-cache", signal: AbortSignal.timeout(6000) });
    if (!response.ok) {
      return "";
    }
    const data = await response.json();
    const wantArtist = normalizeName(artist);
    const wantTitle = normalizeName(title);
    const hit = (data.results ?? []).find((row) => {
      const rowArtist = normalizeName(row.artistName);
      const rowTitle = normalizeName(row.trackName);
      return rowTitle === wantTitle && (rowArtist === wantArtist || rowArtist.includes(wantArtist) || wantArtist.includes(rowArtist));
    });
    const url = hit?.artworkUrl100 ? hit.artworkUrl100.replace(/100x100bb/, "600x600bb") : "";
    remember(key, url);
    return url;
  } catch {
    return "";
  }
}
