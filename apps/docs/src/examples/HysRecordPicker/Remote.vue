<script setup lang="ts">
import { ref, watch } from "vue";
import { HysRecordPicker, type HysTableColumn, type HysTableKey } from "hys-ui";
const all = Array.from({ length: 31 }, (_, index) => ({
  id: "SUP-" + String(101 + index),
  name: ["远航物资", "绿洲设备", "联成物流"][index % 3] + ` ${index + 1}`,
}));
type Supplier = (typeof all)[number];
const columns: HysTableColumn<Supplier>[] = [
  { key: "id", label: "编号" },
  { key: "name", label: "供应商" },
];
const rows = ref<Supplier[]>([]);
const selected = ref<HysTableKey[]>([]);
const total = ref(all.length);
const keyword = ref("");
const loading = ref(false);
const page = ref(1);
const size = 5;
watch(
  [keyword, page],
  ([text, index], _, onCleanup) => {
    loading.value = true;
    const timer = setTimeout(() => {
      const filtered = all.filter((item) =>
        (item.name + item.id).toLowerCase().includes(text.toLowerCase()),
      );
      rows.value = filtered.slice((index - 1) * size, index * size);
      total.value = filtered.length;
      loading.value = false;
    }, 420);
    onCleanup(() => clearTimeout(timer));
  },
  { immediate: true },
);
</script>
<template>
  <div class="demo-stack">
    <HysRecordPicker
      v-model="selected"
      v-model:page="page"
      :rows="rows"
      :columns="columns"
      :total="total"
      :page-size="size"
      :loading="loading"
      multiple
      title="选择供应商"
      :labels="{ trigger: '选择供应商' }"
      @search="keyword = $event"
    />
    <span role="status">已确认 · {{ selected.join("、") || "无" }}</span>
    <p class="scenario-note">
      用本地定时器模拟接口分页。搜索后，先前选中的编号仍保留。
    </p>
  </div>
</template>
