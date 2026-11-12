import { toRaw } from "vue";
import type {
  HysSortChange,
  HysSortDecision,
  HysSortDrag,
  HysSortFeedback,
  HysSortFixed,
  HysSortGroup,
  HysSortKey,
  HysSortOperation,
  HysSortPosition,
  HysSortPreview,
  HysSortProposal,
  HysSortReason,
  HysSortSource,
  HysSortableListProps,
} from "./sortableList";

export interface SortIndex<T extends object> {
  keys: Map<HysSortKey, number>;
  fixed: { key: HysSortKey; index: number; placement: HysSortFixed }[];
  items: readonly T[];
  valid: boolean;
}

export interface SortPort<T extends object> {
  id: () => string;
  props: HysSortableListProps<T>;
  root: () => HTMLElement | undefined;
  surface: () => HTMLElement | undefined;
  data: () => SortIndex<T>;
  key: (item: T) => HysSortKey;
  label: (item: T) => string;
  row: (key: HysSortKey) => HTMLElement | undefined;
  apply: (items: T[]) => void;
  focus: (key: HysSortKey) => Promise<boolean>;
  scroll: (key: HysSortKey) => Promise<boolean>;
  lock: (busy: boolean) => void;
  start: (drag: HysSortDrag<T>) => void;
  preview: (preview: HysSortPreview<T> | null) => void;
  change: (change: HysSortChange<T>) => void;
  reject: (feedback: HysSortFeedback<T>) => void;
  announce: (message: string) => void;
}

export interface SortCandidate<T extends object> {
  port: SortPort<T>;
  index: number;
  position: HysSortPosition;
  anchor?: HysSortKey;
  operation?: HysSortOperation;
}

export interface SortProposal<T extends object> {
  source: SortPort<T>;
  target: SortPort<T>;
  proposal: HysSortProposal<T>;
  changes: { port: SortPort<T>; previous: readonly T[]; next: T[] }[];
}

const ports = new Map<HTMLElement, SortPort<object>>();
const typed = <T extends object>(port: SortPort<object>) =>
  port as unknown as SortPort<T>;
export function registerSortPort<T extends object>(
  element: HTMLElement,
  port: SortPort<T>,
) {
  ports.set(element, port as unknown as SortPort<object>);
  return () => {
    ports.delete(element);
  };
}
export const sortPorts = <T extends object>() =>
  Array.from(ports.values(), typed<T>);
export function portAt<T extends object>(element: Element | null) {
  const surface = element?.closest<HTMLElement>("[data-sort-root]");
  const port = surface && ports.get(surface);
  return port ? typed<T>(port) : undefined;
}

export const groupOf = <T extends object>(
  port: SortPort<T>,
): HysSortGroup<T> | undefined => {
  const group = port.props.group;
  return typeof group === "string" ? { name: group } : group;
};
export function linkedPorts<T extends object>(port: SortPort<T>) {
  const group = groupOf(port);
  if (!group) return [port];
  const document = port.root()?.ownerDocument;
  return sortPorts<T>().filter((item) => {
    if (item === port) return true;
    const other = groupOf(item);
    if (
      !other ||
      item.root()?.ownerDocument !== document ||
      !item.root()?.isConnected
    )
      return false;
    return (
      other.name === group.name ||
      other.put === true ||
      typeof other.put === "function" ||
      (Array.isArray(other.put) && other.put.includes(group.name))
    );
  });
}
const listOf = <T extends object>(port: SortPort<T>) => ({
  id: port.id(),
  group: groupOf(port)?.name,
  items: port.data().items,
});

export const keyToken = (key: HysSortKey) =>
  typeof key === "number" ? `n:${key}` : `s:${key}`;
export const layoutOf = (
  props: Pick<HysSortableListProps, "layout" | "listTag">,
) => (props.listTag === "table" ? "vertical" : (props.layout ?? "vertical"));
const validKey = (key: unknown) =>
  typeof key === "string" || (typeof key === "number" && Number.isFinite(key));
export function buildSortIndex<T extends object>(
  items: readonly T[],
  keyOf: (item: T) => HysSortKey,
  fixed: HysSortableListProps<T>["fixed"],
): SortIndex<T> {
  const keys = new Map<HysSortKey, number>();
  const pinned: SortIndex<T>["fixed"] = [];
  const fixedKeys = Array.isArray(fixed) ? new Set(fixed) : undefined;
  items.forEach((item, index) => {
    const key = keyOf(item);
    if (validKey(key)) keys.set(key, index);
    const placement =
      typeof fixed === "function" ? fixed(item, index) : fixedKeys?.has(key);
    if (placement) pinned.push({ key, index, placement });
  });
  return { keys, fixed: pinned, items, valid: keys.size === items.length };
}

const messages: Record<HysSortReason, string> = {
  cancelled: "已取消排序",
  outside: "请放到可排序区域内",
  disabled: "该项目或列表已禁用排序",
  keys: "项目键缺失或重复",
  group: "这两个列表不允许此操作",
  capacity: "目标列表已满",
  fixed: "不能改变固定项目的位置",
  cycle: "不能将项目移动到自己的子列表",
  noop: "顺序没有变化",
  rule: "不符合排序规则",
  conflict: "列表已更新，请重新操作",
  save: "保存排序失败",
};
export function feedback<T extends object>(
  reason: HysSortReason,
  proposal?: HysSortProposal<T>,
  message = messages[reason],
  error?: unknown,
): HysSortFeedback<T> {
  return { reason, proposal, message, error };
}
const denied = (value: HysSortDecision) =>
  value === false || typeof value === "string";

export function dragIssue<T extends object>(
  port: SortPort<T>,
  item: T,
  index: number,
) {
  if (port.props.disabled) return feedback<T>("disabled");
  if (!port.data().valid) return feedback<T>("keys");
  const key = port.key(item);
  const disabled = port.props.itemDisabled;
  if (
    typeof disabled === "function"
      ? disabled(item, index)
      : disabled?.includes(key)
  )
    return feedback<T>("disabled");
  if (port.data().fixed.some((entry) => entry.key === key))
    return feedback<T>("fixed");
  const permission = port.props.canDrag?.(item, index);
  if (denied(permission))
    return feedback<T>(
      "rule",
      undefined,
      typeof permission === "string" ? permission : undefined,
    );
}

export function makeDrag<T extends object>(
  port: SortPort<T>,
  keys: readonly HysSortKey[],
  source: HysSortSource,
): HysSortDrag<T> | HysSortFeedback<T> {
  const data = port.data();
  if (!data.valid) return feedback("keys");
  const indices = Array.from(
    new Set(keys),
    (key) => data.keys.get(key) ?? -1,
  ).sort((a, b) => a - b);
  if (!indices.length || indices[0] < 0) return feedback("conflict");
  for (const index of indices) {
    const issue = dragIssue(port, data.items[index], index);
    if (issue) return issue;
  }
  return {
    source,
    from: listOf(port),
    indices,
    items: indices.map((index) => data.items[index]),
    keys: indices.map((index) => port.key(data.items[index])),
  };
}

function allowedOperation<T extends object>(
  source: SortPort<T>,
  target: SortPort<T>,
  proposal: HysSortProposal<T>,
  requested?: HysSortOperation,
): HysSortOperation | HysSortFeedback<T> {
  if (source === target)
    return requested && requested !== "move"
      ? feedback("group", proposal)
      : "move";
  const from = groupOf(source);
  const to = groupOf(target);
  if (!from?.name || !to?.name) return feedback("group", proposal);
  const pull =
    typeof from.pull === "function" ? from.pull(proposal) : from.pull;
  if (pull === false) return feedback("group", proposal);
  const operation = typeof pull === "string" ? pull : "move";
  if (requested && requested !== operation) return feedback("group", proposal);
  const full = { ...proposal, operation };
  if (typeof to.put === "function") {
    const permission = to.put(full);
    return denied(permission)
      ? feedback(
          "group",
          full,
          typeof permission === "string" ? permission : undefined,
        )
      : operation;
  }
  const allowed = Array.isArray(to.put)
    ? to.put.includes(from.name)
    : to.put === true || (to.put !== false && from.name === to.name);
  return allowed ? operation : feedback("group", full);
}

export function preserved<T extends object>(
  port: SortPort<T>,
  next: readonly T[],
) {
  const fixed = port.data().fixed;
  if (!fixed.length) return true;
  const positions = new Map(next.map((item, index) => [port.key(item), index]));
  const top = fixed.filter((entry) => entry.placement === "top");
  const bottom = fixed.filter((entry) => entry.placement === "bottom");
  return (
    top.every((entry, i) => positions.get(entry.key) === i) &&
    bottom.every(
      (entry, i) =>
        positions.get(entry.key) === next.length - bottom.length + i,
    ) &&
    fixed.every(
      (entry) =>
        entry.placement !== true || positions.get(entry.key) === entry.index,
    )
  );
}

export const sameItems = <T>(left: readonly T[], right: readonly T[]) =>
  left.length === right.length &&
  left.every((item, index) => toRaw(item) === toRaw(right[index]));

function swap<T>(items: readonly T[], indices: readonly number[], at: number) {
  const destinations = indices.map((_, i) => at + i);
  if (
    destinations.some(
      (index) => index >= items.length || indices.includes(index),
    )
  )
    return undefined;
  const next = items.slice();
  indices.forEach((index, i) => {
    next[index] = items[destinations[i]];
    next[destinations[i]] = items[index];
  });
  return next;
}

let copySequence = 0;
function copyItems<T extends object>(
  source: SortPort<T>,
  target: SortPort<T>,
  proposal: HysSortProposal<T>,
) {
  const custom = source.props.clone ?? target.props.clone;
  const used = new Set([
    ...target.data().keys.keys(),
    ...source.data().keys.keys(),
  ]);
  const prop = target.props.itemKey ?? "id";
  return proposal.items.map((item) => {
    let copy: T;
    if (custom) copy = custom(item, proposal);
    else {
      if (typeof prop === "function")
        throw Error("函数形式的 itemKey 需要 clone 回调生成新键");
      const raw = toRaw(item);
      copy = proposal.operation === "clone" ? structuredClone(raw) : { ...raw };
      const original = target.key(item);
      let key: HysSortKey;
      do {
        copySequence++;
        key =
          typeof original === "number"
            ? -copySequence
            : `${original}-copy-${copySequence}`;
      } while (used.has(key));
      Object.assign(copy, { [prop]: key });
    }
    const key = target.key(copy);
    if (!validKey(key) || used.has(key))
      throw Error("复制项目必须提供新的唯一键");
    used.add(key);
    return copy;
  });
}

export function proposeSort<T extends object>(
  source: SortPort<T>,
  drag: HysSortDrag<T>,
  candidate: SortCandidate<T>,
  commit = false,
): SortProposal<T> | HysSortFeedback<T> {
  const target = candidate.port;
  const from = source.data().items;
  const to = target.data().items;
  const local = source === target;
  const mode = local ? (target.props.mode ?? "insert") : "insert";
  const proposal: HysSortProposal<T> = {
    ...drag,
    from: listOf(source),
    to: listOf(target),
    index: candidate.index,
    position: candidate.position,
    targetItem:
      candidate.anchor === undefined
        ? undefined
        : to[target.data().keys.get(candidate.anchor) ?? -1],
    operation: candidate.operation ?? "move",
    mode,
  };
  if (target.props.disabled) return feedback("disabled", proposal);
  if (!source.data().valid || !target.data().valid)
    return feedback("keys", proposal);
  if (
    !local &&
    drag.keys.some((key) => source.row(key)?.contains(target.root() ?? null))
  )
    return feedback("cycle", proposal);
  const operation = allowedOperation(
    source,
    target,
    proposal,
    candidate.operation,
  );
  if (typeof operation !== "string") return operation;
  proposal.operation = operation;
  proposal.index = target.props.resolveIndex?.(proposal) ?? proposal.index;
  const { index } = proposal;
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index > to.length ||
    (mode === "swap" && index === to.length)
  )
    return feedback("outside", proposal);
  if (
    !local &&
    to.length + drag.items.length > (target.props.maxItems ?? Infinity)
  )
    return feedback("capacity", proposal);
  const rules = local ? [source] : [source, target];
  for (const port of rules) {
    const decision = port.props.canDrop?.(proposal);
    if (denied(decision))
      return feedback(
        "rule",
        proposal,
        typeof decision === "string" ? decision : undefined,
      );
  }
  const indices = new Set(drag.indices);
  const remaining = from.filter((_, i) => !indices.has(i));
  if (local) {
    const next = mode === "swap" ? swap(from, drag.indices, index) : remaining;
    if (!next) return feedback("noop", proposal);
    if (mode === "insert")
      next.splice(
        index - drag.indices.filter((i) => i < index).length,
        0,
        ...drag.items,
      );
    if (sameItems(from, next)) return feedback("noop", proposal);
    if (!preserved(source, next)) return feedback("fixed", proposal);
    return {
      source,
      target,
      proposal,
      changes: [{ port: source, previous: from, next }],
    };
  }
  const added =
    operation === "move" || !commit
      ? drag.items
      : copyItems(source, target, proposal);
  if (operation === "move" || commit) {
    const keys = added.map(target.key);
    if (
      new Set(keys).size !== keys.length ||
      keys.some((key) => !validKey(key) || target.data().keys.has(key))
    )
      return feedback("keys", proposal);
  }
  const next = to.slice();
  next.splice(index, 0, ...added);
  if (
    !preserved(target, next) ||
    (operation === "move" && !preserved(source, remaining))
  )
    return feedback("fixed", proposal);
  const changes = [{ port: target, previous: to, next }];
  if (operation === "move")
    changes.unshift({ port: source, previous: from, next: remaining });
  return { source, target, proposal, changes };
}
