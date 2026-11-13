import type { CSSProperties, MaybeRefOrGetter, Ref } from "vue";
import type { HysSpinAnimation } from "./spinCatalog";

export type HysSpinStatus =
  | "idle"
  | "loading"
  | "retrying"
  | "success"
  | "error"
  | "cancelled"
  | "timeout"
  | (string & {});
export type HysSpinMode =
  "inline" | "block" | "container" | "overlay" | "fullscreen" | "indicator";
export type HysSpinSize = number | string;
export type HysSpinPlacement =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end";
export interface HysSpinSnapshot {
  status: HysSpinStatus;
  spinning: boolean;
  progress?: number;
  message?: string;
  stage?: string;
  remainingTime?: number;
  error?: unknown;
}
export interface HysSpinUpdate {
  progress?: number | null;
  message?: string;
  stage?: string;
  remainingTime?: number;
  status?: HysSpinStatus;
}
export interface HysSpinTaskContext {
  signal: AbortSignal;
  attempt: number;
  update(patch: HysSpinUpdate): void;
  progress(value: number): void;
}
export type HysSpinWork<T = unknown> =
  PromiseLike<T> | ((context: HysSpinTaskContext) => T | PromiseLike<T>);
export interface HysSpinRunOptions {
  timeout?: number;
  initial?: HysSpinUpdate;
}
export interface HysSpinPreset {
  animation?: HysSpinAnimation;
  animationName?: string;
  speed?: number;
  animationDuration?: number;
  easing?: string;
  direction?: "normal" | "reverse";
  iterations?: number | "infinite";
  angle?: number;
  path?: string;
}
export interface HysSpinProps extends HysSpinPreset {
  spinning?: boolean;
  modelValue?: boolean;
  defaultSpinning?: boolean;
  mode?: HysSpinMode;
  size?: HysSpinSize;
  width?: number | string;
  height?: number | string;
  regionHeight?: number | string;
  delay?: number;
  minDuration?: number;
  timeout?: number;
  autoEnd?: number;
  task?: HysSpinWork;
  status?: HysSpinStatus;
  showResult?: boolean;
  progress?: number;
  progressType?: "ring" | "line" | "segments";
  segments?: number;
  showPercentage?: boolean;
  formatProgress?: (value: number) => string;
  title?: string;
  message?: string;
  description?: string;
  stage?: string;
  remainingTime?: number;
  layout?: "top" | "bottom" | "left" | "right";
  placement?: HysSpinPlacement;
  align?: "start" | "center" | "end";
  gap?: number | string;
  ariaLabel?: string;
  mask?: boolean;
  maskColor?: string;
  maskOpacity?: number;
  blur?: number;
  zIndex?: number;
  appendTo?: string | HTMLElement | ShadowRoot;
  blockInteraction?: boolean;
  lockScroll?: boolean;
  cancellable?: boolean;
  retryable?: boolean;
  escapeCancel?: boolean;
  cancelLabel?: string;
  retryLabel?: string;
  preset?: string;
  animationDelay?: number;
  animated?: boolean;
  paused?: boolean;
  pauseWhenHidden?: boolean;
  transitionDuration?: number;
  color?: string;
  trackColor?: string;
  strokeWidth?: number;
  dotSize?: number;
  dotGap?: number;
  colors?: readonly string[];
  gradient?: readonly string[];
  indicatorStyle?: CSSProperties;
  messageStyle?: CSSProperties;
  overlayStyle?: CSSProperties;
}
export interface HysSpinContext extends HysSpinSnapshot {
  visible: boolean;
  percentText: string;
  cancel(): void;
  retry(): Promise<unknown> | undefined;
}
export interface HysSpinConfig {
  defaults?: MaybeRefOrGetter<Partial<HysSpinProps>>;
  presets?: MaybeRefOrGetter<Record<string, HysSpinPreset>>;
}
export interface HysSpinTask {
  state: Readonly<Ref<HysSpinSnapshot>>;
  run<T>(work: HysSpinWork<T>, options?: HysSpinRunOptions): Promise<T>;
  cancel(): void;
  retry(): Promise<unknown> | undefined;
  update(patch: HysSpinUpdate): void;
  reset(): void;
}
export interface HysSpinHandle {
  update(options: Partial<HysSpinProps>): void;
  close(): void;
  readonly closed: Promise<void>;
}
export interface HysSpinService {
  show(options?: Partial<HysSpinProps>): HysSpinHandle;
  run<T>(work: HysSpinWork<T>, options?: Partial<HysSpinProps>): Promise<T>;
  closeAll(): void;
}
