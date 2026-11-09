<script setup lang="ts">
import { ref } from "vue";
import { HysDateRangePicker, HysCheckbox } from "hys-ui";
const value = ref<[string, string]>(["2026-11-02", "2026-11-05"]),
  continuous = ref(false);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="demo-controls">
        <HysCheckbox v-model="continuous">整个区间不能跨过周末</HysCheckbox>
      </div>
      <HysDateRangePicker
        v-model="value"
        min="2026-11-01"
        max="2026-12-31"
        :min-range-days="2"
        :max-range-days="14"
        :range-validation="continuous ? 'continuous' : 'endpoints'"
        :disabled-date="(date) => [0, 6].includes(date.getUTCDay())"
      />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      长度按含首尾的自然日计算。默认检查两个端点，连续校验模式还会检查中间日期。
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
