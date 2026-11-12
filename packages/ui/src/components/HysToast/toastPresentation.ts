import type { CSSProperties } from "vue";
import type {
  HysToastDirection,
  HysToastLocale,
  HysToastPosition,
  HysToastPresentation,
} from "./toastTypes";

export const toastLocale: HysToastLocale = {
  close: "关闭提示",
  copy: "复制消息",
  copied: "已复制",
  copyFailed: "无法复制消息",
  expand: "展开内容",
  collapse: "收起内容",
  collapseStack: "收起提示列表",
  pinStack: "固定展开提示列表",
  remaining: (seconds) => seconds + " 秒后关闭",
  repeat: (count) => "重复 " + count + " 次",
  more: (count) => "展开其余 " + count + " 条提示",
  actionFailed: "操作失败，请重试",
  progress: "任务进度",
};
export function normalizeToastPosition(
  position: HysToastPosition = "top-center",
) {
  return position === "top"
    ? "top-center"
    : position === "bottom"
      ? "bottom-center"
      : position;
}
export const finite = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? value! : fallback;
export const toastDuration = (options: HysToastPresentation) =>
  options.persistent
    ? 0
    : Math.min(
        2147483647,
        Math.max(
          0,
          finite(options.duration, options.type === "loading" ? 0 : 3000),
        ),
      );
export function toastPlacement(options: HysToastPresentation): CSSProperties {
  const position = normalizeToastPosition(options.position);
  const x = Math.max(0, finite(options.offsetX, finite(options.offset, 24)));
  const y = Math.max(0, finite(options.offsetY, finite(options.offset, 24)));
  const style: CSSProperties = {
    position: "fixed",
    zIndex: options.zIndex ?? 2000,
    maxWidth: `min(calc(100vw - ${Math.min(48, Math.max(16, x)) * 2}px), calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 16px))`,
  };
  if (position === "custom") {
    const coordinates = options.coordinates;
    return {
      ...style,
      top: coordinates?.bottom === undefined ? `${y}px` : undefined,
      left: coordinates?.right === undefined ? `${x}px` : undefined,
      ...coordinates,
    };
  }
  if (position === "center")
    return { ...style, top: "50%", left: "50%", translate: "-50% -50%" };
  const side = position.startsWith("bottom") ? "bottom" : "top";
  style[side] = `max(${y}px, env(safe-area-inset-${side}, 0px))`;
  if (position.endsWith("left"))
    style.left = `max(${x}px, env(safe-area-inset-left, 0px))`;
  else if (position.endsWith("right"))
    style.right = `max(${x}px, env(safe-area-inset-right, 0px))`;
  else Object.assign(style, { left: "50%", translate: "-50% 0" });
  return style;
}
function motionDirection(options: HysToastPresentation): HysToastDirection {
  const position = normalizeToastPosition(options.position);
  if (options.direction) return options.direction;
  if (position.endsWith("left")) return "left";
  if (position.endsWith("right")) return "right";
  return position.startsWith("bottom") ? "bottom" : "top";
}
function motionEasing(
  easing: HysToastPresentation["easing"],
  fallback: string,
) {
  if (typeof easing !== "function") return easing ?? fallback;
  try {
    const samples = Array.from({ length: 21 }, (_, index) =>
      finite(easing(index / 20), index / 20),
    );
    const curve = `linear(${samples.join(",")})`;
    return typeof CSS === "undefined" ||
      CSS.supports("animation-timing-function", curve)
      ? curve
      : fallback;
  } catch {
    return fallback;
  }
}
export function toastMotion(options: HysToastPresentation): CSSProperties {
  const direction = motionDirection(options);
  const motion = options.animation ?? "scale";
  const slide = {
    top: "translateY(-16px)",
    bottom: "translateY(16px)",
    left: "translateX(-20px)",
    right: "translateX(20px)",
  }[direction];
  const transform =
    typeof motion === "object"
      ? motion.enterFrom
      : {
          fade: "none",
          slide,
          scale: "scale(.96)",
          spring: slide + " scale(.92)",
          bounce: slide + " scale(.93)",
          rotate: "rotate(-6deg) scale(.96)",
          none: "none",
        }[motion];
  const easing =
    motion === "spring"
      ? "cubic-bezier(.18,.9,.32,1.45)"
      : motion === "bounce"
        ? "cubic-bezier(.34,1.56,.64,1)"
        : "var(--hys-ui-motion-ease, ease)";
  const leave =
    typeof motion === "object" ? (motion.leaveTo ?? transform) : transform;
  return {
    "--hys-toast-enter": transform,
    "--hys-toast-recoil": {
      top: "translateY(4px)",
      bottom: "translateY(-4px)",
      left: "translateX(4px)",
      right: "translateX(-4px)",
    }[direction],
    "--hys-toast-leave": leave === "none" ? "translate(0)" : leave,
    "--hys-toast-motion-opacity":
      typeof motion === "object" ? (motion.opacity ?? 0) : 0,
    "--hys-toast-motion-duration":
      motion === "none"
        ? "0ms"
        : options.animationDuration === undefined
          ? "var(--hys-ui-motion-base, 200ms)"
          : Math.max(0, finite(options.animationDuration, 200)) + "ms",
    "--hys-toast-motion-easing": motionEasing(options.easing, easing),
  };
}
