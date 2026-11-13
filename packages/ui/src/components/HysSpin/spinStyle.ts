import type { CSSProperties } from "vue";
import type { HysSpinProps } from "./spinTypes";

const sizes: Record<string, number> = {
  xs: 14,
  sm: 20,
  md: 30,
  lg: 42,
  xl: 56,
};
export const cssLength = (value: number | string | undefined) =>
  typeof value === "number"
    ? Number.isFinite(value)
      ? Math.max(0, value) + "px"
      : undefined
    : value;
export const bounded = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => (Number.isFinite(value) ? Math.max(min, Math.min(max, value!)) : fallback);
export function spinStyle(
  options: HysSpinProps,
  paused: boolean,
): CSSProperties {
  const size = cssLength(
    typeof options.size === "string" && Object.hasOwn(sizes, options.size)
      ? sizes[options.size]
      : (options.size ?? sizes.md),
  );
  const duration =
    bounded(options.animationDuration, 900, 0, 60000) /
    bounded(options.speed, 1, 0.05, 20);
  return {
    "--hys-spin-width": cssLength(options.width) ?? size,
    "--hys-spin-height": cssLength(options.height) ?? size,
    "--hys-spin-region-height": cssLength(options.regionHeight),
    "--hys-spin-gap": cssLength(options.gap) ?? "8px",
    "--hys-spin-color": options.color,
    "--hys-spin-track": options.trackColor,
    "--hys-spin-track-opacity": options.trackColor ? 1 : 0.2,
    "--hys-spin-mask":
      options.mask === false ? "transparent" : options.maskColor,
    "--hys-spin-mask-opacity": bounded(options.maskOpacity, 0.72, 0, 1),
    "--hys-spin-blur": bounded(options.blur, 0, 0, 100) + "px",
    "--hys-spin-duration": duration + "ms",
    "--hys-spin-delay":
      bounded(options.animationDelay, 0, -60000, 60000) + "ms",
    "--hys-spin-direction": options.direction ?? "normal",
    "--hys-spin-reverse-direction":
      options.direction === "reverse" ? "normal" : "reverse",
    "--hys-spin-easing": options.easing ?? "linear",
    "--hys-spin-iterations":
      typeof options.iterations === "number"
        ? bounded(options.iterations, 1, 0, 100000)
        : "infinite",
    "--hys-spin-angle": bounded(options.angle, 360, -36000, 36000) + "deg",
    "--hys-spin-play": paused ? "paused" : "running",
    "--hys-spin-transition":
      bounded(options.transitionDuration, 160, 0, 10000) + "ms",
    "--hys-spin-custom": options.animationName,
  };
}
