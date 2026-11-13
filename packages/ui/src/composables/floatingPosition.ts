import type { Placement } from "./useFloating";

export function positionFloating(
  anchor: DOMRect,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  placement: Placement,
  gap: number,
  padding: number,
  flip: boolean,
  fallbackPlacements?: readonly Placement[],
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
  const opposite = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  } as const;
  const preferred = side as keyof typeof opposite;
  const vertical = preferred === "top" || preferred === "bottom";
  const other = opposite[preferred];
  const resolved =
    flip &&
    available[preferred] < (vertical ? height : width) &&
    available[other] > available[preferred]
      ? other
      : preferred;
  function candidate(value: Placement) {
    const [side, alignment] = value.split("-");
    const vertical = side === "top" || side === "bottom";
    const align = (start: number, end: number, length: number) =>
      alignment === "start"
        ? start
        : alignment === "end"
          ? end - length
          : (start + end - length) / 2;
    const x = vertical
      ? align(anchor.left, anchor.right, width)
      : side === "left"
        ? anchor.left - width - gap
        : anchor.right + gap;
    const y = !vertical
      ? align(anchor.top, anchor.bottom, height)
      : side === "top"
        ? anchor.top - height - gap
        : anchor.bottom + gap;
    const overflow =
      Math.max(0, padding - x, x + width + padding - vw) +
      Math.max(0, padding - y, y + height + padding - vh);
    return { x, y, overflow, placement: value };
  }
  const defaultPlacement = (
    alignment ? resolved + "-" + alignment : resolved
  ) as Placement;
  let best = candidate(
    flip && fallbackPlacements ? placement : defaultPlacement,
  );
  if (flip && fallbackPlacements) {
    for (const value of fallbackPlacements) {
      if (!best.overflow) break;
      const next = candidate(value);
      if (next.overflow < best.overflow) best = next;
    }
  }
  return {
    width,
    height,
    x: Math.max(padding, Math.min(best.x, vw - width - padding)),
    y: Math.max(padding, Math.min(best.y, vh - height - padding)),
    placement: best.placement,
  };
}
