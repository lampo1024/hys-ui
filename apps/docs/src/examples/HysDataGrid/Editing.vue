<script setup lang="ts">
import { ref } from "vue";
import {
  HysDataGrid,
  HysSelect,
  type GridColumn,
  type HysDataGridProps,
} from "hys-ui";

const columns: GridColumn[] = [
  { key: "id", label: "编号", width: 100 },
  { key: "name", label: "任务名称", width: 240, editable: true },
  { key: "owner", label: "负责人", width: 160, editable: true },
];
const rows = ref<Record<string, unknown>[]>([
  { id: 1, name: "需求评审", owner: "张工" },
  { id: 2, name: "接口设计", owner: "李工" },
]);
const density =
  ref<NonNullable<HysDataGridProps<Record<string, unknown>>["density"]>>(
    "normal",
  );
const densities = [
  { label: "紧凑", value: "compact" },
  { label: "标准", value: "normal" },
  { label: "舒展", value: "comfortable" },
];
const message = ref("");

function update(
  keys: readonly (string | number)[],
  column: string,
  value: string,
) {
  rows.value = rows.value.map((row) =>
    keys.some((key) => key === row.id) ? { ...row, [column]: value } : row,
  );
  message.value = `已更新 ${keys.length} 条记录的${columns.find((item) => item.key === column)?.label ?? column}`;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="editing-density"
        >表格密度
        <HysSelect
          v-model="density"
          :options="densities"
          aria-label="编辑示例表格密度"
        />
      </label>
      <span class="editing-hint"
        >双击任务名称或负责人开始编辑，Enter 保存，Esc 取消。</span
      >
    </div>
    <HysDataGrid
      :rows="rows"
      :columns="columns"
      :density="density"
      editable
      @cell-edit="
        ({ rowKey, column, value }) => update([rowKey], column, value)
      "
      @batch-edit="({ keys, column, value }) => update(keys, column, value)"
    />
    <output v-if="message" class="state-output" aria-live="polite">{{
      message
    }}</output>
  </div>
</template>

<style scoped>
.editing-density {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.editing-hint {
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
</style>
