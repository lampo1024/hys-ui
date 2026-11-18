<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysVirtualList } from "hys-ui";
const items = Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, name: "配送任务 " + (i + 1) }));
const list = ref<{ scrollToKey: (id: number, align: "start") => boolean }>();
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row"><HysButton variant="secondary" @click="list?.scrollToKey(5000, 'start')">定位第 5000 条</HysButton><HysButton variant="ghost" @click="list?.scrollToKey(1, 'start')">回到开头</HysButton></div>
    <HysVirtualList ref="list" :items="items" :item-key="entry => entry.id" :height="220" :row-height="38">
      <template #item="{ item }"><p style="margin: 0; padding: 8px 12px; border-bottom: 1px solid var(--hys-ui-theme-border)">{{ item.name }}</p></template>
    </HysVirtualList>
  </div>
</template>
