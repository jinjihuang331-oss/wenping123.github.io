// ============================================================
// 歌词管理器 — 时间同步歌词显示
// ============================================================

class LyricsManager {
  constructor() {
    this.panel = document.getElementById('lyricsPanel');
    this.body = document.getElementById('lyricsBody');
    this.closeBtn = document.getElementById('closeLyricsBtn');
    this.toggleBtn = document.getElementById('lyricsToggleBtn');
    this.artEl = document.getElementById('lyricsArt');
    this.titleEl = document.getElementById('lyricsTitle');
    this.artistEl = document.getElementById('lyricsArtist');

    this.currentLyrics = [];
    this.activeIndex = -1;

    this.bindEvents();
  }

  bindEvents() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.toggleBtn.addEventListener('click', () => this.toggle());
  }

  loadLyrics(song) {
    if (!song) {
      this.currentLyrics = [];
      this.activeIndex = -1;
      this.render();
      return;
    }

    this.currentLyrics = getLyricsForSong(song.id);
    this.activeIndex = -1;

    this.artEl.src = song.cover || '';
    this.titleEl.textContent = song.title;
    this.artistEl.textContent = song.artist;

    this.render();
  }

  render() {
    this.body.innerHTML = '';
    if (this.currentLyrics.length === 0) {
      this.body.innerHTML = '<div class="lyrics-empty">暂无歌词</div>';
      return;
    }

    this.currentLyrics.forEach((line, i) => {
      const div = document.createElement('div');
      div.className = 'lyrics-line';
      div.dataset.index = i;
      div.textContent = line.text;
      if (i === this.activeIndex) {
        div.classList.add('active');
      }
      this.body.appendChild(div);
    });
  }

  update(currentTime) {
    if (this.currentLyrics.length === 0) return;

    let newIndex = -1;
    for (let i = this.currentLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= this.currentLyrics[i].time) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== this.activeIndex) {
      this.activeIndex = newIndex;
      const lines = this.body.querySelectorAll('.lyrics-line');
      lines.forEach((el, i) => {
        el.classList.toggle('active', i === newIndex);
      });

      // 自动滚动到当前行
      if (newIndex >= 0 && lines[newIndex]) {
        lines[newIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }

  toggle() {
    if (this.panel.classList.contains('open')) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.panel.classList.add('open');
  }

  close() {
    this.panel.classList.remove('open');
  }

  isOpen() {
    return this.panel.classList.contains('open');
  }
}
