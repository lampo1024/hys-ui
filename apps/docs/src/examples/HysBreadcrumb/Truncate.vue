<script setup lang="ts">
import { ref } from "vue";
import { HysBreadcrumb, HysSelect } from "hys-ui";
const size = ref<"sm" | "md" | "lg">("md"),
  sizes = ["sm", "md", "lg"].map((value) => ({ label: value, value })),
  items = [
    { label: "组件开发工作空间", href: "#workspace" },
    { label: "交互设计与视觉规范文档", href: "#design" },
      { label: "一个名称较长的当前页面标题与层级说明，完整内容可通过悬停查看" },
  ];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <label class="demo-field"
        ><span>尺寸</span><HysSelect v-model="size" :options="sizes"
      /></label>
    </div>
    <HysBreadcrumb :items="items" :max-item-width="180" :size="size" />
    <p class="scenario-note">
      maxItemWidth 按项限制文字宽度，完整文字保留在
      title；布局在窄屏下可换行，不挤压展开按钮。默认不截断。
    </p>
  </div>
</template>
