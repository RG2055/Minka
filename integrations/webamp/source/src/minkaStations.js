// The station catalogue of the Minka PWA (github.com/RG2055/Minka), served
// from this app's own data/ folder so the Media Library holds the same
// stations as Minka: every Latvian station, every Radio Record channel and
// the featured world stations. The rows keep Minka's shape ({title, group,
// stream_128 | hls | url, cover, tooltip, prefix}) so fromMinkaStation()
// treats them exactly like window.stationsList inside Minka.
//
// Sources (exported from Minka's data/ and js/radio.js by tools, not fetched
// from the Minka site at runtime):
//   data/minka/latvia.json   Latvian stations with Minka's disabled/override
//                            rules applied and logos resolved
//   data/minka/record.json   Radio Record channels (offline fallback)
//   data/minka/featured.json featured world stations
// Radio Record is then refreshed from the same worker Minka uses, which adds
// the 320 kbps streams and the channel artwork.

const RECORD_WORKER = "https://ancient-bush-28d0.gamernr1elite.workers.dev/api/stations/";

const DATA_BASE = new URL("data/minka/", document.baseURI).href;

async function readJson(name) {
  const response = await fetch(`${DATA_BASE}${name}`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return response.json();
}

// Minka's own normaliser for the worker's list (js/radio.js loadStationsFromWorker).
function recordFromWorker(list) {
  const pick = (s) => s?.stream_320 || s?.stream_256 || s?.stream_192 || s?.stream_128 || s?.stream_96 || s?.stream_64 || s?.stream || s?.url || "";
  const derivePrefix = (s, url) => {
    const p = String(s?.prefix || s?.code || "").trim();
    if (p) return p;
    const m = String(url || "").match(/hostingradio\.ru\/([^/?]+)\//i);
    return m?.[1] ?? "";
  };
  return list
    .map((s) => {
      const title = (s?.title || s?.name || "").trim();
      const bestUrl = pick(s);
      const streamHls = s?.hls || s?.stream_hls || (String(bestUrl).includes(".m3u8") ? bestUrl : "");
      return {
        id: String(s?.id ?? s?.station_id ?? "").trim(),
        title,
        tooltip: String(s?.tooltip || s?.description || "Radio Record").trim(),
        cover: String(s?.bg_image_mobile || s?.bg_image || s?.cover || "").trim(),
        group: "radiorecord",
        prefix: derivePrefix(s, bestUrl),
        stream_hls: streamHls || "",
        stream_320: String(s?.stream_320 || s?.stream_256 || s?.stream_192 || "").trim() || String(bestUrl).trim(),
        stream_128: String(s?.stream_128 || s?.stream_96 || s?.stream_64 || s?.stream || s?.url || "").trim() || String(bestUrl).trim(),
        stream_64: String(s?.stream_64 || "").trim()
      };
    })
    .filter((s) => s.title && (s.stream_320 || s.stream_128 || s.stream_hls));
}

function recordFromLocal(list) {
  return list.map((s) => ({
    title: s.title,
    group: s.group || "radiorecord",
    tooltip: s.tooltip || "Radio Record",
    cover: s.cover || "",
    prefix: String(s.hls || s.url || "").match(/hostingradio\.ru\/([^/?]+)\//i)?.[1] ?? "",
    stream_hls: s.hls || "",
    stream_128: s.url || s.hls || "",
    stream_64: s.url || "",
    stream_320: s.url || s.hls || "",
    id: ""
  }));
}

/**
 * Loads the catalogue. Resolves with the offline lists at once; `onUpdate`
 * fires later with the Radio Record channels refreshed from the worker.
 * @returns {Promise<object[]>} Minka-shaped rows, in Minka's order:
 *   Radio Record, Latvian, featured world.
 */
export async function loadMinkaStations({ onUpdate } = {}) {
  const [latvia, record, featured] = await Promise.all([
    readJson("latvia.json").catch(() => []),
    readJson("record.json").catch(() => []),
    readJson("featured.json").catch(() => [])
  ]);
  // Logo paths in the exported lists are relative to this app.
  const absolute = (path) => (path && !/^(https?:|data:|blob:)/i.test(path) ? new URL(path, document.baseURI).href : path || "");
  const latvian = latvia.map((s) => ({ ...s, cover: absolute(s.logo || s.cover) }));
  const world = featured.map((s) => ({ ...s, group: "featured", cover: absolute(s.cover) }));
  const rows = [...recordFromLocal(record), ...latvian, ...world];

  if (onUpdate) {
    fetch(RECORD_WORKER, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        const root = json?.result || json?.data || json;
        const list = Array.isArray(root) ? root : Array.isArray(root?.stations) ? root.stations : [];
        const fresh = recordFromWorker(list);
        if (fresh.length) onUpdate([...fresh, ...latvian, ...world]);
      })
      .catch(() => {
        // Offline or blocked: the local Record list stays.
      });
  }
  return rows;
}
