<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysImageViewer } from "hys-ui";
import sheet from "../../../../../docs/assets/readme/spreadsheet-workbook.png";
const open = ref(false);
</script>
<template>
  <div class="demo-stack">
    <HysButton size="sm" variant="secondary" @click="open = true"
      >查看验收原图</HysButton
    >
    <small
      >点「原始尺寸」按像素检查，拖动放大的图片平移，也可按 Ctrl / ⌘
      滚轮缩放。</small
    >
    <HysImageViewer
      v-model:open="open"
      :images="{ src: sheet, alt: '预算工作簿的原始截图' }"
      title="核对工作簿细节"
      wheel-zoom
    />
  </div>
</template>
