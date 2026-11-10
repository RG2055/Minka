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

// Prefer currently listed Invidious instances; slow/down servers are hedged.
export const STREAM_INSTANCES = [
  "https://invidious.tiekoetter.com",
  "https://invidious.nerdvpn.de",
  "https://inv.nadeko.net",
  "https://yt.chocolatemoo53.com"
];

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
  const timeout = withTimeout(2200, signal);
  try {
    const response = await fetch(url, { headers: { Range: "bytes=0-1" }, signal: timeout.signal, cache: "no-store" });
    // Reading the status at all means CORS passed (fetch rejects otherwise).
    const valid = response.status === 206 || response.status === 200;
    // A proxy may ignore Range and return the whole song. Never consume it.
    response.body?.cancel().catch(() => {});
    return valid;
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

// Instances whose proxied audio played this session: their streams are not
// probed again (a failure is still caught by the caller's fallback).
const trusted = new Set();

async function tryInstance(instance, id, signal) {
  const timeout = withTimeout(4800, signal);
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
      if (trusted.has(instance) || await probe(proxied, signal)) {
        trusted.add(instance);
        return { url: proxied, instance, duration: Number(data.lengthSeconds) || 0, expires: expiresOf(format.url) };
      }
      if (tried.size >= 2) break; // two formats refused: this instance's proxy is down
    }
    throw new Error("no playable audio");
  } finally {
    timeout.done();
  }
}

const pending = new Map(); // id -> Promise (prefetch and play share the same lookup)

/**
 * Start the preferred mirror immediately and hedge the others at short
 * intervals. Whichever first returns *playable* audio wins. On slow/dead
 * mirrors, this removes the former 1.2s / 2.4s scheduled waits.
 */
const HEDGE_MS = 250;

function withConsumerAbort(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.resolve(null);
  // A selection changing must not abort the shared lookup for a prefetch.
  return new Promise((resolve, reject) => {
    const onAbort = () => { cleanup(); resolve(null); };
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then((value) => { cleanup(); resolve(value); },
      (error) => { cleanup(); reject(error); });
  });
}

export function resolveStream(id, { signal, instances = STREAM_INSTANCES } = {}) {
  if (!id) return Promise.resolve(null);
  const hit = cache.get(id);
  // An almost expired googlevideo URL might fail while the browser buffers.
  if (hit && hit.expires > Date.now() + 15_000) return withConsumerAbort(Promise.resolve(hit), signal);
  cache.delete(id);

  let lookup = pending.get(id);
  if (!lookup) {
    const order = orderedInstances(instances);
    lookup = new Promise((resolve) => {
      if (!order.length) { resolve(null); return; }
      let finished = false;
      let failed = 0;
      const timers = [];
      const controllers = [];
      const finish = (result) => {
        if (finished) return;
        finished = true;
        timers.forEach(clearTimeout);
        controllers.forEach((controller) => controller.abort());
        resolve(result);
      };
      order.forEach((instance, index) => {
        const controller = new AbortController();
        controllers.push(controller);
        timers.push(setTimeout(() => {
          if (finished) return;
          tryInstance(instance, id, controller.signal).then((result) => {
            if (finished) return;
            cache.set(id, result);
            if (cache.size > 40) cache.delete(cache.keys().next().value);
            try { localStorage.setItem(LAST_GOOD_KEY, instance); } catch {}
            failures.delete(instance);
            finish(result);
          }, (error) => {
            if (finished || controller.signal.aborted) return;
            failed++;
            failures.set(instance, Date.now());
            trusted.delete(instance);
            console.warn("Lācītis stream:", instance, error?.message);
            if (failed === order.length) finish(null);
          });
        }, index * HEDGE_MS));
      });
    }).finally(() => pending.delete(id));
    pending.set(id, lookup);
  }
  return withConsumerAbort(lookup, signal);
}

/** Looks a song up ahead of time (the next in the playlist, a selected row). */
export function prefetchStream(id) {
  if (!id) return;
  const hit = cache.get(id);
  if (hit && hit.expires > Date.now()) return;
  resolveStream(id).catch(() => {});
}

export function forgetStream(id) {
  cache.delete(id);
  pending.delete(id);
}
