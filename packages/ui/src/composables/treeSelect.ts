import type { HysPopupTransition } from '../motion/popup';
import type { CSSProperties, VNodeChild } from "vue";
import {
  treeAssign,
  treeField,
  treeIndex,
  treeKey,
  type HysTreeKey,
  type HysTreeFieldNames,
  type HysTreeLoadContext,
  type HysTreeLocale,
  type HysTreeProps,
} from "./tree";
import type { Placement } from "./useFloating";
export interface HysTreeSelectDataNode<K extends HysTreeKey = HysTreeKey> {
  value: K;
  label: string;
  children?: HysTreeSelectDataNode<K>[];
  disabled?: boolean;
  disableCheckbox?: boolean;
  checkable?: boolean;
  selectable?: boolean;
  hasChildren?: boolean;
  isLeaf?: boolean;
}
export type HysTreeSelectNode = HysTreeSelectDataNode<string>;
export interface HysTreeSelectLabelValue {
  value: HysTreeKey;
  label?: VNodeChild;
  disabled?: boolean;
}
export type HysTreeSelectValue =
  | HysTreeKey
  | HysTreeSelectLabelValue
  | readonly (HysTreeKey | HysTreeSelectLabelValue)[]
  | null;
export interface HysTreeSelectFieldNames extends Omit<HysTreeFieldNames, "id"> {
  value: string;
}
export interface HysTreeSelectSimpleMode {
  id?: string;
  parentId?: string;
  rootParentId?: HysTreeKey | null;
}
export type HysTreeSelectStrategy = "all" | "parent" | "child";
export interface HysTreeSelectItem<N extends object = HysTreeSelectNode> {
  value: HysTreeKey;
  label: VNodeChild;
  node?: N;
  disabled: boolean;
  missing: boolean;
}
export interface HysTreeSelectChange<N extends object = HysTreeSelectNode> {
  reason: "select" | "check" | "remove" | "clear" | "api";
  node?: N;
  values: HysTreeKey[];
  items: HysTreeSelectItem<N>[];
  halfCheckedKeys: HysTreeKey[];
  event?: Event;
}
export interface HysTreeSelectProps<
  N extends object = HysTreeSelectNode,
  V extends HysTreeSelectValue = HysTreeSelectValue,
> {
  popupTransition?: HysPopupTransition;
  popupTransitionDuration?: number;
  modelValue?: V;
  defaultValue?: V;
  nodes: readonly N[];
  cacheData?: readonly N[];
  fieldNames?: Partial<HysTreeSelectFieldNames>;
  nodeKey?: string | ((node: N) => HysTreeKey);
  simpleMode?: boolean | HysTreeSelectSimpleMode;
  labelInValue?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  status?: "error" | "warning" | "success";
  placeholder?: string;
  ariaLabel?: string;
  name?: string;
  multiple?: boolean;
  leafOnly?: boolean;
  checkable?: boolean;
  checkStrictly?: boolean;
  showCheckedStrategy?: HysTreeSelectStrategy;
  clearable?: boolean;
  clearValue?: HysTreeKey | null;
  removable?: boolean;
  multipleLimit?: number;
  maxTagCount?: number;
  maxTagTextLength?: number;
  searchable?: boolean;
  searchValue?: string;
  defaultSearchValue?: string;
  searchPlaceholder?: string;
  filterNode?: (query: string, node: N) => boolean;
  filterMode?: "hide" | "highlight";
  showMatchedChildren?: boolean;
  retainSearch?: boolean;
  clearSearchAfterSelect?: boolean;
  remote?: boolean;
  remoteMethod?: (
    query: string,
    context: { signal: AbortSignal },
  ) => void | readonly N[] | Promise<void | readonly N[]>;
  debounce?: number;
  expandedKeys?: readonly HysTreeKey[];
  defaultExpandedKeys?: readonly HysTreeKey[];
  defaultExpandAll?: boolean;
  autoExpandParent?: boolean;
  accordion?: boolean;
  expandOnClickNode?: boolean;
  expandSelected?: boolean;
  loadedKeys?: readonly HysTreeKey[];
  loadChildren?: (
    node: N,
    context: HysTreeLoadContext,
  ) => Promise<readonly N[]>;
  showLine?: boolean;
  showIcon?: boolean;
  indent?: number;
  open?: boolean;
  defaultOpen?: boolean;
  showOnFocus?: boolean;
  popupMatchWidth?: boolean;
  popupWidth?: number | string;
  popupClass?: string;
  popupStyle?: CSSProperties;
  appendTo?: string | HTMLElement | false;
  placement?: Placement;
  listHeight?: number;
  virtual?: boolean;
  itemHeight?: number;
  overscan?: number;
  emptyText?: string;
  noMatchText?: string;
  loadingText?: string;
  locale?: Partial<HysTreeLocale>;
  validateEvent?: boolean;
}
export interface HysTreeSelectInstance<N extends object = HysTreeSelectNode> {
  readonly element: HTMLElement | undefined;
  readonly open: boolean;
  focus: () => void;
  blur: () => void;
  show: () => Promise<boolean>;
  hide: (restoreFocus?: boolean) => void;
  clear: () => Promise<boolean>;
  removeTag: (key: HysTreeKey) => Promise<boolean>;
  setValue: (value: HysTreeSelectValue) => Promise<boolean>;
  filter: (query: string) => void;
  getSelectedKeys: () => HysTreeKey[];
  getSelectedItems: () => HysTreeSelectItem<N>[];
  getCheckedKeys: (leafOnly?: boolean) => HysTreeKey[];
  getHalfCheckedKeys: () => HysTreeKey[];
  getNode: (key: HysTreeKey) => N | undefined;
  getExpandedKeys: () => HysTreeKey[];
  setExpandedKeys: (keys: readonly HysTreeKey[]) => Promise<boolean>;
  expandNode: (key: HysTreeKey, expanded?: boolean) => Promise<boolean>;
  reloadNode: (key: HysTreeKey) => Promise<boolean>;
  scrollTo: (options: {
    key?: HysTreeKey;
    top?: number;
    align?: "top" | "bottom" | "auto";
  }) => Promise<void>;
}
export function treeSelectFields<N extends object>(
  props: HysTreeSelectProps<N>,
): Partial<HysTreeFieldNames> {
  const { value, ...fields } = props.fieldNames ?? {};
  return { id: value ?? "value", ...fields };
}
export function treeSelectForest<N extends object>(
  nodes: readonly N[],
  props: HysTreeSelectProps<N>,
) {
  const raw = new Map<HysTreeKey, N>();
  if (!props.simpleMode) return { nodes, raw };
  const cfg = typeof props.simpleMode === "object" ? props.simpleMode : {},
    fields = treeSelectFields(props),
    idPath = cfg.id ?? "id",
    parentPath = cfg.parentId ?? "parentId",
    childrenPath = fields.children ?? "children",
    entries = new Map<
      HysTreeKey,
      { node: N; parent?: HysTreeKey; children: HysTreeKey[] }
    >();
  for (const node of nodes) {
    const id = treeField(node, idPath);
    if (!treeKey(id) || entries.has(id)) continue;
    const parent = treeField(node, parentPath),
      key =
        typeof props.nodeKey === "function"
          ? props.nodeKey(node)
          : treeField(
              node,
              typeof props.nodeKey === "string" ? props.nodeKey : fields.id!,
            );
    if (treeKey(key)) raw.set(key, node);
    entries.set(id, {
      node,
      parent:
        treeKey(parent) && parent !== cfg.rootParentId && parent !== id
          ? parent
          : undefined,
      children: [],
    });
  }
  const done = new Set<HysTreeKey>();
  for (const id of entries.keys()) {
    if (done.has(id)) continue;
    const path: HysTreeKey[] = [],
      positions = new Map<HysTreeKey, number>();
    let at: HysTreeKey | undefined = id;
    while (
      at !== undefined &&
      entries.has(at) &&
      !done.has(at) &&
      !positions.has(at)
    ) {
      positions.set(at, path.length);
      path.push(at);
      at = entries.get(at)!.parent;
    }
    if (at !== undefined && positions.has(at))
      for (const cycle of path.slice(positions.get(at)!))
        entries.get(cycle)!.parent = undefined;
    for (const key of path) done.add(key);
  }
  const roots: HysTreeKey[] = [];
  for (const [id, entry] of entries) {
    const parent =
      entry.parent === undefined ? undefined : entries.get(entry.parent);
    if (parent) parent.children.push(id);
    else roots.push(id);
  }
  const order: HysTreeKey[] = [],
    stack = [...roots].reverse();
  while (stack.length) {
    const id = stack.pop()!;
    order.push(id);
    const children = entries.get(id)!.children;
    for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
  }
  const built = new Map<HysTreeKey, N>();
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i],
      entry = entries.get(id)!;
    built.set(
      id,
      treeAssign(
        entry.node,
        childrenPath,
        entry.children.map((key) => built.get(key)!),
      ),
    );
  }
  return { nodes: roots.map((key) => built.get(key)!), raw };
}
export const selectTreeIndex = <N extends object>(
  nodes: readonly N[],
  props: HysTreeSelectProps<N>,
) =>
  treeIndex(nodes, {
    nodes,
    fieldNames: treeSelectFields(props),
    nodeKey: props.nodeKey,
    inheritDisabled: true,
  } as HysTreeProps<N>);
