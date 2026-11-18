<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysList, type HysListItem } from "hys-ui";
const items = ref<HysListItem[]>([
  { key: 1, title: "物料已入库", group: "今天", unread: true },
  { key: 2, title: "待审批的补货申请", group: "今天", unread: true, description: "申请补充仓库 A 的物料。" },
  { key: 3, title: "昨日交付汇总", group: "更早" },
]);
const selected = ref<(string | number)[]>([]);
const virtual = ref(false);
const hasMore = ref(true);
function markRead(key: string | number) {
  items.value = items.value.map(item => item.key === key ? { ...item, unread: false } : item);
}
function nextPage() {
  if (!hasMore.value) return;
  hasMore.value = false;
  items.value = [...items.value, { key: 4, title: "上周库存报告", group: "更早" }];
}
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="virtual">虚拟渲染</HysCheckbox>
    <HysList v-model:items="items" v-model:selected-keys="selected" selection-mode="multiple" bordered hover-actions
      :sortable="!virtual" :virtual="virtual ? 180 : false" :has-more="hasMore" @load-more="nextPage">
      <template #actions="{ item }">
        <HysButton v-if="item.unread" variant="text" size="sm" @click="markRead(item.key)">标为已读</HysButton>
      </template>
      <template #extension="{ item }">
        <small v-if="item.key === 2">申请来自采购组</small>
      </template>
    </HysList>
    <p role="status">{{ selected.length }} 条已选</p>
  </div>
</template>
