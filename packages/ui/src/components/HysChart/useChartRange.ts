import { onBeforeUnmount, ref, watch, type ComputedRef } from "vue";
import { fitRange, shiftRange, zoomRange } from "./chartScale";
import type { HysChartRange } from "./chartTypes";

import { plotReader, type ChartPlotFrame as Frame } from "./chartPointer";

export function useChartRange({
  enabled,
  svg,
  domain,
  visible,
  frame,
  category,
  update,
  dismiss,
}: {
  enabled: ComputedRef<boolean>;
  svg: Readonly<{ value: SVGSVGElement | null }>;
  domain: ComputedRef<HysChartRange>;
  visible: ComputedRef<HysChartRange>;
  frame: ComputedRef<Frame>;
  category: ComputedRef<boolean>;
  update: (range: HysChartRange | null) => void;
  dismiss: () => void;
}) {
  let drag:
    | {
        id: number;
        target: SVGSVGElement;
        origin: number;
        read: (event: PointerEvent) => number;
        range: HysChartRange;
        frame: Frame;
        region: boolean;
        started: boolean;
      }
    | undefined;
  let pending = 0;
  let clickGuard: ReturnType<typeof setTimeout> | undefined;
  let blockClick = false;
  const preview = ref<{ start: number; end: number }>();
  const panning = ref(false);
  const clamp = (ratio: number) => Math.max(0, Math.min(1, ratio));
  const zoom = (factor: number, anchor = 0.5) =>
    update(
      zoomRange(visible.value, domain.value, factor, anchor, category.value),
    );
  function down(event: PointerEvent) {
    const target = svg.value;
    if (
      !enabled.value ||
      !target ||
      event.button !== 0 ||
      drag ||
      domain.value.start === domain.value.end
    )
      return;
    const bounds = frame.value;
    const read = plotReader(target, bounds);
    const point = read(event);
    if (!point.inside) return;
    drag = {
      id: event.pointerId,
      target,
      origin: point.ratio,
      read: (event) => read(event).ratio,
      range: visible.value,
      frame: bounds,
      region: event.shiftKey,
      started: false,
    };
  }
  function move(event: PointerEvent) {
    if (!drag || drag.id !== event.pointerId) return;
    const current = drag;
    const ratio = clamp(current.read(event));
    const delta = ratio - current.origin;
    if (!current.started) {
      if (Math.abs(delta) < 0.012) return;
      current.started = true;
      current.target.setPointerCapture?.(event.pointerId);
      panning.value = !current.region;
      dismiss();
    }
    if (current.region) {
      preview.value = {
        start: Math.min(current.origin, ratio),
        end: Math.max(current.origin, ratio),
      };
      return;
    }
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() =>
      update(shiftRange(current.range, domain.value, -delta)),
    );
  }
  function release(event?: PointerEvent) {
    const current = drag;
    if (event && current?.id !== event.pointerId) return;
    cancelAnimationFrame(pending);
    drag = undefined;
    preview.value = undefined;
    panning.value = false;
    if (current?.target.hasPointerCapture?.(current.id))
      current.target.releasePointerCapture(current.id);
    if (!current?.started || !event) return;
    blockClick = true;
    clearTimeout(clickGuard);
    clickGuard = setTimeout(() => {
      blockClick = false;
    }, 0);
    if (event.type !== "pointerup") return;
    const ratio = clamp(current.read(event));
    if (current.region) {
      if (Math.abs(ratio - current.origin) < 0.012) return;
      const a = current.frame.coordinateAt(current.origin);
      const b = current.frame.coordinateAt(ratio);
      update(
        fitRange(
          {
            start: category.value ? Math.floor(Math.min(a, b)) : Math.min(a, b),
            end: category.value ? Math.ceil(Math.max(a, b)) : Math.max(a, b),
          },
          domain.value,
          category.value,
        ),
      );
    } else
      update(shiftRange(current.range, domain.value, current.origin - ratio));
  }
  function wheel(event: WheelEvent) {
    if (!enabled.value || !svg.value || drag || !event.deltaY) return;
    const bounds = frame.value;
    const { inside, ratio } = plotReader(svg.value, bounds)(event);
    if (!inside) return;
    const range = visible.value;
    const next = zoomRange(
      range,
      domain.value,
      event.deltaY > 0 ? 1.25 : 0.8,
      ratio,
      category.value,
      category.value ? undefined : bounds.coordinateAt(ratio),
    );
    if (next.start === range.start && next.end === range.end) return;
    event.preventDefault();
    dismiss();
    update(next);
  }
  function cancelSelection() {
    if (drag?.region) release();
  }
  watch(enabled, (value) => {
    if (!value) release();
  });
  function consumeClick() {
    if (!blockClick) return false;
    blockClick = false;
    return true;
  }
  onBeforeUnmount(() => {
    release();
    clearTimeout(clickGuard);
  });
  return {
    preview,
    panning,
    cancelSelection,
    zoom,
    down,
    move,
    release,
    wheel,
    consumeClick,
  };
}
