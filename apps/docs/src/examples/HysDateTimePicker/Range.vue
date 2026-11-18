<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysDateTimePicker } from "hys-ui";
const range = ref<readonly [string, string] | null>(null);
const singlePanel = ref(true);
const shortcuts = [{ label: "今天 09:00–12:00", value: () => {
  const start = new Date();
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(12);
  return [start, end];
} }];
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="singlePanel">在一个日历面板中选择范围</HysCheckbox>
    <HysDateTimePicker v-model="range" range :single-panel="singlePanel" :shortcuts="shortcuts" :minute-step="30" :show-seconds="false"
      time-zone-label="系统本地时区" aria-label="维护时间范围" placeholder="选择维护时段" />
    <p role="status">{{ range?.some(Boolean) ? range.join(" 至 ") : "尚未选择维护时段" }}</p>
  </div>
</template>
