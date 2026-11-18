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
    <small>滚轮缩放，拖动图片或用小地图查看细节。可拖动小地图的手柄调整位置。工具栏支持全屏，按 Esc 退回弹窗。</small>
    <HysImageViewer
      v-model:open="open"
      :images="{ src: sheet, alt: '预算工作簿的原始截图' }"
      title="核对工作簿细节"
    />
  </div>
</template>
