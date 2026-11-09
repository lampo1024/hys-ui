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
const value = ref<string[]>(["business"]),
  open = ref(false),
  allowOpen = ref(true),
  allowChange = ref(false),
  requested = ref("");
function change(next: string[]) {
  requested.value = JSON.stringify(next);
  if (allowChange.value) value.value = next;
}
</script>
<template>
  <div>
    <div class="demo-controls">
      <HysCheckbox v-model="allowOpen">允许打开浮层</HysCheckbox
      ><HysCheckbox v-model="allowChange">接受选择请求</HysCheckbox>
    </div>
    <div class="demo-content">
      <HysCascader
        :model-value="value"
        :open="open"
        :options="options"
        clearable
        @update:model-value="change"
        @update:open="(next) => (open = allowOpen && next)"
      />
    </div>
    <output class="state-output"
      >已接受：{{ value }} · 最近请求：{{ requested || "无" }} · 浮层：{{
        open ? "打开" : "关闭"
      }}</output
    >
    <p class="scenario-note">
      不接受选择时，标签与已选状态保持原值；“打开”和“选择”可以分别受控。表单校验只在值被接受后触发。
    </p>
  </div>
</template>
