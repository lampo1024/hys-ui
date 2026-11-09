<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTable,
  HysSelect,
  HysButton,
  type HysTableColumn,
  type HysTableInstance,
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

const table = ref<HysTableInstance<Person>>(),
  size = ref<"sm" | "md" | "lg">("md");
const fixedColumns: HysTableColumn<Person>[] = [
  { key: "id", label: "编号", width: 90, fixed: "left" },
  { key: "name", label: "姓名", width: 150, sortable: true },
  { key: "note", label: "工作内容", width: 420, ellipsis: true },
  { key: "team", label: "团队", width: 160 },
  { key: "age", label: "年龄", width: 100 },
  {
    key: "budget",
    label: "预算",
    width: 130,
    summary: "sum",
    align: "right",
    fixed: "right",
  },
];
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysSelect
        v-model="size"
        style="width: 130px"
        size="sm"
        aria-label="固定表示例尺寸"
        :options="[
          { label: '小尺寸', value: 'sm' },
          { label: '标准尺寸', value: 'md' },
          { label: '大尺寸', value: 'lg' },
        ]"
      /><HysButton
        size="sm"
        variant="secondary"
        @click="table?.scrollTo({ left: 10000, top: 180 })"
        >滚动到右下方</HysButton
      >
    </div>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        ref="table"
        :rows="rows"
        :columns="fixedColumns"
        :height="340"
        :size="size"
        show-summary
        striped
        bordered
      />
    </div>
    <p class="scenario-note">
      表头、左右固定列和汇总行共享同一张表格。横纵滚动、行悬停及尺寸变化时保持列宽与背景一致。
    </p>
  </div>
</template>
