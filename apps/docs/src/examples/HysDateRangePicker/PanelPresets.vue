<script setup lang="ts">
import { ref } from "vue";
import {
  HysDateRangePicker,
  type HysDatePanelValues,
  type HysDateRangeValue,
  type HysDateShortcut,
} from "hys-ui";

const period = ref<HysDateRangeValue>(null);
const months = ref<HysDatePanelValues>([
  new Date(2026, 9, 1),
  new Date(2026, 11, 1),
]);
const presets: HysDateShortcut[] = [
  { label: "第四季度", value: ["2026-10-01", "2026-12-31"] },
  { label: "年末结算", value: () => ["2026-12-21", "2026-12-31"] },
];
const formatMonth = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "short",
});
</script>

<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysDateRangePicker
        v-model="period"
        v-model:panel-values="months"
        aria-label="结算区间"
        :single-panel="false"
        unlink-panels
        show-confirm
        :presets="presets"
        :ranges="{ '11 月': ['2026-11-01', '2026-11-30'] }"
        shortcut-placement="start"
      >
        <template #date-render="{ text, today, rangeStart, rangeEnd }">
          <strong v-if="today || rangeStart || rangeEnd">{{ text }}</strong>
          <span v-else>{{ text }}</span>
        </template>
      </HysDateRangePicker>
    </div>
    <output class="state-output">{{ period || "尚未确认区间" }}</output>
    <p class="scenario-note">
      浏览位置
      {{
        months.map((date) => formatMonth.format(new Date(date))).join(" / ")
      }}。分别翻页或选择预设后确认，窄屏可点击月份切换日历。
    </p>
  </div>
</template>
