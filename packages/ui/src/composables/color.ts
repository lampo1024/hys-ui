import type { CSSProperties, VNodeChild } from "vue";
import type { HysPopupMotionProps } from "../motion/popup";
import type { Placement } from "./useFloating";
export type HysColorFormat = "hex" | "rgb" | "hsl" | "hsv";
export interface HysColor {
  h: number;
  s: number;
  v: number;
  a: number;
}
export interface HysColorPickerProps extends HysPopupMotionProps {
  modelValue?: string;
  defaultValue?: string;
  disabled?: boolean;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  ariaLabel?: string;
  presets?: readonly string[];
  clearable?: boolean;
  showAlpha?: boolean;
  format?: HysColorFormat;
  /** Apply on change by default, on pointer release with "release", or on confirmation with false. */
  immediate?: boolean | "release";
  showInput?: boolean;
  showText?: boolean;
  showPresets?: boolean;
  inline?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  placement?: Placement;
  appendTo?: string | HTMLElement | false;
  popupClass?: string;
  popupStyle?: CSSProperties;
  popupWidth?: number | string;
  showFooter?: boolean;
  confirmText?: string;
  cancelText?: string;
  clearText?: string;
  status?: "error" | "warning" | "success";
  error?: string;
  name?: string;
  form?: string;
  tabindex?: number;
  autofocus?: boolean;
  validateEvent?: boolean;
  inputProps?: Record<string, unknown>;
}
export interface HysColorPickerContext {
  value: string;
  draft: string;
  color: Readonly<HysColor>;
  disabled: boolean;
  readonly: boolean;
  valid: boolean;
  dirty: boolean;
  setColor: (value: string) => Promise<boolean>;
  confirm: () => Promise<boolean>;
  cancel: () => void;
  clear: () => Promise<boolean>;
  show: () => Promise<boolean>;
  hide: () => Promise<boolean>;
}
export interface HysColorPickerSlots {
  trigger?: (context: HysColorPickerContext) => VNodeChild;
  header?: (context: HysColorPickerContext) => VNodeChild;
  footer?: (context: HysColorPickerContext) => VNodeChild;
  preset?: (context: {
    value: string;
    color: string;
    selected: boolean;
    disabled: boolean;
  }) => VNodeChild;
}
export interface HysColorPickerInstance {
  readonly element: HTMLElement | undefined;
  readonly input: HTMLInputElement | undefined;
  readonly panel: HTMLElement | undefined;
  readonly value: string;
  readonly draft: string;
  readonly color: Readonly<HysColor>;
  readonly open: boolean;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  show: () => Promise<boolean>;
  hide: () => Promise<boolean>;
  confirm: () => Promise<boolean>;
  cancel: () => void;
  clear: () => Promise<boolean>;
  setColor: (value: string) => Promise<boolean>;
}
export const colorClamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
const finite = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value))
    ? Number(value)
    : undefined;
function unit(value: string, scale: number) {
  const percent = value.endsWith("%"),
    n = finite(percent ? value.slice(0, -1) : value);
  return n === undefined ? undefined : colorClamp(n / (percent ? 100 : scale));
}
function angle(value: string) {
  const m = value.match(/^([-+]?(?:\d*\.)?\d+)(deg|rad|turn|grad)?$/i);
  if (!m) return;
  const n =
    Number(m[1]) *
    ({ deg: 1, rad: 180 / Math.PI, turn: 360, grad: 0.9 }[
      m[2]?.toLowerCase() ?? "deg"
    ] ?? 1);
  return ((n % 360) + 360) % 360;
}
export function colorFromRgb(r: number, g: number, b: number, a = 1): HysColor {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0;
  if (d)
    h =
      (max === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4) * 60;
  return { h, s: max ? d / max : 0, v: max, a: colorClamp(a) };
}
export function colorRgb(c: HysColor) {
  const s = colorClamp(c.s),
    v = colorClamp(c.v),
    h = ((c.h % 360) + 360) % 360;
  const channel = (n: number) => {
    const k = (n + h / 60) % 6;
    return colorClamp(v - v * s * Math.max(0, Math.min(k, 4 - k, 1)));
  };
  return [channel(5), channel(3), channel(1)] as const;
}
export function parseColor(value: string | undefined): HysColor | undefined {
  if (typeof value !== "string") return;
  const input = value.trim().toLowerCase();
  if (input === "transparent") return { h: 0, s: 0, v: 0, a: 0 };
  const named: Record<string, string> = {
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    black: "#000000",
    white: "#ffffff",
    yellow: "#ffff00",
    orange: "#ffa500",
    purple: "#800080",
    rebeccapurple: "#663399",
    gray: "#808080",
    grey: "#808080",
    cyan: "#00ffff",
    magenta: "#ff00ff",
    lime: "#00ff00",
    navy: "#000080",
    teal: "#008080",
    pink: "#ffc0cb",
  };
  if (named[input]) return parseColor(named[input]);
  const hex = input.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i);
  if (hex) {
    const v =
      hex[1].length <= 4 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return colorFromRgb(
      ...([0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as [
        number,
        number,
        number,
      ]),
      v.length === 8 ? parseInt(v.slice(6, 8), 16) / 255 : 1,
    );
  }
  const match = input.match(/^(rgba?|hsla?|hsva?)\(([^()]*)\)$/);
  if (!match) return;
  const pieces = match[2]
    .trim()
    .replace(/\s*[,/]\s*/g, " ")
    .split(/\s+/);
  if (pieces.length < 3 || pieces.length > 4) return;
  const a = pieces[3] === undefined ? 1 : unit(pieces[3], 1);
  if (a === undefined) return;
  if (match[1].startsWith("rgb")) {
    const rgb = pieces.slice(0, 3).map((p) => unit(p, 255));
    if (rgb.some((v) => v === undefined)) return;
    return colorFromRgb(...(rgb as [number, number, number]), a);
  }
  const h = angle(pieces[0]),
    s = unit(pieces[1], 100),
    third = unit(pieces[2], 100);
  if (h === undefined || s === undefined || third === undefined) return;
  if (match[1].startsWith("hsv")) return { h, s, v: third, a };
  const l = third,
    v = l + s * Math.min(l, 1 - l);
  return { h, s: v ? 2 * (1 - l / v) : 0, v, a };
}
const rounded = (value: number, digits = 1) => Number(value.toFixed(digits));
export function formatColor(
  color: HysColor,
  format: HysColorFormat = "hex",
  alpha = false,
) {
  const rgb = colorRgb(color),
    a = rounded(colorClamp(color.a), 3),
    bytes = rgb.map((c) => Math.round(c * 255)),
    h = rounded(((color.h % 360) + 360) % 360);
  if (format === "hex")
    return (
      "#" +
      bytes.map((v) => v.toString(16).padStart(2, "0")).join("") +
      (alpha
        ? Math.round(a * 255)
            .toString(16)
            .padStart(2, "0")
        : "")
    );
  if (format === "rgb")
    return (
      (alpha ? "rgba(" : "rgb(") +
      bytes.join(", ") +
      (alpha ? ", " + a : "") +
      ")"
    );
  if (format === "hsv")
    return (
      (alpha ? "hsva(" : "hsv(") +
      h +
      ", " +
      rounded(color.s * 100) +
      "%, " +
      rounded(color.v * 100) +
      "%" +
      (alpha ? ", " + a : "") +
      ")"
    );
  const l = color.v * (1 - color.s / 2),
    s = l > 0 && l < 1 ? (color.v - l) / Math.min(l, 1 - l) : 0;
  return (
    (alpha ? "hsla(" : "hsl(") +
    h +
    ", " +
    rounded(s * 100) +
    "%, " +
    rounded(l * 100) +
    "%" +
    (alpha ? ", " + a : "") +
    ")"
  );
}
export const colorCss = (color: HysColor) => formatColor(color, "rgb", true);
export function sameColor(a: HysColor | undefined, b: HysColor | undefined) {
  if (!a || !b) return a === b;
  const rgbA = colorRgb(a),
    rgbB = colorRgb(b);
  return (
    rgbA.every((value, index) => Math.abs(value - rgbB[index]) <= 1 / 255) &&
    Math.abs(a.a - b.a) <= 0.004
  );
}
