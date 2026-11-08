<script setup lang="ts" generic="T extends HysChoiceValue = boolean">
import {
  computed,
  inject,
  onMounted,
  ref,
  toRaw,
  useAttrs,
  useId,
  watch,
  type Component,
  type CSSProperties,
} from "vue";
import { LoaderCircle } from "lucide-vue-next";
import { fieldKey, useHysControlState } from "../../composables/formContext";
import {
  useChoiceModel,
  useChoiceNativeReset,
} from "../../composables/choiceModel";
import {
  isChoice,
  type HysChoiceValue,
  type HysSwitchGuardContext,
} from "../../composables/choice";
import { useHysRootAttrs } from "../../config";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue?: T;
    defaultValue?: T;
    activeValue?: T;
    inactiveValue?: T;
    disabled?: boolean;
    readonly?: boolean;
    loading?: boolean;
    size?: "sm" | "md" | "lg";
    width?: number | string;
    round?: boolean;
    activeColor?: string;
    inactiveColor?: string;
    activeText?: string;
    inactiveText?: string;
    inlinePrompt?: boolean;
    activeIcon?: Component;
    inactiveIcon?: Component;
    activeActionIcon?: Component;
    inactiveActionIcon?: Component;
    ariaLabel?: string;
    name?: string;
    form?: string;
    tabindex?: number;
    autofocus?: boolean;
    focusable?: boolean;
    error?: string;
    status?: "error" | "warning" | "success";
    beforeChange?: (
      next: T,
      current: T,
      context: HysSwitchGuardContext,
    ) => boolean | void | Promise<boolean | void>;
  }>(),
  {
    modelValue: undefined,
    defaultValue: undefined,
    activeValue: undefined,
    inactiveValue: undefined,
    round: true,
    focusable: true,
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: T];
  change: [value: T];
  error: [error: unknown];
  click: [value: T, event: MouseEvent];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();
const skin = useHysRootAttrs(),
  attrs = useAttrs(),
  element = ref<HTMLButtonElement>(),
  field = inject(fieldKey, undefined),
  { disabled, size, label } = useHysControlState(props),
  pending = ref(false),
  errorId = useId(),
  focused = ref(false);
let operation = 0,
  controller: AbortController | undefined;
function cancel() {
  operation++;
  controller?.abort();
  controller = undefined;
  pending.value = false;
}
const activeValue = computed<HysChoiceValue>(() =>
    isChoice(props.activeValue) ? props.activeValue : true,
  ),
  inactiveValue = computed<HysChoiceValue>(() =>
    isChoice(props.inactiveValue) ? props.inactiveValue : false,
  ),
  model = useChoiceModel<HysChoiceValue>(
    props,
    () => props.defaultValue ?? inactiveValue.value,
    Object.is,
    cancel,
  ),
  checked = computed(() => model.current.value === activeValue.value),
  busy = computed(() => props.loading || pending.value),
  status = computed(() =>
    props.error || field?.invalid?.value || props.status === "error"
      ? "error"
      : (props.status ?? field?.status?.value),
  );
watch(() => [disabled.value, props.readonly, props.loading], cancel, {
  flush: "sync",
});
watch([activeValue, inactiveValue], model.invalidate, { flush: "sync" });
async function toggle() {
  if (!model.isLive() || disabled.value || props.readonly || busy.value)
    return false;
  const next = checked.value ? inactiveValue.value : activeValue.value;
  if (next === model.current.value) return false;
  const token = ++operation,
    abort = new AbortController();
  controller = abort;
  pending.value = !!props.beforeChange;
  try {
    if (
      props.beforeChange &&
      (await props.beforeChange(next as T, model.current.value as T, {
        signal: abort.signal,
      })) === false
    )
      return false;
    if (
      !model.isLive() ||
      token !== operation ||
      abort.signal.aborted ||
      disabled.value ||
      props.readonly ||
      props.loading
    )
      return false;
    return await model.commit(
      next,
      (value) => emit("update:modelValue", value as T),
      (value) => emit("change", value as T),
      true,
    );
  } catch (error) {
    if (model.isLive() && token === operation) emit("error", error);
    return false;
  } finally {
    if (token === operation) {
      pending.value = false;
      controller = undefined;
    }
  }
}
function click(event: MouseEvent) {
  if (disabled.value || props.readonly || busy.value) return;
  emit("click", model.current.value as T, event);
  void toggle();
}
function focus(options?: FocusOptions) {
  if (!disabled.value && !busy.value) element.value?.focus(options);
}
useChoiceNativeReset(element, model.reset, undefined, () => props.form);
onMounted(() => {
  if (props.autofocus) focus();
});
const nativeAttrs = () =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"),
  );
const railStyle = computed(() => ({
  width:
    typeof props.width === "number" && Number.isFinite(props.width)
      ? Math.max(0, props.width) + "px"
      : (props.width ?? (props.inlinePrompt ? "max-content" : undefined)),
  "--hys-ui-switch-on":
    props.activeColor || "var(--hys-ui-primary,var(--hys-ui-theme-primary))",
  "--hys-ui-switch-off":
    props.inactiveColor || "var(--hys-ui-border,var(--hys-ui-theme-border))",
}));
defineExpose({
  element,
  checked,
  pending,
  focus,
  blur: () => element.value?.blur(),
  toggle,
});
</script>
<template>
  <span
    v-bind="skin"
    class="hys-ui-switch-wrap"
    :class="[
      attrs.class,
      'hys-ui-switch-' + size,
      {
        'hys-ui-switch-disabled': disabled,
        'hys-ui-switch-readonly': readonly,
      },
    ]"
    :style="attrs.style as CSSProperties"
    ><button
      ref="element"
      v-bind="nativeAttrs()"
      :id="(attrs.id as string) || field?.id.value"
      data-hys-ui-field-managed
      type="button"
      role="switch"
      class="hys-ui-switch"
      :data-status="status"
      :class="{
        'hys-ui-on': checked,
        'hys-ui-switch-square': !round,
        'hys-ui-switch-inline': inlinePrompt,
        'hys-ui-switch-error': status === 'error',
      }"
      :style="railStyle"
      :disabled="disabled || busy"
      :tabindex="focusable ? tabindex : -1"
      :autofocus="autofocus"
      :aria-label="
        ariaLabel ||
        (attrs['aria-label'] as string) ||
        label ||
        activeText ||
        inactiveText ||
        '切换'
      "
      :aria-checked="checked"
      :aria-readonly="readonly || undefined"
      :aria-busy="busy || undefined"
      :aria-invalid="status === 'error' || undefined"
      :aria-describedby="
        [attrs['aria-describedby'], error ? errorId : field?.describedBy.value]
          .filter(Boolean)
          .join(' ') || undefined
      "
      @mousedown="!focusable && $event.preventDefault()"
      @click="click"
      @focus="
        focused = true;
        emit('focus', $event);
      "
      @blur="
        focused = false;
        emit('blur', $event);
      "
    >
      <span v-if="inlinePrompt" class="hys-ui-switch-sizer" aria-hidden="true"
        ><span>{{ activeText }}</span
        ><span>{{ inactiveText }}</span></span
      ><span v-if="inlinePrompt" class="hys-ui-switch-prompt" aria-hidden="true"
        ><template v-if="checked"
          ><slot name="active"
            ><component
              :is="toRaw(activeIcon)"
              v-if="activeIcon"
              :size="14"
            /><template v-else>{{ activeText }}</template></slot
          ></template
        ><template v-else
          ><slot name="inactive"
            ><component
              :is="toRaw(inactiveIcon)"
              v-if="inactiveIcon"
              :size="14"
            /><template v-else>{{ inactiveText }}</template></slot
          ></template
        ></span
      ><span class="hys-ui-switch-thumb" aria-hidden="true"
        ><slot
          name="thumb"
          :checked="checked"
          :loading="busy"
          :focused="focused"
          ><slot v-if="busy" name="loading"
            ><LoaderCircle
              class="hys-ui-icon-spin"
              :size="size === 'lg' ? 14 : 11" /></slot
          ><component
            :is="toRaw(checked ? activeActionIcon : inactiveActionIcon)"
            v-else-if="checked ? activeActionIcon : inactiveActionIcon"
            :size="size === 'lg' ? 14 : 11" /></slot
      ></span></button
    ><span
      v-if="
        !inlinePrompt &&
        (activeText ||
          inactiveText ||
          activeIcon ||
          inactiveIcon ||
          $slots.active ||
          $slots.inactive)
      "
      class="hys-ui-switch-text"
      ><template v-if="checked"
        ><slot name="active"
          ><component :is="toRaw(activeIcon)" v-if="activeIcon" :size="15" />{{
            activeText
          }}</slot
        ></template
      ><template v-else
        ><slot name="inactive"
          ><component
            :is="toRaw(inactiveIcon)"
            v-if="inactiveIcon"
            :size="15"
          />{{ inactiveText }}</slot
        ></template
      ></span
    ><input
      v-if="name"
      type="hidden"
      :name="name"
      :form="form"
      :value="String(model.current.value)"
      :disabled="disabled"
    /><small
      v-if="error"
      :id="errorId"
      class="hys-ui-switch-error-text"
      role="alert"
      >{{ error }}</small
    >
  </span>
</template>
<style scoped>
.hys-ui-switch-wrap {
  --hys-ui-switch-height: 23px;
  --hys-ui-switch-thumb-size: 17px;
  --hys-ui-switch-min-width: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  font-size: 13px;
  vertical-align: middle;
}
.hys-ui-switch-sm {
  --hys-ui-switch-height: 18px;
  --hys-ui-switch-thumb-size: 12px;
  --hys-ui-switch-min-width: 32px;
  font-size: 12px;
}
.hys-ui-switch-lg {
  --hys-ui-switch-height: 28px;
  --hys-ui-switch-thumb-size: 22px;
  --hys-ui-switch-min-width: 50px;
  font-size: 15px;
}
.hys-ui-switch {
  position: relative;
  display: inline-grid;
  align-items: center;
  flex: none;
  width: var(--hys-ui-switch-min-width);
  min-width: var(--hys-ui-switch-min-width);
  height: var(--hys-ui-switch-height);
  max-width: 100%;
  border: 0;
  border-radius: 999px;
  padding: 0;
  background: var(--hys-ui-switch-off);
  cursor: pointer;
  box-sizing: border-box;
  vertical-align: middle;
  transition: background-color 0.18s;
  line-height: 1;
}
.hys-ui-switch.hys-ui-on {
  background: var(--hys-ui-switch-on);
}
.hys-ui-switch:focus-visible {
  outline: 2px solid
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 50%,
      transparent
    );
  outline-offset: 3px;
}
.hys-ui-switch-thumb {
  position: absolute;
  display: grid;
  place-items: center;
  top: 3px;
  inset-inline-start: 3px;
  width: var(--hys-ui-switch-thumb-size);
  height: var(--hys-ui-switch-thumb-size);
  border-radius: 50%;
  background: #fff;
  color: var(--hys-ui-switch-on);
  box-shadow: 0 1px 3px #0002;
  transition: inset-inline-start 0.18s ease;
}
.hys-ui-on > .hys-ui-switch-thumb {
  inset-inline-start: calc(100% - var(--hys-ui-switch-thumb-size) - 3px);
}
.hys-ui-switch-square {
  border-radius: 5px;
}
.hys-ui-switch-square > .hys-ui-switch-thumb {
  border-radius: 3px;
}
.hys-ui-switch-sizer {
  display: grid;
  visibility: hidden;
  padding: 0 calc(var(--hys-ui-switch-thumb-size) + 13px) 0 8px;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
  overflow: hidden;
}
.hys-ui-switch-sizer > span {
  grid-area: 1/1;
}
.hys-ui-switch-prompt {
  position: absolute;
  inset-inline-start: calc(var(--hys-ui-switch-thumb-size) + 8px);
  inset-inline-end: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 11px;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  pointer-events: none;
}
.hys-ui-on > .hys-ui-switch-prompt {
  inset-inline-start: 7px;
  inset-inline-end: calc(var(--hys-ui-switch-thumb-size) + 8px);
  color: #fff;
}
.hys-ui-switch-text {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-ui-switch-disabled {
  opacity: 0.5;
}
.hys-ui-switch:disabled {
  cursor: not-allowed;
}
.hys-ui-switch-readonly .hys-ui-switch {
  cursor: default;
}
.hys-ui-switch-error {
  outline: 1px solid var(--hys-ui-red, var(--hys-ui-theme-red));
  outline-offset: 2px;
}
.hys-ui-switch-error-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
[data-hys-motion="off"] .hys-ui-switch,
[data-hys-motion="off"] .hys-ui-switch-thumb {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-switch,
  .hys-ui-switch-thumb {
    transition: none;
  }
}
.hys-ui-switch-wrap:has(.hys-ui-switch-error-text) {
  flex-wrap: wrap;
  row-gap: 0;
}
.hys-ui-switch-error-text {
  flex-basis: 100%;
}
.hys-ui-switch[data-status="warning"] {
  outline: 1px solid var(--hys-ui-orange, var(--hys-ui-theme-orange));
  outline-offset: 2px;
}
.hys-ui-switch[data-status="success"] {
  outline: 1px solid var(--hys-ui-green, var(--hys-ui-theme-green));
  outline-offset: 2px;
}
</style>
