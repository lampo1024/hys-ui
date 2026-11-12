<script setup lang="ts">
import {
  computed,
  ref,
  reactive,
  toRefs,
  useAttrs,
  useId,
  provide,
  type CSSProperties,
} from "vue";
import { X, Maximize2, Minimize2, LoaderCircle } from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import { useHysRootAttrs } from "../../config";
import { useModal } from "../../composables/useModal";
import { useDrawerResize } from "../../composables/useDrawerResize";
import { useDrawerPush } from "../../composables/useDrawerPush";
import { overlayOwnerKey } from "../../composables/overlayManager";
import { modalLength, type HysModalProps } from "../../composables/modal";
import {
  drawerSize,
  drawerVertical,
  type HysDrawerProps,
  type HysDrawerSlots,
  type HysDrawerSlotContext,
  type HysDrawerCloseReason,
  type HysDrawerActionContext,
  type HysDrawerResizeInfo,
} from "../../composables/drawer";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysDrawerProps>(), {
  open: undefined,
  modelValue: undefined,
  fullscreen: undefined,
  footer: undefined,
  lockScroll: undefined,
  trapFocus: undefined,
  title: "",
  size: "md",
  placement: "right",
  withHeader: true,
  autofocus: true,
  showClose: true,
  closeOnMask: true,
  closeOnEscape: true,
  destroyOnClose: true,
  restoreFocus: true,
  appendTo: "body",
  modal: true,
  headerSize: "md",
  footerSize: "md",
  headerAriaLevel: 2,
  showCancel: true,
  okText: "确定",
  cancelText: "取消",
  closeText: "关闭",
  fullscreenText: "全屏",
  restoreText: "还原",
  loadingText: "正在加载…",
  showError: true,
  closeOnConfirm: true,
  transition: "slide",
  transitionDuration: 240,
  resetSizeOnClose: true,
});
const slots = defineSlots<HysDrawerSlots>(),
  emit = defineEmits<{
    "update:open": [value: boolean];
    "update:modelValue": [value: boolean];
    "update:fullscreen": [value: boolean];
    "update:resizeValue": [value: number | null];
    open: [];
    opened: [];
    close: [];
    closed: [];
    afterClose: [];
    visibleChange: [value: boolean];
    afterOpenChange: [value: boolean];
    fullscreenChange: [value: boolean];
    ok: [context: HysDrawerActionContext];
    cancel: [context: HysDrawerActionContext];
    closeError: [error: unknown, context: HysDrawerActionContext];
    confirmError: [error: unknown, context: HysDrawerActionContext];
    openAutoFocus: [event: Event];
    closeAutoFocus: [event: Event];
    resizeStart: [size: number];
    resize: [size: number];
    resizeEnd: [size: number, info: HysDrawerResizeInfo];
  }>();
const attrs = useAttrs(),
  skin = useHysRootAttrs(),
  root = ref<HTMLElement>(),
  dialog = ref<HTMLElement>(),
  body = ref<HTMLElement>(),
  id = useId(),
  titleId = id + "-title",
  descriptionId = id + "-description",
  vertical = computed(() => drawerVertical(props.placement));
// Share action cancellation, overlay ownership and lifecycle with Modal; drawer geometry stays separate.
const shared = reactive({
  ...toRefs(props),
  size: "md" as const,
  draggable: false,
  resizable: false,
  resetSizeOnClose: false,
  width: computed(() => (vertical.value ? "100%" : drawerSize(props))),
  height: computed(() => (vertical.value ? drawerSize(props) : undefined)),
  initialFocus: computed(() =>
    props.autofocus === false ? false : (props.initialFocus ?? "auto"),
  ),
  lockScroll: computed(
    () =>
      props.lockScroll ??
      (!props.contained && !(props.modal === false && props.modalPenetrable)),
  ),
  trapFocus: computed(
    () =>
      props.trapFocus ??
      (!props.contained && !(props.modal === false && props.modalPenetrable)),
  ),
}) as HysModalProps;
const state = useModal(
  shared,
  dialog,
  (name, ...args) => {
    if (name === "opened") emit("afterOpenChange", true);
    if (name === "closed") emit("afterOpenChange", false);
    (emit as any)(name, ...args);
  },
  { interaction: false },
);
const resize = useDrawerResize(
    props,
    root,
    dialog,
    state.shown,
    state.fullscreen,
    state.busy,
    (name, ...args) => (emit as any)(name, ...args),
  ),
  push = useDrawerPush(props, state.shown, state.fullscreen);
provide(
  overlayOwnerKey,
  computed(
    () => state.state.active.value && state.shown.value && !props.loading,
  ),
);
const scope = computed<HysDrawerSlotContext>(() => ({
  close: state.requestClose,
  cancel: state.cancel,
  confirm: state.confirm,
  closing: state.closing.value,
  confirming: state.confirming.value,
  busy: state.busy.value,
  error: state.error.value,
  titleId,
  descriptionId,
  fullscreen: state.fullscreen.value,
  toggleFullscreen: state.toggleFullscreen,
  resizing: resize.resizing.value,
  size: resize.size.value,
  resetSize: resize.reset,
  pushed: push.pushed.value,
}));
const full = state.fullscreen,
  footerVisible = computed(
    () => props.footer !== false && (props.footer === true || !!slots.footer),
  ),
  headingLevel = computed(() =>
    Number.isFinite(props.headerAriaLevel)
      ? Math.max(1, Math.min(6, Math.trunc(props.headerAriaLevel)))
      : 2,
  );
const duration = computed(() =>
  Number.isFinite(props.transitionDuration)
    ? Math.max(0, Math.min(5000, props.transitionDuration))
    : 240,
);
const panelStyle = computed<CSSProperties>(() => ({
  ...props.drawerStyle,
  ...push.style.value,
  width:
    full.value || vertical.value
      ? "100%"
      : modalLength(resize.resolvedSize.value ?? drawerSize(props)),
  height: full.value
    ? props.contained
      ? "100%"
      : "100dvh"
    : vertical.value
      ? modalLength(resize.resolvedSize.value ?? drawerSize(props))
      : "100%",
  maxWidth: "100%",
  maxHeight: "100%",
  "--hys-ui-drawer-enter-x":
    props.placement === "left"
      ? "-100%"
      : props.placement === "right"
        ? "100%"
        : "0px",
  "--hys-ui-drawer-enter-y":
    props.placement === "top"
      ? "-100%"
      : props.placement === "bottom"
        ? "100%"
        : "0px",
  ...(props.opacity !== undefined
    ? {
        background:
          "color-mix(in srgb,var(--hys-ui-surface,var(--hys-ui-theme-surface)) " +
          state.alpha(props.opacity) * 100 +
          "%,transparent)",
      }
    : {}),
}));
const overlayStyle = computed<CSSProperties>(() => ({
  ...props.overlayStyle,
  zIndex: state.state.zIndex.value,
  "--hys-ui-drawer-duration": (state.motion.value ? duration.value : 0) + "ms",
}));
const maskStyle = computed<CSSProperties>(() => ({
  ...props.maskStyle,
  ...(props.maskOpacity !== undefined
    ? {
        background:
          "color-mix(in srgb,#0b183d " +
          state.alpha(props.maskOpacity) * 100 +
          "%,transparent)",
      }
    : {}),
}));
const transition = computed(() => ({
  name: "hys-ui-drawer-" + (props.transition || "slide"),
  appear: true,
  css: state.motion.value,
  duration: state.motion.value ? duration.value : 0,
  onAfterEnter: () => {
    void state.afterEnter();
    resize.measure();
  },
  onAfterLeave: async () => {
    await state.afterLeave();
    if (!state.shown.value) resize.resetAfterClose();
  },
}));
defineExpose({
  element: dialog,
  body,
  open: state.shown,
  closing: state.closing,
  confirming: state.confirming,
  fullscreen: full,
  resizing: resize.resizing,
  size: resize.size,
  pushed: push.pushed,
  focus: state.state.focus,
  show: state.show,
  close: state.requestClose,
  hide: () => state.requestClose("api"),
  cancel: state.cancel,
  confirm: state.confirm,
  setFullscreen: state.setFullscreen,
  toggleFullscreen: state.toggleFullscreen,
  resizeTo: resize.resizeTo,
  resetSize: resize.reset,
});
</script>
<template>
  <Teleport :to="appendTo || 'body'" :disabled="appendTo === false"
    ><Transition v-bind="transition">
      <div
        v-if="state.state.active.value && (forceRender || state.rendered.value)"
        v-show="state.shown.value"
        ref="root"
        v-bind="skin"
        class="hys-ui-overlay hys-ui-drawer-overlay hys-ui-drawer-root"
        :class="[
          overlayClass,
          'hys-ui-drawer-' + placement,
          {
            'hys-ui-drawer-contained': contained,
            'hys-ui-drawer-penetrable': modal === false && modalPenetrable,
          },
        ]"
        :style="overlayStyle"
        :inert="!state.shown.value || undefined"
        :aria-hidden="!state.shown.value || undefined"
        @pointerdown="state.maskDown"
        @pointerup="state.maskUp"
      >
        <div
          v-if="modal !== false"
          class="hys-ui-drawer-mask"
          :style="maskStyle"
          aria-hidden="true"
        />
        <aside
          ref="dialog"
          v-bind="{ ...skin, ...attrs }"
          tabindex="-1"
          :role="role ?? 'dialog'"
          class="hys-ui-drawer hys-ui-drawer-panel"
          :class="[
            drawerClass,
            {
              'hys-ui-drawer-resizing': resize.resizing.value,
              'hys-ui-drawer-headerless': !withHeader,
              'hys-ui-drawer-fullscreen': full,
            },
          ]"
          :style="panelStyle"
          :aria-label="ariaLabel || title || '抽屉'"
          :aria-labelledby="
            ariaLabelledby ||
            (withHeader && (title || $slots.header || $slots.title)
              ? titleId
              : undefined)
          "
          :aria-describedby="
            ariaDescribedby || (description ? descriptionId : undefined)
          "
          :aria-modal="
            contained || (modal === false && modalPenetrable) ? undefined : true
          "
          :aria-busy="state.busy.value || undefined"
          @keydown="state.key"
        >
          <header
            v-if="withHeader"
            class="hys-ui-dialog-head hys-ui-drawer-head"
            :class="[headerClass, 'hys-ui-drawer-section-' + headerSize]"
            :style="{
              ...headerStyle,
              minHeight: modalLength(headerHeight) ?? headerStyle?.minHeight,
            }"
          >
            <div class="hys-ui-drawer-title-wrap">
              <slot name="header" v-bind="scope"
                ><component
                  :is="'h' + headingLevel"
                  :id="titleId"
                  class="hys-ui-drawer-title"
                  :style="{ fontSize: modalLength(titleFontSize) }"
                  ><slot name="title" v-bind="scope">{{
                    title
                  }}</slot></component
                ></slot
              >
            </div>
            <div class="hys-ui-drawer-head-actions">
              <slot name="extra" v-bind="scope" />
              <button
                v-if="showFullscreen"
                type="button"
                class="hys-ui-icon-action"
                :aria-label="full ? restoreText : fullscreenText"
                :aria-pressed="full"
                :disabled="resize.resizing.value"
                @click="state.toggleFullscreen"
              >
                <slot name="fullscreen-icon" v-bind="scope"
                  ><component :is="full ? Minimize2 : Maximize2" :size="16"
                /></slot>
              </button>
              <button
                v-if="showClose"
                type="button"
                class="hys-ui-icon-action hys-ui-dialog-close"
                :aria-label="closeText"
                :disabled="
                  state.closing.value ||
                  (state.confirming.value && !closeWhileConfirming)
                "
                @click="state.requestClose('button', $event)"
              >
                <slot name="close-icon" v-bind="scope"><X :size="18" /></slot>
              </button>
            </div>
          </header>
          <button
            v-else-if="showClose"
            type="button"
            class="hys-ui-icon-action hys-ui-dialog-close hys-ui-drawer-floating-close"
            :aria-label="closeText"
            :disabled="
              state.closing.value ||
              (state.confirming.value && !closeWhileConfirming)
            "
            @click="state.requestClose('button', $event)"
          >
            <slot name="close-icon" v-bind="scope"><X :size="18" /></slot>
          </button>
          <div
            ref="body"
            class="hys-ui-dialog-body hys-ui-drawer-body"
            :class="bodyClass"
            :style="bodyStyle"
            :tabindex="bodyTabindex ?? 0"
          >
            <div v-if="loading" class="hys-ui-drawer-loading" role="status">
              <slot name="loading" v-bind="scope"
                ><LoaderCircle
                  :size="22"
                  class="hys-ui-drawer-spinner"
                /><span>{{ loadingText }}</span></slot
              >
            </div>
            <div
              v-show="!loading"
              class="hys-ui-drawer-content"
              :inert="loading || undefined"
            >
              <p
                v-if="description"
                :id="descriptionId"
                class="hys-ui-drawer-description"
              >
                {{ description }}
              </p>
              <slot v-bind="scope" />
            </div>
          </div>
          <p
            v-if="showError && state.error.value"
            class="hys-ui-drawer-error"
            role="alert"
          >
            {{ state.error.value }}
          </p>
          <footer
            v-if="footerVisible"
            class="hys-ui-dialog-foot hys-ui-drawer-foot"
            :class="[footerClass, 'hys-ui-drawer-section-' + footerSize]"
            :style="{
              ...footerStyle,
              minHeight: modalLength(footerHeight) ?? footerStyle?.minHeight,
              justifyContent:
                footerAlign === 'start'
                  ? 'flex-start'
                  : footerAlign === 'center'
                    ? 'center'
                    : 'flex-end',
            }"
          >
            <slot name="footer" v-bind="scope">
              <HysButton
                v-if="showCancel"
                v-bind="cancelButtonProps"
                data-hys-modal-cancel
                :variant="cancelButtonProps?.variant ?? 'secondary'"
                :size="cancelButtonProps?.size ?? footerSize"
                :disabled="
                  cancelDisabled ||
                  cancelButtonProps?.disabled ||
                  state.closing.value ||
                  (state.confirming.value && !closeWhileConfirming)
                "
                @click="state.cancel"
                >{{ cancelText }}</HysButton
              >
              <HysButton
                v-bind="okButtonProps"
                data-hys-modal-confirm
                :variant="okButtonProps?.variant ?? okVariant ?? 'primary'"
                :size="okButtonProps?.size ?? footerSize"
                :loading="state.confirming.value || okButtonProps?.loading"
                :disabled="
                  confirmDisabled ||
                  okButtonProps?.disabled ||
                  state.closing.value ||
                  loading
                "
                @click="state.confirm"
                >{{ okText }}</HysButton
              >
            </slot>
          </footer>
          <div
            v-if="resizable && !full"
            :ref="(el) => (resize.handle.value = el as HTMLElement)"
            role="separator"
            tabindex="0"
            class="hys-ui-drawer-resize"
            :class="'hys-ui-drawer-resize-' + placement"
            :aria-label="
              resizeText || (vertical ? '调整抽屉高度' : '调整抽屉宽度')
            "
            :aria-orientation="vertical ? 'horizontal' : 'vertical'"
            :aria-valuenow="Math.round(resize.size.value)"
            :aria-valuemin="Math.round(resize.limits().min)"
            :aria-valuemax="Math.round(resize.limits().max)"
            :aria-disabled="state.busy.value || undefined"
            :title="'拖动调整尺寸；方向键微调，双击还原'"
            @pointerdown="resize.start"
            @keydown="resize.keyboard"
            @dblclick="resize.reset"
          />
        </aside>
      </div> </Transition
  ></Teleport>
</template>
<style scoped>
.hys-ui-drawer-root {
  padding: 0;
  backdrop-filter: none;
  background: transparent;
  align-items: stretch;
  justify-content: flex-end;
  overflow: hidden;
  isolation: isolate;
}
.hys-ui-drawer-contained {
  position: absolute;
}
.hys-ui-drawer-left {
  justify-content: flex-start;
}
.hys-ui-drawer-top,
.hys-ui-drawer-bottom {
  flex-direction: column;
  align-items: stretch;
}
.hys-ui-drawer-top {
  justify-content: flex-start;
}
.hys-ui-drawer-bottom {
  justify-content: flex-end;
}
.hys-ui-drawer-mask {
  position: absolute;
  inset: 0;
  background: #0b183d88;
  backdrop-filter: blur(3px);
  pointer-events: none;
}
.hys-ui-drawer-penetrable {
  pointer-events: none;
}
.hys-ui-drawer-panel {
  position: relative;
  box-sizing: border-box;
  flex: none;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  transform: translate(
    var(--hys-ui-drawer-push-x, 0px),
    var(--hys-ui-drawer-push-y, 0px)
  );
  transition: transform var(--hys-ui-drawer-duration, 240ms)
    cubic-bezier(0.22, 1, 0.36, 1);
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  box-shadow: 0 18px 70px #10204030;
}
.hys-ui-drawer-head,
.hys-ui-drawer-foot {
  flex: none;
  box-sizing: border-box;
  gap: 12px;
  padding: 18px 24px;
  min-height: 64px;
}
.hys-ui-drawer-foot {
  flex-wrap: wrap;
  min-height: 64px;
  padding: 14px 24px;
}
.hys-ui-drawer-title-wrap {
  flex: 1;
  min-width: 0;
}
.hys-ui-drawer-title {
  margin: 0;
  font-size: 17px;
  line-height: 1.5;
  font-weight: 650;
  overflow-wrap: anywhere;
}
.hys-ui-drawer-head-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: none;
  max-width: 65%;
}
.hys-ui-drawer-section-sm {
  min-height: 50px;
  padding: 10px 16px;
}
.hys-ui-drawer-section-sm .hys-ui-drawer-title {
  font-size: 15px;
}
.hys-ui-drawer-section-lg {
  min-height: 78px;
  padding: 22px 28px;
}
.hys-ui-drawer-section-lg .hys-ui-drawer-title {
  font-size: 20px;
}
.hys-ui-drawer-body {
  min-height: 0;
  min-width: 0;
  flex: 1;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 24px;
  scrollbar-width: thin;
  outline: none;
}
.hys-ui-drawer-body:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-drawer-description {
  margin: 0 0 20px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  line-height: 1.6;
}
.hys-ui-drawer-floating-close {
  position: absolute;
  inset-inline-end: 12px;
  top: 12px;
  z-index: 1;
}
.hys-ui-drawer-floating-close + .hys-ui-drawer-body {
  padding-top: 52px;
}
.hys-ui-drawer-error {
  flex: none;
  margin: 0;
  padding: 12px 24px;
  color: var(--hys-ui-red, var(--hys-ui-theme-red, #e3485c));
  background: color-mix(
    in srgb,
    var(--hys-ui-red, var(--hys-ui-theme-red, #e3485c)) 7%,
    transparent
  );
  font-size: 13px;
  line-height: 1.6;
}
.hys-ui-drawer-loading {
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-drawer-spinner {
  animation: hys-ui-drawer-spin 1s linear infinite;
}
@keyframes hys-ui-drawer-spin {
  to {
    transform: rotate(360deg);
  }
}
.hys-ui-drawer-resize {
  position: absolute;
  z-index: 3;
  touch-action: none;
  outline: none;
}
.hys-ui-drawer-resize::after {
  content: "";
  position: absolute;
  border-radius: 9px;
  background: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  opacity: 0.25;
  transition:
    opacity 140ms,
    background 140ms;
}
.hys-ui-drawer-resize:hover::after,
.hys-ui-drawer-resize:focus-visible::after {
  opacity: 1;
  background: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-drawer-resize:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -2px;
}
.hys-ui-drawer-resize[aria-disabled="true"] {
  cursor: not-allowed;
}
.hys-ui-drawer-resizing {
  transition: none !important;
  will-change: width, height;
}
.hys-ui-drawer-resize-left,
.hys-ui-drawer-resize-right {
  top: 0;
  bottom: 0;
  width: 10px;
  cursor: ew-resize;
}
.hys-ui-drawer-resize-left {
  right: 0;
}
.hys-ui-drawer-resize-right {
  left: 0;
}
.hys-ui-drawer-resize-left::after,
.hys-ui-drawer-resize-right::after {
  width: 3px;
  height: 38px;
  top: calc(50% - 19px);
  left: 3px;
}
.hys-ui-drawer-resize-top,
.hys-ui-drawer-resize-bottom {
  left: 0;
  right: 0;
  height: 10px;
  cursor: ns-resize;
}
.hys-ui-drawer-resize-top {
  bottom: 0;
}
.hys-ui-drawer-resize-bottom {
  top: 0;
}
.hys-ui-drawer-resize-top::after,
.hys-ui-drawer-resize-bottom::after {
  height: 3px;
  width: 38px;
  left: calc(50% - 19px);
  top: 3px;
}
.hys-ui-drawer-slide-enter-active .hys-ui-drawer-panel,
.hys-ui-drawer-slide-leave-active .hys-ui-drawer-panel,
.hys-ui-drawer-slide-fade-enter-active .hys-ui-drawer-panel,
.hys-ui-drawer-slide-fade-leave-active .hys-ui-drawer-panel {
  transition:
    transform var(--hys-ui-drawer-duration, 240ms)
      cubic-bezier(0.22, 1, 0.36, 1),
    opacity var(--hys-ui-drawer-duration, 240ms) ease;
}
.hys-ui-drawer-slide-enter-from .hys-ui-drawer-panel,
.hys-ui-drawer-slide-leave-to .hys-ui-drawer-panel,
.hys-ui-drawer-slide-fade-enter-from .hys-ui-drawer-panel,
.hys-ui-drawer-slide-fade-leave-to .hys-ui-drawer-panel {
  transform: translate(
    calc(var(--hys-ui-drawer-enter-x, 0px) + var(--hys-ui-drawer-push-x, 0px)),
    calc(var(--hys-ui-drawer-enter-y, 0px) + var(--hys-ui-drawer-push-y, 0px))
  );
}
.hys-ui-drawer-slide-fade-enter-from .hys-ui-drawer-panel,
.hys-ui-drawer-slide-fade-leave-to .hys-ui-drawer-panel,
.hys-ui-drawer-fade-enter-from .hys-ui-drawer-panel,
.hys-ui-drawer-fade-leave-to .hys-ui-drawer-panel {
  opacity: 0;
}
.hys-ui-drawer-fade-enter-active .hys-ui-drawer-panel,
.hys-ui-drawer-fade-leave-active .hys-ui-drawer-panel {
  transition: opacity var(--hys-ui-drawer-duration, 240ms) ease;
}
.hys-ui-drawer-slide-enter-active .hys-ui-drawer-mask,
.hys-ui-drawer-slide-leave-active .hys-ui-drawer-mask,
.hys-ui-drawer-slide-fade-enter-active .hys-ui-drawer-mask,
.hys-ui-drawer-slide-fade-leave-active .hys-ui-drawer-mask,
.hys-ui-drawer-fade-enter-active .hys-ui-drawer-mask,
.hys-ui-drawer-fade-leave-active .hys-ui-drawer-mask {
  transition: opacity var(--hys-ui-drawer-duration, 240ms) ease;
}
.hys-ui-drawer-slide-enter-from .hys-ui-drawer-mask,
.hys-ui-drawer-slide-leave-to .hys-ui-drawer-mask,
.hys-ui-drawer-slide-fade-enter-from .hys-ui-drawer-mask,
.hys-ui-drawer-slide-fade-leave-to .hys-ui-drawer-mask,
.hys-ui-drawer-fade-enter-from .hys-ui-drawer-mask,
.hys-ui-drawer-fade-leave-to .hys-ui-drawer-mask {
  opacity: 0;
}
.hys-ui-drawer-slide-leave-active,
.hys-ui-drawer-slide-fade-leave-active,
.hys-ui-drawer-fade-leave-active {
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-drawer-panel,
  .hys-ui-drawer-resize::after,
  .hys-ui-drawer-spinner {
    transition: none !important;
    animation: none !important;
  }
}
:global([data-hys-motion="off"]) .hys-ui-drawer-panel,
:global([data-hys-motion="off"]) .hys-ui-drawer-resize::after,
:global([data-hys-motion="off"]) .hys-ui-drawer-spinner {
  transition: none !important;
  animation: none !important;
}
</style>
