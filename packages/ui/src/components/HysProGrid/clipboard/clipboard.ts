import { watch } from "vue";
import { gridKeyToken } from "../../../composables/gridCore";
import { tabularCellControls } from "../../../composables/useTabularCellNavigation";
import type { HysProGridAddress } from "../proGridTypes";
import {
  pasteFailure,
  type ClipboardContext,
  type HysProGridClipboard,
  type HysProGridClipboardOptions,
  type HysProGridPasteResult,
  type HysProGridRange,
} from "./clipboardTypes";
import { applyClipboardPaste, type CellBounds } from "./paste";
import { maxClipboardCharacters, writeTsv } from "./tsv";

export type {
  HysProGridClipboard,
  HysProGridClipboardOptions,
  HysProGridPasteFailure,
  HysProGridPasteResult,
  HysProGridRange,
} from "./clipboardTypes";

const cellSelector = "td[data-hys-cell-index][data-column-key]";
const mark = "data-hys-pro-grid-range";
const edgesMark = "data-hys-pro-grid-range-edges";
const same = (first: HysProGridAddress, second: HysProGridAddress) =>
  first.rowKey === second.rowKey && first.columnKey === second.columnKey;
const editableTarget = `${tabularCellControls},[contenteditable='plaintext-only']`;

function bindClipboard<T extends object>(
  context: ClipboardContext<T>,
  options: HysProGridClipboardOptions<T>,
) {
  const { root } = context;
  const document = root.ownerDocument;
  const maxCells = Number.isFinite(options.maxCells)
    ? Math.max(1, Math.min(10000, Math.floor(options.maxCells!)))
    : 10000;
  const maxSelectionCells = options.maxSelectionCells ?? maxCells;
  const table = () =>
    root.querySelector<HTMLTableElement>(
      ":scope > .hys-ui-pf-grid > .hys-ui-pf-grid-scroll > table",
    );
  let range: HysProGridRange | null = null;
  let painted: HTMLElement[] = [];
  let task: AbortController | undefined;
  let alive = true;
  let pointer:
    | {
        id: number;
        x: number;
        y: number;
        anchor: HysProGridAddress;
        dragged: boolean;
      }
    | undefined;

  function position(address: HysProGridAddress, view = context.getView()) {
    return [
      view?.rowKeys.indexOf(address.rowKey) ?? -1,
      view?.columnKeys.indexOf(address.columnKey) ?? -1,
    ] as const;
  }

  function bounds(selection: HysProGridRange): CellBounds | undefined {
    const [ar, ac] = position(selection.anchor);
    const [fr, fc] = position(selection.focus);
    if (Math.min(ar, ac, fr, fc) < 0) return;
    return {
      top: Math.min(ar, fr),
      bottom: Math.max(ar, fr),
      left: Math.min(ac, fc),
      right: Math.max(ac, fc),
    };
  }

  function unpaint() {
    for (const cell of painted) {
      cell.removeAttribute(mark);
      cell.removeAttribute(edgesMark);
    }
    painted = [];
  }

  function selectRange(anchor: HysProGridAddress, focus = anchor) {
    const view = context.getView();
    const next = { anchor: { ...anchor }, focus: { ...focus } };
    const area = bounds(next);
    if (
      !view ||
      !area ||
      (area.bottom - area.top + 1) * (area.right - area.left + 1) >
        maxSelectionCells
    )
      return false;
    const unchanged =
      range && same(range.anchor, anchor) && same(range.focus, focus);
    range = next;
    paint(view, area);
    if (!unchanged)
      options.onSelectionChange?.({
        anchor: { ...anchor },
        focus: { ...focus },
      });
    return true;
  }

  function paint(
    view: NonNullable<ReturnType<typeof context.getView>>,
    area: CellBounds,
  ) {
    unpaint();
    const extra =
      options.additionalRanges?.().flatMap((selection) => {
        const area = bounds(selection);
        return area ? [area] : [];
      }) ?? [];
    const rows = new Map(
      view.rowKeys.map((key, index) => [gridKeyToken(key), index]),
    );
    const columns = new Map(view.columnKeys.map((key, index) => [key, index]));
    const body = table()?.tBodies[0];
    for (const row of Array.from(body?.rows ?? [])) {
      const rowIndex = rows.get(row.dataset.gridRow ?? "");
      if (rowIndex === undefined) continue;
      for (const cell of Array.from(row.cells)) {
        if (!cell.matches(cellSelector)) continue;
        const columnIndex = columns.get(cell.dataset.columnKey!);
        if (columnIndex === undefined) continue;
        const bottom = rowIndex + cell.rowSpan - 1,
          right = columnIndex + cell.colSpan - 1;
        const intersects = (area: CellBounds) =>
          rowIndex <= area.bottom &&
          columnIndex <= area.right &&
          bottom >= area.top &&
          right >= area.left;
        const target = intersects(area) ? area : extra.find(intersects);
        if (!target) continue;
        const edges = [
          rowIndex <= target.top && "top",
          bottom >= target.bottom && "bottom",
          columnIndex <= target.left && "start",
          right >= target.right && "end",
        ]
          .filter(Boolean)
          .join(" ");
        cell.setAttribute(
          mark,
          target.top === target.bottom && target.left === target.right
            ? "single"
            : "multiple",
        );
        if (edges) cell.setAttribute(edgesMark, edges);
        painted.push(cell);
      }
    }
  }

  const Observer = document.defaultView?.MutationObserver;
  const observer =
    Observer &&
    new Observer(() => {
      const view = context.getView();
      const area = range && bounds(range);
      if (view && area) paint(view, area);
    });
  observer?.observe(root, { childList: true, subtree: true });
  const stopAdditional =
    options.additionalRanges &&
    watch(options.additionalRanges, () => {
      const view = context.getView();
      const area = range && bounds(range);
      if (view && area) paint(view, area);
    });

  function clearSelection() {
    if (!range) return;
    range = null;
    unpaint();
    options.onSelectionChange?.(null);
  }

  function address(
    target: EventTarget | null,
    allowControls = false,
  ): HysProGridAddress | undefined {
    const element = target as Element | null;
    if (
      !element?.closest ||
      (!allowControls && element.closest(editableTarget))
    )
      return;
    const cell = element.closest<HTMLTableCellElement>(cellSelector);
    if (!cell || cell.closest("table") !== table()) return;
    const token = cell.parentElement?.dataset.gridRow;
    const view = context.getView();
    const rowKey = view?.rowKeys.find((key) => gridKeyToken(key) === token);
    return rowKey === undefined
      ? undefined
      : { rowKey, columnKey: cell.dataset.columnKey! };
  }

  function copyText(fallback?: HysProGridAddress) {
    const view = context.getView();
    const selection =
      range ?? (fallback && { anchor: fallback, focus: fallback });
    const area = selection && bounds(selection);
    if (!view || !area) return;
    if ((area.bottom - area.top + 1) * (area.right - area.left + 1) > maxCells)
      return;
    const rows: string[][] = [];
    let size = 0;
    for (let row = area.top; row <= area.bottom; row++) {
      const line: string[] = [];
      for (let column = area.left; column <= area.right; column++) {
        const data = view.getCell(view.rowKeys[row], view.columnKeys[column]);
        const cell = data && context.getCell(data);
        if (!cell) return;
        const text = options.formatCopy?.(cell) ?? String(cell.value ?? "");
        size += text.length;
        if (size > maxClipboardCharacters) return;
        line.push(text);
      }
      rows.push(line);
    }
    const text = writeTsv(rows);
    return text.length <= maxClipboardCharacters ? text : undefined;
  }

  async function pasteText(text: string, fallback?: HysProGridAddress) {
    const view = context.getView();
    const selection =
      range ?? (fallback && { anchor: fallback, focus: fallback });
    const area = selection && bounds(selection);
    const request = view && area ? context.reserve() : undefined;
    let result: HysProGridPasteResult;
    if (!request || !view || !area) {
      result = pasteFailure(
        "unavailable",
        "请先选择可见单元格并结束当前编辑，再进行粘贴。",
      );
    } else {
      task = request;
      try {
        result = await applyClipboardPaste(
          context,
          view,
          area,
          text,
          maxCells,
          options,
          request.signal,
        );
      } catch {
        result = pasteFailure(
          "unavailable",
          "无法处理粘贴，请检查表格配置后重试。",
        );
      } finally {
        context.release(request);
        if (task === request) task = undefined;
      }
    }
    if (alive) options.onPaste?.(result);
    return result;
  }

  function onCopy(event: ClipboardEvent) {
    const cell = address(event.target);
    if (!cell || event.defaultPrevented || !event.clipboardData) return;
    const text = copyText(cell);
    if (text === undefined) return;
    event.clipboardData.setData("text/plain", text);
    event.preventDefault();
  }

  function onPaste(event: ClipboardEvent) {
    const cell = address(event.target);
    if (
      !cell ||
      event.defaultPrevented ||
      !event.clipboardData?.types.includes("text/plain")
    )
      return;
    event.preventDefault();
    void pasteText(event.clipboardData.getData("text/plain"), cell);
  }

  function onKey(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.metaKey ||
      event.ctrlKey
    )
      return;
    const cell = address(event.target);
    if (!cell) return;
    if (event.key === "Escape" && (range || task)) {
      event.preventDefault();
      task?.abort();
      clearSelection();
      return;
    }
    if (
      !event.shiftKey ||
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    const view = context.getView();
    if (!view) return;
    const [row, col] = position(range?.focus ?? cell, view);
    const rtl =
      root.ownerDocument.defaultView?.getComputedStyle(event.target as Element)
        .direction === "rtl";
    const nextRow =
      row + Number(event.key === "ArrowDown") - Number(event.key === "ArrowUp");
    const nextCol =
      col +
      (rtl ? -1 : 1) *
        (Number(event.key === "ArrowRight") -
          Number(event.key === "ArrowLeft"));
    const rowKey = view.rowKeys[nextRow],
      columnKey = view.columnKeys[nextCol];
    event.preventDefault();
    if (
      rowKey !== undefined &&
      columnKey !== undefined &&
      selectRange(range?.anchor ?? cell, { rowKey, columnKey })
    ) {
      const last = painted.find(
        (element) =>
          element.parentElement?.dataset.gridRow === gridKeyToken(rowKey) &&
          element.dataset.columnKey === columnKey,
      );
      last?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    }
  }

  function startPointer(event: PointerEvent) {
    if (event.button !== 0 || event.pointerType === "touch") return;
    const cell = address(event.target);
    if (!cell) return;
    event.preventDefault();
    const textSelection = document.getSelection();
    if (textSelection?.anchorNode && root.contains(textSelection.anchorNode))
      textSelection.removeAllRanges();
    const anchor = event.shiftKey ? (range?.anchor ?? cell) : cell;
    selectRange(anchor, cell);
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      anchor,
      dragged: false,
    };
    const element = (event.target as Element).closest<HTMLElement>(
      cellSelector,
    );
    element?.focus({ preventScroll: true });
  }

  function movePointer(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id || !(event.buttons & 1))
      return;
    if (
      !pointer.dragged &&
      Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 4
    )
      return;
    const cell = address(
      document.elementFromPoint?.(event.clientX, event.clientY) ?? event.target,
      true,
    );
    if (cell && selectRange(pointer.anchor, cell)) {
      pointer.dragged = true;
      event.preventDefault();
    }
  }

  function endPointer(event: PointerEvent) {
    if (pointer?.id !== event.pointerId) return;
    pointer = undefined;
  }

  function onSelectStart(event: Event) {
    if (pointer) event.preventDefault();
  }

  function onFocus(event: FocusEvent) {
    const cell = address(event.target);
    if (
      cell &&
      !pointer &&
      (!range || (!same(cell, range.anchor) && !same(cell, range.focus)))
    )
      selectRange(cell);
  }

  root.addEventListener("keydown", onKey, true);
  root.addEventListener("copy", onCopy);
  root.addEventListener("paste", onPaste);
  root.addEventListener("pointerdown", startPointer);
  root.addEventListener("focusin", onFocus);
  document.addEventListener("selectstart", onSelectStart, true);
  document.addEventListener("pointermove", movePointer);
  document.addEventListener("pointerup", endPointer);
  document.addEventListener("pointercancel", endPointer);
  const stop = watch(
    context.getView,
    () => {
      task?.abort();
      pointer = undefined;
      clearSelection();
    },
    { flush: "sync" },
  );

  return {
    selectRange,
    clearSelection,
    copyText,
    pasteText,
    dispose() {
      alive = false;
      task?.abort();
      if (task) context.release(task);
      stop();
      stopAdditional?.();
      observer?.disconnect();
      clearSelection();
      root.removeEventListener("keydown", onKey, true);
      root.removeEventListener("copy", onCopy);
      root.removeEventListener("paste", onPaste);
      root.removeEventListener("pointerdown", startPointer);
      root.removeEventListener("focusin", onFocus);
      document.removeEventListener("selectstart", onSelectStart, true);
      document.removeEventListener("pointermove", movePointer);
      document.removeEventListener("pointerup", endPointer);
      document.removeEventListener("pointercancel", endPointer);
    },
  };
}

export function createProGridClipboard<
  T extends object = Record<string, unknown>,
>(options: HysProGridClipboardOptions<T> = {}): HysProGridClipboard<T> {
  let binding: ReturnType<typeof bindClipboard<T>> | undefined;
  return {
    attach(context) {
      if (binding)
        throw new Error("Each HysProGrid needs its own clipboard instance.");
      const current = bindClipboard(context, options);
      binding = current;
      return () => {
        if (binding !== current) return;
        binding = undefined;
        current.dispose();
      };
    },
    selectRange: (anchor, focus) =>
      binding?.selectRange(anchor, focus) ?? false,
    clearSelection: () => binding?.clearSelection(),
    copyText: () => binding?.copyText(),
    pasteText: (text) =>
      binding?.pasteText(text) ??
      Promise.resolve(
        pasteFailure("unavailable", "剪贴板模块尚未连接到表格。"),
      ),
  };
}
