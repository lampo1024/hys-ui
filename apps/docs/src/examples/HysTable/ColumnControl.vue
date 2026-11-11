<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  HysButton,
  HysTable,
  type HysTableColumn,
  type HysTableDirection,
  type HysTableFilters,
  type HysTableFilterValue,
  type HysTableSort,
} from "hys-ui";

const rows = [
  { id: 1, name: "陈晓", team: "设计", completed: 9 },
  { id: 2, name: "林夕", team: "研发", completed: 12 },
  { id: 3, name: "周宁", team: "研发", completed: 6 },
  { id: 4, name: "方悦", team: "设计", completed: 11 },
];
const order = ref<HysTableDirection | null>("desc");
const team = ref<readonly HysTableFilterValue[]>([]);
const filterOpen = ref(false);
const columns = computed<HysTableColumn<(typeof rows)[number]>[]>(() => [
  { key: "name", label: "成员" },
  {
    key: "team",
    label: "团队",
    filteredValue: team.value,
    filterDropdownOpen: filterOpen.value,
    onFilterDropdownOpenChange: (open) => {
      filterOpen.value = open;
    },
    renderFilterDropdown: ({ setValues, confirm, clear }) => [
      h(
        HysButton,
        {
          size: "sm",
          onClick: () => {
            setValues(["研发"]);
            confirm();
          },
        },
        () => "只看研发",
      ),
      h(
        HysButton,
        { size: "sm", variant: "ghost", onClick: () => clear() },
        () => "全部团队",
      ),
    ],
  },
  {
    key: "completed",
    label: "完成数",
    sortable: true,
    sortOrder: order.value,
    align: "right",
  },
]);
function updateSort(sort: HysTableSort | null) {
  order.value = sort?.direction ?? null;
}
function updateFilter(filters: HysTableFilters) {
  team.value = filters.team ?? [];
}
</script>

<template>
  <div class="demo-stack">
    <HysTable
      :rows="rows"
      :columns="columns"
      :show-sorter-tooltip="{ placement: 'bottom', effect: 'light' }"
      :transform-cell-text="
        ({ column, text }) => (column.key === 'completed' ? text + ' 项' : text)
      "
      @sort-change="updateSort"
      @filter-change="updateFilter"
    />
    <p class="scenario-note">
      悬停或聚焦完成数标题可预览下一次排序操作。列配置控制排序、筛选值和筛选面板。表格事件把用户请求交给宿主应用。
    </p>
  </div>
</template>
