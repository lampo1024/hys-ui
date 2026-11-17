<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysImageViewer, type HysImageViewerItem } from "hys-ui";
import chart from "../../../../../docs/assets/readme/chart-combination.png";
import gantt from "../../../../../docs/assets/readme/gantt-dependencies.png";
import grid from "../../../../../docs/assets/readme/spreadsheet-workbook.png";
const images: HysImageViewerItem[] = [
  { src: chart, alt: "柱线组合图", title: "图表" },
  { src: gantt, alt: "任务排期与依赖", title: "甘特图" },
  { src: grid, alt: "月度预算工作表", title: "电子表格" },
];
const start = ref(0);
const open = ref(false);
function view(index: number) {
  start.value = index;
  open.value = true;
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-gallery">
      <HysButton
        v-for="(item, index) in images"
        :key="item.src"
        variant="secondary"
        :aria-label="'预览' + item.title"
        @click="view(index)"
      >
        <span class="demo-thumb"
          ><img :src="item.src" alt="" loading="lazy" />{{ item.title }}</span
        >
      </HysButton>
    </div>
    <HysImageViewer
      v-model:open="open"
      :images="images"
      :initial-index="start"
    />
  </div>
</template>
<style scoped>
.demo-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(130px, 100%), 1fr));
  gap: 8px;
}
.demo-gallery :deep(.hys-ui-btn) {
  height: auto;
  padding: 5px;
  min-width: 0;
}
.demo-thumb {
  display: grid;
  gap: 4px;
  width: 100%;
}
.demo-thumb img {
  display: block;
  width: 100%;
  aspect-ratio: 2;
  object-fit: cover;
  border-radius: 4px;
}
</style>
