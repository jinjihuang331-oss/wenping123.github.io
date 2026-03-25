// ============================================================
// 搜索管理器 — 自动完成建议
// ============================================================

class SearchManager {
  constructor() {
    this.desktopInput = document.getElementById('searchInputDesktop');
    this.fullInput = document.getElementById('searchInputFull');
    this.desktopSuggestions = document.getElementById('searchSuggestionsDesktop');
    this.fullSuggestions = document.getElementById('searchSuggestionsFull');
    this.searchResults = document.getElementById('searchResults');
    this.clearBtn = document.getElementById('clearSearchBtn');

    this.debounceTimer = null;
    this.activeInput = null;

    this.bindEvents();
  }

  bindEvents() {
    // 桌面端搜索
    this.desktopInput.addEventListener('input', (e) => {
      this.activeInput = this.desktopInput;
      this.handleInput(e.target.value, this.desktopSuggestions);
    });
    this.desktopInput.addEventListener('focus', () => {
      this.activeInput = this.desktopInput;
      if (this.desktopInput.value.trim()) {
        this.showSuggestions(this.desktopSuggestions, this.desktopInput.value.trim());
      }
    });

    // 完整搜索页
    this.fullInput.addEventListener('input', (e) => {
      this.activeInput = this.fullInput;
      this.handleInput(e.target.value, this.fullSuggestions);
    });
    this.fullInput.addEventListener('focus', () => {
      this.activeInput = this.fullInput;
      if (this.fullInput.value.trim()) {
        this.showSuggestions(this.fullSuggestions, this.fullInput.value.trim());
      }
    });

    // 清除按钮
    this.clearBtn.addEventListener('click', () => {
      this.fullInput.value = '';
      this.fullSuggestions.innerHTML = '';
      this.fullSuggestions.classList.remove('show');
      this.searchResults.innerHTML = '<div class="empty-state"><i class="fas fa-music"></i><p>输入关键词开始搜索</p></div>';
    });

    // 点击外部关闭建议
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-input-wrapper')) {
        this.desktopSuggestions.classList.remove('show');
        this.fullSuggestions.classList.remove('show');
      }
    });

    // 键盘导航
    this.desktopInput.addEventListener('keydown', (e) => this.handleKeydown(e, this.desktopSuggestions));
    this.fullInput.addEventListener('keydown', (e) => this.handleKeydown(e, this.fullSuggestions));
  }

  handleInput(value, suggestionsEl) {
    clearTimeout(this.debounceTimer);
    const query = value.trim();
    if (!query) {
      suggestionsEl.classList.remove('show');
      suggestionsEl.innerHTML = '';
      if (this.activeInput === this.fullInput) {
        this.searchResults.innerHTML = '<div class="empty-state"><i class="fas fa-music"></i><p>输入关键词开始搜索</p></div>';
      }
      return;
    }
    this.debounceTimer = setTimeout(() => {
      this.showSuggestions(suggestionsEl, query);
    }, 150);
  }

  showSuggestions(suggestionsEl, query) {
    const results = this.search(query, 6);
    if (results.length === 0) {
      suggestionsEl.innerHTML = '<div class="suggestion-empty">未找到匹配结果</div>';
      suggestionsEl.classList.add('show');
      return;
    }

    suggestionsEl.innerHTML = results.map(song => `
      <div class="suggestion-item" data-id="${song.id}">
        <img src="${song.cover}" alt="" class="suggestion-thumb">
        <div class="suggestion-info">
          <span class="suggestion-title">${this.highlight(song.title, query)}</span>
          <span class="suggestion-meta">${this.highlight(song.artist, query)} · ${song.album}</span>
        </div>
        <span class="suggestion-duration">${formatTime(song.duration)}</span>
      </div>
    `).join('');

    suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const song = getSongById(item.dataset.id);
        if (song) {
          this.selectSong(song);
          suggestionsEl.classList.remove('show');
        }
      });
    });

    suggestionsEl.classList.add('show');
  }

  search(query, limit = 20) {
    const q = query.toLowerCase();
    return MOCK_SONGS.filter(song =>
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.album.toLowerCase().includes(q) ||
      song.genre.toLowerCase().includes(q)
    ).slice(0, limit);
  }

  highlight(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.substring(0, idx) +
      '<mark>' + text.substring(idx, idx + query.length) + '</mark>' +
      text.substring(idx + query.length);
  }

  selectSong(song) {
    if (this.activeInput) {
      this.activeInput.value = song.title;
    }
    // 如果在完整搜索页，显示搜索结果
    if (this.activeInput === this.fullInput) {
      this.showSearchResults(song.title);
    }
    // 播放选中歌曲
    if (window.player) {
      window.player.playSong(song);
    }
  }

  showSearchResults(query) {
    const results = this.search(query);
    if (results.length === 0) {
      this.searchResults.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>未找到匹配结果</p></div>';
      return;
    }

    this.searchResults.innerHTML = `
      <div class="search-results-header">找到 ${results.length} 首歌曲</div>
      <div class="track-list">
        ${results.map((song, i) => this.renderTrackItem(song, i)).join('')}
      </div>
    `;

    // 绑定点击事件
    this.searchResults.querySelectorAll('.track-item').forEach(item => {
      item.addEventListener('click', () => {
        const song = getSongById(item.dataset.id);
        if (song && window.player) {
          window.player.setQueue(results, parseInt(item.dataset.index));
        }
      });
      const dlBtn = item.querySelector('.offline-download');
      if (dlBtn) {
        dlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const song = getSongById(dlBtn.dataset.id);
          if (song) cacheManager.cacheSong(song);
        });
      }
    });
  }

  renderTrackItem(song, index) {
    return `
      <div class="track-item" data-id="${song.id}" data-index="${index}">
        <div class="track-number">${index + 1}</div>
        <img src="${song.cover}" alt="" class="track-cover">
        <div class="track-info">
          <span class="track-name">${song.title}</span>
          <span class="track-meta">${song.artist} · ${song.album}</span>
        </div>
        <span class="track-genre">${song.genre}</span>
        <span class="track-duration">${formatTime(song.duration)}</span>
        <button class="icon-btn offline-download" data-id="${song.id}" title="离线缓存">
          <i class="fas ${cacheManager.isCached(song.id) ? 'fa-check-circle' : 'fa-download'}"></i>
        </button>
      </div>
    `;
  }

  handleKeydown(e, suggestionsEl) {
    const items = suggestionsEl.querySelectorAll('.suggestion-item');
    if (!items.length) return;

    let activeIdx = [...items].findIndex(item => item.classList.contains('active'));

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        items.forEach(i => i.classList.remove('active'));
        activeIdx = (activeIdx + 1) % items.length;
        items[activeIdx].classList.add('active');
        break;
      case 'ArrowUp':
        e.preventDefault();
        items.forEach(i => i.classList.remove('active'));
        activeIdx = activeIdx <= 0 ? items.length - 1 : activeIdx - 1;
        items[activeIdx].classList.add('active');
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0 && items[activeIdx]) {
          items[activeIdx].click();
        }
        break;
      case 'Escape':
        suggestionsEl.classList.remove('show');
        break;
    }
  }
}
