import { axisCount } from "./spreadsheetAxis";
import type {
  HysSpreadsheetAxis,
  HysSpreadsheetSheet,
} from "./spreadsheetTypes";

export type HiddenAxisRange = {
  start: number;
  end: number;
  side: "before" | "after";
  indices: number[];
};

export function hiddenAxisMarkers(
  sheet: HysSpreadsheetSheet,
  axis: HysSpreadsheetAxis,
  visible: readonly number[],
) {
  const markers = new Map<number, HiddenAxisRange[]>();
  const options = axis === "row" ? sheet.rowOptions : sheet.columnOptions;
  if (!visible.length || !options) return markers;
  const last = axisCount(sheet, axis) - 1;
  const groups = (axis === "row" ? sheet.rowGroups : sheet.columnGroups) ?? [];
  const hidden = Object.keys(options)
    .map(Number)
    .filter(
      (index) =>
        Number.isInteger(index) &&
        index >= 0 &&
        index <= last &&
        options[index]?.hidden &&
        !groups.some(
          (group) =>
            group.collapsed && index > group.start && index <= group.end,
        ),
    )
    .sort((a, b) => a - b);
  let position = 0;
  for (const index of hidden) {
    while (position < visible.length && visible[position] < index) position++;
    const next = visible[position];
    const anchor = next ?? visible.at(-1)!;
    const ranges = markers.get(anchor) ?? [];
    const side = next === undefined ? "after" : "before";
    const previous = ranges.at(-1);
    // Filters can put multiple hidden ranges at the same visual boundary.
    if (previous?.side === side) {
      previous.end = index;
      previous.indices.push(index);
    } else ranges.push({ start: index, end: index, side, indices: [index] });
    markers.set(anchor, ranges);
  }
  return markers;
}
