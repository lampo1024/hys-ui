<script setup lang="ts">
import { ref, computed } from "vue";
import { HysTable, HysCheckbox, type HysTableColumn } from "hys-ui";

type Node = { id: string; name: string; budget: number; children?: Node[] };
const strict = ref(false),
  selected = ref<(string | number)[]>([]);
const rows: Node[] = [
  {
    id: "product",
    name: "产品设计",
    budget: 6000,
    children: [
      { id: "design", name: "交互设计", budget: 3500 },
      { id: "research", name: "用户研究", budget: 2500 },
    ],
  },
  {
    id: "engineering",
    name: "工程研发",
    budget: 12000,
    children: [
      {
        id: "frontend",
        name: "前端开发",
        budget: 7000,
        children: [{ id: "components", name: "组件开发", budget: 3000 }],
      },
      { id: "backend", name: "接口开发", budget: 5000 },
    ],
  },
];
const columns: HysTableColumn<Node>[] = [
  {
    key: "name",
    label: "工作项",
    width: 360,
    sortable: true,
    filterable: true,
  },
  { key: "budget", label: "预算", width: 160, align: "right" },
];
</script>
<template>
  <div>
    <HysCheckbox v-model="strict">父子独立选择</HysCheckbox>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        v-model:selected-row-keys="selected"
        :rows="rows"
        :columns="columns"
        tree-mode
        selectable
        :check-strictly="strict"
        default-expand-all
      />
    </div>
    <output class="state-output">{{ selected }}</output>
    <p class="scenario-note">
      筛选保留匹配子项的祖先路径，排序在同级内进行。取消父子独立时，勾选父项会影响已加载的可选后代，并提供半选状态。
    </p>
  </div>
</template>
