<script setup lang="ts">
import { HysSpreadsheet, type HysSpreadsheetWorkbook } from "hys-ui";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

const workbook: HysSpreadsheetWorkbook = {
  sheets: [
    {
      id: "rates",
      name: "指标计算",
      rows: [
        ["实际", "目标", "完成率", "平均值"],
        [86, 100, "=A2/B2", "=AVERAGE(A2:A4)"],
        [94, 100, "=A3/B3", "=ROUND(A3/3,2)"],
        [70, 0, "=A4/B4", "=MAX(A2:A4)"],
      ],
      formats: {
        C2: { number: "percent" },
        C3: { number: "percent" },
        C4: { number: "percent" },
      },
    },
  ],
};
</script>

<template>
  <div class="demo-stack">
    <HysSpreadsheet :default-workbook="workbook" />
    <p class="scenario-note">
      C4 的目标为零，因此显示 #DIV/0!。将 B4 改成 100
      可恢复计算。选中计算结果可在公式栏查看或修改原公式。
    </p>
  </div>
</template>
