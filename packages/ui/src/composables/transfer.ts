import type { CSSProperties, VNodeChild } from "vue";
export type HysTransferKey = string | number;
export type HysTransferSide = "left" | "right";
export interface HysTransferOption<K extends HysTransferKey = HysTransferKey> {
  value: K;
  label: string;
  disabled?: boolean;
}
export interface HysTransferFieldNames {
  value?: string;
  label?: string;
  disabled?: string;
}
export interface HysTransferPagination {
  pageSize?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  compact?: boolean;
}
export interface HysTransferLocale {
  leftTitle: string;
  rightTitle: string;
  search: string;
  emptyLeft: string;
  emptyRight: string;
  noMatch: string;
  loading: string;
  selectAll: string;
  invert: string;
  remove: string;
  moveRight: string;
  moveLeft: string;
  dragRight: string;
  dragLeft: string;
  dragCount: string;
  moved: string;
  added: string;
  removed: string;
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;
  perPage: string;
}
export interface HysTransferHeaderInfo {
  side: HysTransferSide;
  total: number;
  filtered: number;
  checked: number;
}
export interface HysTransferRecord<T extends object, K extends HysTransferKey> {
  key: K;
  label: string;
  disabled: boolean;
  option: T;
}
export interface HysTransferProps<T extends object, K extends HysTransferKey> {
  options: readonly T[];
  modelValue?: readonly K[];
  defaultValue?: readonly K[];
  fieldNames?: HysTransferFieldNames;
  rowKey?: (option: T) => K;
  disabled?: boolean;
  loading?: boolean;
  filterable?: boolean;
  filterMethod?: (query: string, option: T, side: HysTransferSide) => boolean;
  filterPlaceholder?: string | readonly [string, string];
  searchValues?: Partial<Record<HysTransferSide, string>>;
  titles?: readonly [string, string];
  buttonTexts?: readonly [string, string];
  showSelectAll?: boolean;
  showInvert?: boolean;
  checkedKeys?: readonly K[];
  defaultCheckedKeys?: readonly K[];
  leftDefaultChecked?: readonly K[];
  rightDefaultChecked?: readonly K[];
  targetOrder?: "original" | "push" | "unshift";
  oneWay?: boolean;
  draggable?: boolean;
  dragChecked?: boolean;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
  listHeight?: number;
  listStyle?: CSSProperties;
  operationStyle?: CSSProperties;
  status?: "error" | "warning";
  pagination?: boolean | HysTransferPagination;
  pages?: Partial<Record<HysTransferSide, number>>;
  pageSizes?: Partial<Record<HysTransferSide, number>>;
  virtual?: boolean;
  itemHeight?: number;
  overscan?: number;
  locale?: Partial<HysTransferLocale>;
  format?: (info: HysTransferHeaderInfo) => string;
  renderContent?: (option: T, side: HysTransferSide) => VNodeChild;
  ariaLabel?: string;
  validateEvent?: boolean;
}
export interface HysTransferPanelContext<
  T extends object,
  K extends HysTransferKey,
> {
  side: HysTransferSide;
  items: T[];
  filteredItems: T[];
  checkedKeys: K[];
  disabled: boolean;
  query: string;
  check: (key: K, checked?: boolean) => Promise<boolean>;
  setCheckedKeys: (keys: readonly K[]) => Promise<boolean>;
  checkAll: (checked?: boolean) => Promise<boolean>;
  remove: (keys: readonly K[]) => Promise<boolean>;
}
export interface HysTransferInstance<
  T extends object = HysTransferOption,
  K extends HysTransferKey = HysTransferKey,
> {
  readonly element: HTMLElement | undefined;
  readonly targetKeys: K[];
  readonly checkedKeys: K[];
  getCheckedKeys: (side?: HysTransferSide) => K[];
  getTargetItems: () => T[];
  move: (direction: HysTransferSide, keys?: readonly K[]) => Promise<boolean>;
  remove: (keys: readonly K[]) => Promise<boolean>;
  setCheckedKeys: (keys: readonly K[]) => Promise<boolean>;
  clearChecked: (side?: HysTransferSide) => Promise<boolean>;
  checkAll: (
    side: HysTransferSide,
    checked?: boolean,
    scope?: "page" | "filtered" | "all",
  ) => Promise<boolean>;
  invertSelection: (
    side: HysTransferSide,
    scope?: "page" | "filtered" | "all",
  ) => Promise<boolean>;
  setSearch: (side: HysTransferSide, value: string) => void;
  clearSearch: (side?: HysTransferSide) => void;
  setPage: (side: HysTransferSide, page: number) => void;
  setPageSize: (side: HysTransferSide, size: number) => void;
  scrollTo: (
    side: HysTransferSide,
    options: { key?: K; top?: number; behavior?: ScrollBehavior },
  ) => Promise<void>;
  focus: (side?: HysTransferSide) => void;
}
export const transferToken = (key: HysTransferKey) => typeof key + ":" + key;
export interface HysTransferSlots<T extends object, K extends HysTransferKey> {
  default?: (props: {
    option: T;
    label: string;
    side: HysTransferSide;
    checked: boolean;
    disabled: boolean;
  }) => any;
  option?: (props: {
    option: T;
    label: string;
    side: HysTransferSide;
    checked: boolean;
    disabled: boolean;
  }) => any;
  panel?: (props: HysTransferPanelContext<T, K>) => any;
  header?: (props: {
    info: HysTransferHeaderInfo;
    side: HysTransferSide;
    allChecked: boolean;
    indeterminate: boolean;
    checkAll: (checked?: boolean) => Promise<boolean>;
  }) => any;
  footer?: (props: HysTransferPanelContext<T, K>) => any;
  "left-footer"?: (props: HysTransferPanelContext<T, K>) => any;
  "right-footer"?: (props: HysTransferPanelContext<T, K>) => any;
  empty?: (props: HysTransferPanelContext<T, K>) => any;
  "left-empty"?: (props: HysTransferPanelContext<T, K>) => any;
  "right-empty"?: (props: HysTransferPanelContext<T, K>) => any;
  loading?: (props: { side: HysTransferSide }) => any;
  operations?: (props: {
    move: (side: HysTransferSide, keys?: readonly K[]) => Promise<boolean>;
    disabled: boolean;
    leftChecked: K[];
    rightChecked: K[];
  }) => any;
}
export function transferValue(option: object, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (v, key) =>
        v != null && Object.prototype.hasOwnProperty.call(Object(v), key)
          ? (v as Record<string, unknown>)[key]
          : undefined,
      option,
    );
}
export function transferRows<T extends object, K extends HysTransferKey>(
  props: Pick<HysTransferProps<T, K>, "options" | "fieldNames" | "rowKey">,
) {
  const rows: HysTransferRecord<T, K>[] = [],
    map = new Map<K, HysTransferRecord<T, K>>();
  for (const option of props.options) {
    if (!option || typeof option !== "object") continue;
    const key = props.rowKey
      ? props.rowKey(option)
      : transferValue(option, props.fieldNames?.value ?? "value");
    if (
      (typeof key !== "string" &&
        (typeof key !== "number" || !Number.isFinite(key))) ||
      map.has(key as K)
    )
      continue;
    const row = {
      key: key as K,
      label: String(
        transferValue(option, props.fieldNames?.label ?? "label") ?? key,
      ),
      disabled: !!transferValue(
        option,
        props.fieldNames?.disabled ?? "disabled",
      ),
      option,
    };
    rows.push(row);
    map.set(row.key, row);
  }
  return { rows, map };
}
export const transferWords = (
  locale?: Partial<HysTransferLocale>,
): HysTransferLocale => ({
  leftTitle: "待选择",
  rightTitle: "已选择",
  search: "筛选成员",
  emptyLeft: "暂无待选成员",
  emptyRight: "暂无已选成员",
  noMatch: "无匹配成员",
  loading: "加载中…",
  selectAll: "全选{title}当前页",
  invert: "反选当前页",
  remove: "移除{label}",
  moveRight: "添加选中项",
  moveLeft: "移除选中项",
  dragRight: "拖动到已选择区域",
  dragLeft: "拖动到待选择区域",
  dragCount: "正在拖动 {count} 项",
  moved: "已{direction} {count} 项",
  added: "移入",
  removed: "移出",
  firstPage: "首页",
  previousPage: "上一页",
  nextPage: "下一页",
  lastPage: "末页",
  perPage: "每页条数",
  ...locale,
});
export const transferLabel = (
  text: string,
  values: Record<string, string | number>,
) => text.replace(/\{(\w+)\}/g, (token, key) => String(values[key] ?? token));
