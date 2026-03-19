/**
 * 搜索模块
 * 处理搜索输入和防抖
 */

const Search = {
  // 搜索状态
  query: '',
  page: 1,
  isLoading: false,
  hasMore: true,

  // 防抖定时器
  debounceTimer: null,

  /**
   * 初始化搜索模块
   */
  init() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // 输入防抖
    searchInput.addEventListener('input', (e) => {
      this.handleInput(e.target.value);
    });

    // 回车搜索
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(this.debounceTimer);
        this.performSearch(searchInput.value.trim());
      }
    });

    // 搜索按钮
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        this.performSearch(query);
      }
    });

    // 返回按钮
    document.getElementById('searchBackBtn').addEventListener('click', () => {
      window.location.hash = '#home';
    });
  },

  /**
   * 处理输入（防抖）
   * @param {string} value - 输入值
   */
  handleInput(value) {
    clearTimeout(this.debounceTimer);

    const query = value.trim();
    if (!query) return;

    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, Config.SEARCH.debounceMs);
  },

  /**
   * 执行搜索
   * @param {string} query - 搜索关键词
   * @param {number} page - 页码
   * @param {boolean} append - 是否追加结果
   */
  async performSearch(query, page = 1, append = false) {
    if (!query || this.isLoading) return;

    if (!append) {
      this.query = query;
      this.page = 1;
      this.hasMore = true;

      // 更新 URL
      window.location.hash = `#search?q=${encodeURIComponent(query)}`;
    }

    this.isLoading = true;
    UI.showLoading();

    try {
      const data = await API.searchMovies(query, page);

      if (!append) {
        // 更新搜索标题
        document.getElementById('searchQuery').textContent = query;
        UI.showView('search');
      }

      // 渲染结果
      UI.renderMovieGrid(data.results, 'searchGrid', append);

      // 更新状态
      this.page = page;
      this.hasMore = data.page < data.total_pages;

      // 如果没有结果
      if (data.results.length === 0 && !append) {
        document.getElementById('searchGrid').innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
            <p>未找到与 "${query}" 相关的电影</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('[Search] Error:', error);
      UI.showNotification('搜索失败，请重试');
    } finally {
      this.isLoading = false;
      UI.hideLoading();
      document.getElementById('searchLoading').classList.remove('active');
    }
  },

  /**
   * 加载更多搜索结果（无限滚动）
   */
  async loadMore() {
    if (this.isLoading || !this.hasMore) return;

    document.getElementById('searchLoading').classList.add('active');
    await this.performSearch(this.query, this.page + 1, true);
  },

  /**
   * 从 URL 参数获取搜索词并执行搜索
   * @param {string} hash - URL hash
   */
  searchFromUrl(hash) {
    const match = hash.match(/#search\?q=([^&]+)/);
    if (match) {
      const query = decodeURIComponent(match[1]);
      document.getElementById('searchInput').value = query;
      this.performSearch(query);
    }
  }
};
