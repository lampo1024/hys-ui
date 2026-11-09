<script setup lang="ts">
import { ref } from "vue";
import { HysTree, HysCheckbox, type TreeNode } from "hys-ui";
const loading = ref(false),
  disabled = ref(false),
  empty = ref(false);
const nodes: TreeNode[] = [
  {
    id: "root",
    label: "项目资料",
    children: [
      { id: "guide", label: "使用指南" },
      { id: "locked", label: "归档内容", disabled: true },
    ],
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-actions">
      <HysCheckbox v-model="loading" label="加载中" /><HysCheckbox
        v-model="disabled"
        label="禁用"
      /><HysCheckbox v-model="empty" label="空数据" />
    </div>
    <HysTree
      :nodes="empty ? [] : nodes"
      :loading="loading"
      :disabled="disabled"
      checkable
      default-expand-all
      :viewport-height="180"
      ><template #empty="{ query }">{{
        query ? "没有符合条件的资料" : "暂无项目资料"
      }}</template></HysTree
    >
  </div>
</template>
