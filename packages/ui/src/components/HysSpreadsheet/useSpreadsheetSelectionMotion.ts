import { onBeforeUnmount, watch } from "vue";
import { useMotion } from "../../motion/useMotion";

const cellSelector = "td[data-hys-cell-index][data-column-key]";
const singleMark = '[data-hys-pro-grid-range="single"]';
const movingMark = "data-hys-spreadsheet-selection-moving";

function borderBox(cell: HTMLElement, scale: number) {
  const bounds = cell.getBoundingClientRect();
  const style = cell.ownerDocument.defaultView!.getComputedStyle(cell);
  const left = (parseFloat(style.borderLeftWidth) || 0) * scale;
  const right = (parseFloat(style.borderRightWidth) || 0) * scale;
  const top = (parseFloat(style.borderTopWidth) || 0) * scale;
  const bottom = (parseFloat(style.borderBottomWidth) || 0) * scale;
  return {
    x: bounds.left + left,
    y: bounds.top + top,
    width: bounds.width - left - right,
    height: bounds.height - top - bottom,
  };
}

export function useSpreadsheetSelectionMotion() {
  const { effectiveMotion } = useMotion();
  let pending:
    | {
        event: PointerEvent;
        cell: HTMLElement;
        from: ReturnType<typeof borderBox>;
      }
    | undefined;
  let moving:
    | { cell: HTMLElement; frame: HTMLElement; animation: Animation }
    | undefined;

  function cancel() {
    if (!moving) return;
    const { cell, frame, animation } = moving;
    moving = undefined;
    animation.cancel();
    cell.removeAttribute(movingMark);
    frame.remove();
  }

  function capture(event: PointerEvent, allow: boolean) {
    pending = undefined;
    if (!allow || event.pointerType === "touch" || effectiveMotion.value === "off")
      return;
    const target = event.target as Element;
    if (target.closest("input, textarea, select, button, a, [contenteditable]"))
      return;
    const cell = target.closest<HTMLElement>(cellSelector);
    if (!cell || typeof cell.animate !== "function") return;
    const previous = cell.closest("table")?.querySelector<HTMLElement>(
      `:scope > tbody > tr > ${cellSelector}${singleMark}`,
    );
    if (!previous || previous === cell) return;
    pending = {
      event,
      cell,
      from:
        moving?.cell === previous
          ? moving.frame.getBoundingClientRect()
          : borderBox(previous, previous.currentCSSZoom || 1),
    };
  }

  function play(event: PointerEvent) {
    const change = pending;
    pending = undefined;
    if (change?.event !== event || !change.cell.matches(singleMark)) return;
    const { cell, from } = change;
    const scroller = cell.closest<HTMLElement>(".hys-ui-pf-grid-scroll");
    if (!scroller || !from.width || !from.height) return;
    const scale = cell.currentCSSZoom || 1;
    const to = borderBox(cell, scale);
    const viewport = scroller.getBoundingClientRect();
    const frame = cell.ownerDocument.createElement("span");
    frame.className = "hys-ui-spreadsheet-selection-frame";
    frame.setAttribute("aria-hidden", "true");
    frame.toggleAttribute("data-focus-visible", cell.matches(":focus-visible"));
    frame.style.left = `${(to.x - viewport.left) / scale + scroller.scrollLeft - scroller.clientLeft}px`;
    frame.style.top = `${(to.y - viewport.top) / scale + scroller.scrollTop - scroller.clientTop}px`;
    frame.style.width = `${to.width / scale}px`;
    frame.style.height = `${to.height / scale}px`;
    cancel();
    scroller.append(frame);
    cell.setAttribute(movingMark, "");
    const animation = frame.animate(
      [
        {
          transform: `translate(${(from.x - to.x) / scale}px, ${(from.y - to.y) / scale}px)`,
          width: `${from.width / scale}px`,
          height: `${from.height / scale}px`,
        },
        { transform: "translate(0, 0)" },
      ],
      { duration: 160, easing: "cubic-bezier(.2,.75,.25,1)" },
    );
    moving = { cell, frame, animation };
    animation.onfinish = () => {
      if (moving?.animation === animation) cancel();
    };
  }

  function syncSelection() {
    if (moving && !moving.cell.matches(singleMark)) cancel();
  }

  watch(effectiveMotion, (mode) => {
    if (mode === "off") cancel();
  });
  onBeforeUnmount(cancel);
  return { cancel, capture, play, syncSelection };
}
