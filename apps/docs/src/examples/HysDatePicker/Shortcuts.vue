<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker, type HysDateShortcut } from "hys-ui";
const value = ref("2026-11-06");
const shortcuts: HysDateShortcut[] = [
  { label: "今天", value: () => new Date() },
  {
    label: "昨天",
    value: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d;
    },
  },
  { label: "项目启动日", value: "2026-11-02" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysDatePicker v-model="value" :shortcuts="shortcuts" clearable />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      函数形式在点击时计算。快捷值同样遵守日期边界和禁用规则。
    </p>
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
