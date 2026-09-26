// "Now playing" for live streams, without touching the audio element.
//
// Three sources, tried in this order for the station being played:
//   1. the stream proxy's /stream-title (the proxy reads ICY metadata off the
//      very connection the player listens to);
//   2. a direct ICY probe — a short second connection with `Icy-MetaData: 1`,
//      read up to the first metadata block, then aborted. Only works when the
//      station sends CORS headers and exposes `icy-metaint`;
//   3. HLS timed ID3 (TIT2 / TPE1) pushed in by hls.js, no polling at all.
//
// Polling is slow and only runs while a station plays: every 10 s with the
// page visible, 20 s when hidden (lock-screen metadata still needs updates).

import { fetchNowPlaying, hasStreamProxy, streamFormat } from "./radio.js";
import { fetchRadioRecordNowPlaying, isRadioRecord } from "./radioRecord.js";

const VISIBLE_INTERVAL = 10000;
const HIDDEN_INTERVAL = 20000;
const PROBE_TIMEOUT = 7000;
const PROBE_LIMIT = 96 * 1024;

export function splitStreamTitle(streamTitle, station) {
  const text = String(streamTitle ?? "").trim();
  const separator = text.indexOf(" - ");
  if (separator > 0) {
    return { artist: text.slice(0, separator).trim(), title: text.slice(separator + 3).trim() };
  }
  return { artist: station?.originalTitle ?? station?.title ?? "", title: text };
}

// Reads the first ICY metadata block from a fresh connection.
async function probeIcy(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
  try {
    const response = await fetch(url, {
      headers: { "Icy-MetaData": "1" },
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal
    });
    const interval = Number(response.headers.get("icy-metaint"));
    if (!response.ok || !response.body || !Number.isInteger(interval) || interval <= 0) {
      controller.abort();
      return null;
    }
    const reader = response.body.getReader();
    const chunks = [];
    let read = 0;
    while (read < Math.min(PROBE_LIMIT, interval + 4097)) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      read += value.length;
    }
    controller.abort();
    const bytes = new Uint8Array(read);
    let at = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, at);
      at += chunk.length;
    }
    if (bytes.length <= interval) {
      return null;
    }
    const length = bytes[interval] * 16;
    const block = new TextDecoder().decode(bytes.subarray(interval + 1, interval + 1 + length)).replace(/\0+$/, "");
    const match = /StreamTitle='((?:[^'\\]|\\.|'(?!;))*)';/.exec(block);
    return match ? { title: match[1].replace(/\\'/g, "'").trim(), name: response.headers.get("icy-name") ?? "" } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Minimal ID3v2 text-frame reader for HLS timed metadata (hls.js hands the
// raw tag bytes): returns { TIT2, TPE1, TXXX... } or null.
export function parseId3Text(bytes) {
  if (!bytes || bytes.length < 10 || bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return null;
  }
  const version = bytes[3];
  const syncsafe = (i) => ((bytes[i] & 0x7f) << 21) | ((bytes[i + 1] & 0x7f) << 14) | ((bytes[i + 2] & 0x7f) << 7) | (bytes[i + 3] & 0x7f);
  const size = syncsafe(6);
  let offset = 10;
  if (bytes[5] & 0x40) {
    offset += version === 4 ? syncsafe(10) : ((bytes[10] << 24) | (bytes[11] << 16) | (bytes[12] << 8) | bytes[13]) + 4;
  }
  const end = Math.min(bytes.length, 10 + size);
  const frames = {};
  const decode = (encoding, data) => {
    const label = encoding === 1 ? "utf-16" : encoding === 2 ? "utf-16be" : encoding === 3 ? "utf-8" : "windows-1252";
    try {
      return new TextDecoder(label).decode(data).replace(/\0+$/g, "").trim();
    } catch {
      return "";
    }
  };
  while (offset + 10 <= end) {
    const id = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    if (!/^[A-Z0-9]{4}$/.test(id)) break;
    const frameSize = version === 4
      ? syncsafe(offset + 4)
      : (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
    const body = bytes.subarray(offset + 10, offset + 10 + frameSize);
    offset += 10 + frameSize;
    if (frameSize <= 1 || body.length === 0) continue;
    if (id[0] === "T") {
      const text = decode(body[0], body.subarray(1));
      if (id === "TXXX") {
        const [desc, value] = text.split("\0");
        frames[`TXXX:${desc}`] = value ?? "";
      } else {
        frames[id] = text;
      }
    }
  }
  return Object.keys(frames).length > 0 ? frames : null;
}

export function createRadioMetadata({ onNowPlaying }) {
  let station = null;
  let timer = null;
  let lastText = "";
  let inFlight = false;
  let directProbeFailed = false;

  function publish(text, source, cover = "") {
    const streamTitle = String(text ?? "").trim();
    if (!streamTitle || streamTitle === lastText || !station) {
      return;
    }
    lastText = streamTitle;
    onNowPlaying({ station, streamTitle, ...splitStreamTitle(streamTitle, station), artwork: cover || "", source });
  }

  async function poll() {
    if (!station || inFlight) {
      return;
    }
    inFlight = true;
    try {
      if (isRadioRecord(station)) {
        // These streams carry their titles in EXT-X-DATERANGE tags that hls.js
        // does not surface, and send no ID3, so the group's own JSON feed is
        // the only source. It also hands back the cover directly.
        const info = await fetchRadioRecordNowPlaying(station);
        if (info) {
          const text = info.artist && info.title ? `${info.artist} - ${info.title}` : info.title || info.artist;
          publish(text, "radiorecord", info.cover);
        }
      } else if (hasStreamProxy() && streamFormat(station) !== "HLS") {
        const info = await fetchNowPlaying(station);
        publish(info?.title, "proxy");
      } else if (!directProbeFailed && streamFormat(station) !== "HLS") {
        const info = await probeIcy(station.url);
        if (info) {
          publish(info.title, "icy");
        } else {
          // No CORS or no ICY on this station: stop paying for the probe.
          directProbeFailed = true;
          stopTimer();
        }
      }
    } finally {
      inFlight = false;
    }
  }

  function schedule() {
    stopTimer();
    if (!station || directProbeFailed && !hasStreamProxy()) {
      return;
    }
    if (streamFormat(station) === "HLS" && !isRadioRecord(station)) {
      return; // ID3 events arrive on their own
    }
    timer = setTimeout(async () => {
      await poll();
      schedule();
    }, document.hidden ? HIDDEN_INTERVAL : VISIBLE_INTERVAL);
  }

  function stopTimer() {
    clearTimeout(timer);
    timer = null;
  }

  const onVisibility = () => {
    if (timer) {
      schedule();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    /** A station started playing: reset and poll soon. */
    start(next) {
      station = next;
      lastText = "";
      directProbeFailed = false;
      stopTimer();
      if (!station) {
        return;
      }
      timer = setTimeout(async () => {
        await poll();
        schedule();
      }, 2500);
    },
    stop() {
      stopTimer();
      station = null;
      lastText = "";
    },
    /** Timed metadata from hls.js (raw ID3 bytes). */
    pushId3(bytes) {
      const frames = parseId3Text(bytes);
      if (!frames) return;
      const title = frames.TIT2 || frames["TXXX:title"] || "";
      const artist = frames.TPE1 || frames["TXXX:artist"] || "";
      const text = artist && title ? `${artist} - ${title}` : title || artist || frames["TXXX:StreamTitle"] || "";
      publish(text, "id3");
    },
    /** A title the proxy/other source already knows. */
    push(text) {
      publish(text, "push");
    },
    dispose() {
      stopTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}
