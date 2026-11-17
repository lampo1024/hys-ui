<script setup lang="ts">
import { computed, ref } from "vue";
import { HysRecordPicker, type HysTableColumn, type HysTableKey } from "hys-ui";
const records = [
  { code: "HZ-01", name: "杭州仓", area: "华东" },
  { code: "SZ-02", name: "深圳仓", area: "华南" },
  { code: "CD-03", name: "成都仓", area: "西南" },
];
const columns: HysTableColumn<(typeof records)[number]>[] = [
  { key: "name", label: "仓库" },
  { key: "area", label: "服务区域" },
];
const selected = ref<HysTableKey[]>([]);
const warehouse = computed(() =>
  records.find(({ code }) => code === selected.value[0]),
);
</script>
<template>
  <div class="demo-stack">
    <HysRecordPicker
      v-model="selected"
      :rows="records"
      :columns="columns"
      row-key="code"
      title="选择发货仓库"
      :labels="{ trigger: '选择发货仓库' }"
    />
    <div role="status">
      {{ warehouse ? "发货仓库 · " + warehouse.name : "尚未选择发货仓库" }}
    </div>
  </div>
</template>
