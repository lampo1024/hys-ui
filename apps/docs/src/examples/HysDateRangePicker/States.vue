<script setup lang="ts">
import { ref } from "vue";
import { HysDateRangePicker, type HysDatePickerValue } from "hys-ui";
const value = ref<[string, string]>(["2026-11-02", "2026-11-20"]),
  date = ref<HysDatePickerValue>([
    new Date(2026, 10, 2),
    new Date(2026, 10, 20),
  ]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="date-demo-grid">
        <label>禁用<HysDateRangePicker :model-value="value" disabled /></label
        ><label>只读<HysDateRangePicker :model-value="value" readonly /></label
        ><label
          >Date 对象范围<HysDateRangePicker
            v-model="date"
            value-type="date"
            clearable /></label
        ><label
          >错误状态<HysDateRangePicker :model-value="['', '']" status="error"
        /></label>
      </div>
    </div>
    <output class="state-output">{{ date }}</output>
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
