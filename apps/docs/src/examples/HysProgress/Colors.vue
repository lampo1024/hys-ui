<script setup lang="ts">
import { ref } from "vue";
import {
  HysProgress,
  HysSlider,
  HysColorPicker,
  type HysProgressColorStop,
} from "hys-ui";
const value = ref(45),
  color = ref("#3867f5");
const stops: readonly HysProgressColorStop[] = [
  { value: 30, color: "#ef4444" },
  { value: 65, color: "#f59e0b" },
  { value: 100, color: "#10b981" },
];
const dynamic = (value: number) => (value < 50 ? "#8b5cf6" : "#06b6d4");
</script>
<template>
  <div class="demo-stack">
    <HysSlider v-model="value" aria-label="颜色示例进度" /><label
      class="demo-field"
      >自定义颜色<HysColorPicker v-model="color" /></label
    ><HysProgress
      :value="value"
      :color="color"
      aria-label="固定颜色"
    /><HysProgress
      :value="value"
      :color="stops"
      aria-label="阈值颜色"
    /><HysProgress :value="value" :color="dynamic" aria-label="函数颜色" />
    <p class="scenario-note">
      阈值列表使用 value /
      color，组件复制后排序；命中第一个大于等于当前值的阈值。函数接收已归一的百分比。
    </p>
  </div>
</template>
