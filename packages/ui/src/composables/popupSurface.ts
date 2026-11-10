import type { CSSProperties, VNodeChild } from "vue";
import type { HysPopupMotionProps } from "../motion/popup";
import type { Placement } from "./useFloating";
export type HysPopupPlacement = Placement;
export type HysPopupTrigger =
  "hover" | "focus" | "click" | "contextmenu" | "manual";
export interface HysPopupVirtualReference {
  getBoundingClientRect: () => DOMRect;
  contextElement?: HTMLElement;
}
export type HysPopupReference = HTMLElement | HysPopupVirtualReference;
export interface HysPopupSurfaceProps extends HysPopupMotionProps {
  open?: boolean;
  modelValue?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  trigger?: HysPopupTrigger | readonly HysPopupTrigger[];
  triggerKeys?: readonly string[];
  triggerTabindex?: number;
  placement?: HysPopupPlacement;
  offset?: number;
  autoAdjustOverflow?: boolean;
  showDelay?: number;
  hideDelay?: number;
  autoClose?: number;
  enterable?: boolean;
  closeOnEscape?: boolean;
  closeOnOutside?: boolean;
  destroyOnHide?: boolean;
  forceRender?: boolean;
  appendTo?: string | HTMLElement | false;
  reference?: HysPopupReference | (() => HysPopupReference | undefined);
  width?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  showArrow?: boolean;
  arrowOffset?: number;
  effect?: "light" | "dark";
  color?: string;
  textColor?: string;
  overlayClass?: string;
  overlayStyle?: CSSProperties;
  contentClass?: string;
  contentStyle?: CSSProperties;
  zIndex?: number;
  ariaLabel?: string;
}
export interface HysTooltipProps extends HysPopupSurfaceProps {
  text?: string;
}
export interface HysPopoverProps extends HysPopupSurfaceProps {
  title?: string;
  content?: string;
}
export interface HysPopupSurfaceContext {
  open: boolean;
  show: () => Promise<boolean>;
  close: () => Promise<boolean>;
  toggle: () => Promise<boolean>;
  updatePosition: () => void;
}
export interface HysTooltipSlots {
  default?: (scope: HysPopupSurfaceContext) => VNodeChild;
  content?: (scope: HysPopupSurfaceContext) => VNodeChild;
}
export interface HysPopoverSlots {
  trigger?: (scope: HysPopupSurfaceContext) => VNodeChild;
  default?: (scope: HysPopupSurfaceContext) => VNodeChild;
  title?: (scope: HysPopupSurfaceContext) => VNodeChild;
}
export interface HysPopupSurfaceInstance {
  readonly element: HTMLElement | undefined;
  readonly referenceElement: HTMLElement | undefined;
  readonly open: boolean;
  readonly placement: HysPopupPlacement;
  show: () => Promise<boolean>;
  hide: () => Promise<boolean>;
  close: () => Promise<boolean>;
  toggle: () => Promise<boolean>;
  updatePosition: () => void;
  focus: () => void;
}
export type HysTooltipInstance = HysPopupSurfaceInstance;
export type HysPopoverInstance = HysPopupSurfaceInstance;
