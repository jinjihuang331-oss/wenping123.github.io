<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-mask"
        @click.self="onMaskClick"
      >
        <div class="modal-wrapper" :style="modalStyle">
          <button
            v-if="showClose"
            class="modal-close"
            @click="close"
            aria-label="关闭"
          >&times;</button>
          <div class="modal-header" v-if="$slots.header || title">
            <slot name="header">
              <h3>{{ title }}</h3>
            </slot>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div class="modal-footer" v-if="$slots.footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  maskClosable: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  width: {
    type: String,
    default: '90vw'
  },
  maxWidth: {
    type: String,
    default: '500px'
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const modalStyle = computed(() => ({
  width: props.width,
  maxWidth: props.maxWidth
}))

function onMaskClick() {
  if (props.maskClosable) {
    close()
  }
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.modal-wrapper {
  position: relative;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 2px 6px;
  transition: color 0.2s;
}
.modal-close:hover {
  color: #333;
}

.modal-header {
  margin-bottom: 16px;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.modal-body {
  color: #666;
  font-size: 15px;
  line-height: 1.6;
}

.modal-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 淡入淡出动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-active .modal-wrapper,
.modal-leave-active .modal-wrapper {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-wrapper,
.modal-leave-to .modal-wrapper {
  transform: scale(0.9) translateY(10px);
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .modal-wrapper {
    width: 92vw !important;
    max-width: 92vw !important;
    border-radius: 10px;
    padding: 20px 16px;
  }
}
</style>
