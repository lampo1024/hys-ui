<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, HysButton, type HysTreeSelectInstance } from "hys-ui";
const api = ref<HysTreeSelectInstance>(),
  value = ref("");
const nodes = [
  {
    value: "r",
    label: "资料目录",
    children: [
      { value: "guide", label: "使用指南" },
      { value: "old", label: "归档内容", disabled: true },
      { value: "api", label: "接口文档" },
    ],
  },
  { value: "more", label: "补充资料" },
];
</script>
<template>
  <div class="demo-stack">
    <HysTreeSelect
      ref="api"
      v-model="value"
      :nodes="nodes"
      :searchable="false"
      clearable
    /><HysButton size="sm" variant="secondary" @click="api?.show()"
      >展开并聚焦树形列表</HysButton
    >
    <p class="scenario-note">
      方向键浏览并跳过禁用项，左右键展开或返回父级，Home / End 到首尾，Enter
      选择，Esc 关闭后恢复触发器焦点。
    </p>
  </div>
</template>
