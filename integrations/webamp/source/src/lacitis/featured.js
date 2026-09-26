// "Featured" YouTube Music playlists picked from what was listened to, the
// way ytify's Library shows them (its service: ytmgr-seven.vercel.app, CORS
// open). Seeds are the last played song ids; without any, the caller's
// fallback ids. Cached 24 h so WINAMP opens without waiting for it.

const SERVICE = "https://ytmgr-seven.vercel.app";
const CACHE_KEY = "webamp.lacitis.featured.v2";
const HISTORY_KEY = "webamp.lacitis.history.v1";
const TTL = 24 * 3600 * 1000;

export function recentSongIds() {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(list) ? list.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function noteSongPlayed(id) {
  if (!id) return;
  try {
    const list = [id, ...recentSongIds().filter((x) => x !== id)].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {}
}

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return cached && Array.isArray(cached.playlists) ? cached : null;
  } catch {
    return null;
  }
}

async function fetchFresh(seeds, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const response = await fetch(`${SERVICE}?ids=${encodeURIComponent(seeds.slice(0, 25).join(","))}&limit=20`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const playlists = (Array.isArray(data?.playlists) ? data.playlists : [])
      .filter((p) => p?.id && p?.name && !/^(songs|albums)$/i.test(p.section || ""))
      .map((p) => ({ id: p.id, name: p.name, section: p.category || p.section || "" }))
      // The service can list two lists under one name: one entry per name.
      .filter((p, i, all) => all.findIndex((q) => q.name.toLowerCase() === p.name.toLowerCase()) === i);
    if (!playlists.length) throw new Error("no playlists");
    const result = { at: Date.now(), playlists };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch {}
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Featured playlists [{ id, name, section }]. A cached list answers at once
 * (refreshed in the background when older than a day); without one the
 * service is asked, waiting at most `waitMs`.
 */
export async function featuredPlaylists({ fallbackIds = [], waitMs = 2500, signal } = {}) {
  const seeds = recentSongIds();
  const ids = seeds.length ? seeds : fallbackIds;
  const cached = readCache();
  if (cached && Date.now() - cached.at < TTL) return cached.playlists;
  if (!ids.length) return cached?.playlists ?? [];
  const fresh = fetchFresh(ids, signal).catch((error) => {
    console.warn("Featured playlists:", error?.message);
    return null;
  });
  if (cached) return cached.playlists; // refresh lands for the next opening
  const timed = await Promise.race([fresh, new Promise((resolve) => setTimeout(() => resolve(null), waitMs))]);
  return timed?.playlists ?? [];
}
