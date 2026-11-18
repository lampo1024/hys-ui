<script setup lang="ts">
import { ref } from "vue";
import { HysWatermark, HysCheckbox, HysSlider } from "hys-ui";
import mark from "../../../../../docs/assets/readme/chart-combination.png";
const image = ref(true);
const combine = ref(true);
const opacity = ref(20);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox v-model="image">使用图片水印</HysCheckbox>
      <HysCheckbox v-model="combine" :disabled="!image">同时显示文字</HysCheckbox>
      <HysSlider v-model="opacity" :min="5" :max="45" aria-label="水印透明度" style="width: 180px" />
    </div>
    <HysWatermark text="项目资料" :image="image ? mark : undefined" :combine="combine" :opacity="Number(opacity) / 100" :size="[120, 72]" :gap="[28, 18]">
      <section style="min-height: 150px; padding: 16px; background: var(--hys-ui-theme-surface-alt)"><h3>季度经营报表</h3><p>报表已同步到项目工作区。</p></section>
    </HysWatermark>
  </div>
</template>
