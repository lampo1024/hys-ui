<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysDatePicker, type HysDateTimeOptions } from "hys-ui";

const slot = ref("");
const arrows = ref(false);
const clock: HysDateTimeOptions = {
  defaultValue: new Date(2026, 10, 6, 14),
  use12Hours: true,
  minuteStep: 15,
  hideDisabledOptions: true,
};
const disabledHours = () =>
  Array.from({ length: 24 }, (_, hour) => hour).filter(
    (hour) => hour < 9 || hour >= 18,
  );
</script>

<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysCheckbox v-model="arrows">显示时间步进按钮</HysCheckbox>
      <HysDatePicker
        v-model="slot"
        type="datetime"
        placeholder="选择预约时段"
        default-picker-value="2026-11-06"
        date-format="YYYY/MM/DD ddd"
        time-format="hh:mm A"
        :show-time="clock"
        :disabled-hours="disabledHours"
        :arrow-control="arrows"
        :show-now="false"
        clearable
      >
        <template #extra-footer
          ><span class="scenario-note">可预约时段为 09:00–17:59</span></template
        >
      </HysDatePicker>
    </div>
    <output class="state-output">{{ slot || "尚未预约" }}</output>
    <p class="scenario-note">
      选择日期后可直接编辑面板内的日期与时刻，或切换到时间视图后确认。
    </p>
  </div>
</template>
