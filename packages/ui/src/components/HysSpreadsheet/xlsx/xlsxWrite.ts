import {
  cellAddress,
  parseAddress,
  readWorkbook,
  sheetWidth,
} from "../spreadsheetModel";
import { safeLink, typedFormat } from "../spreadsheetCells";
import { evaluateWorkbook } from "../spreadsheetFormulas";
import { sheetReference } from "../spreadsheetReferences";
import type {
  HysSpreadsheetCellFormat,
  HysSpreadsheetFormulaFunction,
  HysSpreadsheetSheet as Sheet,
  HysSpreadsheetValue as Value,
  HysSpreadsheetWorkbook as Workbook,
} from "../spreadsheetTypes";
import { writeNotes, writeValidations } from "./xlsxAnnotations";
import { dateToSerial } from "./xlsxDates";
import { makeStyles, xlsxColor } from "./xlsxStyles";
import {
  documentXml,
  escaped,
  officeRelationships,
  packXlsx,
  relationshipXml,
  spreadsheetNamespace,
  xmlText,
  type XlsxRelationship,
} from "./xlsxXml";

export interface XlsxExportOptions {
  currency?: string;
  formulaFunctions?: Readonly<Record<string, HysSpreadsheetFormulaFunction>>;
}

function addressWithin(sheet: Sheet, address: string) {
  const point = parseAddress(address);
  if (
    !point ||
    point.row >= sheet.rows.length ||
    point.column >= (sheet.columnCount ?? sheetWidth(sheet))
  )
    return;
  return point;
}

function literalXml(value: Value, isFormula: boolean) {
  if (typeof value === "number" && Number.isFinite(value))
    return { type: "", body: "<v>" + value + "</v>" };
  if (typeof value === "boolean")
    return { type: ' t="b"', body: "<v>" + Number(value) + "</v>" };
  if (typeof value !== "string") return { type: "", body: "" };
  if (isFormula)
    return { type: ' t="str"', body: "<v>" + xmlText(value) + "</v>" };
  return {
    type: ' t="inlineStr"',
    body:
      '<is><t xml:space="preserve">' +
      xmlText(value.startsWith("'") ? value.slice(1) : value) +
      "</t></is>",
  };
}

function layout(sheet: Sheet, axis: "row" | "column", index: number) {
  const options = (axis === "row" ? sheet.rowOptions : sheet.columnOptions)?.[
    index
  ];
  const groups = (axis === "row" ? sheet.rowGroups : sheet.columnGroups) ?? [];
  const containing = groups.filter(
    ({ start, end }) => start < index && index <= end,
  );
  return {
    size: options?.size,
    hidden: options?.hidden || containing.some(({ collapsed }) => collapsed),
    level: Math.min(7, containing.length),
    collapsed: groups.some(
      ({ start, collapsed }) => start === index && collapsed,
    ),
  };
}

function writeSheet(
  sheet: Sheet,
  styles: ReturnType<typeof makeStyles>,
  evaluate: ReturnType<typeof evaluateWorkbook>,
  relationships: XlsxRelationship[],
) {
  const width = sheetWidth(sheet);
  const height = sheet.rows.length;
  const columns: string[] = [],
    rows: string[] = [],
    links: string[] = [];
  const bounds = `A1:${cellAddress(height - 1, width - 1)}`;
  for (let column = 0; column < width; column++) {
    const { size, hidden, level, collapsed } = layout(sheet, "column", column);
    if (size || hidden || level || collapsed)
      columns.push(
        `<col min="${column + 1}" max="${column + 1}"` +
          (size
            ? ` width="${Math.max(1, (size - 5) / 7)}" customWidth="1"`
            : "") +
          (hidden ? ' hidden="1"' : "") +
          (level ? ` outlineLevel="${level}"` : "") +
          (collapsed ? ' collapsed="1"' : "") +
          "/>",
      );
  }
  const metadata = new Map<number, Set<number>>();
  for (const address of [
    ...Object.keys(sheet.formats ?? {}),
    ...Object.keys(sheet.cells ?? {}),
  ]) {
    const point = addressWithin(sheet, address);
    if (!point) continue;
    if (!metadata.has(point.row)) metadata.set(point.row, new Set());
    metadata.get(point.row)!.add(point.column);
  }
  for (let row = 0; row < height; row++) {
    const { size, hidden, level, collapsed } = layout(sheet, "row", row);
    const cells: string[] = [];
    const indices = new Set(metadata.get(row));
    sheet.rows[row].forEach((value, column) => {
      if (value != null) indices.add(column);
    });
    for (const column of [...indices].sort((a, b) => a - b)) {
      const address = cellAddress(row, column);
      const config = sheet.cells?.[address];
      const raw = sheet.rows[row]?.[column] ?? null;
      let format = typedFormat(config, sheet.formats?.[address]);
      const isFormula = typeof raw === "string" && raw.startsWith("=");
      const computed = isFormula ? evaluate(sheet, row, column) : undefined;
      const isDate =
        config?.type === "date" ||
        config?.type === "time" ||
        config?.type === "datetime-local";
      const dateType = isDate
        ? config.type
        : format?.number === "date" || format?.number === "time"
          ? format.number
          : undefined;
      const serial =
        typeof raw === "string" && !isFormula
          ? dateToSerial(raw, dateType)
          : undefined;
      if (serial !== undefined && !format?.excelFormat) {
        const excelFormat =
          dateType === "datetime-local"
            ? "yyyy-mm-dd hh:mm:ss"
            : dateType === "time"
              ? "hh:mm:ss"
              : "yyyy-mm-dd";
        format = { ...format, excelFormat };
      }
      const unlocked =
        sheet.protected && config?.locked === false && !config?.readonly;
      const style = styles.id(format, unlocked ? false : undefined);
      const link = safeLink(config?.link);
      if (link) {
        let destination: string;
        if (link.startsWith("#"))
          destination = `location="${escaped(link.slice(1))}"`;
        else {
          const id = "rId" + (relationships.length + 1);
          relationships.push({
            id,
            type: "hyperlink",
            target: link,
            external: true,
          });
          destination = `r:id="${id}"`;
        }
        links.push(
          `<hyperlink ref="${address}" ${destination}${config?.tooltip ? ` tooltip="${escaped(config.tooltip)}"` : ""}/>`,
        );
      }
      const knownError =
        computed?.error &&
        {
          "#DIV/0!": "#DIV/0!",
          "#VALUE!": "#VALUE!",
          "#REF!": "#REF!",
          "#NAME?": "#NAME?",
          "#NUM!": "#NUM!",
          "#N/A!": "#N/A",
          "#NULL!": "#NULL!",
        }[computed.error];
      const result = knownError
        ? { type: ' t="e"', body: "<v>" + escaped(knownError) + "</v>" }
        : literalXml(computed ? computed.value : (serial ?? raw), isFormula);
      if (!result.body && !style && !isFormula && !link) continue;
      cells.push(
        `<c r="${address}"${style ? ` s="${style}"` : ""}${result.type}>` +
          (isFormula ? `<f>${escaped(raw.slice(1))}</f>` : "") +
          result.body +
          "</c>",
      );
    }
    if (cells.length || size || hidden || level || collapsed)
      rows.push(
        `<row r="${row + 1}"` +
          (size ? ` ht="${(size * 3) / 4}" customHeight="1"` : "") +
          (hidden ? ' hidden="1"' : "") +
          (level ? ` outlineLevel="${level}"` : "") +
          (collapsed ? ' collapsed="1"' : "") +
          `>${cells.join("")}</row>`,
      );
  }
  const freezeRows = Math.min(height - 1, Math.max(0, sheet.frozenRows ?? 0));
  const freezeColumns = Math.min(
    width - 1,
    Math.max(0, sheet.frozenColumns ?? 0),
  );
  const pane =
    freezeRows || freezeColumns
      ? `<pane xSplit="${freezeColumns}" ySplit="${freezeRows}" topLeftCell="${cellAddress(freezeRows, freezeColumns)}" activePane="${freezeRows && freezeColumns ? "bottomRight" : freezeRows ? "bottomLeft" : "topRight"}" state="frozen"/>`
      : "";
  const merges = (sheet.merges ?? []).filter((ref) => {
    const [first, last, extra] = ref.split(":");
    return (
      !extra &&
      last &&
      addressWithin(sheet, first) &&
      addressWithin(sheet, last)
    );
  });
  const tab = xlsxColor(sheet.tabColor);
  return (
    `<worksheet xmlns="${spreadsheetNamespace}" xmlns:r="${officeRelationships}">` +
    `<sheetPr>${tab ? `<tabColor rgb="${tab}"/>` : ""}<outlinePr summaryBelow="0" summaryRight="0"/></sheetPr>` +
    `<dimension ref="${bounds}"/><sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>` +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    (columns.length ? `<cols>${columns.join("")}</cols>` : "") +
    `<sheetData>${rows.join("")}</sheetData>` +
    (sheet.protected
      ? '<sheetProtection sheet="1" objects="1" scenarios="1"/>'
      : "") +
    (sheet.filterHeader ? `<autoFilter ref="${bounds}"/>` : "") +
    (merges.length
      ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${escaped(ref)}"/>`).join("")}</mergeCells>`
      : "") +
    writeValidations(sheet) +
    (links.length ? `<hyperlinks>${links.join("")}</hyperlinks>` : "")
  );
}

function validateNames(workbook: Workbook) {
  const used = new Set<string>();
  for (const { name } of workbook.sheets) {
    if (
      !name.trim() ||
      name.length > 31 ||
      /[\\/?*:[\]]/.test(name) ||
      name.startsWith("'") ||
      name.endsWith("'") ||
      used.has(name.toLowerCase())
    )
      throw new Error(
        `工作表“${name}”的名称不符合 Excel 要求，请重命名后重试。`,
      );
    used.add(name.toLowerCase());
  }
}

export function encodeXlsx(
  workbook: Workbook,
  options: XlsxExportOptions = {},
) {
  if (workbook.sheets.some(({ unloaded }) => unloaded))
    throw new Error("请先加载工作簿中的全部工作表，再导出 Excel。");
  const source = readWorkbook(workbook);
  validateNames(source);
  const styles = makeStyles(options.currency);
  const evaluate = evaluateWorkbook(source, options.formulaFunctions);
  const parts: Record<string, string> = {};
  const relationships: XlsxRelationship[] = [];
  const overrides: string[] = [];
  const override = (path: string, type: string) =>
    overrides.push(
      `<Override PartName="/${path}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.${type}+xml"/>`,
    );
  const sheets = source.sheets.map((sheet, index) => {
    const name = `sheet${index + 1}.xml`;
    const path = "xl/worksheets/" + name;
    const id = "rId" + (index + 1);
    relationships.push({ id, type: "worksheet", target: "worksheets/" + name });
    override(path, "worksheet");
    const links: XlsxRelationship[] = [];
    let xml = writeSheet(sheet, styles, evaluate, links);
    const notes = writeNotes(sheet);
    if (notes) {
      const commentPath = `comments${index + 1}.xml`;
      const vmlPath = `drawings/vmlDrawing${index + 1}.vml`;
      const drawingId = "rId" + (links.length + 2);
      links.push(
        {
          id: "rId" + (links.length + 1),
          type: "comments",
          target: "../" + commentPath,
        },
        { id: drawingId, type: "vmlDrawing", target: "../" + vmlPath },
      );
      parts["xl/" + commentPath] = notes.comments;
      parts["xl/" + vmlPath] = notes.drawing;
      override("xl/" + commentPath, "comments");
      xml += `<legacyDrawing r:id="${drawingId}"/>`;
    }
    parts[path] = documentXml(xml + "</worksheet>");
    if (links.length)
      parts["xl/worksheets/_rels/" + name + ".rels"] = relationshipXml(links);
    return `<sheet name="${escaped(sheet.name)}" sheetId="${index + 1}" r:id="${id}"${sheet.hidden ? ' state="hidden"' : ""}/>`;
  });
  const definedNames = Object.entries(source.names ?? {}).flatMap(
    ([name, definition]) => {
      const sheet = source.sheets.find(({ id }) => id === definition.sheetId);
      if (
        !sheet ||
        !/^[\p{L}_][\p{L}\p{N}_.]*$/u.test(name) ||
        parseAddress(name)
      )
        return [];
      const range = definition.range.split(":").map((item) => {
        const point = addressWithin(sheet, item);
        return (
          point &&
          cellAddress(point.row, point.column).replace(
            /^([A-Z]+)(\d+)$/,
            (_, column: string, row: string) => "$" + column + "$" + row,
          )
        );
      });
      return range.every(Boolean) && range.length <= 2
        ? [
            `<definedName name="${escaped(name)}">${escaped(sheetReference(sheet.name) + range.join(":"))}</definedName>`,
          ]
        : [];
    },
  );
  const activeTab = Math.max(
    0,
    source.sheets.findIndex(({ hidden }) => !hidden),
  );
  parts["xl/workbook.xml"] = documentXml(
    `<workbook xmlns="${spreadsheetNamespace}" xmlns:r="${officeRelationships}"><bookViews><workbookView activeTab="${activeTab}"/></bookViews><sheets>${sheets.join("")}</sheets>` +
      (definedNames.length
        ? `<definedNames>${definedNames.join("")}</definedNames>`
        : "") +
      `<calcPr calcMode="${source.calculationMode === "manual" ? "manual" : "auto"}" fullCalcOnLoad="1"/></workbook>`,
  );
  parts["xl/styles.xml"] = styles.write();
  relationships.push({
    id: "rId" + (relationships.length + 1),
    type: "styles",
    target: "styles.xml",
  });
  parts["xl/_rels/workbook.xml.rels"] = relationshipXml(relationships);
  parts["_rels/.rels"] = relationshipXml([
    { id: "rId1", type: "officeDocument", target: "xl/workbook.xml" },
  ]);
  overrides.unshift(
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
  );
  override("xl/styles.xml", "styles");
  parts["[Content_Types].xml"] = documentXml(
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="vml" ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/>' +
      overrides.join("") +
      "</Types>",
  );
  return packXlsx(parts);
}
