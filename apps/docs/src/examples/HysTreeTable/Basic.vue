<script setup lang="ts">
import { ref } from "vue";
import { HysTreeTable, type HysTableColumn } from "hys-ui";
type Region = {
  id: number;
  name: string;
  inventory: number;
  children?: Region[];
};
const regions: Region[] = [
  {
    id: 1,
    name: "华东",
    inventory: 345,
    children: [
      {
        id: 11,
        name: "浙江",
        inventory: 230,
        children: [
          { id: 111, name: "杭州中心仓", inventory: 140 },
          { id: 112, name: "宁波中心仓", inventory: 90 },
        ],
      },
      { id: 12, name: "江苏", inventory: 115 },
    ],
  },
  {
    id: 2,
    name: "华南",
    inventory: 190,
    children: [{ id: 21, name: "深圳中心仓", inventory: 190 }],
  },
];
const columns: HysTableColumn<Region>[] = [
  { key: "name", label: "配送区域", minWidth: 156 },
  { key: "inventory", label: "库存", align: "right", minWidth: 65 },
];
const output = ref("点开华东，再展开浙江查看仓库");
</script>
<template>
  <div class="demo-stack">
    <HysTreeTable
      :data="regions"
      :columns="columns"
      @row-click="output = '当前区域 · ' + $event.name"
    />
    <span role="status">{{ output }}</span>
  </div>
</template>
