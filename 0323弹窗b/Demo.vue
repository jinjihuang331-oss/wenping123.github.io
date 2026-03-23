<template>
  <div class="demo-page">
    <button @click="visible = true">打开弹窗</button>

    <Modal v-model="visible" title="标题" @close="onClose">
      <p>这是弹窗内容区域，支持自定义插槽。</p>
      <template #footer>
        <button class="btn btn-cancel" @click="visible = false">取消</button>
        <button class="btn btn-confirm" @click="onConfirm">确定</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'

const visible = ref(false)

function onClose() {
  console.log('弹窗已关闭')
}
function onConfirm() {
  console.log('确认操作')
  visible.value = false
}
</script>

<style>
.demo-page {
  padding: 40px;
  text-align: center;
}
.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-cancel {
  background: #f0f0f0;
  color: #333;
}
.btn-confirm {
  background: #409eff;
  color: #fff;
}
</style>
