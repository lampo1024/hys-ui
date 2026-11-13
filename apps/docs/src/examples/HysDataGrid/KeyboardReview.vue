<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysDataGrid,
  type GridColumn,
  type HysDataGridInstance,
} from "hys-ui";

const rows = [
  { id: "REQ-102", title: "更新商品编码", owner: "商品运营", state: "待复核" },
  { id: "REQ-103", title: "确认门店盘点", owner: "仓库", state: "待复核" },
  { id: "REQ-104", title: "核对物流回单", owner: "物流", state: "已归档" },
];
type Review = (typeof rows)[number];
const columns: GridColumn<Review>[] = [
  { key: "title", label: "复核事项", width: 152 },
  { key: "owner", label: "团队", width: 105 },
  { key: "state", label: "状态", width: 98 },
];
const grid = ref<HysDataGridInstance>();
const selected = ref<(string | number)[]>([]);
const current = ref<string>();
</script>

<template>
  <div class="demo-stack">
    <HysDataGrid
      ref="grid"
      v-model:selected-row-keys="selected"
      :columns="columns"
      :rows="rows"
      :row-selectable="(row) => row.state !== '已归档'"
      keyboard-navigation
      @row-click="current = $event.title"
    >
      <template #toolbar-actions>
        <HysButton
          size="sm"
          variant="secondary"
          @click="grid?.focusRow('REQ-102')"
          >聚焦待复核行</HysButton
        >
      </template>
    </HysDataGrid>
    <output class="state-output">
      ↑ ↓ 移动 · 空格勾选 · Enter 查看<span v-if="current">
        · 正在查看 {{ current }}</span
      >
    </output>
  </div>
</template>
