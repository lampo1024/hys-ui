import type { CSSProperties, HTMLAttributes, VNodeChild } from "vue";
import { gridKeyToken, isGridKey } from "./gridCore";
export type HysVirtualTableKey = string | number;
export type HysVirtualTableAlign = "start" | "center" | "end" | "nearest";
export interface HysVirtualTableSort {
  key: string;
  direction: "asc" | "desc";
}
export interface HysVirtualTableCell<
  T extends object = Record<string, unknown>,
> {
  row: T;
  column: HysVirtualTableColumn<T>;
  value: unknown;
  rowIndex: number;
  columnIndex: number;
}
export interface HysVirtualTableColumn<T extends object = any> {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  dataIndex?: string | readonly (string | number)[];
  valueGetter?: (row: T, index: number) => unknown;
  formatter?: (context: HysVirtualTableCell<T>) => VNodeChild;
  fixed?: boolean | "left" | "right";
  hidden?: boolean;
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
  sortable?: boolean | "custom";
  sorter?: (a: T, b: T) => number;
  className?: string;
  headerClassName?: string;
}
export interface HysVirtualTableRange {
  start: number;
  end: number;
  visibleStart: number;
  visibleEnd: number;
  columnKeys: string[];
}
export interface HysVirtualTableScroll {
  scrollTop: number;
  scrollLeft: number;
  direction: "up" | "down" | "left" | "right" | null;
}
export interface HysVirtualTableProps<T extends object> {
  rows: readonly T[];
  columns: readonly HysVirtualTableColumn<T>[];
  rowKey?: string | ((row: T, index: number) => HysVirtualTableKey);
  rowHeight?: number;
  height?: number | string;
  width?: number | string;
  headerHeight?: number;
  showHeader?: boolean;
  fit?: boolean;
  overscan?: number;
  virtualColumns?: boolean;
  columnOverscan?: number;
  loading?: boolean;
  loadingMode?: "replace" | "overlay";
  loadingText?: string;
  emptyText?: string;
  disabled?: boolean;
  fixedRows?: readonly T[];
  striped?: boolean;
  bordered?: boolean;
  sortState?: HysVirtualTableSort | null;
  defaultSort?: HysVirtualTableSort | null;
  selectable?: boolean | ((row: T, index: number) => boolean);
  selectedRowKeys?: readonly HysVirtualTableKey[];
  defaultSelectedRowKeys?: readonly HysVirtualTableKey[];
  selectionType?: "checkbox" | "radio";
  selectionWidth?: number;
  reserveSelection?: boolean;
  selectOnClick?: boolean;
  currentRowKey?: HysVirtualTableKey | null;
  defaultCurrentRowKey?: HysVirtualTableKey | null;
  highlightCurrentRow?: boolean;
  keyboard?: boolean;
  endReachedThreshold?: number;
  ariaLabel?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  rowStyle?: CSSProperties | ((row: T, index: number) => CSSProperties);
  cellClassName?: string | ((context: HysVirtualTableCell<T>) => string);
  cellStyle?:
    CSSProperties | ((context: HysVirtualTableCell<T>) => CSSProperties);
  customRow?: (row: T, index: number) => HTMLAttributes;
  customCell?: (context: HysVirtualTableCell<T>) => HTMLAttributes;
  customHeaderCell?: (
    column: HysVirtualTableColumn<T>,
    index: number,
  ) => HTMLAttributes;
}
export interface HysVirtualTableInstance<
  T extends object = Record<string, unknown>,
> {
  readonly element: HTMLElement | undefined;
  readonly viewport: HTMLElement | undefined;
  readonly scrollTop: number;
  readonly scrollLeft: number;
  readonly range: HysVirtualTableRange;
  readonly selectedRowKeys: HysVirtualTableKey[];
  readonly sortState: HysVirtualTableSort | null;
  scrollTo(options: {
    top?: number;
    left?: number;
    behavior?: ScrollBehavior;
  }): void;
  scrollToRow(index: number, align?: HysVirtualTableAlign): void;
  scrollToKey(key: HysVirtualTableKey, align?: HysVirtualTableAlign): boolean;
  scrollToColumn(key: string, align?: HysVirtualTableAlign): boolean;
  focusCell(index: number, key?: string): Promise<boolean>;
  setSort(sort: HysVirtualTableSort | null): Promise<boolean>;
  clearSelection(): Promise<boolean>;
  toggleRowSelection(
    key: HysVirtualTableKey,
    selected?: boolean,
  ): Promise<boolean>;
  selectAll(selected?: boolean): Promise<boolean>;
  setCurrentRow(key: HysVirtualTableKey | null): Promise<boolean>;
  getRow(index: number): T | undefined;
  remeasure(): void;
}
export const virtualFinite = (
  value: unknown,
  fallback: number,
  min = 0,
  max = 1e7,
) =>
  Math.max(
    min,
    Math.min(
      max,
      typeof value === "number" && Number.isFinite(value) ? value : fallback,
    ),
  );
export const virtualKey = isGridKey;
export const virtualToken = gridKeyToken;
export function virtualValue<T extends object>(
  row: T,
  column: HysVirtualTableColumn<T>,
  index: number,
): unknown {
  if (column.valueGetter) return column.valueGetter(row, index);
  const path = column.dataIndex ?? column.key;
  if (
    typeof path === "string" &&
    Object.prototype.hasOwnProperty.call(row, path)
  )
    return (row as Record<string, unknown>)[path];
  return (typeof path === "string" ? path.split(".") : path).reduce<unknown>(
    (value, key) =>
      value !== null && typeof value === "object"
        ? (value as Record<string, unknown>)[key]
        : undefined,
    row,
  );
}
export interface VirtualEntry<T extends object> {
  row: T;
  key: HysVirtualTableKey;
  token: string;
  sourceIndex: number;
  valid: boolean;
}
export function virtualEntries<T extends object>(
  rows: readonly T[],
  rowKey: HysVirtualTableProps<T>["rowKey"],
): VirtualEntry<T>[] {
  const keys = rows.map((row, index) =>
      typeof rowKey === "function"
        ? rowKey(row, index)
        : (row as Record<string, unknown>)[rowKey || "id"],
    ),
    counts = new Map<HysVirtualTableKey, number>();
  for (const key of keys)
    if (virtualKey(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  return rows.map((row, index) => {
    const key = keys[index],
      valid = virtualKey(key) && counts.get(key) === 1;
    return {
      row,
      key: valid ? key : index,
      token: valid ? virtualToken(key) : "fallback:" + index,
      sourceIndex: index,
      valid,
    };
  });
}
export function virtualAligned(
  start: number,
  size: number,
  scroll: number,
  extent: number,
  align: HysVirtualTableAlign,
): number {
  if (align === "center") return start - (extent - size) / 2;
  if (align === "end") return start + size - extent;
  if (align === "nearest") {
    if (size > extent && start <= scroll && start + size >= scroll + extent)
      return scroll;
    return start < scroll
      ? start
      : start + size > scroll + extent
        ? size > extent
          ? start
          : start + size - extent
        : scroll;
  }
  return start;
}
