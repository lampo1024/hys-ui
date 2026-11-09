<script setup lang="ts">
import { ref } from "vue";
import { HysDateRangePicker, type HysDatePickerValue } from "hys-ui";
const value = ref<HysDatePickerValue>(["2026-11-02", ""]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysDateRangePicker
        v-model="value"
        :allow-empty="[true, true]"
        editable
        clearable
      />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      允许开放的开始或结束边界；可在弹层中清除单个端点，再确认保存。
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
