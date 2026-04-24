/**
 * Modal - 原生 JS 弹窗组件
 *
 * 用法:
 *   const modal = new Modal({
 *     title: '标题',
 *     content: '内容',
 *     confirmText: '确定',
 *     cancelText: '取消',
 *     maskClosable: true,
 *     onConfirm() { modal.close(); },
 *     onCancel() { modal.close(); },
 *   });
 *   modal.open();
 */
class Modal {
  constructor(options = {}) {
    this.title = options.title ?? '';
    this.content = options.content ?? '';
    this.confirmText = options.confirmText ?? '确定';
    this.cancelText = options.cancelText ?? '取消';
    this.maskClosable = options.maskClosable !== false; // 默认 true
    this.showCancel = options.showCancel ?? true;
    this.onConfirm = options.onConfirm ?? null;
    this.onCancel = options.onCancel ?? null;
    this.onOpen = options.onOpen ?? null;
    this.onClose = options.onClose ?? null;

    this._el = null;
    this._overlay = null;
    this._render();
  }

  /** 构建 DOM */
  _render() {
    // 遮罩
    this._overlay = document.createElement('div');
    this._overlay.className = 'modal-overlay';

    // 容器
    this._el = document.createElement('div');
    this._el.className = 'modal-container';

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close());

    // 标题
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.textContent = this.title;

    // 内容
    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof this.content === 'string') {
      body.innerHTML = this.content;
    } else {
      // 支持 DOM 节点
      body.appendChild(this.content.cloneNode(true));
    }

    // 底部按钮
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-confirm';
    confirmBtn.textContent = this.confirmText;
    confirmBtn.addEventListener('click', () => {
      if (this.onConfirm) this.onConfirm();
      else this.close();
    });

    footer.appendChild(confirmBtn);

    if (this.showCancel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'modal-cancel';
      cancelBtn.textContent = this.cancelText;
      cancelBtn.addEventListener('click', () => {
        if (this.onCancel) this.onCancel();
        else this.close();
      });
      footer.prepend(cancelBtn);
    }

    // 组装
    this._el.append(closeBtn, header, body, footer);
    this._overlay.appendChild(this._el);

    // 点击遮罩关闭
    this._overlay.addEventListener('click', (e) => {
      if (this.maskClosable && e.target === this._overlay) {
        if (this.onCancel) this.onCancel();
        else this.close();
      }
    });
  }

  /** 打开弹窗 */
  open() {
    document.body.appendChild(this._overlay);
    // 强制回流后再添加 class，确保动画触发
    void this._overlay.offsetHeight;
    this._overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    if (this.onOpen) this.onOpen();
  }

  /** 关闭弹窗 */
  close() {
    this._overlay.classList.remove('visible');
    this._overlay.addEventListener('transitionend', () => {
      if (!this._overlay.classList.contains('visible')) {
        this._overlay.remove();
        document.body.style.overflow = '';
      }
    }, { once: true });
    if (this.onClose) this.onClose();
  }

  /** 销毁实例 */
  destroy() {
    this._overlay.remove();
    document.body.style.overflow = '';
  }
}
