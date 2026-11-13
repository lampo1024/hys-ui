<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysIcon, HysSelect } from "hys-ui";
const chosen = ref("search");
const icons = [
  { label: "搜索", value: "search" },
  { label: "收藏", value: "star" },
  { label: "文件夹", value: "folder" },
  { label: "刷新", value: "refresh" },
  { label: "仪表盘", value: "layout-dashboard" },
  { label: "折线图", value: "chart-line" },
  { label: "安全验证", value: "shield-check" },
  { label: "通知", value: "bell" },
  { label: "银行卡", value: "credit-card" },
  { label: "无线网络", value: "wifi" },
  { label: "日期范围", value: "calendar-range" },
  { label: "雷暴", value: "cloud-lightning" },
  { label: "默认回退", value: "missing-example" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <label class="demo-field"
        >图标名称<HysSelect
          v-model="chosen"
          :options="icons"
          aria-label="图标名称"
      /></label>
    </div>
    <div class="demo-panel demo-control-actions">
      <HysIcon :name="chosen" size="xl" label="当前预览" />
      <code>{{ chosen }}</code>
      <HysButton variant="secondary"
        ><HysIcon name="download" /> 下载</HysButton
      >
      <HysIcon name="success" status="success" size="md">已完成</HysIcon>
    </div>
  </div>
</template>
