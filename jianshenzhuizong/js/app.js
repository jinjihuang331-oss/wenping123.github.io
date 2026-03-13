// ===== Main Application Module =====
const app = {
  currentPage: 'dashboard',
  selectedWorkoutType: null,
  deferredPrompt: null,

  typeInfo: {
    running:       { icon: '🏃', label: '跑步' },
    weightlifting: { icon: '🏋️', label: '举重' },
    cycling:       { icon: '🚴', label: '骑行' },
    swimming:      { icon: '🏊', label: '游泳' },
    yoga:          { icon: '🧘', label: '瑜伽' },
    walking:       { icon: '🚶', label: '步行' }
  },

  async init() {
    // Initialize today's date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workout-date').value = today;
    document.getElementById('weight-date').value = today;

    // Update header subtitle
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const now = new Date();
    document.getElementById('header-subtitle').textContent =
      `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 周${dayNames[now.getDay()]}`;

    // Profile joined date
    const profileJoined = document.getElementById('profile-joined');
    profileJoined.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月加入`;

    // Setup navigation
    this.setupNavigation();
    this.setupWorkoutForm();
    this.setupPeriodSelector();
    this.setupEventListeners();

    // Load settings
    await this.loadSettings();

    // PWA install prompt
    this.setupInstallPrompt();

    // Register service worker
    this.registerSW();

    // Load data
    await this.loadDashboard();
    await charts.init();
    await goals.init();
    await pedometer.init();

    // Load profile stats
    await this.loadProfileStats();

    // Setup settings listeners
    this.setupSettings();
  },

  setupNavigation() {
    // Bottom nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });
  },

  navigateTo(page) {
    this.currentPage = page;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
    });
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.add('active');

    // Update title
    const titles = {
      dashboard: '仪表盘',
      log: '记录锻炼',
      progress: '进展',
      goals: '我的目标',
      profile: '我的'
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    // Scroll to top
    document.getElementById('main-content').scrollTop = 0;

    // Refresh data for specific pages
    if (page === 'dashboard') this.loadDashboard();
    if (page === 'progress') {
      charts.refreshAll();
      this.loadWorkoutHistory();
    }
    if (page === 'goals') goals.renderGoals();
    if (page === 'profile') this.loadProfileStats();

    // Hide FAB on log page
    const fab = document.getElementById('fab-add');
    fab.style.display = page === 'log' ? 'none' : '';
  },

  setupWorkoutForm() {
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.selectedWorkoutType = type;

        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.updateFormFields(type);
      });
    });
  },

  updateFormFields(type) {
    const distanceRow = document.getElementById('distance-row');
    const weightFields = document.getElementById('weightlifting-fields');

    // Show distance for running, cycling, swimming, walking
    const hasDistance = ['running', 'cycling', 'swimming', 'walking'].includes(type);
    distanceRow.style.display = hasDistance ? '' : 'none';

    // Show weight fields for weightlifting
    weightFields.style.display = type === 'weightlifting' ? '' : 'none';
  },

  async saveWorkout(e) {
    e.preventDefault();

    if (!this.selectedWorkoutType) {
      toast.show('请选择锻炼类型', 'error');
      return;
    }

    const workout = {
      type: this.selectedWorkoutType,
      date: document.getElementById('workout-date').value,
      duration: parseInt(document.getElementById('workout-duration').value) || 0,
      calories: parseInt(document.getElementById('workout-calories').value) || null,
      distance: parseFloat(document.getElementById('workout-distance').value) || null,
      sets: parseInt(document.getElementById('workout-sets').value) || null,
      reps: parseInt(document.getElementById('workout-reps').value) || null,
      weight: parseFloat(document.getElementById('workout-weight').value) || null,
      notes: document.getElementById('workout-notes').value.trim(),
      createdAt: new Date().toISOString()
    };

    await dbAdd('workouts', workout);
    toast.show('锻炼已记录！', 'success');

    // Reset form
    e.target.reset();
    document.getElementById('workout-date').value = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    this.selectedWorkoutType = null;
    document.getElementById('weightlifting-fields').style.display = 'none';
    document.getElementById('distance-row').style.display = '';

    // Refresh dashboard
    await this.loadDashboard();
    charts.refreshAll();
    goals.renderGoals();
  },

  async saveWeight(e) {
    e.preventDefault();

    const weightEntry = {
      date: document.getElementById('weight-date').value,
      weight: parseFloat(document.getElementById('weight-value').value),
      createdAt: new Date().toISOString()
    };

    // Check if weight entry already exists for this date
    const existing = await dbGetByIndex('weightLog', 'date', weightEntry.date);
    if (existing.length > 0) {
      // Update existing entry
      existing[0].weight = weightEntry.weight;
      existing[0].updatedAt = new Date().toISOString();
      await dbPut('weightLog', existing[0]);
      toast.show('体重已更新', 'success');
    } else {
      await dbAdd('weightLog', weightEntry);
      toast.show('体重已记录', 'success');
    }

    document.getElementById('weight-value').value = '';
    charts.renderWeightChart();
    goals.renderGoals();
  },

  setupEventListeners() {
    // Pedometer toggle
    const pedBtn = document.getElementById('btn-toggle-pedometer');
    if (pedBtn) {
      pedBtn.addEventListener('click', () => pedometer.toggleTracking());
    }

    // Steps badge click - navigate to dashboard and show pedometer
    const stepBadge = document.getElementById('btn-steps');
    if (stepBadge) {
      stepBadge.addEventListener('click', () => {
        this.navigateTo('dashboard');
        const pedCard = document.getElementById('pedometer-card');
        if (pedCard) {
          pedCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  },

  setupPeriodSelector() {
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        charts.setPeriod(btn.dataset.period);
      });
    });
  },

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      toast.show('应用已安装！', 'success');
      const banner = document.getElementById('install-banner');
      if (banner) banner.remove();
    });
  },

  showInstallBanner() {
    if (document.getElementById('install-banner')) return;

    const dashboard = document.getElementById('page-dashboard');
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.className = 'install-banner';
    banner.innerHTML = `
      <p>📱 安装健身追踪应用到主屏幕</p>
      <button class="install-btn" onclick="app.installApp()">安装</button>
    `;
    dashboard.insertBefore(banner, dashboard.firstChild);
  },

  async installApp() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.show('安装成功！', 'success');
    }
    this.deferredPrompt = null;
  },

  async registerSW() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registered');
      } catch (e) {
        console.warn('SW registration failed:', e);
      }
    }
  },

  // ===== Dashboard Data =====
  async loadDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const allWorkouts = await dbGetAll('workouts');

    // Weekly stats (Mon-Sun)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const weeklyWorkouts = allWorkouts.filter(w => w.date >= weekStartStr);
    const weeklyMinutes = weeklyWorkouts.reduce((s, w) => s + (w.duration || 0), 0);
    const weeklyDistance = weeklyWorkouts.reduce((s, w) => s + (w.distance || 0), 0);
    const activeGoals = await goals.updateActiveGoalCount();

    document.getElementById('stat-weekly-workouts').textContent = weeklyWorkouts.length;
    document.getElementById('stat-weekly-minutes').textContent = weeklyMinutes;
    document.getElementById('stat-weekly-distance').textContent = weeklyDistance.toFixed(1);
    document.getElementById('stat-active-goals').textContent = activeGoals;

    // Today's workouts
    const todayWorkouts = allWorkouts.filter(w => w.date === today)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const todayEl = document.getElementById('today-summary');
    if (todayWorkouts.length === 0) {
      todayEl.innerHTML = '<div class="empty-state-small">今天还没有锻炼记录</div>';
    } else {
      todayEl.innerHTML = todayWorkouts.map(w => `
        <div class="today-item" onclick="app.showWorkoutDetail(${w.id})">
          <span class="type-icon">${this.typeInfo[w.type]?.icon || '🏋️'}</span>
          <span class="item-name">${this.typeInfo[w.type]?.label || w.type}</span>
          <span class="item-detail">${w.duration}分钟${w.distance ? ' · ' + w.distance + 'km' : ''}</span>
        </div>
      `).join('');
    }

    // Recent workouts (last 5)
    const recentWorkouts = allWorkouts
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentEl = document.getElementById('recent-workouts');
    if (recentWorkouts.length === 0) {
      recentEl.innerHTML = '<div class="empty-state-small">暂无锻炼记录</div>';
    } else {
      recentEl.innerHTML = recentWorkouts.map(w => this.renderWorkoutItem(w)).join('');
    }
  },

  renderWorkoutItem(w) {
    const info = this.typeInfo[w.type] || { icon: '🏋️', label: w.type };
    let detail = `${w.duration} 分钟`;
    if (w.distance) detail += ` · ${w.distance} km`;
    if (w.calories) detail += ` · ${w.calories} kcal`;
    if (w.type === 'weightlifting' && w.weight && w.sets && w.reps) {
      detail += ` · ${w.weight}kg × ${w.sets}组 × ${w.reps}次`;
    }

    return `
      <div class="workout-item" onclick="app.showWorkoutDetail(${w.id})">
        <div class="type-icon">${info.icon}</div>
        <div class="workout-item-info">
          <div class="name">${info.label}</div>
          <div class="detail">${detail}</div>
          <div class="date">${new Date(w.date).toLocaleDateString('zh-CN')}</div>
        </div>
        <div class="workout-item-actions">
          <button class="action-btn" onclick="event.stopPropagation(); app.showWorkoutDetail(${w.id})" title="详情">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
          <button class="action-btn" onclick="event.stopPropagation(); app.deleteWorkout(${w.id})" title="删除">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>`;
  },

  async loadWorkoutHistory() {
    const allWorkouts = await dbGetAll('workouts');
    allWorkouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const historyEl = document.getElementById('workout-history');
    if (allWorkouts.length === 0) {
      historyEl.innerHTML = '<div class="empty-state-small">暂无锻炼记录</div>';
    } else {
      historyEl.innerHTML = allWorkouts.map(w => this.renderWorkoutItem(w)).join('');
    }
  },

  async showWorkoutDetail(id) {
    const workout = await dbGet('workouts', id);
    if (!workout) return;

    const info = this.typeInfo[workout.type] || { icon: '🏋️', label: workout.type };
    const modalContent = document.getElementById('modal-content');

    let detailsHTML = `
      <div class="workout-detail">
        <div style="text-align:center;margin-bottom:16px">
          <span style="font-size:3rem">${info.icon}</span>
          <h3 style="margin-top:8px">${info.label}</h3>
          <p class="text-muted">${new Date(workout.date).toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="workout-detail-row">
          <span class="label">时长</span>
          <span class="value">${workout.duration} 分钟</span>
        </div>`;

    if (workout.distance) {
      detailsHTML += `
        <div class="workout-detail-row">
          <span class="label">距离</span>
          <span class="value">${workout.distance} km</span>
        </div>`;
    }

    if (workout.calories) {
      detailsHTML += `
        <div class="workout-detail-row">
          <span class="label">卡路里</span>
          <span class="value">${workout.calories} 千卡</span>
        </div>`;
    }

    if (workout.type === 'weightlifting' && workout.weight && workout.sets && workout.reps) {
      detailsHTML += `
        <div class="workout-detail-row">
          <span class="label">重量 × 组数 × 次数</span>
          <span class="value">${workout.weight}kg × ${workout.sets} × ${workout.reps}</span>
        </div>`;
      const totalVol = workout.weight * workout.sets * workout.reps;
      detailsHTML += `
        <div class="workout-detail-row">
          <span class="label">总容量</span>
          <span class="value">${totalVol.toLocaleString()} kg</span>
        </div>`;
    }

    if (workout.notes) {
      detailsHTML += `
        <div class="workout-detail-row" style="flex-direction:column;gap:4px">
          <span class="label">备注</span>
          <span class="value" style="text-align:left">${workout.notes}</span>
        </div>`;
    }

    detailsHTML += `
      </div>
      <div class="workout-detail-actions">
        <button class="btn-primary" onclick="share.showShareModal(${JSON.stringify(workout).replace(/"/g, '&quot;')})">分享</button>
        <button class="btn-danger" onclick="app.deleteWorkout(${workout.id})">删除</button>
      </div>`;

    modalContent.innerHTML = detailsHTML;
    document.getElementById('modal-overlay').classList.add('active');
  },

  async deleteWorkout(id) {
    if (confirm('确定要删除这条锻炼记录吗？')) {
      await dbDelete('workouts', id);
      modal.close();
      toast.show('记录已删除', 'info');
      await this.loadDashboard();
      charts.refreshAll();
      goals.renderGoals();
    }
  },

  async loadProfileStats() {
    const allWorkouts = await dbGetAll('workouts');
    const totalWorkouts = allWorkouts.length;
    const totalMinutes = allWorkouts.reduce((s, w) => s + (w.duration || 0), 0);
    const totalDistance = allWorkouts.reduce((s, w) => s + (w.distance || 0), 0);

    document.getElementById('profile-total-workouts').textContent = totalWorkouts;
    document.getElementById('profile-total-minutes').textContent = totalMinutes;
    document.getElementById('profile-total-distance').textContent = totalDistance.toFixed(1);
  },

  setupSettings() {
    // Load name
    dbGet('settings', 'user_name').then(s => {
      if (s) {
        document.getElementById('settings-name').value = s.value;
        document.getElementById('profile-name').textContent = s.value;
      }
    });

    // Name input
    document.getElementById('settings-name').addEventListener('change', async (e) => {
      const name = e.target.value.trim() || '健身达人';
      await dbPut('settings', { key: 'user_name', value: name });
      document.getElementById('profile-name').textContent = name;
      toast.show('昵称已更新', 'success');
    });

    // Step goal input
    dbGet('settings', 'step_goal').then(s => {
      if (s) document.getElementById('settings-step-goal').value = s.value;
    });

    document.getElementById('settings-step-goal').addEventListener('change', async (e) => {
      const goal = parseInt(e.target.value) || 10000;
      await dbPut('settings', { key: 'step_goal', value: goal });
      pedometer.goal = goal;
      pedometer.updateDisplay();
      toast.show('步数目标已更新', 'success');
    });
  },

  async loadSettings() {},

  async exportData() {
    const data = {
      workouts: await dbGetAll('workouts'),
      weightLog: await dbGetAll('weightLog'),
      goals: await dbGetAll('goals'),
      settings: await dbGetAll('settings'),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show('数据已导出', 'success');
  },

  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!confirm('导入将覆盖所有现有数据，确定继续？')) return;

      // Clear existing data
      await dbClear('workouts');
      await dbClear('weightLog');
      await dbClear('goals');
      await dbClear('settings');

      // Import data
      if (data.workouts) {
        for (const w of data.workouts) {
          // Ensure no auto-increment conflict by deleting id
          const { id, ...rest } = w;
          await dbAdd('workouts', rest);
        }
      }
      if (data.weightLog) {
        for (const w of data.weightLog) {
          const { id, ...rest } = w;
          await dbAdd('weightLog', rest);
        }
      }
      if (data.goals) {
        for (const g of data.goals) {
          const { id, ...rest } = g;
          await dbAdd('goals', rest);
        }
      }
      if (data.settings) {
        for (const s of data.settings) {
          await dbPut('settings', s);
        }
      }

      toast.show('数据导入成功！', 'success');
      // Reload everything
      await this.loadDashboard();
      charts.refreshAll();
      goals.renderGoals();
      this.loadProfileStats();
    } catch (e) {
      toast.show('导入失败：文件格式错误', 'error');
    }

    event.target.value = '';
  },

  async clearAllData() {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：所有锻炼记录、体重记录和目标将被永久删除。')) return;

    await dbClear('workouts');
    await dbClear('weightLog');
    await dbClear('goals');
    await dbClear('settings');

    toast.show('所有数据已清除', 'info');
    await this.loadDashboard();
    charts.refreshAll();
    goals.renderGoals();
    this.loadProfileStats();
  }
};

// ===== Modal Helper =====
const modal = {
  close() {
    document.getElementById('modal-overlay').classList.remove('active');
  }
};

// ===== Toast Helper =====
const toast = {
  show(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    toastEl.textContent = message;
    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toastEl.remove(), 300);
    }, 2500);
  }
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
