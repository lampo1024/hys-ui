<script setup lang="ts">
import { nextTick, ref } from "vue";
import {
  HysButton,
  HysTreeTable,
  type HysTableColumn,
  type HysTableKey,
} from "hys-ui";
type Project = { code: string; title: string; stages?: Project[] };
const data: Project[] = [
  {
    code: "PLAN",
    title: "新仓上线",
    stages: [
      {
        code: "OPS",
        title: "运营交接",
        stages: [{ code: "SHIP", title: "核对发运清单" }],
      },
      { code: "CHECK", title: "联调验收" },
    ],
  },
];
const columns: HysTableColumn<Project>[] = [
  { key: "title", label: "交付任务" },
  { key: "code", label: "编号" },
];
const expanded = ref<HysTableKey[]>(["PLAN"]);
const tree = ref<{ focusRow: (row: HysTableKey) => boolean }>();
async function locate() {
  expanded.value = ["PLAN", "OPS"];
  await nextTick();
  tree.value?.focusRow("SHIP");
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysButton
        size="sm"
        variant="secondary"
        @click="expanded = ['PLAN', 'OPS']"
        >展开全部</HysButton
      >
      <HysButton size="sm" variant="secondary" @click="expanded = []"
        >收起全部</HysButton
      >
      <HysButton size="sm" variant="ghost" @click="locate"
        >定位发运清单</HysButton
      >
    </div>
    <HysTreeTable
      ref="tree"
      v-model:expanded-keys="expanded"
      :data="data"
      :columns="columns"
      row-key="code"
      children-key="stages"
    />
    <span role="status">已展开 · {{ expanded.join("、") || "无" }}</span>
  </div>
</template>
