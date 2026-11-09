<script setup lang="ts" generic="V extends HysDatePickerValue = string">
import { ref, computed } from "vue";
import HysDatePickerControl from "./HysDatePickerControl.vue";
import {
  datePickerDefaults,
  type HysDatePickerProps,
  type HysDatePickerValue,
  type HysDatePickerChange,
  type HysDateScalar,
  type HysDatePickerView,
  type HysDatePickerSlots,
  type HysDatePickerInstance,
} from "../../composables/datePicker";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<HysDatePickerProps<V>>(),
  datePickerDefaults,
);
const emit = defineEmits<{
  "update:modelValue": [value: V];
  change: [value: V, info: HysDatePickerChange];
  "value-change": [value: V, info: HysDatePickerChange];
  "update:open": [value: boolean];
  "visible-change": [value: boolean];
  "update:panelValue": [value: HysDateScalar];
  "update:mode": [value: HysDatePickerView];
  panelChange: [
    date: Date,
    view: HysDatePickerView,
    context: { index: number },
  ];
  calendarChange: [
    value: HysDatePickerValue,
    context: { range: "start" | "end"; dates: readonly (Date | null)[] },
  ];
  clear: [];
  ok: [value: V];
  invalid: [
    info: { reason: string; dates?: readonly (Date | null)[]; error?: unknown },
  ];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const slots = defineSlots<HysDatePickerSlots>(),
  control = ref<HysDatePickerInstance<V>>();
const listeners = Object.fromEntries(
  [
    "update:modelValue",
    "change",
    "value-change",
    "update:open",
    "visible-change",
    "update:panelValue",
    "update:mode",
    "panelChange",
    "calendarChange",
    "clear",
    "ok",
    "invalid",
    "focus",
    "blur",
  ].map((name) => [
    name,
    (...args: any[]) =>
      (emit as (name: string, ...args: any[]) => void)(name, ...args),
  ]),
);
defineExpose({
  element: computed(() => control.value?.element),
  open: computed(() => control.value?.open ?? false),
  value: computed(() => control.value?.value),
  draft: computed(() => control.value?.draft ?? []),
  focus: () => control.value?.focus(),
  blur: () => control.value?.blur(),
  show: () => control.value?.show() ?? Promise.resolve(false),
  hide: (restore = false) => control.value?.hide(restore),
  handleOpen: () => control.value?.show() ?? Promise.resolve(false),
  handleClose: () => control.value?.hide(),
  clear: () => control.value?.clear() ?? Promise.resolve(false),
  setValue: (value: V) =>
    control.value?.setValue(value) ?? Promise.resolve(false),
  confirm: () => control.value?.confirm() ?? Promise.resolve(false),
  cancel: () => control.value?.cancel(),
  showMonth: (value: HysDateScalar) =>
    control.value?.showMonth(value) ?? Promise.resolve(false),
  setMode: (view: HysDatePickerView) => control.value?.setMode(view) ?? false,
});
</script>
<template>
  <HysDatePickerControl
    v-bind="{ ...(props as unknown as HysDatePickerProps), ...$attrs }"
    :range="false"
    ref="control"
    v-on="listeners"
    ><template v-if="$slots.default" #default="scope"
      ><slot v-bind="scope" /></template
    ><template v-if="$slots.cell" #cell="scope"
      ><slot name="cell" v-bind="scope" /></template
    ><template v-if="$slots.header" #header="scope"
      ><slot name="header" v-bind="scope" /></template
    ><template v-if="$slots.footer" #footer="scope"
      ><slot name="footer" v-bind="scope" /></template
    ><template v-if="$slots.shortcut" #shortcut="scope"
      ><slot name="shortcut" v-bind="scope" /></template
    ><template v-if="$slots['prefix']" #prefix><slot name="prefix" /></template
    ><template v-if="$slots['suffix']" #suffix><slot name="suffix" /></template
    ><template v-if="$slots['clear-icon']" #clear-icon
      ><slot name="clear-icon" /></template
    ><template v-if="$slots['prev-month']" #prev-month
      ><slot name="prev-month" /></template
    ><template v-if="$slots['next-month']" #next-month
      ><slot name="next-month" /></template
    ><template v-if="$slots['prev-year']" #prev-year
      ><slot name="prev-year" /></template
    ><template v-if="$slots['next-year']" #next-year
      ><slot name="next-year" /></template
    ><template v-if="$slots['range-separator']" #range-separator
      ><slot name="range-separator" /></template
  ></HysDatePickerControl>
</template>
