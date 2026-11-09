<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTable,
  type HysTableColumn,
  type HysTableCellContext,
} from "hys-ui";

const rows = [
  { id: 1, group: "设计", name: "交互设计", hours: 16 },
  { id: 2, group: "设计", name: "视觉规范", hours: 12 },
  { id: 3, group: "研发", name: "基础组件", hours: 24 },
  { id: 4, group: "研发", name: "业务集成", hours: 20 },
];
type Row = (typeof rows)[number];
const columns: HysTableColumn<Row>[] = [
  { key: "group", label: "分类", width: 120 },
  { key: "name", label: "工作项", width: 240 },
  { key: "hours", label: "工时", width: 100, align: "right" },
];
function merge({ rowIndex, columnIndex }: HysTableCellContext<Row>) {
  if (columnIndex === 0 && rowIndex % 2 === 0)
    return { rowspan: 2, colspan: 1 };
}
</script>
<template>
  <div>
    <HysTable :rows="rows" :columns="columns" :span-method="merge" bordered />
    <p class="scenario-note">
      spanMethod 支持对象或 [rowspan,
      colspan]。已覆盖的单元格自动跳过；跨度限制在可见行与相同固定区域内，详情展开行前会截断。
    </p>
  </div>
</template>
