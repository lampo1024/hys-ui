<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";
import HysInput from "../HysInput/HysInput.vue";
import type {
  HysInputProps,
  HysInputInstance,
  HysInputCountInfo,
} from "../../composables/textInput";
defineOptions({ inheritAttrs: false });
defineSlots<{
  prefix?:()=>any; suffix?:()=>any; prepend?:()=>any; append?:()=>any;
  'clear-icon'?:()=>any; count?:(info:HysInputCountInfo)=>any;
}>()
const props = withDefaults(
  defineProps<
    Omit<
      HysInputProps,
      | "type"
      | "showPassword"
      | "showPasswordOn"
      | "passwordVisible"
      | "defaultPasswordVisible"
    >
  >(),
  {
    rows: 4,
    showCount: undefined,
    resize: "vertical",
    bordered: true,
    countPosition: "inside",
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: string];
  input: [value: string];
  change: [value: string];
  clear: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  pressEnter: [event: KeyboardEvent];
  compositionstart: [event: CompositionEvent];
  compositionupdate: [event: CompositionEvent];
  compositionend: [event: CompositionEvent];
}>();
const control = ref<HysInputInstance>(),
  attrs = useAttrs();
defineExpose({
  input: computed(() => control.value?.textarea),
  textarea: computed(() => control.value?.textarea),
  isComposing: computed(() => control.value?.isComposing ?? false),
  focus: (options?: FocusOptions) => control.value?.focus(options),
  blur: () => control.value?.blur(),
  select: () => control.value?.select(),
  clear: () => control.value?.clear(),
  resize: () => control.value?.resize() ?? Promise.resolve(),
  setSelectionRange: (
    start: number,
    end: number,
    direction?: "forward" | "backward" | "none",
  ) => control.value?.setSelectionRange(start, end, direction),
  scrollTo: (options: ScrollToOptions) => control.value?.scrollTo(options),
});
</script>
<template>
  <HysInput
    ref="control"
    v-bind="{ ...props, ...attrs }"
    :show-count="props.showCount ?? (props.maxlength !== undefined)"
    type="textarea"
    class="hys-ui-ex-field"
    @update:model-value="emit('update:modelValue', $event)"
    @input="emit('input', $event)"
    @change="emit('change', $event)"
    @clear="emit('clear')"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
    @press-enter="emit('pressEnter', $event)"
    @compositionstart="emit('compositionstart', $event)"
    @compositionupdate="emit('compositionupdate', $event)"
    @compositionend="emit('compositionend', $event)"
  >
    <template v-if="$slots.prefix" #prefix><slot name="prefix"/></template>
    <template v-if="$slots.suffix" #suffix><slot name="suffix"/></template>
    <template v-if="$slots.prepend" #prepend><slot name="prepend"/></template>
    <template v-if="$slots.append" #append><slot name="append"/></template>
    <template v-if="$slots['clear-icon']" #clear-icon><slot name="clear-icon"/></template>
    <template v-if="$slots.count" #count="info"><slot name="count" v-bind="info"/></template>
  </HysInput>
</template>
