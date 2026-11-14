import { areaFromAddresses } from "./spreadsheetCells";
import { cellAddress } from "./spreadsheetModel";
import type { HysSpreadsheetFindOptions } from "./spreadsheetTypes";

const literal = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function spreadsheetSearchPattern(
  query: string,
  options: HysSpreadsheetFindOptions,
) {
  if (!query) return;
  const end = options.wholeCell ? "(?![\\s\\S])" : "";
  const flags = options.matchCase ? "gu" : "giu";
  if (!options.wildcards)
    return new RegExp(
      options.wholeCell ? `^${literal(query)}${end}` : literal(query),
      flags,
    );
  const parts = [""];
  for (const [token] of query.matchAll(/~[~*?]|\*+|\?|[^~*?]+|~/gu)) {
    if (token.startsWith("*")) parts.push("");
    else
      parts[parts.length - 1] +=
        token === "?"
          ? "[\\s\\S]"
          : literal(
              token.startsWith("~") && token.length > 1
                ? token.slice(1)
                : token,
            );
  }
  const [first, ...rest] = parts;
  if (!first && rest.length === 1 && !rest[0])
    return new RegExp(`^[\\s\\S]+${end}`, flags);
  const source = rest.reduce((pattern, part, index) => {
    if (index === rest.length - 1) return `${pattern}[\\s\\S]*${part}`;
    // Keep each intermediate match fixed so runs of wildcards cannot backtrack combinatorially.
    return `${pattern}(?=([\\s\\S]*?${part}))\\${index + 1}`;
  }, first);
  return new RegExp(`${options.wholeCell ? "^" : ""}${source}${end}`, flags);
}

export function spreadsheetFindMatches(
  pattern: RegExp,
  rows: readonly { index: number }[],
  columns: readonly { key: string }[],
  text: (row: number, column: number) => string,
  options: HysSpreadsheetFindOptions,
) {
  const areas = options.ranges?.flatMap((range) => {
    const [first, last, extra] = range.split(":").map((part) => part.trim());
    const area = extra === undefined && areaFromAddresses(first, last);
    return area ? [area] : [];
  });
  const results: {
    row: number;
    column: number;
    address: string;
    value: string;
  }[] = [];
  for (const { index: row } of rows) {
    const inRow = areas?.filter(
      ({ top, bottom }) => row >= top && row <= bottom,
    );
    if (inRow?.length === 0) continue;
    for (const { key } of columns) {
      const column = Number(key);
      if (
        inRow &&
        !inRow.some(({ left, right }) => column >= left && column <= right)
      )
        continue;
      const value = text(row, column);
      pattern.lastIndex = 0;
      if (value && pattern.test(value))
        results.push({ row, column, address: cellAddress(row, column), value });
    }
  }
  if (options.order === "column")
    results.sort(
      (first, second) => first.column - second.column || first.row - second.row,
    );
  return results;
}
