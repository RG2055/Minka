// Now-playing metadata for Radio Record.
//
// Radio Record's HLS streams carry their titles in EXT-X-DATERANGE tags
// (X-ARTIST / X-TITLE / X-COVER-IMAGE-URL). hls.js parses those tags but never
// surfaces the attributes, and ID3 never arrives on these streams either, so
// the usual ICY/ID3 paths see nothing at all.
//
// The station group publishes the same information as JSON instead, keyed by
// station id, which is what this uses. Two things have to line up first: our
// station URLs carry a *slug* (.../record-2010/playlist.m3u8) while the API
// names each station with a *prefix* ("record"), so the published station list
// is loaded once to map both onto the id the now-playing feed answers with.

const API_BASE = "https://ancient-bush-28d0.gamernr1elite.workers.dev/api";
const STATIONS_URL = `${API_BASE}/stations/`;
const NOW_URL = `${API_BASE}/stations/now/`;

/** Radio Record stream hosts that identify a station by a URL slug. */
const HOST_RE = /hostingradio\.ru\/([^/?]+)\//i;

/** The slug in a Radio Record stream URL, e.g. "record-2010" or "record". */
export function deriveRRPrefix(station) {
  const url = String(station?.url ?? station?.hls ?? "");
  const match = url.match(HOST_RE);
  return match ? match[1] : "";
}

/** True for a station this module can resolve metadata for. */
export function isRadioRecord(station) {
  return deriveRRPrefix(station) !== "";
}

let prefixToId = null;
let mapPromise = null;

/** Load and cache the slug/prefix -> station id map. */
async function ensureMap() {
  if (prefixToId) {
    return prefixToId;
  }
  if (mapPromise) {
    return mapPromise;
  }
  mapPromise = (async () => {
    try {
      const response = await fetch(STATIONS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`stations ${response.status}`);
      }
      const json = await response.json();
      const root = json?.result ?? json?.data ?? json;
      const list = Array.isArray(root) ? root : root?.stations ?? [];
      const map = {};
      for (const entry of list) {
        const id = String(entry?.id ?? entry?.station_id ?? "").trim();
        if (!id) {
          continue;
        }
        const prefix = String(entry?.prefix ?? entry?.code ?? "").trim();
        if (prefix) {
          map[prefix] = id;
        }
        // The stream list uses paths such as "record-2010" where the API's
        // canonical prefix is "cadillac"; both identify the same station.
        for (const url of [entry?.stream_hls, entry?.hls, entry?.url]) {
          const slug = deriveRRPrefix({ url });
          if (slug) {
            map[slug] = id;
          }
        }
      }
      prefixToId = Object.keys(map).length > 0 ? map : null;
      return prefixToId;
    } catch {
      // A temporary failure must not be cached as "this station has none".
      return null;
    } finally {
      mapPromise = null;
    }
  })();
  return mapPromise;
}

function pickCover(track) {
  return track?.image600 || track?.image200 || track?.image100 || track?.cover || "";
}

/**
 * The current track for a station.
 *
 * @returns {Promise<{artist: string, title: string, cover: string}|null>}
 */
export async function fetchRadioRecordNowPlaying(station) {
  const prefix = deriveRRPrefix(station);
  if (!prefix) {
    return null;
  }

  const map = await ensureMap();
  const id = map?.[prefix];
  if (!id) {
    return null;
  }

  const response = await fetch(NOW_URL, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  const json = await response.json();
  const root = json?.result ?? json?.data ?? json;
  const list = Array.isArray(root) ? root : root?.stations ?? [];
  const entry = list.find((item) => String(item?.id ?? item?.station_id ?? "") === String(id));
  const track = entry?.track;
  if (!track) {
    return null;
  }

  const artist = String(track.artist ?? "").trim();
  const title = String(track.song ?? track.title ?? "").trim();
  if (!artist && !title) {
    return null;
  }

  return { artist, title, cover: pickCover(track) };
}
