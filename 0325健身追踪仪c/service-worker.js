const CACHE_NAME = 'fitness-tracker-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
];

// Install - cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Cache local files first, tolerate CDN failures
                return Promise.allSettled(
                    ASSETS.map(url => cache.add(url).catch(() => {
                        console.warn('Failed to cache:', url);
                    }))
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch - cache-first for assets, network-first for API-like requests
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;

                return fetch(event.request)
                    .then(response => {
                        // Cache successful responses for offline use
                        if (response.ok && (event.request.url.startsWith(self.location.origin) ||
                            event.request.url.includes('cdn.jsdelivr.net'))) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Fallback for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});
