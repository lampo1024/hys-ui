<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysDataGrid,
  HysSelect,
  type GridColumn,
  type HysDataGridInstance,
} from "hys-ui";

const rows = [
  { id: "01", team: "应用", type: "需求", hours: 6 },
  { id: "02", team: "应用", type: "缺陷", hours: 3 },
  { id: "03", team: "平台", type: "需求", hours: 9 },
  { id: "04", team: "平台", type: "缺陷", hours: 4 },
  { id: "05", team: "支持", type: "需求", hours: 5 },
  { id: "06", team: "支持", type: "缺陷", hours: 2 },
];
type Task = (typeof rows)[number];
const columns: GridColumn<Task>[] = [
  { key: "id", label: "编号", width: 84 },
  { key: "team", label: "团队", width: 110 },
  { key: "type", label: "类型", width: 104 },
  { key: "hours", label: "工时", width: 90, align: "right", summary: "sum" },
];
const grid = ref<HysDataGridInstance>();
const groupBy = ref("team");
const scope = ref<"filtered" | "page" | "selected">("filtered");
const scopes = [
  { label: "筛选结果", value: "filtered" },
  { label: "当前页", value: "page" },
  { label: "已选行", value: "selected" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="summary-filter"
        >表尾汇总
        <HysSelect
          v-model="scope"
          :options="scopes"
          aria-label="表尾汇总范围"
        />
      </label>
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="!groupBy"
        @click="grid?.setGroupsExpanded(false)"
        >折叠本页分组</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="!groupBy"
        @click="grid?.setGroupsExpanded(true)"
        >展开本页分组</HysButton
      >
    </div>
    <HysDataGrid
      ref="grid"
      v-model:group-by="groupBy"
      :columns="columns"
      :rows="rows"
      :page-size="4"
      :summary-scope="scope"
      groupable
      group-summary
      show-summary
    />
  </div>
</template>

<style scoped>
.summary-filter {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
}
</style>
