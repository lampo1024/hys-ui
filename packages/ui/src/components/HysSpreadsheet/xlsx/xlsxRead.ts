import { cellAddress, parseAddress, sheetLimits } from "../spreadsheetModel";
import { offsetFormula } from "../spreadsheetReferences";
import { safeLink } from "../spreadsheetCells";
import type {
  HysSpreadsheetAxisOptions as AxisOptions,
  HysSpreadsheetCellFormat as Format,
  HysSpreadsheetCellOptions as Options,
  HysSpreadsheetCellType,
  HysSpreadsheetGroup as Group,
  HysSpreadsheetSheet as Sheet,
  HysSpreadsheetValue as Value,
  HysSpreadsheetWorkbook as Workbook,
} from "../spreadsheetTypes";
import { serialToDate } from "./xlsxDates";
import { readStyles, type ImportedStyle } from "./xlsxStyles";
import {
  child,
  children,
  excelText,
  openXlsxArchive,
  readRelationships,
  richText,
  truth,
  type XlsxArchive,
  type XmlNode,
} from "./xlsxXml";

function checkedPoint(address: string) {
  const point = parseAddress(address);
  if (
    !point ||
    point.row >= sheetLimits.rows ||
    point.column >= sheetLimits.columns
  )
    throw new Error(
      `Excel 单元格 ${address} 超出 ${sheetLimits.rows} 行、${sheetLimits.columns} 列的范围。`,
    );
  return point;
}

function excelPoint(address: string) {
  const point = parseAddress(address);
  if (point) return point;
  const extended = /^(\$?[A-Z]{1,3}\$?)(\d{7})$/i.exec(address);
  if (!extended || +extended[2] > 1_048_576) return;
  const column = parseAddress(extended[1] + "1")?.column;
  if (column !== undefined) return { row: Number(extended[2]) - 1, column };
}

function range(value: string) {
  const [first, last = first, extra] = value.split(":");
  if (extra) throw new Error("Excel 文件中的区域无效。");
  const a = checkedPoint(first),
    b = checkedPoint(last);
  return {
    top: Math.min(a.row, b.row),
    bottom: Math.max(a.row, b.row),
    left: Math.min(a.column, b.column),
    right: Math.max(a.column, b.column),
  };
}

function literal(value: string) {
  return /^[=']/.test(value) ? "'" + value : value;
}

function readCell(
  node: XmlNode,
  style: ImportedStyle | undefined,
  strings: string[],
  date1904: boolean,
): { value: Value; type?: HysSpreadsheetCellType } {
  const kind = node.attributes.t;
  const value = child(node, "v")?.text;
  if (kind === "inlineStr")
    return { value: literal(richText(child(node, "is"))) };
  if (value === undefined || value === "") return { value: null };
  if (kind === "s") {
    const text = strings[Number(value)];
    if (text === undefined)
      throw new Error("Excel 文件中的共享字符串索引无效。");
    return { value: literal(text) };
  }
  if (kind === "str" || kind === "e")
    return { value: literal(excelText(value)) };
  if (kind === "b") return { value: truth(value) };
  if (kind === "d") {
    const type = value.includes("T") ? "datetime-local" : "date";
    return { value: value.replace(/Z$/, ""), type } as const;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error("Excel 文件中的数字无效。");
  if (style?.date) {
    const date = serialToDate(number, style.date, date1904);
    if (date !== undefined) return { value: date, type: style.date };
  }
  return { value: number };
}

function axisGroups(
  levels: Map<number, { level: number; hidden: boolean }>,
): Group[] {
  const groups: Group[] = [];
  const indices = [...levels.keys()].sort((a, b) => a - b);
  let previous = -2;
  let active: { start: number; level: number; collapsed: boolean }[] = [];
  function close(end: number, min: number) {
    while (active.length && active.at(-1)!.level > min) {
      const { start, collapsed } = active.pop()!;
      if (start > 0) groups.push({ start: start - 1, end, collapsed });
    }
  }
  for (const index of indices) {
    const { level, hidden } = levels.get(index)!;
    if (index !== previous + 1) close(previous, 0);
    close(previous, level);
    while (active.length < level)
      active.push({ start: index, level: active.length + 1, collapsed: true });
    if (!hidden) for (const item of active) item.collapsed = false;
    previous = index;
  }
  close(previous, 0);
  return groups;
}

function readValidations(
  root: XmlNode,
  cells: Record<string, Options>,
  height: number,
  width: number,
  date1904: boolean,
) {
  let assignments = 0;
  for (const node of children(
    child(root, "dataValidations"),
    "dataValidation",
  )) {
    const {
      type,
      sqref,
      operator = "between",
      allowBlank,
      error,
      prompt,
    } = node.attributes;
    const first = child(node, "formula1")?.text;
    const last = child(node, "formula2")?.text;
    const validation: NonNullable<Options["validation"]> = {
      required: !truth(allowBlank),
      message: error,
      prompt,
    };
    let options: Options = { validation };
    if (type === "list" && first?.startsWith('"') && first.endsWith('"')) {
      const values = first.slice(1, -1).replaceAll('""', '"').split(",");
      options = { type: "select", options: values, validation };
    } else if (
      ["decimal", "whole", "date", "textLength"].includes(type) &&
      ["between", "greaterThanOrEqual", "lessThanOrEqual"].includes(operator)
    ) {
      const convert = (value?: string) =>
        value?.trim() && Number.isFinite(Number(value))
          ? Number(value)
          : undefined;
      const min = operator === "lessThanOrEqual" ? undefined : convert(first);
      const max =
        operator === "greaterThanOrEqual" ? undefined : convert(last ?? first);
      if (type === "textLength")
        Object.assign(validation, { minLength: min, maxLength: max });
      else if (type === "date") {
        validation.type = "date";
        if (min !== undefined)
          validation.min = serialToDate(min, "date", date1904);
        if (max !== undefined)
          validation.max = serialToDate(max, "date", date1904);
      } else Object.assign(validation, { type: "number", min, max });
    } else continue;
    for (const ref of sqref?.trim().split(/\s+/) ?? []) {
      if (!ref) continue;
      const [first, last = first] = ref.split(":");
      const a = excelPoint(first),
        b = excelPoint(last);
      if (!a || !b) continue;
      const area = {
        top: Math.min(a.row, b.row),
        bottom: Math.min(height - 1, Math.max(a.row, b.row)),
        left: Math.min(a.column, b.column),
        right: Math.min(width - 1, Math.max(a.column, b.column)),
      };
      for (let row = area.top; row <= area.bottom; row++)
        for (let column = area.left; column <= area.right; column++) {
          if (++assignments > 200_000)
            throw new Error("Excel 文件的单元格验证范围过大。");
          const address = cellAddress(row, column);
          cells[address] = { ...cells[address], ...options };
        }
    }
  }
}

function readSheet(
  archive: XlsxArchive,
  path: string,
  info: XmlNode,
  index: number,
  styles: ImportedStyle[],
  strings: string[],
  date1904: boolean,
): Sheet {
  const root = archive.read(path);
  if (root.name !== "worksheet")
    throw new Error("Excel 文件包含无效的工作表部件。");
  const relationships = readRelationships(archive, path);
  const rows: Value[][] = [];
  const cells: Record<string, Options> = {};
  const formats: Record<string, Format> = {};
  const rowOptions: Record<number, AxisOptions> = {};
  const columnOptions: Record<number, AxisOptions> = {};
  const rowLevels = new Map<number, { level: number; hidden: boolean }>();
  const columnLevels = new Map<number, { level: number; hidden: boolean }>();
  const sharedFormulas = new Map<
    string,
    { row: number; column: number; text: string }
  >();
  const pendingFormulas: { row: number; column: number; index: string }[] = [];
  const protectedSheet = truth(
    child(root, "sheetProtection")?.attributes.sheet,
  );
  const dimension = child(root, "dimension")?.attributes.ref;
  const box = dimension ? range(dimension) : undefined;
  let width = box ? box.right + 1 : 1;
  let height = box ? box.bottom + 1 : 1;
  let rowIndex = -1;
  for (const row of children(child(root, "sheetData"), "row")) {
    rowIndex =
      row.attributes.r === undefined
        ? rowIndex + 1
        : Number(row.attributes.r) - 1;
    checkedPoint("A" + (rowIndex + 1));
    height = Math.max(height, rowIndex + 1);
    const size = Number(row.attributes.ht),
      hidden = truth(row.attributes.hidden);
    if (size > 0 || hidden)
      rowOptions[rowIndex] = {
        size: size > 0 ? (size * 4) / 3 : undefined,
        hidden: hidden || undefined,
      };
    if (Number(row.attributes.outlineLevel) > 0)
      rowLevels.set(rowIndex, {
        level: Math.min(7, Number(row.attributes.outlineLevel)),
        hidden,
      });
    let columnIndex = 0;
    const values = rows[rowIndex] ?? (rows[rowIndex] = []);
    for (const value of children(row, "c")) {
      const coordinate = checkedPoint(
        value.attributes.r ?? cellAddress(rowIndex, columnIndex),
      );
      if (coordinate.row !== rowIndex)
        throw new Error("Excel 文件的行和单元格坐标不一致。");
      columnIndex = coordinate.column + 1;
      width = Math.max(width, columnIndex);
      const address = cellAddress(rowIndex, coordinate.column);
      const style = styles[Number(value.attributes.s ?? 0)];
      if (style?.format) formats[address] = { ...style.format };
      const formula = child(value, "f");
      let parsed = readCell(value, style, strings, date1904);
      if (formula) {
        const text = formula.text.trim().replace(/^=/, "");
        const share =
          formula.attributes.t === "shared" ? formula.attributes.si : undefined;
        if (text) {
          if (share !== undefined)
            sharedFormulas.set(share, { ...coordinate, text });
          parsed = { value: "=" + text };
        } else if (share !== undefined)
          pendingFormulas.push({ ...coordinate, index: share });
      }
      if (parsed.type || (protectedSheet && style?.locked === false))
        cells[address] = {
          type: parsed.type,
          locked: protectedSheet && style?.locked === false ? false : undefined,
        };
      if (parsed.value !== null) values[coordinate.column] = parsed.value;
    }
  }
  for (const { row, column, index } of pendingFormulas) {
    const base = sharedFormulas.get(index);
    if (!base) throw new Error("Excel 文件中的共享公式缺少定义。");
    rows[row][column] = offsetFormula(
      "=" + base.text,
      row - base.row,
      column - base.column,
    );
  }
  for (const entry of children(child(root, "cols"), "col")) {
    const { min, max, width: size, hidden, outlineLevel } = entry.attributes;
    if (
      +min < 1 ||
      +max < +min ||
      !Number.isInteger(+min) ||
      !Number.isInteger(+max)
    )
      throw new Error("Excel 文件的列范围无效。");
    for (
      let column = +min - 1;
      column < Math.min(+max, sheetLimits.columns);
      column++
    ) {
      if (+size > 0 || truth(hidden))
        columnOptions[column] = {
          size: +size > 0 ? Math.round(+size * 7 + 5) : undefined,
          hidden: truth(hidden) || undefined,
        };
      if (+outlineLevel > 0)
        columnLevels.set(column, {
          level: Math.min(7, +outlineLevel),
          hidden: truth(hidden),
        });
    }
  }
  const include = (box: ReturnType<typeof range>) => {
    height = Math.max(height, box.bottom + 1);
    width = Math.max(width, box.right + 1);
  };
  const merges = children(child(root, "mergeCells"), "mergeCell").map(
    ({ attributes }) => {
      include(range(attributes.ref));
      return attributes.ref;
    },
  );
  for (const item of children(child(root, "hyperlinks"), "hyperlink")) {
    const { ref, location, id, tooltip } = item.attributes;
    const relation = relationships.find(
      (link) => link.id === id && link.type === "hyperlink" && link.external,
    );
    const link = safeLink(
      relation?.target ?? (location ? "#" + location : undefined),
    );
    if (!link) continue;
    const area = range(ref);
    include(area);
    for (let row = area.top; row <= area.bottom; row++)
      for (let column = area.left; column <= area.right; column++) {
        const address = cellAddress(row, column);
        cells[address] = { ...cells[address], link, tooltip };
      }
  }
  const comments = relationships.find(
    ({ type, external }) => type === "comments" && !external,
  );
  if (comments)
    for (const note of children(
      child(archive.read(comments.target), "commentList"),
      "comment",
    )) {
      const ref = note.attributes.ref;
      include(range(ref));
      cells[ref] = { ...cells[ref], note: richText(child(note, "text")) };
    }
  readValidations(root, cells, height, width, date1904);
  for (const address of Object.keys(cells)) include(range(address));
  const pane = child(
    child(child(root, "sheetViews"), "sheetView"),
    "pane",
  )?.attributes;
  const frozen = pane?.state === "frozen" || pane?.state === "frozenSplit";
  const color = child(child(root, "sheetPr"), "tabColor")?.attributes.rgb;
  const hidden =
    info.attributes.state === "hidden" ||
    info.attributes.state === "veryHidden";
  return {
    id: `sheet-${index + 1}`,
    name: excelText(info.attributes.name),
    hidden: hidden || undefined,
    rows: Array.from({ length: height }, (_, row) =>
      Array.from(rows[row] ?? [], (value) => value ?? null),
    ),
    columnCount: width,
    formats,
    cells,
    merges,
    rowOptions,
    columnOptions,
    rowGroups: axisGroups(rowLevels),
    columnGroups: axisGroups(columnLevels),
    frozenRows:
      frozen && +pane.ySplit
        ? Math.min(height, Math.max(0, Math.floor(+pane.ySplit)))
        : undefined,
    frozenColumns:
      frozen && +pane.xSplit
        ? Math.min(width, Math.max(0, Math.floor(+pane.xSplit)))
        : undefined,
    protected: protectedSheet || undefined,
    protectionMode: protectedSheet ? "excel" : undefined,
    tabColor:
      color && /^[\da-f]{8}$/i.test(color)
        ? "#" + color.slice(2).toLowerCase()
        : undefined,
  };
}

export function decodeXlsx(
  input: ArrayBuffer | Uint8Array,
  name?: string,
): Workbook {
  const archive = openXlsxArchive(input);
  const workbookPath =
    readRelationships(archive).find(
      ({ type, external }) => type === "officeDocument" && !external,
    )?.target ?? "xl/workbook.xml";
  const root = archive.read(workbookPath);
  if (root.name !== "workbook") throw new Error("Excel 工作簿格式无效。");
  const relationships = readRelationships(archive, workbookPath).filter(
    ({ external }) => !external,
  );
  const stylePath = relationships.find(({ type }) => type === "styles")?.target;
  const stringsPath = relationships.find(
    ({ type }) => type === "sharedStrings",
  )?.target;
  const styles = readStyles(stylePath ? archive.read(stylePath) : undefined);
  const strings = stringsPath
    ? children(archive.read(stringsPath), "si").map(richText)
    : [];
  const infos = children(child(root, "sheets"), "sheet");
  if (infos.length > sheetLimits.sheets)
    throw new Error(`Excel 文件最多支持 ${sheetLimits.sheets} 张工作表。`);
  const date1904 = truth(child(root, "workbookPr")?.attributes.date1904);
  const sheets = infos.flatMap((info, index) => {
    const relation = relationships.find(
      ({ id, type }) => id === info.attributes.id && type === "worksheet",
    );
    if (!relation) return [];
    return [
      readSheet(
        archive,
        relation.target,
        info,
        index,
        styles,
        strings,
        date1904,
      ),
    ];
  });
  if (!sheets.length) throw new Error("Excel 文件没有可导入的工作表。");
  const names = Object.fromEntries(
    children(child(root, "definedNames"), "definedName").flatMap((item) => {
      if (
        item.attributes.localSheetId !== undefined ||
        item.attributes.name?.startsWith("_xlnm.")
      )
        return [];
      const match =
        /^(?:'((?:[^']|'')+)'|([^!]+))!(\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?)$/i.exec(
          item.text,
        );
      if (!match) return [];
      const sheet = sheets.find(
        ({ name }) =>
          name.toLowerCase() ===
          (match[1]?.replaceAll("''", "'") ?? match[2]).toLowerCase(),
      );
      return sheet && item.attributes.name
        ? [
            [
              item.attributes.name,
              { sheetId: sheet.id, range: match[3].replaceAll("$", "") },
            ],
          ]
        : [];
    }),
  );
  return {
    name,
    sheets,
    names,
    calculationMode:
      child(root, "calcPr")?.attributes.calcMode === "manual"
        ? "manual"
        : undefined,
  };
}
