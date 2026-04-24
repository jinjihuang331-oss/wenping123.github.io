// ============================================================
// Service Worker - 离线缓存
// ============================================================

const CACHE_NAME = 'travel-map-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  // CDN 资源（缓存外壳，实际地图瓦片动态缓存）
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css',
  'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
];

// 安装 - 预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // CDN 资源失败不影响安装
        console.log('部分资源预缓存失败，将在运行时缓存');
      });
    })
  );
  self.skipWaiting();
});

// 激活 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 请求拦截 - 缓存优先，带回退
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 地图瓦片 - 网络优先，失败用缓存
  if (isTileRequest(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 路线 API - 网络优先
  if (url.hostname === 'router.project-osrm.org') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 其他请求 - 缓存优先
  event.respondWith(cacheFirst(event.request));
});

// 缓存优先策略
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 离线回退
    return new Response('离线模式暂不可用', { status: 503 });
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return await caches.match(request) || new Response('离线', { status: 503 });
  }
}

function isTileRequest(url) {
  const tileHosts = [
    'tile.openstreetmap.org',
    'basemaps.cartocdn.com',
    'tile.opentopomap.org',
    'tiles.stadiamaps.com',
  ];
  return tileHosts.some((h) => url.hostname.includes(h));
}
