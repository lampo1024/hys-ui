<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysTable,
  type HysTableCellContext,
  type HysTableColumn,
  type HysTableInstance,
} from "hys-ui";

const rows = [
  { id: 1, team: "华东仓", stock: 0, note: "库存已清点。\n本周末安排补货。" },
  { id: 2, team: "华东仓", stock: 35, note: "" },
  { id: 3, team: "华南仓", stock: null, note: "等待仓库回传盘点记录。" },
];
type Row = (typeof rows)[number];
const columns: HysTableColumn<Row>[] = [
  { key: "team", label: "仓库", width: 88 },
  { key: "stock", label: "库存", width: 72, align: "right" },
  {
    key: "note",
    label: "盘点备注",
    minWidth: 180,
    wrap: 2,
    emptyText: "无备注",
  },
];
const table = ref<HysTableInstance<Row>>();

function merge({ rowIndex, column }: HysTableCellContext<Row>) {
  if (rowIndex === 0 && column.key === "team")
    return { rowspan: 2, colspan: 1 };
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton
        variant="secondary"
        size="sm"
        @click="table?.focusCell(1, 'team')"
      >
        定位首个仓库
      </HysButton>
      <span class="cell-hint">方向键移动焦点，Home / End 跳到行首或行尾。</span>
    </div>
    <HysTable
      ref="table"
      :rows="rows"
      :columns="columns"
      :span-method="merge"
      empty-cell-text="—"
      cell-navigation
    />
  </div>
</template>

<style scoped>
.cell-hint {
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
</style>
