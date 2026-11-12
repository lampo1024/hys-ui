import { nextTick } from "vue";
import {
  feedback,
  makeDrag,
  preserved,
  proposeSort,
  sameItems,
  type SortCandidate,
  type SortPort,
  type SortProposal,
} from "./model";
import type {
  HysSortChange,
  HysSortDrag,
  HysSortFeedback,
  HysSortKey,
} from "./sortableList";

interface Change<T extends object> {
  port: SortPort<T>;
  previous: readonly T[];
  next: readonly T[];
}
interface Entry<T extends object> {
  changes: readonly Change<T>[];
  participants: readonly SortPort<T>[];
}
interface History<T extends object> {
  undo: Entry<T>[];
  redo: Entry<T>[];
}
const operations = new WeakMap<object, AbortController>();
const histories = new WeakMap<object, History<object>>();
const historyLimit = (value: boolean | number | undefined) =>
  value === false || value === 0
    ? 0
    : typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, Math.min(200, Math.floor(value)))
      : 20;
function historyOf<T extends object>(port: SortPort<T>) {
  let history = histories.get(port);
  if (!history) {
    history = { undo: [], redo: [] };
    histories.set(port, history);
  }
  return history as unknown as History<T>;
}
export const busySort = (port: object) => operations.has(port);
export const abortSort = (port: object) => operations.get(port)?.abort();

export function discardSortHistory<T extends object>(port: SortPort<T>) {
  const current = historyOf(port);
  const entries = new Set([...current.undo, ...current.redo]);
  for (const entry of entries) {
    for (const participant of entry.participants) {
      const history = historyOf(participant);
      history.undo = history.undo.filter((item) => item !== entry);
      history.redo = history.redo.filter((item) => item !== entry);
    }
  }
  histories.delete(port);
}

function resetRedo<T extends object>(ports: readonly SortPort<T>[]) {
  for (const port of ports) {
    const redo = historyOf(port).redo;
    for (const entry of redo.slice()) {
      for (const participant of entry.participants) {
        const stack = historyOf(participant).redo;
        const index = stack.indexOf(entry);
        if (index !== -1) stack.splice(index, 1);
      }
    }
  }
}

function record<T extends object>(entry: Entry<T>) {
  resetRedo(entry.participants);
  for (const port of entry.participants) {
    const limit = historyLimit(port.props.history);
    if (!limit) continue;
    const stack = historyOf(port).undo;
    stack.push(entry);
    stack.splice(0, Math.max(0, stack.length - limit));
  }
}

function restoreOrder<T extends object>(
  port: SortPort<T>,
  keys: readonly HysSortKey[],
) {
  const current = port.data();
  if (!current.valid) return current.items;
  const fixed = new Set(current.fixed.map((item) => item.key));
  const order = new Map(keys.map((key, index) => [key, index]));
  const sortable = (item: T) =>
    order.has(port.key(item)) && !fixed.has(port.key(item));
  const ordered = current.items
    .filter(sortable)
    .sort((a, b) => order.get(port.key(a))! - order.get(port.key(b))!);
  let cursor = 0;
  const next = current.items.map((item) =>
    sortable(item) ? ordered[cursor++] : item,
  );
  return preserved(port, next) ? next : current.items;
}

export function restoreStoredSort<T extends object>(port: SortPort<T>) {
  const key = port.props.storageKey;
  if (!key) return;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!Array.isArray(saved)) return;
    const next = restoreOrder(port, saved);
    if (!sameItems(port.data().items, next)) port.apply(next.slice());
  } catch {
    // Storage can be unavailable in sandboxed or private browsing contexts.
  }
}

function persistSort<T extends object>(changes: readonly Change<T>[]) {
  for (const { port, next } of changes) {
    const key = port.props.storageKey;
    if (!key) continue;
    try {
      localStorage.setItem(key, JSON.stringify(next.map(port.key)));
    } catch (error) {
      port.reject(feedback("save", undefined, "无法保存本地排序记录", error));
    }
  }
}

const matches = <T extends object>(
  changes: readonly Change<T>[],
  side: "previous" | "next",
) =>
  changes.every((change) => sameItems(change.port.data().items, change[side]));
const payload = <T extends object>(
  changes: readonly Change<T>[],
  action: HysSortChange<T>["action"],
  proposal?: HysSortChange<T>["proposal"],
): HysSortChange<T> => ({
  action,
  proposal,
  lists: changes.map(({ port, previous, next }) => ({
    id: port.id(),
    previous: previous.slice(),
    next: next.slice(),
  })),
});
function report<T extends object>(
  ports: readonly SortPort<T>[],
  problem: HysSortFeedback<T>,
) {
  for (const port of ports) port.reject(problem);
  return false;
}

async function rollback<T extends object>(
  changes: readonly Change<T>[],
  ports: readonly SortPort<T>[],
  proposal?: HysSortChange<T>["proposal"],
) {
  if (!changes.length) return true;
  const reversed = changes.map(({ port, next, previous }) => ({
    port,
    previous: next,
    next: previous,
  }));
  for (const change of reversed) change.port.apply(change.next.slice());
  await nextTick();
  const event = payload(reversed, "rollback", proposal);
  for (const port of ports) port.change(event);
  return matches(reversed, "next");
}

async function abortable<T>(work: () => T | Promise<T>, signal: AbortSignal) {
  if (signal.aborted) throw Error("操作已取消");
  let listener: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    listener = () => reject(Error("操作已取消"));
    signal.addEventListener("abort", listener, { once: true });
  });
  try {
    return await Promise.race([Promise.resolve().then(work), cancelled]);
  } finally {
    signal.removeEventListener("abort", listener);
  }
}

async function transact<T extends object>(
  entry: Entry<T>,
  action: HysSortChange<T>["action"],
  proposal?: HysSortChange<T>["proposal"],
  validate?: () => HysSortFeedback<T> | undefined,
  onApplied?: () => void,
) {
  const { participants: ports, changes } = entry;
  const source = ports[0];
  if (ports.some((port) => busySort(port) || !port.root()))
    return report([source], feedback("conflict", proposal));
  if (ports.some((port) => port.props.disabled))
    return report([source], feedback("disabled", proposal));
  if (!matches(changes, "previous"))
    return report(ports, feedback("conflict", proposal));
  const controller = new AbortController();
  for (const port of ports) {
    operations.set(port, controller);
    port.lock(true);
  }
  let applied = false;
  try {
    if (proposal) {
      for (const port of ports) {
        const hook = port.props.beforeDrop;
        if (!hook) continue;
        const decision = await abortable(
          () => hook(proposal, controller.signal),
          controller.signal,
        );
        if (controller.signal.aborted)
          return report(ports, feedback("cancelled", proposal));
        if (decision === false || typeof decision === "string")
          return report(
            ports,
            feedback(
              "rule",
              proposal,
              typeof decision === "string" ? decision : undefined,
            ),
          );
      }
    }
    if (controller.signal.aborted)
      return report(ports, feedback("cancelled", proposal));
    if (
      !matches(changes, "previous") ||
      ports.some((port) => port.props.disabled)
    )
      return report(ports, feedback("conflict", proposal));
    const issue = validate?.();
    if (issue) return report(ports, issue);
    for (const change of changes) change.port.apply(change.next.slice());
    applied = true;
    await nextTick();
    if (!matches(changes, "next")) {
      const unchanged = changes.every(
        (change) =>
          sameItems(change.port.data().items, change.previous) ||
          sameItems(change.port.data().items, change.next),
      );
      if (unchanged)
        await rollback(
          changes.filter((change) =>
            sameItems(change.port.data().items, change.next),
          ),
          ports,
          proposal,
        );
      return report(ports, feedback("conflict", proposal));
    }
    onApplied?.();
    const event = payload(changes, action, proposal);
    // A cross-list save uses one callback with both snapshots, so the host can write them atomically.
    const save = ports.find((port) => port.props.save)?.props.save;
    if (
      save &&
      (await abortable(
        () => save(event, controller.signal),
        controller.signal,
      )) === false
    )
      throw Error("保存请求被拒绝");
    if (controller.signal.aborted) throw Error("操作已取消");
    if (!matches(changes, "next"))
      return report(ports, feedback("conflict", proposal));
    persistSort(changes);
    for (const port of ports) port.change(event);
    return true;
  } catch (error) {
    if (
      applied &&
      (!matches(changes, "next") || !(await rollback(changes, ports, proposal)))
    )
      return report(ports, feedback("conflict", proposal, undefined, error));
    const reason = controller.signal.aborted
      ? "cancelled"
      : applied
        ? "save"
        : "rule";
    return report(ports, feedback(reason, proposal, undefined, error));
  } finally {
    for (const port of ports) {
      operations.delete(port);
      port.lock(false);
    }
  }
}

export async function commitSort<T extends object>(
  source: SortPort<T>,
  drag: HysSortDrag<T>,
  candidate: SortCandidate<T>,
  onLanding?: (row?: HTMLElement) => void,
) {
  let result: SortProposal<T> | HysSortFeedback<T>;
  try {
    const fresh = makeDrag(source, drag.keys, drag.source);
    if ("reason" in fresh) return report([source], fresh);
    if (!sameItems(fresh.items, drag.items))
      return report([source], feedback("conflict"));
    result = proposeSort(source, fresh, candidate, true);
  } catch (error) {
    return report(
      [source],
      feedback(
        "rule",
        undefined,
        error instanceof Error ? error.message : undefined,
        error,
      ),
    );
  }
  if ("reason" in result) return report([source], result);
  const participants =
    result.source === result.target ? [source] : [source, result.target];
  const entry = {
    participants,
    changes: result.changes.map((change) => ({
      ...change,
      previous: change.previous.slice(),
      next: change.next.slice(),
    })),
  };
  const original = result.proposal;
  const target = result.target;
  const landingItem =
    original.operation === "move"
      ? drag.items[0]
      : result.changes.find((change) => change.port === target)?.next[
          original.index
        ];
  const needsValidation = participants.some((port) => !!port.props.beforeDrop);
  if (
    !(await transact(
      entry,
      "sort",
      original,
      needsValidation
        ? () => {
            const latest = makeDrag(source, drag.keys, drag.source);
            if ("reason" in latest) return latest;
            if (!sameItems(latest.items, drag.items))
              return feedback("conflict", original);
            const checked = proposeSort(source, latest, candidate);
            if ("reason" in checked) return checked;
            if (
              checked.proposal.index !== original.index ||
              checked.proposal.operation !== original.operation ||
              checked.proposal.mode !== original.mode
            )
              return feedback("conflict", original);
          }
        : undefined,
      onLanding &&
        (() =>
          onLanding(
            landingItem ? target.row(target.key(landingItem)) : undefined,
          )),
    ))
  )
    return false;
  record(entry);
  const targetList = result.target.data();
  const index =
    result.proposal.operation === "move"
      ? targetList.keys.get(result.target.key(drag.items[0]))
      : result.proposal.index;
  const announcement =
    drag.items.length > 1
      ? `已排序 ${drag.items.length} 项`
      : `已将${source.label(drag.items[0])}放到第 ${(index ?? 0) + 1} 项`;
  source.announce(announcement);
  if (
    drag.source !== "pointer" &&
    index !== undefined &&
    targetList.items[index]
  )
    await result.target.focus(result.target.key(targetList.items[index]));
  return true;
}

export async function navigateHistory<T extends object>(
  port: SortPort<T>,
  action: "undo" | "redo",
) {
  const entry = historyOf(port)[action].at(-1);
  if (!entry || !historyLimit(port.props.history)) return false;
  if (
    entry.participants.some((participant) => {
      const stack = historyOf(participant)[action];
      return stack.includes(entry) && stack.at(-1) !== entry;
    })
  )
    return report([port], feedback("conflict"));
  const changes =
    action === "redo"
      ? entry.changes
      : entry.changes.map((change) => ({
          ...change,
          previous: change.next,
          next: change.previous,
        }));
  for (const change of changes) {
    if (!preserved(change.port, change.next))
      return report([port], feedback("fixed"));
    if (
      change.next.length > change.previous.length &&
      change.next.length > (change.port.props.maxItems ?? Infinity)
    )
      return report([port], feedback("capacity"));
  }
  if (!(await transact({ ...entry, changes }, action))) return false;
  for (const participant of entry.participants) {
    const history = historyOf(participant);
    if (history[action].at(-1) !== entry) continue;
    history[action].pop();
    history[action === "undo" ? "redo" : "undo"].push(entry);
  }
  port.announce(action === "undo" ? "已撤销排序" : "已重做排序");
  return true;
}

export async function resetSort<T extends object>(
  port: SortPort<T>,
  initial: readonly T[],
) {
  const previous = port.data().items.slice();
  const next = restoreOrder(port, initial.map(port.key));
  if (sameItems(previous, next)) return false;
  const entry = { participants: [port], changes: [{ port, previous, next }] };
  if (!(await transact(entry, "reset"))) return false;
  record(entry);
  port.announce("已恢复初始顺序");
  return true;
}

export function keysArray(keys: HysSortKey | readonly HysSortKey[]) {
  return typeof keys === "string" || typeof keys === "number" ? [keys] : keys;
}
