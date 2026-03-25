// ============================================================
// UI 管理器 — 视图切换、渲染、事件绑定
// ============================================================

// 最近播放列表
let recentSongIds = [];

function addToRecent(songId) {
  recentSongIds = recentSongIds.filter(id => id !== songId);
  recentSongIds.unshift(songId);
  if (recentSongIds.length > 8) recentSongIds.length = 8;
  renderRecentTracks();
}

function renderRecentTracks() {
  const container = document.getElementById('recentTracks');
  if (!container) return;
  container.innerHTML = '';
  const songs = recentSongIds.map(id => getSongById(id)).filter(Boolean);
  if (songs.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>暂无播放记录</p></div>';
    return;
  }
  songs.forEach((song, i) => {
    container.appendChild(createTrackItem(song, i, songs));
  });
}

function createTrackItem(song, index, playlist) {
  const div = document.createElement('div');
  div.className = 'track-item';
  div.dataset.id = song.id;
  div.dataset.index = index;

  const isCached = cacheManager.isCached(song.id);

  div.innerHTML = `
    <div class="track-number">${index + 1}</div>
    <img src="${song.cover}" alt="" class="track-cover" loading="lazy">
    <div class="track-info">
      <span class="track-name">${song.title}</span>
      <span class="track-meta">${song.artist} · ${song.album}</span>
    </div>
    <span class="track-genre">${song.genre}</span>
    <span class="track-duration">${formatTime(song.duration)}</span>
    <div class="track-buttons">
      <button class="icon-btn offline-download" data-id="${song.id}" title="离线缓存">
        <i class="fas ${isCached ? 'fa-check-circle' : 'fa-download'}"></i>
      </button>
      <button class="icon-btn add-to-queue" data-id="${song.id}" title="加入队列">
        <i class="fas fa-plus"></i>
      </button>
    </div>
  `;

  div.addEventListener('click', (e) => {
    if (e.target.closest('.track-buttons')) return;
    if (window.player && playlist) {
      window.player.setQueue(playlist, index);
    }
  });

  const dlBtn = div.querySelector('.offline-download');
  dlBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cacheManager.cacheSong(song);
    dlBtn.querySelector('i').className = 'fas fa-check-circle';
  });

  const queueBtn = div.querySelector('.add-to-queue');
  queueBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.player) {
      window.player.addToQueue(song);
    }
  });

  return div;
}

// 渲染播放列表
function renderSidebarPlaylists() {
  const container = document.getElementById('sidebarPlaylists');
  container.innerHTML = '';
  const userPlaylists = MOCK_PLAYLISTS.filter(p => !p.collaborative && !p.id.startsWith('featured'));

  userPlaylists.forEach(pl => {
    const div = document.createElement('div');
    div.className = 'playlist-item';
    div.dataset.playlistId = pl.id;
    div.innerHTML = `
      <i class="${pl.icon || 'fas fa-music'}"></i>
      <span>${pl.name}</span>
      <span class="song-count">${pl.songIds.length} 首</span>
    `;
    div.addEventListener('click', () => openPlaylistModal(pl));
    container.appendChild(div);
  });
}

// 播放列表模态框
function openPlaylistModal(playlist) {
  const modal = document.getElementById('playlistModal');
  const titleEl = document.getElementById('modalPlaylistTitle');
  const tracksEl = document.getElementById('modalTracks');

  titleEl.textContent = playlist.name;
  tracksEl.innerHTML = '';

  const songs = playlist.songIds.map(id => getSongById(id)).filter(Boolean);
  songs.forEach((song, i) => {
    tracksEl.appendChild(createTrackItem(song, i, songs));
  });

  modal.classList.add('open');

  // 点击遮罩关闭
  const closeOnOverlay = (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
      modal.removeEventListener('click', closeOnOverlay);
    }
  };
  modal.addEventListener('click', closeOnOverlay);

  document.getElementById('closeModalBtn').onclick = () => modal.classList.remove('open');
}

// 渲染音乐库
function renderLibrary() {
  const container = document.getElementById('libraryTracks');
  container.innerHTML = '';
  MOCK_SONGS.forEach((song, i) => {
    container.appendChild(createTrackItem(song, i, MOCK_SONGS));
  });
}

// 渲染离线音乐
function renderOfflineTracks() {
  const container = document.getElementById('offlineTracks');
  const emptyEl = document.getElementById('offlineEmpty');
  const cachedIds = cacheManager.getCachedIds();

  container.innerHTML = '';

  if (cachedIds.length === 0) {
    container.style.display = 'none';
    emptyEl.style.display = 'flex';
    return;
  }

  container.style.display = 'block';
  emptyEl.style.display = 'none';

  const songs = cachedIds.map(id => getSongById(id)).filter(Boolean);
  songs.forEach((song, i) => {
    const div = document.createElement('div');
    div.className = 'track-item';
    div.dataset.id = song.id;
    div.dataset.index = i;
    div.innerHTML = `
      <div class="track-number"><i class="fas fa-download"></i></div>
      <img src="${song.cover}" alt="" class="track-cover" loading="lazy">
      <div class="track-info">
        <span class="track-name">${song.title}</span>
        <span class="track-meta">${song.artist} · ${song.album}</span>
      </div>
      <span class="track-duration">${formatTime(song.duration)}</span>
      <button class="icon-btn remove-offline" data-id="${song.id}" title="移除缓存">
        <i class="fas fa-trash"></i>
      </button>
    `;
    div.addEventListener('click', (e) => {
      if (e.target.closest('.remove-offline')) return;
      if (window.player) window.player.setQueue(songs, i);
    });
    div.querySelector('.remove-offline').addEventListener('click', (e) => {
      e.stopPropagation();
      cacheManager.removeSong(song.id).then(() => renderOfflineTracks());
    });
    container.appendChild(div);
  });
}

// Toast 通知系统
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  else if (type === 'error') icon = 'fa-exclamation-circle';
  else if (type === 'warning') icon = 'fa-exclamation-triangle';
  else if (type === 'collab') icon = 'fa-users';

  toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
  container.appendChild(toast);

  // 触发动画
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
window.showToast = showToast;

// 视图切换
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const view = document.getElementById(viewName + 'View');
  const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (view) view.classList.add('active');
  if (navItem) navItem.classList.add('active');

  // 切换搜索视图时聚焦输入框
  if (viewName === 'search') {
    setTimeout(() => {
      const input = document.getElementById('searchInputFull');
      if (input) input.focus();
    }, 100);
  }

  // 切换到离线视图时刷新
  if (viewName === 'offline') {
    renderOfflineTracks();
  }
}

// 响应式侧边栏
function setupResponsive() {
  const sidebarToggle = document.getElementById('searchToggleBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebarClose');

  // 汉堡菜单 — 在移动端需要时可扩展
  // 目前搜索按钮作为移动端搜索入口

  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  // 播放列表卡片点击
  document.querySelectorAll('.playlist-card').forEach(card => {
    card.addEventListener('click', () => {
      const pl = MOCK_PLAYLISTS.find(p => p.id === card.dataset.playlistId);
      if (pl) openPlaylistModal(pl);
    });
    card.querySelector('.play-overlay').addEventListener('click', (e) => {
      e.stopPropagation();
      const pl = MOCK_PLAYLISTS.find(p => p.id === card.dataset.playlistId);
      if (pl && window.player) {
        const songs = pl.songIds.map(id => getSongById(id)).filter(Boolean);
        if (songs.length) window.player.setQueue(songs, 0);
      }
    });
  });

  // 导航点击
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  // 协作播放列表点击
  document.querySelectorAll('.collab-playlist-item').forEach(item => {
    item.addEventListener('click', () => {
      const pl = MOCK_PLAYLISTS.find(p => p.id === item.dataset.playlistId);
      if (pl) openPlaylistModal(pl);
    });
  });

  // 移动端搜索切换
  sidebarToggle.addEventListener('click', () => {
    switchView('search');
  });
}
