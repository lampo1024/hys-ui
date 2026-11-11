import {
  decimal,
  decimalAdd,
  decimalCompare,
  decimalRound,
  decimalText,
  type Decimal,
} from "./numberInput";
import type {
  HysNumberAnimationOptions,
  HysNumberDirection,
  HysNumberFormatOptions,
  HysNumberRounding,
  HysNumberTrend,
  HysNumberUnitRule,
  HysNumberValue,
} from "./animatedNumber";

const zero = { units: 0n, scale: 0 };
const power = (scale: number) => 10n ** BigInt(scale);
const absolute = (value: Decimal): Decimal => ({
  units: value.units < 0n ? -value.units : value.units,
  scale: value.scale,
});

export function numberValue(value: HysNumberValue | undefined): HysNumberValue {
  return value === undefined ||
    (typeof value === "number" && !Number.isFinite(value))
    ? 0
    : value;
}

export function bounded(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(min, Number.isFinite(value) ? value! : fallback),
  );
}

export function numberDirection(
  from: HysNumberValue,
  to: HysNumberValue,
): HysNumberDirection {
  const start = decimal(from),
    end = decimal(to);
  if (!start || !end) return "none";
  const comparison = decimalCompare(end, start);
  return comparison > 0 ? "up" : comparison < 0 ? "down" : "none";
}

export function numberInterpolation(from: HysNumberValue, to: HysNumberValue) {
  const start = decimal(from),
    end = decimal(to);
  if (!start || !end) return () => from;
  const scale = Math.min(1000, Math.max(start.scale, end.scale) + 9);
  const initial = start.units * power(scale - start.scale);
  const difference = end.units * power(scale - end.scale) - initial;
  const stringMode = typeof from === "string" || typeof to === "string";
  return (progress: number): HysNumberValue => {
    const units =
      initial + (difference * BigInt(Math.round(progress * 1e9))) / 1000000000n;
    const text = decimalText({ units, scale });
    if (stringMode) return text;
    const numeric = Number(text);
    return Number.isFinite(numeric) ? numeric : text;
  };
}

export function createNumberInterpolator(
  from: HysNumberValue,
  to: HysNumberValue,
  custom: HysNumberAnimationOptions["interpolate"],
) {
  const interpolate = numberInterpolation(from, to);
  if (!custom)
    return (_progress: number, easedProgress: number) =>
      interpolate(easedProgress);
  return (progress: number, easedProgress: number): HysNumberValue => {
    const defaultValue = interpolate(easedProgress);
    try {
      const value = custom({ from, to, progress, easedProgress, defaultValue });
      return decimal(value) ? value : defaultValue;
    } catch {
      return defaultValue;
    }
  };
}

function divideRounded(
  units: bigint,
  divisor: bigint,
  rounding: HysNumberRounding,
) {
  const whole = units / divisor,
    remainder = units % divisor;
  if (!remainder || rounding === "trunc") return whole;
  const sign = units < 0n ? -1n : 1n;
  if (rounding === "floor") return sign < 0n ? whole - 1n : whole;
  if (rounding === "ceil") return sign > 0n ? whole + 1n : whole;
  const twice = remainder * sign * 2n;
  return twice > divisor ||
    (twice === divisor && (rounding === "half-up" || whole % 2n !== 0n))
    ? whole + sign
    : whole;
}

function divide(
  value: Decimal,
  divisor: Decimal,
  scale: number,
  rounding: HysNumberRounding,
): Decimal {
  const shift = scale + divisor.scale - value.scale;
  return {
    scale,
    units: divideRounded(
      value.units * power(Math.max(0, shift)),
      divisor.units * power(Math.max(0, -shift)),
      rounding,
    ),
  };
}

function round(value: Decimal, scale: number, rounding: HysNumberRounding) {
  if (value.scale <= scale) return value;
  if (rounding === "half-up") return decimalRound(value, scale);
  return {
    scale,
    units: divideRounded(value.units, power(value.scale - scale), rounding),
  };
}

export function numberTrend(
  previous: HysNumberValue,
  target: HysNumberValue,
  threshold?: HysNumberValue,
): HysNumberTrend {
  const from = decimal(previous),
    to = decimal(target);
  if (!from || !to)
    return {
      previous,
      target,
      direction: "none",
      delta: null,
      percent: null,
      significant: false,
    };
  const delta = decimalAdd(to, from, -1);
  const direction =
    delta.units > 0n ? "up" : delta.units < 0n ? "down" : "none";
  const limit = decimal(threshold);
  return {
    previous,
    target,
    direction,
    delta: decimalText(delta),
    percent:
      from.units === 0n
        ? null
        : decimalText(
            divide(
              { ...delta, units: delta.units * 100n },
              absolute(from),
              6,
              "half-up",
            ),
          ),
    significant:
      direction !== "none" &&
      !!limit &&
      limit.units >= 0n &&
      decimalCompare(absolute(delta), limit) >= 0,
  };
}

const shortUnits: HysNumberUnitRule[] = [
  { threshold: "1e3", label: "K" },
  { threshold: "1e6", label: "M" },
  { threshold: "1e9", label: "B" },
  { threshold: "1e12", label: "T" },
];
const chineseUnits: HysNumberUnitRule[] = [
  { threshold: "1e4", label: "万" },
  { threshold: "1e8", label: "亿" },
  { threshold: "1e12", label: "万亿" },
];

function compactRules(option: HysNumberFormatOptions["compact"]) {
  const rules =
    option === "short"
      ? shortUnits
      : option === "zh"
        ? chineseUnits
        : (option ?? []);
  return rules
    .flatMap(({ threshold, divisor, label }) => {
      const minimum = decimal(threshold),
        factor = decimal(divisor ?? threshold);
      return minimum && minimum.units > 0n && factor && factor.units > 0n
        ? [{ minimum, factor, label }]
        : [];
    })
    .sort((a, b) => decimalCompare(b.minimum, a.minimum));
}

export interface NumberPresentation {
  text: string;
  parts: Intl.NumberFormatPart[];
  unit: string;
}

export function createNumberPresentation(options: HysNumberFormatOptions) {
  const {
    locale,
    numberFormat = "decimal",
    currency = "CNY",
    currencySymbol,
    currencyDisplay = "symbol",
    percentInput = "ratio",
    compact,
    unit = "",
    rounding = "half-up",
    trimZeros = false,
    groupSeparator,
    decimalSeparator,
    grouping,
    signDisplay = "auto",
    positiveSign,
    negativeSign,
  } = options;
  const precision = options.precision ?? options.decimals;
  const places =
    precision === undefined
      ? undefined
      : Math.floor(bounded(precision, 0, 0, 100));
  const minimumIntegerDigits = Math.floor(
    bounded(options.minimumIntegerDigits, 1, 1, 21),
  );
  const rules = compactRules(compact);
  const useGrouping =
    groupSeparator === ""
      ? false
      : (grouping ?? (groupSeparator !== undefined || locale !== undefined));
  const style = numberFormat === "scientific" ? "decimal" : numberFormat;
  const createIntl = (config: Intl.NumberFormatOptions) => {
    try {
      return new Intl.NumberFormat(locale ?? "en-US", config);
    } catch {
      return new Intl.NumberFormat("en-US", { ...config, currency: "CNY" });
    }
  };
  const integer = createIntl({
    minimumIntegerDigits,
    useGrouping,
    maximumFractionDigits: 0,
  });
  const digits = createIntl({ useGrouping: false, maximumFractionDigits: 0 });
  const localized = Array.from({ length: 10 }, (_, i) => digits.format(i));
  const localize = (value: string) =>
    value.replace(/[0-9]/g, (digit) => localized[Number(digit)]);
  const separator =
    decimalSeparator ??
    createIntl({})
      .formatToParts(1.1)
      .find(({ type }) => type === "decimal")?.value ??
    ".";
  const layout = createIntl({
    style,
    currency,
    currencyDisplay,
    signDisplay: "always",
  });
  const templates = [-1, 0, 1].map((value) => layout.formatToParts(value));

  function formatParts(
    value: Decimal,
    digits: number | undefined,
    exponent?: number,
  ) {
    const [whole, fraction] = decimalText(
      absolute(value),
      trimZeros ? undefined : digits,
    ).split(".");
    const body = integer
      .formatToParts(BigInt(whole))
      .map((part) =>
        part.type === "group" && groupSeparator !== undefined
          ? { ...part, value: groupSeparator }
          : part,
      );
    if (fraction)
      body.push(
        { type: "decimal", value: separator },
        { type: "fraction", value: localize(fraction) },
      );
    if (exponent !== undefined) {
      body.push(
        { type: "exponentSeparator", value: "e" },
        { type: "exponentInteger", value: localize(String(exponent)) },
      );
    }
    return templates[value.units < 0n ? 0 : value.units > 0n ? 2 : 1].flatMap(
      (part) => {
        switch (part.type) {
          case "integer":
            return body;
          case "decimal":
          case "fraction":
          case "group":
            return [];
          case "minusSign":
            return signDisplay === "never"
              ? []
              : [{ ...part, value: negativeSign ?? part.value }];
          case "plusSign":
            return signDisplay === "always" ||
              (signDisplay === "exceptZero" && value.units !== 0n)
              ? [{ ...part, value: positiveSign ?? part.value }]
              : [];
          case "currency":
            return [{ ...part, value: currencySymbol ?? part.value }];
          default:
            return [part];
        }
      },
    );
  }

  function format(raw: HysNumberValue): NumberPresentation {
    const value = decimal(raw);
    if (!value)
      return {
        text: String(raw) + unit,
        parts: [{ type: "literal", value: String(raw) }],
        unit,
      };
    const input =
      style === "percent" && percentInput === "ratio"
        ? { ...value, units: value.units * 100n }
        : value;
    const rule = rules.find(
      ({ minimum }) => decimalCompare(absolute(input), minimum) >= 0,
    );
    const digits =
      places ??
      (rule || numberFormat === "scientific"
        ? rule
          ? 1
          : 3
        : style === "currency"
          ? layout.resolvedOptions().maximumFractionDigits
          : typeof raw === "string"
            ? undefined
            : 0);
    let exponent: number | undefined;
    let displayed = input;
    if (numberFormat === "scientific") {
      const magnitude = absolute(value).units.toString().length;
      exponent = value.units === 0n ? 0 : magnitude - value.scale - 1;
      displayed =
        value.units === 0n
          ? zero
          : round(
              { units: value.units, scale: magnitude - 1 },
              digits!,
              rounding,
            );
      if (decimalCompare(absolute(displayed), { units: 10n, scale: 0 }) >= 0) {
        displayed = { ...displayed, scale: displayed.scale + 1 };
        exponent++;
      }
    } else if (rule) {
      displayed = divide(input, rule.factor, digits!, rounding);
    } else if (digits !== undefined) {
      displayed = round(input, digits, rounding);
    }
    const parts = formatParts(displayed, digits, exponent);
    const unitText =
      (numberFormat === "scientific" ? "" : (rule?.label ?? "")) + unit;
    return {
      text: parts.map(({ value }) => value).join("") + unitText,
      parts,
      unit: unitText,
    };
  }
  return { format, localized };
}
