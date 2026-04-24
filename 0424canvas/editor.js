// ===== Canvas 图片编辑器 =====

(function () {
  'use strict';

  // ----- DOM Elements -----
  const fileInput = document.getElementById('fileInput');
  const canvas = document.getElementById('mainCanvas');
  const ctx = canvas.getContext('2d');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const dropHint = document.getElementById('dropHint');

  // Toolbar buttons
  const cropBtn = document.getElementById('cropBtn');
  const rotateBtn = document.getElementById('rotateBtn');
  const watermarkBtn = document.getElementById('watermarkBtn');
  const exportBtn = document.getElementById('exportBtn');

  // Panels
  const panel = document.getElementById('panel');
  const cropPanel = document.getElementById('cropPanel');
  const rotatePanel = document.getElementById('rotatePanel');
  const watermarkPanel = document.getElementById('watermarkPanel');
  const defaultPanel = document.getElementById('defaultPanel');

  // Crop controls
  const cropConfirm = document.getElementById('cropConfirm');
  const cropCancel = document.getElementById('cropCancel');

  // Rotate controls
  const rotateSlider = document.getElementById('rotateSlider');
  const rotateValue = document.getElementById('rotateValue');
  const rotateCW90 = document.getElementById('rotateCW90');
  const rotateCCW90 = document.getElementById('rotateCCW90');
  const rotateApply = document.getElementById('rotateApply');

  // Watermark controls
  const wmText = document.getElementById('wmText');
  const wmSize = document.getElementById('wmSize');
  const wmSizeValue = document.getElementById('wmSizeValue');
  const wmColor = document.getElementById('wmColor');
  const wmOpacity = document.getElementById('wmOpacity');
  const wmOpacityValue = document.getElementById('wmOpacityValue');
  const wmConfirm = document.getElementById('wmConfirm');
  const wmCancel = document.getElementById('wmCancel');

  // ----- State -----
  let originalImage = null;      // Original Image object
  let offscreen = null;           // OffscreenCanvas storing current edit state
  let offCtx = null;              // Offscreen context
  let displayScale = 1;           // display pixels / image pixels
  let currentTool = 'idle';       // idle | crop | rotate | watermark
  let rotateAngle = 0;            // Accumulated rotation angle for slider

  // Crop state
  let cropRect = null;            // {x, y, w, h} in image coordinates
  let cropDragging = false;
  let cropDragType = null;        // 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  let cropDragStart = null;       // {mx, my, rect}

  // Watermark state
  let wm = {
    text: '水印文字',
    x: 0, y: 0,
    fontSize: 32,
    color: '#ff0000',
    opacity: 0.5,
    dragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
  };

  // Constants
  const HANDLE_SIZE = 8;          // Handle size in display pixels
  const MIN_CROP_SIZE = 20;       // Minimum crop size in image pixels

  // ================================================================
  //  Image Loading
  // ================================================================

  function loadImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        originalImage = img;
        initOffscreen(img.naturalWidth, img.naturalHeight);
        offCtx.drawImage(img, 0, 0);
        enableToolButtons();
        setTool('idle');
        fitCanvas();
        render();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function initOffscreen(w, h) {
    offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    offCtx = offscreen.getContext('2d');
  }

  function enableToolButtons() {
    cropBtn.disabled = false;
    rotateBtn.disabled = false;
    watermarkBtn.disabled = false;
    exportBtn.disabled = false;
  }

  // ================================================================
  //  Display / Render
  // ================================================================

  function fitCanvas() {
    if (!offscreen) return;
    const wrapW = canvasWrapper.clientWidth;
    const wrapH = canvasWrapper.clientHeight;
    const imgW = offscreen.width;
    const imgH = offscreen.height;
    const scaleX = wrapW / imgW;
    const scaleY = wrapH / imgH;
    displayScale = Math.min(scaleX, scaleY, 1); // Don't upscale beyond 1:1
    canvas.width = Math.round(imgW * displayScale);
    canvas.height = Math.round(imgH * displayScale);
    dropHint.style.display = 'none';
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);

    if (currentTool === 'crop' && cropRect) {
      drawCropOverlay();
    } else if (currentTool === 'watermark') {
      drawWatermark();
    }
  }

  // ================================================================
  //  Coordinate Transforms
  // ================================================================

  function canvasOffset() {
    const rect = canvas.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }

  function toImageCoords(cx, cy) {
    return { x: cx / displayScale, y: cy / displayScale };
  }

  function toCanvasCoords(ix, iy) {
    return { x: ix * displayScale, y: iy * displayScale };
  }

  function getPointerPos(e) {
    const offset = canvasOffset();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - offset.left, y: clientY - offset.top };
  }

  // ================================================================
  //  Tool State Machine
  // ================================================================

  function setTool(tool) {
    // Deactivate previous
    cropBtn.classList.remove('active');
    rotateBtn.classList.remove('active');
    watermarkBtn.classList.remove('active');

    currentTool = tool;

    // Hide all panels
    cropPanel.style.display = 'none';
    rotatePanel.style.display = 'none';
    watermarkPanel.style.display = 'none';
    defaultPanel.style.display = 'none';

    switch (tool) {
      case 'idle':
        defaultPanel.style.display = '';
        defaultPanel.querySelector('.panel-hint').textContent = offscreen ? '选择工具开始编辑' : '请先上传一张图片开始编辑';
        cropRect = null;
        canvas.style.cursor = 'default';
        break;
      case 'crop':
        cropBtn.classList.add('active');
        cropPanel.style.display = '';
        canvas.style.cursor = 'crosshair';
        initCropRect();
        break;
      case 'rotate':
        rotateBtn.classList.add('active');
        rotatePanel.style.display = '';
        canvas.style.cursor = 'default';
        break;
      case 'watermark':
        watermarkBtn.classList.add('active');
        watermarkPanel.style.display = '';
        wm.x = offscreen.width / 2;
        wm.y = offscreen.height / 2;
        canvas.style.cursor = 'move';
        break;
    }
    render();
  }

  // ================================================================
  //  Crop Tool
  // ================================================================

  function initCropRect() {
    const margin = Math.min(offscreen.width, offscreen.height) * 0.1;
    cropRect = {
      x: margin,
      y: margin,
      w: offscreen.width - margin * 2,
      h: offscreen.height - margin * 2,
    };
  }

  function drawCropOverlay() {
    const r = cropRect;
    const cx = r.x * displayScale;
    const cy = r.y * displayScale;
    const cw = r.w * displayScale;
    const ch = r.h * displayScale;

    // Semi-transparent overlay outside crop area
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, cy); // top
    ctx.fillRect(0, cy + ch, canvas.width, canvas.height - cy - ch); // bottom
    ctx.fillRect(0, cy, cx, ch); // left
    ctx.fillRect(cx + cw, cy, canvas.width - cx - cw, ch); // right

    // Crop border
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // Rule of thirds lines
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      const lx = cx + (cw / 3) * i;
      const ly = cy + (ch / 3) * i;
      ctx.beginPath(); ctx.moveTo(lx, cy); ctx.lineTo(lx, cy + ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, ly); ctx.lineTo(cx + cw, ly); ctx.stroke();
    }

    // Corner and edge handles
    const hs = HANDLE_SIZE;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 1.5;
    const handles = getHandlePositions(cx, cy, cw, ch, hs);
    handles.forEach(function (h) {
      ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
      ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
    });

    ctx.restore();
  }

  function getHandlePositions(cx, cy, cw, ch, hs) {
    return [
      { type: 'nw', x: cx, y: cy },
      { type: 'n',  x: cx + cw / 2, y: cy },
      { type: 'ne', x: cx + cw, y: cy },
      { type: 'e',  x: cx + cw, y: cy + ch / 2 },
      { type: 'se', x: cx + cw, y: cy + ch },
      { type: 's',  x: cx + cw / 2, y: cy + ch },
      { type: 'sw', x: cx, y: cy + ch },
      { type: 'w',  x: cx, y: cy + ch / 2 },
    ];
  }

  function hitTestCropHandles(px, py) {
    if (!cropRect) return null;
    const hs = HANDLE_SIZE;
    const cx = cropRect.x * displayScale;
    const cy = cropRect.y * displayScale;
    const cw = cropRect.w * displayScale;
    const ch = cropRect.h * displayScale;
    const handles = getHandlePositions(cx, cy, cw, ch, hs);
    const hitRadius = hs;
    for (let i = 0; i < handles.length; i++) {
      if (Math.abs(px - handles[i].x) <= hitRadius && Math.abs(py - handles[i].y) <= hitRadius) {
        return handles[i].type;
      }
    }
    // Test inside rect for move
    if (px >= cx && px <= cx + cw && py >= cy && py <= cy + ch) {
      return 'move';
    }
    return null;
  }

  function updateCropCursor(type) {
    const cursors = {
      nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
      e: 'e-resize', se: 'se-resize', s: 's-resize',
      sw: 'sw-resize', w: 'w-resize', move: 'move',
    };
    canvas.style.cursor = cursors[type] || 'crosshair';
  }

  function normalizeCropRect() {
    if (!cropRect) return;
    // Ensure positive width/height
    if (cropRect.w < 0) { cropRect.x += cropRect.w; cropRect.w = -cropRect.w; }
    if (cropRect.h < 0) { cropRect.y += cropRect.h; cropRect.h = -cropRect.h; }
    // Clamp to image bounds
    cropRect.x = Math.max(0, Math.min(cropRect.x, offscreen.width - MIN_CROP_SIZE));
    cropRect.y = Math.max(0, Math.min(cropRect.y, offscreen.height - MIN_CROP_SIZE));
    cropRect.w = Math.max(MIN_CROP_SIZE, Math.min(cropRect.w, offscreen.width - cropRect.x));
    cropRect.h = Math.max(MIN_CROP_SIZE, Math.min(cropRect.h, offscreen.height - cropRect.y));
  }

  function applyCrop() {
    if (!cropRect) return;
    normalizeCropRect();
    const imageData = offCtx.getImageData(
      Math.round(cropRect.x), Math.round(cropRect.y),
      Math.round(cropRect.w), Math.round(cropRect.h)
    );
    // Resize offscreen to cropped size
    initOffscreen(Math.round(cropRect.w), Math.round(cropRect.h));
    offCtx.putImageData(imageData, 0, 0);
    fitCanvas();
  }

  // ================================================================
  //  Rotate Tool
  // ================================================================

  function applyRotation(degrees) {
    const radians = degrees * Math.PI / 180;
    const srcW = offscreen.width;
    const srcH = offscreen.height;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const newW = Math.round(srcW * cos + srcH * sin);
    const newH = Math.round(srcW * sin + srcH * cos);

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = newW;
    tmpCanvas.height = newH;
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.translate(newW / 2, newH / 2);
    tmpCtx.rotate(radians);
    tmpCtx.drawImage(offscreen, -srcW / 2, -srcH / 2);

    initOffscreen(newW, newH);
    offCtx.drawImage(tmpCanvas, 0, 0);
    fitCanvas();
  }

  // ================================================================
  //  Watermark Tool
  // ================================================================

  function drawWatermark() {
    ctx.save();
    const displayFontSize = wm.fontSize * displayScale;
    ctx.font = displayFontSize + 'px sans-serif';
    ctx.fillStyle = wm.color;
    ctx.globalAlpha = wm.opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pos = toCanvasCoords(wm.x, wm.y);
    ctx.fillText(wm.text, pos.x, pos.y);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function stampWatermark() {
    offCtx.save();
    offCtx.font = wm.fontSize + 'px sans-serif';
    offCtx.fillStyle = wm.color;
    offCtx.globalAlpha = wm.opacity;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(wm.text, wm.x, wm.y);
    offCtx.restore();
  }

  function hitTestWatermark(px, py) {
    ctx.save();
    ctx.font = wm.fontSize * displayScale + 'px sans-serif';
    const metrics = ctx.measureText(wm.text);
    ctx.restore();
    const pos = toCanvasCoords(wm.x, wm.y);
    const textW = metrics.width / 2;
    const textH = wm.fontSize * displayScale / 2;
    return px >= pos.x - textW && px <= pos.x + textW &&
           py >= pos.y - textH && py <= pos.y + textH;
  }

  // ================================================================
  //  Export
  // ================================================================

  function exportPNG() {
    offscreen.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited_image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // ================================================================
  //  Event Handlers — Pointer (Unified Mouse + Touch)
  // ================================================================

  function onPointerDown(e) {
    if (!offscreen) return;
    e.preventDefault();
    const pos = getPointerPos(e);

    if (currentTool === 'crop') {
      const hitType = hitTestCropHandles(pos.x, pos.y);
      if (hitType) {
        cropDragging = true;
        cropDragType = hitType;
        cropDragStart = {
          mx: pos.x, my: pos.y,
          rect: { x: cropRect.x, y: cropRect.y, w: cropRect.w, h: cropRect.h }
        };
      }
    } else if (currentTool === 'watermark') {
      if (hitTestWatermark(pos.x, pos.y)) {
        wm.dragging = true;
        const imgPos = toImageCoords(pos.x, pos.y);
        wm.dragOffsetX = wm.x - imgPos.x;
        wm.dragOffsetY = wm.y - imgPos.y;
      }
    }
  }

  function onPointerMove(e) {
    if (!offscreen) return;
    e.preventDefault();
    const pos = getPointerPos(e);

    if (currentTool === 'crop') {
      if (cropDragging && cropDragStart) {
        handleCropDrag(pos.x, pos.y);
        render();
      } else {
        // Update cursor
        const hitType = hitTestCropHandles(pos.x, pos.y);
        updateCropCursor(hitType);
      }
    } else if (currentTool === 'watermark') {
      if (wm.dragging) {
        const imgPos = toImageCoords(pos.x, pos.y);
        wm.x = imgPos.x + wm.dragOffsetX;
        wm.y = imgPos.y + wm.dragOffsetY;
        render();
      } else {
        canvas.style.cursor = hitTestWatermark(pos.x, pos.y) ? 'move' : 'default';
      }
    }
  }

  function onPointerUp(e) {
    if (currentTool === 'crop') {
      if (cropDragging) {
        cropDragging = false;
        cropDragType = null;
        cropDragStart = null;
        normalizeCropRect();
        render();
      }
    } else if (currentTool === 'watermark') {
      wm.dragging = false;
    }
  }

  function handleCropDrag(px, py) {
    const dx = (px - cropDragStart.mx) / displayScale;
    const dy = (py - cropDragStart.my) / displayScale;
    const r = cropDragStart.rect;
    const t = cropDragType;

    if (t === 'move') {
      cropRect.x = r.x + dx;
      cropRect.y = r.y + dy;
      // Keep within bounds
      cropRect.x = Math.max(0, Math.min(cropRect.x, offscreen.width - cropRect.w));
      cropRect.y = Math.max(0, Math.min(cropRect.y, offscreen.height - cropRect.h));
      return;
    }

    // Handle resizing
    let newX = r.x, newY = r.y, newW = r.w, newH = r.h;

    if (t.includes('w')) { newX = r.x + dx; newW = r.w - dx; }
    if (t.includes('e')) { newW = r.w + dx; }
    if (t.includes('n')) { newY = r.y + dy; newH = r.h - dy; }
    if (t.includes('s')) { newH = r.h + dy; }

    cropRect.x = newX;
    cropRect.y = newY;
    cropRect.w = newW;
    cropRect.h = newH;
  }

  // ================================================================
  //  Event Bindings
  // ================================================================

  // File input
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) {
      loadImageFile(fileInput.files[0]);
    }
  });

  // Drag and drop
  canvasWrapper.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropHint.classList.add('drag-over');
  });
  canvasWrapper.addEventListener('dragleave', function () {
    dropHint.classList.remove('drag-over');
  });
  canvasWrapper.addEventListener('drop', function (e) {
    e.preventDefault();
    dropHint.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      loadImageFile(e.dataTransfer.files[0]);
    }
  });

  // Canvas pointer events — mouse
  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  // Canvas pointer events — touch
  canvas.addEventListener('touchstart', onPointerDown, { passive: false });
  canvas.addEventListener('touchmove', onPointerMove, { passive: false });
  canvas.addEventListener('touchend', onPointerUp, { passive: false });

  // Toolbar buttons
  cropBtn.addEventListener('click', function () {
    if (!offscreen) return;
    setTool(currentTool === 'crop' ? 'idle' : 'crop');
  });

  rotateBtn.addEventListener('click', function () {
    if (!offscreen) return;
    setTool(currentTool === 'rotate' ? 'idle' : 'rotate');
  });

  watermarkBtn.addEventListener('click', function () {
    if (!offscreen) return;
    setTool(currentTool === 'watermark' ? 'idle' : 'watermark');
  });

  exportBtn.addEventListener('click', exportPNG);

  // Crop controls
  cropConfirm.addEventListener('click', function () {
    applyCrop();
    setTool('idle');
    render();
  });
  cropCancel.addEventListener('click', function () {
    cropRect = null;
    setTool('idle');
  });

  // Rotate controls
  rotateSlider.addEventListener('input', function () {
    rotateValue.textContent = rotateSlider.value;
  });
  rotateApply.addEventListener('click', function () {
    const deg = parseInt(rotateSlider.value, 10);
    if (deg !== 0) {
      applyRotation(deg);
      render();
      rotateSlider.value = 0;
      rotateValue.textContent = '0';
    }
  });
  rotateCW90.addEventListener('click', function () {
    applyRotation(90);
    render();
  });
  rotateCCW90.addEventListener('click', function () {
    applyRotation(-90);
    render();
  });

  // Watermark controls
  wmText.addEventListener('input', function () {
    wm.text = wmText.value;
    render();
  });
  wmSize.addEventListener('input', function () {
    wm.fontSize = parseInt(wmSize.value, 10);
    wmSizeValue.textContent = wmSize.value;
    render();
  });
  wmColor.addEventListener('input', function () {
    wm.color = wmColor.value;
    render();
  });
  wmOpacity.addEventListener('input', function () {
    wm.opacity = parseInt(wmOpacity.value, 10) / 100;
    wmOpacityValue.textContent = wmOpacity.value;
    render();
  });
  wmConfirm.addEventListener('click', function () {
    stampWatermark();
    setTool('idle');
    render();
  });
  wmCancel.addEventListener('click', function () {
    setTool('idle');
  });

  // Window resize
  window.addEventListener('resize', function () {
    if (offscreen) {
      fitCanvas();
      render();
    }
  });

})();
