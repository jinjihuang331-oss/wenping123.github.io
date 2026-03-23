// =============================================
// Service Worker - 离线缓存
// =============================================

const CACHE_NAME = 'travel-map-v1';

// 需要缓存的资源
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// 第三方 CDN 资源（缓存 OSM 瓦片）
const CDN_URL_PATTERN = /^https?:\/\/.*\.tile\.openstreetmap\.org\//;

// ---------- 安装: 预缓存核心资源 ----------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] 预缓存核心资源');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// ---------- 激活: 清理旧缓存 ----------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] 删除旧缓存:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// ---------- 拦截请求: 缓存优先策略 ----------
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 只处理 GET 请求
    if (request.method !== 'GET') return;

    // OSM 瓦片: 缓存优先，失败返回缓存
    if (CDN_URL_PATTERN.test(url.href)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;

                return fetch(request).then((response) => {
                    // 只缓存成功响应
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => {
                    // 离线时返回占位图
                    return new Response(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">'
                            + '<rect width="256" height="256" fill="#e8e8e8"/>'
                            + '<text x="128" y="130" text-anchor="middle" font-size="14" fill="#999">离线</text>'
                            + '</svg>',
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                    );
                });
            })
        );
        return;
    }

    // 同源请求: 缓存优先，网络回退
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const fetchPromise = fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });

                return cached || fetchPromise;
            })
        );
        return;
    }

    // Leaflet CDN: 网络优先，缓存回退
    event.respondWith(
        fetch(request).then((response) => {
            if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
            }
            return response;
        }).catch(() => caches.match(request))
    );
});
