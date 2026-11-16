import { sampled } from "./chartAnalysis";
import type { ChartSeries } from "./chartModel";
import { axisDomain, chartScale } from "./chartScale";
import type { HysChartRange } from "./chartTypes";

export function rangeOverview(
  groups: readonly ChartSeries[],
  domain: HysChartRange,
  width: number,
) {
  const x = chartScale(domain, 0, 1000, { ticks: [] }, 2, true).at;
  const paths = [];
  for (const group of groups) {
    const values = group.entries
      .filter(
        (entry) =>
          (entry.x ?? entry.category) >= domain.start &&
          (entry.x ?? entry.category) <= domain.end,
      )
      .sort((a, b) => a.category - b.category);
    if (!values.length) continue;
    const domainY = axisDomain(values.map((entry) => entry.value));
    const y = chartScale(domainY, 28, -23, { ticks: [] }, 2, true).at;
    const points = sampled(
      values.map((entry) => ({ entry })),
      Math.max(24, Math.min(180, Math.round(width / 3))),
    );
    const line = points
      .map(
        ({ entry }, index) =>
          (index ? "L" : "M") +
          x(entry.x ?? entry.category).toFixed(2) +
          " " +
          y(entry.value).toFixed(2),
      )
      .join(" ");
    paths.push({ key: group.key, color: group.color, line });
  }
  return paths;
}
