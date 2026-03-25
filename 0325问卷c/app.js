/* ===================================================
   在线问卷构建工具 - 主应用逻辑
   =================================================== */

// =================== 全局状态 ===================
let currentSurvey = null;
let currentFillIndex = 0;
let fillAnswers = {};
let timerInterval = null;
let timeRemaining = 0;

// =================== 工具函数 ===================
function generateId() {
  return 'q' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; }, 2500);
  setTimeout(() => toast.remove(), 2800);
}

function getSurveys() {
  return JSON.parse(localStorage.getItem('surveys') || '{}');
}

function saveSurveys(surveys) {
  localStorage.setItem('surveys', JSON.stringify(surveys));
}

function getResponses() {
  return JSON.parse(localStorage.getItem('responses') || '{}');
}

function saveResponses(responses) {
  localStorage.setItem('responses', JSON.stringify(responses));
}

// =================== 导航 ===================
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');

  if (page === 'home') renderRecentSurveys();
  if (page === 'results') populateResultsSelect();
  if (page === 'builder' && !currentSurvey) createNewSurvey();
}

function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// =================== 首页 ===================
function renderRecentSurveys() {
  const surveys = getSurveys();
  const container = document.getElementById('recentSurveys');
  const keys = Object.keys(surveys);
  if (keys.length === 0) {
    container.innerHTML = '';
    return;
  }
  let html = '<h2>我的问卷</h2>';
  keys.reverse().forEach(id => {
    const s = surveys[id];
    html += `
      <div class="survey-card">
        <div class="survey-card-info">
          <h3>${escapeHtml(s.title || '未命名问卷')}</h3>
          <p>${(s.questions || []).length} 道题 · 创建于 ${new Date(s.createdAt).toLocaleDateString('zh-CN')}</p>
        </div>
        <div class="survey-card-actions">
          <button class="btn btn-sm btn-primary" onclick="editSurvey('${id}')">编辑</button>
          <button class="btn btn-sm btn-outline" onclick="startFilling('${id}')">填写</button>
          <button class="btn btn-sm btn-secondary" onclick="shareSurveyById('${id}')">分享</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSurvey('${id}')">删除</button>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =================== 创建 / 编辑问卷 ===================
function createNewSurvey() {
  currentSurvey = {
    id: generateId(),
    title: '',
    description: '',
    questions: [],
    enableTimer: false,
    timeLimit: 10,
    createdAt: Date.now()
  };
  renderBuilder();
  navigateTo('builder');
}

function editSurvey(id) {
  const surveys = getSurveys();
  if (!surveys[id]) { showToast('问卷不存在', 'error'); return; }
  currentSurvey = JSON.parse(JSON.stringify(surveys[id]));
  renderBuilder();
  navigateTo('builder');
}

function deleteSurvey(id) {
  if (!confirm('确定要删除此问卷吗？所有回答数据也将被删除。')) return;
  const surveys = getSurveys();
  delete surveys[id];
  saveSurveys(surveys);
  const responses = getResponses();
  delete responses[id];
  saveResponses(responses);
  renderRecentSurveys();
  showToast('问卷已删除', 'info');
}

// =================== Builder 渲染 ===================
function renderBuilder() {
  if (!currentSurvey) return;
  document.getElementById('surveyTitle').value = currentSurvey.title;
  document.getElementById('surveyDesc').value = currentSurvey.description || '';
  document.getElementById('enableTimer').checked = currentSurvey.enableTimer;
  document.getElementById('timeLimit').value = currentSurvey.timeLimit || 10;
  document.getElementById('timerConfig').style.display = currentSurvey.enableTimer ? 'flex' : 'none';
  renderQuestionList();
}

function renderQuestionList() {
  const container = document.getElementById('questionList');
  const questions = currentSurvey.questions;
  if (questions.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>还没有问题，点击下方按钮添加第一个问题</p></div>';
    return;
  }
  let html = '';
  questions.forEach((q, i) => {
    html += renderQuestionCard(q, i);
  });
  container.innerHTML = html;
  // 绑定 slider 值显示
  questions.forEach((q, i) => {
    if (q.type === 'slider') {
      const slider = document.getElementById(`sv-${q.id}`);
      const val = document.getElementById(`sv-val-${q.id}`);
      if (slider && val) {
        slider.oninput = () => { val.textContent = slider.value; };
      }
    }
  });
}

function renderQuestionCard(q, index) {
  const typeLabels = { radio: '单选题', checkbox: '多选题', text: '文本题', slider: '滑块题' };
  let body = '';

  if (q.type === 'radio' || q.type === 'checkbox') {
    body = `<div class="option-list" id="opts-${q.id}">`;
    q.options.forEach((opt, oi) => {
      body += `
        <div class="option-item">
          <span style="color:var(--text-secondary);font-size:.85rem;min-width:20px">${oi + 1}.</span>
          <input type="text" value="${escapeHtml(opt)}" onchange="updateOption('${q.id}',${oi},this.value)" placeholder="选项 ${oi + 1}">
          ${q.options.length > 1 ? `<button class="btn-icon btn-sm" onclick="removeOption('${q.id}',${oi})" title="删除选项">✕</button>` : ''}
        </div>`;
    });
    body += `</div>
      <button class="add-rule-btn" onclick="addOption('${q.id}')">+ 添加选项</button>`;
  } else if (q.type === 'text') {
    body = `<input type="text" class="question-input" value="${escapeHtml(q.placeholder || '')}" onchange="updatePlaceholder('${q.id}',this.value)" placeholder="占位提示文本（可选）">`;
  } else if (q.type === 'slider') {
    body = `
      <div class="slider-config">
        <label>最小值：<input type="number" class="input-sm" value="${q.min}" onchange="updateSliderProp('${q.id}','min',+this.value)"></label>
        <label>最大值：<input type="number" class="input-sm" value="${q.max}" onchange="updateSliderProp('${q.id}','max',+this.value)"></label>
        <label>步长：<input type="number" class="input-sm" value="${q.step}" min="1" onchange="updateSliderProp('${q.id}','step',+this.value)"></label>
      </div>
      <input type="range" id="sv-${q.id}" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.min}" style="width:100%;accent-color:var(--primary)" disabled>
      <div class="slider-value" id="sv-val-${q.id}">${q.min}</div>`;
  }

  // 分支逻辑
  let branchHtml = '';
  if (q.type === 'radio') {
    branchHtml = `
      <div class="branch-section">
        <label class="toggle-label">
          <input type="checkbox" ${q.branching ? 'checked' : ''} onchange="toggleBranch('${q.id}',this.checked)">
          <span>启用分支逻辑</span>
        </label>
        ${q.branching ? renderBranchRules(q, index) : ''}
      </div>`;
  }

  return `
    <div class="question-card" id="qcard-${q.id}" draggable="true" ondragstart="dragStart(event,${index})" ondragover="dragOver(event)" ondrop="drop(event,${index})">
      <div class="question-card-header">
        <div>
          <span class="question-number">第 ${index + 1} 题</span>
          <span class="question-type-badge">${typeLabels[q.type]}</span>
        </div>
        <div class="question-card-actions">
          ${index > 0 ? `<button class="btn-icon btn-sm btn-outline" onclick="moveQuestion(${index},-1)" title="上移">↑</button>` : ''}
          ${index < currentSurvey.questions.length - 1 ? `<button class="btn-icon btn-sm btn-outline" onclick="moveQuestion(${index},1)" title="下移">↓</button>` : ''}
          <button class="btn-icon btn-sm btn-danger" onclick="removeQuestion(${index})" title="删除">✕</button>
        </div>
      </div>
      <input type="text" class="question-input" value="${escapeHtml(q.text)}" onchange="updateQuestionText('${q.id}',this.value)" placeholder="输入问题内容...">
      ${q.type === 'checkbox' ? `<label style="font-size:.85rem;color:var(--text-secondary)"><input type="checkbox" ${q.required ? 'checked' : ''} onchange="toggleRequired('${q.id}',this.checked)" style="margin-right:4px">必填</label>` : ''}
      ${body}
      ${branchHtml}
    </div>`;
}

function renderBranchRules(q, index) {
  const questions = currentSurvey.questions;
  const laterQuestions = questions.slice(index + 1);
  let html = '<div class="branch-rules">';
  q.options.forEach((opt, oi) => {
    html += `
      <div class="branch-rule">
        <span>选项 "${escapeHtml(opt)}" →</span>
        <select onchange="updateBranch('${q.id}',${oi},this.value)">
          <option value="-1">下一题（默认）</option>
          <option value="-2">结束问卷</option>
          ${laterQuestions.map((lq, lqi) => `<option value="${index + 1 + lqi}" ${q.branchMap && q.branchMap[oi] == (index + 1 + lqi) ? 'selected' : ''}>跳到第 ${index + 2 + lqi} 题</option>`).join('')}
        </select>
      </div>`;
  });
  html += '</div>';
  return html;
}

// =================== Builder 操作 ===================
function addQuestion(type) {
  const q = {
    id: generateId(),
    type,
    text: '',
    required: true,
    branching: false,
    branchMap: {}
  };
  if (type === 'radio' || type === 'checkbox') {
    q.options = ['选项 1', '选项 2'];
  }
  if (type === 'slider') {
    q.min = 0;
    q.max = 100;
    q.step = 1;
  }
  if (type === 'text') {
    q.placeholder = '请输入您的回答...';
  }
  currentSurvey.questions.push(q);
  renderQuestionList();
  // 滚动到底部
  const list = document.getElementById('questionList');
  list.scrollTop = list.scrollHeight;
}

function removeQuestion(index) {
  currentSurvey.questions.splice(index, 1);
  renderQuestionList();
}

function moveQuestion(index, direction) {
  const arr = currentSurvey.questions;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= arr.length) return;
  [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
  renderQuestionList();
}

function updateQuestionText(id, value) {
  const q = currentSurvey.questions.find(q => q.id === id);
  if (q) q.text = value;
}

function updateOption(id, index, value) {
  const q = currentSurvey.questions.find(q => q.id === id);
  if (q) q.options[index] = value;
}

function addOption(id) {
  const q = currentSurvey.questions.find(q => q.id === id);
  if (q) {
    q.options.push(`选项 ${q.options.length + 1}`);
    renderQuestionList();
  }
}

function removeOption(id, index) {
  const q = currentSurvey.questions.find(q => q.id === id);
  if (q && q.options.length > 1) {
    q.options.splice(index, 1);
    renderQuestionList();
  }
}

function updatePlaceholder(id, value) {
  const q = currentSurvey.questions.find(q => q.id === id);
  if (q) q.placeholder = value;
}

function updateSliderProp(id, prop, value) {
  const q = currentSurvey.questions.find(q => q.id === id);
  if (q) { q[prop] = value; renderQuestionList(); }
}

function toggleRequired(id, checked) {
  const q = currentSurvey.questions.find(q => q.id === id);
  if (q) q.required = checked;
}

function toggleBranch(id, checked) {
  const q = currentSurvey.questions.find(q => q.id === id);
  if (q) {
    q.branching = checked;
    if (checked && !q.branchMap) q.branchMap = {};
    renderQuestionList();
  }
}

function updateBranch(id, optIndex, value) {
  const q = currentSurvey.questions.find(q => q.id === id);
  if (q) {
    if (!q.branchMap) q.branchMap = {};
    q.branchMap[optIndex] = parseInt(value);
  }
}

// 拖拽排序
let draggedIndex = null;
function dragStart(e, index) { draggedIndex = index; e.dataTransfer.effectAllowed = 'move'; }
function dragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function drop(e, targetIndex) {
  e.preventDefault();
  if (draggedIndex === null || draggedIndex === targetIndex) return;
  const arr = currentSurvey.questions;
  const [item] = arr.splice(draggedIndex, 1);
  arr.splice(targetIndex, 0, item);
  draggedIndex = null;
  renderQuestionList();
}

// =================== 保存 / 发布 / 分享 ===================
function syncBuilderToSurvey() {
  currentSurvey.title = document.getElementById('surveyTitle').value.trim();
  currentSurvey.description = document.getElementById('surveyDesc').value.trim();
  currentSurvey.enableTimer = document.getElementById('enableTimer').checked;
  currentSurvey.timeLimit = parseInt(document.getElementById('timeLimit').value) || 10;
}

function saveSurvey() {
  syncBuilderToSurvey();
  const surveys = getSurveys();
  surveys[currentSurvey.id] = currentSurvey;
  saveSurveys(surveys);
  showToast('问卷已保存', 'success');
}

function publishSurvey() {
  syncBuilderToSurvey();
  if (!currentSurvey.title) { showToast('请输入问卷标题', 'error'); return; }
  if (currentSurvey.questions.length === 0) { showToast('请添加至少一个问题', 'error'); return; }
  const surveys = getSurveys();
  surveys[currentSurvey.id] = currentSurvey;
  saveSurveys(surveys);
  showToast('问卷已发布！', 'success');
  shareSurvey();
}

function shareSurvey() {
  syncBuilderToSurvey();
  const surveys = getSurveys();
  surveys[currentSurvey.id] = currentSurvey;
  saveSurveys(surveys);
  const data = btoa(unescape(encodeURIComponent(JSON.stringify({
    id: currentSurvey.id,
    title: currentSurvey.title,
    description: currentSurvey.description,
    questions: currentSurvey.questions,
    enableTimer: currentSurvey.enableTimer,
    timeLimit: currentSurvey.timeLimit,
    createdAt: currentSurvey.createdAt
  }))));
  const url = window.location.origin + window.location.pathname + '#survey=' + data;
  document.getElementById('shareUrl').value = url;
  document.getElementById('shareModal').style.display = 'flex';
}

function shareSurveyById(id) {
  editSurvey(id);
  setTimeout(() => shareSurvey(), 100);
}

function closeShareModal() {
  document.getElementById('shareModal').style.display = 'none';
}

function copyShareUrl() {
  const input = document.getElementById('shareUrl');
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    showToast('链接已复制到剪贴板', 'success');
  }).catch(() => {
    document.execCommand('copy');
    showToast('链接已复制', 'success');
  });
}

function loadFromURL() {
  const url = prompt('请粘贴问卷链接：');
  if (!url) return;
  try {
    const hash = url.split('#survey=')[1];
    if (!hash) throw new Error('无效链接');
    const data = JSON.parse(decodeURIComponent(escape(atob(hash))));
    const surveys = getSurveys();
    surveys[data.id] = data;
    saveSurveys(surveys);
    editSurvey(data.id);
    showToast('问卷已导入', 'success');
  } catch (e) {
    showToast('无效的问卷链接', 'error');
  }
}

// =================== 预览 ===================
function previewSurvey() {
  syncBuilderToSurvey();
  if (currentSurvey.questions.length === 0) {
    showToast('请先添加问题', 'error');
    return;
  }
  const modal = document.getElementById('previewModal');
  const body = document.getElementById('previewBody');
  let html = `<h2 style="margin-bottom:12px">${escapeHtml(currentSurvey.title || '未命名问卷')}</h2>`;
  if (currentSurvey.description) html += `<p style="color:var(--text-secondary);margin-bottom:20px">${escapeHtml(currentSurvey.description)}</p>`;

  currentSurvey.questions.forEach((q, i) => {
    html += `<div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border)">
      <h3 style="margin-bottom:12px">${i + 1}. ${escapeHtml(q.text || '(未输入问题)')}</h3>`;
    if (q.type === 'radio') {
      q.options.forEach(opt => {
        html += `<div class="fill-option" onclick="this.querySelector('input').checked=true">
          <input type="radio" name="preview-${q.id}"> ${escapeHtml(opt)}</div>`;
      });
    } else if (q.type === 'checkbox') {
      q.options.forEach(opt => {
        html += `<div class="fill-option" onclick="const cb=this.querySelector('input');cb.checked=!cb.checked">
          <input type="checkbox"> ${escapeHtml(opt)}</div>`;
      });
    } else if (q.type === 'text') {
      html += `<textarea class="fill-textarea" placeholder="${escapeHtml(q.placeholder || '')}" disabled></textarea>`;
    } else if (q.type === 'slider') {
      html += `<div style="text-align:center"><input type="range" class="fill-slider" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.min}" disabled><div class="slider-value">${q.min}</div></div>`;
    }
    html += '</div>';
  });

  body.innerHTML = html;
  modal.style.display = 'flex';
}

function closePreviewModal() {
  document.getElementById('previewModal').style.display = 'none';
}

// =================== 问卷填写 ===================
function startFilling(surveyId) {
  const surveys = getSurveys();
  const survey = surveys[surveyId];
  if (!survey) { showToast('问卷不存在', 'error'); return; }

  currentSurvey = survey;
  currentFillIndex = 0;
  fillAnswers = {};

  // 检查是否有暂存进度
  const saved = localStorage.getItem('progress_' + surveyId);
  if (saved) {
    try {
      const progress = JSON.parse(saved);
      if (confirm('检测到暂存的填写进度，是否恢复？')) {
        fillAnswers = progress.answers || {};
        currentFillIndex = progress.currentIndex || 0;
      }
    } catch (e) { /* ignore */ }
  }

  document.getElementById('fillTitle').textContent = survey.title || '未命名问卷';
  document.getElementById('fillDesc').textContent = survey.description || '';

  navigateTo('fill');
  setupTimer();
  renderFillQuestion();
  updateFillProgress();
}

function renderFillQuestion() {
  const questions = currentSurvey.questions;
  const body = document.getElementById('fillBody');

  if (currentFillIndex < 0 || currentFillIndex >= questions.length) {
    body.innerHTML = '<div class="fill-question"><h2>问卷已完成，感谢您的参与！</h2></div>';
    return;
  }

  const q = questions[currentFillIndex];
  let html = `<div class="fill-question"><h2>${currentFillIndex + 1}. ${escapeHtml(q.text)}${q.required !== false ? '<span class="required-mark">*</span>' : ''}</h2>`;

  const saved = fillAnswers[q.id];

  if (q.type === 'radio') {
    q.options.forEach((opt, i) => {
      const checked = saved === i;
      html += `
        <div class="fill-option ${checked ? 'selected' : ''}" onclick="selectRadio('${q.id}',${i},this)">
          <input type="radio" name="fill-${q.id}" ${checked ? 'checked' : ''}>
          <span>${escapeHtml(opt)}</span>
        </div>`;
    });
  } else if (q.type === 'checkbox') {
    const checkedArr = saved || [];
    q.options.forEach((opt, i) => {
      const checked = checkedArr.includes(i);
      html += `
        <div class="fill-option ${checked ? 'selected' : ''}" onclick="toggleCheckbox('${q.id}',${i},this)">
          <input type="checkbox" ${checked ? 'checked' : ''}>
          <span>${escapeHtml(opt)}</span>
        </div>`;
    });
  } else if (q.type === 'text') {
    html += `<textarea class="fill-textarea" placeholder="${escapeHtml(q.placeholder || '请输入您的回答...')}" oninput="fillAnswers['${q.id}']=this.value">${escapeHtml(saved || '')}</textarea>`;
  } else if (q.type === 'slider') {
    const val = saved !== undefined ? saved : q.min;
    html += `
      <input type="range" class="fill-slider" min="${q.min}" max="${q.max}" step="${q.step}" value="${val}" oninput="fillAnswers['${q.id}']=+this.value;document.getElementById('fsv-${q.id}').textContent=this.value">
      <div class="slider-labels"><span>${q.min}</span><span>${q.max}</span></div>
      <div class="slider-value" id="fsv-${q.id}">${val}</div>`;
  }

  html += '</div>';
  body.innerHTML = html;

  // 导航按钮
  document.getElementById('btnPrev').style.display = currentFillIndex > 0 ? 'inline-flex' : 'none';
  const isLast = isLastQuestion();
  document.getElementById('btnNext').style.display = isLast ? 'none' : 'inline-flex';
  document.getElementById('btnSubmit').style.display = isLast ? 'inline-flex' : 'none';
}

function selectRadio(qid, value, el) {
  fillAnswers[qid] = value;
  el.parentNode.querySelectorAll('.fill-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
}

function toggleCheckbox(qid, value, el) {
  if (!fillAnswers[qid]) fillAnswers[qid] = [];
  const arr = fillAnswers[qid];
  const idx = arr.indexOf(value);
  if (idx > -1) {
    arr.splice(idx, 1);
    el.classList.remove('selected');
    el.querySelector('input').checked = false;
  } else {
    arr.push(value);
    el.classList.add('selected');
    el.querySelector('input').checked = true;
  }
}

function getNextQuestionIndex() {
  const q = currentSurvey.questions[currentFillIndex];
  if (q.type === 'radio' && q.branching && q.branchMap && fillAnswers[q.id] !== undefined) {
    const branch = q.branchMap[fillAnswers[q.id]];
    if (branch !== undefined && branch !== -1) {
      return branch; // -2 means end
    }
  }
  return currentFillIndex + 1;
}

function isLastQuestion() {
  const next = getNextQuestionIndex();
  return next >= currentSurvey.questions.length || next === -2;
}

function fillNext() {
  const q = currentSurvey.questions[currentFillIndex];
  if (q.required !== false && fillAnswers[q.id] === undefined) {
    showToast('请回答当前问题', 'error');
    return;
  }
  currentFillIndex = getNextQuestionIndex();
  if (currentFillIndex >= currentSurvey.questions.length || currentFillIndex === -2) {
    submitSurvey();
    return;
  }
  renderFillQuestion();
  updateFillProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fillPrev() {
  // 简单回退：从头部开始重放到上一个分支点
  // 对于复杂分支，用历史记录更准确
  if (currentFillIndex > 0) {
    currentFillIndex--;
    renderFillQuestion();
    updateFillProgress();
  }
}

function updateFillProgress() {
  const total = currentSurvey.questions.length;
  const pct = Math.round(((currentFillIndex + 1) / total) * 100);
  document.getElementById('fillProgress').style.width = pct + '%';
  document.getElementById('fillProgressText').textContent = `${currentFillIndex + 1} / ${total}（${pct}%）`;
}

// =================== 计时器 ===================
function setupTimer() {
  clearInterval(timerInterval);
  const bar = document.getElementById('timerBar');
  if (!currentSurvey.enableTimer) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  bar.classList.remove('warning');
  timeRemaining = currentSurvey.timeLimit * 60;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeRemaining--;
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      showToast('时间到！问卷已自动提交', 'info');
      submitSurvey(true);
      return;
    }
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const total = currentSurvey.timeLimit * 60;
  const pct = (timeRemaining / total) * 100;
  document.getElementById('timerProgress').style.width = pct + '%';
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  document.getElementById('timerText').textContent = `剩余时间：${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const bar = document.getElementById('timerBar');
  if (pct < 20) bar.classList.add('warning');
  else bar.classList.remove('warning');
}

// =================== 保存进度 / 提交 ===================
function saveProgress() {
  const progressData = {
    answers: fillAnswers,
    currentIndex: currentFillIndex,
    savedAt: Date.now()
  };
  localStorage.setItem('progress_' + currentSurvey.id, JSON.stringify(progressData));
  showToast('进度已暂存', 'success');
}

function submitSurvey(autoSubmit = false) {
  clearInterval(timerInterval);
  const timeTaken = currentSurvey.enableTimer
    ? (currentSurvey.timeLimit * 60 - timeRemaining)
    : 0;

  const responses = getResponses();
  if (!responses[currentSurvey.id]) responses[currentSurvey.id] = [];
  responses[currentSurvey.id].push({
    answers: { ...fillAnswers },
    submittedAt: Date.now(),
    timeTaken,
    autoSubmit
  });
  saveResponses(responses);

  // 清除暂存
  localStorage.removeItem('progress_' + currentSurvey.id);

  const body = document.getElementById('fillBody');
  body.innerHTML = `
    <div class="fill-question" style="text-align:center;padding:60px 28px">
      <div style="font-size:3rem;margin-bottom:16px">🎉</div>
      <h2>感谢您的参与！</h2>
      <p style="color:var(--text-secondary);margin-top:8px">您的回答已成功提交</p>
      <button class="btn btn-primary" onclick="navigateTo('home')" style="margin-top:24px">返回首页</button>
    </div>`;

  document.getElementById('btnPrev').style.display = 'none';
  document.getElementById('btnNext').style.display = 'none';
  document.getElementById('btnSubmit').style.display = 'none';
  document.getElementById('fillProgress').style.width = '100%';
  document.getElementById('fillProgressText').textContent = '已完成';
  document.getElementById('timerBar').style.display = 'none';
}

// =================== 结果分析 ===================
function populateResultsSelect() {
  const surveys = getSurveys();
  const responses = getResponses();
  const select = document.getElementById('resultsSurveySelect');
  const keys = Object.keys(surveys);
  let html = '<option value="">选择问卷...</option>';
  keys.forEach(id => {
    const count = (responses[id] || []).length;
    html += `<option value="${id}">${escapeHtml(surveys[id].title || '未命名')} (${count} 条回复)</option>`;
  });
  select.innerHTML = html;
}

function loadResults() {
  const surveyId = document.getElementById('resultsSurveySelect').value;
  const summaryEl = document.getElementById('resultsSummary');
  const chartsEl = document.getElementById('resultsCharts');

  if (!surveyId) {
    summaryEl.style.display = 'none';
    chartsEl.innerHTML = '';
    return;
  }

  const surveys = getSurveys();
  const survey = surveys[surveyId];
  const responses = getResponses();
  const data = responses[surveyId] || [];

  summaryEl.style.display = 'grid';
  document.getElementById('totalResponses').textContent = data.length;

  if (data.length > 0 && data[0].timeTaken) {
    const avg = Math.round(data.reduce((s, r) => s + (r.timeTaken || 0), 0) / data.length);
    const mins = Math.floor(avg / 60);
    const secs = avg % 60;
    document.getElementById('avgTime').textContent = `${mins}分${secs}秒`;
  } else {
    document.getElementById('avgTime').textContent = '--';
  }
  document.getElementById('completionRate').textContent = data.length > 0 ? '100%' : '--';

  // 渲染图表
  chartsEl.innerHTML = '';
  survey.questions.forEach(q => {
    const card = document.createElement('div');
    card.className = 'chart-card';
    card.innerHTML = `<h3>${escapeHtml(q.text || '未命名问题')}</h3>`;

    if (q.type === 'radio') {
      const counts = q.options.map(() => 0);
      data.forEach(r => {
        const a = r.answers[q.id];
        if (a !== undefined && a < counts.length) counts[a]++;
      });
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-canvas-wrapper';
      const canvas = document.createElement('canvas');
      wrapper.appendChild(canvas);
      card.appendChild(wrapper);
      chartsEl.appendChild(card);
      renderPieChart(canvas, q.options, counts);
    } else if (q.type === 'checkbox') {
      const counts = q.options.map(() => 0);
      data.forEach(r => {
        const a = r.answers[q.id];
        if (Array.isArray(a)) a.forEach(v => { if (v < counts.length) counts[v]++; });
      });
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-canvas-wrapper';
      const canvas = document.createElement('canvas');
      wrapper.appendChild(canvas);
      card.appendChild(wrapper);
      chartsEl.appendChild(card);
      renderBarChart(canvas, q.options, counts);
    } else if (q.type === 'slider') {
      const values = data.map(r => r.answers[q.id]).filter(v => v !== undefined);
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-canvas-wrapper';
      const canvas = document.createElement('canvas');
      wrapper.appendChild(canvas);
      card.appendChild(wrapper);
      chartsEl.appendChild(card);
      renderDistributionChart(canvas, values, q.min, q.max);
    } else if (q.type === 'text') {
      const list = document.createElement('div');
      list.className = 'text-responses-list';
      data.forEach(r => {
        const a = r.answers[q.id];
        if (a) {
          const item = document.createElement('div');
          item.className = 'text-response-item';
          item.textContent = a;
          list.appendChild(item);
        }
      });
      if (list.children.length === 0) list.innerHTML = '<p style="color:var(--text-secondary)">暂无回复</p>';
      card.appendChild(list);
      chartsEl.appendChild(card);
    }
  });
}

// =================== URL 哈希检查 ===================
function checkUrlHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#survey=')) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(hash.substring(8)))));
      const surveys = getSurveys();
      surveys[data.id] = data;
      saveSurveys(surveys);
      startFilling(data.id);
    } catch (e) {
      console.error('Failed to parse survey from URL:', e);
    }
  }
}

// =================== 事件绑定 ===================
document.getElementById('enableTimer').addEventListener('change', function () {
  document.getElementById('timerConfig').style.display = this.checked ? 'flex' : 'none';
});

// =================== 初始化 ===================
window.addEventListener('load', () => {
  checkUrlHash();
  renderRecentSurveys();
});
