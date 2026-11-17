<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysFilterBar,
  HysTable,
  type HysFilterField,
  type HysFilterPreset,
  type HysFilterValues,
  type HysTableColumn,
} from "hys-ui";
const orders = [
  { id: "SO-219", name: "电源模块", weight: 26, urgent: true },
  { id: "SO-220", name: "照明配件", weight: 0, urgent: false },
  { id: "SO-221", name: "仓储货架", weight: 78, urgent: true },
];
type Order = (typeof orders)[number];
const fields: HysFilterField[] = [
  {
    key: "weight",
    type: "number-range",
    label: "重量（kg）",
    min: 0,
    max: 100,
  },
  { key: "urgent", type: "boolean", label: "加急状态", checkLabel: "仅加急" },
];
const presets: HysFilterPreset[] = [
  {
    key: "regular",
    label: "常规小件",
    values: { weight: [0, 30], urgent: false },
  },
  {
    key: "heavy",
    label: "加急重货",
    values: { weight: [50, null], urgent: true },
  },
];
const columns: HysTableColumn<Order>[] = [
  { key: "name", label: "货物" },
  { key: "weight", label: "重量（kg）" },
];
const applied = ref<HysFilterValues>({});
const rows = computed(() =>
  orders.filter((order) => {
    const [min, max] = Array.isArray(applied.value.weight)
      ? applied.value.weight
      : [];
    return (
      (min == null || order.weight >= min) &&
      (max == null || order.weight <= max) &&
      (!applied.value.urgent || order.urgent)
    );
  }),
);
</script>
<template>
  <div class="demo-stack">
    <HysFilterBar
      :fields="fields"
      :presets="presets"
      search-on-preset
      show-summary
      @search="applied = $event"
      @reset="applied = $event"
    />
    <HysTable :rows="rows" :columns="columns" size="sm" /><span role="status"
      >匹配 {{ rows.length }} 条发运订单</span
    >
  </div>
</template>
