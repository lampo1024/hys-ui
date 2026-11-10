<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysModal } from "hys-ui";
const open = ref(false),
  result = ref("尚未操作");
</script>
<template>
  <div class="demo-content">
    <HysButton @click="open = true">打开基础弹窗</HysButton>
  </div>
  <p class="state-output">{{ result }}</p>
  <HysModal
    v-model:open="open"
    title="发布更新"
    description="检查更新内容后，确认继续本次操作。"
    footer
    @ok="result = '已确认发布'"
    @cancel="result = '已取消操作'"
  >
    <p>弹窗提供确认、取消、遮罩关闭和 Escape 操作，并管理焦点与页面滚动。</p>
  </HysModal>
</template>
