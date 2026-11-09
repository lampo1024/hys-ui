<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect } from "hys-ui";
const value = ref("backend");
const nodes = [
  {
    label: "研发中心",
    value: "rd",
    children: [
      { label: "后端组", value: "backend" },
      { label: "前端组", value: "frontend" },
      { label: "测试组", value: "qa", disabled: true },
    ],
  },
  { label: "产品中心", value: "product" },
];
</script>
<template>
  <div class="demo-stack">
    <HysTreeSelect v-model="value" :nodes="nodes" clearable /><output
      >选中：{{ value || "无" }}</output
    >
    <p class="scenario-note">
      默认展开已有层级，可使用箭头折叠分支；文本点击选择节点，支持搜索与清空。
    </p>
  </div>
</template>
