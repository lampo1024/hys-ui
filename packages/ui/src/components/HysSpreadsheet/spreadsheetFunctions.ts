import type {
  HysSpreadsheetFormulaArgument as Argument,
  HysSpreadsheetFormulaFunction,
  HysSpreadsheetValue as Value,
} from "./spreadsheetTypes";

const arrayWidths = new WeakMap<readonly Value[], number>();
export function formulaArray(values: readonly Value[], width: number) {
  arrayWidths.set(values, width);
  return values;
}
export function formulaArrayWidth(values: readonly Value[]) {
  return arrayWidths.get(values) ?? 1;
}

function first(value: Argument = null): Value {
  return Array.isArray(value) ? (value[0] ?? null) : (value as Value);
}
function values(args: Argument[]): Value[] {
  return args.flatMap((arg) => (Array.isArray(arg) ? arg : [arg as Value]));
}
function numbers(args: Argument[]) {
  return values(args).filter(
    (value): value is number => typeof value === "number",
  );
}
export function formulaNumber(value: Argument = null): number {
  const input = first(value);
  if (input === null || typeof input === "boolean" || typeof input === "number")
    return Number(input);
  throw new Error("#VALUE!");
}
const str = (value: Argument = null) => String(first(value) ?? "");
const sum = (input: number[]) =>
  input.reduce((total, value) => total + value, 0);
const average = (input: number[]) => {
  if (!input.length) throw new Error("#DIV/0!");
  return sum(input) / input.length;
};
const bounded = (value: Argument, min: number, max: number) => {
  const size = formulaNumber(value);
  if (!Number.isInteger(size) || size < min || size > max)
    throw new Error("#NUM!");
  return size;
};
const date = (value: Argument) => {
  const input = first(value);
  if (input === null || typeof input === "boolean") throw new Error("#VALUE!");
  const parsed = new Date(input);
  if (!Number.isFinite(+parsed)) throw new Error("#VALUE!");
  return parsed;
};
const list = (arg: Argument = null) => values([arg]);
const compare = (a: Value, b: Value) =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a ?? "").localeCompare(String(b ?? ""));
const matches = (input: Value, criterion: Argument) => {
  const expected = first(criterion);
  if (typeof expected !== "string") return input === expected;
  const [, operator = "=", target = expected] =
    /^(<=|>=|<>|<|>|=)(.*)$/.exec(expected) ?? [];
  const value =
    typeof input === "number" &&
    target !== "" &&
    Number.isFinite(Number(target))
      ? Number(target)
      : target;
  const order = compare(input, value);
  if (operator === "<") return order < 0;
  if (operator === ">") return order > 0;
  if (operator === "<=") return order <= 0;
  if (operator === ">=") return order >= 0;
  if (operator === "<>") return order !== 0;
  return order === 0;
};
const matchingValues = (
  range: Argument,
  condition: Argument,
  result = range,
) => {
  const output = list(result);
  const input = list(range);
  if (output.length !== input.length) throw new Error("#VALUE!");
  return output.filter((_, index) => matches(input[index], condition));
};

export const formulaFunctions: Record<string, HysSpreadsheetFormulaFunction> = {
  SUM: (...args) => sum(numbers(args)),
  AVERAGE: (...args) => average(numbers(args)),
  COUNT: (...args) => numbers(args).length,
  COUNTA: (...args) =>
    values(args).filter((value) => value !== null && value !== "").length,
  MIN(...args) {
    const input = numbers(args);
    return input.length
      ? input.reduce((minimum, value) => Math.min(minimum, value))
      : 0;
  },
  MAX(...args) {
    const input = numbers(args);
    return input.length
      ? input.reduce((maximum, value) => Math.max(maximum, value))
      : 0;
  },
  ABS: (value) => Math.abs(formulaNumber(value)),
  SQRT: (value) => Math.sqrt(formulaNumber(value)),
  POWER: (value, exponent) => formulaNumber(value) ** formulaNumber(exponent),
  INT: (value) => Math.floor(formulaNumber(value)),
  MOD(value, divisor) {
    const base = formulaNumber(divisor);
    if (!base) throw new Error("#DIV/0!");
    return ((formulaNumber(value) % base) + base) % base;
  },
  ROUND(value, digits = 0) {
    const factor = 10 ** bounded(digits, -12, 12);
    const number = formulaNumber(value);
    return (
      (Math.sign(number) *
        Math.round(Math.abs(number) * factor + Number.EPSILON)) /
      factor
    );
  },
  MEDIAN(...args) {
    const input = numbers(args).sort((a, b) => a - b);
    if (!input.length) throw new Error("#NUM!");
    const middle = Math.floor(input.length / 2);
    return input.length % 2
      ? input[middle]
      : (input[middle - 1] + input[middle]) / 2;
  },
  CONCAT: (...args) => values(args).join(""),
  LEN: (value) => str(value).length,
  UPPER: (value) => str(value).toUpperCase(),
  LOWER: (value) => str(value).toLowerCase(),
  TRIM: (value) => str(value).trim().replace(/\s+/g, " "),
  LEFT: (value, length = 1) => str(value).slice(0, bounded(length, 0, 32767)),
  RIGHT(value, length = 1) {
    const count = bounded(length, 0, 32767);
    return count ? str(value).slice(-count) : "";
  },
  MID(value, start, length) {
    const from = bounded(start, 1, 32767) - 1;
    return str(value).slice(from, from + bounded(length, 0, 32767));
  },
  DATE: (year, month, day) =>
    new Date(
      Date.UTC(
        formulaNumber(year),
        formulaNumber(month) - 1,
        formulaNumber(day),
      ),
    )
      .toISOString()
      .slice(0, 10),
  TODAY: () => new Date().toISOString().slice(0, 10),
  NOW: () => new Date().toISOString(),
  YEAR: (value) => date(value).getUTCFullYear(),
  MONTH: (value) => date(value).getUTCMonth() + 1,
  DAY: (value) => date(value).getUTCDate(),
  AND: (...args) => values(args).every(Boolean),
  OR: (...args) => values(args).some(Boolean),
  NOT: (value) => !first(value),
  COUNTIF: (range, criterion) => matchingValues(range, criterion).length,
  SUMIF: (range, criterion, result) =>
    sum(numbers(matchingValues(range, criterion, result))),
  AVERAGEIF: (range, criterion, result) =>
    average(numbers(matchingValues(range, criterion, result))),
  INDEX(input, position) {
    const items = list(input);
    return items[bounded(position, 1, items.length) - 1];
  },
  MATCH(needle, input) {
    const index = list(input).findIndex((value) => value === first(needle));
    if (index < 0) throw new Error("#N/A!");
    return index + 1;
  },
  XLOOKUP(needle, input, output, fallback) {
    const index = list(input).findIndex((value) => value === first(needle));
    if (index < 0 && fallback === undefined) throw new Error("#N/A!");
    return index < 0 ? first(fallback) : (list(output)[index] ?? null);
  },
  SEQUENCE(rows, columns = 1, start = 1, step = 1) {
    const width = bounded(columns, 1, 100);
    const height = bounded(rows, 1, Math.floor(10000 / width));
    return formulaArray(
      Array.from(
        { length: height * width },
        (_, index) => formulaNumber(start) + index * formulaNumber(step),
      ),
      width,
    );
  },
  UNIQUE: (input) => [...new Set(list(input))],
  SORT: (input, direction = 1) =>
    list(input).sort(
      (a, b) => compare(a, b) * Math.sign(formulaNumber(direction)),
    ),
  FILTER: (input, mask, fallback = null) => {
    const keep = list(mask);
    const items = list(input);
    if (items.length !== keep.length) throw new Error("#VALUE!");
    const result = items.filter((_, index) => keep[index]);
    return result.length ? result : first(fallback);
  },
};
