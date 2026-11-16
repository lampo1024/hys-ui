<script setup lang="ts">
import HysButton from "../HysButton/HysButton.vue";
import { X } from "../HysIcon/svgIcons";
import type { ChartLegendEntry } from "./chartModel";

defineProps<{
  item: ChartLegendEntry;
  visible: boolean;
  short?: boolean;
  removable?: boolean;
  stretch?: boolean;
  wrap?: boolean;
  showValue?: boolean;
}>();
defineEmits<{ toggle: [event: MouseEvent] }>();
</script>

<template>
  <HysButton
    size="sm"
    variant="ghost"
    class="hys-chart-legend-item"
    :class="{
      'hys-chart-legend-chip': removable,
      'hys-chart-legend-wrap': wrap,
    }"
    :block="stretch"
    :auto-insert-space="false"
    :pressed="visible"
    :aria-label="removable ? '隐藏' + item.label : item.label"
    :aria-description="
      showValue && item.value !== undefined ? '最新值 ' + item.value : undefined
    "
    :data-legend-key="item.key"
    @click="$emit('toggle', $event)"
  >
    <span
      class="hys-chart-legend-swatch"
      :class="{ 'hys-chart-legend-dashed': item.dashed }"
      :style="{ color: item.color }"
      aria-hidden="true"
    />
    <span class="hys-chart-legend-label">{{
      (short && item.shortLabel) || item.label
    }}</span>
    <span
      v-if="showValue && item.value !== undefined"
      class="hys-chart-legend-value"
      >{{ item.value }}</span
    >
    <X
      v-if="removable"
      class="hys-chart-legend-remove"
      :size="12"
      aria-hidden="true"
    />
  </HysButton>
</template>

<style scoped>
.hys-chart-legend-item {
  min-inline-size: 0;
  max-inline-size: 100%;
  justify-content: flex-start;
  text-align: start;
}
.hys-chart-legend-item[aria-pressed="true"]:not(:hover) {
  color: var(--hys-ui-theme-text);
  background: var(--hys-ui-theme-surface);
  border-color: var(--hys-ui-theme-border);
}
.hys-chart-legend-item.hys-chart-legend-chip[aria-pressed="true"]:not(:hover) {
  background: var(--hys-ui-theme-surface-alt);
}
.hys-chart-legend-item[aria-pressed="false"] {
  color: var(--hys-ui-theme-muted);
}
.hys-chart-legend-item[aria-pressed="false"] .hys-chart-legend-label {
  text-decoration: line-through;
}
.hys-chart-legend-item[aria-pressed="false"] .hys-chart-legend-swatch {
  opacity: 0.48;
}
.hys-chart-legend-swatch {
  flex: none;
  inline-size: 8px;
  block-size: 8px;
  border-radius: 2px;
  background: currentColor;
}
.hys-chart-legend-dashed {
  inline-size: 12px;
  block-size: 2px;
  background: repeating-linear-gradient(
    90deg,
    currentColor 0 4px,
    transparent 4px 6px
  );
}
.hys-chart-legend-label {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-chart-legend-wrap .hys-chart-legend-label {
  white-space: normal;
  overflow-wrap: anywhere;
}
.hys-chart-legend-value {
  flex: none;
  margin-inline-start: auto;
  color: var(--hys-ui-theme-muted);
  font-variant-numeric: tabular-nums;
}
.hys-chart-legend-remove {
  flex: none;
  color: var(--hys-ui-theme-muted);
}
@media (pointer: coarse) {
  .hys-chart-legend-item {
    min-block-size: 40px;
  }
}
</style>
