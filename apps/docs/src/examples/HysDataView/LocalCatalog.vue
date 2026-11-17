<script setup lang="ts">
import { ref } from "vue";
import { HysBadge, HysDataView, type HysDataViewSort } from "hys-ui";
const items = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  title: ["机电检修", "门店巡检", "消防检查"][i % 3] + "工具包 " + (i + 1),
  stock: (i * 23 + 4) % 75,
}));
const sorts: HysDataViewSort<(typeof items)[number]>[] = [
  { key: "low", label: "库存从少到多", compare: (a, b) => a.stock - b.stock },
  { key: "high", label: "库存从多到少", compare: (a, b) => b.stock - a.stock },
];
const pageSize = ref(3);
</script>
<template>
  <HysDataView
    v-model:page-size="pageSize"
    :items="items"
    item-key="id"
    searchable
    :sort-options="sorts"
    local-pagination
    :page-size-options="[3, 6, 9]"
  >
    <template #item="{ item }"
      ><div class="demo-row">
        <strong>{{ item.title }}</strong
        ><HysBadge>库存 {{ item.stock }}</HysBadge>
      </div></template
    >
  </HysDataView>
</template>
