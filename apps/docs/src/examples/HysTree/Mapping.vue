<script setup lang="ts">
import { ref } from "vue";
import { HysTree, type HysTreeKey } from "hys-ui";
interface Department {
  code: number;
  info: { name: string };
  teams?: Department[];
  locked?: boolean;
}
const selected = ref<HysTreeKey | null>(0);
const nodes: Department[] = [
  {
    code: 0,
    info: { name: "总部" },
    teams: [
      { code: 10, info: { name: "平台研发" } },
      { code: 20, info: { name: "质量保障" } },
    ],
  },
  { code: 30, info: { name: "归档部门" }, locked: true },
];
</script>
<template>
  <div class="demo-stack">
    <HysTree
      v-model="selected"
      :nodes="nodes"
      node-key="code"
      :field-names="{
        label: 'info.name',
        children: 'teams',
        disabled: 'locked',
      }"
      default-expand-all
    /><output>当前编号：{{ selected }} · 类型：{{ typeof selected }}</output>
  </div>
</template>
