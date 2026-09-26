// Station records from other apps, normalised to the shape the library and
// player use: { title, url, country, genre, tags, bitrate, codec, homepage,
// note, https, group }.
//
// Minka (github.com/RG2055/Minka) keeps its stations as
//   { title, group, stream_320, stream_128, stream_64, stream_hls, url, hls,
//     codec, prefix, id, logo }
// with "separator" rows between groups. The best direct stream is preferred
// over HLS, since a direct stream is what Winamp would have played.

const URL_KEYS = ["stream_320", "stream_128", "stream_64", "url", "stream_hls", "hls"];

// Every distinct stream address a row knows, best first; the player falls
// back along this list when one fails.
function collectUrls(row) {
  const out = [];
  const candidates = [...URL_KEYS.map((key) => row?.[key]), ...(Array.isArray(row?.urls) ? row.urls : [])];
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (/^https?:\/\//i.test(value) && !out.includes(value)) {
      out.push(value);
    }
  }
  return out;
}

function pickUrl(row) {
  return collectUrls(row)[0] ?? "";
}

function bitrateFromKeys(row, url) {
  if (Number(row?.bitrate) > 0) return Number(row.bitrate);
  if (url && url === String(row?.stream_320 ?? "").trim()) return 320;
  if (url && url === String(row?.stream_128 ?? "").trim()) return 128;
  if (url && url === String(row?.stream_64 ?? "").trim()) return 64;
  return 0;
}

const GROUP_LABELS = {
  radiorecord: { genre: "Radio Record", country: "RU" },
  record: { genre: "Radio Record", country: "RU" },
  latvija: { genre: "Latvija", country: "LV" },
  world: { genre: "World", country: "" },
  featured: { genre: "Featured", country: "" }
};

export function fromMinkaStation(row) {
  if (!row || row.group === "separator") {
    return null;
  }
  const url = pickUrl(row);
  const title = String(row.title ?? "").trim();
  if (!url || !title) {
    return null;
  }
  const group = String(row.group ?? "").toLowerCase();
  const labels = GROUP_LABELS[group] ?? { genre: group ? group[0].toUpperCase() + group.slice(1) : "", country: "" };
  const tags = [labels.genre, ...(Array.isArray(row.tags) ? row.tags : String(row.genre ?? "").split(",").map((t) => t.trim()))].filter(Boolean);
  const codec = String(row.codec ?? "").trim() || (/\.m3u8/i.test(url) ? "HLS" : "");

  return {
    title,
    url,
    urls: collectUrls(row),
    group,
    // Minka's identity for the station (its favorites hold these keys):
    // radioStationKey() in Minka's radio.js.
    hostKey: String(row.catalogKey ?? "") || (group === "latvija" ? "lv:" : "record:") + title.normalize("NFC").toLocaleLowerCase("lv-LV"),
    country: String(row.country ?? labels.country ?? "").toUpperCase().slice(0, 2),
    genre: tags[0] ?? "",
    tags,
    bitrate: bitrateFromKeys(row, url),
    codec: codec === "HLS" ? "" : codec,
    homepage: String(row.homepage ?? row.site ?? ""),
    note: String(row.note ?? row.description ?? ""),
    logo: String(row.logo ?? row.image ?? row.cover ?? ""),
    favicon: String(row.favicon ?? row.logo ?? row.image ?? row.cover ?? ""),
    https: url.startsWith("https:"),
    source: "host"
  };
}

// Accepts our own shape or Minka's, one row or a list, and drops separators.
export function normalizeStations(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const out = [];
  const seen = new Set();
  for (const row of list) {
    const isMinka = row && ["group", "hls", "stream_128", "stream_320", "stream_64", "stream_hls", "prefix"].some((key) => key in row);
    const station = row && !isMinka && typeof row.url === "string"
      ? { ...row, tags: row.tags ?? (row.genre ? [row.genre] : []), https: row.https ?? row.url.startsWith("https:"), urls: Array.isArray(row.urls) && row.urls.length ? row.urls : [row.url] }
      : fromMinkaStation(row);
    if (station && station.url && !seen.has(station.url)) {
      seen.add(station.url);
      out.push(station);
    }
  }
  return out;
}
