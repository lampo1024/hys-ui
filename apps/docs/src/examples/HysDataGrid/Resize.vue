<script setup lang="ts">
import { HysDataGrid, type GridColumn } from "hys-ui";

const columns: GridColumn[] = [
  {
    key: "id",
    label: "编号",
    width: 112,
    minWidth: 80,
    maxWidth: 220,
    pinned: "left",
  },
  { key: "name", label: "项目", width: 270, minWidth: 120, maxWidth: 420 },
  { key: "owner", label: "负责人", width: 200 },
  { key: "region", label: "地区", width: 200 },
  { key: "remark", label: "备注", width: 300 },
  { key: "status", label: "状态", width: 136, pinned: "right" },
];
const rows = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  name: "交付任务 " + (index + 1),
  owner: index % 2 ? "王敏" : "陈平",
  region: index % 2 ? "华东" : "华南",
  remark: "跟踪验收进度",
  status: index % 2 ? "处理中" : "已完成",
}));
</script>
<template>
  <div class="demo-stack">
    <HysDataGrid
      :rows="rows"
      :columns="columns"
      :page-size="12"
      :max-height="245"
      sticky-header
      storage-key="hys-docs-data-grid-resize"
    />
    <p class="scenario-note">
      拖动表头右边缘调整列宽，按 Esc 取消。聚焦调整手柄后用左右方向键微调，Home
      和 End 跳到宽度边界。
    </p>
  </div>
</template>
