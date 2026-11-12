import type { CSSProperties, VNodeChild } from "vue";
import type { HysConfig, HysTheme } from "../../config";

export type HysToastType =
  "success" | "error" | "warning" | "info" | "loading" | "default" | "custom";
export type HysToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "center"
  | "custom"
  | "top"
  | "bottom";
export type HysToastCloseReason =
  | "timeout"
  | "button"
  | "click"
  | "escape"
  | "keyboard"
  | "swipe"
  | "action"
  | "api"
  | "model"
  | "overflow"
  | "dispose";
export type HysToastStatus = "queued" | "visible" | "closing" | "closed";
export type HysToastAnimation =
  "fade" | "slide" | "scale" | "spring" | "bounce" | "rotate" | "none";
export type HysToastDirection = "top" | "bottom" | "left" | "right";
export type HysToastProgress = number | "indeterminate";
export type HysToastCoordinates = Pick<
  CSSProperties,
  "top" | "right" | "bottom" | "left" | "translate"
>;
export interface HysToastMotionPreset {
  enterFrom: string;
  leaveTo?: string;
  opacity?: number;
}
export interface HysToastLocale {
  close: string;
  copy: string;
  copied: string;
  copyFailed: string;
  expand: string;
  collapse: string;
  collapseStack: string;
  pinStack: string;
  remaining: (seconds: number) => string;
  repeat: (count: number) => string;
  more: (count: number) => string;
  actionFailed: string;
  progress: string;
}

export interface HysToastPresentation {
  message?: string;
  title?: string;
  type?: HysToastType;
  duration?: number;
  persistent?: boolean;
  closable?: boolean;
  closeOnClick?: boolean;
  closeOnEscape?: boolean;
  keyboardDismiss?: boolean;
  pauseOnHover?: boolean;
  pauseOnBlur?: boolean;
  swipe?: boolean;
  interactive?: boolean;
  position?: HysToastPosition;
  offset?: number;
  offsetX?: number;
  offsetY?: number;
  coordinates?: HysToastCoordinates;
  zIndex?: number;
  width?: string | number;
  showIcon?: boolean;
  plain?: boolean;
  glass?: boolean;
  theme?: HysTheme;
  toastStyle?: CSSProperties;
  progressStyle?: CSSProperties;
  progress?: HysToastProgress;
  showProgress?: boolean;
  countdown?: boolean;
  maxLines?: number;
  copyable?: boolean;
  copyText?: string;
  actionLayout?: "inline" | "footer";
  actions?: readonly HysToastAction[];
  animation?: HysToastAnimation | HysToastMotionPreset;
  direction?: HysToastDirection;
  animationDuration?: number;
  easing?: string | ((progress: number) => number);
  live?: "polite" | "assertive" | "off";
  locale?: Partial<HysToastLocale>;
  beforeClose?: (
    context: HysToastCloseContext,
  ) => boolean | void | Promise<boolean | void>;
}
export interface HysToastProps extends HysToastPresentation {
  open?: boolean;
  teleport?: boolean;
  appendTo?: string | HTMLElement | ShadowRoot;
  repeat?: number;
  paused?: boolean;
}
export interface HysToastContext {
  id?: string;
  message: string;
  title?: string;
  type: HysToastType;
}
export interface HysToastCloseContext extends HysToastContext {
  reason: HysToastCloseReason;
  event?: Event;
}
export interface HysToastActionContext extends HysToastContext {
  close: () => Promise<boolean>;
  update: (patch: HysToastPatch) => void;
  copy: () => Promise<boolean>;
}
export interface HysToastAction {
  id: string;
  label: string;
  disabled?: boolean;
  closeOnSuccess?: boolean;
  run?: (context: HysToastActionContext) => unknown;
  success?: HysToastFeedback<unknown>;
  error?: HysToastFeedback<unknown>;
}
export interface HysToastActionEvent extends HysToastContext {
  action: HysToastAction;
  status: "start" | "success" | "error";
  result?: unknown;
}
export type HysToastRender =
  VNodeChild | ((context: HysToastActionContext) => VNodeChild);
export interface HysToastOptions extends HysToastPresentation {
  id?: string;
  content?: HysToastRender;
  icon?: HysToastRender;
  header?: HysToastRender;
  footer?: HysToastRender;
  renderActions?: HysToastRender;
  priority?: number;
  group?: string;
  grouping?: boolean;
  dedupe?: "ignore" | "merge";
  dedupeKey?: string;
  dedupeWindow?: number;
  onShow?: (context: HysToastContext) => void;
  onAfterShow?: (context: HysToastContext) => void;
  onClose?: (context: HysToastCloseContext) => void;
  onAfterClose?: (context: HysToastCloseContext) => void;
  onClick?: (event: MouseEvent, context: HysToastContext) => void;
  onAction?: (event: HysToastActionEvent) => void;
  onStateChange?: (snapshot: HysToastSnapshot) => void;
}
export type HysToastPatch = string | Partial<Omit<HysToastOptions, "id">>;
export type HysToastFeedback<T> = HysToastPatch | ((value: T) => HysToastPatch);
export type HysToastFilter = {
  type?: HysToastType;
  group?: string;
  position?: HysToastPosition;
  status?: HysToastStatus;
};
export interface HysToastSnapshot extends HysToastContext {
  id: string;
  status: HysToastStatus;
  position: HysToastPosition;
  group?: string;
  priority: number;
  repeat: number;
}
export interface HysToastConfig extends Omit<
  HysToastPresentation,
  "message" | "title" | "theme" | "copyText"
> {
  maxCount?: number;
  maxQueue?: number;
  overflow?: "replace" | "queue";
  queueOrder?: "fifo" | "lifo";
  queueScope?: "global" | "position" | "type" | "group";
  layout?: "vertical" | "horizontal" | "layered";
  gap?: number;
  collapsedCount?: number;
  layerCount?: number;
  layerTrigger?: "hover" | "click" | "both";
  grouping?: boolean;
  dedupe?: "ignore" | "merge";
  dedupeWindow?: number;
  appendTo?: string | HTMLElement | ShadowRoot;
}
export interface HysToastHandle {
  readonly id: string;
  readonly closed: Promise<void>;
  close(): void;
  update(value: HysToastPatch): void;
  extend(milliseconds: number): void;
  pause(): void;
  resume(): void;
}
export interface HysToastTaskContext {
  handle: HysToastHandle;
  update: (value: HysToastPatch) => void;
  progress: (value: HysToastProgress) => void;
}
export interface HysToastPromiseOptions<T> {
  id?: string;
  options?: HysToastOptions;
  loading?: HysToastPatch;
  success?: HysToastFeedback<T>;
  error?: HysToastFeedback<unknown>;
}
export interface HysToastTask<T> {
  handle: HysToastHandle;
  promise: Promise<T>;
}
type TypedToast = (
  value: string | Omit<HysToastOptions, "type">,
) => HysToastHandle;
export interface HysToastApi {
  show(value: string | HysToastOptions): HysToastHandle;
  success: TypedToast;
  info: TypedToast;
  warning: TypedToast;
  error: TypedToast;
  loading: TypedToast;
  promise<T>(
    task:
      PromiseLike<T> | ((context: HysToastTaskContext) => T | PromiseLike<T>),
    options?: HysToastPromiseOptions<T>,
  ): HysToastTask<T>;
  close(id: string): void;
  update(id: string, value: HysToastPatch): void;
  find(id: string): HysToastSnapshot | undefined;
  list(filter?: HysToastFilter): HysToastSnapshot[];
  closeAll(filter?: HysToastFilter): void;
  closeType(type: HysToastType): void;
  clearQueue(): void;
  configure(config: Partial<HysToastConfig>): void;
}
export interface HysToastServiceConfig extends HysToastConfig, HysConfig {}
export interface HysToastService extends HysToastApi {
  dispose(): void;
}
