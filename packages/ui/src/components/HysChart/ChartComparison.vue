<script setup lang="ts">
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import type { ChartEntry } from "./chartModel";

defineProps<{ items: ChartEntry[]; scrollable?: boolean }>();
</script>

<template>
  <HysScrollbar
    v-if="scrollable && items.length > 5"
    direction="vertical"
    :max-height="172"
    aria-label="系列对比值"
  >
    <ul class="hys-chart-comparison-values">
      <li v-for="item in items" :key="item.key">
        <span
          class="hys-chart-comparison-swatch"
          :style="{ background: item.color }"
          aria-hidden="true"
        />
        <span>{{ item.series.name }}</span
        ><strong>{{ item.text }}</strong>
      </li>
    </ul>
  </HysScrollbar>
  <ul v-else class="hys-chart-comparison-values">
    <li v-for="item in items" :key="item.key">
      <span
        class="hys-chart-comparison-swatch"
        :style="{ background: item.color }"
        aria-hidden="true"
      />
      <span>{{ item.series.name }}</span
      ><strong>{{ item.text }}</strong>
    </li>
  </ul>
</template>

<style scoped>
.hys-chart-comparison-values {
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 2px 6px 2px 0;
  list-style: none;
}
.hys-chart-comparison-values li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 7px;
  font-size: 12px;
}
.hys-chart-comparison-values strong {
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.hys-chart-comparison-swatch {
  inline-size: 7px;
  block-size: 7px;
  border-radius: 2px;
  align-self: center;
}
</style>
