import type { CSSProperties } from "vue";
import {
  cellAddress,
  parseAddress,
  parseCellInput,
  sheetWidth,
} from "./spreadsheetModel";
import { offsetFormula } from "./spreadsheetReferences";
import type {
  HysSpreadsheetArea as Area,
  HysSpreadsheetCellChange as Change,
  HysSpreadsheetCellFormat as Format,
  HysSpreadsheetCellOptions as Options,
  HysSpreadsheetSheet as Sheet,
  HysSpreadsheetValidator as Validator,
  HysSpreadsheetValue as Value,
  HysSpreadsheetFillMode,
} from "./spreadsheetTypes";

export function areaFromAddresses(
  start: string,
  end = start,
): Area | undefined {
  const a = parseAddress(start);
  const b = parseAddress(end);
  return (
    a &&
    b && {
      top: Math.min(a.row, b.row),
      bottom: Math.max(a.row, b.row),
      left: Math.min(a.column, b.column),
      right: Math.max(a.column, b.column),
    }
  );
}

export function points(area: Area) {
  const result: Pick<Change, "row" | "column">[] = [];
  for (let row = area.top; row <= area.bottom; row++)
    for (let column = area.left; column <= area.right; column++)
      result.push({ row, column });
  return result;
}

export function validPoint(sheet: Sheet, row: number, column: number) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(column) &&
    row >= 0 &&
    column >= 0 &&
    row < sheet.rows.length &&
    column < (sheet.columnCount ?? sheetWidth(sheet))
  );
}

export function isCellValue(value: unknown): value is Value {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

export function canEdit(sheet: Sheet, row: number, column: number) {
  const options = sheet.cells?.[cellAddress(row, column)];
  return (
    (!sheet.protected ||
      (sheet.protectionMode === "excel" && options?.locked === false)) &&
    !sheet.unloaded &&
    !options?.readonly &&
    !options?.locked &&
    !sheet.rowOptions?.[row]?.locked &&
    !sheet.columnOptions?.[column]?.locked
  );
}

export function withValues(sheet: Sheet, changes: readonly Change[]) {
  const rows = sheet.rows.slice();
  const touched = new Map<number, Value[]>();
  for (const { row, column, value } of changes) {
    let cells = touched.get(row);
    if (!cells) touched.set(row, (cells = [...rows[row]]));
    while (cells.length <= column) cells.push(null);
    cells[column] = value;
  }
  for (const [row, cells] of touched) rows[row] = cells;
  return { ...sheet, rows };
}

export function affectedCells(sheet: Sheet, changes: readonly Change[]) {
  const positions = new Map(
    changes.map(({ row, column }) => [
      cellAddress(row, column),
      { row, column },
    ]),
  );
  const columns = new Set(changes.map(({ column }) => column));
  for (const [address, options] of Object.entries(sheet.cells ?? {})) {
    const point = parseAddress(address);
    if (!point || !validPoint(sheet, point.row, point.column)) continue;
    const compare =
      options.validation?.compare &&
      parseAddress(options.validation.compare.address);
    if (
      (compare && positions.has(cellAddress(compare.row, compare.column))) ||
      ((options.validation?.unique || options.validation?.duplicate) &&
        columns.has(point.column))
    )
      positions.set(address, point);
  }
  return positions.values();
}

export function parseTyped(input: string, options?: Options): Value {
  const type = options?.type ?? "auto";
  if (!input) return null;
  if (
    type === "text" ||
    type === "multiline" ||
    type === "autocomplete" ||
    type === "select" ||
    type === "multiple"
  )
    return /^[=']/.test(input) ? "'" + input : input;
  if (type === "formula" && !input.startsWith("=")) return "=" + input;
  if (type === "date" || type === "time" || type === "datetime-local")
    return input;
  if (type === "percent" && /^[-+]?\d*\.?\d+\s*%$/.test(input.trim()))
    return parseFloat(input) / 100;
  return parseCellInput(input);
}

function checkComparison(a: Value, b: Value, operator: string) {
  if (operator === "eq") return a === b;
  if (operator === "ne") return a !== b;
  if (a === null || b === null) return false;
  if (operator === "lt") return a < b;
  if (operator === "lte") return a <= b;
  if (operator === "gt") return a > b;
  return a >= b;
}

export function validateCell(
  sheet: Sheet,
  row: number,
  column: number,
  validators?: Readonly<Record<string, Validator>>,
): string | undefined {
  const address = cellAddress(row, column);
  const options = sheet.cells?.[address];
  const rule = options?.validation;
  let value = sheet.rows[row]?.[column] ?? null;
  if (typeof value === "string" && value.startsWith("'"))
    value = value.slice(1);
  const invalid = (message: string) => rule?.message || message;
  if (value === null || value === "")
    return rule?.required ? invalid("请输入值。") : undefined;
  const text = String(value);
  const type = rule?.type ?? options?.type;
  if (type === "text" && typeof value !== "string")
    return invalid("请输入文本。");
  if (
    ["number", "currency", "percent"].includes(type ?? "") &&
    typeof value !== "number"
  )
    return invalid("请输入有效数字。");
  if (type === "boolean" && typeof value !== "boolean")
    return invalid("请选择布尔值。");
  const isoDate =
    /^\d{4}-\d{2}-\d{2}$/.test(text) &&
    new Date(text).toString() !== "Invalid Date" &&
    new Date(text).toISOString().slice(0, 10) === text;
  if (type === "date" && !isoDate) return invalid("请输入有效日期。");
  if (type === "time" && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(text))
    return invalid("请输入有效时间。");
  if (
    type === "datetime-local" &&
    (!text.includes("T") || !Number.isFinite(Date.parse(text)))
  )
    return invalid("请输入有效日期和时间。");
  if (
    (rule?.min !== undefined && value < rule.min) ||
    (rule?.max !== undefined && value > rule.max)
  )
    return invalid("输入值超出允许范围。");
  if (
    (rule?.minLength !== undefined && text.length < rule.minLength) ||
    (rule?.maxLength !== undefined && text.length > rule.maxLength)
  )
    return invalid("输入长度超出允许范围。");
  if (rule?.pattern) {
    try {
      if (!new RegExp(rule.pattern, "u").test(text))
        return invalid("输入格式不符合要求。");
    } catch {
      return invalid("校验表达式无效。");
    }
  }
  if (rule?.options && !rule.options.includes(value))
    return invalid("请选择允许的选项。");
  if (options?.options && (type === "select" || type === "multiple")) {
    const selected = type === "multiple" ? text.split("\n") : [text];
    if (selected.some((item) => !options.options!.includes(item)))
      return invalid("请选择允许的选项。");
  }
  if (rule?.unique || rule?.duplicate) {
    const repeated = sheet.rows.some(
      (cells, index) =>
        index !== row && cells[column] === sheet.rows[row]?.[column],
    );
    if (rule.unique && repeated) return invalid("这一列已存在相同的值。");
    if (rule.duplicate && !repeated) return invalid("这一列需要已有相同的值。");
  }
  if (rule?.compare) {
    const point = parseAddress(rule.compare.address);
    if (
      !point ||
      !checkComparison(
        value,
        sheet.rows[point.row]?.[point.column] ?? null,
        rule.compare.operator,
      )
    )
      return invalid(`输入值与 ${rule.compare.address} 不符合关联校验规则。`);
  }
  if (rule?.rule) {
    try {
      const validator =
        validators && Object.hasOwn(validators, rule.rule)
          ? validators[rule.rule]
          : undefined;
      if (!validator) return invalid("找不到自定义校验规则。");
      const result = validator({ sheet, address, row, column, value });
      if (typeof result === "string" || result === false)
        return invalid(result || "输入未通过校验。");
    } catch {
      return invalid("自定义校验执行失败。");
    }
  }
}

export function displayValue(
  value: Value,
  format: Format | undefined,
  locale: string,
  currency: string,
) {
  const kind = format?.number;
  if (kind === "date" || kind === "time") {
    const text = String(value ?? "");
    if (kind === "time" && /^\d\d:\d\d/.test(text)) return text;
    const date = typeof value === "number" ? new Date(value) : new Date(text);
    if (Number.isFinite(+date)) {
      const options: Intl.DateTimeFormatOptions =
        kind === "time"
          ? { timeStyle: "medium", timeZone: "UTC" }
          : {
              dateStyle: "medium",
              timeStyle: text.includes("T") ? "medium" : undefined,
              timeZone: "UTC",
            };
      try {
        return new Intl.DateTimeFormat(locale, options).format(date);
      } catch {
        return new Intl.DateTimeFormat("zh-CN", options).format(date);
      }
    }
  }
  if (typeof value !== "number" || !kind || kind === "general")
    return String(value ?? "");
  const digits =
    format?.precision === undefined
      ? undefined
      : Math.max(0, Math.min(20, format.precision));
  const style = kind === "currency" || kind === "percent" ? kind : "decimal";
  const options: Intl.NumberFormatOptions = {
    style,
    currency: format?.currency ?? currency,
    notation: kind === "scientific" ? "scientific" : "standard",
    useGrouping: format?.thousands,
    minimumFractionDigits: digits ?? (kind === "number" ? 2 : undefined),
    maximumFractionDigits:
      digits ?? (kind === "number" || kind === "percent" ? 2 : undefined),
  };
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(locale, options).format(value);
  } catch {
    formatted = new Intl.NumberFormat("zh-CN", {
      ...options,
      currency: "CNY",
    }).format(value);
  }
  return kind === "custom" && format?.pattern
    ? format.pattern.replaceAll("{value}", formatted)
    : formatted;
}

export function formatStyle(format?: Format): CSSProperties | undefined {
  if (!format) return;
  return {
    color: format.color,
    backgroundColor: format.backgroundColor,
    fontFamily: format.fontFamily,
    fontSize: format.fontSize && `${format.fontSize}px`,
    fontWeight: format.bold ? 700 : undefined,
    fontStyle: format.italic ? "italic" : undefined,
    textDecoration: [
      format.underline ? "underline" : "",
      format.strike ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" "),
    textAlign: format.align,
    verticalAlign: format.verticalAlign,
    whiteSpace: format.overflow === "wrap" ? "pre-wrap" : undefined,
    overflow:
      format.overflow === "visible"
        ? "visible"
        : format.overflow === "clip"
          ? "hidden"
          : undefined,
    overflowWrap: format.overflow === "wrap" ? "anywhere" : undefined,
    textOverflow: format.overflow === "ellipsis" ? "ellipsis" : undefined,
    border:
      format.borderStyle &&
      `1px ${format.borderStyle} ${format.borderColor ?? "currentColor"}`,
    paddingInlineStart: format.indent ? `${format.indent}px` : undefined,
  };
}

export function safeLink(value?: string) {
  return value && /^(?:https?:\/\/|mailto:|tel:|#)/i.test(value.trim())
    ? value.trim()
    : undefined;
}

export function fillValues(
  sheet: Sheet,
  area: Area,
  direction: "down" | "right",
  mode: HysSpreadsheetFillMode,
  sequence?: readonly Value[],
): Change[] {
  const vertical = direction === "down";
  const length = vertical
    ? area.bottom - area.top + 1
    : area.right - area.left + 1;
  const changes: Change[] = [];
  for (const { row, column } of points(area)) {
    const offset = vertical ? row - area.top : column - area.left;
    if (!offset) continue;
    const firstRow = vertical ? area.top : row;
    const firstColumn = vertical ? column : area.left;
    const start = sheet.rows[firstRow]?.[firstColumn] ?? null;
    const next =
      sheet.rows[firstRow + (vertical ? 1 : 0)]?.[
        firstColumn + (vertical ? 0 : 1)
      ] ?? null;
    let value = start;
    if (sequence?.length) {
      const first = sequence.indexOf(start);
      value = sequence[(Math.max(0, first) + offset) % sequence.length];
    } else if (typeof start === "string" && start.startsWith("=")) {
      value = offsetFormula(start, row - firstRow, column - firstColumn);
    } else if (mode !== "copy" && typeof start === "number") {
      value =
        start +
        offset * (typeof next === "number" && length > 2 ? next - start : 1);
    } else if (
      mode !== "copy" &&
      typeof start === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(start) &&
      Number.isFinite(Date.parse(start))
    ) {
      const step =
        typeof next === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(next) &&
        Number.isFinite(Date.parse(next))
          ? Date.parse(next) - Date.parse(start)
          : 86400000;
      value = new Date(Date.parse(start) + offset * step)
        .toISOString()
        .slice(0, 10);
    } else if (mode === "smart" && typeof start === "string") {
      const match = /^(.*?)(\d+)$/.exec(start);
      if (match)
        value =
          match[1] +
          String(Number(match[2]) + offset).padStart(match[2].length, "0");
    }
    changes.push({ row, column, value });
  }
  return changes;
}
