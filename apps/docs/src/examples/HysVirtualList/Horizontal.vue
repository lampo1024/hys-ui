<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysVirtualList } from "hys-ui";

const entries = Array.from({ length: 120 }, (_, index) => ({
  key: index + 1,
  title: "记录 " + (index + 1),
  group: "第 " + (Math.floor(index / 12) + 1) + " 批",
}));
const active = ref<number>();
const savedOffset = ref(0);
const offset = ref(0);
const revision = ref(0);
const list = ref<{ scrollToKey: (key: number, align?: "start") => boolean }>();

function reopen() {
  savedOffset.value = offset.value;
  revision.value++;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysButton variant="secondary" @click="list?.scrollToKey(48, 'start')">定位到第 48 条</HysButton>
      <HysButton variant="ghost" @click="reopen">重新打开并恢复位置</HysButton>
    </div>
    <HysVirtualList :key="revision" ref="list" :items="entries" :item-key="entry => entry.key"
      :group-by="entry => entry.group" :initial-offset="savedOffset" :height="108" :row-height="132"
      :overscan="3" horizontal keyboard-navigation @scroll="offset = $event" @activate="active = $event.key">
      <template #item="{ item }"><div class="timeline-card">{{ item.title }}</div></template>
    </HysVirtualList>
    <p role="status">{{ active ? '当前激活第 ' + active + ' 条' : '聚焦列表后，用左右方向键定位，Enter 激活。' }}</p>
  </div>
</template>

<style scoped>
.timeline-card {
  display: grid;
  place-items: center;
  min-block-size: 88px;
  margin: 4px;
  padding: 8px;
  color: var(--hys-ui-theme-text);
  background: var(--hys-ui-theme-surface-alt);
  border-radius: var(--hys-ui-radius, 8px);
}
</style>
