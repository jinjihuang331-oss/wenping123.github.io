/**
 * 在线问卷构建工具 - 主应用
 */
(function () {
  'use strict';

  // ===========================
  // Storage Utilities
  // ===========================
  const Storage = {
    _prefix: 'survey_',
    _get(key) {
      try {
        const data = localStorage.getItem(this._prefix + key);
        return data ? JSON.parse(data) : null;
      } catch { return null; }
    },
    _set(key, value) {
      try {
        localStorage.setItem(this._prefix + key, JSON.stringify(value));
      } catch (e) {
        console.error('Storage save failed:', e);
      }
    },
    _del(key) {
      localStorage.removeItem(this._prefix + key);
    },
    getQuestionnaires() {
      return this._get('questionnaires') || [];
    },
    saveQuestionnaires(list) {
      this._set('questionnaires', list);
    },
    getQuestionnaire(id) {
      return this._get('q_' + id);
    },
    saveQuestionnaire(q) {
      this._set('q_' + q.id, q);
      // Update list
      const list = this.getQuestionnaires();
      const idx = list.findIndex(i => i.id === q.id);
      const meta = {
        id: q.id,
        title: q.title,
        description: q.description,
        questionCount: q.questions.length,
        timeLimit: q.timeLimit,
        theme: q.theme,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        responseCount: (this.getResponses(q.id) || []).length
      };
      if (idx >= 0) list[idx] = meta;
      else list.push(meta);
      this.saveQuestionnaires(list);
    },
    deleteQuestionnaire(id) {
      this._del('q_' + id);
      this._del('responses_' + id);
      const list = this.getQuestionnaires().filter(i => i.id !== id);
      this.saveQuestionnaires(list);
    },
    getResponses(qId) {
      return this._get('responses_' + qId) || [];
    },
    saveResponse(qId, response) {
      const list = this.getResponses(qId);
      list.push(response);
      this._set('responses_' + qId, list);
      // Update count in list
      const qList = this.getQuestionnaires();
      const item = qList.find(i => i.id === qId);
      if (item) {
        item.responseCount = list.length;
        this.saveQuestionnaires(qList);
      }
    },
    getProgress(surveyId) {
      return this._get('progress_' + surveyId);
    },
    saveProgress(surveyId, data) {
      this._set('progress_' + surveyId, data);
    },
    clearProgress(surveyId) {
      this._del('progress_' + surveyId);
    },
    getAllData() {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this._prefix)) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key));
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
      return data;
    }
  };

  // ===========================
  // Utility Functions
  // ===========================
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return mins + '分钟前';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + '小时前';
    const days = Math.floor(hours / 24);
    return days + '天前';
  }

  // ===========================
  // Router
  // ===========================
  const Router = {
    routes: {},
    register(path, handler) {
      this.routes[path] = handler;
    },
    navigate(path) {
      window.location.hash = '#/' + path;
    },
    handleRoute() {
      const hash = window.location.hash.slice(2) || 'home'; // remove #/
      // Check for shared URL
      if (hash.startsWith('share/')) {
        const encoded = hash.slice(6);
        App.handleSharedSurvey(encoded);
        return;
      }
      const parts = hash.split('/');
      const view = parts[0];
      const param = parts.slice(1).join('/');
      const handler = this.routes[view];
      if (handler) {
        handler(param);
      } else {
        this.routes['home']();
      }
    }
  };

  // ===========================
  // State
  // ===========================
  let currentView = 'home';
  let currentResultsId = null;
  let currentEditId = null;

  // ===========================
  // App Object (exposed globally)
  // ===========================
  const App = {
    currentResultsId: null,

    navigate(view) {
      Router.navigate(view);
    },

    init() {
      // Register routes
      Router.register('home', () => this.showView('home'));
      Router.register('builder', (id) => {
        currentEditId = id || null;
        this.showView('builder');
        this.Builder.init(id);
      });
      Router.register('survey', (id) => {
        this.showView('survey');
        this.Survey.init(id);
      });
      Router.register('results', (id) => {
        currentResultsId = id;
        this.currentResultsId = id;
        this.showView('results');
        this.Results.init(id);
      });

      window.addEventListener('hashchange', () => Router.handleRoute());
      Router.handleRoute();

      // Close dropdowns on outside click
      document.addEventListener('click', (e) => {
        const menu = document.getElementById('add-question-menu');
        if (menu && !menu.parentElement.contains(e.target)) {
          menu.classList.add('hidden');
        }
      });

      // Keyboard shortcuts for survey
      document.addEventListener('keydown', (e) => {
        if (currentView === 'survey') {
          if (e.key === 'Enter' && !e.shiftKey) {
            const target = e.target;
            if (target.tagName !== 'TEXTAREA') {
              e.preventDefault();
              this.Survey.nextQuestion();
            }
          }
        }
      });
    },

    showView(view) {
      currentView = view;
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(view + '-view').classList.add('active');
      // Update nav links
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === view);
      });
      window.scrollTo(0, 0);
    },

    confirm(title, message) {
      return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        const btn = document.getElementById('modal-confirm-btn');
        modal.classList.remove('hidden');
        const cleanup = (result) => {
          modal.classList.add('hidden');
          btn.removeEventListener('click', onConfirm);
          resolve(result);
        };
        const onConfirm = () => cleanup(true);
        btn.addEventListener('click', onConfirm);
        // Close modal with cancel
        modal.querySelector('.modal-overlay').onclick = () => cleanup(false);
      });
    },

    closeModal() {
      document.getElementById('confirm-modal').classList.add('hidden');
    },

    closeShareModal() {
      document.getElementById('share-modal').classList.add('hidden');
    },

    copyShareUrl() {
      const input = document.getElementById('share-url-input');
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        showToast('链接已复制到剪贴板');
      }).catch(() => {
        document.execCommand('copy');
        showToast('链接已复制到剪贴板');
      });
    },

    showShareModal(url) {
      document.getElementById('share-url-input').value = url;
      document.getElementById('share-modal').classList.remove('hidden');
    },

    handleSharedSurvey(encoded) {
      try {
        const json = decodeURIComponent(atob(encoded));
        const questionnaire = JSON.parse(json);
        // Save the questionnaire
        const existing = Storage.getQuestionnaire(questionnaire.id);
        if (!existing) {
          Storage.saveQuestionnaire(questionnaire);
        }
        // Navigate to take it
        this.Survey.init(questionnaire.id);
        this.showView('survey');
      } catch (e) {
        console.error('Failed to parse shared survey:', e);
        showToast('无法解析分享的问卷', 'error');
        Router.navigate('home');
      }
    },

    generateShareUrl(questionnaireId) {
      const q = Storage.getQuestionnaire(questionnaireId);
      if (!q) return '';
      const json = JSON.stringify(q);
      const encoded = btoa(encodeURIComponent(json));
      return window.location.origin + window.location.pathname + '#/share/' + encoded;
    },

    exportAllData() {
      const data = Storage.getAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'survey_data_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('数据已导出');
    },

    // ===========================
    // Builder Module
    // ===========================
    Builder: {
      questionnaire: null,
      theme: '#4f46e5',

      init(editId) {
        if (editId) {
          const q = Storage.getQuestionnaire(editId);
          if (q) {
            this.questionnaire = JSON.parse(JSON.stringify(q));
            this.theme = q.theme || '#4f46e5';
          } else {
            showToast('问卷不存在', 'error');
            Router.navigate('home');
            return;
          }
        } else {
          this.questionnaire = {
            id: uid(),
            title: '',
            description: '',
            timeLimit: 0,
            theme: '#4f46e5',
            questions: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          this.theme = '#4f46e5';
        }

        this.renderForm();
        this.renderQuestions();
      },

      renderForm() {
        const q = this.questionnaire;
        document.getElementById('q-title').value = q.title;
        document.getElementById('q-desc').value = q.description;
        document.getElementById('q-timelimit').value = q.timeLimit || 0;
        // Update theme dots
        document.querySelectorAll('.theme-dot').forEach(dot => {
          dot.classList.toggle('active', dot.dataset.color === this.theme);
        });
      },

      setTheme(el) {
        document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
        el.classList.add('active');
        this.theme = el.dataset.color;
        this.questionnaire.theme = this.theme;
      },

      syncForm() {
        this.questionnaire.title = document.getElementById('q-title').value.trim();
        this.questionnaire.description = document.getElementById('q-desc').value.trim();
        this.questionnaire.timeLimit = parseInt(document.getElementById('q-timelimit').value) || 0;
        this.questionnaire.theme = this.theme;
        this.questionnaire.updatedAt = Date.now();
      },

      toggleAddMenu() {
        document.getElementById('add-question-menu').classList.toggle('hidden');
      },

      addQuestion(type) {
        document.getElementById('add-question-menu').classList.add('hidden');
        this.syncForm();
        const typeLabels = { radio: '单选题', checkbox: '多选题', text: '文本题', slider: '滑块题' };
        const q = {
          id: uid(),
          type,
          title: '',
          required: false,
          options: [],
          condition: null,
          // Slider specific
          min: 0, max: 100, step: 1,
          // Text specific
          placeholder: '',
          multiline: false
        };
        if (type === 'radio' || type === 'checkbox') {
          q.options = [
            { id: uid(), label: '选项 1' },
            { id: uid(), label: '选项 2' }
          ];
        }
        if (type === 'slider') {
          q.min = 1;
          q.max = 10;
        }
        this.questionnaire.questions.push(q);
        this.renderQuestions();
        showToast(typeLabels[type] + '已添加');
        // Scroll to new question
        setTimeout(() => {
          const cards = document.querySelectorAll('.question-card');
          if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },

      updateQuestion(qId, field, value) {
        const q = this.questionnaire.questions.find(q => q.id === qId);
        if (q) q[field] = value;
      },

      deleteQuestion(qId) {
        this.questionnaire.questions = this.questionnaire.questions.filter(q => q.id !== qId);
        // Remove conditions referencing this question
        this.questionnaire.questions.forEach(q => {
          if (q.condition && q.condition.questionId === qId) {
            q.condition = null;
          }
        });
        this.renderQuestions();
        showToast('问题已删除');
      },

      moveQuestion(qId, direction) {
        const qs = this.questionnaire.questions;
        const idx = qs.findIndex(q => q.id === qId);
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= qs.length) return;
        [qs[idx], qs[newIdx]] = [qs[newIdx], qs[idx]];
        this.renderQuestions();
      },

      addOption(qId) {
        const q = this.questionnaire.questions.find(q => q.id === qId);
        if (q && (q.type === 'radio' || q.type === 'checkbox')) {
          q.options.push({ id: uid(), label: '选项 ' + (q.options.length + 1) });
          this.renderQuestions();
        }
      },

      updateOption(qId, optId, label) {
        const q = this.questionnaire.questions.find(q => q.id === qId);
        if (q) {
          const opt = q.options.find(o => o.id === optId);
          if (opt) opt.label = label;
        }
      },

      deleteOption(qId, optId) {
        const q = this.questionnaire.questions.find(q => q.id === qId);
        if (q && q.options.length > 1) {
          q.options = q.options.filter(o => o.id !== optId);
          this.renderQuestions();
        }
      },

      updateCondition(qId, field, value) {
        const q = this.questionnaire.questions.find(q => q.id === qId);
        if (!q) return;
        if (field === 'clear') {
          q.condition = null;
        } else if (field === 'enable') {
          q.condition = { questionId: '', operator: 'equals', value: '' };
        } else if (q.condition) {
          q.condition[field] = value;
        }
      },

      renderQuestions() {
        const container = document.getElementById('questions-list');
        const noQ = document.getElementById('no-questions');
        const qs = this.questionnaire.questions;

        if (qs.length === 0) {
          container.innerHTML = '';
          noQ.classList.remove('hidden');
          return;
        }
        noQ.classList.add('hidden');

        const typeLabels = { radio: '单选题', checkbox: '多选题', text: '文本题', slider: '滑块题' };

        container.innerHTML = qs.map((q, idx) => `
          <div class="question-card" data-id="${q.id}">
            <div class="question-card-header">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="question-number">${idx + 1}</span>
                <span class="question-type-badge">${typeLabels[q.type]}</span>
                <label style="display:flex;align-items:center;gap:4px;font-size:0.8rem;color:var(--text-muted);cursor:pointer;">
                  <input type="checkbox" ${q.required ? 'checked' : ''} onchange="App.Builder.updateQuestion('${q.id}','required',this.checked)">
                  必填
                </label>
              </div>
              <div class="question-card-actions">
                <button title="上移" ${idx === 0 ? 'disabled' : ''} onclick="App.Builder.moveQuestion('${q.id}',-1)">&#8593;</button>
                <button title="下移" ${idx === qs.length - 1 ? 'disabled' : ''} onclick="App.Builder.moveQuestion('${q.id}',1)">&#8595;</button>
                <button class="delete-btn" title="删除" onclick="App.Builder.deleteQuestion('${q.id}')">&#10005;</button>
              </div>
            </div>
            <div class="question-card-body">
              <div class="form-group">
                <label>问题标题</label>
                <input type="text" class="form-input" placeholder="输入问题标题..."
                  value="${escapeHtml(q.title)}"
                  oninput="App.Builder.updateQuestion('${q.id}','title',this.value)">
              </div>

              ${q.type === 'text' ? `
              <div class="form-row">
                <div class="form-group">
                  <label>占位提示</label>
                  <input type="text" class="form-input" placeholder="输入提示文字..."
                    value="${escapeHtml(q.placeholder || '')}"
                    oninput="App.Builder.updateQuestion('${q.id}','placeholder',this.value)">
                </div>
                <div class="form-group">
                  <label style="display:flex;align-items:center;gap:4px;">
                    <input type="checkbox" ${q.multiline ? 'checked' : ''} onchange="App.Builder.updateQuestion('${q.id}','multiline',this.checked)">
                    多行文本
                  </label>
                </div>
              </div>` : ''}

              ${q.type === 'slider' ? `
              <div class="form-row">
                <div class="form-group">
                  <label>最小值</label>
                  <input type="number" class="form-input" value="${q.min}" min="0"
                    oninput="App.Builder.updateQuestion('${q.id}','min',Number(this.value))">
                </div>
                <div class="form-group">
                  <label>最大值</label>
                  <input type="number" class="form-input" value="${q.max}" min="1"
                    oninput="App.Builder.updateQuestion('${q.id}','max',Number(this.value))">
                </div>
                <div class="form-group">
                  <label>步长</label>
                  <input type="number" class="form-input" value="${q.step}" min="1"
                    oninput="App.Builder.updateQuestion('${q.id}','step',Number(this.value))">
                </div>
              </div>` : ''}

              ${(q.type === 'radio' || q.type === 'checkbox') ? `
              <div class="form-group">
                <label>选项列表</label>
                <div class="options-editor">
                  ${q.options.map(opt => `
                  <div class="option-row">
                    <span style="font-size:0.8rem;color:var(--text-muted)">&#8226;</span>
                    <input type="text" value="${escapeHtml(opt.label)}"
                      oninput="App.Builder.updateOption('${q.id}','${opt.id}',this.value)">
                    <button onclick="App.Builder.deleteOption('${q.id}','${opt.id}')" ${q.options.length <= 1 ? 'disabled' : ''} title="删除选项">&#10005;</button>
                  </div>`).join('')}
                  <button class="add-option-btn" onclick="App.Builder.addOption('${q.id}')">+ 添加选项</button>
                </div>
              </div>` : ''}

              <!-- Branching -->
              <details class="branching-section">
                <summary>条件显示（分支逻辑）</summary>
                <div class="branch-config">
                  ${q.condition ? `
                  <div class="form-row" style="margin-bottom:12px;">
                    <div class="form-group">
                      <label>当此问题回答时显示当前题</label>
                      <select onchange="App.Builder.updateCondition('${q.id}','questionId',this.value)">
                        <option value="">-- 选择问题 --</option>
                        ${qs.filter((prev, i) => i < idx).map(prev => `
                        <option value="${prev.id}" ${q.condition.questionId === prev.id ? 'selected' : ''}>${escapeHtml(prev.title || '未命名问题')}</option>
                        `).join('')}
                      </select>
                    </div>
                    <div class="form-group">
                      <label>条件</label>
                      <select onchange="App.Builder.updateCondition('${q.id}','operator',this.value)">
                        <option value="equals" ${q.condition.operator === 'equals' ? 'selected' : ''}>等于</option>
                        <option value="not_equals" ${q.condition.operator === 'not_equals' ? 'selected' : ''}>不等于</option>
                        <option value="contains" ${q.condition.operator === 'contains' ? 'selected' : ''}>包含</option>
                        <option value="any_of" ${q.condition.operator === 'any_of' ? 'selected' : ''}>属于其中之一</option>
                        <option value="gt" ${q.condition.operator === 'gt' ? 'selected' : ''}>大于</option>
                        <option value="lt" ${q.condition.operator === 'lt' ? 'selected' : ''}>小于</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>条件值</label>
                    <input type="text" class="form-input" placeholder="输入匹配值..."
                      value="${escapeHtml(q.condition.value || '')}"
                      oninput="App.Builder.updateCondition('${q.id}','value',this.value)">
                  </div>
                  <button class="btn btn-outline btn-sm" style="margin-top:8px;" onclick="App.Builder.updateCondition('${q.id}','clear');App.Builder.renderQuestions()">移除条件</button>
                  ` : `
                  <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">设置条件后，此问题仅当条件满足时才会显示给填写者。</p>
                  <button class="btn btn-outline btn-sm" onclick="App.Builder.updateCondition('${q.id}','enable');App.Builder.renderQuestions()">启用条件显示</button>
                  `}
                </div>
              </details>
            </div>
          </div>
        `).join('');
      },

      save() {
        this.syncForm();
        const q = this.questionnaire;
        if (!q.title) {
          showToast('请输入问卷标题', 'warning');
          document.getElementById('q-title').focus();
          return;
        }
        if (q.questions.length === 0) {
          showToast('请至少添加一个问题', 'warning');
          return;
        }
        q.updatedAt = Date.now();
        Storage.saveQuestionnaire(q);
        showToast('问卷已保存');
        Router.navigate('home');
      },

      previewSurvey() {
        this.syncForm();
        const q = this.questionnaire;
        if (!q.title || q.questions.length === 0) {
          showToast('请完善问卷信息后再预览', 'warning');
          return;
        }
        q.updatedAt = Date.now();
        Storage.saveQuestionnaire(q);
        Router.navigate('survey/' + q.id);
      }
    },

    // ===========================
    // Survey Module
    // ===========================
    Survey: {
      questionnaire: null,
      answers: {},
      currentIndex: 0,
      visibleQuestions: [],
      timerInterval: null,
      timerSeconds: 0,
      startTime: null,
      hasProgress: false,

      init(id) {
        const q = Storage.getQuestionnaire(id);
        if (!q) {
          showToast('问卷不存在', 'error');
          Router.navigate('home');
          return;
        }
        this.questionnaire = JSON.parse(JSON.stringify(q));
        this.answers = {};
        this.currentIndex = 0;
        this.startTime = Date.now();

        // Apply theme
        document.documentElement.style.setProperty('--primary', q.theme || '#4f46e5');
        document.documentElement.style.setProperty('--primary-light', q.theme || '#4f46e5');
        document.documentElement.style.setProperty('--primary-bg', (q.theme || '#4f46e5') + '14');

        // Render header
        document.getElementById('survey-title').textContent = q.title;
        document.getElementById('survey-desc').textContent = q.description;

        // Check for saved progress
        const progress = Storage.getProgress(id);
        const resumeBanner = document.getElementById('resume-banner');
        if (progress && progress.answers && Object.keys(progress.answers).length > 0) {
          this.hasProgress = true;
          this.answers = progress.answers;
          resumeBanner.classList.remove('hidden');
        } else {
          this.hasProgress = false;
          resumeBanner.classList.add('hidden');
        }

        this.computeVisibleQuestions();
        this.render();
        this.startTimer();
      },

      computeVisibleQuestions() {
        const qs = this.questionnaire.questions;
        this.visibleQuestions = qs.filter(q => {
          if (!q.condition) return true;
          const cond = q.condition;
          const answer = this.answers[cond.questionId];
          if (answer === undefined || answer === null || answer === '') return false;
          return this.evaluateCondition(answer, cond.operator, cond.value);
        });
      },

      evaluateCondition(answer, operator, value) {
        if (value === undefined || value === null || value === '') return true;
        const a = String(answer).toLowerCase();
        const v = String(value).toLowerCase();
        switch (operator) {
          case 'equals': return a === v;
          case 'not_equals': return a !== v;
          case 'contains': return a.includes(v);
          case 'any_of':
            const vals = v.split(',').map(s => s.trim().toLowerCase());
            if (Array.isArray(answer)) {
              return answer.some(av => vals.includes(String(av).toLowerCase()));
            }
            return vals.includes(a);
          case 'gt': return Number(answer) > Number(value);
          case 'lt': return Number(answer) < Number(value);
          default: return true;
        }
      },

      render() {
        this.computeVisibleQuestions();
        const total = this.visibleQuestions.length;
        document.getElementById('progress-total').textContent = total;

        if (total === 0) {
          document.getElementById('survey-questions').innerHTML =
            '<div class="empty-state"><p>没有可显示的问题</p></div>';
          document.getElementById('survey-questions').classList.remove('hidden');
          document.getElementById('btn-next').classList.add('hidden');
          document.getElementById('btn-submit').classList.add('hidden');
          document.getElementById('btn-prev').disabled = true;
          return;
        }

        // Clamp index
        if (this.currentIndex >= total) this.currentIndex = total - 1;
        if (this.currentIndex < 0) this.currentIndex = 0;

        const qs = this.visibleQuestions;
        const container = document.getElementById('survey-questions');

        container.innerHTML = qs.map((q, idx) => {
          const isActive = idx === this.currentIndex;
          const answer = this.answers[q.id];
          return `
          <div class="survey-question ${isActive ? 'active' : ''}" data-idx="${idx}">
            <div class="survey-question-card">
              <div class="survey-question-title">
                ${escapeHtml(q.title)}
                ${q.required ? '<span class="required-mark">*</span>' : ''}
              </div>
              <div class="survey-question-hint">第 ${idx + 1} 题 / 共 ${total} 题${q.type === 'radio' ? ' (单选)' : q.type === 'checkbox' ? ' (多选)' : ''}</div>
              ${this.renderQuestionInput(q, answer)}
            </div>
          </div>`;
        }).join('');

        this.updateProgress();
        this.updateNavButtons();
      },

      renderQuestionInput(q, answer) {
        switch (q.type) {
          case 'radio':
            return q.options.map(opt => `
              <div class="survey-option ${answer === opt.id ? 'selected' : ''}" onclick="App.Survey.selectRadio('${q.id}','${opt.id}',this)">
                <input type="radio" name="q_${q.id}" ${answer === opt.id ? 'checked' : ''}>
                <label>${escapeHtml(opt.label)}</label>
              </div>
            `).join('');

          case 'checkbox':
            const selected = Array.isArray(answer) ? answer : [];
            return q.options.map(opt => `
              <div class="survey-option ${selected.includes(opt.id) ? 'selected' : ''}" onclick="App.Survey.toggleCheckbox('${q.id}','${opt.id}',this)">
                <input type="checkbox" ${selected.includes(opt.id) ? 'checked' : ''}>
                <label>${escapeHtml(opt.label)}</label>
              </div>
            `).join('');

          case 'text':
            if (q.multiline) {
              return `<textarea class="survey-text-input" placeholder="${escapeHtml(q.placeholder || '请输入...')}"
                oninput="App.Survey.setTextAnswer('${q.id}',this.value)">${escapeHtml(answer || '')}</textarea>`;
            }
            return `<input type="text" class="survey-text-input" style="min-height:auto;" placeholder="${escapeHtml(q.placeholder || '请输入...')}"
              value="${escapeHtml(answer || '')}"
              oninput="App.Survey.setTextAnswer('${q.id}',this.value)">`;

          case 'slider':
            const val = answer !== undefined ? Number(answer) : q.min;
            return `
            <div class="slider-container">
              <div class="slider-track">
                <span>${q.min}</span>
                <span>${q.max}</span>
              </div>
              <input type="range" min="${q.min}" max="${q.max}" step="${q.step}" value="${val}"
                oninput="App.Survey.setSliderAnswer('${q.id}',this.value,this)">
              <div class="slider-value">${val}</div>
            </div>`;
          default:
            return '';
        }
      },

      selectRadio(qId, optId, el) {
        this.answers[qId] = optId;
        el.parentElement.querySelectorAll('.survey-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        el.querySelector('input').checked = true;
      },

      toggleCheckbox(qId, optId, el) {
        if (!Array.isArray(this.answers[qId])) this.answers[qId] = [];
        const arr = this.answers[qId];
        const idx = arr.indexOf(optId);
        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(optId);
        el.classList.toggle('selected');
        el.querySelector('input').checked = arr.includes(optId);
      },

      setTextAnswer(qId, value) {
        this.answers[qId] = value;
      },

      setSliderAnswer(qId, value, input) {
        this.answers[qId] = Number(value);
        input.parentElement.querySelector('.slider-value').textContent = value;
      },

      updateProgress() {
        const total = this.visibleQuestions.length;
        const current = this.currentIndex + 1;
        document.getElementById('progress-current').textContent = current;
        document.getElementById('progress-total').textContent = total;
        document.getElementById('survey-progress').style.width = (current / total * 100) + '%';
      },

      updateNavButtons() {
        const total = this.visibleQuestions.length;
        const isLast = this.currentIndex >= total - 1;
        const isFirst = this.currentIndex === 0;

        document.getElementById('btn-prev').disabled = isFirst;
        document.getElementById('btn-prev').classList.toggle('hidden', total === 0);
        document.getElementById('btn-next').classList.toggle('hidden', isLast);
        document.getElementById('btn-submit').classList.toggle('hidden', !isLast);
      },

      nextQuestion() {
        // Validate current question
        const q = this.visibleQuestions[this.currentIndex];
        if (q && q.required) {
          const answer = this.answers[q.id];
          if (answer === undefined || answer === null || answer === '' ||
              (Array.isArray(answer) && answer.length === 0)) {
            showToast('此题为必填项', 'warning');
            return;
          }
        }

        if (this.currentIndex < this.visibleQuestions.length - 1) {
          this.currentIndex++;
          this.render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          // Auto-save progress
          this.autoSave();
        }
      },

      prevQuestion() {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          this.render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },

      startTimer() {
        const q = this.questionnaire;
        const timerEl = document.getElementById('survey-timer');
        this.clearTimer();

        if (q.timeLimit && q.timeLimit > 0) {
          this.timerSeconds = q.timeLimit * 60;
          timerEl.classList.remove('hidden');
          this.updateTimerDisplay();
          this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerDisplay();
            if (this.timerSeconds <= 60) {
              timerEl.classList.add('warning');
            }
            if (this.timerSeconds <= 0) {
              this.clearTimer();
              showToast('时间到！问卷已自动提交', 'warning');
              this.submit();
            }
          }, 1000);
        } else {
          timerEl.classList.add('hidden');
        }
      },

      clearTimer() {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      },

      updateTimerDisplay() {
        const m = Math.floor(this.timerSeconds / 60);
        const s = this.timerSeconds % 60;
        document.getElementById('timer-display').textContent =
          String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      },

      autoSave() {
        if (this.questionnaire) {
          Storage.saveProgress(this.questionnaire.id, {
            answers: this.answers,
            currentIndex: this.currentIndex,
            savedAt: Date.now()
          });
        }
      },

      saveProgress() {
        this.autoSave();
        showToast('进度已保存');
      },

      resumeProgress() {
        document.getElementById('resume-banner').classList.add('hidden');
        // Recompute visible and find best index
        this.computeVisibleQuestions();
        if (this.currentIndex >= this.visibleQuestions.length) {
          this.currentIndex = this.visibleQuestions.length - 1;
        }
        this.render();
        showToast('进度已恢复');
      },

      dismissResume() {
        this.answers = {};
        this.currentIndex = 0;
        Storage.clearProgress(this.questionnaire.id);
        document.getElementById('resume-banner').classList.add('hidden');
        this.computeVisibleQuestions();
        this.render();
      },

      async submit() {
        // Validate all visible required questions
        let hasError = false;
        for (const q of this.visibleQuestions) {
          if (q.required) {
            const answer = this.answers[q.id];
            if (answer === undefined || answer === null || answer === '' ||
                (Array.isArray(answer) && answer.length === 0)) {
              hasError = true;
              break;
            }
          }
        }

        if (hasError) {
          const confirmed = await App.confirm('有未填写的必填项',
            '部分必填题尚未回答，确定要提交吗？未回答的必填题将标记为空。');
          if (!confirmed) return;
        }

        // Save response
        const response = {
          id: uid(),
          answers: { ...this.answers },
          submittedAt: Date.now(),
          timeSpent: Date.now() - this.startTime
        };

        Storage.saveResponse(this.questionnaire.id, response);
        Storage.clearProgress(this.questionnaire.id);
        this.clearTimer();

        // Reset theme
        document.documentElement.style.setProperty('--primary', '#4f46e5');
        document.documentElement.style.setProperty('--primary-light', '#6366f1');
        document.documentElement.style.setProperty('--primary-bg', '#eef2ff');

        showToast('问卷提交成功！');
        Router.navigate('results/' + this.questionnaire.id);
      }
    },

    // ===========================
    // Results Module
    // ===========================
    Results: {
      questionnaire: null,
      responses: [],
      charts: [],

      init(id) {
        this.questionnaire = Storage.getQuestionnaire(id);
        this.responses = Storage.getResponses(id) || [];
        this.charts.forEach(c => c.destroy());
        this.charts = [];

        document.getElementById('results-title').textContent = this.questionnaire ? this.questionnaire.title : '问卷结果';

        if (!this.questionnaire) {
          showToast('问卷不存在', 'error');
          Router.navigate('home');
          return;
        }

        if (this.responses.length === 0) {
          document.getElementById('no-results').classList.remove('hidden');
          document.getElementById('results-stats').innerHTML = '';
          document.getElementById('results-charts').innerHTML = '';
          document.getElementById('raw-data-section').classList.add('hidden');
          return;
        }

        document.getElementById('no-results').classList.add('hidden');
        this.renderStats();
        this.renderCharts();
        this.renderRawData();
      },

      renderStats() {
        const q = this.questionnaire;
        const r = this.responses;
        const totalResponses = r.length;
        const avgTime = r.reduce((sum, resp) => sum + (resp.timeSpent || 0), 0) / totalResponses;
        const completionRate = q.questions.length > 0
          ? Math.round(r.reduce((sum, resp) => {
              const answered = q.questions.filter(qu => {
                const a = resp.answers[qu.id];
                return a !== undefined && a !== null && a !== '' &&
                  !(Array.isArray(a) && a.length === 0);
              }).length;
              return sum + (answered / q.questions.length * 100);
            }, 0) / totalResponses)
          : 0;

        document.getElementById('results-stats').innerHTML = `
          <div class="stat-card">
            <div class="stat-value">${totalResponses}</div>
            <div class="stat-label">总回答数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Math.round(avgTime / 1000)}秒</div>
            <div class="stat-label">平均用时</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${completionRate}%</div>
            <div class="stat-label">平均完成率</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${q.questions.length}</div>
            <div class="stat-label">问题数量</div>
          </div>
        `;
      },

      renderCharts() {
        const q = this.questionnaire;
        const r = this.responses;
        const container = document.getElementById('results-charts');
        container.innerHTML = '';

        const colors = [
          '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
          '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
        ];

        q.questions.forEach((question, qIdx) => {
          const card = document.createElement('div');
          card.className = 'chart-card';

          if (question.type === 'radio' || question.type === 'checkbox') {
            // Bar/Doughnut chart for choices
            const optionCounts = {};
            question.options.forEach(opt => { optionCounts[opt.id] = { label: opt.label, count: 0 }; });
            r.forEach(resp => {
              const answer = resp.answers[question.id];
              if (Array.isArray(answer)) {
                answer.forEach(a => { if (optionCounts[a]) optionCounts[a].count++; });
              } else if (answer && optionCounts[answer]) {
                optionCounts[answer].count++;
              }
            });

            const labels = Object.values(optionCounts).map(o => o.label);
            const data = Object.values(optionCounts).map(o => o.count);
            const chartColors = labels.map((_, i) => colors[i % colors.length]);

            card.innerHTML = `
              <h3>${escapeHtml(question.title || '问题 ' + (qIdx + 1))}</h3>
              <div style="display:flex;gap:16px;flex-wrap:wrap;">
                <div style="flex:1;min-width:200px;"><canvas id="chart_${question.id}_bar"></canvas></div>
                <div style="flex:1;min-width:200px;max-width:250px;"><canvas id="chart_${question.id}_pie"></canvas></div>
              </div>
            `;
            container.appendChild(card);

            // Create charts after DOM update
            setTimeout(() => {
              const barCanvas = document.getElementById('chart_' + question.id + '_bar');
              const pieCanvas = document.getElementById('chart_' + question.id + '_pie');
              if (barCanvas) {
                const barChart = new Chart(barCanvas, {
                  type: 'bar',
                  data: {
                    labels,
                    datasets: [{
                      label: '选择人数',
                      data,
                      backgroundColor: chartColors,
                      borderRadius: 6,
                      borderWidth: 0
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                  }
                });
                barCanvas.parentElement.style.height = '260px';
                this.charts.push(barChart);
              }
              if (pieCanvas) {
                const pieChart = new Chart(pieCanvas, {
                  type: 'doughnut',
                  data: {
                    labels,
                    datasets: [{
                      data,
                      backgroundColor: chartColors,
                      borderWidth: 2,
                      borderColor: '#fff'
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                    }
                  }
                });
                pieCanvas.parentElement.style.height = '260px';
                this.charts.push(pieChart);
              }
            }, 0);

          } else if (question.type === 'slider') {
            // Histogram for slider values
            const values = r.map(resp => Number(resp.answers[question.id])).filter(v => !isNaN(v));
            if (values.length === 0) return;

            const min = question.min || Math.min(...values);
            const max = question.max || Math.max(...values);
            const step = question.step || 1;
            const bucketCount = Math.min(10, Math.ceil((max - min) / step) + 1);
            const bucketSize = Math.max(step, Math.ceil((max - min) / bucketCount));
            const buckets = {};
            for (let b = min; b <= max; b += bucketSize) {
              buckets[b] = 0;
            }
            values.sort((a, b) => a - b);
            values.forEach(v => {
              const bucket = Math.floor((v - min) / bucketSize) * bucketSize + min;
              if (buckets[bucket] !== undefined) buckets[bucket]++;
              else {
                // Find closest bucket
                const keys = Object.keys(buckets).map(Number).sort((a, b) => a - b);
                let closest = keys[0];
                let minDist = Math.abs(v - closest);
                keys.forEach(k => {
                  const d = Math.abs(v - k);
                  if (d < minDist) { minDist = d; closest = k; }
                });
                buckets[closest]++;
              }
            });

            const labels = Object.keys(buckets).map(k => {
              const s = Number(k);
              return s + '-' + Math.min(s + bucketSize - 1, max);
            });

            card.innerHTML = `
              <h3>${escapeHtml(question.title || '问题 ' + (qIdx + 1))}</h3>
              <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">
                <span>平均: ${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}</span>
                <span>最小: ${Math.min(...values)}</span>
                <span>最大: ${Math.max(...values)}</span>
              </div>
              <canvas id="chart_${question.id}" style="max-height:250px;"></canvas>
            `;
            container.appendChild(card);

            setTimeout(() => {
              const canvas = document.getElementById('chart_' + question.id);
              if (canvas) {
                const chart = new Chart(canvas, {
                  type: 'bar',
                  data: {
                    labels,
                    datasets: [{
                      label: '人数',
                      data: Object.values(buckets),
                      backgroundColor: 'rgba(79, 70, 229, 0.7)',
                      borderRadius: 6,
                      borderWidth: 0
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                  }
                });
                this.charts.push(chart);
              }
            }, 0);

          } else if (question.type === 'text') {
            // Text responses list
            const textResponses = r.map(resp => ({
              text: resp.answers[question.id] || '',
              time: resp.submittedAt
            })).filter(r => r.text.trim());

            card.innerHTML = `
              <h3>${escapeHtml(question.title || '问题 ' + (qIdx + 1))}</h3>
              <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">共 ${textResponses.length} 条回答</p>
              <div class="text-responses">
                ${textResponses.map(r => `
                <div class="text-response-item">
                  <div>${escapeHtml(r.text)}</div>
                  <div class="response-time">${new Date(r.time).toLocaleString('zh-CN')}</div>
                </div>
                `).join('') || '<p style="color:var(--text-muted);font-size:0.85rem;">暂无文本回答</p>'}
              </div>
            `;
            container.appendChild(card);
          }
        });
      },

      renderRawData() {
        const q = this.questionnaire;
        const r = this.responses;

        // Headers
        const headers = ['提交时间', '用时(秒)', ...q.questions.map(qu => qu.title || '未命名')];
        const thead = document.getElementById('raw-data-thead');
        thead.innerHTML = '<tr>' + headers.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr>';

        // Rows
        const tbody = document.getElementById('raw-data-tbody');
        tbody.innerHTML = r.map(resp => {
          const time = new Date(resp.submittedAt).toLocaleString('zh-CN');
          const duration = Math.round((resp.timeSpent || 0) / 1000);
          const cells = q.questions.map(qu => {
            const answer = resp.answers[qu.id];
            if (answer === undefined || answer === null || answer === '') return '<td style="color:var(--text-muted)">-</td>';
            if (Array.isArray(answer)) {
              const labels = answer.map(aId => {
                const opt = qu.options && qu.options.find(o => o.id === aId);
                return opt ? opt.label : aId;
              });
              return `<td>${escapeHtml(labels.join(', '))}</td>`;
            }
            return `<td>${escapeHtml(String(answer))}</td>`;
          });
          return `<tr><td>${time}</td><td>${duration}</td>${cells.join('')}</tr>`;
        }).join('');
      },

      toggleRawData() {
        document.getElementById('raw-data-section').classList.toggle('hidden');
      },

      exportCSV() {
        const q = this.questionnaire;
        const r = this.responses;
        const headers = ['提交时间', '用时(秒)', ...q.questions.map(qu => qu.title || '未命名')];
        const rows = r.map(resp => {
          const time = new Date(resp.submittedAt).toLocaleString('zh-CN');
          const duration = Math.round((resp.timeSpent || 0) / 1000);
          const cells = q.questions.map(qu => {
            const answer = resp.answers[qu.id];
            if (answer === undefined || answer === null || answer === '') return '';
            if (Array.isArray(answer)) {
              return answer.map(aId => {
                const opt = qu.options && qu.options.find(o => o.id === aId);
                return opt ? opt.label : aId;
              }).join('; ');
            }
            return String(answer);
          });
          return [time, duration, ...cells];
        });

        // Add BOM for Excel UTF-8 support
        let csv = '\uFEFF' + headers.map(h => '"' + h.replace(/"/g, '""') + '"').join(',') + '\n';
        rows.forEach(row => {
          csv += row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (q.title || 'survey') + '_results.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV 已导出');
      }
    },

    // ===========================
    // Home Module (inline)
    // ===========================
    Home: {
      render() {
        const list = Storage.getQuestionnaires();
        const container = document.getElementById('survey-list');
        const empty = document.getElementById('empty-state');

        if (list.length === 0) {
          container.innerHTML = '';
          empty.classList.remove('hidden');
          return;
        }

        empty.classList.add('hidden');
        // Sort by updatedAt descending
        list.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

        container.innerHTML = list.map(q => `
          <div class="survey-card">
            <div class="survey-card-info">
              <h3>${escapeHtml(q.title || '未命名问卷')}</h3>
              ${q.description ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:400px;">${escapeHtml(q.description)}</p>` : ''}
              <div class="survey-card-meta">
                <span>&#128221; ${q.questionCount || 0} 题</span>
                <span>&#128202; ${q.responseCount || 0} 回答</span>
                ${q.timeLimit ? `<span>&#9200; ${q.timeLimit}分钟</span>` : ''}
                <span>&#128337; ${timeAgo(q.updatedAt || q.createdAt)}</span>
              </div>
            </div>
            <div class="survey-card-actions">
              <button class="btn btn-sm btn-outline" onclick="App.Builder.previewSurveyById('${q.id}')">填写</button>
              <button class="btn btn-sm btn-outline" onclick="App.showResult('${q.id}')">结果</button>
              <button class="btn btn-sm btn-outline" onclick="App.shareSurvey('${q.id}')">分享</button>
              <button class="btn btn-sm btn-primary" onclick="Router.navigate('builder/${q.id}')">编辑</button>
              <button class="btn btn-sm btn-outline" onclick="App.deleteSurvey('${q.id}')">&#10005;</button>
            </div>
          </div>
        `).join('');
      }
    },

    // Home action helpers
    async deleteSurvey(id) {
      const confirmed = await this.confirm('删除问卷', '确定要删除此问卷吗？删除后不可恢复。');
      if (!confirmed) return;
      Storage.deleteQuestionnaire(id);
      this.Home.render();
      showToast('问卷已删除');
    },

    shareSurvey(id) {
      const url = this.generateShareUrl(id);
      if (!url) {
        showToast('生成分享链接失败', 'error');
        return;
      }
      this.showShareModal(url);
    },

    showResult(id) {
      Router.navigate('results/' + id);
    }
  };

  // Extend Builder preview
  App.Builder.previewSurveyById = function (id) {
    Router.navigate('survey/' + id);
  };

  // Override showView to also render home when switching to home
  const originalShowView = App.showView.bind(App);
  App.showView = function (view) {
    originalShowView(view);
    if (view === 'home') {
      App.Home.render();
    }
  };

  // Global exposure
  window.App = App;
  window.Router = Router;
  window.Storage = Storage;

  // Initialize
  document.addEventListener('DOMContentLoaded', () => App.init());
})();
