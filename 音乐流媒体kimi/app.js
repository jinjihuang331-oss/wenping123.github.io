// ===== Music Streaming Application =====

class MusicPlayer {
    constructor() {
        this.currentSong = null;
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 'none'; // none, all, one
        this.volume = 70;
        this.isMuted = false;
        this.lyricsVisible = false;
        this.wavesurfer = null;
        this.collabInterval = null;
        this.offlineMode = false;
        this.cachedSongs = {};

        this.init();
    }

    // ===== Initialization =====
    init() {
        this.initWaveSurfer();
        this.initElements();
        this.initEventListeners();
        this.initPlaylist();
        this.initRecommendations();
        this.initCollaborativePlaylist();
        this.loadCachedSongs();
    }

    initWaveSurfer() {
        this.wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#404040',
            progressColor: '#1db954',
            cursorColor: '#1db954',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 50,
            responsive: true,
            normalize: true,
            backend: 'MediaElement'
        });

        this.wavesurfer.on('ready', () => {
            this.updateDuration();
            if (this.isPlaying) {
                this.wavesurfer.play();
            }
        });

        this.wavesurfer.on('audioprocess', () => {
            this.updateCurrentTime();
            this.updateLyrics();
        });

        this.wavesurfer.on('finish', () => {
            this.onSongEnd();
        });

        this.wavesurfer.on('error', (err) => {
            console.error('WaveSurfer error:', err);
            this.showToast('播放出错，请重试', 'error');
        });
    }

    initElements() {
        // Player controls
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.muteBtn = document.getElementById('muteBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');

        // Current track info
        this.currentTitleEl = document.getElementById('currentTitle');
        this.currentArtistEl = document.getElementById('currentArtist');
        this.currentAlbumEl = document.getElementById('currentAlbum');
        this.currentYearEl = document.getElementById('currentYear');
        this.currentAlbumArt = document.getElementById('currentAlbumArt');

        // Playlist
        this.playlistBody = document.getElementById('playlistBody');
        this.emptyPlaylist = document.getElementById('emptyPlaylist');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.clearPlaylistBtn = document.getElementById('clearPlaylist');

        // Lyrics
        this.lyricsSection = document.getElementById('lyricsSection');
        this.lyricsContent = document.getElementById('lyricsContent');
        this.lyricsToggle = document.getElementById('lyricsToggle');

        // Search
        this.searchInput = document.getElementById('searchInput');
        this.searchSuggestions = document.getElementById('searchSuggestions');
        this.searchClear = document.getElementById('searchClear');

        // Sidebar
        this.sidebar = document.getElementById('sidebar');
        this.menuToggle = document.getElementById('menuToggle');
        this.sidebarClose = document.getElementById('sidebarClose');

        // Collab panel
        this.collabPanel = document.getElementById('collabPanel');
        this.collabToggle = document.getElementById('collabToggle');
        this.collabClose = document.getElementById('collabClose');
        this.collabActivity = document.getElementById('collabActivity');

        // Queue panel
        this.queuePanel = document.getElementById('queuePanel');
        this.queueBtn = document.getElementById('queueBtn');
        this.queueClose = document.getElementById('queueClose');
        this.queueList = document.getElementById('queueList');

        // Modal
        this.addSongsModal = document.getElementById('addSongsModal');
        this.addSongsBtn = document.getElementById('addSongsBtn');
        this.browseSongsBtn = document.getElementById('browseSongsBtn');
        this.modalClose = document.getElementById('modalClose');
        this.songsList = document.getElementById('songsList');

        // Offline
        this.offlineModeBtn = document.getElementById('offlineMode');
        this.cacheBtn = document.getElementById('cacheBtn');

        // Toast
        this.toastContainer = document.getElementById('toastContainer');
    }

    initEventListeners() {
        // Player controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());

        // Playlist controls
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.clearPlaylistBtn.addEventListener('click', () => this.clearPlaylist());

        // Lyrics
        this.lyricsToggle.addEventListener('click', () => this.toggleLyrics());

        // Search
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.searchInput.addEventListener('focus', () => this.showSearchSuggestions());
        this.searchClear.addEventListener('click', () => this.clearSearch());
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchSuggestions();
            }
        });

        // Sidebar
        this.menuToggle.addEventListener('click', () => this.toggleSidebar());
        this.sidebarClose.addEventListener('click', () => this.closeSidebar());

        // Collab panel
        this.collabToggle.addEventListener('click', () => this.toggleCollabPanel());
        this.collabClose.addEventListener('click', () => this.closeCollabPanel());

        // Queue panel
        this.queueBtn.addEventListener('click', () => this.toggleQueuePanel());
        this.queueClose.addEventListener('click', () => this.closeQueuePanel());

        // Modal
        this.addSongsBtn.addEventListener('click', () => this.openAddSongsModal());
        this.browseSongsBtn.addEventListener('click', () => this.openAddSongsModal());
        this.modalClose.addEventListener('click', () => this.closeAddSongsModal());
        this.addSongsModal.addEventListener('click', (e) => {
            if (e.target === this.addSongsModal) this.closeAddSongsModal();
        });

        // Offline mode
        this.offlineModeBtn.addEventListener('click', () => this.toggleOfflineMode());
        this.cacheBtn.addEventListener('click', () => this.cacheCurrentSong());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Handle page visibility change
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // Handle device orientation change
        window.addEventListener('orientationchange', () => this.handleOrientationChange());

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.handleResize(), 250);
        });
    }

    // ===== Playlist Management =====
    initPlaylist() {
        const savedPlaylist = localStorage.getItem('playlist');
        if (savedPlaylist) {
            this.playlist = JSON.parse(savedPlaylist);
            this.renderPlaylist();
            if (this.playlist.length > 0) {
                this.loadSong(this.playlist[0], false);
            }
        }
    }

    initRecommendations() {
        const grid = document.getElementById('recommendationsGrid');
        const recommendations = getRecommendations();

        grid.innerHTML = recommendations.map(rec => `
            <div class="song-card" onclick="player.addToPlaylistAndPlay(${rec.songId})">
                <div class="card-image">
                    <img src="${rec.song.cover}" alt="${rec.song.title}">
                    <div class="card-play">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="card-title">${rec.song.title}</div>
                <div class="card-artist">${rec.song.artist}</div>
            </div>
        `).join('');
    }

    initCollaborativePlaylist() {
        // Load collaborative playlist songs
        collaborativePlaylist.songs.forEach(songId => {
            if (!this.playlist.find(s => s.id === songId)) {
                const song = getSongById(songId);
                if (song) this.playlist.push(song);
            }
        });
        this.renderPlaylist();

        // Start collaborative updates
        this.startCollaborativeUpdates();
        this.renderCollabActivity();
    }

    startCollaborativeUpdates() {
        // Simulate collaborative updates every 30 seconds
        this.collabInterval = setInterval(() => {
            this.simulateCollaborativeUpdate();
        }, 30000);
    }

    simulateCollaborativeUpdate() {
        const actions = ['添加了', '喜欢了', '分享了'];
        const users = ['Alice', 'Bob', 'Carol'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomSong = mockSongs[Math.floor(Math.random() * mockSongs.length)];

        const activity = {
            user: randomUser,
            action: randomAction,
            songId: randomSong.id,
            time: Date.now()
        };

        userActivities.unshift(activity);
        if (userActivities.length > 10) userActivities.pop();

        this.renderCollabActivity();

        // Show notification for new activity
        if (activity.action === '添加了') {
            this.showToast(`${randomUser} 添加了一首新歌`, 'info');

            // Auto-add to playlist if it's a collaborative add
            if (!this.playlist.find(s => s.id === randomSong.id)) {
                this.playlist.push(randomSong);
                this.renderPlaylist();
            }
        }
    }

    renderPlaylist() {
        if (this.playlist.length === 0) {
            this.playlistBody.innerHTML = '';
            this.emptyPlaylist.classList.add('active');
            return;
        }

        this.emptyPlaylist.classList.remove('active');

        this.playlistBody.innerHTML = this.playlist.map((song, index) => `
            <tr class="${this.currentSong?.id === song.id ? 'active' : ''}" data-index="${index}">
                <td class="col-number">
                    <span class="track-number">${index + 1}</span>
                    <div class="play-btn-cell">
                        <button onclick="player.playAtIndex(${index})">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </td>
                <td class="col-title">
                    <div class="track-cell">
                        <img src="${song.cover}" alt="${song.title}">
                        <div class="track-info-cell">
                            <div class="track-name">${song.title}</div>
                            <div class="track-artist">${song.artist}</div>
                        </div>
                    </div>
                </td>
                <td class="col-artist">${song.artist}</td>
                <td class="col-album">${song.album}</td>
                <td class="col-duration">${song.duration}</td>
                <td class="col-actions">
                    <div class="track-actions">
                        <button onclick="player.removeFromPlaylist(${index})" title="删除">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.savePlaylist();
        this.renderQueue();
    }

    renderQueue() {
        if (this.playlist.length === 0) {
            this.queueList.innerHTML = '<p style="padding: 16px; color: var(--text-secondary); text-align: center;">队列为空</p>';
            return;
        }

        this.queueList.innerHTML = this.playlist.map((song, index) => `
            <div class="queue-item ${this.currentSong?.id === song.id ? 'active' : ''}" onclick="player.playAtIndex(${index})">
                <img src="${song.cover}" alt="${song.title}">
                <div class="queue-info">
                    <div class="queue-title">${song.title}</div>
                    <div class="queue-artist">${song.artist}</div>
                </div>
                <span class="queue-duration">${song.duration}</span>
            </div>
        `).join('');
    }

    renderCollabActivity() {
        this.collabActivity.innerHTML = userActivities.map(activity => {
            const song = getSongById(activity.songId);
            const timeAgo = this.getTimeAgo(activity.time);

            return `
                <div class="activity-item">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user}" alt="${activity.user}">
                    <div>
                        <div class="activity-text">
                            <strong>${activity.user}</strong> ${activity.action} <strong>${song?.title || '未知歌曲'}</strong>
                        </div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    addToPlaylist(songId) {
        const song = getSongById(songId);
        if (!song) return;

        if (this.playlist.find(s => s.id === songId)) {
            this.showToast('歌曲已在播放列表中', 'info');
            return;
        }

        this.playlist.push(song);
        this.renderPlaylist();
        this.showToast('已添加到播放列表', 'success');
    }

    addToPlaylistAndPlay(songId) {
        const song = getSongById(songId);
        if (!song) return;

        const existingIndex = this.playlist.findIndex(s => s.id === songId);
        if (existingIndex >= 0) {
            this.playAtIndex(existingIndex);
        } else {
            this.playlist.push(song);
            this.renderPlaylist();
            this.playAtIndex(this.playlist.length - 1);
        }
    }

    removeFromPlaylist(index) {
        if (index === this.currentIndex) {
            this.wavesurfer.stop();
            this.isPlaying = false;
            this.updatePlayButton();
        }

        this.playlist.splice(index, 1);

        if (index < this.currentIndex) {
            this.currentIndex--;
        } else if (index === this.currentIndex) {
            this.currentIndex = -1;
            this.currentSong = null;
            this.resetCurrentTrack();
        }

        this.renderPlaylist();
    }

    clearPlaylist() {
        this.wavesurfer.stop();
        this.playlist = [];
        this.currentIndex = -1;
        this.currentSong = null;
        this.isPlaying = false;
        this.resetCurrentTrack();
        this.renderPlaylist();
        this.updatePlayButton();
    }

    savePlaylist() {
        localStorage.setItem('playlist', JSON.stringify(this.playlist));
    }

    resetCurrentTrack() {
        this.currentTitleEl.textContent = '选择一首歌曲';
        this.currentArtistEl.textContent = '开始播放';
        this.currentAlbumEl.textContent = '';
        this.currentYearEl.textContent = '';
        this.currentAlbumArt.src = '';
        this.lyricsContent.innerHTML = '<p class="lyrics-placeholder">歌词将在这里显示...</p>';
        this.currentTimeEl.textContent = '0:00';
        this.totalTimeEl.textContent = '0:00';
    }

    // ===== Song Playback =====
    async loadSong(song, autoplay = true) {
        this.currentSong = song;

        // Update UI
        this.currentTitleEl.textContent = song.title;
        this.currentArtistEl.textContent = song.artist;
        this.currentAlbumEl.textContent = song.album;
        this.currentYearEl.textContent = song.year;
        this.currentAlbumArt.src = song.cover;

        // Update playlist highlighting
        this.renderPlaylist();

        // Load audio
        try {
            const audioUrl = await this.getAudioUrl(song);
            this.wavesurfer.load(audioUrl);

            if (autoplay) {
                this.isPlaying = true;
                this.updatePlayButton();
            }

            // Load lyrics
            this.loadLyrics(song);

            // Update page title
            document.title = `${song.title} - ${song.artist} | Music Stream`;
        } catch (error) {
            console.error('Failed to load song:', error);
            this.showToast('加载歌曲失败', 'error');
        }
    }

    async getAudioUrl(song) {
        if (this.offlineMode) {
            const cachedResponse = await getCachedSong(song.id);
            if (cachedResponse) {
                return URL.createObjectURL(await cachedResponse.blob());
            }
            throw new Error('Song not cached');
        }
        return song.audioUrl;
    }

    playAtIndex(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentIndex = index;
        this.loadSong(this.playlist[index]);
    }

    togglePlay() {
        if (!this.currentSong) {
            if (this.playlist.length > 0) {
                this.playAtIndex(0);
            } else {
                this.showToast('播放列表为空', 'info');
            }
            return;
        }

        if (this.isPlaying) {
            this.wavesurfer.pause();
            this.isPlaying = false;
        } else {
            this.wavesurfer.play();
            this.isPlaying = true;
        }

        this.updatePlayButton();
    }

    updatePlayButton() {
        const icon = this.playPauseBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }

    playPrevious() {
        if (this.playlist.length === 0) return;

        let prevIndex;
        if (this.isShuffle) {
            prevIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            prevIndex = this.currentIndex - 1;
            if (prevIndex < 0) prevIndex = this.playlist.length - 1;
        }

        this.playAtIndex(prevIndex);
    }

    playNext() {
        if (this.playlist.length === 0) return;

        let nextIndex;
        if (this.isShuffle) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = this.currentIndex + 1;
            if (nextIndex >= this.playlist.length) nextIndex = 0;
        }

        this.playAtIndex(nextIndex);
    }

    onSongEnd() {
        if (this.repeatMode === 'one') {
            this.wavesurfer.play();
        } else if (this.currentIndex < this.playlist.length - 1 || this.repeatMode === 'all') {
            this.playNext();
        } else {
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.style.color = this.isShuffle ? 'var(--primary-color)' : '';
        this.showToast(this.isShuffle ? '随机播放已开启' : '随机播放已关闭', 'info');
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];

        const icons = {
            none: 'fa-redo',
            all: 'fa-redo',
            one: 'fa-redo fa-spin'
        };

        this.repeatBtn.innerHTML = `<i class="fas ${icons[this.repeatMode]}"></i>`;
        this.repeatBtn.style.color = this.repeatMode !== 'none' ? 'var(--primary-color)' : '';

        const messages = {
            none: '循环播放已关闭',
            all: '列表循环已开启',
            one: '单曲循环已开启'
        };
        this.showToast(messages[this.repeatMode], 'info');
    }

    // ===== Volume Control =====
    setVolume(value) {
        this.volume = value;
        this.wavesurfer.setVolume(value / 100);

        const icon = this.muteBtn.querySelector('i');
        if (value == 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (value < 50) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.wavesurfer.setMute(this.isMuted);

        const icon = this.muteBtn.querySelector('i');
        if (this.isMuted) {
            icon.className = 'fas fa-volume-mute';
            this.volumeSlider.disabled = true;
        } else {
            this.setVolume(this.volume);
            this.volumeSlider.disabled = false;
        }
    }

    // ===== Lyrics =====
    loadLyrics(song) {
        if (!song.lyrics || song.lyrics.length === 0) {
            this.lyricsContent.innerHTML = '<p class="lyrics-placeholder">暂无歌词</p>';
            return;
        }

        this.lyricsContent.innerHTML = song.lyrics.map((line, index) => `
            <div class="lyrics-line" data-time="${line.time}" data-index="${index}">
                ${line.text}
            </div>
        `).join('');
    }

    updateLyrics() {
        if (!this.currentSong || !this.currentSong.lyrics || !this.lyricsVisible) return;

        const currentTime = this.wavesurfer.getCurrentTime();
        const lines = this.lyricsContent.querySelectorAll('.lyrics-line');

        let activeLine = null;
        for (let i = lines.length - 1; i >= 0; i--) {
            const lineTime = parseFloat(lines[i].dataset.time);
            if (currentTime >= lineTime) {
                activeLine = lines[i];
                break;
            }
        }

        lines.forEach(line => line.classList.remove('active'));
        if (activeLine) {
            activeLine.classList.add('active');
            activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    toggleLyrics() {
        this.lyricsVisible = !this.lyricsVisible;
        this.lyricsSection.classList.toggle('active', this.lyricsVisible);

        if (this.lyricsVisible && this.currentSong) {
            this.updateLyrics();
        }
    }

    // ===== Search =====
    handleSearch(query) {
        if (!query.trim()) {
            this.searchSuggestions.innerHTML = '';
            this.searchSuggestions.classList.remove('active');
            return;
        }

        const results = searchSongs(query);
        this.renderSearchSuggestions(results);
    }

    renderSearchSuggestions(results) {
        if (results.length === 0) {
            this.searchSuggestions.innerHTML = '<div class="suggestion-item">无搜索结果</div>';
        } else {
            this.searchSuggestions.innerHTML = results.slice(0, 5).map(song => `
                <div class="suggestion-item" onclick="player.addToPlaylistAndPlay(${song.id}); player.hideSearchSuggestions();">
                    <img src="${song.cover}" alt="${song.title}">
                    <div class="suggestion-info">
                        <div class="suggestion-title">${song.title}</div>
                        <div class="suggestion-artist">${song.artist}</div>
                    </div>
                    <span class="suggestion-type">歌曲</span>
                </div>
            `).join('');
        }

        this.searchSuggestions.classList.add('active');
    }

    showSearchSuggestions() {
        if (this.searchInput.value.trim()) {
            this.searchSuggestions.classList.add('active');
        }
    }

    hideSearchSuggestions() {
        this.searchSuggestions.classList.remove('active');
    }

    clearSearch() {
        this.searchInput.value = '';
        this.searchSuggestions.innerHTML = '';
        this.searchSuggestions.classList.remove('active');
    }

    // ===== UI Panels =====
    toggleSidebar() {
        this.sidebar.classList.toggle('active');
    }

    closeSidebar() {
        this.sidebar.classList.remove('active');
    }

    toggleCollabPanel() {
        this.collabPanel.classList.toggle('active');
        this.closeQueuePanel();
    }

    closeCollabPanel() {
        this.collabPanel.classList.remove('active');
    }

    toggleQueuePanel() {
        this.queuePanel.classList.toggle('active');
        this.closeCollabPanel();
    }

    closeQueuePanel() {
        this.queuePanel.classList.remove('active');
    }

    openAddSongsModal() {
        this.renderSongsList();
        this.addSongsModal.classList.add('active');
    }

    closeAddSongsModal() {
        this.addSongsModal.classList.remove('active');
    }

    renderSongsList() {
        this.songsList.innerHTML = mockSongs.map(song => `
            <div class="song-list-item">
                <img src="${song.cover}" alt="${song.title}">
                <div class="song-info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist} · ${song.album}</div>
                </div>
                <button class="btn-add" onclick="player.addToPlaylist(${song.id}); player.closeAddSongsModal();">
                    添加
                </button>
            </div>
        `).join('');
    }

    // ===== Offline Mode & Cache =====
    async loadCachedSongs() {
        this.cachedSongs = await getCachedSongsList();
    }

    async toggleOfflineMode() {
        this.offlineMode = !this.offlineMode;

        const icon = this.offlineModeBtn.querySelector('i');
        if (this.offlineMode) {
            icon.className = 'fas fa-wifi-slash';
            this.offlineModeBtn.style.color = 'var(--accent-color)';
            this.showToast('离线模式已开启', 'info');
        } else {
            icon.className = 'fas fa-wifi';
            this.offlineModeBtn.style.color = '';
            this.showToast('在线模式已恢复', 'info');
        }
    }

    async cacheCurrentSong() {
        if (!this.currentSong) {
            this.showToast('请先选择一首歌曲', 'error');
            return;
        }

        const isCached = await isSongCached(this.currentSong.id);
        if (isCached) {
            this.showToast('歌曲已缓存', 'info');
            return;
        }

        this.showToast('正在缓存歌曲...', 'info');

        try {
            const success = await cacheSong(this.currentSong.id);
            if (success) {
                this.cachedSongs = await getCachedSongsList();
                this.showToast('缓存成功，可离线播放', 'success');
            } else {
                this.showToast('缓存失败', 'error');
            }
        } catch (error) {
            console.error('Cache error:', error);
            this.showToast('缓存失败', 'error');
        }
    }

    // ===== Keyboard Shortcuts =====
    handleKeyboard(e) {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                if (e.ctrlKey) this.playPrevious();
                break;
            case 'ArrowRight':
                if (e.ctrlKey) this.playNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(Math.min(100, this.volume + 5));
                this.volumeSlider.value = this.volume;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.volume - 5));
                this.volumeSlider.value = this.volume;
                break;
            case 'KeyM':
                this.toggleMute();
                break;
            case 'KeyL':
                this.toggleLyrics();
                break;
            case 'KeyF':
                this.toggleFullscreen();
                break;
        }
    }

    // ===== Utilities =====
    updateCurrentTime() {
        if (!this.wavesurfer) return;
        const currentTime = this.wavesurfer.getCurrentTime();
        this.currentTimeEl.textContent = formatTime(Math.floor(currentTime));

        // Update progress bar
        const duration = this.wavesurfer.getDuration();
        if (duration) {
            const progress = (currentTime / duration) * 100;
            document.getElementById('progressBar').style.width = `${progress}%`;
        }
    }

    updateDuration() {
        if (!this.wavesurfer) return;
        const duration = this.wavesurfer.getDuration();
        this.totalTimeEl.textContent = formatTime(Math.floor(duration));
    }

    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return '刚刚';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
        return `${Math.floor(seconds / 86400)}天前`;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    handleVisibilityChange() {
        // Keep playing when page is hidden
        if (document.hidden && this.isPlaying) {
            // Audio continues playing automatically
            console.log('Page hidden, audio continues playing');
        }
    }

    handleOrientationChange() {
        // Handle device rotation
        // Wavesurfer will automatically resize due to responsive option
        setTimeout(() => {
            if (this.wavesurfer) {
                this.wavesurfer.refresh();
            }
        }, 300);
    }

    handleResize() {
        if (this.wavesurfer) {
            this.wavesurfer.refresh();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
}

// ===== Initialize App =====
const player = new MusicPlayer();

// ===== Service Worker Registration for Offline Support =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.error('Service Worker registration failed:', err);
    });
}
