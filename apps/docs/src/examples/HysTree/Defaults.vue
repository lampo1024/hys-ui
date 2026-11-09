<script setup lang="ts">
import { HysTree } from "hys-ui";
const nodes = [
  {
    id: "docs",
    label: "产品文档",
    children: [
      { id: "guide", label: "使用指南" },
      { id: "api", label: "接口说明" },
    ],
  },
  { id: "design", label: "设计资源" },
];
</script>
<template>
  <div class="demo-stack">
    <HysTree
      :nodes="nodes"
      default-value="guide"
      :default-checked-keys="['api']"
      :default-expanded-keys="['docs']"
      checkable
      allow-deselect
    />
    <p class="scenario-note">
      选择、勾选和展开分别维护状态。再次点击当前节点或按 Esc 可以取消选择。
    </p>
  </div>
</template>
