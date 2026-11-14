import { useSpreadsheetMessages } from "./spreadsheetMessages";

export const columnFilterOptions = [
  ["contains", "包含"],
  ["eq", "等于"],
  ["gt", "大于"],
  ["gte", "大于等于"],
  ["lt", "小于"],
  ["lte", "小于等于"],
  ["color", "背景色"],
] as const;

export function useSpreadsheetOptions() {
  const message = useSpreadsheetMessages();
  return (entries: readonly (readonly [string, string])[]) =>
    entries.map(([value, label]) => ({ value, label: message(label) }));
}
