<script setup lang="ts">
import { h, ref } from "vue";
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

const overflowColumns: HysTableColumn<Person>[] = [
  { key: "name", label: "姓名", width: 100 },
  {
    key: "note",
    label: "工作说明",
    width: 230,
    renderHeader: (column) => h("strong", column.label),
    showOverflowTooltip: { placement: "bottom-start", maxWidth: 240 },
    tooltipFormatter: ({ row, value }) => row.name + "：" + value,
  },
  { key: "team", label: "团队", width: 100, showOverflowTooltip: false, ellipsis: { showTitle: true } },
];
</script>
<template>
  <div>
    <div style="max-width: 550px">
      <HysTable
        :rows="rows.slice(0, 5)"
        :columns="overflowColumns"
        :show-overflow-tooltip="{ effect: 'light', placement: 'top' }"
      />
    </div>
    <p class="scenario-note">
      工作说明列沿用浅色提示样式，并自定义提示位置、宽度和内容。团队列关闭浮层，使用浏览器原生提示。
    </p>
  </div>
</template>
