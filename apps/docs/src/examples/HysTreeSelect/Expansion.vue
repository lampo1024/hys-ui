<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, HysCheckbox, type HysTreeKey } from "hys-ui";
const value = ref(""),
  expanded = ref<HysTreeKey[]>(["rd"]),
  accordion = ref(true);
const nodes = [
  {
    value: "rd",
    label: "研发中心",
    children: [
      {
        value: "backend",
        label: "后端组",
        children: [{ value: "api", label: "接口服务" }],
      },
      { value: "web", label: "前端组" },
    ],
  },
  {
    value: "product",
    label: "产品中心",
    children: [{ value: "design", label: "体验设计" }],
  },
];
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="accordion" label="同级手风琴展开" /><HysTreeSelect
      v-model="value"
      v-model:expanded-keys="expanded"
      :nodes="nodes"
      :default-expand-all="false"
      :accordion="accordion"
      show-line
    /><output
      >选中：{{ value || "无" }} · 展开：{{
        expanded.join("、") || "无"
      }}</output
    >
  </div>
</template>
