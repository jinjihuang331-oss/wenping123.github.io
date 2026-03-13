// ===== Fitness Tracker Dashboard - App.js =====

(function () {
  'use strict';

  // ===== Data Store (localStorage) =====
  const Store = {
    get(key, fallback = []) {
      try {
        const data = localStorage.getItem('ft_' + key);
        return data ? JSON.parse(data) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      localStorage.setItem('ft_' + key, JSON.stringify(value));
    },
    remove(key) {
      localStorage.removeItem('ft_' + key);
    }
  };

  // ===== State =====
  let state = {
    workouts: Store.get('workouts'),
    goals: Store.get('goals'),
    bodyWeights: Store.get('bodyWeights'),
    currentTab: 'dashboard',
    currentChartType: 'bar',
    volumeChartType: 'bar',
    charts: {},
    currentPeriod: 'month',
    currentWorkoutId: null,
    pedometerSteps: Store.get('pedometerSteps', { date: today(), steps: 0 }),
    pedometerGoal: Store.get('settings', {}).stepGoal || 10000
  };

  // ===== Constants =====
  const EXERCISE_TYPES = {
    running: { name: 'Running', caloriesPerMin: 10, icon: 'running' },
    cycling: { name: 'Cycling', caloriesPerMin: 8, icon: 'cycling' },
    weightlifting: { name: 'Weightlifting', caloriesPerMin: 7, icon: 'weightlifting' },
    swimming: { name: 'Swimming', caloriesPerMin: 11, icon: 'swimming' },
    yoga: { name: 'Yoga', caloriesPerMin: 4, icon: 'yoga' },
    other: { name: 'Other', caloriesPerMin: 6, icon: 'other' }
  };

  const GOAL_TYPE_LABELS = {
    workout_count: 'Workouts',
    total_duration: 'Total Duration (min)',
    total_distance: 'Total Distance (km)',
    weight_loss: 'Weight Loss (kg)',
    weight_gain: 'Weight Gain (kg)',
    steps: 'Daily Steps'
  };

  const PERIOD_LABELS = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly'
  };

  const MOTIVATIONS = [
    'Consistency is key!', 'Great session today!', 'Every rep counts!',
    'Keep pushing, break limits!', 'Sweat never lies!', 'Discipline is freedom!',
    'The machine keeps running!', 'Get it done today!', 'You\'re stronger than yesterday!'
  ];

  // ===== Utility Functions =====
  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const todayStr = today();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    return `${month}/${day}`;
  }

  function formatDateFull(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getWeekDates() {
    const dates = [];
    const now = new Date();
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  function getLastNDays(n) {
    const dates = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  function getDayNames() {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  function calculateCalories(type, duration, weight) {
    const base = (EXERCISE_TYPES[type]?.caloriesPerMin || 6) * duration;
    if (weight && type === 'weightlifting') return base + weight * 0.5;
    return base;
  }

  // Bug #5: Replace deprecated substr() with substring()
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }

  function randomMotivation() {
    return MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
  }

  function getTimeOfDay() {
    const h = new Date().getHours();
    if (h < 6) return 'Late night';
    if (h < 12) return 'Good morning';
    if (h < 14) return 'Good afternoon';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  // ===== Chart Helpers =====
  // Bug #2: Theme-aware tooltip configuration
  function isDarkTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme !== 'light';
  }

  function getChartTooltipConfig() {
    if (isDarkTheme()) {
      return {
        backgroundColor: '#1a1a2e',
        titleColor: '#e8e8f0',
        bodyColor: '#9ca3af',
        borderColor: '#2d2d44',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10
      };
    }
    return {
      backgroundColor: '#ffffff',
      titleColor: '#1a1a2e',
      bodyColor: '#6b7280',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10
    };
  }

  function getChartTextColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#6b7280';
  }

  function getChartGridColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#2d2d44';
  }

  // ===== Toast Notifications =====
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '&#10003;', error: '&#10007;', info: '&#8505;' };
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ===== Tab Navigation =====
  function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const tab = document.getElementById('tab-' + tabName);
    if (tab) tab.classList.add('active');
    const navBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (navBtn) navBtn.classList.add('active');
    state.currentTab = tabName;

    // Refresh content on tab switch
    if (tabName === 'dashboard') refreshDashboard();
    if (tabName === 'goals') renderGoals();
    if (tabName === 'progress') refreshProgress();
  }
  window.switchTab = switchTab;

  function initNavigation() {
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  // ===== Dashboard =====
  function refreshDashboard() {
    updateGreeting();
    updateStats();
    renderRecentWorkouts();
    renderWeeklyChart();
    updatePedometer();
  }

  function updateGreeting() {
    const el = document.getElementById('greeting');
    const workoutCount = getWeekWorkouts().length;
    if (workoutCount > 0) {
      el.textContent = `${getTimeOfDay()}, ${randomMotivation()}`;
    } else {
      el.textContent = `${getTimeOfDay()}, start your workout today!`;
    }
  }

  function getWeekWorkouts() {
    const weekDates = getWeekDates();
    return state.workouts.filter(w => weekDates.includes(w.date));
  }

  function updateStats() {
    const weekWorkouts = getWeekWorkouts();
    // Workouts count
    document.getElementById('stat-workouts').innerHTML = weekWorkouts.length;

    // Total duration
    const totalDuration = weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    document.getElementById('stat-duration').innerHTML =
      `${totalDuration}<span class="stat-unit">min</span>`;

    // Total calories
    const totalCalories = weekWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    document.getElementById('stat-calories').innerHTML =
      `${totalCalories}<span class="stat-unit">kcal</span>`;

    // Streak
    const streak = calculateStreak();
    document.getElementById('stat-streak').innerHTML =
      `${streak}<span class="stat-unit">days</span>`;

    // Header step count
    document.getElementById('step-count').textContent =
      state.pedometerSteps.steps;
  }

  function calculateStreak() {
    const workoutDates = [...new Set(state.workouts.map(w => w.date))].sort().reverse();
    if (workoutDates.length === 0) return 0;
    let streak = 0;
    const checkDate = new Date();
    // If no workout today, start checking from yesterday
    if (workoutDates[0] !== today()) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (workoutDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function renderRecentWorkouts() {
    const container = document.getElementById('recent-workouts');
    const recent = state.workouts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <p>No workouts yet</p>
          <p class="empty-hint">Tap "Log Workout" to start your first session!</p>
        </div>`;
      return;
    }

    container.innerHTML = recent.map(w => renderWorkoutItem(w)).join('');
    bindWorkoutItemEvents(container);
  }

  function getExerciseIcon(type) {
    const icons = {
      running: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2"/><path d="M7 21l3-7 2 3 4-8"/><path d="M13 17l-2 4"/></svg>',
      cycling: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg>',
      weightlifting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 5v14M18 5v14M2 8h4M18 8h4M2 16h4M18 16h4M6 12h12"/></svg>',
      swimming: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/><path d="M2 16c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/><circle cx="12" cy="8" r="3"/><path d="M12 5v-3"/></svg>',
      yoga: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4" r="2"/><path d="M12 6v6M4 18l4-4M20 18l-4-4M12 12l-4-2M12 12l4-2"/></svg>',
      other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
    };
    return icons[type] || icons.other;
  }

  function renderWorkoutItem(w) {
    const meta = [];
    if (w.duration) meta.push(`${w.duration} min`);
    if (w.distance) meta.push(`${w.distance} km`);
    if (w.weight) meta.push(`${w.weight}kg`);
    if (w.sets && w.reps) meta.push(`${w.sets}x${w.reps}`);
    return `
      <div class="workout-item" data-id="${w.id}">
        <div class="workout-type-icon ${w.type}">
          ${getExerciseIcon(w.type)}
        </div>
        <div class="workout-info">
          <div class="workout-info-title">
            ${EXERCISE_TYPES[w.type]?.name || 'Other'}
            <span class="workout-calories">${w.calories || 0} kcal</span>
          </div>
          <div class="workout-info-meta">${formatDate(w.date)} &middot; ${meta.join(' &middot; ')}</div>
        </div>
      </div>`;
  }

  function bindWorkoutItemEvents(container) {
    container.querySelectorAll('.workout-item').forEach(el => {
      el.addEventListener('click', () => showWorkoutDetail(el.dataset.id));
    });
  }

  // ===== Charts =====
  // Bug #1: Destroy and recreate weekly chart instead of mutating config
  function renderWeeklyChart() {
    const ctx = document.getElementById('weekly-chart');
    if (!ctx) return;
    if (state.charts.weekly) state.charts.weekly.destroy();

    const weekDates = getWeekDates();
    const dayLabels = getDayNames();
    const durations = weekDates.map(date =>
      state.workouts
        .filter(w => w.date === date)
        .reduce((sum, w) => sum + (w.duration || 0), 0)
    );

    const chartType = state.currentChartType;

    const dataset = chartType === 'line'
      ? {
          label: 'Duration (min)',
          data: durations,
          backgroundColor: 'rgba(108,92,231,0.2)',
          borderColor: '#6c5ce7',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6c5ce7',
          pointBorderColor: '#6c5ce7',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      : {
          label: 'Duration (min)',
          data: durations,
          backgroundColor: durations.map(v =>
            v > 0 ? 'rgba(108,92,231,0.8)' : 'rgba(108,92,231,0.15)'),
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 36
        };

    state.charts.weekly = new Chart(ctx, {
      type: chartType,
      data: {
        labels: dayLabels,
        datasets: [dataset]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: getChartTooltipConfig()
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: getChartTextColor(), font: { size: 12 } }
          },
          y: {
            grid: { color: getChartGridColor() },
            ticks: { color: getChartTextColor(), font: { size: 11 } },
            beginAtZero: true
          }
        }
      }
    });
  }

  // ===== Progress Tab =====
  function refreshProgress() {
    renderWeightChart();
    renderVolumeChart();
    renderDistributionChart();
    renderAllWorkouts();
  }

  function renderWeightChart() {
    const ctx = document.getElementById('weight-chart');
    if (!ctx) return;
    if (state.charts.weight) state.charts.weight.destroy();

    const weights = state.bodyWeights.slice(-getPeriodDays()).reverse();
    if (weights.length < 2) {
      ctx.parentElement.innerHTML = '<div class="empty-state"><p>Need at least 2 weight entries to show trend</p></div>';
      return;
    }

    state.charts.weight = new Chart(ctx, {
      type: 'line',
      data: {
        labels: weights.map(w => formatDate(w.date)),
        datasets: [{
          label: 'Weight (kg)',
          data: weights.map(w => w.weight),
          borderColor: '#6c5ce7',
          backgroundColor: 'rgba(108,92,231,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6c5ce7',
          pointBorderColor: '#6c5ce7',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...getChartTooltipConfig(),
            callbacks: {
              label: ctx => `${ctx.parsed.y} kg`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: getChartTextColor(), font: { size: 11 }, maxTicksLimit: 8 }
          },
          y: {
            grid: { color: getChartGridColor() },
            ticks: { color: getChartTextColor(), font: { size: 11 }, callback: v => v + 'kg' }
          }
        }
      }
    });
  }

  // Bug #3: Volume chart area toggle - use state.volumeChartType
  function renderVolumeChart() {
    const ctx = document.getElementById('volume-chart');
    if (!ctx) return;
    if (state.charts.volume) state.charts.volume.destroy();

    const days = getLastNDays(getPeriodDays());
    const labels = days.map(d => formatDate(d));
    const durations = days.map(date =>
      state.workouts.filter(w => w.date === date).reduce((s, w) => s + (w.duration || 0), 0)
    );
    const distances = days.map(date =>
      state.workouts.filter(w => w.date === date).reduce((s, w) => s + (w.distance || 0), 0)
    );

    const isArea = state.volumeChartType === 'area';
    const chartType = isArea ? 'line' : 'bar';

    state.charts.volume = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Duration (min)',
            data: durations,
            backgroundColor: isArea ? 'rgba(108,92,231,0.2)' : 'rgba(108,92,231,0.7)',
            borderColor: '#6c5ce7',
            borderWidth: isArea ? 2 : 0,
            borderRadius: isArea ? 0 : 4,
            fill: isArea,
            tension: isArea ? 0.4 : 0,
            maxBarThickness: isArea ? undefined : 20,
            pointBackgroundColor: isArea ? '#6c5ce7' : undefined,
            pointRadius: isArea ? 3 : undefined,
            yAxisID: 'y'
          },
          {
            label: 'Distance (km)',
            data: distances,
            backgroundColor: isArea ? 'rgba(0,206,201,0.2)' : 'rgba(0,206,201,0.7)',
            borderColor: '#00cec9',
            borderWidth: isArea ? 2 : 0,
            borderRadius: isArea ? 0 : 4,
            fill: isArea,
            tension: isArea ? 0.4 : 0,
            maxBarThickness: isArea ? undefined : 20,
            pointBackgroundColor: isArea ? '#00cec9' : undefined,
            pointRadius: isArea ? 3 : undefined,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: getChartTextColor(), font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: getChartTooltipConfig()
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: getChartTextColor(), font: { size: 10 }, maxTicksLimit: 10, maxRotation: 45 }
          },
          y: {
            position: 'left',
            grid: { color: getChartGridColor() },
            ticks: { color: getChartTextColor(), font: { size: 11 } },
            beginAtZero: true,
            title: { display: true, text: 'min', color: getChartTextColor(), font: { size: 11 } }
          },
          y1: {
            position: 'right',
            grid: { display: false },
            ticks: { color: getChartTextColor(), font: { size: 11 } },
            beginAtZero: true,
            title: { display: true, text: 'km', color: getChartTextColor(), font: { size: 11 } }
          }
        }
      }
    });
  }

  function renderDistributionChart() {
    const ctx = document.getElementById('distribution-chart');
    if (!ctx) return;
    if (state.charts.distribution) state.charts.distribution.destroy();

    const typeCounts = {};
    state.workouts.forEach(w => {
      typeCounts[w.type] = (typeCounts[w.type] || 0) + 1;
    });

    const types = Object.keys(typeCounts);
    if (types.length === 0) {
      ctx.parentElement.innerHTML = '<div class="empty-state"><p>No workout data yet</p></div>';
      return;
    }

    const colors = {
      running: '#6c5ce7',
      cycling: '#00cec9',
      weightlifting: '#e74c3c',
      swimming: '#74b9ff',
      yoga: '#00b894',
      other: '#fdcb6e'
    };

    state.charts.distribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: types.map(t => EXERCISE_TYPES[t]?.name || 'Other'),
        datasets: [{
          data: types.map(t => typeCounts[t]),
          backgroundColor: types.map(t => colors[t] || '#888'),
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: getChartTextColor(), font: { size: 12 }, usePointStyle: true, pointStyle: 'circle', padding: 16 }
          },
          tooltip: getChartTooltipConfig()
        }
      }
    });
  }

  function getPeriodDays() {
    switch (state.currentPeriod) {
      case 'week': return 7;
      case 'month': return 30;
      case '3month': return 90;
      case 'year': return 365;
      default: return 30;
    }
  }

  function renderAllWorkouts() {
    const container = document.getElementById('all-workouts');
    const workouts = state.workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (workouts.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No workouts recorded yet</p></div>';
      return;
    }

    container.innerHTML = workouts.map(w => renderWorkoutItem(w)).join('');
    bindWorkoutItemEvents(container);
  }

  // ===== Workout Logging =====
  function initWorkoutForm() {
    const form = document.getElementById('workout-form');
    const dateInput = document.getElementById('workout-date');
    dateInput.value = today();

    // Exercise type selection
    document.querySelectorAll('.exercise-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.exercise-type-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('workout-type').value = btn.dataset.type;
        updateFormFields(btn.dataset.type);
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      saveWorkout();
    });
  }

  function updateFormFields(type) {
    const distanceGroup = document.getElementById('distance-group');
    const weightGroup = document.getElementById('weight-group');
    const setsGroup = document.getElementById('sets-group');
    const repsGroup = document.getElementById('reps-group');

    // Reset
    distanceGroup.style.display = '';
    weightGroup.style.display = 'none';
    setsGroup.style.display = 'none';
    repsGroup.style.display = 'none';

    if (type === 'weightlifting') {
      distanceGroup.style.display = 'none';
      weightGroup.style.display = '';
      setsGroup.style.display = '';
      repsGroup.style.display = '';
    } else if (type === 'yoga') {
      distanceGroup.style.display = 'none';
    }
  }

  function saveWorkout() {
    const type = document.getElementById('workout-type').value;
    if (!type) {
      showToast('Please select an exercise type', 'error');
      return;
    }
    const duration = parseInt(document.getElementById('workout-duration').value);
    const date = document.getElementById('workout-date').value;
    const distance = parseFloat(document.getElementById('workout-distance').value) || 0;
    const weight = parseFloat(document.getElementById('workout-weight').value) || 0;
    const sets = parseInt(document.getElementById('workout-sets').value) || 0;
    const reps = parseInt(document.getElementById('workout-reps').value) || 0;
    const notes = document.getElementById('workout-notes').value.trim();

    if (!duration || duration <= 0) {
      showToast('Please enter a valid duration', 'error');
      return;
    }

    const workout = {
      id: uid(),
      type, duration, date, distance, weight, sets, reps, notes,
      calories: calculateCalories(type, duration, weight),
      createdAt: new Date().toISOString()
    };

    state.workouts.push(workout);
    Store.set('workouts', state.workouts);
    updateGoalProgress();
    showToast('Workout saved!', 'success');

    // Reset form
    document.getElementById('workout-form').reset();
    document.getElementById('workout-date').value = today();
    document.querySelectorAll('.exercise-type-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('workout-type').value = '';
    updateFormFields('running');
    resetFormGroups();
  }

  function resetFormGroups() {
    document.getElementById('distance-group').style.display = '';
    document.getElementById('weight-group').style.display = 'none';
    document.getElementById('sets-group').style.display = 'none';
    document.getElementById('reps-group').style.display = 'none';
  }

  // ===== Body Weight =====
  function initWeightForm() {
    const form = document.getElementById('weight-form');
    document.getElementById('weight-date').value = today();

    form.addEventListener('submit', e => {
      e.preventDefault();
      const weight = parseFloat(document.getElementById('body-weight').value);
      const date = document.getElementById('weight-date').value;
      if (!weight || weight < 20) {
        showToast('Please enter a valid weight', 'error');
        return;
      }

      // Check if there's already an entry for this date
      const existingIndex = state.bodyWeights.findIndex(w => w.date === date);
      if (existingIndex >= 0) {
        state.bodyWeights[existingIndex].weight = weight;
      } else {
        state.bodyWeights.push({ date, weight });
      }

      state.bodyWeights.sort((a, b) => new Date(a.date) - new Date(b.date));
      Store.set('bodyWeights', state.bodyWeights);
      showToast(`Weight ${weight}kg recorded`, 'success');
      document.getElementById('body-weight').value = '';
      updateGoalProgress();
    });
  }

  // ===== Goals =====
  function initGoals() {
    document.getElementById('add-goal-btn').addEventListener('click', () => {
      document.getElementById('goal-modal').classList.remove('hidden');
    });

    document.getElementById('close-goal-modal').addEventListener('click', () => {
      document.getElementById('goal-modal').classList.add('hidden');
    });

    document.getElementById('cancel-goal').addEventListener('click', () => {
      document.getElementById('goal-modal').classList.add('hidden');
    });

    document.getElementById('goal-modal').querySelector('.modal-overlay').addEventListener('click', () => {
      document.getElementById('goal-modal').classList.add('hidden');
    });

    document.getElementById('goal-form').addEventListener('submit', e => {
      e.preventDefault();
      saveGoal();
    });
  }

  function saveGoal() {
    const type = document.getElementById('goal-type').value;
    const target = parseFloat(document.getElementById('goal-target').value);
    const period = document.getElementById('goal-period').value;

    if (!target || target <= 0) {
      showToast('Please enter a valid target value', 'error');
      return;
    }

    const milestoneInputs = document.querySelectorAll('.milestone-input');
    const milestones = [];
    milestoneInputs.forEach(input => {
      const val = parseFloat(input.value);
      if (val > 0) milestones.push(val);
    });

    // Auto-generate milestones if empty
    if (milestones.length === 0) {
      milestones.push(
        Math.round(target * 0.25),
        Math.round(target * 0.5),
        Math.round(target * 0.75)
      );
    }

    const goal = {
      id: uid(),
      type, target, period, milestones,
      current: 0,
      startDate: today(),
      createdAt: new Date().toISOString(),
      completed: false
    };

    // Calculate initial current progress
    goal.current = calculateGoalProgress(goal);

    state.goals.push(goal);
    Store.set('goals', state.goals);
    document.getElementById('goal-modal').classList.add('hidden');
    document.getElementById('goal-form').reset();
    showToast('Goal created!', 'success');
    renderGoals();
  }

  function calculateGoalProgress(goal) {
    const now = new Date();
    let startDate = new Date(goal.startDate);

    // Determine date range based on period
    let endDate = new Date(startDate);
    switch (goal.period) {
      case 'weekly': endDate.setDate(endDate.getDate() + 7); break;
      case 'monthly': endDate.setMonth(endDate.getMonth() + 1); break;
      case 'quarterly': endDate.setMonth(endDate.getMonth() + 3); break;
      case 'yearly': endDate.setFullYear(endDate.getFullYear() + 1); break;
    }

    // Get workouts within the period
    const periodWorkouts = state.workouts.filter(w => {
      const d = new Date(w.date);
      return d >= startDate && d <= now;
    });

    switch (goal.type) {
      case 'workout_count':
        return periodWorkouts.length;
      case 'total_duration':
        return periodWorkouts.reduce((s, w) => s + (w.duration || 0), 0);
      case 'total_distance':
        return periodWorkouts.reduce((s, w) => s + (w.distance || 0), 0);
      case 'steps':
        return state.pedometerSteps.steps;
      case 'weight_loss':
      case 'weight_gain': {
        const startWeight = state.bodyWeights.find(w => new Date(w.date) <= startDate);
        const currentWeight = state.bodyWeights.length > 0
          ? state.bodyWeights[state.bodyWeights.length - 1].weight
          : 0;
        if (!startWeight || !currentWeight) return 0;
        const diff = startWeight.weight - currentWeight; // positive = loss
        return goal.type === 'weight_loss' ? Math.max(0, diff) : Math.max(0, -diff);
      }
      default: return 0;
    }
  }

  function updateGoalProgress() {
    let changed = false;
    state.goals.forEach(goal => {
      const newCurrent = calculateGoalProgress(goal);
      if (newCurrent !== goal.current) {
        goal.current = newCurrent;
        goal.completed = goal.current >= goal.target;
        changed = true;
      }
    });
    if (changed) Store.set('goals', state.goals);
  }

  // Bug #4: Generate empty state HTML inline instead of referencing detached node
  function renderGoals() {
    const container = document.getElementById('goals-container');

    if (state.goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
          <p>No goals yet</p>
          <p class="empty-hint">Set a goal to track your fitness progress!</p>
        </div>`;
      return;
    }

    container.innerHTML = state.goals.map(goal => renderGoalCard(goal)).join('');

    // Bind delete button
    container.querySelectorAll('.goal-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this goal?')) {
          state.goals = state.goals.filter(g => g.id !== btn.dataset.id);
          Store.set('goals', state.goals);
          renderGoals();
          showToast('Goal deleted', 'info');
        }
      });
    });
  }

  function renderGoalCard(goal) {
    const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
    const completedClass = goal.completed ? 'goal-completed' : '';
    const unit = goal.type.includes('weight') ? 'kg' : goal.type === 'steps' ? 'steps' : '';
    const label = GOAL_TYPE_LABELS[goal.type] || goal.type;
    const periodLabel = PERIOD_LABELS[goal.period] || goal.period;

    return `
      <div class="goal-card ${completedClass}">
        <div class="goal-header">
          <div class="goal-title">${label}</div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="goal-type-badge">${periodLabel}</span>
            <button class="btn-close goal-delete-btn" data-id="${goal.id}" style="font-size:1rem; padding:2px 6px;">&times;</button>
          </div>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width: ${percent}%"></div>
        </div>
        <div class="goal-progress-text">
          <span>${goal.current}${unit} / ${goal.target}${unit}</span>
          <span>${percent}%</span>
        </div>
        <div class="goal-milestones">
          ${goal.milestones.map(m => {
            const reached = goal.current >= m;
            return `
              <div class="milestone ${reached ? 'reached' : ''}">
                <div class="milestone-dot"></div>
                <div class="milestone-label">${m}${unit}</div>
              </div>`;
          }).join('')}
          <div class="milestone ${goal.completed ? 'reached' : ''}">
            <div class="milestone-dot"></div>
            <div class="milestone-label">Goal</div>
          </div>
        </div>
      </div>`;
  }

  // ===== Quick Add =====
  function initQuickAdd() {
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.quickType;
        const duration = parseInt(btn.dataset.quickDuration) || 30;
        const workout = {
          id: uid(),
          type, duration,
          date: today(),
          distance: 0, weight: 0, sets: 0, reps: 0, notes: 'Quick add',
          calories: calculateCalories(type, duration, 0),
          createdAt: new Date().toISOString()
        };
        state.workouts.push(workout);
        Store.set('workouts', state.workouts);
        updateGoalProgress();
        showToast(`${EXERCISE_TYPES[type]?.name || 'Exercise'} ${duration}min logged!`, 'success');

        // Animation feedback
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => { btn.style.transform = ''; }, 200);

        // Switch back to dashboard
        setTimeout(() => switchTab('dashboard'), 300);
      });
    });
  }

  // ===== Workout Detail =====
  function showWorkoutDetail(id) {
    const workout = state.workouts.find(w => w.id === id);
    if (!workout) return;
    state.currentWorkoutId = id;

    const container = document.getElementById('workout-detail-content');
    const meta = [];
    if (workout.duration) meta.push(`<div class="detail-stat"><span class="detail-stat-value">${workout.duration}</span><span class="detail-stat-label">min</span></div>`);
    if (workout.distance) meta.push(`<div class="detail-stat"><span class="detail-stat-value">${workout.distance}</span><span class="detail-stat-label">km</span></div>`);
    if (workout.calories) meta.push(`<div class="detail-stat"><span class="detail-stat-value">${workout.calories}</span><span class="detail-stat-label">kcal</span></div>`);
    if (workout.weight) meta.push(`<div class="detail-stat"><span class="detail-stat-value">${workout.weight}</span><span class="detail-stat-label">kg</span></div>`);

    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
        <div class="workout-type-icon ${workout.type}">
          ${getExerciseIcon(workout.type)}
        </div>
        <div>
          <div style="font-weight:600; font-size:1.1rem;">${EXERCISE_TYPES[workout.type]?.name || 'Other'}</div>
          <div style="color:var(--text-secondary); font-size:0.85rem;">${formatDateFull(workout.date)}</div>
        </div>
      </div>
      ${workout.sets && workout.reps ? `<div style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:12px;">${workout.sets} sets x ${workout.reps} reps</div>` : ''}
      <div class="detail-stats">${meta.join('')}</div>
      ${workout.notes ? `<div class="detail-notes"><div class="detail-notes-title">Notes</div>${workout.notes}</div>` : ''}`;

    document.getElementById('workout-detail-modal').classList.remove('hidden');
  }

  function initWorkoutDetail() {
    const modal = document.getElementById('workout-detail-modal');
    document.getElementById('close-detail-modal').addEventListener('click', () => modal.classList.add('hidden'));
    modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.add('hidden'));

    document.getElementById('delete-workout-btn').addEventListener('click', () => {
      if (state.currentWorkoutId) {
        state.workouts = state.workouts.filter(w => w.id !== state.currentWorkoutId);
        Store.set('workouts', state.workouts);
        modal.classList.add('hidden');
        showToast('Workout deleted', 'info');
        refreshCurrentTab();
      }
    });

    document.getElementById('share-workout-btn').addEventListener('click', () => {
      document.getElementById('workout-detail-modal').classList.add('hidden');
      openShareModal(state.currentWorkoutId);
    });
  }

  function refreshCurrentTab() {
    switchTab(state.currentTab);
  }

  // ===== Share =====
  function openShareModal(workoutId) {
    const workout = workoutId
      ? state.workouts.find(w => w.id === workoutId)
      : state.workouts[state.workouts.length - 1];

    if (!workout) {
      showToast('No workout to share', 'error');
      return;
    }

    generateShareCard(workout);
    document.getElementById('share-modal').classList.remove('hidden');
  }

  function generateShareCard(workout) {
    const preview = document.getElementById('share-preview');
    const weekWorkouts = getWeekWorkouts();
    const totalCalories = weekWorkouts.reduce((s, w) => s + (w.calories || 0), 0);
    const totalDuration = weekWorkouts.reduce((s, w) => s + (w.duration || 0), 0);

    preview.innerHTML = `
      <div class="share-card" id="share-card-content">
        <div class="share-card-header">
          <span class="share-card-app">Fitness Track</span>
          <span class="share-card-date">${formatDateFull(workout.date)}</span>
        </div>
        <h2 style="font-size:1.3rem; margin-bottom:4px;">${EXERCISE_TYPES[workout.type]?.name || 'Exercise'}</h2>
        <p style="opacity:0.8; margin-bottom:20px; font-size:0.85rem;">
          ${workout.duration} min${workout.distance ? ' &middot; ' + workout.distance + ' km' : ''}${workout.weight ? ' &middot; ' + workout.weight + ' kg' : ''}
        </p>
        <div class="share-card-stats">
          <div class="share-stat">
            <span class="share-stat-value">${workout.calories}</span>
            <span class="share-stat-label">kcal Burned</span>
          </div>
          <div class="share-stat">
            <span class="share-stat-value">${totalDuration}</span>
            <span class="share-stat-label">Min This Week</span>
          </div>
          <div class="share-stat">
            <span class="share-stat-value">${calculateStreak()}</span>
            <span class="share-stat-label">Day Streak</span>
          </div>
        </div>
        <div class="share-card-footer">
          <div class="share-motivation">${randomMotivation()}</div>
          <div>Keep pushing, become your best self</div>
        </div>
      </div>`;
  }

  function initShare() {
    const modal = document.getElementById('share-modal');
    document.getElementById('close-share-modal').addEventListener('click', () => modal.classList.add('hidden'));
    modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.add('hidden'));

    document.getElementById('download-share-btn').addEventListener('click', downloadShareCard);
    document.getElementById('native-share-btn').addEventListener('click', nativeShare);
  }

  function downloadShareCard() {
    const card = document.getElementById('share-card-content');
    if (!card) return;

    if (typeof html2canvas !== 'undefined') {
      html2canvas(card, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `workout-${today()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Image downloaded', 'success');
      }).catch(() => {
        showToast('Failed to generate image, try a screenshot instead', 'error');
      });
    } else {
      // Fallback: generate with canvas directly
      generateShareCardCanvas();
    }
  }

  function generateShareCardCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#6c5ce7');
    grad.addColorStop(1, '#00cec9');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, 800, 500, 20);
    ctx.fill();

    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Fitness Track', 40, 60);

    ctx.font = '24px sans-serif';
    ctx.fillText(`${today()}`, 600, 60);

    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('Workout Complete!', 40, 160);

    ctx.font = '28px sans-serif';
    ctx.fillText(`${randomMotivation()}`, 40, 220);

    ctx.font = '20px sans-serif';
    ctx.fillText('Keep pushing, become your best self', 40, 450);

    const link = document.createElement('a');
    link.download = `workout-${today()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Image downloaded', 'success');
  }

  function nativeShare() {
    const card = document.getElementById('share-card-content');
    if (!card) return;

    if (navigator.share && typeof html2canvas !== 'undefined') {
      html2canvas(card, {
        backgroundColor: null, scale: 2, useCORS: true, logging: false
      }).then(canvas => {
        canvas.toBlob(blob => {
          const file = new File([blob], 'workout.png', { type: 'image/png' });
          navigator.share({
            title: 'My Workout',
            text: `${randomMotivation()} Let\'s train together!`,
            files: [file]
          }).catch(() => {});
        }, 'image/png');
      }).catch(() => {
        fallbackWebShare();
      });
    } else if (navigator.share) {
      fallbackWebShare();
    } else {
      showToast('Your browser does not support this feature', 'error');
    }
  }

  function fallbackWebShare() {
    if (navigator.share) {
      navigator.share({
        title: 'My Workout',
        text: `${randomMotivation()} I just finished my workout, join me!`
      }).catch(() => {});
    }
  }

  // ===== Pedometer API =====
  function initPedometer() {
    const badge = document.getElementById('pedometer-status');
    const section = document.getElementById('pedometer-section');

    // Check if Pedometer API is available
    if ('Pedometer' in window) {
      badge.textContent = 'Connected';
      badge.className = 'badge badge-success';

      try {
        const pedometer = new Pedometer();
        pedometer.start().then(result => {
          updatePedometerDisplay(result.steps);
        }).catch(err => {
          console.log('Pedometer not available:', err.message);
          fallbackPedometer();
        });

        pedometer.addEventListener('step', e => {
          updatePedometerDisplay(e.detail.steps);
        });
      } catch (err) {
        fallbackPedometer();
      }
    } else if ('GenericSensorEvent' in window || 'Sensor' in window) {
      // Try experimental sensor
      fallbackPedometer();
    } else {
      fallbackPedometer();
    }

    // Add SVG gradient for pedometer ring
    const svg = document.querySelector('.pedometer-svg');
    if (svg) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <linearGradient id="pedometer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6c5ce7"/>
          <stop offset="100%" style="stop-color:#00cec9"/>
        </linearGradient>`;
      svg.insertBefore(defs, svg.firstChild);
    }
  }

  function fallbackPedometer() {
    const badge = document.getElementById('pedometer-status');
    badge.textContent = 'Manual';
    badge.className = 'badge badge-warning';

    // Use stored steps with simple estimates
    const stored = state.pedometerSteps;
    if (stored.date === today()) {
      updatePedometerDisplay(stored.steps);
    } else {
      state.pedometerSteps = { date: today(), steps: 0 };
      Store.set('pedometerSteps', state.pedometerSteps);
      updatePedometerDisplay(0);
    }

    // Estimate steps from walking/running workouts
    const todayWorkouts = state.workouts.filter(w => w.date === today());
    let estimatedSteps = 0;
    todayWorkouts.forEach(w => {
      if (w.type === 'running') estimatedSteps += w.duration * 160;
      else if (w.type === 'walking' || w.type === 'other') estimatedSteps += w.duration * 100;
      else estimatedSteps += w.duration * 50;
    });
    if (estimatedSteps > state.pedometerSteps.steps) {
      state.pedometerSteps.steps = estimatedSteps;
      Store.set('pedometerSteps', state.pedometerSteps);
      updatePedometerDisplay(estimatedSteps);
    }
  }

  function updatePedometerDisplay(steps) {
    state.pedometerSteps.steps = steps;
    const goal = state.pedometerGoal;
    const percent = Math.min(1, steps / goal);

    document.getElementById('pedometer-steps').textContent = steps.toLocaleString();
    document.getElementById('pedometer-goal-display').textContent = goal.toLocaleString();
    document.getElementById('step-count').textContent = steps.toLocaleString();

    // Update ring
    const ring = document.getElementById('pedometer-progress-ring');
    if (ring) {
      const circumference = 339.292;
      ring.style.strokeDashoffset = circumference * (1 - percent);
    }

    // Estimate distance and calories
    const distanceKm = (steps * 0.0007).toFixed(1);
    const calories = Math.round(steps * 0.04);
    document.getElementById('pedometer-distance').textContent = distanceKm;
    document.getElementById('pedometer-calories').textContent = calories;
  }

  function updatePedometer() {
    updatePedometerDisplay(state.pedometerSteps.steps);
  }

  // ===== Theme Toggle =====
  function initTheme() {
    const saved = localStorage.getItem('ft_theme');
    if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    document.getElementById('theme-toggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('ft_theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('ft_theme', 'light');
      }
      // Re-render charts with new colors
      if (state.currentTab === 'progress') refreshProgress();
      if (state.currentTab === 'dashboard') renderWeeklyChart();
    });
  }

  // ===== Period Selector =====
  function initPeriodSelector() {
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentPeriod = btn.dataset.period;
        refreshProgress();
      });
    });
  }

  // ===== Chart Toggles =====
  // Bug #1: Destroy and recreate weekly chart on type toggle
  function initChartToggles() {
    // Weekly chart type toggle
    document.querySelectorAll('[data-chart-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-chart-type]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentChartType = btn.dataset.chartType;
        renderWeeklyChart();
      });
    });

    // Bug #3: Volume chart toggle - store state and re-render
    document.querySelectorAll('[data-vol-chart]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-vol-chart]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.volumeChartType = btn.dataset.volChart;
        renderVolumeChart();
      });
    });
  }

  // ===== Clear History =====
  function initClearHistory() {
    document.getElementById('clear-history-btn')?.addEventListener('click', () => {
      if (confirm('Clear all workout records? This cannot be undone.')) {
        state.workouts = [];
        Store.set('workouts', []);
        showToast('All records cleared', 'info');
        refreshProgress();
        refreshDashboard();
      }
    });
  }

  // ===== PWA Install =====
  function initInstall() {
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      document.getElementById('install-banner').classList.remove('hidden');
    });

    document.getElementById('install-btn')?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        showToast('App installed!', 'success');
      }
      deferredPrompt = null;
      document.getElementById('install-banner').classList.add('hidden');
    });

    document.getElementById('install-dismiss')?.addEventListener('click', () => {
      document.getElementById('install-banner').classList.add('hidden');
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(reg => {
          console.log('Service Worker registered:', reg.scope);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                showToast('App updated to latest version', 'info');
              }
            });
          });
        })
        .catch(err => console.log('SW registration failed:', err));
    }
  }

  // ===== Seed Demo Data =====
  function seedDemoData() {
    if (state.workouts.length > 0) return; // Don't seed if data exists

    const types = ['running', 'cycling', 'weightlifting', 'swimming', 'yoga'];
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
      // 70% chance of having a workout
      if (Math.random() > 0.3) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const type = types[Math.floor(Math.random() * types.length)];
        const info = EXERCISE_TYPES[type];

        let distance = 0, weight = 0, sets = 0, reps = 0;
        const duration = 20 + Math.floor(Math.random() * 60);

        if (type === 'running') distance = parseFloat((2 + Math.random() * 10).toFixed(1));
        else if (type === 'cycling') distance = parseFloat((5 + Math.random() * 30).toFixed(1));
        else if (type === 'weightlifting') {
          weight = 20 + Math.floor(Math.random() * 80);
          sets = 2 + Math.floor(Math.random() * 5);
          reps = 6 + Math.floor(Math.random() * 10);
        } else if (type === 'swimming') distance = parseFloat((0.5 + Math.random() * 3).toFixed(1));

        state.workouts.push({
          id: uid() + i,
          type, duration, date: dateStr, distance, weight, sets, reps,
          notes: '',
          calories: calculateCalories(type, duration, weight),
          createdAt: new Date(d).toISOString()
        });

        // Sometimes add a second workout in the day
        if (Math.random() > 0.7) {
          const type2 = types[Math.floor(Math.random() * types.length)];
          const duration2 = 15 + Math.floor(Math.random() * 30);
          state.workouts.push({
            id: uid() + i + 'b',
            type: type2, duration: duration2, date: dateStr,
            distance: type2 === 'running' ? parseFloat((1 + Math.random() * 5).toFixed(1)) : 0,
            weight: 0, sets: 0, reps: 0, notes: '',
            calories: calculateCalories(type2, duration2, 0),
            createdAt: new Date(d).toISOString()
          });
        }
      }
    }

    // Seed body weight data
    let weight = 72;
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      weight += (Math.random() - 0.55) * 0.5;
      state.bodyWeights.push({
        date: d.toISOString().split('T')[0],
        weight: parseFloat(weight.toFixed(1))
      });
    }

    Store.set('workouts', state.workouts);
    Store.set('bodyWeights', state.bodyWeights);
  }

  // ===== Initialize App =====
  function init() {
    seedDemoData();
    initTheme();
    initNavigation();
    initWorkoutForm();
    initWeightForm();
    initGoals();
    initQuickAdd();
    initWorkoutDetail();
    initShare();
    initPedometer();
    initPeriodSelector();
    initChartToggles();
    initClearHistory();
    initInstall();

    // Initial render
    refreshDashboard();

    console.log('Fitness Tracker Dashboard started');
  }

  // Start the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
