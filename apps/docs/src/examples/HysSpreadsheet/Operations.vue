<script setup lang="ts">
import {
  HysSpreadsheet,
  type HysSpreadsheetSheet,
  type HysSpreadsheetWorkbook,
} from "hys-ui";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

const templates: Record<string, Omit<HysSpreadsheetSheet, "id" | "name">> = {
  盘点表: {
    columnCount: 4,
    rows: [["品名", "数量", "状态", "说明"], [], [], []],
  },
};
const workbook: HysSpreadsheetWorkbook = {
  name: "库存盘点",
  sheets: [
    {
      id: "inventory",
      name: "库存",
      rows: [
        ["品名", "数量", "状态", "盘点日期"],
        ["转接头", 28, "已盘点", "2026-11-12"],
        ["数据线", 8, "待盘点", "2026-11-13"],
        ["电源线", 12, "待盘点", null],
      ],
      frozenRows: 1,
      formats: {
        A1: { bold: true },
        B1: { bold: true },
        C1: { bold: true },
        D1: { bold: true },
      },
      cells: {
        B2: {
          type: "number",
          validation: { min: 0, max: 1000, prompt: "输入 0–1000 的数量" },
        },
        B3: {
          type: "number",
          validation: { min: 0, max: 1000, message: "数量须在 0–1000 之间。" },
        },
        C3: { type: "select", options: ["待盘点", "已盘点"] },
        D4: { type: "date", validation: { required: true } },
      },
      conditionalFormats: [
        {
          range: "B2:B4",
          type: "less",
          value: 10,
          format: { backgroundColor: "#ffe9d8", color: "#6e350e" },
        },
      ],
    },
    {
      id: "report",
      name: "汇总",
      protected: true,
      rows: [
        ["总库存", "=SUM('库存'!B2:B4)"],
        ["盘点完成数", '=COUNTIF(库存!C2:C4,"已盘点")'],
      ],
    },
  ],
};
</script>

<template>
  <div class="demo-stack">
    <HysSpreadsheet
      :default-workbook="workbook"
      :sheet-templates="templates"
      storage-key="hys-ui-docs-inventory"
      :autosave="800"
      author="盘点员"
    />
    <p class="scenario-note">
      双击 B3 输入负数可查看校验提示。将 C3
      改为“已盘点”，切换到汇总查看跨表更新。
      右键点击“汇总”标签可复制、改名或取消保护。试着隐藏副本，再从任一可见标签的右键菜单中选择“取消隐藏”。点标签栏右侧的加号可新建空白工作表，也可从工作表管理按盘点模板新建。
    </p>
  </div>
</template>
