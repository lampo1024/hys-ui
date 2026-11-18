<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysImageViewer, HysSegmented, type HysImageViewerTransition } from "hys-ui";
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
const transition = ref<HysImageViewerTransition>("slide");
const transitions = [
  { label: "渐变", value: "fade" },
  { label: "滑动", value: "slide" },
  { label: "推近", value: "zoom" },
  { label: "关闭", value: "none" },
] as const;
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
    <HysSegmented v-model="transition" :options="transitions" size="sm" aria-label="图片切换动效" />
    <span role="status">当前位置 · {{ images[index].title }}</span>
    <HysImageViewer
      v-model:open="open"
      v-model:index="index"
      :images="images"
      :loop="loop"
      :image-transition="transition"
      show-thumbnails
    />
  </div>
</template>
