// ============================================================
// 播放器核心 — Wavesurfer.js 集成 + 播放队列
// ============================================================

class MusicPlayer {
  constructor() {
    this.wavesurfer = null;
    this.queue = [];
    this.currentIndex = -1;
    this.currentSong = null;
    this.isPlaying = false;
    this.isShuffle = false;
    this.repeatMode = 0; // 0: off, 1: all, 2: one
    this.volume = 0.8;
    this.isMuted = false;
    this.lyricsManager = null;

    // DOM 元素
    this.playBtn = document.getElementById('playBtn');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.repeatBtn = document.getElementById('repeatBtn');
    this.progressBar = document.getElementById('progressBar');
    this.progressHandle = document.getElementById('progressHandle');
    this.progressContainer = document.getElementById('progressBarContainer');
    this.currentTimeEl = document.getElementById('currentTime');
    this.totalTimeEl = document.getElementById('totalTime');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.muteBtn = document.getElementById('muteBtn');
    this.playerTitle = document.getElementById('playerTitle');
    this.playerArtist = document.getElementById('playerArtist');
    this.playerThumb = document.getElementById('playerThumb');
    this.thumbWrapper = this.playerThumb.parentElement;
    this.likeBtn = document.getElementById('likeBtn');
    this.offlineBtn = document.getElementById('offlineBtn');
    this.queueBtn = document.getElementById('queueBtn');
    this.queuePanel = document.getElementById('queuePanel');
    this.queueList = document.getElementById('queueList');
    this.clearQueueBtn = document.getElementById('clearQueueBtn');

    this.initWavesurfer();
    this.bindEvents();
  }

  initWavesurfer() {
    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'rgba(255, 255, 255, 0.3)',
      progressColor: '#1db954',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 48,
      responsive: true,
      normalize: true,
      backend: 'WebAudio'
    });

    this.wavesurfer.setVolume(this.volume);

    this.wavesurfer.on('ready', () => {
      this.totalTimeEl.textContent = formatTime(this.wavesurfer.getDuration());
    });

    this.wavesurfer.on('audioprocess', (time) => {
      this.updateProgress(time);
      if (this.lyricsManager) {
        this.lyricsManager.update(time);
      }
    });

    this.wavesurfer.on('seeking', (time) => {
      this.updateProgress(time);
      if (this.lyricsManager) {
        this.lyricsManager.update(time);
      }
    });

    this.wavesurfer.on('play', () => {
      this.isPlaying = true;
      this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      document.body.classList.add('playing');
    });

    this.wavesurfer.on('pause', () => {
      this.isPlaying = false;
      this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
      document.body.classList.remove('playing');
    });

    this.wavesurfer.on('finish', () => {
      this.handleTrackEnd();
    });

    this.wavesurfer.on('error', (e) => {
      console.warn('Wavesurfer 播放错误:', e);
    });
  }

  bindEvents() {
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
    this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
    this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
    this.muteBtn.addEventListener('click', () => this.toggleMute());
    this.offlineBtn.addEventListener('click', () => this.cacheCurrentSong());

    this.volumeSlider.addEventListener('input', (e) => {
      this.volume = e.target.value / 100;
      this.wavesurfer.setVolume(this.isMuted ? 0 : this.volume);
      this.updateVolumeIcon();
    });

    // 进度条点击跳转
    this.progressContainer.addEventListener('click', (e) => {
      const rect = this.progressContainer.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (this.wavesurfer.getDuration()) {
        this.wavesurfer.seekTo(ratio);
      }
    });

    // 拖拽进度条
    let dragging = false;
    const handleMove = (e) => {
      if (!dragging) return;
      const rect = this.progressContainer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      this.progressBar.style.width = (ratio * 100) + '%';
      this.progressHandle.style.left = (ratio * 100) + '%';
      const time = ratio * (this.wavesurfer.getDuration() || 0);
      this.currentTimeEl.textContent = formatTime(time);
    };

    this.progressContainer.addEventListener('mousedown', (e) => { dragging = true; handleMove(e); });
    this.progressContainer.addEventListener('touchstart', (e) => { dragging = true; handleMove(e); }, { passive: true });
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('mouseup', () => { dragging = false; });
    document.addEventListener('touchend', (e) => {
      if (dragging) {
        const rect = this.progressContainer.getBoundingClientRect();
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        if (this.wavesurfer.getDuration()) {
          this.wavesurfer.seekTo(ratio);
        }
        dragging = false;
      }
    });

    // 队列面板
    this.queueBtn.addEventListener('click', () => {
      this.queuePanel.classList.toggle('open');
    });
    this.clearQueueBtn.addEventListener('click', () => this.clearQueue());

    // 旋转不中断播放
    window.addEventListener('orientationchange', () => {
      // 播放状态在旋屏时保持
    });
  }

  setLyricsManager(lm) {
    this.lyricsManager = lm;
  }

  playSong(song, playlist = null) {
    if (!song) return;

    this.currentSong = song;
    this.playerTitle.textContent = song.title;
    this.playerArtist.textContent = song.artist;
    this.playerThumb.src = song.cover || '';
    this.thumbWrapper.classList.add('has-image');

    // 更新离线按钮状态
    this.offlineBtn.classList.toggle('cached', cacheManager.isCached(song.id));

    // 加载歌词
    if (this.lyricsManager) {
      this.lyricsManager.loadLyrics(song);
    }

    // 加载音频
    this.wavesurfer.load(song.url);
    this.wavesurfer.on('ready', () => {
      this.wavesurfer.play();
    });

    // 添加到最近播放
    addToRecent(song.id);

    // 触发事件
    window.dispatchEvent(new CustomEvent('song-changed', { detail: { song } }));
  }

  togglePlay() {
    if (!this.currentSong) {
      if (this.queue.length > 0) {
        this.currentIndex = 0;
        this.playSong(this.queue[0]);
      }
      return;
    }
    this.wavesurfer.playPause();
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.playSong(this.queue[this.currentIndex]);
    } else if (this.currentSong) {
      this.wavesurfer.seekTo(0);
    }
  }

  next() {
    if (this.isShuffle) {
      const nextIdx = Math.floor(Math.random() * this.queue.length);
      this.currentIndex = nextIdx;
    } else if (this.currentIndex < this.queue.length - 1) {
      this.currentIndex++;
    } else if (this.repeatMode >= 1) {
      this.currentIndex = 0;
    } else {
      return;
    }
    this.playSong(this.queue[this.currentIndex]);
  }

  handleTrackEnd() {
    if (this.repeatMode === 2) {
      // 单曲循环
      this.wavesurfer.seekTo(0);
      this.wavesurfer.play();
    } else {
      this.next();
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.shuffleBtn.classList.toggle('active', this.isShuffle);
  }

  toggleRepeat() {
    this.repeatMode = (this.repeatMode + 1) % 3;
    this.repeatBtn.classList.toggle('active', this.repeatMode > 0);
    if (this.repeatMode === 2) {
      this.repeatBtn.innerHTML = '<i class="fas fa-redo"></i><span class="repeat-one">1</span>';
    } else {
      this.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.wavesurfer.setVolume(this.isMuted ? 0 : this.volume);
    this.updateVolumeIcon();
  }

  updateVolumeIcon() {
    const icon = this.muteBtn.querySelector('i');
    if (this.isMuted || this.volume === 0) {
      icon.className = 'fas fa-volume-mute';
    } else if (this.volume < 0.5) {
      icon.className = 'fas fa-volume-down';
    } else {
      icon.className = 'fas fa-volume-up';
    }
  }

  updateProgress(time) {
    const duration = this.wavesurfer.getDuration() || 1;
    const pct = (time / duration) * 100;
    this.progressBar.style.width = pct + '%';
    this.progressHandle.style.left = pct + '%';
    this.currentTimeEl.textContent = formatTime(time);
  }

  setQueue(songs, startIndex = 0) {
    this.queue = [...songs];
    this.currentIndex = startIndex;
    this.renderQueue();
    if (songs[startIndex]) {
      this.playSong(songs[startIndex]);
    }
  }

  addToQueue(song) {
    this.queue.push(song);
    this.renderQueue();
    if (typeof window.showToast === 'function') {
      window.showToast(`已加入播放队列：${song.title}`, 'info');
    }
  }

  removeFromQueue(index) {
    if (index === this.currentIndex) return; // 不移除正在播放的
    this.queue.splice(index, 1);
    if (index < this.currentIndex) {
      this.currentIndex--;
    }
    this.renderQueue();
  }

  clearQueue() {
    if (this.isPlaying) {
      this.wavesurfer.pause();
    }
    this.queue = [];
    this.currentIndex = -1;
    this.renderQueue();
  }

  renderQueue() {
    this.queueList.innerHTML = '';
    this.queue.forEach((song, i) => {
      const item = document.createElement('div');
      item.className = 'queue-item' + (i === this.currentIndex ? ' active' : '');
      item.innerHTML = `
        <img src="${song.cover}" alt="" class="queue-thumb">
        <div class="queue-info">
          <span class="queue-title">${song.title}</span>
          <span class="queue-artist">${song.artist}</span>
        </div>
        <button class="icon-btn queue-remove" data-index="${i}" title="移除">
          <i class="fas fa-times"></i>
        </button>
      `;
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.queue-remove')) {
          this.currentIndex = i;
          this.playSong(song);
          this.renderQueue();
        }
      });
      const removeBtn = item.querySelector('.queue-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFromQueue(i);
      });
      this.queueList.appendChild(item);
    });
  }

  async cacheCurrentSong() {
    if (!this.currentSong) return;
    if (cacheManager.isCached(this.currentSong.id)) {
      await cacheManager.removeSong(this.currentSong.id);
      this.offlineBtn.classList.remove('cached');
    } else {
      await cacheManager.cacheSong(this.currentSong);
      this.offlineBtn.classList.add('cached');
    }
  }
}
