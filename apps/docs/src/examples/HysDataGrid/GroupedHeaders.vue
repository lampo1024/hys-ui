<script setup lang="ts">
import { HysDataGrid, type GridColumn } from "hys-ui";

const rows = [
  { id: "华东", target: 1250, actual: 1180, refunds: 19, incidents: 4 },
  { id: "华南", target: 980, actual: 1035, refunds: 12, incidents: 2 },
  { id: "华北", target: 1100, actual: 976, refunds: 25, incidents: 6 },
];
type Region = (typeof rows)[number];
const sales = { key: "sales", label: "销售表现" };
const service = { key: "service", label: "售后服务" };
const columns: GridColumn<Region>[] = [
  {
    key: "id",
    label: "区域",
    width: 94,
    pinned: "left",
    pinnable: false,
    hideable: false,
  },
  {
    key: "target",
    label: "目标金额",
    width: 130,
    group: sales,
    align: "right",
    headerAlign: "center",
  },
  {
    key: "actual",
    label: "实际金额",
    width: 130,
    group: sales,
    align: "right",
    headerAlign: "center",
  },
  {
    key: "refunds",
    label: "退款单量",
    width: 118,
    group: service,
    align: "right",
    headerAlign: "center",
  },
  {
    key: "incidents",
    label: "待解决售后工单",
    width: 128,
    group: service,
    headerWrap: true,
    align: "right",
    headerAlign: "center",
  },
];
</script>

<template>
  <HysDataGrid
    caption="区域经营周报"
    :columns="columns"
    :rows="rows"
    :selectable="false"
    max-height="235px"
    sticky-header
    striped
  >
    <template #header-group="{ group }">
      <span
        >{{ group.label }}
        <small v-if="group.key === 'sales'">万元</small></span
      >
    </template>
    <template #header-incidents="{ column }">
      {{ column.label }}
    </template>
    <template #actual="{ value, row }">
      <strong :class="{ 'below-target': Number(value) < row.target }">{{
        value
      }}</strong>
    </template>
  </HysDataGrid>
</template>

<style scoped>
small {
  margin-inline-start: 4px;
  font-weight: normal;
}
.below-target {
  color: var(--hys-ui-theme-orange);
}
</style>
