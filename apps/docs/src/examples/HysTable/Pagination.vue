<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysTable,
  HysPagination,
  HysSelect,
  HysCheckbox,
  type HysTableColumn,
  type HysTablePaginationPosition,
} from "hys-ui";
const position = ref<HysTablePaginationPosition>("bottom-right"),
  both = ref(false),
  page = ref(1);
const options = [
  { label: "顶部左侧", value: "top-left" },
  { label: "顶部居中", value: "top-center" },
  { label: "顶部右侧", value: "top-right" },
  { label: "底部左侧", value: "bottom-left" },
  { label: "底部居中", value: "bottom-center" },
  { label: "底部右侧", value: "bottom-right" },
];
const positions = computed<HysTablePaginationPosition[]>(() =>
  both.value ? ["top-right", "bottom-right"] : [position.value],
);
type Entry = { id: number; name: string; amount: number };
const rows: Entry[] = Array.from({ length: 42 }, (_, i) => ({
  id: i + 1,
  name: "订单 " + String(i + 1).padStart(3, "0"),
  amount: 100 + i * 25,
}));
const columns: HysTableColumn<Entry>[] = [
  { key: "name", label: "订单", sortable: true },
  {
    key: "amount",
    label: "金额",
    sortable: true,
    align: "right",
    formatter: (_r, _c, v) => "¥ " + v,
  },
];
</script>
<template>
  <div>
    <div class="demo-controls">
      <label style="display: grid; gap: 8px; max-width: 220px"
        >分页位置<HysSelect
          v-model="position"
          :options="options"
          :disabled="both" /></label
      ><HysCheckbox v-model="both">同时显示顶部和底部</HysCheckbox>
    </div>
    <div class="demo-content">
      <HysTable
        v-model:page="page"
        :rows="rows"
        :columns="columns"
        :pagination="{
          defaultPageSize: 6,
          position: positions,
          size: 'sm',
          layout: 'total, ->, prev, pager, next, sizes',
        }"
        height="320"
        scroll-to-first-row-on-change
      >
        <template #pagination="{ props, setPage, setPageSize }">
          <HysPagination v-bind="props" @change="setPage" @page-size-change="setPageSize">
            <template #total="{ start, end, total }">订单 {{ start }}–{{ end }} / {{ total }}</template>
          </HysPagination>
        </template>
      </HysTable>
    </div>
    <output class="state-output">第 {{ page }} 页</output>
    <p class="scenario-note">
      上下分页器共享页码和每页条数。分页布局可调整控件顺序，自定义分页器也可继续使用表格的翻页与查询逻辑。
    </p>
  </div>
</template>
