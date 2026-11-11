import type { HysSplitPaneLength } from "../components/HysSplitPane/HysSplitPane.vue";

export const paneEpsilon = 1e-7;

export function paneRatio(value: HysSplitPaneLength | undefined, available: number) {
  if (value === undefined) return;
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return;
  if (numeric <= 0) return 0;
  if (typeof value === "string" && value.endsWith("%")) return numeric;
  if (available > 0) return numeric / available * 100;
}

interface PanePreference {
  min: number;
  max: number;
  preferred?: number;
  relative?: boolean;
}

export function fitPaneSizes(panes: readonly PanePreference[]) {
  const values = panes.map(({ min, max, preferred }) => Math.min(max, Math.max(min, preferred ?? min)));
  const total = values.reduce((sum, value) => sum + value, 0);
  const relative = panes.flatMap((pane, index) => pane.relative ? [index] : []);
  if (total > 100 + paneEpsilon) {
    const minimum = panes.reduce((sum, pane) => sum + pane.min, 0);
    if (minimum >= 100) return panes.map((pane) => pane.min / minimum * 100);
    let excess = total - 100;
    function shrink(indices: number[]) {
      const capacity = indices.reduce((sum, index) => sum + values[index] - panes[index].min, 0);
      if (capacity <= paneEpsilon || excess <= paneEpsilon) return;
      const removed = Math.min(excess, capacity);
      for (const index of indices) values[index] -= (values[index] - panes[index].min) * removed / capacity;
      excess -= removed;
    }
    shrink(relative);
    shrink(panes.map((_, index) => index));
    return values;
  }

  let space = 100 - total;
  const automatic = panes.flatMap((pane, index) => pane.preferred === undefined ? [index] : []);
  const breakpoints = automatic.flatMap((index) => [
    { size: panes[index].min, change: 1 },
    { size: panes[index].max, change: -1 },
  ]).sort((a, b) => a.size - b.size);
  let level = 0;
  let active = 0;
  for (const point of breakpoints) {
    const cost = (point.size - level) * active;
    if (space < cost) {
      level += space / active;
      space = 0;
      break;
    }
    level = point.size;
    space -= cost;
    active += point.change;
  }
  for (const index of automatic) {
    values[index] = Math.min(panes[index].max, Math.max(values[index], level));
  }
  function grow(indices: number[]) {
    let flexible = indices.filter((index) => panes[index].max > values[index]);
    while (space > paneEpsilon && flexible.length) {
      const share = space / flexible.length;
      flexible = flexible.filter((index) => {
        const increase = Math.min(share, panes[index].max - values[index]);
        values[index] += increase;
        space -= increase;
        return values[index] + paneEpsilon < panes[index].max;
      });
    }
  }
  grow(relative);
  return values;
}
