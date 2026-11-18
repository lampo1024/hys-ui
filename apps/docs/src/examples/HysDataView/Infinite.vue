<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { HysDataView, HysSelect } from "hys-ui";

function makeItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: "巡检任务 " + (index + 1),
    group: index < 12 ? "仓储" : "运输",
  }));
}
const items = ref(makeItems(6));
const columns = ref(3);
const loading = ref(false);
const columnOptions = [1, 2, 3].map(value => ({ value, label: value + " 列" }));
let pending: ReturnType<typeof setTimeout> | undefined;
function loadMore() {
  if (loading.value || items.value.length >= 24) return;
  loading.value = true;
  pending = setTimeout(() => {
    items.value = makeItems(items.value.length + 6);
    loading.value = false;
  }, 350);
}
onBeforeUnmount(() => clearTimeout(pending));
</script>

<template>
  <div class="demo-stack">
    <HysDataView :items="items" item-key="id" default-view="grid" :views="['list', 'card', 'grid']"
      :grid-columns="columns" :group-by="item => item.group" :has-more="items.length < 24" :loading="loading"
      @load-more="loadMore">
      <template #toolbar="{ view }">
        <HysSelect v-if="view === 'grid'" v-model="columns" :options="columnOptions" aria-label="网格列数" size="sm" />
      </template>
      <template #item="{ item }"><strong>{{ item.name }}</strong></template>
      <template #card-item="{ item }"><strong>{{ item.name }}</strong><p>负责区域 · {{ item.group }}</p></template>
    </HysDataView>
    <small role="status">已加载 {{ items.length }} 项{{ loading ? '，正在加载' : '' }}</small>
  </div>
</template>
