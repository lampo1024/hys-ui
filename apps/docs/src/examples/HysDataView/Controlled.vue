<script setup lang="ts">
import { computed, ref } from "vue";
import { HysDataView, HysInput, type HysDataViewMode } from "hys-ui";
const view = ref<HysDataViewMode>("list");
const page = ref(1);
const keyword = ref("");
const pageSize = 5;
const records = Array.from({ length: 23 }, (_, index) => ({
  id: `DOC-${String(index + 1).padStart(3, "0")}`,
  title: `${["仓储", "客服", "采购"][index % 3]}交接文档 ${index + 1}`,
}));
const filtered = computed(() =>
  records.filter((record) =>
    (record.id + record.title)
      .toLowerCase()
      .includes(keyword.value.trim().toLowerCase()),
  ),
);
const items = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);
function search(next: string) {
  keyword.value = next;
  page.value = 1;
}
</script>

<template>
  <div class="demo-stack">
    <HysDataView
      v-model:view="view"
      v-model:page="page"
      :page-size="pageSize"
      :items="items"
      :total="filtered.length"
      item-key="id"
    >
      <template #toolbar>
        <div class="demo-search">
          <HysInput
            :model-value="keyword"
            aria-label="文档关键词"
            placeholder="输入仓储、客服或编号"
            clearable
            @update:model-value="search"
          />
        </div>
      </template>
      <template #item="{ item }"
        ><strong>{{ item.title }}</strong> <span>{{ item.id }}</span></template
      >
    </HysDataView>
    <span role="status">第 {{ page }} 页 · {{ filtered.length }} 篇文档</span>
  </div>
</template>

<style scoped>
.demo-search {
  flex: 1 1 200px;
  max-width: 290px;
  min-width: 0;
}
</style>
