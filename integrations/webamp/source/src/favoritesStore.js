// Favourites (Winamp/WACUP "bookmarks"): an ordered list of stations kept in
// localStorage — it is small, read synchronously by the library, and the key
// is the one the earlier bookmark code used, so existing entries carry over.
// Entries can be renamed and reordered; `title` is what the library shows,
// `originalTitle` keeps the station's own name.

const STORAGE_KEY = "webamp.radio.bookmarks.v1";
const listeners = new Set();
let cache = null;

function read() {
  if (cache) {
    return cache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = [];
    } else if (raw.trimStart().startsWith("[")) {
      cache = JSON.parse(raw) ?? [];
    } else {
      // The classic "url\ntitle\n" text form written by older versions.
      const lines = raw.split("\n");
      cache = [];
      for (let i = 0; i + 1 < lines.length; i += 2) {
        const url = lines[i].trim();
        const title = lines[i + 1].trim();
        if (url && title) {
          cache.push({ url, title, https: url.startsWith("https:") });
        }
      }
    }
  } catch {
    cache = [];
  }
  return cache;
}

function write(next) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable; favourites live for this session only.
  }
  for (const listener of listeners) {
    try {
      listener(next);
    } catch (error) {
      console.error(error);
    }
  }
}

function toEntry(station) {
  return {
    url: station.url,
    urls: Array.isArray(station.urls) ? station.urls : undefined,
    title: station.title,
    originalTitle: station.originalTitle ?? station.title,
    country: station.country || "",
    countryName: station.countryName || "",
    language: station.language || "",
    genre: station.genre || "",
    tags: station.tags ?? [],
    bitrate: station.bitrate || 0,
    codec: station.codec || "",
    homepage: station.homepage || "",
    favicon: station.favicon || station.logo || "",
    note: station.note || "",
    uuid: station.uuid || "",
    hostKey: station.hostKey || "",
    https: station.https !== undefined ? station.https : String(station.url).startsWith("https:"),
    addedAt: Date.now()
  };
}

export const favoritesStore = {
  list: () => read().slice(),
  has: (url) => read().some((entry) => entry.url === url),
  get: (url) => read().find((entry) => entry.url === url) ?? null,

  add(station) {
    if (!station?.url || this.has(station.url)) {
      return false;
    }
    write([...read(), toEntry(station)]);
    return true;
  },

  remove(url) {
    write(read().filter((entry) => entry.url !== url));
  },

  toggle(station) {
    if (this.has(station.url)) {
      this.remove(station.url);
      return false;
    }
    return this.add(station);
  },

  rename(url, title) {
    const name = String(title ?? "").trim();
    if (!name) {
      return;
    }
    write(read().map((entry) => (entry.url === url ? { ...entry, title: name } : entry)));
  },

  /** Moves an entry by `delta` positions (negative = up). */
  move(url, delta) {
    const list = read().slice();
    const from = list.findIndex((entry) => entry.url === url);
    if (from === -1) {
      return;
    }
    const to = Math.max(0, Math.min(list.length - 1, from + delta));
    const [entry] = list.splice(from, 1);
    list.splice(to, 0, entry);
    write(list);
  },

  /** Replaces the order with the given list of urls (unknown urls are ignored). */
  reorder(urls) {
    const byUrl = new Map(read().map((entry) => [entry.url, entry]));
    const ordered = urls.map((url) => byUrl.get(url)).filter(Boolean);
    for (const entry of byUrl.values()) {
      if (!ordered.includes(entry)) {
        ordered.push(entry);
      }
    }
    write(ordered);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
