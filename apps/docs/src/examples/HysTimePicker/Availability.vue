<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysTimePicker } from "hys-ui";
const value = ref<string | null>("09:00");
const blockLunch = ref(true);
const presets = [
  { label: "上午交接", value: "09:00" },
  { label: "午间处理", value: "12:30" },
  { label: "下午交接", value: "15:00" },
];
function unavailable(time: string) {
  return blockLunch.value && time >= "12:00" && time < "13:30";
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="blockLunch">午间 12:00—13:30 不可预约</HysCheckbox>
    <HysTimePicker
      v-model="value"
      min-time="09:00"
      max-time="18:00"
      :minute-step="30"
      :presets="presets"
      :disabled-time="unavailable"
      aria-label="预约交接时间"
    />
    <span role="status">预约时间 · {{ value ?? "未安排" }}</span>
  </div>
</template>
