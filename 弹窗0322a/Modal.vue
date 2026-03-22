<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="modal-overlay"
        @click.self="handleOverlayClick"
      >
        <div
          class="modal-container"
          :style="{ width, maxWidth }"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <!-- 头部 -->
          <div class="modal-header">
            <slot name="header">
              <h3 class="modal-title">{{ title }}</h3>
            </slot>
            <button
              class="modal-close"
              aria-label="关闭"
              @click="close"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- 底部 -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: '520px',
  },
  maxWidth: {
    type: String,
    default: '90vw',
  },
  closeOnOverlay: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:visible', 'close'])

function close() {
  emit('update:visible', false)
  emit('close')
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    close()
  }
}

// 打开时禁止 body 滚动
watch(
  () => props.visible,
  (val) => {
    document.body.style.overflow = val ? 'hidden' : ''
  },
)
</script>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 16px;
}

/* 弹窗容器 */
.modal-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

/* 内容区 */
.modal-body {
  padding: 12px 24px 20px;
  overflow-y: auto;
  flex: 1;
  color: #333;
  font-size: 14px;
  line-height: 1.6;
}

/* 底部 */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

/* 淡入淡出动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.92) translateY(12px);
  opacity: 0;
}

.modal-leave-to .modal-container {
  transform: scale(0.92) translateY(-8px);
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-container {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 90vh;
    border-radius: 16px 16px 0 0;
  }

  .modal-header {
    padding: 16px 20px 10px;
  }

  .modal-body {
    padding: 10px 20px 16px;
  }

  .modal-footer {
    padding: 12px 20px;
    /* 适配 iPhone 底部安全区 */
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }

  .modal-enter-from .modal-container {
    transform: translateY(100%);
    opacity: 1;
  }

  .modal-leave-to .modal-container {
    transform: translateY(100%);
    opacity: 1;
  }

  .modal-enter-active .modal-container,
  .modal-leave-active .modal-container {
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
}
</style>
