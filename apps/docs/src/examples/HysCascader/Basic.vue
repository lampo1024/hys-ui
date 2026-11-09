<script setup lang="ts">
import { ref } from "vue";
import { HysCascader } from "hys-ui";
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
const value = ref<string[]>([]);
</script>
<template>
  <div>
    <div class="demo-content">
      <HysCascader v-model="value" :options="options" clearable />
    </div>
    <output class="state-output"
      >路径：{{ value.join(" / ") || "未选择" }}</output
    >
    <p class="scenario-note">
      逐级浏览并选择末级分类，绑定值保留完整路径。禁用分类无法选择；清空和关闭操作不会影响其他示例。
    </p>
  </div>
</template>
