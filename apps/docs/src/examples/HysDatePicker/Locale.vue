<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker } from "hys-ui";
const value = ref("2026-11-06");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysDatePicker
        v-model="value"
        locale="en-US"
        :first-day-of-week="0"
        show-week-numbers
        placeholder="Choose a date"
      />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      locale 设置月份与星期名称；firstDayOfWeek 可以单独覆盖每周起始日。messages
      可定制操作文字。
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
