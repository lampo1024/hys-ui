<script setup lang="ts">
import { ref } from "vue";
import { HysNotificationCenter, type Notice } from "hys-ui";

const items = ref<Notice[]>([
  {
    id: "review",
    title: "周报待复核",
    detail: "经营报表 · 本周",
    category: "报表",
  },
  {
    id: "stock",
    title: "库存调整已完成",
    detail: "仓储组 · 15 分钟前",
    category: "库存",
  },
  {
    id: "snapshot",
    title: "快照已生成",
    detail: "经营报表 · 昨天",
    category: "报表",
    read: true,
  },
]);
function markRead(id?: string) {
  items.value = items.value.map((item) =>
    !id || item.id === id ? { ...item, read: true } : item,
  );
}
</script>

<template>
  <HysNotificationCenter
    :items="items"
    title="工作台通知"
    searchable
    dismissible
    @read="markRead"
    @read-all="markRead()"
    @dismiss="items = items.filter((item) => item.id !== $event)"
  />
</template>
