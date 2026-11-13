import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  watch,
} from "vue";
import { bounded, orderedTabs, usable } from "./tabsItems";
import type { ClosedTab, useTabsState } from "./useTabsState";
import type {
  HysTabItem,
  HysTabSnapshot,
  HysTabsProps,
  HysTabValue,
  TabsEmit,
} from "./tabsTypes";

interface Snapshot {
  version: 1;
  active: HysTabValue;
  items: HysTabSnapshot[];
  recent: HysTabValue[];
  closed: Array<{ item: HysTabSnapshot; index: number }>;
  scroll?: [number, number];
}
const isKey = (value: unknown): value is HysTabValue =>
  typeof value === "string" ||
  (typeof value === "number" && Number.isFinite(value));
const snapshot = ({
  value,
  label,
  pinned,
  favorite,
}: HysTabItem): HysTabSnapshot => ({
  value,
  label,
  pinned: !!pinned,
  favorite: !!favorite,
});
function tab(value: unknown): HysTabSnapshot | undefined {
  if (!value || typeof value !== "object") return;
  const item = value as Partial<HysTabSnapshot>;
  if (!isKey(item.value) || typeof item.label !== "string") return;
  return {
    value: item.value,
    label: item.label,
    pinned: item.pinned === true,
    favorite: item.favorite === true,
  };
}
export function useTabsPersistence(
  props: () => HysTabsProps,
  state: ReturnType<typeof useTabsState>,
  nav: () => HTMLElement | undefined,
  emit: TabsEmit,
) {
  let timer: ReturnType<typeof setTimeout> | undefined,
    ready = false,
    enabled = false,
    sequence = 0;
  function store() {
    return props().storage === "local"
      ? window.localStorage
      : window.sessionStorage;
  }
  function save() {
    const key = props().storageKey;
    if (!ready || !key) return false;
    try {
      const element = props().persistScroll ? nav() : undefined;
      const data: Snapshot = {
        version: 1,
        active: state.active.value,
        items: state.all.value.map(snapshot),
        recent: state.recent.value,
        closed: state.closed.value.map((entry) => ({
          item: snapshot(entry.item),
          index: entry.index,
        })),
        scroll: element ? [element.scrollLeft, element.scrollTop] : undefined,
      };
      store().setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      emit("storageError", error);
      return false;
    }
  }
  function schedule() {
    if (!ready || !props().storageKey) return;
    clearTimeout(timer);
    timer = setTimeout(save, 100);
  }
  async function restoreSession() {
    const request = ++sequence,
      key = props().storageKey;
    ready = false;
    clearTimeout(timer);
    if (!enabled || !key) return;
    try {
      const text = store().getItem(key);
      if (text) {
        const data = JSON.parse(text) as Partial<Snapshot>;
        if (data?.version !== 1 || !Array.isArray(data.items)) return;
        const seed = new Map(state.all.value.map((item) => [item.value, item]));
        function restore(
          saved: HysTabSnapshot,
          archived = false,
        ): HysTabItem | undefined {
          const item = seed.get(saved.value) ?? props().restoreItem?.(saved);
          return item
            ? { ...item, ...saved }
            : archived || (props().workbench && props().items === undefined)
              ? saved
              : undefined;
        }
        const restored = data.items.flatMap((value) => {
          const saved = tab(value);
          const result = saved && restore(saved);
          return result ? [result] : [];
        });
        const known = new Set(restored.map((item) => item.value));
        const items = orderedTabs(
          props().items === undefined && props().workbench
            ? restored
            : [
                ...restored,
                ...state.all.value.filter((item) => !known.has(item.value)),
              ],
        );
        state.write(items);
        const limit = bounded(props().historyLimit, 20, 200);
        state.recent.value = Array.isArray(data.recent)
          ? [...new Set(data.recent.filter(isKey))].slice(0, limit)
          : [];
        state.closed.value = (Array.isArray(data.closed) ? data.closed : [])
          .slice(0, limit)
          .flatMap<ClosedTab>((entry) => {
            const saved = tab(entry?.item),
              item = saved && restore(saved, true);
            return item
              ? [{ item, index: bounded(entry.index, 0, items.length) }]
              : [];
          });
        await nextTick();
        if (request !== sequence || !enabled) return;
        if (
          isKey(data.active) &&
          state.byKey.value.has(data.active) &&
          usable(state.byKey.value.get(data.active)!)
        ) {
          if (props().modelValue === undefined)
            state.current.value = data.active;
          else if (state.active.value !== data.active)
            emit("update:modelValue", data.active);
        }
        const element = props().persistScroll ? nav() : undefined;
        if (
          element &&
          Array.isArray(data.scroll) &&
          data.scroll.length === 2 &&
          data.scroll.every(Number.isFinite)
        ) {
          await nextTick();
          if (request === sequence && enabled) {
            element.scrollLeft = data.scroll[0];
            element.scrollTop = data.scroll[1];
          }
        }
      }
    } catch (error) {
      if (request === sequence) emit("storageError", error);
    } finally {
      if (request === sequence && enabled) {
        ready = true;
        schedule();
      }
    }
  }
  function stop() {
    if (ready) save();
    enabled = ready = false;
    sequence++;
    clearTimeout(timer);
  }
  onMounted(() => {
    enabled = true;
    void restoreSession();
  });
  onActivated(() => {
    if (!enabled) {
      enabled = true;
      void restoreSession();
    }
  });
  onDeactivated(stop);
  onBeforeUnmount(stop);
  watch(
    [() => props().storageKey, () => props().storage],
    () => void restoreSession(),
  );
  watch(
    () => [
      state.active.value,
      state.all.value.map(snapshot),
      state.closed.value,
      state.recent.value,
    ],
    schedule,
  );
  return {
    save,
    scrolled: () => {
      if (props().persistScroll) schedule();
    },
  };
}
