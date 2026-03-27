// ============================================================
// 旅行地图 - 交互式旅行地图应用
// Leaflet + OpenStreetMap + PWA
// ============================================================

(function () {
  'use strict';

  // ---------- Constants ----------
  const STORAGE_KEY = 'travelMapData';
  const CATEGORY_COLORS = {
    '🏛️': '#3498db', '🏔️': '#27ae60', '🏖️': '#f39c12',
    '🍜': '#e67e22', '🎭': '#9b59b6', '🏨': '#1abc9c',
    '✈️': '#e74c3c', '📷': '#34495e', '🎡': '#ff6b81'
  };
  const DEFAULT_CATEGORY = '🏛️';

  // ---------- State ----------
  let map = null;
  let markers = [];
  let polylines = [];
  let selectedMarker = null;
  let routeLayer = null;
  let categoryIcons = null;
  let deferredPrompt = null;

  // ---------- Init ----------
  function init() {
    initMap();
    initCategoryIcons();
    loadFromStorage();
    bindEvents();
    registerServiceWorker();
    listenInstallPrompt();
    renderMarkerList();
    updateRouteInfo();
  }

  // ---------- Map ----------
  function initMap() {
    map = L.map('map', {
      center: [35.8617, 104.1954], // China center
      zoom: 5,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Click on map to add marker
    map.on('click', onMapClick);
  }

  function initCategoryIcons() {
    categoryIcons = L.Icon.extend({
      options: {
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
        className: 'custom-marker'
      }
    });
  }

  // ---------- Markers ----------
  function createMarkerIcon(emoji) {
    const color = CATEGORY_COLORS[emoji] || '#3498db';
    return L.divIcon({
      html: `<div style="
        width:28px;height:28px;border-radius:50%;background:${color};
        display:flex;align-items:center;justify-content:center;
        font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);
        border:2px solid #fff;cursor:pointer;
      ">${emoji}</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  }

  function addMarker(data) {
    const id = generateId();
    const markerData = {
      id,
      name: data.name || '未命名景点',
      description: data.description || '',
      emoji: data.emoji || DEFAULT_CATEGORY,
      lat: data.lat,
      lng: data.lng,
      createdAt: Date.now()
    };

    const icon = createMarkerIcon(markerData.emoji);
    const marker = L.marker([markerData.lat, markerData.lng], { icon })
      .addTo(map)
      .bindPopup(buildPopup(markerData), { className: 'custom-popup' });

    marker.on('click', () => {
      selectedMarker = markerData.id;
      highlightMarkerInList(markerData.id);
    });

    markerData._marker = marker;
    markers.push(markerData);
    saveToStorage();
    renderMarkerList();
    updateRouteInfo();
    map.setView([markerData.lat, markerData.lng], map.getZoom());

    return markerData;
  }

  function buildPopup(data) {
    const color = CATEGORY_COLORS[data.emoji] || '#3498db';
    return `
      <div class="popup-header">
        <div class="popup-icon" style="background:${color}20;border:1px solid ${color};">${data.emoji}</div>
        <div class="popup-title">${escapeHtml(data.name)}</div>
      </div>
      ${data.description ? `<div class="popup-desc">${escapeHtml(data.description)}</div>` : ''}
      <div class="popup-meta">
        <span>📍 ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}</span>
        <span>📅 ${new Date(data.createdAt).toLocaleDateString('zh-CN')}</span>
      </div>
      <div style="margin-top:10px;display:flex;gap:6px;">
        <button class="btn btn-danger" style="padding:4px 10px;font-size:11px;"
                onclick="window.TravelMap.deleteMarker('${data.id}')">删除</button>
        <button class="btn btn-secondary" style="padding:4px 10px;font-size:11px;"
                onclick="window.TravelMap.centerOnMarker('${data.id}')">定位</button>
      </div>
    `;
  }

  function deleteMarker(id) {
    const idx = markers.findIndex(m => m.id === id);
    if (idx === -1) return;

    const markerData = markers[idx];
    if (markerData._marker) {
      map.removeLayer(markerData._marker);
    }
    markers.splice(idx, 1);
    saveToStorage();
    renderMarkerList();
    updateRouteInfo();
    redrawRoute();
  }

  function centerOnMarker(id) {
    const markerData = markers.find(m => m.id === id);
    if (markerData && markerData._marker) {
      map.setView([markerData.lat, markerData.lng], 12, { animate: true });
      markerData._marker.openPopup();
    }
  }

  // ---------- Route ----------
  function calculateRoute() {
    if (markers.length < 2) return null;

    let totalDistance = 0;
    const legs = [];

    for (let i = 0; i < markers.length - 1; i++) {
      const from = markers[i];
      const to = markers[i + 1];
      const dist = calculateDistance(from.lat, from.lng, to.lat, to.lng);
      totalDistance += dist;
      legs.push({
        from: from.name,
        to: to.name,
        distance: dist
      });
    }

    return { totalDistance, legs, count: markers.length };
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function toRad(deg) {
    return deg * Math.PI / 180;
  }

  function formatDistance(km) {
    if (km >= 1000) return (km / 1000).toFixed(1) + ' 万公里';
    if (km >= 1) return km.toFixed(1) + ' km';
    return Math.round(km * 1000) + ' m';
  }

  function redrawRoute() {
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }

    if (markers.length < 2) return;

    const points = markers.map(m => [m.lat, m.lng]);
    routeLayer = L.polyline(points, {
      color: '#3498db',
      weight: 3,
      opacity: 0.7,
      dashArray: '8, 8'
    }).addTo(map);

    // Fit map to show all markers + route
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  }

  // ---------- Storage ----------
  function saveToStorage() {
    const data = markers.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      emoji: m.emoji,
      lat: m.lat,
      lng: m.lng,
      createdAt: m.createdAt
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      data.forEach(item => {
        const icon = createMarkerIcon(item.emoji);
        const marker = L.marker([item.lat, item.lng], { icon })
          .addTo(map)
          .bindPopup(buildPopup(item), { className: 'custom-popup' });

        marker.on('click', () => {
          selectedMarker = item.id;
          highlightMarkerInList(item.id);
        });

        item._marker = marker;
        markers.push(item);
      });
      redrawRoute();
    } catch (e) {
      console.error('Failed to load markers:', e);
    }
  }

  // ---------- UI ----------
  function renderMarkerList() {
    const container = document.getElementById('marker-list');
    if (!container) return;

    if (markers.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🗺️</div>
          <p>还没有景点</p>
          <p style="margin-top:4px;">点击地图或使用表单添加</p>
        </div>
      `;
      return;
    }

    container.innerHTML = markers.map(m => {
      const color = CATEGORY_COLORS[m.emoji] || '#3498db';
      return `
        <div class="marker-item ${selectedMarker === m.id ? 'active' : ''}"
             data-id="${m.id}"
             onclick="window.TravelMap.centerOnMarker('${m.id}')">
          <div class="marker-icon" style="background:${color}15;color:${color};">${m.emoji}</div>
          <div class="marker-info">
            <div class="name">${escapeHtml(m.name)}</div>
            <div class="coords">${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</div>
          </div>
          <div class="marker-actions">
            <button class="btn btn-danger"
                    onclick="event.stopPropagation();window.TravelMap.deleteMarker('${m.id}')"
                    style="padding:4px 8px;font-size:11px;">删除</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateRouteInfo() {
    const route = calculateRoute();
    const summary = document.getElementById('route-summary');
    const list = document.getElementById('route-list');

    if (!route || route.count < 2) {
      if (summary) {
        summary.innerHTML = `<p style="font-size:13px;color:#999;">添加至少 2 个景点以查看路线</p>`;
      }
      if (list) list.innerHTML = '';
      return;
    }

    if (summary) {
      summary.innerHTML = `
        <h3>📍 路线概览</h3>
        <div class="route-stat">
          <span>景点数量</span>
          <span class="value">${route.count} 个</span>
        </div>
        <div class="route-stat">
          <span>总距离</span>
          <span class="value">${formatDistance(route.totalDistance)}</span>
        </div>
      `;
    }

    if (list) {
      list.innerHTML = `
        <h3 style="font-size:13px;color:#2c3e50;margin-bottom:8px;">🗺️ 路线详情</h3>
        ${route.legs.map((leg, i) => `
          <div class="route-item">
            <span class="route-num">${i + 1}</span>
            <span style="flex:1;">${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</span>
            <span style="color:#2c3e50;font-weight:600;">${formatDistance(leg.distance)}</span>
          </div>
        `).join('')}
      `;
    }
  }

  function highlightMarkerInList(id) {
    document.querySelectorAll('.marker-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });
  }

  function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('collapsed');
  }

  // ---------- Events ----------
  function bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Sidebar toggle
    const toggleBtn = document.querySelector('.sidebar-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);

    // Add marker form
    const addForm = document.getElementById('add-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const name = form.name.value.trim();
        const description = form.description.value.trim();
        const emoji = form.emoji.value;

        if (!name) {
          alert('请输入景点名称');
          return;
        }

        // Use current map center or a default location
        const center = map.getCenter();
        addMarker({
          name,
          description,
          emoji,
          lat: center.lat,
          lng: center.lng
        });

        form.reset();
        form.name.focus();
      });
    }

    // Clear all
    const clearBtn = document.getElementById('clear-all');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (markers.length === 0) return;
        if (!confirm(`确定要删除全部 ${markers.length} 个景点吗？`)) return;
        markers.forEach(m => {
          if (m._marker) map.removeLayer(m._marker);
        });
        markers = [];
        saveToStorage();
        renderMarkerList();
        updateRouteInfo();
        if (routeLayer) {
          map.removeLayer(routeLayer);
          routeLayer = null;
        }
      });
    }

    // Show route
    const showRouteBtn = document.getElementById('show-route');
    if (showRouteBtn) {
      showRouteBtn.addEventListener('click', () => {
        if (markers.length < 2) {
          alert('请至少添加 2 个景点');
          return;
        }
        redrawRoute();
      });
    }

    // Export
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = markers.map(m => ({
          name: m.name,
          description: m.description,
          category: m.emoji,
          latitude: m.lat,
          longitude: m.lng,
          addedAt: new Date(m.createdAt).toISOString()
        }));
        const json = JSON.stringify(data, null, 2);
        downloadFile('旅行地图_' + formatDate() + '.json', json, 'application/json');
      });
    }

    // Import
    const importInput = document.getElementById('import-file');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw new Error('Invalid format');
            data.forEach(item => {
              addMarker({
                name: item.name || '未命名',
                description: item.description || '',
                emoji: item.category || item.emoji || DEFAULT_CATEGORY,
                lat: item.latitude || item.lat || 0,
                lng: item.longitude || item.lng || 0
              });
            });
            redrawRoute();
          } catch (err) {
            alert('导入失败：文件格式不正确');
          }
        };
        reader.readAsText(file);
        importInput.value = '';
      });
    }
  }

  function onMapClick(e) {
    addMarker({
      name: '新景点',
      description: '',
      emoji: DEFAULT_CATEGORY,
      lat: e.latlng.lat,
      lng: e.latlng.lng
    });
  }

  // ---------- PWA ----------
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.error('SW failed:', err));
    }
  }

  function listenInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const banner = document.getElementById('pwa-banner');
      if (banner) banner.classList.add('show');
    });
  }

  function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((result) => {
      deferredPrompt = null;
      const banner = document.getElementById('pwa-banner');
      if (banner) banner.classList.remove('show');
    });
  }

  // ---------- Helpers ----------
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function _toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
  }

  // ---------- Global API ----------
  window.TravelMap = {
    deleteMarker,
    centerOnMarker,
    installPWA,
    _toggleSidebar
  };

  // ---------- Boot ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
