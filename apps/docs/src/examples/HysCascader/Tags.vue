<script setup lang="ts">
import { ref } from "vue";
import { HysCascader, HysNumberInput, type HysCascaderPath } from "hys-ui";
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
const value = ref<HysCascaderPath[]>([
    ["rd", "backend"],
    ["rd", "frontend"],
    ["product", "design"],
    ["business"],
  ]),
  count = ref(1);
</script>
<template>
  <div>
    <div class="demo-controls">
      <label class="demo-field"
        >可见标签数<HysNumberInput v-model="count" :min="0" :max="5"
      /></label>
    </div>
    <div class="demo-content">
      <HysCascader
        v-model="value"
        :options="options"
        multiple
        clearable
        :max-tag-count="count"
        :max-tag-text-length="10"
      />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      多余标签折叠为计数，悬停可查看内容；可见标签可直接移除。折叠只改变展示，不会丢失选择。
    </p>
  </div>
</template>
