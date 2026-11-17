<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysActionBar,
  HysPagination,
  HysTable,
  type HysActionBarItem,
  type HysTableColumn,
  type HysTableKey,
} from "hys-ui";
const records = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  name: "归档批次 " + (index + 1),
}));
const columns: HysTableColumn<(typeof records)[number]>[] = [
  { key: "name", label: "本页批次" },
];
const page = ref(1);
const selected = ref<HysTableKey[]>([]);
const result = ref("");
const rows = computed(() =>
  records.slice((page.value - 1) * 3, page.value * 3),
);
const actions: HysActionBarItem[] = [
  {
    key: "archive",
    label: "归档所选",
    confirm: { title: "归档全部已选批次？" },
  },
];
</script>
<template>
  <div class="demo-stack">
    <HysActionBar
      :selected-count="selected.length"
      :total-count="records.length"
      :actions="actions"
      visible-when-empty
      show-select-all
      @select-all="selected = records.map((item) => item.id)"
      @clear-selection="selected = []"
      @action="result = '已归档 ' + selected.length + ' 个批次'"
    />
    <HysTable
      v-model:selected-row-keys="selected"
      :rows="rows"
      :columns="columns"
      selectable
      reserve-selection
      size="sm"
    />
    <HysPagination
      v-model:page="page"
      :total="records.length"
      :page-size="3"
      size="sm"
    />
    <span role="status">{{ result }}</span>
  </div>
</template>
