<script setup lang="ts">
import { ref } from "vue";
import {
  HysTable,
  HysButton,
  type HysTableColumn,
  type HysTableInstance,
} from "hys-ui";
type Item = { id: number; name: string; notes: string };
const table = ref<HysTableInstance<Item>>();
const rows: Item[] = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  name: `任务 ${i + 1}`,
  notes: "核对计划并跟进任务进度",
}));
const columns: HysTableColumn<Item>[] = [
  { key: "id", label: "编号", width: 80, fixed: "left" },
  { key: "name", label: "任务", width: 240 },
  { key: "notes", label: "说明", width: 1100 },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="table?.scrollToRow(25, { block: 'center', behavior: 'smooth' })"
        >定位任务 25</HysButton
      ><HysButton size="sm" variant="secondary" @click="table?.setScrollTop(0)"
        >返回顶部</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="table?.setScrollLeft(10000)"
        >滚动到右侧</HysButton
      ><HysButton size="sm" variant="secondary" @click="table?.setScrollLeft(0)"
        >回到左侧</HysButton
      >
    </div>
    <div class="demo-content">
      <HysTable ref="table" :rows="rows" :columns="columns" :height="280" />
    </div>
    <p class="scenario-note">
      scrollToRow
      只滚动当前表格视口，不改变页面位置、选择、分页或展开状态；筛选隐藏、折叠或其他页的行返回
      false。支持 start / center / end / nearest 对齐。
    </p>
  </div>
</template>
