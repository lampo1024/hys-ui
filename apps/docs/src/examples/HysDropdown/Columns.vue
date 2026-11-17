<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysDropdown,
  HysTable,
  type HysMenuItem,
  type HysTableColumn,
} from "hys-ui";
const rows = [
  { id: "SO-215", route: "杭州 → 上海", freight: "¥162", driver: "王宁" },
  { id: "SO-219", route: "绍兴 → 苏州", freight: "¥181", driver: "陈琳" },
];
type Row = (typeof rows)[number];
const optional: HysTableColumn<Row>[] = [
  { key: "route", label: "配送路线" },
  { key: "freight", label: "运费" },
  { key: "driver", label: "司机" },
];
const items: HysMenuItem[] = optional.map(({ key, label }) => ({ key, label }));
const selected = ref<readonly (string | number)[]>(["route", "driver"]);
const columns = computed<HysTableColumn<Row>[]>(() => [
  { key: "id", label: "订单号" },
  ...optional.filter(({ key }) => selected.value.includes(key)),
]);
</script>
<template>
  <div class="demo-stack">
    <HysDropdown
      v-model:selected-keys="selected"
      :items="items"
      selection-mode="multiple"
      label="显示列"
    />
    <HysTable :rows="rows" :columns="columns" size="sm" />
  </div>
</template>
