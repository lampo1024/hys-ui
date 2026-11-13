import { paneEpsilon, paneRatio } from "../../composables/splitPaneSizes";
import type {
  HysSplitPaneLength,
  HysSplitPanePanelOptions,
} from "./HysSplitPane.vue";

interface Bounds {
  min: number;
  max: number;
}

interface ResizePlan extends Bounds {
  initial: number;
  apply(value: number): number[];
}

export function splitIsVertical(
  vertical: boolean,
  width: number,
  breakpoint?: number,
) {
  return (
    vertical ||
    (width > 0 &&
      breakpoint !== undefined &&
      Number.isFinite(breakpoint) &&
      width < breakpoint)
  );
}

export function constrainSplitSize(
  value: number,
  bounds: Bounds,
  candidates: readonly number[] = [],
  threshold = 0,
) {
  const clamped = Math.min(bounds.max, Math.max(bounds.min, value));
  let result = clamped;
  let distance = threshold;
  for (const candidate of candidates) {
    const offset = Math.abs(candidate - clamped);
    if (
      candidate >= bounds.min &&
      candidate <= bounds.max &&
      offset <= distance
    ) {
      result = candidate;
      distance = offset;
    }
  }
  return result;
}

export function splitSnapCandidates(
  start: number,
  before: number,
  after: number,
  available: number,
  beforePoints?: readonly HysSplitPaneLength[],
  afterPoints?: readonly HysSplitPaneLength[],
) {
  const candidates: number[] = [];
  for (const point of beforePoints ?? []) {
    const ratio = paneRatio(point, available);
    if (ratio !== undefined) candidates.push(start + ratio - before);
  }
  for (const point of afterPoints ?? []) {
    const ratio = paneRatio(point, available);
    if (ratio !== undefined) candidates.push(start + after - ratio);
  }
  return candidates;
}

export function splitSnapThreshold(value: number, available: number) {
  return Number.isFinite(value) && value > 0 && available > 0
    ? (value / available) * 100
    : 0;
}

export function splitPair(
  values: readonly number[],
  index: number,
  first: number,
) {
  const next = [...values];
  next[index + 1] = Math.max(0, values[index] + values[index + 1] - first);
  next[index] = first;
  return next;
}

export function adjacentSplitResize(
  values: readonly number[],
  bounds: readonly Bounds[],
  index: number,
): ResizePlan {
  const initial = values[index];
  const total = initial + values[index + 1];
  const min = Math.max(bounds[index].min, total - bounds[index + 1].max);
  const max = Math.min(bounds[index].max, total - bounds[index + 1].min);
  return {
    initial,
    min: min <= max ? min : initial,
    max: min <= max ? max : initial,
    apply: (value) => splitPair(values, index, value),
  };
}

export function cascadeSplitResize(
  values: readonly number[],
  bounds: readonly Bounds[],
  panels: readonly HysSplitPanePanelOptions[],
  index: number,
): ResizePlan {
  function neighbors(start: number, step: -1 | 1) {
    const indices: number[] = [];
    for (let i = start; i >= 0 && i < panels.length; i += step) {
      if (panels[i].resizable === false) break;
      if (panels[i].collapsible && values[i] <= paneEpsilon) continue;
      indices.push(i);
    }
    return indices;
  }
  const before = neighbors(index, -1);
  const after = neighbors(index + 1, 1);
  const initial = values
    .slice(0, index + 1)
    .reduce((sum, value) => sum + value, 0);
  const capacity = (i: number, grow: boolean) =>
    Math.max(0, grow ? bounds[i].max - values[i] : values[i] - bounds[i].min);
  const total = (indices: readonly number[], grow: boolean) =>
    indices.reduce((sum, i) => sum + capacity(i, grow), 0);
  const min = initial - Math.min(total(before, false), total(after, true));
  const max = initial + Math.min(total(before, true), total(after, false));

  return {
    initial,
    min,
    max,
    apply(value) {
      const delta = constrainSplitSize(value, { min, max }) - initial;
      const next = [...values];
      function redistribute(indices: readonly number[], grow: boolean) {
        let remaining = Math.abs(delta);
        for (const i of indices) {
          const amount = Math.min(remaining, capacity(i, grow));
          next[i] += grow ? amount : -amount;
          remaining -= amount;
          if (remaining <= paneEpsilon) break;
        }
      }
      redistribute(before, delta > 0);
      redistribute(after, delta < 0);
      return next;
    },
  };
}
