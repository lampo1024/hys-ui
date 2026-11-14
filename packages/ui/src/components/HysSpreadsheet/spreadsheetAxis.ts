import {
  cellAddress,
  parseAddress,
  sheetLimits,
  sheetWidth,
  shiftWorkbook,
} from "./spreadsheetModel";
import { offsetFormula } from "./spreadsheetReferences";
import { moveAxisReferences } from "./spreadsheetAxisReferences";
import { moveSortRowOrder } from "./spreadsheetSortOrder";
import type {
  HysSpreadsheetAxis as Axis,
  HysSpreadsheetAxisCommand as Command,
  HysSpreadsheetGroup,
  HysSpreadsheetSheet as Sheet,
  HysSpreadsheetWorkbook as Workbook,
} from "./spreadsheetTypes";

export function axisCount(sheet: Sheet, axis: Axis) {
  return axis === "row" ? sheet.rows.length : sheetWidth(sheet);
}

export function axisHidden(sheet: Sheet, axis: Axis, index: number) {
  const options = axis === "row" ? sheet.rowOptions : sheet.columnOptions;
  const groups = axis === "row" ? sheet.rowGroups : sheet.columnGroups;
  return (
    !!options?.[index]?.hidden ||
    !!groups?.some(
      ({ start, end, collapsed }) => collapsed && index > start && index <= end,
    )
  );
}

const replace = (book: Workbook, sheet: Sheet) => ({
  ...book,
  sheets: book.sheets.map((item) => (item.id === sheet.id ? sheet : item)),
});
const groupKey = (axis: Axis) =>
  axis === "row" ? "rowGroups" : "columnGroups";
const optionsKey = (axis: Axis) =>
  axis === "row" ? "rowOptions" : "columnOptions";

export function remapAxisMetadata(
  sheet: Sheet,
  axis: Axis,
  map: (index: number) => number | undefined,
) {
  const option = optionsKey(axis);
  const group = groupKey(axis);
  const remapColumns = <Rule extends { column: number }>(
    rules?: readonly Rule[],
  ) =>
    axis === "row"
      ? rules
      : rules?.flatMap((rule) => {
          const column = map(rule.column);
          return column === undefined ? [] : [{ ...rule, column }];
        });
  const entries = Object.entries(sheet[option] ?? {}).flatMap(
    ([index, value]) => {
      const target = map(Number(index));
      return target === undefined ? [] : [[target, value] as const];
    },
  );
  function address(key: string) {
    const point = parseAddress(key);
    if (!point) return;
    const index = map(point[axis]);
    if (index !== undefined)
      return cellAddress(
        axis === "row" ? index : point.row,
        axis === "column" ? index : point.column,
      );
  }
  function range(key: string) {
    const [start, end] = key.split(":");
    const first = parseAddress(start);
    const last = parseAddress(end ?? start);
    if (!first || !last) return;
    const mapped: number[] = [];
    for (
      let index = Math.min(first[axis], last[axis]);
      index <= Math.max(first[axis], last[axis]);
      index++
    ) {
      const target = map(index);
      if (target !== undefined) mapped.push(target);
    }
    if (!mapped.length) return;
    first[axis] = Math.min(...mapped);
    last[axis] = Math.max(...mapped);
    return `${cellAddress(first.row, first.column)}:${cellAddress(last.row, last.column)}`;
  }
  function groupRange(value: HysSpreadsheetGroup) {
    const indices: number[] = [];
    for (let index = value.start; index <= value.end; index++) {
      const target = map(index);
      if (target !== undefined) indices.push(target);
    }
    return indices.length > 1
      ? [{ ...value, start: Math.min(...indices), end: Math.max(...indices) }]
      : [];
  }
  return {
    [option]: Object.fromEntries(entries),
    [group]: sheet[group]?.flatMap(groupRange),
    merges: sheet.merges?.flatMap((merge) => {
      const target = range(merge);
      return target && target.split(":")[0] !== target.split(":")[1]
        ? [target]
        : [];
    }),
    filters: remapColumns(sheet.filters),
    sortKeys: remapColumns(sheet.sortKeys),
    groupColumn:
      axis === "column" && sheet.groupColumn !== undefined
        ? map(sheet.groupColumn)
        : sheet.groupColumn,
    conditionalFormats: sheet.conditionalFormats?.flatMap((rule) => {
      const target = range(rule.range);
      return target ? [{ ...rule, range: target }] : [];
    }),
    cells:
      sheet.cells &&
      Object.fromEntries(
        Object.entries(sheet.cells).flatMap(([key, value]) => {
          const target = address(key);
          if (!target) return [];
          const compare = value.validation?.compare;
          return [
            [
              target,
              compare
                ? {
                    ...value,
                    validation: {
                      ...value.validation,
                      compare: {
                        ...compare,
                        address: address(compare.address) ?? "#REF!",
                      },
                    },
                  }
                : value,
            ],
          ];
        }),
      ),
  };
}

export function updateAxis(
  book: Workbook,
  sheet: Sheet,
  command: Command,
): Workbook | undefined {
  if (command.type === "freeze") {
    if (
      !Number.isInteger(command.rows) ||
      !Number.isInteger(command.columns) ||
      command.rows < 0 ||
      command.rows > sheet.rows.length ||
      command.columns < 0 ||
      command.columns > sheetWidth(sheet)
    )
      return;
    return replace(book, {
      ...sheet,
      frozenRows: command.rows,
      frozenColumns: command.columns,
    });
  }
  const { axis, index } = command;
  const length = axisCount(sheet, axis);
  const count = "count" in command ? (command.count ?? 1) : 1;
  const limits = axis === "row" ? sheetLimits.rows : sheetLimits.columns;
  if (
    !Number.isInteger(index) ||
    !Number.isInteger(count) ||
    index < 0 ||
    count < 1 ||
    (command.type === "insert" ? index > length : index + count > length)
  )
    return;

  if (command.type === "insert" || command.type === "delete") {
    const add = command.type === "insert";
    if (add ? length + count > limits : length === count) return;
    return shiftWorkbook(book, sheet, axis, index, add, count);
  }
  if (command.type === "configure") {
    const key = optionsKey(axis);
    const options = { ...sheet[key] };
    for (let position = index; position < index + count; position++) {
      options[position] = { ...options[position], ...command.options };
      const size = options[position].size;
      if (
        size !== undefined &&
        (!Number.isFinite(size) || size < 16 || size > 1000)
      )
        return;
    }
    const updated = { ...sheet, [key]: options };
    if (
      !Array.from({ length }, (_, position) => position).some(
        (position) => !axisHidden(updated, axis, position),
      )
    )
      return;
    return replace(book, updated);
  }
  if (
    command.type === "group" ||
    command.type === "toggleGroup" ||
    command.type === "removeGroup"
  ) {
    const key = groupKey(axis);
    const groups = [...(sheet[key] ?? [])];
    const entry = groups.findIndex((group) => group.start === index);
    if (command.type === "group") {
      if (count < 2 || entry >= 0) return;
      groups.push({ start: index, end: index + count - 1 });
    } else if (entry < 0) return;
    else if (command.type === "removeGroup") groups.splice(entry, 1);
    else
      groups[entry] = { ...groups[entry], collapsed: !groups[entry].collapsed };
    const updated = { ...sheet, [key]: groups };
    if (
      !Array.from({ length }, (_, position) => position).some(
        (position) => !axisHidden(updated, axis, position),
      )
    )
      return;
    return replace(book, updated);
  }
  if (command.type === "copy") {
    if (length + count > limits) return;
    const inserted = shiftWorkbook(
      book,
      sheet,
      axis,
      index + count,
      true,
      count,
    );
    const target = inserted.sheets.find(({ id }) => id === sheet.id)!;
    const rows = target.rows.map((row) => [...row]);
    const formats = { ...target.formats };
    const cells = { ...target.cells };
    const key = optionsKey(axis);
    const options = { ...target[key] };
    for (let position = index; position < index + count; position++) {
      if (options[position])
        options[position + count] = { ...options[position] };
      for (
        let other = 0;
        other < (axis === "row" ? sheetWidth(target) : rows.length);
        other++
      ) {
        const row = axis === "row" ? position : other;
        const column = axis === "column" ? position : other;
        const nextRow = row + (axis === "row" ? count : 0);
        const nextColumn = column + (axis === "column" ? count : 0);
        const source = cellAddress(row, column);
        const destination = cellAddress(nextRow, nextColumn);
        const value = rows[row][column];
        rows[nextRow][nextColumn] =
          typeof value === "string" && value.startsWith("=")
            ? offsetFormula(value, nextRow - row, nextColumn - column)
            : (value ?? null);
        if (formats[source]) formats[destination] = formats[source];
        if (cells[source]) cells[destination] = cells[source];
      }
    }
    return replace(inserted, {
      ...target,
      rows,
      formats,
      cells,
      [key]: options,
    });
  }
  if (command.type !== "move") return;
  const { to } = command;
  if (!Number.isInteger(to) || to < 0 || to > length - count || to === index)
    return;
  const order = Array.from({ length }, (_, position) => position);
  order.splice(to, 0, ...order.splice(index, count));
  const positions = new Map(order.map((old, position) => [old, position]));
  const references = moveAxisReferences(axis, positions, sheet.name);
  const rows =
    axis === "row"
      ? order.map((position) => sheet.rows[position])
      : sheet.rows.map((row) => order.map((position) => row[position] ?? null));
  const formats = Object.fromEntries(
    Object.entries(sheet.formats ?? {}).map(([key, value]) => [
      references.address(key),
      value,
    ]),
  );
  const updated = replace(book, {
    ...sheet,
    ...remapAxisMetadata(sheet, axis, (position) => positions.get(position)),
    rows,
    formats,
    ...(axis === "row" && {
      sortRowOrder: moveSortRowOrder(sheet, order, index, to, count),
    }),
  });
  return {
    ...updated,
    names:
      book.names &&
      Object.fromEntries(
        Object.entries(book.names).map(([key, named]) => {
          if (named.sheetId !== sheet.id) return [key, named];
          const [first, last] = named.range.split(":");
          return [
            key,
            {
              ...named,
              range: references.rectangularReference(first, last),
            },
          ];
        }),
      ),
    sheets: updated.sheets.map((item) => ({
      ...item,
      rows: item.rows.map((row) =>
        row.map((value) => {
          if (typeof value !== "string" || !value.startsWith("=")) return value;
          return references.formula(value, item.id === sheet.id);
        }),
      ),
    })),
  };
}
