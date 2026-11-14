<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { HysButton, HysCheckbox, HysScrollbar, type HysScrollbarInstance, type HysScrollbarPosition } from "hys-ui";

const timeline = useTemplateRef<HysScrollbarInstance>("timeline");
const position = ref<HysScrollbarPosition>({ scrollLeft: 0, scrollTop: 0 });
const always = ref(false);
const stages = ["需求评审", "方案确认", "开发联调", "用例补齐", "上线准备", "发布复盘"];
</script>

<template>
  <div class="timeline-demo">
    <div class="timeline-controls">
      <HysButton size="sm" variant="secondary" @click="timeline?.setScrollLeft(0)">回到开头</HysButton>
      <HysButton size="sm" variant="secondary" @click="timeline?.scrollBy({ left: 204 })">向右滚动</HysButton>
      <HysCheckbox v-model="always">始终显示滚动条</HysCheckbox>
      <output>横向位置 {{ Math.round(position.scrollLeft) }} px</output>
    </div>
    <HysScrollbar
      ref="timeline"
      direction="horizontal"
      :always="always"
      :min-size="32"
      aria-label="发布排期"
      class="timeline"
      @scroll="position = $event"
    >
      <ol>
        <li v-for="(stage, index) in stages" :key="stage">
          <span>第 {{ index + 1 }} 周</span>
          <strong>{{ stage }}</strong>
        </li>
      </ol>
    </HysScrollbar>
  </div>
</template>

<style scoped>
.timeline-demo {
  display: grid;
  gap: 10px;
  min-inline-size: 0;
}
.timeline-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.timeline-controls output {
  color: var(--hys-ui-theme-muted);
  font-variant-numeric: tabular-nums;
}
.timeline {
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 8px;
  --hys-ui-scrollbar-thumb: var(--hys-ui-theme-primary);
  --hys-ui-scrollbar-thumb-hover: var(--hys-ui-theme-primary-hover);
}
ol {
  display: flex;
  gap: 8px;
  inline-size: max-content;
  margin: 0;
  padding: 10px;
  list-style: none;
}
li {
  display: grid;
  gap: 6px;
  box-sizing: border-box;
  inline-size: 196px;
  padding: 12px;
  border-radius: 6px;
  background: var(--hys-ui-theme-bg);
  color: var(--hys-ui-theme-text);
}
li span {
  color: var(--hys-ui-theme-muted);
}
</style>
