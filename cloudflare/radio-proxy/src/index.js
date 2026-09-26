// Forwards /api/... to radiorecord.ru for the radio metadata (the site sends no
// CORS headers). Every open radio polls /api/stations/now/ (~460 KB), so GET
// replies are shared through the edge cache for a few seconds, and when Radio
// Record answers 429 or an error the last good copy is served instead.
const FRESH_SECONDS = (path) => (path.startsWith("/api/stations/now") ? 5 : 3600);
const STALE_SECONDS = 600;

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,accept",
  };
}

function toClient(body, status, contentType, extra) {
  const res = new Response(body, { status });
  if (contentType) res.headers.set("content-type", contentType);
  Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v));
  res.headers.set("cache-control", "no-store");
  for (const [k, v] of Object.entries(extra || {})) res.headers.set(k, v);
  return res;
}

function cacheKey(target, kind) {
  return new Request("https://radio-proxy.cache/" + kind + "/" + encodeURIComponent(target));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only allow /api/... paths
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Use /api/... e.g. /api/stations/", { status: 404 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const target = "https://www.radiorecord.ru" + url.pathname + url.search;
    const cache = caches.default;
    const isGet = request.method === "GET";

    if (isGet) {
      const hit = await cache.match(cacheKey(target, "fresh"));
      if (hit) return toClient(hit.body, hit.status, hit.headers.get("content-type"), { "x-proxy-cache": "hit" });
    }

    let upstream = null;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers: {
          "accept": request.headers.get("accept") || "*/*",
          "content-type": request.headers.get("content-type") || "application/json",
        },
        body: isGet ? undefined : await request.arrayBuffer(),
      });
    } catch (_e) {
      upstream = null;
    }

    if (isGet && (!upstream || upstream.status === 429 || upstream.status >= 500)) {
      const stale = await cache.match(cacheKey(target, "stale"));
      if (stale) return toClient(stale.body, 200, stale.headers.get("content-type"), { "x-proxy-cache": "stale" });
    }
    if (!upstream) return toClient("Upstream unavailable", 502, "text/plain");

    const body = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type");
    if (isGet && upstream.status === 200) {
      const store = (kind, seconds) => cache.put(cacheKey(target, kind), new Response(body.slice(0), {
        headers: { "content-type": contentType || "application/json", "cache-control": "public, max-age=" + seconds },
      }));
      ctx.waitUntil(Promise.all([store("fresh", FRESH_SECONDS(url.pathname)), store("stale", STALE_SECONDS)]));
    }
    return toClient(body, upstream.status, contentType);
  }
};
