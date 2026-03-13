/* ============================================================
   调色板生成工具 - app.js
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. 颜色工具函数
     ---------------------------------------------------------- */

  /**
   * HSL → RGB（h: 0-360, s: 0-100, l: 0-100）
   * 返回 { r: 0-255, g: 0-255, b: 0-255 }
   */
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60)      { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else              { r = c; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  /** RGB → HSL（r/g/b: 0-255）返回 { h: 0-360, s: 0-100, l: 0-100 } */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else                h = ((r - g) / d + 4) * 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  /** RGB → HEX */
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  /** HEX → RGB */
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return {
      r: parseInt(hex.substring(0,2), 16),
      g: parseInt(hex.substring(2,4), 16),
      b: parseInt(hex.substring(4,6), 16),
    };
  }

  /** HEX → HSL */
  function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b);
  }

  /** HSL → HEX */
  function hslToHex(h, s, l) {
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
  }

  /* ----------------------------------------------------------
     2. 色彩理论引擎
     ---------------------------------------------------------- */

  /** 根据模式和基准色生成调色板颜色列表 (HSL) */
  function generatePalette(baseH, baseS, baseL, mode) {
    const colors = [];
    const h = ((baseH % 360) + 360) % 360;

    switch (mode) {
      case 'complementary':
        colors.push({ h, s: baseS, l: baseL });
        colors.push({ h: (h + 180) % 360, s: baseS, l: baseL });
        colors.push({ h, s: baseS, l: Math.min(baseL + 18, 92) });
        colors.push({ h: (h + 180) % 360, s: baseS, l: Math.max(baseL - 18, 10) });
        colors.push({ h, s: Math.max(baseS - 30, 5), l: baseL });
        break;

      case 'analogous':
        for (let i = -2; i <= 2; i++) {
          colors.push({ h: (h + i * 30) % 360, s: baseS, l: baseL });
        }
        break;

      case 'triadic':
        colors.push({ h, s: baseS, l: baseL });
        colors.push({ h: (h + 120) % 360, s: baseS, l: baseL });
        colors.push({ h: (h + 240) % 360, s: baseS, l: baseL });
        colors.push({ h, s: baseS, l: Math.min(baseL + 15, 92) });
        colors.push({ h: (h + 120) % 360, s: Math.max(baseS - 25, 5), l: baseL });
        break;

      case 'tetradic':
        colors.push({ h, s: baseS, l: baseL });
        colors.push({ h: (h + 90) % 360, s: baseS, l: baseL });
        colors.push({ h: (h + 180) % 360, s: baseS, l: baseL });
        colors.push({ h: (h + 270) % 360, s: baseS, l: baseL });
        colors.push({ h, s: baseS, l: Math.min(baseL + 12, 92) });
        break;
    }
    return colors;
  }

  /* ----------------------------------------------------------
     3. 中位切分法 (Median Cut) — 图片取色
     ---------------------------------------------------------- */

  function medianCut(pixelData, numColors) {
    if (!pixelData.length) return [];

    let buckets = [pixelData];

    while (buckets.length < numColors) {
      // 选择像素最多的桶
      let maxIdx = 0;
      for (let i = 1; i < buckets.length; i++) {
        if (buckets[i].length > buckets[maxIdx].length) maxIdx = i;
      }
      const bucket = buckets[maxIdx];
      if (bucket.length < 2) break;

      // 找到范围最大的通道
      let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
      for (const px of bucket) {
        if (px[0] < rMin) rMin = px[0]; if (px[0] > rMax) rMax = px[0];
        if (px[1] < gMin) gMin = px[1]; if (px[1] > gMax) gMax = px[1];
        if (px[2] < bMin) bMin = px[2]; if (px[2] > bMax) bMax = px[2];
      }
      const rRange = rMax - rMin, gRange = gMax - gMin, bRange = bMax - bMin;
      let channel;
      if (rRange >= gRange && rRange >= bRange) channel = 0;
      else if (gRange >= bRange) channel = 1;
      else channel = 2;

      bucket.sort((a, b) => a[channel] - b[channel]);
      const mid = Math.floor(bucket.length / 2);
      buckets.splice(maxIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
    }

    // 求各桶平均值
    return buckets.map(bucket => {
      let r = 0, g = 0, b = 0;
      for (const px of bucket) { r += px[0]; g += px[1]; b += px[2]; }
      const n = bucket.length;
      return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
    });
  }

  function extractColorsFromImage(img, count) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // 缩小到 100px 宽以提高性能
    const maxW = 100;
    const scale = maxW / img.naturalWidth;
    canvas.width = maxW;
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      // 跳过透明像素和接近白色/黑色的
      if (data[i + 3] < 128) continue;
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    return medianCut(pixels, count || 6);
  }

  /* ----------------------------------------------------------
     4. 色盲模拟
     ---------------------------------------------------------- */

  // 颜色转换矩阵（Brettel / Vienot 简化）
  const COLOR_BLIND_MATRICES = {
    protanopia: [
      0.567, 0.433, 0.000,
      0.558, 0.442, 0.000,
      0.000, 0.242, 0.758
    ],
    deuteranopia: [
      0.625, 0.375, 0.000,
      0.700, 0.300, 0.000,
      0.000, 0.300, 0.700
    ],
    tritanopia: [
      0.950, 0.050, 0.000,
      0.000, 0.433, 0.567,
      0.000, 0.475, 0.525
    ],
  };

  function simulateColorBlind(r, g, b, type) {
    const m = COLOR_BLIND_MATRICES[type];
    if (!m) return { r, g, b };
    return {
      r: Math.round(Math.max(0, Math.min(255, r * m[0] + g * m[1] + b * m[2]))),
      g: Math.round(Math.max(0, Math.min(255, r * m[3] + g * m[4] + b * m[5]))),
      b: Math.round(Math.max(0, Math.min(255, r * m[6] + g * m[7] + b * m[8]))),
    };
  }

  /** 输入 HEX，输出根据色盲模式转换后的 HEX */
  function applyColorBlind(hex, type) {
    if (!type || type === 'normal') return hex;
    const { r, g, b } = hexToRgb(hex);
    const cb = simulateColorBlind(r, g, b, type);
    return rgbToHex(cb.r, cb.g, cb.b);
  }

  /* ----------------------------------------------------------
     5. 导出功能
     ---------------------------------------------------------- */

  function exportCSS(colors) {
    const vars = colors.map((c, i) =>
      `  --color-${i + 1}: ${c.hex};`
    ).join('\n');

    const lines = [
      ':root {',
      vars,
      '}',
      '',
      '/* 应用示例 */',
      `.primary { background: var(--color-1); color: #fff; }`,
      `.secondary { background: var(--color-2); color: #fff; }`,
      `.accent { background: var(--color-3); color: #fff; }`,
      `.surface { background: var(--color-4); }`,
      `.muted { background: var(--color-5); }`,
    ];
    return lines.join('\n');
  }

  function exportSCSS(colors) {
    const vars = colors.map((c, i) =>
      `$color-${i + 1}: ${c.hex};`
    ).join('\n');

    const mapEntries = colors.map((c, i) =>
      `  '${i + 1}': $color-${i + 1},`
    ).join('\n');

    const lines = [
      vars,
      '',
      `$palette: (`,
      mapEntries,
      ');',
      '',
      '// 使用方式: map-get($palette, "1")',
    ];
    return lines.join('\n');
  }

  function exportSVG(colors) {
    const sw = 80, gap = 4, n = colors.length;
    const width = n * sw + (n - 1) * gap + 20;
    const height = 50;
    let rects = '';
    colors.forEach((c, i) => {
      const x = 10 + i * (sw + gap);
      rects += `  <rect x="${x}" y="10" width="${sw}" height="30" rx="4" fill="${c.hex}"/>\n`;
      rects += `  <text x="${x + sw / 2}" y="28" text-anchor="middle" fill="#fff" font-size="9" font-family="sans-serif">${c.hex}</text>\n`;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${rects}</svg>`;
  }

  /* ----------------------------------------------------------
     6. 应用状态
     ---------------------------------------------------------- */

  const state = {
    baseHue: 0,
    baseSat: 70,
    baseLight: 55,
    mode: 'complementary',
    palette: [],          // { hex, h, s, l }[]
    historyStack: [],
    redoStack: [],
    editingIndex: -1,
    colorBlindType: 'normal',
  };

  const MAX_HISTORY = 50;

  /* ----------------------------------------------------------
     7. DOM 引用
     ---------------------------------------------------------- */

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const DOM = {
    colorWheel: $('#colorWheel'),
    wheelIndicator: $('#wheelIndicator'),
    selectedSwatch: $('#selectedSwatch'),
    selectedHex: $('#selectedHex'),
    selectedHSL: $('#selectedHSL'),
    modeButtons: $$('.mode-btn'),
    imageUploadZone: $('#imageUploadZone'),
    imageInput: $('#imageInput'),
    extractedPreview: $('#extractedPreview'),
    extractedImage: $('#extractedImage'),
    extractedCount: $('#extractedCount'),
    generateBtn: $('#generateBtn'),
    randomBtn: $('#randomBtn'),
    clearBtn: $('#clearBtn'),
    undoBtn: $('#undoBtn'),
    redoBtn: $('#redoBtn'),
    colorblindSelect: $('#colorblindSelect'),
    paletteContainer: $('#paletteContainer'),
    paletteEmpty: $('#paletteEmpty'),
    colorCount: $('#colorCount'),
    editorSection: $('#editorSection'),
    editorSwatch: $('#editorSwatch'),
    editorLabel: $('#editorLabel'),
    editorHue: $('#editorHue'),
    editorSat: $('#editorSat'),
    editorLight: $('#editorLight'),
    editorHueVal: $('#editorHueVal'),
    editorSatVal: $('#editorSatVal'),
    editorLightVal: $('#editorLightVal'),
    editorApply: $('#editorApply'),
    editorCancel: $('#editorCancel'),
    previewFrame: $('#previewFrame'),
    previewNavbar: $('#previewNavbar'),
    previewHero: $('#previewHero'),
    previewBtnPrimary: $('#previewBtnPrimary'),
    previewCards: $('#previewCards'),
    previewFooter: $('#previewFooter'),
    exportCSS: $('#exportCSS'),
    exportSCSS: $('#exportSCSS'),
    exportSVG: $('#exportSVG'),
    exportModal: $('#exportModal'),
    exportModalTitle: $('#exportModalTitle'),
    exportCode: $('#exportCode'),
    modalClose: $('#modalClose'),
    copyExportBtn: $('#copyExportBtn'),
    toast: $('#toast'),
  };

  /* ----------------------------------------------------------
     8. 历史记录 (Undo / Redo)
     ---------------------------------------------------------- */

  function pushHistory() {
    state.historyStack.push(JSON.stringify(state.palette));
    if (state.historyStack.length > MAX_HISTORY) state.historyStack.shift();
    state.redoStack = [];
    updateHistoryButtons();
  }

  function undo() {
    if (!state.historyStack.length) return;
    state.redoStack.push(JSON.stringify(state.palette));
    state.palette = JSON.parse(state.historyStack.pop());
    renderPalette();
    updateHistoryButtons();
    updatePreview();
  }

  function redo() {
    if (!state.redoStack.length) return;
    state.historyStack.push(JSON.stringify(state.palette));
    state.palette = JSON.parse(state.redoStack.pop());
    renderPalette();
    updateHistoryButtons();
    updatePreview();
  }

  function updateHistoryButtons() {
    DOM.undoBtn.disabled = state.historyStack.length === 0;
    DOM.redoBtn.disabled = state.redoStack.length === 0;
  }

  /* ----------------------------------------------------------
     9. 色轮绘制与交互
     ---------------------------------------------------------- */

  function drawColorWheel() {
    const canvas = DOM.colorWheel;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const outerR = Math.min(cx, cy) - 4;
    const innerR = outerR * 0.65;

    ctx.clearRect(0, 0, w, h);

    for (let angle = 0; angle < 360; angle += 1) {
      const startRad = ((angle - 1) * Math.PI) / 180;
      const endRad = ((angle + 1) * Math.PI) / 180;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startRad, endRad);
      ctx.arc(cx, cy, innerR, endRad, startRad, true);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      gradient.addColorStop(0, `hsl(${angle}, 30%, 65%)`);
      gradient.addColorStop(0.5, `hsl(${angle}, 70%, 55%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, 45%)`);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  function getColorFromWheel(e) {
    const canvas = DOM.colorWheel;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const outerR = Math.min(cx, cy) - 4;
    const innerR = outerR * 0.65;

    if (dist < innerR || dist > outerR) return null;

    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;

    // 饱和度随距离变化
    const t = (dist - innerR) / (outerR - innerR);
    const sat = 30 + t * 70;

    return { h: Math.round(angle), s: Math.round(sat), l: 55 };
  }

  function updateWheelIndicator(e) {
    const canvas = DOM.colorWheel;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    DOM.wheelIndicator.style.display = 'block';
    DOM.wheelIndicator.style.left = x + 'px';
    DOM.wheelIndicator.style.top = y + 'px';
  }

  function setBaseColor(h, s, l) {
    state.baseHue = h;
    state.baseSat = s;
    state.baseLight = l;

    const hex = hslToHex(h, s, l);
    const displayHex = applyColorBlind(hex, state.colorBlindType);
    DOM.selectedSwatch.style.background = displayHex;
    DOM.selectedHex.textContent = hex;
    DOM.selectedHSL.textContent = `H:${h} S:${s} L:${l}`;
    DOM.wheelIndicator.style.background = displayHex;
  }

  /* ----------------------------------------------------------
     10. 调色板渲染
     ---------------------------------------------------------- */

  function renderPalette() {
    DOM.paletteContainer.innerHTML = '';

    if (state.palette.length === 0) {
      DOM.paletteContainer.appendChild(DOM.paletteEmpty);
      DOM.paletteEmpty.style.display = '';
      DOM.colorCount.textContent = '0 色';
      DOM.editorSection.style.display = 'none';
      return;
    }

    DOM.colorCount.textContent = state.palette.length + ' 色';

    state.palette.forEach((color, i) => {
      const displayHex = applyColorBlind(color.hex, state.colorBlindType);
      const card = document.createElement('div');
      card.className = 'color-card' + (i === state.editingIndex ? ' active' : '');

      card.innerHTML = `
        <div class="color-card-swatch" style="background:${displayHex}">
          <button class="color-card-delete" data-index="${i}" title="删除">&times;</button>
        </div>
        <div class="color-card-info">
          <div class="color-card-hex">${color.hex}</div>
          <div class="color-card-values">
            <span data-copy="${displayHex}" title="点击复制">${displayHex}</span>
            <span data-copy="hsl(${color.h}, ${color.s}%, ${color.l}%)" title="点击复制">HSL(${color.h}, ${color.s}%, ${color.l}%)</span>
            <span data-copy="rgb(${hexToRgb(color.hex).r}, ${hexToRgb(color.hex).g}, ${hexToRgb(color.hex).b})" title="点击复制">RGB(${hexToRgb(color.hex).r}, ${hexToRgb(color.hex).g}, ${hexToRgb(color.hex).b})</span>
          </div>
        </div>
      `;

      // 点击色卡编辑
      card.querySelector('.color-card-swatch').addEventListener('click', (e) => {
        if (e.target.classList.contains('color-card-delete')) return;
        openEditor(i);
      });

      // 删除按钮
      card.querySelector('.color-card-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteColor(i);
      });

      // 点击复制
      card.querySelectorAll('.color-card-values span').forEach(span => {
        span.addEventListener('click', (e) => {
          e.stopPropagation();
          copyToClipboard(span.dataset.copy);
        });
      });

      DOM.paletteContainer.appendChild(card);
    });

    updatePreview();
  }

  function deleteColor(index) {
    pushHistory();
    state.palette.splice(index, 1);
    if (state.editingIndex === index) {
      state.editingIndex = -1;
      DOM.editorSection.style.display = 'none';
    }
    renderPalette();
  }

  /* ----------------------------------------------------------
     11. 颜色编辑器
     ---------------------------------------------------------- */

  function openEditor(index) {
    state.editingIndex = index;
    const color = state.palette[index];
    const displayHex = applyColorBlind(color.hex, state.colorBlindType);

    DOM.editorSwatch.style.background = displayHex;
    DOM.editorLabel.textContent = color.hex;
    DOM.editorHue.value = color.h;
    DOM.editorSat.value = color.s;
    DOM.editorLight.value = color.l;
    DOM.editorHueVal.textContent = color.h;
    DOM.editorSatVal.textContent = color.s;
    DOM.editorLightVal.textContent = color.l;

    DOM.editorSection.style.display = '';
    updateEditorSliderGradients();
    renderPalette();
  }

  function closeEditor() {
    state.editingIndex = -1;
    DOM.editorSection.style.display = 'none';
    renderPalette();
  }

  function applyEditor() {
    if (state.editingIndex < 0) return;
    pushHistory();
    const h = parseInt(DOM.editorHue.value);
    const s = parseInt(DOM.editorSat.value);
    const l = parseInt(DOM.editorLight.value);
    state.palette[state.editingIndex] = {
      h, s, l,
      hex: hslToHex(h, s, l),
    };
    renderPalette();
    closeEditor();
  }

  function updateEditorSliderGradients() {
    const h = parseInt(DOM.editorHue.value);
    const s = parseInt(DOM.editorSat.value);
    const l = parseInt(DOM.editorLight.value);

    DOM.editorSat.style.background = `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`;
    DOM.editorLight.style.background = `linear-gradient(to right, #000, hsl(${h},${s}%,50%), #fff)`;
  }

  /* ----------------------------------------------------------
     12. 预览区更新
     ---------------------------------------------------------- */

  function updatePreview() {
    const colors = state.palette.map(c => applyColorBlind(c.hex, state.colorBlindType));
    if (colors.length === 0) return;

    const primary = colors[0];
    const secondary = colors[1] || colors[0];
    const accent = colors[2] || colors[0];
    const surface = colors[3] || '#f5f5f5';
    const muted = colors[4] || '#e0e0e0';

    // 判断文字颜色（深色背景用白字）
    function textColor(hex) {
      const { r, g, b } = hexToRgb(hex);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return lum > 0.55 ? '#222' : '#fff';
    }

    DOM.previewNavbar.style.background = primary;
    DOM.previewNavbar.style.color = textColor(primary);

    DOM.previewHero.style.background =
      `linear-gradient(135deg, ${primary}, ${secondary})`;
    DOM.previewHero.style.color = textColor(primary);

    const heroTextColors = ['h2', 'p'];
    DOM.previewHero.querySelectorAll('h2, p').forEach(el => {
      el.style.color = textColor(primary);
    });

    DOM.previewBtnPrimary.style.background = accent;
    DOM.previewBtnPrimary.style.color = textColor(accent);

    DOM.previewCards.querySelectorAll('.preview-card').forEach((card, i) => {
      const bgColor = colors[i % colors.length];
      card.style.borderColor = bgColor;
      card.style.background = '#fff';
    });

    DOM.previewCards.querySelectorAll('.preview-card-body h4').forEach((h4, i) => {
      h4.style.color = colors[i % colors.length];
    });

    DOM.previewCards.querySelectorAll('.preview-card-btn').forEach((btn, i) => {
      const c = colors[(i + 1) % colors.length];
      btn.style.color = c;
      btn.style.borderColor = c;
    });

    DOM.previewFooter.style.background = surface;
    DOM.previewFooter.style.color = textColor(surface);

    // Card backgrounds
    DOM.previewCards.querySelectorAll('.preview-card-body').forEach((body, i) => {
      const bgColor = colors[i % colors.length];
      body.style.background = bgColor;
      body.style.color = textColor(bgColor);
    });
  }

  /* ----------------------------------------------------------
     13. 导出显示
     ---------------------------------------------------------- */

  function showExportModal(type) {
    if (state.palette.length === 0) {
      showToast('调色板为空，请先生成颜色');
      return;
    }

    const colors = state.palette.map(c => ({ hex: c.hex, h: c.h, s: c.s, l: c.l }));
    let code = '';
    let title = '';

    switch (type) {
      case 'CSS':
        code = exportCSS(colors);
        title = '导出 CSS 变量';
        break;
      case 'SCSS':
        code = exportSCSS(colors);
        title = '导出 SCSS 变量';
        break;
      case 'SVG':
        code = exportSVG(colors);
        title = '导出 SVG 调色板';
        break;
    }

    DOM.exportModalTitle.textContent = title;
    DOM.exportCode.textContent = code;
    DOM.exportModal.style.display = '';
  }

  function closeExportModal() {
    DOM.exportModal.style.display = 'none';
  }

  /* ----------------------------------------------------------
     14. 工具函数
     ---------------------------------------------------------- */

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制: ' + text);
    }).catch(() => {
      // 降级方案
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('已复制: ' + text);
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    DOM.toast.textContent = msg;
    DOM.toast.style.display = '';
    DOM.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      DOM.toast.classList.remove('show');
      setTimeout(() => { DOM.toast.style.display = 'none'; }, 300);
    }, 2000);
  }

  function randomHue() {
    return Math.floor(Math.random() * 360);
  }

  /* ----------------------------------------------------------
     15. 生成调色板操作
     ---------------------------------------------------------- */

  function doGenerate() {
    pushHistory();
    const colors = generatePalette(state.baseHue, state.baseSat, state.baseLight, state.mode);
    state.palette = colors.map(c => ({
      h: c.h,
      s: c.s,
      l: c.l,
      hex: hslToHex(c.h, c.s, c.l),
    }));
    state.editingIndex = -1;
    DOM.editorSection.style.display = 'none';
    renderPalette();
  }

  function doRandom() {
    state.baseHue = randomHue();
    state.baseSat = 55 + Math.floor(Math.random() * 35);
    state.baseLight = 40 + Math.floor(Math.random() * 25);
    setBaseColor(state.baseHue, state.baseSat, state.baseLight);
    doGenerate();
    // 更新色轮指示器位置
    updateWheelIndicatorPosition(state.baseHue, state.baseSat);
  }

  function updateWheelIndicatorPosition(h, s) {
    const canvas = DOM.colorWheel;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const outerR = Math.min(cx, cy) - 4;
    const innerR = outerR * 0.65;
    const t = (s - 30) / 70;
    const dist = innerR + t * (outerR - innerR);
    const rad = (h * Math.PI) / 180;
    const x = cx + dist * Math.cos(rad);
    const y = cy + dist * Math.sin(rad);

    DOM.wheelIndicator.style.display = 'block';
    DOM.wheelIndicator.style.left = x + 'px';
    DOM.wheelIndicator.style.top = y + 'px';
  }

  function doClear() {
    if (state.palette.length === 0) return;
    pushHistory();
    state.palette = [];
    state.editingIndex = -1;
    DOM.editorSection.style.display = 'none';
    renderPalette();
  }

  /* ----------------------------------------------------------
     16. 图片上传
     ---------------------------------------------------------- */

  function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('请上传有效的图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const rgbColors = extractColorsFromImage(img, 6);
        pushHistory();
        state.palette = rgbColors.map(([r, g, b]) => {
          const hsl = rgbToHsl(r, g, b);
          return { h: hsl.h, s: hsl.s, l: hsl.l, hex: rgbToHex(r, g, b) };
        });

        // 设置基准色为提取的第一个颜色
        if (state.palette.length > 0) {
          const first = state.palette[0];
          state.baseHue = first.h;
          state.baseSat = first.s;
          state.baseLight = first.l;
          setBaseColor(first.h, first.s, first.l);
          updateWheelIndicatorPosition(first.h, first.s);
        }

        DOM.extractedImage.src = e.target.result;
        DOM.extractedPreview.style.display = 'flex';
        DOM.extractedCount.textContent = `提取了 ${state.palette.length} 个颜色`;
        renderPalette();
        showToast('已从图片中提取颜色');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ----------------------------------------------------------
     17. 色盲模拟切换
     ---------------------------------------------------------- */

  function applyColorBlindMode() {
    state.colorBlindType = DOM.colorblindSelect.value;
    setBaseColor(state.baseHue, state.baseSat, state.baseLight);
    renderPalette();
  }

  /* ----------------------------------------------------------
     18. 事件绑定与初始化
     ---------------------------------------------------------- */

  function init() {
    // 色轮绘制
    drawColorWheel();
    setBaseColor(state.baseHue, state.baseSat, state.baseLight);

    // 色轮交互
    let wheelDragging = false;

    DOM.colorWheel.addEventListener('mousedown', (e) => {
      wheelDragging = true;
      const color = getColorFromWheel(e);
      if (color) {
        setBaseColor(color.h, color.s, color.l);
        updateWheelIndicator(e);
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!wheelDragging) return;
      const color = getColorFromWheel(e);
      if (color) {
        setBaseColor(color.h, color.s, color.l);
        updateWheelIndicator(e);
      }
    });

    document.addEventListener('mouseup', () => {
      wheelDragging = false;
    });

    // 触摸支持
    DOM.colorWheel.addEventListener('touchstart', (e) => {
      e.preventDefault();
      wheelDragging = true;
      const touch = e.touches[0];
      const color = getColorFromWheel(touch);
      if (color) {
        setBaseColor(color.h, color.s, color.l);
        updateWheelIndicator(touch);
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!wheelDragging) return;
      const touch = e.touches[0];
      const color = getColorFromWheel(touch);
      if (color) {
        setBaseColor(color.h, color.s, color.l);
        updateWheelIndicator(touch);
      }
    });

    document.addEventListener('touchend', () => {
      wheelDragging = false;
    });

    // 模式切换
    DOM.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mode = btn.dataset.mode;
      });
    });

    // 操作按钮
    DOM.generateBtn.addEventListener('click', doGenerate);
    DOM.randomBtn.addEventListener('click', doRandom);
    DOM.clearBtn.addEventListener('click', doClear);

    // 撤销 / 重做
    DOM.undoBtn.addEventListener('click', undo);
    DOM.redoBtn.addEventListener('click', redo);

    // 快捷键
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Z') {
        e.preventDefault();
        redo();
      }
    });

    // 色盲选择
    DOM.colorblindSelect.addEventListener('change', applyColorBlindMode);

    // 图片上传
    DOM.imageUploadZone.addEventListener('click', () => {
      DOM.imageInput.click();
    });

    DOM.imageInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleImageUpload(e.target.files[0]);
      }
    });

    DOM.imageUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.imageUploadZone.classList.add('drag-over');
    });

    DOM.imageUploadZone.addEventListener('dragleave', () => {
      DOM.imageUploadZone.classList.remove('drag-over');
    });

    DOM.imageUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.imageUploadZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    });

    // 编辑器
    DOM.editorHue.addEventListener('input', () => {
      DOM.editorHueVal.textContent = DOM.editorHue.value;
      updateEditorSliderGradients();
    });
    DOM.editorSat.addEventListener('input', () => {
      DOM.editorSatVal.textContent = DOM.editorSat.value;
      updateEditorSliderGradients();
    });
    DOM.editorLight.addEventListener('input', () => {
      DOM.editorLightVal.textContent = DOM.editorLight.value;
      updateEditorSliderGradients();
    });
    DOM.editorApply.addEventListener('click', applyEditor);
    DOM.editorCancel.addEventListener('click', closeEditor);

    // 导出
    DOM.exportCSS.addEventListener('click', () => showExportModal('CSS'));
    DOM.exportSCSS.addEventListener('click', () => showExportModal('SCSS'));
    DOM.exportSVG.addEventListener('click', () => showExportModal('SVG'));

    // 模态框
    DOM.modalClose.addEventListener('click', closeExportModal);
    DOM.exportModal.addEventListener('click', (e) => {
      if (e.target === DOM.exportModal) closeExportModal();
    });
    DOM.copyExportBtn.addEventListener('click', () => {
      copyToClipboard(DOM.exportCode.textContent);
    });

    // ESC 关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeExportModal();
    });

    // 初始渲染
    renderPalette();
  }

  // 启动
  document.addEventListener('DOMContentLoaded', init);
})();
