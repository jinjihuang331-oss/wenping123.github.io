/**
 * UI 渲染模块
 * 处理所有 DOM 操作和页面渲染
 */

const UI = {
  // 类型映射表
  genreMap: {},

  /**
   * 初始化 UI 模块
   */
  async init() {
    // 加载类型映射
    try {
      const data = await API.getGenres();
      if (data.genres) {
        data.genres.forEach(genre => {
          this.genreMap[genre.id] = genre.name;
        });
      }
    } catch (error) {
      console.warn('[UI] Failed to load genres:', error);
    }
  },

  /**
   * 创建电影卡片 HTML
   * @param {object} movie - 电影数据
   * @returns {HTMLElement} 电影卡片元素
   */
  createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.id = movie.id;

    const posterUrl = Config.getImageUrl(movie.poster_path, 'medium', 'poster');
    const year = movie.release_date ? movie.release_date.substring(0, 4) : '未知';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const inWatchlist = Watchlist.has(movie.id);

    card.innerHTML = `
      <div class="movie-poster">
        <img src="${posterUrl}" alt="${movie.title}" loading="lazy">
        <span class="movie-rating">${rating}</span>
        <div class="movie-actions">
          <button class="movie-watchlist-btn ${inWatchlist ? 'in-watchlist' : ''}"
                  data-id="${movie.id}"
                  aria-label="${inWatchlist ? '从观影列表移除' : '添加到观影列表'}">
            <svg viewBox="0 0 24 24" fill="${inWatchlist ? 'currentColor' : 'none'}"
                 stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <div class="movie-meta">${year}</div>
      </div>
    `;

    // 点击卡片打开详情
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.movie-watchlist-btn')) {
        window.location.hash = `#movie/${movie.id}`;
      }
    });

    // 观影列表按钮点击
    const watchlistBtn = card.querySelector('.movie-watchlist-btn');
    watchlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const added = Watchlist.toggle(movie);
      this.updateWatchlistButton(watchlistBtn, added);
      this.showNotification(added ? '已添加到观影列表' : '已从观影列表移除');
    });

    return card;
  },

  /**
   * 更新观影列表按钮状态
   */
  updateWatchlistButton(btn, inWatchlist) {
    btn.classList.toggle('in-watchlist', inWatchlist);
    btn.setAttribute('aria-label', inWatchlist ? '从观影列表移除' : '添加到观影列表');
    btn.querySelector('svg').setAttribute('fill', inWatchlist ? 'currentColor' : 'none');
  },

  /**
   * 渲染电影网格
   * @param {array} movies - 电影数组
   * @param {string} containerId - 容器 ID
   * @param {boolean} append - 是否追加而非替换
   */
  renderMovieGrid(movies, containerId, append = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!append) {
      container.innerHTML = '';
    }

    if (!movies || movies.length === 0) {
      if (!append) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">暂无电影</p>';
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    movies.forEach(movie => {
      if (movie.poster_path) { // 只显示有海报的电影
        fragment.appendChild(this.createMovieCard(movie));
      }
    });

    container.appendChild(fragment);
  },

  /**
   * 渲染加载骨架屏
   * @param {string} containerId - 容器 ID
   * @param {number} count - 数量
   */
  renderSkeletons(containerId, count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'loading-skeleton';
      container.appendChild(skeleton);
    }
  },

  /**
   * 更新 Hero 区域
   * @param {object} movie - 电影数据
   */
  updateHero(movie) {
    const heroSection = document.getElementById('heroSection');
    const heroBackdrop = heroSection.querySelector('.hero-backdrop');
    const heroTitle = document.getElementById('heroTitle');
    const heroOverview = document.getElementById('heroOverview');
    const heroDetailBtn = document.getElementById('heroDetailBtn');
    const heroWatchlistBtn = document.getElementById('heroWatchlistBtn');

    if (!movie) {
      heroSection.classList.add('hidden');
      return;
    }

    const backdropUrl = Config.getImageUrl(movie.backdrop_path, 'large', 'backdrop');

    heroBackdrop.style.backgroundImage = `url(${backdropUrl})`;
    heroTitle.textContent = movie.title;
    heroOverview.textContent = movie.overview || '暂无简介';
    heroDetailBtn.href = `#movie/${movie.id}`;

    // 更新观影列表按钮状态
    const inWatchlist = Watchlist.has(movie.id);
    this.updateHeroWatchlistBtn(heroWatchlistBtn, inWatchlist);

    // 观影列表按钮事件
    heroWatchlistBtn.onclick = () => {
      const added = Watchlist.toggle(movie);
      this.updateHeroWatchlistBtn(heroWatchlistBtn, added);
      this.showNotification(added ? '已添加到观影列表' : '已从观影列表移除');
    };

    heroSection.classList.remove('hidden');
  },

  /**
   * 更新 Hero 观影列表按钮
   */
  updateHeroWatchlistBtn(btn, inWatchlist) {
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="${inWatchlist ? 'currentColor' : 'none'}"
           stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      ${inWatchlist ? '已在观影列表' : '加入观影列表'}
    `;
  },

  /**
   * 渲染电影详情页
   * @param {object} movie - 电影详情数据
   */
  renderMovieDetail(movie) {
    const section = document.getElementById('movieDetailSection');

    // 背景图
    const backdrop = section.querySelector('.detail-backdrop');
    const backdropUrl = Config.getImageUrl(movie.backdrop_path, 'large', 'backdrop');
    backdrop.style.backgroundImage = `url(${backdropUrl})`;

    // 海报
    const posterImg = document.getElementById('detailPosterImg');
    posterImg.src = Config.getImageUrl(movie.poster_path, 'large', 'poster');
    posterImg.alt = movie.title;

    // 基本信息
    document.getElementById('detailTitle').textContent = movie.title;
    document.getElementById('detailRating').textContent = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    document.getElementById('detailYear').textContent = movie.release_date ? movie.release_date.substring(0, 4) : '未知';
    document.getElementById('detailRuntime').textContent = movie.runtime ? `${movie.runtime} 分钟` : '';
    document.getElementById('detailTagline').textContent = movie.tagline || '';
    document.getElementById('detailOverview').textContent = movie.overview || '暂无简介';

    // 类型
    const genresContainer = document.getElementById('detailGenres');
    if (movie.genres) {
      genresContainer.innerHTML = movie.genres
        .map(g => `<span>${g.name}</span>`)
        .join('');
    }

    // 观影列表按钮
    const watchlistBtn = document.getElementById('detailWatchlistBtn');
    const watchlistText = document.getElementById('detailWatchlistText');
    const inWatchlist = Watchlist.has(movie.id);

    watchlistText.textContent = inWatchlist ? '已在观影列表' : '加入观影列表';
    watchlistBtn.onclick = () => {
      const added = Watchlist.toggle(movie);
      watchlistText.textContent = added ? '已在观影列表' : '加入观影列表';
      this.showNotification(added ? '已添加到观影列表' : '已从观影列表移除');
    };

    // 预告片按钮
    const trailerBtn = document.getElementById('detailTrailerBtn');
    const trailer = this._getTrailer(movie.videos);
    if (trailer) {
      trailerBtn.disabled = false;
      trailerBtn.onclick = () => this.openTrailerModal(trailer.key);
    } else {
      trailerBtn.disabled = true;
    }

    // 演员表
    this.renderCast(movie.credits?.cast || []);

    // 预告片列表
    this.renderTrailers(movie.videos?.results || []);

    // 返回按钮
    document.getElementById('detailBackBtn').onclick = () => {
      window.history.back();
    };
  },

  /**
   * 获取 YouTube 预告片
   * @private
   */
  _getTrailer(videos) {
    if (!videos || !videos.results) return null;

    // 优先找中文预告片
    const zhTrailer = videos.results.find(v =>
      v.site === 'YouTube' &&
      v.type === 'Trailer' &&
      v.iso_639_1 === 'zh'
    );
    if (zhTrailer) return zhTrailer;

    // 然后找任意预告片
    return videos.results.find(v =>
      v.site === 'YouTube' &&
      v.type === 'Trailer'
    );
  },

  /**
   * 渲染演员表
   */
  renderCast(cast) {
    const container = document.getElementById('castGrid');
    container.innerHTML = '';

    if (!cast || cast.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted);">暂无演员信息</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    cast.slice(0, 12).forEach(person => {
      const card = document.createElement('div');
      card.className = 'cast-card';

      const photoUrl = Config.getImageUrl(person.profile_path, 'medium', 'profile');

      card.innerHTML = `
        <div class="cast-photo">
          <img src="${photoUrl}" alt="${person.name}" loading="lazy">
        </div>
        <div class="cast-name">${person.name}</div>
        <div class="cast-character">${person.character}</div>
      `;

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  },

  /**
   * 渲染预告片列表
   */
  renderTrailers(videos) {
    const container = document.getElementById('trailerContainer');
    const section = document.getElementById('trailerSection');

    container.innerHTML = '';

    const youtubeVideos = videos.filter(v => v.site === 'YouTube').slice(0, 4);

    if (youtubeVideos.length === 0) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');

    const fragment = document.createDocumentFragment();
    youtubeVideos.forEach(video => {
      const item = document.createElement('div');
      item.className = 'trailer-item';

      const thumbnailUrl = `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`;

      item.innerHTML = `
        <div class="trailer-placeholder" style="background-image: url(${thumbnailUrl})">
          <div class="trailer-play">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>
      `;

      item.addEventListener('click', () => this.openTrailerModal(video.key));
      fragment.appendChild(item);
    });

    container.appendChild(fragment);
  },

  /**
   * 打开预告片模态框
   */
  openTrailerModal(videoKey) {
    const modal = document.getElementById('trailerModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
      <iframe src="https://www.youtube.com/embed/${videoKey}?autoplay=1"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
      </iframe>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  /**
   * 关闭预告片模态框
   */
  closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = '';
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  /**
   * 更新观影列表计数显示
   */
  updateWatchlistCount() {
    const countEl = document.getElementById('watchlistCount');
    if (countEl) {
      const count = Watchlist.getCount();
      countEl.textContent = count;
      countEl.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  /**
   * 显示通知
   * @param {string} message - 消息内容
   * @param {number} duration - 显示时长（毫秒）
   */
  showNotification(message, duration = 2500) {
    const notification = document.getElementById('notification');
    const text = notification.querySelector('.notification-text');

    text.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, duration);
  },

  /**
   * 显示加载指示器
   */
  showLoading() {
    document.getElementById('loadingIndicator').classList.add('active');
  },

  /**
   * 隐藏加载指示器
   */
  hideLoading() {
    document.getElementById('loadingIndicator').classList.remove('active');
  },

  /**
   * 切换页面视图
   * @param {string} view - 视图名称 (home, movie, search, watchlist)
   */
  showView(view) {
    // 隐藏所有主区域
    const views = ['homeSection', 'movieDetailSection', 'searchSection', 'watchlistSection', 'apiConfigSection'];
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    // 显示指定视图
    const viewMap = {
      home: 'homeSection',
      movie: 'movieDetailSection',
      search: 'searchSection',
      watchlist: 'watchlistSection',
      config: 'apiConfigSection'
    };

    const targetId = viewMap[view];
    if (targetId) {
      document.getElementById(targetId).classList.remove('hidden');
    }

    // 滚动到顶部
    window.scrollTo(0, 0);
  },

  /**
   * 初始化主题
   */
  initTheme() {
    const savedTheme = localStorage.getItem(Config.THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (!prefersDark) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  },

  /**
   * 切换主题
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(Config.THEME_KEY, newTheme);
  }
};
