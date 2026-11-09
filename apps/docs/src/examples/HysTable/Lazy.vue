<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTable,
  HysCheckbox,
  type HysTableColumn,
  type HysTableLoadContext,
} from "hys-ui";

type Node = { id: string; name: string; hasChildren?: boolean };
const fail = ref(true),
  rows: Node[] = [
    { id: "design", name: "设计任务", hasChildren: true },
    { id: "dev", name: "开发任务", hasChildren: true },
  ];
const columns: HysTableColumn<Node>[] = [
  { key: "name", label: "任务列表", width: 440 },
];
async function load(
  row: Node,
  { signal }: HysTableLoadContext,
): Promise<Node[]> {
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 500);
    signal.addEventListener("abort", abort, { once: true });
  });
  if (row.id === "design" && fail.value) throw new Error("暂时无法连接");
  return [
    { id: row.id + "-1", name: "需求讨论" },
    { id: row.id + "-2", name: "实现与验收" },
  ];
}
</script>
<template>
  <div>
    <HysCheckbox v-model="fail">模拟设计任务加载失败</HysCheckbox>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        :rows="rows"
        :columns="columns"
        tree-mode
        :load-children="load"
      />
    </div>
    <p class="scenario-note">
      展开后异步加载，失败提供重试。折叠、数据替换或页面离开时取消请求；过期返回不会插入子行。自动展开最多同时发起四个请求。
    </p>
  </div>
</template>
