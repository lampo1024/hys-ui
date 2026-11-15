import type { HysSpreadsheetFileFormat, HysSpreadsheetFormulaFunction } from "../spreadsheetTypes";

export function createSpreadsheetExcelFormat(options: {
  currency?: string;
  formulaFunctions?: Readonly<Record<string, HysSpreadsheetFormulaFunction>>;
} = {}): HysSpreadsheetFileFormat {
  return {
    label: "Excel (.xlsx)",
    extension: "xlsx",
    async decode(file) {
      const { maxXlsxBytes } = await import("./xlsxXml");
      if (file.size > maxXlsxBytes)
        throw new Error("Excel 文件不能超过 32 MiB。");
      const { decodeXlsx } = await import("./xlsxRead");
      return decodeXlsx(
        await file.arrayBuffer(),
        file.name.replace(/\.xlsx$/i, ""),
      );
    },
    async encode(workbook) {
      const [{ encodeXlsx }, { workbookMime }] = await Promise.all([
        import("./xlsxWrite"),
        import("./xlsxXml"),
      ]);
      const bytes = encodeXlsx(workbook, options);
      return new Blob([Uint8Array.from(bytes)], { type: workbookMime });
    },
  };
}
