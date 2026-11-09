<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTable,
  HysCheckbox,
  HysButton,
  type HysTableColumn,
  type HysTableSort,
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
const multi = ref(true),
  sorts = ref<HysTableSort[]>([
    { key: "team", direction: "asc" },
    { key: "age", direction: "desc" },
  ]);
columns[1].sortable = true;
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysCheckbox v-model="multi">启用多列排序</HysCheckbox
      ><HysButton size="sm" variant="secondary" @click="sorts = []"
        >清空排序</HysButton
      >
    </div>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        v-model:sorts="sorts"
        :rows="rows.slice(0, 8)"
        :columns="columns"
        :multi-sort="multi"
      />
    </div>
    <output class="state-output">{{ sorts }}</output>
    <p class="scenario-note">
      点击列名按升序、降序、未排序循环；也可分别点击上下箭头。多列按操作次序确定优先级，自定义
      sorter / sortBy 可调整比较规则。
    </p>
  </div>
</template>
