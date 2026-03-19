/**
 * 配置文件 - TMDB API 设置
 */

const Config = {
  // API 配置
  API_KEY: localStorage.getItem('tmdb_api_key') || '',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',

  // 图片尺寸
  POSTER_SIZES: {
    small: 'w154',
    medium: 'w342',
    large: 'w500',
    original: 'original'
  },

  BACKDROP_SIZES: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original'
  },

  PROFILE_SIZES: {
    small: 'w45',
    medium: 'w185',
    large: 'h632',
    original: 'original'
  },

  // 缓存配置
  CACHE: {
    enabled: true,
    ttl: 1000 * 60 * 30, // 30 分钟
    maxSize: 100 // 最大缓存条目数
  },

  // 分页配置
  PAGINATION: {
    itemsPerPage: 20
  },

  // 搜索配置
  SEARCH: {
    debounceMs: 400
  },

  // 无限滚动配置
  INFINITE_SCROLL: {
    threshold: 200, // 距离底部多少像素时触发
    maxPages: 10 // 最大加载页数
  },

  // 观影列表存储键
  WATCHLIST_KEY: 'movie_watchlist',

  // 主题存储键
  THEME_KEY: 'movie_app_theme',

  /**
   * 获取完整的图片 URL
   * @param {string} path - 图片路径
   * @param {string} size - 图片尺寸
   * @param {string} type - 图片类型 (poster, backdrop, profile)
   * @returns {string} 完整的图片 URL
   */
  getImageUrl(path, size = 'medium', type = 'poster') {
    if (!path) {
      return this.getPlaceholderImage(type);
    }

    const sizeMap = {
      poster: this.POSTER_SIZES[size] || this.POSTER_SIZES.medium,
      backdrop: this.BACKDROP_SIZES[size] || this.BACKDROP_SIZES.medium,
      profile: this.PROFILE_SIZES[size] || this.PROFILE_SIZES.medium
    };

    return `${this.IMAGE_BASE_URL}/${sizeMap[type]}${path}`;
  },

  /**
   * 获取占位图片
   * @param {string} type - 图片类型
   * @returns {string} 占位图片 URL
   */
  getPlaceholderImage(type) {
    const placeholders = {
      poster: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"%3E%3Crect fill="%23252525" width="300" height="450"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" font-family="sans-serif" font-size="16"%3E无海报%3C/text%3E%3C/svg%3E',
      backdrop: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"%3E%3Crect fill="%231a1a1a" width="1280" height="720"/%3E%3Ctext fill="%23444" x="50%25" y="50%25" text-anchor="middle" font-family="sans-serif" font-size="24"%3E无背景图%3C/text%3E%3C/svg%3E',
      profile: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 185 185"%3E%3Ccircle fill="%23252525" cx="92.5" cy="92.5" r="92.5"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" font-family="sans-serif" font-size="14"%3E无头像%3C/text%3E%3C/svg%3E'
    };
    return placeholders[type] || placeholders.poster;
  },

  /**
   * 设置 API 密钥
   * @param {string} key - API 密钥
   */
  setApiKey(key) {
    this.API_KEY = key;
    localStorage.setItem('tmdb_api_key', key);
  },

  /**
   * 检查是否已配置 API 密钥
   * @returns {boolean}
   */
  hasApiKey() {
    return !!this.API_KEY && this.API_KEY.length >= 32;
  },

  /**
   * 清除 API 密钥
   */
  clearApiKey() {
    this.API_KEY = '';
    localStorage.removeItem('tmdb_api_key');
  }
};
