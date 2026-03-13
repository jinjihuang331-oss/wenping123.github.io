// ===== Charts Module =====
const charts = {
  instances: {},
  currentPeriod: 'week',

  // Color palette
  colors: {
    purple: 'rgba(124, 92, 231, 0.8)',
    purpleBg: 'rgba(124, 92, 231, 0.15)',
    teal: 'rgba(0, 206, 201, 0.8)',
    tealBg: 'rgba(0, 206, 201, 0.15)',
    green: 'rgba(0, 184, 148, 0.8)',
    greenBg: 'rgba(0, 184, 148, 0.15)',
    orange: 'rgba(253, 203, 110, 0.8)',
    orangeBg: 'rgba(253, 203, 110, 0.15)',
    pink: 'rgba(253, 121, 168, 0.8)',
    pinkBg: 'rgba(253, 121, 168, 0.15)',
    red: 'rgba(225, 112, 85, 0.8)',
    redBg: 'rgba(225, 112, 85, 0.15)',
    grid: 'rgba(42, 42, 94, 0.5)',
    text: '#6a6a99',
    typeColors: ['#7c5ce7', '#00cec9', '#00b894', '#fdcb6e', '#fd79a8', '#e17055']
  },

  // Chart.js defaults
  defaults: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a3e',
        titleColor: '#f0f0ff',
        bodyColor: '#a0a0cc',
        borderColor: '#2a2a5e',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { color: this.grid, drawBorder: false },
        ticks: { color: this.text, font: { size: 11 } }
      },
      y: {
        grid: { color: this.grid, drawBorder: false },
        ticks: { color: this.text, font: { size: 11 } }
      }
    }
  },

  init() {
    // Setup Chart.js global defaults
    Chart.defaults.color = this.colors.text;
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif";

    this.renderWeeklyChart();
    this.renderDurationChart();
    this.renderWeightChart();
    this.renderTypeChart();
  },

  getDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  },

  getDateLabels(period) {
    const labels = [];
    if (period === 'week') {
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push('周' + days[d.getDay()]);
      }
    } else if (period === 'month') {
      for (let i = 4; i >= 0; i--) {
        labels.push(`${i + 1}周前`);
      }
    } else {
      const months = ['一月', '二月', '三月', '四月', '五月', '六月',
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        labels.push(months[d.getMonth()]);
      }
    }
    return labels;
  },

  async renderWeeklyChart() {
    const canvas = document.getElementById('chart-weekly');
    if (!canvas) return;

    const labels = this.getDateLabels('week');
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = this.getDaysAgo(i);
      const workouts = await dbGetByIndex('workouts', 'date', date);
      data.push(workouts.reduce((sum, w) => sum + (w.duration || 0), 0));
    }

    this.destroyChart('weekly');

    this.instances.weekly = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: data.map(v => v > 0 ? this.colors.purple : this.colors.purpleBg),
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y} 分钟`
          }
        }},
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.colors.text, font: { size: 11 } }
          },
          y: {
            grid: { color: this.colors.grid, drawBorder: false },
            ticks: { color: this.colors.text, font: { size: 11 } },
            beginAtZero: true
          }
        }
      }
    });
  },

  async renderDurationChart() {
    const canvas = document.getElementById('chart-duration');
    if (!canvas) return;

    const period = this.currentPeriod;
    const labels = this.getDateLabels(period);
    const data = [];

    for (let i = labels.length - 1; i >= 0; i--) {
      let total = 0;
      if (period === 'week') {
        const date = this.getDaysAgo(i);
        const workouts = await dbGetByIndex('workouts', 'date', date);
        total = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
      } else if (period === 'month') {
        const endDate = this.getDaysAgo(i * 7);
        const startDate = this.getDaysAgo((i + 1) * 7);
        const workouts = await dbGetWorkoutsByDateRange(startDate, endDate);
        total = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = d.getMonth();
        const allWorkouts = await dbGetAll('workouts');
        total = allWorkouts
          .filter(w => {
            const wd = new Date(w.date);
            return wd.getFullYear() === year && wd.getMonth() === month;
          })
          .reduce((sum, w) => sum + (w.duration || 0), 0);
      }
      data.unshift(total);
    }

    this.destroyChart('duration');

    this.instances.duration = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: this.colors.teal,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          callbacks: { label: ctx => `${ctx.parsed.y} 分钟` }
        }},
        scales: {
          x: { grid: { display: false }, ticks: { color: this.colors.text } },
          y: {
            grid: { color: this.colors.grid, drawBorder: false },
            ticks: { color: this.colors.text },
            beginAtZero: true
          }
        }
      }
    });
  },

  async renderWeightChart() {
    const canvas = document.getElementById('chart-weight');
    if (!canvas) return;

    const weightLogs = await dbGetAll('weightLog');
    weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Show last 30 entries max
    const recent = weightLogs.slice(-30);

    this.destroyChart('weight');

    if (recent.length < 2) {
      // Show placeholder message on canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const parent = canvas.parentElement;
      canvas.style.display = 'none';
      let msg = document.getElementById('weight-chart-empty');
      if (!msg) {
        msg = document.createElement('div');
        msg.id = 'weight-chart-empty';
        msg.className = 'empty-state-small';
        msg.textContent = '需要至少2条体重记录来显示图表';
        parent.appendChild(msg);
      }
      return;
    }

    // Remove empty message if exists
    const msg = document.getElementById('weight-chart-empty');
    if (msg) msg.remove();
    canvas.style.display = '';

    this.instances.weight = new Chart(canvas, {
      type: 'line',
      data: {
        labels: recent.map(w => {
          const d = new Date(w.date);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        }),
        datasets: [{
          data: recent.map(w => w.weight),
          borderColor: this.colors.green,
          backgroundColor: this.colors.greenBg,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: this.colors.green,
          pointBorderColor: '#1a1a3e',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          callbacks: { label: ctx => `${ctx.parsed.y} kg` }
        }},
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.colors.text, maxTicksLimit: 8 }
          },
          y: {
            grid: { color: this.colors.grid, drawBorder: false },
            ticks: { color: this.colors.text }
          }
        }
      }
    });
  },

  async renderTypeChart() {
    const canvas = document.getElementById('chart-types');
    if (!canvas) return;

    const allWorkouts = await dbGetAll('workouts');
    const typeMap = {};
    const typeLabels = {
      running: '跑步', weightlifting: '举重', cycling: '骑行',
      swimming: '游泳', yoga: '瑜伽', walking: '步行'
    };

    allWorkouts.forEach(w => {
      typeMap[w.type] = (typeMap[w.type] || 0) + (w.duration || 0);
    });

    const types = Object.keys(typeMap);

    this.destroyChart('types');

    if (types.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const parent = canvas.parentElement;
      let msg = document.getElementById('types-chart-empty');
      if (!msg) {
        msg = document.createElement('div');
        msg.id = 'types-chart-empty';
        msg.className = 'empty-state-small';
        msg.textContent = '暂无锻炼数据';
        parent.appendChild(msg);
      }
      return;
    }

    const msg = document.getElementById('types-chart-empty');
    if (msg) msg.remove();

    this.instances.types = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: types.map(t => typeLabels[t] || t),
        datasets: [{
          data: types.map(t => typeMap[t]),
          backgroundColor: this.colors.typeColors.slice(0, types.length),
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: this.colors.text,
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 8,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = Math.round((ctx.parsed / total) * 100);
                return `${ctx.label}: ${ctx.parsed} 分钟 (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  setPeriod(period) {
    this.currentPeriod = period;
    this.renderDurationChart();
  },

  destroyChart(name) {
    if (this.instances[name]) {
      this.instances[name].destroy();
      this.instances[name] = null;
    }
  },

  refreshAll() {
    this.renderWeeklyChart();
    this.renderDurationChart();
    this.renderWeightChart();
    this.renderTypeChart();
  }
};
