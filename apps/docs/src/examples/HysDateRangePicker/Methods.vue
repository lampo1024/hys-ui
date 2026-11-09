<script setup lang="ts">
import { ref } from "vue";
import {
  HysDateRangePicker,
  HysButton,
  type HysDatePickerInstance,
} from "hys-ui";
const api = ref<HysDatePickerInstance>(),
  value = ref<[string, string]>(["2026-11-02", "2026-11-20"]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="demo-control-actions">
        <HysButton
          size="sm"
          variant="secondary"
          @click="api?.showMonth('2027-01-01')"
          >定位明年一月</HysButton
        ><HysButton
          size="sm"
          variant="secondary"
          @click="api?.setValue(['2026-12-01', '2026-12-18'])"
          >设置十二月范围</HysButton
        ><HysButton size="sm" variant="ghost" @click="api?.clear()"
          >清空</HysButton
        >
      </div>
      <HysDateRangePicker ref="api" v-model="value" clearable />
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
