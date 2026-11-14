<script setup lang="ts">
import { computed } from "vue";
import { useHysRootAttrs } from "../../config";

export interface HysChartPoint {
  label: string;
  value: number;
  color?: string;
}
export interface HysChartReference { value: number; label: string }
const props = withDefaults(
  defineProps<{
    data: HysChartPoint[];
    type?: "bar" | "line";
    height?: number;
    showValues?: boolean;
    showTable?: boolean;
    valueFormatter?: (value: number, point: HysChartPoint) => string;
    emptyText?: string;
    reference?: HysChartReference;
  }>(),
  { type: "bar", height: 220, emptyText: "暂无图表数据" },
);
const hysRootAttrs = useHysRootAttrs();
const chart = computed(() => {
  const data = props.data.filter((point) => Number.isFinite(point.value));
  let minimum = 0;
  let maximum = 0;
  for (const { value } of data) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  const reference = props.reference;
  const referenceValue = reference && Number.isFinite(reference.value) ? reference.value : undefined;
  if (referenceValue !== undefined) {
    minimum = Math.min(minimum, referenceValue);
    maximum = Math.max(maximum, referenceValue);
  }
  const magnitude = Math.max(Math.abs(minimum), Math.abs(maximum), 1);
  const min = minimum / magnitude;
  const max = maximum / magnitude || (minimum === 0 ? 1 : 0);
  const y = (value: number) =>
    92 - ((value / magnitude - min) / (max - min)) * 84;
  const zero = y(0);
  return {
    zero,
    reference: referenceValue === undefined || !reference ? undefined : { y: y(referenceValue), label: reference.label },
    points: data.map((point, index) => ({
      point,
      x: ((index + 0.5) / data.length) * 100,
      y: y(point.value),
      text: props.valueFormatter?.(point.value, point) ?? String(point.value),
    })),
  };
});
const points = computed(() =>
  chart.value.points.map(({ x, y }) => x + "," + y).join(" "),
);
</script>

<template>
  <figure v-bind="hysRootAttrs" class="hys-ui-ent-panel hys-chart">
    <figcaption v-if="$slots.title" class="hys-chart-title">
      <slot name="title" />
    </figcaption>
    <div
      v-if="chart.points.length"
      role="img"
      class="hys-chart-figure"
      :aria-label="
        chart.points
          .map(({ point, text }) => point.label + ' ' + text)
          .concat(chart.reference ? [chart.reference.label] : []).join('，')
      "
    >
      <div
        class="hys-chart-plot"
        :style="{
          height: Math.max(48, Number.isFinite(height) ? height : 220) + 'px',
        }"
        aria-hidden="true"
      >
        <div class="hys-chart-zero" :style="{ top: chart.zero + '%' }" />
        <div v-if="chart.reference" class="hys-chart-reference" :style="{ top: chart.reference.y + '%' }">
          <span :title="chart.reference.label">{{ chart.reference.label }}</span>
        </div>
        <svg
          v-if="type === 'line'"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            :points="points"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <div
          v-for="({ point, x, y, text }, index) in chart.points"
          :key="index"
          class="hys-chart-mark"
          :style="{ left: x + '%', color: point.color, width: 100 / chart.points.length + '%' }"
        >
          <span
            v-if="type === 'bar'"
            class="hys-chart-bar"
            :style="{
              top: Math.min(y, chart.zero) + '%',
              height: Math.abs(y - chart.zero) + '%',
            }"
            :title="point.label + ' ' + text"
          />
          <span
            v-else
            class="hys-chart-dot"
            :style="{ top: y + '%' }"
            :title="point.label + ' ' + text"
          />
          <span
            v-if="showValues"
            class="hys-chart-value"
            :class="{ 'hys-chart-value-negative': point.value < 0 }"
            :style="{ top: y + '%' }"
            >{{ text }}</span
          >
        </div>
      </div>
      <div class="hys-chart-labels" aria-hidden="true">
        <span
          v-for="({ point }, index) in chart.points"
          :key="index"
          :title="point.label"
          >{{ point.label }}</span
        >
      </div>
    </div>
    <div v-else class="hys-ui-ent-muted hys-chart-empty">
      <slot name="empty">{{ emptyText }}</slot>
    </div>
    <div v-if="showTable && chart.points.length" class="hys-chart-table">
      <table>
        <thead>
          <tr>
            <th scope="col">项目</th>
            <th scope="col">数值</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="({ point, text }, index) in chart.points" :key="index">
            <th scope="row">{{ point.label }}</th>
            <td>{{ text }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>

<style scoped>
.hys-chart {
  margin: 0;
  min-width: 0;
}
.hys-chart-title {
  margin-bottom: 12px;
  font-weight: 650;
}
.hys-chart-plot {
  position: relative;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-chart-zero,
.hys-chart-plot svg {
  position: absolute;
  width: 100%;
}
.hys-chart-zero {
  border-top: 1px solid var(--hys-ui-theme-border);
}
.hys-chart-reference {
  position: absolute;
  width: 100%;
  border-block-start: 1px dashed var(--hys-ui-orange, var(--hys-ui-theme-orange));
  z-index: 1;
  pointer-events: none;
}
.hys-chart-reference span {
  position: absolute;
  inset-inline-end: 0;
  bottom: 2px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-inline: 4px;
  background: var(--hys-ui-theme-surface);
  color: var(--hys-ui-theme-text);
  font-size: 11px;
}
.hys-chart-plot svg {
  inset: 0;
  height: 100%;
}
.hys-chart-mark {
  position: absolute;
  top: 0;
  height: 100%;
}
.hys-chart-bar,
.hys-chart-dot,
.hys-chart-value {
  position: absolute;
  left: 0;
  transform: translateX(-50%);
}
.hys-chart-bar,
.hys-chart-dot {
  background: currentColor;
}
.hys-chart-bar {
  width: min(68%, 32px);
  border-radius: 3px;
}
.hys-chart-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  translate: 0 -50%;
}
.hys-chart-value {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  translate: 0 calc(-100% - 3px);
  font-size: 11px;
  color: var(--hys-ui-theme-text);
}
.hys-chart-value-negative {
  translate: 0 3px;
}
.hys-chart-labels {
  display: flex;
  color: var(--hys-ui-theme-muted);
}
.hys-chart-labels span {
  flex: 1;
  min-width: 0;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
.hys-chart-table {
  margin-top: 14px;
  overflow: auto;
}
.hys-chart-table table {
  width: 100%;
  border-collapse: collapse;
  text-align: start;
  font-size: 13px;
}
.hys-chart-table th,
.hys-chart-table td {
  padding: 5px 8px;
  border-bottom: 1px solid var(--hys-ui-theme-border);
  text-align: start;
}
.hys-chart-empty {
  text-align: center;
  padding: 18px;
}
</style>
