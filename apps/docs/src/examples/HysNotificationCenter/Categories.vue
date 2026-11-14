<script setup lang="ts">
import { ref } from "vue";
import { HysNotificationCenter, type Notice } from "hys-ui";
const items = ref<Notice[]>([
  { id: "1", title: "上周报表已生成", category: "报表" },
  { id: "2", title: "库存复核完成", category: "库存" },
  { id: "3", title: "月报已确认", category: "报表", read: true },
]);
function read(id?: string) {
  items.value = items.value.map((item) =>
    !id || item.id === id ? { ...item, read: true } : item,
  );
}
</script>

<template>
  <HysNotificationCenter
    :items="items"
    title="经营通知"
    category-filter
    @read="read"
    @read-all="read()"
  />
</template>
