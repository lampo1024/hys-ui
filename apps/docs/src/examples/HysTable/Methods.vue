<script setup lang="ts">
import { ref } from "vue";
import {
  HysTable,
  HysButton,
  type HysTableColumn,
  type HysTableInstance,
} from "hys-ui";
type Item = { id: number; name: string; progress: number };
const table = ref<HysTableInstance<Item>>(),
  message = ref("");
const rows: Item[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: "任务 " + (i + 1),
  progress: (i * 13) % 101,
}));
const columns: HysTableColumn<Item>[] = [
  { key: "id", label: "编号", width: 90 },
  { key: "name", label: "任务", width: 240, filterable: true },
  { key: "progress", label: "进度", width: 150, sortable: true },
];
async function select() {
  await table.value?.toggleRowSelection(2, true);
  message.value =
    table.value
      ?.getSelectionRows()
      .map((r) => r.name)
      .join("、") ?? "";
}
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysButton size="sm" variant="secondary" @click="select"
        >选择任务 2</HysButton
      ><HysButton size="sm" variant="secondary" @click="table?.clearSelection()"
        >清空选择</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="table?.setSort({ key: 'progress', direction: 'desc' })"
        >按进度降序</HysButton
      ><HysButton size="sm" variant="secondary" @click="table?.clearSort()"
        >清空排序</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="table?.scrollTo({ top: 10000, behavior: 'smooth' })"
        >滚动到底部</HysButton
      >
    </div>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        ref="table"
        :rows="rows"
        :columns="columns"
        selectable
        :height="280"
      />
    </div>
    <output class="state-output">{{
      message || "实例方法与界面操作共享同一状态"
    }}</output>
    <p class="scenario-note">
      Tab 聚焦表头按钮、复选框、滚动区域或列宽分隔线；Enter / Space
      操作排序与选择，Escape 关闭筛选浮层或取消列宽拖动。滚动方法不改变选择。
    </p>
  </div>
</template>
