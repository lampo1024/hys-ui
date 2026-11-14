<script setup lang="ts">
import { HysSpreadsheet, type HysSpreadsheetWorkbook } from "hys-ui";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

const workbook: HysSpreadsheetWorkbook = {
  sheets: [
    {
      id: "booking",
      name: "活动预订",
      rows: [
        ["字段", "上午场", "下午场"],
        ["文本 · 预订编号", "0012", "0013"],
        ["数字 · 参加人数", 24, 18],
        ["日期 · 活动日", "2026-11-20", "2026-11-20"],
        ["时间 · 签到", "09:30", "13:30"],
        ["日期时间 · 截止", "2026-11-19T16:00", "2026-11-19T18:00"],
        ["百分比 · 折扣", 0.1, 0.15],
        ["金额 · 单价", 128, 150],
        ["布尔值 · 已确认", true, false],
        ["下拉选择 · 场地", "会议室 A", "会议室 B"],
        ["多选 · 设备", "投影\n白板", "麦克风"],
        ["自动补全 · 联系人", "陈晨", "林宁"],
        ["公式 · 折后总价", "=B3*B8*(1-B7)", "=C3*C8*(1-C7)"],
        ["多行文本 · 备注", "提前 15 分钟到场\n签到后领取资料", "从东门进入"],
      ],
      columnOptions: { 0: { size: 155 }, 1: { size: 183 }, 2: { size: 183 } },
      frozenRows: 1,
      formats: {
        A1: { bold: true }, B1: { bold: true }, C1: { bold: true },
        B13: { number: "currency", bold: true }, C13: { number: "currency", bold: true },
      },
      cells: Object.fromEntries(["B", "C"].flatMap((col) => [
        [`${col}2`, { type: "text" }],
        [`${col}3`, { type: "number", validation: { min: 1, max: 80 } }],
        [`${col}4`, { type: "date" }],
        [`${col}5`, { type: "time" }],
        [`${col}6`, { type: "datetime-local" }],
        [`${col}7`, { type: "percent", validation: { min: 0, max: 1 } }],
        [`${col}8`, { type: "currency" }],
        [`${col}9`, { type: "boolean" }],
        [`${col}10`, { type: "select", options: ["会议室 A", "会议室 B", "报告厅"] }],
        [`${col}11`, { type: "multiple", options: ["投影", "白板", "麦克风"] }],
        [`${col}12`, { type: "autocomplete", options: ["陈晨", "陈雨", "林宁"] }],
        [`${col}13`, { type: "formula" }],
        [`${col}14`, { type: "multiline" }],
      ])),
    },
  ],
};
</script>

<template>
  <div class="demo-stack">
    <HysSpreadsheet :default-workbook="workbook" :max-height="550" />
    <ul class="scenario-note editing-steps">
      <li>双击单元格或按 F2 编辑。试着输入预订编号 <code>0015</code>、折扣 <code>12.5%</code> 或单价 <code>¥1,480.00</code>，观察折后总价。</li>
      <li>双击活动日或截止时间，日历会自动展开。日期点选即提交，截止时间需点「确定」。点到表格的其他位置或按 Esc 可取消当前选择。</li>
      <li>双击设备单元格，选好后点「应用多选」。编辑备注时按 Enter 换行，按 Ctrl / ⌘ + Enter 提交。</li>
      <li>选中 B3:C3，在公式栏输入 <code>20</code> 并按 Ctrl / ⌘ + Enter，可同时更新两场人数。试着输入 <code>100</code> 查看整批校验。</li>
    </ul>
  </div>
</template>

<style scoped>
.editing-steps {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-inline-start: 1.3em;
}
</style>
