<script setup lang="ts">
import { ref } from "vue";
import { HysCascader, HysCheckbox } from "hys-ui";
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
const value = ref<string[]>([]),
  custom = ref(false);
const filter = (query: string, path: readonly { label: string }[]) =>
  path.some((node) =>
    node.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
</script>
<template>
  <div>
    <div class="demo-controls">
      <HysCheckbox v-model="custom">逐级标签匹配</HysCheckbox>
    </div>
    <div class="demo-content">
      <HysCascader
        v-model="value"
        :options="options"
        filterable
        clearable
        :filter-method="custom ? filter : undefined"
        :search-limit="5"
        :debounce="120"
        :before-filter="(query) => query.trim().length >= 2"
      />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      输入至少两个字符，例如“研发”或“设计”。默认匹配完整路径，支持自定义规则、搜索前校验、防抖与数量限制；方向键可进入结果，Enter
      选择。
    </p>
  </div>
</template>
