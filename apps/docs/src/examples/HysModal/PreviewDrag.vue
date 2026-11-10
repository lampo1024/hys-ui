<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysModal, HysTable } from "hys-ui";
const open = ref(false);
const rows = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  name: `资源 ${i + 1}`,
  status: i % 2 ? "待检查" : "已就绪",
}));
const columns = [
  { key: "id", label: "编号", width: 80 },
  { key: "name", label: "资源名称", width: 220 },
  { key: "status", label: "状态", width: 120 },
];
</script>
<template>
  <div class="demo-content">
    <HysButton @click="open = true">体验预览框拖动</HysButton>
  </div>
  <HysModal
    v-model:open="open"
    title="预览拖动工作区"
    draggable
    drag-mode="preview"
    footer
    :width="720"
    :height="520"
  >
    <p>
      拖动移动手柄时，实体内容保留在原处，预览框标出目标位置。释放鼠标后，实体平滑移动到目标；按
      Esc 撤销本次移动。
    </p>
    <HysTable :rows="rows" :columns="columns" :pagination="false" />
  </HysModal>
</template>
