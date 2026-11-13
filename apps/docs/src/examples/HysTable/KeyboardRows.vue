<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysTable,
  type HysTableColumn,
  type HysTableInstance,
} from "hys-ui";

const rows = [
  { id: 1, task: "核对库存盘点", owner: "运营", state: "待确认" },
  { id: 2, task: "校验调拨数量", owner: "仓库", state: "待确认" },
  { id: 3, task: "签收入库单", owner: "物流", state: "已归档" },
  { id: 4, task: "复核门店补货", owner: "采购", state: "待确认" },
];
type Task = (typeof rows)[number];
const columns: HysTableColumn<Task>[] = [
  { key: "task", label: "待办任务", width: 140 },
  { key: "owner", label: "负责团队", width: 100 },
  { key: "state", label: "状态", width: 92 },
];
const table = ref<HysTableInstance<Task>>();
const selected = ref<(string | number)[]>([]);
const current = ref<string>();
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton variant="secondary" size="sm" @click="table?.focusRow(1)"
        >聚焦第一行</HysButton
      >
      <span class="keyboard-hint">↑ ↓ 移动 · 空格勾选 · Enter 查看</span>
    </div>
    <HysTable
      ref="table"
      v-model:selected-row-keys="selected"
      :rows="rows"
      :columns="columns"
      :selectable="(row) => row.state !== '已归档'"
      keyboard-navigation
      highlight-current-row
      @row-click="current = $event.task"
    />
    <output class="state-output"
      >已勾选 {{ selected.length }} 项<span v-if="current">
        · 当前查看 {{ current }}</span
      ></output
    >
  </div>
</template>

<style scoped>
.keyboard-hint {
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
</style>
