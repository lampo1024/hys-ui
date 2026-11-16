import type { ChartEntry } from "./chartModel";

export function sampled<T extends { entry: ChartEntry }>(
  points: T[],
  limit?: number,
): T[] {
  if (!Number.isFinite(limit) || limit! < 4 || points.length <= limit!)
    return points;
  const buckets = Math.floor((limit! - 2) / 2);
  const span = (points.length - 2) / buckets;
  const result = [points[0]];
  for (let bucket = 0; bucket < buckets; bucket++) {
    const first = 1 + Math.floor(bucket * span);
    const last = 1 + Math.floor((bucket + 1) * span);
    let min = first;
    let max = first;
    for (let index = first + 1; index < last; index++) {
      if (points[index].entry.value < points[min].entry.value) min = index;
      if (points[index].entry.value > points[max].entry.value) max = index;
    }
    result.push(points[Math.min(min, max)]);
    if (min !== max) result.push(points[Math.max(min, max)]);
  }
  result.push(points[points.length - 1]);
  return result;
}

export function linearTrend(entries: readonly ChartEntry[]) {
  if (entries.length < 2) return undefined;
  const xOf = (entry: ChartEntry) => entry.x ?? entry.category;
  let xUnit = 1;
  let yUnit = 1e-300;
  for (const entry of entries) {
    xUnit = Math.max(xUnit, Math.abs(xOf(entry)));
    yUnit = Math.max(yUnit, Math.abs(entry.value));
  }
  let sumX = 0;
  let sumY = 0;
  for (const entry of entries) {
    sumX += xOf(entry) / xUnit;
    sumY += entry.value / yUnit;
  }
  const meanX = sumX / entries.length;
  const meanY = sumY / entries.length;
  let covariance = 0;
  let variance = 0;
  for (const entry of entries) {
    const delta = xOf(entry) / xUnit - meanX;
    covariance += delta * (entry.value / yUnit - meanY);
    variance += delta ** 2;
  }
  if (!variance) return undefined;
  return (x: number) => {
    const y = (meanY + ((x / xUnit - meanX) * covariance) / variance) * yUnit;
    return Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, y));
  };
}
