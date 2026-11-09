<script setup lang="ts">
import { ref } from "vue";
import { HysTable, HysSelect, HysCheckbox, type HysTableColumn } from "hys-ui";
const layout = ref<"auto" | "fixed">("fixed"),
  scroll = ref(false);
const options = [
  { label: "固定布局", value: "fixed" },
  { label: "按内容布局", value: "auto" },
];
const columns: HysTableColumn[] = [
  { key: "name", label: "名称", width: 160 },
  { key: "description", label: "说明", width: 300 },
  { key: "status", label: "状态", width: 120 },
];
const rows = [
  {
    id: 1,
    name: "设计规范",
    description: "统一组件的尺寸、状态与交互规则",
    status: "已完成",
  },
  {
    id: 2,
    name: "数据接入",
    description:
      "较长的说明内容可以参与自动布局，也可以使用固定布局保证各列稳定",
    status: "进行中",
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysSelect
        v-model="layout"
        :options="options"
        aria-label="表格布局模式"
        style="width: 180px"
      /><HysCheckbox v-model="scroll">始终显示纵向滚动条</HysCheckbox>
    </div>
    <div class="demo-content">
      <HysTable
        :rows="rows"
        :columns="columns"
        :table-layout="layout"
        :scrollbar-always-on="scroll"
        header-row-class-name="table-demo-header"
        :header-row-style="{
          '--hys-ui-table-head-bg': 'var(--hys-ui-primary-soft)',
        }"
      />
    </div>
    <p class="scenario-note">
      固定布局保持列宽稳定，自动布局允许内容参与宽度计算。headerRowClassName /
      headerRowStyle 定制整个表头行；交互调整列宽后使用固定布局。
    </p>
  </div>
</template>
