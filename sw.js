const CACHE = 'minka-4.6.5';
const APP_ROOT = new URL('./', self.registration.scope);
const appUrl = relativePath => new URL(relativePath, APP_ROOT).href;

const isHttpRequest = request => {
  try {
    const url = new URL(request.url);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_e) {
    return false;
  }
};

const safeCachePut = async (request, response) => {
  if (!response || (!response.ok && response.type !== 'opaque') || !isHttpRequest(request)) return;
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.has('token') || requestUrl.searchParams.has('pw') || requestUrl.searchParams.has('pair')) return;
  // Never cache.put audio/stream bodies: a live Icecast/HLS response has no
  // end, so put() would consume it forever and balloon memory.
  const ctype = (response.headers.get('content-type') || '').toLowerCase();
  if (ctype.startsWith('audio/') || ctype.includes('mpegurl') || ctype.includes('octet-stream')) return;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response);
  } catch (_e) {
    // Ignore unsupported schemes and transient cache failures.
  }
};

self.addEventListener('install', event => {
  // Precache only the entry shell. Everything else (scripts, css, images,
  // icons) is runtime-cached on first request by the fetch handler below, so
  // offline keeps working after one normal visit. The old ~35-file addAll
  // downloaded everything in parallel with the page's own requests on every
  // SW update — a noticeable morning-after-update stall on the slow,
  // AV-scanned work machines.
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      appUrl('./'),
      appUrl('index.html'),
      appUrl('mobile.html'),
      appUrl('manifest.json'),
      appUrl('manifest-mobile.json'),
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Migrate still-valid entries from old caches instead of deleting them
  // outright: versioned (?v=) assets change URL when they change content, so
  // carrying entries over is safe and avoids re-downloading the whole app
  // after every update. Freshly precached shell entries are never overwritten.
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const fresh = await caches.open(CACHE);
    for (const key of keys) {
      if (key === CACHE) continue;
      try {
        const old = await caches.open(key);
        const reqs = await old.keys();
        for (const req of reqs) {
          // Never carry over code assets: unversioned .js/.css/.html change in
          // place between releases, so migrating the old copy would serve stale
          // code for one extra reload after every update. Dropping them here
          // forces a fresh network fetch on next request — the deploy lands
          // immediately. Versioned images/fonts are still carried over below.
          if (/\.(js|css|html)(\?|$)/i.test(req.url)) continue;
          if (await fresh.match(req)) continue;
          const res = await old.match(req);
          if (res) await fresh.put(req, res);
        }
      } catch (_e) {
        // Best effort — worst case the asset is refetched on demand.
      }
      await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const data = event && event.data;
  if (!data) return;
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = request.url;

  if (request.method !== 'GET' || !isHttpRequest(request)) return;

  // Live radio streams: never intercept. Piping an endless stream through the
  // SW keeps it alive all session, and the generic branch below would
  // clone()+cache.put the infinite body — unbounded memory growth that shows
  // up as a multi-second freeze when the PWA returns to the foreground.
  if (request.destination === 'audio' || request.destination === 'video') return;

  const isApiRequest = (() => {
    try {
      const parsed = new URL(url);
      return parsed.pathname.includes('/api/');
    } catch (_e) {
      return false;
    }
  })();

  if (isApiRequest) {
    event.respondWith(fetch(request));
    return;
  }

  // Respect callers that explicitly request fresh data. Without this guard,
  // the generic cache-first branch below can return an old response even when
  // fetch(..., { cache: 'no-store' }) was used.
  if (request.cache === 'no-store') {
    event.respondWith(fetch(request));
    return;
  }

  // Cross-origin fetch()/XHR responses are live data (Google Apps Script,
  // weather, RSS, Workers, radio metadata), not app-shell assets. Some of
  // these URLs contain timestamp cache-busters, so caching them would create
  // a new Cache Storage entry on every poll.
  const parsedUrl = new URL(url);
  if (!request.destination && parsedUrl.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  // Always prefer the current HTML while online. Cached HTML remains the
  // offline fallback, avoiding the old-shell-first / current-shell-on-reload
  // behavior of stale-while-revalidate navigations.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          event.waitUntil(safeCachePut(request, response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(appUrl('index.html'))) || new Response('', { status: 503, statusText: 'Offline' }))
    );
    return;
  }

  const isRemoteNetworkFirst =
    url.includes('cdn.') ||
    url.includes('fonts.') ||
    url.includes('cdnjs.') ||
    url.includes('googleapis.') ||
    url.includes('openweathermap') ||
    url.includes('rss2json') ||
    url.includes('streamtheworld') ||
    url.includes('radiorecord') ||
    url.includes('raw.githubusercontent.com') ||
    url.includes('api.github.com');

  if (isRemoteNetworkFirst) {
    event.respondWith(
      fetch(request)
        .then(response => {
          event.waitUntil(safeCachePut(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  const isCodeAsset = /\.(js|html|css)$/i.test(new URL(url).pathname);

  if (isCodeAsset) {
    // Stale-while-revalidate: serve from cache instantly (fast PWA wake even on
    // slow/AV-scanned networks), refresh the cache in the background. New
    // deploys still apply immediately via the CACHE version bump (precache on
    // install + old-cache cleanup on activate).
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request)
          .then(response => {
            event.waitUntil(safeCachePut(request, response.clone()));
            return response;
          })
          .catch(() => cached || new Response('', { status: 503, statusText: 'Offline' }));
        if (cached) {
          event.waitUntil(network.catch(() => {}));
          return cached;
        }
        return network;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async cached => {
      if (cached) return cached;
      try {
        const response = await fetch(request);
        event.waitUntil(safeCachePut(request, response.clone()));
        return response;
      } catch (_e) {
        return new Response('', { status: 503, statusText: 'Offline' });
      }
    })
  );
});
