import { dateMillis } from "./spreadsheetCells";
import { offsetFormula } from "./spreadsheetReferences";
import type {
  HysSpreadsheetCellChange as Change,
  HysSpreadsheetFillMode as Mode,
  HysSpreadsheetSheet as Sheet,
  HysSpreadsheetValue as Value,
} from "./spreadsheetTypes";

const day = 86_400_000;
const wrap = (index: number, count: number) => ((index % count) + count) % count;
const empty = (value: Value) => value === null || value === "";

const textPatterns = [
  (text: string) => text.split(/\s+/u)[0],
  (text: string) => text.split(/\s+/u).at(-1),
  (text: string) => /^([^@\s]+)@[^@\s]+$/u.exec(text)?.[1],
  (text: string) => /^[^@\s]+@([^@\s]+)$/u.exec(text)?.[1],
  (text: string) => text.toUpperCase(),
  (text: string) => text.toLowerCase(),
];

function inferAdjacentText(
  seeds: readonly Value[],
  sample: (index: number) => Value,
) {
  if (!seeds.every((seed) => typeof seed === "string" && !!seed && !/^[=']/.test(seed))) return;
  const pattern = textPatterns.find((convert) =>
    seeds.every((seed, index) => {
      const value = sample(index);
      return typeof value === "string" && !/^[=']/.test(value) &&
        value.trim() !== seed && convert(value.trim()) === seed;
    }),
  );
  if (!pattern) return;
  return (index: number) => {
    const input = sample(index);
    if (typeof input === "string" && !/^[=']/.test(input)) return pattern(input.trim());
  };
}

function progression(values: readonly number[], defaultStep: number) {
  const first = values[0];
  const step = values.length > 1 ? values[1] - first : defaultStep;
  const at = (index: number) => first + index * step;
  if (values.every((value, index) => {
    const expected = at(index);
    return Number.isFinite(expected) && Math.abs(expected - value) <=
      Number.EPSILON * 4 * Math.max(1, Math.abs(expected), Math.abs(value));
  })) return at;
}

function inferSeries(values: readonly Value[], mode: Mode): ((index: number) => Value) | undefined {
  if (mode === "copy") return;
  if (values.every((value) => typeof value === "number")) {
    const at = progression(values, 1);
    if (at) return (index) => Number(at(index).toPrecision(15));
  }
  if (!values.every((value): value is string => typeof value === "string")) return;
  if (values.some((value) => value.startsWith("="))) return;
  const dates = values.map(dateMillis);
  if (dates.every((date) => date !== undefined)) {
    const at = progression(dates, day);
    if (at) return (index) => {
      const date = new Date(at(index));
      const year = date.getUTCFullYear();
      return year >= 0 && year <= 9999 ? date.toISOString().slice(0, 10) : null;
    };
  }
  if (mode !== "smart") return;
  const parts = values.map((value) => /^(.*?)(\d+)(\D*)$/.exec(value));
  const first = parts[0];
  if (!first || !parts.every((part) => part && part[1] === first[1] && part[3] === first[3] && Number.isSafeInteger(Number(part[2])))) return;
  const at = progression(parts.map((part) => Number(part![2])), 1);
  if (!at) return;
  const digits = first[2].length;
  return (index) => {
    const number = at(index);
    return first[1] + (number < 0 ? "-" : "") + String(Math.abs(number)).padStart(digits, "0") + first[3];
  };
}

export function fillValues(
  sheet: Sheet,
  rows: readonly number[],
  columns: readonly number[],
  direction: "down" | "right",
  mode: Mode,
  sequence?: readonly Value[],
  source?: { first: number; last: number },
): Change[] {
  const vertical = direction === "down";
  const along = vertical ? rows : columns;
  const across = vertical ? columns : rows;
  const start = source ? along.indexOf(source.first) : 0;
  const requestedEnd = source ? along.indexOf(source.last) : 0;
  if (start < 0 || requestedEnd < start || along.length < 2) return [];
  const point = (index: number, lane: number) =>
    vertical ? { row: index, column: lane } : { row: lane, column: index };
  const read = (index: number, lane: number) => {
    const { row, column } = point(index, lane);
    return sheet.rows[row]?.[column] ?? null;
  };
  const changes: Change[] = [];
  for (const lane of across) {
    let end = requestedEnd;
    if (!source && mode !== "copy" && !sequence?.length) {
      // Keep leading seeds when there is a blank target, or use two seeds to overwrite an existing range.
      const blank = along.findIndex((index) => empty(read(index, lane)));
      end = blank === 0 ? 0 : blank > 0 ? blank - 1 : Math.min(1, along.length - 2);
    }
    const seeds = along.slice(start, end + 1).map((index) => read(index, lane));
    const series = sequence?.length ? undefined : inferSeries(seeds, mode);
    const adjacent = !series && mode === "smart" && !sequence?.length && lane > 0
      ? inferAdjacentText(seeds, (offset) => read(along[start + offset], lane - 1))
      : undefined;
    const firstSequence = sequence?.indexOf(seeds[0]) ?? -1;
    for (const [index, axis] of along.entries()) {
      if (index >= start && index <= end) continue;
      const destination = point(axis, lane);
      const offset = index - start;
      const seed = wrap(offset, seeds.length);
      const original = point(along[start + seed], lane);
      if (adjacent && !empty(read(axis, lane))) continue;
      let value = sequence?.length
        ? sequence[wrap(offset + Math.max(0, firstSequence), sequence.length)]
        : series ? series(offset) : adjacent ? adjacent(offset) : seeds[seed];
      if (value === undefined) continue;
      if (!adjacent && typeof value === "string" && value.startsWith("=") && !sequence?.length)
        value = offsetFormula(value, destination.row - original.row, destination.column - original.column);
      if (adjacent && typeof value === "string" && /^[=']/.test(value)) value = "'" + value;
      changes.push({ ...destination, value });
    }
  }
  return changes;
}
