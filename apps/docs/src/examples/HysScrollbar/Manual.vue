<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { HysButton, HysScrollbar, HysSlider, type HysScrollbarInstance } from "hys-ui";

const scrollbar = useTemplateRef<HysScrollbarInstance>("scrollbar");
const height = 220;
const itemHeight = 40;
const count = 24;
const max = count * itemHeight - height;
const top = ref(0);
const percent = computed(() => Math.round(100 * top.value / max));
const sources = ["研发", "测试", "交付", "运营"];
</script>

<template>
  <div class="manual-example">
    <div class="manual-controls">
      <HysButton size="sm" variant="secondary" @click="scrollbar?.setScrollTop(0)">回到顶部</HysButton>
      <HysButton size="sm" variant="secondary" @click="scrollbar?.setScrollTop(max)">跳到底部</HysButton>
      <output>进度 {{ percent }}%</output>
    </div>
    <HysSlider
      :model-value="top"
      :max="max"
      label="浏览位置"
      @update:model-value="scrollbar?.setScrollTop($event)"
    />
    <HysScrollbar
      ref="scrollbar"
      :height="height"
      direction="vertical"
      aria-label="项目变更记录"
      class="changes"
      @scroll="top = Math.round($event.scrollTop)"
    >
      <ul>
        <li v-for="item in count" :key="item" :style="{ blockSize: itemHeight + 'px' }">
          <span>已归档变更 {{ item }}</span><span>{{ sources[(item - 1) % sources.length] }}</span>
        </li>
      </ul>
    </HysScrollbar>
  </div>
</template>

<style scoped>
.manual-example { display: grid; gap: 10px; min-inline-size: 0; }
.manual-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
output, li span:last-child { color: var(--hys-ui-theme-muted); }
.changes { outline: 1px solid var(--hys-ui-theme-border); outline-offset: -1px; border-radius: 8px; }
ul { margin: 0; padding: 0; list-style: none; }
li { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; padding-inline: 14px; }
li + li { border-top: 1px solid var(--hys-ui-theme-border); }
</style>
