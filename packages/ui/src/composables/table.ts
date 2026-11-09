import type { CSSProperties, HTMLAttributes, VNodeChild } from "vue";
export type HysTableKey = string | number;
export type HysTableDirection = "asc" | "desc";
export type HysTableFilterValue = string | number | boolean;
export type HysTableFilters = Record<string, readonly HysTableFilterValue[]>;
export interface HysTableSort {
  key: string;
  direction: HysTableDirection;
}
export interface HysTableFilter {
  label: string;
  value: HysTableFilterValue;
  disabled?: boolean;
  children?: readonly HysTableFilter[];
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
  sortable?: boolean | "custom";
  sorter?: (a: T, b: T) => number;
  sortBy?: string | ((row: T) => unknown);
  sortOrders?: readonly (HysTableDirection | null)[];
  sortPriority?: number;
  filters?: readonly HysTableFilter[];
  filterable?: boolean;
  filterMultiple?: boolean;
  filterMode?: "menu" | "tree";
  filterSearch?: boolean | ((query: string, option: HysTableFilter) => boolean);
  defaultFilterValue?: readonly HysTableFilterValue[];
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
  ellipsis?: boolean;
  showOverflowTooltip?: boolean;
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
  total?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  compact?: boolean;
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
    first: string;
    previous: string;
    next: string;
    last: string;
  }>;
}
export interface HysTableProps<T extends object> {
  locale?: Partial<HysTableLocale>;
  columns: readonly HysTableColumn<T>[];
  rows: readonly T[];
  rowKey?: string | ((row: T) => HysTableKey);
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
  striped?: boolean;
  bordered?: boolean;
  size?: "sm" | "md" | "lg";
  caption?: string;
  height?: number | string;
  maxHeight?: number | string;
  stickyHeader?: boolean;
  showHeader?: boolean;
  fit?: boolean;
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
  selectionActions?: boolean;
  rangeSelection?: boolean;
  hideSelectAll?: boolean;
  highlightCurrentRow?: boolean;
  currentRowKey?: HysTableKey | null;
  defaultCurrentRowKey?: HysTableKey;
  showIndex?: boolean;
  indexMethod?: (index: number, row: T) => VNodeChild;
  sort?: HysTableSort | null;
  sorts?: readonly HysTableSort[];
  defaultSort?: HysTableSort | readonly HysTableSort[] | null;
  multiSort?: boolean;
  filters?: HysTableFilters;
  defaultFilters?: HysTableFilters;
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
  showOverflowTooltip?: boolean;
  tooltipFormatter?: (context: HysTableCellContext<T>) => VNodeChild;
  resizable?: boolean;
  columnWidths?: Readonly<Record<string, number>>;
}
export interface HysTableInstance<T extends object = Record<string, unknown>> {
  readonly element: HTMLElement | undefined;
  readonly viewport: HTMLElement | undefined;
  readonly selectedKeys: HysTableKey[];
  readonly currentRow: T | undefined;
  readonly expandedKeys: HysTableKey[];
  readonly query: HysTableQuery<T>;
  clearSelection: () => Promise<boolean>;
  getSelectionRows: () => T[];
  getHalfSelectionRows: () => T[];
  toggleRowSelection: (
    row: T | HysTableKey,
    selected?: boolean,
    range?: boolean,
  ) => Promise<boolean>;
  toggleAllSelection: (selected?: boolean) => Promise<boolean>;
  invertSelection: () => Promise<boolean>;
  setCurrentRow: (row?: T | HysTableKey | null) => Promise<boolean>;
  toggleRowExpansion: (
    row: T | HysTableKey,
    expanded?: boolean,
  ) => Promise<boolean>;
  loadRow: (row: T | HysTableKey, force?: boolean) => Promise<boolean>;
  clearSort: () => void;
  setSort: (sort: HysTableSort | readonly HysTableSort[] | null) => void;
  clearFilter: (keys?: readonly string[]) => void;
  setFilter: (key: string, values: readonly HysTableFilterValue[]) => void;
  setPage: (page: number) => void;
  resizeColumn: (key: string, width: number) => void;
  resetColumnWidths: () => void;
  doLayout: () => Promise<void>;
  scrollTo: (options: ScrollToOptions) => void;
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
  return { leaves: leaves(ordered), headers };
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
      const av =
          typeof column.sortBy === "function"
            ? column.sortBy(a)
            : tableValue(a, column.sortBy ?? column.dataIndex ?? column.key),
        bv =
          typeof column.sortBy === "function"
            ? column.sortBy(b)
            : tableValue(b, column.sortBy ?? column.dataIndex ?? column.key);
      if (av == null || bv == null) {
        if (av == null && bv == null) continue;
        return av == null ? 1 : -1;
      }
      const result = column.sorter
        ? column.sorter(a, b)
        : typeof av === "number" && typeof bv === "number"
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
