<script setup lang="ts">
import { shallowRef } from "vue";
import {
  HysBadge,
  HysButton,
  HysVirtualTable,
  type HysVirtualTableColumn,
  type HysVirtualTableInstance,
} from "hys-ui";
interface Shipment {
  id: number;
  name: string;
  warehouse: string;
  region: string;
  remarks: string;
  status: string;
}
const rows: Shipment[] = Array.from({ length: 250 }, (_, i) => ({
  id: i + 1,
  name: "发货批次 " + (i + 1),
  warehouse: ["华东一号仓", "华南二号仓"][i % 2],
  region: ["杭州", "深圳", "南京"][i % 3],
  remarks: "按出库计划完成复核、包装与交接",
  status: i % 3 === 0 ? "待复核" : "已出库",
}));
const fixedRows: Shipment[] = [
  {
    id: 0,
    name: "本次发货计划",
    warehouse: "全部仓库",
    region: "全部地区",
    remarks: "合计 " + rows.length + " 批",
    status: "汇总",
  },
];
const columns: HysVirtualTableColumn<Shipment>[] = [
  { key: "id", label: "批次", width: 76, fixed: "left" },
  { key: "name", label: "发货名称", width: 250 },
  { key: "warehouse", label: "仓库", width: 210 },
  { key: "region", label: "配送区域", width: 190 },
  { key: "remarks", label: "发货备注", width: 410 },
  { key: "status", label: "状态", width: 100, fixed: "right", align: "center" },
];
const table = shallowRef<HysVirtualTableInstance<Shipment>>();
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" @click="table?.scrollTo({ top: 0, left: 0 })"
        >回到左上角</HysButton
      >
      <HysButton size="sm" @click="table?.scrollToColumn('remarks', 'end')"
        >查看发货备注</HysButton
      >
    </div>
    <HysVirtualTable
      ref="table"
      :rows="rows"
      :columns="columns"
      :fixed-rows="fixedRows"
      :height="238"
      striped
      bordered
      aria-label="固定列发货列表"
    >
      <template #id="{ value }">{{
        value === 0 ? "汇总" : "B-" + value
      }}</template>
      <template #status="{ value }"
        ><HysBadge
          :tone="
            value === '已出库'
              ? 'green'
              : value === '待复核'
                ? 'orange'
                : 'blue'
          "
          >{{ value }}</HysBadge
        ></template
      >
    </HysVirtualTable>
    <p class="scenario-note">
      左右滚动时，批次和状态始终可见；向下滚动时，表头和汇总行保留在顶部。
    </p>
  </div>
</template>
