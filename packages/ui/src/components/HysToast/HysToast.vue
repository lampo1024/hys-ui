<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  shallowRef,
  useAttrs,
  watch,
} from "vue";
import {
  CircleAlert,
  CircleCheck,
  Copy,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import { registerToastEscape } from "../../composables/toastEscape";
import {
  normalizeToastPosition,
  toastDuration,
  toastLocale,
  toastMotion,
  toastPlacement,
} from "./toastPresentation";
import type {
  HysToastActionContext,
  HysToastActionEvent,
  HysToastCloseContext,
  HysToastCloseReason,
  HysToastContext,
  HysToastPatch,
  HysToastProps,
} from "./toastTypes";
import { useToastTimer } from "./useToastTimer";
import { useToastSwipe } from "./useToastSwipe";
import { useToastActions } from "./useToastActions";

export type { HysToastPosition, HysToastType } from "./toastTypes";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysToastProps>(), {
  open: undefined,
  message: "",
  type: "success",
  duration: undefined,
  closable: true,
  position: "top-center",
  offset: 24,
  zIndex: 2000,
  showIcon: true,
  pauseOnHover: true,
  pauseOnBlur: true,
  interactive: true,
  repeat: 1,
  teleport: true,
  appendTo: "body",
  actionLayout: "inline",
});
const emit = defineEmits<{
  "update:open": [open: boolean];
  update: [patch: HysToastPatch];
  show: [context: HysToastContext];
  afterShow: [context: HysToastContext];
  close: [context: HysToastCloseContext];
  afterClose: [context: HysToastCloseContext];
  click: [event: MouseEvent, context: HysToastContext];
  action: [event: HysToastActionEvent];
  stateChange: [
    state: "visible" | "closing" | "closed",
    context: HysToastContext,
  ];
}>();
const slots = defineSlots<{
  default?: (context: HysToastActionContext) => unknown;
  icon?: (context: HysToastActionContext) => unknown;
  header?: (context: HysToastActionContext) => unknown;
  footer?: (context: HysToastActionContext) => unknown;
  action?: (context: HysToastActionContext) => unknown;
}>();
const owner = getCurrentInstance(),
  attrs = useAttrs(),
  skin = useHysRootAttrs();
const element = ref<HTMLElement>(),
  active = ref(true),
  visible = ref(false),
  hovered = ref(false),
  focused = ref(false);
const checking = ref(false),
  expanded = ref(false),
  local = shallowRef<Partial<HysToastProps>>({});
const options = computed(() => ({ ...props, ...local.value }));
const locale = computed(() => ({ ...toastLocale, ...options.value.locale }));
const placement = computed(() =>
  normalizeToastPosition(options.value.position),
);
const duration = computed(() => toastDuration(options.value));
const icon = computed(
  () =>
    ({
      success: CircleCheck,
      error: CircleAlert,
      info: Info,
      warning: TriangleAlert,
      loading: LoaderCircle,
      default: undefined,
      custom: undefined,
    })[options.value.type],
);
const live = computed(
  () =>
    options.value.live ??
    (options.value.type === "error" ? "assertive" : "polite"),
);
let closeContext: HysToastCloseContext | undefined,
  pendingClose: HysToastCloseContext | undefined;
let focusOrigin: HTMLElement | undefined, restoreFocus: HTMLElement | undefined;
let unregisterEscape: (() => void) | undefined,
  revision = 0;
function context(): HysToastContext {
  return {
    id:
      typeof attrs["data-toast-id"] === "string"
        ? attrs["data-toast-id"]
        : undefined,
    message: options.value.message,
    title: options.value.title,
    type: options.value.type,
  };
}
function patch(value: HysToastPatch) {
  if (!visible.value) return;
  if (!owner?.vnode.props?.onUpdate) {
    local.value = {
      ...local.value,
      ...(typeof value === "string" ? { message: value } : value),
    };
  }
  emit("update", value);
}
const actions = useToastActions({
  available: () => active.value && visible.value && options.value.interactive,
  locale: () => locale.value,
  context,
  close: () => close("action"),
  update: patch,
  copyText: () =>
    options.value.copyText ??
    (options.value.message ||
      element.value?.querySelector(".hys-ui-toast-message")?.textContent ||
      ""),
  emit: (event) => emit("action", event),
});
const swipe = useToastSwipe(
  element,
  () =>
    options.value.swipe &&
    options.value.interactive &&
    visible.value &&
    !checking.value,
  (event) => close("swipe", event),
);
const timer = useToastTimer({
  running: () =>
    active.value &&
    visible.value &&
    !options.value.paused &&
    !checking.value &&
    !(options.value.pauseOnHover && hovered.value) &&
    !focused.value &&
    !swipe.dragging.value &&
    actions.busy.value === undefined,
  duration: () => duration.value,
  indicators: () =>
    options.value.countdown ||
    (options.value.showProgress && options.value.progress === undefined),
  pauseOnBlur: () => options.value.pauseOnBlur,
  expire: () => {
    void close("timeout");
  },
});
const progress = computed(() => {
  const value = options.value.progress;
  if (value === "indeterminate") return value;
  if (typeof value === "number")
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  if (options.value.showProgress && duration.value > 0 && timer.total.value > 0)
    return (timer.remaining.value / timer.total.value) * 100;
});
const motionStyle = computed(() => toastMotion(options.value));
const style = computed(() => ({
  ...(props.teleport ? toastPlacement(options.value) : {}),
  ...motionStyle.value,
  "--hys-toast-drag-x": swipe.shift.value + "px",
  "--hys-toast-drag-opacity": Math.max(
    0.38,
    1 - Math.abs(swipe.shift.value) / 280,
  ),
  "--hys-toast-lines": Math.max(1, Math.floor(options.value.maxLines ?? 1)),
  width:
    typeof options.value.width === "number"
      ? Math.max(0, options.value.width) + "px"
      : options.value.width,
  ...options.value.toastStyle,
}));
function finish() {
  const current = closeContext;
  if (!current || visible.value || !active.value) return;
  closeContext = undefined;
  swipe.reset();
  if (restoreFocus?.isConnected && document.activeElement === document.body)
    restoreFocus.focus({ preventScroll: true });
  restoreFocus = undefined;
  emit("afterClose", current);
  emit("stateChange", "closed", current);
}
function hide(current: HysToastCloseContext) {
  if (!visible.value) return;
  revision++;
  closeContext = current;
  const hadElement = !!element.value;
  restoreFocus = focused.value ? focusOrigin : undefined;
  visible.value = false;
  checking.value = false;
  hovered.value = focused.value = false;
  actions.reset();
  emit("stateChange", "closing", current);
  emit("close", current);
  if (!hadElement) void nextTick(finish);
}
async function close(
  reason: HysToastCloseReason = "api",
  event?: Event,
  force = false,
): Promise<boolean> {
  if (!visible.value || !active.value || (checking.value && !force))
    return false;
  const current = { ...context(), reason, event };
  const token = revision;
  if (!force && options.value.beforeClose) {
    checking.value = true;
    let allowed = false;
    try {
      allowed = (await options.value.beforeClose(current)) !== false;
    } catch {
      allowed = false;
    }
    if (token !== revision) return false;
    if (!allowed) {
      checking.value = false;
      return false;
    }
  }
  if (props.open !== undefined && !force) {
    pendingClose = current;
    emit("update:open", false);
    await nextTick();
    pendingClose = undefined;
    checking.value = false;
    return !visible.value;
  }
  hide(current);
  return true;
}
function show() {
  revision++;
  closeContext = undefined;
  restoreFocus = undefined;
  expanded.value = false;
  visible.value = true;
  timer.restart();
  emit("show", context());
  emit("stateChange", "visible", context());
}
function afterShow() {
  if (active.value && visible.value) emit("afterShow", context());
}
function keydown(event: KeyboardEvent) {
  if (
    !options.value.interactive ||
    !options.value.keyboardDismiss ||
    event.target !== element.value
  )
    return;
  if (
    event.key === "Delete" ||
    ((event.key === "Enter" || event.key === " ") && options.value.closeOnClick)
  ) {
    event.preventDefault();
    void close("keyboard", event);
  }
}
function focusin(event: FocusEvent) {
  if (
    !focused.value &&
    event.relatedTarget instanceof HTMLElement &&
    !element.value?.contains(event.relatedTarget)
  ) {
    focusOrigin = event.relatedTarget;
  }
  focused.value = true;
}
function focusout(event: FocusEvent) {
  if (element.value?.contains(event.relatedTarget as Node)) return;
  focused.value = false;
  focusOrigin = undefined;
}
function click(event: MouseEvent) {
  if (
    !options.value.interactive ||
    swipe.suppressClick.value ||
    (event.target as Element | null)?.closest(
      "button,a,input,textarea,select,[role=button],[contenteditable=true]",
    )
  )
    return;
  emit("click", event, context());
  if (options.value.closeOnClick) void close("click", event);
}
watch(
  () =>
    [
      props.open ??
        !!(
          options.value.message ||
          options.value.title ||
          slots.default ||
          slots.header
        ),
      options.value.message,
      options.value.title,
    ] as const,
  ([open, message, title], previous) => {
    if (!open) hide(pendingClose ?? { ...context(), reason: "model" });
    else if (
      !visible.value &&
      (!previous?.[0] ||
        (props.open === undefined &&
          ((message && message !== previous[1]) ||
            (title && title !== previous[2]))))
    )
      show();
  },
  { immediate: true },
);
watch(
  () => [duration.value, options.value.message, props.repeat],
  () => {
    if (visible.value) timer.restart();
  },
);
watch(
  () =>
    visible.value &&
    active.value &&
    options.value.interactive &&
    options.value.closeOnEscape,
  (enabled) => {
    unregisterEscape?.();
    unregisterEscape = enabled
      ? registerToastEscape(
          (event) => void close("escape", event),
          () => element.value,
        )
      : undefined;
  },
  { immediate: true, flush: "sync" },
);
onDeactivated(() => {
  active.value = false;
  revision++;
  checking.value = false;
  hovered.value = focused.value = false;
  actions.reset();
  swipe.reset();
});
onActivated(() => {
  active.value = true;
});
onBeforeUnmount(() => {
  revision++;
  active.value = false;
  actions.reset();
  unregisterEscape?.();
});
defineExpose({
  close,
  pause: timer.pause,
  resume: timer.resume,
  restart: timer.restart,
  extend: timer.extend,
  element,
  snapshotClock: timer.snapshot,
  restoreClock: timer.restore,
});
</script>

<template>
  <Teleport :to="appendTo" :disabled="!teleport">
    <Transition
      name="hys-toast-enter"
      appear
      @after-enter="afterShow"
      @after-appear="afterShow"
      @after-leave="finish"
    >
      <div
        v-if="visible && active"
        ref="element"
        v-bind="{ ...skin, ...attrs }"
        :data-hys-theme="options.theme ?? skin['data-hys-theme']"
        class="hys-ui-toast"
        :class="[
          'hys-ui-toast-' + options.type,
          'hys-ui-toast-position-' + placement,
          {
            'hys-ui-toast-inline': !teleport,
            'hys-ui-toast-plain': options.plain,
            'hys-ui-toast-glass': options.glass,
            'hys-ui-toast-swipe': options.swipe && options.interactive,
            'hys-ui-toast-dragging': swipe.dragging.value,
            'hys-ui-toast-clickable':
              options.closeOnClick && options.interactive,
            'hys-ui-toast-bounce': options.animation === 'bounce',
          },
        ]"
        :style="style"
        :tabindex="
          options.keyboardDismiss && options.interactive ? 0 : undefined
        "
        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
        @focusin="focusin"
        @focusout="focusout"
        @click="click"
        @keydown="keydown"
        @pointerdown="swipe.start"
        @pointermove="swipe.move"
        @pointerup="swipe.end"
        @pointerleave="swipe.leave"
        @pointercancel="swipe.reset"
      >
        <span
          v-if="options.showIcon && (icon || $slots.icon)"
          class="hys-ui-toast-icon"
          aria-hidden="true"
        >
          <slot name="icon" v-bind="actions.context()"
            ><component
              :is="icon"
              :size="18"
              :class="{ 'hys-ui-toast-spinner': options.type === 'loading' }"
          /></slot>
        </span>
        <div class="hys-ui-toast-content">
          <div
            :role="
              live === 'off'
                ? undefined
                : live === 'assertive'
                  ? 'alert'
                  : 'status'
            "
            :aria-live="live"
            aria-atomic="true"
          >
            <div
              v-if="options.title || $slots.header"
              class="hys-ui-toast-title"
            >
              <slot name="header" v-bind="actions.context()">{{
                options.title
              }}</slot>
            </div>
            <div
              class="hys-ui-toast-message hys-ui-scrollbar"
              :class="{ 'hys-ui-toast-clamped': options.maxLines && !expanded }"
            >
              <slot v-bind="actions.context()">{{ options.message }}</slot>
            </div>
          </div>
          <button
            v-if="options.maxLines && options.interactive"
            class="hys-ui-toast-text-action"
            type="button"
            :aria-expanded="expanded"
            @click="expanded = !expanded"
          >
            {{ expanded ? locale.collapse : locale.expand }}
          </button>
          <div v-if="$slots.footer" class="hys-ui-toast-footer">
            <slot name="footer" v-bind="actions.context()" />
          </div>
        </div>
        <span
          v-if="repeat > 1"
          class="hys-ui-toast-repeat"
          :aria-label="locale.repeat(repeat)"
          >×{{ repeat }}</span
        >
        <div
          v-if="
            options.interactive &&
            ($slots.action || options.actions?.length || options.copyable)
          "
          class="hys-ui-toast-action"
          :class="{
            'hys-ui-toast-action-footer': options.actionLayout === 'footer',
          }"
        >
          <slot name="action" v-bind="actions.context()">
            <button
              v-for="action in options.actions"
              :key="action.id"
              class="hys-ui-toast-text-action"
              type="button"
              :disabled="
                action.disabled ||
                (actions.busy.value !== undefined &&
                  actions.busy.value !== action.id)
              "
              :aria-busy="actions.busy.value === action.id || undefined"
              @click="actions.run(action)"
            >
              <LoaderCircle
                v-if="actions.busy.value === action.id"
                class="hys-ui-toast-spinner"
                :size="14"
                aria-hidden="true"
              />{{ action.label }}
            </button>
          </slot>
          <button
            v-if="options.copyable"
            class="hys-ui-toast-close"
            type="button"
            :aria-label="locale.copy"
            :title="locale.copy"
            @click="actions.copy"
          >
            <Copy :size="15" />
          </button>
          <span
            v-if="actions.copyStatus.value"
            role="status"
            class="hys-ui-toast-copy-status"
            >{{ actions.copyStatus.value }}</span
          >
        </div>
        <span
          v-if="options.countdown && duration > 0"
          class="hys-ui-toast-countdown"
          :title="locale.remaining(Math.ceil(timer.remaining.value / 1000))"
          >{{ locale.remaining(Math.ceil(timer.remaining.value / 1000)) }}</span
        >
        <button
          v-if="options.closable && options.interactive"
          class="hys-ui-toast-close hys-ui-toast-dismiss"
          type="button"
          :aria-label="locale.close"
          :disabled="checking"
          @click="close('button', $event)"
        >
          <X :size="14" />
        </button>
        <div
          v-if="progress !== undefined"
          class="hys-ui-toast-progress"
          :class="{
            'hys-ui-toast-progress-indeterminate': progress === 'indeterminate',
          }"
          :role="options.progress !== undefined ? 'progressbar' : undefined"
          :aria-label="locale.progress"
          :aria-valuenow="
            typeof progress === 'number' ? Math.round(progress) : undefined
          "
        >
          <span
            :style="{
              inlineSize:
                progress === 'indeterminate' ? undefined : progress + '%',
              ...options.progressStyle,
            }"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped src="./toast.css"></style>
