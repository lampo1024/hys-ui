<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTable,
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
  message = ref("");
</script>
<template>
  <div>
    <HysButton size="sm" variant="secondary" @click="table?.resetColumnWidths()"
      >还原列宽</HysButton
    >
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        ref="table"
        :rows="rows.slice(0, 5)"
        :columns="columns"
        resizable
        @column-resize="
          (column, width) => (message = column.label + '：' + width + 'px')
        "
      />
    </div>
    <output class="state-output">{{
      message ||
      "拖动列右侧边缘，或聚焦分隔线使用左右方向键。Esc 取消当前拖动。"
    }}</output>
  </div>
</template>
