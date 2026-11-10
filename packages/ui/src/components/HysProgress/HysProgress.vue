<script setup lang="ts">
import {
  computed,
  onActivated,
  onDeactivated,
  ref,
  useAttrs,
  useId,
  type FunctionalComponent,
} from "vue";
import { CheckCircle2, AlertTriangle, CircleX } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import {
  progressPercent,
  progressNumber,
  progressStatusColor,
  progressPaint,
  progressCssPaint,
  progressGradientCoordinates,
  progressArc,
  progressId,
  type HysProgressProps,
  type HysProgressSlots,
  type HysProgressLabelContext,
  type ProgressPaint,
} from "../../composables/progress";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysProgressProps>(), {
  showLabel: true,
  status: "normal",
  type: "line",
  size: "md",
  strokeLinecap: "round",
  gapPosition: "bottom",
  showStatusIcon: false,
  animated: true,
  duration: 250,
  flowDuration: 1300,
  stepGap: 3,
});
const slots = defineSlots<HysProgressSlots>(),
  attrs = useAttrs(),
  skin = useHysRootAttrs(),
  element = ref<HTMLElement>(),
  live = ref(true);
onActivated(() => (live.value = true));
onDeactivated(() => (live.value = false));
const id = progressId() + "-" + useId().replaceAll(":", "-");
const value = computed(() => progressPercent(props.value)),
  successValue = computed(() =>
    Math.min(value.value, progressPercent(props.success?.value)),
  );
const status = computed(() =>
  ["normal", "success", "warning", "error", "active"].includes(props.status)
    ? props.status
    : "normal",
);
const circular = computed(
  () => props.type === "circle" || props.type === "dashboard",
);
const preset = computed(
  () =>
    ({
      sm: { stroke: 4, width: 80, font: 11, roundFont: 14 },
      md: { stroke: 7, width: 100, font: 12, roundFont: 16 },
      lg: { stroke: 12, width: 132, font: 14, roundFont: 20 },
    })[props.size] ?? { stroke: 7, width: 100, font: 12, roundFont: 16 },
);
const thickness = computed(() =>
  progressNumber(
    props.strokeWidth,
    props.textInside && !circular.value
      ? Math.max(preset.value.stroke, Math.ceil(preset.value.font * 1.8))
      : preset.value.stroke,
    1,
    circular.value ? 48 : 100,
  ),
);
const diameter = computed(() =>
  typeof props.width === "string"
    ? props.width
    : progressNumber(props.width, preset.value.width, 20, 2000),
);
const radius = computed(() => Math.min(44, (100 - thickness.value) / 2 - 1));
const gap = computed(() =>
  progressNumber(props.gapDegree, props.type === "dashboard" ? 75 : 0, 0, 295),
);
const startAngle = computed(() =>
  gap.value
    ? ({ top: -90, right: 0, bottom: 90, left: 180 }[props.gapPosition] ?? 90) +
      gap.value / 2
    : -90,
);
const arc = computed(() =>
  progressArc(radius.value, startAngle.value, 360 - gap.value),
);
const count = computed(() =>
  props.indeterminate ? 0 : Math.floor(progressNumber(props.steps, 0, 0, 200)),
);
const stepGap = computed(() => progressNumber(props.stepGap, 3, 0, 40));
const segmentStroke = computed(() =>
  props.strokeLinecap === "butt" || !count.value
    ? thickness.value
    : Math.min(
        thickness.value,
        ((2 * Math.PI * radius.value * (360 - gap.value)) / 360 / count.value) *
          0.5,
      ),
);
const inside = computed(
  () =>
    !!props.textInside &&
    !circular.value &&
    thickness.value >= preset.value.font * 1.5,
);
const fraction = (amount: number, index: number) =>
  progressPercent(((amount / 100) * count.value - index) * 100);
const main = computed(() =>
  progressPaint(props.color, value.value, progressStatusColor(status.value)),
);
const success = computed(() =>
  progressPaint(
    props.success?.color,
    successValue.value,
    progressStatusColor("success"),
  ),
);
const paint = (p: ProgressPaint) =>
  p.gradient
    ? "url(#" + (p === success.value ? id + "-success" : id + "-main") + ")"
    : p.color;
const gradients = computed(() =>
  [
    { id: id + "-main", paint: main.value },
    { id: id + "-success", paint: success.value },
  ]
    .filter((entry) => entry.paint.gradient)
    .map((entry) => ({
      ...entry,
      coordinates: progressGradientCoordinates(entry.paint.gradient!.angle),
    })),
);
const stepColor = (index: number) =>
  Array.isArray(props.color) &&
  props.color.length &&
  props.color.every((item) => typeof item === "string")
    ? (props.color[index % props.color.length] as string)
    : progressCssPaint(main.value);
const stepStroke = (index: number) =>
  Array.isArray(props.color) &&
  props.color.length &&
  props.color.every((item) => typeof item === "string")
    ? (props.color[index % props.color.length] as string)
    : paint(main.value);
const segments = computed(() =>
  Array.from({ length: count.value }, (_, index) => {
    const part = (360 - gap.value) / count.value,
      space = Math.min(
        part * 0.8,
        (((stepGap.value +
          (props.strokeLinecap === "butt" ? 0 : segmentStroke.value)) /
          radius.value) *
          180) /
          Math.PI,
      );
    return {
      index,
      path: progressArc(
        radius.value,
        startAngle.value + index * part + space / 2,
        part - space,
      ),
    };
  }),
);
const context = computed<HysProgressLabelContext>(() => ({
  value: value.value,
  successValue: successValue.value,
  status: status.value,
  indeterminate: !!props.indeterminate,
}));
const text = computed(() =>
  props.format
    ? props.format(value.value, successValue.value)
    : props.precision === undefined
      ? value.value + "%"
      : value.value.toFixed(
          Math.floor(progressNumber(props.precision, 0, 0, 6)),
        ) + "%",
);
const icon = computed(
  () =>
    ({ success: CheckCircle2, warning: AlertTriangle, error: CircleX })[
      status.value as "success" | "warning" | "error"
    ],
);
const Label: FunctionalComponent = () =>
  slots.default?.(context.value) ?? text.value;
const ariaText = computed(() =>
  typeof props.ariaValueText === "function"
    ? props.ariaValueText(context.value)
    : (props.ariaValueText ??
      (props.indeterminate
        ? "处理中"
        : typeof text.value === "string" || typeof text.value === "number"
          ? String(text.value)
          : value.value + "%")),
);
const motion = computed(
  () => props.animated && live.value && skin.value["data-hys-motion"] !== "off",
);
const flow = computed(
  () => motion.value && progressNumber(props.flowDuration, 1300, 0, 30000) > 0,
);
const rootStyle = computed(() => ({
  "--hys-ui-progress-duration":
    (motion.value ? progressNumber(props.duration, 250, 0, 5000) : 0) + "ms",
  "--hys-ui-progress-flow-duration":
    progressNumber(props.flowDuration, 1300, 1, 30000) + "ms",
  "--hys-ui-progress-text":
    props.textColor || "var(--hys-ui-text,var(--hys-ui-theme-text))",
  "--hys-ui-progress-font":
    (circular.value
      ? Math.min(
          preset.value.roundFont,
          typeof diameter.value === "number"
            ? diameter.value / 4
            : preset.value.roundFont,
        )
      : preset.value.font) + "px",
  "--hys-ui-progress-radius": props.strokeLinecap === "round" ? "999px" : "0px",
  ...(circular.value
    ? {
        width:
          typeof diameter.value === "number"
            ? diameter.value + "px"
            : diameter.value,
        aspectRatio: "1",
      }
    : {}),
}));
const trail = computed(
  () => props.trailColor || "var(--hys-ui-border,var(--hys-ui-theme-border))",
);
defineExpose({ element, value, successValue, status });
</script>
<template>
  <div
    ref="element"
    v-bind="{ ...skin, ...attrs }"
    class="hys-ui-progress-line"
    :class="{
      'hys-ui-progress-circle': circular,
      'hys-ui-progress-dashboard': type === 'dashboard',
      'hys-ui-progress-inside': inside,
      'hys-ui-progress-no-label': !showLabel,
      'hys-ui-progress-flow': flow,
      'hys-ui-progress-striped': striped,
      'hys-ui-progress-striped-flow': stripedFlow,
      'hys-ui-progress-active': status === 'active',
      'hys-ui-progress-unknown': indeterminate,
    }"
    :style="rootStyle"
    :data-status="status"
    role="progressbar"
    :aria-label="ariaLabel"
    :aria-valuenow="indeterminate ? undefined : value"
    :aria-valuetext="ariaText"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <svg
      v-if="circular"
      viewBox="0 0 100 100"
      aria-hidden="true"
      class="hys-ui-progress-svg"
    >
      <defs v-if="gradients.length">
        <linearGradient
          v-for="gradient in gradients"
          :id="gradient.id"
          :key="gradient.id"
          gradientUnits="userSpaceOnUse"
          v-bind="gradient.coordinates"
        >
          <stop
            v-for="(stop, index) in gradient.paint.gradient!.stops"
            :key="index"
            :offset="stop.offset + '%'"
            :stop-color="stop.color"
          />
        </linearGradient>
      </defs>
      <g v-if="count" class="hys-ui-progress-ring-steps">
        <g v-for="segment in segments" :key="segment.index">
          <path
            :d="segment.path"
            :stroke="trail"
            :stroke-width="segmentStroke"
            :stroke-linecap="strokeLinecap"
            fill="none"
          />
          <path
            v-if="fraction(value, segment.index) > 0"
            class="hys-ui-progress-ring-fill"
            :d="segment.path"
            pathLength="100"
            :stroke="stepStroke(segment.index)"
            :stroke-width="segmentStroke"
            :stroke-linecap="strokeLinecap"
            :stroke-dasharray="fraction(value, segment.index) + ' 100'"
            fill="none"
          />
          <path
            v-if="fraction(successValue, segment.index) > 0"
            class="hys-ui-progress-ring-success"
            :d="segment.path"
            pathLength="100"
            :stroke="paint(success)"
            :stroke-width="segmentStroke"
            :stroke-linecap="strokeLinecap"
            :stroke-dasharray="fraction(successValue, segment.index) + ' 100'"
            fill="none"
          />
        </g>
      </g>
      <g v-else>
        <path
          class="hys-ui-progress-ring-trail"
          :d="arc"
          :stroke="trail"
          :stroke-width="thickness"
          :stroke-linecap="strokeLinecap"
          fill="none"
        />
        <path
          v-show="indeterminate || value > 0"
          class="hys-ui-progress-ring-fill"
          :class="{ 'hys-ui-progress-ring-indeterminate': indeterminate }"
          :d="arc"
          pathLength="100"
          :stroke="paint(main)"
          :stroke-width="thickness"
          :stroke-linecap="strokeLinecap"
          :stroke-dasharray="(indeterminate ? 25 : value) + ' 100'"
          fill="none"
        />
        <path
          v-if="successValue > 0 && !indeterminate"
          class="hys-ui-progress-ring-success"
          :d="arc"
          pathLength="100"
          :stroke="paint(success)"
          :stroke-width="thickness"
          :stroke-linecap="strokeLinecap"
          :stroke-dasharray="successValue + ' 100'"
          fill="none"
        />
      </g>
    </svg>
    <div
      v-else
      class="hys-ui-progress-track"
      :class="{ 'hys-ui-progress-steps': count }"
      :style="{
        height: thickness + 'px',
        background: count ? 'transparent' : trail,
        gap: stepGap + 'px',
      }"
    >
      <template v-if="count"
        ><span
          v-for="index in count"
          :key="index"
          class="hys-ui-progress-step"
          :style="{ background: trail }"
          ><i
            class="hys-ui-progress-fill"
            :style="{
              width: fraction(value, index - 1) + '%',
              background: stepColor(index - 1),
            }" /><i
            v-if="successValue > 0"
            class="hys-ui-progress-success"
            :style="{
              width: fraction(successValue, index - 1) + '%',
              background: progressCssPaint(success),
            }" /></span
      ></template>
      <template v-else
        ><div
          class="hys-ui-progress-fill hys-ui-motion-progress"
          :class="{ 'hys-ui-progress-indeterminate': indeterminate }"
          :style="{
            width: (indeterminate ? 35 : value) + '%',
            background: progressCssPaint(main),
          }" />
        <div
          v-if="successValue > 0 && !indeterminate"
          class="hys-ui-progress-success"
          :style="{
            width: successValue + '%',
            background: progressCssPaint(success),
          }"
      /></template>
      <span
        v-if="showLabel && inside"
        class="hys-ui-progress-label hys-ui-progress-inside-label"
        ><span
          ><slot
            v-if="showStatusIcon && (icon || $slots.icon)"
            name="icon"
            v-bind="context"
            ><component :is="icon" :size="14" aria-hidden="true" /></slot
          ><Label /></span
      ></span>
    </div>
    <span v-if="showLabel && !inside" class="hys-ui-progress-label"
      ><slot
        v-if="showStatusIcon && (icon || $slots.icon)"
        name="icon"
        v-bind="context"
        ><component
          :is="icon"
          :size="circular ? 18 : 14"
          aria-hidden="true" /></slot
      ><Label
    /></span>
  </div>
</template>
<style scoped>
.hys-ui-progress-line {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-width: 0;
  color: var(--hys-ui-progress-text);
}
.hys-ui-progress-track {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 7px;
  border-radius: var(--hys-ui-progress-radius);
  overflow: hidden;
  isolation: isolate;
}
.hys-ui-progress-fill,
.hys-ui-progress-success {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  border-radius: inherit;
  transition: width var(--hys-ui-progress-duration) ease;
  overflow: hidden;
}
.hys-ui-progress-success {
  z-index: 1;
}
.hys-ui-progress-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: none;
  min-width: 34px;
  font-size: var(--hys-ui-progress-font);
  line-height: 1.5;
  font-weight: 600;
  overflow-wrap: anywhere;
  max-width: 100%;
}
.hys-ui-progress-line:not(.hys-ui-progress-circle):not(.hys-ui-progress-inside)
  > .hys-ui-progress-label {
  max-width: 50%;
  text-align: end;
}
.hys-ui-progress-no-label {
  gap: 0;
}
.hys-ui-progress-inside-label {
  position: absolute;
  inset: 0;
  z-index: 2;
  min-width: 0;
  padding: 0 4px;
  overflow: hidden;
  white-space: nowrap;
}
.hys-ui-progress-inside-label > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 0 4px;
  border-radius: 3px;
  background: color-mix(
    in srgb,
    var(--hys-ui-surface, var(--hys-ui-theme-surface)) 88%,
    transparent
  );
  overflow: hidden;
  text-overflow: ellipsis;
}
.hys-ui-progress-steps {
  display: flex;
  overflow: visible;
  border-radius: 0;
}
.hys-ui-progress-step {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
  border-radius: var(--hys-ui-progress-radius);
  overflow: hidden;
}
.hys-ui-progress-circle {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  max-width: 100%;
  min-width: 0;
  height: auto;
}
.hys-ui-progress-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  grid-area: 1/1;
}
.hys-ui-progress-circle > .hys-ui-progress-label {
  grid-area: 1/1;
  position: relative;
  max-width: 72%;
  text-align: center;
  min-width: 0;
  pointer-events: none;
}
.hys-ui-progress-ring-fill,
.hys-ui-progress-ring-success {
  transition:
    stroke-dasharray var(--hys-ui-progress-duration) ease,
    stroke var(--hys-ui-progress-duration) ease;
}
.hys-ui-progress-striped .hys-ui-progress-fill:after {
  content: "";
  position: absolute;
  inset: 0 -24px 0 0;
  background: repeating-linear-gradient(
    45deg,
    #fff4 0,
    #fff4 6px,
    transparent 6px,
    transparent 12px
  );
}
.hys-ui-progress-striped-flow.hys-ui-progress-flow .hys-ui-progress-fill:after {
  animation: hys-ui-progress-stripes var(--hys-ui-progress-flow-duration) linear
    infinite;
}
.hys-ui-progress-active.hys-ui-progress-flow .hys-ui-progress-fill:before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, #fff7, transparent);
  transform: translateX(-100%);
  animation: hys-ui-progress-shine var(--hys-ui-progress-flow-duration)
    ease-in-out infinite;
}
.hys-ui-progress-active.hys-ui-progress-flow .hys-ui-progress-ring-fill {
  animation: hys-ui-progress-pulse var(--hys-ui-progress-flow-duration)
    ease-in-out infinite;
}
.hys-ui-progress-flow .hys-ui-progress-indeterminate {
  animation: hys-ui-progress-slide var(--hys-ui-progress-flow-duration)
    ease-in-out infinite;
}
.hys-ui-progress-flow .hys-ui-progress-ring-indeterminate {
  animation: hys-ui-progress-sweep var(--hys-ui-progress-flow-duration) linear
    infinite;
}
@keyframes hys-ui-progress-slide {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(300%);
  }
}
@keyframes hys-ui-progress-sweep {
  from {
    stroke-dashoffset: 125;
  }
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes hys-ui-progress-stripes {
  from {
    transform: translateX(-17px);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes hys-ui-progress-shine {
  to {
    transform: translateX(100%);
  }
}
@keyframes hys-ui-progress-pulse {
  50% {
    opacity: 0.5;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-progress-fill,
  .hys-ui-progress-success,
  .hys-ui-progress-ring-fill,
  .hys-ui-progress-ring-success {
    animation: none !important;
    transition: none !important;
  }
  .hys-ui-progress-fill:before,
  .hys-ui-progress-fill:after {
    animation: none !important;
  }
}
</style>
