<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTable,
  HysInput,
  HysButton,
  type HysTableColumn,
  type HysTableFilters,
} from "hys-ui";
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
columns[0].filterable = true;
const filters = ref<HysTableFilters>({});
</script>
<template>
  <div>
    <HysTable
      v-model:filters="filters"
      :rows="rows.slice(0, 6)"
      :columns="columns.slice(0, 2)"
      ><template
        #filter-dropdown="{ column, values, setValues, confirm, clear }"
        ><div class="table-custom-filter">
          <strong>{{ column.label }}筛选</strong
          ><HysInput
            :model-value="String(values[0] ?? '')"
            placeholder="输入匹配内容"
            @update:model-value="setValues($event ? [$event] : [])"
            @keydown.enter="confirm"
          />
          <div class="demo-control-actions">
            <HysButton size="sm" variant="secondary" @click="clear()"
              >重置</HysButton
            ><HysButton size="sm" @click="confirm()">应用</HysButton>
          </div>
        </div></template
      ></HysTable
    ><output class="state-output">{{ filters }}</output>
  </div>
</template>
<style scoped>
.table-custom-filter {
  display: grid;
  gap: 14px;
}
</style>
