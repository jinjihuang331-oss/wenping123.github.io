/**
 * 无限滚动模块
 */

const InfiniteScroll = {
  // 观察器实例
  observer: null,

  // 当前模式
  mode: null, // 'popular', 'search', null

  // 加载状态
  isLoading: false,

  // 当前页码
  currentPage: 1,

  /**
   * 初始化无限滚动
   */
  init() {
    // 创建 Intersection Observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: null,
        rootMargin: '200px',
        threshold: 0
      }
    );

    // 观察触发器元素
    const trigger = document.getElementById('infiniteScrollTrigger');
    if (trigger) {
      this.observer.observe(trigger);
    }
  },

  /**
   * 处理交叉观察回调
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.isLoading && this.mode) {
        this.loadMore();
      }
    });
  },

  /**
   * 设置当前模式
   * @param {string} mode - 'popular' 或 'search'
   * @param {number} startPage - 起始页码
   */
  setMode(mode, startPage = 1) {
    this.mode = mode;
    this.currentPage = startPage;
    this.isLoading = false;
  },

  /**
   * 清除模式
   */
  clearMode() {
    this.mode = null;
    this.isLoading = false;
  },

  /**
   * 加载更多数据
   */
  async loadMore() {
    if (this.isLoading) return;

    this.isLoading = true;
    const nextPage = this.currentPage + 1;

    try {
      if (this.mode === 'popular' && nextPage <= Config.INFINITE_SCROLL.maxPages) {
        const data = await API.getPopularMovies(nextPage);

        if (data.results && data.results.length > 0) {
          UI.renderMovieGrid(data.results, 'popularGrid', true);
          this.currentPage = nextPage;
        }
      } else if (this.mode === 'search') {
        await Search.loadMore();
        this.currentPage = nextPage;
      }
    } catch (error) {
      console.error('[InfiniteScroll] Error:', error);
    } finally {
      this.isLoading = false;
    }
  },

  /**
   * 刷新当前视图
   */
  refresh() {
    this.isLoading = false;
    this.currentPage = 1;
  }
};
