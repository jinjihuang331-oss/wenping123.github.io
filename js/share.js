// ===== Share Module =====
const share = {
  typeIcons: {
    running: '🏃', weightlifting: '🏋️', cycling: '🚴',
    swimming: '🏊', yoga: '🧘', walking: '🚶'
  },

  typeLabels: {
    running: '跑步', weightlifting: '举重', cycling: '骑行',
    swimming: '游泳', yoga: '瑜伽', walking: '步行'
  },

  typeColors: {
    running: ['#4facfe', '#00f2fe'],
    weightlifting: ['#f093fb', '#f5576c'],
    cycling: ['#43e97b', '#38f9d7'],
    swimming: ['#4facfe', '#00f2fe'],
    yoga: ['#fa709a', '#fee140'],
    walking: ['#a18cd1', '#fbc2eb']
  },

  generateCard(workout) {
    const card = document.getElementById('share-card');
    const colors = this.typeColors[workout.type] || ['#7c5ce7', '#6c3ce7'];

    document.getElementById('share-card-icon').textContent = this.typeIcons[workout.type] || '🏋️';
    document.getElementById('share-card-title').textContent = this.typeLabels[workout.type] || workout.type;
    document.getElementById('share-card-duration').textContent = workout.duration || 0;
    document.getElementById('share-card-date').textContent = new Date(workout.date).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Distance
    const distStat = document.getElementById('share-card-distance-stat');
    if (workout.distance) {
      distStat.style.display = '';
      document.getElementById('share-card-distance').textContent = workout.distance;
    } else {
      distStat.style.display = 'none';
    }

    // Calories
    const calStat = document.getElementById('share-card-calories-stat');
    if (workout.calories) {
      calStat.style.display = '';
      document.getElementById('share-card-calories').textContent = workout.calories;
    } else {
      calStat.style.display = 'none';
    }

    // Apply gradient
    card.style.background = `linear-gradient(145deg, ${colors[0]}33, ${colors[1]}33)`;

    // Show only distance or calories stat depending on which is visible
    const body = card.querySelector('.share-card-body');
    const visibleStats = body.querySelectorAll('.share-card-stat[style!="display:none"]');
    body.style.justifyContent = visibleStats.length <= 1 ? 'center' : 'space-around';

    return card;
  },

  async showShareModal(workout) {
    this.generateCard(workout);

    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
      <h3>分享锻炼</h3>
      <div class="share-preview-container">
        <div id="share-card-render"></div>
        <canvas id="share-canvas" style="display:none"></canvas>
        <canvas id="share-canvas-display" style="border-radius:16px;max-width:100%;margin-bottom:16px"></canvas>
        <div class="share-actions">
          <button class="btn-primary" onclick="share.doShare()">分享</button>
          <button class="btn-secondary" onclick="share.downloadCard()">保存图片</button>
        </div>
      </div>`;

    document.getElementById('modal-overlay').classList.add('active');

    // Render to canvas using built-in canvas drawing
    await this.renderToCanvas(workout);
  },

  async renderToCanvas(workout) {
    const card = this.generateCard(workout);
    const colors = this.typeColors[workout.type] || ['#7c5ce7', '#6c3ce7'];

    // Create a high-quality canvas using canvas API directly
    const canvas = document.getElementById('share-canvas-display');
    const dpr = window.devicePixelRatio || 1;
    const width = 380;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Background with rounded corners
    const radius = 20;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1a1a4e');
    grad.addColorStop(1, '#2a2a6e');
    ctx.fillStyle = grad;
    ctx.fill();

    // Accent line
    const accentGrad = ctx.createLinearGradient(20, 0, width - 20, 0);
    accentGrad.addColorStop(0, colors[0]);
    accentGrad.addColorStop(1, colors[1]);
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, width, 4);

    // Icon and title
    ctx.font = '28px serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.typeIcons[workout.type] || '🏋️', 24, 46);

    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#f0f0ff';
    ctx.fillText(this.typeLabels[workout.type] || workout.type, 60, 44);

    // Stats
    const stats = [];
    stats.push({ label: '分钟', value: String(workout.duration || 0) });
    if (workout.distance) stats.push({ label: 'km', value: String(workout.distance) });
    if (workout.calories) stats.push({ label: '千卡', value: String(workout.calories) });

    const statWidth = (width - 48) / Math.max(stats.length, 1);
    stats.forEach((stat, i) => {
      const x = 24 + statWidth * i + statWidth / 2;
      const y = 110;

      ctx.font = 'bold 32px -apple-system, sans-serif';
      ctx.fillStyle = colors[0];
      ctx.textAlign = 'center';
      ctx.fillText(stat.value, x, y);

      ctx.font = '14px -apple-system, sans-serif';
      ctx.fillStyle = '#a0a0cc';
      ctx.fillText(stat.label, x, y + 22);
    });

    // Date footer
    ctx.textAlign = 'left';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.fillStyle = '#6a6a99';
    const dateStr = new Date(workout.date).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    ctx.fillText(dateStr, 24, height - 16);

    ctx.textAlign = 'right';
    ctx.fillText('健身追踪', width - 24, height - 16);

    // Reset text align
    ctx.textAlign = 'left';
  },

  async downloadCard() {
    const canvas = document.getElementById('share-canvas-display');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `workout-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.show('图片已保存', 'success');
  },

  async doShare() {
    const canvas = document.getElementById('share-canvas-display');
    if (!canvas) return;

    if (navigator.share && navigator.canShare) {
      try {
        canvas.toBlob(async (blob) => {
          const file = new File([blob], 'workout.png', { type: 'image/png' });
          const shareData = { files: [file], title: '我的锻炼记录' };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
          } else {
            // Fallback: share URL or text
            await navigator.share({
              title: '我的锻炼记录',
              text: '看看我的锻炼记录！'
            });
          }
        }, 'image/png');
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.downloadCard();
        }
      }
    } else {
      this.downloadCard();
    }
  }
};
