/* ============================================
   Virtual Classroom Platform - Application
   ============================================ */

(function () {
  'use strict';

  // ---- State ----
  const state = {
    // Whiteboard
    tool: 'pen',
    color: '#e74c3c',
    lineWidth: 3,
    isDrawing: false,
    history: [],
    historyIndex: -1,
    // Recording
    isRecording: false,
    recordStartTime: 0,
    recordTimer: null,
    // Screen share
    isSharing: false,
    isSelectingShare: false,
    shareRect: null,
    shareStart: null,
    // Chat
    messages: [],
    unreadCount: 0,
    // Mobile
    isMobile: window.innerWidth <= 768,
    mobilePanel: 'whiteboard',
    // Participants
    participants: [],
    // Sidebars open on mobile
    leftOpen: false,
    rightOpen: false,
  };

  // ---- Simulated Participants ----
  const participants = [
    { id: 'self', name: '我', role: '老师', avatar: '👤', status: 'online', self: true },
    { id: 'p1', name: '张明', role: '学生', avatar: '👨‍🎓', status: 'online' },
    { id: 'p2', name: '李华', role: '学生', avatar: '👩‍🎓', status: 'online' },
    { id: 'p3', name: '王芳', role: '学生', avatar: '👩‍💻', status: 'away' },
    { id: 'p4', name: '赵强', role: '学生', avatar: '👨‍💻', status: 'online' },
    { id: 'p5', name: '刘洋', role: '学生', avatar: '🧑‍🎓', status: 'offline' },
    { id: 'p6', name: '陈静', role: '听课教师', avatar: '👩‍🏫', status: 'online' },
  ];
  state.participants = participants;

  // ---- Emoji Data ----
  const emojiCategories = [
    { name: '表情', emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🥴','😇','🥺','🤠','🤡','🥳','🥸','😈','👿','👹','💀','☠️','👻','👽','🤖'] },
    { name: '手势', emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','💪','🦾','🦿'] },
    { name: '符号', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','⭐','🌟','✨','⚡','🔥','💥','💯','✅','❌','⭕','🚀','💡','📌','📎','🔒','🔑','🎨','📝','📖','📚','🎓','🏆','🎯','🎪','🎭','🎬','🎮','🎵'] },
    { name: '自然', emojis: ['🌸','🌺','🌻','🌹','🌷','🌼','🌱','🌿','☘️','🍀','🍁','🍂','🍃','🌈','☀️','🌙','⭐','🦋','🐝','🐞','🐢','🐱','🐶','🐼','🐨','🦊','🐰','🦁','🐸','笑','👍'] },
  ];

  const allEmojis = emojiCategories.flatMap(c => c.emojis);

  // ---- DOM Refs ----
  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const canvas         = $('#whiteboard');
  const ctx            = canvas.getContext('2d');
  const recordBtn      = $('#recordBtn');
  const recordIndicator = $('#recordingIndicator');
  const recTime        = $('#recTime');
  const screenShareBtn = $('#screenShareBtn');
  const shareOverlay   = $('#screenShareOverlay');
  const shareSelectionBox = $('#shareSelectionBox');
  const shareCancelBtn = $('#shareCancelBtn');
  const sharedAreaFrame = $('#sharedAreaFrame');
  const sharedAreaStop = $('#sharedAreaStop');
  const colorPicker    = $('#colorPicker');
  const sizeSlider     = $('#sizeSlider');
  const clearBtn       = $('#clearBtn');
  const undoBtn        = $('#undoBtn');
  const downloadBtn    = $('#downloadBtn');
  const textInput      = $('#textInput');
  const chatInput      = $('#chatInput');
  const sendBtn        = $('#sendBtn');
  const emojiBtn       = $('#emojiBtn');
  const emojiPicker    = $('#emojiPicker');
  const emojiGrid      = $('#emojiGrid');
  const emojiSearch    = $('#emojiSearch');
  const chatMessages   = $('#chatMessages');
  const participantsList = $('#participantsList');
  const participantCount = $('#participantCount');
  const chatBadge      = $('#chatBadge');
  const mobileTabs     = $('#mobileTabs');
  const mobileMenuBtn  = $('#mobileMenuBtn');
  const participantsPanel = $('#participantsPanel');
  const chatPanel      = $('#chatPanel');

  // ---- Initialization ----
  function init() {
    resizeCanvas();
    renderParticipants();
    renderEmojiGrid();
    addSystemMessage('欢迎来到虚拟教室！');
    addSystemMessage(`${participants.length} 位参与者已加入课堂`);
    saveCanvasState();
    bindEvents();
  }

  // ---- Canvas ----
  function resizeCanvas() {
    const container = $('#whiteboardContainer');
    const rect = container.getBoundingClientRect();
    const toolbarH = $('#whiteboardToolbar').offsetHeight;

    // Save current content
    let imgData = null;
    if (canvas.width > 0 && canvas.height > 0) {
      imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    canvas.width = rect.width;
    canvas.height = rect.height - toolbarH;

    // Restore content
    if (imgData) {
      ctx.putImageData(imgData, 0, 0);
    }

    // Fill white background on first load
    if (state.historyIndex === -1) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function saveCanvasState() {
    // Trim future states
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(canvas.toDataURL());
    state.historyIndex = state.history.length - 1;
    // Keep max 50 states
    if (state.history.length > 50) {
      state.history.shift();
      state.historyIndex--;
    }
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = state.history[state.historyIndex];
    }
  }

  function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
  }

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(e) {
    e.preventDefault();
    if (state.tool === 'text') {
      showTextInput(e);
      return;
    }

    state.isDrawing = true;
    const pos = getCanvasPos(e);
    state.lastPos = pos;
    state.shapeStart = pos;

    if (state.tool === 'pen' || state.tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (state.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = state.lineWidth * 4;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.lineWidth;
      }
    }

    // Save canvas state before shape drawing for preview
    if (['line', 'rect', 'circle'].includes(state.tool)) {
      state.snapshotData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  }

  function draw(e) {
    if (!state.isDrawing) return;
    e.preventDefault();
    const pos = getCanvasPos(e);

    if (state.tool === 'pen' || state.tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (['line', 'rect', 'circle'].includes(state.tool)) {
      // Restore snapshot and draw preview
      ctx.putImageData(state.snapshotData, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = state.color;
      ctx.lineWidth = state.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const s = state.shapeStart;
      ctx.beginPath();

      if (state.tool === 'line') {
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(pos.x, pos.y);
      } else if (state.tool === 'rect') {
        ctx.rect(s.x, s.y, pos.x - s.x, pos.y - s.y);
      } else if (state.tool === 'circle') {
        const rx = Math.abs(pos.x - s.x) / 2;
        const ry = Math.abs(pos.y - s.y) / 2;
        const cx = s.x + (pos.x - s.x) / 2;
        const cy = s.y + (pos.y - s.y) / 2;
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      }
      ctx.stroke();
    }

    state.lastPos = pos;
  }

  function endDraw(e) {
    if (!state.isDrawing) return;
    state.isDrawing = false;
    ctx.globalCompositeOperation = 'source-over';
    saveCanvasState();
  }

  // Text tool
  function showTextInput(e) {
    const pos = getCanvasPos(e);
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;

    textInput.classList.remove('hidden');
    textInput.style.left = (touch.clientX - rect.left) + 'px';
    textInput.style.top = (touch.clientY - rect.top - $('#whiteboardToolbar').offsetHeight) + 'px';
    textInput.value = '';
    textInput.focus();
  }

  function commitText() {
    const text = textInput.value.trim();
    if (text) {
      const style = getComputedStyle(textInput);
      const fontSize = parseInt(style.fontSize);
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif`;
      ctx.fillStyle = state.color;
      ctx.textBaseline = 'top';

      const lines = text.split('\n');
      const lineHeight = fontSize * 1.4;
      const x = parseInt(textInput.style.left);
      const y = parseInt(textInput.style.top);

      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + i * lineHeight);
      });

      saveCanvasState();
    }
    textInput.classList.add('hidden');
  }

  // ---- Participants ----
  function renderParticipants() {
    participantCount.textContent = participants.length;
    participantsList.innerHTML = participants.map(p => {
      const avatarColors = {
        '老师': '#4f46e5',
        '学生': '#0891b2',
        '听课教师': '#059669',
      };
      const bgColor = avatarColors[p.role] || '#6366f1';
      return `
        <div class="participant-item" data-id="${p.id}">
          <div class="participant-avatar" style="background:${bgColor}">
            ${p.avatar}
            <span class="participant-status ${p.status}"></span>
          </div>
          <div class="participant-info">
            <div class="participant-name">${p.name}${p.self ? ' (你)' : ''}</div>
            <div class="participant-role ${p.role === '老师' ? 'teacher' : ''}">${p.role}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---- Chat ----
  function addSystemMessage(text) {
    const msg = { id: Date.now(), type: 'system', text, time: new Date() };
    state.messages.push(msg);
    renderChatMessage(msg);
  }

  function addChatMessage(from, text) {
    const p = participants.find(pp => pp.id === from) || participants[0];
    const msg = { id: Date.now(), type: 'user', from, name: p.name, avatar: p.avatar, text, time: new Date(), self: from === 'self' };
    state.messages.push(msg);
    renderChatMessage(msg);
    scrollChatToBottom();

    // Update badge if chat not visible on mobile
    if (state.isMobile && state.mobilePanel !== 'chat') {
      state.unreadCount++;
      chatBadge.textContent = state.unreadCount;
      chatBadge.classList.remove('hidden');
    }
  }

  function renderChatMessage(msg) {
    const div = document.createElement('div');
    div.className = `chat-msg ${msg.type}${msg.self ? ' self' : ''}`;

    if (msg.type === 'system') {
      div.innerHTML = `<div class="chat-msg-bubble">${escapeHtml(msg.text)}</div>`;
    } else {
      const time = msg.time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      div.innerHTML = `
        <div class="chat-msg-header">
          <span class="chat-msg-name" style="color:${msg.self ? '#a78bfa' : '#60a5fa'}">${escapeHtml(msg.name)}</span>
          <span class="chat-msg-time">${time}</span>
        </div>
        <div class="chat-msg-bubble">${linkifyEmojis(escapeHtml(msg.text))}</div>
      `;
    }

    chatMessages.appendChild(div);
    scrollChatToBottom();
  }

  function scrollChatToBottom() {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addChatMessage('self', text);
    chatInput.value = '';
    chatInput.focus();

    // Simulate response
    const others = participants.filter(p => !p.self && p.status === 'online');
    if (others.length > 0 && Math.random() > 0.3) {
      const responder = others[Math.floor(Math.random() * others.length)];
      const responses = ['好的！', '明白了 👍', '老师，这个问题我不太懂', '谢谢老师！', '可以做一下练习吗？', '太棒了！', '我想再问一个问题', '记下了 ✨', '老师讲解得很清楚', '👍👍👍'];
      setTimeout(() => {
        addChatMessage(responder.id, responses[Math.floor(Math.random() * responses.length)]);
      }, 1500 + Math.random() * 2000);
    }
  }

  // ---- Emoji Picker ----
  function renderEmojiGrid(filter = '') {
    const filtered = filter
      ? allEmojis.filter(e => !filter || e.includes(filter))
      : emojiCategories.flatMap(c => c.emojis);
    emojiGrid.innerHTML = filtered.map(e =>
      `<span class="emoji-item" data-emoji="${e}">${e}</span>`
    ).join('');
  }

  function toggleEmojiPicker() {
    const visible = !emojiPicker.classList.contains('hidden');
    emojiPicker.classList.toggle('hidden');
    emojiBtn.classList.toggle('active', !visible);
    if (!visible) {
      emojiSearch.value = '';
      renderEmojiGrid();
    }
  }

  // ---- Recording ----
  function toggleRecording() {
    state.isRecording = !state.isRecording;
    recordBtn.classList.toggle('active', state.isRecording);
    recordIndicator.classList.toggle('hidden', !state.isRecording);
    recordIndicator.style.display = state.isRecording ? 'flex' : '';

    if (state.isRecording) {
      state.recordStartTime = Date.now();
      state.recordTimer = setInterval(updateRecTime, 1000);
      addSystemMessage('课堂录制已开始');
    } else {
      clearInterval(state.recordTimer);
      addSystemMessage('课堂录制已停止');
    }
  }

  function updateRecTime() {
    const elapsed = Math.floor((Date.now() - state.recordStartTime) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    recTime.textContent = `${mm}:${ss}`;
  }

  // ---- Screen Share ----
  function startShareSelection() {
    state.isSelectingShare = true;
    shareOverlay.classList.remove('hidden');
    shareSelectionBox.style.display = 'none';
    $('#shareHint').classList.remove('hidden');
  }

  function cancelShareSelection() {
    state.isSelectingShare = false;
    state.shareStart = null;
    shareOverlay.classList.add('hidden');
    shareSelectionBox.style.display = 'none';
  }

  function handleShareMouseDown(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    state.shareStart = { x: clientX, y: clientY };
    shareSelectionBox.style.display = 'block';
    $('#shareHint').classList.add('hidden');
  }

  function handleShareMouseMove(e) {
    if (!state.shareStart) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = Math.min(state.shareStart.x, clientX);
    const y = Math.min(state.shareStart.y, clientY);
    const w = Math.abs(clientX - state.shareStart.x);
    const h = Math.abs(clientY - state.shareStart.y);

    shareSelectionBox.style.left = x + 'px';
    shareSelectionBox.style.top = y + 'px';
    shareSelectionBox.style.width = w + 'px';
    shareSelectionBox.style.height = h + 'px';
  }

  function handleShareMouseUp(e) {
    if (!state.shareStart) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    const x = Math.min(state.shareStart.x, clientX);
    const y = Math.min(state.shareStart.y, clientY);
    const w = Math.abs(clientX - state.shareStart.x);
    const h = Math.abs(clientY - state.shareStart.y);

    state.shareStart = null;

    if (w < 30 || h < 30) {
      shareSelectionBox.style.display = 'none';
      return;
    }

    // Start sharing
    state.isSharing = true;
    state.shareRect = { x, y, w, h };

    shareOverlay.classList.add('hidden');

    sharedAreaFrame.classList.remove('hidden');
    sharedAreaFrame.style.left = x + 'px';
    sharedAreaFrame.style.top = y + 'px';
    sharedAreaFrame.style.width = w + 'px';
    sharedAreaFrame.style.height = h + 'px';

    screenShareBtn.classList.add('active');
    addSystemMessage('屏幕共享已开始');
  }

  function stopSharing() {
    state.isSharing = false;
    state.shareRect = null;
    sharedAreaFrame.classList.add('hidden');
    screenShareBtn.classList.remove('active');
    addSystemMessage('屏幕共享已停止');
  }

  // ---- Mobile Navigation ----
  function handleMobileTab(panel) {
    state.mobilePanel = panel;
    $$('.mobile-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === panel));

    // Show/hide panels
    const isMobileView = window.innerWidth <= 768;
    if (isMobileView) {
      participantsPanel.classList.remove('show');
      chatPanel.classList.remove('show');
      removeOverlay();

      if (panel === 'participants') {
        participantsPanel.classList.add('show');
        addOverlay();
      } else if (panel === 'chat') {
        chatPanel.classList.add('show');
        state.unreadCount = 0;
        chatBadge.classList.add('hidden');
        addOverlay();
      }
    }
  }

  function addOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }
    overlay.addEventListener('click', closeSidebars);
  }

  function removeOverlay() {
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.removeEventListener('click', closeSidebars);
      overlay.remove();
    }
  }

  function closeSidebars() {
    participantsPanel.classList.remove('show');
    chatPanel.classList.remove('show');
    removeOverlay();
    // Reset to whiteboard tab
    state.mobilePanel = 'whiteboard';
    $$('.mobile-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === 'whiteboard'));
  }

  function handleLeave() {
    if (confirm('确定要离开课堂吗？')) {
      addSystemMessage('你已离开课堂');
      // Reset UI
      if (state.isRecording) toggleRecording();
      if (state.isSharing) stopSharing();
      setTimeout(() => window.location.reload(), 500);
    }
  }

  // ---- Utilities ----
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function linkifyEmojis(text) {
    // Make emoji characters slightly larger
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
      m => `<span style="font-size:1.2em">${m}</span>`);
  }

  // ---- Event Binding ----
  function bindEvents() {
    // Canvas drawing
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    // Tools
    $$('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.tool = btn.dataset.tool;
        canvas.style.cursor = state.tool === 'eraser' ? 'cell' : (state.tool === 'text' ? 'text' : 'crosshair');
      });
    });

    // Colors
    colorPicker.addEventListener('input', (e) => {
      state.color = e.target.value;
      $$('.color-dot').forEach(d => d.classList.remove('active'));
    });

    $$('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const c = dot.dataset.color;
        state.color = c;
        colorPicker.value = c;
        $$('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    });

    // Size
    sizeSlider.addEventListener('input', (e) => {
      state.lineWidth = parseInt(e.target.value);
    });

    // Undo / Clear / Download
    undoBtn.addEventListener('click', undo);
    clearBtn.addEventListener('click', clearCanvas);
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = '白板-' + new Date().toISOString().slice(0, 10) + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });

    // Text input
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitText();
      }
      if (e.key === 'Escape') {
        textInput.classList.add('hidden');
      }
    });
    textInput.addEventListener('blur', commitText);

    // Chat
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
    sendBtn.addEventListener('click', sendMessage);
    emojiBtn.addEventListener('click', toggleEmojiPicker);

    // Emoji grid delegation
    emojiGrid.addEventListener('click', (e) => {
      const item = e.target.closest('.emoji-item');
      if (item) {
        chatInput.value += item.dataset.emoji;
        chatInput.focus();
      }
    });

    // Emoji search
    emojiSearch.addEventListener('input', (e) => {
      renderEmojiGrid(e.target.value);
    });

    // Recording
    recordBtn.addEventListener('click', toggleRecording);

    // Screen Share
    screenShareBtn.addEventListener('click', () => {
      if (state.isSharing) {
        stopSharing();
      } else {
        startShareSelection();
      }
    });
    shareCancelBtn.addEventListener('click', cancelShareSelection);
    sharedAreaStop.addEventListener('click', stopSharing);

    shareOverlay.addEventListener('mousedown', handleShareMouseDown);
    shareOverlay.addEventListener('mousemove', handleShareMouseMove);
    shareOverlay.addEventListener('mouseup', handleShareMouseUp);
    shareOverlay.addEventListener('touchstart', handleShareMouseDown, { passive: false });
    shareOverlay.addEventListener('touchmove', handleShareMouseMove, { passive: false });
    shareOverlay.addEventListener('touchend', handleShareMouseUp);

    // Mobile
    mobileTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.mobile-tab');
      if (tab) handleMobileTab(tab.dataset.panel);
    });

    mobileMenuBtn.addEventListener('click', () => {
      if (participantsPanel.classList.contains('show')) {
        closeSidebars();
      } else {
        closeSidebars();
        handleMobileTab('participants');
      }
    });

    // Leave
    $('#leaveBtn').addEventListener('click', handleLeave);

    // Resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        state.isMobile = window.innerWidth <= 768;
        resizeCanvas();
        // Close mobile panels on resize to desktop
        if (!state.isMobile) {
          closeSidebars();
          participantsPanel.classList.remove('show');
          chatPanel.classList.remove('show');
        }
      }, 150);
    });

    // Simulate participant activity
    simulateActivity();
  }

  // ---- Simulated Activity ----
  function simulateActivity() {
    // Occasionally change participant status
    setInterval(() => {
      const onlineP = participants.filter(p => !p.self && p.status === 'online');
      const awayP = participants.filter(p => !p.self && p.status === 'away');
      const offlineP = participants.filter(p => !p.self && p.status === 'offline');

      if (Math.random() > 0.7 && onlineP.length > 1) {
        const p = onlineP[Math.floor(Math.random() * onlineP.length)];
        p.status = 'away';
        renderParticipants();
        addSystemMessage(`${p.name} 暂时离开`);
      } else if (Math.random() > 0.8 && awayP.length > 0) {
        const p = awayP[Math.floor(Math.random() * awayP.length)];
        p.status = 'online';
        renderParticipants();
        addSystemMessage(`${p.name} 已回来`);
      }
    }, 15000);

    // Simulate chat messages
    const demoMessages = [
      { from: 'p1', text: '老师好！' },
      { from: 'p2', text: '今天学什么内容？😊' },
      { from: 'p4', text: '准备好了 ✏️' },
      { from: 'p6', text: '陈老师好，我来旁听的' },
      { from: 'p1', text: '这节是关于函数的吧' },
      { from: 'p2', text: '太好了！🌟' },
    ];

    let msgIndex = 0;
    const msgTimer = setInterval(() => {
      if (msgIndex < demoMessages.length) {
        const dm = demoMessages[msgIndex];
        addChatMessage(dm.from, dm.text);
        msgIndex++;
      } else {
        clearInterval(msgTimer);
      }
    }, 3000);

    // Delay first messages a bit
    setTimeout(() => {}, 2000);
  }

  // ---- Start ----
  document.addEventListener('DOMContentLoaded', init);
})();
