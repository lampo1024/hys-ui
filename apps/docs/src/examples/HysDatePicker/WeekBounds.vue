<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker, HysCheckbox, type HysDatePickerWeek } from "hys-ui";
const value = ref("2026-11-09"),
  full = ref(true);
const unavailable = (week: HysDatePickerWeek) => week.start === "2026-11-16";
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="full">整周必须在有效日期范围内</HysCheckbox>
    </div>
    <div class="demo-content">
      <HysDatePicker
        v-model="value"
        type="week"
        min="2026-11-03"
        max="2026-11-27"
        :week-validation="full ? 'full' : 'any'"
        :disabled-week="unavailable"
        clearable
      />
    </div>
    <output class="state-output">{{ value || "未选择" }}</output>
    <p class="scenario-note">
      有效日期为 11 月 3–27 日，11 月 16 日所在周暂停排班。full
      要求整周日期可用，any 允许至少一天可用的周；变更约束不会擅自清空已有值。
    </p>
  </div>
</template>
