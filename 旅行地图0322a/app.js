/* ==============================
   旅行地图 - 主应用逻辑
   ============================== */

(function () {
  'use strict';

  // ===== 数据状态 =====
  let spots = JSON.parse(localStorage.getItem('travel-spots') || '[]');
  let routes = JSON.parse(localStorage.getItem('travel-routes') || '[]');
  let map, markersLayer, routesLayer;
  let addingMode = false;
  let routingMode = false;
  let routeStartSpot = null;
  let editingSpotId = null;
  let currentPhotoData = null;
  let sidebarOpen = false;

  // ===== DOM 引用 =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    map: $('#map'),
    toolbar: $('#toolbar'),
    btnSidebar: $('#btn-sidebar'),
    btnAdd: $('#btn-add'),
    btnRoute: $('#btn-route'),
    btnExport: $('#btn-export'),
    btnImport: $('#btn-import'),
    btnLocate: $('#btn-locate'),
    sidebar: $('#sidebar'),
    sidebarOverlay: $('#sidebar-overlay'),
    btnCloseSidebar: $('#btn-close-sidebar'),
    spotsList: $('#spots-list'),
    routesList: $('#routes-list'),
    modal: $('#spot-modal'),
    modalTitle: $('#modal-title'),
    spotForm: $('#spot-form'),
    spotName: $('#spot-name'),
    spotDesc: $('#spot-desc'),
    spotPhoto: $('#spot-photo'),
    spotLat: $('#spot-lat'),
    spotLng: $('#spot-lng'),
    spotId: $('#spot-id'),
    photoPreview: $('#photo-preview'),
    btnCancel: $('#btn-cancel'),
    btnCloseModal: $('#btn-close-modal'),
    routeHint: $('#route-hint'),
    routeHintText: $('#route-hint-text'),
    btnCancelRoute: $('#btn-cancel-route'),
    toast: $('#toast'),
    importInput: $('#import-input'),
    offlineIndicator: $('#offline-indicator'),
  };

  // ===== 工具函数 =====
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function saveSpots() {
    localStorage.setItem('travel-spots', JSON.stringify(spots));
  }

  function saveRoutes() {
    localStorage.setItem('travel-routes', JSON.stringify(routes));
  }

  function showToast(msg, duration = 3000) {
    dom.toast.textContent = msg;
    dom.toast.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => dom.toast.classList.add('hidden'), duration);
  }

  // Haversine 公式（单位：公里）
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 图片压缩 (Canvas 缩放, 限宽 400px)
  function compressPhoto(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxW = 400;
          let w = img.width, h = img.height;
          if (w > maxW) {
            h = (h * maxW) / w;
            w = maxW;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function formatDistance(km) {
    if (km < 1) return (km * 1000).toFixed(0) + ' 米';
    if (km < 100) return km.toFixed(1) + ' 公里';
    return km.toFixed(0) + ' 公里';
  }

  // ===== 地图初始化 =====
  function initMap() {
    map = L.map('map', {
      center: [35.86, 104.20],
      zoom: 5,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    routesLayer = L.layerGroup().addTo(map);

    // 地图点击
    map.on('click', onMapClick);

    // 尝试定位用户
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 12);
        },
        () => {}
      );
    }
  }

  // ===== 自定义标记图标 =====
  function createMarkerIcon() {
    return L.divIcon({
      className: '',
      iconSize: [36, 46],
      iconAnchor: [18, 46],
      popupAnchor: [0, -40],
      html: `
        <div class="marker-icon-wrapper custom-marker">
          <div class="custom-marker-pin">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          </div>
          <div class="custom-marker-shadow"></div>
        </div>`,
    });
  }

  // ===== 标记管理 =====
  function addMarkerToMap(spot) {
    const marker = L.marker([spot.lat, spot.lng], { icon: createMarkerIcon() });

    const photoHtml = spot.photo
      ? `<img src="${spot.photo}" class="popup-photo" alt="${spot.name}">`
      : '';
    const descHtml = spot.desc ? `<div class="popup-desc">${escapeHtml(spot.desc)}</div>` : '';

    marker.bindPopup(
      `${photoHtml}
       <div class="popup-name">${escapeHtml(spot.name)}</div>
       ${descHtml}
       <div class="popup-actions">
         <button class="popup-btn popup-btn-edit" data-id="${spot.id}">编辑</button>
         <button class="popup-btn popup-btn-delete" data-id="${spot.id}">删除</button>
       </div>`,
      { maxWidth: 260, minWidth: 180 }
    );

    marker._spotId = spot.id;
    markersLayer.addLayer(marker);
    return marker;
  }

  function renderAllMarkers() {
    markersLayer.clearLayers();
    spots.forEach((s) => addMarkerToMap(s));
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== 侧边栏渲染 =====
  function renderSidebar() {
    // 景点列表
    if (spots.length === 0) {
      dom.spotsList.innerHTML = '<div class="empty-state">点击地图添加你的第一个景点</div>';
    } else {
      dom.spotsList.innerHTML = spots
        .map(
          (s) => `
        <div class="spot-card" data-id="${s.id}">
          ${s.photo ? `<img src="${s.photo}" class="spot-card-photo" alt="${escapeHtml(s.name)}">` : ''}
          <div class="spot-card-name">${escapeHtml(s.name)}</div>
          ${s.desc ? `<div class="spot-card-desc">${escapeHtml(s.desc)}</div>` : ''}
        </div>`
        )
        .join('');
    }

    // 路线列表
    if (routes.length === 0) {
      dom.routesList.innerHTML = '<div class="empty-state">使用路线工具连接景点</div>';
    } else {
      dom.routesList.innerHTML = routes
        .map((r) => {
          const from = spots.find((s) => s.id === r.fromId);
          const to = spots.find((s) => s.id === r.toId);
          return `
          <div class="route-card" data-id="${r.id}">
            <button class="route-card-delete" data-id="${r.id}" title="删除路线">&times;</button>
            <div class="route-card-header">
              <span class="route-dot"></span>
              <span class="route-card-path">${from ? escapeHtml(from.name) : '?'} → ${to ? escapeHtml(to.name) : '?'}</span>
            </div>
            <div class="route-card-dist">${formatDistance(r.distance)}</div>
            ${r.isDirect ? '<div style="font-size:11px;color:var(--text-muted);">（直线距离）</div>' : ''}
          </div>`;
        })
        .join('');
    }
  }

  // ===== 地图点击处理 =====
  function onMapClick(e) {
    if (addingMode) {
      openSpotModal(e.latlng.lat, e.latlng.lng);
    }
  }

  // ===== 模态框 =====
  function openSpotModal(lat, lng, spotId) {
    const isEdit = !!spotId;
    editingSpotId = spotId || null;
    dom.modalTitle.textContent = isEdit ? '编辑景点' : '添加景点';
    dom.spotLat.value = lat;
    dom.spotLng.value = lng;

    if (isEdit) {
      const spot = spots.find((s) => s.id === spotId);
      if (spot) {
        dom.spotName.value = spot.name;
        dom.spotDesc.value = spot.desc || '';
        dom.spotId.value = spot.id;
        currentPhotoData = spot.photo || null;
        if (spot.photo) {
          dom.photoPreview.innerHTML = `<img src="${spot.photo}" alt="预览">`;
          dom.photoPreview.classList.remove('hidden');
        } else {
          dom.photoPreview.classList.add('hidden');
        }
      }
    } else {
      dom.spotForm.reset();
      dom.spotId.value = '';
      currentPhotoData = null;
      dom.photoPreview.classList.add('hidden');
    }

    dom.modal.classList.remove('hidden');
    dom.spotName.focus();
  }

  function closeModal() {
    dom.modal.classList.add('hidden');
    editingSpotId = null;
    currentPhotoData = null;
  }

  // ===== 景点表单提交 =====
  async function handleSpotSubmit(e) {
    e.preventDefault();

    const lat = parseFloat(dom.spotLat.value);
    const lng = parseFloat(dom.spotLng.value);
    const name = dom.spotName.value.trim();
    const desc = dom.spotDesc.value.trim();
    const id = dom.spotId.value || genId();

    if (!name) return;

    const photo = currentPhotoData || null;

    // 检查照片上传
    if (dom.spotPhoto.files.length > 0) {
      currentPhotoData = await compressPhoto(dom.spotPhoto.files[0]);
    }

    const spotData = {
      id,
      name,
      desc,
      lat,
      lng,
      photo: dom.spotPhoto.files.length > 0 ? currentPhotoData : photo,
    };

    if (editingSpotId) {
      const idx = spots.findIndex((s) => s.id === editingSpotId);
      if (idx !== -1) spots[idx] = spotData;
      // 更新相关的路线绘制
      renderRoutes();
    } else {
      spots.push(spotData);
    }

    saveSpots();
    renderAllMarkers();
    renderSidebar();
    closeModal();
    showToast(editingSpotId ? '景点已更新' : '景点已添加');
  }

  // ===== 照片预览 =====
  async function handlePhotoChange() {
    if (dom.spotPhoto.files.length > 0) {
      currentPhotoData = await compressPhoto(dom.spotPhoto.files[0]);
      dom.photoPreview.innerHTML = `<img src="${currentPhotoData}" alt="预览">`;
      dom.photoPreview.classList.remove('hidden');
    }
  }

  // ===== 删除景点 =====
  function deleteSpot(id) {
    spots = spots.filter((s) => s.id !== id);
    // 同时删除相关路线
    const relatedRoutes = routes.filter((r) => r.fromId === id || r.toId === id);
    relatedRoutes.forEach((r) => deleteRoute(r.id, true));
    saveSpots();
    renderAllMarkers();
    renderSidebar();
    showToast('景点已删除');
  }

  // ===== 路线模块 =====

  // 调用 OSRM 路由 API
  async function fetchOSRMRoute(lat1, lng1, lat2, lng2) {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('OSRM request failed');
    const data = await resp.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    const route = data.routes[0];
    const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    return { coords, distance: route.distance / 1000 }; // 转为公里
  }

  function renderRoutes() {
    routesLayer.clearLayers();
    routes.forEach((r) => {
      const from = spots.find((s) => s.id === r.fromId);
      const to = spots.find((s) => s.id === r.toId);
      if (!from || !to) return;

      if (r.coords && r.coords.length > 1) {
        // 实际路线（实线）
        L.polyline(r.coords, {
          color: '#ff8906',
          weight: 4,
          opacity: 0.8,
        }).addTo(routesLayer);
      } else {
        // 直线距离（虚线）
        L.polyline(
          [
            [from.lat, from.lng],
            [to.lat, to.lng],
          ],
          {
            color: '#ff8906',
            weight: 3,
            opacity: 0.6,
            dashArray: '8, 8',
          }
        ).addTo(routesLayer);
      }

      // 距离标签
      const midLat = (from.lat + to.lat) / 2;
      const midLng = (from.lng + to.lng) / 2;
      const label = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'route-distance-label',
          html: formatDistance(r.distance),
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        }),
        interactive: false,
      }).addTo(routesLayer);
    });
  }

  async function createRoute(fromId, toId) {
    const from = spots.find((s) => s.id === fromId);
    const to = spots.find((s) => s.id === toId);
    if (!from || !to) return;

    const directDist = haversine(from.lat, from.lng, to.lat, to.lng);
    let coords = null;
    let distance = directDist;
    let isDirect = true;

    try {
      const result = await fetchOSRMRoute(from.lat, from.lng, to.lat, to.lng);
      coords = result.coords;
      distance = result.distance;
      isDirect = false;
      showToast('已获取实际路线');
    } catch {
      isDirect = true;
      showToast('网络不可用，使用直线距离', 3000);
    }

    const route = {
      id: genId(),
      fromId,
      toId,
      distance,
      coords,
      isDirect,
    };
    routes.push(route);
    saveRoutes();
    renderRoutes();
    renderSidebar();
  }

  function deleteRoute(id, silent) {
    routes = routes.filter((r) => r.id !== id);
    saveRoutes();
    renderRoutes();
    renderSidebar();
    if (!silent) showToast('路线已删除');
  }

  // ===== 路线选择模式 =====
  function startRouting() {
    routingMode = true;
    routeStartSpot = null;
    dom.btnRoute.classList.add('active');
    dom.routeHint.classList.remove('hidden');
    dom.routeHintText.textContent = '点击第一个景点标记';
  }

  function stopRouting() {
    routingMode = false;
    routeStartSpot = null;
    dom.btnRoute.classList.remove('active');
    dom.routeHint.classList.add('hidden');
  }

  function handleMarkerClickForRoute(spotId) {
    if (!routingMode) return false;
    if (!routeStartSpot) {
      routeStartSpot = spotId;
      dom.routeHintText.textContent = '点击第二个景点标记';
      showToast('已选起点，请点击终点');
    } else {
      if (routeStartSpot === spotId) {
        showToast('请选择不同的景点');
        return true;
      }
      createRoute(routeStartSpot, spotId);
      stopRouting();
    }
    return true;
  }

  // ===== 数据导入导出 =====
  function exportData() {
    const data = { spots, routes, exportTime: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `旅行地图_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.spots && Array.isArray(data.spots)) {
          spots = data.spots;
          routes = data.routes || [];
          saveSpots();
          saveRoutes();
          renderAllMarkers();
          renderRoutes();
          renderSidebar();
          showToast(`已导入 ${spots.length} 个景点，${routes.length} 条路线`);
        } else {
          showToast('文件格式不正确');
        }
      } catch {
        showToast('文件解析失败');
      }
    };
    reader.readAsText(file);
  }

  // ===== 侧边栏控制 =====
  function toggleSidebar(open) {
    sidebarOpen = typeof open === 'boolean' ? open : !sidebarOpen;
    if (sidebarOpen) {
      dom.sidebar.classList.add('open');
      dom.sidebarOverlay.classList.remove('hidden');
    } else {
      dom.sidebar.classList.remove('open');
      dom.sidebarOverlay.classList.add('hidden');
    }
  }

  // ===== 侧边栏 Tab 切换 =====
  function switchTab(tabName) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tabName));
    $('.sidebar-content.active')?.classList.remove('active');
    $(`#${tabName}-list`)?.classList.add('active');
  }

  // ===== 事件绑定 =====
  function bindEvents() {
    // 工具栏
    dom.btnSidebar.addEventListener('click', () => toggleSidebar());
    dom.btnCloseSidebar.addEventListener('click', () => toggleSidebar(false));
    dom.sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

    dom.btnAdd.addEventListener('click', () => {
      addingMode = !addingMode;
      dom.btnAdd.classList.toggle('active', addingMode);
      document.body.classList.toggle('adding-mode', addingMode);
      if (!addingMode) showToast('已退出添加模式');
    });

    dom.btnRoute.addEventListener('click', () => {
      if (routingMode) {
        stopRouting();
      } else {
        if (spots.length < 2) {
          showToast('至少需要 2 个景点才能绘制路线');
          return;
        }
        startRouting();
      }
    });

    dom.btnExport.addEventListener('click', exportData);

    dom.btnImport.addEventListener('click', () => dom.importInput.click());
    dom.importInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importData(e.target.files[0]);
        e.target.value = '';
      }
    });

    dom.btnLocate.addEventListener('click', () => {
      if (navigator.geolocation) {
        showToast('正在定位...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 14);
            showToast('已定位到当前位置');
          },
          () => showToast('定位失败')
        );
      }
    });

    // 模态框
    dom.spotForm.addEventListener('submit', handleSpotSubmit);
    dom.btnCancel.addEventListener('click', closeModal);
    dom.btnCloseModal.addEventListener('click', closeModal);
    dom.modal.addEventListener('click', (e) => {
      if (e.target === dom.modal) closeModal();
    });
    dom.spotPhoto.addEventListener('change', handlePhotoChange);

    // 路线取消
    dom.btnCancelRoute.addEventListener('click', stopRouting);

    // 侧边栏 Tab
    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // 侧边栏景点点击
    dom.spotsList.addEventListener('click', (e) => {
      const card = e.target.closest('.spot-card');
      if (!card) return;
      const id = card.dataset.id;
      const spot = spots.find((s) => s.id === id);
      if (spot) {
        map.flyTo([spot.lat, spot.lng], 14, { duration: 1 });
        // 打开对应 popup
        markersLayer.eachLayer((layer) => {
          if (layer._spotId === id) layer.openPopup();
        });
        if (window.innerWidth <= 768) toggleSidebar(false);
      }
    });

    // 侧边栏路线删除
    dom.routesList.addEventListener('click', (e) => {
      const btn = e.target.closest('.route-card-delete');
      if (!btn) return;
      e.stopPropagation();
      deleteRoute(btn.dataset.id);
    });

    // Popup 按钮事件委托
    dom.map.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.popup-btn-edit');
      const deleteBtn = e.target.closest('.popup-btn-delete');

      if (deleteBtn) {
        deleteSpot(deleteBtn.dataset.id);
        return;
      }
      if (editBtn) {
        const id = editBtn.dataset.id;
        const spot = spots.find((s) => s.id === id);
        if (spot) {
          map.closePopup();
          openSpotModal(spot.lat, spot.lng, id);
        }
        return;
      }
    });

    // 标记点击 → 路线模式
    map.on('popupopen', (e) => {
      if (routingMode && e.popup._source && e.popup._source._spotId) {
        handleMarkerClickForRoute(e.popup._source._spotId);
      }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dom.modal.classList.contains('hidden') === false) closeModal();
        if (routingMode) stopRouting();
        if (addingMode) {
          addingMode = false;
          dom.btnAdd.classList.remove('active');
          document.body.classList.remove('adding-mode');
        }
        if (sidebarOpen) toggleSidebar(false);
      }
    });

    // 在线/离线状态
    window.addEventListener('online', () => {
      dom.offlineIndicator.classList.add('hidden');
      showToast('已恢复网络连接');
    });
    window.addEventListener('offline', () => {
      dom.offlineIndicator.classList.remove('hidden');
      showToast('已进入离线模式');
    });
  }

  // ===== PWA 注册 =====
  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  // ===== 初始化 =====
  function init() {
    initMap();
    renderAllMarkers();
    renderRoutes();
    renderSidebar();
    bindEvents();
    registerSW();

    // 初始离线状态检测
    if (!navigator.onLine) {
      dom.offlineIndicator.classList.remove('hidden');
    }
  }

  // 等待 DOM 就绪
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
