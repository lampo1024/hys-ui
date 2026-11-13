<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysDataGrid,
  type GridColumn,
  type HysDataGridColumnLayout,
  type HysDataGridInstance,
} from "hys-ui";

const rows = [
  {
    id: "WO-312",
    title: "更换收银终端",
    team: "运维",
    hours: 4,
    state: "待处理",
  },
  {
    id: "WO-313",
    title: "检查仓库传感器",
    team: "设备",
    hours: 3,
    state: "处理中",
  },
  {
    id: "WO-314",
    title: "更新门店网络",
    team: "运维",
    hours: 7,
    state: "已完成",
  },
];
type WorkOrder = (typeof rows)[number];
const columns: GridColumn<WorkOrder>[] = [
  { key: "id", label: "工单号", width: 94, pinned: "left", hideable: false },
  { key: "title", label: "工单名称", width: 166, minWidth: 140 },
  { key: "team", label: "团队", width: 90 },
  { key: "hours", label: "工时", width: 88, align: "right" },
  { key: "state", label: "状态", width: 98 },
];
const grid = ref<HysDataGridInstance>();
const saved = ref<HysDataGridColumnLayout>();
const status = ref("");
const dispatch: HysDataGridColumnLayout = {
  order: ["id", "state", "title", "team"],
  hidden: ["hours"],
  widths: { title: 190 },
};
const cost: HysDataGridColumnLayout = {
  order: ["id", "title", "hours", "team"],
  hidden: ["state"],
  widths: { hours: 120 },
};
function apply(layout: HysDataGridColumnLayout, label: string) {
  grid.value?.applyColumnLayout(layout);
  status.value = label;
}
function save() {
  saved.value = grid.value?.getColumnLayout();
  status.value = "已保存当前列布局";
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="apply(dispatch, '已切换至派单视图')"
        >派单视图</HysButton
      >
      <HysButton
        size="sm"
        variant="secondary"
        @click="apply(cost, '已切换至工时视图')"
        >工时视图</HysButton
      >
      <HysButton size="sm" variant="ghost" @click="save"
        >保存当前布局</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="!saved"
        @click="saved && apply(saved, '已恢复保存的布局')"
        >恢复保存的布局</HysButton
      >
    </div>
    <HysDataGrid
      ref="grid"
      :columns="columns"
      :rows="rows"
      :selectable="false"
    />
    <output v-if="status" class="state-output">{{ status }}</output>
  </div>
</template>
