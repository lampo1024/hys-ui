<script setup lang="ts">
import { ref, computed } from "vue";
import { HysTable, HysCheckbox, HysSelect, type HysTableColumn } from "hys-ui";
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
const size = ref<"sm" | "md" | "lg">("md"),
  striped = ref(true),
  bordered = ref(false),
  header = ref(true),
  index = ref(true),
  loading = ref(false);
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>外观设置</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >尺寸<HysSelect
              v-model="size"
              :options="[
                { label: '小尺寸', value: 'sm' },
                { label: '标准尺寸', value: 'md' },
                { label: '大尺寸', value: 'lg' },
              ]"
          /></label>
        </div>
        <div class="demo-control-toggles">
          <div class="demo-control-toggle">
            <HysCheckbox v-model="striped">斑马纹</HysCheckbox>
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="bordered">纵向边框</HysCheckbox>
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="header">显示表头</HysCheckbox>
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="index">显示序号</HysCheckbox>
          </div>
          <div class="demo-control-toggle">
            <HysCheckbox v-model="loading">加载状态</HysCheckbox>
          </div>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysTable
        :rows="rows.slice(0, 5)"
        :columns="columns"
        :size="size"
        :striped="striped"
        :bordered="bordered"
        :show-header="header"
        :show-index="index"
        :loading="loading"
      />
    </div>
  </div>
</template>
