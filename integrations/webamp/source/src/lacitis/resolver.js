// Finds a playable audio stream for a YouTube id, so Webamp's own <audio>
// element (and with it the real equalizer and spectrum) can play it. Public
// Invidious instances resolve the formats and proxy the audio with CORS;
// googlevideo URLs themselves are bound to the resolving server's IP and send
// no CORS, so only the proxied /videoplayback URL is usable here.
//
// Every candidate is probed with a two-byte Range request before Webamp gets
// it: an <audio> error is taken by Webamp as "track ended" and would skip the
// song. Checked 2026-09-26: the Lācītis API's /s/ is dead (its upstream
// blocks Cloudflare), echostreamz.com's proxy sends Access-Control-Allow-Origin
// twice (rejected by the browser), inv.thepixora.com is gone. When nothing
// works the caller falls back to the official YouTube player.

export const STREAM_INSTANCES = ["https://invidious.schenkel.eti.br", "https://yt.omada.cafe", "https://invidious.kemonomimi.nl"];

const LAST_GOOD_KEY = "webamp.lacitis.instance.v1";
const cache = new Map(); // id -> { url, expires }
const failures = new Map(); // instance -> timestamp of the last failure

function audio() {
  return document.createElement("audio");
}
let preferredItags = null;
function itags() {
  if (!preferredItags) {
    const a = audio();
    const opus = a.canPlayType('audio/webm; codecs="opus"') !== "";
    preferredItags = opus ? [251, 250, 249, 140, 139] : [140, 139];
  }
  return preferredItags;
}

function withTimeout(ms, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  return { signal: controller.signal, done: () => { clearTimeout(timer); signal?.removeEventListener("abort", onAbort); } };
}

function orderedInstances(instances) {
  let last = "";
  try { last = localStorage.getItem(LAST_GOOD_KEY) || ""; } catch {}
  const now = Date.now();
  // Last good first; instances that failed in the last 10 minutes last.
  return [...instances].sort((a, b) => {
    const fa = now - (failures.get(a) || 0) < 600000;
    const fb = now - (failures.get(b) || 0) < 600000;
    if (fa !== fb) return fa ? 1 : -1;
    return (b === last) - (a === last);
  });
}

async function probe(url, signal) {
  const timeout = withTimeout(5000, signal);
  try {
    const response = await fetch(url, { headers: { Range: "bytes=0-1" }, signal: timeout.signal, cache: "no-store" });
    // Reading the status at all means CORS passed (fetch rejects otherwise).
    return response.status === 206 || response.status === 200;
  } catch {
    return false;
  } finally {
    timeout.done();
  }
}

function expiresOf(url) {
  const expire = Number(new URL(url).searchParams.get("expire"));
  return Number.isFinite(expire) && expire > 0 ? expire * 1000 - 60000 : Date.now() + 30 * 60000;
}

/**
 * @returns {Promise<{url: string, instance: string, duration: number} | null>}
 */
export async function resolveStream(id, { signal, instances = STREAM_INSTANCES } = {}) {
  const hit = cache.get(id);
  if (hit && hit.expires > Date.now()) return hit;
  cache.delete(id);
  for (const instance of orderedInstances(instances)) {
    if (signal?.aborted) return null;
    const timeout = withTimeout(6000, signal);
    try {
      const response = await fetch(`${instance}/api/v1/videos/${encodeURIComponent(id)}?fields=adaptiveFormats,lengthSeconds`, { headers: { Accept: "application/json" }, signal: timeout.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const formats = (data?.adaptiveFormats || []).filter((f) => String(f.type || "").startsWith("audio") && f.url);
      const byItag = new Map(formats.map((f) => [Number(f.itag), f]));
      const ordered = [...itags().map((itag) => byItag.get(itag)).filter(Boolean), ...formats];
      const tried = new Set();
      for (const format of ordered) {
        if (tried.has(format.url)) continue;
        tried.add(format.url);
        const proxied = `${instance}/videoplayback?${new URL(format.url).search.slice(1)}`;
        if (await probe(proxied, signal)) {
          const result = { url: proxied, instance, duration: Number(data.lengthSeconds) || 0, expires: expiresOf(format.url) };
          cache.set(id, result);
          if (cache.size > 40) cache.delete(cache.keys().next().value);
          try { localStorage.setItem(LAST_GOOD_KEY, instance); } catch {}
          failures.delete(instance);
          return result;
        }
        if (tried.size >= 2) break; // two formats refused: this instance's proxy is down
      }
      throw new Error("no playable audio");
    } catch (error) {
      if (signal?.aborted) return null;
      failures.set(instance, Date.now());
      console.warn("Lācītis stream:", instance, error?.message);
    } finally {
      timeout.done();
    }
  }
  return null;
}

export function forgetStream(id) {
  cache.delete(id);
}
