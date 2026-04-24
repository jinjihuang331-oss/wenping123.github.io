// ============================================================
// 旅行地图 - Travel Map App
// ============================================================

(function () {
  'use strict';

  // ---- 状态 ----
  const state = {
    spots: JSON.parse(localStorage.getItem('travel_spots') || '[]'),
    pendingLatLng: null,
    editingId: null,
    routeControl: null,
    markers: {},
    tileLayer: null,
    markerGroup: null,
    clusterGroup: null,
  };

  // ---- 瓦片源 ----
  const TILES = {
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attr: '&copy; <a href="https://carto.com/">CARTO</a>',
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attr: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
    watercolor: {
      url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
      attr: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    },
  };

  // ---- 分类配置 ----
  const CATEGORIES = {
    sights:    { icon: '🏛️', label: '景点', color: '#ef4444' },
    food:      { icon: '🍜', label: '美食', color: '#f97316' },
    hotel:     { icon: '🏨', label: '住宿', color: '#3b82f6' },
    transport: { icon: '🚉', label: '交通', color: '#22c55e' },
    shopping:  { icon: '🛍️', label: '购物', color: '#a855f7' },
    other:     { icon: '📍', label: '其他', color: '#6b7280' },
  };

  // ---- 地图初始化 ----
  const map = L.map('map', {
    center: [35.86, 104.19],
    zoom: 5,
    zoomControl: false,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  state.tileLayer = L.tileLayer(TILES.standard.url, {
    attribution: TILES.standard.attr,
    maxZoom: 19,
  }).addTo(map);

  // ---- 自定义标记图标 ----
  function createIcon(category, index) {
    const cat = CATEGORIES[category] || CATEGORIES.other;
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-pin" style="--color: ${cat.color}">
          <div class="marker-number">${index}</div>
          <div class="marker-emoji">${cat.icon}</div>
        </div>
        <div class="marker-pulse"></div>
      `,
      iconSize: [40, 52],
      iconAnchor: [20, 52],
      popupAnchor: [0, -52],
    });
  }

  // ---- 标记集群 ----
  state.clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 60,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction(cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        className: 'cluster-icon',
        html: `<span>${count}</span>`,
        iconSize: [44, 44],
      });
    },
  });
  map.addLayer(state.clusterGroup);

  // ---- 创建标记 ----
  function addMarker(spot) {
    const index = state.spots.indexOf(spot) + 1;
    const marker = L.marker([spot.lat, spot.lng], {
      icon: createIcon(spot.category, index),
      draggable: true,
    });

    const cat = CATEGORIES[spot.category] || CATEGORIES.other;
    marker.bindPopup(`
      <div class="popup-content">
        <div class="popup-header" style="border-left: 4px solid ${cat.color}">
          <h3>${spot.name}</h3>
          <span class="popup-badge">${cat.icon} ${cat.label}</span>
        </div>
        ${spot.desc ? `<p class="popup-desc">${escapeHTML(spot.desc)}</p>` : ''}
        <div class="popup-coords">
          📍 ${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}
        </div>
        <div class="popup-actions">
          <button onclick="app.editSpot('${spot.id}')">✏️ 编辑</button>
          <button onclick="app.deleteSpot('${spot.id}')">🗑️ 删除</button>
        </div>
      </div>
    `, { maxWidth: 280 });

    marker.on('dragend', function (e) {
      const pos = e.target.getLatLng();
      spot.lat = pos.lat;
      spot.lng = pos.lng;
      saveState();
      updateRoute();
    });

    state.markers[spot.id] = marker;
    state.clusterGroup.addLayer(marker);
  }

  function removeMarker(id) {
    if (state.markers[id]) {
      state.clusterGroup.removeLayer(state.markers[id]);
      delete state.markers[id];
    }
  }

  function refreshMarkers() {
    state.clusterGroup.clearLayers();
    state.markers = {};
    state.spots.forEach(spot => addMarker(spot));
  }

  // ---- 地图点击 ----
  map.on('click', function (e) {
    state.pendingLatLng = e.latlng;
    state.editingId = null;
    showAddModal(e.latlng);
  });

  // ---- 模态框 ----
  const modalOverlay = document.getElementById('modal-overlay');
  const spotNameInput = document.getElementById('spot-name');
  const spotDescInput = document.getElementById('spot-desc');
  const spotCategoryInput = document.getElementById('spot-category');
  const spotCoordsInput = document.getElementById('spot-coords');
  const modalTitle = document.getElementById('modal-title');

  function showAddModal(latlng) {
    modalTitle.textContent = '添加景点';
    spotNameInput.value = '';
    spotDescInput.value = '';
    spotCategoryInput.value = 'sights';
    spotCoordsInput.value = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    modalOverlay.style.display = 'flex';
    setTimeout(() => spotNameInput.focus(), 100);
  }

  function showEditModal(spot) {
    modalTitle.textContent = '编辑景点';
    spotNameInput.value = spot.name;
    spotDescInput.value = spot.desc || '';
    spotCategoryInput.value = spot.category;
    spotCoordsInput.value = `${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}`;
    state.editingId = spot.id;
    modalOverlay.style.display = 'flex';
    setTimeout(() => spotNameInput.focus(), 100);
  }

  function closeModal() {
    modalOverlay.style.display = 'none';
    state.pendingLatLng = null;
    state.editingId = null;
  }

  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay.style.display === 'flex') closeModal();
  });

  document.getElementById('btn-save').addEventListener('click', function () {
    const name = spotNameInput.value.trim();
    if (!name) {
      spotNameInput.classList.add('error');
      spotNameInput.focus();
      return;
    }
    spotNameInput.classList.remove('error');

    const desc = spotDescInput.value.trim();
    const category = spotCategoryInput.value;

    if (state.editingId) {
      // 编辑模式
      const spot = state.spots.find(s => s.id === state.editingId);
      if (spot) {
        spot.name = name;
        spot.desc = desc;
        spot.category = category;
        saveState();
        refreshMarkers();
        renderSpotList();
        updateRoute();
      }
    } else if (state.pendingLatLng) {
      // 添加模式
      const newSpot = {
        id: generateId(),
        name,
        desc,
        category,
        lat: state.pendingLatLng.lat,
        lng: state.pendingLatLng.lng,
        createdAt: Date.now(),
      };
      state.spots.push(newSpot);
      saveState();
      addMarker(newSpot);
      renderSpotList();
      updateRoute();
    }

    closeModal();
  });

  // ---- 路线计算 ----
  function updateRoute() {
    // 移除旧路线
    if (state.routeControl) {
      map.removeControl(state.routeControl);
      state.routeControl = null;
    }

    if (state.spots.length < 2) {
      updateStats();
      renderRouteInfo();
      return;
    }

    const waypoints = state.spots.map(spot =>
      L.latLng(spot.lat, spot.lng)
    );

    state.routeControl = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      createMarker: () => null, // 不自动创建标记
      lineOptions: {
        styles: [
          { color: '#2563eb', weight: 4, opacity: 0.8 },
          { color: '#60a5fa', weight: 8, opacity: 0.3 },
        ],
      },
      show: false,
    }).addTo(map);

    state.routeControl.on('routesfound', function (e) {
      const route = e.routes[0];
      const totalDist = route.summary.totalDistance;
      const totalTime = route.summary.totalTime;
      updateStats(totalDist, totalTime);
      renderRouteInfo(route);
    });

    state.routeControl.on('routingerror', function () {
      // 回退到直线距离
      updateStats(calcDirectDistance());
      renderRouteInfo(null, true);
    });
  }

  function calcDirectDistance() {
    let total = 0;
    for (let i = 1; i < state.spots.length; i++) {
      const from = L.latLng(state.spots[i - 1].lat, state.spots[i - 1].lng);
      const to = L.latLng(state.spots[i].lat, state.spots[i].lng);
      total += from.distanceTo(to);
    }
    return total;
  }

  function renderRouteInfo(route, isFallback) {
    const infoEl = document.getElementById('route-info');
    if (state.spots.length < 2) {
      infoEl.innerHTML = '<p class="hint">添加 2 个以上景点后自动规划路线</p>';
      return;
    }

    if (isFallback) {
      infoEl.innerHTML = `
        <div class="route-warning">
          ⚠️ 无法获取道路路线，显示直线距离
        </div>
        <div class="route-detail">
          <div class="route-detail-item">
            <span class="label">直线距离</span>
            <span class="value">${formatDistance(calcDirectDistance())}</span>
          </div>
          <div class="route-detail-item">
            <span class="label">途经景点</span>
            <span class="value">${state.spots.length} 个</span>
          </div>
        </div>
      `;
      return;
    }

    if (route) {
      const steps = route.instructions || [];
      let stepsHtml = steps.slice(0, 5).map(s => {
        const dist = s.distance > 1000
          ? (s.distance / 1000).toFixed(1) + ' km'
          : Math.round(s.distance) + ' m';
        return `<div class="route-step"><span>${dist}</span> ${escapeHTML(s.text)}</div>`;
      }).join('');

      if (steps.length > 5) {
        stepsHtml += `<div class="route-step more">...还有 ${steps.length - 5} 步</div>`;
      }

      infoEl.innerHTML = `
        <div class="route-detail">
          <div class="route-detail-item">
            <span class="label">总距离</span>
            <span class="value">${formatDistance(route.summary.totalDistance)}</span>
          </div>
          <div class="route-detail-item">
            <span class="label">预计时间</span>
            <span class="value">${formatTime(route.summary.totalTime)}</span>
          </div>
        </div>
        <div class="route-steps">${stepsHtml}</div>
      `;
    }
  }

  function updateStats(dist, time) {
    const total = state.spots.length;
    document.getElementById('stats-total').textContent = `景点: ${total}`;
    document.getElementById('stats-distance').textContent = `总距离: ${formatDistance(dist || 0)}`;
  }

  // ---- 侧边栏列表 ----
  function renderSpotList() {
    const listEl = document.getElementById('spot-list');
    const emptyEl = document.getElementById('empty-state');

    if (state.spots.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      updateStats();
      return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = state.spots.map((spot, i) => {
      const cat = CATEGORIES[spot.category] || CATEGORIES.other;
      return `
        <div class="spot-item" data-id="${spot.id}" draggable="true">
          <div class="spot-order" style="background: ${cat.color}">${i + 1}</div>
          <div class="spot-info" onclick="app.panToSpot('${spot.id}')">
            <div class="spot-name">${cat.icon} ${escapeHTML(spot.name)}</div>
            <div class="spot-meta">${cat.label} · ${spot.lat.toFixed(3)}, ${spot.lng.toFixed(3)}</div>
          </div>
          <div class="spot-actions">
            <button class="spot-btn" onclick="app.editSpot('${spot.id}')" title="编辑">✏️</button>
            <button class="spot-btn" onclick="app.deleteSpot('${spot.id}')" title="删除">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    // 拖拽排序
    initDragSort(listEl);
  }

  function initDragSort(container) {
    let dragItem = null;
    container.querySelectorAll('.spot-item').forEach(item => {
      item.addEventListener('dragstart', function () {
        dragItem = this;
        this.style.opacity = '0.4';
      });
      item.addEventListener('dragend', function () {
        this.style.opacity = '1';
        dragItem = null;
      });
      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        if (this !== dragItem) {
          this.style.borderColor = '#2563eb';
        }
      });
      item.addEventListener('dragleave', function () {
        this.style.borderColor = 'transparent';
      });
      item.addEventListener('drop', function (e) {
        e.preventDefault();
        this.style.borderColor = 'transparent';
        if (!dragItem || this === dragItem) return;
        const fromId = dragItem.dataset.id;
        const toId = this.dataset.id;
        const fromIdx = state.spots.findIndex(s => s.id === fromId);
        const toIdx = state.spots.findIndex(s => s.id === toId);
        const [moved] = state.spots.splice(fromIdx, 1);
        state.spots.splice(toIdx, 0, moved);
        saveState();
        refreshMarkers();
        renderSpotList();
        updateRoute();
      });
    });
  }

  // ---- 瓦片切换 ----
  document.querySelectorAll('.tile-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const key = this.dataset.tile;
      map.removeLayer(state.tileLayer);
      state.tileLayer = L.tileLayer(TILES[key].url, {
        attribution: TILES[key].attr,
        maxZoom: 19,
      }).addTo(map);
    });
  });

  // ---- 工具栏按钮 ----
  document.getElementById('btn-clear').addEventListener('click', function () {
    if (state.spots.length === 0) return;
    if (!confirm('确定要清空所有景点吗？此操作不可撤销。')) return;
    state.spots = [];
    saveState();
    refreshMarkers();
    renderSpotList();
    updateRoute();
  });

  document.getElementById('btn-export').addEventListener('click', function () {
    if (state.spots.length === 0) {
      alert('暂无景点数据可导出');
      return;
    }
    const data = JSON.stringify(state.spots, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `旅行地图_${new Date().toLocaleDateString('zh-CN')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ---- 公开 API (给 popup 按钮用) ----
  window.app = {
    editSpot(id) {
      const spot = state.spots.find(s => s.id === id);
      if (spot) showEditModal(spot);
    },
    deleteSpot(id) {
      if (!confirm('确定删除该景点？')) return;
      map.closePopup();
      state.spots = state.spots.filter(s => s.id !== id);
      removeMarker(id);
      saveState();
      refreshMarkers();
      renderSpotList();
      updateRoute();
    },
    panToSpot(id) {
      const spot = state.spots.find(s => s.id === id);
      if (spot && state.markers[id]) {
        map.setView([spot.lat, spot.lng], 14);
        state.markers[id].openPopup();
      }
    },
  };

  // ---- 工具函数 ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  function saveState() {
    localStorage.setItem('travel_spots', JSON.stringify(state.spots));
  }

  function formatDistance(meters) {
    if (meters < 1000) return Math.round(meters) + ' m';
    return (meters / 1000).toFixed(1) + ' km';
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 24) return Math.round(h / 24) + ' 天';
    if (h > 0) return `${h} 小时 ${m} 分钟`;
    if (m > 0) return `${m} 分钟`;
    return '不到 1 分钟';
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- PWA Service Worker 注册 ----
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // ---- PWA 安装提示 ----
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('btn-install').style.display = 'inline-flex';
  });

  document.getElementById('btn-install').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('btn-install').style.display = 'none';
  });

  // ---- 导入功能 ----
  function importFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data)) {
            state.spots = data;
            saveState();
            refreshMarkers();
            renderSpotList();
            updateRoute();
            if (state.spots.length > 0) {
              map.setView(
                [state.spots[0].lat, state.spots[0].lng],
                Math.min(14, map.getZoom())
              );
            }
          }
        } catch {
          alert('文件格式错误，请选择导出的 JSON 文件');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ---- 初始化 ----
  refreshMarkers();
  renderSpotList();
  updateRoute();

  // 如果有已保存的景点，适配视图
  if (state.spots.length > 0) {
    const bounds = L.latLngBounds(state.spots.map(s => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }

})();
