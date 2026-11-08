<script
  setup
  lang="ts"
  generic="T extends HysChoiceValue | HysChoiceValue[] = boolean"
>
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
import { Check, Minus } from "lucide-vue-next";
import { fieldKey, useHysControlState } from "../../composables/formContext";
import {
  checkboxGroupKey,
  isChoice,
  type HysChoiceValue,
} from "../../composables/choice";
import { useHysRootAttrs } from "../../config";
import {
  useChoiceModel,
  useChoiceNativeReset,
} from "../../composables/choiceModel";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: T;
    defaultValue?: T;
    label?: string;
    disabled?: boolean;
    ariaLabel?: string;
    readonly?: boolean;
    name?: string;
    form?: string;
    value?: HysChoiceValue;
    trueValue?: HysChoiceValue;
    falseValue?: HysChoiceValue;
    required?: boolean;
    indeterminate?: boolean;
    tabindex?: number;
    size?: "sm" | "md" | "lg";
    border?: boolean;
    button?: boolean;
    buttonStyle?: "outline" | "solid";
    autofocus?: boolean;
    focusable?: boolean;
    status?: "error" | "warning" | "success";
    error?: string;
  }>(),
  {
    modelValue: undefined,
    defaultValue: undefined,
    trueValue: undefined,
    falseValue: undefined,
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
const attrs = useAttrs(),
  group = inject(checkboxGroupKey, undefined),
  field = inject(fieldKey, undefined),
  hysRootAttrs = useHysRootAttrs(),
  input = ref<HTMLInputElement>();
const { disabled: inheritedDisabled, size: inheritedSize } =
  useHysControlState(props);
const model = useChoiceModel<HysChoiceValue | HysChoiceValue[]>(
    props,
    () => props.defaultValue ?? props.falseValue ?? false,
    (a, b) =>
      Array.isArray(a) && Array.isArray(b)
        ? a.length === b.length && a.every((value, index) => value === b[index])
        : a === b,
  ),
  current = model.current,
  errorId = useId();
const checked = computed(() =>
  group && props.value !== undefined
    ? group.values.value.includes(props.value)
    : Array.isArray(current.value)
      ? props.value !== undefined && current.value.includes(props.value)
      : current.value === (props.trueValue ?? true),
);
const readonly = computed(() => props.readonly || group?.readonly.value),
  locked = computed(() => !!props.disabled || !!props.readonly);
const disabled = computed(
  () =>
    inheritedDisabled.value ||
    group?.disabled.value ||
    !!(group && props.value !== undefined && group.isLimited(props.value)),
);
const size = computed(
    () => props.size ?? group?.size.value ?? inheritedSize.value,
  ),
  button = computed(() => props.button ?? group?.button.value ?? false),
  border = computed(() => props.border ?? group?.border.value ?? false);
const solid = computed(() =>
  props.buttonStyle
    ? props.buttonStyle === "solid"
    : (group?.solid.value ?? false),
);
const status = computed(() =>
  props.error || props.status === "error" || (!group && field?.invalid?.value)
    ? "error"
    : (props.status ?? group?.status.value ?? field?.status?.value),
);
const nativeKey = (key: string) =>
  key === "id" ||
  key === "form" ||
  key === "autofocus" ||
  key.startsWith("aria-");
const rootAttrs = () =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !nativeKey(key)));
const nativeAttrs = () =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => nativeKey(key)));
function sync() {
  if (input.value) {
    input.value.checked = checked.value;
    input.value.indeterminate = !!props.indeterminate;
  }
}
async function update(next: boolean) {
  if (!model.isLive() || disabled.value || readonly.value) {
    sync();
    return false;
  }
  if (group && props.value !== undefined) {
    if (next === checked.value) {
      sync();
      return false;
    }
    const requested = group.toggle(props.value, next);
    emit("change", next as T);
    const accepted = await requested;
    sync();
    return accepted;
  }
  const value = Array.isArray(current.value)
    ? next
      ? [
          ...new Set([
            ...current.value,
            ...(props.value === undefined ? [] : [props.value]),
          ]),
        ]
      : current.value.filter((item) => item !== props.value)
    : next
      ? (props.trueValue ?? true)
      : (props.falseValue ?? false);
  if (
    (Array.isArray(value) &&
      Array.isArray(current.value) &&
      value.length === current.value.length &&
      value.every(
        (item, index) => item === (current.value as HysChoiceValue[])[index],
      )) ||
    (!Array.isArray(value) && value === current.value)
  ) {
    sync();
    return false;
  }
  const accepted = await model.commit(
    value,
    (next) => emit("update:modelValue", next as T),
    (next) => emit("change", next as T),
    true,
  );
  sync();
  return accepted;
}
function change(event: Event) {
  update((event.target as HTMLInputElement).checked);
}
let unregister: (() => void) | undefined;
function register() {
  if (group && !unregister)
    unregister = group.register({
      input,
      value: computed(() => (isChoice(props.value) ? props.value : undefined)),
      locked,
      disabled: computed(() => !!props.disabled),
    });
}
function cleanup() {
  unregister?.();
  unregister = undefined;
}
watch([checked, () => props.indeterminate], sync, { flush: "post" });
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
defineExpose({
  input,
  checked,
  focus: (options?: FocusOptions) => {
    if (!disabled.value) input.value?.focus(options);
  },
  blur: () => input.value?.blur(),
  toggle: () => update(!checked.value),
});
</script>
<template>
  <label
    v-bind="{ ...hysRootAttrs, ...rootAttrs() }"
    class="hys-ui-check-label"
    :data-status="status"
    :data-indeterminate="indeterminate || undefined"
    :class="[
      'hys-ui-checkbox-' + size,
      {
        'hys-ui-checkbox-disabled': disabled,
        'hys-ui-checkbox-readonly': readonly,
        'hys-ui-checkbox-bordered': border,
        'hys-ui-checkbox-button': button,
        'hys-ui-checkbox-solid': solid,
        'hys-ui-checkbox-selected': checked || indeterminate,
        'hys-ui-checkbox-error': status === 'error',
      },
    ]"
    @mousedown="!focusable && $event.preventDefault()"
  >
    <input
      ref="input"
      v-bind="nativeAttrs()"
      class="hys-ui-checkbox-native"
      type="checkbox"
      :id="(attrs.id as string) || (!group ? field?.id.value : undefined)"
      data-hys-ui-field-managed
      :name="group ? undefined : name"
      :form="form || group?.form.value"
      :value="
        value === undefined
          ? trueValue === undefined
            ? 'on'
            : String(trueValue)
          : String(value)
      "
      :required="group ? undefined : required || field?.required.value"
      :aria-label="
        ariaLabel ||
        (attrs['aria-label'] as string) ||
        label ||
        (!label && !$slots.default && !group ? field?.label.value : undefined)
      "
      :aria-readonly="readonly || undefined"
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
      :indeterminate="indeterminate"
      :aria-checked="indeterminate ? 'mixed' : checked"
      :checked="checked"
      :disabled="disabled"
      :tabindex="focusable ? tabindex : -1"
      @click="readonly && $event.preventDefault()"
      @change="change"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
    <span
      class="hys-ui-checkbox-box"
      :class="{ 'hys-ui-checkbox-checked': checked || indeterminate }"
      aria-hidden="true"
      ><slot name="icon" :checked="checked" :indeterminate="indeterminate"
        ><component
          :is="indeterminate ? Minus : Check"
          v-if="checked || indeterminate"
          :size="size === 'sm' ? 11 : size === 'lg' ? 15 : 13"
          :stroke-width="2.4" /></slot
    ></span>
    <span v-if="label" class="hys-ui-checkbox-label">{{ label }}</span
    ><slot />
    <small
      v-if="error"
      :id="errorId"
      class="hys-ui-checkbox-error-text"
      role="alert"
      >{{ error }}</small
    >
  </label>
</template>
<style scoped>
.hys-ui-check-label {
  --hys-ui-checkbox-size: 16px;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
  user-select: none;
  font-weight: 400;
  line-height: 1.5;
}
.hys-ui-checkbox-sm {
  --hys-ui-checkbox-size: 14px;
  font-size: 12px;
}
.hys-ui-checkbox-lg {
  --hys-ui-checkbox-size: 18px;
  font-size: 16px;
}
.hys-ui-checkbox-native {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: var(--hys-ui-checkbox-size);
  height: var(--hys-ui-checkbox-size);
  margin: 0;
  opacity: 0;
  cursor: inherit;
  z-index: 1;
}
.hys-ui-checkbox-box {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  flex: none;
  width: var(--hys-ui-checkbox-size);
  height: var(--hys-ui-checkbox-size);
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 4px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: #fff;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}
.hys-ui-checkbox-box.hys-ui-checkbox-checked {
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-check-label:not(.hys-ui-checkbox-disabled):not(
    .hys-ui-checkbox-readonly
  ):hover
  .hys-ui-checkbox-box {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-checkbox-native:focus-visible + .hys-ui-checkbox-box {
  outline: 2px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 50%,
      transparent
    );
  outline-offset: 2px;
}
.hys-ui-checkbox-error .hys-ui-checkbox-box {
  border-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-checkbox-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hys-ui-checkbox-readonly {
  cursor: default;
}
.hys-ui-checkbox-label {
  min-width: 0;
}
.hys-ui-checkbox-error-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-ui-checkbox-bordered,
.hys-ui-checkbox-button {
  padding: 7px 12px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 7px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
}
.hys-ui-checkbox-bordered.hys-ui-checkbox-selected,
.hys-ui-checkbox-button.hys-ui-checkbox-selected {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
.hys-ui-checkbox-button .hys-ui-checkbox-box {
  display: none;
}
.hys-ui-checkbox-button[data-indeterminate] .hys-ui-checkbox-box {
  display: inline-grid;
  background: transparent;
  border-color: transparent;
  color: inherit;
}
.hys-ui-checkbox-button:has(input:focus-visible),
.hys-ui-checkbox-bordered:has(input:focus-visible) {
  outline: 2px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 45%,
      transparent
    );
  outline-offset: 2px;
}
.hys-ui-checkbox-sm.hys-ui-checkbox-bordered,
.hys-ui-checkbox-sm.hys-ui-checkbox-button {
  padding: 4px 9px;
}
.hys-ui-checkbox-lg.hys-ui-checkbox-bordered,
.hys-ui-checkbox-lg.hys-ui-checkbox-button {
  padding: 9px 15px;
}
.hys-ui-check-label:has(.hys-ui-checkbox-error-text) {
  flex-wrap: wrap;
  row-gap: 0;
}
.hys-ui-checkbox-error-text {
  flex-basis: 100%;
}
.hys-ui-checkbox-button.hys-ui-checkbox-solid.hys-ui-checkbox-selected {
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  color: white;
}
.hys-ui-check-label[data-status="warning"] .hys-ui-checkbox-box {
  border-color: var(--hys-ui-orange, var(--hys-ui-theme-orange));
}
.hys-ui-check-label[data-status="success"] .hys-ui-checkbox-box {
  border-color: var(--hys-ui-green, var(--hys-ui-theme-green));
}
</style>
