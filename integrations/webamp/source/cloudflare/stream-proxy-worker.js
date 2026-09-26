// Cloudflare Worker version of server/streamProxy.js, for a static host such
// as Minka (GitHub Pages + Workers). Deploy with `wrangler deploy`, then mount
// the player with `proxy: "https://<worker>.workers.dev"`.
//
//   GET /stream-proxy/ping      -> { ok: true }
//   GET /stream?u=<url>         -> the stream, CORS-enabled, ICY metadata stripped
//   GET /stream-title?u=<url>   -> { title, name } read from the first ICY block
//
// Workers are stateless, so /stream-title opens the stream briefly (one
// metadata interval, ~16-32 KB) instead of remembering the last title. Poll it
// every 10-15 s. SHOUTcast v1 servers that answer "ICY 200 OK" cannot be read
// by fetch(); those need the Node proxy.

const USER_AGENT = "WinampMPEG/5.09 (WebampPWA)";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "X-Icy-Name, X-Icy-Genre, X-Icy-Br, Content-Type"
};

const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" }
});

function targetOf(request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("u") ?? "";
  if (!/^https?:\/\//i.test(target)) {
    return null;
  }
  return target;
}

async function openUpstream(target, signal) {
  const response = await fetch(target, {
    headers: { "Icy-MetaData": "1", "User-Agent": USER_AGENT, Accept: "*/*" },
    redirect: "follow",
    signal
  });
  if (!response.ok || !response.body) {
    throw new Error(`The stream answered with HTTP ${response.status}`);
  }
  return response;
}

// Splits an ICY stream into audio and metadata blocks: every `interval` audio
// bytes comes one length byte (x16) then a "StreamTitle='...';" record.
function icyTransform(interval, onTitle) {
  let audioLeft = interval;
  let metaLeft = 0;
  let meta = [];
  const decoder = new TextDecoder();

  return new TransformStream({
    transform(chunk, controller) {
      let offset = 0;
      while (offset < chunk.length) {
        if (metaLeft > 0) {
          const piece = chunk.subarray(offset, offset + metaLeft);
          meta.push(piece);
          metaLeft -= piece.length;
          offset += piece.length;
          if (metaLeft === 0) {
            const size = meta.reduce((n, p) => n + p.length, 0);
            const joined = new Uint8Array(size);
            let at = 0;
            for (const p of meta) { joined.set(p, at); at += p.length; }
            meta = [];
            audioLeft = interval;
            const match = /StreamTitle='((?:[^'\\]|\\.|'(?!;))*)';/.exec(decoder.decode(joined).replace(/\0+$/, ""));
            if (match) onTitle(match[1].replace(/\\'/g, "'").trim());
          }
        } else if (audioLeft === 0) {
          metaLeft = chunk[offset] * 16;
          offset += 1;
          if (metaLeft === 0) audioLeft = interval;
        } else {
          const piece = chunk.subarray(offset, offset + audioLeft);
          controller.enqueue(piece);
          audioLeft -= piece.length;
          offset += piece.length;
        }
      }
    }
  });
}

function contentTypeFor(headers, url) {
  const type = (headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const map = { "audio/aacp": "audio/aac", "audio/x-aac": "audio/aac", "audio/x-mpeg": "audio/mpeg", "audio/mp3": "audio/mpeg", "application/ogg": "audio/ogg" };
  if (map[type]) return map[type];
  if (type.startsWith("audio/") || type.startsWith("video/")) return type;
  const path = url.split(/[?#]/)[0].toLowerCase();
  if (path.endsWith(".aac")) return "audio/aac";
  if (path.endsWith(".ogg") || path.endsWith(".opus")) return "audio/ogg";
  return "audio/mpeg";
}

async function handleStream(request, target) {
  let upstream;
  try {
    upstream = await openUpstream(target, request.signal);
  } catch (error) {
    return json({ error: error?.message ?? String(error) }, 502);
  }
  const interval = Number(upstream.headers.get("icy-metaint"));
  const body = Number.isInteger(interval) && interval > 0
    ? upstream.body.pipeThrough(icyTransform(interval, () => {}))
    : upstream.body;

  return new Response(request.method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type": contentTypeFor(upstream.headers, target),
      "Cache-Control": "no-store, no-transform",
      "X-Icy-Name": encodeURIComponent(upstream.headers.get("icy-name") ?? ""),
      "X-Icy-Genre": encodeURIComponent(upstream.headers.get("icy-genre") ?? ""),
      "X-Icy-Br": upstream.headers.get("icy-br") ?? ""
    }
  });
}

// Reads until the first metadata block, then closes the upstream.
async function handleTitle(target) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await openUpstream(target, controller.signal);
    const name = upstream.headers.get("icy-name") ?? "";
    const interval = Number(upstream.headers.get("icy-metaint"));
    if (!Number.isInteger(interval) || interval <= 0) {
      controller.abort();
      return json({ title: "", name });
    }
    let title = "";
    const reader = upstream.body.pipeThrough(icyTransform(interval, (t) => { title = t; })).getReader();
    let read = 0;
    // One full interval plus the block itself is enough for the first title.
    while (!title && read < interval + 4096) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.length;
    }
    controller.abort();
    return json({ title, name, at: Date.now() });
  } catch (error) {
    return json({ title: "", name: "", error: error?.message ?? String(error) });
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (pathname.endsWith("/stream-proxy/ping")) {
      return json({ ok: true });
    }
    const target = targetOf(request);
    if (pathname.endsWith("/stream")) {
      return target ? handleStream(request, target) : json({ error: "Missing stream address (?u=)" }, 400);
    }
    if (pathname.endsWith("/stream-title")) {
      return target ? handleTitle(target) : json({ title: "", name: "" });
    }
    return json({ error: "Not found" }, 404);
  }
};
