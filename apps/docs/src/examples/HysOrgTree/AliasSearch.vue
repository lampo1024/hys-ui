<script setup lang="ts">
import { HysOrgTree, type OrgNode } from "hys-ui";
const nodes: OrgNode[] = [
  { id: "warehouse", name: "仓储中心" },
  {
    id: "inbound",
    parentId: "warehouse",
    name: "入库组",
    description: "收货与验收",
    keywords: ["Inbound"],
  },
  {
    id: "outbound",
    parentId: "warehouse",
    name: "出库组",
    description: "拣货与发运",
    keywords: ["Outbound"],
  },
];
</script>

<template>
  <div class="demo-stack">
    <HysOrgTree :nodes="nodes" search-details show-description />
    <p class="scenario-note">搜索 Inbound 或「验收」，可定位入库组。</p>
  </div>
</template>
