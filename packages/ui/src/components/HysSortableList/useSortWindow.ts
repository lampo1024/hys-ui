import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  type Ref,
} from "vue";
import { keyToken, layoutOf } from "./model";
import type { HysSortableListProps, HysSortKey } from "./sortableList";

const limit = (
  value: number | undefined,
  fallback: number,
  low: number,
  high: number,
) =>
  Number.isFinite(value) ? Math.min(high, Math.max(low, value!)) : fallback;

function unitAt(offsets: number[], point: number) {
  let low = 0;
  let high = offsets.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (offsets[middle] <= point) low = middle;
    else high = middle - 1;
  }
  return Math.min(low, Math.max(0, offsets.length - 2));
}

export function useSortWindow<T extends object>(
  props: HysSortableListProps<T>,
  items: Ref<readonly T[]>,
  viewport: Ref<HTMLElement | null>,
  surface: Ref<HTMLElement | null>,
  keyOf: (item: T) => HysSortKey,
) {
  const config = computed(() =>
    typeof props.virtual === "object" ? props.virtual : {},
  );
  const horizontal = computed(() => layoutOf(props) === "horizontal");
  const position = ref(0);
  const viewportWidth = ref(0);
  const viewportSize = ref(0);
  const gap = ref(0);
  const sizes = new Map<string, number>();
  const revision = shallowRef(0);
  const columns = computed(() => {
    if (layoutOf(props) !== "grid" || !props.virtual) return 1;
    const input = config.value.columns;
    return Math.floor(
      limit(
        typeof input === "function" ? input(viewportWidth.value) : input,
        2,
        1,
        100,
      ),
    );
  });
  const offsets = computed(() => {
    if (!props.virtual) return [0];
    revision.value;
    const result = [0];
    const estimate = limit(
      config.value.estimateSize,
      horizontal.value ? 160 : 48,
      1,
      2000,
    );
    const stride = columns.value;
    for (let start = 0; start < items.value.length; start += stride) {
      let size = 0;
      for (
        let index = start;
        index < Math.min(start + stride, items.value.length);
        index++
      ) {
        size = Math.max(
          size,
          sizes.get(keyToken(keyOf(items.value[index]))) ?? estimate,
        );
      }
      result.push(result[result.length - 1] + size + gap.value);
    }
    return result;
  });
  const range = computed(() => {
    if (!props.virtual)
      return { start: 0, end: items.value.length, before: 0, after: 0 };
    const points = offsets.value;
    const count = points.length - 1;
    const extra = Math.floor(limit(config.value.overscan, 4, 1, 100));
    const start = Math.max(0, unitAt(points, position.value) - extra);
    const end = Math.min(
      count,
      unitAt(points, position.value + (viewportSize.value || 300)) + extra + 1,
    );
    return {
      start: start * columns.value,
      end: Math.min(end * columns.value, items.value.length),
      before: Math.max(0, points[start] - gap.value),
      after: Math.max(0, points[count] - points[end] - gap.value),
    };
  });
  const visibleItems = computed(() =>
    items.value.slice(range.value.start, range.value.end),
  );
  const length = computed(() => {
    if (!props.virtual) return undefined;
    const height = config.value.height ?? (horizontal.value ? "auto" : 320);
    return typeof height === "number" ? `${Math.max(1, height)}px` : height;
  });

  let viewportObserver: ResizeObserver | undefined;
  let rowObserver: ResizeObserver | undefined;
  const observed = new Set<Element>();
  function syncPosition() {
    const el = viewport.value;
    if (!el || !props.virtual) return;
    position.value = horizontal.value ? Math.abs(el.scrollLeft) : el.scrollTop;
    viewportSize.value = horizontal.value ? el.clientWidth : el.clientHeight;
    viewportWidth.value = el.clientWidth;
    const content = surface.value;
    if (content) {
      const style = getComputedStyle(content);
      gap.value =
        parseFloat(horizontal.value ? style.columnGap : style.rowGap) || 0;
    }
  }

  function setPosition(value: number) {
    const el = viewport.value;
    if (!el) return;
    if (horizontal.value)
      el.scrollLeft = getComputedStyle(el).direction === "rtl" ? -value : value;
    else el.scrollTop = value;
    syncPosition();
  }

  function onMeasured(entries: ResizeObserverEntry[]) {
    const before = offsets.value;
    const unit = unitAt(before, position.value);
    let changed = false;
    for (const entry of entries) {
      const row = entry.target as HTMLElement;
      const token = row.dataset.sortKey;
      if (token === undefined || !observed.has(row)) continue;
      const size = horizontal.value ? row.offsetWidth : row.offsetHeight;
      if (!size || sizes.get(token) === size) continue;
      sizes.set(token, size);
      changed = true;
    }
    if (changed) {
      revision.value++;
      const delta = (offsets.value[unit] ?? 0) - (before[unit] ?? 0);
      if (delta && position.value > 0) {
        const at = position.value;
        void nextTick(() => {
          if (position.value === at) setPosition(at + delta);
        });
      }
    }
  }

  function refreshRows() {
    if (!rowObserver || !surface.value) return;
    const current = new Set(
      Array.from(surface.value.children).filter((row) =>
        row.hasAttribute("data-sort-key"),
      ),
    );
    for (const row of observed)
      if (!current.has(row)) {
        rowObserver.unobserve(row);
        observed.delete(row);
      }
    for (const row of current)
      if (!observed.has(row)) {
        observed.add(row);
        rowObserver.observe(row);
      }
  }
  function disconnect() {
    viewportObserver?.disconnect();
    rowObserver?.disconnect();
    viewportObserver = rowObserver = undefined;
    observed.clear();
  }
  watch(
    [viewport, surface, () => !!props.virtual, horizontal],
    () => {
      disconnect();
      sizes.clear();
      revision.value++;
      if (!viewport.value || !props.virtual) return;
      syncPosition();
      if (typeof ResizeObserver !== "undefined") {
        viewportObserver = new ResizeObserver(syncPosition);
        viewportObserver.observe(viewport.value);
        rowObserver = new ResizeObserver(onMeasured);
        refreshRows();
      }
    },
    { flush: "post" },
  );
  watch(visibleItems, refreshRows, { flush: "post" });
  watch(items, (value) => {
    if (!sizes.size) return;
    const current = new Set(value.map((item) => keyToken(keyOf(item))));
    for (const key of sizes.keys()) if (!current.has(key)) sizes.delete(key);
  });
  onBeforeUnmount(disconnect);

  async function reveal(index: number) {
    if (!props.virtual || index < 0) return;
    const unit = Math.floor(index / columns.value);
    const start = offsets.value[unit];
    const end = offsets.value[unit + 1] - gap.value;
    if (start < position.value) setPosition(start);
    else if (end > position.value + viewportSize.value)
      setPosition(Math.max(0, end - viewportSize.value));
    await nextTick();
  }

  return {
    visibleItems,
    range,
    horizontal,
    length,
    columns,
    reveal,
    syncPosition,
  };
}
