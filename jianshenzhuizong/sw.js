const CACHE_NAME = 'fitness-tracker-v1.0.0';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/db.js',
  './js/app.js',
  './js/charts.js',
  './js/goals.js',
  './js/share.js',
  './js/pedometer.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache local assets first
        return cache.addAll(ASSETS_TO_CACHE).then(() => {
          // Optionally cache CDN assets (non-blocking)
          return Promise.allSettled(
            CDN_ASSETS.map(url =>
              fetch(url)
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                })
                .catch(() => {}) // CDN caching is best-effort
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch - Cache first, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) URLs
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache - fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache non-OK responses or opaque responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Cache successful responses
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));

            return networkResponse;
          })
          .catch(() => {
            // Network failed - try to return an offline page
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
