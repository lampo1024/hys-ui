import type {
  HysProGridAddress,
  HysProGridBatchSave,
  HysProGridCell,
  HysProGridClipboardBinding,
} from "../proGridTypes";

export interface HysProGridRange {
  anchor: HysProGridAddress;
  focus: HysProGridAddress;
}

export type HysProGridPasteFailure = {
  ok: false;
  reason:
    | "unavailable"
    | "limit"
    | "shape"
    | "bounds"
    | "permission"
    | "parse"
    | "validate"
    | "save"
    | "cancelled";
  message: string;
  cell?: HysProGridAddress;
};

export type HysProGridPasteResult =
  HysProGridPasteFailure | { ok: true; count: number };

export interface HysProGridClipboardOptions<T extends object> {
  maxCells?: number;
  maxSelectionCells?: number;
  additionalRanges?: () => readonly HysProGridRange[];
  saveBatch?: HysProGridBatchSave<T>;
  formatCopy?: (cell: HysProGridCell<T>) => string;
  parsePaste?: (text: string, cell: HysProGridCell<T>) => unknown;
  onSelectionChange?: (range: HysProGridRange | null) => void;
  onPaste?: (result: HysProGridPasteResult) => void;
}

export interface HysProGridClipboard<
  T extends object,
> extends HysProGridClipboardBinding<T> {
  selectRange(anchor: HysProGridAddress, focus?: HysProGridAddress): boolean;
  clearSelection(): void;
  copyText(): string | undefined;
  pasteText(text: string): Promise<HysProGridPasteResult>;
}

export type ClipboardContext<T extends object> = Parameters<
  HysProGridClipboardBinding<T>["attach"]
>[0];

export function pasteFailure(
  reason: HysProGridPasteFailure["reason"],
  message: string,
  cell?: HysProGridAddress,
): HysProGridPasteFailure {
  return {
    ok: false,
    reason,
    message,
    ...(cell
      ? { cell: { rowKey: cell.rowKey, columnKey: cell.columnKey } }
      : {}),
  };
}
