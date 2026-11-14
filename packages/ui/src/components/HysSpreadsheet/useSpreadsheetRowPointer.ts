import { onBeforeUnmount, onDeactivated, shallowRef, watch } from "vue";
import type { HysSpreadsheetSheet } from "./spreadsheetTypes";

const rowHeader = ".hys-ui-spreadsheet-row-header";
const gridScroll = ".hys-ui-pf-grid-scroll";
const moveThreshold = 4;
const edgeSize = 42;
const edgeMargin = 12;
const maxScrollSpeed = 800;

function edgeViewport(scroll: HTMLElement) {
  const view = scroll.ownerDocument.defaultView;
  if (!view || scroll.scrollHeight <= scroll.clientHeight) return;
  const bounds = scroll.getBoundingClientRect();
  const head = scroll
    .querySelector(":scope > table > thead")
    ?.getBoundingClientRect();
  const scale = scroll.currentCSSZoom || 1;
  return {
    left: Math.max(0, bounds.left),
    right: Math.min(view.innerWidth, bounds.left + scroll.clientWidth * scale),
    top: Math.max(0, bounds.top, head?.bottom ?? 0),
    bottom: Math.min(
      view.innerHeight,
      bounds.top + scroll.clientHeight * scale,
    ),
    scale,
  };
}

export function useSpreadsheetRowPointer(
  sheet: () => HysSpreadsheetSheet,
  canMove: (index: number) => boolean,
  select: (index: number, extend: boolean, focus: boolean) => void,
  activate: (index: number, event: MouseEvent) => void,
  move: (from: number, to: number) => void,
) {
  const source = shallowRef<number>();
  type Gesture = {
    id: number;
    start: number;
    last: number;
    startY: number;
    x: number;
    y: number;
    extend: boolean;
    moved: boolean;
    button: HTMLElement;
    scroll: HTMLElement | null;
    table: HTMLTableElement | null;
    reorder: boolean;
    destination?: number;
    preview?: HTMLElement;
  };
  let gesture: Gesture | undefined;
  let suppressClick = false;
  let scrollFrame = 0;
  let lastScrollTime: number | undefined;

  function down(event: PointerEvent, index: number) {
    if (event.button !== 0 || event.isPrimary === false) return;
    finish();
    suppressClick = false;
    if (event.pointerType === "touch" || event.ctrlKey || event.metaKey) return;
    const button = event.currentTarget as HTMLElement;
    gesture = {
      id: event.pointerId,
      start: index,
      last: index,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      extend: event.shiftKey,
      moved: false,
      button,
      scroll: button.closest<HTMLElement>(gridScroll),
      table: button.closest("table"),
      reorder: !event.shiftKey && canMove(index),
    };
    try {
      button.setPointerCapture?.(event.pointerId);
    } catch {
      finish();
      return;
    }
    button.ownerDocument.defaultView?.addEventListener("blur", cancel);
  }

  function motion(event: PointerEvent) {
    const drag = gesture;
    if (!drag || drag.id !== event.pointerId) return;
    if (!(event.buttons & 1)) {
      finish(event);
      return;
    }
    if (!drag.moved) {
      if (Math.abs(event.clientY - drag.startY) < moveThreshold) return;
      drag.moved = true;
      suppressClick = true;
      if (drag.reorder) {
        // The virtual row can unmount as we scroll away from it.
        try {
          drag.scroll?.setPointerCapture?.(drag.id);
        } catch {
          finish();
          return;
        }
        source.value = drag.start;
      } else select(drag.start, drag.extend, false);
    }
    event.preventDefault();
    drag.x = event.clientX;
    drag.y = event.clientY;
    refresh();
    updateEdgeScroll(drag);
  }

  function stopEdgeScroll() {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    lastScrollTime = undefined;
  }

  function updateEdgeScroll(drag: Gesture, time?: number) {
    const scroll = drag.scroll;
    const viewport =
      drag.reorder && scroll?.isConnected ? edgeViewport(scroll) : undefined;
    const speed = viewport ? edgeSpeed(drag.x, drag.y, viewport) : 0;
    if (
      !scroll ||
      !viewport ||
      !speed ||
      (speed < 0
        ? scroll.scrollTop <= 0
        : scroll.scrollTop >= scroll.scrollHeight - scroll.clientHeight - 1)
    ) {
      stopEdgeScroll();
      return;
    }
    if (time !== undefined) {
      const elapsed = Math.min(32, time - (lastScrollTime ?? time - 16));
      lastScrollTime = time;
      const step = (Math.abs(speed) * elapsed) / (1000 * viewport.scale);
      scroll.scrollTop += Math.sign(speed) * Math.max(1, Math.round(step));
    }
    if (!scrollFrame) {
      scrollFrame = requestAnimationFrame((timestamp) => {
        scrollFrame = 0;
        if (gesture === drag) updateEdgeScroll(drag, timestamp);
      });
    }
  }

  function refresh() {
    const drag = gesture;
    if (!drag?.moved) return;
    const viewport =
      drag.reorder && drag.scroll ? edgeViewport(drag.scroll) : undefined;
    const y =
      viewport && edgeSpeed(drag.x, drag.y, viewport)
        ? Math.max(viewport.top + 1, Math.min(viewport.bottom - 1, drag.y))
        : drag.y;
    const hit = drag.button.ownerDocument.elementFromPoint?.(drag.x, y);
    const row = hit?.closest<HTMLTableRowElement>("tr[data-grid-row]");
    const header =
      row?.closest("table") === drag.table
        ? row?.querySelector<HTMLElement>(rowHeader)
        : undefined;
    const index = header ? Number(header.dataset.sheetRow) : NaN;
    if (drag.reorder) {
      updateDropPreview(drag, row, index);
      return;
    }
    if (!Number.isInteger(index) || index === drag.last) return;
    drag.last = index;
    select(index, true, false);
  }

  function updateDropPreview(
    drag: Gesture,
    row: Element | null | undefined,
    index: number,
  ) {
    const scroll = drag.scroll;
    const bounds =
      Number.isInteger(index) && index !== drag.start
        ? row?.getBoundingClientRect()
        : undefined;
    const after = bounds ? drag.y >= bounds.top + bounds.height / 2 : false;
    const destination = index + Number(after) - Number(index > drag.start);
    if (!scroll || !bounds || destination === drag.start) {
      drag.destination = undefined;
      if (drag.preview) drag.preview.hidden = true;
      return;
    }
    drag.destination = destination;
    if (!drag.preview) {
      const preview = scroll.ownerDocument.createElement("div");
      preview.className = "hys-ui-spreadsheet-row-drop";
      preview.setAttribute("aria-hidden", "true");
      scroll.append(preview);
      drag.preview = preview;
    }
    const scale = scroll.currentCSSZoom || 1;
    const viewport = scroll.getBoundingClientRect();
    const preview = drag.preview;
    preview.dataset.position = after ? "after" : "before";
    preview.dataset.row = String(index);
    preview.style.left = `${scroll.scrollLeft}px`;
    preview.style.top = `${(bounds.top - viewport.top) / scale + scroll.scrollTop - scroll.clientTop}px`;
    preview.style.width = `${scroll.clientWidth}px`;
    preview.style.height = `${bounds.height / scale}px`;
    preview.hidden = false;
  }

  function finish(event?: PointerEvent) {
    const drag = gesture;
    if (!drag || (event && event.pointerId !== drag.id)) return;
    if (
      event?.type === "lostpointercapture" &&
      drag.scroll?.hasPointerCapture?.(drag.id)
    )
      return;
    if (event?.type === "pointerup" && drag.moved) {
      drag.x = event.clientX;
      drag.y = event.clientY;
      refresh();
    }
    gesture = undefined;
    stopEdgeScroll();
    source.value = undefined;
    drag.preview?.remove();
    drag.button.ownerDocument.defaultView?.removeEventListener("blur", cancel);
    if (drag.scroll?.hasPointerCapture?.(drag.id))
      drag.scroll.releasePointerCapture(drag.id);
    if (drag.button.hasPointerCapture?.(drag.id))
      drag.button.releasePointerCapture(drag.id);
    if (event?.type !== "pointerup" || !drag.moved) return;
    if (drag.reorder) {
      if (drag.destination !== undefined && canMove(drag.start))
        move(drag.start, drag.destination);
    } else select(drag.last, true, true);
  }

  function cancel() {
    finish();
  }

  function click(event: MouseEvent, index: number) {
    if (suppressClick && event.detail !== 0) {
      suppressClick = false;
      return;
    }
    activate(index, event);
  }

  watch(sheet, cancel, { flush: "sync" });
  onDeactivated(cancel);
  onBeforeUnmount(cancel);
  return { source, down, motion, refresh, finish, click };
}

function edgeSpeed(
  x: number,
  y: number,
  viewport: NonNullable<ReturnType<typeof edgeViewport>>,
) {
  const { left, right, top, bottom } = viewport;
  if (x < left || x >= right || y < top - edgeMargin || y > bottom + edgeMargin)
    return 0;
  const edge = Math.min(edgeSize, (bottom - top) / 2);
  if (edge < 2) return 0;
  const proximity = (distance: number) =>
    Math.max(0, Math.min(1, 1 - distance / edge));
  return (proximity(bottom - y) - proximity(y - top)) * maxScrollSpeed;
}
