<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  onActivated,
  onDeactivated,
  onBeforeUnmount,
  type CSSProperties,
} from "vue";
import { X } from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
const props = withDefaults(
  defineProps<{
    tone?: "blue" | "green" | "orange" | "red" | "purple" | "gray";
    size?: "sm" | "md" | "lg";
    round?: boolean;
    closable?: boolean;
    closeText?: string;
    closeLabel?: string;
    beforeClose?: (event: MouseEvent) => boolean | void | PromiseLike<boolean | void>;
    dot?: boolean;
    value?: number | string;
    max?: number;
    showZero?: boolean;
    hidden?: boolean;
    color?: string;
    offset?: readonly [number | string, number | string];
    placement?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    badgeStyle?: CSSProperties;
    badgeClass?: string;
    status?: "success" | "processing" | "default" | "error" | "warning";
    text?: string;
    title?: string;
    formatValue?: (value: number | string, displayValue: number | string) => string;
    announce?: "off" | "polite" | "assertive";
    announcement?: string;
    effect?: "light" | "dark" | "plain";
    checkable?: boolean;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
  }>(),
  {
    tone: "blue",
    max: 99,
    size: "md",
    placement: "top-right",
    effect: "light",
    closeLabel: "关闭标签",
    checked: undefined,
    defaultChecked: false,
    announce: "off",
  },
);
const emit = defineEmits<{
  close: [event: MouseEvent];
  closeError: [error: unknown];
  "update:checked": [checked: boolean];
  change: [checked: boolean, event: MouseEvent];
}>();
const attrs = useHysRootAttrs(),
  local = ref(props.defaultChecked);
const checked = computed(() => props.checked ?? local.value);
const capped = computed(() =>
  typeof props.value === "number" &&
  Number.isFinite(props.value) &&
  props.value > props.max
    ? props.max + "+"
    : props.value,
);
const content = computed(() => {
  const value = props.value;
  const displayValue = capped.value;
  return value === undefined || displayValue === undefined
    ? undefined
    : (props.formatValue?.(value, displayValue) ?? displayValue);
});
const showCounter = computed(
  () =>
    !props.hidden &&
    (props.dot ||
      (props.value !== undefined &&
        props.value !== "" &&
        (typeof props.value !== "number" || Number.isFinite(props.value)) &&
        (props.value !== 0 || props.showZero))),
);
const liveText = computed(() => {
  if (props.hidden) return "";
  if (props.announcement !== undefined) return props.announcement;
  if (props.status) return props.text ?? "";
  return showCounter.value && !props.dot ? String(props.value ?? "") : "";
});
const tagColor = computed(
  () =>
    props.color ??
    {
      blue: "#2563eb",
      green: "#06966c",
      orange: "#b85f06",
      red: "#d92d44",
      purple: "#7945d5",
      gray: "#68778e",
    }[props.tone],
);
const tagStyle = computed<CSSProperties>(() => ({
  "--hys-ui-badge-tag-color": tagColor.value,
  borderRadius: props.round ? "99px" : undefined,
  background:
    props.color &&
    props.effect === "light" &&
    (!props.checkable || checked.value)
      ? `color-mix(in srgb, ${props.color} 12%, transparent)`
      : undefined,
  color:
    props.color &&
    props.effect === "light" &&
    (!props.checkable || checked.value)
      ? props.color
      : undefined,
}));
const counterStyle = computed<CSSProperties>(() => ({
  background: props.color,
  "--hys-ui-badge-offset-x":
    typeof props.offset?.[0] === "number"
      ? props.offset[0] + "px"
      : props.offset?.[0],
  "--hys-ui-badge-offset-y":
    typeof props.offset?.[1] === "number"
      ? props.offset[1] + "px"
      : props.offset?.[1],
  ...props.badgeStyle,
}));
const statusColor = computed(
  () =>
    props.color ??
    {
      success: "#06966c",
      processing: "var(--hys-ui-primary,var(--hys-ui-theme-primary,#2563eb))",
      default: "#8794a8",
      error: "#d92d44",
      warning: "#d9860c",
    }[props.status ?? "default"],
);
let live = true,
  request = 0;
const closing = ref(false);
let closeRequest = 0;
async function toggle(event: MouseEvent) {
  if (!live || props.disabled || !props.checkable) return;
  const next = !checked.value,
    ticket = ++request;
  local.value = next;
  emit("update:checked", next);
  await nextTick();
  if (live && ticket === request && checked.value === next)
    emit("change", next, event);
}
async function close(event: MouseEvent) {
  if (!live || props.disabled || closing.value) return;
  if (!props.beforeClose) {
    emit("close", event);
    return;
  }
  const ticket = ++closeRequest;
  closing.value = true;
  try {
    if ((await props.beforeClose(event)) !== false && live && ticket === closeRequest && !props.disabled)
      emit("close", event);
  } catch (error) {
    if (live && ticket === closeRequest) emit("closeError", error);
  } finally {
    if (ticket === closeRequest) closing.value = false;
  }
}
function deactivate() {
  live = false;
  request++;
  closeRequest++;
  closing.value = false;
}
onDeactivated(deactivate);
onBeforeUnmount(deactivate);
onActivated(() => (live = true));
</script>
<template>
  <span
    v-bind="attrs"
    class="hys-ui-badge-wrap"
    :class="[
      'hys-ui-badge-size-' + size,
      { 'hys-ui-badge-disabled': disabled },
    ]"
  >
    <template v-if="status">
      <span
        class="hys-ui-badge-status-dot"
        :class="{
          'hys-ui-badge-processing':
            status === 'processing' && attrs['data-hys-motion'] !== 'off',
        }"
        :style="{ background: statusColor, color: statusColor }"
        aria-hidden="true"
      />
      <span v-if="text || $slots.default" class="hys-ui-badge-status-text"
        ><slot>{{ text }}</slot></span
      >
    </template>
    <template v-else>
      <span
        v-if="$slots.default || closable || checkable"
        class="hys-ui-badge"
        :class="[
          'hys-ui-badge-' + tone,
          'hys-ui-badge-' + effect,
          {
            'hys-ui-badge-content':
              dot || value !== undefined || !!$slots.content,
            'hys-ui-badge-checkable': checkable,
            'hys-ui-badge-checked': checkable && checked,
          },
        ]"
        :style="tagStyle"
      >
        <button
          v-if="checkable"
          type="button"
          class="hys-ui-badge-check"
          :aria-pressed="checked"
          :disabled="disabled"
          @click.stop="toggle"
        >
          <slot />
        </button>
        <slot v-else />
        <button
          v-if="closable"
          type="button"
          class="hys-ui-badge-close"
          :disabled="disabled || closing"
          :aria-busy="closing || undefined"
          :aria-label="closeLabel"
          @click.stop="close"
        >
          <slot name="close-icon"
            ><span v-if="closeText">{{ closeText }}</span
            ><X v-else :size="12" aria-hidden="true"
          /></slot>
        </button>
      </span>
      <sup
        v-if="!hidden && (showCounter || $slots.content)"
        class="hys-ui-badge-counter"
        :class="[
          badgeClass,
          'hys-ui-badge-' + placement,
          {
            'hys-ui-badge-dot': dot,
            'hys-ui-badge-standalone':
              !$slots.default && !closable && !checkable,
          },
        ]"
        :style="counterStyle"
        :title="title ?? (value === undefined ? undefined : String(value))"
        ><slot name="content" :value="value" :display-value="content">{{
          dot ? "" : content
        }}</slot></sup
      >
    </template>
    <span v-if="announce !== 'off'" class="hys-ui-badge-announcement" :aria-live="announce" aria-atomic="true">{{ liveText }}</span>
  </span>
</template>
<style scoped>
.hys-ui-badge-announcement {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.hys-ui-badge-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  vertical-align: middle;
  min-width: 0;
}
.hys-ui-badge {
  gap: 5px;
  border: 1px solid transparent;
  box-sizing: border-box;
}
.hys-ui-badge button {
  font: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.hys-ui-badge button:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary, #3168f5));
  outline-offset: 3px;
  border-radius: 3px;
}
.hys-ui-badge-size-sm .hys-ui-badge {
  font-size: 10px;
  padding: 2px 6px;
}
.hys-ui-badge-size-lg .hys-ui-badge {
  font-size: 13px;
  padding: 6px 11px;
}
.hys-ui-badge-content {
  padding: 0 !important;
  border: 0;
  background: transparent !important;
  color: inherit !important;
}
.hys-ui-badge-dark {
  background: var(--hys-ui-badge-tag-color);
  color: white;
}
.hys-ui-badge-plain {
  background: transparent;
  color: var(--hys-ui-badge-tag-color);
  border-color: color-mix(
    in srgb,
    var(--hys-ui-badge-tag-color) 35%,
    transparent
  );
}
.hys-ui-badge-checkable:not(.hys-ui-badge-checked) {
  background: transparent;
  color: var(--hys-ui-text, var(--hys-ui-theme-text, #27344b));
  border-color: var(--hys-ui-border, var(--hys-ui-theme-border, #dce3ee));
}
.hys-ui-badge-disabled {
  opacity: 0.5;
}
.hys-ui-badge-disabled button {
  cursor: not-allowed;
}
.hys-ui-badge-counter {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  translate: var(--hys-ui-badge-offset-x, 0px) var(--hys-ui-badge-offset-y, 0px);
  padding: 1px 5px;
  border-radius: 99px;
  background: #ed4556;
  color: #fff;
  font-size: 10px;
  line-height: 15px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  box-sizing: border-box;
}
.hys-ui-badge-top-left {
  right: auto;
  left: 0;
  transform: translate(-50%, -50%);
}
.hys-ui-badge-bottom-right {
  top: auto;
  bottom: 0;
  transform: translate(50%, 50%);
}
.hys-ui-badge-bottom-left {
  top: auto;
  right: auto;
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
}
.hys-ui-badge-dot {
  width: 7px;
  height: 7px;
  padding: 0;
}
.hys-ui-badge-counter.hys-ui-badge-standalone {
  position: static;
  transform: none;
  translate: none;
  align-self: center;
}
.hys-ui-badge-status-dot {
  position: relative;
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
}
.hys-ui-badge-status-text {
  font-size: 13px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.hys-ui-badge-processing:after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid currentColor;
  border-radius: 50%;
  animation: hys-ui-badge-pulse 1.5s ease-out infinite;
}
@keyframes hys-ui-badge-pulse {
  to {
    transform: scale(2.4);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-badge-processing:after {
    animation: none;
  }
}
</style>
