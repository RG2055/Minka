// Small localStorage cache for normalized YouTube metadata (playlists,
// video details, later searches). Cache-first: a fresh entry is returned
// without a request, a stale one is returned at once and refreshed in the
// background, and only a missing one waits for the network. The YouTube
// Data API is therefore hit at most once per key per TTL, not per visit.
//
// Key layout (one localStorage item each):
//   webamp.yt.v1:playlist:<playlistId>      normalized rows of a playlist
//   webamp.yt.v1:videos:<id,id,...>         (reserved) details for a batch
//   webamp.yt.v1:search:<type>:<query>      (reserved, phase 3)
//   webamp.yt.v1:popular:<region>           (reserved, phase 4)
// Value: { at: <ms>, ttl: <ms>, data: <json> }

const PREFIX = "webamp.yt.v1:";
// Entries beyond this are evicted oldest-first so the cache never grows past
// what a few dozen playlists/searches need.
const MAX_ENTRIES = 40;

export const HOURS = 3600 * 1000;

export const cacheKey = (kind, ...parts) => `${PREFIX}${kind}:${parts.map((p) => String(p ?? "")).join(":")}`;

function readRaw(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return entry && typeof entry.at === "number" && "data" in entry ? entry : null;
  } catch {
    return null;
  }
}

function writeRaw(key, entry) {
  try {
    localStorage.setItem(key, JSON.stringify(entry));
    evict();
  } catch {
    // Quota or private mode: the value simply is not cached.
  }
}

function evict() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  if (keys.length <= MAX_ENTRIES) return;
  keys.sort((a, b) => (readRaw(a)?.at ?? 0) - (readRaw(b)?.at ?? 0));
  for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) localStorage.removeItem(key);
}

/** { data, fresh } or null. A stale entry is still returned (fresh: false). */
export function readCache(key) {
  const entry = readRaw(key);
  if (!entry) return null;
  return { data: entry.data, fresh: Date.now() - entry.at < (entry.ttl ?? 0) };
}

export function writeCache(key, data, ttl) {
  writeRaw(key, { at: Date.now(), ttl, data });
}

export function clearCache() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) localStorage.removeItem(key);
  }
}

/**
 * Cache-first loader.
 *   fresh entry   -> resolves with it, no request
 *   stale entry   -> resolves with it at once; `loader()` runs in the
 *                    background and `onRefresh(data)` gets the new value
 *   nothing       -> awaits `loader()`
 * When the loader fails and a stale entry exists, the stale entry stands.
 */
export async function cached(key, ttl, loader, { onRefresh, allowStale = true } = {}) {
  const hit = readCache(key);
  if (hit?.fresh) return hit.data;
  if (hit && allowStale) {
    void Promise.resolve()
      .then(loader)
      .then((data) => {
        writeCache(key, data, ttl);
        onRefresh?.(data);
      })
      .catch(() => {});
    return hit.data;
  }
  const data = await loader();
  writeCache(key, data, ttl);
  return data;
}
