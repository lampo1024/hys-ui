<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type VNodeChild } from "vue";
import { useHysRootAttrs } from "../../config";
import type {
  HysNumberFormat,
  HysNumberValue,
} from "../../composables/animatedNumber";
import {
  createNumberPresentation,
  numberTrend,
} from "../../composables/animatedNumberFormat";
import { decimal, decimalCompare } from "../../composables/numberInput";
import { useMotion } from "../../motion/useMotion";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysAnimatedNumber from "../HysAnimatedNumber/HysAnimatedNumber.vue";
import { ArrowDown, ArrowUp, Info, Minus } from "../HysIcon/svgIcons";
import HysSkeleton from "../HysSkeleton/HysSkeleton.vue";

export interface HysStatisticTrend {
  /** 增加、减少或持平。 */
  direction: "up" | "down" | "flat";
  /** 业务计算后的趋势文本，例如 4.2%。 */
  text: string;
}
export interface HysStatisticProps {
  /** 指标名称，title 插槽优先。 */
  title?: string;
  /** 数值与标题的对齐方式，默认 start。 */
  align?: "start" | "center" | "end";
  /** 统计项密度，默认 md。 */
  size?: "sm" | "md" | "lg";
  /** 数字或十进制字符串，无效或缺失时显示占位。 */
  value?: HysNumberValue | null;
  /** 固定小数位数，范围 0–100，缺省保留有效精度。 */
  precision?: number;
  /** 数值之前的文字。 */
  prefix?: string;
  /** 数值之后的文字。 */
  suffix?: string;
  /** 千分位分组，默认 true。 */
  grouping?: boolean;
  /** 地区格式，例如 zh-CN，默认 zh-CN。 */
  locale?: string;
  /** 是否启用 HysAnimatedNumber 的数字过渡，默认 false。 */
  animated?: boolean;
  /** 趋势方向和文字。 */
  trend?: HysStatisticTrend;
  /** 加载时用骨架占位替代数值和趋势。 */
  loading?: boolean;
  /** 缺失值的占位文本，默认「—」。 */
  emptyText?: string;
  /** 自定义格式，接收当前值和默认格式文本。value 插槽优先。 */
  formatter?: (value: HysNumberValue, text: string) => string;
  /** 十进制、货币、百分比或科学计数法，默认 decimal。 */
  numberFormat?: HysNumberFormat;
  /** 货币格式使用的 ISO 4217 币种，默认 CNY。 */
  currency?: string;
  /** 百分比按比例或百分点读入。默认 ratio，0.42 显示为 42%。 */
  percentInput?: "ratio" | "points";
  /** 自动使用千/百万等英文短单位或万/亿等中文单位。 */
  compact?: "short" | "zh";
  /** 与当前值计算变化的基准。显式 trend 优先。 */
  comparisonValue?: HysNumberValue | null;
  /** 显示差值或相对基准的百分比。默认 relative。基准为零时显示差值。 */
  comparisonMode?: "absolute" | "relative";
  /** 趋势是否以数值减小为正向。默认 increase。 */
  positiveDirection?: "increase" | "decrease";
  /** 趋势说明，例如「同比」或「较上月」。 */
  comparisonLabel?: string;
  /** 指标口径说明，显示在标题旁的提示中。 */
  help?: string;
  /** 目标值，沿用指标的数值格式。 */
  target?: HysNumberValue;
  /** 数值小于等于下限或大于等于上限时标出阈值。 */
  thresholds?: { low?: HysNumberValue; high?: HysNumberValue };
  /** 有效数值变动时短暂高亮，遵从减少动态效果设置。 */
  highlightChanges?: boolean;
}

const props = withDefaults(defineProps<HysStatisticProps>(), {
  grouping: true,
  align: "start",
  size: "md",
  locale: "zh-CN",
  emptyText: "—",
  comparisonMode: "relative",
});
defineSlots<{
  /** 自定义标题。 */
  title?: () => VNodeChild;
  /** 自定义数值主体，前缀与后缀仍显示。 */
  value?: (scope: { value: HysNumberValue; text: string }) => VNodeChild;
  /** 数值及趋势之后的补充说明。 */
  footer?: () => VNodeChild;
  /** 替换趋势说明文字，可读取已计算的方向和格式。 */
  trend?: (scope: HysStatisticTrend) => VNodeChild;
}>();
const skin = useHysRootAttrs();
const numberValue = computed(() => decimal(props.value));
const valid = computed(() => !!numberValue.value);
const threshold = computed(() => {
  const value = numberValue.value;
  if (!value) return undefined;
  const low = decimal(props.thresholds?.low);
  const high = decimal(props.thresholds?.high);
  if (high && decimalCompare(value, high) >= 0) return { tone: "high", label: "达到上限" };
  if (low && decimalCompare(value, low) <= 0) return { tone: "low", label: "达到下限" };
  return undefined;
});
const targetText = computed(() => props.target === undefined || !decimal(props.target) ? "" : createNumberPresentation({
  locale: props.locale, grouping: props.grouping, numberFormat: props.numberFormat, currency: props.currency,
  percentInput: props.percentInput, precision: props.precision, compact: props.compact,
}).format(props.target).text);
const reading = ref<HTMLElement>();
const { effectiveMotion } = useMotion();
let highlight: Animation | undefined;
function clearHighlight() {
  highlight?.cancel();
  highlight = undefined;
}
watch([effectiveMotion, () => props.highlightChanges, () => props.loading], ([motion, enabled, loading]) => {
  if (motion === "off" || !enabled || loading) clearHighlight();
});
onBeforeUnmount(clearHighlight);
watch(numberValue, (next, old) => {
  if (!next || !old || decimalCompare(next, old) === 0 || !props.highlightChanges || effectiveMotion.value === "off") return;
  clearHighlight();
  highlight = reading.value?.animate?.([{ backgroundColor: "var(--hys-ui-theme-primary-soft)" }, { backgroundColor: "transparent" }], 550);
}, { flush: "post" });
const derivedTrend = computed<HysStatisticTrend | undefined>(() => {
  if (props.trend) return props.trend;
  if (props.comparisonValue == null || props.value == null) return;
  const change = numberTrend(props.comparisonValue, props.value);
  if (change.delta === null) return;
  const relative =
    props.comparisonMode === "relative" && change.percent !== null;
  const text = createNumberPresentation({
    locale: props.locale,
    grouping: props.grouping,
    numberFormat: relative ? "percent" : props.numberFormat,
    currency: props.currency,
    percentInput: relative ? "points" : props.percentInput,
    precision: relative ? 2 : props.precision,
    trimZeros: true,
    signDisplay: "exceptZero",
  }).format(relative ? change.percent! : change.delta).text;
  return {
    direction: change.direction === "none" ? "flat" : change.direction,
    text,
  };
});
const directions = {
  up: { text: "增加", icon: ArrowUp },
  down: { text: "减少", icon: ArrowDown },
  flat: { text: "持平", icon: Minus },
};
</script>

<template>
  <div v-bind="skin" class="hys-statistic" :data-align="align" :data-size="size" :aria-busy="loading || undefined">
    <div v-if="title || $slots.title || help" class="hys-statistic-title">
      <slot name="title">{{ title }}</slot>
      <HysTooltip v-if="help" :text="help" placement="top">
        <span class="hys-statistic-help" tabindex="0" :aria-label="help"><Info :size="14" aria-hidden="true" /></span>
      </HysTooltip>
    </div>
    <HysSkeleton
      v-if="loading"
      variant="rect"
      :width="130"
      :height="28"
      loading-text="正在加载指标"
    />
    <div v-else ref="reading" class="hys-statistic-reading">
      <HysAnimatedNumber
        v-if="valid"
        class="hys-statistic-value"
        :value="value!"
        :precision="precision"
        :prefix="prefix"
        :suffix="suffix"
        :locale="locale"
        :grouping="grouping"
        :number-format="numberFormat"
        :currency="currency"
        :percent-input="percentInput"
        :compact="compact"
        :animation-motion="animated ? undefined : 'off'"
      >
        <template
          v-if="formatter || $slots.value"
          #formatter="{ value: current, displayValue }"
        >
          <slot name="value" :value="current" :text="displayValue">{{
            formatter?.(current, displayValue)
          }}</slot>
        </template>
      </HysAnimatedNumber>
      <span v-else class="hys-statistic-empty">{{ emptyText }}</span>
      <span
        v-if="derivedTrend && valid"
        class="hys-statistic-trend"
        :data-direction="derivedTrend.direction"
        :data-tone="
          derivedTrend.direction === 'flat'
            ? 'neutral'
            : (derivedTrend.direction === 'down') ===
                (positiveDirection === 'decrease')
              ? 'positive'
              : 'negative'
        "
      >
        <component
          :is="directions[derivedTrend.direction].icon"
          :size="13"
          aria-hidden="true"
        />
        <slot name="trend" v-bind="derivedTrend"
          >{{ comparisonLabel || directions[derivedTrend.direction].text }}
          {{ derivedTrend.text }}</slot
        >
      </span>
    </div>
    <div v-if="!loading && (targetText || threshold)" class="hys-statistic-meta">
      <span v-if="targetText">目标 {{ targetText }}</span>
      <span v-if="threshold" class="hys-statistic-threshold" :data-tone="threshold.tone">{{ threshold.label }}</span>
    </div>
    <div v-if="$slots.footer" class="hys-statistic-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.hys-statistic[data-align="center"] { text-align: center; justify-items: center; }
.hys-statistic[data-align="end"] { text-align: end; justify-items: end; }
.hys-statistic[data-size="sm"] .hys-statistic-value { font-size: 20px; }
.hys-statistic[data-size="lg"] .hys-statistic-value { font-size: 34px; }
.hys-statistic {
  display: grid;
  gap: 6px;
  min-inline-size: 0;
  color: var(--hys-ui-theme-text);
  overflow-wrap: anywhere;
}
.hys-statistic-title,
.hys-statistic-footer {
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
.hys-statistic-title, .hys-statistic-meta { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.hys-statistic-help { display: inline-flex; cursor: help; }
.hys-statistic-meta { font-size: 12px; color: var(--hys-ui-theme-muted); }
.hys-statistic-threshold[data-tone="high"] { color: var(--hys-ui-theme-red); }
.hys-statistic-threshold[data-tone="low"] { color: var(--hys-ui-theme-orange); }
.hys-statistic-reading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  min-inline-size: 0;
}
.hys-statistic-value,
.hys-statistic-empty {
  min-inline-size: 0;
  font-size: 26px;
  font-weight: 650;
  line-height: 1.2;
}
.hys-statistic-value :deep(.hys-ui-motion-number-value) {
  max-inline-size: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
}
.hys-statistic-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.hys-statistic-trend[data-tone="positive"] {
  color: var(--hys-ui-theme-green);
}
.hys-statistic-trend[data-tone="negative"] {
  color: var(--hys-ui-theme-red);
}
.hys-statistic-trend[data-direction="flat"] {
  color: var(--hys-ui-theme-muted);
}
</style>
