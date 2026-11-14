import type { HysPopupMotionProps } from "../motion/popup";
import { gridKeyToken, isGridKey } from "./gridCore";
import type { HysDataGridColumnLayout, HysDataGridColumnLayoutSnapshot } from "../components/HysDataGrid/gridColumnLayout";
import type {
  HysDataGridCellContext, HysDataGridCellView, HysDataGridClass, HysDataGridContextMenu,
  HysDataGridHeaderContext, HysDataGridHeaderGroup, HysDataGridPin,
  HysDataGridRowContext, HysDataGridStyle,
} from "../components/HysDataGrid/gridPresentation";
export type HysDataGridKey = string | number;
export type HysDataGridSort = { key: string; direction: "asc" | "desc" };
export interface HysDataGridQuery {
  page: number;
  pageSize: number;
  sort: HysDataGridSort[];
  search: string;
  filters: Record<string, string>;
}
export interface GridColumn<T extends object = Record<string, unknown>> {
  key: string;
  label: string;
  field?: string | ((row: T) => unknown);
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  sortMethod?: (a: T, b: T) => number;
  filterable?: boolean;
  filterMethod?: (value: string, row: T) => boolean;
  hideable?: boolean;
  resizable?: boolean;
  reorderable?: boolean;
  pinned?: "left" | "right";
  pinnable?: boolean;
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
  headerWrap?: boolean;
  group?: HysDataGridHeaderGroup;
  summary?: "sum" | "avg" | "min" | "max" | "count";
  editable?: boolean | ((context: HysDataGridCellContext<T>) => boolean);
  formatter?: (context: HysDataGridCellContext<T>) => string | number | null | undefined;
  wrap?: boolean | number;
  emptyText?: string;
}
export interface HysDataGridResult<T extends object> {
  rows: readonly T[];
  total: number;
}
export type HysDataGridLoader<T extends object> = (
  query: HysDataGridQuery,
  context: { signal: AbortSignal },
) => Promise<HysDataGridResult<T>> | HysDataGridResult<T>;
export interface HysDataGridProps<
  T extends object,
> extends HysPopupMotionProps {
  columns: readonly GridColumn<T>[];
  rows: readonly T[];
  rowKey?: string | ((row: T, index: number) => HysDataGridKey);
  page?: number;
  pageSize?: number;
  showToolbar?: boolean;
  pagination?: boolean;
  rowNumbers?: boolean;
  query?: HysDataGridQuery;
  defaultQuery?: Partial<HysDataGridQuery>;
  immediateQuery?: boolean;
  serverMode?: boolean;
  loadRows?: HysDataGridLoader<T>;
  totalRows?: number;
  storageKey?: string;
  selectable?: boolean;
  rowSelectable?: (row: T, index: number) => boolean;
  selectedRowKeys?: readonly HysDataGridKey[];
  defaultSelectedRowKeys?: readonly HysDataGridKey[];
  reserveSelection?: boolean;
  selectionType?: "checkbox" | "radio";
  loading?: boolean;
  emptyText?: string;
  density?: "compact" | "normal" | "comfortable";
  multiSort?: boolean;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  scrollToTopOnQuery?: boolean;
  groupable?: boolean;
  groupBy?: string;
  defaultGroupBy?: string;
  groupSummary?: boolean;
  showSummary?: boolean;
  summaryScope?: "filtered" | "page" | "selected";
  summaryMethod?: (
    column: GridColumn<T>,
    rows: readonly T[],
  ) => string | number;
  treeMode?: boolean;
  parentKey?: string;
  editable?: boolean;
  keyboardNavigation?: boolean;
  cellNavigation?: boolean;
  emptyCellText?: string;
  caption?: string;
  striped?: boolean;
  highlightCurrentRow?: boolean;
  currentRowKey?: HysDataGridKey | null;
  defaultCurrentRowKey?: HysDataGridKey;
  rowClassName?: HysDataGridClass<HysDataGridRowContext<T>>;
  rowStyle?: HysDataGridStyle<HysDataGridRowContext<T>>;
  cellClassName?: HysDataGridClass<HysDataGridCellContext<T>>;
  cellStyle?: HysDataGridStyle<HysDataGridCellContext<T>>;
  cellSpan?: (context: HysDataGridCellContext<T>) => { rows: number; columns: number } | undefined;
  cellTooltip?: boolean;
  virtualRows?: { height: (row: T) => number; overscan?: number };
  virtualColumns?: boolean;
  headerClassName?: HysDataGridClass<HysDataGridHeaderContext<T>>;
  headerStyle?: HysDataGridStyle<HysDataGridHeaderContext<T>>;
  /** Controlled column order. Omitted columns follow in declaration order. */
  columnOrder?: readonly string[];
  commitColumnWidth?: (key: string, width: number) => boolean;
  fillRemainingWidth?: boolean;
  contextMenu?: HysDataGridContextMenu<T>;
  /** Show a column menu button in each header when context menus are enabled. Defaults to true. */
  headerMenuButton?: boolean;
}
export interface HysDataGridInstance {
  resetColumns(): void;
  getColumnLayout(): HysDataGridColumnLayoutSnapshot;
  applyColumnLayout(layout: HysDataGridColumnLayout): void;
  setGroupBy(key: string): void;
  setGroupsExpanded(expanded: boolean): void;
  getQuery(): HysDataGridQuery;
  setQuery(query: Partial<HysDataGridQuery>): void;
  resetQuery(): void;
  reload(): void;
  getSelection(): HysDataGridKey[];
  clearSelection(): void;
  toggleRowSelection(key: HysDataGridKey, checked?: boolean): void;
  scrollTo(options: ScrollToOptions): void;
  scrollToRow(key: HysDataGridKey): boolean;
  focusRow(key: HysDataGridKey): boolean;
  focusCell(rowKey: HysDataGridKey, columnKey: string, focus?: boolean): boolean;
  isCellVisible(rowKey: HysDataGridKey, columnKey: string): boolean;
  getCellView(): HysDataGridCellView<object> | undefined;
  getCurrentRowKey(): HysDataGridKey | null;
  setCurrentRow(key: HysDataGridKey | null): void;
  setColumnVisibility(key: string, visible: boolean): boolean;
  pinColumn(key: string, side: HysDataGridPin | null): boolean;
  resizeColumn(key: string, width: number): boolean;
  resetColumnWidth(key: string): boolean;
}
export type GridRow<T extends object> = {
  row: T;
  id: HysDataGridKey;
  index: number;
};
export type GridTreeRow<T extends object> = GridRow<T> & {
  depth: number;
  hasChildren: boolean;
};
export const gridKey = isGridKey;
export const gridToken = gridKeyToken;
export const positiveInteger = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : fallback;
export function gridField(row: object, path: string): unknown {
  const record = row as Record<string, unknown>;
  if (Object.hasOwn(record, path)) return record[path];
  return path
    .split(".")
    .reduce<unknown>(
      (value, part) =>
        value && typeof value === "object" && Object.hasOwn(value, part)
          ? (value as Record<string, unknown>)[part]
          : undefined,
      record,
    );
}
export function gridValue<T extends object>(row: T, column: GridColumn<T>) {
  return typeof column.field === "function"
    ? column.field(row)
    : gridField(row, column.field ?? column.key);
}
export function gridRows<T extends object>(
  rows: readonly T[],
  rowKey: NonNullable<HysDataGridProps<T>["rowKey"]>,
  offset: number,
): GridRow<T>[] {
  const keys = rows.map((row, index) =>
    typeof rowKey === "function"
      ? rowKey(row, index + offset)
      : gridField(row, rowKey),
  );
  const used = new Set(keys.filter(gridKey));
  const seen = new Set<HysDataGridKey>();
  return rows.map((row, index) => {
    const raw = keys[index];
    let id: HysDataGridKey = index + offset;
    if (gridKey(raw) && !seen.has(raw)) id = raw;
    else {
      while (used.has(id)) id = "row:" + id;
      used.add(id);
    }
    seen.add(id);
    return { row, id, index: index + offset };
  });
}
export function gridTree<T extends object>(
  rows: readonly GridRow<T>[],
  parentKey: string,
  expanded: ReadonlySet<HysDataGridKey>,
): GridTreeRow<T>[] {
  const ids = new Set(rows.map(({ id }) => id));
  const parents = new Map<HysDataGridKey, HysDataGridKey>();
  for (const { row, id } of rows) {
    const parent = gridField(row, parentKey);
    if (gridKey(parent) && parent !== id && ids.has(parent))
      parents.set(id, parent);
  }
  // Break cycles before walking so closed branches remain closed.
  const visited = new Set<HysDataGridKey>();
  for (const { id } of rows) {
    const path = new Set<HysDataGridKey>();
    let current: HysDataGridKey | undefined = id;
    while (current !== undefined && !visited.has(current)) {
      if (path.has(current)) {
        parents.delete(current);
        break;
      }
      path.add(current);
      current = parents.get(current);
    }
    for (const key of path) visited.add(key);
  }
  const children = new Map<HysDataGridKey | undefined, GridRow<T>[]>();
  for (const row of rows) {
    const key = parents.get(row.id);
    const list = children.get(key);
    if (list) list.push(row);
    else children.set(key, [row]);
  }
  const stack = (children.get(undefined) ?? [])
    .map((row) => ({ row, depth: 0 }))
    .reverse();
  const result: GridTreeRow<T>[] = [];
  while (stack.length) {
    const { row, depth } = stack.pop()!;
    const nested = children.get(row.id);
    result.push({ ...row, depth, hasChildren: !!nested?.length });
    if (nested && expanded.has(row.id)) {
      for (let i = nested.length - 1; i >= 0; i--)
        stack.push({ row: nested[i], depth: depth + 1 });
    }
  }
  return result;
}
