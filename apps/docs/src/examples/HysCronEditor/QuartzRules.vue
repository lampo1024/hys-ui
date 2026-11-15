<script setup lang="ts">
import { ref } from "vue";
import { HysCronEditor, type HysCronPreset } from "hys-ui";

const expression = ref("0 30 18 LW * ?");
const previewFrom = new Date("2026-11-01T00:00:00+08:00");
const presets: HysCronPreset[] = [
  { label: "月末工作日结账", value: "0 30 18 LW * ?" },
  { label: "第二个星期五审计", value: "0 0 9 ? * FRI#2" },
  { label: "季度末倒数第三天核查", value: "0 0 9 L-2 MAR,JUN,SEP,DEC ?" },
];
</script>

<template>
  <div class="demo-stack">
    <HysCronEditor v-model="expression" format="quartz" time-zone="Asia/Shanghai" :show-format-selector="false"
      :presets="presets" :preview-count="4" :preview-from="previewFrom" />
    <p class="scenario-note">切换结账和审计预设，查看 LW 和 FRI#2 的实际日期。选择「按字段」可以调整月末偏移、星期次数，并添加可选年份。</p>
  </div>
</template>
