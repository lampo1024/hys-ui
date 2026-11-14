<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { HysButton, HysCheckbox, HysScrollbar, type HysScrollbarInstance } from "hys-ui";

const scrollbar = useTemplateRef<HysScrollbarInstance>("scrollbar");
const count = ref(3);
const noresize = ref(false);
</script>

<template>
  <div class="height-example">
    <div class="height-controls">
      <HysButton size="sm" variant="secondary" :disabled="count >= 16" @click="count++">添加一条</HysButton>
      <HysButton size="sm" variant="secondary" :disabled="count <= 1" @click="count--">删除末条</HysButton>
      <HysCheckbox v-model="noresize">暂停自动测量</HysCheckbox>
      <HysButton size="sm" variant="ghost" :disabled="!noresize" @click="scrollbar?.update()">刷新滑块</HysButton>
      <output aria-live="polite">{{ count }} 条</output>
    </div>
    <HysScrollbar
      ref="scrollbar"
      :max-height="190"
      :noresize="noresize"
      direction="vertical"
      aria-label="动态任务清单"
      class="tasks"
      tag="ol"
      view-class="task-list"
    >
      <li v-for="item in count" :key="item">验收任务 {{ item }}</li>
    </HysScrollbar>
    <p class="scenario-note">列表随内容增长，达到 190 px 后开始滚动。暂停自动测量后，添加条目并点击「刷新滑块」。</p>
  </div>
</template>

<style scoped>
.height-example { display: grid; gap: 10px; min-inline-size: 0; }
.height-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
output { color: var(--hys-ui-theme-muted); }
.tasks { border: 1px solid var(--hys-ui-theme-border); border-radius: 8px; }
.tasks :deep(.task-list) { margin: 0; padding: 0; list-style: none; }
li { padding: 10px 14px; }
li + li { border-top: 1px solid var(--hys-ui-theme-border); }
</style>
