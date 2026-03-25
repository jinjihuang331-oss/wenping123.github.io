// ============================================================
// 应用初始化
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // 初始化播放器
  window.player = new MusicPlayer();

  // 初始化歌词管理器
  const lyricsManager = new LyricsManager();
  window.player.setLyricsManager(lyricsManager);

  // 初始化搜索管理器
  const searchManager = new SearchManager();
  window.searchManager = searchManager;

  // 渲染 UI
  renderSidebarPlaylists();
  renderLibrary();
  renderRecentTracks();
  renderOfflineTracks();
  setupResponsive();

  // 创建播放列表按钮
  document.getElementById('createPlaylistBtn').addEventListener('click', () => {
    const name = '新播放列表';
    const newId = 'pl-' + Date.now();
    MOCK_PLAYLISTS.push({
      id: newId,
      name,
      icon: 'fas fa-music',
      songIds: []
    });
    renderSidebarPlaylists();
    showToast(`播放列表「${name}」已创建`, 'success');
  });

  // 启动协作播放列表模拟
  collabManager.start();

  // 监听协作更新事件
  window.addEventListener('collab-playlist-updated', (e) => {
    const { playlistId } = e.detail;
    // 更新对应的 DOM
    const item = document.querySelector(`.collab-playlist-item[data-playlist-id="${playlistId}"]`);
    if (item) {
      const countEl = item.querySelector('.song-count');
      if (countEl) {
        const pl = collabManager.getPlaylist(playlistId);
        if (pl) countEl.textContent = `${pl.songIds.length} 首`;
      }
    }
  });

  // 监听离线缓存更新
  window.addEventListener('offline-cache-updated', () => {
    renderOfflineTracks();
  });

  // 监听歌曲变化更新喜欢状态
  window.addEventListener('song-changed', (e) => {
    const { song } = e.detail;
    const likedPl = MOCK_PLAYLISTS.find(p => p.id === 'pl-1');
    const isLiked = likedPl && likedPl.songIds.includes(song.id);
    const likeBtn = document.getElementById('likeBtn');
    likeBtn.querySelector('i').className = isLiked ? 'fas fa-heart' : 'far fa-heart';
    likeBtn.classList.toggle('liked', isLiked);
  });

  // 喜欢按钮
  document.getElementById('likeBtn').addEventListener('click', () => {
    if (!window.player.currentSong) return;
    const likedPl = MOCK_PLAYLISTS.find(p => p.id === 'pl-1');
    if (!likedPl) return;
    const idx = likedPl.songIds.indexOf(window.player.currentSong.id);
    const likeBtn = document.getElementById('likeBtn');

    if (idx >= 0) {
      likedPl.songIds.splice(idx, 1);
      likeBtn.querySelector('i').className = 'far fa-heart';
      likeBtn.classList.remove('liked');
      showToast(`已从「${likedPl.name}」移除`, 'info');
    } else {
      likedPl.songIds.push(window.player.currentSong.id);
      likeBtn.querySelector('i').className = 'fas fa-heart';
      likeBtn.classList.add('liked');
      showToast(`已添加到「${likedPl.name}」`, 'success');
    }
  });

  // 排序按钮
  document.getElementById('sortByBtn').addEventListener('click', () => {
    const container = document.getElementById('libraryTracks');
    const items = [...container.querySelectorAll('.track-item')];
    // 切换排序方向
    const isReversed = container.dataset.reversed === 'true';
    items.reverse().forEach(item => container.appendChild(item));
    container.dataset.reversed = (!isReversed).toString();
  });

  // 全屏搜索在桌面搜索框按 Enter
  document.getElementById('searchInputDesktop').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (val) {
        switchView('search');
        document.getElementById('searchInputFull').value = val;
        searchManager.showSearchResults(val);
      }
    }
  });

  // 全屏搜索输入实时搜索
  document.getElementById('searchInputFull').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (val) searchManager.showSearchResults(val);
    }
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    // 如果在输入框中，不拦截
    if (e.target.tagName === 'INPUT') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        window.player.togglePlay();
        break;
      case 'ArrowRight':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          window.player.next();
        }
        break;
      case 'ArrowLeft':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          window.player.prev();
        }
        break;
      case 'KeyL':
        lyricsManager.toggle();
        break;
      case 'KeyQ':
        window.player.queuePanel.classList.toggle('open');
        break;
    }
  });

  console.log('SoundWave 音乐流媒体已启动 🎵');
});
