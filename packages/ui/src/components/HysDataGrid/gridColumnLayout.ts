import { positiveInteger, type GridColumn } from "../../composables/dataGrid";
import type { HysDataGridPin } from "./gridPresentation";

export interface HysDataGridColumnLayout {
  order?: readonly string[];
  hidden?: readonly string[];
  widths?: Readonly<Record<string, number>>;
  pins?: Readonly<Record<string, HysDataGridPin | null>>;
}
export type HysDataGridColumnLayoutSnapshot = Required<
  Omit<HysDataGridColumnLayout, "pins">
> &
  Pick<HysDataGridColumnLayout, "pins">;

export const gridMinColumnWidth = (column: Pick<GridColumn, "minWidth">) =>
  positiveInteger(column.minWidth, 80);
export const gridMaxColumnWidth = (
  column: Pick<GridColumn, "minWidth" | "maxWidth">,
) =>
  Math.max(gridMinColumnWidth(column), positiveInteger(column.maxWidth, 800));
export const gridBoundColumnWidth = (
  column: Pick<GridColumn, "minWidth" | "maxWidth">,
  width: number,
) =>
  Math.max(
    gridMinColumnWidth(column),
    Math.min(gridMaxColumnWidth(column), width),
  );

export function normalizeGridColumnLayout<T extends object>(
  columns: ReadonlyMap<string, GridColumn<T>>,
  layout?: HysDataGridColumnLayout,
) {
  const keys = [...columns.keys()];
  const order = [
    ...new Set([
      ...(Array.isArray(layout?.order)
        ? layout.order.filter((key) => columns.has(key))
        : []),
      ...keys,
    ]),
  ];
  const hidden = [
    ...new Set(
      Array.isArray(layout?.hidden)
        ? layout.hidden.filter(
            (key) => columns.has(key) && columns.get(key)?.hideable !== false,
          )
        : [],
    ),
  ];
  const widths = Object.fromEntries(
    Object.entries(layout?.widths ?? {}).flatMap(([key, width]) => {
      const column = columns.get(key);
      return column && typeof width === "number" && Number.isFinite(width)
        ? [[key, gridBoundColumnWidth(column, width)]]
        : [];
    }),
  );
  const pins = Object.fromEntries(
    Object.entries(layout?.pins ?? {}).filter(
      ([key, side]) =>
        columns.has(key) &&
        columns.get(key)?.pinnable !== false &&
        (side === null || side === "left" || side === "right"),
    ),
  );
  return {
    order,
    hidden: hidden.length === keys.length ? [] : hidden,
    widths,
    pins,
  };
}
