<script setup lang="ts">
import { ref } from "vue";
import { HysImageGallery, HysSelect, type HysGalleryImage } from "hys-ui";
import chart from "../../../../../docs/assets/readme/chart-combination.png";
import gantt from "../../../../../docs/assets/readme/gantt-dependencies.png";
const selected = ref<(number | string)[]>([]);
const layout = ref<"grid" | "list">("grid");
const images: HysGalleryImage[] = [{ key: 1, src: chart, title: "经营报表", description: "订单量组合图" }, { key: 2, src: gantt, title: "交付计划", description: "甘特图时间轴" }];
</script>

<template>
  <div class="demo-stack">
    <HysSelect v-model="layout" :options="[{ label: '网格', value: 'grid' }, { label: '缩略列表', value: 'list' }]" aria-label="图库布局" />
    <HysImageGallery v-model:selected-keys="selected" :items="images" :layout="layout" selectable />
    <p aria-live="polite">选中 {{ selected.length }} 张</p>
  </div>
</template>
