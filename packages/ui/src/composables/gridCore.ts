type GridKey = string | number;

export function isGridKey(value: unknown): value is GridKey {
  return (
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

export function gridKeyToken(key: GridKey) {
  return typeof key + ":" + key;
}

export function gridPageCount(total: number, size: number) {
  return Math.max(1, Math.ceil(total / size));
}
