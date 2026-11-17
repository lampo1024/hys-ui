<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysFilterBar,
  HysTable,
  type HysFilterField,
  type HysFilterValues,
  type HysTableColumn,
} from "hys-ui";

const orders = [
  { id: "SO-1024", title: "办公用品", status: "待发货" },
  { id: "SO-1031", title: "摄影设备", status: "已发货" },
  { id: "SO-1045", title: "办公家具", status: "已发货" },
];
const fields: HysFilterField[] = [
  { key: "query", label: "订单关键词", type: "text", placeholder: "例如 办公" },
  {
    key: "status",
    label: "状态",
    type: "select",
    placeholder: "全部状态",
    options: [
      { label: "待发货", value: "待发货" },
      { label: "已发货", value: "已发货" },
    ],
  },
];
const columns: HysTableColumn<(typeof orders)[number]>[] = [
  { key: "id", label: "订单号" },
  { key: "title", label: "订单内容" },
  { key: "status", label: "状态" },
];
const draft = ref<HysFilterValues>({});
const applied = ref<HysFilterValues>({});
const displayed = computed(() =>
  orders.filter((order) => {
    const keyword = String(applied.value.query ?? "")
      .trim()
      .toLowerCase();
    return (
      (!applied.value.status || order.status === applied.value.status) &&
      (order.title.includes(keyword) ||
        order.id.toLowerCase().includes(keyword))
    );
  }),
);
</script>

<template>
  <div class="demo-stack">
    <HysFilterBar
      v-model:values="draft"
      :fields="fields"
      @search="applied = $event"
      @reset="applied = $event"
    />
    <HysTable :rows="displayed" :columns="columns" row-key="id" />
    <span role="status">命中 {{ displayed.length }} 张订单</span>
  </div>
</template>
