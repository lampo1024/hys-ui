<script setup lang="ts">
import { ref, computed } from "vue";
import { HysTable, HysButton, type HysTableColumn } from "hys-ui";
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
const selected = ref<(string | number)[]>([]),
  current = ref<string | number | null>(null);
</script>
<template>
  <div>
    <HysButton size="sm" variant="secondary" @click="current = null"
      >取消当前行高亮</HysButton
    >
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        v-model:selected-row-keys="selected"
        v-model:current-row-key="current"
        :rows="rows.slice(0, 5)"
        :columns="columns"
        selectable
        selection-type="radio"
        highlight-current-row
      />
    </div>
    <output class="state-output"
      >单选：{{ selected[0] ?? "无" }} · 当前行：{{ current ?? "无" }}</output
    >
    <p class="scenario-note">
      单选与当前行高亮独立控制；点击单选项不触发行点击，点击数据行可改变高亮。
    </p>
  </div>
</template>
