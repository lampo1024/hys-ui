import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  shallowRef,
  watch,
} from "vue";
import type {
  HysGanttHistoryEntry,
  HysGanttHistoryInvalid,
  HysGanttHistoryState,
} from "./gantt";
type Id = string | number;
type Field = "start" | "end" | "dependencies";
export interface GanttHistoryTask {
  id: Id;
  start: string;
  end: string;
  dependencies?: Id[];
  disabled?: boolean;
}
interface Snapshot {
  id: Id;
  start: string;
  end: string;
  dependencies?: Id[];
}
interface Patch {
  id: Id;
  before: Partial<Snapshot>;
  after: Partial<Snapshot>;
  fields: Field[];
}
interface Entry {
  info: HysGanttHistoryEntry;
  patches: Patch[];
}
const fields: Field[] = ["start", "end", "dependencies"];
const equalValue = (a: unknown, b: unknown) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((id, index) => id === b[index])
    : a === b;
const copyValue = (value: unknown) =>
  Array.isArray(value) ? [...value] : value;
function snapshot(items: readonly GanttHistoryTask[]): Snapshot[] {
  return items.map((item) => ({
    id: item.id,
    start: item.start,
    end: item.end,
    dependencies: item.dependencies ? [...item.dependencies] : undefined,
  }));
}
function same(a: readonly Snapshot[], b: readonly Snapshot[]) {
  return (
    a.length === b.length &&
    a.every(
      (item, index) =>
        item.id === b[index].id &&
        fields.every((field) => equalValue(item[field], b[index][field])),
    )
  );
}
function metadata(entry: Entry): HysGanttHistoryEntry {
  return { ...entry.info, taskIds: [...entry.info.taskIds] };
}
export function useGanttHistory<T extends GanttHistoryTask>(ctx: {
  items: () => readonly T[];
  enabled: () => boolean;
  limit: () => number;
  live: () => boolean;
  allowed: (item: T, fields: Field[], next: Partial<Snapshot>) => boolean;
  send: (items: T[]) => void;
  change: (item: T) => void;
  beforeReplay: () => void;
  external: () => void;
  state: (state: HysGanttHistoryState) => void;
  replay: (action: "undo" | "redo", entry: HysGanttHistoryEntry) => void;
  invalid: (info: HysGanttHistoryInvalid) => void;
}) {
  const undoStack = shallowRef<Entry[]>([]),
    redoStack = shallowRef<Entry[]>([]),
    pending = ref(false),
    available = ref(true),
    message = ref("");
  const limit = computed(() =>
    Number.isFinite(ctx.limit())
      ? Math.max(0, Math.min(1000, Math.floor(ctx.limit())))
      : 50,
  );
  const enabled = computed(() => ctx.enabled() && limit.value > 0);
  const observed = computed(() => snapshot(ctx.items()));
  let known = observed.value,
    expected: Snapshot[] | undefined,
    version = 0;
  function permitted(entry: Entry | undefined, direction: "undo" | "redo") {
    if (
      !entry ||
      !enabled.value ||
      !available.value ||
      !ctx.live() ||
      pending.value
    )
      return false;
    const items = new Map(ctx.items().map((item) => [item.id, item]));
    return entry.patches.every((patch) => {
      const item = items.get(patch.id);
      return (
        item &&
        ctx.allowed(
          item,
          patch.fields,
          direction === "undo" ? patch.before : patch.after,
        )
      );
    });
  }
  const canUndo = computed(() => permitted(undoStack.value.at(-1), "undo")),
    canRedo = computed(() => permitted(redoStack.value.at(-1), "redo"));
  const state = computed<HysGanttHistoryState>(() => ({
    canUndo: canUndo.value,
    canRedo: canRedo.value,
    undoCount: undoStack.value.length,
    redoCount: redoStack.value.length,
    undoLabel: undoStack.value.at(-1)?.info.label ?? "",
    redoLabel: redoStack.value.at(-1)?.info.label ?? "",
    pending: pending.value,
  }));
  watch(state, (value) => {
    if (available.value && ctx.live()) ctx.state({ ...value });
  });
  function clear() {
    version++;
    expected = undefined;
    pending.value = false;
    undoStack.value = [];
    redoStack.value = [];
    message.value = "";
  }
  watch(
    observed,
    (value) => {
      if (same(value, known)) return;
      known = value;
      if (expected && same(value, expected)) return;
      const hadHistory =
        undoStack.value.length > 0 || redoStack.value.length > 0;
      clear();
      ctx.external();
      if (hadHistory) message.value = "外部排期已更新，历史记录已清空";
    },
    { flush: "post" },
  );
  watch([enabled, limit], () => {
    if (!enabled.value) {
      clear();
      return;
    }
    undoStack.value = undoStack.value.slice(-limit.value);
    redoStack.value = redoStack.value.slice(-limit.value);
  });
  function capture(
    items: T[],
    info: Omit<HysGanttHistoryEntry, "taskIds">,
  ): boolean {
    if (!available.value || !ctx.live() || pending.value) return false;
    const record = enabled.value;
    const before = observed.value,
      next = snapshot(items);
    if (same(before, next)) {
      ctx.send(items);
      return true;
    }
    if (before.length !== next.length) {
      clear();
      ctx.send(items);
      return true;
    }
    const patches: Patch[] = [];
    for (let index = 0; index < before.length; index++) {
      const previous = before[index],
        following = next[index];
      if (!following || following.id !== previous.id) {
        clear();
        ctx.send(items);
        return true;
      }
      const changed = fields.filter(
        (field) => !equalValue(previous[field], following[field]),
      );
      if (changed.length)
        patches.push({
          id: previous.id,
          fields: changed,
          before: Object.fromEntries(
            changed.map((field) => [field, copyValue(previous[field])]),
          ),
          after: Object.fromEntries(
            changed.map((field) => [field, copyValue(following[field])]),
          ),
        });
    }
    const entry: Entry = {
      info: { ...info, taskIds: patches.map((patch) => patch.id) },
      patches,
    };
    const ticket = ++version;
    expected = next;
    pending.value = true;
    ctx.send(items);
    void nextTick().then(() => {
      if (ticket !== version || !available.value || !ctx.live()) return;
      const accepted = same(observed.value, next);
      expected = undefined;
      pending.value = false;
      known = observed.value;
      if (!accepted || !record || !enabled.value) return;
      undoStack.value = [...undoStack.value, entry].slice(-limit.value);
      redoStack.value = [];
      message.value = "";
    });
    return true;
  }
  function invalid(
    action: "undo" | "redo",
    reason: HysGanttHistoryInvalid["reason"],
  ) {
    if (ctx.live() && available.value) ctx.invalid({ action, reason });
    message.value =
      reason === "rejected"
        ? "宿主未接受历史恢复请求"
        : reason === "disabled"
          ? "当前权限不允许恢复此操作"
          : reason === "busy"
            ? "上一项修改尚未完成"
            : reason === "stale"
              ? "排期已变化，无法恢复旧记录"
              : "没有可恢复的记录";
    return false;
  }
  async function replay(action: "undo" | "redo") {
    if (!available.value || !ctx.live()) return false;
    if (pending.value) return invalid(action, "busy");
    const from = action === "undo" ? undoStack : redoStack,
      to = action === "undo" ? redoStack : undoStack,
      entry = from.value.at(-1);
    if (!enabled.value) return invalid(action, "disabled");
    if (!entry) return invalid(action, "missing");
    if (!permitted(entry, action)) return invalid(action, "disabled");
    const current = new Map(ctx.items().map((item) => [item.id, item]));
    if (
      !entry.patches.every((patch) => {
        const item = current.get(patch.id),
          value = action === "undo" ? patch.after : patch.before;
        return (
          item &&
          patch.fields.every((field) => equalValue(item[field], value[field]))
        );
      })
    ) {
      clear();
      return invalid(action, "stale");
    }
    ctx.beforeReplay();
    const changes = new Map<Id, T>();
    for (const patch of entry.patches) {
      const item = { ...current.get(patch.id)! },
        value = action === "undo" ? patch.before : patch.after;
      for (const field of patch.fields) {
        if (field === "dependencies") {
          if (value.dependencies === undefined) delete item.dependencies;
          else item.dependencies = [...value.dependencies];
        } else item[field] = value[field] as string;
      }
      changes.set(patch.id, item);
    }
    const items = ctx.items().map((item) => changes.get(item.id) ?? item),
      next = snapshot(items),
      ticket = ++version;
    expected = next;
    pending.value = true;
    ctx.send(items);
    for (const item of changes.values()) ctx.change(item);
    await nextTick();
    if (ticket !== version || !available.value || !ctx.live()) return false;
    const accepted = same(observed.value, next);
    expected = undefined;
    pending.value = false;
    known = observed.value;
    if (!accepted) return invalid(action, "rejected");
    from.value = from.value.slice(0, -1);
    to.value = [...to.value, entry].slice(-limit.value);
    message.value =
      (action === "undo" ? "已撤销：" : "已重做：") + entry.info.label;
    ctx.replay(action, metadata(entry));
    return true;
  }
  function leave() {
    available.value = false;
    version++;
    expected = undefined;
    pending.value = false;
  }
  onDeactivated(leave);
  onBeforeUnmount(leave);
  onActivated(() => {
    available.value = true;
  });
  return {
    capture,
    clear,
    undo: () => replay("undo"),
    redo: () => replay("redo"),
    state,
    canUndo,
    canRedo,
    pending,
    enabled,
    message,
  };
}
