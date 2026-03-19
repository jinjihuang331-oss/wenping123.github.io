// Service Worker for 健身追踪仪表盘 PWA
const CACHE_NAME = 'fitness-tracker-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512.png'
];

// CDN resources to cache
const CDN_RESOURCES = [
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Cache CDN resources separately to handle failures gracefully
        return caches.open(CACHE_NAME + '-cdn')
          .then((cdnCache) => {
            return Promise.all(
              CDN_RESOURCES.map((url) => {
                return fetch(url, { mode: 'no-cors' })
                  .then((response) => {
                    if (response.ok || response.type === 'opaque') {
                      return cdnCache.put(url, response);
                    }
                  })
                  .catch((err) => {
                    console.log('[Service Worker] Failed to cache CDN resource:', url);
                  });
              })
            );
          });
      })
      .then(() => {
        console.log('[Service Worker] Install completed');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[Service Worker] Install failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== CACHE_NAME + '-cdn') {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation completed');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle CDN resources
  if (CDN_RESOURCES.includes(request.url)) {
    event.respondWith(
      caches.open(CACHE_NAME + '-cdn')
        .then((cache) => {
          return cache.match(request)
            .then((response) => {
              if (response) {
                // Return cached version and update in background
                fetch(request)
                  .then((networkResponse) => {
                    if (networkResponse.ok) {
                      cache.put(request, networkResponse.clone());
                    }
                  })
                  .catch(() => {});
                return response;
              }

              // Fetch and cache
              return fetch(request)
                .then((networkResponse) => {
                  if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone());
                  }
                  return networkResponse;
                })
                .catch(() => {
                  // Return offline fallback if available
                  return new Response('CDN resource unavailable offline', {
                    status: 503,
                    statusText: 'Service Unavailable'
                  });
                });
            });
        })
    );
    return;
  }

  // Handle same-origin requests with Cache-First strategy
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            // Return cached version
            return response;
          }

          // Fetch from network
          return fetch(request)
            .then((networkResponse) => {
              // Don't cache if not a valid response
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }

              // Clone the response
              const responseToCache = networkResponse.clone();

              // Add to cache
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });

              return networkResponse;
            })
            .catch((error) => {
              console.log('[Service Worker] Fetch failed:', error);

              // Return offline page for navigation requests
              if (request.mode === 'navigate') {
                return caches.match('/offline.html');
              }

              return new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }

  // Handle external requests with Network-First strategy
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkouts());
  }
});

// Periodic background sync (for daily step reset)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-step-reset') {
    event.waitUntil(handleDailyStepReset());
  }
});

// Push notifications (optional - for reminders)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '不要忘记今天的锻炼！',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/?action=add-workout'
    },
    actions: [
      {
        action: 'record',
        title: '记录锻炼',
        icon: '/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: '稍后',
        icon: '/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('健身追踪', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'record') {
    event.waitUntil(
      clients.openWindow('/?action=add-workout')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions
async function syncWorkouts() {
  // This would sync with a backend server if available
  console.log('[Service Worker] Syncing workouts...');
}

async function handleDailyStepReset() {
  // Send message to all clients to reset daily steps
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'DAILY_STEP_RESET'
    });
  });
}

// Message handler from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
