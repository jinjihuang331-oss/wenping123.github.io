const CACHE_NAME = 'travel-map-v1';
const TILE_CACHE = 'tile-cache-v1';
const MAX_TILES = 500;

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== TILE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// LRU eviction for tile cache
async function evictTilesIfNeeded() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  if (keys.length <= MAX_TILES) return;
  const excess = keys.length - MAX_TILES;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Map tiles: Cache-First with LRU
  if (url.hostname.endsWith('.tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          // Re-add to end for LRU ordering
          await cache.put(event.request, cached.clone());
          return cached;
        }
        try {
          const response = await fetch(event.request);
          await cache.put(event.request, response.clone());
          await evictTilesIfNeeded();
          return response;
        } catch {
          return new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // OSRM API: Network-First
  if (url.hostname === 'router.project-osrm.org') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        } catch {
          const cached = await caches.match(event.request);
          return cached || new Response(JSON.stringify({ code: 'Error' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          });
        }
      })()
    );
    return;
  }

  // Static assets & other: Cache-First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
