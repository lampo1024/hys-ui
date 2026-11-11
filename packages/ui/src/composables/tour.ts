import type { Component, CSSProperties, VNode } from "vue";
import type { HysButtonProps } from "../components/HysButton/HysButton.vue";
import type { HysPopupMotionProps } from "../motion/popup";
import type { Placement } from "./useFloating";

export type HysTourTarget = string | HTMLElement | (() => HTMLElement | null | undefined);
export type HysTourContent = string | VNode | (() => string | VNode);
export type HysTourMask = boolean | { color?: string; style?: CSSProperties };
export interface HysTourGap {
  /** Pixels around the target, either uniform or [horizontal, vertical]. */
  offset?: number | [number, number];
  radius?: number;
}
export interface HysTourButtonProps extends HysButtonProps {
  children?: HysTourContent;
  onClick?: (event: MouseEvent) => void;
}
export interface HysTourAppearance {
  /** Preferred card placement; flips to the opposite side when space is limited. */
  placement?: Placement;
  mask?: HysTourMask;
  gap?: HysTourGap;
  showArrow?: boolean;
  arrow?: boolean | { pointAtCenter?: boolean };
  type?: "default" | "primary";
  contentStyle?: CSSProperties;
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions;
  targetAreaClickable?: boolean;
  showClose?: boolean;
  closeIcon?: string | Component;
  prevButtonProps?: HysTourButtonProps;
  nextButtonProps?: HysTourButtonProps;
}
export interface HysTourStep extends HysTourAppearance {
  /** An element, CSS selector, or function returning the element. */
  target?: HysTourTarget;
  title?: HysTourContent;
  description?: HysTourContent;
  cover?: HysTourContent;
  onClose?: () => void;
}
export interface HysTourProps extends HysPopupMotionProps, HysTourAppearance {
  steps: readonly HysTourStep[];
  /** Display state alias for v-model:open. */
  open?: boolean;
  /** Zero-based step index; supports v-model:current and external navigation. */
  current?: number;
  closeOnEscape?: boolean;
  appendTo?: string | HTMLElement | false;
  zIndex?: number;
  skipText?: string;
  prevText?: string;
  nextText?: string;
  finishText?: string;
}
export interface HysTourContext {
  step: HysTourStep | undefined;
  current: number;
  total: number;
  goTo: (index: number) => void;
  previous: () => void;
  next: () => void;
  close: () => void;
}
