// Lācītis music search: the Lācītis API (YouTube Music "songs" first, then
// plain relevance) and public Invidious instances as a fallback. Results are
// Media Library rows of the YouTube shape ("youtube:<id>"), so Play /
// Enqueue / Bookmarks / History and the playback wrapper need no second path.

import { cleanMusicMeta, parseDuration, thumbnailFor, trackIdentity } from "./meta.js";

export const LACITIS_API = "https://lacitis-api.gamernr1elite.workers.dev";
// echostreamz.com answers searches; its audio proxy is broken (see resolver.js).
export const SEARCH_FALLBACKS = ["https://invidious.schenkel.eti.br", "https://yt.omada.cafe", "https://echostreamz.com"];

const NON_SONG = /\b(?:reaction|interview|review|behind\s+the\s+scenes|tutorial)\b/i;
const cache = new Map();
const CACHE_LIMIT = 48;

function withTimeout(ms, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  return { signal: controller.signal, done: () => { clearTimeout(timer); signal?.removeEventListener("abort", onAbort); } };
}

/** One search result to a Media Library row. */
export function toMusicRow({ id, title, author, lengthSeconds = 0, thumbnail = "" }) {
  const meta = cleanMusicMeta(title, author);
  const url = `youtube:${id}`;
  const art = thumbnail || thumbnailFor(id);
  return {
    source: "youtube",
    url,
    youtubeId: id,
    title: meta.title,
    artist: meta.artist,
    originalTitle: title,
    genre: meta.artist,
    tags: meta.artist ? [meta.artist] : [],
    codec: "Lācītis",
    bitrate: 0,
    duration: lengthSeconds || 0,
    favicon: art,
    logo: art,
    homepage: `https://www.youtube.com/watch?v=${id}`,
    https: true
  };
}

export async function searchMusic(query, { signal, api = LACITIS_API, fallbacks = SEARCH_FALLBACKS } = {}) {
  const q = String(query || "").trim();
  if (!q) return [];
  const key = q.toLocaleLowerCase("lv-LV");
  if (cache.has(key)) return cache.get(key);
  const wantsNonSong = NON_SONG.test(q);
  const endpoints = [
    { url: `${api}/search?q=${encodeURIComponent(q)}&f=song`, kind: "lacitis" },
    { url: `${api}/search?q=${encodeURIComponent(q)}&f=relevance`, kind: "lacitis" },
    ...fallbacks.map((base) => ({ url: `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, kind: "invidious" }))
  ];
  for (const endpoint of endpoints) {
    const timeout = withTimeout(5000, signal);
    try {
      const response = await fetch(endpoint.url, { headers: { Accept: "application/json" }, signal: timeout.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid response");
      const seenIds = new Set();
      const seenSongs = new Set();
      const rows = [];
      for (const item of data) {
        const id = endpoint.kind === "invidious" ? item.videoId : item.id;
        if (!id || seenIds.has(id)) continue;
        const lengthSeconds = typeof item.lengthSeconds === "number" ? item.lengthSeconds : parseDuration(item.duration);
        if (lengthSeconds && lengthSeconds <= 30) continue;
        if (!wantsNonSong && NON_SONG.test(item.title || "")) continue;
        const row = toMusicRow({ id, title: item.title || "Nezināma dziesma", author: item.author || "", lengthSeconds });
        const identity = trackIdentity(row.artist, row.title);
        if (identity && seenSongs.has(identity)) continue;
        seenIds.add(id);
        if (identity) seenSongs.add(identity);
        rows.push(row);
      }
      if (!rows.length) throw new Error("No usable results");
      cache.set(key, rows);
      if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
      return rows;
    } catch (error) {
      if (signal?.aborted) throw error;
      console.warn("Lācītis search:", endpoint.url, error?.message);
    } finally {
      timeout.done();
    }
  }
  throw new Error("Meklēšana neizdevās. Pamēģini vēlreiz.");
}
