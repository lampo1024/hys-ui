import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  reactive,
  shallowReactive,
  shallowRef,
  watch,
} from "vue";
import type {
  HysTabContent,
  HysTabItem,
  HysTabValue,
  HysTabsProps,
  TabsEmit,
} from "./tabsTypes";

interface Resource {
  state: "loading" | "ready" | "error";
  content?: HysTabContent;
  error?: unknown;
}
interface Request {
  controller: AbortController;
  promise: Promise<boolean>;
}
export function useTabsPanels(
  props: () => HysTabsProps,
  items: () => readonly HysTabItem[],
  active: () => HysTabValue,
  emit: TabsEmit,
) {
  const loaded = shallowReactive(new Map<HysTabValue, Resource>());
  const versions = reactive(new Map<HysTabValue, number>());
  const visited = shallowRef<HysTabValue[]>([]);
  const requests = new Map<HysTabValue, Request>();
  let mounted = false,
    live = true;
  function remember(value: HysTabValue) {
    const order = [value, ...visited.value.filter((key) => key !== value)];
    const maximum = props().cacheLimit;
    if (maximum === undefined || !Number.isFinite(maximum)) {
      visited.value = order;
      return;
    }
    const limit = Math.max(1, Math.floor(maximum));
    const protectedKeys = new Set(
      items()
        .filter((item) => item.forceRender)
        .map((item) => item.value),
    );
    const keep = new Set([
      ...order.slice(0, limit),
      active(),
      ...protectedKeys,
    ]);
    for (const key of order) if (!keep.has(key)) forget(key);
    visited.value = order.filter((key) => keep.has(key));
  }
  function forget(value: HysTabValue) {
    requests.get(value)?.controller.abort();
    requests.delete(value);
    loaded.delete(value);
  }
  function load(value: HysTabValue, retry = false): Promise<boolean> {
    const item = items().find((tab) => tab.value === value);
    if (!live || !item || item.hidden) return Promise.resolve(false);
    if (!item.load) return Promise.resolve(true);
    const existing = requests.get(value);
    if (existing) return existing.promise;
    const resource = loaded.get(value);
    if (!retry && resource) return Promise.resolve(resource.state === "ready");
    const controller = new AbortController();
    const job: Request = { controller, promise: Promise.resolve(false) };
    requests.set(value, job);
    loaded.set(value, { state: "loading" });
    emit("loadStart", value);
    job.promise = new Promise<boolean>((resolve) => {
      const cancelled = () => resolve(false);
      controller.signal.addEventListener("abort", cancelled, { once: true });
      Promise.resolve()
        .then(() => {
          if (controller.signal.aborted) return null;
          return item.load!({ item, signal: controller.signal });
        })
        .then(
          (content) => {
            if (requests.get(value) !== job || controller.signal.aborted)
              return resolve(false);
            loaded.set(value, { state: "ready", content });
            emit("load", value, content);
            resolve(true);
          },
          (error) => {
            if (requests.get(value) === job && !controller.signal.aborted) {
              loaded.set(value, { state: "error", error });
              emit("loadError", value, error);
            }
            resolve(false);
          },
        )
        .finally(() => {
          controller.signal.removeEventListener("abort", cancelled);
          if (requests.get(value) === job) requests.delete(value);
        });
    });
    return job.promise;
  }
  function preload(value: HysTabValue) {
    if (!live || !items().some((item) => item.value === value && !item.hidden))
      return Promise.resolve(false);
    remember(value);
    return load(value);
  }
  function reload(value = active()) {
    if (!live || !items().some((item) => item.value === value && !item.hidden))
      return Promise.resolve(false);
    forget(value);
    versions.set(value, (versions.get(value) ?? 0) + 1);
    remember(value);
    return load(value, true);
  }
  function prepare() {
    if (!mounted || !live) return;
    const option = props().preload;
    const keys = Array.isArray(option) ? new Set(option) : undefined;
    const target = active();
    for (const item of items())
      if (
        !item.hidden &&
        (item.forceRender ||
          item.preload ||
          option === true ||
          keys?.has(item.value))
      )
        void preload(item.value);
    if (items().some((item) => item.value === target && !item.hidden))
      void preload(target);
  }
  function render(item: HysTabItem) {
    return (
      !item.hidden &&
      (active() === item.value ||
        item.forceRender ||
        (!props().destroyOnHide &&
          item.cache !== false &&
          (!(item.lazy ?? props().lazy) || visited.value.includes(item.value))))
    );
  }
  let previous = new Map<HysTabValue, HysTabItem["load"]>();
  watch(
    () => items().map((item) => [item.value, item.load, item.hidden] as const),
    (entries) => {
      const current = new Map(
        entries
          .filter(([, , hidden]) => !hidden)
          .map(([key, loader]) => [key, loader]),
      );
      for (const [key, loader] of previous) {
        if (current.has(key) && current.get(key) === loader) continue;
        forget(key);
        if (!current.has(key)) versions.delete(key);
      }
      previous = current;
      visited.value = visited.value.filter((key) => current.has(key));
      prepare();
    },
    { immediate: true },
  );
  watch(
    active,
    (value, old) => {
      if (
        old !== undefined &&
        items().find((item) => item.value === old)?.cache === false
      )
        forget(old);
      if (items().some((item) => item.value === value && !item.hidden)) {
        remember(value);
        if (mounted) void load(value);
      }
    },
    { immediate: true },
  );
  watch(
    () => [props().preload, ...items().map((item) => item.preload)],
    prepare,
  );
  function suspend() {
    live = false;
    for (const key of requests.keys()) forget(key);
  }
  onMounted(() => {
    mounted = true;
    prepare();
  });
  onActivated(() => {
    live = true;
    prepare();
  });
  onDeactivated(suspend);
  onBeforeUnmount(suspend);
  return { loaded, versions, render, preload, reload };
}
