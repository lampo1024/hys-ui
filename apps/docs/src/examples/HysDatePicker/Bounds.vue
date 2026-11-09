<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker } from "hys-ui";
const value = ref("2026-11-06");
const disabledDate = (date: Date) => [0, 6].includes(date.getUTCDay());
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysDatePicker
        v-model="value"
        min="2026-11-01"
        max="2026-11-30"
        :disabled-date="disabledDate"
      />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      只允许十一月的工作日；标题仍可快速浏览其他年份和月份，被排除的日期不能提交。
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
