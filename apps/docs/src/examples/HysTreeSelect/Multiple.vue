<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect } from "hys-ui";
const value = ref<string[]>([]);
const nodes = [
  {
    label: "研发中心",
    value: "rd",
    children: [
      { label: "平台组", value: "platform" },
      { label: "质量组", value: "quality", disabled: true },
    ],
  },
  { label: "产品中心", value: "product" },
];
</script>
<template>
  <div class="demo-stack">
    <HysTreeSelect
      v-model="value"
      :nodes="nodes"
      multiple
      clearable
      leaf-only
      :multiple-limit="2"
    /><output>已选叶子节点：{{ value.join("、") || "无" }}</output>
    <p class="scenario-note">
      最多选择两项。点击分支可展开，禁用项不可选；可逐项移除标签或使用 Backspace
      移除最后一个可编辑标签。
    </p>
  </div>
</template>
