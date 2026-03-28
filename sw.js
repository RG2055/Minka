const CACHE = 'minka-4.1.13';
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
  if (!response || !response.ok || !isHttpRequest(request)) return;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response);
  } catch (_e) {
    // Ignore unsupported schemes and transient cache failures.
  }
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      appUrl('./'),
      appUrl('index.html'),
      appUrl('manifest.json'),
      appUrl('kalendars/index.html'),
      appUrl('data/icon-192.png'),
      appUrl('data/icon-512.png'),
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
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
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  const isCodeAsset =
    url.endsWith('.js') ||
    url.endsWith('.html') ||
    url.endsWith('.css');

  if (isCodeAsset) {
    event.respondWith(
      fetch(request)
        .then(response => {
          safeCachePut(request, response.clone());
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response('', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async cached => {
      if (cached) return cached;
      try {
        const response = await fetch(request);
        safeCachePut(request, response.clone());
        return response;
      } catch (_e) {
        return new Response('', { status: 503, statusText: 'Offline' });
      }
    })
  );
});
