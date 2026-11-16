<script setup lang="ts">
import { computed } from "vue";
import { specialLayout } from "./specialLayout";
import type { ChartEntry, ChartSeries } from "./chartModel";
import type { HysChartAxis, HysChartType } from "./chartTypes";

const props = defineProps<{
  type: HysChartType;
  groups: ChartSeries[];
  categories: string[];
  width: number;
  height: number;
  axis: HysChartAxis;
  selected?: string | null;
  showValues?: boolean;
  accessible: (entry: ChartEntry) => string;
  axisLabel: (value: number) => string;
}>();
const plot = computed(() =>
  specialLayout(
    props.type,
    props.groups,
    props.categories,
    props.width,
    props.height,
    props.axis,
  ),
);
function target(entry: ChartEntry) {
  return {
    "data-chart-point": entry.key,
    "aria-label": props.accessible(entry),
    "aria-pressed": props.selected === entry.key,
    tabindex: 0,
    role: "button",
    class: "hys-chart-hit",
  };
}
const trimLabel = (label: string, size: number) =>
  label.length > size ? label.slice(0, Math.max(0, size - 1)) + "…" : label;
</script>

<template>
  <g v-if="plot.radar">
    <g class="chart-grid" aria-hidden="true">
      <polygon v-for="ring in plot.radar.rings" :key="ring" :points="ring" />
      <line
        v-for="label in plot.radar.labels"
        :key="label.index"
        :x1="width / 2"
        :y1="height / 2"
        :x2="label.x"
        :y2="label.y"
      />
      <text
        v-for="label in plot.radar.labels.filter(
          (label) => label.index % plot.radar!.stride === 0,
        )"
        :key="label.index"
        :x="label.x + Math.sign(label.x - width / 2) * 5"
        :y="label.y + Math.sign(label.y - height / 2) * 6"
        :text-anchor="
          Math.abs(label.x - width / 2) < 1
            ? 'middle'
            : label.x < width / 2
              ? 'end'
              : 'start'
        "
        dominant-baseline="central"
        >{{ trimLabel(label.label, 6) }}</text
      >
    </g>
    <g
      v-for="layer in plot.radar.layers"
      :key="layer.group.key"
      :style="{ color: layer.group.color }"
    >
      <polygon
        v-if="layer.closed"
        :points="layer.points"
        fill="currentColor"
        fill-opacity=".14"
        stroke="currentColor"
        stroke-width="2"
      />
      <template v-else>
        <line
          v-for="(mark, index) in layer.marks.slice(1)"
          :key="mark.entry.key"
          v-show="mark.entry.category === layer.marks[index].entry.category + 1"
          :x1="layer.marks[index].x"
          :y1="layer.marks[index].y"
          :x2="mark.x"
          :y2="mark.y"
          stroke="currentColor"
          stroke-width="2"
        />
      </template>
      <g
        v-for="mark in layer.marks"
        :key="mark.entry.key"
        v-bind="target(mark.entry)"
      >
        <circle :cx="mark.x" :cy="mark.y" r="10" fill="transparent" />
        <circle
          :cx="mark.x"
          :cy="mark.y"
          r="4"
          :fill="mark.entry.color"
          class="chart-target"
        />
      </g>
    </g>
  </g>
  <g
    v-for="item in plot.funnel"
    :key="item.entry.key"
    v-bind="target(item.entry)"
  >
    <polygon
      :points="item.points"
      :fill="item.entry.color"
      class="chart-target"
    />
    <text
      v-if="height / plot.funnel.length >= 18"
      :x="item.x"
      :y="item.y"
      :text-anchor="item.inline ? 'middle' : 'start'"
      dominant-baseline="central"
      :class="{ 'chart-inline-label': item.inline }"
    >
      {{ trimLabel(item.entry.point.label, 9)
      }}{{ showValues ? " · " + item.entry.text : "" }}
    </text>
  </g>
  <g v-if="plot.gauge" v-bind="target(plot.gauge.entry)">
    <path :d="plot.gauge.track" class="chart-gauge-track" />
    <path
      v-if="plot.gauge.fill"
      :d="plot.gauge.fill"
      :stroke="plot.gauge.entry.color"
      class="chart-gauge-fill chart-target"
    />
    <text
      :x="plot.gauge.cx"
      :y="plot.gauge.y - Math.min(15, plot.gauge.r / 3)"
      text-anchor="middle"
      class="chart-gauge-value"
      >{{ plot.gauge.entry.text }}</text
    >
    <text
      v-if="height >= 85"
      :x="plot.gauge.cx - plot.gauge.r"
      :y="plot.gauge.y + 22"
      text-anchor="middle"
      >{{ axisLabel(plot.gauge.min) }}</text
    >
    <text
      v-if="height >= 85"
      :x="plot.gauge.cx + plot.gauge.r"
      :y="plot.gauge.y + 22"
      text-anchor="middle"
      >{{ axisLabel(plot.gauge.max) }}</text
    >
  </g>
  <g v-if="plot.heatmap">
    <g
      v-for="cell in plot.heatmap.cells"
      :key="cell.entry.key"
      v-bind="target(cell.entry)"
    >
      <rect
        :x="cell.x"
        :y="cell.y"
        :width="Math.max(0.1, plot.heatmap.cellW - 2)"
        :height="Math.max(0.1, plot.heatmap.cellH - 2)"
        rx="3"
        :fill="cell.entry.point.color ?? 'var(--hys-chart-primary)'"
        :fill-opacity="cell.intensity"
        class="chart-target"
      />
      <text
        v-if="
          showValues && plot.heatmap.cellW >= 42 && plot.heatmap.cellH >= 18
        "
        :x="cell.x + plot.heatmap.cellW / 2"
        :y="cell.y + plot.heatmap.cellH / 2"
        :class="{ 'chart-inline-label': cell.intensity > 0.55 }"
        text-anchor="middle"
        dominant-baseline="central"
        >{{ cell.entry.text }}</text
      >
    </g>
    <text
      v-for="(label, index) in plot.heatmap.categories"
      v-show="index % Math.ceil(50 / plot.heatmap.cellW) === 0"
      :key="index"
      :x="plot.heatmap.left + (index + 0.5) * plot.heatmap.cellW"
      :y="height - 9"
      text-anchor="middle"
    >
      {{ trimLabel(label, 6) }}
    </text>
    <text
      v-for="(row, index) in plot.heatmap.groups"
      v-show="index % Math.ceil(19 / plot.heatmap.cellH) === 0"
      :key="row.key"
      :x="plot.heatmap.left - 6"
      :y="plot.heatmap.top + (index + 0.5) * plot.heatmap.cellH"
      dominant-baseline="central"
      text-anchor="end"
      >{{
        trimLabel(
          row.series.name,
          Math.max(2, Math.floor(plot.heatmap.left / 12)),
        )
      }}</text
    >
  </g>
</template>

<style scoped>
text {
  fill: var(--hys-ui-theme-text);
  font-size: 11px;
  pointer-events: none;
}
.chart-grid :is(polygon, line) {
  fill: none;
  stroke: var(--hys-ui-theme-border);
}
.chart-grid text {
  fill: var(--hys-ui-theme-muted);
}
.hys-chart-hit {
  cursor: pointer;
}
.hys-chart-hit:is(:hover, :focus-visible, [aria-pressed="true"])
  .chart-target:not(.chart-gauge-fill) {
  stroke: var(--hys-ui-theme-text);
  stroke-width: 1.7px;
}
.chart-inline-label {
  fill: white;
  paint-order: stroke;
  stroke: #0008;
  stroke-width: 2px;
}
.chart-gauge-track,
.chart-gauge-fill {
  fill: none;
  stroke-width: 9;
  stroke-linecap: round;
}
.chart-gauge-track {
  stroke: var(--hys-ui-theme-border);
}
.hys-chart-hit[aria-pressed="true"] .chart-gauge-fill {
  stroke-width: 12;
}
.chart-gauge-value {
  font-size: 19px;
  font-weight: 700;
}
</style>
