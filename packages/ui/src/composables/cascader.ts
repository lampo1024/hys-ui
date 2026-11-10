import type { HysPopupTransition } from '../motion/popup';
import type { CSSProperties, VNodeChild } from "vue";
import { treeField, treeKey, type HysTreeKey } from "./tree";
import type { Placement } from "./useFloating";
export type HysCascaderKey = HysTreeKey;
export type HysCascaderPath = readonly HysCascaderKey[];
export type HysCascaderValue =
  HysCascaderKey | HysCascaderPath | readonly HysCascaderPath[] | null;
export interface HysCascaderDataNode<
  K extends HysCascaderKey = HysCascaderKey,
> {
  label: string;
  value: K;
  children?: HysCascaderDataNode<K>[];
  disabled?: boolean;
  isLeaf?: boolean;
  hasChildren?: boolean;
}
/** Original string-valued data shape remains available. */
export type HysCascaderNode = HysCascaderDataNode<string>;
export interface HysCascaderFieldNames {
  value: string;
  label: string;
  children: string;
  disabled: string;
  leaf: string;
  hasChildren: string;
}
export interface HysCascaderItem<N extends object = HysCascaderNode> {
  path: HysCascaderKey[];
  labels: string[];
  nodes: N[];
  node?: N;
  value: HysCascaderKey;
  label: string;
  disabled: boolean;
  missing: boolean;
}
export interface HysCascaderOptionContext<
  N extends object = HysCascaderNode,
> extends HysCascaderItem<N> {
  node: N;
  level: number;
  leaf: boolean;
  expanded: boolean;
  checked: boolean;
  indeterminate: boolean;
  loading: boolean;
}
export interface HysCascaderLoadContext<N extends object = HysCascaderNode> {
  signal: AbortSignal;
  path: HysCascaderKey[];
  nodes: N[];
  level: number;
}
export interface HysCascaderChange<N extends object = HysCascaderNode> {
  reason: "select" | "check" | "remove" | "clear" | "api";
  node?: N;
  items: HysCascaderItem<N>[];
  paths: HysCascaderKey[][];
  halfCheckedPaths: HysCascaderKey[][];
  event?: Event;
}
export interface HysCascaderLocale {
  panel: string;
  search: string;
  empty: string;
  noMatch: string;
  loading: string;
  loadError: string;
  retry: string;
  clear: string;
  close: string;
  level: string;
  expand: string;
  remove: string;
  more: string;
  limit: string;
}
export interface HysCascaderProps<
  N extends object = HysCascaderNode,
  V extends HysCascaderValue = HysCascaderValue,
> {
  popupTransition?: HysPopupTransition;
  popupTransitionDuration?: number;
  options: readonly N[];
  modelValue?: V;
  defaultValue?: V;
  cacheData?: readonly N[];
  fieldNames?: Partial<HysCascaderFieldNames>;
  valueKey?: string | ((node: N) => HysCascaderKey);
  disabledMethod?: (node: N, path: readonly N[]) => boolean;
  leafMethod?: (node: N, path: readonly N[]) => boolean;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  status?: "error" | "warning" | "success";
  placeholder?: string;
  ariaLabel?: string;
  name?: string;
  form?: string;
  autofocus?: boolean;
  multiple?: boolean;
  emitPath?: boolean;
  checkStrictly?: boolean;
  changeOnSelect?: boolean;
  showCheckedStrategy?: "child" | "parent" | "all";
  checkOnClickNode?: boolean;
  checkOnClickLeaf?: boolean;
  showPrefix?: boolean;
  showAllLevels?: boolean;
  separator?: string;
  displayRender?: (item: HysCascaderItem<N>) => VNodeChild;
  clearable?: boolean;
  clearValue?: HysCascaderValue;
  removable?: boolean;
  multipleLimit?: number;
  maxTagCount?: number;
  maxTagTextLength?: number;
  filterable?: boolean;
  searchValue?: string;
  defaultSearchValue?: string;
  searchPlaceholder?: string;
  filterMethod?: (query: string, path: readonly N[]) => boolean;
  searchSort?: (
    a: HysCascaderItem<N>,
    b: HysCascaderItem<N>,
    query: string,
  ) => number;
  searchLimit?: number | false;
  debounce?: number;
  beforeFilter?: (
    query: string,
    context: { signal: AbortSignal },
  ) => boolean | Promise<boolean>;
  retainSearch?: boolean;
  clearSearchAfterSelect?: boolean;
  expandTrigger?: "click" | "hover";
  hoverDelay?: number;
  expandedPath?: HysCascaderPath;
  defaultExpandedPath?: HysCascaderPath;
  loadChildren?: (
    node: N,
    context: HysCascaderLoadContext<N>,
  ) => Promise<readonly N[]>;
  loadRoot?: (context: { signal: AbortSignal }) => Promise<readonly N[]>;
  inline?: boolean;
  showFooter?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  showOnFocus?: boolean;
  popupMatchWidth?: boolean;
  popupWidth?: number | string;
  popupClass?: string;
  popupStyle?: CSSProperties;
  appendTo?: string | HTMLElement | false;
  placement?: Placement;
  columnWidth?: number | string;
  listHeight?: number;
  virtual?: boolean;
  itemHeight?: number;
  overscan?: number;
  emptyText?: string;
  noMatchText?: string;
  loadingText?: string;
  locale?: Partial<HysCascaderLocale>;
  validateEvent?: boolean;
}
export interface HysCascaderInstance<N extends object = HysCascaderNode> {
  readonly element: HTMLElement | undefined;
  readonly open: boolean;
  focus: () => void;
  blur: () => void;
  show: () => Promise<boolean>;
  hide: (restoreFocus?: boolean) => void;
  clear: () => Promise<boolean>;
  clearCheckedNodes: () => Promise<boolean>;
  removeTag: (path: HysCascaderPath | HysCascaderKey) => Promise<boolean>;
  setValue: (value: HysCascaderValue) => Promise<boolean>;
  filter: (query: string) => void;
  getSelectedItems: () => HysCascaderItem<N>[];
  getCheckedNodes: (leafOnly?: boolean) => N[];
  getExpandedPath: () => HysCascaderKey[];
  setExpandedPath: (path: HysCascaderPath) => Promise<boolean>;
  reloadNode: (path: HysCascaderPath) => Promise<boolean>;
  reloadRoot: () => Promise<boolean>;
  scrollTo: (path: HysCascaderPath) => Promise<void>;
}
export interface CascaderEntry<N extends object> {
  value: string;
  label: string;
  raw: N;
  path: HysCascaderKey[];
  labels: string[];
  nodes: N[];
  children?: CascaderEntry<N>[];
  disabled: boolean;
  isLeaf: boolean;
  hasChildren: boolean;
}
export const cascaderToken = (path: HysCascaderPath) =>
  JSON.stringify(path.map((v) => [typeof v, v]));
export function cascaderPath(token: string): HysCascaderKey[] {
  try {
    const parsed = JSON.parse(token);
    return Array.isArray(parsed) &&
      parsed.every(
        (p) =>
          Array.isArray(p) &&
          p.length === 2 &&
          treeKey(p[1]) &&
          typeof p[1] === p[0],
      )
      ? parsed.map((p) => p[1])
      : [];
  } catch {
    return [];
  }
}
export const validCascaderPath = (path: unknown): path is HysCascaderKey[] =>
  Array.isArray(path) && path.every(treeKey);
export const cascaderWords: HysCascaderLocale = {
  panel: "级联选择",
  search: "搜索分类",
  empty: "暂无分类",
  noMatch: "无匹配分类",
  loading: "加载中",
  loadError: "加载失败",
  retry: "重试",
  clear: "清空选择",
  close: "关闭",
  level: "第{level}级",
  expand: "展开 {label}",
  remove: "移除 {label}",
  more: "另外 {count} 项",
  limit: "最多选择 {count} 项",
};
export function cascaderEntries<N extends object>(
  options: readonly N[],
  props: HysCascaderProps<N>,
  parent?: CascaderEntry<N>,
) {
  const fields = {
      value: "value",
      label: "label",
      children: "children",
      disabled: "disabled",
      leaf: "isLeaf",
      hasChildren: "hasChildren",
      ...props.fieldNames,
    },
    roots: CascaderEntry<N>[] = [],
    map = new Map<string, CascaderEntry<N>>(),
    active = new Set<object>(parent?.nodes ?? []);
  type Work = {
    node: N;
    parent?: CascaderEntry<N>;
    target: CascaderEntry<N>[];
    exit?: boolean;
  };
  const stack: Work[] = [...options]
    .reverse()
    .map((node) => ({ node, parent, target: roots }));
  // Enter/exit frames reject cycles without rejecting a node reused under another parent.
  while (stack.length) {
    const work = stack.pop()!,
      { node } = work;
    if (work.exit) {
      active.delete(node);
      continue;
    }
    if (!node || typeof node !== "object" || active.has(node)) continue;
    const value =
      typeof props.valueKey === "function"
        ? props.valueKey(node)
        : treeField(node, props.valueKey ?? fields.value);
    if (!treeKey(value)) continue;
    const path = [...(work.parent?.path ?? []), value],
      key = cascaderToken(path);
    if (map.has(key)) continue;
    const nodes = [...(work.parent?.nodes ?? []), node],
      label = String(treeField(node, fields.label) ?? value),
      children = treeField(node, fields.children),
      leafState =
        props.leafMethod?.(node, nodes) ??
        treeField(node, fields.leaf) ??
        (!props.fieldNames?.leaf ? treeField(node, "leaf") : undefined),
      leaf = leafState === true,
      explicitBranch = leafState === false;
    const entry: CascaderEntry<N> = {
      value: key,
      label,
      raw: node,
      path,
      labels: [...(work.parent?.labels ?? []), label],
      nodes,
      disabled: !!(
        work.parent?.disabled ||
        treeField(node, fields.disabled) ||
        props.disabledMethod?.(node, nodes)
      ),
      isLeaf: leaf,
      hasChildren:
        !leaf &&
        !!(
          (Array.isArray(children) && children.length) ||
          treeField(node, fields.hasChildren) ||
          explicitBranch
        ),
      children: [],
    };
    map.set(key, entry);
    work.target.push(entry);
    active.add(node);
    stack.push({ ...work, exit: true });
    if (!leaf && Array.isArray(children))
      for (let i = children.length - 1; i >= 0; i--)
        stack.push({
          node: children[i],
          parent: entry,
          target: entry.children!,
        });
  }
  return { roots, map };
}
