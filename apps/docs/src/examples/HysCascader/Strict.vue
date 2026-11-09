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
const single = ref(["rd"]),
  many = ref<HysCascaderPath[]>([["product"]]),
  legacy = ref<string[]>([]);
</script>
<template>
  <div>
    <div class="demo-content demo-stack">
      <label
        >任意层级单选<HysCascader
          v-model="single"
          :options="options"
          check-strictly
          clearable /></label
      ><label
        >父子独立多选<HysCascader
          v-model="many"
          :options="options"
          multiple
          check-strictly
          clearable /></label
      ><label
        >点击层级立即回填<HysCascader
          v-model="legacy"
          :options="options"
          change-on-select
          clearable
      /></label>
    </div>
    <output class="state-output"
      >单选：{{ single }} · 多选：{{ many }} · 即时回填：{{ legacy }}</output
    >
    <p class="scenario-note">
      严格模式中，前缀控件选择当前层级，文字和展开图标浏览子级；changeOnSelect
      保留逐级点击立即回填的使用方式。
    </p>
  </div>
</template>
