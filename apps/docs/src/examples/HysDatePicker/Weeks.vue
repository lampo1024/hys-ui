<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker, type HysDatePickerChange } from "hys-ui";
const value = ref("2026-11-02"),
  summary = ref("2026-11-02 至 2026-11-08");
function changed(_value: string, info: HysDatePickerChange) {
  const week = info.weeks?.[0];
  summary.value = week
    ? `${week.year} 年第 ${week.week} 周 · ${week.start} 至 ${week.end}`
    : "未选择";
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content">
      <HysDatePicker
        v-model="value"
        type="week"
        format="GGGG 年第 WW 周"
        clearable
        @change="changed"
      />
    </div>
    <output class="state-output">{{ summary }}</output>
    <p class="scenario-note">
      点击日期或左侧周编号选择整周；默认从星期一开始，绑定值为周一日期。change
      的 weeks 提供周所属年份、编号、起止日期和每日日期。
    </p>
  </div>
</template>
