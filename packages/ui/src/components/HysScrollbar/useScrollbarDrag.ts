import { onBeforeUnmount, onDeactivated, shallowRef, type Ref } from "vue";
import { clamp, scrollbarThumb, type ScrollbarAxis, type ScrollbarGeometry } from "./scrollbarGeometry";

type Thumb = NonNullable<ReturnType<typeof scrollbarThumb>>;

export function useScrollbarDrag(
  viewport: () => HTMLElement | null | undefined,
  geometry: Readonly<Ref<ScrollbarGeometry | undefined>>,
  thumbs: Readonly<Ref<Record<ScrollbarAxis, Thumb | undefined>>>,
) {
  const dragging = shallowRef<{
    pointerId: number;
    track: HTMLElement;
    axis: ScrollbarAxis;
    grabRatio: number;
  }>();

  function offset(event: PointerEvent, track: HTMLElement, axis: ScrollbarAxis) {
    const rect = track.getBoundingClientRect();
    return axis === "vertical"
      ? (event.clientY - rect.top) * track.clientHeight / (rect.height || 1)
      : (event.clientX - rect.left) * track.clientWidth / (rect.width || 1);
  }

  function move(event: PointerEvent) {
    const gesture = dragging.value;
    const target = viewport();
    const area = geometry.value;
    if (!gesture || gesture.pointerId !== event.pointerId || !target || !area) return;
    const { track, axis, grabRatio } = gesture;
    const thumb = thumbs.value[axis];
    if (!thumb || thumb.travel <= 0) return;
    const value = clamp(offset(event, track, axis) - thumb.size * grabRatio, thumb.travel) / thumb.travel * thumb.max;
    if (axis === "vertical") target.scrollTop = value;
    else target.scrollLeft = value - (area.rtl ? area.maxX : 0);
  }

  function start(event: PointerEvent, axis: ScrollbarAxis) {
    const thumb = thumbs.value[axis];
    if (dragging.value || event.button !== 0 || !thumb || thumb.travel <= 0) return;
    const track = event.currentTarget as HTMLElement;
    const position = offset(event, track, axis);
    const onThumb = (event.target as Element)?.closest(".hys-ui-scrollbar-thumb");
    event.preventDefault();
    track.setPointerCapture(event.pointerId);
    dragging.value = {
      pointerId: event.pointerId,
      track,
      axis,
      grabRatio: onThumb ? clamp((position - thumb.offset) / thumb.size, 1) : 0.5,
    };
    if (!onThumb) move(event);
  }

  function stop() {
    const gesture = dragging.value;
    if (!gesture) return;
    dragging.value = undefined;
    const { track, pointerId } = gesture;
    if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
  }

  function finish(event: PointerEvent) {
    if (dragging.value?.pointerId === event.pointerId) stop();
  }

  onBeforeUnmount(stop);
  onDeactivated(stop);
  return { dragging, start, move, finish, stop };
}
