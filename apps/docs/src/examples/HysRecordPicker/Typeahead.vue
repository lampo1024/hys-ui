<script setup lang="ts">
import { ref, watch } from "vue";
import { HysRecordPicker, type HysTableColumn, type HysTableKey } from "hys-ui";
const source = [
  { id: "Q024", label: "杭州交付组" },
  { id: "Q062", label: "深圳交付组" },
  { id: "Q107", label: "上海仓储组" },
  { id: "Q108", label: "苏州仓储组" },
];
type Record = (typeof source)[number];
const columns: HysTableColumn<Record>[] = [
  { key: "label", label: "服务团队" },
  { key: "id", label: "组编号" },
];
const query = ref("");
const results = ref(source);
const loading = ref(false);
const keys = ref<HysTableKey[]>([]);
watch(query, (keyword, _, onCleanup) => {
  loading.value = true;
  const timer = setTimeout(() => {
    results.value = source.filter((item) =>
      (item.id + item.label).toLowerCase().includes(keyword.toLowerCase()),
    );
    loading.value = false;
  }, 460);
  onCleanup(() => clearTimeout(timer));
});
</script>
<template>
  <div class="demo-stack">
    <HysRecordPicker
      v-model="keys"
      :rows="results"
      :columns="columns"
      :total="results.length"
      :loading="loading"
      search-trigger="input"
      :search-delay="180"
      multiple
      show-selected
      title="搜索服务团队"
      :labels="{ trigger: '搜索服务团队' }"
      @search="query = $event"
    />
    <span role="status">{{
      keys.join("、") || "输入组名或编号以过滤团队"
    }}</span>
  </div>
</template>
