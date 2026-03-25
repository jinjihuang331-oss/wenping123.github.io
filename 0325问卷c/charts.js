/* ===================================================
   在线问卷构建工具 - 图表渲染模块
   使用 Canvas API 实现交互式图表
   =================================================== */

const CHART_COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
];

// =================== 饼图（单选题）===================
function renderPieChart(canvas, labels, data) {
  const ctx = canvas.getContext('2d');
  const total = data.reduce((a, b) => a + b, 0);

  // 设置 canvas 尺寸
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 350 * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = '350px';
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 350;
  const centerX = w / 2 - 80;
  const centerY = h / 2;
  const radius = Math.min(centerX, centerY) - 20;
  const innerRadius = radius * 0.5;

  let startAngle = -Math.PI / 2;

  // 交互状态
  const slices = [];
  labels.forEach((label, i) => {
    const sliceAngle = total > 0 ? (data[i] / total) * Math.PI * 2 : (Math.PI * 2 / labels.length);
    slices.push({
      startAngle,
      endAngle: startAngle + sliceAngle,
      color: CHART_COLORS[i % CHART_COLORS.length],
      label,
      value: data[i],
      percent: total > 0 ? ((data[i] / total) * 100).toFixed(1) : '0.0'
    });
    startAngle += sliceAngle;
  });

  // 离屏 canvas 用于命中检测
  let hoveredIndex = -1;

  function draw() {
    ctx.clearRect(0, 0, w, h);

    slices.forEach((slice, i) => {
      const isHovered = i === hoveredIndex;
      const offset = isHovered ? 8 : 0;
      const midAngle = (slice.startAngle + slice.endAngle) / 2;
      const ox = Math.cos(midAngle) * offset;
      const oy = Math.sin(midAngle) * offset;

      ctx.beginPath();
      ctx.moveTo(centerX + ox + Math.cos(slice.startAngle) * innerRadius,
                 centerY + oy + Math.sin(slice.startAngle) * innerRadius);
      ctx.arc(centerX + ox, centerY + oy, radius + (isHovered ? 4 : 0), slice.startAngle, slice.endAngle);
      ctx.arc(centerX + ox, centerY + oy, innerRadius, slice.endAngle, slice.startAngle, true);
      ctx.closePath();

      ctx.fillStyle = slice.color;
      ctx.globalAlpha = isHovered ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;

      if (isHovered) {
        ctx.shadowColor = slice.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // 中心文本
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, centerX, centerY - 8);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('总回复', centerX, centerY + 14);

    // 图例
    const legendX = w - 180;
    let legendY = 30;
    slices.forEach((slice, i) => {
      ctx.fillStyle = slice.color;
      ctx.beginPath();
      ctx.roundRect(legendX, legendY - 6, 12, 12, 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${slice.label} (${slice.value})`, legendX + 18, legendY);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${slice.percent}%`, legendX + 18, legendY + 16);

      legendY += 36;
    });
  }

  function getSliceIndex(x, y) {
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < innerRadius || dist > radius + 10) return -1;
    let angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) angle += Math.PI * 2;
    for (let i = 0; i < slices.length; i++) {
      let sa = slices[i].startAngle;
      let ea = slices[i].endAngle;
      if (angle >= sa && angle < ea) return i;
    }
    return -1;
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const idx = getSliceIndex(x, y);
    if (idx !== hoveredIndex) {
      hoveredIndex = idx;
      canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';
      draw();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredIndex = -1;
    draw();
  });

  draw();
}

// =================== 柱状图（多选题）===================
function renderBarChart(canvas, labels, data) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 350 * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = '350px';
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 350;
  const padding = { top: 30, right: 30, bottom: 60, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxVal = Math.max(...data, 1);
  const barWidth = Math.min(60, (chartW / labels.length) * 0.6);
  const gap = (chartW - barWidth * labels.length) / (labels.length + 1);

  let hoveredBar = -1;

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Y 轴
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + chartH - (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round((maxVal / gridLines) * i), padding.left - 8, y);
    }

    // 柱子
    labels.forEach((label, i) => {
      const x = padding.left + gap + i * (barWidth + gap);
      const barH = maxVal > 0 ? (data[i] / maxVal) * chartH : 0;
      const y = padding.top + chartH - barH;
      const isHovered = i === hoveredBar;

      // 柱子阴影
      if (isHovered) {
        ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length] + '30';
        ctx.beginPath();
        ctx.roundRect(x - 4, y - 4, barWidth + 8, barH + 8, 6);
        ctx.fill();
      }

      ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
      ctx.globalAlpha = isHovered ? 1 : 0.8;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();
      ctx.globalAlpha = 1;

      // 数值
      if (isHovered || data[i] > 0) {
        ctx.fillStyle = isHovered ? '#1e293b' : '#64748b';
        ctx.font = isHovered ? 'bold 13px sans-serif' : '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(data[i], x + barWidth / 2, y - 6);
      }

      // 标签
      ctx.save();
      ctx.translate(x + barWidth / 2, padding.top + chartH + 12);
      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const truncated = label.length > 8 ? label.substring(0, 8) + '…' : label;
      ctx.fillText(truncated, 0, 0);
      ctx.restore();
    });
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    labels.forEach((_, i) => {
      const x = padding.left + gap + i * (barWidth + gap);
      if (mx >= x && mx <= x + barWidth) hoveredBar = i;
    });
    draw();
  });

  canvas.addEventListener('mouseleave', () => { hoveredBar = -1; draw(); });

  draw();
}

// =================== 分布图（滑块题）===================
function renderDistributionChart(canvas, values, min, max) {
  if (values.length === 0) {
    const ctx2 = canvas.getContext('2d');
    canvas.width = 400; canvas.height = 200;
    ctx2.fillStyle = '#94a3b8';
    ctx2.font = '14px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('暂无数据', 200, 100);
    return;
  }

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 350 * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = '350px';
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 350;
  const padding = { top: 30, right: 30, bottom: 50, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  // 统计分布桶
  const bucketCount = Math.min(20, max - min + 1);
  const bucketSize = (max - min) / bucketCount;
  const buckets = Array(bucketCount).fill(0);
  values.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1);
    if (idx >= 0 && idx < bucketCount) buckets[idx]++;
  });
  const maxBucket = Math.max(...buckets, 1);

  // 计算均值
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const avgX = padding.left + ((avg - min) / (max - min)) * chartW;

  let mouseY = -1;

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // 网格
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round((maxBucket / 4) * i), padding.left - 8, y);
    }

    // 分布曲线/面积
    const barW = chartW / bucketCount;
    buckets.forEach((count, i) => {
      const x = padding.left + i * barW;
      const barH = (count / maxBucket) * chartH;
      const y = padding.top + chartH - barH;

      ctx.fillStyle = CHART_COLORS[2] + (mouseY > y ? 'cc' : '66');
      ctx.beginPath();
      ctx.roundRect(x + 1, y, barW - 2, barH, [3, 3, 0, 0]);
      ctx.fill();
    });

    // X 轴标签
    for (let i = 0; i <= 5; i++) {
      const val = min + ((max - min) / 5) * i;
      const x = padding.left + (chartW / 5) * i;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(val), x, h - padding.bottom + 20);
    }

    // 均值线
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(avgX, padding.top);
    ctx.lineTo(avgX, padding.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`均值: ${avg.toFixed(1)}`, avgX, padding.top - 10);
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
    draw();
  });

  canvas.addEventListener('mouseleave', () => { mouseY = -1; draw(); });

  draw();
}

// =================== roundRect polyfill ===================
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    const r = Array.isArray(radii) ? radii : [radii, radii, radii, radii];
    const [tl, tr, br, bl] = r.map(v => Math.min(v || 0, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
    return this;
  };
}
