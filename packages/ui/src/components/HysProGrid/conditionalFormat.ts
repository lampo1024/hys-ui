import type {
  HysDataGridCellContext,
  HysDataGridClass,
} from "../HysDataGrid/gridPresentation";

export type HysProGridFormatTone = "info" | "success" | "warning" | "danger";

export interface HysProGridFormatRule<T extends object> {
  columnKey?: string;
  when: (cell: HysDataGridCellContext<T>) => boolean;
  tone?: HysProGridFormatTone;
  className?: string;
}

export function createProGridConditionalFormat<T extends object>(
  rules: readonly HysProGridFormatRule<T>[],
  base?: HysDataGridClass<HysDataGridCellContext<T>>,
): (cell: HysDataGridCellContext<T>) => string | undefined {
  return (cell) => {
    const original = typeof base === "function" ? base(cell) : base;
    const rule = rules.find(
      ({ columnKey, when }) =>
        (columnKey === undefined || columnKey === cell.column.key) &&
        when(cell),
    );
    if (!rule) return original;

    const tone = rule.tone && `hys-ui-pro-grid-format-${rule.tone}`;
    return (
      [original, tone, rule.className].filter(Boolean).join(" ") || undefined
    );
  };
}
