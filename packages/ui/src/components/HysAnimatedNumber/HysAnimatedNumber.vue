<script setup lang="ts">
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  useTemplateRef,
  watch,
  type FunctionalComponent,
  type VNodeChild,
} from "vue";
import { useHysRootAttrs } from "../../config";
import type {
  HysAnimatedNumberContext,
  HysAnimatedNumberProps,
  HysNumberDigitContext,
  HysNumberEvent,
  HysNumberFrame,
  HysNumberTrend,
  HysNumberTrigger,
  HysNumberValue,
} from "../../composables/animatedNumber";
import { decimal } from "../../composables/numberInput";
import {
  bounded,
  createNumberPresentation,
  numberTrend,
  numberValue,
  type NumberPresentation,
} from "../../composables/animatedNumberFormat";
import { useHysAnimatedNumber } from "../../composables/useHysAnimatedNumber";
import { useNumberCountdown } from "./useNumberCountdown";
import { useNumberVisuals } from "./useNumberVisuals";
import NumberDigits from "./NumberDigits/NumberDigits.vue";

const props = withDefaults(defineProps<HysAnimatedNumberProps>(), {
  duration: 650,
  format: "HH:mm:ss",
  visibleOnce: true,
  pauseWhenHidden: true,
  canPlay: true,
  appearance: "plain",
  grouping: undefined,
});
const emit = defineEmits<{
  "update:modelValue": [target: HysNumberValue];
  "value-change": [trend: HysNumberTrend];
  threshold: [trend: HysNumberTrend];
  change: [remaining: number];
  finish: [];
  start: [frame: HysNumberFrame];
  update: [frame: HysNumberFrame];
  progress: [frame: HysNumberFrame];
  pause: [frame: HysNumberFrame];
  resume: [frame: HysNumberFrame];
  end: [frame: HysNumberFrame];
  cancel: [frame: HysNumberFrame];
  loop: [frame: HysNumberFrame];
}>();
const slots = defineSlots<{
  default?: (context: HysAnimatedNumberContext) => unknown;
  title?: () => unknown;
  prefix?: (context: HysAnimatedNumberContext) => unknown;
  formatter?: (context: HysAnimatedNumberContext) => unknown;
  suffix?: (context: HysAnimatedNumberContext) => unknown;
  unit?: (context: HysAnimatedNumberContext) => unknown;
  digit?: (context: HysNumberDigitContext) => unknown;
  trend?: (context: HysNumberTrend) => unknown;
}>();
const skin = useHysRootAttrs();
const root = useTemplateRef<HTMLElement>("root");
const localTarget = ref<HysNumberValue>(0);
const target = computed(() =>
  numberValue(props.modelValue ?? props.value ?? localTarget.value),
);
const isCountdown = computed(() => props.deadline !== undefined);
const presentation = computed(() => createNumberPresentation(props));
const announcement = ref("");
const engine = useHysAnimatedNumber(
  () => ({
    from: props.from,
    value: target.value,
    duration: props.duration,
    delay: props.delay,
    speed: props.speed,
    easing: props.easing,
    interpolate: props.interpolate,
    loop: props.loop,
    alternate: props.alternate,
    interrupt: props.interrupt,
    queueLimit: props.queueLimit,
    updateInterval: props.updateInterval,
    fps: props.fps,
    disabled: props.disabled,
    pauseWhenHidden: props.pauseWhenHidden,
    autoPlay: false,
    autoUpdate: false,
  }),
  (event, frame) => {
    const dispatch = emit as (
      event: HysNumberEvent,
      frame: HysNumberFrame,
    ) => void;
    dispatch(event, frame);
    if (event === "end" && props.announce)
      announcement.value = accessibleText(
        presentation.value.format(frame.value).text,
      );
  },
);
const {
  frame,
  motionEnabled,
  play,
  pause,
  resume,
  stop,
  reset,
  restart,
  reverse,
  seek,
  finishAnimation,
} = engine;

const trend = ref(
  numberTrend(props.from ?? target.value, target.value, props.changeThreshold),
);
const {
  remaining,
  parts: timeParts,
  milliseconds,
} = useNumberCountdown(
  () => props.deadline,
  () => props.format,
  () => props.pauseWhenHidden,
  (remaining) => emit("change", remaining),
  () => {
    emit("finish");
    if (props.announce) announcement.value = accessibleText(current.value.text);
  },
);

const triggers = computed<readonly HysNumberTrigger[]>(() =>
  props.trigger === undefined
    ? ["mount", "update"]
    : typeof props.trigger === "string"
      ? [props.trigger]
      : props.trigger,
);
const hasTrigger = (trigger: HysNumberTrigger) =>
  triggers.value.includes(trigger) && !triggers.value.includes("manual");
const canTrigger = (trigger: HysNumberTrigger) => {
  if (!hasTrigger(trigger) || isCountdown.value) return false;
  try {
    return typeof props.canPlay === "function"
      ? props.canPlay(trigger, target.value)
      : props.canPlay !== false;
  } catch {
    return false;
  }
};

let observer: IntersectionObserver | undefined;
let active = false,
  seen = false,
  visible = false,
  pending = false;
const observing = ref(false);
function triggered(trigger: HysNumberTrigger) {
  if (!canTrigger(trigger)) return false;
  if (
    trigger === "activate" ||
    trigger === "visible" ||
    frame.value.to === target.value
  )
    restart();
  else engine.updateTarget(target.value);
  pending = false;
  return true;
}
function enterView() {
  const firstEntry = !seen || !props.visibleOnce;
  const playing = ["delayed", "paused", "playing"].includes(frame.value.status);
  if (pending && canTrigger("update")) {
    engine.updateTarget(target.value);
    pending = false;
    if (hasTrigger("visible")) seen = true;
  } else if (
    firstEntry &&
    !(props.pauseOutside && playing) &&
    triggered("visible")
  ) {
    seen = true;
  }
}

function observe() {
  observer?.disconnect();
  observer = undefined;
  if (
    !active ||
    isCountdown.value ||
    (!hasTrigger("visible") && !props.pauseOutside)
  ) {
    observing.value = false;
    engine.hold(false);
    return;
  }
  if (typeof IntersectionObserver === "undefined" || !root.value) {
    observing.value = false;
    visible = true;
    engine.hold(false);
    enterView();
    return;
  }
  visible = false;
  observing.value = true;
  engine.hold(!!props.pauseOutside || hasTrigger("visible"));
  const threshold = bounded(props.visibilityThreshold, 0.2, 0, 1);
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!active || !entry) return;
      const inside =
        entry.isIntersecting && entry.intersectionRatio >= threshold;
      const entering = inside && !visible;
      visible = inside;
      if (entering) enterView();
      engine.hold(
        !inside && (!!props.pauseOutside || (hasTrigger("visible") && !seen)),
      );
    },
    { threshold },
  );
  observer.observe(root.value);
}

watch(target, (value, previous) => {
  trend.value = numberTrend(previous, value, props.changeThreshold);
  emit("value-change", trend.value);
  if (trend.value.significant) emit("threshold", trend.value);
  if (!canTrigger("update")) return;
  if (
    hasTrigger("visible") &&
    observing.value &&
    !visible &&
    (!seen || props.pauseOutside)
  ) {
    pending = true;
  } else {
    engine.updateTarget(value);
  }
});
watch(
  () => props.changeThreshold,
  (threshold) => {
    trend.value = numberTrend(trend.value.previous, target.value, threshold);
  },
);
watch(isCountdown, (enabled) => {
  if (enabled) stop();
  else engine.sync();
});
watch(
  [
    triggers,
    () => props.pauseOutside,
    () => props.visibilityThreshold,
    isCountdown,
  ],
  observe,
  { flush: "post" },
);

function activate() {
  if (active) return;
  active = true;
  observe();
}
function deactivate() {
  active = false;
  observer?.disconnect();
  observer = undefined;
  observing.value = false;
}
onMounted(() => {
  activate();
  if (props.from !== undefined && canTrigger("mount") && !hasTrigger("visible"))
    restart();
});
onActivated(() => {
  if (active) return;
  activate();
  triggered("activate");
});
onDeactivated(deactivate);
onBeforeUnmount(deactivate);

const current = computed<NumberPresentation>((previous) => {
  const next: NumberPresentation = isCountdown.value
    ? {
        text: timeParts.value.map(({ text }) => text).join(""),
        unit: "",
        parts: timeParts.value.map(({ text, numeric }) => ({
          type: numeric ? "integer" : "literal",
          value: text,
        })),
      }
    : presentation.value.format(frame.value.value);
  return previous?.text === next.text &&
    previous.unit === next.unit &&
    previous.parts.length === next.parts.length &&
    previous.parts.every(
      (part, index) =>
        part.type === next.parts[index].type &&
        part.value === next.parts[index].value,
    )
    ? previous
    : next;
});
const displayValue = computed(() => current.value.text);
const context = computed<HysAnimatedNumberContext>(() => ({
  ...frame.value,
  value: isCountdown.value ? remaining.value : frame.value.value,
  displayValue: displayValue.value,
  unit: current.value.unit,
  remaining: isCountdown.value ? remaining.value : undefined,
  trend: trend.value,
}));
const {
  from,
  to,
  status,
  running,
  digitEffect,
  visualStyle,
  outgoingStyle,
  sliding,
} = useNumberVisuals(props, frame, context, motionEnabled, isCountdown);
const start = computed(() =>
  isCountdown.value ? current.value : presentation.value.format(from.value),
);
const end = computed(() =>
  isCountdown.value ? current.value : presentation.value.format(to.value),
);
const direction = computed(() =>
  running.value || trend.value.direction === "none"
    ? frame.value.direction
    : trend.value.direction,
);
const tone = computed(() => {
  if (isCountdown.value) return;
  if (props.colorByDirection && direction.value !== "none")
    return direction.value;
  if (props.colorBySign) {
    const units = decimal(frame.value.value)?.units ?? 0n;
    return units > 0n ? "up" : units < 0n ? "down" : undefined;
  }
});
const animatedGlyphs = computed(
  () => !!digitEffect.value && motionEnabled.value && !milliseconds.value,
);
const formattedOverride = computed(() => {
  if (!props.formatter || slots.formatter || slots.default) return;
  try {
    return { value: props.formatter(context.value) };
  } catch {
    return;
  }
});
const customContent = computed(
  () =>
    !!(
      slots.formatter ||
      slots.default ||
      formattedOverride.value ||
      slots.digit
    ),
);
const showAccessibleText = computed(
  () => animatedGlyphs.value && !customContent.value && !isCountdown.value,
);
const interactive = computed(
  () => !isCountdown.value && (hasTrigger("click") || hasTrigger("hover")),
);
function accessibleText(text: string) {
  return [
    props.title,
    [props.prefix, text, props.suffix].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}
function onKey(event: KeyboardEvent) {
  if (
    event.target !== root.value ||
    event.repeat ||
    !hasTrigger("click") ||
    !["Enter", " "].includes(event.key)
  )
    return;
  event.preventDefault();
  triggered("click");
}
function setValue(value: HysNumberValue) {
  const next = numberValue(value);
  if (props.modelValue === undefined && props.value === undefined)
    localTarget.value = next;
  emit("update:modelValue", next);
}
const RenderContent: FunctionalComponent<{ value: VNodeChild }> = ({ value }) =>
  value;
defineExpose({
  displayValue,
  remaining,
  frame,
  trend,
  setValue,
  play,
  pause,
  resume,
  stop,
  restart,
  reset,
  reverse,
  seek,
  finishAnimation,
});
</script>

<template>
  <span
    ref="root"
    v-bind="skin"
    class="hys-ui-motion-number"
    :data-tone="tone"
    :data-direction="direction"
    :data-status="isCountdown ? undefined : status"
    :data-appearance="appearance"
    :role="interactive && hasTrigger('click') ? 'button' : undefined"
    :tabindex="interactive ? 0 : undefined"
    @click="triggered('click')"
    @pointerenter="triggered('hover')"
    @focus="triggered('hover')"
    @keydown="onKey"
  >
    <span v-if="title || slots.title" class="hys-ui-motion-number-title"
      ><slot name="title">{{ title }}</slot></span
    >
    <span
      class="hys-ui-motion-number-value"
      :style="valueStyle"
      :role="isCountdown ? 'timer' : undefined"
      :aria-label="
        isCountdown && !customContent ? accessibleText(displayValue) : undefined
      "
    >
      <span
        v-if="prefix || slots.prefix"
        class="hys-ui-motion-number-affix hys-ui-motion-number-prefix"
      >
        <slot v-if="slots.prefix" name="prefix" v-bind="context" />
        <template v-else>{{ prefix }}</template>
      </span>
      <slot v-if="slots.formatter" name="formatter" v-bind="context" />
      <slot v-else-if="slots.default" v-bind="context" />
      <RenderContent
        v-else-if="formattedOverride"
        :value="formattedOverride.value"
      />
      <span
        v-else
        class="hys-ui-motion-number-layout"
        :class="{
          'hys-number-stable': stableWidth,
          'hys-number-sliding': sliding,
        }"
      >
        <template v-if="stableWidth && !isCountdown">
          <span class="hys-number-measure" aria-hidden="true">{{
            start.text
          }}</span>
          <span class="hys-number-measure" aria-hidden="true">{{
            end.text
          }}</span>
        </template>
        <span
          v-if="outgoingStyle"
          class="hys-ui-motion-number-outgoing"
          aria-hidden="true"
          :style="outgoingStyle"
          >{{ start.text }}</span
        >
        <span class="hys-ui-motion-number-content" :style="visualStyle">
          <NumberDigits
            v-if="digitEffect || slots.digit || appearance !== 'plain'"
            :current="current"
            :start="start"
            :end="end"
            :glyphs="presentation.localized"
            :context="context"
            :effect="digitEffect"
            :axis="axis"
            :order="digitOrder"
            :stagger="stagger"
            :duration="duration"
            :digit-duration="digitDuration"
            :motion="animatedGlyphs"
            :timer="isCountdown"
            :accessible="showAccessibleText"
            :split="appearance !== 'plain'"
          >
            <template v-if="slots.digit" #digit="digit"
              ><slot name="digit" v-bind="digit"
            /></template>
          </NumberDigits>
          <template v-else>
            <span
              v-for="({ type, value }, index) in current.parts"
              :key="index"
              :class="{
                'hys-ui-motion-number-separator':
                  type === 'group' || type === 'decimal',
              }"
              >{{ value }}</span
            >
          </template>
          <span
            v-if="current.unit || slots.unit"
            class="hys-ui-motion-number-unit"
            ><slot v-if="slots.unit" name="unit" v-bind="context" />
            <template v-else>{{ current.unit }}</template></span
          >
        </span>
      </span>
      <span
        v-if="suffix || slots.suffix"
        class="hys-ui-motion-number-affix hys-ui-motion-number-suffix"
      >
        <slot v-if="slots.suffix" name="suffix" v-bind="context" />
        <template v-else>{{ suffix }}</template>
      </span>
    </span>
    <slot v-if="slots.trend" name="trend" v-bind="trend" />
    <span
      v-if="announce"
      class="hys-number-live"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      >{{ announcement }}</span
    >
  </span>
</template>

<style scoped src="./animated-number.css"></style>
