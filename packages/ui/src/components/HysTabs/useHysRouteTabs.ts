import {
  nextTick,
  onScopeDispose,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { neighbor, orderedTabs, usable } from "./tabsItems";
import type { HysTabGuardContext, HysTabItem, HysTabValue } from "./tabsTypes";

export interface HysRouteTabItem extends HysTabItem {
  to?: string;
}
export interface HysRouteTabsOptions<R> {
  route: MaybeRefOrGetter<R>;
  resolve: (route: R) => HysRouteTabItem | undefined;
  navigate: (item: HysRouteTabItem, signal: AbortSignal) => unknown;
  allow?: (item: HysRouteTabItem, route: R) => boolean;
  fallback?: () => HysRouteTabItem | undefined;
  onError?: (error: unknown) => void;
  historyLimit?: number;
}

export function useHysRouteTabs<R>(options: HysRouteTabsOptions<R>) {
  const items = shallowRef<HysRouteTabItem[]>([]);
  const active = ref<HysTabValue>();
  const history = shallowRef<HysTabValue[]>([]);
  let navigation: AbortController | undefined;
  const allowed = (item: HysRouteTabItem) =>
    options.allow?.(item, toValue(options.route)) !== false;
  function setItems(next: readonly HysRouteTabItem[]) {
    items.value = orderedTabs(next.filter(allowed));
  }
  watch(
    () => {
      const route = toValue(options.route);
      const item = options.resolve(route);
      return item && allowed(item) ? item : undefined;
    },
    (item) => {
      setItems(items.value);
      if (!item) {
        active.value = undefined;
        return;
      }
      const existing = items.value.find((entry) => entry.value === item.value);
      setItems(
        existing
          ? items.value.map((entry) =>
              entry === existing
                ? {
                    ...item,
                    label: entry.label,
                    pinned: entry.pinned,
                    favorite: entry.favorite,
                  }
                : entry,
            )
          : [...items.value, item],
      );
      active.value = item.value;
      const limit = Number.isFinite(options.historyLimit)
        ? Math.max(0, Math.min(200, options.historyLimit!))
        : 30;
      history.value = [
        item.value,
        ...history.value.filter((key) => key !== item.value),
      ].slice(0, limit);
    },
    { immediate: true },
  );
  async function navigate(item: HysRouteTabItem, signal?: AbortSignal) {
    if (!allowed(item) || !usable(item) || signal?.aborted) return false;
    navigation?.abort();
    const controller = new AbortController();
    navigation = controller;
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const result = await options.navigate(item, controller.signal);
      await nextTick();
      return (
        result !== false &&
        !controller.signal.aborted &&
        active.value === item.value
      );
    } catch (error) {
      if (!controller.signal.aborted) options.onError?.(error);
      return false;
    } finally {
      signal?.removeEventListener("abort", abort);
      if (navigation === controller) navigation = undefined;
    }
  }
  async function select(key: HysTabValue) {
    const target = items.value.find((item) => item.value === key);
    return !!target && (active.value === key || (await navigate(target)));
  }
  async function beforeClose(key: HysTabValue, context?: HysTabGuardContext) {
    if (active.value !== key) return true;
    const next =
      neighbor(
        items.value.filter((item) => item.value !== key && allowed(item)),
        items.value,
        key,
      ) ?? options.fallback?.();
    return (
      !!next && next.value !== key && (await navigate(next, context?.signal))
    );
  }
  onScopeDispose(() => navigation?.abort());
  return { items, active, history, setItems, select, beforeClose };
}
