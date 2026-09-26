// Internet radio as Winamp itself modelled it: stations are ordinary playlist
// entries plus a bookmark list, not a separate player window.
//
// The original client stored bookmarks as plain text, one `url\ntitle` pair per
// station, and "Play selection" simply enqueued them (IPC_ENQUEUEFILEW) and hit
// play. This mirrors that: stations are appended to the real Webamp playlist and
// driven by the classic transport controls.

const catalogueUrl = new URL("data/radio.json", document.baseURI);

let cache = null;

export async function loadCatalogue() {
  if (!cache) {
    const response = await fetch(catalogueUrl);
    if (!response.ok) {
      throw new Error(`Radio catalogue could not be loaded (HTTP ${response.status})`);
    }
    cache = await response.json();
  }
  return cache;
}

// Flat station list in a stable order, used for the menu and search.
export async function listStations() {
  const catalogue = await loadCatalogue();
  return catalogue.flatMap((group) =>
    group.stations.map((station) => ({
      ...station,
      groupId: group.id
    }))
  );
}

// HLS plays natively (Safari) or through hls.js on MSE (everything else).
const canPlayHls = (() => {
  try {
    return Boolean(document.createElement("audio").canPlayType("application/vnd.apple.mpegurl")) || "MediaSource" in window;
  } catch {
    return false;
  }
})();

// The "Format" column. Radio Browser reports a codec; for catalogue entries it
// is read off the stream address.
export function streamFormat(station) {
  const codec = String(station.codec ?? "").trim().toUpperCase();
  if (codec === "YOUTUBE") return "YouTube";
  if (codec) {
    return codec === "AAC+" ? "AAC+" : codec.replace("MPEG", "MP3").replace("UNKNOWN", "");
  }
  const path = String(station.url ?? "").split(/[?#]/)[0].toLowerCase();
  if (path.endsWith(".m3u8") || path.includes(".isml")) return "HLS";
  if (path.endsWith(".aac") || path.includes("aac")) return "AAC";
  if (path.endsWith(".ogg") || path.endsWith(".oga")) return "OGG";
  if (path.endsWith(".opus")) return "OPUS";
  if (path.endsWith(".flac")) return "FLAC";
  if (path.endsWith(".mp3") || path.includes("mp3")) return "MP3";
  return "";
}

// --- Stream proxy ------------------------------------------------------------
// Webamp's audio element is crossOrigin="anonymous", so a stream needs CORS
// headers to play at all. The Vite dev/preview server mounts /stream (see
// server/streamProxy.js) which re-serves any station same-origin, strips ICY
// metadata and reports the current title at /stream-title. When the page is
// served elsewhere the proxy is absent and streams are used directly.

let proxyAvailable = false;
let proxyBase = document.baseURI;
const stationsByTrackUrl = new Map();

// `base` is where the proxy is mounted (default: the page's own origin/path).
// An embedding app that serves the proxy elsewhere passes its own base URL.
export async function detectStreamProxy(base = document.baseURI) {
  proxyBase = base.endsWith("/") ? base : `${base}/`;
  try {
    const response = await fetch(new URL("stream-proxy/ping", proxyBase), { cache: "no-store" });
    proxyAvailable = response.ok && (await response.json())?.ok === true;
  } catch {
    proxyAvailable = false;
  }
  return proxyAvailable;
}

export const hasStreamProxy = () => proxyAvailable;

export function streamUrl(station) {
  const isHls = streamFormat(station) === "HLS";
  return proxyAvailable && !isHls
    ? `${new URL("stream", proxyBase).href}?u=${encodeURIComponent(station.url)}`
    : station.url;
}

export function stationForTrackUrl(url) {
  return stationsByTrackUrl.get(url) ?? null;
}

// Other sources (YouTube rows) register their playlist entries the same way,
// so the current-track lookups above see them.
export function registerTrackStation(url, station) {
  stationsByTrackUrl.set(url, station);
}

export async function fetchNowPlaying(station) {
  if (!proxyAvailable) {
    return null;
  }
  try {
    const response = await fetch(`${new URL("stream-title", proxyBase).href}?u=${encodeURIComponent(station.url)}`, { cache: "no-store" });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

// Why a station cannot play here, or null when it can. Plain http:// streams
// cannot load on an https:// page, and HLS needs a browser that plays it natively.
export function blockedReason(station) {
  if (window.location.protocol === "https:" && !station.https && !proxyAvailable) {
    return "Plain http:// stream: browsers block this on a secure page.";
  }
  if (streamFormat(station) === "HLS" && !canPlayHls) {
    return "HLS stream: this browser cannot play it.";
  }
  return null;
}

export function isBlocked(station) {
  return blockedReason(station) !== null;
}

// Country -> genre -> stations, mirroring how the stations are grouped.
export async function groupedStations() {
  const catalogue = await loadCatalogue();
  const countries = new Map();

  for (const group of catalogue) {
    for (const station of group.stations) {
      const country = station.country || group.country || "Other";
      const genre = station.genre || group.genre || "Other";

      if (!countries.has(country)) {
        countries.set(country, { name: country, genres: new Map() });
      }
      const node = countries.get(country);
      if (!node.genres.has(genre)) {
        node.genres.set(genre, []);
      }
      node.genres.get(genre).push(station);
    }
  }

  return [...countries.values()]
    .map((country) => ({
      name: country.name,
      genres: [...country.genres.entries()]
        .map(([name, stations]) => ({ name, stations }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Webamp playlist entries. metaData fills the title/artist columns; defaultName is
// shown until the stream reports its own ICY metadata.
export function toPlaylistTracks(stations) {
  return stations.map((station) => {
    const url = streamUrl(station);
    stationsByTrackUrl.set(url, station);
    return {
      metaData: { artist: station.country || "Radio", title: station.title },
      defaultName: `${station.title} - ${station.country || "Radio"}`,
      url,
      // A fixed value stops Webamp probing a live stream for its length.
      duration: 0
    };
  });
}

export function searchStations(stations, query) {
  const term = (query ?? "").trim().toLowerCase();
  if (!term) {
    return stations;
  }
  return stations.filter((station) => {
    const haystack = `${station.title} ${station.country} ${station.genre}`.toLowerCase();
    return term.split(/\s+/).every((part) => haystack.includes(part));
  });
}
