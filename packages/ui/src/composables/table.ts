import type { HysPopupTransition } from '../motion/popup';
import type { Component, CSSProperties, HTMLAttributes, VNodeChild } from "vue";
import type { Placement } from "./useFloating";
export type HysTableKey = string | number;
export type HysTableDirection = "asc" | "desc";
export type HysTableFilterValue = string | number | boolean;
export type HysTableFilters = Record<string, readonly HysTableFilterValue[]>;
export interface HysTableSort {
  key: string;
  direction: HysTableDirection;
}
export interface HysTableSelectionProps {
  disabled?: boolean;
  label?: string;
  title?: string;
}
export interface HysTableSelectionColumn {
  label?: string;
  width?: number;
  fixed?: boolean | "left" | "right";
  align?: "left" | "center" | "right";
}
export interface HysTableRowSelectionOptions {
  range?: boolean;
  /** 只允许指定行绕过行级选择限制。 */
  ignoreSelectable?: boolean;
}
export interface HysTableSelectionAction<T extends object = Record<string, unknown>> {
  key: string;
  label: string;
  disabled?: boolean;
  select: (context: {
    rows: readonly T[];
    keys: readonly HysTableKey[];
    selectedKeys: readonly HysTableKey[];
    setSelected: (keys: readonly HysTableKey[]) => Promise<boolean>;
  }) => void | Promise<void>;
}
export interface HysTableFilterConfirmOptions {
  closeDropdown?: boolean;
}
export interface HysTableFilterResetOptions extends HysTableFilterConfirmOptions {
  confirm?: boolean;
}
export interface HysTableScrollRowOptions {
  behavior?: ScrollBehavior;
  block?: "start" | "center" | "end" | "nearest";
}
export interface HysTableStickyOptions {
  offsetHeader?: number;
  offsetScroll?: number;
  getContainer?: () => HTMLElement | Window | null | undefined;
}
export interface HysTableFilter {
  label: string;
  value: HysTableFilterValue;
  disabled?: boolean;
  children?: readonly HysTableFilter[];
}
export interface HysTableFilterDropdownContext<T extends object = Record<string, unknown>> {
  column: HysTableColumn<T>;
  open: boolean;
  values: readonly HysTableFilterValue[];
  setValues: (values: readonly HysTableFilterValue[]) => void;
  confirm: (options?: HysTableFilterConfirmOptions) => void;
  clear: (options?: HysTableFilterResetOptions) => void;
  close: () => void;
}
export type HysTableElementAttrs = HTMLAttributes & Record<string, unknown>;
export type HysTablePaginationPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export interface HysTableCellContext<
  T extends object = Record<string, unknown>,
> {
  row: T;
  column: HysTableColumn<T>;
  value: unknown;
  rowIndex: number;
  columnIndex: number;
}
export interface HysTableOverflowTooltipOptions {
  placement?: Placement;
  effect?: "light" | "dark";
  maxWidth?: number | string;
  offset?: number;
  hideDelay?: number;
  enterable?: boolean;
}
export interface HysTableComponents {
  table?: Component;
  header?: {
    wrapper?: Component;
    row?: Component;
    cell?: Component;
  };
  body?: {
    wrapper?: Component;
    row?: Component;
    cell?: Component;
    rowHeaderCell?: Component;
  };
}
export interface HysTableColumn<T extends object = any> {
  key: string;
  label: string;
  dataIndex?: string | readonly (string | number)[];
  type?: "default" | "selection" | "index" | "expand";
  children?: readonly HysTableColumn<T>[];
  width?: string | number;
  minWidth?: number;
  maxWidth?: number;
  fixed?: boolean | "left" | "right";
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
  /** 合并同一层、同一固定区域内相邻的叶列表头。0 隐藏标题。 */
  headerColSpan?: number;
  /** 表头插槽未提供内容时渲染列标题。 */
  renderHeader?: (column: HysTableColumn<T>, sorts: readonly HysTableSort[]) => VNodeChild;
  sortable?: boolean | "custom";
  sorter?: (a: T, b: T) => number;
  sortBy?:
    | string
    | ((row: T) => unknown)
    | readonly (string | ((row: T) => unknown))[];
  sortOrders?: readonly (HysTableDirection | null)[];
  defaultSortOrder?: HysTableDirection;
  /** 受控排序方向，null 清除该列排序。表格级 sort 和 sorts 优先。 */
  sortOrder?: HysTableDirection | null;
  showSorterTooltip?: boolean | HysTableOverflowTooltipOptions;
  sortPriority?: number;
  filters?: readonly HysTableFilter[];
  filterable?: boolean;
  filterMultiple?: boolean;
  filterMode?: "menu" | "tree";
  filterSearch?: boolean | ((query: string, option: HysTableFilter) => boolean);
  defaultFilterValue?: readonly HysTableFilterValue[];
  /** 受控筛选值，空数组清除该列筛选。表格级 filters 优先。 */
  filteredValue?: readonly HysTableFilterValue[];
  filtered?: boolean;
  filterDropdownOpen?: boolean;
  onFilterDropdownOpenChange?: (open: boolean) => void;
  filterPlacement?: Placement;
  renderFilterIcon?: (context: { column: HysTableColumn<T>; filtered: boolean; open: boolean }) => VNodeChild;
  renderFilterDropdown?: (context: HysTableFilterDropdownContext<T>) => VNodeChild;
  filterResetToDefault?: boolean;
  filterMethod?: (
    value: HysTableFilterValue,
    row: T,
    column: HysTableColumn<T>,
  ) => boolean;
  formatter?: (
    row: T,
    column: HysTableColumn<T>,
    value: unknown,
    index: number,
  ) => VNodeChild;
  ellipsis?: boolean | { showTitle?: boolean };
  showOverflowTooltip?: boolean | HysTableOverflowTooltipOptions;
  tooltipFormatter?: (context: HysTableCellContext<T>) => VNodeChild;
  className?: string;
  headerClassName?: string;
  cellStyle?:
    CSSProperties | ((context: HysTableCellContext<T>) => CSSProperties);
  summary?: "sum" | "avg" | "min" | "max" | "count";
  index?: number | ((index: number, row: T) => VNodeChild);
  hidden?: boolean;
  responsive?: readonly ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[];
  resizable?: boolean;
  rowScope?: "row" | "rowgroup";
  customCell?: (context: HysTableCellContext<T>) => HysTableElementAttrs;
  customHeaderCell?: (
    column: HysTableColumn<T>,
    index: number,
  ) => HysTableElementAttrs;
}
export interface HysTablePagination {
  position?: readonly HysTablePaginationPosition[];
  page?: number;
  pageSize?: number;
  defaultPage?: number;
  defaultPageSize?: number;
  total?: number;
  /** 服务端分页的总页数，可在总记录数未知时使用。 */
  pageCount?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  compact?: boolean;
  layout?: string;
  size?: "sm" | "md" | "lg";
  responsive?: boolean;
  siblingCount?: number;
  hideOnSinglePage?: boolean;
}
export interface HysTableQuery<T extends object = Record<string, unknown>> {
  action: "sort" | "filter" | "page" | "pageSize";
  page: number;
  pageSize: number;
  sorts: HysTableSort[];
  filters: HysTableFilters;
  currentData: T[];
}
export interface HysTableLoadContext {
  signal: AbortSignal;
  key: HysTableKey;
  depth: number;
}
export interface HysTableLocale {
  emptyText: string;
  loadingText: string;
  selectAll: string;
  selectRow: string;
  expandRow: string;
  collapseRow: string;
  expand: string;
  collapse: string;
  filter: string;
  filterPlaceholder: string;
  reset: string;
  apply: string;
  retry: string;
  retryLabel: string;
  scrollLabel: string;
  resizeColumn: string;
  sortAsc: string;
  sortDesc: string;
  sortClear?: string;
  stickyScrollLabel?: string;
  filterSearch?: string;
  noFilterMatch?: string;
  invertSelection?: string;
  clearSelection?: string;
  selected?: string;
  paginationLabels?: Partial<{
    total: string;
    perPage: string;
    jump: string;
    page: string;
    pageItem: string;
    navigation: string;
    confirm: string;
    first: string;
    previous: string;
    next: string;
    last: string;
  }>;
}
export interface HysTableProps<T extends object> {
  popupTransition?: HysPopupTransition;
  popupTransitionDuration?: number;
  locale?: Partial<HysTableLocale>;
  columns: readonly HysTableColumn<T>[];
  rows: readonly T[];
  /** 替换表格的结构组件。自定义组件需转发属性与默认插槽，并保留原生表格元素。 */
  components?: HysTableComponents;
  rowKey?: string | ((row: T) => HysTableKey);
  emptyText?: string;
  loading?: boolean;
  /** replace 用加载行替换数据，overlay 保留当前行并覆盖加载提示。 */
  loadingMode?: "replace" | "overlay";
  disabled?: boolean;
  striped?: boolean;
  bordered?: boolean;
  size?: "sm" | "md" | "lg";
  tableLayout?: "auto" | "fixed";
  caption?: string;
  height?: number | string;
  maxHeight?: number | string;
  stickyHeader?: boolean;
  /** 随页面或自定义容器滚动固定表头和水平滚动条。 */
  sticky?: boolean | HysTableStickyOptions;
  showHeader?: boolean;
  fit?: boolean;
  /** 表格横向最小宽度，用于控制滚动区域内的列布局。 */
  scrollWidth?: number | string;
  scrollbarAlwaysOn?: boolean;
  /** 使用浏览器默认的滚动条样式。 */
  nativeScrollbar?: boolean;
  scrollbarTabindex?: number | string;
  headerRowClassName?:
    string | ((columns: readonly HysTableColumn<T>[], level: number) => string);
  headerRowStyle?:
    | CSSProperties
    | ((columns: readonly HysTableColumn<T>[], level: number) => CSSProperties);
  rowClassName?: string | ((row: T, index: number) => string);
  rowStyle?: CSSProperties | ((row: T, index: number) => CSSProperties);
  cellClassName?: string | ((context: HysTableCellContext<T>) => string);
  cellStyle?:
    CSSProperties | ((context: HysTableCellContext<T>) => CSSProperties);
  headerCellClassName?:
    string | ((column: HysTableColumn<T>, index: number) => string);
  headerCellStyle?:
    | CSSProperties
    | ((column: HysTableColumn<T>, index: number) => CSSProperties);
  customRow?: (row: T, index: number) => HysTableElementAttrs;
  customHeaderRow?: (
    columns: readonly HysTableColumn<T>[],
    index: number,
  ) => HysTableElementAttrs;
  customCell?: (context: HysTableCellContext<T>) => HysTableElementAttrs;
  customHeaderCell?: (
    column: HysTableColumn<T>,
    index: number,
  ) => HysTableElementAttrs;
  selectable?: boolean | ((row: T, index: number) => boolean);
  selectionType?: "checkbox" | "radio";
  selectedRowKeys?: readonly HysTableKey[];
  defaultSelectedRowKeys?: readonly HysTableKey[];
  reserveSelection?: boolean;
  checkStrictly?: boolean;
  selectOnIndeterminate?: boolean;
  selectionActions?: boolean | readonly HysTableSelectionAction<T>[];
  rangeSelection?: boolean;
  hideSelectAll?: boolean;
  selectionColumn?: HysTableSelectionColumn;
  getSelectionProps?: (row: T, index: number) => HysTableSelectionProps;
  highlightCurrentRow?: boolean;
  currentRowKey?: HysTableKey | null;
  defaultCurrentRowKey?: HysTableKey;
  showIndex?: boolean;
  indexMethod?: (index: number, row: T) => VNodeChild;
  sort?: HysTableSort | null;
  sorts?: readonly HysTableSort[];
  defaultSort?: HysTableSort | readonly HysTableSort[] | null;
  multiSort?: boolean;
  sortOrders?: readonly (HysTableDirection | null)[];
  /** 悬停或聚焦列标题时提示下一次排序操作。 */
  showSorterTooltip?: boolean | HysTableOverflowTooltipOptions;
  filters?: HysTableFilters;
  defaultFilters?: HysTableFilters;
  filterColumnKey?: string | null;
  filterPlacement?: Placement;
  appendFilterTo?: string | HTMLElement | false;
  /** 根据触发元素指定排序、溢出与筛选浮层的挂载目标。 */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | string | false | undefined;
  pagination?: boolean | HysTablePagination;
  page?: number;
  pageSize?: number;
  total?: number;
  serverMode?: boolean;
  scrollToFirstRowOnChange?: boolean;
  expandable?: boolean;
  expandedRowKeys?: readonly HysTableKey[];
  defaultExpandedRowKeys?: readonly HysTableKey[];
  defaultExpandAll?: boolean;
  rowExpandable?: (row: T) => boolean;
  expandOnClickRow?: boolean;
  showExpandColumn?: boolean;
  expandColumnTitle?: string;
  expandFixed?: boolean | "left" | "right";
  preserveExpandedContent?: boolean;
  treeMode?: boolean;
  childrenKey?: string;
  hasChildrenKey?: string;
  indent?: number;
  loadChildren?: (
    row: T,
    context: HysTableLoadContext,
  ) => readonly T[] | Promise<readonly T[]>;
  showSummary?: boolean;
  /** 汇总全部筛选结果，或仅汇总当前页实际显示的行。 */
  summaryScope?: "filtered" | "page";
  /** 将汇总行固定在表格滚动区域底部。 */
  stickySummary?: boolean;
  sumText?: string;
  summaryMethod?: (context: {
    columns: readonly HysTableColumn<T>[];
    rows: T[];
  }) => readonly VNodeChild[] | Record<string, VNodeChild>;
  spanMethod?: (
    context: HysTableCellContext<T>,
  ) =>
    | { rowspan?: number; colspan?: number }
    | readonly [number, number]
    | undefined;
  /** 默认溢出提示，列可覆盖配置或设置 false 关闭。 */
  showOverflowTooltip?: boolean | HysTableOverflowTooltipOptions;
  tooltipFormatter?: (context: HysTableCellContext<T>) => VNodeChild;
  /** 在列格式化后统一处理默认单元格内容。 */
  transformCellText?: (context: HysTableCellContext<T> & { text: VNodeChild }) => VNodeChild;
  resizable?: boolean;
  columnWidths?: Readonly<Record<string, number>>;
  allowDragLastColumn?: boolean;
}
export interface HysTableInstance<T extends object = Record<string, unknown>> {
  readonly element: HTMLElement | undefined;
  readonly viewport: HTMLElement | undefined;
  readonly selectedKeys: HysTableKey[];
  readonly currentRow: T | undefined;
  readonly expandedKeys: HysTableKey[];
  readonly query: HysTableQuery<T>;
  readonly columns: HysTableColumn<T>[];
  clearSelection: () => Promise<boolean>;
  getSelectionRows: () => T[];
  getHalfSelectionRows: () => T[];
  toggleRowSelection: (
    row: T | HysTableKey,
    selected?: boolean,
    options?: boolean | HysTableRowSelectionOptions,
  ) => Promise<boolean>;
  toggleAllSelection: (selected?: boolean) => Promise<boolean>;
  invertSelection: () => Promise<boolean>;
  setCurrentRow: (row?: T | HysTableKey | null) => Promise<boolean>;
  toggleRowExpansion: (
    row: T | HysTableKey,
    expanded?: boolean,
  ) => Promise<boolean>;
  loadRow: (row: T | HysTableKey, force?: boolean) => Promise<boolean>;
  updateKeyChildren: (
    row: T | HysTableKey,
    children: readonly T[],
  ) => Promise<boolean>;
  clearSort: () => void;
  setSort: (sort: HysTableSort | readonly HysTableSort[] | null) => void;
  clearFilter: (keys?: readonly string[]) => void;
  setFilter: (key: string, values: readonly HysTableFilterValue[]) => void;
  showFilter: (key: string) => Promise<boolean>;
  hideFilter: () => Promise<boolean>;
  setPage: (page: number) => void;
  resizeColumn: (key: string, width: number) => void;
  resetColumnWidths: () => void;
  doLayout: () => Promise<void>;
  scrollTo: (options: ScrollToOptions) => void;
  setScrollTop: (top: number) => void;
  setScrollLeft: (left: number) => void;
  scrollToRow: (
    row: T | HysTableKey,
    options?: HysTableScrollRowOptions,
  ) => Promise<boolean>;
}
export interface TableNode<T extends object> {
  row: T;
  key: HysTableKey;
  token: string;
  index: number;
  depth: number;
  rootToken: string;
  parent?: TableNode<T>;
  children: TableNode<T>[];
  lazy: boolean;
}
export interface TableHeader<T extends object> {
  column: HysTableColumn<T>;
  key: string;
  leaves: HysTableColumn<T>[];
  colspan: number;
  rowspan: number;
  blank?: boolean;
  fixed?: "left" | "right";
}
export const tableToken = (key: HysTableKey) => typeof key + ":" + key;
export function tableValue(
  row: object,
  path: string | readonly (string | number)[],
): unknown {
  const parts = typeof path === "string" ? path.split(".") : path;
  let value: unknown = row;
  for (const part of parts) {
    if (value == null || typeof value !== "object") return;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}
export const tableBreakpoint = (width: number) =>
  width < 576
    ? "xs"
    : width < 768
      ? "sm"
      : width < 992
        ? "md"
        : width < 1200
          ? "lg"
          : width < 1600
            ? "xl"
            : "xxl";
export function tableColumns<T extends object>(
  input: readonly HysTableColumn<T>[],
  breakpoint: ReturnType<typeof tableBreakpoint>,
  showExpandColumn = true,
) {
  const seen = new Set<string>();
  function normalize(
    list: readonly HysTableColumn<T>[],
    inherited?: "left" | "right",
    path = new Set<object>(),
    depth = 0,
  ): HysTableColumn<T>[] {
    if (depth > 32) return [];
    return list.flatMap((source) => {
      if (
        path.has(source) ||
        source.hidden ||
        (!showExpandColumn && source.type === "expand") ||
        (source.responsive && !source.responsive.includes(breakpoint)) ||
        seen.has(source.key)
      )
        return [];
      seen.add(source.key);
      const fixed =
        source.fixed === false
          ? undefined
          : source.fixed === true
            ? "left"
            : (source.fixed ?? inherited);
      const children = source.children
        ? normalize(
            source.children,
            fixed,
            new Set([...path, source]),
            depth + 1,
          )
        : undefined;
      return children && !children.length
        ? []
        : [{ ...source, fixed, children }];
    });
  }
  const roots = normalize(input);
  function partition(
    list: readonly HysTableColumn<T>[],
    side?: "left" | "right",
  ): HysTableColumn<T>[] {
    return list.flatMap((c) => {
      if (c.children) {
        const children = partition(c.children, side);
        return children.length ? [{ ...c, children, fixed: side }] : [];
      }
      return c.fixed === side ? [c] : [];
    });
  }
  const ordered = [
    ...partition(roots, "left"),
    ...partition(roots),
    ...partition(roots, "right"),
  ];
  function leaves(list: readonly HysTableColumn<T>[]): HysTableColumn<T>[] {
    return list.flatMap((c) => (c.children ? leaves(c.children) : [c]));
  }
  function depth(list: readonly HysTableColumn<T>[]): number {
    return Math.max(
      1,
      ...list.map((c) => (c.children ? 1 + depth(c.children) : 1)),
    );
  }
  const levels = depth(ordered),
    headers: TableHeader<T>[][] = Array.from({ length: levels }, () => []);
  function visit(list: readonly HysTableColumn<T>[], level: number) {
    for (const c of list) {
      const all = c.children ? leaves(c.children) : [c];
      headers[level].push({
        column: c,
        key: c.key + ":" + (c.fixed || "center"),
        leaves: all,
        colspan: all.length,
        rowspan: c.children ? 1 : levels - level,
        fixed: c.fixed === "left" || c.fixed === "right" ? c.fixed : undefined,
      });
      if (c.children) visit(c.children, level + 1);
    }
  }
  visit(ordered, 0);
  const leafColumns = leaves(ordered);
  const positions = new Map(leafColumns.map((column, index) => [column.key, index]));
  const mergedHeaders = headers.map((row) => {
    const result: TableHeader<T>[] = [];
    for (let index = 0; index < row.length; index++) {
      const header = row[index];
      const span = header.column.headerColSpan;
      if (span === 0) {
        result.push({ ...header, blank: true });
        continue;
      }
      if (span === undefined || !Number.isSafeInteger(span) || span <= 1 || header.column.children) {
        result.push(header);
        continue;
      }
      const merged = [...header.leaves];
      const start = positions.get(merged[0].key)!;
      while (merged.length < span) {
        const next = row[index + 1];
        if (!next || next.column.children || next.column.type && next.column.type !== "default" ||
            next.fixed !== header.fixed || next.rowspan !== header.rowspan ||
            positions.get(next.column.key) !== start + merged.length) break;
        merged.push(next.column);
        index++;
      }
      result.push({ ...header, leaves: merged, colspan: merged.length });
    }
    return result;
  });
  return { leaves: leafColumns, headers: mergedHeaders };
}
export function tableCompare<T extends object>(
  sorts: readonly HysTableSort[],
  columns: readonly HysTableColumn<T>[],
) {
  const collator = new Intl.Collator("zh-CN", {
    numeric: true,
    sensitivity: "base",
  });
  const rules = sorts.flatMap((sort) => {
    const column = columns.find((c) => c.key === sort.key);
    return column && column.sortable !== "custom" ? [{ ...sort, column }] : [];
  });
  return (a: T, b: T) => {
    for (const { direction, column } of rules) {
      if (column.sorter) {
        const result = column.sorter(a, b);
        if (Number.isFinite(result) && result !== 0)
          return (direction === "asc" ? 1 : -1) * result;
        continue;
      }
      const fields = Array.isArray(column.sortBy)
        ? column.sortBy
        : [column.sortBy ?? column.dataIndex ?? column.key];
      for (const field of fields) {
        const av =
            typeof field === "function"
              ? field(a)
              : tableValue(a, field as string | readonly (string | number)[]),
          bv =
            typeof field === "function"
              ? field(b)
              : tableValue(b, field as string | readonly (string | number)[]);
        if (av == null || bv == null) {
          if (av == null && bv == null) continue;
          return av == null ? 1 : -1;
        }
        const result =
          typeof av === "number" && typeof bv === "number"
            ? Number.isNaN(av)
              ? Number.isNaN(bv)
                ? 0
                : 1
              : Number.isNaN(bv)
                ? -1
                : av - bv
            : collator.compare(String(av), String(bv));
        if (Number.isFinite(result) && result !== 0)
          return (direction === "asc" ? 1 : -1) * result;
      }
    }
    return 0;
  };
}
export function tableMatches<T extends object>(
  row: T,
  filters: HysTableFilters,
  columns: readonly HysTableColumn<T>[],
) {
  return tableFilterPredicate(filters, columns)(row);
}
export function tableFilterPredicate<T extends object>(
  filters: HysTableFilters,
  columns: readonly HysTableColumn<T>[],
) {
  const allowed = new Map<string, Set<HysTableFilterValue>>();
  for (const column of columns) {
    const selected = filters[column.key];
    if (!selected?.length || !column.filters || column.filterMethod) continue;
    const values = new Set(selected),
      options = tableFilterOptions(column.filters),
      byValue = new Map(options.map((option) => [option.value, option]));
    for (const value of selected) {
      const children = byValue.get(value)?.children;
      if (children)
        for (const child of tableFilterOptions(children))
          values.add(child.value);
    }
    allowed.set(column.key, values);
  }
  return (row: T) => {
    return columns.every((column) => {
      const values = filters[column.key];
      if (!values?.length) return true;
      if (allowed.has(column.key))
        return allowed
          .get(column.key)!
          .has(
            tableValue(
              row,
              column.dataIndex ?? column.key,
            ) as HysTableFilterValue,
          );
      return values.some((value) =>
        column.filterMethod
          ? column.filterMethod(value, row, column)
          : String(tableValue(row, column.dataIndex ?? column.key) ?? "")
              .toLocaleLowerCase()
              .includes(String(value).toLocaleLowerCase()),
      );
    });
  };
}
/** Iterative traversal also tolerates accidentally cyclic filter definitions. */
export function tableFilterOptions(filters: readonly HysTableFilter[]) {
  const result: HysTableFilter[] = [],
    seen = new Set<HysTableFilter>(),
    stack = [...filters].reverse();
  while (stack.length) {
    const option = stack.pop()!;
    if (seen.has(option)) continue;
    seen.add(option);
    result.push(option);
    if (option.children) stack.push(...[...option.children].reverse());
  }
  return result;
}
export function tableSummary<T extends object>(
  rows: readonly T[],
  column: HysTableColumn<T>,
) {
  if (column.summary === "count") return rows.length;
  const values = rows
    .map((row) => tableValue(row, column.dataIndex ?? column.key))
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (!values.length) return "—";
  const sum = values.reduce((a, b) => a + b, 0);
  return column.summary === "sum"
    ? +sum.toFixed(12)
    : column.summary === "avg"
      ? +(sum / values.length).toFixed(12)
      : column.summary === "min"
        ? values.reduce((a, b) => Math.min(a, b))
        : column.summary === "max"
          ? values.reduce((a, b) => Math.max(a, b))
          : "";
}
