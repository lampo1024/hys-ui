<script setup lang="ts" generic="T extends HysChoiceValue = HysChoiceValue">
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
} from "vue";
import { fieldKey, useHysControlState } from "../../composables/formContext";
import {
  radioGroupKey,
  isChoice,
  type HysChoiceValue,
} from "../../composables/choice";
import {
  useChoiceModel,
  useChoiceNativeReset,
} from "../../composables/choiceModel";
import { useHysRootAttrs } from "../../config";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: T | null;
    defaultValue?: T | null;
    value?: T;
    label?: string;
    disabled?: boolean;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
    button?: boolean;
    border?: boolean;
    buttonStyle?: "outline" | "solid";
    name?: string;
    form?: string;
    required?: boolean;
    ariaLabel?: string;
    tabindex?: number;
    focusable?: boolean;
    autofocus?: boolean;
    error?: string;
    status?: "error" | "warning" | "success";
  }>(),
  {
    modelValue: undefined,
    defaultValue: undefined,
    value: undefined,
    button: undefined,
    border: undefined,
    focusable: true,
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: T];
  change: [value: T];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const group = inject(radioGroupKey, undefined),
  field = inject(fieldKey, undefined),
  attrs = useAttrs(),
  skin = useHysRootAttrs(),
  input = ref<HTMLInputElement>(),
  errorId = useId(),
  state = useHysControlState(props),
  model = useChoiceModel<HysChoiceValue | null>(
    props,
    () => props.defaultValue ?? null,
  );
const value = computed(() => (isChoice(props.value) ? props.value : "on")),
  checked = computed(
    () => (group ? group.value.value : model.current.value) === value.value,
  ),
  disabled = computed(() => state.disabled.value || !!group?.disabled.value),
  readonly = computed(() => props.readonly || group?.readonly.value),
  size = computed(() => props.size ?? group?.size.value ?? state.size.value),
  button = computed(() => props.button ?? group?.button.value ?? false),
  border = computed(() => props.border ?? group?.border.value ?? false),
  solid = computed(() =>
    props.buttonStyle
      ? props.buttonStyle === "solid"
      : (group?.solid.value ?? false),
  ),
  status = computed(() =>
    props.error || props.status === "error" || (!group && field?.invalid?.value)
      ? "error"
      : (props.status ?? group?.status.value ?? field?.status?.value),
  );
function sync() {
  if (input.value) input.value.checked = checked.value;
}
async function select() {
  if (!model.isLive() || disabled.value || readonly.value) {
    sync();
    return false;
  }
  if (checked.value) {
    sync();
    return false;
  }
  const requested = group?.select(value.value);
  if (group) emit("change", value.value as T);
  const accepted = requested
    ? await requested
    : await model.commit(
        value.value,
        (next) => emit("update:modelValue", next as T),
        (next) => emit("change", next as T),
        true,
      );
  sync();
  const name = input.value?.name;
  if (!group && name)
    for (const node of document.getElementsByName(name))
      if (
        node instanceof HTMLInputElement &&
        node.type === "radio" &&
        node.form === input.value?.form &&
        node.hasAttribute("data-hys-ui-radio-controlled")
      )
        node.dispatchEvent(new Event("hys-ui-radio-sync"));
  return accepted;
}
let unregister: (() => void) | undefined;
function register() {
  if (group && !unregister)
    unregister = group.register({
      input,
      value: computed(() => value.value),
      disabled: computed(() => !!props.disabled),
      locked: computed(() => !!props.disabled || !!props.readonly),
    });
}
function cleanup() {
  unregister?.();
  unregister = undefined;
}
watch(checked, sync, { flush: "post" });
useChoiceNativeReset(
  input,
  model.reset,
  sync,
  () => props.form ?? group?.form.value,
);
onMounted(() => {
  sync();
  register();
  if (props.autofocus && !disabled.value) input.value?.focus();
});
onActivated(register);
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
const nativeAttrs = () =>
    Object.fromEntries(
      Object.entries(attrs).filter(
        ([key]) => key === "id" || key.startsWith("aria-"),
      ),
    ),
  rootAttrs = () =>
    Object.fromEntries(
      Object.entries(attrs).filter(
        ([key]) => key !== "id" && !key.startsWith("aria-"),
      ),
    );
defineExpose({
  input,
  checked,
  focus: (options?: FocusOptions) => {
    if (!disabled.value) input.value?.focus(options);
  },
  blur: () => input.value?.blur(),
  select,
});
</script>
<template>
  <label
    v-bind="{ ...skin, ...rootAttrs() }"
    class="hys-ui-radio-option"
    :data-status="status"
    :class="[
      'hys-ui-radio-' + size,
      {
        'hys-ui-radio-option-disabled': disabled,
        'hys-ui-radio-option-readonly': readonly,
        'hys-ui-radio-bordered': border,
        'hys-ui-radio-button': button,
        'hys-ui-radio-solid': solid,
        'hys-ui-radio-selected': checked,
        'hys-ui-radio-error': status === 'error',
      },
    ]"
    @mousedown="!focusable && $event.preventDefault()"
    ><input
      ref="input"
      v-bind="nativeAttrs()"
      class="hys-ui-radio-native"
      type="radio"
      :id="(attrs.id as string) || (!group ? field?.id.value : undefined)"
      data-hys-ui-field-managed
      :data-hys-ui-radio-controlled="modelValue !== undefined ? '' : undefined"
      :name="group?.name.value || name"
      :form="form || group?.form.value"
      :value="String(value)"
      :checked="checked"
      :disabled="disabled"
      :required="
        required || group?.required.value || (!group && field?.required.value)
      "
      :aria-readonly="readonly || undefined"
      :aria-label="
        ariaLabel ||
        (attrs['aria-label'] as string) ||
        label ||
        (!label && !$slots.default && !group ? field?.label.value : undefined)
      "
      :aria-invalid="status === 'error' || undefined"
      :aria-describedby="
        [
          attrs['aria-describedby'],
          error ? errorId : undefined,
          !group ? field?.describedBy.value : undefined,
        ]
          .filter(Boolean)
          .join(' ') || undefined
      "
      :tabindex="!focusable ? -1 : (tabindex ?? group?.tabindex(value))"
      @click="readonly && $event.preventDefault()"
      @change="select"
      @hys-ui-radio-sync="sync"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    /><span class="hys-ui-radio-box" aria-hidden="true"
      ><slot name="icon" :checked="checked" /></span
    ><span class="hys-ui-radio-label"
      ><slot>{{ label }}</slot></span
    ><small
      v-if="error"
      :id="errorId"
      class="hys-ui-radio-error-text"
      role="alert"
      >{{ error }}</small
    >
  </label>
</template>
<style scoped>
.hys-ui-radio-option {
  --hys-ui-radio-size: 16px;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  line-height: 1.5;
}
.hys-ui-radio-sm {
  --hys-ui-radio-size: 14px;
  font-size: 12px;
}
.hys-ui-radio-lg {
  --hys-ui-radio-size: 18px;
  font-size: 15px;
}
.hys-ui-radio-native {
  position: absolute;
  inset-inline-start: 0;
  top: 50%;
  transform: translateY(-50%);
  width: var(--hys-ui-radio-size);
  height: var(--hys-ui-radio-size);
  margin: 0;
  opacity: 0;
  cursor: inherit;
  z-index: 1;
}
.hys-ui-radio-box {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--hys-ui-radio-size);
  height: var(--hys-ui-radio-size);
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 50%;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.hys-ui-radio-box:empty:after {
  content: "";
  width: calc(var(--hys-ui-radio-size) - 8px);
  height: calc(var(--hys-ui-radio-size) - 8px);
  border-radius: 50%;
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  transform: scale(0);
  transition: transform 0.15s;
}
.hys-ui-radio-selected .hys-ui-radio-box {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-radio-selected .hys-ui-radio-box:after {
  transform: scale(1);
}
.hys-ui-radio-native:focus-visible + .hys-ui-radio-box {
  outline: 2px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 50%,
      transparent
    );
  outline-offset: 2px;
}
.hys-ui-radio-error .hys-ui-radio-box {
  border-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-radio-option-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hys-ui-radio-option-readonly {
  cursor: default;
}
.hys-ui-radio-label {
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-ui-radio-bordered,
.hys-ui-radio-button {
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  padding: 7px 12px;
  border-radius: 7px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  transition:
    background-color 0.15s,
    border-color 0.15s;
}
.hys-ui-radio-button .hys-ui-radio-box {
  display: none;
}
.hys-ui-radio-bordered.hys-ui-radio-selected,
.hys-ui-radio-button.hys-ui-radio-selected {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-color: currentColor;
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
.hys-ui-radio-button.hys-ui-radio-solid.hys-ui-radio-selected {
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  color: #fff;
}
.hys-ui-radio-bordered:has(input:focus-visible),
.hys-ui-radio-button:has(input:focus-visible) {
  outline: 2px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 45%,
      transparent
    );
  outline-offset: 2px;
}
.hys-ui-radio-sm.hys-ui-radio-bordered,
.hys-ui-radio-sm.hys-ui-radio-button {
  padding: 4px 9px;
}
.hys-ui-radio-lg.hys-ui-radio-bordered,
.hys-ui-radio-lg.hys-ui-radio-button {
  padding: 9px 15px;
}
.hys-ui-radio-error-text {
  display: block;
  margin-top: 6px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
  font-size: 12px;
}
[data-hys-motion="off"] .hys-ui-radio-box,
[data-hys-motion="off"].hys-ui-radio-option,
[data-hys-motion="off"] .hys-ui-radio-box:after {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-radio-option,
  .hys-ui-radio-box,
  .hys-ui-radio-box:after {
    transition: none;
  }
}
.hys-ui-radio-option:has(.hys-ui-radio-error-text) {
  flex-wrap: wrap;
  row-gap: 0;
}
.hys-ui-radio-error-text {
  flex-basis: 100%;
}
.hys-ui-radio-option[data-status="warning"] .hys-ui-radio-box {
  border-color: var(--hys-ui-orange, var(--hys-ui-theme-orange));
}
.hys-ui-radio-option[data-status="success"] .hys-ui-radio-box {
  border-color: var(--hys-ui-green, var(--hys-ui-theme-green));
}
</style>
