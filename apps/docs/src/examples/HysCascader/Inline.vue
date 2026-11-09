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
const values = ref<HysCascaderPath[]>([["rd", "backend"]]);
</script>
<template>
  <div>
    <div class="demo-content">
      <HysCascader
        v-model="values"
        :options="options"
        inline
        multiple
        filterable
        clearable
        aria-label="可见的分类面板"
      />
    </div>
    <output class="state-output">{{ values }}</output>
    <p class="scenario-note">
      inline
      直接展示级联面板，复用同一套多选、搜索、懒加载和键盘交互，不创建浮层。
    </p>
  </div>
</template>
