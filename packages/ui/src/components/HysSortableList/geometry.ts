import {
  keyToken,
  layoutOf,
  linkedPorts,
  portAt,
  type SortCandidate,
  type SortPort,
  type SortProposal,
} from "./model";
import type {
  HysSortDrag,
  HysSortFeedback,
  HysSortableListProps,
  HysSortKey,
  HysSortPosition,
  HysSortScroll,
} from "./sortableList";

export interface SortPoint {
  x: number;
  y: number;
}

export function wholeRowDrag(
  props: Pick<HysSortableListProps, "handle" | "showHandle">,
) {
  return (
    props.handle === false ||
    (props.showHandle === false && typeof props.handle !== "string")
  );
}

export function hitsSelectableText(element: Element, x: number, y: number) {
  const textNodes = Array.from(element.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
  );
  if (!textNodes.length) return false;
  if (
    element.ownerDocument.defaultView?.getComputedStyle(element).userSelect ===
    "none"
  )
    return false;
  const range = element.ownerDocument.createRange();
  return textNodes.some((node) => {
    range.selectNodeContents(node);
    return Array.from(range.getClientRects?.() ?? []).some(
      ({ left, right, top, bottom, width }) =>
        width > 0 && x >= left && x <= right && y >= top && y <= bottom,
    );
  });
}

export function dropMarkerFor<T extends object>(
  port: SortPort<T>,
  candidate: SortCandidate<T>,
  drag: HysSortDrag<T>,
  result?: SortProposal<T> | HysSortFeedback<T>,
): { key?: HysSortKey; position: HysSortPosition } {
  if (result && !("reason" in result)) {
    if (
      result.source === port &&
      port.props.livePreview !== false &&
      !(port.props.virtual && drag.source === "keyboard")
    )
      return { key: drag.keys[0], position: "before" };
    const index = result.proposal.index;
    if (index !== candidate.index) {
      const items = port.data().items;
      const item = items[index] ?? items.at(-1);
      if (item)
        return {
          key: port.key(item),
          position: index < items.length ? "before" : "after",
        };
    }
  }
  return { key: candidate.anchor, position: candidate.position };
}
export interface SortHit<T extends object> {
  element: Element | null;
  rowKey?: string;
  candidate?: SortCandidate<T>;
  nearCenter?: boolean;
  nearEdge?: boolean;
}
type SortRect = Pick<
  DOMRect,
  "left" | "top" | "right" | "bottom" | "width" | "height"
>;
const clamp = (value: number, start: number, end: number) =>
  Math.max(start, Math.min(end, value));
const rowsOf = (element: HTMLElement) =>
  Array.from(element.children).filter(
    (row): row is HTMLElement =>
      row instanceof HTMLElement && row.dataset.sortKey !== undefined,
  );
const distance = (point: SortPoint, rect: SortRect) =>
  Math.hypot(
    point.x - clamp(point.x, rect.left, rect.right),
    point.y - clamp(point.y, rect.top, rect.bottom),
  );

export function withinDragBounds<T extends object>(
  port: SortPort<T>,
  point: SortPoint,
  origin: SortPoint,
) {
  const { axis, bounds } = port.props;
  const x = axis === "y" ? origin.x : point.x;
  const y = axis === "x" ? origin.y : point.y;
  const element =
    bounds === "list"
      ? port.root()
      : typeof bounds === "function"
        ? bounds()
        : typeof bounds === "object"
          ? bounds
          : undefined;
  const rect = element?.getBoundingClientRect();
  const view = port.root()?.ownerDocument.defaultView;
  if (rect)
    return {
      point: {
        x: clamp(x, rect.left, rect.right),
        y: clamp(y, rect.top, rect.bottom),
      },
      inside: distance({ x, y }, rect) === 0,
    };
  if (view)
    return {
      point: {
        x: clamp(x, 0, view.innerWidth),
        y: clamp(y, 0, view.innerHeight),
      },
      inside: x >= 0 && y >= 0 && x < view.innerWidth && y < view.innerHeight,
    };
  return { point: { x, y }, inside: true };
}

export function gridColumns(element: HTMLElement | undefined) {
  if (!element) return 1;
  const known = Number(element.dataset.sortColumns);
  if (known > 0) return known;
  const rows = rowsOf(element);
  const top = rows[0]?.getBoundingClientRect().top ?? 0;
  const firstNewLine = rows.findIndex(
    (row) => Math.abs(row.getBoundingClientRect().top - top) > 2,
  );
  return firstNewLine > 0 ? firstNewLine : Math.max(1, rows.length);
}

function rowBox(row: HTMLElement, moveClasses: readonly string[]): SortRect {
  const rect = row.getBoundingClientRect();
  if (!moveClasses.some((className) => row.classList.contains(className)))
    return rect;
  const view = row.ownerDocument.defaultView;
  if (!view?.DOMMatrixReadOnly) return rect;
  // TransitionGroup translates the row from its former position. Use its layout position for hit testing.
  const transform = view.getComputedStyle(row).transform;
  if (transform === "none") return rect;
  const { m41, m42 } = new view.DOMMatrixReadOnly(transform);
  return {
    left: rect.left - m41,
    right: rect.right - m41,
    top: rect.top - m42,
    bottom: rect.bottom - m42,
    width: rect.width,
    height: rect.height,
  };
}

function nearestRow(
  element: HTMLElement,
  point: SortPoint,
  moveClasses: readonly string[],
) {
  let nearest: { row: HTMLElement; box: SortRect } | undefined;
  let best = Infinity;
  for (const row of rowsOf(element)) {
    const box = rowBox(row, moveClasses);
    const gap = distance(point, box);
    if (gap < best) {
      best = gap;
      nearest = { row, box };
      if (gap === 0) break;
    }
  }
  return nearest;
}

function snapPort<T extends object>(source: SortPort<T>, point: SortPoint) {
  let nearest: SortPort<T> | undefined;
  let best = 17;
  for (const port of linkedPorts(source)) {
    if (!source.props.snap && !port.props.snap) continue;
    const surface = port.surface();
    if (
      !surface ||
      surface.ownerDocument !== source.root()?.ownerDocument ||
      !surface.isConnected
    )
      continue;
    const gap = distance(point, surface.getBoundingClientRect());
    if (gap < best) {
      best = gap;
      nearest = port;
    }
  }
  return nearest;
}

export function findSortHit<T extends object>(
  source: SortPort<T>,
  point: SortPoint,
): SortHit<T> {
  const document = source.root()?.ownerDocument;
  const element = document?.elementFromPoint?.(point.x, point.y) ?? null;
  const port = portAt<T>(element) ?? snapPort(source, point);
  const surface = port?.surface();
  if (!port || !surface) return { element };
  const data = port.data();
  if (!data.items.length)
    return { element, candidate: { port, index: 0, position: "inside" } };
  const moveClasses = (port.props.moveClass || "hys-sort-motion-move")
    .split(/\s+/)
    .filter(Boolean);
  const direct = element?.closest<HTMLElement>("[data-sort-key]");
  const directBox =
    direct?.parentElement === surface ? rowBox(direct, moveClasses) : undefined;
  const hit =
    direct && directBox && distance(point, directBox) === 0
      ? { row: direct, box: directBox }
      : nearestRow(surface, point, moveClasses);
  if (!hit) return { element };
  const { row, box } = hit;
  const index = Number(row.dataset.sortIndex);
  if (!Number.isInteger(index) || index < 0 || index >= data.items.length)
    return { element };
  const layout = layoutOf(port.props);
  const inline =
    layout === "horizontal" ||
    (layout === "grid" && box.width + 1 < surface.clientWidth);
  const rtl = inline && getComputedStyle(surface).direction === "rtl";
  let after = inline
    ? point.x >= box.left + box.width / 2 !== rtl
    : point.y >= box.top + box.height / 2;
  if (point.y < box.top) after = false;
  if (point.y > box.bottom) after = true;
  const swap = source === port && port.props.mode === "swap";
  const offset = inline ? point.x - box.left : point.y - box.top;
  const extent = inline ? box.width : box.height;
  const buffer = clamp(extent * 0.12, 4, 10);
  const edge = Math.min(Math.abs(offset), Math.abs(extent - offset));
  const gridEdge =
    layout === "grid"
      ? Math.min(Math.abs(point.y - box.top), Math.abs(point.y - box.bottom))
      : Infinity;
  const anchor = data.items[index];
  // During a live preview, data-sort-index is the visual position. The original model
  // still determines the insertion boundary, so the target does not follow the moved row.
  return {
    element,
    rowKey: row.dataset.sortKey,
    nearCenter: !swap && Math.abs(offset - extent / 2) <= buffer,
    nearEdge: Math.min(edge, gridEdge) <= buffer,
    candidate: {
      port,
      index: index + (after && !swap ? 1 : 0),
      position: after ? "after" : "before",
      anchor: port.key(anchor),
    },
  };
}

export function keepSortCandidate<T extends object>(
  source: SortPort<T>,
  current: SortCandidate<T> | undefined,
  hit?: SortHit<T>,
) {
  if (!current || !hit?.candidate || current.port !== hit.candidate.port)
    return false;
  const next = hit.candidate;
  if (next.port === source && source.props.mode === "swap") return hit.nearEdge;
  const change = Math.abs(current.index - next.index);
  return change === 0 ? hit.nearEdge : change === 1 && hit.nearCenter;
}

export function candidateAt<T extends object>(
  source: SortPort<T>,
  port: SortPort<T>,
  index: number,
): SortCandidate<T> {
  const items = port.data().items;
  const last = items.at(-1);
  const anchor = items[index] ?? last;
  return {
    port,
    index,
    position: !items.length
      ? "inside"
      : index >= items.length && (source !== port || port.props.mode !== "swap")
        ? "after"
        : "before",
    anchor: anchor ? port.key(anchor) : undefined,
  };
}

export function relativeCandidate<T extends object>(
  port: SortPort<T>,
  key: HysSortKey,
  step: number,
) {
  const index = port.data().keys.get(key);
  if (index === undefined || !Number.isInteger(step) || !step) return;
  const to = index + step;
  if (to < 0 || to >= port.data().items.length) return;
  return candidateAt(
    port,
    port,
    to + (port.props.mode !== "swap" && step > 0 ? 1 : 0),
  );
}

export function keyStep<T extends object>(port: SortPort<T>, key: string) {
  const layout = layoutOf(port.props);
  const horizontal = layout === "horizontal";
  const grid = layout === "grid";
  const surface = port.surface();
  if (key === "ArrowLeft" || key === "ArrowRight") {
    if (!horizontal && !grid) return 0;
    const rtl = surface && getComputedStyle(surface).direction === "rtl";
    return (key === "ArrowRight") !== rtl ? 1 : -1;
  }
  if (key === "ArrowUp" || key === "ArrowDown") {
    if (horizontal) return 0;
    return (key === "ArrowDown" ? 1 : -1) * (grid ? gridColumns(surface) : 1);
  }
  return 0;
}

export function sameCandidate<T extends object>(
  a?: SortCandidate<T>,
  b?: SortCandidate<T>,
) {
  return (
    a?.port === b?.port &&
    a?.index === b?.index &&
    a?.position === b?.position &&
    a?.anchor === b?.anchor
  );
}
export const tokenOf = keyToken;

function edge(
  point: number,
  from: number,
  to: number,
  threshold: number,
  speed: number,
) {
  if (point < from || point > to) return 0;
  const size = Math.min(threshold, (to - from) / 2);
  if (!size) return 0;
  if (point < from + size)
    return -Math.ceil(speed * (1 - (point - from) / size));
  if (point > to - size) return Math.ceil(speed * (1 - (to - point) / size));
  return 0;
}

function scrollElement(
  element: HTMLElement,
  point: SortPoint,
  config: HysSortScroll,
  page: boolean,
  hasX: boolean,
  hasY: boolean,
) {
  const view = element.ownerDocument.defaultView;
  if (!view) return { x: false, y: false };
  const rect = page
    ? { left: 0, top: 0, right: view.innerWidth, bottom: view.innerHeight }
    : element.getBoundingClientRect();
  if (distance(point, rect as DOMRect) > 0) return { x: false, y: false };
  const style = getComputedStyle(element);
  const threshold = clamp(config.threshold ?? 36, 1, 200);
  const speed = clamp(config.speed ?? 14, 1, 100);
  const oldX = element.scrollLeft;
  const oldY = element.scrollTop;
  if (
    !hasX &&
    config.axis !== "y" &&
    element.scrollWidth > element.clientWidth &&
    (page || /auto|scroll|overlay/.test(style.overflowX))
  )
    element.scrollLeft += edge(
      point.x,
      rect.left,
      rect.right,
      threshold,
      speed,
    );
  if (
    !hasY &&
    config.axis !== "x" &&
    element.scrollHeight > element.clientHeight &&
    (page || /auto|scroll|overlay/.test(style.overflowY))
  )
    element.scrollTop += edge(point.y, rect.top, rect.bottom, threshold, speed);
  return { x: element.scrollLeft !== oldX, y: element.scrollTop !== oldY };
}

export function autoScrollSort(
  element: Element | null,
  point: SortPoint,
  option: boolean | HysSortScroll | undefined,
) {
  if (option === false || !element) return false;
  const config = typeof option === "object" ? option : {};
  const scrolling = element.ownerDocument.scrollingElement;
  let x = false;
  let y = false;
  for (
    let node: Element | null = element;
    node && !(x && y);
    node = node.parentElement
  ) {
    if (!(node instanceof HTMLElement) || node === scrolling) continue;
    const result = scrollElement(node, point, config, false, x, y);
    x ||= result.x;
    y ||= result.y;
  }
  if (
    config.window !== false &&
    scrolling instanceof HTMLElement &&
    !(x && y)
  ) {
    const result = scrollElement(scrolling, point, config, true, x, y);
    x ||= result.x;
    y ||= result.y;
  }
  return x || y;
}
