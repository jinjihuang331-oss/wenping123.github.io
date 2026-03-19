/**
 * 主应用模块
 * 初始化所有组件并处理路由
 */

const App = {
  // 当前视图
  currentView: 'home',

  // Hero 电影列表
  heroMovies: [],
  currentHeroIndex: 0,
  heroInterval: null,

  /**
   * 初始化应用
   */
  async init() {
    console.log('[App] Initializing...');

    // 初始化主题
    UI.initTheme();

    // 初始化观影列表
    Watchlist.init();

    // 监听观影列表变化
    Watchlist.onChange(() => {
      UI.updateWatchlistCount();
      Recommendations.clearCache();
    });

    // 更新计数
    UI.updateWatchlistCount();

    // 初始化搜索
    Search.init();

    // 初始化无限滚动
    InfiniteScroll.init();

    // 绑定主题切换
    document.getElementById('themeToggle').addEventListener('click', () => {
      UI.toggleTheme();
    });

    // 绑定模态框关闭
    document.getElementById('modalCloseBtn').addEventListener('click', () => {
      UI.closeTrailerModal();
    });

    document.getElementById('trailerModal').addEventListener('click', (e) => {
      if (e.target.id === 'trailerModal') {
        UI.closeTrailerModal();
      }
    });

    // 键盘 ESC 关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UI.closeTrailerModal();
      }
    });

    // 导航栏滚动效果
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // 绑定路由
    window.addEventListener('hashchange', () => this.handleRoute());

    // 检查 API 配置
    if (!Config.hasApiKey()) {
      this.showApiConfig();
      return;
    }

    // 初始化 UI
    await UI.init();

    // 处理初始路由
    this.handleRoute();

    console.log('[App] Initialized');
  },

  /**
   * 显示 API 配置界面
   */
  showApiConfig() {
    UI.showView('config');

    const saveBtn = document.getElementById('saveApiKeyBtn');
    const input = document.getElementById('apiKeyInput');

    saveBtn.onclick = async () => {
      const key = input.value.trim();

      if (key.length < 32) {
        UI.showNotification('请输入有效的 API 密钥');
        return;
      }

      Config.setApiKey(key);
      UI.showNotification('API 密钥已保存');

      // 重新初始化
      await UI.init();
      window.location.hash = '#home';
      this.handleRoute();
    };
  },

  /**
   * 处理路由
   */
  async handleRoute() {
    const hash = window.location.hash || '#home';
    console.log('[App] Route:', hash);

    // 解析路由
    const route = this.parseRoute(hash);

    switch (route.name) {
      case 'home':
        await this.showHome();
        break;
      case 'movie':
        await this.showMovieDetail(route.params.id);
        break;
      case 'search':
        Search.searchFromUrl(hash);
        break;
      case 'watchlist':
        await this.showWatchlist();
        break;
      case 'popular':
        await this.showPopular();
        break;
      default:
        await this.showHome();
    }
  },

  /**
   * 解析路由
   */
  parseRoute(hash) {
    if (hash.startsWith('#movie/')) {
      return { name: 'movie', params: { id: hash.split('/')[1] } };
    }
    if (hash.startsWith('#search')) {
      return { name: 'search', params: {} };
    }
    if (hash === '#watchlist') {
      return { name: 'watchlist', params: {} };
    }
    if (hash === '#popular') {
      return { name: 'popular', params: {} };
    }
    return { name: 'home', params: {} };
  },

  /**
   * 显示主页
   */
  async showHome() {
    UI.showView('home');
    this.currentView = 'home';

    // 加载各类电影
    UI.renderSkeletons('popularGrid', 6);
    UI.renderSkeletons('topRatedGrid', 6);
    UI.renderSkeletons('upcomingGrid', 6);

    try {
      // 并行加载
      const [popular, topRated, upcoming] = await Promise.all([
        API.getPopularMovies(1),
        API.getTopRatedMovies(1),
        API.getUpcomingMovies(1)
      ]);

      // 渲染网格
      UI.renderMovieGrid(popular.results.slice(0, 12), 'popularGrid');
      UI.renderMovieGrid(topRated.results.slice(0, 12), 'topRatedGrid');
      UI.renderMovieGrid(upcoming.results.slice(0, 12), 'upcomingGrid');

      // 设置 Hero
      this.heroMovies = popular.results.slice(0, 5);
      this.startHeroRotation();

      // 设置无限滚动模式
      InfiniteScroll.setMode('popular', 1);

    } catch (error) {
      console.error('[App] Error loading home:', error);
      UI.showNotification('加载失败，请检查网络连接');
    }
  },

  /**
   * 显示电影详情
   */
  async showMovieDetail(movieId) {
    if (!movieId) return;

    UI.showLoading();

    try {
      const movie = await API.getMovieDetails(movieId);
      UI.renderMovieDetail(movie);
      UI.showView('movie');
      this.currentView = 'movie';

      // 停止 Hero 轮播
      this.stopHeroRotation();

      // 清除无限滚动
      InfiniteScroll.clearMode();

    } catch (error) {
      console.error('[App] Error loading movie:', error);
      UI.showNotification('无法加载电影详情');
      window.location.hash = '#home';
    } finally {
      UI.hideLoading();
    }
  },

  /**
   * 显示观影列表
   */
  async showWatchlist() {
    UI.showView('watchlist');
    this.currentView = 'watchlist';

    const watchlist = Watchlist.getAll();
    const grid = document.getElementById('watchlistGrid');
    const emptyState = document.getElementById('watchlistEmpty');
    const recommendationsSection = document.getElementById('recommendationsSection');

    // 停止 Hero 轮播
    this.stopHeroRotation();
    InfiniteScroll.clearMode();

    if (watchlist.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      recommendationsSection.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    // 渲染观影列表
    UI.renderMovieGrid(watchlist, 'watchlistGrid');

    // 加载推荐
    recommendationsSection.classList.remove('hidden');
    UI.renderSkeletons('recommendationsGrid', 4);

    try {
      const recommendations = await Recommendations.getRecommendations(12);

      if (recommendations.length > 0) {
        UI.renderMovieGrid(recommendations, 'recommendationsGrid');
      } else {
        recommendationsSection.classList.add('hidden');
      }
    } catch (error) {
      console.error('[App] Error loading recommendations:', error);
      recommendationsSection.classList.add('hidden');
    }
  },

  /**
   * 显示全部热门电影
   */
  async showPopular() {
    UI.showView('home');
    this.currentView = 'home';

    // 隐藏其他区域
    document.querySelectorAll('.movie-section:not(:first-of-type)').forEach(el => {
      el.style.display = 'none';
    });

    UI.renderSkeletons('popularGrid', 12);

    try {
      const data = await API.getPopularMovies(1);
      UI.renderMovieGrid(data.results, 'popularGrid');
      InfiniteScroll.setMode('popular', 1);
    } catch (error) {
      console.error('[App] Error loading popular:', error);
    }
  },

  /**
   * 开始 Hero 轮播
   */
  startHeroRotation() {
    this.stopHeroRotation();

    if (this.heroMovies.length === 0) return;

    // 立即显示第一个
    this.currentHeroIndex = 0;
    UI.updateHero(this.heroMovies[0]);

    // 每 8 秒切换
    this.heroInterval = setInterval(() => {
      this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroMovies.length;
      UI.updateHero(this.heroMovies[this.currentHeroIndex]);
    }, 8000);
  },

  /**
   * 停止 Hero 轮播
   */
  stopHeroRotation() {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
      this.heroInterval = null;
    }
  }
};

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
