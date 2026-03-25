// ============================================================
// Cache API 管理器 — 离线播放缓存
// ============================================================

const CACHE_NAME = 'soundwave-cache-v1';
const CACHE_URL_PREFIX = '/audio/';

class CacheManager {
  constructor() {
    this.cache = null;
    this.cachedSongIds = new Set();
    this.init();
  }

  async init() {
    try {
      if ('caches' in window) {
        this.cache = await caches.open(CACHE_NAME);
        await this.loadCachedIds();
      }
    } catch (e) {
      console.warn('Cache API 不可用:', e);
    }
  }

  async loadCachedIds() {
    if (!this.cache) return;
    try {
      const keys = await this.cache.keys();
      this.cachedSongIds = new Set(
        keys.map(req => {
          const url = new URL(req.url);
          const match = url.pathname.match(/\/audio\/(.+)/);
          return match ? match[1] : null;
        }).filter(Boolean)
      );
    } catch (e) {
      console.warn('加载缓存ID失败:', e);
    }
  }

  async cacheSong(song) {
    if (!this.cache) {
      this.showToast('离线缓存不可用', 'warning');
      return false;
    }
    try {
      if (this.cachedSongIds.has(song.id)) {
        this.showToast(`"${song.title}" 已在离线缓存中`, 'info');
        return true;
      }
      // 模拟：缓存歌曲的元数据为 JSON（真实应用中缓存音频文件）
      const songData = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        cover: song.cover,
        url: song.url,
        genre: song.genre,
        cachedAt: Date.now()
      };
      const response = new Response(JSON.stringify(songData), {
        headers: { 'Content-Type': 'application/json' }
      });
      await this.cache.put(`${CACHE_URL_PREFIX}${song.id}`, response);
      this.cachedSongIds.add(song.id);

      // 同时缓存封面图片
      try {
        const coverResponse = await fetch(song.cover, { mode: 'no-cors' });
        await this.cache.put(song.cover, coverResponse);
      } catch (_) { /* 跨域图片缓存忽略 */ }

      this.showToast(`"${song.title}" 已加入离线缓存`, 'success');
      this.updateOfflineUI();
      return true;
    } catch (e) {
      console.error('缓存歌曲失败:', e);
      this.showToast(`缓存 "${song.title}" 失败`, 'error');
      return false;
    }
  }

  async removeSong(songId) {
    if (!this.cache) return;
    try {
      await this.cache.delete(`${CACHE_URL_PREFIX}${songId}`);
      const song = getSongById(songId);
      if (song && song.cover) {
        await this.cache.delete(song.cover);
      }
      this.cachedSongIds.delete(songId);
      this.showToast('已从离线缓存移除', 'info');
      this.updateOfflineUI();
    } catch (e) {
      console.error('移除缓存失败:', e);
    }
  }

  async getSongData(songId) {
    if (!this.cache) return null;
    try {
      const response = await this.cache.match(`${CACHE_URL_PREFIX}${songId}`);
      if (!response) return null;
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  isCached(songId) {
    return this.cachedSongIds.has(songId);
  }

  getCachedIds() {
    return [...this.cachedSongIds];
  }

  async getCachedSongs() {
    const ids = this.getCachedIds();
    return ids.map(id => getSongById(id)).filter(Boolean);
  }

  updateOfflineUI() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
      const count = this.cachedSongIds.size;
      indicator.title = count > 0 ? `${count} 首歌曲已缓存` : '离线状态';
    }
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('offline-cache-updated', {
      detail: { count: this.cachedSongIds.size, ids: this.getCachedIds() }
    }));
  }

  showToast(message, type) {
    // 由全局 toast 系统处理
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    }
  }
}

// 全局缓存管理实例
const cacheManager = new CacheManager();
