<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysDataGrid,
  type GridColumn,
  type HysDataGridInstance,
  type HysDataGridKey,
} from "hys-ui";

interface RecordRow {
  id: HysDataGridKey;
  name: string;
  locked?: boolean;
}
const columns: GridColumn<RecordRow>[] = [
  { key: "name", label: "记录", width: 220 },
  { key: "id", label: "行键", width: 110 },
];
const current = ref(false);
const single = ref(false);
const keys = ref<HysDataGridKey[]>([]);
const grid = ref<HysDataGridInstance>();
const rows = computed<RecordRow[]>(() =>
  current.value
    ? [
        { id: 1, name: "替换后的记录" },
        { id: "lock", name: "不可选择", locked: true },
      ]
    : [
        { id: 0, name: "数字键 0" },
        { id: "0", name: "字符串键 0" },
        { id: "lock", name: "不可选择", locked: true },
      ],
);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="current" label="替换当前数据" />
      <HysCheckbox
        :model-value="single"
        label="单选模式"
        @update:model-value="
          (value) => {
            single = value;
            keys = [];
          }
        "
      />
      <HysButton size="sm" variant="secondary" @click="grid?.clearSelection()"
        >清空选择</HysButton
      >
    </div>
    <HysDataGrid
      ref="grid"
      v-model:selected-row-keys="keys"
      :rows="rows"
      :columns="columns"
      reserve-selection
      :row-selectable="(row) => !row.locked"
      :selection-type="single ? 'radio' : 'checkbox'"
    />
    <output>选中的键 {{ JSON.stringify(keys) }}</output>
  </div>
</template>
