import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import { bounded, neighbor, orderedTabs, usable } from "./tabsItems";
import type {
  HysTabCloseScope,
  HysTabItem,
  HysTabSource,
  HysTabsProps,
  HysTabValue,
  TabsEmit,
} from "./tabsTypes";

type Options = () => HysTabsProps;
export interface ClosedTab {
  item: HysTabItem;
  index: number;
}
function waitForGuard(
  value: boolean | void | PromiseLike<boolean | void>,
  signal: AbortSignal,
) {
  return new Promise<boolean>((resolve, reject) => {
    const abort = () => resolve(false);
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(value)
      .then((result) => resolve(result !== false), reject)
      .finally(() => signal.removeEventListener("abort", abort));
  });
}
export function useTabsState(
  props: Options,
  declared: () => readonly HysTabItem[],
  declarative: () => boolean,
  emit: TabsEmit,
  confirmDirty: (items: HysTabItem[], signal: AbortSignal) => Promise<boolean>,
) {
  const local = shallowRef<HysTabItem[]>([...(props().defaultItems ?? [])]);
  const current = ref<HysTabValue | undefined>(props().defaultValue);
  const all = computed(() =>
    orderedTabs(props().items ?? (declarative() ? declared() : local.value)),
  );
  const visible = computed(() => all.value.filter((item) => !item.hidden));
  const byKey = computed(
    () => new Map(all.value.map((item) => [item.value, item])),
  );
  const enabled = computed(() =>
    props().disabled ? [] : visible.value.filter(usable),
  );
  const active = computed<HysTabValue>(() => {
    if (props().modelValue !== undefined) return props().modelValue!;
    const item =
      current.value === undefined ? undefined : byKey.value.get(current.value);
    return item && usable(item)
      ? item.value
      : (visible.value.find(usable)?.value ?? "");
  });
  const pending = ref(false),
    closing = reactive(new Set<HysTabValue>());
  const recent = shallowRef<HysTabValue[]>([]);
  const closed = shallowRef<ClosedTab[]>([]);
  const limit = computed(() => bounded(props().historyLimit, 20, 200));
  let selection: AbortController | undefined,
    live = true,
    serial = 0,
    adding = false;
  const closeJobs = new Map<HysTabValue, AbortController>();
  function resetSelection() {
    selection?.abort();
    selection = undefined;
    pending.value = false;
  }
  function resetJobs() {
    resetSelection();
    for (const job of closeJobs.values()) job.abort();
    closeJobs.clear();
    closing.clear();
  }
  function announce(
    value: HysTabValue,
    previous: HysTabValue,
    source: HysTabSource,
  ) {
    current.value = value;
    emit("update:modelValue", value);
    emit("change", value);
    emit("selectionChange", { value, previous, source });
  }
  async function select(value: HysTabValue, source: HysTabSource = "api") {
    resetSelection();
    const item = byKey.value.get(value),
      previous = active.value;
    if (!live || props().disabled || !item || !usable(item)) return false;
    if (value === previous) return true;
    const job = new AbortController();
    selection = job;
    try {
      const guard = props().beforeLeave;
      if (guard) {
        pending.value = true;
        const permitted = await waitForGuard(
          guard(value, previous, { item, source, signal: job.signal }),
          job.signal,
        );
        if (!permitted) return live && active.value === value;
      }
      const target = byKey.value.get(value);
      if (
        selection !== job ||
        active.value !== previous ||
        !target ||
        !usable(target)
      )
        return live && !!target && usable(target) && active.value === value;
      announce(value, previous, source);
      await nextTick();
      return live && active.value === value;
    } catch (error) {
      if (selection === job) emit("guardError", error);
      return false;
    } finally {
      if (selection === job) resetSelection();
    }
  }
  const signature = computed(() =>
    JSON.stringify(visible.value.map((item) => [item.value, !!item.disabled])),
  );
  let previous: HysTabItem[] = visible.value.map((item) => ({ ...item }));
  watch(
    signature,
    () => {
      const before = previous;
      previous = visible.value.map((item) => ({ ...item }));
      for (const [key, job] of closeJobs)
        if (!canClose(byKey.value.get(key))) job.abort();
      const value = props().modelValue ?? current.value;
      if (
        value !== undefined &&
        before.some((item) => item.value === value && usable(item)) &&
        !visible.value.some((item) => item.value === value && usable(item))
      ) {
        if (props().autoActivate === false) return;
        const next = neighbor(visible.value, before, value)?.value ?? "";
        if (next !== value) announce(next, value, "fallback");
      }
    },
    { flush: "post" },
  );
  watch(
    active,
    (value) => {
      resetSelection();
      const item = byKey.value.get(value);
      if (item && usable(item))
        recent.value = [
          value,
          ...recent.value.filter((key) => key !== value),
        ].slice(0, limit.value);
    },
    { immediate: true, flush: "sync" },
  );
  watch(
    () => props().disabled,
    (value) => {
      if (value) resetJobs();
    },
    { flush: "sync" },
  );
  onActivated(() => {
    live = true;
  });
  onDeactivated(() => {
    live = false;
    resetJobs();
  });
  onBeforeUnmount(() => {
    live = false;
    resetJobs();
  });
  function canEdit() {
    return live && !props().disabled && !props().readonly && !declarative();
  }
  function write(items: HysTabItem[]) {
    if (declarative()) return;
    if (props().items === undefined) local.value = items;
    emit("update:items", items);
  }
  function canClose(item: HysTabItem | undefined): boolean {
    const settings = props();
    return !!(
      item &&
      !settings.disabled &&
      !settings.readonly &&
      !item.disabled &&
      !item.readonly &&
      !item.pinned &&
      (item.closable ??
        (settings.closable || settings.editable || settings.workbench))
    );
  }
  function canMove(item: HysTabItem | undefined): boolean {
    return !!(
      item &&
      canEdit() &&
      usable(item) &&
      !item.readonly &&
      !item.pinned &&
      item.movable !== false
    );
  }
  async function add(item?: HysTabItem) {
    if (!live || props().disabled || props().readonly || adding) return false;
    adding = true;
    try {
      emit("add");
      emit("edit", undefined, "add");
      if (!canEdit()) return true;
      const create = props().createTab;
      let candidate = item ?? (create ? await create(all.value) : undefined);
      if (!candidate && !create && props().workbench) {
        do {
          serial++;
        } while (byKey.value.has("tab-" + serial));
        candidate = { value: "tab-" + serial, label: "新建页签 " + serial };
      }
      if (!candidate) return !create;
      if (
        !canEdit() ||
        byKey.value.has(candidate.value) ||
        !orderedTabs([candidate]).length
      )
        return false;
      write(orderedTabs([...all.value, candidate]));
      await nextTick();
      if (!live || !byKey.value.has(candidate.value)) return false;
      if (props().autoActivate !== false) await select(candidate.value);
      return true;
    } catch (error) {
      if (live) emit("guardError", error);
      return false;
    } finally {
      adding = false;
    }
  }
  function targets(
    scope: HysTabCloseScope | readonly HysTabValue[],
    anchor: HysTabValue,
  ) {
    if (typeof scope !== "string") return [...new Set(scope)];
    const items = visible.value,
      at = items.findIndex((item) => item.value === anchor);
    if (scope === "current") return [anchor];
    if (scope === "all") return all.value.map((item) => item.value);
    if (at < 0) return [];
    return (
      scope === "left"
        ? items.slice(0, at)
        : scope === "right"
          ? items.slice(at + 1)
          : items.filter((item) => item.value !== anchor)
    ).map((item) => item.value);
  }
  async function closeMany(
    scope: HysTabCloseScope | readonly HysTabValue[],
    anchor = active.value,
  ) {
    const items = targets(scope, anchor)
      .map((value) => byKey.value.get(value))
      .filter(
        (item): item is HysTabItem =>
          !!item && canClose(item) && !closeJobs.has(item.value),
      );
    if (!live || !items.length) return [];
    const job = new AbortController();
    for (const item of items) {
      closing.add(item.value);
      closeJobs.set(item.value, job);
    }
    try {
      const dirty = items.filter((item) => item.dirty);
      if (
        props().confirmDirty !== false &&
        dirty.length &&
        !(await confirmDirty(dirty, job.signal))
      )
        return [];
      const approved: HysTabValue[] = [];
      for (const item of items) {
        const guard = props().beforeClose;
        if (job.signal.aborted) return [];
        if (!canClose(byKey.value.get(item.value))) continue;
        try {
          if (
            !guard ||
            (await waitForGuard(
              guard(item.value, { item, signal: job.signal, source: "api" }),
              job.signal,
            ))
          )
            approved.push(item.value);
        } catch (error) {
          if (!job.signal.aborted) emit("guardError", error);
        }
      }
      if (!live || job.signal.aborted) return [];
      const values = approved.filter((key) => canClose(byKey.value.get(key)));
      if (!values.length) return [];
      const removing = new Set(values),
        before = all.value;
      const entries = before.flatMap((item, index) =>
        removing.has(item.value) ? [{ item, index }] : [],
      );
      if (
        !declarative() &&
        (props().workbench || props().defaultItems !== undefined)
      )
        write(before.filter((item) => !removing.has(item.value)));
      for (const value of values) {
        emit("close", value);
        emit("edit", value, "remove");
      }
      emit("closeBatch", values);
      await nextTick();
      if (live)
        closed.value = [
          ...entries
            .filter((entry) => !byKey.value.has(entry.item.value))
            .reverse(),
          ...closed.value,
        ].slice(0, limit.value);
      return values;
    } finally {
      for (const item of items)
        if (closeJobs.get(item.value) === job) {
          closeJobs.delete(item.value);
          closing.delete(item.value);
        }
    }
  }
  async function editItem(value: HysTabValue, patch: Partial<HysTabItem>) {
    const item = byKey.value.get(value);
    if (!canEdit() || !item || item.disabled || item.readonly) return false;
    write(
      orderedTabs(
        all.value.map((entry) =>
          entry.value === value ? { ...entry, ...patch } : entry,
        ),
      ),
    );
    await nextTick();
    const actual = byKey.value.get(value);
    return (
      !!actual &&
      Object.entries(patch).every(
        ([key, next]) => actual[key as keyof HysTabItem] === next,
      )
    );
  }
  async function rename(value: HysTabValue, name: string) {
    const label = name.trim();
    if (!label || !(await editItem(value, { label }))) return false;
    emit("rename", value, label);
    return true;
  }
  async function pin(
    value: HysTabValue,
    pinned = !byKey.value.get(value)?.pinned,
  ) {
    if (!(await editItem(value, { pinned }))) return false;
    emit("pinChange", value, pinned);
    return true;
  }
  async function favorite(
    value: HysTabValue,
    favorite = !byKey.value.get(value)?.favorite,
  ) {
    if (!(await editItem(value, { favorite }))) return false;
    emit("favoriteChange", value, favorite);
    return true;
  }
  async function move(value: HysTabValue, target: HysTabValue, after = false) {
    if (
      value === target ||
      !canMove(byKey.value.get(value)) ||
      !canMove(byKey.value.get(target))
    )
      return false;
    const next = [...all.value],
      from = next.findIndex((item) => item.value === value),
      to = next.findIndex((item) => item.value === target);
    if (
      next
        .slice(Math.min(from, to), Math.max(from, to) + 1)
        .some((item) => !item.hidden && !canMove(item))
    )
      return false;
    const [item] = next.splice(from, 1);
    const index =
      next.findIndex((entry) => entry.value === target) + Number(after);
    if (from === index) return false;
    next.splice(index, 0, item);
    const context = { value, from, to: index, items: next };
    try {
      if (props().beforeReorder?.(context) === false) return false;
    } catch (error) {
      emit("guardError", error);
      return false;
    }
    write(next);
    emit("reorder", context);
    await nextTick();
    return all.value.findIndex((entry) => entry.value === value) === index;
  }
  async function restore() {
    if (!canEdit()) return false;
    const entry = closed.value.find(
      (candidate) => !byKey.value.has(candidate.item.value),
    );
    if (!entry) return false;
    const items = [...all.value];
    items.splice(entry.index, 0, entry.item);
    write(orderedTabs(items));
    await nextTick();
    if (!live || !byKey.value.has(entry.item.value)) return false;
    closed.value = closed.value.filter((candidate) => candidate !== entry);
    emit("restore", entry.item);
    if (props().autoActivate !== false)
      await select(entry.item.value, "restore");
    return true;
  }
  return {
    all,
    visible,
    byKey,
    enabled,
    active,
    current,
    pending,
    closing,
    recent,
    closed,
    select,
    add,
    write,
    canClose,
    canMove,
    canEdit,
    rename,
    pin,
    favorite,
    move,
    restore,
    closeMany,
    close: async (value = active.value) =>
      (await closeMany([value])).length > 0,
  };
}
