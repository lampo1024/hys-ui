<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import {
  createHysNumberSequence,
  HysAnimatedNumber,
  HysBadge,
  HysButton,
  HysChart,
  HysCheckbox,
  HysProgress,
  useHysNumberAnimationGroup,
  type HysAnimatedNumberInstance,
  type HysNumberAnimation,
  type HysNumberAnimationEntry,
  type HysNumberDigitAnimations,
  type HysNumberEasing,
  type HysNumberValue,
} from "hys-ui";
import { Award } from "lucide-vue-next";
import { numberAnimationSample } from "./samples";

const props = defineProps<{
  entry?: HysNumberAnimationEntry;
  animation: HysNumberAnimation;
  duration: number;
  intensity: number;
  mode: "full" | "simplified" | "off";
  easing: HysNumberEasing;
  digitAnimations?: HysNumberDigitAnimations;
}>();
const primary = useTemplateRef<HysAnimatedNumberInstance>("primary");
const sequenceItems =
  useTemplateRef<HysAnimatedNumberInstance[]>("sequenceItems");
const group = useHysNumberAnimationGroup(() => sequenceItems.value ?? []);
const sample = computed(() => numberAnimationSample(props.entry));
const isSequence = computed(() => props.entry?.category === "sequence");
const variant = computed(() => props.entry?.variant ?? 0);
const current = ref<HysNumberValue>(sample.value.from);
const value = ref<HysNumberValue>(sample.value.to);
const runs = ref(0);
const clock = ref<number>();
const live = ref(false);
let feed: ReturnType<typeof setInterval> | undefined;
const dataCase = (index: number) =>
  props.entry?.category === "data" && variant.value === index;
const specialCase = (index: number) =>
  props.entry?.category === "special" && variant.value === index;
const sequence = computed(() =>
  createHysNumberSequence(props.entry?.name ?? "", 6, {
    duration: props.duration,
    interval: Math.round(props.duration * 0.16),
    columns: 3,
    seed: 17 + runs.value,
  }),
);
const reduceVisual = computed(() => props.mode !== "full" || !props.intensity);
const level = computed(() =>
  Math.max(0, Math.min(100, Number(current.value) || 0)),
);
const chart = computed(() => [
  { label: "上期", value: Number(sample.value.from) },
  { label: "本期", value: Number(current.value) },
  { label: "目标", value: 100 },
]);
const ranking = computed(() =>
  [
    { id: "华东", value: Number(current.value) },
    { id: "华北", value: 680 },
    { id: "华南", value: 570 },
  ].sort((a, b) => b.value - a.value),
);
const liveCase = computed(() => dataCase(28) || dataCase(29));
const richTrend = computed(
  () =>
    props.entry?.category === "data" &&
    variant.value >= 8 &&
    variant.value <= 15,
);
const awardText = computed(() =>
  specialCase(6)
    ? "成就已解锁"
    : specialCase(12)
      ? "奖牌已获得"
      : specialCase(13)
        ? "徽章已点亮"
        : "里程碑达成",
);
const dataStatus = computed(() => {
  if (dataCase(13) && level.value >= 80) return "已超过 80% 阈值";
  if (dataCase(14) && level.value >= 100) return "目标已达成";
  if (dataCase(15) && Number(current.value) > 100)
    return `超额 ${Math.round(Number(current.value) - 100)}%`;
  if (dataCase(25) && level.value < 60) return "低于预警线 60%";
  if (dataCase(26) && ended.value) return "达到峰值";
  if (dataCase(27) && ended.value) return "达到低谷";
  return "";
});
const ended = ref(false);

function cancelFeed() {
  clearInterval(feed);
  feed = undefined;
  live.value = false;
}

watch(
  () => props.entry?.name,
  () => {
    cancelFeed();
    current.value = sample.value.from;
    value.value = sample.value.to;
    clock.value = undefined;
    runs.value = 0;
    ended.value = false;
  },
);
watch(live, (enabled) => {
  clearInterval(feed);
  if (enabled)
    feed = setInterval(() => {
      value.value =
        Number(value.value) +
        (dataCase(28) ? [12.37, -7.82, 24.17, -3.45][runs.value++ % 4] : 24);
    }, 450);
});
onBeforeUnmount(cancelFeed);
onDeactivated(cancelFeed);

async function play() {
  runs.value++;
  ended.value = false;
  if (specialCase(0)) {
    clock.value = Date.now() + 43198000;
    return;
  }
  if (specialCase(2) || specialCase(3)) {
    const draw = Math.imul(runs.value + 37, 0x9e3779b1) >>> 0;
    value.value = specialCase(2)
      ? 100000 + (draw % 900000)
      : 1000 + (draw % 9000);
  }
  if (liveCase.value)
    value.value = Number(value.value) + (dataCase(28) ? 36.22 : 36);
  if (!live.value) current.value = sample.value.from;
  await nextTick();
  if (isSequence.value) group.restart();
  else primary.value?.restart();
}
</script>

<template>
  <div class="sample" :data-reduced="reduceVisual || undefined">
    <div class="sample-preview">
      <TransitionGroup
        v-if="isSequence"
        tag="div"
        name="sample-rank"
        class="sequence"
      >
        <HysAnimatedNumber
          v-for="step in sequence"
          :key="step.index"
          ref="sequenceItems"
          :from="step.reverse ? 94 + step.index : 20 + step.index"
          :value="step.reverse ? 20 + step.index : 94 + step.index"
          trigger="manual"
          :delay="step.delay"
          :duration="step.duration"
          :easing="easing"
          :animation="animation"
          :digit-animations="digitAnimations"
          :animation-motion="mode"
          :motion-intensity="intensity"
        />
      </TransitionGroup>
      <template v-else>
        <HysAnimatedNumber
          :key="
            entry?.category === 'data' || entry?.category === 'special'
              ? entry.name
              : 'visual'
          "
          ref="primary"
          class="sample-number"
          :trigger="liveCase ? 'update' : 'manual'"
          :from="sample.from"
          :value="value"
          :duration="duration"
          :easing="easing"
          :animation="animation"
          :digit-animations="digitAnimations"
          :animation-motion="mode"
          :motion-intensity="intensity"
          :deadline="clock"
          format="HH:mm:ss"
          :number-format="
            sample.currency && !dataCase(3)
              ? 'currency'
              : sample.percent
                ? 'percent'
                : 'decimal'
          "
          percent-input="points"
          :precision="sample.precision ?? (sample.currency ? 2 : 0)"
          :sign-display="sample.sign ? 'always' : 'auto'"
          :suffix="sample.suffix"
          group-separator=","
          stable-width
          @update="current = $event.value"
          @end="ended = true"
        >
          <template v-if="dataCase(3)" #prefix>
            <Transition name="sample-currency" mode="out-in">
              <span :key="runs % 2">{{ runs % 2 ? "$" : "¥" }}</span>
            </Transition>
          </template>
          <template v-if="richTrend" #trend="{ direction, delta, percent }">
            <small v-if="runs" class="sample-trend">
              {{ direction === "down" ? "↓" : "↑" }} {{ delta }}
              <template v-if="percent !== null">
                · {{ Number(percent).toFixed(1) }}%</template
              >
            </small>
          </template>
        </HysAnimatedNumber>
        <HysProgress
          v-if="
            sample.view === 'bar' ||
            sample.view === 'ring' ||
            sample.view === 'gauge'
          "
          :type="
            sample.view === 'bar'
              ? 'line'
              : sample.view === 'ring'
                ? 'circle'
                : 'dashboard'
          "
          :value="level"
          size="sm"
          :width="sample.view === 'bar' ? '100%' : 74"
          aria-label="当前进度"
          :animated="false"
        />
        <div
          v-if="sample.view === 'gauge'"
          class="sample-gauge"
          aria-hidden="true"
        >
          <i :style="{ transform: `rotate(${level * 1.8 - 90}deg)` }" />
        </div>
        <HysChart
          v-if="sample.view === 'line' || sample.view === 'chart'"
          :type="sample.view === 'line' ? 'line' : 'bar'"
          :height="92"
          :data="chart"
        />
        <TransitionGroup
          v-if="sample.view === 'rank'"
          tag="ol"
          name="sample-rank"
          class="sample-ranking"
        >
          <li v-for="row in ranking" :key="row.id">
            <span>{{ row.id }}</span
            ><strong>{{ Math.round(row.value) }}</strong>
          </li>
        </TransitionGroup>
        <div
          v-if="
            sample.view === 'battery' ||
            sample.view === 'thermometer' ||
            sample.view === 'water' ||
            sample.view === 'scale'
          "
          class="sample-meter"
          :data-view="sample.view"
          role="meter"
          aria-label="当前刻度"
          :aria-valuenow="level"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span :style="{ '--level': level + '%' }" />
        </div>
        <HysBadge v-if="sample.view === 'award' && ended" tone="green">
          <Award :size="14" aria-hidden="true" />{{ awardText }}
        </HysBadge>
        <HysBadge v-if="dataStatus" :tone="dataCase(25) ? 'red' : 'blue'">{{
          dataStatus
        }}</HysBadge>
      </template>
    </div>
    <div class="demo-control-actions">
      <HysButton size="sm" @click="play">播放示例</HysButton>
      <HysButton
        v-if="isSequence"
        size="sm"
        variant="secondary"
        @click="group.pause()"
        >暂停整组</HysButton
      >
      <HysButton
        v-if="isSequence"
        size="sm"
        variant="secondary"
        @click="group.resume()"
        >继续整组</HysButton
      >
      <HysCheckbox v-if="liveCase" v-model="live" label="连续推送" />
    </div>
  </div>
</template>

<style scoped>
.sample {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.sample-preview {
  position: relative;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 12px;
  min-height: 9rem;
  padding: 20px 16px;
  min-width: 0;
  overflow: clip;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: var(--docs-bg);
}
.sample-number {
  font-size: clamp(1.7rem, 5vw, 2.85rem);
  font-weight: 680;
  --hys-number-align: center;
}
.sample-trend {
  font-size: 0.78rem;
  color: var(--docs-muted);
}
.sample-preview :deep(.hys-ui-ent-panel) {
  width: min(100%, 30rem);
}
.sample-ranking {
  display: grid;
  gap: 6px;
  width: min(100%, 18rem);
  margin: 0;
  padding-inline-start: 1.3rem;
}
.sample-ranking li {
  padding: 5px 0;
  border-bottom: 1px solid var(--docs-border);
}
.sample-ranking strong {
  float: inline-end;
  font-variant-numeric: tabular-nums;
}
.sequence {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: min(100%, 23rem);
}
.sequence > span {
  min-width: 0;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--docs-border);
  border-radius: 7px;
  background: var(--docs-surface);
  font-size: 1.5rem;
  font-weight: 650;
}
.sample-rank-move {
  transition: transform 0.38s ease;
}
.sample-currency-enter-active,
.sample-currency-leave-active {
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}
.sample-currency-enter-from {
  transform: translateY(0.45em) rotateX(-65deg);
  opacity: 0;
}
.sample-currency-leave-to {
  transform: translateY(-0.45em) rotateX(65deg);
  opacity: 0;
}
.sample-gauge {
  position: relative;
  width: 90px;
  height: 8px;
  margin-top: -38px;
  margin-bottom: 30px;
  pointer-events: none;
}
.sample-gauge i {
  position: absolute;
  left: 44px;
  bottom: 0;
  width: 2px;
  height: 31px;
  background: currentColor;
  transform-origin: bottom;
}
.sample-meter {
  width: min(100%, 13rem);
  height: 17px;
  padding: 2px;
  border: 1px solid var(--docs-border);
  border-radius: 5px;
}
.sample-meter span {
  display: block;
  width: var(--level);
  height: 100%;
  border-radius: inherit;
  background: var(--hys-ui-theme-primary, #3168f5);
}
.sample-meter[data-view="battery"] {
  border-width: 2px;
}
.sample-meter[data-view="thermometer"] {
  border-radius: 999px;
}
.sample-meter[data-view="thermometer"] span {
  background: #e57054;
}
.sample-meter[data-view="water"] {
  position: relative;
  width: 78px;
  height: 42px;
  overflow: hidden;
}
.sample-meter[data-view="water"] span {
  position: absolute;
  inset: auto 0 0;
  width: 100%;
  height: var(--level);
  opacity: 0.62;
}
.sample-meter[data-view="scale"] {
  background: repeating-linear-gradient(
    90deg,
    transparent 0 8px,
    var(--docs-border) 8px 9px
  );
}
[data-reduced] .sample-rank-move,
[data-reduced] .sample-currency-enter-active,
[data-reduced] .sample-currency-leave-active {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .sample-rank-move,
  .sample-currency-enter-active,
  .sample-currency-leave-active {
    transition: none;
  }
}
</style>
