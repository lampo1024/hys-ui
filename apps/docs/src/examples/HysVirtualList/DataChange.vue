<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysVirtualList } from "hys-ui";
const data = ref(Array.from({ length: 220 }, (_, i) => ({ id: i + 1, label: "处理记录 " + (i + 1) })));
const busy = ref(false);
let next = 220;
const list = ref<{ scrollToIndex: (i: number, align: "start") => boolean }>();
function prepend() { data.value = [{ id: ++next, label: "新日志 " + next }, ...data.value]; }
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row"><HysButton variant="secondary" @click="list?.scrollToIndex(100, 'start')">查看中段</HysButton><HysButton variant="ghost" @click="prepend">在顶部插入</HysButton><HysCheckbox v-model="busy">加载状态</HysCheckbox></div>
    <HysVirtualList ref="list" :items="data" :item-key="entry => entry.id" :loading="busy" :height="180">
      <template #item="{ item, index }"><p style="margin: 8px">{{ index + 1 }} · {{ item.label }}</p></template>
    </HysVirtualList>
  </div>
</template>
