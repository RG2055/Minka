import http from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const VIDEO_ID = /^[\w-]{11}$/;
const STREAM_MAX_AGE_MS = 5 * 60_000;
const AUDIO_HOST = /(^|\.)googlevideo\.com$/i;

function equal(a, b) {
  const x = Buffer.from(a || "");
  const y = Buffer.from(b || "");
  return x.length === y.length && timingSafeEqual(x, y);
}

function sign(key, id, expiry) {
  return createHmac("sha256", key).update(id + "." + expiry).digest("hex");
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers });
  res.end(JSON.stringify(body));
}

// Only stream URLs returned by yt-dlp, from YouTube's media CDN.
function checkedMediaUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || !AUDIO_HOST.test(url.hostname)) throw Error("Unsupported upstream media host");
  return url;
}

export function ytDlpAudioUrl(id, { binary = "yt-dlp", timeoutMs = 20_000 } = {}) {
  return new Promise((resolve, reject) => {
    const args = ["--no-playlist", "--no-warnings", "--no-progress", "--socket-timeout", "8",
      "-f", "bestaudio[ext=m4a]/bestaudio", "--get-url", "https://www.youtube.com/watch?v=" + id];
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "", errors = "", finished = false;
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    function finish(error, value) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    }
    child.stdout.on("data", (chunk) => { output += chunk.toString(); if (output.length > 16_384) child.kill(); });
    child.stderr.on("data", (chunk) => { errors = (errors + chunk.toString()).slice(-1200); });
    child.on("error", (error) => finish(error));
    child.on("close", (code) => {
      if (code !== 0) return finish(Error("yt-dlp failed: " + (errors || "exit " + code)));
      try {
        const address = output.trim().split(/\r?\n/)[0];
        finish(null, checkedMediaUrl(address).href);
      } catch (error) { finish(error); }
    });
  });
}

export function createMusicServer({
  key = process.env.RG_MUSIC_KEY || "",
  origins = (process.env.RG_MUSIC_ORIGINS || "https://rgapp.page").split(",").map(s => s.trim()).filter(Boolean),
  getSourceUrl = ytDlpAudioUrl
} = {}) {
  if (key.length < 24) throw Error("RG_MUSIC_KEY must have at least 24 characters");
  const allowed = new Set(origins);
  const cached = new Map();
  const pending = new Map();

  async function resolve(id, fresh = false) {
    const now = Date.now();
    const hit = cached.get(id);
    if (!fresh && hit && hit.expires > now + 30_000) return hit;
    if (pending.has(id)) return pending.get(id);
    const job = (async () => {
      const url = checkedMediaUrl(await getSourceUrl(id)).href;
      const videoExpiry = Number(new URL(url).searchParams.get("expire")) * 1000;
      const expires = Math.min(now + STREAM_MAX_AGE_MS, videoExpiry > now ? videoExpiry - 60_000 : Infinity);
      const result = { url, expires };
      cached.set(id, result);
      if (cached.size > 150) cached.delete(cached.keys().next().value);
      return result;
    })().finally(() => pending.delete(id));
    pending.set(id, job);
    return job;
  }

  return http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && !allowed.has(origin)) return send(res, 403, { error: "Origin not allowed" });
    const cors = origin ? {
      "access-control-allow-origin": origin,
      "vary": "Origin",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Authorization",
      "timing-allow-origin": origin
    } : {};
    for (const [name, value] of Object.entries(cors)) res.setHeader(name, value);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });

    const route = new URL(req.url, "http://localhost");
    if (route.pathname === "/health") return send(res, 200, { status: "up" });
    const matchResolve = route.pathname.match(/^\/api\/resolve\/([\w-]{11})$/);
    const matchAudio = route.pathname.match(/^\/api\/audio\/([\w-]{11})$/);
    if (!matchResolve && !matchAudio) return send(res, 404, { error: "Not found" });
    const id = (matchResolve || matchAudio)[1];
    if (!VIDEO_ID.test(id)) return send(res, 400, { error: "Invalid video id" });

    if (matchResolve) {
      if (!equal(req.headers.authorization, "Bearer " + key)) return send(res, 401, { error: "Unauthorized" });
      const started = performance.now();
      const hit = cached.get(id)?.expires > Date.now() + 30_000;
      try {
        const source = await resolve(id);
        const expiry = Math.floor(Math.min(source.expires, Date.now() + STREAM_MAX_AGE_MS) / 1000);
        const sig = sign(key, id, expiry);
        res.setHeader("server-timing", "resolve;dur=" + (performance.now() - started).toFixed(0));
        res.setHeader("x-rg-cache", hit ? "HIT" : "MISS");
        return send(res, 200, {
          url: "/api/audio/" + id + "?exp=" + expiry + "&sig=" + sig,
          expires: expiry * 1000,
          duration: 0,
          instance: "RG mini server"
        });
      } catch (error) {
        console.error("[resolve]", id, error.message);
        return send(res, 502, { error: "Could not resolve this track" });
      }
    }

    const expiry = Number(route.searchParams.get("exp"));
    const token = route.searchParams.get("sig") || "";
    if (!Number.isSafeInteger(expiry) || expiry < Math.floor(Date.now() / 1000) ||
        expiry > Math.floor(Date.now() / 1000) + 600 || !equal(token, sign(key, id, expiry))) {
      return send(res, 403, { error: "Expired or invalid stream token" });
    }
    const range = req.headers.range;
    if (range && !/^bytes=\d*-\d*$/.test(range)) return send(res, 416, { error: "Invalid range" });

    const abort = new AbortController();
    res.on("close", () => abort.abort());
    try {
      let source = await resolve(id);
      let upstream;
      for (let attempt = 0; attempt < 2; attempt++) {
        upstream = await fetch(source.url, {
          headers: { ...(range ? { Range: range } : {}), "Accept-Encoding": "identity" },
          signal: abort.signal
        });
        if (![403, 410].includes(upstream.status) || attempt) break;
        cached.delete(id);
        source = await resolve(id, true);
      }
      if (upstream.status !== 200 && upstream.status !== 206) {
        return send(res, 502, { error: "Upstream stream unavailable" });
      }
      const headers = { "cache-control": "private, no-store", "content-type": upstream.headers.get("content-type") || "audio/mp4" };
      for (const name of ["content-length", "content-range", "accept-ranges"]) {
        if (upstream.headers.has(name)) headers[name] = upstream.headers.get(name);
      }
      res.writeHead(upstream.status, headers);
      await pipeline(Readable.fromWeb(upstream.body), res);
    } catch (error) {
      if (!abort.signal.aborted) console.error("[audio]", id, error.message);
      if (!res.headersSent) send(res, 502, { error: "Audio stream failed" });
      else res.destroy();
    }
  });
}

if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  const port = Number(process.env.PORT || 3377);
  const host = process.env.HOST || "127.0.0.1";
  createMusicServer().listen(port, host, () => {
    console.log("RG Music API listening on " + host + ":" + port);
  });
}
