import { onBeforeUnmount, onDeactivated, watch } from "vue";

export const minRowHeight = 16;
export const maxRowHeight = 1000;

function boundHeight(height: number) {
  return Math.min(maxRowHeight, Math.max(minRowHeight, Math.round(height)));
}

export function useSpreadsheetRowResize(
  enabled: () => boolean,
  context: () => unknown,
  commit: (index: number, height: number) => void,
) {
  let drag:
    | {
        pointer: number;
        handle: HTMLElement;
        scroll: HTMLElement;
        index: number;
        height: number;
        start: number;
        offset: number;
        scale: number;
        line: HTMLElement;
      }
    | undefined;

  function cancel() {
    const active = drag;
    if (!active) return;
    drag = undefined;
    const { handle, pointer, scroll, line } = active;
    line.remove();
    scroll.removeAttribute("data-row-resizing");
    const view = handle.ownerDocument.defaultView;
    view?.removeEventListener("blur", cancel);
    view?.removeEventListener("keydown", escape, true);
    if (handle.hasPointerCapture?.(pointer))
      handle.releasePointerCapture(pointer);
  }

  function escape(event: KeyboardEvent) {
    if (event.key !== "Escape" || !drag) return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
  }

  function start(event: PointerEvent, index: number) {
    if (drag || !enabled() || event.button !== 0 || event.isPrimary === false)
      return;
    const handle = event.currentTarget as HTMLElement;
    const row = handle.closest("tr");
    const scroll = handle.closest<HTMLElement>(".hys-ui-pf-grid-scroll");
    const view = handle.ownerDocument.defaultView;
    if (!row || !scroll || !view) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      handle.setPointerCapture?.(event.pointerId);
    } catch {
      return;
    }
    const scale = scroll.currentCSSZoom || 1;
    const bounds = row.getBoundingClientRect();
    const viewport = scroll.getBoundingClientRect();
    const line = handle.ownerDocument.createElement("div");
    line.className = "hys-ui-spreadsheet-row-resize-guide";
    line.setAttribute("aria-hidden", "true");
    line.hidden = true;
    line.style.left = `${scroll.scrollLeft}px`;
    line.style.width = `${scroll.clientWidth}px`;
    scroll.append(line);
    scroll.setAttribute("data-row-resizing", "");
    drag = {
      index,
      handle,
      scroll,
      line,
      scale,
      pointer: event.pointerId,
      start: event.clientY,
      height: bounds.height / scale,
      offset:
        (bounds.top - viewport.top) / scale +
        scroll.scrollTop -
        scroll.clientTop,
    };
    view.addEventListener("blur", cancel);
    view.addEventListener("keydown", escape, true);
  }

  function heightAt(event: PointerEvent, active: NonNullable<typeof drag>) {
    return boundHeight(
      active.height + (event.clientY - active.start) / active.scale,
    );
  }

  function move(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointer) return;
    const height = heightAt(event, drag);
    drag.line.style.top = `${drag.offset + height}px`;
    drag.line.hidden = false;
  }

  function finish(event: PointerEvent) {
    const active = drag;
    if (!active || event.pointerId !== active.pointer) return;
    const height = heightAt(event, active);
    cancel();
    if (
      event.type === "pointerup" &&
      enabled() &&
      event.clientY !== active.start &&
      height !== Math.round(active.height)
    )
      commit(active.index, height);
  }

  function key(event: KeyboardEvent, index: number, height: number) {
    if (!enabled() || event.altKey || event.ctrlKey || event.metaKey) return;
    const step = event.shiftKey ? 10 : 1;
    const next =
      event.key === "ArrowUp"
        ? height - step
        : event.key === "ArrowDown"
          ? height + step
          : event.key === "Home"
            ? minRowHeight
            : event.key === "End"
              ? maxRowHeight
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const bounded = boundHeight(next);
    if (bounded !== height) commit(index, bounded);
  }

  watch([enabled, context], cancel, { flush: "sync" });
  onDeactivated(cancel);
  onBeforeUnmount(cancel);
  return { start, move, finish, key, cancel };
}
