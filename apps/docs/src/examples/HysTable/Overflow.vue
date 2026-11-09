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

const overflowColumns: HysTableColumn<Person>[] = [
  { key: "name", label: "姓名", width: 100 },
  {
    key: "note",
    label: "工作说明",
    width: 230,
    ellipsis: true,
    showOverflowTooltip: true,
    tooltipFormatter: ({ row, value }) => row.name + "：" + value,
  },
  { key: "team", label: "团队", width: 100 },
];
</script>
<template>
  <div>
    <div style="max-width: 550px">
      <HysTable :rows="rows.slice(0, 5)" :columns="overflowColumns" />
    </div>
    <p class="scenario-note">
      仅在内容溢出时显示自定义
      tooltip；支持悬停与聚焦，浮层会避让窗口边缘并随页面离开清理。
    </p>
  </div>
</template>
