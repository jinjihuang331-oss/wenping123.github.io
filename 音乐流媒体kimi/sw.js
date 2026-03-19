// Service Worker for Music Streaming App
const CACHE_NAME = 'music-stream-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/mock-data.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.min.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => {
                console.error('Failed to cache static assets:', err);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle audio files
    if (request.url.includes('.mp3') || request.url.includes('SoundHelix')) {
        event.respondWith(handleAudioRequest(request));
        return;
    }

    // Handle static assets
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    fetch(request)
                        .then(networkResponse => {
                            if (networkResponse.ok) {
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(request, networkResponse.clone()));
                            }
                        })
                        .catch(() => {});
                    return cachedResponse;
                }

                // Fetch from network and cache
                return fetch(request)
                    .then(networkResponse => {
                        if (!networkResponse.ok) {
                            throw new Error('Network response was not ok');
                        }

                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, responseClone));

                        return networkResponse;
                    })
                    .catch(error => {
                        console.error('Fetch failed:', error);
                        // Return offline fallback for HTML requests
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        throw error;
                    });
            })
    );
});

// Handle audio file requests with range support
async function handleAudioRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Audio fetch failed:', error);
        throw error;
    }
}

// Background sync for playlist updates
self.addEventListener('sync', event => {
    if (event.tag === 'update-playlist') {
        event.waitUntil(updatePlaylistInBackground());
    }
});

async function updatePlaylistInBackground() {
    // Simulate playlist update
    console.log('Background playlist update');
}

// Push notifications (for collaborative updates)
self.addEventListener('push', event => {
    const data = event.data.json();

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: data.tag,
            requireInteraction: true
        })
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

// Message handler from main thread
self.addEventListener('message', event => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
