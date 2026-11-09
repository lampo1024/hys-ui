<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, type HysTreeKey } from "hys-ui";
const value = ref<HysTreeKey | null>(1);
const nodes = [
  { id: 0, parentId: null, value: 0, label: "工作空间" },
  { id: 1, parentId: 0, value: 1, label: "产品资料" },
  { id: 2, parentId: 0, value: 2, label: "研发资料" },
  { id: 3, parentId: 2, value: 3, label: "接口说明" },
];
</script>
<template>
  <div class="demo-stack">
    <HysTreeSelect
      v-model="value"
      :nodes="nodes"
      simple-mode
      show-line
      clearable
    /><output>当前编号：{{ value ?? "无" }}</output>
    <p class="scenario-note">
      扁平列表按 id 和 parentId
      建立层级；可以自定义字段及根级标记，不修改原始数组。
    </p>
  </div>
</template>
