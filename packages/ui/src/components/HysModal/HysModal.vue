<script setup lang="ts">
import {
  computed,
  mergeProps,
  ref,
  useAttrs,
  useId,
  type CSSProperties,
  type TransitionProps,
} from "vue";
import {
  X,
  Maximize2,
  Minimize2,
  GripVertical,
  GripHorizontal,
  LoaderCircle,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  CircleHelp,
} from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import { useHysRootAttrs } from "../../config";
import { useModal } from "../../composables/useModal";
import {
  modalLength,
  modalWidth,
  type HysModalProps,
  type HysModalSlots,
  type HysModalSlotContext,
} from "../../composables/modal";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HysModalProps>(), {
  open: undefined,
  modelValue: undefined,
  fullscreen: undefined,
  footer: undefined,
  showIcon: undefined,
  lockScroll: undefined,
  trapFocus: undefined,
  title: "",
  size: "md",
  headerSize: "md",
  footerSize: "md",
  dragEffect: "lift",
  dragMode: "live",
  dragThreshold: 6,
  keepHandleVisible: true,
  initialFocus: "auto",
  appendTo: "body",
  dragHandlePosition: "center",
  centered: true,
  modal: true,
  closeOnMask: true,
  closeOnEscape: true,
  showClose: true,
  destroyOnClose: true,
  restoreFocus: true,
  showCancel: true,
  okText: "确定",
  cancelText: "取消",
  closeText: "关闭",
  fullscreenText: "全屏",
  restoreText: "还原",
  loadingText: "正在加载…",
  showError: true,
  closeOnConfirm: true,
  resetPositionOnClose: true,
  resetSizeOnClose: true,
  type: "default",
  transition: "scale",
  headerAriaLevel: 2,
});
const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:modelValue": [value: boolean];
  "update:fullscreen": [value: boolean];
  open: [];
  opened: [];
  close: [];
  closed: [];
  afterClose: [];
  visibleChange: [value: boolean];
  fullscreenChange: [value: boolean];
  ok: [context: import("../../composables/modal").HysModalActionContext];
  cancel: [context: import("../../composables/modal").HysModalActionContext];
  closeError: [
    error: unknown,
    context: import("../../composables/modal").HysModalActionContext,
  ];
  confirmError: [
    error: unknown,
    context: import("../../composables/modal").HysModalActionContext,
  ];
  openAutoFocus: [event: Event];
  closeAutoFocus: [event: Event];
  dragStart: [position: import("../../composables/modal").HysModalPosition];
  drag: [position: import("../../composables/modal").HysModalPosition];
  dragEnd: [
    position: import("../../composables/modal").HysModalPosition,
    info: { cancelled: boolean },
  ];
  resizeStart: [size: import("../../composables/modal").HysModalSize];
  resize: [size: import("../../composables/modal").HysModalSize];
  resizeEnd: [
    size: import("../../composables/modal").HysModalSize,
    info: { cancelled: boolean },
  ];
}>();
const slots = defineSlots<HysModalSlots>(),
  attrs = useAttrs(),
  skin = useHysRootAttrs(),
  dialog = ref<HTMLElement>(),
  id = useId(),
  titleId = id + "-title",
  descriptionId = id + "-description";
const modal = useModal(props, dialog, (name, ...args) =>
    (emit as any)(name, ...args),
  ),
  full = modal.fullscreen;
const scope = computed<HysModalSlotContext>(() => ({
  close: modal.requestClose,
  cancel: modal.cancel,
  confirm: modal.confirm,
  closing: modal.closing.value,
  confirming: modal.confirming.value,
  busy: modal.busy.value,
  error: modal.error.value,
  titleId,
  descriptionId,
  fullscreen: full.value,
  toggleFullscreen: modal.toggleFullscreen,
}));
const footerVisible = computed(
  () => props.footer !== false && (props.footer === true || !!slots.footer),
);
const headingLevel = computed(() =>
  Math.max(1, Math.min(6, Math.trunc(props.headerAriaLevel))),
);
const panelStyle = computed<CSSProperties>(() => ({
  ...props.modalStyle,
  ...(props.opacity !== undefined
    ? {
        "--hys-ui-modal-opacity": modal.alpha(props.opacity) * 100 + "%",
        background: `color-mix(in srgb,var(--hys-ui-surface,var(--hys-ui-theme-surface)) ${modal.alpha(props.opacity) * 100}%,transparent)`,
      }
    : {}),
  width: full.value
    ? "100%"
    : modalLength(
        modal.interaction.dimensions.value?.width ?? modalWidth(props),
      ),
  height: full.value
    ? "100dvh"
    : modalLength(modal.interaction.dimensions.value?.height ?? props.height),
  maxWidth: full.value
    ? "100%"
    : props.maxWidth
      ? `min(${props.maxWidth}px,100%)`
      : "100%",
  maxHeight: full.value
    ? "100dvh"
    : (modalLength(props.maxHeight) ?? "calc(100dvh - 36px)"),
  "--hys-ui-modal-x": modal.interaction.position.value.x + "px",
  "--hys-ui-modal-y": modal.interaction.position.value.y + "px",
}));
const overlayStyle = computed<CSSProperties>(() => ({
  ...props.maskStyle,
  ...(props.modal !== false && props.maskOpacity !== undefined
    ? {
        "--hys-ui-modal-mask-opacity":
          modal.alpha(props.maskOpacity) * 100 + "%",
        background: `color-mix(in srgb,#0b183d ${modal.alpha(props.maskOpacity) * 100}%,transparent)`,
      }
    : {}),
  zIndex: modal.state.zIndex.value,
  ...(props.centered === false && !full.value
    ? { alignItems: "flex-start", paddingTop: modalLength(props.top) ?? "15vh" }
    : {}),
  ...(props.transitionDuration !== undefined
    ? {
        "--hys-ui-modal-duration":
          Math.max(0, Math.min(5000, props.transitionDuration)) + "ms",
      }
    : {}),
}));
const transition = computed(() => {
  const configuration =
    typeof props.transition === "object"
      ? props.transition
      : {
          name:
            typeof props.transition === "string" ? props.transition : undefined,
        };
  const name = configuration.name ?? "hys-ui-modal-motion";
  return mergeProps(
    { ...configuration },
    {
      name: ["fade", "scale", "slide"].includes(name)
        ? "hys-ui-modal-" + name
        : name,
      appear: true,
      css: modal.motion.value && configuration.css !== false,
      ...(props.transitionDuration !== undefined
        ? { duration: Math.max(0, Math.min(5000, props.transitionDuration)) }
        : {}),
      onAfterEnter: modal.afterEnter,
      onAfterLeave: modal.afterLeave,
    },
  ) as TransitionProps;
});
const iconComponent = computed(
  () =>
    props.icon ??
    {
      info: Info,
      success: CircleCheck,
      warning: TriangleAlert,
      error: CircleX,
      confirm: CircleHelp,
      default: Info,
    }[props.type],
);
function doubleClick() {
  if (props.draggable) modal.interaction.resetPosition();
}
defineExpose({
  element: dialog,
  open: modal.shown,
  closing: modal.closing,
  confirming: modal.confirming,
  fullscreen: full,
  get position() {
    return modal.interaction.getPosition();
  },
  get dimensions() {
    return modal.interaction.getDimensions();
  },
  show: modal.show,
  hide: () => modal.requestClose("api"),
  close: modal.requestClose,
  handleOpen: modal.show,
  handleClose: () => modal.requestClose("api"),
  confirm: modal.confirm,
  cancel: modal.cancel,
  focus: modal.state.focus,
  toggleFullscreen: modal.toggleFullscreen,
  setFullscreen: modal.setFullscreen,
  resetPosition: modal.interaction.resetPosition,
  resetSize: modal.interaction.resetSize,
  setPosition: modal.interaction.setPosition,
  setSize: modal.interaction.setSize,
});
</script>
<template>
  <Teleport :to="appendTo || 'body'" :disabled="appendTo === false">
    <Transition v-bind="transition">
      <div
        v-if="modal.state.active.value && (forceRender || modal.rendered.value)"
        v-show="modal.shown.value"
        v-bind="skin"
        class="hys-ui-overlay hys-ui-modal-overlay"
        :class="[
          overlayClass,
          {
            'hys-ui-modal-fullscreen': full,
            'hys-ui-modal-no-mask': props.modal === false,
            'hys-ui-modal-penetrable': props.modal === false && modalPenetrable,
            'hys-ui-modal-center': center,
            'hys-ui-modal-allow-overflow': overflow,
          },
        ]"
        :style="overlayStyle"
        @pointerdown="modal.maskDown"
        @pointerup="modal.maskUp"
      >
        <div
          v-if="modal.interaction.previewing.value"
          :ref="
            (el) => (modal.interaction.previewLayer.value = el as HTMLElement)
          "
          class="hys-ui-modal-drag-preview"
          aria-hidden="true"
        >
          <span>{{ title || "移动位置" }}</span>
        </div>
        <section
          ref="dialog"
          v-bind="{ ...skin, ...attrs }"
          tabindex="-1"
          class="hys-ui-modal"
          :class="[
            modalClass,
            'hys-ui-modal-' + (size ?? 'md'),
            'hys-ui-modal-drag-effect-' + dragEffect,
            {
              'hys-ui-modal-dragging': modal.interaction.dragging.value,
              'hys-ui-modal-resizing': modal.interaction.resizing.value,
              'hys-ui-modal-preview-origin': modal.interaction.previewing.value,
            },
          ]"
          :role="role ?? 'dialog'"
          :aria-modal="
            props.modal === false && modalPenetrable ? undefined : true
          "
          :aria-label="ariaLabel || title || '对话框'"
          :aria-labelledby="
            ariaLabelledby || (title || $slots.header ? titleId : undefined)
          "
          :aria-describedby="
            ariaDescribedby || (description ? descriptionId : undefined)
          "
          :aria-busy="modal.busy.value || undefined"
          :style="panelStyle"
          @keydown="modal.key"
        >
          <header
            v-if="
              title || $slots.header || showClose || showFullscreen || draggable
            "
            class="hys-ui-dialog-head"
            :class="[
              headerClass,
              'hys-ui-modal-header-' + (headerSize ?? 'md'),
              {
                'hys-ui-modal-header-with-center-grip':
                  draggable && !full && dragHandlePosition === 'center',
              },
            ]"
            :style="{
              ...headerStyle,
              minHeight: modalLength(headerHeight) ?? headerStyle?.minHeight,
            }"
          >
            <button
              v-if="draggable && !full && dragHandlePosition === 'center'"
              type="button"
              class="hys-ui-modal-drag-handle hys-ui-modal-drag-handle-center"
              data-hys-modal-drag-handle
              aria-label="移动弹窗"
              title="拖动移动弹窗；双击复位，Alt 加方向键微调"
              @pointerdown="modal.interaction.start($event, 'drag')"
              @keydown="modal.interaction.headerKey"
              @dblclick="doubleClick"
            >
              <GripHorizontal :size="18" aria-hidden="true" />
            </button>
            <div class="hys-ui-modal-title-wrap">
              <button
                v-if="
                  draggable &&
                  !full &&
                  ['left', 'both'].includes(dragHandlePosition)
                "
                type="button"
                class="hys-ui-modal-drag-handle"
                data-hys-modal-drag-handle
                aria-label="移动弹窗"
                title="拖动移动弹窗；双击复位，Alt 加方向键微调"
                @pointerdown="modal.interaction.start($event, 'drag')"
                @keydown="modal.interaction.headerKey"
                @dblclick="doubleClick"
              >
                <GripVertical :size="16" aria-hidden="true" />
              </button>
              <slot name="header" v-bind="scope"
                ><component
                  :is="'h' + headingLevel"
                  :id="titleId"
                  class="hys-ui-modal-title"
                  :style="{ fontSize: modalLength(titleFontSize) }"
                  >{{ title }}</component
                ></slot
              >
            </div>
            <div class="hys-ui-modal-head-actions" data-hys-modal-no-drag>
              <button
                v-if="
                  draggable &&
                  !full &&
                  ['right', 'both'].includes(dragHandlePosition)
                "
                type="button"
                class="hys-ui-modal-drag-handle"
                data-hys-modal-drag-handle
                aria-label="从右侧移动弹窗"
                title="从右侧拖动；双击复位，Alt 加方向键微调"
                @pointerdown="modal.interaction.start($event, 'drag')"
                @keydown="modal.interaction.headerKey"
                @dblclick="doubleClick"
              >
                <GripVertical :size="16" aria-hidden="true" />
              </button>
              <button
                v-if="showFullscreen"
                type="button"
                class="hys-ui-icon-action"
                :aria-label="full ? restoreText : fullscreenText"
                :title="full ? restoreText : fullscreenText"
                :aria-pressed="full"
                @click="modal.toggleFullscreen"
              >
                <slot name="fullscreen-icon" v-bind="scope"
                  ><component :is="full ? Minimize2 : Maximize2" :size="16"
                /></slot>
              </button>
              <button
                v-if="showClose"
                type="button"
                class="hys-ui-icon-action"
                :aria-label="closeText"
                :disabled="
                  modal.closing.value ||
                  (modal.confirming.value && !closeWhileConfirming)
                "
                @click="modal.requestClose('button', $event)"
              >
                <slot name="close-icon" v-bind="scope"><X :size="18" /></slot>
              </button>
            </div>
          </header>
          <div class="hys-ui-dialog-body" :class="bodyClass" :style="bodyStyle">
            <div v-if="loading" class="hys-ui-modal-loading" role="status">
              <slot name="loading" v-bind="scope"
                ><LoaderCircle
                  :size="23"
                  class="hys-ui-modal-spinner"
                /><span>{{ loadingText }}</span></slot
              >
            </div>
            <div v-show="!loading" class="hys-ui-modal-content">
              <span
                v-if="showIcon ?? type !== 'default'"
                class="hys-ui-modal-type-icon"
                :data-type="type"
                aria-hidden="true"
                ><slot name="icon" v-bind="scope"
                  ><component :is="iconComponent" :size="24" /></slot
              ></span>
              <div class="hys-ui-modal-content-main">
                <p
                  v-if="description"
                  :id="descriptionId"
                  class="hys-ui-modal-description"
                >
                  {{ description }}
                </p>
                <slot v-bind="scope" />
              </div>
            </div>
            <p
              v-if="showError && modal.error.value"
              role="alert"
              class="hys-ui-modal-error"
            >
              {{ modal.error.value }}
            </p>
          </div>
          <footer
            v-if="footerVisible"
            class="hys-ui-dialog-foot"
            :class="[
              footerClass,
              'hys-ui-modal-footer-' + (footerSize ?? 'md'),
            ]"
            :style="{
              ...footerStyle,
              minHeight: modalLength(footerHeight) ?? footerStyle?.minHeight,
              justifyContent:
                footerAlign === 'start'
                  ? 'flex-start'
                  : footerAlign === 'center' || center
                    ? 'center'
                    : 'flex-end',
              paddingInlineEnd: resizable && !full ? '38px' : undefined,
            }"
          >
            <slot name="footer" v-bind="scope"
              ><HysButton
                v-if="showCancel"
                v-bind="cancelButtonProps"
                data-hys-modal-cancel
                :variant="cancelButtonProps?.variant ?? 'secondary'"
                :size="cancelButtonProps?.size ?? footerSize ?? 'md'"
                :disabled="
                  cancelDisabled ||
                  cancelButtonProps?.disabled ||
                  modal.closing.value ||
                  (modal.confirming.value && !closeWhileConfirming)
                "
                @click="modal.cancel"
                >{{ cancelText }}</HysButton
              ><HysButton
                v-bind="okButtonProps"
                data-hys-modal-confirm
                :variant="okButtonProps?.variant ?? okVariant ?? 'primary'"
                :size="okButtonProps?.size ?? footerSize ?? 'md'"
                :loading="modal.confirming.value || okButtonProps?.loading"
                :disabled="
                  confirmDisabled ||
                  okButtonProps?.disabled ||
                  modal.closing.value ||
                  loading
                "
                @click="modal.confirm"
                >{{ okText }}</HysButton
              ></slot
            >
          </footer>
          <button
            v-if="resizable && !full"
            type="button"
            class="hys-ui-modal-resize-handle"
            aria-label="调整弹窗尺寸"
            title="拖拽调整尺寸；方向键微调，Home 恢复"
            @pointerdown.stop="modal.interaction.start($event, 'resize')"
            @keydown="modal.interaction.resizeKey"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m5 16 11-11m-6 11 6-6m-1 6 1-1"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
<style scoped>
.hys-ui-modal-overlay {
  box-sizing: border-box;
  overflow: auto;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  font-size: 14px;
}
.hys-ui-modal-allow-overflow {
  overflow: clip;
}
.hys-ui-modal {
  position: relative;
  box-sizing: border-box;
  flex: none;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: visible;
  transform: translate3d(
    var(--hys-ui-modal-x, 0px),
    var(--hys-ui-modal-y, 0px),
    0
  );
  color: inherit;
}
.hys-ui-modal:focus {
  outline: none;
}
.hys-ui-dialog-head {
  box-sizing: border-box;
  position: relative;
  flex: none;
  min-width: 0;
  gap: 16px;
  border-start-start-radius: inherit;
  border-start-end-radius: inherit;
}
.hys-ui-modal-title-wrap {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hys-ui-modal-title {
  margin: 0;
  font-family: inherit;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.hys-ui-modal-head-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: none;
}
.hys-ui-icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 6px;
  padding: 0;
  background: transparent;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  cursor: pointer;
}
.hys-ui-icon-action:hover:not(:disabled) {
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
}
.hys-ui-icon-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hys-ui-icon-action:focus-visible,
.hys-ui-modal-resize-handle:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 1px;
}
.hys-ui-dialog-body {
  min-height: 0;
  flex: 1;
  overflow: auto;
  overscroll-behavior: contain;
  line-height: 1.7;
}
.hys-ui-dialog-foot {
  box-sizing: border-box;
  flex: none;
  flex-wrap: wrap;
  border-end-start-radius: inherit;
  border-end-end-radius: inherit;
}
.hys-ui-modal-content {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.hys-ui-modal-content-main {
  min-width: 0;
  flex: 1;
}
.hys-ui-modal-description {
  margin: 0 0 12px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  font-size: 13px;
}
.hys-ui-modal-type-icon {
  display: flex;
  flex: none;
  padding-top: 2px;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-modal-type-icon[data-type="success"] {
  color: var(--hys-ui-green, #16a46e);
}
.hys-ui-modal-type-icon[data-type="warning"] {
  color: var(--hys-ui-orange, #d9860c);
}
.hys-ui-modal-type-icon[data-type="error"] {
  color: var(--hys-ui-red, #e3485c);
}
.hys-ui-modal-error {
  margin: 14px 0 0;
  padding: 9px 12px;
  border: 1px solid
    color-mix(in srgb, var(--hys-ui-red, #e3485c) 25%, transparent);
  border-radius: 7px;
  background: color-mix(in srgb, var(--hys-ui-red, #e3485c) 7%, transparent);
  color: var(--hys-ui-red, #e3485c);
  font-size: 13px;
}
.hys-ui-modal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 110px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
}
.hys-ui-modal-spinner {
  animation: hys-ui-modal-spin 0.9s linear infinite;
}
.hys-ui-modal-drag-handle {
  cursor: grab;
  touch-action: none;
  user-select: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  background: transparent;
}
.hys-ui-modal-drag-handle:hover {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  background: color-mix(
    in srgb,
    var(--hys-ui-primary, var(--hys-ui-theme-primary)) 7%,
    transparent
  );
}
.hys-ui-modal-drag-handle-center {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 18px;
  opacity: 0.2;
  transition:
    opacity 0.14s ease,
    background-color 0.14s ease,
    color 0.14s ease;
}
.hys-ui-dialog-head:hover .hys-ui-modal-drag-handle-center {
  opacity: 0.6;
}
.hys-ui-dialog-head .hys-ui-modal-drag-handle-center:hover,
.hys-ui-dialog-head .hys-ui-modal-drag-handle-center:focus-visible {
  opacity: 1;
}
.hys-ui-modal-dragging .hys-ui-dialog-head .hys-ui-modal-drag-handle-center {
  opacity: 1;
}
@media (hover: none) {
  .hys-ui-modal-drag-handle-center {
    opacity: 0.6;
  }
}
.hys-ui-modal-drag-handle:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: -3px;
}
.hys-ui-modal-dragging,
.hys-ui-modal-dragging .hys-ui-modal-drag-handle {
  cursor: grabbing;
}
.hys-ui-modal-resizing {
  user-select: none;
}
.hys-ui-modal-dragging,
.hys-ui-modal-resizing {
  transition: none !important;
  will-change: transform;
}
.hys-ui-modal-drag-effect-lift::after,
.hys-ui-modal-drag-effect-outline::after,
.hys-ui-modal-drag-effect-glow::after,
.hys-ui-modal-drag-effect-shadow::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  box-shadow: 0 0 0 1px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 32%,
      transparent
    );
  transition: opacity 0.14s ease;
}
.hys-ui-modal-drag-effect-lift::after {
  box-shadow:
    0 0 0 1px
      color-mix(
        in srgb,
        var(--hys-ui-primary, var(--hys-ui-theme-primary)) 30%,
        transparent
      ),
    0 18px 46px -18px
      color-mix(
        in srgb,
        var(--hys-ui-primary, var(--hys-ui-theme-primary)) 28%,
        transparent
      );
}
.hys-ui-modal-drag-effect-glow::after {
  box-shadow:
    0 0 0 1px
      color-mix(
        in srgb,
        var(--hys-ui-primary, var(--hys-ui-theme-primary)) 45%,
        transparent
      ),
    0 0 28px 3px
      color-mix(
        in srgb,
        var(--hys-ui-primary, var(--hys-ui-theme-primary)) 20%,
        transparent
      );
}
.hys-ui-modal-drag-effect-shadow::after {
  box-shadow: 0 22px 55px -12px #0b183d38;
}
.hys-ui-modal-dragging.hys-ui-modal-drag-effect-lift::after,
.hys-ui-modal-dragging.hys-ui-modal-drag-effect-outline::after,
.hys-ui-modal-dragging.hys-ui-modal-drag-effect-glow::after,
.hys-ui-modal-dragging.hys-ui-modal-drag-effect-shadow::after {
  opacity: 1;
}
.hys-ui-modal-drag-effect-ghost {
  transition: opacity 0.14s ease;
}
.hys-ui-modal-drag-preview {
  position: fixed;
  z-index: 1;
  box-sizing: border-box;
  border: 1px dashed var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-radius: 15px;
  background: color-mix(
    in srgb,
    var(--hys-ui-primary, var(--hys-ui-theme-primary)) 7%,
    transparent
  );
  box-shadow: 0 0 0 3px
    color-mix(
      in srgb,
      var(--hys-ui-primary, var(--hys-ui-theme-primary)) 7%,
      transparent
    );
  pointer-events: none;
  will-change: transform;
  overflow: hidden;
}
.hys-ui-modal-drag-preview > span {
  display: inline-block;
  max-width: calc(100% - 32px);
  margin: 14px 16px;
  padding: 4px 9px;
  border-radius: 5px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
.hys-ui-modal-dragging.hys-ui-modal-preview-origin {
  opacity: 0.7;
}
.hys-ui-modal-dragging.hys-ui-modal-preview-origin::after {
  opacity: 0;
}
.hys-ui-modal-dragging.hys-ui-modal-drag-effect-ghost {
  opacity: 0.88;
}
.hys-ui-modal[data-hys-motion="off"]::after {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-modal-drag-effect-lift::after,
  .hys-ui-modal-drag-effect-outline::after,
  .hys-ui-modal-drag-effect-glow::after,
  .hys-ui-modal-drag-effect-shadow::after {
    transition: none;
  }
}
.hys-ui-modal-resize-handle {
  position: absolute;
  inset-inline-end: 3px;
  bottom: 3px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--hys-ui-muted, var(--hys-ui-theme-muted));
  cursor: nwse-resize;
  touch-action: none;
  opacity: 0.65;
  transition:
    background-color 0.12s ease,
    color 0.12s ease,
    opacity 0.12s ease;
}
.hys-ui-modal-resize-handle:hover,
.hys-ui-modal-resize-handle:focus-visible,
.hys-ui-modal-resizing .hys-ui-modal-resize-handle {
  opacity: 1;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  background: color-mix(
    in srgb,
    var(--hys-ui-primary, var(--hys-ui-theme-primary)) 9%,
    transparent
  );
}
.hys-ui-modal-center .hys-ui-modal-title-wrap {
  text-align: center;
  justify-content: center;
}
.hys-ui-modal-fullscreen {
  padding: 0;
}
.hys-ui-modal-fullscreen .hys-ui-modal {
  border-radius: 0;
  transform: none;
}
.hys-ui-modal-no-mask {
  background: transparent;
  backdrop-filter: none;
}
.hys-ui-modal-penetrable {
  pointer-events: none;
}
.hys-ui-modal-penetrable .hys-ui-modal {
  pointer-events: auto;
}
.hys-ui-modal-xs .hys-ui-dialog-head,
.hys-ui-modal-xs .hys-ui-dialog-body,
.hys-ui-modal-xs .hys-ui-dialog-foot,
.hys-ui-modal-sm .hys-ui-dialog-head,
.hys-ui-modal-sm .hys-ui-dialog-body,
.hys-ui-modal-sm .hys-ui-dialog-foot {
  padding: 14px 18px;
}
.hys-ui-modal-lg .hys-ui-dialog-head,
.hys-ui-modal-lg .hys-ui-dialog-body,
.hys-ui-modal-lg .hys-ui-dialog-foot {
  padding: 24px 30px;
}
.hys-ui-modal-sm {
  font-size: 13px;
}
.hys-ui-modal-lg {
  font-size: 15px;
}
.hys-ui-modal .hys-ui-dialog-head.hys-ui-modal-header-sm {
  padding: 10px 18px;
}
.hys-ui-modal .hys-ui-dialog-head.hys-ui-modal-header-md {
  padding: 20px 24px;
}
.hys-ui-modal .hys-ui-dialog-head.hys-ui-modal-header-lg {
  padding: 28px 30px;
}
.hys-ui-modal
  .hys-ui-dialog-head.hys-ui-modal-header-sm.hys-ui-modal-header-with-center-grip {
  padding-top: 18px;
}
.hys-ui-modal
  .hys-ui-dialog-head.hys-ui-modal-header-md.hys-ui-modal-header-with-center-grip {
  padding-top: 28px;
}
.hys-ui-modal
  .hys-ui-dialog-head.hys-ui-modal-header-lg.hys-ui-modal-header-with-center-grip {
  padding-top: 36px;
}
.hys-ui-modal-header-sm .hys-ui-modal-title {
  font-size: 15px;
}
.hys-ui-modal-header-lg .hys-ui-modal-title {
  font-size: 20px;
}
.hys-ui-modal .hys-ui-dialog-foot.hys-ui-modal-footer-sm {
  padding: 10px 18px;
}
.hys-ui-modal .hys-ui-dialog-foot.hys-ui-modal-footer-md {
  padding: 15px 24px;
}
.hys-ui-modal .hys-ui-dialog-foot.hys-ui-modal-footer-lg {
  padding: 20px 30px;
}
.hys-ui-modal-motion-enter-active,
.hys-ui-modal-motion-leave-active,
.hys-ui-modal-fade-enter-active,
.hys-ui-modal-fade-leave-active,
.hys-ui-modal-scale-enter-active,
.hys-ui-modal-scale-leave-active,
.hys-ui-modal-slide-enter-active,
.hys-ui-modal-slide-leave-active {
  transition: opacity var(--hys-ui-modal-duration, var(--hys-ui-motion-base))
    ease;
}
.hys-ui-modal-motion-enter-active .hys-ui-modal,
.hys-ui-modal-motion-leave-active .hys-ui-modal,
.hys-ui-modal-scale-enter-active .hys-ui-modal,
.hys-ui-modal-scale-leave-active .hys-ui-modal,
.hys-ui-modal-slide-enter-active .hys-ui-modal,
.hys-ui-modal-slide-leave-active .hys-ui-modal {
  transition:
    transform var(--hys-ui-modal-duration, var(--hys-ui-motion-base))
      var(--hys-ui-motion-ease),
    opacity var(--hys-ui-modal-duration, var(--hys-ui-motion-base)) ease;
}
.hys-ui-modal-motion-enter-from,
.hys-ui-modal-motion-leave-to,
.hys-ui-modal-fade-enter-from,
.hys-ui-modal-fade-leave-to,
.hys-ui-modal-scale-enter-from,
.hys-ui-modal-scale-leave-to,
.hys-ui-modal-slide-enter-from,
.hys-ui-modal-slide-leave-to {
  opacity: 0;
}
.hys-ui-modal-motion-enter-from .hys-ui-modal,
.hys-ui-modal-motion-leave-to .hys-ui-modal {
  transform: translate3d(
      var(--hys-ui-modal-x, 0px),
      calc(var(--hys-ui-modal-y, 0px) + 12px),
      0
    )
    scale(0.98);
}
.hys-ui-modal-scale-enter-from .hys-ui-modal,
.hys-ui-modal-scale-leave-to .hys-ui-modal {
  transform: translate3d(
      var(--hys-ui-modal-x, 0px),
      var(--hys-ui-modal-y, 0px),
      0
    )
    scale(0.96);
}
.hys-ui-modal-slide-enter-from .hys-ui-modal,
.hys-ui-modal-slide-leave-to .hys-ui-modal {
  transform: translate3d(
    var(--hys-ui-modal-x, 0px),
    calc(var(--hys-ui-modal-y, 0px) - 35px),
    0
  );
}
@keyframes hys-ui-modal-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 600px) {
  .hys-ui-modal {
    max-width: 100% !important;
  }
  .hys-ui-modal-fullscreen .hys-ui-modal {
    max-width: 100% !important;
  }
  .hys-ui-dialog-head,
  .hys-ui-dialog-body,
  .hys-ui-dialog-foot {
    padding: 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-modal-spinner {
    animation: none;
  }
}
</style>
