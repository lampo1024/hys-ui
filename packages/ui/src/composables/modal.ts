import type {
  Component,
  CSSProperties,
  TransitionProps,
  VNodeChild,
} from "vue";
import type {
  HysButtonProps,
  HysButtonVariant,
} from "../components/HysButton/HysButton.vue";
export type HysModalCloseReason =
  "mask" | "escape" | "button" | "cancel" | "confirm" | "api";
export type HysModalType =
  "default" | "confirm" | "info" | "success" | "warning" | "error";
export type HysModalInitialFocus =
  | "auto"
  | "dialog"
  | "confirm"
  | "cancel"
  | false
  | string
  | InstanceType<typeof HTMLElement>;
export type HysModalSizeName =
  "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export const modalWidths = {
  xs: 360,
  sm: 440,
  md: 560,
  lg: 720,
  xl: 960,
  "2xl": 1200,
  full: "100%",
} as const;
export const modalWidth = (props: HysModalProps) =>
  props.width ?? modalWidths[props.size ?? "md"];
export type HysModalSectionSize = "sm" | "md" | "lg";
export type HysModalDragEffect =
  "lift" | "outline" | "glow" | "shadow" | "ghost" | "none";
export interface HysModalActionContext {
  reason: HysModalCloseReason;
  event?: Event;
  signal: AbortSignal;
}
export interface HysModalPosition {
  x: number;
  y: number;
}
export interface HysModalSize {
  width: number;
  height: number;
}
export type HysModalBeforeClose = {
  invoke(
    reason: HysModalCloseReason,
    context: HysModalActionContext,
  ): boolean | void | Promise<boolean | void>;
}["invoke"];
export interface HysModalProps {
  open?: boolean;
  modelValue?: boolean;
  defaultOpen?: boolean;
  title?: string;
  description?: string;
  type?: HysModalType;
  showIcon?: boolean;
  /** Background opacity from 0 to 1; does not fade text or controls. */
  opacity?: number;
  /** Mask opacity from 0 to 1; omitted keeps the default mask style. */
  maskOpacity?: number;
  icon?: Component;
  width?: string | number;
  height?: string | number;
  maxHeight?: string | number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  size?: HysModalSizeName;
  centered?: boolean;
  top?: string | number;
  center?: boolean;
  fullscreen?: boolean;
  defaultFullscreen?: boolean;
  showFullscreen?: boolean;
  closeOnMask?: boolean;
  closeOnEscape?: boolean;
  showClose?: boolean;
  destroyOnClose?: boolean;
  forceRender?: boolean;
  modal?: boolean;
  modalPenetrable?: boolean;
  appendTo?: string | InstanceType<typeof HTMLElement> | false;
  lockScroll?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: HysModalInitialFocus;
  openDelay?: number;
  closeDelay?: number;
  transition?: string | TransitionProps | false;
  transitionDuration?: number;
  zIndex?: number;
  headerClass?: string;
  headerSize?: HysModalSectionSize;
  footerSize?: HysModalSectionSize;
  /** Minimum height. Content may expand the region to avoid clipping. */
  headerHeight?: string | number;
  footerHeight?: string | number;
  titleFontSize?: string | number;
  bodyClass?: string;
  footerClass?: string;
  overlayClass?: string;
  modalClass?: string;
  headerStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  footerStyle?: CSSProperties;
  maskStyle?: CSSProperties;
  modalStyle?: CSSProperties;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  role?: "dialog" | "alertdialog";
  headerAriaLevel?: number;
  closeText?: string;
  fullscreenText?: string;
  restoreText?: string;
  footer?: boolean;
  footerAlign?: "start" | "center" | "end";
  showCancel?: boolean;
  okText?: string;
  cancelText?: string;
  okVariant?: HysButtonVariant;
  okButtonProps?: HysButtonProps;
  cancelButtonProps?: HysButtonProps;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  closeWhileConfirming?: boolean;
  loading?: boolean;
  loadingText?: string;
  showError?: boolean;
  errorText?:
    string | ((error: unknown, action: "confirm" | "close") => string);
  confirmOnCtrlEnter?: boolean;
  closeOnConfirm?: boolean;
  beforeClose?(
    reason: HysModalCloseReason,
    context: HysModalActionContext,
  ): boolean | void | Promise<boolean | void>;
  beforeConfirm?: (
    context: HysModalActionContext,
  ) => boolean | void | Promise<boolean | void>;
  draggable?: boolean;
  dragHandlePosition?: "center" | "left" | "right" | "both";
  dragMode?: "live" | "preview";
  /** Pointer movement in pixels before a header press becomes a drag. */
  dragThreshold?: number;
  /** Lightweight gesture feedback, activated only at drag start/end. */
  dragEffect?: HysModalDragEffect;
  overflow?: boolean;
  /** Keep the move handle reachable even when the panel may overflow. */
  keepHandleVisible?: boolean;
  resizable?: boolean;
  resetPositionOnClose?: boolean;
  resetSizeOnClose?: boolean;
  /** Retained legacy setting; position in a modal is controlled by centered/top. */
  placement?: "left" | "right" | "top" | "bottom";
}
export interface HysModalSlotContext {
  close: (reason?: HysModalCloseReason | Event) => Promise<boolean>;
  cancel: (event?: Event) => Promise<boolean>;
  confirm: (event?: Event) => Promise<boolean>;
  closing: boolean;
  confirming: boolean;
  busy: boolean;
  error: string;
  titleId: string;
  descriptionId: string;
  fullscreen: boolean;
  toggleFullscreen: () => Promise<boolean>;
}
export interface HysModalSlots {
  default?: (context: HysModalSlotContext) => VNodeChild;
  header?: (context: HysModalSlotContext) => VNodeChild;
  footer?: (context: HysModalSlotContext) => VNodeChild;
  icon?: (context: HysModalSlotContext) => VNodeChild;
  loading?: (context: HysModalSlotContext) => VNodeChild;
  "close-icon"?: (context: HysModalSlotContext) => VNodeChild;
  "fullscreen-icon"?: (context: HysModalSlotContext) => VNodeChild;
}
export interface HysModalInstance {
  readonly element: HTMLElement | undefined;
  readonly open: boolean;
  readonly closing: boolean;
  readonly confirming: boolean;
  readonly fullscreen: boolean;
  readonly position: HysModalPosition;
  readonly dimensions: HysModalSize | undefined;
  show: () => Promise<boolean>;
  hide: () => Promise<boolean>;
  close: (reason?: HysModalCloseReason) => Promise<boolean>;
  handleOpen: () => Promise<boolean>;
  handleClose: () => Promise<boolean>;
  confirm: (event?: Event) => Promise<boolean>;
  cancel: (event?: Event) => Promise<boolean>;
  focus: () => void;
  toggleFullscreen: () => Promise<boolean>;
  setFullscreen: (value: boolean) => Promise<boolean>;
  resetPosition: () => void;
  resetSize: () => void;
  setPosition: (position: HysModalPosition) => void;
  setSize: (size: HysModalSize) => void;
}
export const modalLength = (value: string | number | undefined) =>
  typeof value === "number"
    ? Number.isFinite(value) && value >= 0
      ? value + "px"
      : undefined
    : value;
