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
  { key: "name", label: "姓名", width: 140, sortable: true, fixed: "left" },
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
    fixed: "right",
    sortable: true,
    summary: "sum",
  },
];
const custom = ref(false);
const pageOnly = ref(false);
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
    <div class="demo-controls">
      <HysCheckbox v-model="pageOnly">仅汇总当前页</HysCheckbox>
      <HysCheckbox v-model="custom">自定义汇总行</HysCheckbox>
    </div>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        :rows="rows"
        :columns="columns"
        :height="240"
        show-summary
        sticky-summary
        :summary-scope="pageOnly ? 'page' : 'filtered'"
        :summary-method="custom ? summarize : undefined"
        :pagination="{ pageSize: 6, showSizeChanger: false }"
      >
        <template v-if="custom" #summary="{ columns, rows, values, cellAttrs }">
          <tr>
            <th scope="row" v-bind="cellAttrs(columns[0])">{{ values[0] }}</th>
            <td colspan="2">{{ rows.length }} 条记录</td>
            <td v-bind="cellAttrs(columns[3])">{{ values[3] }}</td>
          </tr>
        </template>
      </HysTable>
    </div>
    <p class="scenario-note">
      汇总行随滚动固定在底部。切换到当前页汇总后，翻页会重新计算预算。summary 插槽可合并单元格，固定列通过 cellAttrs 保持对齐。
    </p>
  </div>
</template>
