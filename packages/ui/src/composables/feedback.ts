import type { CSSProperties, VNodeChild } from "vue";
export type HysAlertTone =
  "info" | "primary" | "success" | "warning" | "danger";
export type HysAlertEffect = "light" | "dark" | "outline";
export type HysAlertTransition = "fade" | "slide" | "collapse" | "none";
export interface HysAlertCloseContext {
  reason: "button" | "api";
  event?: Event;
  signal: AbortSignal;
}
export interface HysAlertProps {
  tone?: HysAlertTone;
  title?: string;
  description?: string;
  closable?: boolean;
  showIcon?: boolean;
  center?: boolean;
  visible?: boolean;
  modelValue?: boolean;
  defaultVisible?: boolean;
  effect?: HysAlertEffect;
  banner?: boolean;
  bordered?: boolean;
  size?: "sm" | "md" | "lg";
  closeText?: string;
  closeLabel?: string;
  disabled?: boolean;
  beforeClose?: (
    context: HysAlertCloseContext,
  ) => boolean | void | Promise<boolean | void>;
  transition?: HysAlertTransition;
  transitionDuration?: number;
  appear?: boolean;
  ariaLabel?: string;
  ariaLive?: "off" | "polite" | "assertive";
  ariaAtomic?: boolean;
}
export interface HysAlertSlotContext {
  tone: HysAlertTone;
  visible: boolean;
  closing: boolean;
  disabled: boolean;
  close: () => Promise<boolean>;
}
export interface HysAlertSlots {
  default?: (context: HysAlertSlotContext) => VNodeChild;
  title?: (context: HysAlertSlotContext) => VNodeChild;
  description?: (context: HysAlertSlotContext) => VNodeChild;
  icon?: (context: HysAlertSlotContext) => VNodeChild;
  action?: (context: HysAlertSlotContext) => VNodeChild;
  "close-icon"?: (context: HysAlertSlotContext) => VNodeChild;
}
export interface HysAlertInstance {
  readonly element: HTMLElement | undefined;
  readonly visible: boolean;
  readonly closing: boolean;
  close: () => Promise<boolean>;
  show: () => Promise<boolean>;
}
export type HysEmptyIllustration = "inbox" | "simple" | "default";
export interface HysEmptyProps {
  title?: string | false;
  description?: string | false;
  image?: string | false;
  imageSize?: number;
  imageStyle?: CSSProperties;
  imageFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  imageAlt?: string;
  imageLoading?: "eager" | "lazy";
  crossOrigin?: "" | "anonymous" | "use-credentials";
  referrerPolicy?: ReferrerPolicy;
  illustration?: HysEmptyIllustration;
  size?: "sm" | "md" | "lg";
  showImageLoading?: boolean;
  ariaLabel?: string;
  ariaLive?: "off" | "polite" | "assertive";
}
export interface HysEmptySlotContext {
  title: string | false;
  description: string | false;
  imageLoading: boolean;
  imageError: boolean;
  retryImage: () => boolean;
}
export interface HysEmptySlots {
  default?: (context: HysEmptySlotContext) => VNodeChild;
  image?: (context: HysEmptySlotContext) => VNodeChild;
  title?: (context: HysEmptySlotContext) => VNodeChild;
  description?: (context: HysEmptySlotContext) => VNodeChild;
  action?: (context: HysEmptySlotContext) => VNodeChild;
  fallback?: (context: HysEmptySlotContext) => VNodeChild;
}
export interface HysEmptyInstance {
  readonly element: HTMLElement | undefined;
  readonly imageElement: HTMLImageElement | undefined;
  readonly loadingImage: boolean;
  readonly failedImage: boolean;
  retryImage: () => boolean;
}
export function feedbackImage(value: string | false | undefined) {
  if (!value) return;
  try {
    const url = new URL(value, document.baseURI);
    if (
      ["http:", "https:", "blob:"].includes(url.protocol) ||
      /^data:image\//i.test(value)
    )
      return url.href;
  } catch {}
}
export const feedbackNumber = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => (Number.isFinite(value) ? Math.max(min, Math.min(max, value!)) : fallback);
