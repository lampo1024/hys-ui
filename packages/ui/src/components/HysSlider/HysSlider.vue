<script setup lang="ts" generic="T extends HysSliderValue = number">
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  useAttrs,
  useId,
  watch,
} from "vue";
import HysNumberInput from "../HysNumberInput/HysNumberInput.vue";
import {
  fieldKey,
  formKey,
  useHysControlState,
} from "../../composables/formContext";
import {
  decimal,
  decimalAdd,
  decimalText,
  normalizeDecimal,
} from "../../composables/numberInput";
import type {
  HysSliderValue,
  HysSliderStep,
  HysSliderMarks,
  HysSliderDragInfo,
} from "../../composables/slider";
import { useHysRootAttrs } from "../../config";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: T;
    defaultValue?: T;
    range?: boolean;
    min?: number;
    max?: number;
    step?: HysSliderStep;
    disabled?: boolean;
    readonly?: boolean;
    label?: string;
    ariaLabel?: string;
    rangeStartLabel?: string;
    rangeEndLabel?: string;
    showValue?: boolean;
    marks?: HysSliderMarks;
    formatTooltip?: (value: number) => string | number | null;
    formatValueText?: (value: number) => string;
    showTooltip?: boolean;
    tooltipVisible?: boolean;
    tooltipPlacement?: "top" | "bottom" | "left" | "right";
    showStops?: boolean;
    maxStops?: number;
    included?: boolean;
    reverse?: boolean;
    vertical?: boolean;
    height?: number | string;
    size?: "sm" | "md" | "lg";
    keyboard?: boolean;
    draggableTrack?: boolean;
    showInput?: boolean;
    showInputControls?: boolean;
    name?: string;
    tabindex?: number;
    autofocus?: boolean;
    status?: "error" | "warning" | "success";
    error?: string;
  }>(),
  {
    range: undefined,
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    showTooltip: true,
    tooltipVisible: undefined,
    tooltipPlacement: "top",
    maxStops: 200,
    included: true,
    height: 200,
    keyboard: true,
    showInputControls: true,
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: T];
  input: [value: T];
  change: [value: T];
  dragStart: [value: T, info: HysSliderDragInfo];
  dragEnd: [value: T, info: HysSliderDragInfo];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const {
    disabled: inheritedDisabled,
    size,
    label: fieldLabel,
  } = useHysControlState(props),
  field = inject(fieldKey, undefined),
  form = inject(formKey, undefined),
  attrs = useAttrs(),
  hysRootAttrs = useHysRootAttrs(),
  labelId = useId(),
  errorId = useId(),
  controlId = useId();
const root = ref<HTMLElement>(),
  rail = ref<HTMLElement>(),
  thumbs = ref<HTMLElement[]>([]),
  local = shallowRef<HysSliderValue>(
    props.defaultValue ?? (props.range ? [props.min, props.max] : props.min),
  ),
  draft = shallowRef<number[]>();
const current = computed<HysSliderValue>(() =>
    props.modelValue === undefined ? local.value : props.modelValue,
  ),
  isRange = computed(() => props.range ?? Array.isArray(current.value)),
  minimum = computed(() => (Number.isFinite(props.min) ? props.min : 0)),
  maximum = computed(() =>
    Number.isFinite(props.max)
      ? Math.max(minimum.value, props.max)
      : Math.max(minimum.value, 100),
  );
const markItems = computed(() =>
  Object.entries(props.marks ?? {})
    .map(([key, item]) => ({
      value: Number(key),
      label: typeof item === "string" ? item : item.label,
      style: typeof item === "string" ? undefined : item.style,
    }))
    .filter(
      (item) =>
        Number.isFinite(item.value) &&
        item.value >= minimum.value &&
        item.value <= maximum.value,
    )
    .sort((a, b) => a.value - b.value),
);
const markStep = computed(() => props.step === "mark" || props.step === null),
  safeStep = computed(() =>
    typeof props.step === "number" &&
    Number.isFinite(props.step) &&
    props.step > 0
      ? props.step
      : 1,
  );
const badRange = computed(
    () =>
      props.max < minimum.value ||
      maximum.value <= minimum.value ||
      (markStep.value && !markItems.value.length),
  ),
  disabled = computed(() => inheritedDisabled.value || badRange.value),
  mutable = computed(() => !disabled.value && !props.readonly);
const status = computed(() =>
  props.error || props.status === "error" || field?.invalid?.value
    ? "error"
    : (props.status ?? field?.status?.value),
);
function snap(value: number) {
  const n = Number.isFinite(value)
    ? Math.max(minimum.value, Math.min(maximum.value, value))
    : minimum.value;
  if (markStep.value) {
    let best = markItems.value[0]?.value ?? minimum.value;
    for (const item of markItems.value)
      if (Math.abs(item.value - n) < Math.abs(best - n)) best = item.value;
    return best;
  }
  if (n === maximum.value) return n;
  const grid = normalizeDecimal(decimal(n)!, {
    step: decimal(safeStep.value)!,
    base: decimal(minimum.value)!,
    min: decimal(minimum.value),
    max: decimal(maximum.value),
    strict: true,
  });
  const nearest = grid ? Number(decimalText(grid)) : minimum.value;
  return Math.abs(maximum.value - n) < Math.abs(nearest - n)
    ? maximum.value
    : nearest;
}
function normalize(value: HysSliderValue): number[] {
  const raw = Array.isArray(value) ? value : [value];
  if (!isRange.value) return [snap(raw[0])];
  const pair = [snap(raw[0]), snap(raw[1] ?? maximum.value)].sort(
    (a, b) => a - b,
  );
  return pair;
}
const canonical = computed(() => normalize(current.value)),
  values = computed(() => draft.value ?? canonical.value),
  dragging = ref(false),
  focused = ref<number>(),
  hovered = ref<number>(),
  dragIndex = ref(0),
  trackDrag = ref(false);
let live = true,
  epoch = 0,
  revision = 0,
  expected: number[] | undefined,
  frame: number | undefined,
  point: { x: number; y: number } | undefined,
  box: DOMRect | undefined,
  pointerId: number | undefined,
  removeListeners: (() => void) | undefined,
  starting: number[] = [],
  startPoint = 0;
const same = (a: number[], b: number[]) =>
  a.length === b.length && a.every((item, index) => item === b[index]);
const valueOf = (items: number[]) =>
  (isRange.value ? [items[0], items[1]] : items[0]) as T;
const rootAttrs = () =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => key !== "id" && !key.startsWith("aria-"),
    ),
  );
function thumbLabel(index: number) {
  const text =
    props.ariaLabel ||
    (attrs["aria-label"] as string) ||
    props.label ||
    fieldLabel.value ||
    "数值";
  return isRange.value
    ? index === 0
      ? props.rangeStartLabel || text + "下限"
      : props.rangeEndLabel || text + "上限"
    : text;
}
function tooltip(value: number) {
  try {
    return props.formatTooltip ? props.formatTooltip(value) : String(value);
  } catch {
    return String(value);
  }
}
function valueText(value: number) {
  try {
    return props.formatValueText?.(value) ?? String(tooltip(value) ?? value);
  } catch {
    return String(value);
  }
}
const fraction = (value: number) =>
  maximum.value === minimum.value
    ? 0
    : Math.max(
        0,
        Math.min(1, (value - minimum.value) / (maximum.value - minimum.value)),
      );
const position = (value: number) =>
  100 * (props.reverse ? 1 - fraction(value) : fraction(value));
const offset = (value: number) =>
  props.vertical
    ? { bottom: position(value) + "%" }
    : { left: position(value) + "%" };
const selection = computed(() => {
  const first = position(isRange.value ? values.value[0] : minimum.value),
    last = position(values.value[isRange.value ? 1 : 0]);
  return props.vertical
    ? {
        bottom: Math.min(first, last) + "%",
        height: Math.abs(last - first) + "%",
      }
    : {
        left: Math.min(first, last) + "%",
        width: Math.abs(last - first) + "%",
      };
});
const stops = computed(() => {
  if (!props.showStops) return [];
  if (markStep.value) return markItems.value.map((item) => item.value);
  const count = Math.floor((maximum.value - minimum.value) / safeStep.value),
    limit = Math.max(2, Math.min(1000, Math.floor(props.maxStops || 200))),
    stride = Math.max(1, Math.ceil(count / limit)),
    result: number[] = [];
  for (let index = 1; index < count && result.length < limit; index += stride)
    result.push(
      Number(
        decimalText(
          decimalAdd(decimal(minimum.value)!, decimal(safeStep.value)!, index),
        ),
      ),
    );
  return result;
});
function publish(next: number[]) {
  if (!live || !mutable.value || same(next, values.value)) return false;
  draft.value = next;
  expected = next;
  const ticket = ++revision;
  if (props.modelValue === undefined) local.value = valueOf(next);
  emit("update:modelValue", valueOf(next));
  emit("input", valueOf(next));
  void nextTick(() => {
    if (!live || ticket !== revision) return;
    if (!same(canonical.value, next) || !dragging.value)
      draft.value = undefined;
    expected = undefined;
  });
  return true;
}
function commit(previous: number[]) {
  const ticket = epoch;
  void nextTick(() => {
    if (
      live &&
      ticket === epoch &&
      mutable.value &&
      !same(canonical.value, previous)
    )
      emit("change", valueOf(canonical.value));
  });
}
function setAt(index: number, value: number) {
  const next = [...values.value];
  next[index] = Math.max(
    index === 1 ? next[0] : minimum.value,
    Math.min(
      isRange.value && index === 0 ? next[1] : maximum.value,
      snap(value),
    ),
  );
  return publish(next);
}
function nearest(value: number) {
  if (!isRange.value) return 0;
  const left = Math.abs(values.value[0] - value),
    right = Math.abs(values.value[1] - value);
  return left === right
    ? (focused.value ?? (value < values.value[0] ? 0 : 1))
    : left < right
      ? 0
      : 1;
}
function fromPoint(x: number, y: number) {
  const rect = box ?? rail.value?.getBoundingClientRect();
  if (!rect) return minimum.value;
  let ratio = props.vertical
    ? (rect.bottom - y) / (rect.height || 1)
    : (x - rect.left) / (rect.width || 1);
  if (props.reverse) ratio = 1 - ratio;
  return (
    minimum.value +
    Math.max(0, Math.min(1, ratio)) * (maximum.value - minimum.value)
  );
}
function applyPoint() {
  frame = undefined;
  if (!dragging.value || !point || !live) return;
  const next = fromPoint(point.x, point.y);
  if (trackDrag.value) {
    const delta = next - startPoint,
      span = decimalAdd(decimal(starting[1])!, decimal(starting[0])!, -1),
      lastStart = Number(
        decimalText(decimalAdd(decimal(maximum.value)!, span, -1)),
      );
    let low = snap(starting[0] + delta);
    low = Math.max(minimum.value, Math.min(lastStart, low));
    publish([low, Number(decimalText(decimalAdd(decimal(low)!, span)))]);
  } else setAt(dragIndex.value, next);
}
function matching(event: PointerEvent) {
  return (
    event.pointerId === undefined ||
    pointerId === undefined ||
    event.pointerId === pointerId
  );
}
function move(event: PointerEvent) {
  if (!dragging.value || !matching(event)) return;
  point = { x: event.clientX, y: event.clientY };
  if (event.cancelable) event.preventDefault();
  if (frame === undefined) frame = requestAnimationFrame(applyPoint);
}
function stop(cancelled = false, revert = false) {
  if (!dragging.value) return;
  if (frame !== undefined) cancelAnimationFrame(frame);
  frame = undefined;
  if (!cancelled && point) applyPoint();
  const previous = starting.slice(),
    info = { index: dragIndex.value, track: trackDrag.value, cancelled };
  dragging.value = false;
  point = undefined;
  removeListeners?.();
  removeListeners = undefined;
  try {
    if (pointerId !== undefined && rail.value?.hasPointerCapture?.(pointerId))
      rail.value.releasePointerCapture(pointerId);
  } catch {}
  pointerId = undefined;
  if (cancelled) {
    epoch++;
    if (revert && mutable.value) publish(previous);
    else draft.value = undefined;
  } else commit(previous);
  if (live) emit("dragEnd", valueOf(values.value), info);
}
function begin(event: PointerEvent, index?: number, moveTrack = false) {
  if (
    !live ||
    !mutable.value ||
    (event.button !== 0 && event.pointerType !== "touch")
  )
    return;
  if (!rail.value) return;
  stop(true);
  epoch++;
  box = rail.value.getBoundingClientRect();
  if (props.vertical ? !box.height : !box.width) return;
  event.preventDefault();
  pointerId = event.pointerId;
  starting = [...values.value];
  startPoint = fromPoint(event.clientX, event.clientY);
  trackDrag.value =
    moveTrack && isRange.value && !!props.draggableTrack && !markStep.value;
  dragIndex.value = index ?? nearest(startPoint);
  dragging.value = true;
  focused.value = dragIndex.value;
  thumbs.value[dragIndex.value]?.focus({ preventScroll: true });
  emit("dragStart", valueOf(values.value), {
    index: dragIndex.value,
    track: trackDrag.value,
    cancelled: false,
  });
  if (index === undefined && !trackDrag.value)
    setAt(dragIndex.value, startPoint);
  const up = (event: PointerEvent) => {
      if (!matching(event)) return;
      if (Number.isFinite(event.clientX) && Number.isFinite(event.clientY))
        point = { x: event.clientX, y: event.clientY };
      stop();
    },
    cancel = (event: PointerEvent) => {
      if (matching(event)) stop(true);
    },
    lost = () => stop(true),
    refresh = () => {
      box = rail.value?.getBoundingClientRect();
    };
  document.addEventListener("pointermove", move, { passive: false });
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", cancel);
  document.addEventListener("scroll", refresh, true);
  window.addEventListener("resize", refresh);
  window.addEventListener("blur", lost);
  const observer =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(refresh)
      : undefined;
  observer?.observe(rail.value);
  removeListeners = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", cancel);
    document.removeEventListener("scroll", refresh, true);
    window.removeEventListener("resize", refresh);
    window.removeEventListener("blur", lost);
    observer?.disconnect();
  };
  try {
    if (pointerId !== undefined) rail.value.setPointerCapture?.(pointerId);
  } catch {}
}
function stepValue(value: number, direction: number, count: number) {
  if (markStep.value) {
    const items = markItems.value.map((item) => item.value),
      index = items.indexOf(value);
    return (
      items[
        Math.max(
          0,
          Math.min(
            items.length - 1,
            (index < 0 ? 0 : index) + direction * count,
          ),
        )
      ] ?? value
    );
  }
  const stride = decimal(safeStep.value)!,
    base = decimal(minimum.value)!,
    last = normalizeDecimal(decimal(maximum.value)!, {
      step: stride,
      base,
      min: base,
      max: decimal(maximum.value),
      strict: true,
    })!;
  if (
    direction < 0 &&
    value === maximum.value &&
    Number(decimalText(last)) !== value
  )
    return Number(decimalText(decimalAdd(last, stride, -(count - 1))));
  return Number(
    decimalText(decimalAdd(decimal(value)!, stride, direction * count)),
  );
}
function key(event: KeyboardEvent, index: number) {
  if (event.isComposing || event.keyCode === 229) return;
  if (event.key === "Escape" && dragging.value) {
    event.preventDefault();
    stop(true, true);
    return;
  }
  const positive = ["ArrowRight", "ArrowUp", "PageUp"],
    negative = ["ArrowLeft", "ArrowDown", "PageDown"];
  if (![...positive, ...negative, "Home", "End"].includes(event.key)) return;
  if (!mutable.value || !props.keyboard) return;
  event.preventDefault();
  if (dragging.value) stop(true);
  const previous = [...values.value];
  let next: number;
  if (event.key === "Home")
    next = markStep.value
      ? (markItems.value[0]?.value ?? minimum.value)
      : minimum.value;
  else if (event.key === "End")
    next = markStep.value
      ? (markItems.value.at(-1)?.value ?? maximum.value)
      : maximum.value;
  else
    next = stepValue(
      values.value[index],
      (positive.includes(event.key) ? 1 : -1) * (props.reverse ? -1 : 1),
      event.key.startsWith("Page") || event.shiftKey ? 10 : 1,
    );
  if (setAt(index, next)) commit(previous);
}
function setValue(value: HysSliderValue) {
  const previous = [...values.value];
  if (publish(normalize(value))) commit(previous);
}
function mark(value: number) {
  if (!mutable.value) return;
  const previous = [...values.value];
  if (setAt(nearest(value), value)) commit(previous);
}
function focus(index = 0) {
  if (!disabled.value)
    thumbs.value[
      Math.max(0, Math.min(values.value.length - 1, index))
    ]?.focus();
}
function cleanup() {
  stop(true);
  live = false;
  epoch++;
  revision++;
  expected = undefined;
  draft.value = undefined;
  focused.value = undefined;
  hovered.value = undefined;
}
watch(
  () => props.modelValue,
  () => {
    if (expected && same(canonical.value, expected)) return;
    stop(true);
    epoch++;
    revision++;
    draft.value = undefined;
    expected = undefined;
  },
  { deep: true, flush: "sync" },
);
watch(
  [
    () => props.min,
    () => props.max,
    () => props.step,
    () => props.range,
    () => props.vertical,
    () => props.reverse,
    () => inheritedDisabled.value,
    () => props.readonly,
    // Inline marks objects may be recreated by every model update. Only a
    // changed set of available stops affects an active mark-only interaction.
    () =>
      markStep.value ? markItems.value.map((item) => item.value).join(",") : "",
  ],
  () => {
    stop(true);
    epoch++;
    draft.value = undefined;
  },
);
watch(
  () => form?.resetting.value,
  (reset) => {
    if (reset) {
      stop(true);
      epoch++;
      revision++;
      expected = undefined;
      draft.value = undefined;
    }
  },
  { flush: "sync" },
);
onMounted(() => {
  if (props.autofocus) focus();
});
onActivated(() => (live = true));
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
defineExpose({
  element: root,
  dragging,
  values,
  focus,
  blur: () => {
    const active = document.activeElement as HTMLElement | null;
    if (active && root.value?.contains(active)) active.blur();
  },
  setValue,
  cancel: () => stop(true, true),
});
</script>
<template>
  <div
    v-bind="{ ...hysRootAttrs, ...rootAttrs() }"
    ref="root"
    class="hys-ui-slider-wrap hys-ui-ex-field"
    :class="[
      'hys-ui-slider-' + size,
      {
        'hys-ui-slider-vertical': vertical,
        'hys-ui-slider-disabled': disabled,
        'hys-ui-slider-readonly': readonly,
        'hys-ui-slider-dragging': dragging,
        'hys-ui-slider-error': status === 'error',
        'hys-ui-slider-warning': status === 'warning',
        'hys-ui-slider-success': status === 'success',
      },
    ]"
  >
    <span v-if="showValue" :id="labelId" class="hys-ui-slider-value"
      >{{ label || fieldLabel || "数值" }}：{{
        values.map((item) => tooltip(item) ?? item).join(" ~ ")
      }}</span
    >
    <div class="hys-ui-slider-layout">
      <div
        class="hys-ui-slider-axis"
        :style="
          vertical
            ? { height: typeof height === 'number' ? height + 'px' : height }
            : undefined
        "
      >
        <div
          ref="rail"
          class="hys-ui-slider-rail"
          :class="{ 'hys-ui-slider-range': isRange }"
          @pointerdown="begin($event)"
          @lostpointercapture="dragging && stop(true)"
        >
          <div class="hys-ui-slider-background" />
          <div
            v-if="included"
            class="hys-ui-slider-selection"
            :class="{
              'hys-ui-slider-selection-draggable':
                isRange && draggableTrack && !markStep && mutable,
            }"
            :style="selection"
            @pointerdown.stop="begin($event, undefined, true)"
          />
          <span
            v-for="stopValue in stops"
            :key="stopValue"
            class="hys-ui-slider-stop"
            :class="{
              'hys-ui-slider-stop-active':
                stopValue >= (isRange ? values[0] : minimum) &&
                stopValue <= values[isRange ? 1 : 0],
            }"
            :style="offset(stopValue)"
          />
          <div
            v-for="(item, index) in values"
            :key="index"
            :ref="
              (element) => {
                if (element) thumbs[index] = element as HTMLElement;
              }
            "
            role="slider"
            data-hys-ui-field-managed
            class="hys-ui-slider-thumb"
            :class="{
              'hys-ui-slider-thumb-active':
                focused === index || (dragging && dragIndex === index),
            }"
            :id="
              index === 0
                ? (attrs.id as string) ||
                  (!isRange ? field?.id.value : undefined)
                : undefined
            "
            :tabindex="disabled ? -1 : (tabindex ?? 0)"
            :aria-label="thumbLabel(index)"
            :aria-labelledby="attrs['aria-labelledby'] as string"
            :aria-valuemin="
              index === 1
                ? values[0]
                : markStep
                  ? (markItems[0]?.value ?? minimum)
                  : minimum
            "
            :aria-valuemax="
              isRange && index === 0
                ? values[1]
                : markStep
                  ? (markItems.at(-1)?.value ?? maximum)
                  : maximum
            "
            :aria-valuenow="item"
            :aria-valuetext="valueText(item)"
            :aria-orientation="vertical ? 'vertical' : 'horizontal'"
            :aria-disabled="disabled || undefined"
            :aria-readonly="readonly || undefined"
            :aria-required="field?.required.value || undefined"
            :aria-invalid="status === 'error' || undefined"
            :aria-describedby="
              [
                error ? errorId : field?.describedBy.value,
                attrs['aria-describedby'],
              ]
                .filter(Boolean)
                .join(' ') || undefined
            "
            :style="offset(item)"
            @pointerdown.stop="begin($event, index)"
            @keydown="key($event, index)"
            @mouseenter="hovered = index"
            @mouseleave="hovered = undefined"
            @focus="
              focused = index;
              emit('focus', $event);
            "
            @blur="
              focused = undefined;
              emit('blur', $event);
            "
          >
            <span class="hys-ui-slider-handle"
              ><slot
                name="thumb"
                :value="item"
                :index="index"
                :dragging="dragging && dragIndex === index"
            /></span>
            <span
              v-if="
                showTooltip &&
                tooltip(item) !== null &&
                (tooltipVisible ??
                  (focused === index ||
                    hovered === index ||
                    (dragging && dragIndex === index)))
              "
              class="hys-ui-slider-tooltip"
              :class="'hys-ui-slider-tooltip-' + tooltipPlacement"
              role="tooltip"
              ><slot name="tooltip" :value="item" :index="index">{{
                tooltip(item)
              }}</slot></span
            >
          </div>
        </div>
        <div v-if="markItems.length" class="hys-ui-slider-marks">
          <button
            v-for="item in markItems"
            :key="item.value"
            type="button"
            tabindex="-1"
            class="hys-ui-slider-mark"
            :disabled="disabled || readonly"
            :style="{ ...offset(item.value), ...item.style }"
            @click="mark(item.value)"
          >
            <slot
              name="mark"
              :value="item.value"
              :label="item.label"
              :active="
                item.value >= (isRange ? values[0] : minimum) &&
                item.value <= values[isRange ? 1 : 0]
              "
              >{{ item.label }}</slot
            >
          </button>
        </div>
      </div>
      <div v-if="showInput" class="hys-ui-slider-inputs">
        <HysNumberInput
          v-for="(item, index) in values"
          :key="index"
          :id="controlId + '-number-' + index"
          :model-value="item"
          :min="index === 1 ? values[0] : minimum"
          :max="isRange && index === 0 ? values[1] : maximum"
          :step="safeStep"
          :show-controls="showInputControls"
          :size="size"
          :disabled="disabled"
          :readonly="readonly"
          :aria-label="thumbLabel(index) + '输入'"
          @update:model-value="
            (value) => {
              if (value !== null) {
                const previous = [...values];
                if (setAt(index, Number(value))) commit(previous);
              }
            }
          "
        />
      </div>
    </div>
    <template v-if="name"
      ><input
        v-for="(item, index) in values"
        :key="index"
        type="hidden"
        :name="name"
        :value="item"
        :disabled="disabled"
    /></template>
    <small
      v-if="error"
      :id="errorId"
      class="hys-ui-slider-error-text"
      role="alert"
      >{{ error }}</small
    >
  </div>
</template>
<style scoped>
.hys-ui-slider-wrap {
  --hys-ui-slider-rail-size: 6px;
  --hys-ui-slider-handle-size: 18px;
  --hys-ui-slider-hit-size: 34px;
  min-width: 0;
  display: grid;
  gap: 10px;
}
.hys-ui-slider-sm {
  --hys-ui-slider-rail-size: 4px;
  --hys-ui-slider-handle-size: 14px;
}
.hys-ui-slider-lg {
  --hys-ui-slider-rail-size: 8px;
  --hys-ui-slider-handle-size: 22px;
}
.hys-ui-slider-value {
  font-size: 13px;
}
.hys-ui-slider-layout {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}
.hys-ui-slider-axis {
  position: relative;
  flex: 1;
  min-width: 0;
  padding: 0 10px;
}
.hys-ui-slider-rail {
  position: relative;
  height: var(--hys-ui-slider-hit-size);
  cursor: pointer;
  touch-action: none;
  user-select: none;
}
.hys-ui-slider-background,
.hys-ui-slider-selection {
  position: absolute;
  top: 50%;
  height: var(--hys-ui-slider-rail-size);
  transform: translateY(-50%);
  border-radius: 99px;
}
.hys-ui-slider-background {
  width: 100%;
  background: var(--hys-ui-border, var(--hys-ui-theme-border));
  pointer-events: none;
}
.hys-ui-slider-selection {
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-slider-selection-draggable {
  cursor: grab;
}
.hys-ui-slider-dragging .hys-ui-slider-selection-draggable {
  cursor: grabbing;
}
.hys-ui-slider-thumb {
  position: absolute;
  top: 50%;
  width: var(--hys-ui-slider-hit-size);
  height: var(--hys-ui-slider-hit-size);
  display: grid;
  place-items: center;
  transform: translate(-50%, -50%);
  outline: none;
  cursor: grab;
  z-index: 2;
}
.hys-ui-slider-thumb-active {
  z-index: 3;
}
.hys-ui-slider-handle {
  display: grid;
  place-items: center;
  width: var(--hys-ui-slider-handle-size);
  height: var(--hys-ui-slider-handle-size);
  box-sizing: border-box;
  border: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-radius: 50%;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: 0 1px 4px #17274418;
  transition:
    box-shadow 0.15s,
    transform 0.15s;
}
.hys-ui-slider-thumb:hover .hys-ui-slider-handle,
.hys-ui-slider-thumb:focus-visible .hys-ui-slider-handle {
  box-shadow: 0 0 0 4px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 14%,
      transparent
    );
}
.hys-ui-slider-thumb:focus-visible .hys-ui-slider-handle {
  outline: 2px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 55%,
      transparent
    );
  outline-offset: 2px;
}
.hys-ui-slider-dragging .hys-ui-slider-thumb {
  cursor: grabbing;
}
.hys-ui-slider-dragging .hys-ui-slider-thumb-active .hys-ui-slider-handle {
  transform: scale(1.12);
}
.hys-ui-slider-stop {
  position: absolute;
  top: 50%;
  width: 4px;
  height: 4px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.hys-ui-slider-stop-active {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-slider-marks {
  height: 25px;
  position: relative;
  margin-top: 0;
  font-size: 11px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-slider-mark {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  line-height: 1.4;
  padding: 3px 1px;
  white-space: nowrap;
  cursor: pointer;
}
.hys-ui-slider-mark:hover:not(:disabled) {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-slider-tooltip {
  position: absolute;
  z-index: 5;
  pointer-events: none;
  border-radius: 6px;
  padding: 4px 8px;
  background: var(--hys-ui-text, var(--hys-ui-theme-text));
  color: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
  box-shadow: 0 3px 12px #1727441a;
}
.hys-ui-slider-tooltip-top {
  bottom: calc(100% - 3px);
  left: 50%;
  transform: translateX(-50%);
}
.hys-ui-slider-tooltip-bottom {
  top: calc(100% - 3px);
  left: 50%;
  transform: translateX(-50%);
}
.hys-ui-slider-tooltip-left {
  right: calc(100% - 3px);
  top: 50%;
  transform: translateY(-50%);
}
.hys-ui-slider-tooltip-right {
  left: calc(100% - 3px);
  top: 50%;
  transform: translateY(-50%);
}
.hys-ui-slider-inputs {
  display: flex;
  gap: 10px;
  flex: 0 0 auto;
  max-width: 48%;
}
.hys-ui-slider-inputs > .hys-ui-number-wrap {
  width: 130px;
  max-width: 100%;
}
.hys-ui-slider-disabled {
  opacity: 0.5;
}
.hys-ui-slider-disabled .hys-ui-slider-rail,
.hys-ui-slider-disabled .hys-ui-slider-thumb {
  cursor: not-allowed;
  touch-action: auto;
}
.hys-ui-slider-readonly .hys-ui-slider-rail,
.hys-ui-slider-readonly .hys-ui-slider-thumb {
  cursor: default;
  touch-action: auto;
}
.hys-ui-slider-error .hys-ui-slider-handle {
  border-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-slider-error-text {
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
  font-size: 12px;
}
.hys-ui-slider-warning .hys-ui-slider-handle {
  border-color: var(--hys-ui-orange, var(--hys-ui-theme-orange));
}
.hys-ui-slider-success .hys-ui-slider-handle {
  border-color: var(--hys-ui-green, var(--hys-ui-theme-green));
}
[data-hys-motion="off"] .hys-ui-slider-handle {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-slider-handle {
    transition: none;
  }
}
.hys-ui-slider-vertical .hys-ui-slider-layout {
  align-items: flex-start;
}
.hys-ui-slider-vertical .hys-ui-slider-axis {
  flex: none;
  width: 56px;
  padding: 10px 0;
}
.hys-ui-slider-vertical .hys-ui-slider-rail {
  height: 100%;
  width: 34px;
}
.hys-ui-slider-vertical .hys-ui-slider-background,
.hys-ui-slider-vertical .hys-ui-slider-selection {
  top: auto;
  left: 50%;
  width: var(--hys-ui-slider-rail-size);
  height: auto;
  transform: translateX(-50%);
}
.hys-ui-slider-vertical .hys-ui-slider-background {
  height: 100%;
  bottom: 0;
}
.hys-ui-slider-vertical .hys-ui-slider-thumb {
  top: auto;
  left: 50%;
  transform: translate(-50%, 50%);
}
.hys-ui-slider-vertical .hys-ui-slider-stop {
  top: auto;
  left: 50%;
  transform: translate(-50%, 50%);
}
.hys-ui-slider-vertical .hys-ui-slider-marks {
  position: absolute;
  inset: 10px auto 10px 42px;
  height: auto;
  width: 40px;
  margin: 0;
}
.hys-ui-slider-vertical .hys-ui-slider-mark {
  top: auto;
  left: 0;
  transform: translateY(50%);
}
.hys-ui-slider-vertical .hys-ui-slider-inputs {
  flex-direction: column;
  margin-left: 25px;
}
@media (max-width: 480px) {
  .hys-ui-slider-layout:has(.hys-ui-slider-inputs) {
    flex-wrap: wrap;
  }
  .hys-ui-slider-inputs {
    max-width: 100%;
    width: 100%;
  }
  .hys-ui-slider-axis {
    min-width: 100px;
  }
  .hys-ui-slider-vertical .hys-ui-slider-axis {
    min-width: 0;
  }
  .hys-ui-slider-inputs > .hys-ui-number-wrap {
    flex: 1;
  }
}
</style>
