<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, type HysTreeKey } from "hys-ui";
interface Department {
  code: number;
  meta: { name: string };
  teams?: Department[];
  archived?: boolean;
}
const value = ref<HysTreeKey | null>(0);
const nodes: Department[] = [
  {
    code: 0,
    meta: { name: "总部" },
    teams: [
      { code: 11, meta: { name: "平台研发" } },
      { code: 12, meta: { name: "质量保障" } },
    ],
  },
  { code: 20, meta: { name: "归档部门" }, archived: true },
];
</script>
<template>
  <div class="demo-stack">
    <HysTreeSelect
      v-model="value"
      :nodes="nodes"
      :field-names="{
        value: 'code',
        label: 'meta.name',
        children: 'teams',
        disabled: 'archived',
      }"
      clearable
    /><output>编号：{{ value ?? "无" }} · 类型：{{ typeof value }}</output>
  </div>
</template>
