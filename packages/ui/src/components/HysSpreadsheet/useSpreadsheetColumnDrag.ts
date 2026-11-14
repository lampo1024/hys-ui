import { onBeforeUnmount, shallowRef, watch } from "vue";
import type { HysSpreadsheetSheet } from "./spreadsheetTypes";

const dragType = "application/x-hys-spreadsheet-column";

export function useSpreadsheetColumnDrag(
  sheet: () => HysSpreadsheetSheet,
  enabled: () => boolean,
  move: (from: number, to: number) => void,
  cancelMotion: () => void,
) {
  const source = shallowRef<{ index: number; sheet: HysSpreadsheetSheet }>();
  const target = shallowRef<{ index: number; after: boolean }>();
  let hoveredHeader: HTMLTableCellElement | null = null;

  function header(node: EventTarget | null) {
    return node instanceof Element
      ? node.closest<HTMLTableCellElement>("thead th[data-column-key]")
      : null;
  }

  function end() {
    source.value = undefined;
    target.value = undefined;
  }

  function clearHover() {
    hoveredHeader?.removeAttribute("data-column-hovered");
    hoveredHeader = null;
  }

  function hover(event: PointerEvent) {
    if (!enabled() || event.pointerType === "touch") return;
    const cell =
      event.target instanceof Element
        ? event.target.closest<HTMLTableCellElement>(
            "td[data-column-key], th[data-column-key]",
          )
        : null;
    const key = cell?.dataset.columnKey;
    if (!cell || !key || !/^\d+$/.test(key)) {
      clearHover();
      return;
    }
    if (hoveredHeader?.isConnected && hoveredHeader.dataset.columnKey === key)
      return;
    clearHover();
    hoveredHeader =
      cell
        .closest("table")
        ?.querySelector<HTMLTableCellElement>(
          `thead th[data-column-key="${key}"]`,
        ) ?? null;
    hoveredHeader?.setAttribute("data-column-hovered", "");
  }

  watch(
    [sheet, enabled],
    () => {
      end();
      clearHover();
    },
    { flush: "sync" },
  );
  onBeforeUnmount(clearHover);

  function start(event: DragEvent) {
    const cell = header(event.target);
    if (!cell) return;
    // The spreadsheet stores column order in the workbook.
    event.stopPropagation();
    if (
      !enabled() ||
      !event.dataTransfer ||
      !(
        event.target instanceof Element &&
        event.target.closest(".hys-ui-spreadsheet-column-grip")
      )
    ) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(dragType, "move");
    clearHover();
    cancelMotion();
    source.value = { index: Number(cell.dataset.columnKey), sheet: sheet() };
  }

  function destination(event: DragEvent) {
    const from = source.value;
    const cell = header(event.target);
    if (!from || !cell || !enabled() || from.sheet !== sheet()) return;
    const index = Number(cell.dataset.columnKey);
    if (index === from.index) return;
    const bounds = cell.getBoundingClientRect();
    const after = event.clientX >= bounds.left + bounds.width / 2;
    const to = index + Number(after) - Number(from.index < index);
    if (to !== from.index) return { index, after, to };
  }

  function over(event: DragEvent) {
    if (!source.value) return;
    const next = destination(event);
    if (
      target.value?.index !== next?.index ||
      target.value?.after !== next?.after
    )
      target.value = next;
    if (!next) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }

  function leave(event: DragEvent) {
    const cell = header(event.target);
    if (!cell || target.value?.index !== Number(cell.dataset.columnKey)) return;
    if (header(event.relatedTarget) !== cell) target.value = undefined;
  }

  function drop(event: DragEvent) {
    const from = source.value?.index;
    if (from === undefined) return;
    const next = destination(event);
    end();
    if (!next || event.dataTransfer?.getData(dragType) !== "move") return;
    event.preventDefault();
    event.stopPropagation();
    move(from, next.to);
  }

  function headerClass(index: number) {
    if (!enabled()) return;
    const classes = [];
    if (source.value?.index === index)
      classes.push("hys-ui-spreadsheet-column-dragging");
    if (target.value?.index === index)
      classes.push(
        target.value.after
          ? "hys-ui-spreadsheet-column-drop-after"
          : "hys-ui-spreadsheet-column-drop-before",
      );
    return classes.join(" ");
  }

  return { start, over, leave, drop, end, headerClass, hover, clearHover };
}
