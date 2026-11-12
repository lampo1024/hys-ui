<script setup lang="ts">
import { ref } from "vue";
import { HysSortableList } from "hys-ui";

interface Row {
  id: string;
  label: string;
  owner: string;
  status: string;
}
type Field = "label" | "owner" | "status";
const fields = ref<{ id: Field; label: string }[]>([
  { id: "label", label: "任务" },
  { id: "owner", label: "负责人" },
  { id: "status", label: "状态" },
]);
const rows = ref<Row[]>([
  { id: "task-a", label: "页面体验检查", owner: "林悦", status: "待复核" },
  { id: "task-b", label: "接口联调", owner: "陈嘉", status: "进行中" },
  { id: "task-c", label: "验收文档", owner: "沈舟", status: "已完成" },
]);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-stack">
      <small class="label">拖动字段调整表格列顺序</small>
      <HysSortableList
        v-model="fields"
        layout="horizontal"
        axis="x"
        :show-buttons="false"
        aria-label="表格列顺序"
      />
    </div>
    <div class="table-frame">
      <HysSortableList
        v-model="rows"
        list-tag="table"
        :table-columns="fields.length + 1"
        :show-buttons="false"
        aria-label="项目任务表格"
      >
        <template #header>
          <thead>
            <tr>
              <th scope="col">行排序</th>
              <th v-for="field in fields" :key="field.id" scope="col">
                {{ field.label }}
              </th>
            </tr>
          </thead>
        </template>
        <template #cells="{ item }">
          <td v-for="field in fields" :key="field.id">{{ item[field.id] }}</td>
        </template>
      </HysSortableList>
    </div>
  </div>
</template>

<style scoped>
.label {
  color: var(--docs-muted);
}
.table-frame {
  overflow: auto;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
}
.table-frame :deep(table) {
  min-width: 22rem;
}
th {
  padding: 9px 10px;
  background: var(--docs-bg);
  text-align: start;
  white-space: nowrap;
}
th:first-child {
  font-size: 11px;
}
td {
  white-space: nowrap;
}
</style>
