import type { HysPopupTransition } from '../motion/popup';
import type { CSSProperties, VNodeChild } from "vue";
export type HysTreeKey = string | number;
export type HysTreeValue = HysTreeKey | readonly HysTreeKey[] | null;
export interface HysTreeNode<K extends HysTreeKey = HysTreeKey> {
  id: K;
  label: string;
  children?: HysTreeNode<K>[];
  disabled?: boolean;
  disableCheckbox?: boolean;
  selectable?: boolean;
  checkable?: boolean;
  icon?: string;
  hasChildren?: boolean;
  isLeaf?: boolean;
  loading?: boolean;
}
/** Existing string-key node type remains available. */
export type TreeNode = HysTreeNode<string>;
export type HysTreeDropPosition = "before" | "inside" | "after";
export interface HysTreeFieldNames {
  id: string;
  label: string;
  children: string;
  disabled: string;
  disableCheckbox: string;
  selectable: string;
  checkable: string;
  icon: string;
  hasChildren: string;
  isLeaf: string;
}
export interface HysTreeLoadContext {
  signal: AbortSignal;
  key: HysTreeKey;
}
export interface HysTreeLocale {
  search: string;
  empty: string;
  noMatch: string;
  loading: string;
  retry: string;
  loadError: string;
  expand: string;
  collapse: string;
  check: string;
  select: string;
  clear: string;
  close: string;
  tree: string;
}
export interface HysTreeRecord<N extends object> {
  key: HysTreeKey;
  node: N;
  label: string;
  parent?: HysTreeKey;
  children: HysTreeKey[];
  depth: number;
  index: number;
  pos: number;
  size: number;
  disabled: boolean;
  checkboxDisabled: boolean;
  selectable: boolean;
  checkable: boolean;
  leaf: boolean;
  hasChildren: boolean;
  icon: unknown;
}
export interface HysTreeCheckInfo<N extends object> {
  node?: N;
  checked?: boolean;
  checkedKeys: HysTreeKey[];
  checkedNodes: N[];
  halfCheckedKeys: HysTreeKey[];
  halfCheckedNodes: N[];
  event?: Event;
}
export interface HysTreeSelectInfo<N extends object> {
  node: N | null;
  selected: boolean;
  selectedKeys: HysTreeKey[];
  selectedNodes: N[];
  event?: Event;
}
export interface HysTreeDropInfo<
  N extends object,
  K extends HysTreeKey = HysTreeKey,
> {
  dragId: K;
  targetId: K;
  position: HysTreeDropPosition;
  dragNode: N;
  targetNode: N;
  event: DragEvent;
}
export interface HysTreeNodeContext<N extends object> {
  node: N;
  key: HysTreeKey;
  label: string;
  depth: number;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  loading: boolean;
  leaf: boolean;
}
export interface HysTreeProps<
  N extends object = TreeNode,
  V extends HysTreeValue = HysTreeValue,
> {
  popupTransition?: HysPopupTransition;
  popupTransitionDuration?: number;
  nodes: readonly N[];
  modelValue?: V;
  defaultValue?: V;
  checkedKeys?: readonly HysTreeKey[];
  defaultCheckedKeys?: readonly HysTreeKey[];
  halfCheckedKeys?: readonly HysTreeKey[];
  expandedKeys?: readonly HysTreeKey[];
  defaultExpandedKeys?: readonly HysTreeKey[];
  loadedKeys?: readonly HysTreeKey[];
  multiple?: boolean;
  selectable?: boolean;
  checkable?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  inheritDisabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  defaultExpandAll?: boolean;
  autoExpandParent?: boolean;
  accordion?: boolean;
  expandOnClickNode?: boolean;
  expandOnDoubleClick?: boolean;
  checkOnClickNode?: boolean;
  checkOnClickLeaf?: boolean;
  selectOnClickNode?: boolean;
  allowDeselect?: boolean;
  highlightCurrent?: boolean;
  fieldNames?: Partial<HysTreeFieldNames>;
  nodeKey?: string | ((node: N) => HysTreeKey);
  showLine?: boolean;
  showIcon?: boolean;
  indent?: number;
  blockNode?: boolean;
  virtual?: boolean;
  rowHeight?: number;
  viewportHeight?: number;
  overscan?: number;
  draggable?: boolean;
  dragExpandDelay?: number;
  allowDrag?: (node: N) => boolean;
  allowDrop?: (drag: N, target: N, position: HysTreeDropPosition) => boolean;
  contextMenu?: boolean;
  checkStrictly?: boolean;
  searchValue?: string;
  defaultSearchValue?: string;
  searchPlaceholder?: string;
  filterNode?: (query: string, node: N) => boolean;
  filterMode?: "hide" | "highlight";
  showMatchedChildren?: boolean;
  emptyText?: string;
  ariaLabel?: string;
  locale?: Partial<HysTreeLocale>;
  loadChildren?: (
    node: N,
    context: HysTreeLoadContext,
  ) => Promise<readonly N[]>;
  renderContent?: (context: HysTreeNodeContext<N>) => VNodeChild;
  nodeClass?: string | ((node: N) => string | undefined);
  nodeStyle?: CSSProperties | ((node: N) => CSSProperties | undefined);
  validateEvent?: boolean;
}
export interface HysTreeInstance<N extends object = TreeNode> {
  readonly element: HTMLElement | undefined;
  getNode: (key: HysTreeKey | N) => N | undefined;
  getNodeInfo: (key: HysTreeKey | N) => HysTreeRecord<N> | undefined;
  getCheckedKeys: (leafOnly?: boolean) => HysTreeKey[];
  getCheckedNodes: (leafOnly?: boolean, includeHalfChecked?: boolean) => N[];
  getHalfCheckedKeys: () => HysTreeKey[];
  getHalfCheckedNodes: () => N[];
  setCheckedKeys: (
    keys: readonly HysTreeKey[],
    leafOnly?: boolean,
  ) => Promise<boolean>;
  setCheckedNodes: (
    nodes: readonly N[],
    leafOnly?: boolean,
  ) => Promise<boolean>;
  setChecked: (
    key: HysTreeKey | N,
    checked: boolean,
    deep?: boolean,
  ) => Promise<boolean>;
  getCurrentKey: () => HysTreeKey | null;
  getCurrentNode: () => N | null;
  getSelectedKeys: () => HysTreeKey[];
  setCurrentKey: (
    key: HysTreeKey | null,
    expandParents?: boolean,
  ) => Promise<boolean>;
  setCurrentNode: (node: N | null, expandParents?: boolean) => Promise<boolean>;
  setSelectedKeys: (keys: readonly HysTreeKey[]) => Promise<boolean>;
  getExpandedKeys: () => HysTreeKey[];
  setExpandedKeys: (keys: readonly HysTreeKey[]) => Promise<boolean>;
  expandNode: (key: HysTreeKey, expanded?: boolean) => Promise<boolean>;
  expandAll: () => Promise<boolean>;
  collapseAll: () => Promise<boolean>;
  filter: (value: string) => void;
  reloadNode: (key: HysTreeKey) => Promise<boolean>;
  updateKeyChildren: (
    key: HysTreeKey,
    children: readonly N[],
  ) => Promise<boolean>;
  append: (node: N, parent?: HysTreeKey | N) => Promise<boolean>;
  insertBefore: (node: N, reference: HysTreeKey | N) => Promise<boolean>;
  insertAfter: (node: N, reference: HysTreeKey | N) => Promise<boolean>;
  remove: (key: HysTreeKey | N) => Promise<boolean>;
  scrollTo: (options: {
    key?: HysTreeKey;
    top?: number;
    align?: "top" | "bottom" | "auto";
    offset?: number;
    behavior?: ScrollBehavior;
  }) => Promise<void>;
  focus: (key?: HysTreeKey) => Promise<void>;
}
export const treeLocale: HysTreeLocale = {
  search: "搜索节点…",
  empty: "暂无数据",
  noMatch: "无匹配节点",
  loading: "加载中",
  retry: "重试",
  loadError: "加载失败",
  expand: "展开",
  collapse: "折叠",
  check: "勾选",
  select: "选择节点",
  clear: "清除选择",
  close: "关闭",
  tree: "树形列表",
};
export const treeKey = (v: unknown): v is HysTreeKey =>
  typeof v === "string" || (typeof v === "number" && Number.isFinite(v));
export const treeKeys = (v: readonly HysTreeKey[]) => [
  ...new Set(v.filter(treeKey)),
];
export function treeField(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (v, k) =>
        v != null && Object.prototype.hasOwnProperty.call(Object(v), k)
          ? (v as Record<string, unknown>)[k]
          : undefined,
      value,
    );
}
export function treeAssign<N extends object>(
  node: N,
  path: string,
  value: unknown,
): N {
  const keys = path.split(".");
  if (keys.some((k) => ["__proto__", "constructor", "prototype"].includes(k)))
    return node;
  const result = { ...node } as Record<string, unknown>;
  let at = result,
    source = node as Record<string, unknown>;
  for (const k of keys.slice(0, -1)) {
    const next = source?.[k];
    at[k] = Array.isArray(next)
      ? [...next]
      : next && typeof next === "object"
        ? { ...next }
        : {};
    at = at[k] as Record<string, unknown>;
    source = next as Record<string, unknown>;
  }
  at[keys.at(-1)!] = value;
  return result as N;
}
export function treeFields<N extends object>(props: HysTreeProps<N>) {
  return {
    id: "id",
    label: "label",
    children: "children",
    disabled: "disabled",
    disableCheckbox: "disableCheckbox",
    selectable: "selectable",
    checkable: "checkable",
    icon: "icon",
    hasChildren: "hasChildren",
    isLeaf: "isLeaf",
    ...props.fieldNames,
  };
}
export function treeIndex<N extends object>(
  nodes: readonly N[],
  props: HysTreeProps<N>,
  asyncChildren: Map<HysTreeKey, readonly N[]> = new Map(),
) {
  const fields = treeFields(props),
    map = new Map<HysTreeKey, HysTreeRecord<N>>(),
    rows: HysTreeRecord<N>[] = [],
    roots: HysTreeKey[] = [];
  const stack: { nodes: readonly N[]; parent?: HysTreeRecord<N> }[] = [
    { nodes },
  ];
  let invalid = false;
  while (stack.length) {
    const group = stack.pop()!,
      valid: HysTreeRecord<N>[] = [];
    for (const node of group.nodes) {
      if (!node || typeof node !== "object") {
        invalid = true;
        continue;
      }
      const key =
        typeof props.nodeKey === "function"
          ? props.nodeKey(node)
          : treeField(
              node,
              typeof props.nodeKey === "string" ? props.nodeKey : fields.id,
            );
      if (!treeKey(key) || map.has(key)) {
        invalid = true;
        continue;
      }
      const rawChildren =
          asyncChildren.get(key) ?? treeField(node, fields.children),
        children = Array.isArray(rawChildren) ? rawChildren : [],
        disabled =
          !!treeField(node, fields.disabled) ||
          !!(props.inheritDisabled && group.parent?.disabled),
        leaf = treeField(node, fields.isLeaf) === true;
      const record: HysTreeRecord<N> = {
        key,
        node,
        label: String(treeField(node, fields.label) ?? key),
        parent: group.parent?.key,
        children: [],
        depth: group.parent ? group.parent.depth + 1 : 0,
        index: 0,
        pos: valid.length + 1,
        size: 0,
        disabled,
        checkboxDisabled: disabled || !!treeField(node, fields.disableCheckbox),
        checkable: treeField(node, fields.checkable) !== false,
        selectable: treeField(node, fields.selectable) !== false,
        leaf,
        hasChildren:
          !leaf &&
          !!(
            children.length ||
            (!asyncChildren.has(key) && treeField(node, fields.hasChildren))
          ),
        icon: treeField(node, fields.icon),
      };
      map.set(key, record);
      valid.push(record);
      (group.parent?.children ?? roots).push(key);
    }
    for (const record of valid) record.size = valid.length;
    // Push siblings in reverse, preserving source preorder without recursive calls.
    for (let i = valid.length - 1; i >= 0; i--) {
      const record = valid[i],
        raw =
          asyncChildren.get(record.key) ??
          treeField(record.node, fields.children);
      stack.push({
        nodes: record.leaf ? [] : Array.isArray(raw) ? raw : [],
        parent: record,
      });
    }
  }
  const pending = [...roots].reverse();
  while (pending.length) {
    const record = map.get(pending.pop()!)!;
    record.index = rows.length;
    rows.push(record);
    for (let i = record.children.length - 1; i >= 0; i--)
      pending.push(record.children[i]);
  }
  return { map, rows, roots, fields, invalid };
}
