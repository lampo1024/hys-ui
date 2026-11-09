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
const last = ref(["rd", "backend"]),
  full = ref(["product", "design"]);
</script>
<template>
  <div>
    <div class="demo-content demo-stack">
      <label
        >仅展示末级<HysCascader
          v-model="last"
          :options="options"
          :show-all-levels="false" /></label
      ><label
        >自定义路径显示<HysCascader
          v-model="full"
          :options="options"
          separator=" · "
          :display-render="(item) => item.labels.join(' › ')"
      /></label>
    </div>
    <output class="state-output"
      >展示方式不改变原始路径：{{ last }} / {{ full }}</output
    >
  </div>
</template>
