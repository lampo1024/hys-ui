import type { CSSProperties } from "vue";
import type { HysIconAnimation, HysIconProps } from "./iconTypes";
const sizes: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 36,
};
export const iconLength = (value: number | string | undefined) =>
  typeof value === "number" && Number.isFinite(value)
    ? value + "px"
    : typeof value === "string"
      ? value
      : undefined;
export function iconNumber(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, value!))
    : fallback;
}
export const hysIconAnimations = [
  "none",
  "spin",
  "rotate",
  "pulse",
  "bounce",
  "shake",
  "swing",
  "wiggle",
  "float",
  "breathing",
  "scale",
  "fade",
  "slide",
  "flip",
  "spring",
  "heartbeat",
  "blink",
  "draw",
  "morph",
  "gradient",
  "loading",
] as const;
export function iconStyle(
  options: HysIconProps,
  animation: HysIconAnimation,
  paused: boolean,
): CSSProperties {
  const size =
    iconLength(
      typeof options.size === "string" && Object.hasOwn(sizes, options.size)
        ? sizes[options.size]
        : options.size,
    ) ?? "1em";
  const builtin = (hysIconAnimations as readonly string[]).includes(animation);
  const animationName =
    animation === "none"
      ? "none"
      : builtin
        ? "hys-icon-" + animation
        : animation;
  const duration =
    iconNumber(options.duration, 900, 0, 60000) /
    iconNumber(options.speed, 1, 0.05, 20);
  const count =
    typeof options.iterations === "number"
      ? iconNumber(options.iterations, 1, 0, 100000)
      : (options.iterations ??
        (options.animateOn === "click" || options.animateOn === "state"
          ? 1
          : "infinite"));
  return {
    "--hys-icon-width": iconLength(options.width) ?? size,
    "--hys-icon-height": iconLength(options.height) ?? size,
    "--hys-icon-font-size": iconLength(options.height) ?? size,
    "--hys-icon-padding": iconLength(options.padding) ?? "0px",
    "--hys-icon-gap": iconLength(options.gap) ?? "6px",
    "--hys-icon-radius":
      iconLength(options.radius) ??
      (options.shape === "circle"
        ? "50%"
        : options.shape === "square"
          ? "0px"
          : "7px"),
    "--hys-icon-angle": iconNumber(options.rotate, 0, -36000, 36000) + "deg",
    "--hys-icon-flip-x": options.flipX ? -1 : 1,
    "--hys-icon-flip-y": options.flipY ? -1 : 1,
    "--hys-icon-mirrored-x": options.flipX ? 1 : -1,
    "--hys-icon-animation": animationName,
    "--hys-icon-duration": duration + "ms",
    "--hys-icon-delay":
      iconNumber(options.animationDelay, 0, -60000, 60000) + "ms",
    "--hys-icon-ease":
      options.easing ??
      (["spin", "rotate", "loading", "draw"].includes(animation)
        ? "linear"
        : "ease-in-out"),
    "--hys-icon-repeat": count,
    "--hys-icon-play": paused ? "paused" : "running",
    color: options.color,
    opacity: iconNumber(options.opacity, 1, 0, 1),
    background: options.background,
    border: options.border,
    boxShadow: options.shadow,
    filter: options.glow ? "drop-shadow(" + options.glow + ")" : undefined,
    verticalAlign: options.verticalAlign,
    ...options.animationStyle,
  };
}
