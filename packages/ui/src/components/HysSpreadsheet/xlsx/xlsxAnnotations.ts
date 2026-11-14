import type {
  HysSpreadsheetCellOptions,
  HysSpreadsheetSheet,
} from "../spreadsheetTypes";
import { parseAddress } from "../spreadsheetModel";
import { dateToSerial } from "./xlsxDates";
import { documentXml, escaped, spreadsheetNamespace, xmlText } from "./xlsxXml";

function validationXml(address: string, options: HysSpreadsheetCellOptions) {
  const validation = options.validation;
  const choices =
    options.type === "select" ? options.options : validation?.options;
  let type: string | undefined;
  let min: number | undefined, max: number | undefined;
  let first: string | undefined;
  if (
    choices?.length &&
    choices.every(
      (value) => typeof value === "string" && !/[,"\r\n]/.test(value),
    )
  ) {
    const list = choices.join(",");
    if (list.length <= 253) {
      type = "list";
      first = '"' + list + '"';
    }
  } else if (validation?.type === "date" || options.type === "date") {
    type = "date";
    if (typeof validation?.min === "string")
      min = dateToSerial(validation.min, "date");
    if (typeof validation?.max === "string")
      max = dateToSerial(validation.max, "date");
  } else if (
    validation?.minLength !== undefined ||
    validation?.maxLength !== undefined
  ) {
    type = "textLength";
    min = validation.minLength;
    max = validation.maxLength;
  } else if (
    typeof validation?.min === "number" ||
    typeof validation?.max === "number"
  ) {
    type = "decimal";
    min = typeof validation.min === "number" ? validation.min : undefined;
    max = typeof validation.max === "number" ? validation.max : undefined;
  }
  if (!type || (first === undefined && min === undefined && max === undefined))
    return "";
  const operator =
    first !== undefined
      ? ""
      : ' operator="' +
        (min === undefined
          ? "lessThanOrEqual"
          : max === undefined
            ? "greaterThanOrEqual"
            : "between") +
        '"';
  const error = validation?.message
    ? ' error="' + escaped(validation.message.slice(0, 225)) + '"'
    : "";
  const prompt = validation?.prompt
    ? ' showInputMessage="1" prompt="' +
      escaped(validation.prompt.slice(0, 255)) +
      '"'
    : "";
  return (
    '<dataValidation type="' +
    type +
    '"' +
    operator +
    ' allowBlank="' +
    (validation?.required ? 0 : 1) +
    '" showErrorMessage="1"' +
    error +
    prompt +
    ' sqref="' +
    address +
    '">' +
    "<formula1>" +
    escaped(first ?? min ?? max!) +
    "</formula1>" +
    (min !== undefined && max !== undefined
      ? "<formula2>" + max + "</formula2>"
      : "") +
    "</dataValidation>"
  );
}

export function writeValidations(sheet: HysSpreadsheetSheet) {
  const validations = Object.entries(sheet.cells ?? {}).flatMap(
    ([address, options]) => {
      if (!parseAddress(address)) return [];
      const value = validationXml(address, options);
      return value ? [value] : [];
    },
  );
  return validations.length
    ? '<dataValidations count="' +
        validations.length +
        '">' +
        validations.join("") +
        "</dataValidations>"
    : "";
}

export function writeNotes(sheet: HysSpreadsheetSheet) {
  const notes = Object.entries(sheet.cells ?? {}).flatMap(
    ([address, options]) => {
      const point = parseAddress(address);
      const text = [
        options.note,
        ...(options.comments?.map(
          (comment) => comment.author + ": " + comment.text,
        ) ?? []),
      ]
        .filter(Boolean)
        .join("\n");
      return point && text ? [{ address, point, text }] : [];
    },
  );
  if (!notes.length) return;
  return {
    comments: documentXml(
      '<comments xmlns="' +
        spreadsheetNamespace +
        '"><authors><author>HysSpreadsheet</author></authors><commentList>' +
        notes
          .map(
            ({ address, text }) =>
              '<comment ref="' +
              address +
              '" authorId="0"><text><t xml:space="preserve">' +
              xmlText(text) +
              "</t></text></comment>",
          )
          .join("") +
        "</commentList></comments>",
    ),
    drawing:
      '<xml xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">' +
      '<o:shapelayout v:ext="edit"><o:idmap v:ext="edit" data="1"/></o:shapelayout>' +
      '<v:shapetype id="_x0000_t202" coordsize="21600,21600" o:spt="202" path="m,l,21600r21600,l21600,xe"><v:stroke joinstyle="miter"/><v:path gradientshapeok="t" o:connecttype="rect"/></v:shapetype>' +
      notes
        .map(
          ({ point }, index) =>
            '<v:shape id="_x0000_s' +
            (1025 + index) +
            '" type="#_x0000_t202" style="position:absolute;width:144pt;height:79pt;z-index:1;visibility:hidden" fillcolor="#ffffe1" o:insetmode="auto">' +
            '<v:shadow on="t" color="black" obscured="t"/><v:path o:connecttype="none"/><v:textbox style="mso-direction-alt:auto"/>' +
            '<x:ClientData ObjectType="Note"><x:MoveWithCells/><x:SizeWithCells/><x:AutoFill>False</x:AutoFill><x:Row>' +
            point.row +
            "</x:Row><x:Column>" +
            point.column +
            "</x:Column></x:ClientData></v:shape>",
        )
        .join("") +
      "</xml>",
  };
}
