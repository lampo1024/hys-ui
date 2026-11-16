import type { HysChartAxis, HysChartRange, HysChartXAxis } from "./chartTypes";
import { timeValue } from "./chartModel";

export function bounds(
  values: Iterable<number>,
  includeZero = false,
): HysChartRange {
  let start = includeZero ? 0 : Infinity;
  let end = includeZero ? 0 : -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    start = Math.min(start, value);
    end = Math.max(end, value);
  }
  if (!Number.isFinite(start)) return { start: 0, end: 1 };
  return { start, end };
}

export function axisDomain(
  values: Iterable<number>,
  axis?: HysChartAxis,
  includeZero = false,
) {
  const data = bounds(values, axis?.includeZero ?? includeZero);
  const min = Number.isFinite(axis?.min) ? axis!.min : undefined;
  const max = Number.isFinite(axis?.max) ? axis!.max : undefined;
  if (min !== undefined && max !== undefined && min >= max) return data;
  const start = min ?? data.start;
  const end = max ?? data.end;
  if (start < end) return { start, end };
  if (min !== undefined && start < Number.MAX_VALUE)
    return { start, end: finite(start + (Math.abs(start) * 0.15 || 1)) };
  if (max !== undefined && end > -Number.MAX_VALUE)
    return { start: finite(end - (Math.abs(end) * 0.15 || 1)), end };
  if (start === 0) return { start: 0, end: 1 };
  return {
    start: Math.max(-Number.MAX_VALUE, start - Math.abs(start) * 0.15),
    end: Math.min(Number.MAX_VALUE, end + Math.abs(end) * 0.15),
  };
}

const normalize = (range: HysChartRange) =>
  Math.max(Math.abs(range.start), Math.abs(range.end), 1e-300);
const steps = [1, 2, 2.5, 5, 10];
const timeSteps = [
  1, 10, 100, 1000, 5000, 15000, 30000, 60000, 300000, 900000, 1800000, 3600000,
  10800000, 21600000, 43200000, 86400000, 172800000, 604800000, 1209600000,
  2592000000, 7776000000, 31536000000,
];
const finite = (value: number) =>
  Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, value));

export function chartScale(
  domain: HysChartRange,
  start: number,
  length: number,
  options: HysChartAxis = {},
  defaultCount = 5,
  exact = false,
  time = false,
) {
  const unit = normalize(domain);
  const low = domain.start / unit;
  const high = domain.end / unit;
  const count = Number.isFinite(options.tickCount)
    ? Math.max(2, Math.min(16, Math.round(options.tickCount!)))
    : defaultCount;
  const estimate = (high - low) / (count - 1);
  const base = 10 ** Math.floor(Math.log10(estimate));
  const relativeStep =
    (steps.find((factor) => factor * base >= estimate) ?? 10) * base;
  const timeStep = time
    ? timeSteps.find((value) => value / unit >= estimate)
    : undefined;
  const step = timeStep ? timeStep / unit : relativeStep || 1;
  const keepStart = exact || Number.isFinite(options.min);
  const keepEnd = exact || Number.isFinite(options.max);
  const first = keepStart
    ? low
    : Math.max(-Number.MAX_VALUE / unit, Math.floor(low / step + 1e-10) * step);
  const last = keepEnd
    ? high
    : Math.min(Number.MAX_VALUE / unit, Math.ceil(high / step - 1e-10) * step);
  const span = last - first || 1;
  const at = (value: number) =>
    start +
    length * Math.max(-1e6, Math.min(1e6, (value / unit - first) / span));
  const invert = (pixel: number) =>
    finite((first + ((pixel - start) / length) * span) * unit);
  const initial = Math.ceil(first / step - 1e-8);
  const total = Math.max(
    0,
    Math.min(40, Math.floor(last / step + 1e-8) - initial + 1),
  );
  const auto = Array.from({ length: total }, (_, index) => {
    const value = finite((initial + index) * step * unit);
    return time ? Math.round(value) : Number(value.toPrecision(15));
  });
  if (auto.length < 2) auto.push(finite(first * unit), finite(last * unit));
  const tickValues = [...new Set(options.ticks ?? auto)]
    .filter(
      (value) =>
        Number.isFinite(value) &&
        value / unit >= first - span * 1e-8 &&
        value / unit <= last + span * 1e-8,
    )
    .sort((a, b) => a - b);
  return {
    at,
    invert,
    ticks: tickValues.map((value) => ({ value, position: at(value) })),
    contains: (value: number) => value / unit >= first && value / unit <= last,
    clamp: (value: number) =>
      finite(Math.min(last, Math.max(first, value / unit)) * unit),
  };
}

export function xDomain(
  coordinates: readonly number[],
  count: number,
  axis: "category" | "value" | "time",
  options?: HysChartXAxis,
) {
  if (axis === "category") return { start: 0, end: Math.max(0, count - 1) };
  const min = axis === "time" ? timeValue(options?.min) : options?.min;
  const max = axis === "time" ? timeValue(options?.max) : options?.max;
  const domain = axisDomain(coordinates, {
    min: typeof min === "number" ? min : undefined,
    max: typeof max === "number" ? max : undefined,
    includeZero: options?.includeZero,
  });
  if (
    axis === "time" &&
    coordinates.length === 1 &&
    !Number.isFinite(min) &&
    !Number.isFinite(max)
  ) {
    const date = coordinates[0];
    return { start: date - 43200000, end: date + 43200000 };
  }
  return domain;
}

function minimumRangeSpan(span: number, unit: number, category: boolean) {
  return Math.min(span, category ? 1 / unit : span / 10000);
}

export function fitRange(
  request: HysChartRange | null | undefined,
  domain: HysChartRange,
  category: boolean,
) {
  if (
    !request ||
    !Number.isFinite(request.start) ||
    !Number.isFinite(request.end)
  )
    return domain;
  const unit = normalize(domain);
  const low = domain.start / unit;
  const high = domain.end / unit;
  const minimum = minimumRangeSpan(high - low, unit, category);
  const requestedStart = Math.min(request.start, request.end);
  const requestedEnd = Math.max(request.start, request.end);
  const start = Math.min(high - minimum, Math.max(low, requestedStart / unit));
  const end = Math.min(high, Math.max(start + minimum, requestedEnd / unit));
  return {
    start:
      start === low
        ? domain.start
        : start === requestedStart / unit
          ? requestedStart
          : finite(start * unit),
    end:
      end === high
        ? domain.end
        : end === requestedEnd / unit
          ? requestedEnd
          : finite(end * unit),
  };
}

export function shiftRange(
  range: HysChartRange,
  domain: HysChartRange,
  fraction: number,
) {
  const unit = normalize(domain);
  const length = range.end / unit - range.start / unit;
  const start = Math.min(
    domain.end / unit - length,
    Math.max(domain.start / unit, range.start / unit + length * fraction),
  );
  return { start: finite(start * unit), end: finite((start + length) * unit) };
}

export function zoomRange(
  range: HysChartRange,
  domain: HysChartRange,
  factor: number,
  anchor: number,
  category: boolean,
  coordinate?: number,
) {
  const unit = normalize(domain);
  const low = domain.start / unit;
  const high = domain.end / unit;
  const currentSpan = range.end / unit - range.start / unit;
  const minimum = minimumRangeSpan(high - low, unit, category);
  const length = Math.max(minimum, currentSpan * factor);
  // Normalizing large timestamps can lose a few ulps at either endpoint.
  const tolerance =
    Number.EPSILON * 4 * Math.max(Math.abs(low), Math.abs(high));
  if (factor >= 1 && length + tolerance >= high - low) return domain;
  if (factor <= 1 && currentSpan - minimum <= tolerance) return range;
  const center =
    coordinate === undefined
      ? range.start / unit + currentSpan * anchor
      : coordinate / unit;
  const start = Math.max(
    low,
    Math.min(high - length, center - length * anchor),
  );
  return fitRange(
    { start: finite(start * unit), end: finite((start + length) * unit) },
    domain,
    category,
  );
}
