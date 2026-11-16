<script setup lang="ts">
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
  type VNodeChild,
} from "vue";
import { useHysRootAttrs } from "../../config";
import HysButton from "../HysButton/HysButton.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysAlert from "../HysAlert/HysAlert.vue";
import {
  chartData,
  chartLegendEntries,
  chartReferences,
  axisType,
  isCartesian,
  isRadial,
  type ChartEntry,
} from "./chartModel";
import { cartesianLayout } from "./cartesianLayout";
import { radialLayout } from "./radialLayout";
import { fitRange, xDomain } from "./chartScale";
import { chartCSV, chartPNG, chartSVG, downloadChart } from "./chartExport";
import { useChartRange } from "./useChartRange";
import { useChartCursor } from "./useChartCursor";
import ChartComparison from "./ChartComparison.vue";
import ChartLegendActions from "./ChartLegendActions.vue";
import ChartTimeRange from "./ChartTimeRange.vue";
import ChartSpecialPlot from "./ChartSpecialPlot.vue";
import ChartAnnotations from "./ChartAnnotations.vue";
import ChartRangeNavigator from "./ChartRangeNavigator.vue";
import ChartLegend from "./ChartLegend.vue";
import type {
  HysChartAxis,
  HysChartCursor,
  HysChartExportFormat,
  HysChartExportOptions,
  HysChartProps,
  HysChartRange,
  HysChartSelection,
  HysChartTooltipContext,
  HysChartTooltipItem,
} from "./chartTypes";
export type { HysChartPoint, HysChartReference } from "./chartTypes";

const props = withDefaults(defineProps<HysChartProps>(), {
  type: "bar",
  height: 220,
  barStyle: "solid",
  innerRadius: 0.64,
  showLegend: undefined,
  legendLayout: "compact",
  showGrid: true,
  showTooltip: true,
  emptyText: "暂无图表数据",
  loadingText: "正在加载图表",
  missing: "gap",
  tooltipMode: "point",
});
const emit = defineEmits<{
  "point-click": [selection: HysChartSelection];
  "point-hover": [item: HysChartTooltipItem | null];
  "legend-change": [change: { key: string; visible: boolean }];
  "update:selectedKey": [key: string | null];
  "update:hiddenKeys": [keys: readonly string[]];
  "update:range": [range: HysChartRange | null];
  "update:cursor": [cursor: HysChartCursor | null];
  "range-change": [range: HysChartRange | null];
  retry: [];
}>();
defineSlots<{
  title?: () => VNodeChild;
  empty?: () => VNodeChild;
  center?: () => VNodeChild;
  loading?: () => VNodeChild;
  error?: (scope: { message: string; retry: () => void }) => VNodeChild;
  tooltip?: (scope: HysChartTooltipContext) => VNodeChild;
}>();
const attrs = useHysRootAttrs();
const id = useId();
const figure = useTemplateRef<HTMLElement>("figure");
const body = useTemplateRef<HTMLElement>("body");
const plot = useTemplateRef<HTMLElement>("plot");
const svg = useTemplateRef<SVGSVGElement>("svg");
const bodyWidth = ref(620);
const width = ref(620);
const height = computed(() =>
  Math.max(
    48,
    Number.isFinite(props.aspectRatio) && props.aspectRatio! > 0
      ? width.value / Math.max(0.05, props.aspectRatio!)
      : Number.isFinite(props.height)
        ? props.height
        : 220,
  ),
);
const radial = computed(() => isRadial(props.type));
const cartesian = computed(() => isCartesian(props.type));
const xType = computed(() => axisType(props.type, props.xAxis));
const category = computed(() => xType.value === "category");
const yAxes = computed<readonly [HysChartAxis, HysChartAxis?]>(() =>
  Array.isArray(props.yAxis)
    ? [props.yAxis[0] ?? {}, props.yAxis[1]]
    : [(props.yAxis ?? {}) as HysChartAxis],
);
const data = computed(() =>
  chartData({
    data: props.data ?? [],
    series: props.series,
    type: props.type,
    colors: props.colors,
    axis: xType.value,
    missing: props.missing,
    format: (value, point) =>
      props.valueFormatter?.(value, point) ?? String(value),
  }),
);
const localHidden = shallowRef<readonly string[]>([]);
const hidden = computed(() => new Set(props.hiddenKeys ?? localHidden.value));
const localSelected = ref<string | null>(null);
const selected = computed(() =>
  props.selectedKey === undefined ? localSelected.value : props.selectedKey,
);
const localRange = shallowRef<HysChartRange | null>(null);
const requestedRange = computed(() =>
  props.range === undefined ? localRange.value : props.range,
);
const domain = computed(() =>
  xDomain(
    data.value.coordinates,
    data.value.categories.length,
    xType.value,
    props.xAxis,
  ),
);
const visibleRange = computed(() =>
  fitRange(requestedRange.value, domain.value, category.value),
);
const timeControls = computed(
  () =>
    cartesian.value &&
    xType.value === "time" &&
    data.value.coordinates.length > 0 &&
    (props.rangePresets?.length || props.showDateRange) &&
    domain.value.start >= -8.64e15 &&
    domain.value.end <= 8.64e15,
);
const filtered = computed(() => {
  const { start, end } = visibleRange.value;
  return start !== domain.value.start || end !== domain.value.end;
});
const legends = computed(() =>
  chartLegendEntries(data.value.groups, radial.value),
);
const legendVisible = computed(
  () =>
    (props.showLegend ?? (radial.value || !!props.series)) &&
    legends.value.length > 0,
);
const sidebar = computed(
  () => legendVisible.value && props.legendLayout === "sidebar",
);
const sideBySide = computed(() => sidebar.value && bodyWidth.value >= 560);
const groups = computed(() =>
  data.value.groups.filter(
    ({ key, entries }) => entries.length && !hidden.value.has(key),
  ),
);
const errorMessage = computed(() =>
  props.error instanceof Error
    ? props.error.message || "图表加载失败"
    : props.error,
);
const formattedPercent = new Intl.NumberFormat("zh-CN", {
  style: "percent",
  maximumFractionDigits: 1,
});
const number = new Intl.NumberFormat("zh-CN", {
  notation: "compact",
  maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "UTC",
  month: "numeric",
  day: "numeric",
});
const yearMonth = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "UTC",
  year: "numeric",
  month: "numeric",
});
const clock = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const milliseconds = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
  hourCycle: "h23",
});
const seconds = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const pie = computed(() =>
  !radial.value
    ? []
    : radialLayout(
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
      ),
);
const layout = computed(() =>
  cartesianLayout({
    groups: cartesian.value ? groups.value : [],
    categories: data.value.categories,
    coordinates: data.value.coordinates,
    type: props.type,
    width: width.value,
    height: height.value,
    stacked: props.stacked,
    smooth: props.smooth,
    references: chartReferences(props.reference, props.references),
    annotations: props.annotations ?? [],
    showValues: props.showValues,
    xType: xType.value,
    xAxis: props.xAxis,
    yAxes: yAxes.value,
    range: visibleRange.value,
    exactX: filtered.value,
    missing: props.missing,
    sampling: props.sampling,
    selectedKey: selected.value,
  }),
);
const hasData = computed(() =>
  radial.value ? !!pie.value.length : groups.value.length > 0,
);
const plotReady = computed(
  () => hasData.value && !props.loading && !errorMessage.value,
);
const canZoom = computed(
  () =>
    plotReady.value &&
    cartesian.value &&
    props.zoomable &&
    domain.value.end > domain.value.start,
);
const tableEntries = computed(() =>
  radial.value
    ? pie.value.map(({ entry }) => entry)
    : (cartesian.value ? layout.value.visibleGroups : groups.value).flatMap(
        ({ entries }) => entries,
      ),
);
const entriesByKey = computed(
  () => new Map(tableEntries.value.map((entry) => [entry.key, entry])),
);
const entriesByCategory = computed(() => {
  const map = new Map<number, ChartEntry[]>();
  for (const entry of tableEntries.value) {
    const entries = map.get(entry.category);
    if (entries) entries.push(entry);
    else map.set(entry.category, [entry]);
  }
  return map;
});

const crosshairEnabled = computed(() => !!props.crosshair && cartesian.value);
const cursor = useChartCursor({
  svg,
  enabled: crosshairEnabled,
  frame: layout,
  entries: tableEntries,
  model: () => props.cursor,
  update: (value) => emit("update:cursor", value),
});
const comparison = cursor.comparison;
const lockedCursor = computed(() =>
  crosshairEnabled.value && cursor.current.value?.locked
    ? cursor.current.value
    : undefined,
);
const active = shallowRef<{ entry: ChartEntry; element: SVGElement }>();
const tooltipContent = shallowRef<{
  entry: ChartEntry;
  bounds: () => DOMRect;
  items: ChartEntry[];
  comparisonTitle?: string;
}>();
const tooltipReference = computed(
  () =>
    tooltipContent.value && {
      getBoundingClientRect: tooltipContent.value.bounds,
      contextElement: plot.value ?? undefined,
    },
);
const tooltipOpen = ref(false);
watch(
  [comparison, crosshairEnabled, () => props.showTooltip, plotReady, svg],
  ([value, enabled, show, ready]) => {
    if (!enabled && tooltipContent.value?.comparisonTitle === undefined) return;
    if (!show || !ready || !value || value.locked || !svg.value) {
      clearTooltip();
      return;
    }
    const target = svg.value;
    const frame = layout.value;
    const x = frame.horizontal ? frame.left : value.position;
    const y = frame.horizontal ? value.position : frame.top;
    tooltipContent.value = {
      entry: value.items[0],
      items: value.items,
      comparisonTitle: rangeLabel(value.value),
      bounds: () => {
        const rect = target.getBoundingClientRect();
        const Rect = target.ownerDocument.defaultView!.DOMRect;
        return new Rect(
          rect.left + (x * rect.width) / width.value - 1,
          rect.top + (y * rect.height) / height.value - 1,
          2,
          2,
        );
      },
    };
    tooltipOpen.value = true;
  },
  { flush: "post" },
);
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let observer: ResizeObserver | undefined;

function measure() {
  const contentWidth = body.value?.clientWidth;
  if (contentWidth) bodyWidth.value = contentWidth;
  const measured = plot.value?.clientWidth;
  if (measured) width.value = measured;
}
onMounted(() => {
  measure();
  if (typeof ResizeObserver !== "undefined" && plot.value) {
    observer = new ResizeObserver(measure);
    observer.observe(plot.value);
    if (body.value) observer.observe(body.value);
  } else window.addEventListener("resize", measure);
});
onActivated(measure);
watch(sideBySide, measure, { flush: "post" });
onDeactivated(() => {
  rangeGesture.release();
  cursor.leave();
  clearTooltip();
});
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener("resize", measure);
  clearTimeout(closeTimer);
});
watch([data, hidden, visibleRange, plotReady, width, height], () => {
  if (!crosshairEnabled.value) clearTooltip();
  if (
    localSelected.value &&
    !data.value.groups.some((group) =>
      group.entries.some((entry) => entry.key === localSelected.value),
    )
  )
    localSelected.value = null;
});
watch(
  () => props.showTooltip,
  (enabled) => {
    if (!enabled) {
      tooltipOpen.value = false;
      tooltipContent.value = undefined;
    }
  },
);
watch([() => props.type, xType], () => {
  localHidden.value = [];
  localRange.value = null;
  cursor.clear();
});
watch(legends, (next) => {
  const valid = new Set(next.map(({ key }) => key));
  if (localHidden.value.some((key) => !valid.has(key)))
    localHidden.value = localHidden.value.filter((key) => valid.has(key));
});

function toggle(key: string) {
  const next = new Set(hidden.value);
  if (!next.delete(key)) next.add(key);
  commitHidden(next);
}
function commitHidden(next: ReadonlySet<string>) {
  const previous = hidden.value;
  const changed = legends.value.filter(
    ({ key }) => previous.has(key) !== next.has(key),
  );
  if (!changed.length) return;
  const keys = [...next];
  if (props.hiddenKeys === undefined) localHidden.value = keys;
  emit("update:hiddenKeys", keys);
  for (const { key } of changed)
    emit("legend-change", { key, visible: !next.has(key) });
}
function accessible(entry: ChartEntry) {
  return [
    props.series ? entry.series.name : undefined,
    entry.point.label,
    entry.x !== undefined && (xType.value !== "time" || !entry.point.label)
      ? "横坐标 " + axisLabel(entry.x, "x")
      : undefined,
    entry.text,
    entry.percentage === undefined
      ? undefined
      : formattedPercent.format(entry.percentage),
  ]
    .filter(Boolean)
    .join("，");
}

function hit(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<SVGElement>("[data-chart-point]")
    : null;
}
function clearTooltip() {
  clearTimeout(closeTimer);
  tooltipOpen.value = false;
  if (active.value) {
    active.value = undefined;
    emit("point-hover", null);
  }
}
function show(event: Event) {
  if (rangeGesture.panning.value || rangeGesture.preview.value) return;
  const element = hit(event.target);
  const key = element?.getAttribute("data-chart-point");
  const entry = key ? entriesByKey.value.get(key) : undefined;
  if (!element || !entry) return;
  if (crosshairEnabled.value) {
    if (event.type === "focusin") cursor.focus(entry);
    return;
  }
  clearTimeout(closeTimer);
  if (active.value?.element !== element) {
    active.value = { entry, element };
    emit("point-hover", entry);
  }
  if (props.showTooltip) {
    const items =
      props.tooltipMode === "axis" && !radial.value
        ? (entriesByCategory.value.get(entry.category) ?? [entry])
        : [entry];
    tooltipContent.value = {
      entry,
      bounds: () => element.getBoundingClientRect(),
      items,
    };
    tooltipOpen.value = true;
  }
}
function leave(event: MouseEvent | FocusEvent) {
  if (crosshairEnabled.value) {
    if (
      event.type === "focusout" &&
      !svg.value?.contains(event.relatedTarget as Node | null)
    )
      deferClose();
    return;
  }
  const element = hit(event.target);
  if (
    !element ||
    element !== active.value?.element ||
    hit(event.relatedTarget) === element
  )
    return;
  if (event.type === "pointerout" && document.activeElement === element) return;
  deferClose();
}
function holdTooltip() {
  clearTimeout(closeTimer);
}
function deferClose() {
  clearTimeout(closeTimer);
  const close = crosshairEnabled.value ? cursor.leave : clearTooltip;
  if (props.tooltipInteractive) closeTimer = setTimeout(close, 220);
  else close();
}
function releaseTooltipContent() {
  if (!tooltipOpen.value) tooltipContent.value = undefined;
}
function changedTooltip(open: boolean) {
  tooltipOpen.value = open;
  if (!open) {
    cursor.leave();
    clearTooltip();
  }
}
function select(event: MouseEvent | KeyboardEvent) {
  if (event.type === "click" && rangeGesture.consumeClick()) return;
  const key = hit(event.target)?.getAttribute("data-chart-point");
  const entry = key ? entriesByKey.value.get(key) : undefined;
  cursor.toggleLock(event, entry);
  if (!entry) return;
  if (event.type === "keydown") event.preventDefault();
  show(event);
  if (entry.key !== selected.value) {
    if (props.selectedKey === undefined) localSelected.value = entry.key;
    emit("update:selectedKey", entry.key);
  }
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

function axisLabel(value: number, axis: "x" | "y", secondary = false) {
  const config =
    axis === "x"
      ? (props.xAxis ?? (layout.value.horizontal ? yAxes.value[0] : undefined))
      : yAxes.value[secondary ? 1 : 0];
  const time =
    axis === "x" && xType.value === "time" && Math.abs(value) <= 8.64e15;
  const span = visibleRange.value.end - visibleRange.value.start;
  const label =
    config?.formatter?.(value) ??
    props.axisFormatter?.(value, axis) ??
    (time
      ? (span >= 31536000000
          ? yearMonth
          : span >= 86400000
            ? date
            : span >= 120000
              ? clock
              : span >= 1000
                ? seconds
                : milliseconds
        ).format(value)
      : value !== 0 && Math.abs(value) < 0.01
        ? value.toExponential(1)
        : number.format(value));
  return label + (config?.unit ? " " + config.unit : "");
}
function trimLabel(label: string, count: number) {
  return label.length > count
    ? label.slice(0, Math.max(0, count - 1)) + "…"
    : label;
}
const tickLabels = computed(() => {
  const filter = (
    ticks: typeof layout.value.xTicks,
    axis: "x" | "y",
    horizontal: boolean,
    secondary = false,
  ) => {
    const result = [];
    let last = -Infinity;
    let previousLabel = "";
    for (const tick of ticks.slice().sort((a, b) => a.position - b.position)) {
      const label = axisLabel(tick.value, axis, secondary);
      const half = horizontal
        ? Math.min(width.value / 3, label.length * 3.6 + 4)
        : 8;
      if (tick.position - half < last || previousLabel === label) continue;
      previousLabel = label;
      last = tick.position + half;
      result.push({
        ...tick,
        label: trimLabel(
          label,
          horizontal ? Math.max(5, Math.floor(width.value / 15)) : 8,
        ),
      });
    }
    return result;
  };
  return {
    x: filter(layout.value.xTicks, "x", true),
    primary: filter(
      layout.value.valueTicks,
      layout.value.horizontal ? "x" : "y",
      layout.value.horizontal,
    ),
    secondary: filter(layout.value.secondaryTicks, "y", false, true),
  };
});
const dotHitRadius = computed(() => {
  const largest = Math.max(
    1,
    ...layout.value.layers.map((layer) => layer.marks.length),
  );
  return Math.max(
    layout.value.scatter ? 5 : 3.5,
    Math.min(11, ((layout.value.right - layout.value.left) / largest) * 0.8),
  );
});
const labeledPoints = computed(() => {
  const result = new Set<string>();
  if (!props.showValues) return result;
  const cells = new Set<string>();
  for (const layer of layout.value.layers) {
    for (const mark of layer.marks) {
      const horizontal = layout.value.horizontal;
      const x = mark.x + (horizontal ? (mark.entry.value < 0 ? -5 : 5) : 0);
      const y = mark.y + (horizontal ? 0 : mark.entry.value < 0 ? 12 : -9);
      const span = Math.min(width.value, mark.entry.text.length * 7 + 8);
      const min = horizontal
        ? x - (mark.entry.value < 0 ? span : 0)
        : x - span / 2;
      const max = min + span;
      if (min < 0 || max > width.value || y < 7 || y > height.value - 16)
        continue;
      const keys = [];
      for (
        let row = Math.floor((y - 8) / 12);
        row <= Math.floor((y + 8) / 12);
        row++
      )
        for (let col = Math.floor(min / 12); col <= Math.floor(max / 12); col++)
          keys.push(row + ":" + col);
      if (keys.some((key) => cells.has(key))) continue;
      keys.forEach((key) => cells.add(key));
      result.add(mark.entry.key);
    }
  }
  return result;
});
function updateRange(range: HysChartRange | null) {
  const next = range && fitRange(range, domain.value, category.value);
  const value =
    next && (next.start !== domain.value.start || next.end !== domain.value.end)
      ? next
      : null;
  if (
    value?.start === requestedRange.value?.start &&
    value?.end === requestedRange.value?.end
  )
    return;
  if (props.range === undefined) localRange.value = value;
  emit("update:range", value);
  emit("range-change", value);
}
const rangeGesture = useChartRange({
  enabled: canZoom,
  svg,
  domain,
  visible: visibleRange,
  frame: layout,
  category,
  update: updateRange,
  dismiss: dismissInteraction,
});
function rangeLabel(value: number) {
  return category.value
    ? (data.value.categories[Math.round(value)] ?? String(value + 1))
    : axisLabel(value, "x");
}
function dismissInteraction() {
  if (crosshairEnabled.value) cursor.leave();
  else clearTooltip();
}
function movePlot(event: PointerEvent) {
  rangeGesture.move(event);
  if (
    crosshairEnabled.value &&
    !rangeGesture.panning.value &&
    !rangeGesture.preview.value
  ) {
    holdTooltip();
    cursor.hover(event);
  }
}
function leavePlot(event: PointerEvent) {
  rangeGesture.release(event);
  if (crosshairEnabled.value) deferClose();
}
function escapePlot() {
  rangeGesture.cancelSelection();
  cursor.clear();
  clearTooltip();
}
const region = computed(() => {
  const { left, right, top, bottom, horizontal } = layout.value;
  const preview = rangeGesture.preview.value;
  if (!preview) return undefined;
  return horizontal
    ? {
        x: left,
        y: top + preview.start * (bottom - top),
        width: right - left,
        height: (preview.end - preview.start) * (bottom - top),
      }
    : {
        x: left + preview.start * (right - left),
        y: top,
        width: (preview.end - preview.start) * (right - left),
        height: bottom - top,
      };
});
function mustHavePlot() {
  if (!svg.value) throw new Error("当前没有可导出的图形");
  return svg.value;
}
function exportContext(options: HysChartExportOptions) {
  if (!options.includeContext) return undefined;
  const root = figure.value;
  const { start, end } = visibleRange.value;
  const format = (value: number) =>
    xType.value === "time" && Math.abs(value) <= 8.64e15
      ? new Date(value)
          .toISOString()
          .replace("T", " ")
          .replace(/:00\.000Z$/u, " UTC")
      : rangeLabel(value);
  return {
    figure: root,
    title:
      options.title ??
      (root?.querySelector("figcaption")?.textContent?.trim() ||
        props.ariaLabel),
    range: cartesian.value
      ? ([format(start), format(end)] as const)
      : undefined,
    legends: legends.value.filter((item) => !hidden.value.has(item.key)),
  };
}
function exportOptions(value?: number | HysChartExportOptions) {
  return typeof value === "number" ? { pixelRatio: value } : (value ?? {});
}
async function exportChart(
  format: HysChartExportFormat,
  value?: number | HysChartExportOptions,
): Promise<Blob> {
  const options = exportOptions(value);
  if (format === "csv") {
    const view =
      options.scope === "visible"
        ? {
            range: visibleRange.value,
            hidden: hidden.value,
            entries: tableEntries.value,
          }
        : undefined;
    return new Blob(["\ufeff", chartCSV(props, view)], {
      type: "text/csv;charset=utf-8",
    });
  }
  const element = mustHavePlot();
  const context = exportContext(options);
  if (format === "png") return chartPNG(element, options.pixelRatio, context);
  return new Blob([chartSVG(element, context)], {
    type: "image/svg+xml;charset=utf-8",
  });
}
async function download(
  format: HysChartExportFormat,
  filename = "chart." + format,
  options?: number | HysChartExportOptions,
) {
  downloadChart(await exportChart(format, options), filename);
}
async function copyImage(value?: number | HysChartExportOptions) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined")
    throw new Error("当前浏览器无法复制图表图片");
  const options = exportOptions(value);
  const element = mustHavePlot();
  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": chartPNG(
        element,
        options.pixelRatio,
        exportContext(options),
      ),
    }),
  ]);
}
defineExpose({
  exportChart,
  download,
  copyImage,
  resetRange: () => updateRange(null),
});
</script>

<template>
  <figure
    ref="figure"
    v-bind="attrs"
    class="hys-ui-ent-panel hys-chart"
    @keydown.esc="escapePlot"
  >
    <figcaption v-if="$slots.title" class="hys-chart-title">
      <slot name="title" />
    </figcaption>
    <div
      v-if="timeControls || (legendVisible && legendActions)"
      class="hys-chart-tools"
    >
      <ChartTimeRange
        v-if="timeControls"
        :domain="domain"
        :visible="visibleRange"
        :presets="rangePresets"
        @range="updateRange"
      />
      <div
        v-if="legendVisible && legendActions"
        class="hys-chart-tools-actions"
      >
        <ChartLegendActions
          :items="legends"
          :hidden="hidden"
          @apply="commitHidden"
        />
      </div>
    </div>
    <ChartLegend
      v-if="legendVisible && !sidebar"
      :items="legends"
      :layout="legendLayout"
      :width="bodyWidth"
      :hidden="hidden"
      @toggle="toggle"
    />
    <div
      ref="body"
      class="hys-chart-body"
      :class="{ 'hys-chart-body-sidebar': sideBySide }"
    >
      <div class="hys-chart-main">
        <div
          ref="plot"
          class="hys-chart-plot"
          :style="{ height: height + 'px' }"
          :aria-busy="loading || undefined"
        >
          <div v-if="loading" class="hys-chart-empty" role="status">
            <slot name="loading">{{ loadingText }}</slot>
          </div>
          <div v-else-if="errorMessage" class="hys-chart-empty">
            <slot
              name="error"
              :message="errorMessage"
              :retry="() => emit('retry')"
            >
              <HysAlert tone="danger" :title="errorMessage" />
              <HysButton size="sm" variant="ghost" @click="emit('retry')"
                >重试</HysButton
              >
            </slot>
          </div>
          <svg
            v-else-if="hasData"
            ref="svg"
            :viewBox="`0 0 ${width} ${height}`"
            role="group"
            :aria-label="ariaLabel || '图表数据'"
            class="hys-chart-svg"
            :class="{
              'hys-chart-zoomable': canZoom,
              'hys-chart-panning': rangeGesture.panning.value,
              'hys-chart-selecting': !!region,
            }"
            @pointerover="show"
            @pointerout="leave"
            @focusin="show"
            @focusout="leave"
            @click="select"
            @keydown.enter="select"
            @keydown.space="select"
            :tabindex="crosshairEnabled ? 0 : canZoom ? -1 : undefined"
            :aria-description="
              crosshairEnabled
                ? '方向键浏览数据，回车锁定或解锁对比，Escape 清除'
                : undefined
            "
            @keydown="cursor.key"
            @pointerdown="rangeGesture.down"
            @pointermove="movePlot"
            @pointerup="rangeGesture.release"
            @pointercancel="rangeGesture.release"
            @pointerleave="leavePlot"
            @lostpointercapture="rangeGesture.release"
            @wheel="rangeGesture.wheel"
          >
            <defs v-if="cartesian">
              <clipPath :id="id + '-plot'">
                <rect
                  :x="layout.left"
                  :y="layout.top"
                  :width="layout.right - layout.left"
                  :height="layout.bottom - layout.top"
                />
              </clipPath>
              <template v-if="barStyle === 'gradient'">
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
              </template>
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
                  :aria-pressed="selected === slice.entry.key"
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
            <ChartSpecialPlot
              v-else-if="!cartesian"
              :type="type"
              :groups="groups"
              :categories="data.categories"
              :width="width"
              :height="height"
              :axis="yAxes[0]"
              :selected="selected"
              :show-values="showValues"
              :accessible="accessible"
              :axis-label="(value) => axisLabel(value, 'y')"
            />
            <template v-else>
              <ChartAnnotations :bands="layout.bands" />
              <g class="hys-chart-axes" aria-hidden="true">
                <g v-for="(tick, index) in tickLabels.primary" :key="index">
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
                    {{ tick.label }}
                  </text>
                </g>
                <template v-if="layout.continuous">
                  <g v-for="(tick, index) in tickLabels.x" :key="index">
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
                      {{ tick.label }}
                    </text>
                  </g>
                </template>
                <template v-else>
                  <text
                    v-for="category in layout.categories"
                    :key="category.index"
                    :x="layout.horizontal ? layout.left - 8 : category.position"
                    :y="
                      layout.horizontal ? category.position : layout.bottom + 16
                    "
                    :text-anchor="layout.horizontal ? 'end' : 'middle'"
                    dominant-baseline="central"
                  >
                    {{
                      category.label.length > (layout.horizontal ? 9 : 7)
                        ? category.label.slice(0, layout.horizontal ? 8 : 6) +
                          "…"
                        : category.label
                    }}
                  </text>
                </template>
                <text
                  v-for="tick in tickLabels.secondary"
                  :key="tick.value"
                  class="hys-chart-secondary-axis"
                  :x="layout.right + 8"
                  :y="tick.position"
                  dominant-baseline="central"
                >
                  {{ tick.label }}
                </text>
                <line
                  v-if="layout.zero !== undefined"
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
                <g :clip-path="'url(#' + id + '-plot)'">
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
                </g>
                <g
                  v-for="mark in layer.marks"
                  :key="mark.entry.key"
                  class="hys-chart-hit"
                  :style="{ color: mark.entry.color }"
                  role="button"
                  :tabindex="crosshairEnabled ? -1 : 0"
                  :aria-label="accessible(mark.entry)"
                  :data-chart-point="mark.entry.key"
                  :aria-pressed="selected === mark.entry.key"
                >
                  <template v-if="mark.rect">
                    <rect
                      v-bind="mark.rect"
                      rx="2"
                      :fill="barStyle === 'outline' ? 'none' : 'currentColor'"
                      :stroke="
                        barStyle === 'outline' ? 'currentColor' : undefined
                      "
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
                    <circle
                      :cx="mark.x"
                      :cy="mark.y"
                      :r="dotHitRadius"
                      fill="transparent"
                    />
                    <circle
                      :cx="mark.x"
                      :cy="mark.y"
                      :r="layout.scatter ? 5 : 3.5"
                      fill="currentColor"
                      class="hys-chart-dot"
                    />
                  </template>
                  <text
                    v-if="labeledPoints.has(mark.entry.key)"
                    :x="
                      mark.x +
                      (layout.horizontal ? (mark.entry.value < 0 ? -5 : 5) : 0)
                    "
                    :y="
                      mark.y +
                      (layout.horizontal ? 0 : mark.entry.value < 0 ? 12 : -9)
                    "
                    :text-anchor="
                      layout.horizontal
                        ? mark.entry.value < 0
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
              <ChartAnnotations
                :analysis="layout.analysis"
                :clip-id="id + '-plot'"
                :width="width"
                :height="height"
              />
              <rect
                v-if="region"
                v-bind="region"
                class="hys-chart-region"
                data-chart-export-ignore=""
              />
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
            <g
              v-if="comparison"
              class="hys-chart-crosshair"
              :class="{ 'hys-chart-crosshair-locked': comparison.locked }"
              data-chart-export-ignore=""
              aria-hidden="true"
            >
              <line
                :x1="layout.horizontal ? layout.left : comparison.position"
                :x2="layout.horizontal ? layout.right : comparison.position"
                :y1="layout.horizontal ? comparison.position : layout.top"
                :y2="layout.horizontal ? comparison.position : layout.bottom"
              />
              <line
                v-if="cursor.otherPosition.value !== undefined"
                :x1="
                  layout.horizontal ? cursor.otherPosition.value : layout.left
                "
                :x2="
                  layout.horizontal ? cursor.otherPosition.value : layout.right
                "
                :y1="
                  layout.horizontal ? layout.top : cursor.otherPosition.value
                "
                :y2="
                  layout.horizontal ? layout.bottom : cursor.otherPosition.value
                "
              />
            </g>
          </svg>
          <div v-else class="hys-chart-empty" role="status">
            <slot name="empty">{{
              legends.length ? "请选择要显示的数据" : emptyText
            }}</slot>
          </div>
          <div
            v-if="plotReady && !tableEntries.length"
            class="hys-chart-window-empty"
            role="status"
          >
            当前区间没有数据点
          </div>
        </div>
        <ChartRangeNavigator
          v-if="canZoom"
          :domain="domain"
          :visible="visibleRange"
          :category="category"
          :groups="groups"
          :width="width"
          :left="layout.left"
          :right="layout.right"
          :filtered="filtered"
          :format-value="rangeLabel"
          @range="updateRange"
          @zoom="rangeGesture.zoom"
          @reset="updateRange(null)"
          @interact="dismissInteraction"
        />
        <section
          v-if="lockedCursor && !loading && !errorMessage"
          class="hys-chart-locked-comparison"
          aria-label="已锁定对比"
        >
          <div class="hys-chart-locked-heading">
            <strong aria-live="polite"
              >已锁定 · {{ rangeLabel(lockedCursor.value) }}</strong
            >
            <HysButton size="sm" variant="ghost" @click="cursor.clear"
              >解除锁定</HysButton
            >
          </div>
          <template v-if="comparison">
            <slot
              name="tooltip"
              :item="comparison.items[0]"
              :items="comparison.items"
              :close="cursor.clear"
            >
              <ChartComparison :items="comparison.items" scrollable />
            </slot>
          </template>
          <p v-else class="hys-chart-locked-empty">
            当前视图没有此位置的可见数据
          </p>
        </section>
      </div>
      <ChartLegend
        v-if="sidebar"
        :items="legends"
        layout="sidebar"
        :width="bodyWidth"
        :hidden="hidden"
        :list-height="
          sideBySide ? Math.min(360, Math.max(120, height - 72)) : 160
        "
        @toggle="toggle"
      />
    </div>
    <HysTooltip
      v-if="showTooltip"
      :open="tooltipOpen"
      @update:open="changedTooltip"
      @closed="releaseTooltipContent"
      trigger="manual"
      :reference="tooltipReference"
      :enterable="tooltipInteractive"
      placement="top"
      class="hys-chart-tooltip"
    >
      <template #content>
        <div
          v-if="tooltipContent"
          class="hys-chart-tooltip-content"
          @pointerenter="holdTooltip"
          @pointerleave="deferClose"
          @focusin="holdTooltip"
          @focusout="
            (event) => {
              if (
                !(event.currentTarget as HTMLElement).contains(
                  event.relatedTarget as Node | null,
                )
              )
                deferClose();
            }
          "
        >
          <slot
            name="tooltip"
            :item="tooltipContent.entry"
            :items="tooltipContent.items"
            :close="crosshairEnabled ? cursor.clear : clearTooltip"
          >
            <template v-if="tooltipContent.comparisonTitle !== undefined">
              <strong>{{ tooltipContent.comparisonTitle }}</strong>
              <ChartComparison
                :items="tooltipContent.items"
                :scrollable="tooltipInteractive"
              />
            </template>
            <template v-else-if="tooltipMode === 'axis'">
              <strong>{{ tooltipContent.entry.point.label }}</strong>
              <ul>
                <li v-for="item in tooltipContent.items" :key="item.key">
                  <span
                    class="hys-chart-swatch"
                    :style="{ background: item.color }"
                    aria-hidden="true"
                  />
                  <span>{{ item.series.name }}</span
                  ><strong>{{ item.text }}</strong>
                </li>
              </ul>
            </template>
            <template v-else>{{ accessible(tooltipContent.entry) }}</template>
          </slot>
        </div>
      </template>
    </HysTooltip>
    <HysScrollbar
      v-if="plotReady && showTable && tableEntries.length"
      aria-label="图表数据明细"
      class="hys-chart-table"
    >
      <table>
        <thead>
          <tr>
            <th scope="col">项目</th>
            <th v-if="series && !radial" scope="col">系列</th>
            <th v-if="!category" scope="col">横坐标</th>
            <th scope="col">数值</th>
            <th v-if="radial" scope="col">占比</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in tableEntries" :key="entry.key">
            <th scope="row">{{ entry.point.label }}</th>
            <td v-if="series && !radial">{{ entry.series.name }}</td>
            <td v-if="!category">
              {{ entry.x === undefined ? "" : axisLabel(entry.x, "x") }}
            </td>
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
