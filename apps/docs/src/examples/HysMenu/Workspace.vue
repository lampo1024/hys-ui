<script setup lang="ts">
import { ref } from "vue";
import { HysMenu } from "hys-ui";
const selectedPath = ref("/components/hys-menu");
const items = [
  {key:"profile",label:"工作台概览",href:"/components/hys-page-header"},
  {key:"operations",label:"运营与调度",children:[{key:"filters",label:"数据过滤",href:"/components/hys-filter-bar"},{key:"menu",label:"导航菜单",href:"/components/hys-menu"}]},
  {key:"tools",label:"快捷工具",href:"/components/hys-float-button"},
  {key:"quality",label:"配送质量监控",href:"/components/hys-statistic"},
  {key:"rules",label:"团队权限配置",href:"/components/hys-tag"},
];
</script>

<template>
  <div class="demo-stack">
    <HysMenu mode="horizontal" :items="items" :active-path="selectedPath" aria-label="工作空间" />
  </div>
</template>
