// =============================================
// 旅行地图 - Travel Map Application
// Leaflet + OpenStreetMap
// =============================================

(function () {
    'use strict';

    // ---------- 常量 ----------
    const STORAGE_KEY = 'travel_map_landmarks';
    const CATEGORY_LABELS = {
        scenic: '自然风光',
        culture: '文化古迹',
        food: '美食推荐',
        hotel: '住宿',
        other: '其他'
    };

    const CATEGORY_COLORS = {
        scenic: '#27ae60',
        culture: '#e67e22',
        food: '#e74c3c',
        hotel: '#9b59b6',
        other: '#95a5a6'
    };

    const SPEEDS = {
        walking: 5,     // km/h
        biking: 15,
        driving: 60
    };

    // ---------- 状态 ----------
    let map;
    let markers = [];
    let routeLayer = null;
    let pendingLatLng = null;
    let panelOpen = false;

    // ---------- DOM ----------
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const btnAdd = $('#btn-add-marker');
    const btnClear = $('#btn-clear');
    const btnRoute = $('#btn-route');
    const btnSave = $('#btn-save');
    const btnInstall = $('#btn-install');

    const sidePanel = $('#side-panel');
    const panelTitle = $('#panel-title');
    const panelContent = $('#panel-content');

    const markerOverlay = $('#marker-form-overlay');
    const markerName = $('#marker-name');
    const markerDesc = $('#marker-desc');
    const markerCategory = $('#marker-category');
    const markerCancel = $('#marker-cancel');
    const markerConfirm = $('#marker-confirm');

    const routePanel = $('#route-panel');
    const routeStart = $('#route-start');
    const routeEnd = $('#route-end');
    const routeMode = $('#route-mode');
    const routeResult = $('#route-result');
    const routeDistance = $('#route-distance');
    const routeTime = $('#route-time');
    const routeCancel = $('#route-cancel');
    const routeCalc = $('#route-calc');

    const statusText = $('#status-text');
    const cacheStatus = $('#cache-status');

    // ---------- 初始化地图 ----------
    function initMap() {
        map = L.map('map', {
            center: [39.9042, 116.4074], // 北京
            zoom: 12,
            zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // 双击添加景点（带延迟避免缩放冲突）
        let clickTimer = null;
        map.on('click', (e) => {
            if (clickTimer) clearTimeout(clickTimer);
            clickTimer = setTimeout(() => {
                pendingLatLng = e.latlng;
                showMarkerForm();
            }, 250);
        });

        map.on('dblclick', () => {
            if (clickTimer) clearTimeout(clickTimer);
        });

        updateStatus('地图已加载');
    }

    // ---------- 景点 CRUD ----------
    function loadLandmarks() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    function saveLandmarks() {
        const data = markers.map((m) => m.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function createMarkerIcon(color) {
        return L.divIcon({
            className: 'custom-marker-wrapper',
            html: `<div class="custom-marker" style="background:${color}"><span>📍</span></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    }

    function addMarker(lat, lng, name, desc, category) {
        const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
        const icon = createMarkerIcon(color);

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.data = { id: Date.now() + Math.random(), lat, lng, name, desc, category };

        // 弹窗
        const popup = L.popup({ closeOnClick: false, maxWidth: 260 }).setContent(buildPopupContent(marker.data));
        marker.bindPopup(popup);

        // 点击卡片时定位
        marker.on('click', () => {
            map.setView([lat, lng], 15);
        });

        markers.push(marker);
        saveLandmarks();
        renderLandmarkList();
        updateStatus(`已添加景点: ${name}`);
        return marker;
    }

    function removeMarker(id) {
        const idx = markers.findIndex((m) => m.data.id === id);
        if (idx === -1) return;
        map.removeLayer(markers[idx]);
        markers.splice(idx, 1);
        saveLandmarks();
        renderLandmarkList();
        updateStatus('景点已删除');
    }

    function clearAllMarkers() {
        if (markers.length === 0) return;
        if (!confirm('确定要清除所有景点吗？')) return;
        markers.forEach((m) => map.removeLayer(m));
        markers = [];
        if (routeLayer) {
            map.removeLayer(routeLayer);
            routeLayer = null;
        }
        saveLandmarks();
        renderLandmarkList();
        updateStatus('已清除所有景点');
    }

    // ---------- 弹窗内容 ----------
    function buildPopupContent(data) {
        return `
            <div class="marker-popup">
                <h4>${escapeHtml(data.name)}</h4>
                <p>${escapeHtml(data.desc || '暂无描述')}</p>
                <span class="popup-category">${CATEGORY_LABELS[data.category] || '其他'}</span>
                <div class="popup-actions">
                    <button class="popup-btn popup-btn-delete" data-id="${data.id}">删除</button>
                    <button class="popup-btn popup-btn-route" data-id="${data.id}">以此为起点</button>
                </div>
            </div>
        `;
    }

    // ---------- 景点列表渲染 ----------
    function renderLandmarkList() {
        if (markers.length === 0) {
            panelContent.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p>点击地图添加景点<br>或点击"添加景点"按钮</p>
                </div>`;
            return;
        }

        let html = '';
        markers.forEach((m) => {
            const d = m.data;
            const cls = `cat-${d.category}`;
            html += `
                <div class="landmark-card" data-id="${d.id}">
                    <div class="card-header">
                        <span class="card-title">${escapeHtml(d.name)}</span>
                        <span class="card-category ${cls}">${CATEGORY_LABELS[d.category]}</span>
                    </div>
                    <div class="card-desc">${escapeHtml(d.desc || '暂无描述')}</div>
                    <div class="card-coords">${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</div>
                </div>`;
        });

        panelContent.innerHTML = html;

        // 绑定卡片点击事件
        panelContent.querySelectorAll('.landmark-card').forEach((card) => {
            card.addEventListener('click', () => {
                const id = parseFloat(card.dataset.id);
                const marker = markers.find((m) => m.data.id === id);
                if (marker) {
                    map.setView([marker.data.lat, marker.data.lng], 15);
                    marker.openPopup();
                }
            });
        });
    }

    // ---------- 表单弹窗 ----------
    function showMarkerForm() {
        markerOverlay.classList.remove('hidden');
        markerName.value = '';
        markerDesc.value = '';
        markerCategory.value = 'scenic';
        markerName.focus();
    }

    function hideMarkerForm() {
        markerOverlay.classList.add('hidden');
        pendingLatLng = null;
    }

    // ---------- 路线规划 ----------
    function showRoutePanel() {
        if (markers.length < 2) {
            showToast('至少需要 2 个景点才能规划路线');
            return;
        }

        // 填充下拉选项
        const options = markers.map((m) => {
            const d = m.data;
            return `<option value="${d.id}">${escapeHtml(d.name)}</option>`;
        }).join('');

        routeStart.innerHTML = options;
        routeEnd.innerHTML = options;

        // 默认选第一个和最后一个
        if (markers.length >= 2) {
            routeStart.value = markers[0].data.id;
            routeEnd.value = markers[markers.length - 1].data.id;
        }

        routeResult.classList.add('hidden');
        routePanel.classList.remove('hidden');
    }

    function hideRoutePanel() {
        routePanel.classList.add('hidden');
    }

    function calculateRoute() {
        const startId = parseFloat(routeStart.value);
        const endId = parseFloat(routeEnd.value);
        const mode = routeMode.value;

        if (startId === endId) {
            showToast('起点和终点不能相同');
            return;
        }

        const start = markers.find((m) => m.data.id === startId);
        const end = markers.find((m) => m.data.id === endId);

        if (!start || !end) return;

        // 移除旧路线
        if (routeLayer) {
            map.removeLayer(routeLayer);
        }

        // 计算直线距离 (Haversine)
        const dist = haversineDistance(
            start.data.lat, start.data.lng,
            end.data.lat, end.data.lng
        );

        // 绘制路线
        const latlngs = [
            [start.data.lat, start.data.lng],
            [end.data.lat, end.data.lng]
        ];
        routeLayer = L.polyline(latlngs, {
            color: '#4A90D9',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 6'
        }).addTo(map);

        // 适配视图
        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

        // 预估时间
        const speed = SPEEDS[mode];
        const hours = dist / speed;
        const timeStr = formatTime(hours);

        // 显示结果
        routeDistance.textContent = `${dist.toFixed(2)} km`;
        routeTime.textContent = timeStr;
        routeResult.classList.remove('hidden');

        updateStatus(`路线计算完成: ${dist.toFixed(2)} km (${timeStr})`);
    }

    // Haversine 公式计算球面距离
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球半径 km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRad(deg) {
        return deg * Math.PI / 180;
    }

    function formatTime(hours) {
        if (hours < 1) {
            return `${Math.round(hours * 60)} 分钟`;
        }
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (m === 0) return `${h} 小时`;
        return `${h} 小时 ${m} 分钟`;
    }

    // ---------- 侧边栏 ----------
    function togglePanel() {
        panelOpen = !panelOpen;
        sidePanel.classList.toggle('open', panelOpen);
    }

    function openPanel() {
        panelOpen = true;
        sidePanel.classList.add('open');
    }

    function closePanel() {
        panelOpen = false;
        sidePanel.classList.remove('open');
    }

    // ---------- 工具函数 ----------
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(msg) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function updateStatus(text) {
        statusText.textContent = text;
    }

    // ---------- 保存/加载行程 ----------
    function exportTrip() {
        if (markers.length === 0) {
            showToast('没有景点可保存');
            return;
        }
        const data = markers.map((m) => m.data);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trip_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('行程已导出');
    }

    function importTrip() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (!Array.isArray(data)) throw new Error('格式错误');

                    // 清除旧数据
                    markers.forEach((m) => map.removeLayer(m));
                    markers = [];

                    data.forEach((d) => {
                        addMarker(d.lat, d.lng, d.name, d.desc, d.category);
                    });

                    // 适配视图
                    if (markers.length > 0) {
                        const bounds = L.latLngBounds(markers.map((m) => [m.data.lat, m.data.lng]));
                        map.fitBounds(bounds, { padding: [50, 50] });
                    }

                    showToast(`已导入 ${data.length} 个景点`);
                } catch (err) {
                    showToast('导入失败: 文件格式错误');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // ---------- PWA / Service Worker ----------
    function registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then((reg) => {
                    console.log('ServiceWorker 注册成功');
                    updateCacheStatus('cached');
                })
                .catch((err) => {
                    console.log('ServiceWorker 注册失败:', err);
                });
        }
    }

    function updateCacheStatus(status) {
        cacheStatus.className = 'cache-dot ' + status;
    }

    // 监听在线/离线状态
    function setupOnlineStatus() {
        const update = () => {
            if (navigator.onLine) {
                updateCacheStatus('online');
                updateStatus('在线 - 数据已同步');
            } else {
                updateCacheStatus('offline');
                updateStatus('离线模式 - 使用缓存数据');
            }
        };
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        update();
    }

    // 安装提示
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        btnInstall.classList.remove('hidden');
    });

    btnInstall.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        btnInstall.classList.add('hidden');
        if (outcome === 'accepted') {
            showToast('应用已安装到桌面');
        }
    });

    // ---------- 事件绑定 ----------
    function bindEvents() {
        // 工具栏
        btnAdd.addEventListener('click', () => {
            const center = map.getCenter();
            pendingLatLng = center;
            showMarkerForm();
        });

        btnClear.addEventListener('click', clearAllMarkers);
        btnRoute.addEventListener('click', showRoutePanel);
        btnSave.addEventListener('click', exportTrip);

        // 景点表单
        markerCancel.addEventListener('click', hideMarkerForm);
        markerConfirm.addEventListener('click', () => {
            const name = markerName.value.trim();
            if (!name) {
                markerName.focus();
                showToast('请输入景点名称');
                return;
            }
            if (!pendingLatLng) {
                showToast('请先在地图上选择位置');
                return;
            }
            addMarker(
                pendingLatLng.lat,
                pendingLatLng.lng,
                name,
                markerDesc.value.trim(),
                markerCategory.value
            );
            hideMarkerForm();
        });

        // 路线面板
        routeCancel.addEventListener('click', hideRoutePanel);
        routeCalc.addEventListener('click', calculateRoute);

        // 侧边栏
        $('.panel-close').addEventListener('click', closePanel);

        // 弹窗按钮事件委托
        document.addEventListener('click', (e) => {
            // 删除按钮
            if (e.target.classList.contains('popup-btn-delete')) {
                const id = parseFloat(e.target.dataset.id);
                removeMarker(id);
            }
            // 路线起点按钮
            if (e.target.classList.contains('popup-btn-route')) {
                const id = parseFloat(e.target.dataset.id);
                const marker = markers.find((m) => m.data.id === id);
                if (marker) {
                    showRoutePanel();
                    routeStart.value = id;
                }
            }
        });

        // 点击遮罩关闭
        markerOverlay.addEventListener('click', (e) => {
            if (e.target === markerOverlay) hideMarkerForm();
        });
        routePanel.addEventListener('click', (e) => {
            if (e.target === routePanel) hideRoutePanel();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideMarkerForm();
                hideRoutePanel();
            }
        });

        // 拖放导入
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        if (!Array.isArray(data)) throw new Error('格式错误');
                        markers.forEach((m) => map.removeLayer(m));
                        markers = [];
                        data.forEach((d) => addMarker(d.lat, d.lng, d.name, d.desc, d.category));
                        if (markers.length > 0) {
                            const bounds = L.latLngBounds(markers.map((m) => [m.data.lat, m.data.lng]));
                            map.fitBounds(bounds, { padding: [50, 50] });
                        }
                        showToast(`已导入 ${data.length} 个景点`);
                    } catch {
                        showToast('导入失败: 文件格式错误');
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    // ---------- 启动 ----------
    function init() {
        initMap();
        bindEvents();
        registerSW();
        setupOnlineStatus();

        // 恢复已保存的景点
        const saved = loadLandmarks();
        if (saved.length > 0) {
            saved.forEach((d) => {
                addMarker(d.lat, d.lng, d.name, d.desc, d.category);
            });
            // 适配视图
            const bounds = L.latLngBounds(saved.map((d) => [d.lat, d.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
            updateStatus(`已恢复 ${saved.length} 个景点`);
        }
    }

    // DOM 就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
