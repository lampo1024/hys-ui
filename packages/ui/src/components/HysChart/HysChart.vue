<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from "vue";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import { chartData, chartReferences, type ChartEntry } from "./chartModel";
import { cartesianLayout } from "./cartesianLayout";
import { radialLayout } from "./radialLayout";
import type { HysChartProps, HysChartSelection } from "./chartTypes";
export type { HysChartPoint, HysChartReference } from "./chartTypes";

const props = withDefaults(defineProps<HysChartProps>(), {
  type: "bar",
  height: 220,
  barStyle: "solid",
  innerRadius: 0.64,
  showLegend: undefined,
  showGrid: true,
  showTooltip: true,
  emptyText: "暂无图表数据",
});
const emit = defineEmits<{
  "point-click": [selection: HysChartSelection];
  "legend-change": [change: { key: string; visible: boolean }];
}>();
const attrs = useHysRootAttrs();
const id = useId();
const plot = useTemplateRef<HTMLElement>("plot");
const width = ref(620);
const height = computed(() =>
  Math.max(48, Number.isFinite(props.height) ? props.height : 220),
);
const radial = computed(() => props.type === "pie" || props.type === "donut");
const data = computed(() =>
  chartData(
    props.data ?? [],
    props.series,
    props.type,
    props.colors,
    (point) =>
      props.valueFormatter?.(point.value, point) ?? String(point.value),
  ),
);
const hidden = shallowRef<ReadonlySet<string>>(new Set());
const groupLegends = computed(() =>
  data.value.groups
    .filter(({ entries }) => entries.length)
    .map(({ series, color, key }) => ({ key, label: series.name, color })),
);
const legends = computed(() =>
  radial.value
    ? data.value.groups.flatMap(({ entries }) =>
        entries.map(({ key, point, color }) => ({
          key,
          label: point.label,
          color,
        })),
      )
    : groupLegends.value,
);
const groups = computed(() =>
  data.value.groups.filter(
    ({ key, entries }) => entries.length && !hidden.value.has(key),
  ),
);
const formattedPercent = new Intl.NumberFormat("zh-CN", {
  style: "percent",
  maximumFractionDigits: 1,
});
const number = new Intl.NumberFormat("zh-CN", {
  notation: "compact",
  maximumFractionDigits: 2,
});
const pie = computed(() =>
  radial.value
    ? radialLayout(
        data.value.groups.flatMap(({ entries }) =>
          entries.filter(({ key }) => !hidden.value.has(key)),
        ),
        width.value,
        height.value,
        props.type === "donut"
          ? Math.min(
              0.85,
              Math.max(
                0.2,
                Number.isFinite(props.innerRadius) ? props.innerRadius : 0.64,
              ),
            )
          : 0,
      )
    : [],
);
const tableEntries = computed(() =>
  radial.value
    ? pie.value.map(({ entry }) => entry)
    : groups.value.flatMap(({ entries }) => entries),
);
const layout = computed(() =>
  cartesianLayout({
    groups: radial.value ? [] : groups.value,
    categories: data.value.categories,
    type: props.type,
    width: width.value,
    height: height.value,
    stacked: props.stacked,
    smooth: props.smooth,
    references: chartReferences(props.reference, props.references),
    showValues: props.showValues,
  }),
);
const labelStride = computed(() =>
  Math.max(
    1,
    Math.ceil(
      tableEntries.value.length / Math.max(1, Math.floor(width.value / 50)),
    ),
  ),
);
const active = shallowRef<{ entry: ChartEntry; element: SVGElement }>();
const tooltipReference = computed(
  () =>
    active.value && {
      getBoundingClientRect: active.value.element.getBoundingClientRect.bind(
        active.value.element,
      ),
      contextElement: plot.value ?? undefined,
    },
);
const tooltipOpen = ref(false);
let observer: ResizeObserver | undefined;

function measure() {
  const measured = plot.value?.clientWidth;
  if (measured) width.value = measured;
}

onMounted(() => {
  measure();
  if (typeof ResizeObserver !== "undefined" && plot.value) {
    observer = new ResizeObserver(measure);
    observer.observe(plot.value);
  } else window.addEventListener("resize", measure);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener("resize", measure);
});
watch([data, hidden, () => props.type, () => props.showTooltip], clearTooltip);
watch([width, height], clearTooltip);
watch(
  () => props.type,
  () => {
    hidden.value = new Set();
  },
);
watch(legends, (next) => {
  const valid = new Set(next.map(({ key }) => key));
  if ([...hidden.value].some((key) => !valid.has(key)))
    hidden.value = new Set([...hidden.value].filter((key) => valid.has(key)));
});

function toggle(key: string) {
  const next = new Set(hidden.value);
  const visible = next.delete(key);
  if (!visible) next.add(key);
  hidden.value = next;
  emit("legend-change", { key, visible });
}

function accessible(entry: ChartEntry) {
  return [
    props.series ? entry.series.name : undefined,
    entry.point.label,
    entry.x !== undefined ? `横坐标 ${entry.x}` : undefined,
    entry.text,
    entry.percentage === undefined
      ? undefined
      : formattedPercent.format(entry.percentage),
  ]
    .filter(Boolean)
    .join("，");
}

function show(entry: ChartEntry, event: Event) {
  if (!props.showTooltip) return;
  active.value = { entry, element: event.currentTarget as SVGElement };
  tooltipOpen.value = true;
}
function clearTooltip() {
  tooltipOpen.value = false;
  active.value = undefined;
}
function leave(event: Event) {
  if (
    event.currentTarget === active.value?.element &&
    document.activeElement !== event.currentTarget
  )
    clearTooltip();
}
function select(entry: ChartEntry, event: Event) {
  if (event instanceof KeyboardEvent) event.preventDefault();
  show(entry, event);
  const { point, series, pointIndex, seriesIndex, percentage, x } = entry;
  emit("point-click", {
    point,
    series,
    pointIndex,
    seriesIndex,
    ...(percentage === undefined ? {} : { percentage }),
    ...(x === undefined ? {} : { x }),
  });
}
function axisLabel(value: number, axis: "x" | "y") {
  return (
    props.axisFormatter?.(value, axis) ??
    (value !== 0 && Math.abs(value) < 0.01
      ? value.toExponential(1)
      : number.format(value))
  );
}
</script>

<template>
  <figure v-bind="attrs" class="hys-ui-ent-panel hys-chart">
    <figcaption v-if="$slots.title" class="hys-chart-title">
      <slot name="title" />
    </figcaption>
    <div
      v-if="showLegend ?? (radial || !!series)"
      v-show="legends.length"
      class="hys-chart-legend"
      role="group"
      aria-label="图例"
    >
      <HysButton
        v-for="item in legends"
        :key="item.key"
        size="sm"
        variant="ghost"
        :pressed="!hidden.has(item.key)"
        @click="toggle(item.key)"
      >
        <span
          class="hys-chart-swatch"
          :style="{ background: item.color }"
          aria-hidden="true"
        />{{ item.label }}
      </HysButton>
    </div>
    <div ref="plot" class="hys-chart-plot" :style="{ height: height + 'px' }">
      <svg
        v-if="tableEntries.length"
        :viewBox="`0 0 ${width} ${height}`"
        role="group"
        :aria-label="ariaLabel || '图表数据'"
        class="hys-chart-svg"
      >
        <defs v-if="!radial && barStyle === 'gradient'">
          <linearGradient
            :id="`${id}-bar`"
            x2="0"
            y2="1"
            v-if="!layout.horizontal"
          >
            <stop offset="0" stop-color="white" stop-opacity=".25" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
          <linearGradient :id="`${id}-bar`" x2="1" y2="0" v-else>
            <stop offset="0" stop-color="white" stop-opacity=".25" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
        </defs>
        <template v-if="radial">
          <g v-for="slice in pie" :key="slice.entry.key">
            <path
              :d="slice.path"
              :fill="slice.entry.color"
              class="hys-chart-hit hys-chart-slice"
              role="button"
              tabindex="0"
              :aria-label="accessible(slice.entry)"
              :data-chart-point="slice.entry.key"
              @pointerenter="show(slice.entry, $event)"
              @pointerleave="leave"
              @focus="show(slice.entry, $event)"
              @blur="clearTooltip"
              @click="select(slice.entry, $event)"
              @keydown.enter="select(slice.entry, $event)"
              @keydown.space="select(slice.entry, $event)"
            />
            <text
              v-if="showValues && slice.entry.percentage >= 0.075"
              :x="slice.x"
              :y="slice.y"
              class="hys-chart-slice-value"
              text-anchor="middle"
              dominant-baseline="central"
              aria-hidden="true"
            >
              {{ formattedPercent.format(slice.entry.percentage) }}
            </text>
          </g>
          <foreignObject
            v-if="type === 'donut' && $slots.center"
            :x="width / 2 - Math.min(width, height) * 0.2"
            :y="height / 2 - 24"
            :width="Math.min(width, height) * 0.4"
            height="48"
            class="hys-chart-center"
          >
            <div><slot name="center" /></div>
          </foreignObject>
        </template>
        <template v-else>
          <g class="hys-chart-axes" aria-hidden="true">
            <g v-for="(tick, index) in layout.valueTicks" :key="index">
              <line
                v-if="showGrid"
                :class="{ 'hys-chart-zero': tick.value === 0 }"
                :x1="layout.horizontal ? tick.position : layout.left"
                :x2="layout.horizontal ? tick.position : layout.right"
                :y1="layout.horizontal ? layout.top : tick.position"
                :y2="layout.horizontal ? layout.bottom : tick.position"
              />
              <text
                :x="layout.horizontal ? tick.position : layout.left - 8"
                :y="layout.horizontal ? layout.bottom + 15 : tick.position"
                :text-anchor="layout.horizontal ? 'middle' : 'end'"
                dominant-baseline="central"
              >
                {{ axisLabel(tick.value, layout.horizontal ? "x" : "y") }}
              </text>
            </g>
            <template v-if="layout.scatter">
              <g v-for="(tick, index) in layout.xTicks" :key="index">
                <line
                  v-if="showGrid"
                  :x1="tick.position"
                  :x2="tick.position"
                  :y1="layout.top"
                  :y2="layout.bottom"
                />
                <text
                  :x="tick.position"
                  :y="layout.bottom + 15"
                  text-anchor="middle"
                  dominant-baseline="central"
                >
                  {{ axisLabel(tick.value, "x") }}
                </text>
              </g>
            </template>
            <template v-else>
              <text
                v-for="category in layout.categories"
                :key="category.index"
                :x="layout.horizontal ? layout.left - 8 : category.position"
                :y="layout.horizontal ? category.position : layout.bottom + 16"
                :text-anchor="layout.horizontal ? 'end' : 'middle'"
                dominant-baseline="central"
              >
                {{
                  category.label.length > (layout.horizontal ? 9 : 7)
                    ? category.label.slice(0, layout.horizontal ? 8 : 6) + "…"
                    : category.label
                }}
              </text>
            </template>
            <line
              v-if="!layout.scatter"
              class="hys-chart-zero"
              :x1="layout.horizontal ? layout.zero : layout.left"
              :x2="layout.horizontal ? layout.zero : layout.right"
              :y1="layout.horizontal ? layout.top : layout.zero"
              :y2="layout.horizontal ? layout.bottom : layout.zero"
            />
          </g>
          <g
            v-for="layer in layout.layers"
            :key="layer.group.key"
            :style="{ color: layer.group.color }"
          >
            <template v-for="(path, index) in layer.paths" :key="index">
              <path
                v-if="path.area"
                :d="path.area"
                fill="currentColor"
                opacity=".17"
                aria-hidden="true"
              />
              <path
                :d="path.line"
                class="hys-chart-line"
                :stroke-dasharray="
                  layer.group.series.dashed ? '5 4' : undefined
                "
                aria-hidden="true"
              />
            </template>
            <g
              v-for="(mark, index) in layer.marks"
              :key="mark.entry.key"
              class="hys-chart-hit"
              :style="{ color: mark.entry.color }"
              role="button"
              tabindex="0"
              :aria-label="accessible(mark.entry)"
              :data-chart-point="mark.entry.key"
              @pointerenter="show(mark.entry, $event)"
              @pointerleave="leave"
              @focus="show(mark.entry, $event)"
              @blur="clearTooltip"
              @click="select(mark.entry, $event)"
              @keydown.enter="select(mark.entry, $event)"
              @keydown.space="select(mark.entry, $event)"
            >
              <template v-if="mark.rect">
                <rect
                  v-bind="mark.rect"
                  rx="2"
                  :fill="barStyle === 'outline' ? 'none' : 'currentColor'"
                  :stroke="barStyle === 'outline' ? 'currentColor' : undefined"
                  stroke-width="1.5"
                  :class="{ 'hys-chart-outline': barStyle === 'outline' }"
                />
                <rect
                  v-if="barStyle === 'gradient'"
                  v-bind="mark.rect"
                  rx="2"
                  :fill="`url(#${id}-bar)`"
                  pointer-events="none"
                />
              </template>
              <template v-else>
                <circle :cx="mark.x" :cy="mark.y" r="11" fill="transparent" />
                <circle
                  :cx="mark.x"
                  :cy="mark.y"
                  :r="layout.scatter ? 5 : 3.5"
                  fill="currentColor"
                  class="hys-chart-dot"
                />
              </template>
              <text
                v-if="showValues && index % labelStride === 0"
                :x="
                  mark.x +
                  (layout.horizontal
                    ? mark.entry.point.value < 0
                      ? -5
                      : 5
                    : 0)
                "
                :y="
                  mark.y +
                  (layout.horizontal ? 0 : mark.entry.point.value < 0 ? 12 : -9)
                "
                :text-anchor="
                  layout.horizontal
                    ? mark.entry.point.value < 0
                      ? 'end'
                      : 'start'
                    : 'middle'
                "
                dominant-baseline="central"
                class="hys-chart-value"
                aria-hidden="true"
              >
                {{ mark.entry.text }}
              </text>
            </g>
          </g>
          <g
            v-for="(line, index) in layout.references"
            :key="index"
            class="hys-chart-reference"
            :style="{ color: line.color }"
            :aria-label="line.label"
            role="img"
          >
            <line
              :x1="layout.horizontal ? line.position : layout.left"
              :x2="layout.horizontal ? line.position : layout.right"
              :y1="layout.horizontal ? layout.top : line.position"
              :y2="layout.horizontal ? layout.bottom : line.position"
            />
            <text
              :x="layout.horizontal ? line.position : layout.right - 3"
              :y="layout.horizontal ? layout.top - 7 : line.position - 6"
              :text-anchor="layout.horizontal ? 'middle' : 'end'"
            >
              {{ line.label }}
            </text>
          </g>
        </template>
      </svg>
      <div v-else class="hys-chart-empty">
        <slot name="empty">{{
          legends.length ? "请选择要显示的数据" : emptyText
        }}</slot>
      </div>
    </div>
    <HysTooltip
      v-if="showTooltip"
      v-model:open="tooltipOpen"
      trigger="manual"
      :reference="tooltipReference"
      :text="active ? accessible(active.entry) : ''"
      placement="top"
      class="hys-chart-tooltip"
    />
    <HysScrollbar v-if="showTable && tableEntries.length" aria-label="图表数据明细" class="hys-chart-table">
      <table>
        <thead>
          <tr>
            <th scope="col">项目</th>
            <th v-if="series && !radial" scope="col">系列</th>
            <th v-if="type === 'scatter'" scope="col">横坐标</th>
            <th scope="col">数值</th>
            <th v-if="radial" scope="col">占比</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in tableEntries" :key="entry.key">
            <th scope="row">{{ entry.point.label }}</th>
            <td v-if="series && !radial">{{ entry.series.name }}</td>
            <td v-if="type === 'scatter'">{{ entry.x }}</td>
            <td>{{ entry.text }}</td>
            <td v-if="entry.percentage !== undefined">
              {{ formattedPercent.format(entry.percentage) }}
            </td>
          </tr>
        </tbody>
      </table>
    </HysScrollbar>
  </figure>
</template>

<style scoped src="./chart.css"></style>
