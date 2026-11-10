<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref, shallowRef } from "vue";
import {
  HysVirtualTable,
  type HysVirtualTableColumn,
  type HysVirtualTableSort,
} from "hys-ui";
interface Product {
  id: number;
  name: string;
  sales: number;
}
const source: Product[] = Array.from({ length: 80 }, (_, i) => ({
  id: i + 1,
  name: "商品 " + String(i + 1).padStart(2, "0"),
  sales: (i * 91) % 530,
}));
const rows = shallowRef(source),
  sort = ref<HysVirtualTableSort | null>(null),
  loading = ref(false);
const columns: HysVirtualTableColumn<Product>[] = [
  { key: "id", label: "编号", width: 80 },
  { key: "name", label: "商品", width: 160 },
  {
    key: "sales",
    label: "销量",
    width: 136,
    align: "right",
    sortable: "custom",
  },
];
let timer: ReturnType<typeof setTimeout> | undefined;
function query(value: HysVirtualTableSort | null) {
  clearTimeout(timer);
  loading.value = true;
  timer = setTimeout(() => {
    rows.value = value
      ? [...source].sort(
          (a, b) => (a.sales - b.sales) * (value.direction === "asc" ? 1 : -1),
        )
      : source;
    loading.value = false;
  }, 400);
}
function stop() {
  if (loading.value) sort.value = null;
  clearTimeout(timer);
  loading.value = false;
}
onDeactivated(stop);
onBeforeUnmount(stop);
</script>
<template>
  <div class="demo-stack">
    <HysVirtualTable
      v-model:sort-state="sort"
      :rows="rows"
      :columns="columns"
      :height="238"
      :loading="loading"
      loading-mode="overlay"
      fit
      aria-label="远程销量排序"
      @sort-change="query"
    >
      <template #loading>正在读取排序结果…</template>
      <template #footer
        >{{
          loading
            ? "查询中"
            : sort
              ? "销量 " + (sort.direction === "asc" ? "从低到高" : "从高到低")
              : "默认顺序"
        }}
        · {{ rows.length }} 条记录</template
      >
    </HysVirtualTable>
    <p class="scenario-note">
      点击销量列的排序箭头。组件只更新排序状态，数据由宿主查询并替换；这里用延时模拟响应。
    </p>
  </div>
</template>
