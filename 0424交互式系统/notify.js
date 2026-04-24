/**
 * NotificationSystem — 交互式通知系统
 *
 * 功能：
 *   - 从右侧滑入 / 滑出动画
 *   - 多条通知纵向堆叠（column-reverse，新通知在底部）
 *   - 按类型着色 (success / info / warning / error)
 *   - 优先级控制停留时长 (low / medium / high)
 *   - 点击手动关闭
 *   - 底部进度条倒计时
 */
const NotificationSystem = (() => {
  /* ---- 配置 ---- */
  const DURATION = { low: 3000, medium: 6000, high: 10000 };

  const TYPE_CONFIG = {
    success: { icon: '✓',  title: '成功' },
    info:    { icon: 'ℹ',  title: '信息' },
    warning: { icon: '⚠',  title: '警告' },
    error:   { icon: '✕',  title: '错误' },
  };

  const PRIORITY_LABEL = { low: '低', medium: '中', high: '高' };

  /* ---- 容器 ---- */
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.getElementById('notification-container');
    }
    return container;
  }

  /* ---- 构建 DOM ---- */
  function createNotification(message, type = 'info', priority = 'medium') {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
    const duration = DURATION[priority] || DURATION.medium;

    const el = document.createElement('div');
    el.className = `notification ${type}`;
    if (priority === 'high') el.classList.add('pulse');

    el.innerHTML = `
      <span class="icon">${cfg.icon}</span>
      <div class="content">
        <div class="title">${cfg.title}</div>
        <div class="message">${message}</div>
      </div>
      <span class="priority-badge">${PRIORITY_LABEL[priority] || '中'}</span>
      <div class="progress-bar" style="animation-duration: ${duration}ms"></div>
    `;

    return { el, duration };
  }

  /* ---- 关闭通知 ---- */
  function dismiss(el) {
    if (el.classList.contains('slide-out') || !el.parentNode) return;

    el.classList.add('slide-out');

    // 动画结束后移除 DOM
    el.addEventListener('animationend', () => {
      el.remove();
    });
  }

  /* ---- 注册事件 ---- */
  function bindEvents(el, duration) {
    // 点击手动关闭
    el.addEventListener('click', () => dismiss(el));

    // 自动关闭
    const autoTimer = setTimeout(() => dismiss(el), duration);

    // 鼠标悬浮暂停自动关闭计时
    el.addEventListener('mouseenter', () => clearTimeout(autoTimer));

    // 鼠标离开后重新开始倒计时（剩余时间估算）
    el.addEventListener('mouseleave', () => {
      const progress = el.querySelector('.progress-bar');
      // 通过进度条当前宽度比例计算剩余时间
      const computedWidth = getComputedStyle(progress).width;
      const parentWidth = getComputedStyle(progress.parentElement).width;
      const ratio = parseFloat(computedWidth) / parseFloat(parentWidth);
      const remaining = ratio * duration;

      if (remaining > 200) {
        setTimeout(() => dismiss(el), remaining);
      } else {
        dismiss(el);
      }
    });
  }

  /* ---- 使用 WeakMap 存储计时器，避免内存泄漏 ---- */
  const timerMap = new WeakMap();

  /* ---- 公开 API：显示通知 ---- */
  function show(message, type = 'info', priority = 'medium') {
    const parent = getContainer();
    const { el, duration } = createNotification(message, type, priority);

    bindEvents(el, duration);
    parent.appendChild(el);

    return el;
  }

  /* ---- 公开 API：关闭所有通知 ---- */
  function dismissAll() {
    const parent = getContainer();
    const notifications = parent.querySelectorAll('.notification:not(.slide-out)');
    notifications.forEach((el) => dismiss(el));
  }

  return { show, dismissAll };
})();
