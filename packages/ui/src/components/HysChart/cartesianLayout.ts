import type { ChartEntry, ChartSeries } from "./chartModel";
import type {
  HysChartAnnotation,
  HysChartAxis,
  HysChartMissing,
  HysChartRange,
  HysChartReference,
  HysChartType,
  HysChartXAxis,
} from "./chartTypes";
import { axisDomain, chartScale } from "./chartScale";
import { linearTrend, sampled } from "./chartAnalysis";

interface Pixel {
  x: number;
  y: number;
}
interface AnalysisMark {
  color: string;
  label: string;
  from: Pixel;
  to?: Pixel;
}
export interface ChartMark extends Pixel {
  entry: ChartEntry;
  rect?: { x: number; y: number; width: number; height: number };
}
interface ChartLayoutOptions {
  groups: ChartSeries[];
  categories: string[];
  coordinates: number[];
  type: HysChartType;
  width: number;
  height: number;
  stacked?: boolean;
  smooth?: boolean;
  references: readonly HysChartReference[];
  annotations: readonly HysChartAnnotation[];
  showValues?: boolean;
  xType: "category" | "value" | "time";
  xAxis?: HysChartXAxis;
  yAxes: readonly [HysChartAxis, HysChartAxis?];
  range: HysChartRange;
  exactX: boolean;
  missing: HysChartMissing;
  sampling?: number;
  selectedKey?: string | null;
}

function path(points: Pixel[], smooth?: boolean) {
  return points
    .map((point, index) => {
      if (!index) return `M${point.x},${point.y}`;
      const previous = points[index - 1];
      if (!smooth || previous.x === point.x) return `L${point.x},${point.y}`;
      const mid = (point.x + previous.x) / 2;
      return `C${mid},${previous.y} ${mid},${point.y} ${point.x},${point.y}`;
    })
    .join(" ");
}

export function cartesianLayout(options: ChartLayoutOptions) {
  const {
    groups,
    categories,
    coordinates,
    type,
    width,
    height,
    stacked,
    references,
    annotations,
    showValues,
    xType,
    xAxis,
    yAxes,
    range,
    exactX,
    missing,
    sampling,
  } = options;
  const horizontal = type === "horizontal-bar";
  const scatter = type === "scatter";
  const continuous = xType !== "category";
  const secondary = !horizontal && !!yAxes[1];
  const axisOf = (group: ChartSeries) =>
    secondary ? (group.series.yAxis ?? 0) : 0;
  const kind = (group: ChartSeries) =>
    type === "combo" ? (group.series.type ?? "bar") : horizontal ? "bar" : type;
  const coordinate = (entry: ChartEntry) =>
    continuous ? entry.x! : entry.category;
  const inWindow = (entry: ChartEntry) =>
    coordinate(entry) >= range.start && coordinate(entry) <= range.end;
  const visibleGroups = groups.map((group) => ({
    ...group,
    entries: group.entries.filter(inWindow),
  }));
  const barGroups = visibleGroups.filter(
    (group) => kind(group) === "bar" && group.entries.length,
  );
  const barKeys = [
    ...new Set(barGroups.map((group) => (stacked ? axisOf(group) : group.key))),
  ];
  const totals = new Map<string, number>();
  const extents = new Map<string, [number, number]>();
  const values = [[], []] as [number[], number[]];
  const indexOfAxis = (axis?: 0 | 1) => (secondary && axis === 1 ? 1 : 0);
  for (const reference of references)
    values[indexOfAxis(reference.yAxis)].push(reference.value);
  for (const item of annotations) {
    if (
      item.type === "band" &&
      Number.isFinite(item.from) &&
      Number.isFinite(item.to)
    ) {
      values[indexOfAxis(item.yAxis)].push(item.from, item.to);
    }
  }
  for (const group of visibleGroups) {
    const axis = axisOf(group);
    for (const entry of group.entries) {
      let start = 0;
      let end = entry.value;
      if (stacked && kind(group) === "bar") {
        const key = `${axis}:${entry.category}:${end < 0}`;
        start = totals.get(key) ?? 0;
        end += start;
        if (!Number.isFinite(end)) end = Math.sign(end) * Number.MAX_VALUE;
        totals.set(key, end);
      }
      extents.set(entry.key, [start, end]);
      values[axis].push(end);
    }
  }

  const left = Math.min(horizontal ? 102 : 55, width * 0.25);
  const margin = secondary
    ? 60
    : showValues && horizontal
      ? 65
      : continuous
        ? 33
        : 17;
  const right = Math.max(left + 1, width - Math.min(width * 0.34, margin));
  const top = height < 100 ? 8 : references.length || showValues ? 25 : 12;
  const bottom = Math.max(top + 5, height - (height < 100 ? 18 : 29));
  const horizontalOptions: HysChartAxis = {
    ...xAxis,
    min: typeof xAxis?.min === "number" ? xAxis.min : undefined,
    max: typeof xAxis?.max === "number" ? xAxis.max : undefined,
  };
  const primary = horizontal
    ? {
        ...yAxes[0],
        ...Object.fromEntries(
          Object.entries(horizontalOptions).filter(
            ([, value]) => value !== undefined,
          ),
        ),
      }
    : yAxes[0];
  const gridCount = Math.min(6, Math.max(2, Math.floor((bottom - top) / 30)));
  const valueScale = (axis = 0) => {
    const config = axis === 0 ? primary : yAxes[1];
    const includeZero =
      axis === 0 ? !scatter : barGroups.some((group) => axisOf(group) === 1);
    return chartScale(
      axisDomain(values[axis], config, includeZero),
      horizontal ? left : bottom,
      horizontal ? right - left : top - bottom,
      config,
      horizontal ? (width < 380 ? 3 : 5) : gridCount,
    );
  };
  const scales = [valueScale(), valueScale(1)];
  const zero = !scatter && scales[0].contains(0) ? scales[0].at(0) : undefined;
  const slot =
    (horizontal ? bottom - top : right - left) / (range.end - range.start + 1);
  const xScaleOptions: HysChartAxis = {
    ...xAxis,
    min: xAxis?.min === undefined ? undefined : range.start,
    max: xAxis?.max === undefined ? undefined : range.end,
  };
  const xScale = continuous
    ? chartScale(
        range,
        left,
        right - left,
        xScaleOptions,
        width < 410 ? 3 : 6,
        exactX || xType === "time",
        xType === "time",
      )
    : undefined;
  const categoryAt = (index: number) =>
    (horizontal ? top : left) + (index - range.start + 0.5) * slot;
  const categoryStride = Math.max(1, Math.ceil((horizontal ? 22 : 66) / slot));
  const firstCategory = Math.max(0, Math.ceil(range.start));
  const lastCategory = Math.min(categories.length - 1, Math.floor(range.end));
  const labels = [];
  if (!continuous) {
    const indices =
      !horizontal && xAxis?.ticks
        ? [...new Set(xAxis.ticks)].filter(
            (index) =>
              Number.isInteger(index) &&
              index >= firstCategory &&
              index <= lastCategory,
          )
        : Array.from(
            {
              length: Math.max(
                0,
                Math.floor((lastCategory - firstCategory) / categoryStride) + 1,
              ),
            },
            (_, index) => firstCategory + index * categoryStride,
          );
    for (const index of indices)
      labels.push({
        label: categories[index],
        index,
        position: categoryAt(index),
      });
  }
  let space = slot;
  if (xScale) {
    space = right - left;
    for (let index = 1; index < coordinates.length; index++) {
      if (
        coordinates[index - 1] >= range.start &&
        coordinates[index] <= range.end
      )
        space = Math.min(
          space,
          xScale.at(coordinates[index]) - xScale.at(coordinates[index - 1]),
        );
    }
  }
  const barSpan =
    Math.min(horizontal ? 30 : 62, space * 0.76) / Math.max(1, barKeys.length);
  const barWidth = Math.max(0.5, barSpan * 0.88);
  const xAt = (entry: ChartEntry) =>
    xScale?.at(entry.x!) ?? categoryAt(entry.category);
  const layers = visibleGroups.map((group) => {
    const style = kind(group);
    const scale = scales[axisOf(group)];
    const bars = style === "bar";
    const points = group.entries
      .slice()
      .sort((a, b) => a.category - b.category);
    const marks = points.flatMap((entry): ChartMark[] => {
      const [start, end] = extents.get(entry.key)!;
      const category = xAt(entry);
      if (!bars)
        return scale.contains(end)
          ? [{ entry, x: category, y: scale.at(end) }]
          : [];
      if (
        !scale.contains(start) &&
        !scale.contains(end) &&
        scale.clamp(start) === scale.clamp(end)
      )
        return [];
      const edge = scale.at(scale.clamp(end));
      const baseline = scale.at(scale.clamp(start));
      const delta = Math.max(1, Math.abs(edge - baseline));
      const key = stacked ? axisOf(group) : group.key;
      const center =
        category + (barKeys.indexOf(key) - (barKeys.length - 1) / 2) * barSpan;
      return horizontal
        ? [
            {
              entry,
              x: edge,
              y: center,
              rect: {
                x: Math.min(edge, baseline),
                y: center - barWidth / 2,
                width: delta,
                height: barWidth,
              },
            },
          ]
        : [
            {
              entry,
              x: center,
              y: edge,
              rect: {
                x: center - barWidth / 2,
                y: Math.min(edge, baseline),
                width: barWidth,
                height: delta,
              },
            },
          ];
    });
    const line = style === "line" || style === "area";
    const pathPoints = line
      ? points.map((entry) => ({
          entry,
          x: xAt(entry),
          y: scale.at(entry.value),
        }))
      : [];
    const retained = bars ? marks : sampled(marks, sampling);
    const selected = options.selectedKey
      ? marks.find((mark) => mark.entry.key === options.selectedKey)
      : undefined;
    if (selected && retained !== marks && !retained.includes(selected))
      retained.push(selected);
    const pathRetained = new Set(sampled(pathPoints, sampling));
    const runs: Pixel[][] = [];
    let previous = -Infinity;
    let current: Pixel[] | undefined;
    for (const point of pathPoints) {
      if (missing !== "connect" && point.entry.category > previous + 1)
        current = undefined;
      if (pathRetained.has(point)) {
        if (!current) runs.push((current = []));
        current.push(point);
      }
      previous = point.entry.category;
    }
    const baseline = scale.at(scale.clamp(0));
    const paths = runs.map((run) => ({
      line: path(run, options.smooth),
      area:
        style === "area" && run.length > 1
          ? `${path(run, options.smooth)} L${run.at(-1)!.x},${baseline} L${run[0].x},${baseline} Z`
          : undefined,
    }));
    return { group, style, marks: retained, paths };
  });

  const bands = annotations.flatMap((item) => {
    if (
      item.type !== "band" ||
      !Number.isFinite(item.from) ||
      !Number.isFinite(item.to)
    )
      return [];
    const scale = scales[indexOfAxis(item.yAxis)];
    const a = scale.at(scale.clamp(item.from));
    const b = scale.at(scale.clamp(item.to));
    if (a === b) return [];
    return [
      {
        ...item,
        rect: horizontal
          ? {
              x: Math.min(a, b),
              y: top,
              width: Math.abs(a - b),
              height: bottom - top,
            }
          : {
              x: left,
              y: Math.min(a, b),
              width: right - left,
              height: Math.abs(a - b),
            },
      },
    ];
  });
  const analysis = annotations.flatMap((item) => {
    if (item.type === "band") return [];
    return visibleGroups.flatMap<AnalysisMark>((group) => {
      if (
        !group.entries.length ||
        (item.seriesId !== undefined && item.seriesId !== group.key)
      )
        return [];
      const scale = scales[axisOf(group)];
      const color = item.color ?? group.color;
      const pixel = (entry: ChartEntry, value: number) =>
        horizontal
          ? { x: scale.at(value), y: xAt(entry) }
          : { x: xAt(entry), y: scale.at(value) };
      if (item.type === "trend") {
        const trend = linearTrend(group.entries);
        if (!trend) return [];
        const first = group.entries.reduce((a, b) =>
          coordinate(a) <= coordinate(b) ? a : b,
        );
        const last = group.entries.reduce((a, b) =>
          coordinate(a) >= coordinate(b) ? a : b,
        );
        const from = pixel(first, trend(coordinate(first)));
        const to = pixel(last, trend(coordinate(last)));
        return [
          { color, label: item.label ?? `${group.series.name}趋势`, from, to },
        ];
      }
      const entry = group.entries.reduce((a, b) =>
        (item.type === "max" ? a.value >= b.value : a.value <= b.value) ? a : b,
      );
      const value = extents.get(entry.key)?.[1] ?? entry.value;
      if (!scale.contains(value)) return [];
      return [
        {
          color,
          label:
            item.label ??
            `${item.type === "max" ? "最大" : "最小"} ${entry.text}`,
          from: pixel(entry, value),
          to: undefined,
        },
      ];
    });
  });
  return {
    horizontal,
    continuous,
    scatter,
    layers,
    left,
    right,
    top,
    bottom,
    zero,
    bands,
    analysis,
    valueTicks: scales[0].ticks,
    secondaryTicks: secondary ? scales[1].ticks : [],
    xTicks: xScale?.ticks ?? [],
    categories: labels,
    visibleGroups,
    references: references.flatMap((reference) => {
      const scale = scales[indexOfAxis(reference.yAxis)];
      return scale.contains(reference.value)
        ? [{ ...reference, position: scale.at(reference.value) }]
        : [];
    }),
    coordinatePosition: (value: number) =>
      xScale?.at(value) ?? categoryAt(value),
    coordinateAt: (ratio: number) =>
      xScale
        ? xScale.invert(left + ratio * (right - left))
        : Math.max(
            range.start,
            Math.min(
              range.end,
              range.start + ratio * (range.end - range.start + 1) - 0.5,
            ),
          ),
  };
}
