<script setup lang="ts">
import { ref } from "vue";
import { HysTree, HysButton, type HysTreeInstance } from "hys-ui";
const api = ref<HysTreeInstance>();
const nodes = [
  {
    id: "a",
    label: "第一组",
    children: [
      { id: "a1", label: "可用子项" },
      { id: "disabled", label: "禁用子项", disabled: true },
      { id: "a2", label: "另一个子项" },
    ],
  },
  { id: "b", label: "第二组" },
];
</script>
<template>
  <div class="demo-stack">
    <HysButton size="sm" variant="secondary" @click="api?.focus('a')"
      >聚焦树形列表</HysButton
    ><HysTree
      ref="api"
      :nodes="nodes"
      :searchable="false"
      checkable
      default-expand-all
      context-menu
    />
    <p class="scenario-note">
      ↑ / ↓ 移动焦点，→ 展开或进入子级，← 折叠或返回父级，Home / End
      到首尾，Enter 选择，空格勾选。右键打开节点操作，Esc 关闭并恢复焦点。
    </p>
  </div>
</template>
