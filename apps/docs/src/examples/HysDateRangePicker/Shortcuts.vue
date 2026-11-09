<script setup lang="ts">
import { ref } from "vue";
import { HysDateRangePicker, type HysDateShortcut } from "hys-ui";
const value = ref<[string, string]>(["", ""]);
const shortcuts: HysDateShortcut[] = [
  {
    label: "最近七天",
    value: () => {
      const end = new Date(),
        start = new Date();
      start.setDate(end.getDate() - 6);
      return [start, end];
    },
  },
  {
    label: "本月",
    value: () => {
      const now = new Date();
      return [
        new Date(now.getFullYear(), now.getMonth(), 1),
        new Date(now.getFullYear(), now.getMonth() + 1, 0),
      ];
    },
  },
  { label: "发布窗口", value: ["2026-11-02", "2026-11-20"] },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysDateRangePicker v-model="value" :shortcuts="shortcuts" clearable />
    </div>
    <output class="state-output">{{ value }}</output>
  </div>
</template>
<style scoped>
.date-demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 22px;
}
.date-demo-grid > label {
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 13px;
  color: var(--docs-muted);
}
.date-demo-inline {
  max-width: 350px;
}
.date-demo-cell {
  position: relative;
  display: inline-grid;
  place-items: center;
  min-width: 20px;
}
.date-demo-cell i {
  position: absolute;
  bottom: -5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}
.date-demo-summary {
  margin-inline-end: auto;
  color: var(--docs-muted);
  font-size: 12px;
}
</style>
