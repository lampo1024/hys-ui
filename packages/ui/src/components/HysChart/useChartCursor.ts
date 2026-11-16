import { computed, shallowRef, type ComputedRef, type Ref } from "vue";
import type { ChartEntry } from "./chartModel";
import { plotReader, type ChartPlotFrame } from "./chartPointer";
import type { HysChartCursor } from "./chartTypes";

interface CursorFrame extends ChartPlotFrame {
  coordinatePosition: (value: number) => number;
}

function lowerBound(values: number[], target: number) {
  let start = 0;
  let end = values.length;
  while (start < end) {
    const middle = (start + end) >>> 1;
    if (values[middle] < target) start = middle + 1;
    else end = middle;
  }
  return start;
}

export function useChartCursor(options: {
  svg: Readonly<Ref<SVGSVGElement | null>>;
  enabled: ComputedRef<boolean>;
  frame: ComputedRef<CursorFrame>;
  entries: ComputedRef<ChartEntry[]>;
  model: () => HysChartCursor | null | undefined;
  update: (cursor: HysChartCursor | null) => void;
}) {
  const local = shallowRef<HysChartCursor | null>(null);
  const otherFraction = shallowRef<number>();
  const current = computed(() => {
    const controlled = options.model();
    return controlled === undefined ? local.value : controlled;
  });
  const byCoordinate = computed(() => {
    const map = new Map<number, ChartEntry[]>();
    if (!options.enabled.value) return map;
    for (const entry of options.entries.value) {
      const key = coordinate(entry);
      const existing = map.get(key);
      if (existing) existing.push(entry);
      else map.set(key, [entry]);
    }
    return map;
  });
  const coordinates = computed(() =>
    [...byCoordinate.value.keys()].sort((a, b) => a - b),
  );
  const comparison = computed(() => {
    const value = current.value;
    if (!options.enabled.value || !value) return undefined;
    const items = byCoordinate.value.get(value.value);
    if (!items?.length) return undefined;
    return {
      ...value,
      items,
      position: options.frame.value.coordinatePosition(value.value),
    };
  });
  const otherPosition = computed(() => {
    const ratio = otherFraction.value;
    if (ratio === undefined) return undefined;
    const frame = options.frame.value;
    return frame.horizontal
      ? frame.left + (frame.right - frame.left) * ratio
      : frame.top + (frame.bottom - frame.top) * ratio;
  });

  function coordinate(entry: ChartEntry) {
    return entry.x ?? entry.category;
  }
  function set(next: HysChartCursor | null) {
    if (
      current.value?.value === next?.value &&
      current.value?.locked === next?.locked
    )
      return;
    if (options.model() === undefined) local.value = next;
    options.update(next);
  }
  function clear() {
    otherFraction.value = undefined;
    if (options.enabled.value) set(null);
  }
  function leave() {
    if (options.enabled.value && !current.value?.locked) clear();
  }
  function fromPointer(event: MouseEvent) {
    const target = options.svg.value;
    const values = coordinates.value;
    if (!target || !values.length) return undefined;
    const frame = options.frame.value;
    const point = plotReader(target, frame)(event);
    if (!point.inside) return undefined;
    const approximate = frame.coordinateAt(point.ratio);
    const index = lowerBound(values, approximate);
    const before = values[index - 1];
    const after = values[index];
    const value =
      after === undefined ||
      (before !== undefined && approximate - before <= after - approximate)
        ? before
        : after;
    otherFraction.value = frame.horizontal
      ? (point.x - frame.left) / (frame.right - frame.left)
      : (point.y - frame.top) / (frame.bottom - frame.top);
    return value;
  }
  function hover(event: PointerEvent) {
    if (
      !options.enabled.value ||
      current.value?.locked ||
      event.pointerType === "touch"
    )
      return;
    const value = fromPointer(event);
    if (value === undefined) leave();
    else set({ value, locked: false });
  }
  function focus(entry: ChartEntry) {
    if (!options.enabled.value || current.value?.locked) return;
    otherFraction.value = undefined;
    set({ value: coordinate(entry), locked: false });
  }
  function toggleLock(event: MouseEvent | KeyboardEvent, entry?: ChartEntry) {
    if (!options.enabled.value) return;
    const keyEvent = event.type === "keydown";
    const value = keyEvent
      ? entry
        ? coordinate(entry)
        : (comparison.value?.value ?? coordinates.value[0])
      : fromPointer(event as MouseEvent);
    if (value === undefined) return;
    if (keyEvent) event.preventDefault();
    if (current.value?.locked && current.value.value === value) clear();
    else set({ value, locked: true });
  }
  function key(event: KeyboardEvent) {
    if (!options.enabled.value || !coordinates.value.length) return;
    const values = coordinates.value;
    const horizontal = options.frame.value.horizontal;
    const previous = horizontal ? "ArrowUp" : "ArrowLeft";
    const next = horizontal ? "ArrowDown" : "ArrowRight";
    if (![previous, next, "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const old = current.value;
    const index = old ? lowerBound(values, old.value) : -1;
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? values.length - 1
          : Math.max(
              0,
              Math.min(
                values.length - 1,
                index + (event.key === previous ? -1 : 1),
              ),
            );
    otherFraction.value = undefined;
    set({ value: values[target], locked: old?.locked ?? false });
  }
  return {
    current,
    comparison,
    otherPosition,
    hover,
    leave,
    focus,
    toggleLock,
    key,
    clear,
  };
}
