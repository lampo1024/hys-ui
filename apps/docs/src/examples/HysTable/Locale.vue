<script setup lang="ts">
import { ref } from "vue";
import {
  HysTable,
  HysCheckbox,
  type HysTableColumn,
  type HysTableLocale,
} from "hys-ui";
const empty = ref(false),
  loading = ref(false);
const rows = [
  { id: 1, name: "Alice", age: 28 },
  { id: 2, name: "Bob", age: 31 },
  { id: 3, name: "Cara", age: 25 },
];
const columns: HysTableColumn<(typeof rows)[number]>[] = [
  { key: "name", label: "Name", filterable: true },
  { key: "age", label: "Age", sortable: true, align: "right" },
];
const locale: Partial<HysTableLocale> = {
  emptyText: "No data",
  loadingText: "Loading…",
  selectAll: "Select current page",
  selectRow: "Select row {index}",
  filter: "Filter ",
  filterPlaceholder: "Search…",
  reset: "Reset",
  apply: "Apply",
  sortAsc: "Sort {label} ascending",
  sortDesc: "Sort {label} descending",
  paginationLabels: {
    total: "{total} records ({start}–{end})",
    perPage: "Per page",
    jump: "Go to",
    first: "First page",
    previous: "Previous page",
    next: "Next page",
    last: "Last page",
  },
};
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysCheckbox v-model="empty">空数据</HysCheckbox
      ><HysCheckbox v-model="loading">加载中</HysCheckbox>
    </div>
    <div class="demo-content" style="margin-top: 16px">
      <HysTable
        :rows="empty ? [] : rows"
        :columns="columns"
        :locale="locale"
        :loading="loading"
        selectable
        :pagination="{ pageSize: 2 }"
      />
    </div>
    <p class="scenario-note">
      locale 按需覆盖表格内置文案与辅助技术描述，并向分页组件传递导航标签。已有
      emptyText 可单独覆盖空状态。
    </p>
  </div>
</template>
