import type {
  HysSpreadsheetFileFormat,
  HysSpreadsheetFormulaFunction,
  HysSpreadsheetWorkbook,
} from "./spreadsheetTypes";

export function spreadsheetFiles(
  formats: readonly HysSpreadsheetFileFormat[] = [],
  options: {
    currency?: string;
    formulaFunctions?: Readonly<Record<string, HysSpreadsheetFormulaFunction>>;
  } = {},
) {
  const available = new Map<string, HysSpreadsheetFileFormat>([
    [
      "json",
      {
        label: "JSON",
        extension: "json",
        decode: async (file) => JSON.parse(await file.text()),
        encode: (workbook) =>
          new Blob([JSON.stringify(workbook, null, 2)], {
            type: "application/json",
          }),
      },
    ],
    [
      "xlsx",
      {
        label: "Excel (.xlsx)",
        extension: "xlsx",
        async decode(file) {
          const { maxXlsxBytes } = await import("./xlsx/xlsxXml");
          if (file.size > maxXlsxBytes)
            throw new Error("Excel 文件不能超过 32 MiB。");
          const { decodeXlsx } = await import("./xlsx/xlsxRead");
          return decodeXlsx(
            await file.arrayBuffer(),
            file.name.replace(/\.xlsx$/i, ""),
          );
        },
        async encode(workbook) {
          const [{ encodeXlsx }, { workbookMime }] = await Promise.all([
            import("./xlsx/xlsxWrite"),
            import("./xlsx/xlsxXml"),
          ]);
          const bytes = encodeXlsx(workbook, options);
          return new Blob([Uint8Array.from(bytes)], { type: workbookMime });
        },
      },
    ],
  ]);
  for (const format of formats) {
    const extension = fileExtension(format.extension);
    if (/^[a-z\d]+$/.test(extension))
      available.set(extension, {
        ...available.get(extension),
        ...format,
        extension,
      });
  }
  return available;
}

export function fileExtension(extension: string) {
  return extension.replace(/^\./, "").toLowerCase();
}

export function saveFile(
  blob: Blob,
  workbook: HysSpreadsheetWorkbook,
  extension: string,
) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${workbook.name?.replace(/[\\/:*?"<>|]/g, "_") || "工作簿"}.${extension}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
