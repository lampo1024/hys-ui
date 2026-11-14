<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  useAttrs,
  useId,
  watch,
  type CSSProperties,
} from "vue";
import { X, Eye, EyeOff } from "lucide-vue-next";
import {
  fieldKey,
  formKey,
  useHysControlState,
} from "../../composables/formContext";
import { useHysRootAttrs } from "../../config";
import {
  modelText,
  textCount,
  textInputSize,
  textLimit,
  textLengthLimit,
  type HysInputProps,
} from "../../composables/textInput";
import { useTextareaSize } from "../../composables/useTextareaSize";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysInputProps>(), {
  type: "text",
  rows: 2,
  resize: "vertical",
  showPasswordOn: "click",
  passwordVisible: undefined,
  clearable: undefined,
  validateEvent: true,
  bordered: true,
  countPosition: "inside",
});
const emit = defineEmits<{
  "update:modelValue": [value: string];
  input: [value: string];
  change: [value: string];
  clear: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  pressEnter: [event: KeyboardEvent];
  keydown: [event: KeyboardEvent];
  mouseenter: [event: MouseEvent];
  mouseleave: [event: MouseEvent];
  compositionstart: [event: CompositionEvent];
  compositionupdate: [event: CompositionEvent];
  compositionend: [event: CompositionEvent];
  "update:passwordVisible": [value: boolean];
  passwordVisibleChange: [value: boolean];
}>();
const { disabled, size } = useHysControlState({
    get disabled() {
      return props.disabled;
    },
    get size() {
      return textInputSize(props.size);
    },
  }),
  field = inject(fieldKey, undefined),
  form = inject(formKey, undefined);
const hysRootAttrs = useHysRootAttrs(),
  attrs = useAttrs(),
  input = ref<HTMLInputElement | HTMLTextAreaElement>(),
  errorId = useId(),
  localId = useId(),
  countId = useId();
const localValue = ref(String(props.defaultValue ?? "")),
  current = computed(() =>
    props.modelValue === undefined
      ? localValue.value
      : String(props.modelValue ?? ""),
  );
const composing = ref(false),
  draft = ref(""),
  pendingValue = ref<string>(),
  localVisible = ref(props.defaultPasswordVisible),
  passwordVisible = computed(
    () => props.passwordVisible ?? localVisible.value ?? false,
  );
const textarea = computed(() => props.type === "textarea"),
  maxLength = computed(() => textLengthLimit(props.maxlength)),
  minLength = computed(() => textLengthLimit(props.minlength));
const rawDraft = computed(() => pendingValue.value ?? current.value);
const count = computed(() => textCount(rawDraft.value, props.countGraphemes)),
  overLimit = computed(
    () => maxLength.value !== undefined && count.value > maxLength.value,
  );
const invalid = computed(
  () =>
    !!(
      props.error ||
      field?.invalid?.value ||
      field?.error.value ||
      props.status === "error" ||
      overLimit.value
    ),
);
const status = computed(() =>
  invalid.value ? "error" : (props.status ?? field?.status?.value),
);
const inputId = computed(
  () =>
    (attrs.id as string) ||
    props.inputProps?.id ||
    field?.id.value ||
    (props.label ? localId : undefined),
);
const showCounter = computed(() => !!(props.showCount || props.showWordLimit));
const outside = computed(
  () => (props.wordLimitPosition ?? props.countPosition) === "outside",
);
const customLength = computed(
  () => !!(props.countGraphemes || props.formatter || props.parser),
);
const nativeName = computed(() => props.name ?? props.inputProps?.name);
const nativeForm = computed(() => props.form ?? props.inputProps?.form);
const hiddenName = computed(
  () => !!(props.formatter || props.parser) && !!nativeName.value,
);
const countText = computed(() => {
  try {
    if (typeof props.showCount === "object")
      return props.showCount.formatter({
        value: rawDraft.value,
        count: count.value,
        maxLength: maxLength.value,
      });
  } catch {}
  return (
    String(count.value) +
    (maxLength.value === undefined ? "" : " / " + maxLength.value)
  );
});
let live = true,
  revision = 0,
  echo: string | undefined,
  accepted = "",
  skipInput: string | undefined,
  stopPassword: (() => void) | undefined,
  lastChanged = current.value;
function format(value: string, typing = false, original = value) {
  try {
    return props.formatter
      ? String(props.formatter(value, { userTyping: typing, input: original }))
      : value;
  } catch {
    return value;
  }
}
function parse(value: string) {
  const raw = props.parser ? props.parser(value) : value;
  if (
    typeof raw !== "string" &&
    (typeof raw !== "number" || !Number.isFinite(raw))
  )
    throw Error("Invalid input parser result");
  return String(raw);
}
function display(value: string) {
  draft.value = value;
  accepted = value;
  if (input.value && input.value.value !== value) input.value.value = value;
}
function restore() {
  pendingValue.value = undefined;
  display(format(current.value));
}
function nativeAttrs() {
  return Object.fromEntries(
    Object.entries({ ...props.inputProps, ...attrs }).filter(
      ([key]) =>
        ![
          "class",
          "style",
          "type",
          "value",
          "defaultValue",
          "modelModifiers",
        ].includes(key),
    ),
  );
}
function nativeValidity() {
  const el = input.value;
  if (!el) return;
  const length = textCount(current.value, props.countGraphemes);
  el.setCustomValidity(
    customLength.value &&
      current.value &&
      minLength.value !== undefined &&
      length < minLength.value
      ? "请至少输入 " + minLength.value + " 个字符"
      : customLength.value &&
          maxLength.value !== undefined &&
          length > maxLength.value
        ? "请最多输入 " + maxLength.value + " 个字符"
        : "",
  );
}
function publish(value: string, emitInput = true) {
  const ticket = ++revision;
  const normalized = modelText(value, props.modelModifiers);
  const release = props.validateEvent
    ? undefined
    : field?.deferChangeValidation?.();
  echo = normalized;
  if (props.modelValue === undefined) localValue.value = normalized;
  emit("update:modelValue", value);
  if (emitInput) emit("input", value);
  void nextTick(() => {
    release?.();
    if (ticket !== revision || !live) return;
    if (current.value !== normalized) restore();
    echo = undefined;
    nativeValidity();
  });
}
function caret(original: string, formatted: string, position: number) {
  if (!props.parser)
    return Math.max(
      0,
      Math.min(
        formatted.length,
        formatted.length - (original.length - position),
      ),
    );
  try {
    const target = parse(original.slice(0, position)).length;
    if (!target)
      return Math.max(0, formatted.length - (original.length - position));
    let low = 0,
      high = formatted.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (parse(formatted.slice(0, middle)).length >= target) high = middle;
      else low = middle + 1;
    }
    return low;
  } catch {
    return Math.min(position, formatted.length);
  }
}
function edited(event: Event) {
  const el = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (!live || disabled.value || props.readonly) {
    restore();
    return;
  }
  if (composing.value) {
    draft.value = el.value;
    return;
  }
  if (skipInput !== undefined) {
    const skip = skipInput === el.value;
    skipInput = undefined;
    if (skip) return;
  }
  const original = el.value,
    position = el.selectionStart;
  try {
    const value = textLimit(
      parse(original),
      maxLength.value,
      props.countGraphemes,
    );
    if (props.allowInput && !props.allowInput(value))
      throw Error("Rejected input");
    const shown = format(value, true, original);
    display(shown);
    if (position !== null && shown !== original)
      try {
        const next = caret(original, shown, position);
        el.setSelectionRange(next, next);
      } catch {}
    if (props.modelModifiers?.lazy) {
      pendingValue.value = value;
      emit("input", value);
    } else {
      publish(value);
    }
  } catch {
    const previous = accepted;
    display(previous);
    if (position !== null)
      try {
        const next = Math.max(
          0,
          position - (original.length - previous.length),
        );
        el.setSelectionRange(next, next);
      } catch {}
  }
}
function clear() {
  if (!live || disabled.value || props.readonly) return;
  composing.value = false;
  skipInput = undefined;
  pendingValue.value = undefined;
  display(format(""));
  publish("");
  lastChanged = "";
  emit("change", "");
  emit("clear");
  input.value?.focus();
}
async function changed() {
  if (!live || disabled.value || props.readonly || composing.value) return;
  if (pendingValue.value !== undefined) {
    const value = pendingValue.value;
    pendingValue.value = undefined;
    publish(value, false);
  }
  await nextTick();
  if (!live || disabled.value || props.readonly || composing.value) return;
  restore();
  nativeValidity();
  if (lastChanged !== current.value) {
    lastChanged = current.value;
    emit("change", current.value);
  }
}
function onKeydown(event: KeyboardEvent) {
  emit("keydown", event);
  if (
    event.key !== "Enter" ||
    event.defaultPrevented ||
    event.isComposing ||
    composing.value ||
    event.keyCode === 229
  )
    return;
  if (!textarea.value) void changed();
  emit("pressEnter", event);
}
function compositionEnd(event: CompositionEvent) {
  if (!composing.value) return;
  composing.value = false;
  emit("compositionend", event);
  edited(event);
  skipInput = input.value?.value;
}
function setPassword(visible: boolean) {
  if (disabled.value || !live) return;
  if (props.passwordVisible === undefined) localVisible.value = visible;
  emit("update:passwordVisible", visible);
  emit("passwordVisibleChange", visible);
}
async function togglePassword() {
  if (disabled.value || props.showPasswordOn === "mousedown") return;
  const el = input.value,
    start = el?.selectionStart,
    end = el?.selectionEnd;
  setPassword(!passwordVisible.value);
  await nextTick();
  if (!live || disabled.value) return;
  el?.focus({ preventScroll: true });
  if (start != null && end != null)
    try {
      el?.setSelectionRange(start, end);
    } catch {}
}
function endPassword() {
  stopPassword?.();
  stopPassword = undefined;
}
function holdPassword(event: PointerEvent) {
  if (
    event.button !== 0 ||
    props.showPasswordOn !== "mousedown" ||
    disabled.value
  )
    return;
  event.preventDefault();
  endPassword();
  setPassword(true);
  const stop = () => {
    setPassword(false);
    endPassword();
  };
  document.addEventListener("pointerup", stop, true);
  document.addEventListener("pointercancel", stop, true);
  window.addEventListener("blur", stop);
  stopPassword = () => {
    document.removeEventListener("pointerup", stop, true);
    document.removeEventListener("pointercancel", stop, true);
    window.removeEventListener("blur", stop);
  };
}
function passwordKey(event: KeyboardEvent) {
  if (
    props.showPasswordOn === "mousedown" &&
    [" ", "Enter"].includes(event.key)
  ) {
    event.preventDefault();
    setPassword(!passwordVisible.value);
  }
}
const { resize, textareaStyle } = useTextareaSize(input, props, size, draft);
function cleanup() {
  endPassword();
  live = false;
  revision++;
  echo = undefined;
  composing.value = false;
  skipInput = undefined;
  localVisible.value = false;
  restore();
}
watch(
  current,
  () => {
    if (echo !== current.value) {
      composing.value = false;
      restore();
      lastChanged = current.value;
    }
    nativeValidity();
  },
  { flush: "sync" },
);
watch(
  () => [props.formatter, props.parser, props.type, props.modelModifiers?.lazy],
  () => {
    composing.value = false;
    restore();
    endPassword();
    localVisible.value = false;
  },
);
watch(
  () => [disabled.value, props.readonly],
  () => {
    if (disabled.value || props.readonly) {
      endPassword();
      localVisible.value = false;
      composing.value = false;
      restore();
    }
  },
);
watch(
  () => [props.countGraphemes, props.maxlength, props.minlength],
  nativeValidity,
);
watch(
  () => form?.resetting.value,
  (reset) => {
    if (reset) {
      revision++;
      echo = undefined;
      composing.value = false;
      skipInput = undefined;
      restore();
      lastChanged = current.value;
    }
  },
  { flush: "sync" },
);
onMounted(() => {
  restore();
  nativeValidity();
  if (props.autofocus && !disabled.value) input.value?.focus();
});
onActivated(() => {
  live = true;
});
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
defineExpose({
  element: input,
  input,
  textarea: computed(() =>
    textarea.value ? (input.value as HTMLTextAreaElement) : undefined,
  ),
  isComposing: composing,
  passwordVisible,
  textareaStyle,
  focus: (options?: FocusOptions) => {
    if (!disabled.value) input.value?.focus(options);
  },
  blur: () => input.value?.blur(),
  select: () => input.value?.select(),
  clear,
  resize,
  resizeTextarea: resize,
  setSelectionRange: (
    start: number,
    end: number,
    direction?: "forward" | "backward" | "none",
  ) => {
    try {
      input.value?.setSelectionRange(start, end, direction);
    } catch {}
  },
  scrollTo: (options: ScrollToOptions) => input.value?.scrollTo(options),
});
</script>
<template>
  <div
    v-bind="hysRootAttrs"
    class="hys-ui-input-wrap"
    :class="[
      attrs.class,
      'hys-ui-input-' + size,
      { 'hys-ui-input-disabled': disabled, 'hys-ui-input-textarea': textarea },
    ]"
    :style="attrs.style as CSSProperties"
    :data-hys-ui-validate-event="validateEvent ? undefined : 'off'"
    @mouseenter="emit('mouseenter', $event)"
    @mouseleave="emit('mouseleave', $event)"
  >
    <label v-if="label" class="hys-ui-input-label" :for="inputId">{{
      label
    }}</label>
    <div
      class="hys-ui-input-group"
      :class="{
        'hys-ui-input-has-prepend': $slots.prepend || addonBefore,
        'hys-ui-input-has-append': $slots.append || addonAfter,
      }"
    >
      <div v-if="$slots.prepend || addonBefore" class="hys-ui-input-addon">
        <slot name="prepend">{{ addonBefore }}</slot>
      </div>
      <div
        class="hys-ui-input-shell"
        :class="[
          status ? 'hys-ui-input-shell-' + status : '',
          { 'hys-ui-input-borderless': !bordered, 'hys-ui-input-round': round },
        ]"
      >
        <component
          :is="textarea ? 'textarea' : 'input'"
          ref="input"
          v-bind="nativeAttrs()"
          :id="inputId"
          :class="[
            inputProps?.class,
            textarea ? 'hys-ui-input hys-ui-ex-control hys-ui-scrollbar' : 'hys-ui-input',
          ]"
          data-hys-ui-field-managed
          :aria-label="
            ariaLabel ||
            (attrs['aria-label'] as string) ||
            field?.label.value ||
            (label ? undefined : inputProps?.['aria-label'])
          "
          :aria-invalid="invalid || undefined"
          :aria-required="
            field?.required.value || inputProps?.['aria-required']
          "
          :aria-describedby="
            [
              error ? errorId : field?.describedBy.value,
              attrs['aria-describedby'] || inputProps?.['aria-describedby'],
              showCounter ? countId : undefined,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          "
          :value="draft"
          :placeholder="placeholder ?? inputProps?.placeholder"
          :type="
            textarea
              ? undefined
              : showPassword && passwordVisible && type === 'password'
                ? 'text'
                : type
          "
          :disabled="disabled"
          :readonly="readonly"
          :maxlength="customLength ? undefined : maxLength"
          :minlength="customLength ? undefined : minLength"
          :autocomplete="autocomplete ?? inputProps?.autocomplete"
          :inputmode="inputmode ?? inputProps?.inputmode"
          :tabindex="tabindex ?? inputProps?.tabindex"
          :form="nativeForm"
          :name="hiddenName ? undefined : nativeName"
          :rows="textarea ? rows : undefined"
          :style="[
            inputProps?.style,
            inputStyle,
            textarea ? { resize: autosize ? 'none' : props.resize } : undefined,
            textareaStyle,
          ]"
          @input="edited"
          @compositionstart="
            composing = true;
            skipInput = undefined;
            emit('compositionstart', $event);
          "
          @compositionupdate="emit('compositionupdate', $event)"
          @compositionend="compositionEnd"
          @change="changed"
          @focus="
            selectOnFocus && input?.select();
            emit('focus', $event);
          "
          @blur="
            changed();
            emit('blur', $event);
          "
          @keydown="onKeydown"
        />
        <span
          v-if="$slots.prefix || prefixIcon"
          class="hys-ui-input-affix hys-ui-input-prefix"
          ><slot name="prefix"
            ><component :is="prefixIcon" :size="16" aria-hidden="true" /></slot
        ></span>
        <div class="hys-ui-input-trailing">
          <button
            v-if="
              (clearable ?? allowClear) && rawDraft && !disabled && !readonly
            "
            type="button"
            class="hys-ui-input-action"
            aria-label="清空输入"
            @mousedown.prevent
            @click="clear"
          >
            <slot name="clear-icon"
              ><component :is="clearIcon || X" :size="14" aria-hidden="true"
            /></slot>
          </button>
          <button
            v-if="showPassword && type === 'password'"
            type="button"
            class="hys-ui-input-action"
            :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
            :aria-pressed="passwordVisible"
            :disabled="disabled"
            @mousedown.prevent
            @pointerdown="holdPassword"
            @keydown="passwordKey"
            @click="togglePassword"
          >
            <slot name="password-icon" :visible="passwordVisible"
              ><component
                :is="passwordVisible ? EyeOff : Eye"
                :size="16"
                aria-hidden="true"
            /></slot>
          </button>
          <span v-if="$slots.suffix || suffixIcon" class="hys-ui-input-affix"
            ><slot name="suffix"
              ><component
                :is="suffixIcon"
                :size="16"
                aria-hidden="true" /></slot
          ></span>
          <small
            v-if="showCounter && !outside"
            :id="countId"
            class="hys-ui-input-count"
            :class="{ 'hys-ui-input-count-error': overLimit }"
            ><slot
              name="count"
              :value="rawDraft"
              :count="count"
              :max-length="maxLength"
              >{{ countText }}</slot
            ></small
          >
        </div>
      </div>
      <div v-if="$slots.append || addonAfter" class="hys-ui-input-addon">
        <slot name="append">{{ addonAfter }}</slot>
      </div>
    </div>
    <input
      v-if="hiddenName"
      type="hidden"
      :name="nativeName"
      :form="nativeForm"
      :value="current"
      :disabled="disabled"
    />
    <small
      v-if="showCounter && outside"
      :id="countId"
      class="hys-ui-input-count hys-ui-input-count-outside"
      :class="{ 'hys-ui-input-count-error': overLimit }"
      ><slot
        name="count"
        :value="rawDraft"
        :count="count"
        :max-length="maxLength"
        >{{ countText }}</slot
      ></small
    >
    <small v-if="error" :id="errorId" class="hys-ui-error-text" role="alert">{{
      error
    }}</small>
  </div>
</template>
<style scoped>
.hys-ui-input-wrap {
  min-width: 0;
  width: 100%;
}
.hys-ui-input-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 13px;
}
.hys-ui-input-group {
  display: flex;
  align-items: stretch;
  min-width: 0;
}
.hys-ui-input-shell {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 8px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  padding: 0 10px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.hys-ui-input-shell:focus-within {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: 0 0 0 2px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 10%,
      transparent
    );
}
.hys-ui-input-shell .hys-ui-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  flex: 1;
  padding: 8px 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1.5;
  min-height: 36px;
}
.hys-ui-input::placeholder {
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-input-trailing:empty {
  display: none;
}
.hys-ui-input-trailing {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: none;
  max-width: 55%;
}
.hys-ui-input-action {
  display: grid;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
  padding: 2px;
  background: transparent;
  border: 0;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  border-radius: 4px;
  cursor: pointer;
}
.hys-ui-input-action:hover {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-input-action:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 1px;
}
.hys-ui-input-affix,
.hys-ui-input-count {
  display: inline-flex;
  align-items: center;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  white-space: nowrap;
  font-size: 12px;
}
.hys-ui-input-affix {
  max-width: 40%;
}
.hys-ui-input-prefix {
  order: -1;
}
.hys-ui-input-count-outside {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
}
.hys-ui-input-count-error {
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-input-addon {
  padding: 0 10px;
  max-width: 45%;
  min-width: 0;
  flex: none;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.hys-ui-input-has-prepend .hys-ui-input-shell {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}
.hys-ui-input-has-prepend > .hys-ui-input-addon:first-child {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
  border-inline-end: 0;
}
.hys-ui-input-has-append .hys-ui-input-shell {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}
.hys-ui-input-has-append > .hys-ui-input-addon:last-child {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
  border-inline-start: 0;
}
.hys-ui-input-addon :deep(.hys-ui-select) {
  border: 0;
  box-shadow: none;
  outline: none;
  background: transparent;
  border-radius: 0;
  align-self: stretch;
  min-height: 0;
  height: 100%;
  padding: 0 12px;
  font: inherit;
}
.hys-ui-input-addon :deep(.hys-ui-select-wrap) {
  display: flex;
  align-self: stretch;
  max-width: 100%;
}
.hys-ui-input-addon :deep(.hys-ui-select-wrap > .hys-ui-select) {
  flex: 1;
}
.hys-ui-input-addon :deep(.hys-ui-select:focus-visible) {
  outline: none;
  box-shadow: none;
}
.hys-ui-input-addon :deep(.hys-ui-btn) {
  align-self: stretch;
  height: 100%;
  min-height: 0;
  border-radius: inherit;
  border: 0;
}
.hys-ui-input-addon:has(> .hys-ui-select-wrap),
.hys-ui-input-addon:has(> .hys-ui-btn) {
  padding: 0;
}
.hys-ui-input-group:has(> .hys-ui-input-addon) {
  --hys-ui-input-group-tone: var(--hys-ui-border, var(--hys-ui-theme-border));
  border: 1px solid var(--hys-ui-input-group-tone);
  border-radius: 8px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.hys-ui-input-group:has(> .hys-ui-input-addon):focus-within {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: 0 0 0 2px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 10%,
      transparent
    );
}
.hys-ui-input-group:has(> .hys-ui-input-addon) > .hys-ui-input-shell {
  border: 0;
  box-shadow: none;
}
.hys-ui-input-group:has(> .hys-ui-input-addon) > .hys-ui-input-addon {
  border: 0;
  border-radius: 0;
}
.hys-ui-input-group:has(> .hys-ui-input-addon)
  > .hys-ui-input-addon:first-child {
  border-inline-end: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-start-start-radius: 7px;
  border-end-start-radius: 7px;
}
.hys-ui-input-group:has(> .hys-ui-input-addon)
  > .hys-ui-input-addon:last-child {
  border-inline-start: 1px solid
    var(--hys-ui-border, var(--hys-ui-theme-border));
  border-start-end-radius: 7px;
  border-end-end-radius: 7px;
}
.hys-ui-input-group:has(.hys-ui-input-shell-error) {
  --hys-ui-input-group-tone: var(--hys-ui-red, var(--hys-ui-theme-red));
  border-color: var(--hys-ui-input-group-tone);
}
.hys-ui-input-group:has(.hys-ui-input-shell-error):focus-within {
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--hys-ui-input-group-tone) 10%, transparent);
}
.hys-ui-input-group:has(.hys-ui-input-shell-warning) {
  border-color: var(--hys-ui-orange, var(--hys-ui-theme-orange));
}
.hys-ui-input-group:has(.hys-ui-input-shell-success) {
  border-color: var(--hys-ui-green, var(--hys-ui-theme-green));
}
.hys-ui-input-sm .hys-ui-input-addon {
  font-size: 12px;
}
.hys-ui-input-lg .hys-ui-input-addon {
  font-size: 15px;
}
.hys-ui-input-disabled {
  opacity: 0.6;
}
.hys-ui-input-group:has(.hys-ui-input-borderless) {
  border-color: transparent;
}
.hys-ui-input-group:has(.hys-ui-input-round) {
  border-radius: 999px;
}
.hys-ui-input-group:has(.hys-ui-input-round) > .hys-ui-input-addon:first-child {
  border-start-start-radius: inherit;
  border-end-start-radius: inherit;
}
.hys-ui-input-group:has(.hys-ui-input-round) > .hys-ui-input-addon:last-child {
  border-start-end-radius: inherit;
  border-end-end-radius: inherit;
}
.hys-ui-input-disabled .hys-ui-input-shell {
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
.hys-ui-input-shell-error,
.hys-ui-input-shell-error:focus-within {
  border-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-input-shell-error:focus-within {
  box-shadow: 0 0 0 2px
    color-mix(
      in srgb,
      var(--hys-ui-red, var(--hys-ui-theme-red)) 10%,
      transparent
    );
}
.hys-ui-input-shell-warning {
  border-color: var(--hys-ui-orange, var(--hys-ui-theme-orange));
}
.hys-ui-input-shell-success {
  border-color: var(--hys-ui-green, var(--hys-ui-theme-green));
}
.hys-ui-input-sm .hys-ui-input {
  min-height: 28px;
  padding: 5px 0;
  font-size: 12px;
}
.hys-ui-input-lg .hys-ui-input {
  min-height: 42px;
  padding: 10px 0;
  font-size: 15px;
}
.hys-ui-input-borderless {
  border-color: transparent;
  background: transparent;
}
.hys-ui-input-round {
  border-radius: 999px;
}
.hys-ui-input-textarea .hys-ui-input-shell {
  align-items: stretch;
  position: relative;
}
.hys-ui-input-textarea .hys-ui-input {
  flex: 1;
  line-height: 1.5;
}
.hys-ui-input-textarea .hys-ui-input-trailing {
  position: absolute;
  bottom: 7px;
  inset-inline-end: 10px;
  max-width: 90%;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  border-radius: 4px;
}
.hys-ui-input-textarea:has(.hys-ui-input-trailing:not(:empty)) textarea {
  padding-bottom: 30px;
}
.hys-ui-input-textarea .hys-ui-input-prefix {
  align-self: flex-start;
  margin-top: 9px;
}
.hys-ui-input-textarea .hys-ui-input-round {
  border-radius: 16px;
}
.hys-ui-error-text {
  display: block;
  margin-top: 5px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
  font-size: 12px;
}
</style>
