/**
 * 推荐引擎模块
 * 根据观影列表生成个性化推荐
 */

const Recommendations = {
  // 缓存推荐结果
  cache: null,
  cacheTime: 0,
  CACHE_TTL: 5 * 60 * 1000, // 5 分钟缓存

  /**
   * 获取个性化推荐
   * @param {number} limit - 推荐数量
   * @returns {Promise<array>} 推荐电影列表
   */
  async getRecommendations(limit = 12) {
    // 检查缓存
    if (this.cache && Date.now() - this.cacheTime < this.CACHE_TTL) {
      console.log('[Recommendations] Using cached results');
      return this.cache.slice(0, limit);
    }

    const watchlist = Watchlist.getAll();

    if (watchlist.length === 0) {
      console.log('[Recommendations] Watchlist is empty');
      return [];
    }

    try {
      // 获取最常观看的类型
      const topGenres = Watchlist.getTopGenres(3);

      if (topGenres.length === 0) {
        console.log('[Recommendations] No genres found');
        return [];
      }

      console.log('[Recommendations] Top genres:', topGenres);

      // 根据主要类型发现电影
      const recommendations = await this._fetchByGenres(topGenres, watchlist, limit);

      // 缓存结果
      this.cache = recommendations;
      this.cacheTime = Date.now();

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('[Recommendations] Error:', error);
      return [];
    }
  },

  /**
   * 根据类型获取推荐电影
   * @private
   */
  async _fetchByGenres(genreIds, watchlist, limit) {
    const watchlistIds = new Set(watchlist.map(m => m.id));
    const recommendations = [];

    // 尝试不同的组合来获取足够的推荐
    const strategies = [
      // 策略 1: 使用所有顶级类型
      genreIds.join(','),
      // 策略 2: 使用主要类型
      genreIds[0],
      // 策略 3: 使用前两个类型
      genreIds.slice(0, 2).join(',')
    ];

    for (const genreQuery of strategies) {
      if (recommendations.length >= limit * 2) break;

      try {
        const data = await API.discoverMoviesByGenre(genreQuery, 1);

        if (data.results) {
          for (const movie of data.results) {
            // 排除已在观影列表中的电影
            if (!watchlistIds.has(movie.id)) {
              // 计算匹配分数
              movie.matchScore = this._calculateMatchScore(movie, genreIds);
              recommendations.push(movie);
              watchlistIds.add(movie.id); // 防止重复
            }
          }
        }
      } catch (error) {
        console.warn('[Recommendations] Strategy failed:', genreQuery);
      }
    }

    // 按匹配分数和评分排序
    recommendations.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return b.vote_average - a.vote_average;
    });

    return recommendations;
  },

  /**
   * 计算电影与观影列表的匹配分数
   * @private
   */
  _calculateMatchScore(movie, preferredGenres) {
    let score = 0;

    if (movie.genre_ids) {
      for (const genreId of movie.genre_ids) {
        if (preferredGenres.includes(String(genreId))) {
          // 主要类型权重更高
          const index = preferredGenres.indexOf(String(genreId));
          score += (3 - index) * 10;
        }
      }
    }

    // 评分加成
    if (movie.vote_average > 7) {
      score += 5;
    }

    // 人气加成
    if (movie.popularity > 100) {
      score += 3;
    }

    return score;
  },

  /**
   * 根据特定电影获取相似推荐
   * @param {number} movieId - 电影 ID
   * @param {number} limit - 数量限制
   * @returns {Promise<array>}
   */
  async getSimilar(movieId, limit = 6) {
    try {
      const data = await API.getSimilarMovies(movieId);
      return (data.results || []).slice(0, limit);
    } catch (error) {
      console.error('[Recommendations] Error getting similar:', error);
      return [];
    }
  },

  /**
   * 清除推荐缓存
   */
  clearCache() {
    this.cache = null;
    this.cacheTime = 0;
    console.log('[Recommendations] Cache cleared');
  },

  /**
   * 获取推荐解释（为什么推荐这部电影）
   * @param {object} movie - 电影对象
   * @returns {string} 推荐原因
   */
  getRecommendationReason(movie) {
    const watchlist = Watchlist.getAll();
    const watchlistGenres = Watchlist.getGenreStats();

    if (!movie.genre_ids || movie.genre_ids.length === 0) {
      return '基于您的观影历史推荐';
    }

    // 找出匹配的类型
    const matchedGenres = movie.genre_ids.filter(
      id => watchlistGenres[id] > 0
    );

    if (matchedGenres.length === 0) {
      return '热门推荐';
    }

    // 获取类型名称（需要 UI 模块提供 genre map）
    const genreNames = matchedGenres
      .map(id => UI.genreMap[id])
      .filter(Boolean);

    if (genreNames.length > 0) {
      return `因为您喜欢${genreNames.slice(0, 2).join('、')}类电影`;
    }

    return '基于您的观影历史推荐';
  }
};
