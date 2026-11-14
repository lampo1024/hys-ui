export type ScrollbarAxis = "vertical" | "horizontal";
export type ScrollbarEdge = "top" | "bottom" | "left" | "right";

export const scrollbarAxes = ["vertical", "horizontal"] as const;
export const scrollbarEdges = ["top", "bottom", "left", "right"] as const;
export const trackInset = 4;
export const trackCorner = 10;
export const edgeTolerance = 0.5;

export function nonnegative(value: number, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

export function clamp(value: number, max: number) {
  return Math.min(Math.max(value, 0), max);
}

function physicalLeft(scrollLeft: number, maxX: number, rtl: boolean) {
  return clamp(scrollLeft + (rtl ? maxX : 0), maxX);
}

export function scrollbarGaps(maxX: number, maxY: number, x: number, y: number) {
  return { top: y, bottom: maxY - y, left: x, right: maxX - x };
}

export function readScrollbarGeometry(viewport: HTMLElement, direction: ScrollbarAxis | "both") {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  const maxX = direction === "vertical" ? 0 : Math.max(0, viewport.scrollWidth - width);
  const maxY = direction === "horizontal" ? 0 : Math.max(0, viewport.scrollHeight - height);
  const rtl = viewport.ownerDocument.defaultView?.getComputedStyle(viewport).direction === "rtl";
  const x = physicalLeft(viewport.scrollLeft, maxX, rtl);
  const y = clamp(viewport.scrollTop, maxY);
  return {
    width, height, maxX, maxY, rtl, x, y,
    left: viewport.offsetLeft + viewport.clientLeft,
    top: viewport.offsetTop + viewport.clientTop,
    gaps: scrollbarGaps(maxX, maxY, x, y),
  };
}

export type ScrollbarGeometry = ReturnType<typeof readScrollbarGeometry>;

export function previousGaps(geometry: ScrollbarGeometry, position: { scrollLeft: number; scrollTop: number }) {
  const { maxX, maxY, rtl } = geometry;
  return scrollbarGaps(maxX, maxY, physicalLeft(position.scrollLeft, maxX, rtl), clamp(position.scrollTop, maxY));
}

export function scrollbarThumb(geometry: ScrollbarGeometry, axis: ScrollbarAxis, minSize: number) {
  const vertical = axis === "vertical";
  const visible = vertical ? geometry.height : geometry.width;
  const max = vertical ? geometry.maxY : geometry.maxX;
  const position = vertical ? geometry.y : geometry.x;
  const crossMax = vertical ? geometry.maxX : geometry.maxY;
  const length = visible - 2 * trackInset - (crossMax > 0 ? trackCorner : 0);
  if (max <= 0 || length <= 1) return;
  const size = Math.min(Math.max(length * visible / (max + visible), nonnegative(minSize, 20)), length - 1);
  return { size, travel: length - size, offset: (length - size) * position / max, max };
}
