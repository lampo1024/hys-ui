<script setup lang="ts">
import { ref, computed } from "vue";
import { HysTable, HysCheckbox, type HysTableColumn } from "hys-ui";
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
const custom = ref(false);
function summarize({ rows: items }: { rows: Person[] }) {
  return {
    name: "预算汇总",
    budget:
      items.reduce((sum, r) => sum + r.budget, 0).toLocaleString("zh-CN") +
      " 元",
  };
}
</script>
<template>
  <div>
    <HysCheckbox v-model="custom">自定义汇总文本</HysCheckbox>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        :rows="rows"
        :columns="columns"
        show-summary
        :summary-method="custom ? summarize : undefined"
        :pagination="{ pageSize: 5 }"
      />
    </div>
    <p class="scenario-note">
      内置
      sum、avg、min、max、count；汇总基于当前过滤后的全部数据，不受本地页码影响。服务端表格可通过
      summary-cell 插槽展示后端汇总结果。
    </p>
  </div>
</template>
