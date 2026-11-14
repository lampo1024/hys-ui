import { cellAddress, parseAddress, sameSheetName } from "./spreadsheetModel";
import { rewriteReferences, sheetName } from "./spreadsheetReferences";
import type { HysSpreadsheetAxis } from "./spreadsheetTypes";

const variadicAggregates = new Set(["SUM", "AVERAGE", "COUNT", "COUNTA", "MIN", "MAX", "MEDIAN"]);

function aggregateArgumentStarts(formula: string) {
  const starts = new Set<number>();
  const nesting: boolean[] = [];
  const tokens = /"(?:[^"]|"")*"|'(?:[^']|'')+'|([\p{L}_][\p{L}\p{N}_.]*)\s*\(|[(){},]/gu;
  for (const match of formula.matchAll(tokens)) {
    const [token, name] = match;
    if (token === ")" || token === "}") {
      nesting.pop();
      continue;
    }
    if (name || token === "(" || token === "{")
      nesting.push(!!name && variadicAggregates.has(name.toUpperCase()));
    else if (token !== ",") continue;
    if (nesting.at(-1)) {
      const end = match.index + token.length;
      starts.add(end + /^\s*/u.exec(formula.slice(end))![0].length);
    }
  }
  return starts;
}

export function moveAxisReferences(
  axis: HysSpreadsheetAxis,
  positions: ReadonlyMap<number, number>,
  name: string,
) {
  function address(key: string, destination?: number) {
    const point = parseAddress(key);
    if (!point) return key;
    point[axis] = destination ?? positions.get(point[axis]) ?? point[axis];
    const columnMarker = key.startsWith("$") ? "$" : "";
    const rowMarker = /\$\d/.test(key) ? "$" : "";
    return columnMarker + cellAddress(point.row, point.column).replace(/\d+$/, rowMarker + (point.row + 1));
  }

  // A block move shifts a few contiguous groups by a constant offset.
  const segments: { first: number; last: number; shift: number }[] = [];
  for (let index = 0; index < positions.size; index++) {
    const shift = positions.get(index)! - index;
    const previous = segments.at(-1);
    if (previous?.shift === shift) previous.last = index;
    else segments.push({ first: index, last: index, shift });
  }
  segments.push({ first: positions.size, last: Infinity, shift: 0 });

  function intervals(first: number, last: number) {
    const low = Math.min(first, last);
    const high = Math.max(first, last);
    const mapped = segments.flatMap(({ first, last, shift }): [number, number][] => {
      const start = Math.max(low, first);
      const end = Math.min(high, last);
      return start <= end ? [[start + shift, end + shift]] : [];
    }).sort(([a], [b]) => a - b);
    const runs: [number, number][] = [];
    for (const [start, end] of mapped) {
      const previous = runs.at(-1);
      if (previous && previous[1] + 1 === start) previous[1] = end;
      else runs.push([start, end]);
    }
    return runs;
  }

  function rangeReference(first: string, last: string, low: number, high: number, reversed: boolean, compact = false) {
    const start = address(first, reversed ? high : low);
    const end = address(last, reversed ? low : high);
    return compact && start === end ? start : `${start}:${end}`;
  }

  function rectangularReference(first: string, last?: string) {
    if (!last) return address(first);
    const start = parseAddress(first)?.[axis];
    const end = parseAddress(last)?.[axis];
    if (start === undefined || end === undefined) return `${address(first)}:${address(last)}`;
    const runs = intervals(start, end);
    return rangeReference(first, last, runs[0][0], runs.at(-1)![1], start > end);
  }

  function formula(value: string, local: boolean) {
    let argumentsInAggregates: Set<number> | undefined;
    return rewriteReferences(value, (first, last, qualifier, offset, length) => {
      if (qualifier ? !sameSheetName(sheetName(qualifier), name) : !local)
        return value.slice(offset, offset + length);
      const prefix = qualifier ? `${qualifier}!` : "";
      if (!last) return prefix + address(first);
      const start = parseAddress(first)![axis];
      const end = parseAddress(last)![axis];
      const runs = intervals(start, end);
      if (
        runs.length > 1 &&
        /^\s*[,)]/u.test(value.slice(offset + length)) &&
        (argumentsInAggregates ??= aggregateArgumentStarts(value)).has(offset)
      )
        return runs.map(([low, high]) => prefix + rangeReference(first, last, low, high, start > end, true)).join(",");
      return prefix + rangeReference(first, last, runs[0][0], runs.at(-1)![1], start > end);
    });
  }

  return { address, rectangularReference, formula };
}
