/**
 * 缓存管理模块
 * 使用内存缓存 + localStorage 持久化
 */

const Cache = {
  // 内存缓存
  memory: new Map(),

  // 缓存统计
  stats: {
    hits: 0,
    misses: 0
  },

  /**
   * 生成缓存键
   * @param {string} endpoint - API 端点
   * @param {object} params - 请求参数
   * @returns {string} 缓存键
   */
  _generateKey(endpoint, params = {}) {
    const paramsStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${paramsStr}`;
  },

  /**
   * 从缓存获取数据
   * @param {string} endpoint - API 端点
   * @param {object} params - 请求参数
   * @returns {object|null} 缓存数据或 null
   */
  get(endpoint, params = {}) {
    if (!Config.CACHE.enabled) return null;

    const key = this._generateKey(endpoint, params);
    const cached = this.memory.get(key);

    if (cached) {
      // 检查是否过期
      if (Date.now() - cached.timestamp < Config.CACHE.ttl) {
        this.stats.hits++;
        console.log(`[Cache] Hit: ${key}`);
        return cached.data;
      }
      // 过期，删除
      this.memory.delete(key);
    }

    this.stats.misses++;
    return null;
  },

  /**
   * 存储数据到缓存
   * @param {string} endpoint - API 端点
   * @param {object} params - 请求参数
   * @param {any} data - 要缓存的数据
   */
  set(endpoint, params = {}, data) {
    if (!Config.CACHE.enabled) return;

    const key = this._generateKey(endpoint, params);

    // 检查缓存大小限制
    if (this.memory.size >= Config.CACHE.maxSize) {
      // 删除最旧的条目
      const firstKey = this.memory.keys().next().value;
      this.memory.delete(firstKey);
    }

    this.memory.set(key, {
      data: data,
      timestamp: Date.now()
    });

    console.log(`[Cache] Set: ${key}`);
  },

  /**
   * 从缓存删除数据
   * @param {string} endpoint - API 端点
   * @param {object} params - 请求参数
   */
  delete(endpoint, params = {}) {
    const key = this._generateKey(endpoint, params);
    this.memory.delete(key);
  },

  /**
   * 清空所有缓存
   */
  clear() {
    this.memory.clear();
    this.stats = { hits: 0, misses: 0 };
    console.log('[Cache] Cleared all');
  },

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of this.memory.entries()) {
      if (now - value.timestamp > Config.CACHE.ttl) {
        this.memory.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }
  },

  /**
   * 获取缓存统计信息
   * @returns {object} 统计信息
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : 0;

    return {
      size: this.memory.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`
    };
  },

  /**
   * 打印缓存状态（调试用）
   */
  logStatus() {
    const stats = this.getStats();
    console.log('[Cache] Status:', stats);
  }
};

// 定期清理过期缓存
setInterval(() => Cache.cleanup(), 60000); // 每分钟清理一次
