/**
 * API 模块 - 封装 TMDB API 调用
 */

const API = {
  /**
   * 发起 API 请求
   * @param {string} endpoint - API 端点
   * @param {object} params - 查询参数
   * @param {boolean} useCache - 是否使用缓存
   * @returns {Promise<any>} API 响应
   */
  async fetch(endpoint, params = {}, useCache = true) {
    if (!Config.hasApiKey()) {
      throw new Error('API key not configured');
    }

    // 检查缓存
    if (useCache) {
      const cached = Cache.get(endpoint, params);
      if (cached) return cached;
    }

    // 构建 URL
    const url = new URL(`${Config.BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', Config.API_KEY);
    url.searchParams.append('language', 'zh-CN');

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 存入缓存
      if (useCache) {
        Cache.set(endpoint, params, data);
      }

      return data;
    } catch (error) {
      console.error(`[API] Error fetching ${endpoint}:`, error);
      throw error;
    }
  },

  // ==================== 电影列表 API ====================

  /**
   * 获取热门电影
   * @param {number} page - 页码
   * @returns {Promise<object>}
   */
  getPopularMovies(page = 1) {
    return this.fetch('/movie/popular', { page });
  },

  /**
   * 获取评分最高电影
   * @param {number} page - 页码
   * @returns {Promise<object>}
   */
  getTopRatedMovies(page = 1) {
    return this.fetch('/movie/top_rated', { page });
  },

  /**
   * 获取即将上映电影
   * @param {number} page - 页码
   * @returns {Promise<object>}
   */
  getUpcomingMovies(page = 1) {
    return this.fetch('/movie/upcoming', { page });
  },

  /**
   * 获取正在上映电影
   * @param {number} page - 页码
   * @returns {Promise<object>}
   */
  getNowPlayingMovies(page = 1) {
    return this.fetch('/movie/now_playing', { page });
  },

  // ==================== 搜索 API ====================

  /**
   * 搜索电影
   * @param {string} query - 搜索关键词
   * @param {number} page - 页码
   * @returns {Promise<object>}
   */
  searchMovies(query, page = 1) {
    return this.fetch('/search/movie', {
      query: query.trim(),
      page,
      include_adult: false
    });
  },

  // ==================== 电影详情 API ====================

  /**
   * 获取电影详情
   * @param {number} movieId - 电影 ID
   * @returns {Promise<object>}
   */
  getMovieDetails(movieId) {
    return this.fetch(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,similar'
    });
  },

  /**
   * 获取电影演员
   * @param {number} movieId - 电影 ID
   * @returns {Promise<object>}
   */
  getMovieCredits(movieId) {
    return this.fetch(`/movie/${movieId}/credits`);
  },

  /**
   * 获取电影预告片
   * @param {number} movieId - 电影 ID
   * @returns {Promise<object>}
   */
  getMovieVideos(movieId) {
    return this.fetch(`/movie/${movieId}/videos`);
  },

  /**
   * 获取相似电影
   * @param {number} movieId - 电影 ID
   * @returns {Promise<object>}
   */
  getSimilarMovies(movieId) {
    return this.fetch(`/movie/${movieId}/similar`);
  },

  // ==================== 推荐 API ====================

  /**
   * 根据类型发现电影
   * @param {string} genreIds - 类型 ID，逗号分隔
   * @param {number} page - 页码
   * @returns {Promise<object>}
   */
  discoverMoviesByGenre(genreIds, page = 1) {
    return this.fetch('/discover/movie', {
      with_genres: genreIds,
      sort_by: 'popularity.desc',
      page,
      include_adult: false
    });
  },

  /**
   * 获取电影类型列表
   * @returns {Promise<object>}
   */
  getGenres() {
    return this.fetch('/genre/movie/list', {}, false); // 不缓存类型列表
  },

  // ==================== 演员 API ====================

  /**
   * 获取演员详情
   * @param {number} personId - 演员 ID
   * @returns {Promise<object>}
   */
  getPersonDetails(personId) {
    return this.fetch(`/person/${personId}`);
  },

  /**
   * 获取演员出演的电影
   * @param {number} personId - 演员 ID
   * @returns {Promise<object>}
   */
  getPersonMovies(personId) {
    return this.fetch(`/person/${personId}/movie_credits`);
  }
};
