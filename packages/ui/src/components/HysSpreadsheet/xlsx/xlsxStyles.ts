import type { HysSpreadsheetCellFormat as Format } from "../spreadsheetTypes";
import {
  child,
  children,
  documentXml,
  escaped,
  spreadsheetNamespace,
  truth,
  type XmlNode,
} from "./xlsxXml";

const builtin: Record<number, string> = {
  1: "0",
  2: "0.00",
  3: "#,##0",
  4: "#,##0.00",
  5: "$#,##0",
  6: "$#,##0",
  7: "$#,##0.00",
  8: "$#,##0.00",
  9: "0%",
  10: "0.00%",
  11: "0.00E+00",
  12: "# ?/?",
  13: "# ??/??",
  14: "mm-dd-yy",
  15: "d-mmm-yy",
  16: "d-mmm",
  17: "mmm-yy",
  18: "h:mm AM/PM",
  19: "h:mm:ss AM/PM",
  20: "h:mm",
  21: "h:mm:ss",
  22: "m/d/yy h:mm",
  37: "#,##0",
  38: "#,##0",
  39: "#,##0.00",
  40: "#,##0.00",
  45: "mm:ss",
  46: "[h]:mm:ss",
  47: "mm:ss.0",
  48: "##0.0E+0",
  49: "@",
};
for (const id of [27, 28, 29, 30, 31, 34, 35, 36, 50, 51, 52, 53, 54, 57, 58])
  builtin[id] = "yyyy-mm-dd";
for (const id of [32, 33, 55, 56]) builtin[id] = "h:mm:ss";

function color(node?: XmlNode) {
  const value = node?.attributes.rgb;
  if (value && /^[\da-f]{6}([\da-f]{2})?$/i.test(value))
    return "#" + value.slice(-6).toLowerCase();
  const index = node?.attributes.indexed;
  if (index !== undefined)
    return [
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ][Number(index) % 8];
}

export function xlsxColor(value?: string) {
  const hex = value?.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  return hex
    ? "FF" +
        (hex.length === 3
          ? [...hex].map((digit) => digit + digit).join("")
          : hex
        ).toUpperCase()
    : undefined;
}

function yes(node?: XmlNode) {
  return node
    ? !["0", "false", "none"].includes(node.attributes.val)
    : undefined;
}
export function dateKind(code: string) {
  const tokens = code.replace(/"[^"]*"|\\.|[_*].|\[(?![hms]+\])[^\]]*\]/gi, "");
  const date =
    /[dy]/i.test(tokens) || (/m/i.test(tokens) && !/[hs]/i.test(tokens));
  const time = /[hs]/i.test(tokens);
  return date ? (time ? "datetime-local" : "date") : time ? "time" : undefined;
}

function numberFormat(code?: string): Format {
  if (!code || code === "General") return {};
  const kind = dateKind(code);
  const native = { excelFormat: code };
  if (kind) return { ...native, number: kind === "time" ? "time" : "date" };
  const pattern = code.split(";")[0];
  const precision = /\.([0#?]+)/.exec(pattern)?.[1].length ?? 0;
  const thousands = /[#0],(?=[#0])/.test(pattern);
  if (pattern.includes("%"))
    return { ...native, number: "percent", precision, thousands };
  if (/E[+-]/i.test(pattern))
    return { ...native, number: "scientific", precision };
  const codeCurrency = /\[\$([A-Z]{3})(?:-[^\]]+)?\]/.exec(pattern)?.[1];
  const symbol = /[$¥￥€£]/.exec(
    pattern.replace(/\[\$([^\]-]+)(?:-[^\]]+)?\]/g, "$1"),
  )?.[0];
  if (codeCurrency)
    return {
      ...native,
      number: "currency",
      precision,
      thousands,
      currency: codeCurrency,
    };
  if (symbol) {
    const currency =
      symbol === "$"
        ? "USD"
        : symbol === "€"
          ? "EUR"
          : symbol === "£"
            ? "GBP"
            : "CNY";
    return { ...native, number: "currency", precision, thousands, currency };
  }
  return /[0#]/.test(pattern)
    ? { ...native, number: "number", precision, thousands }
    : native;
}

export type ImportedStyle = {
  format?: Format;
  locked: boolean;
  date?: ReturnType<typeof dateKind>;
};

export function readStyles(root?: XmlNode): ImportedStyle[] {
  const fonts = children(child(root, "fonts"), "font");
  const fills = children(child(root, "fills"), "fill");
  const borders = children(child(root, "borders"), "border");
  const numFormats = new Map(
    children(child(root, "numFmts"), "numFmt").map((item) => [
      Number(item.attributes.numFmtId),
      item.attributes.formatCode,
    ]),
  );
  return children(child(root, "cellXfs"), "xf").map((item) => {
    const { fontId, fillId, borderId, numFmtId } = item.attributes;
    const format: Format = numberFormat(
      numFormats.get(Number(numFmtId)) ?? builtin[Number(numFmtId)],
    );
    if (Number(fontId) > 0) {
      const font = fonts[Number(fontId)];
      const size = Number(child(font, "sz")?.attributes.val);
      format.fontFamily = child(font, "name")?.attributes.val;
      if (Number.isFinite(size))
        format.fontSize = Math.round(((size * 4) / 3) * 100) / 100;
      format.bold = yes(child(font, "b"));
      format.italic = yes(child(font, "i"));
      format.underline = yes(child(font, "u"));
      format.strike = yes(child(font, "strike"));
      format.color = color(child(font, "color"));
    }
    const fill = child(fills[Number(fillId)], "patternFill");
    if (fill?.attributes.patternType === "solid")
      format.backgroundColor = color(child(fill, "fgColor"));
    const border = borders[Number(borderId)]?.children.find(
      (edge) => !!edge.attributes.style,
    );
    if (border) {
      const style = border.attributes.style;
      format.borderStyle =
        style === "double"
          ? "double"
          : /dash/i.test(style)
            ? "dashed"
            : style === "dotted"
              ? "dotted"
              : "solid";
      format.borderColor = color(child(border, "color"));
    }
    const alignment = child(item, "alignment")?.attributes;
    if (alignment) {
      const { horizontal, vertical, indent, textRotation } = alignment;
      if (
        horizontal === "left" ||
        horizontal === "center" ||
        horizontal === "right"
      )
        format.align = horizontal;
      if (vertical === "top" || vertical === "bottom" || vertical === "center")
        format.verticalAlign = vertical === "center" ? "middle" : vertical;
      if (truth(alignment.wrapText)) format.overflow = "wrap";
      if (Number(indent) > 0) format.indent = Number(indent) * 12;
      const rotation = Number(textRotation);
      if (rotation > 0 && rotation <= 180)
        format.rotation = rotation <= 90 ? rotation : 90 - rotation;
    }
    const entries = Object.entries(format).filter(
      ([, value]) => value !== undefined,
    );
    return {
      format: entries.length ? Object.fromEntries(entries) : undefined,
      locked:
        child(item, "protection")?.attributes.locked !== "0" &&
        child(item, "protection")?.attributes.locked !== "false",
      date: format.excelFormat ? dateKind(format.excelFormat) : undefined,
    };
  });
}

function exportFormat(format?: Format, currency = "CNY") {
  if (format?.excelFormat) return format.excelFormat;
  const kind = format?.number;
  if (!kind || kind === "general") return;
  const precision = Math.max(
    0,
    Math.min(20, Math.floor(format.precision ?? (kind === "percent" ? 0 : 2))),
  );
  const decimal = precision ? "." + "0".repeat(precision) : "";
  const digits =
    (format.thousands === false || kind === "percent" ? "0" : "#,##0") +
    decimal;
  if (kind === "date") return "yyyy-mm-dd";
  if (kind === "time") return "hh:mm:ss";
  if (kind === "scientific") return "0" + decimal + "E+00";
  if (kind === "percent") return digits + "%";
  if (kind === "currency")
    return (
      "[$" +
      (format.currency ?? currency).replace(/[^A-Z]/g, "") +
      "] " +
      digits
    );
  if (kind === "custom" && format.pattern)
    return format.pattern
      .split("{value}")
      .map((part) => (part ? '"' + part.replaceAll('"', '""') + '"' : ""))
      .join(digits);
  return digits;
}

export function makeStyles(currency?: string) {
  const fonts = ['<font><sz val="11"/><name val="Calibri"/></font>'];
  const fills = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
  ];
  const borders = [
    "<border><left/><right/><top/><bottom/><diagonal/></border>",
  ];
  const xfs = [
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
  ];
  const numFormats: string[] = [];
  const indices = new Map<string, number>();
  const unique = (list: string[], value: string) => {
    const existing = list.indexOf(value);
    return existing === -1 ? list.push(value) - 1 : existing;
  };
  const item = (name: string, value?: string | number) =>
    value === undefined ? "" : `<${name} val="${escaped(value)}"/>`;
  function id(format?: Format, locked?: boolean) {
    if (!format && locked !== false) return 0;
    const key = JSON.stringify([format, locked]);
    const existing = indices.get(key);
    if (existing !== undefined) return existing;
    const fontColor = xlsxColor(format?.color);
    const fontContent =
      (format?.bold ? "<b/>" : "") +
      (format?.italic ? "<i/>" : "") +
      (format?.underline ? "<u/>" : "") +
      (format?.strike ? "<strike/>" : "") +
      (fontColor ? `<color rgb="${fontColor}"/>` : "") +
      item("sz", format?.fontSize ? (format.fontSize * 3) / 4 : undefined) +
      item("name", format?.fontFamily);
    const fontId = fontContent
      ? unique(fonts, `<font>${fontContent}</font>`)
      : 0;
    const fill = xlsxColor(format?.backgroundColor);
    const fillId = fill
      ? unique(
          fills,
          `<fill><patternFill patternType="solid"><fgColor rgb="${fill}"/><bgColor indexed="64"/></patternFill></fill>`,
        )
      : 0;
    const borderColor = xlsxColor(format?.borderColor);
    const border =
      format?.borderStyle === "solid" ? "thin" : format?.borderStyle;
    const borderId = border
      ? unique(
          borders,
          "<border>" +
            ["left", "right", "top", "bottom"]
              .map(
                (edge) =>
                  `<${edge} style="${border}">${borderColor ? `<color rgb="${borderColor}"/>` : ""}</${edge}>`,
              )
              .join("") +
            "<diagonal/></border>",
        )
      : 0;
    const code = exportFormat(format, currency);
    const numFmtId = code ? 164 + unique(numFormats, code) : 0;
    const align = format?.align,
      vertical = format?.verticalAlign,
      wrap = format?.overflow === "wrap";
    const indent = Math.max(
      0,
      Math.min(250, Math.round((format?.indent ?? 0) / 12)),
    );
    const rotation = Math.max(
      -90,
      Math.min(90, Math.round(format?.rotation ?? 0)),
    );
    const alignment =
      align || vertical || wrap || rotation || indent
        ? "<alignment" +
          (align ? ` horizontal="${align}"` : "") +
          (vertical
            ? ` vertical="${vertical === "middle" ? "center" : vertical}"`
            : "") +
          (wrap ? ' wrapText="1"' : "") +
          (rotation
            ? ` textRotation="${rotation < 0 ? 90 - rotation : rotation}"`
            : "") +
          (indent ? ` indent="${indent}"` : "") +
          "/>"
        : "";
    const protection = locked === false ? '<protection locked="0"/>' : "";
    const xf =
      `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0"` +
      (numFmtId ? ' applyNumberFormat="1"' : "") +
      (fontId ? ' applyFont="1"' : "") +
      (fillId ? ' applyFill="1"' : "") +
      (borderId ? ' applyBorder="1"' : "") +
      (alignment ? ' applyAlignment="1"' : "") +
      (protection ? ' applyProtection="1"' : "") +
      `>${alignment}${protection}</xf>`;
    const index = unique(xfs, xf);
    indices.set(key, index);
    return index;
  }
  function write() {
    const list = (name: string, values: string[]) =>
      `<${name} count="${values.length}">${values.join("")}</${name}>`;
    const codes = numFormats.map(
      (code, index) =>
        `<numFmt numFmtId="${164 + index}" formatCode="${escaped(code)}"/>`,
    );
    return documentXml(
      `<styleSheet xmlns="${spreadsheetNamespace}">${codes.length ? list("numFmts", codes) : ""}${list("fonts", fonts)}${list("fills", fills)}${list("borders", borders)}` +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        list("cellXfs", xfs) +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    );
  }
  return { id, write };
}
