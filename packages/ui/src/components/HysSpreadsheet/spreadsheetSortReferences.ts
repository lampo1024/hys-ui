import { cellAddress, parseAddress, sameSheetName } from "./spreadsheetModel";
import { rewriteReferences, sheetName } from "./spreadsheetReferences";
import type { HysSpreadsheetSheet } from "./spreadsheetTypes";

const aggregate =
  /^=\s*(?:SUM|SUBTOTAL|AVERAGE|COUNT|COUNTA|COUNTIF|SUMIF|AVERAGEIF|MIN|MAX|PRODUCT|MEDIAN|STDEV|VAR)\s*\(/i;

function isSummaryRow(
  sheet: HysSpreadsheetSheet,
  row: number,
  first: number,
  last: number,
) {
  const boundary = row === first ? row + 1 : row - 1;
  return sheet.rows[row].some((value) => {
    if (typeof value !== "string" || !aggregate.test(value)) return false;
    let summary = false;
    rewriteReferences(value, (start, end, qualifier) => {
      if (
        end &&
        (!qualifier || sameSheetName(sheetName(qualifier), sheet.name))
      ) {
        const a = parseAddress(start)!.row;
        const b = parseAddress(end)!.row;
        const low = Math.min(a, b);
        const high = Math.max(a, b);
        summary ||=
          low < high &&
          low >= first &&
          high <= last &&
          (row === first ? low === boundary : high === boundary);
      }
      return "";
    });
    return summary;
  });
}

export function spreadsheetDetailRows(
  sheet: HysSpreadsheetSheet,
  header: boolean,
) {
  let top = header ? 1 : 0;
  let bottom = sheet.rows.length - 1;
  const blank = (row: number) =>
    sheet.rows[row].every((value) => value === null || value === "");
  let first = top;
  let last = bottom;
  while (first < last && blank(first)) first++;
  while (last > first && blank(last)) last--;
  while (first < last && isSummaryRow(sheet, first, first, last)) top = ++first;
  while (last > first && isSummaryRow(sheet, last, first, last))
    bottom = --last;
  return { top, bottom };
}

export function sortFormulaReferences(
  name: string,
  destinations: ReadonlyMap<number, number>,
) {
  const movedRows = [...destinations.keys()].filter(
    (row) => destinations.get(row) !== row,
  );
  if (!movedRows.length) return (formula: string) => formula;
  const minMoved = Math.min(...movedRows);
  const maxMoved = Math.max(...movedRows);

  function move(reference: string, row: number) {
    const point = parseAddress(reference)!;
    return (
      (reference.startsWith("$") ? "$" : "") + cellAddress(row, point.column)
    );
  }

  const ranges = new Map<string, readonly [number, number] | undefined>();
  function moveRange(start: number, end: number) {
    const low = Math.min(start, end);
    const high = Math.max(start, end);
    if (
      high < minMoved ||
      low > maxMoved ||
      (low <= minMoved && high >= maxMoved)
    )
      return [start, end] as const;
    const key = `${low}:${high}`;
    if (!ranges.has(key)) {
      let min = low < minMoved ? low : Infinity;
      let max = high > maxMoved ? high : -Infinity;
      for (
        let row = Math.max(low, minMoved);
        row <= Math.min(high, maxMoved);
        row++
      ) {
        const target = destinations.get(row) ?? row;
        min = Math.min(min, target);
        max = Math.max(max, target);
      }
      ranges.set(key, max - min === high - low ? [min, max] : undefined);
    }
    const range = ranges.get(key);
    return range && (start <= end ? range : ([range[1], range[0]] as const));
  }

  return (formula: string) =>
    rewriteReferences(formula, (first, last, qualifier) => {
      const prefix = qualifier ? `${qualifier}!` : "";
      const original = prefix + first + (last ? `:${last}` : "");
      if (qualifier && !sameSheetName(sheetName(qualifier), name))
        return original;
      if (/\$\d/.test(first) || (last && /\$\d/.test(last))) return original;
      const start = parseAddress(first)!.row;
      if (last) {
        const end = parseAddress(last)!.row;
        const range = moveRange(start, end);
        return range && (range[0] !== start || range[1] !== end)
          ? `${prefix}${move(first, range[0])}:${move(last, range[1])}`
          : original;
      }
      const target = destinations.get(start);
      return target === undefined || target === start
        ? original
        : prefix + move(first, target);
    });
}
