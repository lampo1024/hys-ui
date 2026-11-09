<script setup lang="ts">
import { ref, computed } from "vue";
import { HysTable, HysCheckbox, HysBadge, type HysTableColumn } from "hys-ui";
type Person = {
  id: number;
  name: string;
  team: string;
  age: number;
  budget: number;
  note: string;
  active: boolean;
};
const rows = ref<Person[]>(
  Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    name:
      ["陈晓", "林夕", "周宁", "许晨", "方悦", "李然"][i % 6] +
      (i >= 6 ? " " + (i + 1) : ""),
    team: ["design", "dev", "qa"][i % 3],
    age: 24 + (i % 12),
    budget: 1200 + i * 350,
    note: "负责产品设计、研发协作和交付跟进，记录工作进展与阶段目标。",
    active: i % 4 !== 0,
  })),
);
const columns: HysTableColumn<Person>[] = [
  { key: "name", label: "姓名", width: 140, sortable: true },
  {
    key: "team",
    label: "团队",
    width: 130,
    filters: [
      { label: "设计", value: "design" },
      { label: "研发", value: "dev" },
      { label: "质量", value: "qa" },
    ],
  },
  { key: "age", label: "年龄", width: 100, sortable: true, align: "right" },
  {
    key: "budget",
    label: "预算",
    width: 140,
    align: "right",
    sortable: true,
    summary: "sum",
  },
];
const empty = ref(false),
  loading = ref(false);
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysCheckbox v-model="empty">空数据</HysCheckbox
      ><HysCheckbox v-model="loading">加载中</HysCheckbox>
    </div>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        :rows="empty ? [] : rows.slice(0, 4)"
        :columns="columns"
        :loading="loading"
        :row-class-name="(row) => (row.active ? '' : 'table-row-away')"
        ><template #empty
          ><div class="table-empty">
            <strong>还没有成员</strong><span>添加数据后会自动展示在这里。</span>
          </div></template
        ><template #name="{ row }"
          >{{ row.name }}
          <HysBadge v-if="!row.active" tone="orange">休假</HysBadge></template
        ></HysTable
      >
    </div>
  </div>
</template>
<style scoped>
.table-empty {
  display: grid;
  gap: 8px;
  justify-items: center;
}
.table-empty span {
  font-size: 12px;
}
.demo-content :deep(.table-row-away) {
  --hys-ui-table-row-bg: color-mix(
    in srgb,
    var(--hys-ui-theme-orange) 8%,
    var(--hys-ui-theme-surface)
  );
}
</style>
