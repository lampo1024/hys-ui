import type {
  HysSpreadsheetSheet,
  HysSpreadsheetConditionalFormat,
  HysSpreadsheetFilter,
  HysSpreadsheetSheetCommand,
  HysSpreadsheetSort,
  HysSpreadsheetValue,
  HysSpreadsheetWorkbook,
} from "./spreadsheetTypes";
import {
  rewriteReferences,
  sheetName,
  sheetReference,
} from "./spreadsheetReferences";
import { remapAxisMetadata } from "./spreadsheetAxis";
import { shiftSortRowOrder, validSortRowOrder } from "./spreadsheetSortOrder";

export const sheetLimits = { rows: 10000, columns: 100, sheets: 20 } as const;

export function columnLabel(index: number) {
  let name = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26))
    name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
  return name;
}

export function cellAddress(row: number, column: number) {
  return columnLabel(column) + (row + 1);
}

export function parseAddress(address: string) {
  const match = /^\$?([A-Z]{1,3})\$?([1-9]\d{0,5})$/i.exec(address);
  if (!match) return;
  let column = 0;
  for (const letter of match[1].toUpperCase())
    column = column * 26 + letter.charCodeAt(0) - 64;
  return { row: Number(match[2]) - 1, column: column - 1 };
}

export function sheetWidth(sheet: HysSpreadsheetSheet) {
  let width = Number.isFinite(sheet.columnCount)
    ? Math.floor(sheet.columnCount!)
    : 1;
  for (const row of sheet.rows) width = Math.max(width, row.length);
  return Math.max(1, Math.min(sheetLimits.columns, width));
}

export function blankSheet(
  id = "sheet-1",
  name = "工作表 1",
): HysSpreadsheetSheet {
  return {
    id,
    name,
    columnCount: 6,
    rows: Array.from({ length: 8 }, () => []),
  };
}

export function normalizeWorkbook(
  workbook?: HysSpreadsheetWorkbook,
): HysSpreadsheetWorkbook {
  const used = new Set<string>();
  const sheets = (workbook?.sheets ?? [])
    .slice(0, sheetLimits.sheets)
    .flatMap((sheet) => {
      if (used.has(sheet.id)) return [];
      used.add(sheet.id);
      const source = sheet.rows.slice(0, sheetLimits.rows);
      const width = sheetWidth({ ...sheet, rows: source });
      const rows = source.map((row) =>
        row.length <= width ? row : row.slice(0, width),
      );
      return [
        {
          ...sheet,
          columnCount: width,
          rows: rows.length ? rows : [[]],
          ...(sheet.sortRowOrder !== undefined &&
            !validSortRowOrder(sheet.sortRowOrder, rows.length) && {
              sortRowOrder: undefined,
            }),
        },
      ];
    });
  if (sheets.length && sheets.every(({ hidden }) => hidden))
    sheets[0] = { ...sheets[0], hidden: false };
  return { ...workbook, sheets: sheets.length ? sheets : [blankSheet()] };
}

export function readWorkbook(input: unknown): HysSpreadsheetWorkbook {
  const workbook = input as HysSpreadsheetWorkbook | undefined;
  if (
    !workbook ||
    !Array.isArray(workbook.sheets) ||
    !workbook.sheets.length ||
    workbook.sheets.some(
      (sheet) =>
        !sheet ||
        typeof sheet.id !== "string" ||
        typeof sheet.name !== "string" ||
        !Array.isArray(sheet.rows) ||
        [
          sheet.merges,
          sheet.filters,
          sheet.sortKeys,
          sheet.rowGroups,
          sheet.columnGroups,
          sheet.conditionalFormats,
        ].some((value) => value !== undefined && !Array.isArray(value)) ||
        sheet.merges?.some((range: unknown) => typeof range !== "string") ||
        sheet.conditionalFormats?.some(
          (rule: HysSpreadsheetConditionalFormat) =>
            !rule || typeof rule.range !== "string",
        ) ||
        sheet.filters?.some(
          (rule: HysSpreadsheetFilter) =>
            !rule || !Number.isInteger(rule.column),
        ) ||
        sheet.sortKeys?.some(
          (key: HysSpreadsheetSort) =>
            !key ||
            !Number.isInteger(key.column) ||
            key.column < 0 ||
            (key.direction !== undefined &&
              key.direction !== "asc" &&
              key.direction !== "desc"),
        ) ||
        sheet.rows.some(
          (row: unknown) =>
            !Array.isArray(row) ||
            row.some(
              (value: unknown) =>
                value !== null &&
                typeof value !== "string" &&
                typeof value !== "boolean" &&
                !Number.isFinite(value),
            ),
        ),
    )
  )
    throw new Error("工作簿数据格式无效。");
  return normalizeWorkbook(workbook);
}

export function sameSheetName(first: string, second: string) {
  return first.toLowerCase() === second.toLowerCase();
}

function mapFormulas(
  workbook: HysSpreadsheetWorkbook,
  rewrite: (value: string, sheet: HysSpreadsheetSheet) => string,
): HysSpreadsheetWorkbook {
  return {
    ...workbook,
    sheets: workbook.sheets.map((sheet) => {
      let changed = false;
      const rows = sheet.rows.map((row) => {
        const next = row.map((value) => {
          if (typeof value !== "string" || !value.startsWith("=")) return value;
          const adjusted = rewrite(value, sheet);
          changed ||= adjusted !== value;
          return adjusted;
        });
        return next;
      });
      return changed ? { ...sheet, rows } : sheet;
    }),
  };
}

function sheetHasVisibleAxis(
  sheet: HysSpreadsheetSheet,
  axis: "row" | "column",
  size: number,
) {
  const options = axis === "row" ? sheet.rowOptions : sheet.columnOptions;
  const groups = axis === "row" ? sheet.rowGroups : sheet.columnGroups;
  for (let index = 0; index < size; index++)
    if (
      !options?.[index]?.hidden &&
      !groups?.some(
        ({ start, end, collapsed }) =>
          collapsed && index > start && index <= end,
      )
    )
      return true;
  return false;
}

export function updateSheet(
  workbook: HysSpreadsheetWorkbook,
  command: HysSpreadsheetSheetCommand,
) {
  const sheets = [...workbook.sheets];
  const index =
    command.type === "add"
      ? -1
      : sheets.findIndex(({ id }) => id === command.id);
  const existing = sheets[index];
  const usedName = (name: string, id?: string) =>
    sheets.some((sheet) => sheet.id !== id && sameSheetName(sheet.name, name));
  if (command.type === "add" || command.type === "duplicate") {
    if (
      sheets.length >= sheetLimits.sheets ||
      (command.type === "duplicate" && !existing)
    )
      return;
    let ordinal = 1;
    while (sheets.some(({ id }) => id === `sheet-${ordinal}`)) ordinal++;
    const id = `sheet-${ordinal}`;
    const base =
      command.type === "add"
        ? command.name?.trim() || `工作表 ${ordinal}`
        : `${existing.name} 副本`;
    let name = base;
    for (let suffix = 2; usedName(name); suffix++) name = `${base} ${suffix}`;
    const template = command.type === "add" ? command.template : existing;
    const sheet = {
      ...blankSheet(id, name),
      ...template,
      id,
      name,
      hidden: false,
    };
    sheets.splice(
      command.type === "duplicate" ? index + 1 : sheets.length,
      0,
      sheet,
    );
    return { workbook: normalizeWorkbook({ ...workbook, sheets }), active: id };
  }
  if (!existing) return;
  if (command.type === "move") {
    if (
      !Number.isInteger(command.index) ||
      command.index < 0 ||
      command.index >= sheets.length ||
      command.index === index
    )
      return;
    sheets.splice(index, 1);
    sheets.splice(command.index, 0, existing);
  }
  if (command.type === "visibility" || command.type === "delete") {
    if (command.type === "visibility" && command.hidden === !!existing.hidden)
      return;
    if (
      !existing.hidden &&
      (command.type === "delete" || command.hidden) &&
      sheets.filter(({ hidden }) => !hidden).length === 1
    )
      return;
    if (command.type === "delete") sheets.splice(index, 1);
    else sheets[index] = { ...existing, hidden: command.hidden };
  }
  if (command.type === "rename") {
    const name = command.name.trim();
    if (!name || usedName(name, existing.id) || name === existing.name) return;
    sheets[index] = { ...existing, name };
  }
  if (command.type === "color")
    sheets[index] = { ...existing, tabColor: command.color };
  if (command.type === "protect")
    sheets[index] = { ...existing, protected: command.protected };

  let result: HysSpreadsheetWorkbook = { ...workbook, sheets };
  if (command.type === "rename" || command.type === "delete") {
    if (command.type === "delete" && workbook.names)
      result.names = Object.fromEntries(
        Object.entries(workbook.names).filter(
          ([, value]) => value.sheetId !== existing.id,
        ),
      );
    result = mapFormulas(result, (value) =>
      rewriteReferences(value, (first, last, qualifier) => {
        const address = last ? `${first}:${last}` : first;
        if (!qualifier) return address;
        if (!sameSheetName(sheetName(qualifier), existing.name))
          return `${qualifier}!${address}`;
        return command.type === "delete"
          ? "#REF!"
          : sheetReference(sheets[index].name) + address;
      }),
    );
  }
  return { workbook: result };
}

export function parseCellInput(text: string): HysSpreadsheetValue {
  if (text === "") return null;
  if (text.startsWith("'")) return text;
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim())) {
    const number = Number(text);
    if (Number.isFinite(number)) return number;
  }
  if (/^(?:true|false)$/i.test(text.trim()))
    return text.trim().toLowerCase() === "true";
  return text;
}

export function shiftWorkbook(
  workbook: HysSpreadsheetWorkbook,
  sheet: HysSpreadsheetSheet,
  axis: "row" | "column",
  index: number,
  add: boolean,
  count = 1,
) {
  const width = sheetWidth(sheet);
  const rows = sheet.rows.map((row) =>
    Array.from({ length: width }, (_, col) => row[col] ?? null),
  );
  if (axis === "row") {
    if (add) rows.splice(index, 0, ...Array.from({ length: count }, () => []));
    else rows.splice(index, count);
  } else {
    for (const row of rows) {
      if (add) row.splice(index, 0, ...Array<null>(count).fill(null));
      else row.splice(index, count);
    }
  }
  function shiftAddress(address: string) {
    const target = parseAddress(address);
    if (!target) return address;
    if (!add && target[axis] >= index && target[axis] < index + count)
      return "#REF!";
    if (target[axis] >= index) target[axis] += add ? count : -count;
    const markers = /^(\$?)[A-Z]+(\$?)\d+$/i.exec(address);
    return `${markers?.[1] ?? ""}${columnLabel(target.column)}${markers?.[2] ?? ""}${target.row + 1}`;
  }
  function shiftRange(first: string, last?: string) {
    if (!last || add)
      return last
        ? `${shiftAddress(first)}:${shiftAddress(last)}`
        : shiftAddress(first);
    const start = parseAddress(first)!,
      end = parseAddress(last)!;
    const low = Math.min(start[axis], end[axis]);
    const high = Math.max(start[axis], end[axis]);
    if (low >= index && high < index + count) return "#REF!";
    const adjustEnd = (point: typeof start, address: string, other: number) => {
      if (point[axis] < index || point[axis] >= index + count)
        return shiftAddress(address);
      const survivor = other < index ? index - 1 : index;
      const parts = /^(\$?)[A-Z]+(\$?)\d+$/i.exec(address)!;
      point[axis] = survivor;
      return `${parts[1]}${columnLabel(point.column)}${parts[2]}${point.row + 1}`;
    };
    const startAxis = start[axis],
      endAxis = end[axis];
    return `${adjustEnd(start, first, endAxis)}:${adjustEnd(end, last, startAxis)}`;
  }
  const formats = Object.fromEntries(
    Object.entries(sheet.formats ?? {}).flatMap(([key, format]) => {
      const shifted = shiftAddress(key);
      return shifted === "#REF!" ? [] : [[shifted, format]];
    }),
  );
  const changed: HysSpreadsheetSheet = {
    ...sheet,
    ...remapAxisMetadata(sheet, axis, (position) => {
      if (!add && position >= index && position < index + count) return;
      return position >= index ? position + (add ? count : -count) : position;
    }),
    rows,
    columnCount: width + (axis === "column" ? (add ? count : -count) : 0),
    formats,
    ...(axis === "row" && {
      sortRowOrder: shiftSortRowOrder(sheet, index, add, count),
    }),
  };
  if (
    !sheetHasVisibleAxis(
      changed,
      axis,
      axis === "row" ? changed.rows.length : changed.columnCount!,
    )
  ) {
    if (axis === "row")
      changed.rowOptions = {
        ...changed.rowOptions,
        0: { ...changed.rowOptions?.[0], hidden: false },
      };
    else
      changed.columnOptions = {
        ...changed.columnOptions,
        0: { ...changed.columnOptions?.[0], hidden: false },
      };
  }
  const names =
    workbook.names &&
    Object.fromEntries(
      Object.entries(workbook.names).flatMap(([key, item]) => {
        if (item.sheetId !== sheet.id) return [[key, item]];
        const [first, last] = item.range.split(":");
        if (!parseAddress(first) || (last && !parseAddress(last))) return [];
        const range = shiftRange(first, last);
        return range.includes("#REF!") ? [] : [[key, { ...item, range }]];
      }),
    );
  return mapFormulas(
    {
      ...workbook,
      names,
      sheets: workbook.sheets.map((item) =>
        item.id === sheet.id ? changed : item,
      ),
    },
    (value, source) =>
      rewriteReferences(value, (first, last, qualifier) => {
        const matches = qualifier
          ? sameSheetName(sheetName(qualifier), sheet.name)
          : source.id === sheet.id;
        const address = matches
          ? shiftRange(first, last)
          : last
            ? `${first}:${last}`
            : first;
        return qualifier && address !== "#REF!"
          ? `${qualifier}!${address}`
          : address;
      }),
  );
}
