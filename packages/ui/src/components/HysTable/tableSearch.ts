import { tableValue, type HysTableColumn } from "../../composables/table";

function normalize(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

export function tableSearchPredicate<T extends object>(
  search: string,
  columns: readonly HysTableColumn<T>[],
  keys?: readonly string[],
  filter?: (search: string, row: T) => boolean,
) {
  const term = search.trim();
  if (!term) return undefined;
  if (filter) return (row: T) => filter(term, row);
  const words = normalize(term).split(/\s+/).filter(Boolean);
  if (!words.length) return undefined;
  const allowed = keys ? new Set(keys) : undefined;
  const fields = columns
    .filter(
      (column) =>
        (!column.type || column.type === "default") &&
        (!allowed || allowed.has(column.key)),
    )
    .map((column) => column.dataIndex ?? column.key);
  return (row: T) => {
    const values = fields.map((field) => {
      const value = tableValue(row, field);
      return value instanceof Date ||
        ["string", "number", "bigint", "boolean"].includes(typeof value)
        ? normalize(String(value))
        : "";
    });
    return words.every((word) => values.some((value) => value.includes(word)));
  };
}
