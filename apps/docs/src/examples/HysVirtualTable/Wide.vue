<script setup lang="ts">
import { shallowRef } from "vue";
import {
  HysButton,
  HysVirtualTable,
  type HysVirtualTableColumn,
  type HysVirtualTableInstance,
} from "hys-ui";
interface RecordRow {
  id: number;
  series: string;
}
const rows: RecordRow[] = Array.from({ length: 5000 }, (_, i) => ({
  id: i + 1,
  series: i % 2 ? "B 组" : "A 组",
}));
const columns: HysVirtualTableColumn<RecordRow>[] = [
  { key: "id", label: "采样编号", width: 92, fixed: "left" },
  ...Array.from({ length: 400 }, (_, index) => ({
    key: "m" + (index + 1),
    label: "指标 " + (index + 1),
    width: 110,
    align: "right" as const,
    valueGetter: (row: RecordRow) => (row.id * 17 + index * 3) % 1000,
  })),
  { key: "series", label: "分组", width: 80, fixed: "right", align: "center" },
];
const table = shallowRef<HysVirtualTableInstance<RecordRow>>();
function jump() {
  table.value?.scrollToRow(3199, "center");
  table.value?.scrollToColumn("m300", "center");
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" @click="table?.scrollTo({ top: 0, left: 0 })"
        >回到起点</HysButton
      >
      <HysButton size="sm" variant="primary" @click="jump"
        >定位第 3200 行 / 指标 300</HysButton
      >
      <HysButton size="sm" @click="table?.scrollToColumn('m400', 'end')"
        >查看最后一个指标</HysButton
      >
    </div>
    <HysVirtualTable
      ref="table"
      :rows="rows"
      :columns="columns"
      :height="280"
      virtual-columns
      :column-overscan="2"
      striped
      aria-label="大数据指标矩阵"
    >
      <template #footer="{ range }">
        5,000 行 × {{ columns.length }} 列 · 当前渲染
        {{ range.end - range.start + 1 }} 行 × {{ range.columnKeys.length }} 列
      </template>
    </HysVirtualTable>
    <p class="scenario-note">
      滚动只更新可见的行列窗口。指标值按需读取，固定列始终参与渲染。
    </p>
  </div>
</template>
