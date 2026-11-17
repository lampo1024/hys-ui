<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysImageViewer } from "hys-ui";
import chart from "../../../../../docs/assets/readme/chart-combination.png";
import gantt from "../../../../../docs/assets/readme/gantt-dependencies.png";
import workbook from "../../../../../docs/assets/readme/spreadsheet-workbook.png";
const images = [
  { src: chart, title: "经营图表", alt: "图表趋势示意" },
  { src: gantt, title: "交付计划", alt: "甘特图任务和依赖" },
  { src: workbook, title: "核对工作簿", alt: "预算工作表" },
];
const open = ref(false);
const index = ref(0);
const loop = ref(true);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysButton
        size="sm"
        variant="secondary"
        @click="
          index = 1;
          open = true;
        "
        >从交付计划开始</HysButton
      >
      <HysCheckbox v-model="loop">循环浏览</HysCheckbox>
    </div>
    <span role="status">当前位置 · {{ images[index].title }}</span>
    <HysImageViewer
      v-model:open="open"
      v-model:index="index"
      :images="images"
      :loop="loop"
      show-thumbnails
    />
  </div>
</template>
