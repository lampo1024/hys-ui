<script setup lang="ts">
import { computed, ref } from "vue";
import { HysButton, HysScrollbar, HysSelect, type HysScrollbarEdge, type HysScrollbarMask } from "hys-ui";

const count = ref(12);
const edgeMode = ref("both");
const native = ref(false);
const batchSize = 6;
const total = 36;
const modes = [
  { label: "上下两侧", value: "both" },
  { label: "仅顶部", value: "top" },
  { label: "仅底部", value: "bottom" },
  { label: "关闭遮罩", value: "off" },
];
const mask = computed<HysScrollbarMask>(() => {
  if (edgeMode.value === "top" || edgeMode.value === "bottom") return edgeMode.value;
  return edgeMode.value === "both";
});

function loadMore(edge: HysScrollbarEdge) {
  if (edge === "bottom") count.value = Math.min(total, count.value + batchSize);
}
</script>

<template>
  <div class="records-demo">
    <div class="records-controls">
      <HysSelect v-model="edgeMode" :options="modes" size="sm" aria-label="边缘遮罩" />
      <HysButton size="sm" variant="secondary" :aria-pressed="native" @click="native = !native">
        系统滚动条
      </HysButton>
      <output aria-live="polite">已加载 {{ count }} / {{ total }} 条</output>
    </div>
    <HysScrollbar
      :max-height="236"
      :distance="32"
      :native="native"
      :mask="mask"
      direction="vertical"
      aria-label="交付日志"
      tag="ul"
      view-class="record-list"
      class="records"
      @end-reached="loadMore"
    >
      <li v-for="item in count" :key="item">
        <strong>交付记录 {{ item }}</strong>
        <span>已归档</span>
      </li>
    </HysScrollbar>
    <p class="scenario-note">滚动接近底部时加载下一批记录。渐变遮罩提示对应方向还有内容可看。</p>
  </div>
</template>

<style scoped>
.records-demo { display: grid; gap: 10px; min-inline-size: 0; }
.records-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.records-controls :deep(.hys-ui-select) { inline-size: 145px; }
.records-controls output,
.records li span { color: var(--hys-ui-theme-muted); }
.records { border: 1px solid var(--hys-ui-theme-border); border-radius: 8px; }
.records :deep(.record-list) { margin: 0; padding: 0; list-style: none; }
.records li { display: flex; justify-content: space-between; gap: 12px; padding: 12px 16px; }
.records li + li { border-block-start: 1px solid var(--hys-ui-theme-border); }
</style>
