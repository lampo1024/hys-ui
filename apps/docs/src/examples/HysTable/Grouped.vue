<script setup lang="ts">
import { ref, computed } from "vue";
import { HysTable, type HysTableColumn } from "hys-ui";
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

const grouped: HysTableColumn<Person>[] = [
  { key: "name", label: "姓名", width: 100, fixed: "left" },
  {
    key: "profile",
    label: "成员资料",
    children: [
      { key: "team", label: "团队", width: 130 },
      {
        key: "information",
        label: "个人信息",
        children: [
          { key: "age", label: "年龄", width: 110 },
          {
            key: "active",
            label: "在岗状态",
            width: 130,
            formatter: (r) => (r.active ? "在岗" : "休假"),
          },
        ],
      },
    ],
  },
  {
    key: "finance",
    label: "预算",
    fixed: "right",
    children: [
      {
        key: "budget",
        label: "金额",
        width: 110,
        summary: "sum",
        align: "right",
      },
    ],
  },
];
</script>
<template>
  <HysTable
    :rows="rows.slice(0, 6)"
    :columns="grouped"
    :max-height="360"
    bordered
    show-summary
  />
</template>
