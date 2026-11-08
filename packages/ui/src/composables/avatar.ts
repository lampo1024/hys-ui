import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
  type Component,
  type ComputedRef,
  type CSSProperties,
  type ImgHTMLAttributes,
  type InjectionKey,
} from "vue";
import type { Placement } from "./useFloating";
export type HysAvatarBreakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type HysAvatarSize =
  | number
  | "sm"
  | "md"
  | "lg"
  | "small"
  | "medium"
  | "default"
  | "large"
  | Partial<Record<HysAvatarBreakpoint, number>>;
export type HysAvatarFit = "cover" | "contain" | "fill" | "none" | "scale-down";
export interface HysAvatarProps {
  name?: string;
  src?: string;
  srcset?: string;
  srcSet?: string;
  sizes?: string;
  size?: HysAvatarSize;
  shape?: "circle" | "square";
  fit?: HysAvatarFit;
  alt?: string;
  icon?: Component;
  gap?: number;
  autoFit?: boolean;
  color?: string;
  textColor?: string;
  bordered?: boolean;
  radius?: number | string;
  fallbackSrc?: string;
  loadError?: (event: Event) => boolean | void;
  draggable?: boolean;
  crossOrigin?: "" | "anonymous" | "use-credentials";
  lazy?: boolean;
  imgProps?: ImgHTMLAttributes;
}
export interface HysAvatarLoadInfo {
  src: string;
  fallback: boolean;
}
export interface HysAvatarInstance {
  element: HTMLElement | undefined;
  image: HTMLImageElement | undefined;
  loaded: boolean;
  failed: boolean;
  reload: () => void;
}
export interface HysAvatarOption extends HysAvatarProps {
  key?: string | number;
}
export interface HysAvatarGroupInstance {
  open: () => Promise<void>;
  close: () => void;
}
export interface HysAvatarGroupProps {
  options?: readonly HysAvatarOption[];
  size?: HysAvatarSize;
  shape?: "circle" | "square";
  gap?: number;
  maxCount?: number;
  vertical?: boolean;
  bordered?: boolean;
  maxStyle?: CSSProperties;
  maxClass?: string;
  placement?: Placement;
  trigger?: "hover" | "focus" | "click";
  showOverflow?: boolean;
  expandOnHover?: boolean;
}
export interface AvatarGroupContext {
  size: ComputedRef<HysAvatarSize | undefined>;
  shape: ComputedRef<"circle" | "square" | undefined>;
  bordered: ComputedRef<boolean>;
}
export const avatarGroupKey: InjectionKey<AvatarGroupContext> = Symbol(
  "hys-ui-avatar-group",
);
const points: readonly [HysAvatarBreakpoint, number][] = [
  ["xs", 0],
  ["sm", 576],
  ["md", 768],
  ["lg", 992],
  ["xl", 1200],
  ["xxl", 1600],
];
const width = ref(0),
  subscribers = new Set<symbol>();
let frame: number | undefined;
function measure() {
  frame = undefined;
  width.value = window.innerWidth;
}
function resize() {
  if (frame === undefined) frame = requestAnimationFrame(measure);
}
export function resolveAvatarSize(
  size: HysAvatarSize | undefined,
  viewport: number,
) {
  let result: number | string | undefined =
    typeof size === "object" ? undefined : size;
  if (size && typeof size === "object")
    for (const [name, min] of points)
      if (viewport >= min && size[name] !== undefined) result = size[name];
  if (typeof result === "string")
    result = (
      {
        sm: 24,
        small: 24,
        md: 36,
        medium: 36,
        default: 36,
        lg: 48,
        large: 48,
      } as Record<string, number>
    )[result];
  return typeof result === "number" && Number.isFinite(result)
    ? Math.max(1, Math.min(1024, result))
    : 36;
}
export function useAvatarSize(size: ComputedRef<HysAvatarSize | undefined>) {
  const active = ref(true),
    token = Symbol();
  let listening = false;
  function release() {
    if (!listening) return;
    listening = false;
    subscribers.delete(token);
    if (!subscribers.size) {
      window.removeEventListener("resize", resize);
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
    }
  }
  function bind() {
    if (!active.value || !size.value || typeof size.value !== "object") {
      release();
      return;
    }
    if (listening) return;
    listening = true;
    subscribers.add(token);
    if (subscribers.size === 1) {
      measure();
      window.addEventListener("resize", resize);
    }
  }
  watch([active, () => !!size.value && typeof size.value === "object"], bind, {
    immediate: true,
  });
  onActivated(() => (active.value = true));
  onDeactivated(() => {
    active.value = false;
    release();
  });
  onBeforeUnmount(release);
  return computed(() => resolveAvatarSize(size.value, width.value));
}
