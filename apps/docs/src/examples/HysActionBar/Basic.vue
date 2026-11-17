<script setup lang="ts">
import { ref } from "vue";
import {
  HysActionBar,
  HysTable,
  type HysActionBarItem,
  type HysTableColumn,
  type HysTableKey,
} from "hys-ui";
type Task = { id: number; name: string; state: string };
const selected = ref<HysTableKey[]>([]);
const rows = ref<Task[]>([
  { id: 101, name: "核对发票", state: "待处理" },
  { id: 102, name: "复核签收记录", state: "待处理" },
  { id: 103, name: "整理合同附件", state: "待处理" },
]);
const columns: HysTableColumn<Task>[] = [
  { key: "name", label: "待办" },
  { key: "state", label: "状态" },
];
const actions: HysActionBarItem[] = [
  { key: "assign", label: "分派给我", variant: "primary" },
];
function assign() {
  rows.value = rows.value.map((task) =>
    selected.value.includes(task.id) ? { ...task, state: "已分派" } : task,
  );
  selected.value = [];
}
</script>

<template>
  <div class="demo-stack">
    <HysActionBar
      :selected-count="selected.length"
      :actions="actions"
      @action="assign"
      @clear-selection="selected = []"
    />
    <HysTable
      v-model:selected-row-keys="selected"
      :rows="rows"
      :columns="columns"
      selectable
    />
    <p class="scenario-note">勾选任务后可批量分派，分派成功后清空选择。</p>
  </div>
</template>
