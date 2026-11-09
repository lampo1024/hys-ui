<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker, HysButton, type HysDatePickerInstance } from "hys-ui";
const api = ref<HysDatePickerInstance>(),
  value = ref("2026-11-06");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="demo-control-actions">
        <HysButton size="sm" variant="secondary" @click="api?.show()"
          >打开并聚焦日期</HysButton
        ><HysButton
          size="sm"
          variant="secondary"
          @click="api?.showMonth('2027-01-01')"
          >定位到明年一月</HysButton
        ><HysButton size="sm" variant="ghost" @click="api?.clear()"
          >清空</HysButton
        >
      </div>
      <HysDatePicker ref="api" v-model="value" />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      方向键浏览，Home / End 到本周首尾，PageUp / PageDown 切换月份，Ctrl
      加翻页键切换年份；Enter 选择，Esc 关闭并恢复焦点。
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
