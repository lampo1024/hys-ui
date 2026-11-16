import type {
  HysChartMissing,
  HysChartPoint,
  HysChartReference,
  HysChartSeries,
  HysChartTooltipItem,
  HysChartType,
  HysChartXAxis,
} from "./chartTypes";

export interface ChartEntry extends HysChartTooltipItem {
  category: number;
  value: number;
}

export interface ChartLegendEntry {
  key: string;
  label: string;
  shortLabel?: string;
  group?: string;
  color: string;
  dashed?: boolean;
  value?: string;
}

export interface ChartSeries {
  key: string;
  series: HysChartSeries;
  color: string;
  entries: ChartEntry[];
}

export function chartLegendEntries(
  groups: ChartSeries[],
  radial: boolean,
): ChartLegendEntry[] {
  return groups.flatMap(
    ({ series, color, key, entries }): ChartLegendEntry[] => {
      if (radial)
        return entries.map(({ key, point, color, text }) => ({
          key,
          label: point.label,
          shortLabel: point.legendLabel,
          group: point.legendGroup,
          color,
          value: text,
        }));
      if (!entries.length) return [];
      const last = entries.reduce((current, next) =>
        next.category >= current.category ? next : current,
      );
      return [
        {
          key,
          label: series.name,
          shortLabel: series.legendLabel,
          group: series.legendGroup,
          color,
          dashed: series.dashed,
          value: last.text,
        },
      ];
    },
  );
}

const palette = ["primary", "cyan", "violet", "amber", "green", "red"];
const cartesian = new Set<HysChartType>([
  "bar",
  "horizontal-bar",
  "line",
  "area",
  "scatter",
  "combo",
]);

export const isCartesian = (type: HysChartType) => cartesian.has(type);
export const isRadial = (type: HysChartType) =>
  type === "pie" || type === "donut";
export const usesFirstSeries = (type: HysChartType) =>
  isRadial(type) || type === "funnel" || type === "gauge";

export function chartColor(index: number, colors?: readonly string[]) {
  return (
    colors?.[index % colors.length] ||
    `var(--hys-chart-${palette[index % palette.length]})`
  );
}

export function axisType(type: HysChartType, axis?: HysChartXAxis) {
  if (type === "scatter") return axis?.type === "time" ? "time" : "value";
  if (!isCartesian(type) || type === "horizontal-bar") return "category";
  return axis?.type ?? "category";
}

export function timeValue(value: string | Date | number | undefined) {
  if (
    value === undefined ||
    (typeof value === "string" &&
      !/^\d{4}-\d\d-\d\d(?:T\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)?)?$/u.test(
        value,
      ))
  )
    return NaN;
  const result = typeof value === "number" ? value : new Date(value).getTime();
  return Math.abs(result) <= 8.64e15 ? result : NaN;
}

export function pointCoordinate(
  point: HysChartPoint,
  index: number,
  axis: ReturnType<typeof axisType>,
) {
  if (axis === "time") return timeValue(point.time ?? point.x ?? point.label);
  if (axis === "value") return point.x ?? index + 1;
  return undefined;
}

export function chartData({
  data,
  series,
  type,
  colors,
  axis,
  missing,
  format,
}: {
  data: readonly HysChartPoint[];
  series?: readonly HysChartSeries[];
  type: HysChartType;
  colors?: readonly string[];
  axis: ReturnType<typeof axisType>;
  missing: HysChartMissing;
  format: (value: number, point: HysChartPoint) => string;
}) {
  const sources = series ?? [{ name: "数值", data }];
  const categories: string[] = [];
  const coordinates: number[] = [];
  const positions = new Map<number | string, number>();
  const discrete = isRadial(type) || type === "funnel";
  const groups = (usesFirstSeries(type) ? sources.slice(0, 1) : sources).map(
    (group, seriesIndex): ChartSeries => {
      const key = group.id ?? `series:${seriesIndex}`;
      const color = group.color || chartColor(seriesIndex, colors);
      const occurrences = new Map<string, number>();
      const entries: ChartEntry[] = [];
      for (const [pointIndex, point] of group.data.entries()) {
        const x = pointCoordinate(point, pointIndex, axis);
        const value =
          point.value === null && missing === "zero" ? 0 : point.value;
        if (x !== undefined && !Number.isFinite(x)) continue;
        if (value !== null && !Number.isFinite(value)) continue;
        if (
          discrete &&
          (value === null || (isRadial(type) ? value <= 0 : value < 0))
        )
          continue;
        const occurrence = occurrences.get(point.label) ?? 0;
        occurrences.set(point.label, occurrence + 1);
        const categoryKey = x ?? JSON.stringify([point.label, occurrence]);
        let category = positions.get(categoryKey);
        if (category === undefined) {
          category = categories.length;
          positions.set(categoryKey, category);
          categories.push(point.label);
          if (x !== undefined) coordinates.push(x);
        }
        if (value === null) continue;
        entries.push({
          key: `${key}:${point.id ?? pointIndex}`,
          category,
          point,
          pointIndex,
          series: group,
          seriesIndex,
          x,
          value,
          text: format(value, point),
          color:
            point.color ||
            (discrete && pointIndex > 0
              ? chartColor(pointIndex, colors)
              : color),
        });
        if (type === "gauge") break;
      }
      return { key, series: group, color, entries };
    },
  );
  if (axis !== "category") {
    const ordered = coordinates
      .map((value, index) => ({ value, index }))
      .sort((a, b) => a.value - b.value);
    const rank = new Map(
      ordered.map(({ index }, sortedIndex) => [index, sortedIndex]),
    );
    for (const group of groups) {
      for (const entry of group.entries)
        entry.category = rank.get(entry.category)!;
    }
    return {
      categories: ordered.map(({ index }) => categories[index]),
      coordinates: ordered.map(({ value }) => value),
      groups,
    };
  }
  return { categories, coordinates, groups };
}

export function chartReferences(
  reference?: HysChartReference,
  references?: readonly HysChartReference[],
) {
  return [...(reference ? [reference] : []), ...(references ?? [])].filter(
    ({ value }) => Number.isFinite(value),
  );
}
