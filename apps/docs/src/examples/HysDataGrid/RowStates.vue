<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysBadge,
  HysButton,
  HysDataGrid,
  type GridColumn,
  type HysDataGridInstance,
} from "hys-ui";

const rows = [
  { id: "A-14", task: "复核异常订单", owner: "运营", status: "逾期", days: 3 },
  {
    id: "A-15",
    task: "确认仓库盘点",
    owner: "仓储",
    status: "处理中",
    days: 0,
  },
  {
    id: "A-16",
    task: "核对补货记录",
    owner: "采购",
    status: "已完成",
    days: 0,
  },
];
type Task = (typeof rows)[number];
const columns: GridColumn<Task>[] = [
  { key: "task", label: "任务", width: 146 },
  { key: "owner", label: "团队", width: 96 },
  { key: "status", label: "进展", width: 100 },
  { key: "days", label: "逾期天数", width: 120, align: "right" },
];
const grid = ref<HysDataGridInstance>();
const current = ref<string | number | null>(null);
const task = computed(() => rows.find((row) => row.id === current.value));
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="grid?.setCurrentRow('A-14')"
        >定位逾期任务</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="current === null"
        @click="grid?.setCurrentRow(null)"
        >清除高亮</HysButton
      >
    </div>
    <HysDataGrid
      ref="grid"
      v-model:current-row-key="current"
      :columns="columns"
      :rows="rows"
      :row-class-name="
        ({ row }) => (row.status === '逾期' ? 'review-overdue' : undefined)
      "
      :cell-style="
        ({ column, row }) =>
          column.key === 'days' && row.days > 0
            ? { fontWeight: 700 }
            : undefined
      "
      highlight-current-row
      keyboard-navigation
    >
      <template #body-cell="{ column, row, value }">
        <HysBadge
          v-if="column.key === 'status'"
          :tone="
            row.status === '逾期'
              ? 'orange'
              : row.status === '已完成'
                ? 'green'
                : 'blue'
          "
          >{{ value }}</HysBadge
        >
        <template v-else>{{ value }}</template>
      </template>
    </HysDataGrid>
    <output class="state-output">当前行 {{ task?.task ?? "未指定" }}</output>
  </div>
</template>

<style scoped>
:deep(.review-overdue td:first-child) {
  box-shadow: inset 3px 0 var(--hys-ui-theme-orange);
}
</style>
