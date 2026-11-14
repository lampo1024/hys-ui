<script setup lang="ts">
import { ref } from "vue";
import { HysCalendarNavigation, HysCheckbox } from "hys-ui";

const month = ref(new Date(Date.UTC(2026, 11, 1)));
const today = new Date(Date.UTC(2027, 0, 8));
const english = ref(false);
const formatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  timeZone: "UTC",
});
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="english" label="显示英文月份" />
    </div>
    <div class="calendar-preview">
      <HysCalendarNavigation
        v-model:month="month"
        :today="today"
        :locale="english ? 'en-US' : undefined"
        min="2026-11-01"
        max="2027-02-28"
        show-today
      >
        <template #default="{ month: visibleMonth }">
          <output class="review-month"
            >{{ formatter.format(visibleMonth) }}结算</output
          >
        </template>
      </HysCalendarNavigation>
    </div>
    <p class="calendar-hint">
      可查阅 2026 年 11 月至 2027 年 2 月。示例的本月为 2027 年 1 月。
    </p>
  </div>
</template>

<style scoped>
.calendar-preview {
  width: min(100%, 360px);
  padding: 14px;
  border: 1px solid var(--docs-border);
  border-radius: 10px;
}
.review-month {
  margin: 0;
  padding-block: 28px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}
.calendar-hint {
  margin: 0;
  color: var(--docs-muted);
  font-size: 13px;
}
</style>
