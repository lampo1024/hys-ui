<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onDeactivated, ref, watch, type InputHTMLAttributes, type VNodeChild } from "vue";
import { Search, X, LoaderCircle } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import { fieldKey, useHysControlState } from "../../composables/formContext";
import HysButton from "../HysButton/HysButton.vue";

export interface HysSearchProps {
  modelValue?: string;
  defaultValue?: string;
  placeholder?: string;
  /** 输入触发模式的等待时间，单位为毫秒。 */
  delay?: number;
  /** 输入时防抖搜索，或只在确认时搜索。 */
  trigger?: "input" | "submit";
  /** 显示搜索按钮，可传按钮文案。 */
  enterButton?: boolean | string;
  /** 清空后立即搜索。省略时跟随触发模式。 */
  searchOnClear?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  searchLabel?: string;
  size?: "sm" | "md" | "lg";
  inputProps?: InputHTMLAttributes;
}
export interface HysSearchButtonContext {
  search: (event?: Event) => void;
  disabled: boolean;
  loading: boolean;
}
const props = withDefaults(defineProps<HysSearchProps>(), {
  defaultValue: "",
  delay: 300,
  placeholder: "搜索…",
  trigger: "input",
  searchOnClear: undefined,
  searchLabel: "搜索",
  clearable: true,
});
const slots = defineSlots<{
  prefix?: () => VNodeChild;
  suffix?: () => VNodeChild;
  "clear-icon"?: () => VNodeChild;
  "search-button"?: (context: HysSearchButtonContext) => VNodeChild;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [value: string, event?: Event];
  clear: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const { disabled, label, size } = useHysControlState(props);
const field = inject(fieldKey, undefined);
const skin = useHysRootAttrs();
const input = ref<HTMLInputElement>();
const local = ref(props.defaultValue);
const value = computed(() => props.modelValue ?? local.value);
const hasButton = () => !!props.enterButton || !!slots["search-button"];
const composing = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
let pending: string | undefined;
let revision = 0;

function cancel() {
  clearTimeout(timer);
  timer = undefined;
  pending = undefined;
  revision++;
}
function dispatch(text: string, event?: Event) {
  cancel();
  if (!disabled.value) emit("search", text, event);
}
function submit(event?: Event) {
  if (disabled.value || composing.value || (props.loading && (hasButton() || props.trigger === "submit"))) return;
  dispatch(value.value, event);
}
function schedule(text: string, event?: Event) {
  pending = text;
  const delay = Number.isFinite(props.delay) ? Math.max(0, props.delay) : 300;
  timer = setTimeout(() => dispatch(text, event), delay);
}
async function update(text: string, event?: Event, clearing = false) {
  if (disabled.value || props.readonly || composing.value || text === value.value) return;
  cancel();
  const token = revision;
  pending = text;
  if (props.modelValue === undefined) local.value = text;
  emit("update:modelValue", text);
  await nextTick();
  if (token !== revision || value.value !== text) {
    if (input.value && !composing.value) input.value.value = value.value;
    return;
  }
  pending = undefined;
  if (clearing) {
    emit("clear");
    input.value?.focus({ preventScroll: true });
    if (props.searchOnClear === true) dispatch(text, event);
  }
  if ((!clearing || props.searchOnClear === undefined) && props.trigger === "input") schedule(text, event);
}
function onInput(event: Event) {
  if ((event as InputEvent).isComposing) return;
  void update((event.target as HTMLInputElement).value, event);
}
function compositionStart() {
  composing.value = true;
  cancel();
}
function compositionEnd(event: CompositionEvent) {
  composing.value = false;
  onInput(event);
}
function enter(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229 || composing.value) return;
  if (hasButton() || props.trigger === "submit") event.preventDefault();
  if (!event.repeat) submit(event);
}
function clear(event?: Event) {
  return update("", event, true);
}
watch([disabled, () => props.readonly, () => props.trigger], cancel, { flush: "sync" });
watch(value, (text) => {
  if (pending !== undefined && text !== pending) cancel();
});
onBeforeUnmount(cancel);
onDeactivated(() => {
  cancel();
  composing.value = false;
});
defineExpose({
  input,
  search: submit,
  clear: () => clear(),
  focus: (options?: FocusOptions) => input.value?.focus(options),
  blur: () => input.value?.blur(),
  select: () => input.value?.select(),
});
</script>

<template>
  <div v-bind="skin" class="hys-ui-search" :class="['hys-ui-search-' + size, { 'hys-ui-search-joined': hasButton() }]">
    <div class="hys-ui-ex-search" :aria-busy="loading || undefined">
      <slot name="prefix">
        <LoaderCircle v-if="loading && !hasButton()" class="hys-ui-icon-spin" :size="16" aria-hidden="true" />
        <Search v-else :size="16" aria-hidden="true" />
      </slot>
      <input
        ref="input"
        v-bind="inputProps"
        type="search"
        :id="inputProps?.id || field?.id.value || undefined"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-label="ariaLabel || inputProps?.['aria-label'] || label || searchLabel"
        :aria-describedby="inputProps?.['aria-describedby'] || field?.describedBy.value"
        @input="onInput"
        @compositionstart="compositionStart"
        @compositionend="compositionEnd"
        @keydown.enter="enter"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
      />
      <button
        v-if="clearable && value && !disabled && !readonly"
        class="hys-ui-search-clear"
        type="button"
        aria-label="清空搜索"
        @mousedown.prevent
        @click="clear($event)"
      >
        <slot name="clear-icon"><X :size="14" aria-hidden="true" /></slot>
      </button>
      <slot name="suffix" />
    </div>
    <slot v-if="hasButton()" name="search-button" :search="submit" :disabled="disabled" :loading="!!loading">
      <HysButton class="hys-ui-search-submit" :disabled="disabled" :loading="loading" :size="size" :aria-label="searchLabel" @click="submit">
        <template v-if="typeof enterButton === 'string'">{{ enterButton }}</template>
        <Search v-else-if="!loading" :size="16" aria-hidden="true" />
      </HysButton>
    </slot>
  </div>
</template>

<style scoped>
.hys-ui-search { display: flex; align-items: stretch; min-width: 0; }
.hys-ui-search .hys-ui-ex-search {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
}
.hys-ui-search-sm .hys-ui-ex-search { min-height: 30px; padding-block: 4px; font-size: 12px; }
.hys-ui-search-md .hys-ui-ex-search { min-height: 38px; font-size: 13px; }
.hys-ui-search-lg .hys-ui-ex-search { min-height: 44px; font-size: 15px; }
.hys-ui-search-joined {
  border-radius: 9px;
}
.hys-ui-search-joined .hys-ui-ex-search {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}
.hys-ui-search-joined > .hys-ui-ex-search:focus-within {
  outline: none;
}
.hys-ui-search-joined:has(> .hys-ui-ex-search:focus-within) {
  outline: 1px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  box-shadow: 0 0 0 3px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 14%,
      transparent
    );
}
.hys-ui-search-submit {
  flex: none;
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}
.hys-ui-search input::-webkit-search-cancel-button { appearance: none; }
.hys-ui-search-clear { flex: none; padding: 2px; border-radius: 4px; }
.hys-ui-search-clear:focus-visible { outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary)); }
.hys-ui-search[data-hys-motion="off"] .hys-ui-icon-spin { animation: none; }
@media (prefers-reduced-motion: reduce) {
  .hys-ui-search .hys-ui-icon-spin { animation: none; }
}
</style>
