<script setup lang="ts">
import { shallowRef } from "vue";
import {
  HysButton,
  HysVirtualTable,
  type HysVirtualTableColumn,
  type HysVirtualTableInstance,
} from "hys-ui";
interface Task {
  id: number;
  title: string;
  owner: string;
  status: string;
}
const rows: Task[] = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  title: "项目任务 #" + (i + 1),
  owner: ["张工", "陈工", "李工"][i % 3],
  status: ["待办", "进行中", "已完成"][i % 3],
}));
const columns: HysVirtualTableColumn<Task>[] = [
  { key: "id", label: "编号", width: 80 },
  { key: "title", label: "任务名称", width: 220 },
  { key: "owner", label: "负责人", width: 120 },
  { key: "status", label: "状态", width: 110 },
];
const table = shallowRef<HysVirtualTableInstance<Task>>();
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" @click="table?.scrollToRow(0, 'start')"
        >回到首行</HysButton
      >
      <HysButton size="sm" @click="table?.scrollToKey(5000, 'center')"
        >定位任务 #5000</HysButton
      >
      <HysButton size="sm" @click="table?.scrollToRow(rows.length - 1, 'end')"
        >跳到末行</HysButton
      >
    </div>
    <HysVirtualTable
      ref="table"
      :rows="rows"
      :columns="columns"
      :height="280"
      aria-label="项目任务列表"
      fit
      striped
    >
      <template #footer="{ range }">
        共 {{ rows.length.toLocaleString() }} 条 · 可见
        {{ range.visibleStart + 1 }}–{{ range.visibleEnd + 1 }} · 已渲染
        {{ range.end - range.start + 1 }} 行
      </template>
    </HysVirtualTable>
    <p class="scenario-note">
      定位后可以继续滚动。表格只渲染当前窗口和少量缓冲行，列头保持可见。
    </p>
  </div>
</template>
