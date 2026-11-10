<script setup lang="ts">
import { ref } from "vue";
import {
  HysBadge,
  HysVirtualTable,
  type HysVirtualTableCell,
  type HysVirtualTableColumn,
} from "hys-ui";
interface Bill {
  number: string;
  supplier: { name: string };
  amount: number;
  overdue: boolean;
}
const rows: Bill[] = Array.from({ length: 70 }, (_, i) => ({
  number: "PO-" + String(i + 1).padStart(3, "0"),
  supplier: { name: ["明远", "山河", "新创"][i % 3] },
  amount: 450 + i * 257,
  overdue: i % 5 === 0,
}));
const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
});
const columns: HysVirtualTableColumn<Bill>[] = [
  { key: "number", label: "订单号", width: 112 },
  {
    key: "supplier",
    label: "供应商",
    width: 134,
    dataIndex: ["supplier", "name"],
  },
  {
    key: "amount",
    label: "应付金额",
    width: 138,
    align: "right",
    formatter: ({ value }) => currency.format(Number(value)),
  },
  {
    key: "overdue",
    label: "状态",
    width: 110,
    headerAlign: "center",
    align: "center",
  },
];
const selected = ref("未查看订单");
const cellAttrs = ({ column, row }: HysVirtualTableCell<Bill>) =>
  column.key === "amount" ? { title: "订单 " + row.number + " 应付金额" } : {};
</script>
<template>
  <div class="demo-stack">
    <HysVirtualTable
      :rows="rows"
      :columns="columns"
      row-key="number"
      :height="210"
      fit
      striped
      highlight-current-row
      :custom-cell="cellAttrs"
      :custom-row="(row) => ({ title: row.number })"
      aria-label="采购订单"
      @row-click="(row) => (selected = '当前订单 ' + row.number)"
    >
      <template #overdue="{ row }"
        ><HysBadge :tone="row.overdue ? 'orange' : 'green'">{{
          row.overdue ? "待跟进" : "正常"
        }}</HysBadge></template
      >
    </HysVirtualTable>
    <output class="state-output">{{ selected }}</output>
    <p class="scenario-note">
      嵌套字段、金额格式和状态徽标分别使用 dataIndex、formatter
      和列插槽。行事件返回原始记录。
    </p>
  </div>
</template>
