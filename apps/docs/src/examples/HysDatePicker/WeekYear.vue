<script setup lang="ts">
import { ref } from "vue";
import { HysDatePicker, type HysDateShortcut } from "hys-ui";
const value = ref("2020-W53");
const shortcuts: HysDateShortcut[] = [
  { label: "2020 年第 53 周", value: "2020-W53" },
  { label: "2021 年第一周", value: "2021-W01" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content">
      <HysDatePicker
        v-model="value"
        type="week"
        value-format="GGGG-[W]WW"
        format="GGGG 年第 WW 周"
        editable
        clearable
        :shortcuts="shortcuts"
      />
    </div>
    <output class="state-output">周编号绑定：{{ value || "未选择" }}</output>
    <p class="scenario-note">
      ISO 周使用 GGGG（周所属年）与 WW。2021 年 1 月 1 日属于 2020 年第 53
      周；2021-W53 无效，不会被自动进位。
    </p>
  </div>
</template>
