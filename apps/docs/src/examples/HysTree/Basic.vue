<script setup lang="ts">
import { ref } from "vue";
import { HysTree, type HysTreeKey } from "hys-ui";
const selected = ref<HysTreeKey | null>("team-1"),
  checked = ref<HysTreeKey[]>([]),
  expanded = ref<HysTreeKey[]>(["root"]);
const nodes = [
  {
    id: "root",
    label: "研发中心",
    children: [
      {
        id: "team-1",
        label: "平台开发组",
        children: [
          { id: "api", label: "接口服务" },
          { id: "web", label: "前端工程" },
        ],
      },
      {
        id: "team-2",
        label: "质量保障组",
        children: [
          { id: "qa", label: "自动化测试" },
          { id: "review", label: "代码审查", disabled: true },
        ],
      },
    ],
  },
  { id: "product", label: "产品中心" },
];
</script>
<template>
  <div class="demo-stack">
    <HysTree
      v-model="selected"
      v-model:checked-keys="checked"
      v-model:expanded-keys="expanded"
      :nodes="nodes"
      checkable
      show-line
    /><output
      >当前节点：{{ selected ?? "无" }} · 已勾选：{{
        checked.join("、") || "无"
      }}</output
    >
  </div>
</template>
