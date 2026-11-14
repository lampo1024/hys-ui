import {
  areaFromAddresses,
  canEdit,
  points,
  withValues,
} from "./spreadsheetCells";
import { cellAddress, sheetWidth } from "./spreadsheetModel";
import { offsetFormula } from "./spreadsheetReferences";
import {
  sortFormulaReferences,
  spreadsheetDetailRows,
} from "./spreadsheetSortReferences";
import type {
  HysSpreadsheetArea as Area,
  HysSpreadsheetCellContext as Context,
  HysSpreadsheetConditionalFormat as Rule,
  HysSpreadsheetCompare as CompareFunction,
  HysSpreadsheetDataCommand as Command,
  HysSpreadsheetFilter as Filter,
  HysSpreadsheetFilterFunction as FilterFunction,
  HysSpreadsheetSheet as Sheet,
  HysSpreadsheetValue as Value,
} from "./spreadsheetTypes";

export type Read = (
  row: number,
  column: number,
) => { value: Value; error?: string };
const compare = (a: Value, b: Value) =>
  a === b
    ? 0
    : a === null
      ? -1
      : b === null
        ? 1
        : typeof a === "number" && typeof b === "number"
          ? a - b
          : String(a).localeCompare(String(b), undefined, {
              numeric: true,
              sensitivity: "base",
            });
const blank = (value: Value) => value === null || value === "";
const contains = (area: Area, row: number, column: number) =>
  row >= area.top &&
  row <= area.bottom &&
  column >= area.left &&
  column <= area.right;
const getArea = (range: string) => {
  const [first, last] = range.split(":");
  return areaFromAddresses(first, last);
};

function filterMatch(
  sheet: Sheet,
  row: number,
  rule: Filter,
  read: Read,
  custom?: Readonly<Record<string, FilterFunction>>,
) {
  const value = read(row, rule.column).value;
  const target = rule.value ?? null;
  const order = compare(value, target);
  const address = cellAddress(row, rule.column);
  switch (rule.operator) {
    case "eq":
      return order === 0;
    case "ne":
      return order !== 0;
    case "gt":
      return order > 0;
    case "gte":
      return order >= 0;
    case "lt":
      return order < 0;
    case "lte":
      return order <= 0;
    case "between":
      return order >= 0 && compare(value, rule.end ?? null) <= 0;
    case "empty":
      return blank(value);
    case "notEmpty":
      return !blank(value);
    case "color":
      return sheet.formats?.[address]?.backgroundColor === target;
    case "contains":
      return String(value ?? "")
        .toLowerCase()
        .includes(String(target ?? "").toLowerCase());
    case "startsWith":
      return String(value ?? "")
        .toLowerCase()
        .startsWith(String(target ?? "").toLowerCase());
    case "custom":
      return !!(
        custom &&
        rule.rule &&
        Object.hasOwn(custom, rule.rule) &&
        custom[rule.rule](
          { sheet, row, column: rule.column, address, value },
          rule,
        )
      );
  }
}

export function filtered(
  sheet: Sheet,
  row: number,
  read: Read,
  custom?: Readonly<Record<string, FilterFunction>>,
) {
  if (!sheet.filters?.length || (sheet.filterHeader && row === 0)) return false;
  const match = (rule: Filter) => filterMatch(sheet, row, rule, read, custom);
  return !(sheet.filterMode === "any"
    ? sheet.filters.some(match)
    : sheet.filters.every(match));
}

export function groupedRows(
  sheet: Sheet,
  column: number | undefined,
  rows: readonly number[],
  read: Read,
) {
  if (column === undefined) return [];
  const groups = new Map<
    Value,
    { label: string; rows: number[]; sums: Map<number, number> }
  >();
  const width = sheetWidth(sheet);
  for (const row of rows) {
    if (row === 0 && sheet.groupHeader) continue;
    const key = read(row, column).value;
    let group = groups.get(key);
    if (!group)
      groups.set(
        key,
        (group = { label: String(key ?? "（空）"), rows: [], sums: new Map() }),
      );
    group.rows.push(row);
    for (let index = 0; index < width; index++) {
      if (index === column) continue;
      const value = read(row, index).value;
      if (typeof value === "number")
        group.sums.set(index, (group.sums.get(index) ?? 0) + value);
    }
  }
  return [...groups.values()];
}

export function updateData(
  sheet: Sheet,
  area: Area | undefined,
  command: Command,
  read: Read,
  icon: (row: number, column: number) => string,
  customCompare?: CompareFunction,
): Sheet | undefined {
  const width = sheetWidth(sheet);
  const validColumn = (index: number) =>
    Number.isInteger(index) && index >= 0 && index < width;
  if (command.type === "clearSort" && !sheet.sortRowOrder) {
    if (!sheet.sortKeys?.length) return;
    return { ...sheet, sortKeys: undefined };
  }
  if (command.type === "group") {
    if (command.column !== undefined && !validColumn(command.column)) return;
    return {
      ...sheet,
      groupColumn: command.column,
      groupHeader: command.header ?? sheet.groupHeader,
    };
  }
  if (command.type === "filter") {
    if (command.filters.some(({ column }) => !validColumn(column))) return;
    return {
      ...sheet,
      filters: [...command.filters],
      filterMode: command.match,
      filterHeader: command.header,
    };
  }
  if (command.type === "split" || command.type === "combine") {
    if (!area) return;
    const changes = [];
    for (let row = area.top; row <= area.bottom; row++) {
      if (command.type === "split") {
        const items = String(read(row, area.left).value ?? "").split(
          command.delimiter,
        );
        if (area.left + items.length > width) return;
        changes.push(
          ...items.map((value, index) => ({
            row,
            column: area.left + index,
            value,
          })),
        );
      } else {
        const items = [];
        for (let column = area.left; column <= area.right; column++)
          items.push(read(row, column).value ?? "");
        changes.push({
          row,
          column: area.left,
          value: items.join(command.delimiter),
        });
      }
    }
    if (changes.some(({ row, column }) => !canEdit(sheet, row, column))) return;
    return withValues(sheet, changes);
  }
  const clearing = command.type === "clearSort";
  const first = clearing ? 0 : (area?.top ?? 0) + (command.header ? 1 : 0);
  const last = clearing
    ? sheet.rows.length - 1
    : (area?.bottom ?? sheet.rows.length - 1);
  const details =
    command.type === "sort"
      ? spreadsheetDetailRows(sheet, !area && !!command.header)
      : undefined;
  const top = details ? Math.max(first, details.top) : first;
  const bottom = details ? Math.min(last, details.bottom) : last;
  const indices = Array.from(
    { length: Math.max(0, bottom - top + 1) },
    (_, index) => top + index,
  );
  if (!indices.length) return;
  const readContext = (row: number, column: number): Context => ({
    sheet,
    address: cellAddress(row, column),
    row,
    column,
    value: read(row, column).value,
  });
  if (command.type === "subtotal") {
    if (
      !validColumn(command.groupBy) ||
      !validColumn(command.valueColumn) ||
      command.groupBy === command.valueColumn
    )
      return;
    const buckets = new Map<Value, number>();
    for (const row of indices) {
      const key = read(row, command.groupBy).value;
      const value = read(row, command.valueColumn).value;
      buckets.set(
        key,
        (buckets.get(key) ?? 0) + (typeof value === "number" ? value : 0),
      );
    }
    const changes = [...buckets].flatMap(([value, total], index) => [
      { row: top + index, column: command.groupBy, value },
      { row: top + index, column: command.valueColumn, value: total },
    ]);
    const first = Math.min(command.groupBy, command.valueColumn);
    const last = Math.max(command.groupBy, command.valueColumn);
    for (let row = top; row <= bottom; row++)
      for (let column = first; column <= last; column++)
        if (!canEdit(sheet, row, column)) return;
    const cleared = indices.flatMap((row) => [
      { row, column: command.groupBy, value: null },
      { row, column: command.valueColumn, value: null },
    ]);
    return withValues(sheet, [...cleared, ...changes]);
  }
  if (clearing) {
    const order = sheet.sortRowOrder!;
    for (let source = 0; source < order.length; source++)
      indices[order[source]] = source;
  } else if (command.type === "sort") {
    if (
      !command.keys.length ||
      command.keys.some(({ column }) => !validColumn(column))
    )
      return;
    indices.sort((a, b) => {
      for (const key of command.keys) {
        const { column } = key;
        const item = (row: number) =>
          key.by === "color"
            ? (sheet.formats?.[cellAddress(row, column)]?.backgroundColor ??
              null)
            : key.by === "icon"
              ? icon(row, column)
              : read(row, column).value;
        const first = item(a);
        const second = item(b);
        const rank = (value: Value) => {
          const index = key.order?.indexOf(value) ?? -1;
          return index < 0 ? Number.MAX_SAFE_INTEGER : index;
        };
        const difference =
          key.by === "custom" && customCompare
            ? customCompare(readContext(a, column), readContext(b, column))
            : rank(first) - rank(second) || compare(first, second);
        if (difference) return difference * (key.direction === "desc" ? -1 : 1);
      }
      return a - b;
    });
  } else {
    const columns =
      command.columns ?? Array.from({ length: width }, (_, index) => index);
    if (columns.some((index) => !validColumn(index))) return;
    const seen = new Set<string>();
    let unique = 0;
    for (const row of indices) {
      const key = JSON.stringify(
        columns.map((column) => read(row, column).value),
      );
      if (seen.has(key)) continue;
      seen.add(key);
      indices[unique++] = row;
    }
    indices.length = unique;
  }
  const formats = { ...sheet.formats };
  const cells = { ...sheet.cells };
  const rows = sheet.rows.slice();
  const order =
    command.type === "sort" ||
    (command.type === "deduplicate" && sheet.sortRowOrder)
      ? (sheet.sortRowOrder?.slice() ?? sheet.rows.map((_, row) => row))
      : undefined;
  const discardedRows = new Set<number>();
  if (order && command.type === "deduplicate") {
    const retained = new Set(indices);
    for (let row = top; row <= bottom; row++) {
      if (!retained.has(row)) discardedRows.add(row);
    }
  }
  const emptySlots = discardedRows.values();
  const destinations =
    command.type === "sort" || clearing
      ? new Map(indices.map((row, index) => [row, top + index]))
      : undefined;
  const rewrite =
    destinations && sortFormulaReferences(sheet.name, destinations);
  const moveReferences = (row: readonly Value[]) => {
    if (!rewrite) return row;
    let changed = false;
    const values = row.map((value) => {
      if (typeof value !== "string" || !value.startsWith("=")) return value;
      const formula = rewrite(value);
      changed ||= formula !== value;
      return formula;
    });
    return changed ? values : row;
  };
  for (let row = top; row <= bottom; row++) {
    const source = indices[row - top];
    if (order) {
      const origin = source ?? emptySlots.next().value!;
      order[row] = sheet.sortRowOrder?.[origin] ?? origin;
    }
    if (clearing && source === row) {
      rows[row] = moveReferences(sheet.rows[row]);
      continue;
    }
    for (let column = 0; column < width; column++) {
      if (!canEdit(sheet, row, column)) return;
      const destination = cellAddress(row, column);
      const origin = source === undefined ? "" : cellAddress(source, column);
      if (sheet.formats?.[origin]) formats[destination] = sheet.formats[origin];
      else delete formats[destination];
      if (sheet.cells?.[origin]) cells[destination] = sheet.cells[origin];
      else delete cells[destination];
    }
    if (source === undefined) rows[row] = [];
    else if (destinations) rows[row] = moveReferences(sheet.rows[source]);
    else if (source !== row)
      rows[row] = sheet.rows[source].map((value) =>
        typeof value === "string" && value.startsWith("=")
          ? offsetFormula(value, row - source, 0)
          : value,
      );
  }
  if (command.type === "sort") {
    for (let row = 0; row < top; row++) rows[row] = moveReferences(rows[row]);
    for (let row = bottom + 1; row < rows.length; row++)
      rows[row] = moveReferences(rows[row]);
  }
  return {
    ...sheet,
    rows,
    formats,
    cells,
    ...(command.type === "sort" && {
      sortKeys: command.keys.map((key) => ({ ...key })),
    }),
    sortRowOrder: order,
    ...(clearing && { sortKeys: undefined }),
  };
}

const defaultColors = ["#eaf3ff", "#5483d5"] as const;
const defaultIcons = ["▼", "●", "▲"] as const;

export function conditionalCells(
  sheet: Sheet,
  read: Read,
  test: (formula: string, row: number, column: number) => boolean,
) {
  const rules = [...(sheet.conditionalFormats ?? [])].sort(
    (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
  );
  const candidates = rules.flatMap((rule) => {
    const area = getArea(rule.range);
    if (
      !area ||
      area.bottom >= sheet.rows.length ||
      area.right >= sheetWidth(sheet)
    )
      return [];
    let minimum = Infinity,
      maximum = -Infinity;
    const counts = new Map<Value, number>();
    if (
      [
        "min",
        "max",
        "duplicate",
        "bar",
        "scale",
        "heatmap",
        "icons",
        "trend",
      ].includes(rule.type)
    ) {
      for (const { row, column } of points(area)) {
        const value = read(row, column).value;
        if (typeof value === "number") {
          minimum = Math.min(minimum, value);
          maximum = Math.max(maximum, value);
        }
        if (!blank(value)) counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }
    return [{ rule, area, minimum, maximum, counts }];
  });
  function applies(rule: Rule, value: Value, row: number, column: number) {
    const target = rule.value ?? null;
    switch (rule.type) {
      case "value":
        return value === target;
      case "text":
        return (
          typeof value === "string" &&
          value.toLowerCase().includes(String(target ?? "").toLowerCase())
        );
      case "date":
        return typeof value === "string" && value.slice(0, 10) === target;
      case "positive":
        return typeof value === "number" && value > 0;
      case "negative":
        return typeof value === "number" && value < 0;
      case "greater":
        return value !== null && compare(value, target) > 0;
      case "less":
        return value !== null && compare(value, target) < 0;
      case "between":
        return (
          value !== null &&
          compare(value, target) >= 0 &&
          compare(value, rule.end ?? null) <= 0
        );
      case "empty":
        return blank(value);
      case "formula":
        return typeof target === "string" && test(target, row, column);
      default:
        return false;
    }
  }
  return (row: number, column: number) => {
    const value = read(row, column).value;
    for (const { rule, area, minimum, maximum, counts } of candidates) {
      if (!contains(area, row, column)) continue;
      const colors = rule.colors ?? defaultColors;
      if (
        typeof value === "number" &&
        ["bar", "scale", "heatmap", "icons", "trend"].includes(rule.type)
      ) {
        const ratio =
          maximum === minimum ? 1 : (value - minimum) / (maximum - minimum);
        const percentage = Math.round(ratio * 100);
        const icons = rule.icons ?? defaultIcons;
        if (rule.type === "bar")
          return {
            format: rule.format,
            backgroundImage: `linear-gradient(to right, ${colors[1]} ${percentage}%, transparent ${percentage}%)`,
          };
        if (rule.type === "heatmap") {
          const middle = "#fff0b3";
          const low = rule.colors?.[0] ?? "#deecff";
          const high = rule.colors?.[1] ?? "#d85b43";
          const color = ratio < 0.5 ? low : high;
          const strength = Math.round(Math.abs(ratio - 0.5) * 200);
          return {
            format: {
              ...rule.format,
              backgroundColor: `color-mix(in srgb, ${color} ${strength}%, ${middle})`,
            },
          };
        }
        if (rule.type === "scale")
          return {
            format: {
              ...rule.format,
              backgroundColor: `color-mix(in srgb, ${colors[1]} ${percentage}%, ${colors[0]})`,
            },
          };
        if (rule.type === "trend")
          return {
            format: rule.format,
            icon: icons[value > 0 ? 2 : value < 0 ? 0 : 1],
          };
        return {
          format: rule.format,
          icon: icons[Math.min(2, Math.floor(ratio * 3))],
        };
      }
      if (
        (rule.type === "min" && value === minimum) ||
        (rule.type === "max" && value === maximum) ||
        (rule.type === "duplicate" && (counts.get(value) ?? 0) > 1) ||
        applies(rule, value, row - area.top, column - area.left)
      )
        return { format: rule.format ?? { backgroundColor: colors[0] } };
    }
  };
}
