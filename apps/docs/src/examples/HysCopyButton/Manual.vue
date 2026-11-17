<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysCopyButton } from "hys-ui";
const denied = ref(true);
function reject(): never {
  throw new Error("模拟系统拒绝");
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="denied">模拟浏览器拒绝剪贴板写入</HysCheckbox>
    <HysCopyButton
      text="归档路径：/projects/archive/交付材料"
      label="复制归档路径"
      icon-only
      manual-fallback
      :feedback-duration="0"
      :write-text="denied ? reject : undefined"
    />
    <small>写入失败时点击「选择文本」，再使用系统的复制命令。</small>
  </div>
</template>
