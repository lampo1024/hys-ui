<script setup lang="ts">
import { ref } from "vue";
import {
  HysCheckbox,
  HysDataGrid,
  type GridColumn,
  type HysDataGridQuery,
} from "hys-ui";

interface Product {
  id: number;
  item: { name: string };
  units: number;
}
const rows = Array.from({ length: 36 }, (_, index): Product => ({
  id: index + 1,
  item: { name: "库存商品 " + (index + 1) },
  units: (index * 7) % 51,
}));
const columns: GridColumn<Product>[] = [
  { key: "id", label: "编号", width: 90, pinned: "left" },
  { key: "name", label: "商品名称", field: "item.name", width: 230 },
  {
    key: "units",
    label: "库存量",
    align: "right",
    width: 120,
    sortMethod: (a, b) => a.units - b.units,
    filterMethod: (value, row) => row.units >= Number(value),
  },
];
const accept = ref(true);
const query = ref<HysDataGridQuery>({
  page: 2,
  pageSize: 10,
  sort: [],
  search: "",
  filters: {},
});
const accepted = ref(0);
function update(next: HysDataGridQuery) {
  if (accept.value) query.value = next;
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="accept" label="接受查询变更" />
    <HysDataGrid
      :rows="rows"
      :columns="columns"
      :query="query"
      @update:query="update"
      @query-change="accepted++"
      :selectable="false"
    />
    <output>当前第 {{ query.page }} 页 · 已接受 {{ accepted }} 次变更</output>
    <p class="scenario-note">
      库存量筛选输入的是最低库存。取消勾选后，分页、排序和筛选会等待宿主接受。
    </p>
  </div>
</template>
