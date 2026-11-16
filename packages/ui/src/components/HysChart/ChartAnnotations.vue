<script setup lang="ts">
import type { cartesianLayout } from "./cartesianLayout";
type Layout = ReturnType<typeof cartesianLayout>;
defineProps<{
  bands?: Layout["bands"];
  analysis?: Layout["analysis"];
  clipId?: string;
  width?: number;
  height?: number;
}>();
</script>

<template>
  <g v-if="bands?.length" class="chart-bands">
    <g
      v-for="(band, index) in bands"
      :key="index"
      :style="{ color: band.color }"
      :aria-label="band.label"
      :role="band.label ? 'img' : undefined"
    >
      <rect v-bind="band.rect" fill="currentColor" fill-opacity=".10" />
      <text
        v-if="band.label && band.rect.width > 28"
        :x="band.rect.x + 5"
        :y="band.rect.y + 13"
      >
        {{ band.label }}
      </text>
    </g>
  </g>
  <g v-if="analysis?.length" class="chart-analysis">
    <g
      v-for="(item, index) in analysis"
      :key="index"
      :style="{ color: item.color }"
      :aria-label="item.label"
      role="img"
    >
      <line
        v-if="item.to"
        :x1="item.from.x"
        :y1="item.from.y"
        :x2="item.to.x"
        :y2="item.to.y"
        :clip-path="'url(#' + clipId + ')'"
        stroke="currentColor"
        stroke-width="2"
        stroke-dasharray="6 4"
      />
      <template v-else>
        <circle
          :cx="item.from.x"
          :cy="item.from.y"
          r="6"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <text
          :x="item.from.x + (item.from.x > (width ?? 0) * 0.65 ? -9 : 9)"
          :y="Math.max(10, Math.min((height ?? 220) - 7, item.from.y - 8))"
          :text-anchor="item.from.x > (width ?? 0) * 0.65 ? 'end' : 'start'"
          >{{ item.label }}</text
        >
      </template>
    </g>
  </g>
</template>

<style scoped>
.chart-bands {
  color: var(--hys-chart-amber);
}
.chart-analysis,
.chart-bands {
  pointer-events: none;
}
text {
  font-size: 11px;
  fill: var(--hys-ui-theme-text);
  paint-order: stroke;
  stroke: var(--hys-ui-theme-surface);
  stroke-width: 3px;
  stroke-linejoin: round;
}
</style>
