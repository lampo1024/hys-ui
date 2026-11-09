<script setup lang="ts">
import { ref } from "vue";
import { HysCascader, HysButton, type HysCascaderInstance } from "hys-ui";
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
const api = ref<HysCascaderInstance>(),
  value = ref<string[]>([]);
</script>
<template>
  <div>
    <div class="demo-content">
      <HysCascader ref="api" v-model="value" :options="options" clearable />
    </div>
    <div class="demo-control-actions">
      <HysButton size="sm" variant="secondary" @click="api?.show()"
        >展开并聚焦分类</HysButton
      >
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      上下键浏览同一级，左右键进入子级或返回父级；Home / End 到首尾，Enter
      选择末级，Space 切换多选。搜索框保留文本编辑键，Esc 关闭后恢复焦点。
    </p>
  </div>
</template>
