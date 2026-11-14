import type {
  HysChartPoint,
  HysChartReference,
  HysChartSelection,
  HysChartSeries,
  HysChartType,
} from "./chartTypes";

export interface ChartEntry extends HysChartSelection {
  key: string;
  category: number;
  color: string;
  text: string;
}

export interface ChartSeries {
  key: string;
  series: HysChartSeries;
  color: string;
  entries: ChartEntry[];
}

const palette = ["primary", "cyan", "violet", "amber", "green", "red"];

export function chartColor(index: number, colors?: readonly string[]) {
  return (
    (colors?.length && colors[index % colors.length]) ||
    `var(--hys-chart-${palette[index % palette.length]})`
  );
}

export function chartData(
  data: readonly HysChartPoint[],
  series: readonly HysChartSeries[] | undefined,
  type: HysChartType,
  colors: readonly string[] | undefined,
  format: (point: HysChartPoint) => string,
) {
  const radial = type === "pie" || type === "donut";
  const sources: readonly HysChartSeries[] = series ?? [{ name: "数值", data }];
  const categories: string[] = [];
  const positions = new Map<string, number>();
  const groups = (radial ? sources.slice(0, 1) : sources).map(
    (group, seriesIndex): ChartSeries => {
      const key = group.id ?? `series:${seriesIndex}`;
      const color = group.color || chartColor(seriesIndex, colors);
      const occurrences = new Map<string, number>();
      const entries = group.data.flatMap((point, pointIndex): ChartEntry[] => {
        if (!Number.isFinite(point.value) || (radial && point.value <= 0))
          return [];
        const x = type === "scatter" ? (point.x ?? pointIndex + 1) : undefined;
        if (x !== undefined && !Number.isFinite(x)) return [];
        const occurrence = occurrences.get(point.label) ?? 0;
        occurrences.set(point.label, occurrence + 1);
        const categoryKey = JSON.stringify([point.label, occurrence]);
        let category = positions.get(categoryKey);
        if (category === undefined) {
          category = categories.length;
          positions.set(categoryKey, category);
          categories.push(point.label);
        }
        return [
          {
            key: `${key}:${pointIndex}`,
            category,
            point,
            pointIndex,
            series: group,
            seriesIndex,
            x,
            text: format(point),
            color:
              point.color ||
              (radial && pointIndex > 0
                ? chartColor(pointIndex, colors)
                : color),
          },
        ];
      });
      return { key, series: group, color, entries };
    },
  );
  return { categories, groups };
}

export function chartReferences(
  reference?: HysChartReference,
  references?: readonly HysChartReference[],
) {
  return [...(reference ? [reference] : []), ...(references ?? [])].filter(
    ({ value }) => Number.isFinite(value),
  );
}
