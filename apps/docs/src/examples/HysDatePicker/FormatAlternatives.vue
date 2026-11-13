<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysDatePicker } from "hys-ui";

const date = ref("2026-11-06");
const custom = ref(false);
const formats = ["YYYY/MM/DD", "M-D-YYYY"] as const;
const label = new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" });
</script>

<template>
  <div class="demo-stack">
    <div class="demo-content demo-stack">
      <HysCheckbox v-model="custom">显示完整日期与星期</HysCheckbox>
      <HysDatePicker
        v-model:value="date"
        aria-label="验收日期"
        editable
        allow-clear
        :format="
          custom ? [(value) => label.format(value), ...formats] : formats
        "
        value-format="YYYY-MM-DD"
        :empty-values="['未安排']"
        :value-on-clear="() => '未安排'"
        default-picker-value="2026-11-06"
      />
    </div>
    <output class="state-output">绑定值 {{ date }}</output>
    <p class="scenario-note">
      输入 2026/11/09 或 11-9-2026 后按 Enter。清空后，表单收到「未安排」。
    </p>
  </div>
</template>
