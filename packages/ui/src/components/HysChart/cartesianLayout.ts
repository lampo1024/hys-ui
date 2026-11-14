import type { ChartEntry, ChartSeries } from "./chartModel";
import type { HysChartReference, HysChartType } from "./chartTypes";

interface Pixel {
  x: number;
  y: number;
}
export interface ChartMark extends Pixel {
  entry: ChartEntry;
  rect?: { x: number; y: number; width: number; height: number };
}

function scale(
  values: number[],
  start: number,
  length: number,
  includeZero: boolean,
  tickCount: number,
) {
  let low = includeZero ? 0 : Infinity;
  let high = includeZero ? 0 : -Infinity;
  for (const value of values) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  if (!values.length || (low === 0 && high === 0)) {
    low = 0;
    high = 1;
  }
  const magnitude =
    10 ** Math.floor(Math.log10(Math.max(Math.abs(low), Math.abs(high), 1e-300)));
  low /= magnitude;
  high /= magnitude;
  if (low === high) {
    const padding = (Math.abs(low) || 1) * 0.15;
    low -= padding;
    high += padding;
  }
  const estimate = (high - low) / tickCount;
  const base = 10 ** Math.floor(Math.log10(estimate));
  const step =
    ([1, 2, 2.5, 5, 10].find((factor) => factor * base >= estimate) ?? 10) *
    base;
  const first = Math.floor(low / step + 1e-10);
  const last = Math.ceil(high / step - 1e-10);
  const at = (value: number) =>
    start + (length * (value / magnitude / step - first)) / (last - first);
  const ticks = Array.from({ length: last - first + 1 }, (_, index) => {
    const factor = first + index;
    const raw = factor * step * magnitude;
    const rounded = Number(raw.toPrecision(12));
    return {
      position: start + (length * index) / (last - first),
      value: Number.isFinite(rounded)
        ? rounded
        : Math.sign(raw) * Number.MAX_VALUE,
    };
  });
  return { at, ticks };
}

function path(points: Pixel[], smooth: boolean) {
  return points
    .map((point, index) => {
      if (!index) return `M${point.x},${point.y}`;
      const previous = points[index - 1];
      if (!smooth) return `L${point.x},${point.y}`;
      const mid = (point.x + previous.x) / 2;
      return `C${mid},${previous.y} ${mid},${point.y} ${point.x},${point.y}`;
    })
    .join(" ");
}

export function cartesianLayout({
  groups,
  categories,
  type,
  width,
  height,
  stacked,
  smooth,
  references,
  showValues,
}: {
  groups: ChartSeries[];
  categories: string[];
  type: HysChartType;
  width: number;
  height: number;
  stacked: boolean;
  smooth: boolean;
  references: readonly HysChartReference[];
  showValues: boolean;
}) {
  const horizontal = type === "horizontal-bar";
  const scatter = type === "scatter";
  const kind = (group: ChartSeries) =>
    type === "combo"
      ? (group.series.type ?? "bar")
      : type === "horizontal-bar"
        ? "bar"
        : type;
  const barGroups = groups.filter(
    (group) => kind(group) === "bar" && group.entries.length,
  );
  const barSlots = new Map(barGroups.map((group, index) => [group.key, index]));
  const stackTotals = new Map<number, { positive: number; negative: number }>();
  const extents = new Map<string, [number, number]>();
  const values = references.map(({ value }) => value);
  const scatterX: number[] = [];
  for (const group of groups) {
    for (const entry of group.entries) {
      const value = entry.point.value;
      if (entry.x !== undefined) scatterX.push(entry.x);
      let start = 0;
      let end = value;
      if (stacked && kind(group) === "bar") {
        let totals = stackTotals.get(entry.category);
        if (!totals)
          stackTotals.set(
            entry.category,
            (totals = { positive: 0, negative: 0 }),
          );
        const key = value < 0 ? "negative" : "positive";
        start = totals[key];
        end = start + value;
        if (!Number.isFinite(end)) end = Math.sign(end) * Number.MAX_VALUE;
        totals[key] = end;
      }
      extents.set(entry.key, [start, end]);
      values.push(end);
    }
  }

  const left = Math.min(horizontal ? 102 : 55, width * 0.27);
  const right = Math.max(
    left + 1,
    width -
      Math.min(
        width * 0.35,
        showValues && horizontal ? 56 : scatter || horizontal ? 29 : 16,
      ),
  );
  const top = height < 100 ? 8 : references.length || showValues ? 25 : 12;
  const bottom = Math.max(
    top + 5,
    height -
      (height < 100 ? 18 : 28) -
      (showValues && !horizontal && height >= 100 ? 10 : 0),
  );
  const slot =
    (horizontal ? bottom - top : right - left) / Math.max(1, categories.length);
  const valueScale = horizontal
    ? scale(values, left, right - left, true, width < 380 ? 3 : 5)
    : scale(
        values,
        bottom,
        top - bottom,
        !scatter,
        Math.min(5, Math.max(2, Math.floor((bottom - top) / 36))),
      );
  const zero = scatter ? undefined : valueScale.at(0);
  const xScale = scatter
    ? scale(scatterX, left, right - left, false, width < 380 ? 3 : 5)
    : undefined;
  const categoryAt = (index: number) =>
    (horizontal ? top : left) + (index + 0.5) * slot;
  const categoryLabels = categories.map((label, index) => ({
    label,
    position: categoryAt(index),
    index,
  }));
  const stride = Math.max(1, Math.ceil((horizontal ? 21 : 58) / slot));
  const barSpan =
    Math.min(horizontal ? 30 : 62, slot * 0.76) /
    (stacked ? 1 : Math.max(1, barGroups.length));
  const barWidth = Math.max(0.5, barSpan * 0.88);

  const layers = groups.map((group) => {
    const style = kind(group);
    const marks = group.entries
      .slice()
      .sort((a, b) => a.category - b.category)
      .map((entry): ChartMark => {
        const [start, end] = extents.get(entry.key)!;
        const category = categoryAt(entry.category);
        const edge = valueScale.at(end);
        if (style !== "bar")
          return { entry, x: xScale?.at(entry.x!) ?? category, y: edge };
        const baseline = valueScale.at(start);
        const delta = Math.max(1, Math.abs(edge - baseline));
        const offset = stacked
          ? 0
          : ((barSlots.get(group.key) ?? 0) - (barGroups.length - 1) / 2) *
            barSpan;
        const center = category + offset;
        if (horizontal)
          return {
            entry,
            x: edge,
            y: center,
            rect: {
              x: Math.min(edge, baseline),
              y: center - barWidth / 2,
              width: delta,
              height: barWidth,
            },
          };
        return {
          entry,
          x: center,
          y: edge,
          rect: {
            x: center - barWidth / 2,
            y: Math.min(edge, baseline),
            width: barWidth,
            height: delta,
          },
        };
      });
    const runs: ChartMark[][] = [];
    if (style === "line" || style === "area") {
      for (const mark of marks) {
        const last = runs.at(-1);
        if (last?.at(-1)?.entry.category === mark.entry.category - 1)
          last.push(mark);
        else runs.push([mark]);
      }
    }
    const paths = runs.map((run) => {
      const line = path(run, smooth);
      const area =
        style === "area" && run.length > 1
          ? `${line} L${run.at(-1)!.x},${zero} L${run[0].x},${zero} Z`
          : undefined;
      return { line, area };
    });
    return { group, style, marks, paths };
  });

  return {
    horizontal,
    scatter,
    layers,
    left,
    right,
    top,
    bottom,
    zero,
    valueTicks: valueScale.ticks,
    xTicks: xScale?.ticks ?? [],
    categories: categoryLabels.filter(({ index }) => index % stride === 0),
    references: references.map((reference) => ({
      ...reference,
      position: valueScale.at(reference.value),
    })),
  };
}
