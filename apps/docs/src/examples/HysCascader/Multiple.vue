<script setup lang="ts">
import { ref } from "vue";
import { HysCascader, HysSelect, type HysCascaderPath } from "hys-ui";
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
const values = ref<HysCascaderPath[]>([]),
  strategy = ref<"child" | "parent" | "all">("child");
</script>
<template>
  <div>
    <div class="demo-controls">
      <label class="demo-field"
        >回填方式<HysSelect
          v-model="strategy"
          :options="[
            { label: '末级分类', value: 'child' },
            { label: '合并完整父级', value: 'parent' },
            { label: '全部已选层级', value: 'all' },
          ]"
      /></label>
    </div>
    <div class="demo-content">
      <HysCascader
        v-model="values"
        :options="options"
        multiple
        clearable
        :show-checked-strategy="strategy"
      />
    </div>
    <output class="state-output">{{ values }}</output>
    <p class="scenario-note">
      勾选父级会关联可用后代，部分选择显示半选。回填方式同时决定标签与后续选择事件的值；移除合并后的父级标签会取消对应的子项。
    </p>
  </div>
</template>
