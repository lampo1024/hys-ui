<script setup lang="ts">
import { ref } from "vue";
import { HysDateRangePicker, HysButton } from "hys-ui";
const value = ref<[string, string]>(["2026-11-02", "2026-11-20"]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysDateRangePicker v-model="value" show-confirm
        ><template #header><strong>选择实施窗口</strong></template
        ><template #footer="{ dates, confirm, cancel }"
          ><span class="date-demo-summary"
            >{{ dates.filter(Boolean).length }} 个端点</span
          ><HysButton size="sm" variant="ghost" @click="cancel">取消</HysButton
          ><HysButton size="sm" @click="confirm">应用范围</HysButton></template
        ></HysDateRangePicker
      >
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
