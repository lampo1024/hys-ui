<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker, HysSelect, type HysDatePickerValue } from "hys-ui";

type RangeType = "daterange" | "monthrange" | "quarterrange" | "datetimerange";
const type = ref<RangeType>("daterange");
const value = ref<HysDatePickerValue>(null);
const defaultTime = ["09:00", "17:30"] as const;
const options: { label: string; value: RangeType }[] = [
  { label: "日期范围", value: "daterange" },
  { label: "月份范围", value: "monthrange" },
  { label: "季度范围", value: "quarterrange" },
  { label: "日期时间范围", value: "datetimerange" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysSelect
        v-model="type"
        aria-label="范围类型"
        :options="options"
        @change="value = null"
      />
      <HysDatePicker
        :key="type"
        v-model="value"
        :type="type"
        :value-format="type === 'daterange' ? 'YYYY-MM-DD HH:mm:ss' : undefined"
        :default-time="
          type === 'daterange' || type === 'datetimerange'
            ? defaultTime
            : undefined
        "
        :placeholder="['统计开始', '统计结束']"
        :default-picker-value="[new Date(2026, 10, 1), new Date(2026, 11, 1)]"
        clearable
      >
        <template #range-separator>→</template>
      </HysDatePicker>
    </div>
    <output class="state-output">{{ value || "尚未选择范围" }}</output>
    <p class="scenario-note">
      日期范围自动附加 09:00 和 17:30，切换为日期时间范围可以分别修改起止时刻。
    </p>
  </div>
</template>
