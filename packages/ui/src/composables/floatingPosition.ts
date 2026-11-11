import type { Placement } from "./useFloating";

export function positionFloating(
  anchor: DOMRect,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  placement: Placement,
  gap: number,
  padding: number,
  flip: boolean,
) {
  const { width: vw, height: vh } = viewport;
  const width = Math.min(size.width, Math.max(0, vw - 2 * padding));
  const height = Math.min(size.height, Math.max(0, vh - 2 * padding));
  const [side, alignment] = placement.split("-");
  const available = {
    top: anchor.top - gap,
    bottom: vh - anchor.bottom - gap,
    left: anchor.left - gap,
    right: vw - anchor.right - gap,
  };
  const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;
  const preferred = side as keyof typeof opposite;
  const vertical = preferred === "top" || preferred === "bottom";
  const other = opposite[preferred];
  const resolved =
    flip && available[preferred] < (vertical ? height : width) &&
    available[other] > available[preferred]
      ? other
      : preferred;
  const align = (start: number, end: number, length: number) =>
    alignment === "start" ? start : alignment === "end" ? end - length :
      (start + end - length) / 2;
  const left = vertical ? align(anchor.left, anchor.right, width) :
    resolved === "left" ? anchor.left - width - gap : anchor.right + gap;
  const top = !vertical ? align(anchor.top, anchor.bottom, height) :
    resolved === "top" ? anchor.top - height - gap : anchor.bottom + gap;
  return {
    width,
    height,
    x: Math.max(padding, Math.min(left, vw - width - padding)),
    y: Math.max(padding, Math.min(top, vh - height - padding)),
    placement: (alignment ? resolved + "-" + alignment : resolved) as Placement,
  };
}
