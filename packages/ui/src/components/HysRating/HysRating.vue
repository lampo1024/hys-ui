<script setup lang="ts">
import {
  computed,
  inject,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  toRaw,
  useAttrs,
  useId,
  watch,
} from "vue";
import { Star } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import { fieldKey, useHysControlState } from "../../composables/formContext";
import {
  useChoiceModel,
  useChoiceNativeReset,
} from "../../composables/choiceModel";
import {
  ratingLevel,
  type HysRatingIcon,
  type HysRatingLevels,
} from "../../composables/rating";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: number | null;
    defaultValue?: number;
    max?: number;
    count?: number;
    size?: "sm" | "md" | "lg";
    iconSize?: number;
    readonly?: boolean;
    disabled?: boolean;
    allowClear?: boolean;
    clearable?: boolean;
    allowHalf?: boolean;
    showScore?: boolean;
    showText?: boolean;
    texts?: readonly string[];
    scoreTemplate?: string;
    formatScore?: (value: number) => string;
    textColor?: string;
    color?: string;
    colors?: HysRatingLevels<string>;
    lowThreshold?: number;
    highThreshold?: number;
    voidColor?: string;
    disabledVoidColor?: string;
    icon?: HysRatingIcon;
    icons?: HysRatingLevels<HysRatingIcon>;
    voidIcon?: HysRatingIcon;
    disabledVoidIcon?: HysRatingIcon;
    character?: string;
    tooltips?: readonly string[];
    hoverValue?: number | null;
    keyboard?: boolean;
    autofocus?: boolean;
    focusable?: boolean;
    ariaLabel?: string;
    formatValueText?: (value: number, max: number) => string;
    name?: string;
    form?: string;
    status?: "error" | "warning" | "success";
    error?: string;
  }>(),
  {
    defaultValue: 0,
    allowClear: true,
    clearable: undefined,
    keyboard: true,
    focusable: true,
    lowThreshold: 2,
    highThreshold: 4,
    scoreTemplate: "{value}",
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: number];
  change: [value: number];
  clear: [];
  "update:hoverValue": [value: number | null];
  hoverChange: [value: number | null];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  keydown: [event: KeyboardEvent];
}>();
const root = ref<HTMLElement>(),
  attrs = useAttrs(),
  skin = useHysRootAttrs(),
  field = inject(fieldKey, undefined),
  id = useId(),
  { disabled, size, label } = useHysControlState(props),
  localHover = ref<number | null>(null);
const total = computed(() => {
  const value = props.max ?? props.count ?? 5;
  return Number.isFinite(value)
    ? Math.min(1000, Math.max(0, Math.floor(value)))
    : 5;
});
const normalize = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(total.value, value))
    : 0;
const model = useChoiceModel(props, () => props.defaultValue),
  current = computed(() => normalize(model.current.value)),
  hover = computed(() =>
    props.hoverValue === undefined ? localHover.value : props.hoverValue,
  ),
  display = computed(() =>
    disabled.value || props.readonly || hover.value === null
      ? current.value
      : normalize(hover.value),
  ),
  canClear = computed(() => props.clearable ?? props.allowClear);
const status = computed(() =>
  props.error || field?.invalid?.value
    ? "error"
    : (props.status ?? field?.status?.value),
);
const activeColor = computed(
  () =>
    props.color ??
    ratingLevel(
      props.colors,
      display.value,
      props.lowThreshold,
      props.highThreshold,
      "var(--hys-ui-rating-fill-color,#f5ad36)",
    ),
);
const activeIcon = computed(() =>
    ratingLevel(
      props.icons,
      display.value,
      props.lowThreshold,
      props.highThreshold,
      props.icon ?? Star,
    ),
  ),
  emptyIcon = computed(() =>
    disabled.value
      ? (props.disabledVoidIcon ?? props.voidIcon ?? props.icon ?? Star)
      : (props.voidIcon ?? props.icon ?? Star),
  );
const score = computed(() => {
  try {
    return props.formatScore
      ? props.formatScore(display.value)
      : props.scoreTemplate.replaceAll("{value}", String(display.value));
  } catch {
    return String(display.value);
  }
});
const description = computed(() =>
  props.showScore
    ? score.value
    : props.showText
      ? (props.texts?.[Math.ceil(display.value) - 1] ?? "")
      : "",
);
const valueText = computed(() => {
  try {
    return (
      props.formatValueText?.(current.value, total.value) ??
      current.value + " / " + total.value
    );
  } catch {
    return current.value + " / " + total.value;
  }
});
function preview(value: number | null) {
  if (value !== null && (disabled.value || props.readonly || !model.isLive()))
    return;
  const next = value === null ? null : normalize(value);
  if (
    localHover.value === next &&
    (props.hoverValue === undefined || props.hoverValue === next)
  )
    return;
  localHover.value = next;
  emit("update:hoverValue", next);
  emit("hoverChange", next);
}
function resetPreview() {
  preview(null);
}
async function setValue(value: number) {
  if (
    disabled.value ||
    props.readonly ||
    !model.isLive() ||
    !Number.isFinite(value) ||
    !total.value
  )
    return false;
  const step = props.allowHalf ? 0.5 : 1,
    next = normalize(Math.round(value / step) * step);
  return model.commit(
    next,
    (value) => emit("update:modelValue", value as number),
    (value) => emit("change", value as number),
    true,
  );
}
async function clear() {
  if (!canClear.value) return false;
  const accepted = await setValue(0);
  if (accepted) emit("clear");
  return accepted;
}
function focus(options?: FocusOptions) {
  if (!disabled.value && props.focusable) root.value?.focus(options);
}
function blur() {
  if (root.value?.contains(document.activeElement))
    (document.activeElement as HTMLElement)?.blur();
}
function point(event: MouseEvent, n: number) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect(),
    rtl = root.value && getComputedStyle(root.value).direction === "rtl",
    fraction = rect.width ? (event.clientX - rect.left) / rect.width : 1;
  return props.allowHalf && (rtl ? fraction > 0.5 : fraction < 0.5)
    ? n - 0.5
    : n;
}
function choose(event: MouseEvent, n: number) {
  if (disabled.value || props.readonly) return;
  focus({ preventScroll: true });
  const next = point(event, n);
  if (canClear.value && next === current.value) void clear();
  else void setValue(next);
}
function key(event: KeyboardEvent) {
  emit("keydown", event);
  if (
    event.defaultPrevented ||
    !props.keyboard ||
    disabled.value ||
    props.readonly ||
    event.target !== root.value
  )
    return;
  const rtl = root.value && getComputedStyle(root.value).direction === "rtl",
    up =
      event.key === "ArrowUp" ||
      event.key === (rtl ? "ArrowLeft" : "ArrowRight"),
    down =
      event.key === "ArrowDown" ||
      event.key === (rtl ? "ArrowRight" : "ArrowLeft");
  if (up || down || event.key === "Home" || event.key === "End") {
    event.preventDefault();
    resetPreview();
    void setValue(
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? total.value
          : current.value + (up ? 1 : -1) * (props.allowHalf ? 0.5 : 1),
    );
  } else if (
    canClear.value &&
    (event.key === "Delete" || event.key === "Backspace")
  ) {
    event.preventDefault();
    resetPreview();
    void clear();
  }
}
watch([disabled, () => props.readonly, total], resetPreview);
useChoiceNativeReset(
  root,
  () => {
    model.reset();
    resetPreview();
  },
  undefined,
  () => props.form,
);
onMounted(() => {
  if (props.autofocus) focus();
});
onDeactivated(resetPreview);
onBeforeUnmount(resetPreview);
defineExpose({
  element: root,
  value: current,
  hoverValue: hover,
  focus,
  blur,
  setValue,
  clear,
  setCurrentValue: (value: number) => preview(value),
  resetCurrentValue: resetPreview,
});
</script>
<template>
  <div
    ref="root"
    v-bind="{ ...skin, ...attrs }"
    :id="(attrs.id as string) || field?.id.value"
    data-hys-ui-field-managed
    class="hys-ui-ex-rating"
    :class="[
      'hys-ui-rating-' + size,
      {
        'hys-ui-rating-disabled': disabled,
        'hys-ui-rating-readonly': readonly,
      },
    ]"
    :data-status="status"
    :style="{
      '--hys-ui-rating-size':
        iconSize && Number.isFinite(iconSize)
          ? Math.max(8, Math.min(128, iconSize)) + 'px'
          : undefined,
    }"
    role="slider"
    :tabindex="disabled || !focusable || !total ? -1 : 0"
    :aria-label="
      ariaLabel || (attrs['aria-label'] as string) || label || '评分'
    "
    :aria-valuenow="current"
    :aria-valuemin="0"
    :aria-valuemax="total"
    :aria-valuetext="valueText"
    :aria-readonly="readonly || undefined"
    :aria-disabled="disabled || undefined"
    :aria-required="field?.required.value || undefined"
    :aria-invalid="status === 'error' || undefined"
    :aria-describedby="
      [
        attrs['aria-describedby'],
        error ? id + '-error' : field?.describedBy.value,
      ]
        .filter(Boolean)
        .join(' ') || undefined
    "
    @keydown="key"
    @mouseleave="resetPreview"
    @focus="emit('focus', $event)"
    @blur="
      resetPreview();
      emit('blur', $event);
    "
  >
    <button
      v-for="n in total"
      :key="n"
      type="button"
      tabindex="-1"
      :disabled="disabled"
      :aria-disabled="readonly || undefined"
      :aria-label="n + ' 星'"
      :title="tooltips?.[n - 1]"
      :class="{
        'hys-ui-active': n <= display,
        'hys-ui-rating-half': display > n - 1 && display < n,
      }"
      @mousedown.prevent
      @mousemove="preview(point($event, n))"
      @click="choose($event, n)"
    >
      <span class="hys-ui-rating-figure" aria-hidden="true"
        ><span
          class="hys-ui-rating-void"
          :style="{
            color: disabled ? (disabledVoidColor ?? voidColor) : voidColor,
            '--hys-ui-rating-part':
              Math.max(0, Math.min(1, display - n + 1)) * 100 + '%',
          }"
          ><slot
            name="character"
            :value="n"
            :index="n - 1"
            :fraction="Math.max(0, Math.min(1, display - n + 1))"
            :filled="false"
            ><span v-if="character">{{ character }}</span
            ><component v-else :is="toRaw(emptyIcon)" /></slot></span
        ><span
          class="hys-ui-rating-fill"
          :class="{ 'hys-ui-rating-default-fill': toRaw(activeIcon) === Star }"
          :style="{
            width: Math.max(0, Math.min(1, display - n + 1)) * 100 + '%',
            color: activeColor,
          }"
          ><span
            ><slot
              name="character"
              :value="n"
              :index="n - 1"
              :fraction="Math.max(0, Math.min(1, display - n + 1))"
              :filled="true"
              ><span v-if="character">{{ character }}</span
              ><component v-else :is="toRaw(activeIcon)" /></slot></span></span
      ></span>
    </button>
    <span
      v-if="showText || showScore || $slots.text"
      class="hys-ui-rating-score"
      :style="{ color: textColor }"
      ><slot name="text" :value="display" :text="description">{{
        description
      }}</slot></span
    >
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :form="form"
      :value="current"
      :disabled="disabled"
    />
    <small
      v-if="error"
      :id="id + '-error'"
      class="hys-ui-rating-error"
      role="alert"
      >{{ error }}</small
    >
  </div>
</template>
<style scoped>
.hys-ui-ex-rating {
  width: max-content;
  --hys-ui-rating-size: 20px;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  border-radius: 5px;
  outline: none;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  vertical-align: middle;
}
.hys-ui-ex-rating:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 3px;
}
.hys-ui-ex-rating button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border: 0;
  background: none;
  padding: 3px;
  color: inherit;
  cursor: pointer;
  line-height: 1;
  outline: none;
  border-radius: 4px;
  touch-action: manipulation;
}
.hys-ui-rating-figure {
  display: inline-flex;
  position: relative;
  font-size: var(--hys-ui-rating-size);
  line-height: 1.15;
}
.hys-ui-rating-figure :deep(svg) {
  display: block;
  width: var(--hys-ui-rating-size);
  height: var(--hys-ui-rating-size);
  stroke-width: 1.6;
  flex: none;
}
.hys-ui-rating-void {
  clip-path: inset(0 0 0 var(--hys-ui-rating-part, 0%));
  display: inline-flex;
  color: var(--hys-ui-rating-void-color, #cbd5e1);
}
.hys-ui-rating-fill {
  display: block;
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  overflow: hidden;
  pointer-events: none;
}
.hys-ui-rating-figure:dir(rtl) > .hys-ui-rating-void {
  clip-path: inset(0 var(--hys-ui-rating-part, 0%) 0 0);
}
.hys-ui-rating-fill > span {
  display: inline-flex;
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  white-space: nowrap;
}
.hys-ui-rating-default-fill :deep(svg) {
  fill: currentColor;
}
.hys-ui-rating-sm {
  --hys-ui-rating-size: 16px;
  gap: 2px;
}
.hys-ui-rating-lg {
  --hys-ui-rating-size: 28px;
  gap: 6px;
}
.hys-ui-rating-disabled {
  opacity: 0.55;
}
.hys-ui-rating-disabled button {
  cursor: not-allowed;
}
.hys-ui-rating-readonly button {
  cursor: default;
}
.hys-ui-rating-score {
  font-size: 13px;
  color: var(
    --hys-ui-rating-text-color,
    var(--hys-ui-muted, var(--hys-ui-theme-muted))
  );
  margin-inline-start: 8px;
}
.hys-ui-rating-error {
  flex-basis: 100%;
  color: var(--hys-ui-danger, #e5484d);
  font-size: 12px;
  margin-top: 4px;
}
.hys-ui-ex-rating[data-status="error"]:focus-visible {
  outline-color: var(--hys-ui-danger, #e5484d);
}
</style>
