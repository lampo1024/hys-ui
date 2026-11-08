<script setup lang="ts" generic="T extends HysChoiceValue = string">
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
import HysRadio from "../HysRadio/HysRadio.vue";
import { fieldKey, useHysControlState } from "../../composables/formContext";
import {
  choiceKey,
  choiceOptions,
  radioGroupKey,
  type HysChoiceValue,
  type HysChoiceDataOption,
  type HysChoiceFieldNames,
  type HysChoiceOption,
  type HysRadioGroupContext,
} from "../../composables/choice";
import {
  useChoiceModel,
  useChoiceNativeReset,
} from "../../composables/choiceModel";
import { useHysRootAttrs } from "../../config";
export interface HysRadioOption<
  V extends HysChoiceValue = string,
> extends HysChoiceOption<V> {}
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: T | null;
    defaultValue?: T | null;
    options?: readonly HysChoiceDataOption<T>[];
    fieldNames?: HysChoiceFieldNames;
    name?: string;
    form?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    vertical?: boolean;
    size?: "sm" | "md" | "lg";
    ariaLabel?: string;
    type?: "radio" | "button";
    buttonStyle?: "outline" | "solid";
    border?: boolean;
    block?: boolean;
    loopNavigation?: boolean;
    autofocus?: boolean;
    error?: string;
    status?: "error" | "warning" | "success";
    emptyText?: string;
  }>(),
  {
    modelValue: undefined,
    defaultValue: undefined,
    type: "radio",
    buttonStyle: "outline",
    loopNavigation: true,
    emptyText: "暂无选项",
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: T];
  change: [value: T];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const { disabled, size, label: fieldLabel } = useHysControlState(props),
  field = inject(fieldKey, undefined),
  attrs = useAttrs(),
  skin = useHysRootAttrs(),
  root = ref<HTMLElement>(),
  id = useId(),
  model = useChoiceModel<HysChoiceValue | null>(
    props,
    () => props.defaultValue ?? null,
  ),
  value = model.current,
  options = computed(() =>
    choiceOptions(props.options ?? [], props.fieldNames),
  ),
  records = shallowRef<Parameters<HysRadioGroupContext["register"]>[0][]>([]),
  name = computed(() => props.name || id),
  status = computed(() =>
    props.error || field?.invalid?.value || props.status === "error"
      ? "error"
      : (props.status ?? field?.status?.value),
  );
const ordered = () =>
    [...records.value].sort((a, b) => {
      const x = a.input.value,
        y = b.input.value;
      return x && y
        ? x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : x === y
            ? 0
            : 1
        : 0;
    }),
  enabled = () =>
    ordered().filter(
      (record) => !record.input.value?.disabled && !record.locked.value,
    );
function sync() {
  for (const record of records.value)
    if (record.input.value)
      record.input.value.checked = record.value.value === value.value;
}
async function select(next: HysChoiceValue) {
  if (!model.isLive() || disabled.value || props.readonly) return false;
  const record = records.value.find((record) => record.value.value === next),
    option = options.value.find((option) => option.value === next);
  if ((!record && !option) || record?.locked.value || option?.disabled) {
    sync();
    return false;
  }
  const accepted = await model.commit(
    next,
    (next) => emit("update:modelValue", next as T),
    (next) => emit("change", next as T),
    true,
  );
  sync();
  return accepted;
}
function tabindex(next: HysChoiceValue) {
  const items = records.value.filter((record) => !record.disabled.value),
    selected =
      items.find((record) => record.value.value === value.value) ?? items[0];
  return selected?.value.value === next ? 0 : -1;
}
function focus(next?: HysChoiceValue) {
  if (disabled.value) return;
  const items = ordered().filter((record) => !record.input.value?.disabled);
  (
    items.find((record) => record.value.value === (next ?? value.value)) ??
    items[0]
  )?.input.value?.focus();
}
function blur() {
  const el = document.activeElement as HTMLElement | null;
  if (root.value?.contains(el)) el?.blur();
}
function key(event: KeyboardEvent) {
  if (
    ![
      "ArrowDown",
      "ArrowUp",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ].includes(event.key) ||
    (event.target as HTMLElement).tagName !== "INPUT"
  )
    return;
  event.preventDefault();
  if (disabled.value || props.readonly) return;
  const items = enabled();
  if (!items.length) return;
  const current = items.findIndex(
      (record) => record.input.value === event.target,
    ),
    rtl = root.value && getComputedStyle(root.value).direction === "rtl",
    direction =
      event.key === "ArrowDown" ||
      event.key === (rtl ? "ArrowLeft" : "ArrowRight")
        ? 1
        : -1;
  let index =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : current < 0
          ? direction > 0
            ? 0
            : items.length - 1
          : current + direction;
  if (props.loopNavigation) index = (index + items.length) % items.length;
  else index = Math.max(0, Math.min(items.length - 1, index));
  items[index].input.value?.focus();
  items[index].input.value?.click();
}
provide(radioGroupKey, {
  value,
  disabled,
  readonly: computed(() => !!props.readonly),
  required: computed(() => !!props.required || !!field?.required.value),
  size,
  button: computed(() => props.type === "button"),
  border: computed(() => !!props.border),
  solid: computed(() => props.buttonStyle === "solid"),
  name,
  form: computed(() => props.form),
  status,
  select,
  tabindex,
  register: (record) => {
    records.value = [...records.value, record];
    return () => {
      records.value = records.value.filter((item) => item !== record);
    };
  },
});
useChoiceNativeReset(root, model.reset, sync, () => props.form);
onMounted(() => {
  if (props.autofocus) focus();
});
defineExpose({ value, focus, blur, select });
</script>
<template>
  <div
    ref="root"
    v-bind="{ ...skin, ...attrs }"
    :id="(attrs.id as string) || field?.id.value"
    data-hys-ui-field-managed
    class="hys-ui-ex-radio"
    :class="[
      'hys-ui-radio-' + size,
      {
        'hys-ui-radio-disabled': disabled,
        'hys-ui-radio-readonly': readonly,
        'hys-ui-radio-vertical': vertical,
        'hys-ui-radio-block': block,
      },
    ]"
    role="radiogroup"
    :aria-label="
      ariaLabel || (attrs['aria-label'] as string) || fieldLabel || '单选组'
    "
    :aria-disabled="disabled || undefined"
    :aria-readonly="readonly || undefined"
    :aria-required="required || field?.required.value || undefined"
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
    @focusin="
      !root?.contains($event.relatedTarget as Node) && emit('focus', $event)
    "
    @focusout="
      !root?.contains($event.relatedTarget as Node) && emit('blur', $event)
    "
  >
    <template v-if="props.options !== undefined"
      ><HysRadio
        v-for="option in options"
        :key="choiceKey(option.value)"
        :value="option.value"
        :disabled="option.disabled"
        :required="required"
        ><template #default
          ><slot
            name="label"
            :option="option"
            :checked="value === option.value"
            >{{ option.label }}</slot
          ></template
        ></HysRadio
      ><span v-if="!options.length" class="hys-ui-radio-empty"
        ><slot name="empty">{{ emptyText }}</slot></span
      ></template
    ><slot v-else :value="value"
      ><span class="hys-ui-radio-empty"
        ><slot name="empty">{{ emptyText }}</slot></span
      ></slot
    >
    <small
      v-if="error"
      :id="id + '-error'"
      class="hys-ui-radio-group-error"
      role="alert"
      >{{ error }}</small
    >
  </div>
</template>
<style scoped>
.hys-ui-ex-radio {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px 18px;
  min-width: 0;
}
.hys-ui-radio-vertical {
  flex-direction: column;
}
.hys-ui-radio-block:not(.hys-ui-radio-vertical) {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.hys-ui-radio-block:not(.hys-ui-radio-vertical) > :deep(.hys-ui-radio-option) {
  flex: 1;
  min-width: 0;
  width: auto;
}
.hys-ui-radio-block :deep(.hys-ui-radio-option) {
  justify-content: center;
  width: 100%;
}
.hys-ui-radio-empty {
  font-size: 13px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-radio-group-error {
  flex-basis: 100%;
  width: 100%;
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
</style>
