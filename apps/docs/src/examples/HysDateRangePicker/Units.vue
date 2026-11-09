<script setup lang="ts">
import { ref } from "vue";
import { HysDateRangePicker } from "hys-ui";
const months = ref<[string, string]>(["2026-10", "2027-02"]),
  years = ref<[string, string]>(["2025", "2027"]),
  quarters = ref<[string, string]>(["2026-Q2", "2027-Q1"]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="date-demo-grid">
        <label
          >月份范围<HysDateRangePicker v-model="months" type="month" /></label
        ><label
          >年份范围<HysDateRangePicker v-model="years" type="year" /></label
        ><label
          >季度范围<HysDateRangePicker v-model="quarters" type="quarter"
        /></label>
      </div>
    </div>
    <output class="state-output">{{ { months, years, quarters } }}</output>
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
