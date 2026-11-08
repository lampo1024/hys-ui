export type HysNumberInputValue = number | string | null;
export interface HysNumberInputFormatInfo {
  userTyping: boolean;
  input: string;
}
export interface HysNumberInputStepInfo {
  offset: number | string;
  type: "up" | "down";
  source: "button" | "keyboard" | "wheel" | "repeat" | "method";
}
export interface HysNumberInputInvalidInfo {
  input: string;
  reason: "parse" | "validator" | "range";
}
export interface HysNumberInputInstance {
  input: HTMLInputElement | undefined;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  select: () => void;
  clear: () => void;
  commit: () => boolean;
  increase: (multiplier?: number) => void;
  decrease: (multiplier?: number) => void;
}
export interface Decimal {
  units: bigint;
  scale: number;
}
const power = (scale: number) => 10n ** BigInt(scale);
export function decimal(value: unknown): Decimal | undefined {
  if (typeof value !== "string" && typeof value !== "number") return;
  if (typeof value === "number" && !Number.isFinite(value)) return;
  const text = String(value).trim();
  if (text.length > 2048) return;
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i.exec(
    text,
  );
  if (!match) return;
  const exponent = Number(match[5] ?? 0);
  if (!Number.isInteger(exponent) || Math.abs(exponent) > 1000) return;
  const fraction = match[3] ?? match[4] ?? "",
    digits = (match[2] ?? "0") + fraction;
  let scale = fraction.length - exponent,
    units = BigInt(digits) * (match[1] === "-" ? -1n : 1n);
  if (scale < 0) {
    units *= power(-scale);
    scale = 0;
  }
  if (scale > 1000) return;
  while (scale > 0 && units % 10n === 0n) {
    units /= 10n;
    scale--;
  }
  return { units, scale };
}
function align(a: Decimal, b: Decimal) {
  const scale = Math.max(a.scale, b.scale);
  return {
    a: a.units * power(scale - a.scale),
    b: b.units * power(scale - b.scale),
    scale,
  };
}
export function decimalCompare(a: Decimal, b: Decimal) {
  const pair = align(a, b);
  return pair.a === pair.b ? 0 : pair.a < pair.b ? -1 : 1;
}
export function decimalAdd(a: Decimal, b: Decimal, multiplier = 1) {
  const pair = align(a, b);
  return {
    units: pair.a + pair.b * BigInt(Math.trunc(multiplier)),
    scale: pair.scale,
  };
}
export function decimalRound(value: Decimal, precision: number): Decimal {
  const scale = Math.max(0, Math.min(100, Math.floor(precision)));
  if (value.scale <= scale) return value;
  const divisor = power(value.scale - scale),
    negative = value.units < 0n,
    magnitude = negative ? -value.units : value.units;
  return {
    units:
      (magnitude / divisor +
        ((magnitude % divisor) * 2n >= divisor ? 1n : 0n)) *
      (negative ? -1n : 1n),
    scale,
  };
}
export function decimalText(value: Decimal, padTo?: number) {
  const negative = value.units < 0n,
    units = negative ? -value.units : value.units;
  let digits = units.toString().padStart(value.scale + 1, "0"),
    text = value.scale
      ? digits.slice(0, -value.scale) + "." + digits.slice(-value.scale)
      : digits;
  if (text.includes(".")) text = text.replace(/\.?0+$/, "");
  if (padTo !== undefined && padTo > 0) {
    const parts = text.split(".");
    text = parts[0] + "." + (parts[1] ?? "").padEnd(Math.min(100, padTo), "0");
  }
  return (negative && units !== 0n ? "-" : "") + text;
}
function floorDivide(a: bigint, b: bigint) {
  const result = a / b;
  return a < 0n && a % b !== 0n ? result - 1n : result;
}
function ceilDivide(a: bigint, b: bigint) {
  return -floorDivide(-a, b);
}
export interface NumberConstraints {
  step: Decimal;
  base: Decimal;
  min?: Decimal;
  max?: Decimal;
  precision?: number;
  strict: boolean;
}
export function normalizeDecimal(
  value: Decimal,
  options: NumberConstraints,
): Decimal | undefined {
  const { step, base, min, max } = options;
  if (min && max && decimalCompare(min, max) > 0) return;
  let next =
    options.precision === undefined
      ? value
      : decimalRound(value, options.precision);
  if (options.strict) {
    const scale = Math.max(
        next.scale,
        step.scale,
        base.scale,
        min?.scale ?? 0,
        max?.scale ?? 0,
      ),
      n = next.units * power(scale - next.scale),
      stride = step.units * power(scale - step.scale),
      origin = base.units * power(scale - base.scale);
    const offset = n - origin,
      negative = offset < 0n,
      magnitude = negative ? -offset : offset;
    let index =
      (magnitude / stride + ((magnitude % stride) * 2n >= stride ? 1n : 0n)) *
      (negative ? -1n : 1n);
    const low = min
        ? ceilDivide(min.units * power(scale - min.scale) - origin, stride)
        : undefined,
      high = max
        ? floorDivide(max.units * power(scale - max.scale) - origin, stride)
        : undefined;
    if (low !== undefined && high !== undefined && low > high) return;
    if (low !== undefined && index < low) index = low;
    if (high !== undefined && index > high) index = high;
    next = { units: origin + index * stride, scale };
  } else {
    if (min && decimalCompare(next, min) < 0) next = min;
    if (max && decimalCompare(next, max) > 0) next = max;
  }
  return next;
}
