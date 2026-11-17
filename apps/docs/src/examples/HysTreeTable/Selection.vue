<script setup lang="ts">
import { ref } from "vue";
import {
  HysBadge,
  HysTreeTable,
  type HysTableColumn,
  type HysTableKey,
} from "hys-ui";
type Folder = {
  id: string;
  label: string;
  size: number;
  locked?: boolean;
  children?: Folder[];
};
const rows: Folder[] = [
  {
    id: "ops",
    label: "运营资料",
    size: 24,
    children: [
      { id: "bill", label: "账单模板", size: 16 },
      { id: "review", label: "复核清单", size: 8, locked: true },
    ],
  },
  {
    id: "ship",
    label: "配送资料",
    size: 55,
    children: [
      { id: "routes", label: "路线指南", size: 35 },
      { id: "handover", label: "交接记录", size: 20 },
    ],
  },
];
const columns: HysTableColumn<Folder>[] = [
  { key: "label", label: "资料" },
  { key: "size", label: "大小", sortable: true },
];
const selected = ref<HysTableKey[]>([]);
</script>
<template>
  <div class="demo-stack">
    <HysTreeTable
      v-model:selected-row-keys="selected"
      :data="rows"
      :columns="columns"
      default-expand-all
      :selectable="(row) => !row.locked"
    >
      <template #body-cell="{ row, column }">
        <template v-if="column.key === 'label'"
          ><span>{{ row.label }}</span>
          <HysBadge v-if="row.locked">只读</HysBadge></template
        >
        <span v-else>{{ row.size }} KB</span>
      </template>
    </HysTreeTable>
    <span role="status">独立选中 {{ selected.length }} 项</span>
    <p class="scenario-note">
      点击大小列排序，每个文件夹中的资料只在同级排序。
    </p>
  </div>
</template>
