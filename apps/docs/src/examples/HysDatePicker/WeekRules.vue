<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker, HysSelect, type HysDatePickerWeek } from "hys-ui";
const standard = ref("iso"),
  iso = ref("2027-01-04"),
  sunday = ref("2026-12-27");
const options = [
  { label: "ISO：星期一开始，包含 1 月 4 日为第一周", value: "iso" },
  { label: "星期日开始，包含 1 月 1 日为第一周", value: "sunday" },
];
const weekLabel = (week: HysDatePickerWeek) =>
  `W${String(week.week).padStart(2, "0")}`;
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysSelect
        v-model="standard"
        :options="options"
        aria-label="周编号规则"
      />
    </div>
    <div class="demo-content">
      <HysDatePicker
        v-if="standard === 'iso'"
        v-model="iso"
        type="week"
        :first-day-of-week="1"
        :first-week-contains-date="4"
        :week-number-formatter="weekLabel"
      /><HysDatePicker
        v-else
        v-model="sunday"
        type="week"
        :first-day-of-week="0"
        :first-week-contains-date="1"
        :week-number-formatter="weekLabel"
      />
    </div>
    <output class="state-output"
      >周起始日期：{{ standard === "iso" ? iso : sunday }}</output
    >
    <p class="scenario-note">
      firstDayOfWeek 决定每周起始日，firstWeekContainsDate
      决定一月第几日所在周为第一周；面板周编号、文本格式与解析保持同一规则。
    </p>
  </div>
</template>
