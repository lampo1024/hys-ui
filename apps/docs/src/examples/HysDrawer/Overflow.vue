<script setup lang="ts">
import { ref } from "vue";
import { HysDrawer, HysButton, HysTable, HysBadge } from "hys-ui";
const open = ref(false),
  rows = Array.from({ length: 80 }, (_, i) => ({
    id: i + 1,
    name: "资源 " + String(i + 1).padStart(3, "0"),
    status: i % 3 ? "已就绪" : "待检查",
  })),
  columns = [
    { key: "id", label: "编号", width: 80 },
    { key: "name", label: "资源名称" },
    { key: "status", label: "状态" },
  ];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="open = true">长内容与固定操作区</HysButton>
    </div>
    <HysDrawer v-model:open="open" title="资源清单" size="lg" footer resizable
      ><template #extra><HysBadge :value="rows.length" /></template>
      <p>在表格上滚动鼠标滚轮，正文继续滚动；标题和底部操作保持可见。</p>
      <HysTable
        :rows="rows"
        :columns="columns"
        row-key="id"
        :pagination="false"
      />
      <p>已到达内容末尾。</p></HysDrawer
    >
  </div>
</template>
