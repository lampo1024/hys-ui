import type { VNodeChild } from "vue";
export type HysProgressType = "line" | "circle" | "dashboard";
export type HysProgressStatus =
  "normal" | "success" | "warning" | "error" | "active";
export type HysProgressSize = "sm" | "md" | "lg";
export type HysProgressLinecap = "round" | "butt" | "square";
export type HysProgressGapPosition = "top" | "right" | "bottom" | "left";
export type HysProgressGradientDirection =
  | number
  | "to right"
  | "to left"
  | "to top"
  | "to bottom"
  | "to top right"
  | "to top left"
  | "to bottom right"
  | "to bottom left";
export interface HysProgressGradientStop {
  offset: number;
  color: string;
}
export interface HysProgressGradient {
  from: string;
  to: string;
  direction?: HysProgressGradientDirection;
  stops?: readonly HysProgressGradientStop[];
}
export interface HysProgressColorStop {
  value: number;
  color: string;
}
export type HysProgressColor =
  | string
  | ((value: number) => string)
  | readonly HysProgressColorStop[]
  | readonly string[]
  | HysProgressGradient;
export interface HysProgressSuccess {
  value: number;
  color?: HysProgressColor;
}
export interface HysProgressLabelContext {
  value: number;
  successValue: number;
  status: HysProgressStatus;
  indeterminate: boolean;
}
export interface HysProgressProps {
  value: number;
  showLabel?: boolean;
  color?: HysProgressColor;
  status?: HysProgressStatus;
  strokeWidth?: number;
  type?: HysProgressType;
  width?: number | string;
  format?: (value: number, successValue: number) => VNodeChild;
  indeterminate?: boolean;
  size?: HysProgressSize;
  textInside?: boolean;
  textColor?: string;
  precision?: number;
  showStatusIcon?: boolean;
  trailColor?: string;
  strokeLinecap?: HysProgressLinecap;
  success?: HysProgressSuccess;
  steps?: number;
  stepGap?: number;
  gapDegree?: number;
  gapPosition?: HysProgressGapPosition;
  striped?: boolean;
  stripedFlow?: boolean;
  animated?: boolean;
  duration?: number;
  flowDuration?: number;
  ariaLabel?: string;
  ariaValueText?: string | ((context: HysProgressLabelContext) => string);
}
export interface HysProgressSlots {
  default?: (context: HysProgressLabelContext) => VNodeChild;
  icon?: (context: HysProgressLabelContext) => VNodeChild;
}
export interface HysProgressInstance {
  readonly element: HTMLElement | undefined;
  readonly value: number;
  readonly successValue: number;
  readonly status: HysProgressStatus;
}
export const progressPercent = (value: number | undefined) =>
  Number.isFinite(value) ? Math.max(0, Math.min(100, value!)) : 0;
export const progressNumber = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => (Number.isFinite(value) ? Math.max(min, Math.min(max, value!)) : fallback);
const primary = "var(--hys-ui-primary,var(--hys-ui-theme-primary))";
export const progressStatusColor = (status: HysProgressStatus) =>
  ({
    normal: primary,
    active: primary,
    success: "var(--hys-ui-success,var(--hys-ui-theme-success,#16a46e))",
    warning: "var(--hys-ui-warning,var(--hys-ui-theme-warning,#d9860c))",
    error: "var(--hys-ui-red,var(--hys-ui-theme-red,#ed4556))",
  })[status] || primary;
export type ProgressPaint = {
  color: string;
  gradient?: { stops: HysProgressGradientStop[]; angle: number };
};
const colorText = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
function angle(direction?: HysProgressGradientDirection) {
  if (typeof direction === "number")
    return Number.isFinite(direction) ? ((direction % 360) + 360) % 360 : 90;
  return (
    (
      {
        "to top": 0,
        "to top right": 45,
        "to right": 90,
        "to bottom right": 135,
        "to bottom": 180,
        "to bottom left": 225,
        "to left": 270,
        "to top left": 315,
      } as const
    )[direction ?? "to right"] ?? 90
  );
}
export function progressPaint(
  color: HysProgressColor | undefined,
  value: number,
  fallback: string,
): ProgressPaint {
  if (typeof color === "function") {
    try {
      return { color: colorText(color(value), fallback) };
    } catch {
      return { color: fallback };
    }
  }
  if (Array.isArray(color)) {
    if (color.every((item) => typeof item === "string")) {
      const palette = (color as readonly string[]).filter((item) =>
        item.trim(),
      );
      if (palette.length > 1)
        return {
          color: palette[0],
          gradient: {
            angle: 90,
            stops: palette.map((color, index) => ({
              offset: (index / (palette.length - 1)) * 100,
              color,
            })),
          },
        };
      return { color: palette[0] || fallback };
    }
    const stops = (color as readonly HysProgressColorStop[])
      .filter(
        (stop) =>
          stop &&
          Number.isFinite(stop.value) &&
          typeof stop.color === "string" &&
          stop.color.trim(),
      )
      .map((stop) => ({ ...stop, value: progressPercent(stop.value) }))
      .sort((a, b) => a.value - b.value);
    return {
      color:
        (stops.find((stop) => value <= stop.value) ?? stops.at(-1))?.color ||
        fallback,
    };
  }
  if (color && typeof color === "object") {
    const gradient = color as HysProgressGradient;
    const stops = [
      { offset: 0, color: colorText(gradient.from, fallback) },
      ...(gradient.stops ?? [])
        .filter(
          (stop) =>
            stop &&
            Number.isFinite(stop.offset) &&
            typeof stop.color === "string" &&
            stop.color.trim(),
        )
        .map((stop) => ({
          offset: progressPercent(stop.offset),
          color: stop.color,
        })),
      { offset: 100, color: colorText(gradient.to, fallback) },
    ].sort((a, b) => a.offset - b.offset);
    return {
      color: stops[0].color,
      gradient: { stops, angle: angle(gradient.direction) },
    };
  }
  return { color: colorText(color, fallback) };
}
export function progressCssPaint(paint: ProgressPaint) {
  return paint.gradient
    ? `linear-gradient(${paint.gradient.angle}deg,${paint.gradient.stops.map((stop) => `${stop.color} ${stop.offset}%`).join(",")})`
    : paint.color;
}
export function progressGradientCoordinates(degrees: number) {
  const rad = (degrees * Math.PI) / 180,
    dx = Math.sin(rad) * 50,
    dy = -Math.cos(rad) * 50;
  return { x1: 50 - dx, y1: 50 - dy, x2: 50 + dx, y2: 50 + dy };
}
export function progressArc(radius: number, start: number, degrees: number) {
  const point = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return `${+(50 + radius * Math.cos(radians)).toFixed(5)} ${+(50 + radius * Math.sin(radians)).toFixed(5)}`;
  };
  if (degrees <= 0) return "";
  if (degrees >= 359.99999)
    return `M ${point(start)} A ${radius} ${radius} 0 1 1 ${point(start + 180)} A ${radius} ${radius} 0 1 1 ${point(start + 360)}`;
  return `M ${point(start)} A ${radius} ${radius} 0 ${degrees > 180 ? 1 : 0} 1 ${point(start + degrees)}`;
}
let sequence = 0;
export const progressId = () => `hys-ui-progress-${++sequence}`;
