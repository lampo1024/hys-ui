<script setup lang="ts" generic="T extends HysNumberInputValue = number | null">
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  useAttrs,
  useId,
  watch,
  type CSSProperties,
} from "vue";
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Minus,
  Plus,
  X,
} from "lucide-vue-next";
import {
  fieldKey,
  formKey,
  useHysControlState,
} from "../../composables/formContext";
import {
  decimal,
  decimalAdd,
  decimalCompare,
  decimalRound,
  decimalText,
  normalizeDecimal,
  type Decimal,
  type HysNumberInputValue,
  type HysNumberInputFormatInfo,
  type HysNumberInputInvalidInfo,
  type HysNumberInputStepInfo,
} from "../../composables/numberInput";
import { useHysRootAttrs } from "../../config";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: T;
    defaultValue?: T;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    stepBase?: number | string;
    precision?: number;
    stepStrictly?: boolean;
    stringMode?: boolean;
    valueOnClear?: number | string | null;
    clearable?: boolean;
    updateOnInput?: boolean;
    formatter?: (
      value: HysNumberInputValue,
      info: HysNumberInputFormatInfo,
    ) => string;
    parser?: (input: string) => number | string | null | undefined;
    decimalSeparator?: string;
    validator?: (value: HysNumberInputValue) => boolean;
    allowInput?: (input: string) => boolean;
    disabled?: boolean;
    readonly?: boolean;
    loading?: boolean;
    ariaLabel?: string;
    placeholder?: string;
    name?: string;
    error?: string;
    status?: "error" | "warning" | "success";
    showControls?: boolean;
    controlsPosition?: "both" | "right";
    selectOnFocus?: boolean;
    keyboard?:
      | boolean
      | Partial<
          Record<
            "ArrowUp" | "ArrowDown" | "Home" | "End" | "PageUp" | "PageDown",
            boolean
          >
        >;
    wheel?: boolean;
    repeat?: boolean;
    repeatDelay?: number;
    repeatInterval?: number;
    size?: "sm" | "md" | "lg";
    bordered?: boolean;
    round?: boolean;
    block?: boolean;
    autofocus?: boolean;
    align?: "left" | "center" | "right";
  }>(),
  {
    step: 1,
    stepBase: 0,
    valueOnClear: null,
    decimalSeparator: ".",
    showControls: true,
    controlsPosition: "both",
    selectOnFocus: false,
    keyboard: true,
    repeat: true,
    repeatDelay: 450,
    repeatInterval: 80,
    bordered: true,
    align: "center",
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: T];
  change: [value: T];
  input: [value: T | null];
  clear: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  pressEnter: [event: KeyboardEvent];
  step: [value: T, info: HysNumberInputStepInfo];
  invalid: [info: HysNumberInputInvalidInfo];
}>();
const hysRootAttrs = useHysRootAttrs(),
  attrs = useAttrs(),
  field = inject(fieldKey, undefined),
  form = inject(formKey, undefined),
  input = ref<HTMLInputElement>(),
  errorId = useId();
const {
  disabled: controlDisabled,
  size: controlSize,
  label: fieldLabel,
} = useHysControlState(props);
const local = shallowRef<HysNumberInputValue>(props.defaultValue ?? null),
  current = computed<HysNumberInputValue>(() =>
    props.modelValue !== undefined ? props.modelValue : local.value,
  ),
  currentDecimal = computed(() => decimal(current.value));
const step = computed(() => {
    const parsed = decimal(props.step);
    return parsed && parsed.units !== 0n
      ? { ...parsed, units: parsed.units < 0n ? -parsed.units : parsed.units }
      : decimal(1)!;
  }),
  base = computed(() => decimal(props.stepBase) ?? decimal(0)!);
const min = computed(
    () =>
      decimal(props.min) ??
      (props.stringMode ? undefined : decimal(Number.MIN_SAFE_INTEGER)),
  ),
  max = computed(
    () =>
      decimal(props.max) ??
      (props.stringMode ? undefined : decimal(Number.MAX_SAFE_INTEGER)),
  );
const precision = computed(() =>
  props.precision !== undefined && Number.isFinite(props.precision)
    ? Math.min(
        100,
        Math.max(
          0,
          Math.floor(props.precision),
          step.value.scale,
          props.stepStrictly ? base.value.scale : 0,
        ),
      )
    : undefined,
);
const constraints = computed(() => ({
  step: step.value,
  base: base.value,
  min: min.value,
  max: max.value,
  precision: precision.value,
  strict: props.stepStrictly,
}));
const invalidRange = computed(
    () => !normalizeDecimal(decimal(0)!, constraints.value),
  ),
  outOfRange = computed(
    () =>
      !!currentDecimal.value &&
      ((!!min.value && decimalCompare(currentDecimal.value, min.value) < 0) ||
        (!!max.value && decimalCompare(currentDecimal.value, max.value) > 0)),
  );
const disabled = computed(() => controlDisabled.value || props.loading),
  mutable = computed(() => !disabled.value && !props.readonly);
const validationError = computed(() => props.error || field?.error.value),
  invalid = computed(
    () =>
      !!validationError.value ||
      !!field?.invalid?.value ||
      props.status === "error" ||
      invalidRange.value ||
      outOfRange.value,
  );
const status = computed(() =>
  invalid.value ? "error" : (props.status ?? field?.status?.value),
);
const inputType = computed(() =>
  props.formatter ||
  props.parser ||
  props.allowInput ||
  props.stringMode ||
  props.decimalSeparator !== "."
    ? "text"
    : "number",
);
const draft = ref(""),
  dirty = ref(false),
  composing = ref(false),
  nativeLabel = ref(false);
let live = true,
  action = 0,
  echo: string | undefined,
  repeatTimer: ReturnType<typeof setTimeout> | undefined,
  pointerStepped = false,
  endingPointer: (() => void) | undefined,
  acceptedDraft = "";
const same = (a: HysNumberInputValue, b: HysNumberInputValue) =>
  a === null || b === null
    ? a === b
    : !!decimal(a) &&
      !!decimal(b) &&
      decimalCompare(decimal(a)!, decimal(b)!) === 0;
const signature = (value: HysNumberInputValue) =>
  value === null
    ? "null"
    : decimal(value)
      ? decimalText(decimal(value)!)
      : "invalid";
const accessibleNumber = (value?: Decimal) => {
  const result = value ? Number(decimalText(value)) : NaN;
  return Number.isFinite(result) ? result : undefined;
};
function valueOf(value: Decimal): HysNumberInputValue {
  return props.stringMode ? decimalText(value) : Number(decimalText(value));
}
function formatted(value: HysNumberInputValue, typing = false, raw = "") {
  const parsed = decimal(value),
    plain = parsed
      ? decimalText(
          precision.value === undefined
            ? parsed
            : decimalRound(parsed, precision.value),
          precision.value,
        )
      : "";
  try {
    if (props.formatter)
      return String(props.formatter(value, { userTyping: typing, input: raw }));
    return props.decimalSeparator !== "."
      ? plain.replace(".", props.decimalSeparator)
      : plain;
  } catch {
    return plain;
  }
}
function display(value: string, force = false) {
  draft.value = value;
  acceptedDraft = value;
  if (input.value && (force || input.value.value !== value))
    input.value.value = value;
}
function restore() {
  dirty.value = false;
  display(formatted(current.value), true);
}
function inputAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => !["class", "style", "type"].includes(key),
    ),
  );
}
function read(
  text: string,
): { kind: "empty" } | { kind: "invalid" } | { kind: "value"; value: Decimal } {
  if (!text.trim()) return { kind: "empty" };
  try {
    const result = props.parser
        ? props.parser(text)
        : props.decimalSeparator !== "."
          ? text.replace(props.decimalSeparator, ".")
          : text,
      parsed = decimal(result);
    return parsed ? { kind: "value", value: parsed } : { kind: "invalid" };
  } catch {
    return { kind: "invalid" };
  }
}
function allowed(value: HysNumberInputValue, text: string, report = true) {
  try {
    if (!props.validator || props.validator(value) === true) return true;
  } catch {}
  if (report) emit("invalid", { input: text, reason: "validator" });
  return false;
}
function publish(value: HysNumberInputValue, keepDraft = false) {
  const token = ++action;
  if (!same(current.value, value)) {
    echo = signature(value);
    if (props.modelValue === undefined) local.value = value;
    emit("update:modelValue", value as T);
    emit("change", value as T);
  }
  if (!keepDraft) {
    dirty.value = false;
    display(formatted(value), true);
  }
  void nextTick(() => {
    if (token !== action || !live) return;
    if (props.modelValue !== undefined && !same(current.value, value))
      restore();
    else if (!keepDraft) display(formatted(current.value));
    echo = undefined;
  });
}
function clearValue(): HysNumberInputValue {
  if (props.valueOnClear === "min")
    return min.value ? valueOf(min.value) : null;
  if (props.valueOnClear === "max")
    return max.value ? valueOf(max.value) : null;
  const parsed = decimal(props.valueOnClear);
  return parsed ? valueOf(parsed) : null;
}
function commit(text = input.value?.value ?? draft.value) {
  if (!live || !mutable.value) return false;
  if (
    inputType.value === "number" &&
    input.value?.validity.badInput &&
    text === input.value.value
  ) {
    emit("invalid", { input: text, reason: "parse" });
    restore();
    return false;
  }
  const parsed = read(text);
  if (parsed.kind === "invalid") {
    emit("invalid", { input: text, reason: "parse" });
    restore();
    return false;
  }
  if (invalidRange.value) {
    emit("invalid", { input: text, reason: "range" });
    restore();
    return false;
  }
  const normalized =
    parsed.kind === "value"
      ? normalizeDecimal(parsed.value, constraints.value)
      : undefined;
  if (parsed.kind === "value" && !normalized) {
    emit("invalid", { input: text, reason: "range" });
    restore();
    return false;
  }
  const value = normalized ? valueOf(normalized) : clearValue();
  if (typeof value === "number" && !Number.isFinite(value)) {
    emit("invalid", { input: text, reason: "range" });
    restore();
    return false;
  }
  if (!allowed(value, text)) {
    restore();
    return false;
  }
  publish(value);
  return true;
}
function clear() {
  if (!mutable.value || !live) return;
  const value = clearValue();
  if (!allowed(value, "")) return;
  publish(value);
  emit("input", value as T | null);
  emit("clear");
  input.value?.focus();
}
function edited(event: Event) {
  if (!mutable.value || !live) return;
  const element = event.target as HTMLInputElement,
    text = element.value,
    caret = element.selectionStart;
  if (composing.value) {
    draft.value = text;
    return;
  }
  const reject = () => {
    const previous = acceptedDraft;
    display(previous, true);
    if (caret !== null) {
      const position = Math.max(0, caret - (text.length - previous.length));
      try {
        element.setSelectionRange(position, position);
      } catch {}
    }
  };
  try {
    if (props.allowInput && props.allowInput(text) === false) {
      reject();
      return;
    }
  } catch {
    reject();
    return;
  }
  dirty.value = true;
  const parsed =
      inputType.value === "number" && element.validity.badInput
        ? { kind: "invalid" as const }
        : read(text),
    value = parsed.kind === "value" ? valueOf(parsed.value) : null;
  display(
    parsed.kind === "value" && props.formatter
      ? formatted(value, true, text)
      : text,
  );
  if (caret !== null && element.value !== text) {
    const position = Math.max(0, element.value.length - (text.length - caret));
    try {
      element.setSelectionRange(position, position);
    } catch {}
  }
  emit("input", value as T | null);
  if (props.updateOnInput && parsed.kind !== "invalid" && !invalidRange.value) {
    const normalized =
        parsed.kind === "value"
          ? normalizeDecimal(parsed.value, constraints.value)
          : undefined,
      next = normalized ? valueOf(normalized) : clearValue();
    if (
      (typeof next !== "number" || Number.isFinite(next)) &&
      allowed(next, text)
    )
      publish(next, true);
  }
}
function canStep(direction: 1 | -1) {
  if (!mutable.value || invalidRange.value) return false;
  const parsed = dirty.value ? read(draft.value) : undefined,
    start = parsed?.kind === "value" ? parsed.value : currentDecimal.value;
  if (!start) return true;
  if (
    (direction > 0 && max.value && decimalCompare(start, max.value) >= 0) ||
    (direction < 0 && min.value && decimalCompare(start, min.value) <= 0)
  )
    return false;
  const next = normalizeDecimal(
    decimalAdd(start, step.value, direction),
    constraints.value,
  );
  if (!next || decimalCompare(next, start) !== direction) return false;
  return (
    props.stringMode || Number(decimalText(next)) !== Number(decimalText(start))
  );
}
const decreaseDisabled = computed(() => !canStep(-1)),
  increaseDisabled = computed(() => !canStep(1));
function stepBy(
  direction: 1 | -1,
  multiplier = 1,
  source: HysNumberInputStepInfo["source"] = "method",
) {
  if (!live || composing.value || !canStep(direction)) return false;
  const factor = Number.isFinite(multiplier)
      ? Math.max(1, Math.min(1000000, Math.floor(multiplier)))
      : 1,
    parsed = dirty.value ? read(draft.value) : undefined,
    start =
      parsed?.kind === "value"
        ? parsed.value
        : (currentDecimal.value ?? decimal(0)!),
    next = normalizeDecimal(
      decimalAdd(start, step.value, direction * factor),
      constraints.value,
    );
  if (!next) return false;
  const value = valueOf(next);
  if (
    (typeof value === "number" && !Number.isFinite(value)) ||
    !allowed(value, draft.value)
  )
    return false;
  if (same(current.value, value) && !dirty.value) return false;
  publish(value);
  emit("step", value as T, {
    offset: props.stringMode
      ? decimalText(decimalAdd(next, start, -1))
      : Number(decimalText(decimalAdd(next, start, -1))),
    type: direction > 0 ? "up" : "down",
    source,
  });
  return true;
}
function stopRepeat() {
  clearTimeout(repeatTimer);
  repeatTimer = undefined;
  endingPointer?.();
  endingPointer = undefined;
}
function pointerDown(direction: 1 | -1, event: PointerEvent) {
  if (event.button !== 0 || !mutable.value) return;
  event.preventDefault();
  stopRepeat();
  input.value?.focus();
  pointerStepped = true;
  if (!stepBy(direction, 1, "button") || !props.repeat) return;
  const tick = () => {
    if (!stepBy(direction, 1, "repeat")) {
      stopRepeat();
      return;
    }
    repeatTimer = setTimeout(tick, Math.max(20, props.repeatInterval));
  };
  repeatTimer = setTimeout(tick, Math.max(0, props.repeatDelay));
  const stop = () => stopRepeat();
  document.addEventListener("pointerup", stop, true);
  document.addEventListener("pointercancel", stop, true);
  window.addEventListener("blur", stop);
  endingPointer = () => {
    document.removeEventListener("pointerup", stop, true);
    document.removeEventListener("pointercancel", stop, true);
    window.removeEventListener("blur", stop);
  };
}
function clicked(direction: 1 | -1, event: MouseEvent) {
  if (event.detail > 0 && pointerStepped) {
    pointerStepped = false;
    return;
  }
  pointerStepped = false;
  stepBy(direction, 1, "button");
}
function keyboard(event: KeyboardEvent) {
  if (event.isComposing || composing.value || event.keyCode === 229) return;
  if (event.key === "Enter") {
    if (mutable.value) {
      commit();
      emit("pressEnter", event);
    }
    return;
  }
  if (event.key === "Escape") {
    if (dirty.value) {
      event.preventDefault();
      restore();
    }
    return;
  }
  if (
    !["ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(
      event.key,
    )
  )
    return;
  if (!mutable.value) return;
  const enabled =
    props.keyboard !== false &&
    (typeof props.keyboard !== "object" ||
      props.keyboard[event.key as keyof typeof props.keyboard] !== false);
  if (!enabled) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown")
      event.preventDefault();
    return;
  }
  if (event.key === "Home" || event.key === "End") {
    const bound =
      event.key === "Home"
        ? props.min === undefined
          ? undefined
          : min.value
        : props.max === undefined
          ? undefined
          : max.value;
    if (bound) {
      event.preventDefault();
      commit(decimalText(bound));
    }
    return;
  }
  event.preventDefault();
  stepBy(
    event.key === "ArrowUp" || event.key === "PageUp" ? 1 : -1,
    event.key.startsWith("Page") || event.shiftKey ? 10 : 1,
    "keyboard",
  );
}
function wheel(event: WheelEvent) {
  if (
    !mutable.value ||
    document.activeElement !== input.value ||
    !event.deltaY ||
    event.ctrlKey
  )
    return;
  if (!props.wheel) {
    if (inputType.value === "number") event.preventDefault();
    return;
  }
  event.preventDefault();
  stepBy(event.deltaY < 0 ? 1 : -1, 1, "wheel");
}
function focusedIn(event: FocusEvent) {
  if (props.selectOnFocus) input.value?.select();
  emit("focus", event);
}
function blurred(event: FocusEvent) {
  stopRepeat();
  if (dirty.value && !composing.value) commit();
  emit("blur", event);
}
function syncLabel() {
  nativeLabel.value = !!input.value?.labels?.length;
}
watch(
  current,
  () => {
    if (echo === signature(current.value) && dirty.value && props.updateOnInput)
      return;
    restore();
  },
  { flush: "sync" },
);
watch(
  () => form?.resetting.value,
  (value) => {
    if (value) {
      action++;
      echo = undefined;
      composing.value = false;
      stopRepeat();
      restore();
    }
  },
  { flush: "sync" },
);
watch(
  () => [
    props.formatter,
    props.parser,
    props.decimalSeparator,
    props.precision,
    props.step,
    props.stepStrictly,
    props.stringMode,
  ],
  () => {
    stopRepeat();
    if (!dirty.value) restore();
  },
);
watch(() => [props.min, props.max], stopRepeat);
watch(
  () => [
    disabled.value,
    props.readonly,
    props.showControls,
    props.controlsPosition,
  ],
  () => {
    stopRepeat();
    if (disabled.value || props.readonly) {
      composing.value = false;
      restore();
    }
  },
);
function cleanup() {
  live = false;
  action++;
  stopRepeat();
  composing.value = false;
  restore();
}
onMounted(() => {
  restore();
  syncLabel();
  if (props.autofocus && !disabled.value) input.value?.focus();
});
onUpdated(syncLabel);
onActivated(() => {
  live = true;
});
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
defineExpose({
  input,
  focus: (options?: FocusOptions) => {
    if (!disabled.value) input.value?.focus(options);
  },
  blur: () => input.value?.blur(),
  select: () => input.value?.select(),
  clear,
  commit,
  increase: (multiplier?: number) => stepBy(1, multiplier),
  decrease: (multiplier?: number) => stepBy(-1, multiplier),
});
</script>
<template>
  <div
    v-bind="hysRootAttrs"
    class="hys-ui-number-wrap"
    :class="[
      $attrs.class,
      'hys-ui-number-' + controlSize,
      { 'hys-ui-number-block': block },
    ]"
    :style="$attrs.style as CSSProperties"
  >
    <div class="hys-ui-number-group">
      <span v-if="$slots.prepend" class="hys-ui-number-addon"
        ><slot name="prepend"
      /></span>
      <div
        class="hys-ui-ex-number"
        :class="[
          'hys-ui-number-' + controlsPosition,
          {
            'hys-ui-ex-number-disabled': disabled,
            'hys-ui-number-borderless': !bordered,
            'hys-ui-number-round': round,
            'hys-ui-number-error': status === 'error',
            'hys-ui-number-warning': status === 'warning',
            'hys-ui-number-success': status === 'success',
          },
        ]"
      >
        <div class="hys-ui-number-main">
          <input
            ref="input"
            v-bind="inputAttrs()"
            :id="($attrs.id as string) || field?.id.value || undefined"
            :type="inputType"
            :role="inputType === 'text' ? 'spinbutton' : undefined"
            :inputmode="($attrs.inputmode as any) || 'decimal'"
            :aria-label="
              ariaLabel ||
              ($attrs['aria-label'] as string) ||
              fieldLabel ||
              (nativeLabel ? undefined : '数值')
            "
            :aria-valuenow="accessibleNumber(currentDecimal)"
            :aria-valuetext="currentDecimal ? formatted(current) : undefined"
            :aria-valuemin="accessibleNumber(min)"
            :aria-valuemax="accessibleNumber(max)"
            :aria-invalid="invalid || undefined"
            :aria-required="field?.required.value || undefined"
            :aria-describedby="
              [
                error ? errorId : field?.describedBy.value,
                $attrs['aria-describedby'],
              ]
                .filter(Boolean)
                .join(' ') || undefined
            "
            data-hys-ui-field-managed
            :value="draft"
            :min="min ? decimalText(min) : undefined"
            :max="max ? decimalText(max) : undefined"
            :step="decimalText(step)"
            :disabled="disabled"
            :readonly="readonly"
            :placeholder="placeholder"
            :style="{ textAlign: align }"
            @input="edited"
            @change="commit()"
            @focus="focusedIn"
            @blur="blurred"
            @keydown="keyboard"
            @wheel="wheel"
            @compositionstart="composing = true"
            @compositionend="
              composing = false;
              edited($event);
            "
          />
          <span
            v-if="$slots.prefix"
            class="hys-ui-number-affix hys-ui-number-prefix"
            ><slot name="prefix" /></span
          ><span v-if="$slots.suffix" class="hys-ui-number-affix"
            ><slot name="suffix" /></span
          ><LoaderCircle
            v-if="loading"
            :size="15"
            class="hys-ui-icon-spin hys-ui-number-loading"
          /><button
            v-if="clearable && current !== null && !disabled && !readonly"
            type="button"
            class="hys-ui-number-clear"
            aria-label="清空数值"
            @mousedown.prevent
            @click="clear"
          >
            <slot name="clear-icon"><X :size="13" /></slot>
          </button>
        </div>
        <template v-if="showControls && controlsPosition === 'both'"
          ><button
            type="button"
            class="hys-ui-number-decrease"
            aria-label="减少"
            :disabled="decreaseDisabled"
            @mousedown.prevent
            @pointerdown="pointerDown(-1, $event)"
            @pointerleave="stopRepeat"
            @click="clicked(-1, $event)"
          >
            <slot name="decrease-icon"><Minus :size="16" /></slot></button
          ><button
            type="button"
            class="hys-ui-number-increase"
            aria-label="增加"
            :disabled="increaseDisabled"
            @mousedown.prevent
            @pointerdown="pointerDown(1, $event)"
            @pointerleave="stopRepeat"
            @click="clicked(1, $event)"
          >
            <slot name="increase-icon"><Plus :size="16" /></slot></button
        ></template>
        <div v-else-if="showControls" class="hys-ui-number-controls">
          <button
            type="button"
            aria-label="增加"
            :disabled="increaseDisabled"
            @mousedown.prevent
            @pointerdown="pointerDown(1, $event)"
            @pointerleave="stopRepeat"
            @click="clicked(1, $event)"
          >
            <slot name="increase-icon"><ChevronUp :size="13" /></slot></button
          ><button
            type="button"
            aria-label="减少"
            :disabled="decreaseDisabled"
            @mousedown.prevent
            @pointerdown="pointerDown(-1, $event)"
            @pointerleave="stopRepeat"
            @click="clicked(-1, $event)"
          >
            <slot name="decrease-icon"><ChevronDown :size="13" /></slot>
          </button>
        </div>
      </div>
      <span v-if="$slots.append" class="hys-ui-number-addon"
        ><slot name="append"
      /></span>
    </div>
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :value="currentDecimal ? decimalText(currentDecimal) : ''"
      :disabled="disabled"
    />
    <small
      v-if="error"
      :id="errorId"
      class="hys-ui-number-error-text"
      role="alert"
      >{{ error }}</small
    >
  </div>
</template>
<style scoped>
.hys-ui-number-wrap {
  width: 100%;
  max-width: 210px;
  min-width: 0;
}
.hys-ui-number-block {
  max-width: none;
}
.hys-ui-number-group {
  display: flex;
  align-items: stretch;
  min-width: 0;
}
.hys-ui-ex-number {
  box-sizing: border-box;
  flex: 1;
  max-width: none;
  min-width: 0;
  overflow: hidden;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.hys-ui-ex-number:focus-within {
  box-shadow: 0 0 0 2px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 10%,
      transparent
    );
}
.hys-ui-number-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.hys-ui-number-main input {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  min-height: 36px;
  padding: 7px 6px;
  font: inherit;
  outline: none;
  border: 0;
  box-shadow: none;
  border-radius: 0;
}
.hys-ui-number-main input::placeholder {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-number-prefix {
  order: -1;
  margin-left: 10px;
}
.hys-ui-number-affix {
  display: flex;
  align-items: center;
  flex: none;
  max-width: 40%;
  font-size: 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  white-space: nowrap;
}
.hys-ui-number-affix:not(.hys-ui-number-prefix) {
  margin-right: 8px;
}
.hys-ui-number-loading {
  flex: none;
  margin-right: 8px;
}
.hys-ui-number-decrease {
  order: -1;
  border-inline-end: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border)) !important;
}
.hys-ui-number-increase {
  border-inline-start: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border)) !important;
}
.hys-ui-number-controls {
  display: flex;
  flex-direction: column;
  flex: 0 0 30px;
  border-inline-start: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border));
}
.hys-ui-number-controls button {
  flex: 1 1 0;
  min-height: 0;
  border: 0 !important;
}
.hys-ui-number-controls button + button {
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border)) !important;
}
.hys-ui-number-main .hys-ui-number-clear {
  flex: 0 0 22px;
  width: 22px;
  margin-right: 5px;
  align-self: center;
  min-height: 22px;
  border: 0;
  background: transparent;
}
.hys-ui-number-sm .hys-ui-ex-number {
  min-height: 30px;
}
.hys-ui-number-sm input {
  min-height: 28px;
  font-size: 12px;
  padding: 5px 6px;
}
.hys-ui-number-lg .hys-ui-ex-number {
  min-height: 44px;
}
.hys-ui-number-lg input {
  min-height: 42px;
  font-size: 15px;
  padding: 10px 8px;
}
.hys-ui-number-addon {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 8px;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
  font-size: 13px;
}
.hys-ui-number-borderless {
  border-color: transparent;
  background: transparent;
}
.hys-ui-number-round {
  border-radius: 999px;
}
.hys-ui-number-error,
.hys-ui-number-error:focus-within {
  border-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-number-error:focus-within {
  box-shadow: 0 0 0 2px
    color-mix(
      in srgb,
      var(--hys-ui-red, var(--hys-ui-theme-red)) 10%,
      transparent
    );
}
.hys-ui-number-warning {
  border-color: var(--hys-ui-orange, var(--hys-ui-theme-orange));
}
.hys-ui-number-success {
  border-color: var(--hys-ui-green, var(--hys-ui-theme-green));
}
.hys-ui-number-error-text {
  display: block;
  margin-top: 5px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
  font-size: 12px;
}
</style>
