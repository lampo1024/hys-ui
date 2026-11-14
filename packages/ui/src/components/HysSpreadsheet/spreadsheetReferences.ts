import { cellAddress, parseAddress } from "./spreadsheetModel";

const reference =
  /(?<![\w.$])(?:(?<sheet>'(?:[^']|'')+'|[\p{L}_][\p{L}\p{N}_.]*)!)?(?<first>\$?[A-Z]{1,3}\$?[1-9]\d{0,5})(?:\s*:\s*(?<last>\$?[A-Z]{1,3}\$?[1-9]\d{0,5}))?(?![\w$.(])/giu;
const formulaPart = new RegExp(
  `"(?:""|[^"])*"|${reference.source}`,
  reference.flags,
);

export function sheetReference(name: string) {
  return `'${name.replaceAll("'", "''")}'!`;
}

export function sheetName(token: string) {
  return token.startsWith("'")
    ? token.slice(1, -1).replaceAll("''", "'")
    : token;
}

export function rewriteReferences(
  formula: string,
  rewrite: (first: string, last: string | undefined, qualifier: string | undefined, offset: number, length: number) => string,
) {
  return formula.replace(formulaPart, (...args) => {
    const { first, last, sheet } = args.at(-1);
    const match: string = args[0];
    return first ? rewrite(first, last, sheet, args.at(-3), match.length) : match;
  });
}

export function offsetFormula(
  value: string,
  rowOffset: number,
  columnOffset: number,
) {
  function translate(address: string) {
    const point = parseAddress(address)!;
    const columnFixed = address.startsWith("$");
    const rowFixed = /\$\d/.test(address);
    const row = point.row + (rowFixed ? 0 : rowOffset);
    const column = point.column + (columnFixed ? 0 : columnOffset);
    if (row < 0 || column < 0) return "#REF!";
    return cellAddress(row, column).replace(
      /^([A-Z]+)(\d+)$/,
      (_, label: string, ordinal: string) =>
        (columnFixed ? "$" : "") + label + (rowFixed ? "$" : "") + ordinal,
    );
  }
  return rewriteReferences(value, (first, last, qualifier) => {
    const start = translate(first);
    const end = last && translate(last);
    if (start === "#REF!" || end === "#REF!") return "#REF!";
    return `${qualifier ? qualifier + "!" : ""}${start}${end ? ":" + end : ""}`;
  });
}
