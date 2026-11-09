<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTable,
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
    <div class="demo-control-actions">
      <HysButton size="sm" variant="secondary" @click="filters = {}"
        >清空全部条件</HysButton
      >
    </div>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        v-model:filters="filters"
        :rows="rows"
        :columns="columns"
        :pagination="{ pageSize: 5 }"
      />
    </div>
    <output class="state-output">{{ filters }}</output>
    <p class="scenario-note">
      姓名使用文本包含匹配，团队提供多选条件。同列条件按“或”组合，多列条件按“且”组合，应用后回到第一页。
    </p>
  </div>
</template>
