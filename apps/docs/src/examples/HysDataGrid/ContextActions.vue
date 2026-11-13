<script setup lang="ts">
import { ref } from "vue";
import {
  HysDataGrid,
  type GridColumn,
  type HysDataGridContextMenu,
  type HysDataGridKey,
} from "hys-ui";

const rows = ref([
  { id: "SKU-104", name: "桌面收纳盒", stock: 38, warehouse: "杭州" },
  { id: "SKU-107", name: "标签打印纸", stock: 12, warehouse: "上海" },
  { id: "SKU-121", name: "文件资料袋", stock: 64, warehouse: "杭州" },
]);
type Product = (typeof rows.value)[number];
const columns: GridColumn<Product>[] = [
  { key: "id", label: "商品编号", width: 154, hideable: false },
  { key: "name", label: "商品名称", width: 162, editable: true },
  { key: "stock", label: "可用库存", width: 132, align: "right" },
  { key: "warehouse", label: "仓库", width: 126 },
];
const feedback = ref("");
const menu: HysDataGridContextMenu<Product> = (context, items) =>
  context.type === "header"
    ? items
    : [...items, { label: "查看库存详情", value: "view-stock" }];

function rename({
  rowKey,
  column,
  value,
}: {
  rowKey: HysDataGridKey;
  column: string;
  value: string;
}) {
  if (column !== "name" || !value.trim()) return;
  rows.value = rows.value.map((row) =>
    row.id === rowKey ? { ...row, name: value.trim() } : row,
  );
}
</script>

<template>
  <div class="demo-stack">
    <p class="context-help">
      右键点击表头或单元格。也可用表头的更多按钮，或聚焦数据行后按 Shift + F10。
    </p>
    <HysDataGrid
      :rows="rows"
      :columns="columns"
      :context-menu="menu"
      editable
      keyboard-navigation
      highlight-current-row
      @cell-edit="rename"
      @context-menu-select="
        (key, context) => {
          if (key === 'view-stock' && context.type !== 'header') {
            feedback = `${context.row.name} · ${context.row.warehouse}仓 · ${context.row.stock} 件`;
          }
        }
      "
    />
    <output v-if="feedback" class="state-output">{{ feedback }}</output>
  </div>
</template>

<style scoped>
.context-help {
  margin: 0;
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
</style>
