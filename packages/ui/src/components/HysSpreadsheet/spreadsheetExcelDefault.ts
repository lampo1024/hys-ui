import type { HysSpreadsheetFileFormat, HysSpreadsheetFormulaFunction } from "./spreadsheetTypes";
import { createSpreadsheetExcelFormat } from "./xlsx/spreadsheetExcel";

export function defaultSpreadsheetExcelFormat(options: {
  currency?: string;
  formulaFunctions?: Readonly<Record<string, HysSpreadsheetFormulaFunction>>;
}): HysSpreadsheetFileFormat | undefined {
  return createSpreadsheetExcelFormat(options);
}
