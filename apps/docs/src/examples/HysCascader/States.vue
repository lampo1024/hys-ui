<script setup lang="ts">
import { ref } from "vue";
import { HysCascader, type HysCascaderPath } from "hys-ui";
const options = [
  {
    value: "rd",
    label: "研发中心",
    children: [
      { value: "backend", label: "后端研发" },
      { value: "frontend", label: "前端研发" },
      { value: "qa", label: "测试归档", disabled: true },
    ],
  },
  {
    value: "product",
    label: "产品中心",
    children: [
      { value: "design", label: "交互设计" },
      { value: "research", label: "用户研究" },
    ],
  },
  { value: "business", label: "商务协作" },
];
const protectedValue = ref<HysCascaderPath[]>([["rd", "qa"], ["business"]]);
</script>
<template>
  <div class="demo-content demo-stack">
    <label
      >禁用<HysCascader
        :model-value="['rd', 'backend']"
        :options="options"
        disabled /></label
    ><label
      >只读<HysCascader
        :model-value="['product', 'design']"
        :options="options"
        readonly /></label
    ><label
      >加载中<HysCascader :model-value="[]" :options="options" loading /></label
    ><label
      >空数据<HysCascader :model-value="[]" :options="[]" clearable /></label
    ><label
      >错误状态<HysCascader
        :model-value="[]"
        :options="options"
        status="error" /></label
    ><label
      >包含受保护的选择<HysCascader
        v-model="protectedValue"
        :options="options"
        multiple
        clearable /></label
    ><output class="state-output"
      >受保护的禁用分类不会被用户清空：{{ protectedValue }}</output
    >
  </div>
</template>
