/**
 * 多步骤引导表单
 * 功能：进度条、平滑过渡、条件字段、localStorage 持久化、
 *       图片预览上传、客户端验证、放弃分析、响应式、后退导航
 */

(function () {
  'use strict';

  // ===== 配置 =====
  const TOTAL_STEPS = 4;
  const STEP_LABELS = ['基本信息', '详细信息', '偏好上传', '确认提交'];
  const STORAGE_KEY = 'multistep_form_data';
  const ANALYTICS_KEY = 'multistep_form_analytics';

  // ===== 状态 =====
  let currentStep = 1;
  let maxReachedStep = 1;
  let isAnimating = false;
  let uploadedFile = null;
  let analytics = loadAnalytics();

  // ===== DOM =====
  const form = document.getElementById('multiStepForm');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const progressFill = document.getElementById('progressFill');
  const stepIndicators = document.getElementById('stepIndicators');
  const fileUpload = document.getElementById('fileUpload');
  const avatarInput = document.getElementById('avatar');
  const uploadArea = document.getElementById('uploadArea');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeImageBtn = document.getElementById('removeImage');
  const successModal = document.getElementById('successModal');
  const resetBtn = document.getElementById('resetBtn');
  const bioField = document.getElementById('bio');
  const bioCount = document.getElementById('bioCount');
  const summaryEl = document.getElementById('summary');

  // ===== 初始化 =====
  function init() {
    buildStepIndicators();
    bindEvents();
    restoreFromStorage();
    updateUI();
    recordAnalytics('form_viewed');
  }

  // 构建步骤指示器
  function buildStepIndicators() {
    stepIndicators.innerHTML = '';
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const indicator = document.createElement('div');
      indicator.className = 'step-indicator';
      indicator.dataset.step = i;
      indicator.innerHTML = `
        <div class="step-circle">${i}</div>
        <span class="step-label">${STEP_LABELS[i - 1]}</span>
      `;
      indicator.addEventListener('click', () => handleIndicatorClick(i));
      stepIndicators.appendChild(indicator);
    }
  }

  // 点击步骤指示器
  function handleIndicatorClick(step) {
    if (step > maxReachedStep || isAnimating) return;
    if (step === currentStep) return;
    const direction = step > currentStep ? 'forward' : 'backward';
    goToStep(step, direction);
  }

  // ===== 事件绑定 =====
  function bindEvents() {
    prevBtn.addEventListener('click', goBack);
    nextBtn.addEventListener('click', goNext);
    submitBtn.addEventListener('click', handleSubmit);
    resetBtn.addEventListener('click', resetForm);

    // 文件上传
    uploadArea.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', handleFileSelect);
    removeImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeImage();
    });

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        avatarInput.files = e.dataTransfer.files;
        handleFileSelect();
      }
    });

    // 字数统计
    bioField.addEventListener('input', () => {
      const len = bioField.value.length;
      bioCount.textContent = len;
      bioCount.parentElement.classList.toggle('over', len > 500);
    });

    // 条件字段监听
    document.querySelectorAll('[data-conditional-trigger]').forEach((trigger) => {
      trigger.addEventListener('change', () => updateConditionalFields(trigger));
    });

    // 实时验证（失焦时）
    form.addEventListener('focusout', (e) => {
      const el = e.target;
      if (el.matches('input, select, textarea') && el.dataset.validate) {
        validateField(el);
      }
    });

    // 输入时清除错误
    form.addEventListener('input', (e) => {
      const el = e.target;
      if (el.classList.contains('invalid')) {
        validateField(el);
      }
    });

    // 浏览器后退按钮
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.step) {
        const step = e.state.step;
        if (step >= 1 && step <= TOTAL_STEPS && step <= maxReachedStep) {
          const direction = step < currentStep ? 'backward' : 'forward';
          switchStep(step, direction, false);
        }
      }
    });

    // 页面离开时记录分析
    window.addEventListener('beforeunload', () => {
      if (analytics.submittedAt) return;
      recordAnalytics('page_left', { step: currentStep });
    });
  }

  // ===== 导航 =====
  function goNext() {
    if (isAnimating) return;
    if (!validateCurrentStep()) return;
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1, 'forward');
    }
  }

  function goBack() {
    if (isAnimating || currentStep <= 1) return;
    goToStep(currentStep - 1, 'backward');
  }

  function goToStep(step, direction) {
    // 如果前进，先验证当前步骤
    if (direction === 'forward' && !validateCurrentStep()) return;

    recordAnalytics('step_change', {
      from: currentStep,
      to: step,
      direction,
    });

    switchStep(step, direction, true);
  }

  function switchStep(step, direction, pushState) {
    if (isAnimating) return;
    isAnimating = true;

    const oldStep = currentStep;
    currentStep = step;

    if (step > maxReachedStep) {
      maxReachedStep = step;
    }

    saveToStorage();

    const oldEl = form.querySelector(`.step[data-step="${oldStep}"]`);
    const newEl = form.querySelector(`.step[data-step="${step}"]`);

    // 动画类名
    const outClass = direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';

    // 旧步骤飞出
    oldEl.classList.remove('active');
    oldEl.classList.add(outClass);

    setTimeout(() => {
      oldEl.classList.remove(outClass);
      oldEl.style.display = 'none';

      // 新步骤飞入
      newEl.style.display = 'block';
      newEl.classList.add('active', inClass);

      setTimeout(() => {
        newEl.classList.remove(inClass);
        isAnimating = false;
      }, 400);
    }, 300);

    // 如果是确认步骤，生成摘要
    if (step === TOTAL_STEPS) {
      buildSummary();
    }

    updateUI();

    // 浏览器历史
    if (pushState) {
      history.pushState({ step }, '', `#step-${step}`);
    }
  }

  // ===== UI 更新 =====
  function updateUI() {
    // 进度条
    const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
    progressFill.style.width = `${progress}%`;

    // 步骤指示器
    document.querySelectorAll('.step-indicator').forEach((ind) => {
      const s = parseInt(ind.dataset.step);
      ind.classList.remove('active', 'completed');
      if (s === currentStep) {
        ind.classList.add('active');
      } else if (s < currentStep) {
        ind.classList.add('completed');
        ind.querySelector('.step-circle').innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;
      } else {
        ind.querySelector('.step-circle').textContent = s;
      }
    });

    // 按钮
    prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    nextBtn.style.display = currentStep < TOTAL_STEPS ? 'inline-flex' : 'none';
    submitBtn.style.display = currentStep === TOTAL_STEPS ? 'inline-flex' : 'none';
  }

  // ===== 条件字段 =====
  function updateConditionalFields(trigger) {
    const triggerName = trigger.dataset.conditionalTrigger;
    const triggerValue = trigger.value;

    document
      .querySelectorAll(`.conditional-field[data-condition*="${triggerName}="]`)
      .forEach((field) => {
        const condition = field.dataset.condition;
        const [fieldName, expectedValue] = condition.split('=');
        const shouldShow = triggerValue === expectedValue;

        if (shouldShow) {
          field.classList.add('visible');
        } else {
          field.classList.remove('visible');
          // 清除条件字段的值和验证状态
          const input = field.querySelector('input, select, textarea');
          if (input) {
            input.value = '';
            input.classList.remove('valid', 'invalid');
            const errorEl = field.querySelector('.error-message');
            if (errorEl) errorEl.textContent = '';
          }
        }
      });
  }

  // ===== 验证 =====
  const validators = {
    required(value) {
      if (!value || !value.trim()) return '此字段为必填项';
      return null;
    },
    email(value) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(value)) return '请输入有效的电子邮箱地址';
      return null;
    },
    phone(value) {
      const re = /^1[3-9]\d{9}$/;
      if (!re.test(value)) return '请输入有效的11位手机号码';
      return null;
    },
    minLength(value, min) {
      if (value.trim().length < parseInt(min))
        return `至少需要 ${min} 个字符`;
      return null;
    },
    maxLength(value, max) {
      if (value.trim().length > parseInt(max))
        return `最多允许 ${max} 个字符`;
      return null;
    },
    graduationYear(value) {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < currentYear || year > currentYear + 10) {
        return `请输入 ${currentYear} 到 ${currentYear + 10} 之间的年份`;
      }
      return null;
    },
    checkbox(el) {
      if (!el.checked) return '请勾选此项以继续';
      return null;
    },
  };

  function validateField(el) {
    const rules = el.dataset.validate;
    if (!rules) return true;

    // 跳过隐藏的条件字段
    if (el.dataset.conditional === 'true') {
      const group = el.closest('.conditional-field');
      if (group && !group.classList.contains('visible')) {
        el.classList.remove('valid', 'invalid');
        const errorEl = document.getElementById(`${el.id}-error`);
        if (errorEl) errorEl.textContent = '';
        return true;
      }
    }

    const ruleList = rules.split('|');
    let errorMsg = null;

    for (const rule of ruleList) {
      const [name, param] = rule.split(':');
      if (name === 'checked') {
        errorMsg = validators.checkbox(el);
      } else if (validators[name]) {
        errorMsg = validators[name](el.value, param);
      }
      if (errorMsg) break;
    }

    const errorEl = document.getElementById(`${el.id}-error`);

    if (errorMsg) {
      el.classList.add('invalid');
      el.classList.remove('valid');
      if (errorEl) errorEl.textContent = errorMsg;
      return false;
    } else {
      el.classList.remove('invalid');
      el.classList.add('valid');
      if (errorEl) errorEl.textContent = '';
      return true;
    }
  }

  function validateCurrentStep() {
    const stepEl = form.querySelector(`.step[data-step="${currentStep}"]`);
    const fields = stepEl.querySelectorAll(
      'input[data-validate], select[data-validate], textarea[data-validate]'
    );
    let allValid = true;

    fields.forEach((field) => {
      if (!validateField(field)) {
        allValid = false;
      }
    });

    // 文件验证（步骤3）
    if (currentStep === 3 && avatarInput.files.length > 0) {
      const file = avatarInput.files[0];
      const validTypes = ['image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        document.getElementById('avatar-error').textContent =
          '仅支持 JPG 和 PNG 格式';
        allValid = false;
      } else if (file.size > maxSize) {
        document.getElementById('avatar-error').textContent =
          '文件大小不能超过 5MB';
        allValid = false;
      }
    }

    if (!allValid) {
      // 聚焦到第一个错误字段
      const firstInvalid = stepEl.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
    }

    return allValid;
  }

  // ===== 文件上传 =====
  function handleFileSelect() {
    const file = avatarInput.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024;
    const errorEl = document.getElementById('avatar-error');

    if (!validTypes.includes(file.type)) {
      errorEl.textContent = '仅支持 JPG 和 PNG 格式';
      avatarInput.value = '';
      return;
    }

    if (file.size > maxSize) {
      errorEl.textContent = '文件大小不能超过 5MB';
      avatarInput.value = '';
      return;
    }

    errorEl.textContent = '';
    uploadedFile = file;

    // 图片预览
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadPlaceholder.style.display = 'none';
      imagePreview.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    uploadedFile = null;
    avatarInput.value = '';
    previewImg.src = '';
    uploadPlaceholder.style.display = '';
    imagePreview.style.display = 'none';
  }

  // ===== 摘要构建 =====
  function buildSummary() {
    const data = collectFormData();
    const occupationMap = {
      engineer: '工程师',
      designer: '设计师',
      product: '产品经理',
      marketing: '市场营销',
      student: '学生',
      other: '其他',
    };
    const experienceMap = {
      '0-1': '0-1年',
      '1-3': '1-3年',
      '3-5': '3-5年',
      '5-10': '5-10年',
      '10+': '10年以上',
      student_experience: '在校学生',
    };
    const interestsMap = {
      frontend: '前端开发',
      backend: '后端开发',
      mobile: '移动开发',
      ai: '人工智能',
      data: '数据科学',
      other_interest: '其他',
    };

    let items = [
      ['姓名', data.fullName],
      ['邮箱', data.email],
      ['手机', data.phone],
      ['职业', occupationMap[data.occupation] || data.occupation],
    ];

    if (data.occupation === '其他' && data.occupationOther) {
      items.push(['具体职业', data.occupationOther]);
    }

    items.push(['公司/学校', data.company]);

    if (data.experience) {
      items.push(['工作经验', experienceMap[data.experience] || data.experience]);
    }

    if (data.experience === 'student_experience' && data.graduationYear) {
      items.push(['毕业年份', data.graduationYear]);
    }

    items.push(['兴趣领域', interestsMap[data.interests] || data.interests]);

    if (data.interests === 'other_interest' && data.interestsOther) {
      items.push(['具体领域', data.interestsOther]);
    }

    items.push(['个人简介', data.bio]);

    if (data.avatarDataUrl) {
      items.push(['头像', `<img class="summary-avatar" src="${data.avatarDataUrl}" alt="头像">`]);
    }

    summaryEl.innerHTML = items
      .map(
        ([label, value]) => `
      <div class="summary-item">
        <span class="summary-label">${label}</span>
        <span class="summary-value">${value || '未填写'}</span>
      </div>
    `
      )
      .join('');
  }

  // ===== 数据收集 =====
  function collectFormData() {
    const data = {};
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach((field) => {
      if (field.type === 'file') return;
      if (field.type === 'checkbox') {
        data[field.name] = field.checked;
      } else {
        data[field.name] = field.value;
      }
    });
    if (previewImg.src && previewImg.src !== location.href) {
      data.avatarDataUrl = previewImg.src;
    }
    return data;
  }

  // ===== localStorage =====
  function saveToStorage() {
    const data = collectFormData();
    data._currentStep = currentStep;
    data._maxReachedStep = maxReachedStep;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('保存到 localStorage 失败:', e);
    }
  }

  function restoreFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      // 恢复字段值
      Object.keys(data).forEach((key) => {
        if (key.startsWith('_')) return;
        const el = form.querySelector(`[name="${key}"]`);
        if (!el) return;
        if (el.type === 'checkbox') {
          el.checked = data[key];
        } else {
          el.value = data[key];
        }
      });

      // 恢复步骤
      if (data._currentStep) {
        currentStep = data._currentStep;
        maxReachedStep = data._maxReachedStep || currentStep;

        // 显示当前步骤
        form.querySelectorAll('.step').forEach((s) => {
          s.style.display = 'none';
          s.classList.remove('active');
        });
        const currentEl = form.querySelector(`.step[data-step="${currentStep}"]`);
        if (currentEl) {
          currentEl.style.display = 'block';
          currentEl.classList.add('active');
        }

        // 恢复条件字段状态
        document.querySelectorAll('[data-conditional-trigger]').forEach((trigger) => {
          updateConditionalFields(trigger);
        });

        // 恢复字数统计
        if (bioField.value) {
          bioCount.textContent = bioField.value.length;
        }

        // 恢复头像预览
        if (data.avatarDataUrl) {
          previewImg.src = data.avatarDataUrl;
          uploadPlaceholder.style.display = 'none';
          imagePreview.style.display = 'inline-block';
        }

        // 替换历史状态
        history.replaceState({ step: currentStep }, '', `#step-${currentStep}`);
      }
    } catch (e) {
      console.warn('从 localStorage 恢复失败:', e);
    }
  }

  // ===== 提交 =====
  function handleSubmit() {
    if (!validateCurrentStep()) return;

    const data = collectFormData();

    // 保存到 localStorage 模拟后端提交
    try {
      const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY + '_submissions') || '[]');
      data.submittedAt = new Date().toISOString();
      submissions.push(data);
      localStorage.setItem(STORAGE_KEY + '_submissions', JSON.stringify(submissions));

      // 清除草稿
      localStorage.removeItem(STORAGE_KEY);

      console.log('%c✅ 表单数据已提交并保存到 localStorage', 'color: #10b981; font-weight: bold;');
      console.log('提交的数据:', data);
      console.log('所有提交记录:', submissions);
    } catch (e) {
      console.error('保存提交数据失败:', e);
    }

    // 分析
    recordAnalytics('form_submitted');
    console.log('%c📊 表单分析报告', 'color: #6366f1; font-weight: bold;');
    console.table(analytics.stepChanges);

    // 显示成功弹窗
    successModal.classList.add('visible');
  }

  // ===== 重置 =====
  function resetForm() {
    successModal.classList.remove('visible');
    form.reset();
    uploadedFile = null;
    previewImg.src = '';
    uploadPlaceholder.style.display = '';
    imagePreview.style.display = 'none';
    bioCount.textContent = '0';

    form.querySelectorAll('.valid, .invalid').forEach((el) => {
      el.classList.remove('valid', 'invalid');
    });
    form.querySelectorAll('.error-message').forEach((el) => {
      el.textContent = '';
    });
    document.querySelectorAll('.conditional-field').forEach((f) => {
      f.classList.remove('visible');
    });

    localStorage.removeItem(STORAGE_KEY);
    analytics = { stepChanges: [], startTime: Date.now() };
    saveAnalytics();

    currentStep = 1;
    maxReachedStep = 1;

    form.querySelectorAll('.step').forEach((s) => {
      s.style.display = 'none';
      s.classList.remove('active');
    });
    const first = form.querySelector('.step[data-step="1"]');
    first.style.display = 'block';
    first.classList.add('active');

    history.replaceState({ step: 1 }, '', '#step-1');
    updateUI();

    recordAnalytics('form_viewed');
  }

  // ===== 分析 =====
  function loadAnalytics() {
    try {
      const raw = localStorage.getItem(ANALYTICS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return { stepChanges: [], startTime: Date.now() };
  }

  function saveAnalytics() {
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
    } catch (e) {
      // ignore
    }
  }

  function recordAnalytics(event, data = {}) {
    const entry = {
      event,
      timestamp: new Date().toISOString(),
      ...data,
    };
    analytics.stepChanges.push(entry);
    saveAnalytics();

    // 放弃追踪：当用户在第 N 步离开或停留时间过长时
    const label =
      event === 'step_change'
        ? `步骤 ${data.from} → ${data.to} (${data.direction})`
        : event === 'page_left'
          ? `用户在步骤 ${data.step} 离开页面`
          : event === 'form_submitted'
            ? '表单提交成功'
            : event;

    console.log(
      `%c📊 [分析] ${label}`,
      'color: #6366f1;',
      entry
    );

    // 特别提示放弃信息
    if (event === 'page_left' && data.step < TOTAL_STEPS) {
      console.warn(
        `%c⚠️ [放弃跟踪] 用户在步骤 ${data.step}/${TOTAL_STEPS} 离开了表单！`,
        'color: #ef4444; font-weight: bold;'
      );
    }
  }

  // ===== 启动 =====
  init();
})();
