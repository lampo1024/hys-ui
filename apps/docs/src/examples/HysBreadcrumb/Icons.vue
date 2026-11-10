<script setup lang="ts">
import { Home, Folder, FileText, ChevronRight } from "lucide-vue-next";
import { HysBreadcrumb } from "hys-ui";
const items = [
  { label: "首页", href: "#home", icon: Home },
  { label: "文档", href: "#docs", icon: Folder },
  { label: "使用说明", icon: FileText },
];
</script>
<template>
  <div class="demo-stack">
    <HysBreadcrumb :items="items" :separator-icon="ChevronRight" />
    <p class="scenario-note">
      条目 icon 与 separatorIcon
      均接收图标组件。图标随尺寸调整；最后一项表示当前页面，不渲染为链接。
    </p>
  </div>
</template>
