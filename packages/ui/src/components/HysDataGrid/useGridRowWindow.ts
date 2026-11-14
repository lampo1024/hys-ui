import { computed, nextTick, ref } from "vue";

function boundary(offsets: readonly number[], position: number) {
  let low = 0;
  let high = offsets.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high + 1) / 2);
    if (offsets[middle] <= position) low = middle;
    else high = middle - 1;
  }
  return low;
}

export function useGridRowWindow<Entry>(
  entries: () => readonly Entry[],
  height: (entry: Entry) => number | undefined,
  options: () => { overscan?: number } | undefined,
  container: () => HTMLElement | null,
) {
  const scroll = ref(0);
  const viewport = ref(0);
  const metrics = computed(() => {
    if (!options()) return;
    const offsets = [0];
    for (const entry of entries())
      offsets.push(offsets.at(-1)! + (height(entry) ?? 35));
    return offsets;
  });
  const window = computed(() => {
    const items = entries();
    const offsets = metrics.value;
    if (!offsets) return { entries: items, before: 0, after: 0 };
    const overscan = Math.max(2, Math.min(40, options()?.overscan ?? 6));
    const start = Math.min(
      items.length,
      Math.max(0, boundary(offsets, scroll.value) - overscan),
    );
    const end = Math.min(
      items.length,
      boundary(offsets, scroll.value + (viewport.value || 400)) + overscan + 1,
    );
    return {
      entries: items.slice(start, end),
      before: offsets[start],
      after: offsets.at(-1)! - offsets[end],
    };
  });
  function update() {
    const element = container();
    if (!element || !options()) return;
    scroll.value = element.scrollTop;
    viewport.value = element.clientHeight;
  }
  function reveal(index: number, focus: () => void) {
    const offsets = metrics.value;
    const element = container();
    if (!offsets || !element || index < 0 || index >= offsets.length - 1)
      return false;
    element.scrollTop = Math.max(0, offsets[index] - 35);
    update();
    void nextTick(focus);
    return true;
  }
  return { window, update, reveal };
}
