import { shallowRef } from "vue";
import { cellAddress, sheetWidth } from "./spreadsheetModel";
import type {
  HysSpreadsheetVersion,
  HysSpreadsheetWorkbook,
} from "./spreadsheetTypes";

export function useSpreadsheetVersions(
  getWorkbook: () => HysSpreadsheetWorkbook,
  getLimit: () => number,
) {
  const versions = shallowRef<readonly HysSpreadsheetVersion[]>([]);
  let ordinal = 0;
  function record(
    workbook: HysSpreadsheetWorkbook,
    action: HysSpreadsheetVersion["action"],
    author?: string,
  ) {
    const limit = Math.max(0, Math.min(100, Math.floor(getLimit())));
    const next = {
      id: String(++ordinal),
      timestamp: Date.now(),
      action,
      workbook,
      author,
    };
    versions.value = limit ? [...versions.value, next].slice(-limit) : [];
    return next;
  }
  function compareVersions(before: string, after?: string) {
    const first = versions.value.find(({ id }) => id === before)?.workbook;
    const second = after
      ? versions.value.find(({ id }) => id === after)?.workbook
      : getWorkbook();
    if (!first || !second) return [];
    const ids = new Set([
      ...first.sheets.map(({ id }) => id),
      ...second.sheets.map(({ id }) => id),
    ]);
    const changes = [];
    for (const sheetId of ids) {
      const a = first.sheets.find(({ id }) => id === sheetId);
      const b = second.sheets.find(({ id }) => id === sheetId);
      const rows = Math.max(a?.rows.length ?? 0, b?.rows.length ?? 0);
      const columns = Math.max(a ? sheetWidth(a) : 0, b ? sheetWidth(b) : 0);
      for (let row = 0; row < rows; row++)
        for (let column = 0; column < columns; column++) {
          const before = a?.rows[row]?.[column] ?? null;
          const after = b?.rows[row]?.[column] ?? null;
          if (before !== after)
            changes.push({
              sheetId,
              address: cellAddress(row, column),
              before,
              after,
            });
        }
    }
    return changes;
  }
  return { versions, record, compareVersions };
}
