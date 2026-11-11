<script lang="ts">
import type { StyleValue, VNodeChild } from "vue";

export interface HysAnimatedNumberContext {
  value: number | string;
  displayValue: string;
  remaining?: number;
}
export interface HysAnimatedNumberProps {
  value?: number | string;
  duration?: number;
  decimals?: number;
  precision?: number;
  groupSeparator?: string;
  decimalSeparator?: string;
  title?: string;
  prefix?: string;
  suffix?: string;
  valueStyle?: StyleValue;
  formatter?: (context: HysAnimatedNumberContext) => VNodeChild;
  /** 倒计时截止时间，可传 Unix 毫秒时间戳或 Date。 */
  deadline?: number | Date;
  /** 支持 D、HH、mm、ss、SSS 等标记，用方括号包裹字面文本。 */
  format?: string;
}
</script>

<script setup lang="ts">
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  useSlots,
  watch,
  type FunctionalComponent,
} from "vue";
import { useHysRootAttrs } from "../../config";
import { useMotion } from "../../motion/useMotion";
import {
  decimal,
  decimalRound,
  decimalText,
} from "../../composables/numberInput";

const props = withDefaults(defineProps<HysAnimatedNumberProps>(), {
  value: 0,
  duration: 650,
  decimalSeparator: ".",
  format: "HH:mm:ss",
});
const emit = defineEmits<{ change: [remaining: number]; finish: [] }>();
const slots = useSlots();
const skin = useHysRootAttrs();
const { effectiveMotion } = useMotion();
const numeric = (value: number | string) =>
  typeof value === "number" && !Number.isFinite(value) ? 0 : value;
const shown = ref<number | string>(numeric(props.value));
let frame = 0;
let active = false;

function animate() {
  cancelAnimationFrame(frame);
  if (!active) return;
  const target = numeric(props.value);
  const from = shown.value;
  const duration = props.duration;
  if (
    typeof target !== "number" ||
    typeof from !== "number" ||
    from === target ||
    props.deadline !== undefined ||
    effectiveMotion.value === "off" ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    shown.value = target;
    return;
  }
  const started = performance.now();
  const step = (now: number) => {
    const progress = Math.max(0, Math.min(1, (now - started) / duration));
    const eased = 1 - (1 - progress) ** 3;
    shown.value = progress === 1 ? target : from * (1 - eased) + target * eased;
    if (progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
}
watch([() => props.value, () => props.duration, effectiveMotion], animate);

const deadline = computed(() => {
  const value =
    props.deadline instanceof Date ? props.deadline.getTime() : props.deadline;
  return value !== undefined && Number.isFinite(value) ? value : undefined;
});
const timeLeft = () =>
  deadline.value === undefined
    ? 0
    : Math.max(
        0,
        Math.min(Number.MAX_SAFE_INTEGER, deadline.value - Date.now()),
      );
const remaining = ref(timeLeft());
const formatTokens = computed<readonly string[]>(
  () => props.format.match(/\[[^\]]*\]|SSS|DD?|HH?|mm?|ss?|[\s\S]/g) ?? [],
);
const milliseconds = computed(() => formatTokens.value.includes("SSS"));
let timer: ReturnType<typeof setTimeout> | undefined;
let finished: number | undefined;
let lastRemaining: number | undefined;
function tick() {
  clearTimeout(timer);
  if (!active || deadline.value === undefined) return;
  const end = deadline.value;
  remaining.value = timeLeft();
  if (remaining.value !== lastRemaining) {
    lastRemaining = remaining.value;
    emit("change", remaining.value);
  }
  if (remaining.value === 0) {
    if (finished !== end) {
      finished = end;
      emit("finish");
    }
    return;
  }
  const interval = milliseconds.value ? 16 : 1000;
  timer = setTimeout(
    tick,
    milliseconds.value ? interval : remaining.value % interval || interval,
  );
}
watch(deadline, () => {
  finished = undefined;
  lastRemaining = undefined;
  remaining.value = timeLeft();
  animate();
  tick();
});
watch(milliseconds, tick);

function start() {
  if (active) return;
  active = true;
  shown.value = numeric(props.value);
  tick();
}
function stop() {
  active = false;
  clearTimeout(timer);
  cancelAnimationFrame(frame);
}
onMounted(start);
onActivated(start);
onDeactivated(stop);
onBeforeUnmount(stop);

const precision = computed(() => {
  const value = props.precision ?? props.decimals;
  return value === undefined && typeof shown.value === "string"
    ? undefined
    : value !== undefined && Number.isFinite(value)
      ? Math.max(0, Math.min(20, Math.floor(value)))
      : 0;
});
function displayNumber() {
  const parsed = decimal(shown.value);
  if (!parsed) return String(shown.value);
  const digits = precision.value;
  const raw =
    digits === undefined
      ? decimalText(parsed)
      : decimalText(decimalRound(parsed, digits), digits);
  const [integer, fraction] = raw.split(".");
  const grouped = props.groupSeparator
    ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, () => props.groupSeparator!)
    : integer;
  return fraction === undefined
    ? grouped
    : grouped + props.decimalSeparator + fraction;
}
function displayCountdown() {
  let rest = milliseconds.value
    ? Math.floor(remaining.value)
    : Math.ceil(remaining.value / 1000) * 1000;
  const units = { D: 86400000, H: 3600000, m: 60000, s: 1000, S: 1 } as const;
  const parts = new Map<string, number>();
  for (const [token, unit] of Object.entries(units)) {
    if (
      !formatTokens.value.some(
        (part) =>
          part[0] === token && /^(D{1,2}|H{1,2}|m{1,2}|s{1,2}|SSS)$/.test(part),
      )
    )
      continue;
    parts.set(token, Math.floor(rest / unit));
    rest %= unit;
  }
  return formatTokens.value
    .map((token) => {
      if (token.startsWith("[") && token.endsWith("]"))
        return token.slice(1, -1);
      const value = parts.get(token[0]);
      return value === undefined
        ? token
        : String(value).padStart(token.length, "0");
    })
    .join("");
}
const countdown = computed(() => props.deadline !== undefined);
const displayValue = computed(() =>
  countdown.value ? displayCountdown() : displayNumber(),
);
const context = computed<HysAnimatedNumberContext>(() => ({
  value: countdown.value ? remaining.value : shown.value,
  displayValue: displayValue.value,
  remaining: countdown.value ? remaining.value : undefined,
}));
const RenderContent: FunctionalComponent<{ value: VNodeChild }> = ({ value }) =>
  value;
defineExpose({ displayValue, remaining });
</script>

<template>
  <span v-bind="skin" class="hys-ui-motion-number">
    <span v-if="title || slots.title" class="hys-ui-motion-number-title"
      ><slot name="title">{{ title }}</slot></span
    >
    <span
      class="hys-ui-motion-number-value"
      :style="valueStyle"
      :role="countdown ? 'timer' : undefined"
    >
      <span v-if="prefix || slots.prefix" class="hys-ui-motion-number-affix"
        ><slot name="prefix" v-bind="context">{{ prefix }}</slot></span
      >
      <slot name="formatter" v-bind="context">
        <RenderContent v-if="formatter" :value="formatter(context)" />
        <template v-else>{{ displayValue }}</template>
      </slot>
      <span v-if="suffix || slots.suffix" class="hys-ui-motion-number-affix"
        ><slot name="suffix" v-bind="context">{{ suffix }}</slot></span
      >
    </span>
  </span>
</template>

<style scoped>
.hys-ui-motion-number {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  vertical-align: middle;
}
.hys-ui-motion-number-title {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 0.85em;
}
.hys-ui-motion-number-value {
  display: inline-flex;
  align-items: baseline;
  gap: 0.2em;
  font-variant-numeric: tabular-nums;
}
</style>
