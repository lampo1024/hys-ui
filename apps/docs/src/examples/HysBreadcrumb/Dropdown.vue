<script setup lang="ts">
import { ref } from "vue";
import {
  HysBreadcrumb,
  type HysBreadcrumbItem,
  type HysBreadcrumbSelectInfo,
} from "hys-ui";
const result = ref("尚未选择"),
  items: HysBreadcrumbItem[] = [
    { label: "工作空间", href: "#workspace" },
    {
      label: "设计文档",
      href: "#design",
      children: [
        { label: "需求文档", href: "#requirements" },
        { label: "接口规范", href: "#api" },
        {
          label: "历史版本",
          children: [
            { label: "2025 归档", href: "#archive" },
            { label: "2024 归档", href: "#older" },
          ],
        },
        { label: "暂无权限", href: "#private", disabled: true },
      ],
    },
    { label: "编辑详情" },
  ];
function select(item: HysBreadcrumbItem, info: HysBreadcrumbSelectInfo) {
  result.value =
    info.path.map((row) => row.label).join(" / ") + " · " + item.label;
}
</script>
<template>
  <div class="demo-stack">
    <HysBreadcrumb :items="items" @dropdown-select="select" /><output
      class="state-output"
      >{{ result }}</output
    >
    <p class="scenario-note">
      children
      提供同级页面或嵌套导航。链接和展开按钮分开，点击文字仍直接导航；dropdownSelect
      返回所选条目、祖先路径及所在层级索引。
    </p>
  </div>
</template>
