<script setup lang="ts">
import { ref } from "vue";
import { HysDateRangePicker } from "hys-ui";
const value = ref<[string, string]>(["2026-11-02", "2026-11-20"]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysDateRangePicker v-model="value" clearable />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      整个范围由一个输入区承载。第一次选择开始日期，第二次选择结束日期；反向选择自动排序，取消不改写已选范围。
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
