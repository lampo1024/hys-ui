import { parseAddress, sameSheetName, sheetWidth } from "./spreadsheetModel";
import { sheetName } from "./spreadsheetReferences";
import {
  formulaArray,
  formulaArrayWidth,
  formulaFunctions,
  formulaNumber,
} from "./spreadsheetFunctions";
import type {
  HysSpreadsheetFormulaArgument as Argument,
  HysSpreadsheetFormulaFunction,
  HysSpreadsheetSheet,
  HysSpreadsheetValue,
  HysSpreadsheetWorkbook,
} from "./spreadsheetTypes";

const numeric = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const tokenPattern =
  /\s*(#[A-Z0-9/]+[!?]|"(?:[^"]|"")*"|'(?:[^']|'')+'|\$?[\p{L}_][\p{L}\p{N}_.]*\$?\d*|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|<=|>=|<>|[+\-*/^(),:%!&=<>{};])/iuy;
type Result = { value: HysSpreadsheetValue; error?: string };
type Point = NonNullable<ReturnType<typeof parseAddress>>;
type Expression = (context: Context) => Argument;
type Context = {
  read(qualifier: string | undefined, first: Point, last?: Point): Argument;
  named(name: string): Argument;
  call(name: string, args: Expression[]): Argument;
};

export function callFormula(
  name: string,
  args: Expression[],
  context: Context,
  custom?: HysSpreadsheetFormulaFunction,
): Argument {
  if (name === "IF")
    return args[scalar(args[0]?.(context) ?? null) ? 1 : 2]?.(context) ?? null;
  if (name === "IFERROR") {
    try {
      return args[0]?.(context) ?? null;
    } catch {
      return args[1]?.(context) ?? null;
    }
  }
  const fn =
    custom ??
    (Object.hasOwn(formulaFunctions, name)
      ? formulaFunctions[name]
      : undefined);
  if (!fn) throw new Error("#NAME?");
  return fn(...args.map((arg) => arg(context)));
}

const precedence: Record<string, number> = {
  "=": 1,
  "<>": 1,
  "<": 1,
  ">": 1,
  "<=": 1,
  ">=": 1,
  "&": 2,
  "+": 3,
  "-": 3,
  "*": 4,
  "/": 4,
  "^": 5,
};

export function scalar(value: Argument): HysSpreadsheetValue {
  return Array.isArray(value)
    ? (value[0] ?? null)
    : (value as HysSpreadsheetValue);
}

function operate(operator: string, left: Argument, right: Argument): Argument {
  if (Array.isArray(left) || Array.isArray(right)) {
    const size = Array.isArray(left)
      ? left.length
      : (right as readonly HysSpreadsheetValue[]).length;
    const width = formulaArrayWidth(
      Array.isArray(left) ? left : (right as readonly HysSpreadsheetValue[]),
    );
    if (
      Array.isArray(left) &&
      Array.isArray(right) &&
      (size !== right.length || width !== formulaArrayWidth(right))
    )
      throw new Error("#VALUE!");
    return formulaArray(
      Array.from({ length: size }, (_, index) =>
        scalar(
          operate(
            operator,
            Array.isArray(left) ? left[index] : left,
            Array.isArray(right) ? right[index] : right,
          ),
        ),
      ),
      width,
    );
  }
  const a = scalar(left);
  const b = scalar(right);
  switch (operator) {
    case "=":
      return a === b;
    case "<>":
      return a !== b;
    case "<":
      return (a ?? 0) < (b ?? 0);
    case ">":
      return (a ?? 0) > (b ?? 0);
    case "<=":
      return (a ?? 0) <= (b ?? 0);
    case ">=":
      return (a ?? 0) >= (b ?? 0);
    case "&":
      return String(a ?? "") + String(b ?? "");
  }
  const x = formulaNumber(a);
  const y = formulaNumber(b);
  if (operator === "/" && y === 0) throw new Error("#DIV/0!");
  if (operator === "+") return x + y;
  if (operator === "-") return x - y;
  if (operator === "*") return x * y;
  if (operator === "/") return x / y;
  return x ** y;
}

export function compileFormula(source: string): Expression {
  const list: string[] = [];
  tokenPattern.lastIndex = 0;
  for (let index = 0; index < source.length; index = tokenPattern.lastIndex) {
    const match = tokenPattern.exec(source);
    if (!match || list.length >= 512) throw new Error("#ERROR!");
    list.push(match[1]);
  }
  let index = 0;
  const peek = () => list[index];
  const eat = (token: string) => peek() === token && ++index > 0;
  function expect(token: string) {
    if (!eat(token)) throw new Error("#ERROR!");
  }
  function primary(): Expression {
    if (eat("{")) {
      const rows: Expression[][] = [];
      do {
        const row = [expression()];
        while (eat(",")) row.push(expression());
        rows.push(row);
      } while (eat(";"));
      expect("}");
      const width = rows[0].length;
      if (rows.some((row) => row.length !== width)) throw new Error("#VALUE!");
      return (context) =>
        formulaArray(
          rows.flatMap((row) => row.map((entry) => scalar(entry(context)))),
          width,
        );
    }
    if (eat("(")) {
      const value = expression();
      expect(")");
      return value;
    }
    const token = list[index++];
    if (!token) throw new Error("#ERROR!");
    if (token.startsWith("#"))
      return () => {
        throw new Error(token.toUpperCase());
      };
    if (token.startsWith('"'))
      return () => token.slice(1, -1).replaceAll('""', '"');
    if (numeric.test(token)) return () => Number(token);
    const name = token.toUpperCase();
    if (eat("(")) {
      const args: Expression[] = [];
      if (!eat(")")) {
        do args.push(expression());
        while (eat(","));
        expect(")");
      }
      return (context) => context.call(name, args);
    }
    const qualifier = eat("!") ? sheetName(token) : undefined;
    const first = parseAddress(
      qualifier !== undefined ? (list[index++] ?? "") : token,
    );
    if (first) {
      const range = eat(":");
      const last = range ? parseAddress(list[index++] ?? "") : undefined;
      if (range && !last) throw new Error("#REF!");
      return (context) => context.read(qualifier, first, last);
    }
    if (qualifier !== undefined) throw new Error("#REF!");
    if (name === "TRUE" || name === "FALSE") return () => name === "TRUE";
    return (context) => context.named(name);
  }
  function factor(): Expression {
    if (eat("+")) return factor();
    if (eat("-")) {
      const value = factor();
      return (context) => operate("-", 0, value(context));
    }
    let value = primary();
    while (eat("%")) {
      const part = value;
      value = (context) => operate("/", part(context), 100);
    }
    return value;
  }
  function expression(minimum = 1): Expression {
    let left = factor();
    while ((precedence[peek()] ?? 0) >= minimum) {
      const operator = list[index++];
      const right = expression(
        precedence[operator] + (operator === "^" ? 0 : 1),
      );
      const part = left;
      left = (context) => operate(operator, part(context), right(context));
    }
    return left;
  }
  const result = expression();
  if (index !== list.length) throw new Error("#ERROR!");
  return result;
}

export const builtinFormulaNames = [
  "IF",
  "IFERROR",
  ...Object.keys(formulaFunctions),
].sort();

export function evaluateWorkbook(
  workbook: HysSpreadsheetWorkbook,
  customFunctions: Readonly<Record<string, HysSpreadsheetFormulaFunction>> = {},
  compiled = new Map<string, Expression>(),
  previous?: ReturnType<typeof formulaSnapshot>,
  changed?: { sheetId: string; positions: readonly number[] },
) {
  const custom = new Map(
    Object.entries(customFunctions).map(([key, value]) => [
      key.toUpperCase(),
      value,
    ]),
  );
  const names = new Map(
    Object.entries(workbook.names ?? {}).map(([key, value]) => [
      key.toUpperCase(),
      value,
    ]),
  );
  const sheets = new Map(workbook.sheets.map((sheet) => [sheet.id, sheet]));
  const widths = new Map(
    workbook.sheets.map((sheet) => [sheet.id, sheetWidth(sheet)]),
  );
  const state = formulaSnapshot(workbook);
  const { cached, inputs, dependents } = state;
  if (previous && changed && !previous.hasSpills) {
    const invalid = new Set(
      changed.positions.map((position) =>
        formulaKey(changed.sheetId, position),
      ),
    );
    for (const key of invalid)
      for (const dependent of previous.dependents.get(key) ?? [])
        invalid.add(dependent);
    for (const [sheetId, values] of previous.cached) {
      const retained = new Map(
        [...values].filter(
          ([position]) => !invalid.has(formulaKey(sheetId, position)),
        ),
      );
      if (retained.size) cached.set(sheetId, retained);
    }
    for (const [key, sources] of previous.inputs)
      if (!invalid.has(key))
        for (const source of sources) recordDependency(key, source);
  }
  const spills = new Map<string, Map<number, Result>>();
  const visiting = new Set<string>();
  const spillChecked = new Set<string>();
  const maySpill = new RegExp(
    `\\{|:|\\b(?:SEQUENCE|UNIQUE|SORT|FILTER${custom.size ? "|" + [...custom.keys()].filter((name) => /^[A-Z_]\w*$/.test(name)).join("|") : ""})\\s*\\(`,
    "i",
  );

  function recordDependency(key: string, source: string) {
    if (!inputs.has(key)) inputs.set(key, new Set());
    if (!dependents.has(source)) dependents.set(source, new Set());
    inputs.get(key)!.add(source);
    dependents.get(source)!.add(key);
  }

  function prepareSpills(source: HysSpreadsheetSheet) {
    if (spillChecked.has(source.id)) return;
    spillChecked.add(source.id);
    source.rows.forEach((cells, row) =>
      cells.forEach((value, column) => {
        if (
          typeof value === "string" &&
          value.startsWith("=") &&
          maySpill.test(value)
        )
          calculate(source, row, column);
      }),
    );
  }

  function calculate(
    sheet: HysSpreadsheetSheet,
    row: number,
    column: number,
  ): Result {
    const width = widths.get(sheet.id)!;
    const position = row * width + column;
    const expanded = spills.get(sheet.id)?.get(position);
    if (expanded) return expanded;
    const raw = sheet.rows[row]?.[column] ?? null;
    if (typeof raw !== "string") return { value: raw };
    if (raw.startsWith("'")) return { value: raw.slice(1) };
    if (!raw.startsWith("=")) return { value: raw };
    let cache = cached.get(sheet.id);
    if (!cache) cached.set(sheet.id, (cache = new Map()));
    const existing = cache.get(position);
    if (existing) return existing;
    const key = formulaKey(sheet.id, position);
    if (visiting.has(key)) return { value: null, error: "#CYCLE!" };
    if (visiting.size >= 256) return { value: null, error: "#LIMIT!" };
    visiting.add(key);
    let result: Result;
    let work = 0;

    function read(
      target: HysSpreadsheetSheet | undefined,
      first: Point,
      last?: Point,
    ): Argument {
      if (!target) throw new Error("#REF!");
      const targetWidth = widths.get(target.id)!;
      function get(row: number, column: number) {
        if (++work > 250000) throw new Error("#LIMIT!");
        if (row >= target!.rows.length || column >= targetWidth)
          throw new Error("#REF!");
        recordDependency(
          key,
          formulaKey(target!.id, row * targetWidth + column),
        );
        if (target!.rows[row]?.[column] == null) prepareSpills(target!);
        const item = calculate(target!, row, column);
        if (item.error) throw new Error(item.error);
        return item.value;
      }
      if (!last) return get(first.row, first.column);
      const values = [];
      for (
        let row = Math.min(first.row, last.row);
        row <= Math.max(first.row, last.row);
        row++
      )
        for (
          let column = Math.min(first.column, last.column);
          column <= Math.max(first.column, last.column);
          column++
        )
          values.push(get(row, column));
      return formulaArray(values, Math.abs(first.column - last.column) + 1);
    }

    const context: Context = {
      read(qualifier, first, last) {
        const target =
          qualifier === undefined
            ? sheet
            : workbook.sheets.find((item) =>
                sameSheetName(item.name, qualifier),
              );
        return read(target, first, last);
      },
      named(name) {
        const named = names.get(name);
        if (!named) throw new Error("#NAME?");
        const [start, end] = named.range.split(":");
        const first = parseAddress(start);
        const last = end && parseAddress(end);
        if (!first || (end && !last)) throw new Error("#REF!");
        return read(sheets.get(named.sheetId), first, last || undefined);
      },
      call(name, args) {
        return callFormula(name, args, context, custom.get(name));
      },
    };

    try {
      let expression = compiled.get(raw);
      if (!expression) {
        expression = compileFormula(raw.slice(1).trim());
        if (compiled.size >= 4096) compiled.clear();
        compiled.set(raw, expression);
      }
      const output = expression(context);
      if (Array.isArray(output) && output.length > 1) {
        state.hasSpills = true;
        const spillWidth = formulaArrayWidth(output);
        if (
          row + Math.ceil(output.length / spillWidth) > sheet.rows.length ||
          column + spillWidth > width
        )
          throw new Error("#SPILL!");
        let expanded = spills.get(sheet.id);
        if (!expanded) spills.set(sheet.id, (expanded = new Map()));
        const cells = output.slice(1).map((value, index) => {
          const offset = index + 1;
          const targetRow = row + Math.floor(offset / spillWidth);
          const targetColumn = column + (offset % spillWidth);
          const target = targetRow * width + targetColumn;
          if (
            sheet.rows[targetRow]?.[targetColumn] != null ||
            expanded.has(target)
          )
            throw new Error("#SPILL!");
          if (typeof value === "number" && !Number.isFinite(value))
            throw new Error("#NUM!");
          return [target, { value }] as const;
        });
        for (const [target, result] of cells) expanded.set(target, result);
      }
      const value = scalar(output);
      if (typeof value === "number" && !Number.isFinite(value))
        throw new Error("#NUM!");
      result = {
        value:
          typeof value === "number" ? Number(value.toPrecision(15)) : value,
      };
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      result = { value: null, error: code.startsWith("#") ? code : "#ERROR!" };
    } finally {
      visiting.delete(key);
    }
    cache.set(position, result);
    return result;
  }

  function evaluate(
    sheet: HysSpreadsheetSheet,
    row: number,
    column: number,
  ): Result {
    const source = sheets.get(sheet.id);
    if (!source) return { value: null, error: "#REF!" };
    if (
      row < 0 ||
      column < 0 ||
      row >= source.rows.length ||
      column >= widths.get(source.id)!
    )
      return { value: null, error: "#REF!" };
    if (source.rows[row]?.[column] == null) prepareSpills(source);
    return calculate(source, row, column);
  }
  return Object.assign(evaluate, { snapshot: state });
}

function formulaKey(sheetId: string, position: number) {
  return JSON.stringify([sheetId, position]);
}

function formulaSnapshot(workbook: HysSpreadsheetWorkbook) {
  return {
    workbook,
    cached: new Map<string, Map<number, Result>>(),
    inputs: new Map<string, Set<string>>(),
    dependents: new Map<string, Set<string>>(),
    hasSpills: false,
  };
}
