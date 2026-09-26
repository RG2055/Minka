// Listening history, WACUP style: the stations that were played and the songs
// heard on them. Kept in IndexedDB (a song row every few minutes would bloat
// localStorage); when IndexedDB is unavailable (some private modes) an
// in-memory list is used for the session. The pre-IndexedDB station history
// in localStorage is imported once.

const DB_NAME = "webamp-radio";
const DB_VERSION = 1;
const LEGACY_KEY = "webamp.radio.history.v1";
const STATION_LIMIT = 200;
const SONG_LIMIT = 1000;

let dbPromise = null;
let memory = { stations: [], songs: [] };
let useMemory = false;
const listeners = new Set();

function emit(kind) {
  for (const listener of listeners) {
    try {
      listener(kind);
    } catch (error) {
      console.error(error);
    }
  }
}

function openDb() {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve) => {
    if (!("indexedDB" in window)) {
      useMemory = true;
      resolve(null);
      return;
    }
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      useMemory = true;
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("stations")) {
        db.createObjectStore("stations", { keyPath: "url" }).createIndex("playedAt", "playedAt");
      }
      if (!db.objectStoreNames.contains("songs")) {
        db.createObjectStore("songs", { keyPath: "id", autoIncrement: true }).createIndex("at", "at");
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
      void importLegacy(db);
    };
    request.onerror = () => {
      useMemory = true;
      resolve(null);
    };
    request.onblocked = () => {
      useMemory = true;
      resolve(null);
    };
  });
  return dbPromise;
}

function tx(db, store, mode, work) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const result = work(transaction.objectStore(store));
    transaction.oncomplete = () => resolve(result?.result ?? result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function readAllByIndex(db, store, index, limit) {
  return new Promise((resolve, reject) => {
    const out = [];
    const request = db.transaction(store, "readonly").objectStore(store).index(index).openCursor(null, "prev");
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && out.length < limit) {
        out.push(cursor.value);
        cursor.continue();
      } else {
        resolve(out);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Keeps a store at `limit` rows by deleting the oldest by index.
function trim(db, store, index, limit) {
  return new Promise((resolve) => {
    const transaction = db.transaction(store, "readwrite");
    const objectStore = transaction.objectStore(store);
    const count = objectStore.count();
    count.onsuccess = () => {
      let excess = count.result - limit;
      if (excess <= 0) {
        resolve();
        return;
      }
      const cursor = objectStore.index(index).openCursor(null, "next");
      cursor.onsuccess = () => {
        const current = cursor.result;
        if (current && excess > 0) {
          current.delete();
          excess -= 1;
          current.continue();
        }
      };
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
}

async function importLegacy(db) {
  let legacy = [];
  try {
    legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "[]") ?? [];
  } catch {
    legacy = [];
  }
  if (!Array.isArray(legacy) || legacy.length === 0) {
    return;
  }
  try {
    await tx(db, "stations", "readwrite", (store) => {
      for (const entry of legacy) {
        if (entry?.url) {
          store.put({ ...stationRecord(entry), playedAt: entry.playedAt ?? Date.now() });
        }
      }
    });
    localStorage.removeItem(LEGACY_KEY);
    emit("stations");
  } catch {
    // Left in place; imported next time.
  }
}

function stationRecord(station) {
  return {
    url: station.url,
    urls: Array.isArray(station.urls) ? station.urls : undefined,
    title: station.originalTitle ?? station.title,
    country: station.country || "",
    countryName: station.countryName || "",
    language: station.language || "",
    genre: station.genre || "",
    tags: station.tags ?? [],
    bitrate: station.bitrate || 0,
    codec: station.codec || "",
    homepage: station.homepage || "",
    favicon: station.favicon || station.logo || "",
    uuid: station.uuid || "",
    https: station.https !== undefined ? station.https : String(station.url).startsWith("https:"),
    playedAt: Date.now()
  };
}

export const historyStore = {
  async recordStation(station) {
    if (!station?.url) {
      return;
    }
    const record = stationRecord(station);
    const db = await openDb();
    if (!db || useMemory) {
      memory.stations = [record, ...memory.stations.filter((s) => s.url !== record.url)].slice(0, STATION_LIMIT);
      emit("stations");
      return;
    }
    try {
      await tx(db, "stations", "readwrite", (store) => store.put(record));
      await trim(db, "stations", "playedAt", STATION_LIMIT);
    } catch {}
    emit("stations");
  },

  /**
   * A song heard on a station. Consecutive repeats of the same title on the
   * same station are collapsed into one row.
   */
  async recordSong({ station, artist = "", title = "", streamTitle = "", artwork = "" }) {
    const text = streamTitle || [artist, title].filter(Boolean).join(" - ");
    if (!station?.url || !text) {
      return;
    }
    const record = {
      stationUrl: station.url,
      station: station.originalTitle ?? station.title,
      favicon: station.favicon || station.logo || "",
      artist,
      title: title || text,
      streamTitle: text,
      artwork: artwork || "",
      at: Date.now()
    };
    const [latest] = await this.listSongs(1);
    if (latest && latest.stationUrl === record.stationUrl && latest.streamTitle === record.streamTitle) {
      return;
    }
    const db = await openDb();
    if (!db || useMemory) {
      memory.songs = [record, ...memory.songs].slice(0, SONG_LIMIT);
      emit("songs");
      return;
    }
    try {
      await tx(db, "songs", "readwrite", (store) => store.add(record));
      await trim(db, "songs", "at", SONG_LIMIT);
    } catch {}
    emit("songs");
  },

  async listStations(limit = STATION_LIMIT) {
    const db = await openDb();
    if (!db || useMemory) {
      return memory.stations.slice(0, limit);
    }
    try {
      return await readAllByIndex(db, "stations", "playedAt", limit);
    } catch {
      return [];
    }
  },

  async listSongs(limit = SONG_LIMIT) {
    const db = await openDb();
    if (!db || useMemory) {
      return memory.songs.slice(0, limit);
    }
    try {
      return await readAllByIndex(db, "songs", "at", limit);
    } catch {
      return [];
    }
  },

  async clear(kind = "all") {
    const db = await openDb();
    const stores = kind === "all" ? ["stations", "songs"] : [kind];
    for (const store of stores) {
      if (!db || useMemory) {
        memory[store] = [];
      } else {
        try {
          await tx(db, store, "readwrite", (objectStore) => objectStore.clear());
        } catch {}
      }
      emit(store);
    }
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
