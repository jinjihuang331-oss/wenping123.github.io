/* ====================================================
   健身追踪仪 - 核心应用逻辑
   ==================================================== */

(function () {
    'use strict';

    // ===== 常量 =====
    const DB_NAME = 'FitnessTrackerDB';
    const DB_VERSION = 1;
    const STORE_WORKOUTS = 'workouts';
    const STORE_WEIGHTS = 'weights';
    const STORE_GOALS = 'goals';
    const STORE_STEPS = 'steps';

    const WORKOUT_TYPES = {
        running: { label: '跑步', icon: '🏃', hasDistance: true, hasWeight: false },
        cycling: { label: '骑行', icon: '🚴', hasDistance: true, hasWeight: false },
        weightlifting: { label: '举重', icon: '🏋️', hasDistance: false, hasWeight: true },
        swimming: { label: '游泳', icon: '🏊', hasDistance: true, hasWeight: false },
        yoga: { label: '瑜伽', icon: '🧘', hasDistance: false, hasWeight: false },
        hiking: { label: '徒步', icon: '🥾', hasDistance: true, hasWeight: false },
        other: { label: '其他', icon: '💪', hasDistance: false, hasWeight: false }
    };

    // ===== IndexedDB =====
    let db = null;

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(STORE_WORKOUTS)) {
                    const ws = d.createObjectStore(STORE_WORKOUTS, { keyPath: 'id', autoIncrement: true });
                    ws.createIndex('type', 'type', { unique: false });
                    ws.createIndex('date', 'date', { unique: false });
                }
                if (!d.objectStoreNames.contains(STORE_WEIGHTS)) {
                    const wws = d.createObjectStore(STORE_WEIGHTS, { keyPath: 'id', autoIncrement: true });
                    wws.createIndex('date', 'date', { unique: false });
                }
                if (!d.objectStoreNames.contains(STORE_GOALS)) {
                    d.createObjectStore(STORE_GOALS, { keyPath: 'id', autoIncrement: true });
                }
                if (!d.objectStoreNames.contains(STORE_STEPS)) {
                    const ss = d.createObjectStore(STORE_STEPS, { keyPath: 'date', unique: true });
                }
            };
            request.onsuccess = (e) => { db = e.target.result; resolve(db); };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function dbOp(store, mode, op) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, mode);
            const s = tx.objectStore(store);
            const result = op(s);
            if (result && result.onsuccess !== undefined) {
                result.onsuccess = () => resolve(result.result);
                result.onerror = () => reject(result.error);
            } else {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            }
        });
    }

    function dbGetAll(store) {
        return dbOp(store, 'readonly', s => s.getAll());
    }

    function dbAdd(store, data) {
        return dbOp(store, 'readwrite', s => s.add(data));
    }

    function dbPut(store, data) {
        return dbOp(store, 'readwrite', s => s.put(data));
    }

    function dbDelete(store, id) {
        return dbOp(store, 'readwrite', s => s.delete(id));
    }

    // ===== DOM Helpers =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ===== Navigation =====
    function initNavigation() {
        const sidebar = $('#sidebar');
        const overlay = $('#sidebarOverlay');

        $('#menuBtn').addEventListener('click', () => sidebar.classList.add('open'));
        $('#closeSidebar').addEventListener('click', () => sidebar.classList.remove('open'));
        overlay.addEventListener('click', () => sidebar.classList.remove('open'));

        $$('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                navigateTo(page);
                sidebar.classList.remove('open');
            });
        });
    }

    function navigateTo(page) {
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        $$(`.nav-item[data-page="${page}"]`).forEach(n => n.classList.add('active'));
        $$('.page').forEach(p => p.classList.remove('active'));
        $(`#page-${page}`).classList.add('active');

        if (page === 'dashboard') refreshDashboard();
        if (page === 'workouts') refreshWorkoutList();
        if (page === 'goals') refreshGoals();
        if (page === 'charts') refreshCharts();
    }

    // ===== Toast =====
    function showToast(message, type = '') {
        const container = $('#toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ===== Date Helpers =====
    function today() {
        return new Date().toISOString().split('T')[0];
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}月${d.getDate()}日`;
    }

    function daysBetween(d1, d2) {
        return Math.ceil((new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24));
    }

    // ===== Workouts =====
    let allWorkouts = [];

    async function loadWorkouts() {
        allWorkouts = await dbGetAll(STORE_WORKOUTS);
        allWorkouts.sort((a, b) => b.date.localeCompare(a.date));
    }

    async function saveWorkout(e) {
        e.preventDefault();
        const id = $('#workoutId').value;
        const type = $('#workoutType').value;
        const data = {
            type,
            date: $('#workoutDate').value,
            duration: parseInt($('#workoutDuration').value) || 0,
            calories: parseInt($('#workoutCalories').value) || 0,
            distance: parseFloat($('#workoutDistance').value) || 0,
            weight: parseFloat($('#workoutWeight').value) || 0,
            sets: parseInt($('#workoutSets').value) || 0,
            reps: parseInt($('#workoutReps').value) || 0,
            notes: $('#workoutNotes').value,
        };

        if (id) {
            data.id = parseInt(id);
            await dbPut(STORE_WORKOUTS, data);
            showToast('锻炼已更新', 'success');
        } else {
            await dbAdd(STORE_WORKOUTS, data);
            showToast('锻炼已保存', 'success');
        }

        $('#workoutForm').reset();
        $('#workoutId').value = '';
        $('#workoutDate').value = today();
        toggleWorkoutFields();
        await loadWorkouts();
        refreshDashboard();
        refreshWorkoutList();
        refreshCharts();
        refreshGoals();
    }

    function toggleWorkoutFields() {
        const type = $('#workoutType').value;
        const info = WORKOUT_TYPES[type];
        const distRow = $('#distanceRow');
        const weightRow = $('#weightRow');

        if (info) {
            distRow.style.display = info.hasDistance ? 'flex' : 'none';
            weightRow.style.display = info.hasWeight ? 'flex' : 'none';
        } else {
            distRow.style.display = 'none';
            weightRow.style.display = 'none';
        }
    }

    function renderWorkoutItem(w, showActions = true) {
        const info = WORKOUT_TYPES[w.type] || WORKOUT_TYPES.other;
        let details = `${w.duration}分钟`;
        if (w.distance) details += ` · ${w.distance}km`;
        if (w.weight) details += ` · ${w.weight}kg`;
        if (w.calories) details += ` · ${w.calories}kcal`;

        return `
            <div class="workout-item" data-id="${w.id}">
                <div class="workout-icon">${info.icon}</div>
                <div class="workout-info">
                    <div class="workout-type-text">${info.label}</div>
                    <div class="workout-detail">${details}</div>
                </div>
                <span class="workout-date">${formatDate(w.date)}</span>
                ${showActions ? `
                <div class="workout-actions">
                    <button class="btn-icon share-workout" title="分享" data-id="${w.id}">📤</button>
                    <button class="btn-icon edit-workout" title="编辑" data-id="${w.id}">✏️</button>
                    <button class="btn-icon delete-workout" title="删除" data-id="${w.id}">🗑️</button>
                </div>` : ''}
            </div>`;
    }

    function refreshWorkoutList() {
        const filter = $('#workoutFilter').value;
        const filtered = filter === 'all'
            ? allWorkouts
            : allWorkouts.filter(w => w.type === filter);

        const container = $('#allWorkouts');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无锻炼记录</div>';
        } else {
            container.innerHTML = filtered.map(w => renderWorkoutItem(w, true)).join('');
        }
        bindWorkoutActions(container);
    }

    function refreshRecentWorkouts() {
        const recent = allWorkouts.slice(0, 5);
        const container = $('#recentWorkouts');
        if (recent.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无锻炼记录，点击"+ 添加"开始</div>';
        } else {
            container.innerHTML = recent.map(w => renderWorkoutItem(w, true)).join('');
        }
        bindWorkoutActions(container);
    }

    function bindWorkoutActions(container) {
        container.querySelectorAll('.edit-workout').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editWorkout(parseInt(btn.dataset.id));
            });
        });
        container.querySelectorAll('.delete-workout').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('确定要删除这条锻炼记录吗？')) {
                    await dbDelete(STORE_WORKOUTS, parseInt(btn.dataset.id));
                    await loadWorkouts();
                    refreshDashboard();
                    refreshWorkoutList();
                    refreshCharts();
                    refreshGoals();
                    showToast('已删除', 'success');
                }
            });
        });
        container.querySelectorAll('.share-workout').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openShareModal(parseInt(btn.dataset.id));
            });
        });
    }

    function editWorkout(id) {
        const w = allWorkouts.find(x => x.id === id);
        if (!w) return;
        $('#workoutId').value = w.id;
        $('#workoutType').value = w.type;
        $('#workoutDate').value = w.date;
        $('#workoutDuration').value = w.duration;
        $('#workoutCalories').value = w.calories || '';
        $('#workoutDistance').value = w.distance || '';
        $('#workoutWeight').value = w.weight || '';
        $('#workoutSets').value = w.sets || '';
        $('#workoutReps').value = w.reps || '';
        $('#workoutNotes').value = w.notes || '';
        toggleWorkoutFields();
        navigateTo('workouts');
        $('#workoutFormCard').scrollIntoView({ behavior: 'smooth' });
    }

    // ===== Weight Tracking =====
    let allWeights = [];

    async function loadWeights() {
        allWeights = await dbGetAll(STORE_WEIGHTS);
        allWeights.sort((a, b) => a.date.localeCompare(b.date));
    }

    async function logWeight() {
        const val = parseFloat($('#weightInput').value);
        if (!val || val < 20 || val > 300) {
            showToast('请输入有效的体重值 (20-300kg)', 'error');
            return;
        }
        await dbAdd(STORE_WEIGHTS, { date: today(), weight: val });
        $('#weightInput').value = '';
        showToast('体重已记录', 'success');
        await loadWeights();
        renderDashWeightChart();
        refreshCharts();
    }

    // ===== Goals =====
    let allGoals = [];

    async function loadGoals() {
        allGoals = await dbGetAll(STORE_GOALS);
    }

    async function saveGoal(e) {
        e.preventDefault();

        const milestones = [];
        $$('#milestoneList .milestone-item').forEach(item => {
            const val = parseFloat(item.querySelector('.milestone-value').value);
            const reward = item.querySelector('.milestone-reward').value;
            if (val) milestones.push({ value: val, reward: reward || '', reached: false });
        });
        milestones.sort((a, b) => a.value - b.value);

        const goal = {
            name: $('#goalName').value,
            type: $('#goalType').value,
            target: parseFloat($('#goalTarget').value),
            deadline: $('#goalDeadline').value,
            milestones,
            completed: false,
            createdAt: today(),
        };

        await dbAdd(STORE_GOALS, goal);
        $('#goalForm').reset();
        showToast('目标已创建', 'success');
        await loadGoals();
        refreshGoals();
        refreshDashboard();
    }

    function getGoalProgress(goal) {
        if (goal.completed) return 100;

        let current = 0;
        const fromCreation = allWorkouts.filter(w => w.date >= goal.createdAt);

        switch (goal.type) {
            case 'total_distance':
                current = fromCreation.reduce((s, w) => s + (w.distance || 0), 0);
                break;
            case 'total_duration':
                current = fromCreation.reduce((s, w) => s + (w.duration || 0), 0);
                break;
            case 'total_workouts':
                current = fromCreation.length;
                break;
            case 'total_calories':
                current = fromCreation.reduce((s, w) => s + (w.calories || 0), 0);
                break;
            case 'weight_target':
                const latestWeight = allWeights.length > 0 ? allWeights[allWeights.length - 1].weight : 0;
                if (latestWeight && latestWeight > goal.target) {
                    const startWeight = allWeights.length > 0 ? allWeights[0].weight : latestWeight;
                    const totalToLose = startWeight - goal.target;
                    const lost = startWeight - latestWeight;
                    current = totalToLose > 0 ? (lost / totalToLose) * goal.target : 0;
                }
                return Math.min(Math.max((current / goal.target) * 100, 0), 100);
        }

        return Math.min((current / goal.target) * 100, 100);
    }

    function renderGoalCard(goal) {
        const pct = getGoalProgress(goal);
        const remaining = daysBetween(today(), goal.deadline);
        const typeLabels = {
            total_distance: '总距离 (km)',
            total_duration: '总时长 (分钟)',
            total_workouts: '锻炼次数',
            total_calories: '总热量 (kcal)',
            weight_target: '目标体重 (kg)'
        };

        let current = 0;
        const fromCreation = allWorkouts.filter(w => w.date >= goal.createdAt);
        switch (goal.type) {
            case 'total_distance': current = fromCreation.reduce((s, w) => s + (w.distance || 0), 0); break;
            case 'total_duration': current = fromCreation.reduce((s, w) => s + (w.duration || 0), 0); break;
            case 'total_workouts': current = fromCreation.length; break;
            case 'total_calories': current = fromCreation.reduce((s, w) => s + (w.calories || 0), 0); break;
            case 'weight_target':
                current = allWeights.length > 0 ? allWeights[allWeights.length - 1].weight : 0;
                break;
        }

        const milestonesHTML = goal.milestones.length > 0 ? `
            <div class="milestone-track">
                ${goal.milestones.map((m, i) => {
                    const reached = pct >= ((m.value / goal.target) * 100);
                    return `<div class="milestone-marker ${reached ? 'reached' : ''}">
                        <span class="milestone-dot"></span>
                        <span class="milestone-label">${m.value}</span>
                        ${m.reward ? `<span class="milestone-reward">${m.reached ? '✅ ' : ''}${m.reward}</span>` : ''}
                    </div>`;
                }).join('')}
            </div>` : '';

        return `
            <div class="goal-card ${goal.completed ? 'completed' : ''}" data-id="${goal.id}">
                <div class="goal-header">
                    <span class="goal-name">${goal.name}</span>
                    <span class="goal-deadline">${remaining > 0 ? `剩余${remaining}天` : '已到期'}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width:${Math.min(pct, 100)}%"></div>
                </div>
                <div class="goal-stats">
                    <span>${current.toFixed(1)} / ${goal.target} ${typeLabels[goal.type] || ''}</span>
                    <span>${pct.toFixed(1)}%</span>
                </div>
                ${milestonesHTML}
                ${!goal.completed ? `
                <div style="display:flex;gap:8px;margin-top:10px">
                    <button class="btn btn-sm btn-secondary complete-goal-btn" data-id="${goal.id}">✅ 完成</button>
                </div>` : ''}
                <button class="btn-icon delete-goal-btn" data-id="${goal.id}" style="position:absolute;top:12px;right:12px;font-size:0.85rem">🗑️</button>
            </div>`;
    }

    function refreshGoals() {
        const activeContainer = $('#activeGoalsList');
        const completedContainer = $('#completedGoalsList');

        const active = allGoals.filter(g => !g.completed);
        const completed = allGoals.filter(g => g.completed);

        activeContainer.innerHTML = active.length > 0
            ? active.map(g => renderGoalCard(g)).join('')
            : '<div class="empty-state">暂无进行中的目标</div>';

        completedContainer.innerHTML = completed.length > 0
            ? completed.map(g => renderGoalCard(g)).join('')
            : '<div class="empty-state">暂无已完成目标</div>';

        // Bind goal actions
        $$('.complete-goal-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const goal = allGoals.find(g => g.id === parseInt(btn.dataset.id));
                if (goal) {
                    goal.completed = true;
                    goal.completedAt = today();
                    await dbPut(STORE_GOALS, goal);
                    await loadGoals();
                    refreshGoals();
                    refreshDashboard();
                    showToast('恭喜完成目标！', 'success');
                }
            });
        });

        $$('.delete-goal-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('确定删除此目标？')) {
                    await dbDelete(STORE_GOALS, parseInt(btn.dataset.id));
                    await loadGoals();
                    refreshGoals();
                    refreshDashboard();
                    showToast('已删除', 'success');
                }
            });
        });
    }

    function refreshDashGoals() {
        const card = $('#dashGoalsCard');
        const list = $('#dashGoalsList');
        const active = allGoals.filter(g => !g.completed).slice(0, 3);
        if (active.length === 0) {
            card.style.display = 'none';
            return;
        }
        card.style.display = 'block';
        list.innerHTML = active.map(g => {
            const pct = getGoalProgress(g);
            return `<div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px">
                    <span>${g.name}</span>
                    <span>${pct.toFixed(0)}%</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width:${Math.min(pct, 100)}%"></div>
                </div>
            </div>`;
        }).join('');
    }

    // ===== Charts =====
    let charts = {};

    function destroyChart(name) {
        if (charts[name]) {
            charts[name].destroy();
            charts[name] = null;
        }
    }

    function renderDashWeightChart() {
        destroyChart('dashWeight');
        const last10 = allWeights.slice(-10);
        if (last10.length < 2) return;

        charts.dashWeight = new Chart($('#dashWeightChart'), {
            type: 'line',
            data: {
                labels: last10.map(w => formatDate(w.date)),
                datasets: [{
                    label: '体重 (kg)',
                    data: last10.map(w => w.weight),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102,126,234,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#667eea',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    function refreshCharts() {
        const period = parseInt($('#chartPeriod')?.value || 30);
        const since = new Date();
        since.setDate(since.getDate() - period);
        const sinceStr = since.toISOString().split('T')[0];
        const filtered = allWorkouts.filter(w => w.date >= sinceStr);

        // Workout Frequency (bar chart)
        destroyChart('freq');
        const dateBuckets = {};
        filtered.forEach(w => {
            dateBuckets[w.date] = (dateBuckets[w.date] || 0) + 1;
        });
        const freqLabels = Object.keys(dateBuckets).sort();
        charts.freq = new Chart($('#workoutFreqChart'), {
            type: 'bar',
            data: {
                labels: freqLabels.map(d => formatDate(d)),
                datasets: [{
                    label: '锻炼次数',
                    data: freqLabels.map(d => dateBuckets[d]),
                    backgroundColor: 'rgba(102,126,234,0.7)',
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });

        // Workout Type Distribution (doughnut)
        destroyChart('type');
        const typeCounts = {};
        filtered.forEach(w => {
            typeCounts[w.type] = (typeCounts[w.type] || 0) + 1;
        });
        const typeLabels = Object.keys(typeCounts);
        const typeColors = ['#667eea', '#48bb78', '#ed8936', '#f56565', '#9f7aea', '#38b2ac', '#ecc94b'];
        if (typeLabels.length > 0) {
            charts.type = new Chart($('#workoutTypeChart'), {
                type: 'doughnut',
                data: {
                    labels: typeLabels.map(t => WORKOUT_TYPES[t]?.label || t),
                    datasets: [{
                        data: typeLabels.map(t => typeCounts[t]),
                        backgroundColor: typeColors.slice(0, typeLabels.length),
                        borderWidth: 2,
                        borderColor: '#fff',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
                    }
                }
            });
        }

        // Weight Chart (line)
        destroyChart('weight');
        if (allWeights.length >= 2) {
            charts.weight = new Chart($('#weightChart'), {
                type: 'line',
                data: {
                    labels: allWeights.map(w => formatDate(w.date)),
                    datasets: [{
                        label: '体重 (kg)',
                        data: allWeights.map(w => w.weight),
                        borderColor: '#ed8936',
                        backgroundColor: 'rgba(237,137,54,0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#ed8936',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { ticks: { font: { size: 11 } } }
                    }
                }
            });
        }

        // Volume Chart (bar) - total duration per week
        destroyChart('volume');
        const weekBuckets = {};
        filtered.forEach(w => {
            const d = new Date(w.date);
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            const key = weekStart.toISOString().split('T')[0];
            weekBuckets[key] = (weekBuckets[key] || 0) + w.duration;
        });
        const volLabels = Object.keys(weekBuckets).sort();
        if (volLabels.length > 0) {
            charts.volume = new Chart($('#volumeChart'), {
                type: 'bar',
                data: {
                    labels: volLabels.map(d => formatDate(d) + '周'),
                    datasets: [{
                        label: '运动时长 (分钟)',
                        data: volLabels.map(d => weekBuckets[d]),
                        backgroundColor: 'rgba(72,187,120,0.7)',
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    }

    // ===== Dashboard =====
    function refreshDashboard() {
        // Stats
        $('#statTotalWorkouts').textContent = allWorkouts.length;
        const totalMin = allWorkouts.reduce((s, w) => s + (w.duration || 0), 0);
        $('#statTotalDuration').textContent = totalMin >= 60
            ? `${(totalMin / 60).toFixed(1)}h`
            : `${totalMin}m`;
        const totalDist = allWorkouts.reduce((s, w) => s + (w.distance || 0), 0);
        $('#statTotalDistance').textContent = totalDist >= 1
            ? `${totalDist.toFixed(1)}km`
            : `${(totalDist * 1000).toFixed(0)}m`;

        refreshRecentWorkouts();
        renderDashWeightChart();
        refreshDashGoals();
        refreshStepDisplay();

        if (!loadWeights.length) return;
    }

    // ===== Share =====
    function openShareModal(workoutId) {
        const w = allWorkouts.find(x => x.id === workoutId);
        if (!w) return;

        const info = WORKOUT_TYPES[w.type] || WORKOUT_TYPES.other;
        $('#shareDate').textContent = formatDate(w.date);
        $('#shareType').textContent = `${info.icon} ${info.label}`;

        let statsHTML = '';
        if (w.duration) statsHTML += `<div class="stat-item"><span class="stat-num">${w.duration}</span><span class="stat-desc">分钟</span></div>`;
        if (w.distance) statsHTML += `<div class="stat-item"><span class="stat-num">${w.distance}</span><span class="stat-desc">公里</span></div>`;
        if (w.calories) statsHTML += `<div class="stat-item"><span class="stat-num">${w.calories}</span><span class="stat-desc">千卡</span></div>`;
        if (w.weight) statsHTML += `<div class="stat-item"><span class="stat-num">${w.weight}</span><span class="stat-desc">kg</span></div>`;
        if (w.sets) statsHTML += `<div class="stat-item"><span class="stat-num">${w.sets}×${w.reps}</span><span class="stat-desc">组×次</span></div>`;
        $('#shareStats').innerHTML = statsHTML;

        $('#shareModal').classList.add('open');

        // Store current workout for download
        $('#shareModal').dataset.workoutId = workoutId;
    }

    function closeShareModal() {
        $('#shareModal').classList.remove('open');
    }

    async function downloadShareCard() {
        if (typeof html2canvas === 'undefined') {
            showToast('图片生成库未加载', 'error');
            return;
        }
        try {
            const card = $('#shareCard');
            const canvas = await html2canvas(card, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
            });
            const link = document.createElement('a');
            link.download = `fitness-${today()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('卡片已下载', 'success');
        } catch (err) {
            console.error(err);
            showToast('生成失败，请重试', 'error');
        }
    }

    function copyShareText() {
        const id = parseInt($('#shareModal').dataset.workoutId);
        const w = allWorkouts.find(x => x.id === id);
        if (!w) return;

        const info = WORKOUT_TYPES[w.type] || WORKOUT_TYPES.other;
        let text = `🏋️ 健身追踪仪\n${info.icon} ${info.label} · ${formatDate(w.date)}\n`;
        if (w.duration) text += `⏱ ${w.duration}分钟 `;
        if (w.distance) text += `📏 ${w.distance}km `;
        if (w.calories) text += `🔥 ${w.calories}kcal`;
        text += '\n坚持锻炼，遇见更好的自己！';

        navigator.clipboard.writeText(text).then(() => {
            showToast('已复制到剪贴板', 'success');
        }).catch(() => {
            showToast('复制失败', 'error');
        });
    }

    // ===== Pedometer =====
    let stepCount = 0;
    let stepGoal = 10000;

    async function loadStepData() {
        try {
            const allSteps = await dbGetAll(STORE_STEPS);
            const todayData = allSteps.find(s => s.date === today());
            if (todayData) {
                stepCount = todayData.steps;
            }
        } catch (e) {
            console.warn('Steps load error:', e);
        }
    }

    async function saveStepData() {
        try {
            await dbPut(STORE_STEPS, { date: today(), steps: stepCount });
        } catch (e) {
            console.warn('Steps save error:', e);
        }
    }

    function initPedometer() {
        const status = $('#pedometerStatus');

        if ('Pedometer' in window) {
            try {
                const pedo = new Pedometer();
                pedo.addEventListener('step', (e) => {
                    stepCount = e.steps;
                    refreshStepDisplay();
                    saveStepData();
                });
                pedo.start();
                status.textContent = '✅ 计步器传感器已激活';
                status.style.color = 'var(--secondary)';
            } catch (e) {
                status.textContent = '⚠️ 计步器传感器不可用，使用手动模式';
                initManualStepCounter();
            }
        } else {
            status.textContent = 'ℹ️ 浏览器不支持计步器API。每次锻炼后自动计入步数。';
            initManualStepCounter();
        }
    }

    function initManualStepCounter() {
        // Estimate steps from walking/running workouts
        const todayWorkouts = allWorkouts.filter(w => w.date === today());
        const estimatedSteps = todayWorkouts.reduce((s, w) => {
            if (w.type === 'running') return s + (w.distance * 1300);
            if (w.type === 'hiking') return s + (w.distance * 1100);
            if (w.type === 'walking') return s + (w.distance * 1300);
            return s + (w.duration * 10); // ~10 steps per minute for general activity
        }, 0);

        if (estimatedSteps > stepCount) {
            stepCount = Math.round(estimatedSteps);
            saveStepData();
            refreshStepDisplay();
        }
    }

    function refreshStepDisplay() {
        $('#stepCount').textContent = stepCount.toLocaleString();
        $('#statSteps').textContent = stepCount.toLocaleString();

        // Calculate derived stats
        const distKm = (stepCount * 0.0007).toFixed(1); // ~0.7m per step
        const cal = Math.round(stepCount * 0.04); // ~0.04 cal per step
        $('#stepDistance').textContent = distKm;
        $('#stepCalories').textContent = cal;

        // Update ring
        const circumference = 2 * Math.PI * 90; // ~565.48
        const pct = Math.min(stepCount / stepGoal, 1);
        const offset = circumference * (1 - pct);
        const ring = $('#stepsRing');
        if (ring) {
            ring.style.strokeDashoffset = offset;
            ring.style.stroke = pct >= 1 ? '#48bb78' : '#667eea';
        }
    }

    // Add SVG gradient for pedometer ring (since CSS can't define it)
    function addPedometerGradient() {
        const svg = document.querySelector('.pedometer-svg');
        if (svg) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `<linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#667eea"/>
                <stop offset="100%" stop-color="#48bb78"/>
            </linearGradient>`;
            svg.insertBefore(defs, svg.firstChild);
            // Apply gradient to ring
            const ring = svg.querySelector('.ring-progress');
            if (ring) ring.style.stroke = 'url(#stepGradient)';
        }
    }

    // ===== Dashboard Form Toggle =====
    function showWorkoutForm() {
        navigateTo('workouts');
        $('#workoutForm').reset();
        $('#workoutId').value = '';
        $('#workoutDate').value = today();
        toggleWorkoutFields();
        $('#workoutFormCard').scrollIntoView({ behavior: 'smooth' });
    }

    // ===== Milestone Form =====
    function addMilestoneField() {
        const list = $('#milestoneList');
        const item = document.createElement('div');
        item.className = 'milestone-item';
        item.innerHTML = `
            <input type="number" placeholder="里程碑值" class="milestone-value" step="0.1">
            <input type="text" placeholder="奖励描述" class="milestone-reward">
            <button type="button" class="btn-icon remove-milestone" title="删除">✕</button>`;
        list.appendChild(item);
    }

    // ===== PWA Install =====
    let deferredPrompt = null;

    function initInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            $('#installBtn').style.display = 'inline-flex';
        });

        $('#installBtn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                if (result.outcome === 'accepted') {
                    showToast('应用已安装', 'success');
                }
                deferredPrompt = null;
                $('#installBtn').style.display = 'none';
            }
        });

        window.addEventListener('appinstalled', () => {
            $('#installBtn').style.display = 'none';
            deferredPrompt = null;
        });
    }

    // ===== Service Worker Registration =====
    function registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(() => console.log('SW registered'))
                .catch(err => console.warn('SW registration failed:', err));
        }
    }

    // ===== Init =====
    async function init() {
        // Open database
        await openDB();

        // Load data
        await Promise.all([loadWorkouts(), loadWeights(), loadGoals(), loadStepData()]);

        // Navigation
        initNavigation();
        initInstallPrompt();

        // Workout form
        $('#workoutForm').addEventListener('submit', saveWorkout);
        $('#workoutType').addEventListener('change', toggleWorkoutFields);
        $('#cancelWorkoutBtn').addEventListener('click', () => {
            $('#workoutForm').reset();
            $('#workoutId').value = '';
            toggleWorkoutFields();
        });
        $('#addWorkoutBtn').addEventListener('click', showWorkoutForm);
        $('#fabAdd').addEventListener('click', showWorkoutForm);
        $('#workoutFilter').addEventListener('change', refreshWorkoutList);

        // Weight
        $('#logWeightBtn').addEventListener('click', logWeight);

        // Goals
        $('#goalForm').addEventListener('submit', saveGoal);
        $('#addMilestoneBtn').addEventListener('click', addMilestoneField);
        $('#milestoneList').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-milestone')) {
                e.target.closest('.milestone-item').remove();
            }
        });

        // Charts period
        $('#chartPeriod')?.addEventListener('change', refreshCharts);

        // Share
        $('#closeShareModal').addEventListener('click', closeShareModal);
        $('#downloadCardBtn').addEventListener('click', downloadShareCard);
        $('#copyCardBtn').addEventListener('click', copyShareText);

        // Pedometer
        addPedometerGradient();
        $('#stepGoalInput').addEventListener('change', () => {
            stepGoal = parseInt($('#stepGoalInput').value) || 10000;
            $('#stepGoalDisplay').textContent = stepGoal.toLocaleString();
            refreshStepDisplay();
        });
        initPedometer();

        // Initial render
        $('#workoutDate').value = today();
        toggleWorkoutFields();
        refreshDashboard();

        // Register service worker
        registerSW();
    }

    // Run when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
