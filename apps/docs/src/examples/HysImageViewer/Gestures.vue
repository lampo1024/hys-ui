<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysImageViewer } from "hys-ui";
import chart from "../../../../../docs/assets/readme/chart-combination.png";
import gantt from "../../../../../docs/assets/readme/gantt-dependencies.png";
const open = ref(false);
const images = [
  { src: chart, title: "订单趋势图", description: "配送中心日订单量", filename: "orders.png" },
  { src: gantt, title: "项目计划", description: "交付排期和任务依赖", filename: "schedule.png" },
];
</script>
<template>
  <div class="demo-stack">
    <div><HysButton variant="secondary" @click="open = true">审阅原图</HysButton></div>
    <small>触屏双指缩放，适应视口时横向滑动可切图。鼠标双击切换原始尺寸和适应视口。</small>
    <HysImageViewer v-model:open="open" :images="images" touch-gestures show-info downloadable show-thumbnails />
  </div>
</template>
