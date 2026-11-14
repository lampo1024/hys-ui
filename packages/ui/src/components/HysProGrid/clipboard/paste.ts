import {
  gridEditChange,
  gridEditRejection,
  parseGridDraft,
} from "../proGridValues";
import type {
  HysProGridCell,
  HysProGridChange,
  HysProGridEditor,
} from "../proGridTypes";
import type { HysDataGridCellView } from "../../HysDataGrid/gridPresentation";
import {
  pasteFailure,
  type ClipboardContext,
  type HysProGridClipboardOptions,
  type HysProGridPasteResult,
} from "./clipboardTypes";
import { readTsv } from "./tsv";

export interface CellBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function pasteDraft<T extends object>(
  text: string,
  editor: HysProGridEditor<T>,
) {
  if (editor.type !== "select") return text;
  const values = editor.options.filter(({ value }) => String(value) === text);
  if (values.length === 1) return values[0].value;
  const labels = editor.options.filter(({ label }) => label === text);
  return labels.length === 1 ? labels[0].value : undefined;
}

function runUntilAbort<T>(signal: AbortSignal, run: () => T | Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    void Promise.resolve()
      .then(() => {
        signal.throwIfAborted();
        return run();
      })
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort));
  });
}

export async function applyClipboardPaste<T extends object>(
  context: ClipboardContext<T>,
  view: HysDataGridCellView<T>,
  bounds: CellBounds,
  text: string,
  maxCells: number,
  options: HysProGridClipboardOptions<T>,
  signal: AbortSignal,
): Promise<HysProGridPasteResult> {
  let source: string[][];
  try {
    source = readTsv(text, maxCells);
  } catch (cause) {
    return (cause as Error).message === "limit"
      ? pasteFailure("limit", "剪贴板内容超过大小限制。")
      : pasteFailure("shape", "剪贴板内容须为规则的制表符表格。");
  }
  const sourceHeight = source.length,
    sourceWidth = source[0].length;
  const height = bounds.bottom - bounds.top + 1,
    width = bounds.right - bounds.left + 1;
  const single = height === 1 && width === 1;
  const rows = single ? sourceHeight : height;
  const columns = single ? sourceWidth : width;
  if (rows * columns > maxCells)
    return pasteFailure("limit", "目标单元格数量超过粘贴限制。");
  if (rows % sourceHeight || columns % sourceWidth)
    return pasteFailure("shape", "选区的行列数须为粘贴内容行列数的整数倍。");
  if (
    bounds.top + rows > view.rowKeys.length ||
    bounds.left + columns > view.columnKeys.length
  )
    return pasteFailure("bounds", "粘贴内容超出当前页的可见单元格范围。");

  const changes: HysProGridChange<T>[] = [];
  const cells: HysProGridCell<T>[] = [];
  const words = context.messages();
  const saveCell = context.getSaveCell();
  const saveBatch = options.saveBatch;
  const current = () =>
    !signal.aborted &&
    context.getView() === view &&
    context.getSaveCell() === saveCell &&
    cells.every(context.canEdit);
  const cancelled = () =>
    pasteFailure("cancelled", "粘贴已取消，表格视图、数据或编辑权限发生变化。");

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const rowKey = view.rowKeys[bounds.top + row];
      const columnKey = view.columnKeys[bounds.left + column];
      const target = view.getCell(rowKey, columnKey);
      const cell = target && context.getCell(target);
      const editor = cell?.column.editor;
      if (!cell || !editor || !context.canEdit(cell))
        return pasteFailure("permission", "目标单元格不可编辑。", {
          rowKey,
          columnKey,
        });
      const value = source[row % sourceHeight][column % sourceWidth];
      try {
        const draft = options.parsePaste
          ? options.parsePaste(value, cell)
          : pasteDraft(value, editor);
        const parsed = parseGridDraft(draft, cell, editor, words);
        if (!parsed.ok)
          return pasteFailure("parse", parsed.message, { rowKey, columnKey });
        cells.push(cell);
        changes.push(gridEditChange(cell, editor, parsed.value));
      } catch {
        return pasteFailure("parse", words.invalidValue, { rowKey, columnKey });
      }
    }
  }

  if (changes.length > 1 && saveCell && !saveBatch)
    return pasteFailure("save", "配置了单格保存时，请提供批量保存回调。");

  for (const [index, cell] of cells.entries()) {
    const validate = cell.column.validate;
    if (!validate) continue;
    if (signal.aborted || context.getView() !== view) return cancelled();
    const change = changes[index];
    try {
      const decision = await runUntilAbort(signal, () =>
        validate(change, { signal }),
      );
      if (
        signal.aborted ||
        context.getView() !== view ||
        !context.canEdit(cell)
      )
        return cancelled();
      const error = gridEditRejection(decision, words.validationFailed);
      if (error) return pasteFailure("validate", error, change);
    } catch {
      return signal.aborted || context.getView() !== view
        ? cancelled()
        : pasteFailure("validate", words.validationFailed, change);
    }
  }

  if (!current()) return cancelled();
  try {
    const decision = await runUntilAbort(signal, () =>
      saveBatch
        ? saveBatch(changes, { signal })
        : saveCell?.(changes[0], { signal }),
    );
    if (!current()) return cancelled();
    const error = gridEditRejection(decision, words.saveFailed);
    if (error)
      return pasteFailure(
        "save",
        error,
        changes.length === 1 ? changes[0] : undefined,
      );
  } catch {
    return current() ? pasteFailure("save", words.saveFailed) : cancelled();
  }
  context.commit(changes);
  return { ok: true, count: changes.length };
}
