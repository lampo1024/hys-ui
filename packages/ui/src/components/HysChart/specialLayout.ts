import type { ChartEntry, ChartSeries } from "./chartModel";
import type { HysChartAxis, HysChartType } from "./chartTypes";
import { axisDomain, bounds } from "./chartScale";

export function specialLayout(
  type: HysChartType,
  groups: ChartSeries[],
  categories: string[],
  width: number,
  height: number,
  axis: HysChartAxis,
) {
  const entries = groups.flatMap((group) => group.entries);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(1, Math.min(width / 2 - 43, height / 2 - 20));
  const radarPosition = (index: number, fraction: number) => ({
    x:
      cx +
      Math.sin((index * Math.PI * 2) / categories.length) * radius * fraction,
    y:
      cy -
      Math.cos((index * Math.PI * 2) / categories.length) * radius * fraction,
  });
  const radarDomain =
    type === "radar"
      ? axisDomain(
          entries.map((entry) => entry.value),
          axis,
          true,
        )
      : undefined;
  const fractionAt = (value: number, min: number, max: number) => {
    const unit = Math.max(Math.abs(min), Math.abs(max), 1e-300);
    return Math.min(
      1,
      Math.max(0, (value / unit - min / unit) / (max / unit - min / unit || 1)),
    );
  };
  const radar = radarDomain
    ? {
        rings: [0.25, 0.5, 0.75, 1].map((fraction) =>
          categories
            .map((_, index) => radarPosition(index, fraction))
            .map(({ x, y }) => x + "," + y)
            .join(" "),
        ),
        labels: categories.map((label, index) => ({
          ...radarPosition(index, 1),
          label,
          index,
        })),
        layers: groups.map((group) => {
          const marks = group.entries
            .slice()
            .sort((a, b) => a.category - b.category)
            .map((entry) => ({
              entry,
              ...radarPosition(
                entry.category,
                fractionAt(entry.value, radarDomain.start, radarDomain.end),
              ),
            }));
          return {
            group,
            marks,
            closed:
              categories.length >= 3 && marks.length === categories.length,
            points: marks.map(({ x, y }) => x + "," + y).join(" "),
          };
        }),
        stride: Math.max(
          1,
          Math.ceil((categories.length * 44) / (Math.PI * 2 * radius)),
        ),
      }
    : undefined;
  const funnelDomain =
    type === "funnel"
      ? bounds(
          entries.map((entry) => entry.value),
          true,
        )
      : undefined;
  const funnel = funnelDomain
    ? entries.map((entry, index) => {
        const row = Math.max(0.5, (height - 24) / entries.length);
        const labelSpace = width >= 350 ? Math.min(120, width * 0.26) : 0;
        const center = (width - labelSpace) / 2;
        const half = Math.max(1, (width - labelSpace) * 0.43);
        const a = Math.max(
          2,
          half * (funnelDomain.end ? entry.value / funnelDomain.end : 0),
        );
        const next = entries[index + 1]?.value ?? entry.value;
        const b = Math.max(
          2,
          half * (funnelDomain.end ? next / funnelDomain.end : 0),
        );
        const y = 12 + index * row;
        return {
          entry,
          x: labelSpace ? width - labelSpace + 8 : center,
          y: y + row / 2,
          inline: !labelSpace,
          points: [
            [center - a, y],
            [center + a, y],
            [center + b, y + Math.max(0.1, row - 2)],
            [center - b, y + Math.max(0.1, row - 2)],
          ]
            .map((point) => point.join(","))
            .join(" "),
        };
      })
    : [];
  const gaugeEntry = type === "gauge" ? entries[0] : undefined;
  const gauge = gaugeEntry
    ? (() => {
        const min = Number.isFinite(axis.min)
          ? axis.min!
          : Math.min(0, gaugeEntry.value);
        const max =
          Number.isFinite(axis.max) && axis.max! > min
            ? axis.max!
            : Math.max(100, gaugeEntry.value, min + 1);
        const r = Math.max(1, Math.min(width / 2 - 25, height - 50));
        const y = (height + r) / 2 - 5;
        const fraction = fractionAt(gaugeEntry.value, min, max);
        const arc = `M${cx - r},${y} A${r},${r} 0 0 1 `;
        const angle = Math.PI * (1 - fraction);
        return {
          entry: gaugeEntry,
          cx,
          y,
          r,
          min,
          max,
          track: arc + `${cx + r},${y}`,
          fill: fraction
            ? arc + `${cx + r * Math.cos(angle)},${y - r * Math.sin(angle)}`
            : undefined,
        };
      })()
    : undefined;
  const heatmap =
    type === "heatmap"
      ? (() => {
          const left = Math.min(94, width * 0.29);
          const top = 10;
          const cellW = (width - left - 10) / Math.max(1, categories.length);
          const cellH = (height - top - 28) / Math.max(1, groups.length);
          const domain = axisDomain(
            entries.map((entry) => entry.value),
            axis,
          );
          return {
            categories,
            groups,
            left,
            top,
            cellW,
            cellH,
            cells: groups.flatMap((group, row) =>
              group.entries.map((entry) => ({
                entry,
                x: left + entry.category * cellW,
                y: top + row * cellH,
                intensity:
                  0.13 +
                  0.87 * fractionAt(entry.value, domain.start, domain.end),
              })),
            ),
          };
        })()
      : undefined;
  return { radar, funnel, gauge, heatmap };
}
