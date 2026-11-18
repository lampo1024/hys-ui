<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysVirtualList } from "hys-ui";
const count = ref(80);
const chosen = ref(0);
const list = ref<{ scrollToIndex: (index: number, align?: 'start') => boolean }>();
function create(index: number) { return {id:index + 1, group:"第 " + (Math.floor(index / 20) + 1) + " 批", text:"待核对的日志详情。".repeat(1 + index % 7)}; }
</script>

<template>
  <div class="demo-stack">
    <HysButton size="sm" variant="secondary" @click="list?.scrollToIndex(48, 'start')">定位到第 49 条</HysButton>
    <HysVirtualList ref="list" :items="Array.from({length:count}, (_, i) => create(i))" :item-key="item => item.id"
      :group-by="item => item.group" :height="240" :row-height="60" dynamic keyboard-navigation
      :has-more="count < 200" @load-more="count += 40" @activate="chosen = $event.id">
      <template #item="{ item }"><div style="padding: 6px 10px"><strong>日志 {{ item.id }}</strong><div>{{ item.text }}</div></div></template>
    </HysVirtualList>
    <p role="status">{{ count }} 条记录{{ chosen ? ' · 当前激活 ' + chosen : '' }}</p>
  </div>
</template>
