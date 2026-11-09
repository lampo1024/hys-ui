<script setup lang="ts">
import { ref } from "vue";
import { HysDateRangePicker, type HysDatePickerChange } from "hys-ui";
const value = ref<[string, string]>(["2026-11-02", "2026-11-23"]);
const summary = ref("2026-11-02 至 2026-11-29");
function changed(_value: [string, string], info: HysDatePickerChange) {
  const [first, last] = info.weeks ?? [];
  summary.value =
    first && last ? `${first.start} 至 ${last.end}` : "未选择完整范围";
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content">
      <HysDateRangePicker
        v-model="value"
        type="week"
        format="GGGG-[W]WW"
        :single-panel="false"
        clearable
        @change="changed"
      />
    </div>
    <output class="state-output"
      >覆盖日期：{{ summary }} · 绑定周起始日期：{{ value }}</output
    >
    <p class="scenario-note">
      在同一个选择器内选择开始周和结束周，支持反向选择与跨年范围。两个绑定值分别为所选周的起始日期，完整覆盖终点取
      weeks[1].end。
    </p>
  </div>
</template>
