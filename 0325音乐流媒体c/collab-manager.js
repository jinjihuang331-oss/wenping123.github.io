// ============================================================
// 协作播放列表管理器 — 模拟多人协作更新
// ============================================================

class CollabPlaylistManager {
  constructor() {
    this.collabPlaylists = MOCK_PLAYLISTS.filter(p => p.collaborative).map(p => ({ ...p }));
    this.simulatedUsers = [
      { name: '小明', avatar: '🧑' },
      { name: '小红', avatar: '👩' },
      { name: '阿强', avatar: '👨' },
      { name: '小丽', avatar: '👩‍🦰' },
      { name: '大伟', avatar: '🧔' }
    ];
    this.updateInterval = null;
    this.updateDelay = 15000; // 15秒模拟一次更新
  }

  start() {
    // 每隔一段时间模拟协作更新
    this.updateInterval = setInterval(() => {
      this.simulateUpdate();
    }, this.updateDelay);
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  simulateUpdate() {
    // 随机选择一个协作播放列表
    const playlist = this.collabPlaylists[Math.floor(Math.random() * this.collabPlaylists.length)];
    const user = this.simulatedUsers[Math.floor(Math.random() * this.simulatedUsers.length)];
    const action = Math.random() > 0.3 ? 'add' : 'remove';

    if (action === 'add') {
      // 添加一首不在列表中的歌
      const availableSongs = MOCK_SONGS.filter(s => !playlist.songIds.includes(s.id));
      if (availableSongs.length === 0) return;
      const song = availableSongs[Math.floor(Math.random() * availableSongs.length)];
      playlist.songIds.push(song.id);
      this.notifyUpdate(`${user.avatar} ${user.name} 添加了「${song.title}」到「${playlist.name}」`);
    } else {
      // 移除一首歌（保留至少一首）
      if (playlist.songIds.length <= 1) return;
      const idx = Math.floor(Math.random() * playlist.songIds.length);
      const removedId = playlist.songIds.splice(idx, 1)[0];
      const song = getSongById(removedId);
      if (song) {
        this.notifyUpdate(`${user.avatar} ${user.name} 从「${playlist.name}」移除了「${song.title}」`);
      }
    }

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('collab-playlist-updated', {
      detail: { playlistId: playlist.id, playlist }
    }));
  }

  notifyUpdate(message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'collab');
    }
  }

  getPlaylist(id) {
    return this.collabPlaylists.find(p => p.id === id);
  }

  getAllPlaylists() {
    return this.collabPlaylists;
  }
}

const collabManager = new CollabPlaylistManager();
