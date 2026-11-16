<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onDeactivated,
  ref,
  shallowRef,
  watch,
} from "vue";
import HysButton from "../HysButton/HysButton.vue";
import { Minus, Plus } from "../HysIcon/svgIcons";
import HysSlider from "../HysSlider/HysSlider.vue";
import type { HysSliderDragInfo } from "../../composables/slider";
import type { ChartSeries } from "./chartModel";
import type { HysChartRange } from "./chartTypes";
import { chartScale } from "./chartScale";
import { rangeOverview } from "./chartRangeOverview";

type Handles = [number, number];

const props = defineProps<{
  domain: HysChartRange;
  visible: HysChartRange;
  category: boolean;
  groups: readonly ChartSeries[];
  width: number;
  left: number;
  right: number;
  filtered: boolean;
  formatValue: (value: number) => string;
}>();
const emit = defineEmits<{
  range: [range: HysChartRange];
  zoom: [factor: number];
  reset: [];
  interact: [];
}>();

const steps = computed(() =>
  props.category ? props.domain.end - props.domain.start : 1000,
);
const scale = computed(() =>
  chartScale(props.domain, 0, steps.value, { ticks: [] }, 2, true),
);
const toValue = (step: number) => {
  if (step === 0) return props.domain.start;
  if (step === steps.value) return props.domain.end;
  return props.category
    ? Math.round(scale.value.invert(step))
    : scale.value.invert(step);
};
const toStep = (value: number) =>
  Math.max(0, Math.min(steps.value, Math.round(scale.value.at(value))));
const current = computed<Handles>(() => [
  toStep(props.visible.start),
  toStep(props.visible.end),
]);
const draft = shallowRef<Handles>();
const display = computed(() => draft.value ?? current.value);
const paths = computed(() =>
  rangeOverview(props.groups, props.domain, props.width),
);
const selection = computed(() => [
  (display.value[0] / steps.value) * 1000,
  (display.value[1] / steps.value) * 1000,
]);
const formatted = (value: number) => props.formatValue(toValue(value));
const rangeText = computed(() => {
  const window = draft.value
    ? display.value.map(toValue)
    : [props.visible.start, props.visible.end];
  return window.map(props.formatValue).join(" – ");
});
const full = computed(() => !props.filtered);
const insets = computed(() => ({
  marginLeft: props.left + "px",
  marginRight: props.width - props.right + "px",
}));

let slide: Handles | undefined;
function startSlide(pair: Handles) {
  slide = pair;
  emit("interact");
}
function changeSlide(pair: Handles) {
  if (slide) draft.value = pair;
  else apply(pair, pair[0] !== current.value[0] ? 0 : 1);
}
function endSlide(pair: Handles, info: HysSliderDragInfo) {
  const previous = slide;
  slide = undefined;
  draft.value = undefined;
  if (
    previous &&
    !info.cancelled &&
    (pair[0] !== previous[0] || pair[1] !== previous[1])
  )
    apply(pair, info.index);
}
function apply(pair: Handles, index = 1) {
  const [left, right] = pair;
  const next: Handles =
    left !== right
      ? pair
      : index === 0 && left > 0
        ? [left - 1, right]
        : [Math.min(left, steps.value - 1), Math.min(right + 1, steps.value)];
  emit("range", { start: toValue(next[0]), end: toValue(next[1]) });
}

const brushActive = ref(false);
let brush:
  | {
      pointerId: number;
      target: HTMLElement;
      rail: HTMLElement;
      initialX: number;
      from: number;
    }
  | undefined;
function pointOnRail(rail: HTMLElement, clientX: number) {
  const box = rail.getBoundingClientRect();
  return Math.max(
    0,
    Math.min(
      steps.value,
      Math.round(((clientX - box.left) / Math.max(1, box.width)) * steps.value),
    ),
  );
}
function startBrush(event: PointerEvent) {
  if (
    brush ||
    slide ||
    event.button !== 0 ||
    !(event.target instanceof Element)
  )
    return;
  const rail = event.target.closest<HTMLElement>(".hys-ui-slider-rail");
  // Keep thumb resizing and selected-track panning on HysSlider.
  if (
    !rail ||
    event.target.closest('[role="slider"]') ||
    (!full.value && event.target.closest(".hys-ui-slider-selection"))
  )
    return;

  const target = event.currentTarget as HTMLElement;
  event.preventDefault();
  event.stopPropagation();
  brush = {
    pointerId: event.pointerId,
    target,
    rail,
    initialX: event.clientX,
    from: pointOnRail(rail, event.clientX),
  };
  target.setPointerCapture?.(event.pointerId);
  target.focus({ preventScroll: true });
  emit("interact");
}
function moveBrush(event: PointerEvent) {
  if (!brush || event.pointerId !== brush.pointerId) return;
  if (!brushActive.value && Math.abs(event.clientX - brush.initialX) < 4)
    return;
  brushActive.value = true;
  const to = pointOnRail(brush.rail, event.clientX);
  draft.value = [Math.min(brush.from, to), Math.max(brush.from, to)];
}
function cancelBrush() {
  if (!brush) return;
  const { target, pointerId } = brush;
  brush = undefined;
  brushActive.value = false;
  draft.value = undefined;
  if (target.hasPointerCapture?.(pointerId))
    target.releasePointerCapture(pointerId);
}
function endBrush(event: PointerEvent) {
  if (!brush || event.pointerId !== brush.pointerId) return;
  if (event.type !== "pointerup") {
    cancelBrush();
    return;
  }
  moveBrush(event);
  const chosen = draft.value;
  const at = pointOnRail(brush.rail, event.clientX);
  cancelBrush();
  if (chosen && chosen[0] !== chosen[1]) {
    apply(chosen);
  } else if (!chosen && !full.value) {
    const span = current.value[1] - current.value[0];
    const start = Math.max(
      0,
      Math.min(steps.value - span, Math.round(at - span / 2)),
    );
    apply([start, start + span]);
  }
}
watch(
  () => [
    props.domain.start,
    props.domain.end,
    props.visible.start,
    props.visible.end,
    props.category,
  ],
  () => {
    cancelBrush();
    slide = undefined;
    draft.value = undefined;
  },
);
onDeactivated(cancelBrush);
onBeforeUnmount(cancelBrush);
</script>

<template>
  <div class="hys-chart-navigator">
    <div
      class="hys-chart-navigator-track"
      :style="insets"
      :class="{
        'hys-chart-navigator-full': full,
        'hys-chart-navigator-brushing': brushActive,
      }"
      tabindex="-1"
      role="group"
      aria-label="图表区间概览"
      @pointerdown.capture="startBrush"
      @pointermove="moveBrush"
      @pointerup="endBrush"
      @pointercancel="endBrush"
      @lostpointercapture="endBrush"
      @keydown.esc="cancelBrush"
    >
      <svg
        class="hys-chart-navigator-overview"
        viewBox="0 0 1000 34"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          v-for="path in paths"
          :key="path.key"
          :d="path.line"
          :stroke="path.color"
        />
        <rect
          class="hys-chart-navigator-mask"
          x="0"
          y="0"
          :width="selection[0]"
          height="34"
        />
        <rect
          class="hys-chart-navigator-mask"
          :x="selection[1]"
          y="0"
          :width="1000 - selection[1]"
          height="34"
        />
      </svg>
      <HysSlider
        :model-value="display"
        range
        :min="0"
        :max="steps"
        :step="1"
        :draggable-track="!full"
        :show-value="false"
        :show-tooltip="false"
        range-start-label="区间开始"
        range-end-label="区间结束"
        :format-value-text="formatted"
        @drag-start="startSlide"
        @update:model-value="changeSlide"
        @drag-end="endSlide"
      />
    </div>
    <div
      class="hys-chart-navigator-footer"
      :style="width >= 380 ? insets : undefined"
    >
      <span class="hys-chart-navigator-range">{{
        filtered || draft ? rangeText : "全部区间"
      }}</span>
      <div
        class="hys-chart-navigator-controls"
        role="group"
        aria-label="图表缩放"
      >
        <HysButton
          size="sm"
          variant="ghost"
          :icon="Plus"
          aria-label="放大"
          class="hys-chart-navigator-zoom"
          @click="emit('zoom', 0.65)"
        />
        <HysButton
          size="sm"
          variant="ghost"
          :disabled="!filtered"
          :icon="Minus"
          aria-label="缩小"
          class="hys-chart-navigator-zoom"
          @click="emit('zoom', 1.5)"
        />
        <HysButton
          size="sm"
          variant="ghost"
          :disabled="!filtered"
          @click="emit('reset')"
          >重置区间</HysButton
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.hys-chart-navigator {
  min-inline-size: 0;
  margin-block-start: 4px;
  --hys-chart-navigator-accent: var(
    --hys-ui-primary,
    var(--hys-ui-theme-primary)
  );
}
.hys-chart-navigator-track {
  position: relative;
  min-inline-size: 0;
  outline: none;
}
.hys-chart-navigator-overview {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  border-radius: 5px;
  background: var(--hys-ui-theme-surface-alt, var(--hys-ui-theme-surface));
  box-shadow: inset 0 0 0 1px var(--hys-ui-theme-border);
  pointer-events: none;
}
.hys-chart-navigator-overview path {
  fill: none;
  stroke-width: 1.3px;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.hys-chart-navigator-mask {
  fill: var(--hys-ui-theme-surface);
  opacity: 0.58;
}
.hys-chart-navigator-track :deep(.hys-ui-slider-wrap) {
  --hys-ui-slider-rail-size: 34px;
  --hys-ui-slider-hit-size: 34px;
}
.hys-chart-navigator-track :deep(.hys-ui-slider-axis) {
  padding-inline: 0;
}
.hys-chart-navigator-track :deep(.hys-ui-slider-background) {
  background: transparent;
}
.hys-chart-navigator-track :deep(.hys-ui-slider-rail) {
  cursor: crosshair;
}
.hys-chart-navigator-track :deep(.hys-ui-slider-selection) {
  box-sizing: border-box;
  border: 1px solid
    color-mix(in srgb, var(--hys-chart-navigator-accent) 57%, transparent);
  border-radius: 4px;
  background: color-mix(
    in srgb,
    var(--hys-chart-navigator-accent) 8%,
    transparent
  );
}
.hys-chart-navigator-full :deep(.hys-ui-slider-selection) {
  cursor: crosshair;
}
.hys-chart-navigator-brushing :deep(.hys-ui-slider-thumb) {
  cursor: crosshair;
}
.hys-chart-navigator-track :deep(.hys-ui-slider-thumb) {
  cursor: ew-resize;
}
.hys-chart-navigator-track :deep(.hys-ui-slider-handle) {
  inline-size: 13px;
  block-size: 23px;
  border-width: 1px;
  border-radius: 4px;
}
.hys-chart-navigator-track :deep(.hys-ui-slider-handle)::before {
  content: "";
  inline-size: 4px;
  block-size: 9px;
  border-inline: 1px solid currentColor;
  opacity: 0.78;
}
.hys-chart-navigator-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2px 8px;
  margin-block-start: 4px;
}
.hys-chart-navigator-range {
  min-inline-size: 0;
  overflow-wrap: anywhere;
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.hys-chart-navigator-zoom {
  padding-inline: 6px;
  min-inline-size: 30px;
}
.hys-chart-navigator-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-inline-start: auto;
}
</style>
