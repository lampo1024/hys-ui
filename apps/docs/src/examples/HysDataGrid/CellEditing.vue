<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysDataGrid,
  type GridColumn,
  type HysDataGridInstance,
  type HysDataGridKey,
} from "hys-ui";

interface StockRow {
  id: number;
  product: string;
  stock: number;
  archived: boolean;
  note: string;
}

const rows = ref<StockRow[]>([
  {
    id: 1,
    product: "收纳盒",
    stock: 1280,
    archived: false,
    note: "盘点后更新",
  },
  { id: 2, product: "便携水杯", stock: 0, archived: false, note: "" },
  {
    id: 3,
    product: "旅行收纳包",
    stock: 72,
    archived: true,
    note: "已归档",
  },
]);
const numberFormat = new Intl.NumberFormat("zh-CN");
const columns: GridColumn<StockRow>[] = [
  {
    key: "product",
    label: "商品",
    width: 80,
    sortable: false,
    filterable: false,
  },
  {
    key: "stock",
    label: "可售库存",
    width: 84,
    sortable: false,
    filterable: false,
    align: "right",
    editable: ({ row }) => !row.archived,
    formatter: ({ row }) => `${numberFormat.format(row.stock)} 件`,
  },
  {
    key: "note",
    label: "备注",
    width: 108,
    wrap: true,
    sortable: false,
    filterable: false,
  },
];
const grid = ref<HysDataGridInstance>();
const feedback = ref("");

function saveStock({
  rowKey,
  value,
}: {
  rowKey: HysDataGridKey;
  value: string;
}) {
  const stock = Number(value);
  if (!value.trim() || !Number.isSafeInteger(stock) || stock < 0) {
    feedback.value = "请输入非负整数，库存未更新。";
    return;
  }
  rows.value = rows.value.map((row) =>
    row.id === rowKey ? { ...row, stock } : row,
  );
  feedback.value = `已保存库存 ${numberFormat.format(stock)} 件`;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton
        variant="secondary"
        size="sm"
        @click="grid?.focusCell(1, 'stock')"
      >
        定位可售库存
      </HysButton>
      <span class="cell-hint">双击或按 F2 编辑，Enter 保存，Esc 取消。</span>
    </div>
    <HysDataGrid
      ref="grid"
      :rows="rows"
      :columns="columns"
      :selectable="false"
      empty-cell-text="—"
      cell-navigation
      editable
      @cell-edit="saveStock"
    />
    <output v-if="feedback" class="state-output" aria-live="polite">{{
      feedback
    }}</output>
  </div>
</template>

<style scoped>
.cell-hint {
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
.state-output {
  margin: 0;
}
</style>
