<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker } from "hys-ui";
const dates = ref(["2026-11-03", "2026-11-06"]),
  months = ref(["2026-10", "2026-11"]);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <div class="date-demo-grid">
        <label
          >选择多个日期（最多三项）<HysDatePicker
            v-model="dates"
            type="dates"
            :max-dates="3"
            clearable /></label
        ><label
          >选择多个月份<HysDatePicker v-model="months" type="months" clearable
        /></label>
      </div>
    </div>
    <output class="state-output">{{ dates }} · {{ months }}</output>
    <p class="scenario-note">
      再次点击可取消选中；确认后统一提交，取消保留原值。数量限制只约束新的有效选择。
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
