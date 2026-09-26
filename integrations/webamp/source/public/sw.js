// Offline-first service worker for Webamp.
// The app shell is precached so the player works with no network; user music is
// never cached (it lives in the page as object URLs / File handles).

const cacheName = "webamp-pwa-v3";
const shellAssets = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./data/radio.json",
  "./icons/icon.svg",
  "./icons/favicon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    // Cache each asset independently so a single failure cannot abort the install.
    await Promise.all(shellAssets.map(async (asset) => {
      try {
        const response = await fetch(asset, { cache: "reload" });
        if (response.ok) {
          await cache.put(asset, response.clone());
        }
      } catch {
        // Offline during install; the fetch handler will fill this in later.
      }
    }));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== cacheName).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never touch non-GET requests (range requests for audio, etc.).
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // Navigations: network-first so updates land, falling back to the cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put("./index.html", response.clone());
        }
        return response;
      } catch {
        return (await cache.match("./index.html")) ?? Response.error();
      }
    })());
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  // Never touch the stream proxy: /stream is an endless response (caching it
  // would never finish and stalls the worker), /stream-title is live data.
  if (url.pathname === "/stream" || url.pathname.startsWith("/stream-") || request.headers.has("range")) {
    return;
  }

  // Same-origin assets: cache-first, refreshed in the background.
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      void fetch(request).then((response) => {
        if (response.ok) {
          return cache.put(request, response.clone());
        }
        return undefined;
      }).catch(() => {});
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return (await cache.match(request)) ?? Response.error();
    }
  })());
});
