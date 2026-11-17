<script setup lang="ts">
import { ref } from "vue";
import {
  HysBadge,
  HysBreadcrumb,
  HysButton,
  HysPageHeader,
  HysPopconfirm,
} from "hys-ui";
const published = ref(false);
const path = [{ label: "项目文档" }, { label: "发布说明" }];
</script>

<template>
  <div class="demo-stack">
    <HysPageHeader subtitle="文档平台 · 2026 年 11 月">
      <template #breadcrumb><HysBreadcrumb :items="path" size="sm" /></template>
      <template #title>
        <div class="demo-row">
          <strong>交付流程更新</strong>
          <HysBadge :variant="published ? 'success' : 'info'">{{
            published ? "已发布" : "草稿"
          }}</HysBadge>
        </div>
      </template>
      <template #extra>
        <HysPopconfirm title="确认发布这份说明？" @confirm="published = true">
          <template #trigger
            ><HysButton :disabled="published">发布文档</HysButton></template
          >
        </HysPopconfirm>
      </template>
    </HysPageHeader>
  </div>
</template>
