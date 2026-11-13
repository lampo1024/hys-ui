import type { Component, VNodeChild } from "vue";
import type {
  HysButtonSize,
  HysButtonVariant,
} from "../HysButton/HysButton.vue";
import type {
  HysPopupSurfaceContext,
  HysPopupSurfaceInstance,
  HysPopupSurfaceProps,
} from "../../composables/popupSurface";
import type { PopupCloseSource } from "../../composables/usePopupSurfaceInteractions";

export type HysPopconfirmTone =
  "neutral" | "info" | "success" | "warning" | "danger";
export type HysPopconfirmAction = "confirm" | "cancel";
export type HysPopconfirmDismissReason = Exclude<PopupCloseSource, "auto">;
export interface HysPopconfirmActionContext {
  action: HysPopconfirmAction;
  signal: AbortSignal;
  event?: Event;
}
export type HysPopconfirmGuard = (
  context: HysPopconfirmActionContext,
) => boolean | void | PromiseLike<boolean | void>;
export type HysPopconfirmHandler = (
  context: HysPopconfirmActionContext,
) => unknown;
export interface HysPopconfirmProps extends Omit<
  HysPopupSurfaceProps,
  "autoClose" | "enterable" | "showDelay" | "hideDelay" | "trigger"
> {
  trigger?: "click" | "contextmenu" | "manual";
  triggerText?: string;
  title?: string;
  description?: string;
  tone?: HysPopconfirmTone;
  icon?: Component | false;
  showIcon?: boolean;
  confirmText?: string;
  cancelText?: string;
  pendingText?: string;
  errorText?:
    string | ((error: unknown, context: HysPopconfirmActionContext) => string);
  confirmVariant?: HysButtonVariant;
  cancelVariant?: HysButtonVariant;
  size?: HysButtonSize;
  align?: "start" | "center" | "end";
  showCancel?: boolean;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  loading?: boolean;
  allowCancelWhilePending?: boolean;
  dismissWhilePending?: boolean;
  closeOnConfirm?: boolean;
  closeOnCancel?: boolean;
  initialFocus?: "cancel" | "confirm" | "panel" | "none";
  restoreFocus?: boolean;
  beforeConfirm?: HysPopconfirmGuard;
  beforeCancel?: HysPopconfirmGuard;
  action?: HysPopconfirmHandler;
}
export interface HysPopconfirmContext extends HysPopupSurfaceContext {
  pending: HysPopconfirmAction | null;
  busy: boolean;
  disabled: boolean;
  confirmDisabled: boolean;
  cancelDisabled: boolean;
  error: string;
  confirm: (event?: Event) => Promise<boolean>;
  cancel: (event?: Event) => Promise<boolean>;
  abort: () => void;
}
export interface HysPopconfirmSlots {
  default?: (context: HysPopconfirmContext) => VNodeChild;
  trigger?: (context: HysPopconfirmContext) => VNodeChild;
  title?: (context: HysPopconfirmContext) => VNodeChild;
  description?: (context: HysPopconfirmContext) => VNodeChild;
  icon?: (context: HysPopconfirmContext) => VNodeChild;
  actions?: (context: HysPopconfirmContext) => VNodeChild;
  error?: (context: HysPopconfirmContext) => VNodeChild;
}
export interface HysPopconfirmInstance extends HysPopupSurfaceInstance {
  readonly pending: HysPopconfirmAction | null;
  readonly error: string;
  confirm: (event?: Event) => Promise<boolean>;
  cancel: (event?: Event) => Promise<boolean>;
  abort: () => void;
  clearError: () => void;
}
