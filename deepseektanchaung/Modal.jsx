import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const ANIMATION_DURATION = 280; // ms，与 CSS transition 保持一致

export default function Modal({
  visible = false,
  onClose,
  title,
  children,
  footer,
  width = 520,
  closable = true,
  maskClosable = true,
  keyboard = true,
  destroyOnClose = false,
  zIndex = 1000,
  className = '',
  style = {},
}) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef(null);
  const ignoreNextMouseUp = useRef(false);

  // 进入动画
  useEffect(() => {
    if (visible) {
      setMounted(true);
      // 下一帧触发进入动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShow(true);
          setAnimating(true);
        });
      });
    } else if (mounted) {
      // 离开动画
      setShow(false);
      setAnimating(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setAnimating(false);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // ESC 关闭
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && keyboard && visible) {
      e.stopPropagation();
      onClose?.();
    }
  }, [keyboard, visible, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 锁定 body 滚动
  useEffect(() => {
    if (mounted) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mounted]);

  // 关闭时触发离开动画
  const handleClose = useCallback(() => {
    if (!animating) {
      onClose?.();
    }
  }, [animating, onClose]);

  // 点击遮罩关闭：在 mouseup 上校验，避免拖选文字时误关闭
  const handleMaskMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      ignoreNextMouseUp.current = false;
    }
  };

  const handleMaskMouseUp = (e) => {
    if (e.target === e.currentTarget && !ignoreNextMouseUp.current && maskClosable) {
      handleClose();
    }
  };

  // 内容区域阻止冒泡
  const handleContentMouseDown = (e) => {
    e.stopPropagation();
  };

  const handleContentMouseUp = (e) => {
    ignoreNextMouseUp.current = true;
  };

  if (!mounted && !destroyOnClose) {
    return null;
  }

  if (destroyOnClose && !visible && !animating) {
    return null;
  }

  return createPortal(
    <div
      className={`modal-root ${show ? 'modal-root--visible' : ''} ${className}`}
      style={{ zIndex, ...style }}
      onMouseDown={handleMaskMouseDown}
      onMouseUp={handleMaskMouseUp}
    >
      <div className="modal-mask" />
      <div className="modal-wrap" onMouseDown={handleMaskMouseDown} onMouseUp={handleMaskMouseUp}>
        <div
          ref={contentRef}
          className={`modal-content ${show ? 'modal-content--visible' : ''}`}
          style={{ width: typeof width === 'number' ? Math.min(width, window.innerWidth - 32) : width }}
          onMouseDown={handleContentMouseDown}
          onMouseUp={handleContentMouseUp}
        >
          {closable && (
            <button
              type="button"
              className="modal-close"
              onClick={handleClose}
              aria-label="关闭"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 2l12 12M14 2L2 14" />
              </svg>
            </button>
          )}
          {title && <div className="modal-header">{title}</div>}
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}
