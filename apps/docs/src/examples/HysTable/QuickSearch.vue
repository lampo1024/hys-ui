<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysInput,
  HysTable,
  type HysTableColumn,
  type HysTableInstance,
} from "hys-ui";

const rows = [
  {
    id: "INV-2401",
    account: { name: "Café Nord" },
    region: "华东",
    state: "已支付",
  },
  {
    id: "INV-2402",
    account: { name: "青禾设计" },
    region: "华北",
    state: "待确认",
  },
  {
    id: "INV-2403",
    account: { name: "Nord Studio" },
    region: "华南",
    state: "已支付",
  },
  {
    id: "INV-2404",
    account: { name: "木棉办公" },
    region: "华东",
    state: "待确认",
  },
  {
    id: "INV-2405",
    account: { name: "Atlas Lab" },
    region: "华东",
    state: "已支付",
  },
  {
    id: "INV-2406",
    account: { name: "映山科技" },
    region: "华北",
    state: "待确认",
  },
];
type Invoice = (typeof rows)[number];
const columns: HysTableColumn<Invoice>[] = [
  { key: "id", label: "发票编号", width: 116, sortable: true },
  { key: "account", dataIndex: ["account", "name"], label: "客户", width: 150 },
  { key: "region", label: "区域", width: 84 },
  {
    key: "state",
    label: "状态",
    width: 100,
    filters: [
      { label: "待确认", value: "待确认" },
      { label: "已支付", value: "已支付" },
    ],
  },
];
const table = ref<HysTableInstance<Invoice>>();
const search = ref("");
</script>

<template>
  <HysTable
    ref="table"
    v-model:search="search"
    :columns="columns"
    :rows="rows"
    :search-columns="['id', 'account', 'region']"
    :pagination="{ defaultPageSize: 4, hideOnSinglePage: true }"
    empty-text="没有符合当前条件的发票"
  >
    <template #title="{ rows: matched, setSearch }">
      <div class="invoice-search demo-control-actions">
        <HysInput
          :model-value="search"
          placeholder="搜索发票、客户或区域"
          aria-label="搜索发票、客户或区域"
          clearable
          @update:model-value="setSearch($event)"
        />
        <HysButton size="sm" variant="secondary" @click="setSearch('cafe 华东')"
          >查找 Café Nord</HysButton
        >
        <HysButton
          size="sm"
          variant="ghost"
          @click="
            table?.clearSearch();
            table?.clearFilter();
          "
          >清除条件</HysButton
        >
        <output aria-live="polite">匹配 {{ matched.length }} 条</output>
      </div>
    </template>
  </HysTable>
</template>

<style scoped>
.invoice-search {
  gap: 8px;
}
.invoice-search :deep(.hys-ui-input-wrap) {
  width: min(100%, 245px);
}
.invoice-search output {
  margin-inline-start: auto;
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
</style>
