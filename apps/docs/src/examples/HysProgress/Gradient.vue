<script setup lang="ts">
import { ref } from "vue";
import { HysProgress, HysSlider, type HysProgressGradient } from "hys-ui";
const value = ref(72);
const color: HysProgressGradient = {
  from: "#06b6d4",
  to: "#8b5cf6",
  direction: "to right",
  stops: [{ offset: 50, color: "#3867f5" }],
};
</script>
<template>
  <div class="demo-stack">
    <HysSlider v-model="value" aria-label="渐变示例进度" /><HysProgress
      :value="value"
      :color="color"
      :stroke-width="12"
      aria-label="渐变线形"
    />
    <div class="demo-content progress-examples">
      <HysProgress
        :value="value"
        :color="color"
        type="circle"
        :stroke-width="10"
        aria-label="渐变环形"
      /><HysProgress
        :value="value"
        :color="color"
        type="dashboard"
        :stroke-width="10"
        aria-label="渐变仪表盘"
      />
    </div>
    <p class="scenario-note">
      线形使用 CSS 渐变，环形使用独立 SVG 渐变定义。direction
      支持方向文字或角度数值，stops 的 offset 为 0–100。
    </p>
  </div>
</template>
