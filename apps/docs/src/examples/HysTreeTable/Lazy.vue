<script setup lang="ts">
import { ref } from "vue";
import { HysTreeTable, type HysTableColumn } from "hys-ui";
type Node = { id: string; name: string; hasChildren?: boolean };
const roots: Node[] = [
  { id: "warehouses", name: "仓库分部", hasChildren: true },
  { id: "routes", name: "配送班组", hasChildren: true },
];
const children: Record<string, Node[]> = {
  warehouses: [
    { id: "HZ", name: "杭州仓" },
    { id: "SU", name: "苏州仓" },
  ],
  routes: [
    { id: "A", name: "夜班组" },
    { id: "B", name: "早班组" },
  ],
};
const columns: HysTableColumn<Node>[] = [{ key: "name", label: "组织节点" }];
const failed = new Set<string>();
const result = ref("");
async function load(node: Node, { signal }: { signal: AbortSignal }) {
  await new Promise((resolve) => setTimeout(resolve, 320));
  if (signal.aborted) throw signal.reason;
  if (node.id === "warehouses" && !failed.has(node.id)) {
    failed.add(node.id);
    throw new Error("模拟读取失败");
  }
  return children[node.id] ?? [];
}
</script>
<template>
  <div class="demo-stack">
    <HysTreeTable
      :data="roots"
      :columns="columns"
      :load-children="load"
      @load="(row) => (result = '已加载 · ' + row.name)"
      @load-error="(row) => (result = '读取失败 · ' + row.name)"
    />
    <span role="status">{{
      result || "展开仓库分部试试失败与重试，或者展开配送班组查看成功路径。"
    }}</span>
  </div>
</template>
