import type { CSSProperties } from "vue";
import type { HysContextMenuItem } from "../../composables/menu";
import type {
  GridColumn,
  HysDataGridKey,
  HysDataGridSort,
} from "../../composables/dataGrid";

export type HysDataGridPin = "left" | "right";
export interface HysDataGridHeaderGroup {
  key: string;
  label: string;
}
export interface HysDataGridHeaderContext<T extends object> {
  column: GridColumn<T>;
  columnIndex: number;
  sort: HysDataGridSort["direction"] | undefined;
  filter: string;
  pinned: HysDataGridPin | undefined;
}
export interface HysDataGridRowContext<T extends object> {
  row: T;
  rowKey: HysDataGridKey;
  index: number;
  pageIndex: number;
  depth: number;
  selected: boolean;
  current: boolean;
}
export interface HysDataGridCellContext<
  T extends object,
> extends HysDataGridRowContext<T> {
  column: GridColumn<T>;
  columnIndex: number;
  value: unknown;
}
export interface HysDataGridCellView<T extends object> {
  readonly rowKeys: readonly HysDataGridKey[];
  readonly columnKeys: readonly string[];
  getCell(rowKey: HysDataGridKey, columnKey: string): HysDataGridCellContext<T> | undefined;
}
export type HysDataGridContext<T extends object> =
  | ({ type: "header" } & HysDataGridHeaderContext<T>)
  | ({ type: "row" } & HysDataGridRowContext<T>)
  | ({ type: "cell" } & HysDataGridCellContext<T>);
export type HysDataGridContextMenu<T extends object> =
  | boolean
  | ((
      context: HysDataGridContext<T>,
      items: readonly HysContextMenuItem[],
    ) => readonly HysContextMenuItem[] | false);
export type HysDataGridClass<C> = string | ((context: C) => string | undefined);
export type HysDataGridStyle<C> =
  CSSProperties | ((context: C) => CSSProperties | undefined);

interface HeaderGroup<T extends object> {
  id: string;
  group: HysDataGridHeaderGroup | undefined;
  columns: GridColumn<T>[];
  pinned: HysDataGridPin | undefined;
}
export function gridHeaderGroups<T extends object>(
  columns: readonly GridColumn<T>[],
  pinOf: (column: GridColumn<T>) => HysDataGridPin | undefined,
) {
  const result: HeaderGroup<T>[] = [];
  for (const column of columns) {
    const pinned = pinOf(column);
    const previous = result.at(-1);
    if (
      previous &&
      previous.group?.key === column.group?.key &&
      previous.pinned === pinned
    )
      previous.columns.push(column);
    else
      result.push({
        id: column.key,
        group: column.group,
        columns: [column],
        pinned,
      });
  }
  return result;
}
