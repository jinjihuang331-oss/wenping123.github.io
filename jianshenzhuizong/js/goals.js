// ===== Goals Module =====
const goals = {
  typeLabels: {
    total_workouts: '总锻炼次数',
    total_distance: '总距离 (km)',
    total_weight: '总举重 (kg)',
    weekly_frequency: '每周锻炼次数',
    weight_loss: '减重 (kg)',
    weight_gain: '增重 (kg)',
    total_calories: '总卡路里',
    streak: '连续锻炼天数'
  },

  typeUnits: {
    total_workouts: '次',
    total_distance: 'km',
    total_weight: 'kg',
    weekly_frequency: '次/周',
    weight_loss: 'kg',
    weight_gain: 'kg',
    total_calories: '千卡',
    streak: '天'
  },

  typeIcons: {
    total_workouts: '🏋️',
    total_distance: '🏃',
    total_weight: '💪',
    weekly_frequency: '📅',
    weight_loss: '⬇️',
    weight_gain: '⬆️',
    total_calories: '🔥',
    streak: '🔥'
  },

  typeColors: {
    total_workouts: '#7c5ce7',
    total_distance: '#00cec9',
    total_weight: '#e17055',
    weekly_frequency: '#fdcb6e',
    weight_loss: '#00b894',
    weight_gain: '#fd79a8',
    total_calories: '#e17055',
    streak: '#ff6348'
  },

  async init() {
    await this.renderGoals();
  },

  showAddModal() {
    const template = document.getElementById('goal-modal');
    document.getElementById('modal-content').innerHTML = template.innerHTML;
    document.getElementById('modal-overlay').classList.add('active');

    // Set min date for deadline
    const deadlineInput = document.getElementById('goal-deadline');
    if (deadlineInput) {
      deadlineInput.min = new Date().toISOString().split('T')[0];
    }
  },

  async saveGoal(e) {
    e.preventDefault();
    const type = document.getElementById('goal-type').value;
    const target = parseFloat(document.getElementById('goal-target').value);
    const deadline = document.getElementById('goal-deadline').value || null;

    if (!type || !target || target <= 0) {
      toast.show('请填写有效的目标值', 'error');
      return;
    }

    const goal = {
      type,
      target,
      current: 0,
      milestoneCount: 4,
      milestones: [],
      deadline,
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null
    };

    // Generate milestones
    for (let i = 1; i <= goal.milestoneCount; i++) {
      goal.milestones.push({
        value: Math.round((target / goal.milestoneCount) * i * 10) / 10,
        achieved: false
      });
    }

    await dbAdd('goals', goal);
    modal.close();
    toast.show('目标创建成功！', 'success');
    await this.renderGoals();
  },

  async calculateProgress(goal) {
    const allWorkouts = await dbGetAll('workouts');

    switch (goal.type) {
      case 'total_workouts':
        return allWorkouts.length;

      case 'total_distance':
        return allWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);

      case 'total_weight':
        return allWorkouts.reduce((sum, w) => {
          if (w.type === 'weightlifting' && w.weight && w.sets && w.reps) {
            return sum + (w.weight * w.sets * w.reps);
          }
          return sum;
        }, 0);

      case 'weekly_frequency': {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekStr = weekStart.toISOString().split('T')[0];
        return allWorkouts.filter(w => w.date >= weekStr).length;
      }

      case 'weight_loss': {
        const weightLogs = await dbGetAll('weightLog');
        if (weightLogs.length < 2) return 0;
        weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
        const first = weightLogs[0].weight;
        const latest = weightLogs[weightLogs.length - 1].weight;
        return Math.max(0, first - latest);
      }

      case 'weight_gain': {
        const weightLogs2 = await dbGetAll('weightLog');
        if (weightLogs2.length < 2) return 0;
        weightLogs2.sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstW = weightLogs2[0].weight;
        const latestW = weightLogs2[weightLogs2.length - 1].weight;
        return Math.max(0, latestW - firstW);
      }

      case 'total_calories':
        return allWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);

      case 'streak': {
        const dateSet = new Set(allWorkouts.map(w => w.date));
        let streak = 0;
        let d = new Date();
        while (true) {
          const ds = d.toISOString().split('T')[0];
          if (dateSet.has(ds)) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      }

      default:
        return 0;
    }
  },

  async renderGoals() {
    const allGoals = await dbGetAll('goals');
    const activeGoals = allGoals.filter(g => !g.completed);
    const completedGoals = allGoals.filter(g => g.completed);

    const listEl = document.getElementById('goals-list');
    const completedEl = document.getElementById('completed-goals-list');
    const completedCard = document.getElementById('completed-goals-card');

    if (activeGoals.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <p>还没有设定目标</p>
          <p class="empty-sub">点击上方按钮创建你的第一个健身目标</p>
        </div>`;
    } else {
      let html = '';
      for (const goal of activeGoals) {
        const progress = await this.calculateProgress(goal);
        const currentBefore = goal.current;
        goal.current = progress;

        // Update milestones
        goal.milestones.forEach(m => {
          m.achieved = progress >= m.value;
        });

        // Check if just completed
        if (progress >= goal.target && !goal.completed) {
          goal.completed = true;
          goal.completedAt = new Date().toISOString();
          await dbPut('goals', goal);
          this.showConfetti();
          toast.show('🎉 目标达成！恭喜！', 'success');
        } else {
          await dbPut('goals', goal);
        }

        const pct = Math.min(100, Math.round((progress / goal.target) * 100));
        const color = this.typeColors[goal.type] || '#7c5ce7';
        const icon = this.typeIcons[goal.type] || '🎯';
        const label = this.typeLabels[goal.type] || goal.type;
        const unit = this.typeUnits[goal.type] || '';
        const goalProgress = goal.completed ? goal.target : progress;

        html += `
          <div class="goal-card ${goal.completed ? 'completed' : ''}">
            <div class="goal-card-header">
              <div>
                <div class="goal-title">${icon} ${label}</div>
                <div class="goal-subtitle">目标: ${goal.target} ${unit}</div>
              </div>
              <div class="workout-item-actions">
                <button class="action-btn" onclick="goals.deleteGoal(${goal.id})" title="删除">
                  <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
            <div class="goal-progress-bar">
              <div class="goal-progress-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <div class="goal-milestones">
              ${goal.milestones.map(m => `
                <div class="milestone">
                  <div class="milestone-dot ${m.achieved ? 'achieved' : ''}"></div>
                  <div class="milestone-label">${m.value}${unit}</div>
                </div>
              `).join('')}
            </div>
            <div class="goal-card-footer">
              <span class="goal-percent" style="color:${color}">${pct}% · ${goalProgress}/${goal.target} ${unit}</span>
              ${goal.deadline ? `<span class="goal-deadline">截止: ${new Date(goal.deadline).toLocaleDateString('zh-CN')}</span>` : ''}
            </div>
          </div>`;
      }
      listEl.innerHTML = html;
    }

    // Completed goals
    if (completedGoals.length > 0) {
      completedCard.style.display = '';
      let html = '';
      completedGoals.reverse().forEach(goal => {
        const icon = this.typeIcons[goal.type] || '🎯';
        const label = this.typeLabels[goal.type] || goal.type;
        const color = this.typeColors[goal.type] || '#00b894';
        html += `
          <div class="goal-card completed">
            <div class="goal-card-header">
              <div>
                <div class="goal-title">✅ ${icon} ${label}</div>
                <div class="goal-subtitle">完成于 ${new Date(goal.completedAt).toLocaleDateString('zh-CN')}</div>
              </div>
              <div class="workout-item-actions">
                <button class="action-btn" onclick="goals.deleteGoal(${goal.id})" title="删除">
                  <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
            <div class="goal-progress-bar">
              <div class="goal-progress-fill" style="width:100%;background:${color}"></div>
            </div>
            <div class="goal-card-footer">
              <span class="goal-percent" style="color:${color}">100% · ${goal.target} ${this.typeUnits[goal.type] || ''}</span>
            </div>
          </div>`;
      });
      completedEl.innerHTML = html;
    } else {
      completedCard.style.display = 'none';
    }
  },

  async deleteGoal(id) {
    if (confirm('确定要删除这个目标吗？')) {
      await dbDelete('goals', id);
      toast.show('目标已删除', 'info');
      await this.renderGoals();
    }
  },

  updateActiveGoalCount() {
    return dbGetAll('goals').then(goals => goals.filter(g => !g.completed).length);
  },

  showConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#7c5ce7', '#00cec9', '#00b894', '#fdcb6e', '#fd79a8', '#e17055'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = '-10px';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 1 + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      piece.style.width = (6 + Math.random() * 10) + 'px';
      piece.style.height = (6 + Math.random() * 10) + 'px';
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 4000);
  }
};
