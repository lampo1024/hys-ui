<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import {
  HysButton,
  HysSpreadsheet,
  type HysSpreadsheetInstance,
  type HysSpreadsheetWorkbook,
} from "hys-ui";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

const grid = useTemplateRef<HysSpreadsheetInstance>("grid");
const workbook: HysSpreadsheetWorkbook = {
  sheets: [
    {
      id: "orders",
      name: "订单复核",
      rows: [
        ["区域", "订单号", "件数", "金额"],
        ["华东", "E-01", 12, "=C2*20"],
        ["华南", "S-01", 10, "=C3*20"],
        ["华东", "E-02", 8, "=C4*20"],
        ["华南", "S-02", 16, "=C5*20"],
      ],
      cells: {
        B2: { validation: { unique: true, message: "订单号必须唯一。" } },
      },
      conditionalFormats: [{ range: "C2:C5", type: "heatmap" }],
    },
  ],
};
const feedback = ref("");
function sort() {
  grid.value?.selectRange("A1", "D5");
  if (
    grid.value?.manageData({
      type: "sort",
      header: true,
      keys: [{ column: 0 }, { column: 2, direction: "desc" }],
    })
  )
    feedback.value = "已按区域和件数排序，金额公式随行调整。";
}
function locate() {
  grid.value?.selectRange("B2");
  feedback.value = "可双击订单号并输入同列已有编号，查看唯一值校验。";
}
</script>

<template>
  <div class="demo-stack">
    <div class="review-actions" role="group" aria-label="订单复核操作">
      <HysButton size="sm" @click="sort">按区域与件数排序</HysButton>
      <HysButton size="sm" variant="ghost" @click="locate"
        >检查订单号</HysButton
      >
      <span role="status">{{ feedback }}</span>
    </div>
    <HysSpreadsheet ref="grid" :default-workbook="workbook" />
    <p class="scenario-note">
      修改件数查看热力图变化。在工具栏打开“单元格设置”可设置验证或区域名称。从工具栏或“更多操作”打开“数据与筛选”，可对选区进行排序和筛选。
    </p>
  </div>
</template>

<style scoped>
.review-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.review-actions span {
  font-size: 13px;
  color: var(--hys-ui-theme-muted);
}
</style>
