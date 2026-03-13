/**
 * 交互式通知系统
 * ─────────────────────────────────────────
 * 支持：多类型 / 优先级 / 自动消失 / 手动关闭 / 堆叠排列
 */
(function () {
  'use strict';

  /* ---------- 配置 ---------- */

  // 优先级 → 停留时长（毫秒）
  const DURATION = { low: 2000, medium: 4000, high: 6000, critical: 8000 };

  // 优先级中文标签
  const PRIORITY_LABEL = { low: '低', medium: '中', high: '高', critical: '紧急' };

  // 类型默认图标
  const ICONS = {
    success: '\u2713',   // ✓
    error:   '\u2717',   // ✗
    info:    '\u24D8',   // ⓘ
    warning: '\u26A0',   // ⚠
  };

  // 类型默认标题
  const DEFAULT_TITLE = {
    success: '操作成功',
    error:   '错误',
    info:    '提示信息',
    warning: '警告',
  };

  /* ---------- 状态 ---------- */

  const container = document.getElementById('notification-container');
  const notifications = [];   // 存储所有通知的引用信息
  let idCounter = 0;

  /* ---------- 工具函数 ---------- */

  // 移除已退场的 DOM 元素，并触发剩余通知的位置重排
  function cleanup(id) {
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      const entry = notifications[idx];
      entry.el.remove();
      notifications.splice(idx, 1);
    }
  }

  /* ---------- 核心：创建通知 ---------- */

  function createNotification(message, options) {
    var type      = options.type     || 'info';
    var title     = options.title    || DEFAULT_TITLE[type];
    var priority  = options.priority || 'medium';
    var duration  = options.duration || DURATION[priority];

    var id = ++idCounter;

    // 构建 DOM
    var el = document.createElement('div');
    el.className = 'notification ' + type;
    if (priority === 'critical') el.classList.add('critical');

    el.innerHTML =
      '<div class="icon-area">' + ICONS[type] + '</div>' +
      '<div class="content">' +
        '<div class="title">' +
          escHtml(title) +
          ' <span class="priority-label">' + PRIORITY_LABEL[priority] + '</span>' +
        '</div>' +
        '<div class="message">' + escHtml(message) + '</div>' +
      '</div>' +
      '<button class="close-btn" title="关闭">&times;</button>' +
      '<div class="progress-bar" style="animation-duration:' + duration + 'ms"></div>';

    container.appendChild(el);

    // 存储引用
    var entry = { id: id, el: el, timer: null, exiting: false };
    notifications.push(entry);

    // 自动关闭定时器
    entry.timer = setTimeout(function () {
      dismissNotification(id);
    }, duration);

    // 点击关闭
    el.addEventListener('click', function (e) {
      // 如果点击的是关闭按钮或卡片本身，都关闭
      dismissNotification(id);
    });

    return id;
  }

  /* ---------- 关闭通知 ---------- */

  function dismissNotification(id) {
    var entry = notifications.find(function (n) { return n.id === id; });
    if (!entry || entry.exiting) return;

    entry.exiting = true;
    clearTimeout(entry.timer);

    // 播放退出动画
    entry.el.classList.add('exiting');

    // 动画结束后移除 DOM（与 CSS slideOut 时长匹配）
    entry.el.addEventListener('animationend', function handler(e) {
      if (e.animationName === 'slideOut') {
        entry.el.removeEventListener('animationend', handler);
        cleanup(id);
      }
    });

    // 兜底：万一 animationend 没触发
    setTimeout(function () {
      if (entry.el.parentNode) cleanup(id);
    }, 500);
  }

  /* ---------- 清除全部 ---------- */

  function clearAll() {
    // 从上往下依次退出，间隔 60ms 形成波纹效果
    var copy = notifications.slice();
    copy.forEach(function (entry, i) {
      setTimeout(function () {
        dismissNotification(entry.id);
      }, i * 60);
    });
  }

  /* ---------- HTML 转义 ---------- */

  function escHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ---------- 公共 API ---------- */

  window.notify = {
    success: function (msg, opts) { return createNotification(msg, merge({ type: 'success' }, opts)); },
    error:   function (msg, opts) { return createNotification(msg, merge({ type: 'error'   }, opts)); },
    info:    function (msg, opts) { return createNotification(msg, merge({ type: 'info'    }, opts)); },
    warning: function (msg, opts) { return createNotification(msg, merge({ type: 'warning' }, opts)); },
    // 用 type/priority 选项调用
    show:    function (msg, type, opts) { return createNotification(msg, merge({ type: type }, opts)); },
    // 手动关闭指定通知
    dismiss: dismissNotification,
    // 清除全部
    clearAll: clearAll,
  };

  function merge(base, extra) {
    var result = {};
    for (var k in base)  result[k] = base[k];
    if (extra) for (var k2 in extra) result[k2] = extra[k2];
    return result;
  }

  /* ---------- 批量测试辅助（挂载到全局） ---------- */

  window.triggerBurst = function () {
    var types = ['success', 'error', 'info', 'warning'];
    var msgs = [
      '文件上传完成',
      '连接超时，请重试',
      '您有 3 条新消息',
      '存储空间即将用尽',
      '用户资料已更新',
      '权限不足，无法访问',
      '新功能已上线',
      '安全补丁可用',
    ];
    for (var i = 0; i < msgs.length; i++) {
      (function (idx) {
        setTimeout(function () {
          var t = types[idx % types.length];
          var p = ['low', 'medium', 'high', 'critical'][idx % 4];
          notify.show(msgs[idx], t, { priority: p });
        }, idx * 180);
      })(i);
    }
  };

})();
