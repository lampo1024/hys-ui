import type { ChartEntry } from "./chartModel";

export function radialLayout(
  entries: ChartEntry[],
  width: number,
  height: number,
  innerRadius: number,
) {
  const x = width / 2;
  const y = height / 2;
  const radius = Math.max(1, Math.min(width, height) / 2 - 12);
  const inner = radius * innerRadius;
  let maximum = 0;
  for (const entry of entries) maximum = Math.max(entry.point.value, maximum);
  const total = entries.reduce(
    (sum, { point }) => sum + point.value / maximum,
    0,
  );
  const at = (angle: number, distance: number) =>
    `${x + distance * Math.cos(angle)},${y + distance * Math.sin(angle)}`;
  const full = Math.PI * 2;
  function arc(
    start: number,
    end: number,
    distance: number,
    clockwise: number,
  ) {
    if (Math.abs(end - start) < full - 1e-10)
      return `A${distance},${distance} 0 ${Math.abs(end - start) > Math.PI ? 1 : 0},${clockwise} ${at(end, distance)}`;
    return `A${distance},${distance} 0 0,${clockwise} ${at((start + end) / 2, distance)} A${distance},${distance} 0 0,${clockwise} ${at(end, distance)}`;
  }
  let start = -Math.PI / 2;
  return entries.map((entry) => {
    const percentage = entry.point.value / maximum / total;
    const end = start + full * percentage;
    const middle = (start + end) / 2;
    const labelRadius = inner ? (radius + inner) / 2 : radius * 0.58;
    const path = `M${at(start, radius)} ${arc(start, end, radius, 1)} ${inner ? `L${at(end, inner)} ${arc(end, start, inner, 0)}` : `L${x},${y}`} Z`;
    start = end;
    return {
      entry: { ...entry, percentage },
      path,
      x: x + labelRadius * Math.cos(middle),
      y: y + labelRadius * Math.sin(middle),
    };
  });
}
