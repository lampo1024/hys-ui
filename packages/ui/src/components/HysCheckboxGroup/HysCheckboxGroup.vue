<script setup lang="ts" generic="T extends HysChoiceValue = HysChoiceValue">
import {
  computed,
  inject,
  onMounted,
  provide,
  ref,
  shallowRef,
  useAttrs,
  useId,
} from "vue";
import HysCheckbox from "../HysCheckbox/HysCheckbox.vue";
import { fieldKey, useHysControlState } from "../../composables/formContext";
import {
  checkboxGroupKey,
  choiceOptions,
  choiceKey,
  uniqueChoices,
  type HysChoiceValue,
  type HysChoiceDataOption,
  type HysChoiceFieldNames,
  type HysCheckboxGroupContext,
  type HysCheckboxChange,
  type HysCheckboxReject,
} from "../../composables/choice";
import { useHysRootAttrs } from "../../config";
import {
  useChoiceModel,
  useChoiceNativeReset,
} from "../../composables/choiceModel";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: T[];
    defaultValue?: T[];
    options?: readonly HysChoiceDataOption<T>[];
    fieldNames?: HysChoiceFieldNames;
    disabled?: boolean;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
    min?: number;
    max?: number;
    required?: boolean;
    name?: string;
    form?: string;
    ariaLabel?: string;
    vertical?: boolean;
    type?: "checkbox" | "button";
    buttonStyle?: "outline" | "solid";
    border?: boolean;
    error?: string;
    status?: "error" | "warning" | "success";
    autofocus?: boolean;
    emptyText?: string;
  }>(),
  { type: "checkbox", emptyText: "暂无选项" },
);
const emit = defineEmits<{
  "update:modelValue": [value: T[]];
  change: [value: T[], info: HysCheckboxChange];
  reject: [info: HysCheckboxReject];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const { disabled, size } = useHysControlState(props),
  field = inject(fieldKey, undefined),
  attrs = useAttrs(),
  hysRootAttrs = useHysRootAttrs(),
  root = ref<HTMLElement>(),
  errorId = useId();
const model = useChoiceModel<HysChoiceValue[]>(
    props,
    () => uniqueChoices(props.defaultValue ?? []),
    (a, b) =>
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => value === b[index]),
  ),
  values = computed(() => uniqueChoices(model.current.value ?? [])),
  options = computed(() =>
    choiceOptions(props.options ?? [], props.fieldNames),
  ),
  records = shallowRef<Parameters<HysCheckboxGroupContext["register"]>[0][]>(
    [],
  );
const minimum = computed(() =>
    Math.max(
      props.required ? 1 : 0,
      Number.isFinite(props.min) ? Math.floor(props.min!) : 0,
    ),
  ),
  maximum = computed(() =>
    props.max !== undefined && Number.isFinite(props.max)
      ? Math.max(0, Math.floor(props.max))
      : Infinity,
  ),
  badRange = computed(() => minimum.value > maximum.value);
const status = computed(() =>
  props.error ||
  field?.invalid?.value ||
  props.status === "error" ||
  badRange.value ||
  values.value.length > maximum.value
    ? "error"
    : (props.status ?? field?.status?.value),
);
function limited(value: HysChoiceValue) {
  return (
    badRange.value ||
    (values.value.includes(value)
      ? values.value.length <= minimum.value
      : values.value.length >= maximum.value)
  );
}
async function publish(next: HysChoiceValue[], info: HysCheckboxChange) {
  if (
    next.length === values.value.length &&
    next.every((item, index) => item === values.value[index])
  )
    return false;
  return model.commit(
    next,
    (value) => emit("update:modelValue", value as T[]),
    (value) => emit("change", value as T[], info),
    true,
  );
}
async function toggle(
  value: HysChoiceValue,
  checked = !values.value.includes(value),
) {
  if (!model.isLive() || disabled.value || props.readonly) return false;
  const record = records.value.find((item) => item.value.value === value);
  const option = options.value.find((item) => item.value === value);
  if (!record && !option) return false;
  if (record?.locked.value || option?.disabled) return false;
  if (values.value.includes(value) === checked) return false;
  if (limited(value)) {
    emit("reject", {
      value,
      checked,
      reason: badRange.value ? "range" : checked ? "max" : "min",
    });
    return false;
  }
  return publish(
    checked
      ? [...values.value, value]
      : values.value.filter((item) => item !== value),
    { value, checked, source: "toggle" },
  );
}
const available = computed(() =>
  props.options !== undefined
    ? options.value
        .filter((option) => !option.disabled)
        .map((option) => option.value)
    : [
        ...new Set(
          records.value
            .filter(
              (record) =>
                !record.locked.value && record.value.value !== undefined,
            )
            .map((record) => record.value.value!),
        ),
      ],
);
const allChecked = computed(
    () =>
      available.value.length > 0 &&
      available.value.every((value) => values.value.includes(value)),
  ),
  indeterminate = computed(
    () =>
      !allChecked.value &&
      available.value.some((value) => values.value.includes(value)),
  );
async function checkAll() {
  if (!model.isLive() || disabled.value || props.readonly || badRange.value)
    return false;
  const next = [...values.value];
  for (const value of available.value)
    if (!next.includes(value) && next.length < maximum.value) next.push(value);
  return publish(next, { source: "all" });
}
async function clear() {
  if (!model.isLive() || disabled.value || props.readonly || badRange.value)
    return false;
  const removable = new Set(available.value),
    next = values.value.filter((value) => !removable.has(value));
  for (const value of values.value)
    if (next.length < minimum.value && !next.includes(value)) next.push(value);
  return publish(next, { source: "clear" });
}
function focus(value?: HysChoiceValue) {
  if (disabled.value) return;
  const preferred = records.value.find(
    (record) =>
      record.value.value === (value ?? values.value[0]) &&
      !record.input.value?.disabled,
  );
  (
    preferred?.input.value ||
    root.value?.querySelector<HTMLInputElement>(
      'input[type="checkbox"]:not(:disabled)',
    )
  )?.focus();
}
provide(checkboxGroupKey, {
  values,
  disabled,
  readonly: computed(() => !!props.readonly),
  size,
  button: computed(() => props.type === "button"),
  border: computed(() => !!props.border),
  solid: computed(() => props.buttonStyle === "solid"),
  status,
  form: computed(() => props.form),
  isLimited: limited,
  toggle,
  register: (record) => {
    if (!records.value.includes(record))
      records.value = [...records.value, record];
    return () =>
      (records.value = records.value.filter((item) => item !== record));
  },
});
useChoiceNativeReset(root, model.reset, undefined, () => props.form);
function isValueDisabled(value: HysChoiceValue) {
  return (
    !!options.value.find((option) => option.value === value)?.disabled ||
    !!records.value.find((record) => record.value.value === value)?.disabled
      .value
  );
}
onMounted(() => {
  if (props.autofocus) focus();
});
defineExpose({
  values,
  allChecked,
  indeterminate,
  focus,
  blur: () => {
    const active = document.activeElement as HTMLElement | null;
    if (active && root.value?.contains(active)) active.blur();
  },
  checkAll,
  clear,
  toggle,
});
</script>
<template>
  <div
    ref="root"
    v-bind="{ ...hysRootAttrs, ...attrs }"
    :id="(attrs.id as string) || field?.id.value"
    role="group"
    data-hys-ui-field-managed
    class="hys-ui-checkbox-group"
    :class="{ 'hys-ui-checkbox-group-vertical': vertical }"
    :aria-label="
      ariaLabel ||
      (attrs['aria-label'] as string) ||
      field?.label.value ||
      '复选框组'
    "
    :aria-disabled="disabled || undefined"
    :aria-readonly="readonly || undefined"
    :aria-required="
      required || field?.required.value || minimum > 0 || undefined
    "
    :aria-invalid="status === 'error' || undefined"
    :aria-describedby="
      [error ? errorId : field?.describedBy.value, attrs['aria-describedby']]
        .filter(Boolean)
        .join(' ') || undefined
    "
    @focusin="
      !root?.contains($event.relatedTarget as Node) && emit('focus', $event)
    "
    @focusout="
      !root?.contains($event.relatedTarget as Node) && emit('blur', $event)
    "
  >
    <template v-if="props.options !== undefined"
      ><HysCheckbox
        v-for="option in options"
        :key="choiceKey(option.value)"
        :value="option.value"
        :disabled="option.disabled"
        :indeterminate="option.indeterminate"
        ><slot
          name="option"
          :option="option"
          :checked="values.includes(option.value)"
          >{{ option.label }}</slot
        ></HysCheckbox
      ><span v-if="!options.length" class="hys-ui-checkbox-empty"
        ><slot name="empty">{{ emptyText }}</slot></span
      ></template
    >
    <slot
      v-else
      :values="values"
      :all-checked="allChecked"
      :indeterminate="indeterminate"
      :check-all="checkAll"
      :clear="clear"
      ><span class="hys-ui-checkbox-empty"
        ><slot name="empty">{{ emptyText }}</slot></span
      ></slot
    >
    <input
      v-for="value in values"
      v-if="name"
      :key="choiceKey(value)"
      type="hidden"
      :name="name"
      :form="form"
      :value="String(value)"
      :disabled="disabled || isValueDisabled(value)"
    />
    <small
      v-if="error"
      :id="errorId"
      role="alert"
      class="hys-ui-checkbox-group-error"
      >{{ error }}</small
    >
  </div>
</template>
<style scoped>
.hys-ui-checkbox-group {
  display: flex;
  align-items: flex-start;
  gap: 12px 18px;
  flex-wrap: wrap;
  min-width: 0;
}
.hys-ui-checkbox-group-vertical {
  flex-direction: column;
  align-items: flex-start;
}
.hys-ui-checkbox-empty {
  font-size: 13px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-checkbox-group-error {
  flex-basis: 100%;
  width: 100%;
  display: block;
  margin-top: 6px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
  font-size: 12px;
}
</style>
