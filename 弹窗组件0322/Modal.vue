<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleMaskClose">
        <Transition name="modal-scale" appear>
          <div v-if="modelValue" class="modal-container" :style="{ width }">
            <!-- 头部 -->
            <div class="modal-header">
              <span class="modal-title">{{ title }}</span>
              <button
                v-if="showCloseBtn"
                class="modal-close"
                @click="close"
                aria-label="关闭"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>

            <!-- 内容区域 -->
            <div class="modal-body">
              <slot />
            </div>

            <!-- 底部（可选） -->
            <div v-if="$slots.footer" class="modal-footer">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  /** 控制弹窗显示/隐藏，支持 v-model */
  modelValue: { type: Boolean, default: false },
  /** 标题文字 */
  title: { type: String, default: '' },
  /** 弹窗宽度 */
  width: { type: String, default: '420px' },
  /** 点击遮罩是否关闭 */
  maskClosable: { type: Boolean, default: true },
  /** 是否显示右上角关闭按钮 */
  showCloseBtn: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close'])

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleMaskClose() {
  if (props.maskClosable) {
    close()
  }
}
</script>

<style scoped>
/* ---- 遮罩层 ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 16px;
  box-sizing: border-box;
}

/* 遮罩淡入淡出 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ---- 弹窗主体 ---- */
.modal-container {
  position: relative;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* 弹窗缩放进入 */
.modal-scale-enter-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-scale-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.85);
}
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* ---- 头部 ---- */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
  flex-shrink: 0;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: -8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #888;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

/* ---- 内容 ---- */
.modal-body {
  padding: 0 24px;
  overflow-y: auto;
  flex: 1;
  font-size: 15px;
  color: #444;
  line-height: 1.6;
}

.modal-body:has(+ .modal-footer) {
  padding-bottom: 12px;
}

/* ---- 底部 ---- */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  flex-shrink: 0;
}

/* ---- 移动端适配 ---- */
@media (max-width: 480px) {
  .modal-container {
    width: 100% !important;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
    align-self: flex-end;
  }

  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .modal-header {
    padding: 18px 20px 10px;
  }

  .modal-body {
    padding: 0 20px;
  }

  .modal-footer {
    padding: 14px 20px;
  }
}
</style>
