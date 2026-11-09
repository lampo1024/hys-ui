<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker } from "hys-ui";
const day = ref("2026-11-06"),
  week = ref("2026-11-02"),
  month = ref("2026-11"),
  quarter = ref("2026-Q4"),
  year = ref("2026");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="date-demo-grid">
        <label>日期<HysDatePicker v-model="day" /></label
        ><label>周<HysDatePicker v-model="week" type="week" /></label
        ><label>月份<HysDatePicker v-model="month" type="month" /></label
        ><label>季度<HysDatePicker v-model="quarter" type="quarter" /></label
        ><label>年份<HysDatePicker v-model="year" type="year" /></label>
      </div>
    </div>
    <output class="state-output">{{
      { day, week, month, quarter, year }
    }}</output>
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
