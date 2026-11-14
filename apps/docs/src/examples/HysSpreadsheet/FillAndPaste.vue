<script setup lang="ts">
import { HysSpreadsheet, type HysSpreadsheetWorkbook } from "hys-ui";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

const workbook: HysSpreadsheetWorkbook = {
  sheets: [
    {
      id: "dispatch",
      name: "发货计划",
      rows: [
        ["批次", "发货日", "箱数", "阶段", "联系邮箱", "账号", "运费"],
        ["PK-008", "2026-11-20", 10, "待打包", "alice@example.com", "alice", "=C2*8"],
        ["PK-010", "2026-11-22", 15, null, "ben@example.com", null, null],
        [null, null, null, null, "cara@example.com", null, null],
        [null, null, null, null, "dave@example.com", null, null],
        [],
      ],
      columnOptions: { 4: { size: 175 } },
      formats: { G2: { number: "currency", bold: true } },
    },
    {
      id: "clipboard",
      name: "粘贴对照",
      rows: [
        ["箱数", "原始运费", "仅数值", "仅公式", "仅格式"],
        [12, "=$A2*8", 0, 0, 123],
        [18, "=$A3*8", 0, 0, 456],
        [24, "=$A4*8", 0, 0, 789],
      ],
      formats: Object.fromEntries([2, 3, 4].map((row) => [`B${row}`, { number: "currency", bold: true }])),
    },
  ],
};
</script>

<template>
  <div class="demo-stack">
    <HysSpreadsheet :default-workbook="workbook" />
    <ul class="scenario-note fill-steps">
      <li>选中 A2:C3，将右下角填充柄拖到第 5 行，批次、日期和箱数分别按各自的步长延伸。</li>
      <li>选中 D2:D5，在「编辑与填充」中选择「自定义序列」。每行输入一个阶段，如「待打包」「待发货」「已发货」，再点「向下填充」。</li>
      <li>选中 F2:F5，使用「智能填充」向下提取邮箱账号。选中 G2:G5，按 Ctrl / ⌘ + D 复制运费公式，引用会随行调整。</li>
      <li>切换到「粘贴对照」，复制 B2:B4。在 C2 粘贴数值，在 D2 粘贴公式，在 E2 粘贴格式。只有粘贴格式时，目标原值会保留。</li>
    </ul>
  </div>
</template>

<style scoped>
.fill-steps {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-inline-start: 1.3em;
}
</style>
