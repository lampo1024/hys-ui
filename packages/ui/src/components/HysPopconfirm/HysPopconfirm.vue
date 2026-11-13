<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Info,
  TriangleAlert,
} from "lucide-vue-next";
import { useHysRootAttrs } from "../../config";
import { useHysControlState } from "../../composables/formContext";
import { usePopupSurface } from "../../composables/usePopupSurface";
import PopupReference from "../../internal/PopupReference";
import PopupSurfacePanel from "../../internal/PopupSurfacePanel.vue";
import HysButton from "../HysButton/HysButton.vue";
import type {
  HysPopconfirmAction,
  HysPopconfirmActionContext,
  HysPopconfirmContext,
  HysPopconfirmDismissReason,
  HysPopconfirmProps,
  HysPopconfirmSlots,
} from "./popconfirmTypes";
import { usePopconfirmAction } from "./usePopconfirmAction";

const props = withDefaults(defineProps<HysPopconfirmProps>(), {
  open: undefined,
  modelValue: undefined,
  trigger: "click",
  triggerText: "打开确认",
  title: "确认操作？",
  tone: "warning",
  placement: "top",
  offset: 9,
  maxWidth: 360,
  appendTo: "body",
  showArrow: true,
  closeOnEscape: true,
  closeOnOutside: true,
  autoAdjustOverflow: true,
  destroyOnHide: true,
  icon: undefined,
  showIcon: true,
  confirmText: "确认",
  cancelText: "取消",
  pendingText: "处理中…",
  cancelVariant: "secondary",
  size: "sm",
  align: "end",
  showCancel: true,
  closeOnConfirm: true,
  closeOnCancel: true,
  initialFocus: "cancel",
  restoreFocus: true,
});
const emit = defineEmits<{
  "update:open": [open: boolean];
  "update:modelValue": [open: boolean];
  openChange: [open: boolean];
  visibleChange: [open: boolean];
  show: [];
  hide: [];
  opened: [];
  closed: [];
  confirm: [result: unknown, context: HysPopconfirmActionContext];
  cancel: [context: HysPopconfirmActionContext];
  dismiss: [reason: HysPopconfirmDismissReason];
  error: [error: unknown, context: HysPopconfirmActionContext];
}>();
const slots = defineSlots<HysPopconfirmSlots>();
const skin = useHysRootAttrs();
const { disabled } = useHysControlState({
  get disabled() {
    return props.disabled;
  },
});
const operation = usePopconfirmAction();
const error = ref("");
const pending = computed(
  () => operation.pending.value ?? (props.loading ? "confirm" : null),
);
const busy = computed(() => pending.value !== null);
const surface = usePopupSurface(
  props,
  "popover",
  (event, ...args) =>
    (emit as (name: string, ...args: unknown[]) => void)(event, ...args),
  {
    allowClose: (source) =>
      source === "programmatic" ||
      source === "anchor" ||
      !busy.value ||
      props.dismissWhilePending,
    onDismiss: (source) => {
      if (source !== "auto") emit("dismiss", source);
    },
    allowTabExit: true,
    shouldRestoreFocus: () => props.restoreFocus,
  },
);
const icons = {
  neutral: CircleHelp,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};
const icon = computed(
  () => props.showIcon && (props.icon ?? icons[props.tone]),
);
const confirmVariant = computed(
  () =>
    props.confirmVariant ??
    (props.tone === "danger"
      ? "danger"
      : props.tone === "success"
        ? "success"
        : "primary"),
);
const confirmDisabled = computed(
  () => disabled.value || props.confirmDisabled || busy.value,
);
const cancelDisabled = computed(
  () =>
    disabled.value ||
    props.cancelDisabled ||
    pending.value === "cancel" ||
    (busy.value && !props.allowCancelWhilePending),
);
const hasTitle = computed(() => !!(props.title || slots.title));
const hasDescription = computed(
  () => !!(props.description || slots.description),
);
const descriptionId = surface.id + "-description";

function clearError() {
  error.value = "";
}
function close() {
  return surface.request(false, props.restoreFocus);
}
function focusPanel() {
  surface.panel.value?.focus({ preventScroll: true });
}
function focusAction(kind: HysPopconfirmAction) {
  const button = surface.panel.value?.querySelector<HTMLElement>(
    `[data-hys-popconfirm-focus="${kind}"]:not(:disabled):not([aria-disabled="true"])`,
  );
  (button ?? surface.panel.value)?.focus({ preventScroll: true });
}
let focused = false;
watch(
  [surface.open, surface.panel, () => surface.style.value.visibility],
  ([open, panel, visibility]) => {
    if (!open) {
      focused = false;
      return;
    }
    if (!panel || visibility === "hidden" || focused) return;
    focused = true;
    if (props.initialFocus === "panel") focusPanel();
    else if (props.initialFocus !== "none") focusAction(props.initialFocus);
  },
  { flush: "post" },
);
watch(
  surface.open,
  (open) => {
    if (open) clearError();
    else operation.abort();
  },
  { flush: "sync" },
);

function run(kind: HysPopconfirmAction, event?: Event) {
  if (
    !surface.open.value ||
    (kind === "confirm" ? confirmDisabled.value : cancelDisabled.value)
  )
    return Promise.resolve(false);
  if (kind === "cancel" && pending.value === "confirm") operation.abort();
  const active = document.activeElement;
  const moveFocus =
    !!active?.matches(`[data-hys-popconfirm-focus="${kind}"]`) &&
    !!surface.panel.value?.contains(active);
  const guard = kind === "confirm" ? props.beforeConfirm : props.beforeCancel;
  const action = kind === "confirm" ? props.action : undefined;
  clearError();
  const result = operation.run(
    kind,
    event,
    async (context) => {
      if (guard && (await guard(context)) === false) return false;
      if (context.signal.aborted) return false;
      return action?.(context);
    },
    async (value, context, isCurrent) => {
      if (kind === "confirm") emit("confirm", value, context);
      else emit("cancel", context);
      const shouldClose =
        kind === "confirm" ? props.closeOnConfirm : props.closeOnCancel;
      if (shouldClose) {
        await nextTick();
        if (isCurrent() && surface.open.value)
          await surface.request(
            false,
            props.restoreFocus,
            "programmatic",
            false,
          );
      }
    },
    (reason, context) => {
      const fallback =
        kind === "confirm" ? "操作失败，请重试。" : "取消失败，请重试。";
      try {
        error.value =
          (typeof props.errorText === "function"
            ? props.errorText(reason, context)
            : props.errorText) || fallback;
      } catch {
        error.value = fallback;
      }
      emit("error", reason, context);
    },
  );
  if (!moveFocus) return result;
  void nextTick(() => {
    if (
      surface.open.value &&
      operation.pending.value === kind &&
      (document.activeElement === active ||
        document.activeElement === document.body)
    )
      focusPanel();
  });
  return result.then(async (accepted) => {
    await nextTick();
    if (
      surface.open.value &&
      !busy.value &&
      document.activeElement === surface.panel.value
    )
      focusAction(kind);
    return accepted;
  });
}
const confirm = (event?: Event) => run("confirm", event);
const cancel = (event?: Event) => run("cancel", event);
const toggle = () => (surface.open.value ? close() : surface.show());
const scope = computed<HysPopconfirmContext>(() => ({
  ...surface.scope.value,
  close,
  toggle,
  confirm,
  cancel,
  abort: operation.abort,
  pending: pending.value,
  busy: busy.value,
  disabled: disabled.value,
  confirmDisabled: confirmDisabled.value,
  cancelDisabled: cancelDisabled.value,
  error: error.value,
}));
defineExpose({
  element: surface.panel,
  referenceElement: surface.actualReference,
  open: surface.open,
  placement: surface.placement,
  show: surface.show,
  close,
  hide: close,
  toggle,
  updatePosition: surface.updatePosition,
  focus: surface.focus,
  confirm,
  cancel,
  abort: operation.abort,
  pending,
  error,
  clearError,
});
</script>

<template>
  <span
    :ref="(el) => (surface.wrapper.value = el as HTMLElement)"
    v-bind="{ ...skin, ...surface.wrapperAttrs.value }"
    class="hys-ui-popconfirm"
    :data-external="!!reference || undefined"
    @click="surface.click"
    @contextmenu="surface.contextmenu"
    @keydown="surface.key"
  >
    <PopupReference
      :id="surface.id"
      :open="scope.open"
      kind="popover"
      @element="surface.referenceElement.value = $event"
    >
      <slot name="trigger" v-bind="scope">
        <slot v-bind="scope">
          <HysButton
            v-if="!reference"
            variant="secondary"
            :disabled="disabled"
            >{{ triggerText }}</HysButton
          >
        </slot>
      </slot>
    </PopupReference>
    <PopupSurfacePanel
      :surface="surface"
      :options="props"
      kind="popover"
      :tabindex="-1"
      :labelled-by="hasTitle ? surface.titleId : undefined"
      :described-by="hasDescription ? descriptionId : undefined"
    >
      <div class="hys-popconfirm-layout" :data-tone="tone">
        <div class="hys-popconfirm-body">
          <div
            v-if="showIcon && (icon || $slots.icon)"
            class="hys-popconfirm-icon"
            aria-hidden="true"
          >
            <slot name="icon" v-bind="scope"
              ><component :is="icon" :size="19"
            /></slot>
          </div>
          <div class="hys-popconfirm-copy">
            <div
              v-if="hasTitle"
              :id="surface.titleId"
              class="hys-popconfirm-title"
            >
              <slot name="title" v-bind="scope">{{ title }}</slot>
            </div>
            <div
              v-if="hasDescription"
              :id="descriptionId"
              class="hys-popconfirm-description"
            >
              <slot name="description" v-bind="scope">{{ description }}</slot>
            </div>
          </div>
        </div>
        <div v-if="error" class="hys-popconfirm-error" role="alert">
          <slot name="error" v-bind="scope">{{ error }}</slot>
        </div>
        <div class="hys-popconfirm-actions" :data-align="align">
          <slot name="actions" v-bind="scope">
            <HysButton
              v-if="showCancel"
              :size="size"
              :variant="cancelVariant"
              :disabled="cancelDisabled"
              :loading="pending === 'cancel'"
              :loading-text="pendingText"
              data-hys-popconfirm-focus="cancel"
              @click="cancel"
              >{{ cancelText }}</HysButton
            >
            <HysButton
              :size="size"
              :variant="confirmVariant"
              :disabled="confirmDisabled"
              :loading="pending === 'confirm'"
              :loading-text="pendingText"
              data-hys-popconfirm-focus="confirm"
              @click="confirm"
              >{{ confirmText }}</HysButton
            >
          </slot>
        </div>
        <span class="hys-popconfirm-sr" role="status">{{
          busy ? pendingText : ""
        }}</span>
      </div>
    </PopupSurfacePanel>
  </span>
</template>

<style scoped src="./popconfirm.css"></style>
