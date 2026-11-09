<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker } from "hys-ui";
const value = ref("2026-11-06 09:30:00"),
  empty = ref("");
const disabledTime = () => ({
  hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 18, 19, 20, 21, 22, 23],
});
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="date-demo-grid">
        <label
          >日期与时间<HysDatePicker
            v-model="value"
            type="datetime"
            :disabled-time="disabledTime"
            :minute-step="15"
            :show-seconds="false" /></label
        ><label
          >默认时刻<HysDatePicker
            v-model="empty"
            show-time
            default-time="09:00:00"
            clearable
        /></label>
      </div>
    </div>
    <output class="state-output">{{ value }} · {{ empty || "未选择" }}</output>
    <p class="scenario-note">
      日期与时分秒在同一弹层选择，时间列表由 HysSelect
      展示。确认后提交，取消放弃草稿。
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
