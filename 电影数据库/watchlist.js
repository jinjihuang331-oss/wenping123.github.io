/**
 * 观影列表管理模块
 * 数据持久化存储在 localStorage
 */

const Watchlist = {
  // 观影列表数据
  movies: [],

  // 监听器列表
  listeners: [],

  /**
   * 初始化观影列表
   */
  init() {
    this.load();
    this._notifyListeners();
  },

  /**
   * 从 localStorage 加载观影列表
   */
  load() {
    try {
      const stored = localStorage.getItem(Config.WATCHLIST_KEY);
      this.movies = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Watchlist] Error loading:', error);
      this.movies = [];
    }
  },

  /**
   * 保存观影列表到 localStorage
   */
  save() {
    try {
      localStorage.setItem(Config.WATCHLIST_KEY, JSON.stringify(this.movies));
      this._notifyListeners();
    } catch (error) {
      console.error('[Watchlist] Error saving:', error);
    }
  },

  /**
   * 添加电影到观影列表
   * @param {object} movie - 电影对象
   * @returns {boolean} 是否成功添加
   */
  add(movie) {
    if (!movie || !movie.id) {
      console.warn('[Watchlist] Invalid movie object');
      return false;
    }

    // 检查是否已存在
    if (this.has(movie.id)) {
      console.log(`[Watchlist] Movie ${movie.id} already exists`);
      return false;
    }

    // 只存储必要信息以减少存储空间
    const movieData = {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      genre_ids: movie.genre_ids || (movie.genres ? movie.genres.map(g => g.id) : []),
      overview: movie.overview,
      added_at: Date.now()
    };

    this.movies.push(movieData);
    this.save();

    console.log(`[Watchlist] Added: ${movie.title} (${movie.id})`);
    return true;
  },

  /**
   * 从观影列表移除电影
   * @param {number} movieId - 电影 ID
   * @returns {boolean} 是否成功移除
   */
  remove(movieId) {
    const index = this.movies.findIndex(m => m.id === movieId);
    if (index === -1) return false;

    const removed = this.movies.splice(index, 1)[0];
    this.save();

    console.log(`[Watchlist] Removed: ${removed.title} (${movieId})`);
    return true;
  },

  /**
   * 切换电影在观影列表中的状态
   * @param {object} movie - 电影对象
   * @returns {boolean} 添加后为 true，移除后为 false
   */
  toggle(movie) {
    if (this.has(movie.id)) {
      this.remove(movie.id);
      return false;
    } else {
      this.add(movie);
      return true;
    }
  },

  /**
   * 检查电影是否在观影列表中
   * @param {number} movieId - 电影 ID
   * @returns {boolean}
   */
  has(movieId) {
    return this.movies.some(m => m.id === movieId);
  },

  /**
   * 获取观影列表
   * @returns {array} 电影列表
   */
  getAll() {
    return [...this.movies];
  },

  /**
   * 获取观影列表数量
   * @returns {number}
   */
  getCount() {
    return this.movies.length;
  },

  /**
   * 清空观影列表
   */
  clear() {
    this.movies = [];
    this.save();
    console.log('[Watchlist] Cleared');
  },

  /**
   * 获取观影列表中的所有类型 ID
   * @returns {array} 类型 ID 数组
   */
  getGenreIds() {
    const genreSet = new Set();
    this.movies.forEach(movie => {
      if (movie.genre_ids) {
        movie.genre_ids.forEach(id => genreSet.add(id));
      }
    });
    return Array.from(genreSet);
  },

  /**
   * 获取观影列表中的类型分布统计
   * @returns {object} 类型ID -> 出现次数
   */
  getGenreStats() {
    const stats = {};
    this.movies.forEach(movie => {
      if (movie.genre_ids) {
        movie.genre_ids.forEach(id => {
          stats[id] = (stats[id] || 0) + 1;
        });
      }
    });
    return stats;
  },

  /**
   * 获取最常出现的类型（用于推荐）
   * @param {number} limit - 返回前 N 个类型
   * @returns {array} 类型 ID 数组
   */
  getTopGenres(limit = 3) {
    const stats = this.getGenreStats();
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([genreId]) => genreId);
  },

  /**
   * 注册状态变化监听器
   * @param {function} callback - 回调函数
   */
  onChange(callback) {
    this.listeners.push(callback);
  },

  /**
   * 移除监听器
   * @param {function} callback - 回调函数
   */
  offChange(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  },

  /**
   * 通知所有监听器
   * @private
   */
  _notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.movies);
      } catch (error) {
        console.error('[Watchlist] Listener error:', error);
      }
    });
  }
};
