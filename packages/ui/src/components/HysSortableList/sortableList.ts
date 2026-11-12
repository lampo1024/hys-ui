import type { StyleValue } from "vue";

export type HysSortKey = string | number;
export interface HysSortItem {
  id: HysSortKey;
  label: string;
}
export type HysSortLayout = "vertical" | "horizontal" | "grid";
export type HysSortMode = "insert" | "swap";
export type HysSortOperation = "move" | "copy" | "clone";
export type HysSortPosition = "before" | "after" | "inside";
export type HysSortSource = "pointer" | "keyboard" | "button" | "api";
export type HysSortFixed = boolean | "top" | "bottom";
export type HysSortDecision = boolean | string | void;
export type HysSortReason =
  | "cancelled"
  | "outside"
  | "disabled"
  | "keys"
  | "group"
  | "capacity"
  | "fixed"
  | "cycle"
  | "noop"
  | "rule"
  | "conflict"
  | "save";

export interface HysSortListInfo<T extends object> {
  id: string;
  group?: string;
  items: readonly T[];
}

export interface HysSortDrag<T extends object> {
  source: HysSortSource;
  from: HysSortListInfo<T>;
  items: readonly T[];
  keys: readonly HysSortKey[];
  indices: readonly number[];
}

export interface HysSortProposal<T extends object> extends HysSortDrag<T> {
  to: HysSortListInfo<T>;
  /** 原列表中的插入边界，0 表示首位，length 表示末尾。交换模式下为目标项索引。 */
  index: number;
  position: HysSortPosition;
  targetItem?: T;
  operation: HysSortOperation;
  mode: HysSortMode;
}

export interface HysSortListChange<T extends object> {
  id: string;
  previous: readonly T[];
  next: readonly T[];
}

export interface HysSortPreview<T extends object> {
  proposal: HysSortProposal<T>;
  lists: readonly HysSortListChange<T>[];
}

export interface HysSortChange<T extends object> {
  action: "sort" | "undo" | "redo" | "reset" | "rollback";
  proposal?: HysSortProposal<T>;
  lists: readonly HysSortListChange<T>[];
}

export interface HysSortFeedback<T extends object> {
  reason: HysSortReason;
  message: string;
  proposal?: HysSortProposal<T>;
  error?: unknown;
}

export interface HysSortGroup<T extends object> {
  name: string;
  pull?:
    | boolean
    | HysSortOperation
    | ((proposal: HysSortProposal<T>) => boolean | HysSortOperation);
  put?:
    | boolean
    | readonly string[]
    | ((proposal: HysSortProposal<T>) => HysSortDecision);
}

export interface HysSortScroll {
  threshold?: number;
  speed?: number;
  axis?: "x" | "y" | "both";
  window?: boolean;
}

export interface HysSortVirtual {
  height?: number | string;
  estimateSize?: number;
  overscan?: number;
  /** 网格每一行的列数。设置为函数可根据容器宽度调整。 */
  columns?: number | ((width: number) => number);
}

export interface HysSortRow<T extends object> {
  item: T;
  key: HysSortKey;
  index: number;
  selected: boolean;
  dragging: boolean;
  disabled: boolean;
  fixed: HysSortFixed;
  toggle: (event?: MouseEvent) => void;
  move: (offset: number) => Promise<boolean>;
}

export interface HysSortableListProps<T extends object = HysSortItem> {
  /** 受控列表。每项必须有唯一、稳定的键。 */
  modelValue?: readonly T[];
  /** 非受控初始数据，也可通过 reset 恢复挂载时的顺序。 */
  defaultItems?: readonly T[];
  itemKey?: keyof T | ((item: T) => HysSortKey);
  itemLabel?: keyof T | ((item: T) => string);
  listId?: string;
  ariaLabel?: string;
  layout?: HysSortLayout;
  mode?: HysSortMode;
  disabled?: boolean;
  itemDisabled?: readonly HysSortKey[] | ((item: T, index: number) => boolean);
  fixed?:
    | readonly HysSortKey[]
    | ((item: T, index: number) => HysSortFixed | undefined);
  handle?: boolean | string;
  showHandle?: boolean;
  showButtons?: boolean;
  keyboard?: boolean;
  dragDelay?: number;
  touchDelay?: number;
  dragThreshold?: number;
  axis?: "x" | "y" | "both";
  bounds?:
    "list" | "viewport" | HTMLElement | (() => HTMLElement | null | undefined);
  snap?: boolean;
  livePreview?: boolean;
  group?: string | HysSortGroup<T>;
  maxItems?: number;
  selectable?: boolean;
  selectedKeys?: readonly HysSortKey[];
  defaultSelectedKeys?: readonly HysSortKey[];
  /** copy 浅拷贝、clone 深拷贝。自定义时应返回有新键的项目。 */
  clone?: (item: T, proposal: HysSortProposal<T>) => T;
  canDrag?: (item: T, index: number) => HysSortDecision;
  canDrop?: (proposal: HysSortProposal<T>) => HysSortDecision;
  resolveIndex?: (proposal: HysSortProposal<T>) => number;
  beforeDrop?: (
    proposal: HysSortProposal<T>,
    signal: AbortSignal,
  ) => HysSortDecision | Promise<HysSortDecision>;
  save?: (
    change: HysSortChange<T>,
    signal: AbortSignal,
  ) => void | boolean | Promise<void | boolean>;
  history?: boolean | number;
  storageKey?: string;
  autoScroll?: boolean | HysSortScroll;
  virtual?: boolean | HysSortVirtual;
  listTag?: "div" | "ul" | "ol" | "table";
  tableColumns?: number;
  motion?: boolean;
  animationDuration?: number;
  animationEasing?: string;
  moveClass?: string;
  ghostClass?: string;
  ghostStyle?: StyleValue;
}

export interface HysSortMoveOptions {
  /** 目标 listId；省略时在当前列表内移动。 */
  to?: string;
  /** 使用目标当前模型的插入边界；交换模式下为项目索引。 */
  index: number;
  operation?: HysSortOperation;
}

export interface HysSortableListInstance {
  move: (
    keys: HysSortKey | readonly HysSortKey[],
    options: HysSortMoveOptions,
  ) => Promise<boolean>;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  reset: () => Promise<boolean>;
  cancel: () => void;
  select: (keys: readonly HysSortKey[]) => void;
  scrollTo: (key: HysSortKey) => Promise<boolean>;
  focus: (key: HysSortKey) => Promise<boolean>;
}
