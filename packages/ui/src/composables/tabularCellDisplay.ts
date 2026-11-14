import type { CSSProperties } from "vue";

export function tabularEmptyValue(value: unknown) {
  return value == null || value === "";
}

export function tabularDisplayText(
  value: unknown,
  empty: string | undefined,
  format?: () => unknown,
) {
  if (empty !== undefined && tabularEmptyValue(value)) return empty;
  const result = format?.();
  return String((result === undefined ? value : result) ?? "");
}

export function tabularCellWrap(wrap: boolean | number | undefined) {
  if (wrap === true) return { class: "hys-ui-cell-wrap" };
  if (typeof wrap === "number" && Number.isFinite(wrap) && wrap >= 1) {
    const lines = Math.floor(wrap);
    return {
      class: "hys-ui-cell-wrap hys-ui-cell-clamp",
      style: { WebkitLineClamp: lines } satisfies CSSProperties,
    };
  }
  return {};
}
