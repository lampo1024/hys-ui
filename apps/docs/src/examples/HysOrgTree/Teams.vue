<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysOrgTree, type OrgNode } from "hys-ui";
const expanded = ref<string[]>([]);
const selected = ref<OrgNode>();
const nodes: OrgNode[] = [
  { id: "ops", name: "运营中心", description: "跨团队协作" },
  {
    id: "inbound",
    name: "入库小组",
    parentId: "ops",
    description: "负责收货与验收",
  },
  {
    id: "outbound",
    name: "出库小组",
    parentId: "ops",
    description: "负责调拨与发运",
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="expanded = expanded.length ? [] : ['ops']"
        >{{ expanded.length ? "收起分支" : "展开分支" }}</HysButton
      >
    </div>
    <HysOrgTree
      v-model:expanded-keys="expanded"
      :nodes="nodes"
      show-description
      @node-select="selected = $event"
    />
    <output v-if="selected" class="state-output"
      >已选 {{ selected.name }}</output
    >
  </div>
</template>
