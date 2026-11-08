<script setup lang="ts" generic="T extends HysChoiceValue = string">
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  toRaw,
  useAttrs,
  useId,
  watch,
  type CSSProperties,
} from "vue";
import { useHysRootAttrs } from "../../config";
import { fieldKey, useHysControlState } from "../../composables/formContext";
import {
  useChoiceModel,
  useChoiceNativeReset,
} from "../../composables/choiceModel";
import {
  choiceKey,
  choiceOptions,
  type HysChoiceValue,
  type HysChoiceDataOption,
  type HysChoiceFieldNames,
} from "../../composables/choice";
import type { HysSegmentedOption } from "../../composables/segmented";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: T | null;
    defaultValue?: T | null;
    options?: readonly HysChoiceDataOption<T>[];
    fieldNames?: HysChoiceFieldNames;
    disabled?: boolean;
    readonly?: boolean;
    block?: boolean;
    vertical?: boolean;
    direction?: "horizontal" | "vertical";
    size?: "sm" | "md" | "lg";
    round?: boolean;
    keyboard?: boolean;
    loopNavigation?: boolean;
    focusable?: boolean;
    autofocus?: boolean;
    ariaLabel?: string;
    name?: string;
    form?: string;
    status?: "error" | "warning" | "success";
    error?: string;
    emptyText?: string;
  }>(),
  {
    keyboard: true,
    loopNavigation: true,
    focusable: true,
    emptyText: "暂无选项",
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: T];
  change: [value: T];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const root = ref<HTMLElement>(),
  attrs = useAttrs(),
  skin = useHysRootAttrs(),
  id = useId(),
  field = inject(fieldKey, undefined),
  { disabled, size, label } = useHysControlState(props);
const options = computed(
    () =>
      choiceOptions(
        props.options ?? [],
        props.fieldNames,
      ) as HysSegmentedOption<T>[],
  ),
  model = useChoiceModel<HysChoiceValue | null>(props, () =>
    props.defaultValue === undefined
      ? (options.value.find((item) => !item.disabled)?.value ?? null)
      : props.defaultValue,
  ),
  value = model.current,
  selected = computed(() =>
    options.value.find((option) => Object.is(option.value, value.value)),
  ),
  vertical = computed(() =>
    props.direction ? props.direction === "vertical" : props.vertical,
  );
const enabled = computed(() =>
    options.value.filter((option) => !option.disabled),
  ),
  tabValue = computed(
    () =>
      enabled.value.find((option) => Object.is(option.value, value.value))
        ?.value ?? enabled.value[0]?.value,
  ),
  status = computed(() =>
    props.error || field?.invalid?.value
      ? "error"
      : (props.status ?? field?.status?.value),
  );
const indicator = ref<CSSProperties>({ opacity: 0 }),
  animated = ref(false);
let live = true,
  observer: ResizeObserver | undefined,
  frame: number | undefined,
  animationFrame: number | undefined;
function buttons() {
  return Array.from(
    root.value?.querySelectorAll<HTMLButtonElement>(
      ":scope > .hys-ui-segment-option",
    ) ?? [],
  );
}
function measure() {
  frame = undefined;
  if (!live || !root.value) return;
  const item = buttons().find(
    (button) => button.dataset.key === choiceKey(value.value as HysChoiceValue),
  );
  if (!item || !root.value.getClientRects().length) {
    indicator.value = { opacity: 0 };
    return;
  }
  indicator.value = {
    opacity: 1,
    transform:
      "translate3d(" + item.offsetLeft + "px," + item.offsetTop + "px,0)",
    width: item.offsetWidth + "px",
    height: item.offsetHeight + "px",
  };
  if (!animated.value && animationFrame === undefined)
    animationFrame = requestAnimationFrame(() => {
      animationFrame = undefined;
      if (live) animated.value = true;
    });
}
function schedule() {
  if (live && frame === undefined) frame = requestAnimationFrame(measure);
}
function detach() {
  observer?.disconnect();
  observer = undefined;
  window.removeEventListener("resize", schedule);
  if (frame !== undefined) cancelAnimationFrame(frame);
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
  frame = animationFrame = undefined;
}
function observe() {
  if (!live || !root.value) return;
  detach();
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(schedule);
    observer.observe(root.value);
    const item = buttons().find(
      (button) =>
        button.dataset.key === choiceKey(value.value as HysChoiceValue),
    );
    if (item) observer.observe(item);
  } else window.addEventListener("resize", schedule);
  schedule();
}
async function select(next: HysChoiceValue) {
  if (
    disabled.value ||
    props.readonly ||
    !model.isLive() ||
    !options.value.some(
      (option) => Object.is(option.value, next) && !option.disabled,
    )
  )
    return false;
  return model.commit(
    next,
    (next) => emit("update:modelValue", next as T),
    (next) => emit("change", next as T),
    true,
  );
}
function focus(next?: HysChoiceValue) {
  if (disabled.value || !props.focusable) return;
  const target = next ?? tabValue.value;
  buttons()
    .find(
      (button) =>
        button.dataset.key === choiceKey(target as HysChoiceValue) &&
        !button.disabled,
    )
    ?.focus();
}
function blur() {
  if (root.value?.contains(document.activeElement))
    (document.activeElement as HTMLElement)?.blur();
}
function key(event: KeyboardEvent) {
  if (
    !props.keyboard ||
    event.defaultPrevented ||
    disabled.value ||
    props.readonly ||
    ![
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ].includes(event.key)
  )
    return;
  if (
    event.target !== root.value &&
    !(
      event.target instanceof HTMLButtonElement &&
      event.target.parentElement === root.value
    )
  )
    return;
  event.preventDefault();
  const items = enabled.value;
  if (!items.length) return;
  const rtl = root.value && getComputedStyle(root.value).direction === "rtl",
    back =
      event.key === "ArrowUp" ||
      event.key === (rtl ? "ArrowRight" : "ArrowLeft"),
    target = (event.target as HTMLElement).dataset.key,
    index = target
      ? items.findIndex((item) => choiceKey(item.value) === target)
      : items.findIndex((item) => Object.is(item.value, value.value));
  let next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : index < 0
          ? back
            ? items.length - 1
            : 0
          : index + (back ? -1 : 1);
  next = props.loopNavigation
    ? (next + items.length) % items.length
    : Math.max(0, Math.min(items.length - 1, next));
  focus(items[next].value);
  void select(items[next].value);
}
watch(
  [value, options, vertical, size, () => props.block],
  () => void nextTick(observe),
  { flush: "post" },
);
useChoiceNativeReset(root, model.reset, undefined, () => props.form);
onMounted(() => {
  observe();
  if (props.autofocus) focus();
});
onActivated(() => {
  live = true;
  animated.value = false;
  void nextTick(observe);
});
onDeactivated(() => {
  live = false;
  animated.value = false;
  detach();
});
onBeforeUnmount(() => {
  live = false;
  detach();
});
defineExpose({ element: root, value, focus, blur, select });
</script>
<template>
  <div
    ref="root"
    v-bind="{ ...skin, ...attrs }"
    :id="(attrs.id as string) || field?.id.value"
    data-hys-ui-field-managed
    class="hys-ui-ex-segment"
    :class="[
      'hys-ui-segment-' + size,
      {
        'hys-ui-segment-block': block,
        'hys-ui-segment-vertical': vertical,
        'hys-ui-segment-round': round,
        'hys-ui-segment-disabled': disabled,
        'hys-ui-segment-readonly': readonly,
        'hys-ui-segment-animated': animated,
      },
    ]"
    :data-status="status"
    role="radiogroup"
    :aria-label="
      ariaLabel || (attrs['aria-label'] as string) || label || '分段选择'
    "
    :aria-orientation="vertical ? 'vertical' : 'horizontal'"
    :aria-disabled="disabled || undefined"
    :aria-readonly="readonly || undefined"
    :aria-required="field?.required.value || undefined"
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
    <span
      class="hys-ui-segment-indicator"
      :style="indicator"
      aria-hidden="true"
    ></span>
    <button
      v-for="option in options"
      :key="choiceKey(option.value)"
      :data-key="choiceKey(option.value)"
      :data-value="option.value"
      type="button"
      class="hys-ui-segment-option"
      :class="[
        option.className,
        { 'hys-ui-active': Object.is(value, option.value) },
      ]"
      :style="option.style"
      role="radio"
      :disabled="disabled || option.disabled"
      :aria-disabled="readonly || undefined"
      :aria-checked="Object.is(value, option.value)"
      :tabindex="
        !disabled && focusable && Object.is(tabValue, option.value) ? 0 : -1
      "
      :title="option.title"
      @click="select(option.value)"
    >
      <slot
        name="icon"
        :option="option"
        :checked="Object.is(value, option.value)"
        ><component
          v-if="option.icon"
          :is="toRaw(option.icon)"
          class="hys-ui-segment-icon"
          aria-hidden="true" /></slot
      ><span class="hys-ui-segment-label"
        ><slot
          name="label"
          :option="option"
          :checked="Object.is(value, option.value)"
          ><slot
            :item="option"
            :option="option"
            :checked="Object.is(value, option.value)"
            >{{ option.label }}</slot
          ></slot
        ></span
      >
    </button>
    <span v-if="!options.length" class="hys-ui-segment-empty"
      ><slot name="empty">{{ emptyText }}</slot></span
    >
    <input
      v-if="name && selected && !selected.disabled"
      type="hidden"
      :name="name"
      :form="form"
      :value="String(value)"
      :disabled="disabled"
    />
    <small
      v-if="error"
      :id="id + '-error'"
      class="hys-ui-segment-error"
      role="alert"
      >{{ error }}</small
    >
  </div>
</template>
<style scoped>
.hys-ui-ex-segment {
  width: max-content;
  display: inline-flex;
  align-items: stretch;
  position: relative;
  max-width: 100%;
  min-width: 0;
  padding: 4px;
  gap: 4px;
  border-radius: 10px;
  background: var(
    --hys-ui-segment-bg,
    var(--hys-ui-bg, var(--hys-ui-theme-bg))
  );
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  isolation: isolate;
  vertical-align: middle;
  flex-wrap: wrap;
}
.hys-ui-segment-option {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  flex: none;
  margin: 0;
  padding: 8px 16px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
  transition: color 0.15s;
  touch-action: manipulation;
}
.hys-ui-segment-option:hover:not(:disabled):not([aria-disabled="true"]):not(.hys-ui-active) {
  background:var(--hys-ui-segment-hover-bg,var(--hys-ui-theme-primary-soft));
}
.hys-ui-segment-option:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-segment-option.hys-ui-active {
  color: var(
    --hys-ui-segment-selected-color,
    var(--hys-ui-text, var(--hys-ui-theme-text))
  );
}
.hys-ui-segment-indicator {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  pointer-events: none;
  background: var(
    --hys-ui-segment-selected-bg,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
  border-radius: 7px;
  box-shadow: 0 1px 5px #00000012;
}
.hys-ui-segment-animated > .hys-ui-segment-indicator {
  transition:
    transform 0.18s ease,
    width 0.18s ease,
    height 0.18s ease,
    opacity 0.12s ease;
}
.hys-ui-segment-label {
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-ui-segment-icon {
  width: 16px;
  height: 16px;
  flex: none;
}
.hys-ui-segment-block {
  display: flex;
  width: 100%;
}
.hys-ui-segment-block > .hys-ui-segment-option {
  flex: 1;
}
.hys-ui-segment-vertical {
  flex-direction: column;
  align-items: stretch;
}
.hys-ui-segment-vertical > .hys-ui-segment-option {
  justify-content: flex-start;
}
.hys-ui-segment-round,
.hys-ui-segment-round > .hys-ui-segment-indicator,
.hys-ui-segment-round > .hys-ui-segment-option {
  border-radius: 999px;
}
.hys-ui-segment-sm > .hys-ui-segment-option {
  padding: 5px 10px;
  font-size: 12px;
}
.hys-ui-segment-lg > .hys-ui-segment-option {
  padding: 11px 20px;
  font-size: 15px;
}
.hys-ui-segment-option:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hys-ui-segment-disabled {
  opacity: 0.65;
}
.hys-ui-segment-readonly > .hys-ui-segment-option {
  cursor: default;
}
.hys-ui-segment-empty {
  padding: 8px 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 12px;
}
.hys-ui-segment-error {
  flex-basis: 100%;
  width: 100%;
  padding: 4px;
  color: var(--hys-ui-danger, #e5484d);
  font-size: 12px;
}
.hys-ui-ex-segment[data-status="error"] {
  box-shadow: 0 0 0 1px var(--hys-ui-danger, #e5484d);
}
[data-hys-motion="off"] > .hys-ui-segment-indicator,
[data-hys-motion="off"] > .hys-ui-segment-option {
  transition: none !important;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-segment-indicator,
  .hys-ui-segment-option {
    transition: none !important;
  }
}
</style>
