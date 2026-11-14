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
  wrap?: boolean | number;
  emptyText?: string;
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
  action: "sort" | "filter" | "page" | "pageSize" | "search";
  page: number;
  pageSize: number;
  sorts: HysTableSort[];
  filters: HysTableFilters;
  search?: string;
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
  keyboardNavigation?: boolean;
  cellNavigation?: boolean;
  emptyCellText?: string;
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
  search?: string;
  defaultSearch?: string;
  searchColumns?: readonly string[];
  searchMethod?: (search: string, row: T) => boolean;
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
  setSearch: (search: string) => void;
  clearSearch: () => void;
  focusRow: (row: T | HysTableKey) => boolean;
  focusCell: (row: T | HysTableKey, columnKey: string) => boolean;
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
