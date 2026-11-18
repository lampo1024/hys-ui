<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysImageGallery, HysSegmented, type HysImageViewerTransition } from "hys-ui";
import chart from "../../../../../docs/assets/readme/chart-combination.png";
import gantt from "../../../../../docs/assets/readme/gantt-dependencies.png";
import sheet from "../../../../../docs/assets/readme/spreadsheet-workbook.png";

const transition = ref<HysImageViewerTransition>("slide");
const loop = ref(true);
const modes = [
  { label: "渐变", value: "fade" },
  { label: "滑动", value: "slide" },
  { label: "推近", value: "zoom" },
  { label: "关闭", value: "none" },
] as const;
const images = [
  { key: "chart", src: chart, title: "经营图表" },
  { key: "gantt", src: gantt, title: "交付计划" },
  { key: "sheet", src: sheet, title: "预算工作簿" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysSegmented v-model="transition" :options="modes" size="sm" aria-label="图片切换动效" />
      <HysCheckbox v-model="loop">循环浏览</HysCheckbox>
    </div>
    <HysImageGallery :items="images" :image-transition="transition" :loop="loop" />
  </div>
</template>
