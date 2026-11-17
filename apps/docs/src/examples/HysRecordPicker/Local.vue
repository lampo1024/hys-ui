<script setup lang="ts">
import { ref } from "vue";
import {
  HysBadge,
  HysRecordPicker,
  type HysTableColumn,
  type HysTableKey,
} from "hys-ui";
const records = Array.from({ length: 9 }, (_, index) => ({
  id: index,
  name: `${["收货复核", "目录检查", "装车检查"][index % 3]} ${index + 1}`,
  active: index !== 1,
}));
const columns: HysTableColumn<(typeof records)[number]>[] = [
  { key: "name", label: "检查项" },
  { key: "active", label: "状态" },
];
const selected = ref<HysTableKey[]>([]);
</script>
<template>
  <div class="demo-stack">
    <HysRecordPicker
      v-model="selected"
      :rows="records"
      :columns="columns"
      :page-size="3"
      multiple
      title="添加检查项"
      :labels="{ trigger: '添加检查项' }"
      :row-disabled="(row) => !row.active"
    >
      <template #body-cell="{ row, column }">
        <HysBadge v-if="column.key === 'active'">{{
          row.active ? "可选" : "停用"
        }}</HysBadge>
        <span v-else>{{ row.name }}</span>
      </template>
    </HysRecordPicker>
    <span role="status"
      >已确认编号 · {{ selected.length ? selected.join("、") : "无" }}</span
    >
    <p class="scenario-note">
      可在第 1 页和第 2 页分别勾选检查项，再返回第 1
      页查看草稿。取消时保留之前确认的值。
    </p>
  </div>
</template>
