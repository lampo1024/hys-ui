import type { CSSProperties, VNodeChild } from "vue";
import type {
  HysModalProps,
  HysModalActionContext,
  HysModalCloseReason,
  HysModalInitialFocus,
  HysModalSectionSize,
} from "./modal";
export type HysDrawerPlacement = "left" | "right" | "top" | "bottom";
export type HysDrawerSizeName = "xs" | "sm" | "md" | "lg" | "xl" | "full";
export type HysDrawerCloseReason = HysModalCloseReason;
export type HysDrawerActionContext = HysModalActionContext;
export type HysDrawerInitialFocus = HysModalInitialFocus;
export type HysDrawerSectionSize = HysModalSectionSize;
export type HysDrawerBeforeClose = {
  invoke(
    reason: HysDrawerCloseReason,
    context: HysDrawerActionContext,
  ): boolean | void | Promise<boolean | void>;
}["invoke"];
export interface HysDrawerResizeOptions {
  minSize?: number | string;
  maxSize?: number | string;
  step?: number;
}
export interface HysDrawerResizeInfo {
  placement: HysDrawerPlacement;
  cancelled: boolean;
  accepted: boolean;
}
export interface HysDrawerPushOptions {
  distance?: number | string;
}
export interface HysDrawerProps extends Pick<
  HysModalProps,
  | "open"
  | "modelValue"
  | "defaultOpen"
  | "title"
  | "description"
  | "opacity"
  | "maskOpacity"
  | "width"
  | "height"
  | "fullscreen"
  | "defaultFullscreen"
  | "showFullscreen"
  | "closeOnMask"
  | "closeOnEscape"
  | "showClose"
  | "destroyOnClose"
  | "forceRender"
  | "modal"
  | "modalPenetrable"
  | "appendTo"
  | "lockScroll"
  | "trapFocus"
  | "restoreFocus"
  | "initialFocus"
  | "openDelay"
  | "closeDelay"
  | "transitionDuration"
  | "zIndex"
  | "headerClass"
  | "headerSize"
  | "footerSize"
  | "headerHeight"
  | "footerHeight"
  | "titleFontSize"
  | "bodyClass"
  | "footerClass"
  | "overlayClass"
  | "headerStyle"
  | "bodyStyle"
  | "footerStyle"
  | "maskStyle"
  | "ariaLabel"
  | "ariaLabelledby"
  | "ariaDescribedby"
  | "role"
  | "headerAriaLevel"
  | "closeText"
  | "fullscreenText"
  | "restoreText"
  | "footer"
  | "footerAlign"
  | "showCancel"
  | "okText"
  | "cancelText"
  | "okVariant"
  | "okButtonProps"
  | "cancelButtonProps"
  | "confirmLoading"
  | "confirmDisabled"
  | "cancelDisabled"
  | "closeWhileConfirming"
  | "loading"
  | "loadingText"
  | "showError"
  | "errorText"
  | "confirmOnCtrlEnter"
  | "closeOnConfirm"
> {
  beforeClose?: HysDrawerBeforeClose;
  beforeConfirm?: (
    context: HysDrawerActionContext,
  ) => boolean | void | Promise<boolean | void>;
  placement?: HysDrawerPlacement;
  size?: HysDrawerSizeName | number | (string & {});
  drawerClass?: string;
  drawerStyle?: CSSProperties;
  overlayStyle?: CSSProperties;
  bodyTabindex?: number;
  contained?: boolean;
  withHeader?: boolean;
  autofocus?: boolean;
  transition?: "slide" | "fade" | "slide-fade" | "none" | false;
  push?: boolean | HysDrawerPushOptions;
  resizable?: boolean | HysDrawerResizeOptions;
  resizeValue?: number | null;
  defaultResizeValue?: number | null;
  resetSizeOnClose?: boolean;
  resizeText?: string;
}
export interface HysDrawerSlotContext {
  close: (
    reasonOrEvent?: HysDrawerCloseReason | Event,
    event?: Event,
  ) => Promise<boolean>;
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
  resizing: boolean;
  size: number;
  resetSize: () => Promise<boolean>;
  pushed: boolean;
}
export interface HysDrawerSlots {
  default?: (scope: HysDrawerSlotContext) => VNodeChild;
  header?: (scope: HysDrawerSlotContext) => VNodeChild;
  title?: (scope: HysDrawerSlotContext) => VNodeChild;
  extra?: (scope: HysDrawerSlotContext) => VNodeChild;
  footer?: (scope: HysDrawerSlotContext) => VNodeChild;
  loading?: (scope: HysDrawerSlotContext) => VNodeChild;
  "close-icon"?: (scope: HysDrawerSlotContext) => VNodeChild;
  "fullscreen-icon"?: (scope: HysDrawerSlotContext) => VNodeChild;
}
export interface HysDrawerInstance {
  readonly element: HTMLElement | undefined;
  readonly body: HTMLElement | undefined;
  readonly open: boolean;
  readonly closing: boolean;
  readonly confirming: boolean;
  readonly fullscreen: boolean;
  readonly resizing: boolean;
  readonly size: number;
  readonly pushed: boolean;
  focus: () => void;
  show: () => Promise<boolean>;
  close: (
    reasonOrEvent?: HysDrawerCloseReason | Event,
    event?: Event,
  ) => Promise<boolean>;
  hide: () => Promise<boolean>;
  cancel: (event?: Event) => Promise<boolean>;
  confirm: (event?: Event) => Promise<boolean>;
  setFullscreen: (value: boolean) => Promise<boolean>;
  toggleFullscreen: () => Promise<boolean>;
  resizeTo: (value: number | string) => Promise<boolean>;
  resetSize: () => Promise<boolean>;
}
export const drawerSizes = {
  xs: 280,
  sm: 360,
  md: 520,
  lg: 736,
  xl: 960,
  full: "100%",
} as const;
export const drawerVertical = (placement?: HysDrawerPlacement) =>
  placement === "top" || placement === "bottom";
export function drawerSize(props: HysDrawerProps) {
  const preset = props.size ?? "md";
  return (
    (drawerVertical(props.placement)
      ? (props.height ?? props.width)
      : props.width) ??
    (typeof preset === "string" && Object.hasOwn(drawerSizes, preset)
      ? drawerSizes[preset as HysDrawerSizeName]
      : preset)
  );
}
