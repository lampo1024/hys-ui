import { nextTick, shallowReactive, shallowRef } from "vue";
import {
  finite,
  normalizeToastPosition,
  toastDuration,
} from "../components/HysToast/toastPresentation";
import type {
  HysToastApi,
  HysToastCloseContext,
  HysToastCloseReason,
  HysToastConfig,
  HysToastFilter,
  HysToastHandle,
  HysToastOptions,
  HysToastPatch,
  HysToastStatus,
  HysToastType,
} from "../components/HysToast/toastTypes";
import {
  asOptions,
  context,
  defaults,
  matches,
  nextToastSequence,
  snapshot,
  toastStackKey,
  type ToastEntry,
  type ToastInstance,
} from "./toastQueueModel";
import { createToastTaskRunner } from "./toastTasks";
export function createToastQueue(
  config: HysToastConfig,
  host: { mount: () => void; empty: () => void },
  reportError: (error: unknown) => void,
) {
  const settings = shallowRef({ ...config });
  const records = shallowReactive(new Map<string, ToastEntry>());
  const instances = new Map<number, ToastInstance>();
  const instanceStacks = new Map<number, string>();
  const checking = new Set<ToastEntry>();
  let active = true,
    destroyed = false,
    batches = 0,
    reconciling = false,
    reconcileAgain = false;
  function notify<T extends unknown[]>(
    callback: ((...args: T) => void) | undefined,
    ...args: T
  ) {
    try {
      callback?.(...args);
    } catch (error) {
      reportError(error);
    }
  }
  function status(entry: ToastEntry, value: HysToastStatus) {
    entry.status = value;
    notify(entry.options.onStateChange, snapshot(entry));
  }
  function capacity() {
    return Math.max(1, Math.floor(finite(settings.value.maxCount, 5)));
  }
  function scope(entry: ToastEntry) {
    switch (settings.value.queueScope) {
      case "position":
        return normalizeToastPosition(entry.options.position);
      case "type":
        return entry.options.type ?? "info";
      case "group":
        return entry.options.group ?? "";
      default:
        return "";
    }
  }
  function order(a: ToastEntry, b: ToastEntry) {
    return (
      finite(b.options.priority, 0) - finite(a.options.priority, 0) ||
      (settings.value.queueOrder === "lifo"
        ? b.serial - a.serial
        : a.serial - b.serial)
    );
  }
  function reconcile() {
    if (!active || batches) return;
    if (reconciling) {
      reconcileAgain = true;
      return;
    }
    reconciling = true;
    try {
      reconcileAgain = false;
      const counts = new Map<string, number>(),
        pending: ToastEntry[] = [];
      const waitForLeave = settings.value.overflow === "queue";
      for (const entry of records.values()) {
        if (entry.status === "queued") pending.push(entry);
        else if (
          entry.status === "visible" ||
          (entry.status === "closing" && waitForLeave)
        ) {
          const key = scope(entry);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      for (const entry of pending.sort(order)) {
        if (!active || entry.status !== "queued") continue;
        const key = scope(entry),
          count = counts.get(key) ?? 0;
        if (count >= capacity()) continue;
        counts.set(key, count + 1);
        status(entry, "visible");
      }
    } finally {
      reconciling = false;
    }
    if (reconcileAgain) reconcile();
  }
  function begin(entry: ToastEntry, closeContext: HysToastCloseContext) {
    if (entry.status === "closing" || entry.status === "closed") return;
    entry.closeContext = closeContext;
    status(entry, "closing");
    notify(entry.options.onClose, closeContext);
  }
  function finish(entry: ToastEntry) {
    if (entry.status === "closed") return;
    const closeContext = entry.closeContext;
    if (records.get(entry.id) === entry) records.delete(entry.id);
    instances.delete(entry.serial);
    instanceStacks.delete(entry.serial);
    checking.delete(entry);
    status(entry, "closed");
    entry.resolve();
    if (closeContext) notify(entry.options.onAfterClose, closeContext);
    reconcile();
    if (!records.size) host.empty();
  }
  async function closeEntry(
    entry: ToastEntry,
    reason: HysToastCloseReason = "api",
    force = false,
  ) {
    if (
      entry.status === "closing" ||
      entry.status === "closed" ||
      (!force && checking.has(entry))
    )
      return;
    const instance = instances.get(entry.serial);
    if (instance) {
      await instance.close(reason, undefined, force);
      return;
    }
    const payload = { ...context(entry), reason };
    if (!force && entry.options.beforeClose) {
      checking.add(entry);
      try {
        if ((await entry.options.beforeClose(payload)) === false) return;
      } catch {
        return;
      } finally {
        checking.delete(entry);
      }
      if (
        (entry.status as HysToastStatus) === "closed" ||
        (entry.status as HysToastStatus) === "closing"
      )
        return;
      const mounted = instances.get(entry.serial);
      if (mounted) {
        await mounted.close(reason, undefined, true);
        return;
      }
    }
    begin(entry, payload);
    finish(entry);
  }
  function update(entry: ToastEntry, patch: HysToastPatch) {
    if (!active || entry.status === "closing" || entry.status === "closed")
      return;
    const previous = entry.options,
      value = asOptions(patch);
    const options = { ...previous, ...value, id: entry.id };
    if (value.type && value.type !== previous.type && !("duration" in value)) {
      options.duration = value.type === "loading" ? 0 : settings.value.duration;
    }
    if (
      options.message !== previous.message ||
      toastDuration(options) !== toastDuration(previous)
    )
      entry.clock = undefined;
    else if (toastStackKey(options) !== toastStackKey(previous)) {
      entry.clock ??= instances.get(entry.serial)?.snapshotClock();
    }
    entry.options = options;
    if (
      options.type !== previous.type ||
      options.group !== previous.group ||
      options.position !== previous.position ||
      options.priority !== previous.priority
    ) {
      notify(entry.options.onStateChange, snapshot(entry));
      reconcile();
    }
  }
  function duplicate(options: HysToastOptions) {
    const mode = options.dedupe ?? (options.grouping ? "merge" : undefined);
    if (
      !mode ||
      (!options.dedupeKey &&
        (!options.message || options.content !== undefined))
    )
      return;
    const now = Date.now(),
      window = Math.max(0, finite(options.dedupeWindow, Infinity));
    return [...records.values()].find(
      (entry) =>
        entry.status !== "closing" &&
        entry.status !== "closed" &&
        now - entry.lastSeen <= window &&
        entry.options.group === options.group &&
        (options.dedupeKey
          ? entry.options.dedupeKey === options.dedupeKey
          : entry.options.message === options.message &&
            entry.options.type === options.type &&
            normalizeToastPosition(entry.options.position) ===
              normalizeToastPosition(options.position)),
    );
  }
  function show(value: string | HysToastOptions) {
    const requested = asOptions(value),
      options: HysToastOptions = {
        type: "info",
        ...defaults(settings.value),
        ...requested,
      };
    if (options.type === "loading" && requested.duration === undefined)
      options.duration = 0;
    const sameId =
      requested.id === undefined ? undefined : records.get(requested.id);
    if (sameId && sameId.status !== "closing" && sameId.status !== "closed") {
      sameId.lastSeen = Date.now();
      update(sameId, requested);
      sameId.clock = undefined;
      void nextTick(() => instances.get(sameId.serial)?.restart());
      return sameId.handle;
    }
    const sameMessage = duplicate(options);
    if (sameMessage) {
      sameMessage.lastSeen = Date.now();
      if (options.dedupe !== "ignore") {
        sameMessage.repeat++;
        update(sameMessage, requested);
        instances.get(sameMessage.serial)?.restart();
      }
      return sameMessage.handle;
    }
    const serial = nextToastSequence(),
      id = requested.id ?? "hys-toast-" + serial;
    let resolve!: () => void;
    const closed = new Promise<void>((done) => {
      resolve = done;
    });
    const handle: HysToastHandle = {
      id,
      closed,
      close: () => {
        void closeEntry(entry);
      },
      update: (value) => update(entry, value),
      extend: (milliseconds) => {
        if (
          !Number.isFinite(milliseconds) ||
          milliseconds <= 0 ||
          !toastDuration(entry.options)
        )
          return;
        const instance = instances.get(serial);
        if (instance) instance.extend(milliseconds);
        else entry.extending += milliseconds;
      },
      pause: () => {
        entry.paused = true;
      },
      resume: () => {
        entry.paused = false;
      },
    };
    const entry = shallowReactive<ToastEntry>({
      id,
      serial,
      options,
      status: "queued",
      repeat: 1,
      paused: false,
      lastSeen: Date.now(),
      extending: 0,
      handle,
      resolve,
    });
    if (
      destroyed ||
      !active ||
      typeof document === "undefined" ||
      (!options.message &&
        !options.title &&
        options.content == null &&
        options.header == null)
    ) {
      resolve();
      return handle;
    }
    host.mount();
    batches++;
    try {
      if (sameId?.status === "closing") finish(sameId);
      records.set(id, entry);
      const siblings = [...records.values()].filter(
        (item) => item.status === "visible" && scope(item) === scope(entry),
      );
      if (
        settings.value.overflow !== "queue" &&
        siblings.length >= capacity()
      ) {
        siblings.sort(
          (a, b) =>
            finite(a.options.priority, 0) - finite(b.options.priority, 0) ||
            a.serial - b.serial,
        );
        for (const victim of siblings.slice(
          0,
          siblings.length - capacity() + 1,
        ))
          void closeEntry(victim, "overflow", true);
      }
      status(entry, "queued");
    } finally {
      batches--;
    }
    reconcile();
    const queued = [...records.values()]
      .filter((item) => item.status === "queued")
      .sort(order);
    const maxQueue = Math.max(
      0,
      Math.floor(finite(settings.value.maxQueue, 1000)),
    );
    for (const dropped of queued.slice(maxQueue))
      void closeEntry(dropped, "overflow", true);
    return handle;
  }
  function setInstance(
    entry: ToastEntry,
    instance: ToastInstance | null,
    stack: string,
  ) {
    if (!instance) {
      if (instanceStacks.get(entry.serial) === stack) {
        instanceStacks.delete(entry.serial);
        instances.delete(entry.serial);
      }
      return;
    }
    instances.set(entry.serial, instance);
    instanceStacks.set(entry.serial, stack);
    if (entry.clock) {
      const clock = entry.clock;
      void nextTick(() => {
        if (instances.get(entry.serial) !== instance || entry.clock !== clock)
          return;
        entry.clock = undefined;
        instance.restoreClock(clock);
      });
    }
    if (entry.extending) {
      instance.extend(entry.extending);
      entry.extending = 0;
    }
  }
  async function closeMatching(filter?: HysToastFilter, force = false) {
    batches++;
    try {
      await Promise.all(
        [...records.values()]
          .filter((entry) => matches(entry, filter))
          .map((entry) => closeEntry(entry, "api", force)),
      );
    } finally {
      batches--;
      reconcile();
    }
  }
  function suspend(permanent = false) {
    active = false;
    destroyed ||= permanent;
    for (const entry of [...records.values()]) {
      begin(entry, { ...context(entry), reason: "dispose" });
      finish(entry);
    }
  }
  const typed =
    (type: HysToastType) => (value: string | Omit<HysToastOptions, "type">) =>
      show({ ...asOptions(value), type });
  const api: HysToastApi = {
    show,
    promise: createToastTaskRunner(show, reportError),
    success: typed("success"),
    info: typed("info"),
    warning: typed("warning"),
    error: typed("error"),
    loading: typed("loading"),
    close: (id) => {
      const entry = records.get(id);
      if (entry) void closeEntry(entry);
    },
    update: (id, value) => {
      const entry = records.get(id);
      if (entry) update(entry, value);
    },
    find: (id) => {
      const entry = records.get(id);
      return entry && snapshot(entry);
    },
    list: (filter) =>
      [...records.values()]
        .filter((entry) => matches(entry, filter))
        .sort(order)
        .map(snapshot),
    closeAll: (filter) => {
      void closeMatching(filter);
    },
    closeType: (type) => {
      void closeMatching({ type });
    },
    clearQueue: () => {
      void closeMatching({ status: "queued" }, true);
    },
    configure: (patch) => {
      settings.value = { ...settings.value, ...patch };
      reconcile();
    },
  };
  return {
    api,
    records,
    settings,
    order,
    notify,
    begin,
    finish,
    setInstance,
    suspend,
    resume: () => {
      if (!destroyed) active = true;
    },
  };
}
