<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker, type HysDatePickerValue } from "hys-ui";
const value = ref("2026-11-06"),
  empty = ref<HysDatePickerValue>(null);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="date-demo-grid">
        <label>禁用<HysDatePicker :model-value="value" disabled /></label
        ><label>只读<HysDatePicker :model-value="value" readonly /></label
        ><label
          >错误反馈<HysDatePicker :model-value="''" status="error" /></label
        ><label
          >空值与清空<HysDatePicker
            v-model="empty"
            :clear-value="null"
            clearable
        /></label>
      </div>
    </div>
    <output class="state-output">{{ empty }}</output>
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
