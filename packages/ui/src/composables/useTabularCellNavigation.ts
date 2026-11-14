import { computed, shallowRef } from "vue";

interface Address {
  rowToken: string;
  columnKey: string;
}

export const tabularCellControls =
  "button,a[href],input,select,textarea,[contenteditable]:not([contenteditable='false']),[role='button'],[role='combobox']";

export function useTabularCellNavigation(options: {
  enabled: () => boolean;
  table: () => HTMLElement | null | undefined;
  first: () => Address | undefined;
  has: (rowToken: string, columnKey: string) => boolean;
}) {
  const active = shallowRef<Address>();
  const tabStop = computed(() => {
    if (!options.enabled()) return;
    const cell = active.value;
    return cell && options.has(cell.rowToken, cell.columnKey)
      ? cell
      : options.first();
  });
  let preferredColumn: number | undefined;

  function dataRows() {
    return Array.from(
      options
        .table()
        ?.querySelectorAll<HTMLTableRowElement>(
          ":scope > tbody > tr[data-hys-cell-row]",
        ) ?? [],
    );
  }
  function dataCells(row: HTMLTableRowElement) {
    return Array.from(row.cells).filter((cell) =>
      cell.hasAttribute("data-hys-cell-index"),
    );
  }
  function focusCell(rowToken: string, columnKey: string, focus = true) {
    if (!options.enabled() || !options.has(rowToken, columnKey)) return false;
    const row = dataRows().find(
      (element) => element.dataset.hysCellRow === rowToken,
    );
    const cell =
      row &&
      dataCells(row).find((element) => element.dataset.columnKey === columnKey);
    if (!cell) return false;
    if (focus) {
      preferredColumn = undefined;
      cell.focus();
    } else cell.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    return true;
  }

  function onKeydown(event: KeyboardEvent) {
    if (
      event.target !== event.currentTarget ||
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.shiftKey ||
      !options.enabled()
    )
      return;
    const key = event.key;
    const whole = event.ctrlKey || event.metaKey;
    if (
      key !== "Home" &&
      key !== "End" &&
      (whole ||
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key))
    )
      return;

    const current = event.currentTarget as HTMLTableCellElement;
    const rows = dataRows().map(dataCells);
    const rowIndex = rows.findIndex((row) => row.includes(current));
    if (rowIndex < 0) return;
    const row = rows[rowIndex];
    const vertical = key === "ArrowUp" || key === "ArrowDown";
    let target: HTMLTableCellElement | undefined;
    let logicalColumn: number | undefined;
    if (key === "Home" || key === "End") {
      const boundary = whole ? rows.filter((items) => items.length) : [row];
      target = key === "Home" ? boundary[0]?.[0] : boundary.at(-1)?.at(-1);
    } else if (vertical) {
      const columnIndex =
        preferredColumn ?? Number(current.dataset.hysCellIndex);
      logicalColumn = columnIndex;
      const direction = key === "ArrowUp" ? -1 : 1;
      const start =
        rowIndex + (direction < 0 ? -1 : Math.max(1, current.rowSpan));
      const matching = rows.flatMap((items, row) =>
        items.flatMap((cell) => {
          const column = Number(cell.dataset.hysCellIndex);
          return cell !== current &&
            columnIndex >= column &&
            columnIndex < column + cell.colSpan
            ? [{ cell, start: row, end: row + cell.rowSpan }]
            : [];
        }),
      );
      if (direction < 0) matching.reverse();
      target = matching.find((cell) =>
        direction < 0 ? cell.start <= start : cell.end > start,
      )?.cell;
    } else {
      const rtl = getComputedStyle(current).direction === "rtl";
      const step = (key === "ArrowRight") !== rtl ? 1 : -1;
      target = row[row.indexOf(current) + step];
    }
    event.preventDefault();
    if (target) {
      target.focus();
      preferredColumn = logicalColumn;
    }
  }

  function attrs(rowToken: string, columnKey: string, columnIndex: number) {
    if (!options.enabled()) return {};
    const cell = tabStop.value;
    return {
      "data-hys-cell-index": columnIndex,
      tabindex:
        cell?.rowToken === rowToken && cell.columnKey === columnKey ? 0 : -1,
      onFocus: () => {
        active.value = { rowToken, columnKey };
        preferredColumn = undefined;
      },
      onClick: (event: MouseEvent) => {
        if (
          !event.defaultPrevented &&
          !(event.target as Element)?.closest(tabularCellControls)
        )
          (event.currentTarget as HTMLElement).focus({ preventScroll: true });
      },
      onKeydown,
    };
  }
  return { attrs, focusCell };
}
