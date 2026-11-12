import { ref, type Ref } from "vue";

export function useToastSwipe(
  element: Ref<HTMLElement | undefined>,
  enabled: () => boolean,
  dismiss: (event: PointerEvent) => Promise<boolean>,
) {
  const shift = ref(0),
    dragging = ref(false),
    suppressClick = ref(false);
  let pointer: { id: number; x: number; y: number } | undefined;
  function reset() {
    const id = pointer?.id;
    pointer = undefined;
    if (id !== undefined && element.value?.hasPointerCapture?.(id))
      element.value.releasePointerCapture(id);
    dragging.value = false;
    shift.value = 0;
  }
  function start(event: PointerEvent) {
    suppressClick.value = false;
    if (
      pointer ||
      !enabled() ||
      event.button !== 0 ||
      (event.target as Element | null)?.closest(
        "button,a,input,textarea,select,[role=button],[contenteditable=true]",
      )
    )
      return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  function move(event: PointerEvent) {
    if (event.pointerId !== pointer?.id) return;
    const x = event.clientX - pointer.x,
      y = event.clientY - pointer.y;
    if (!dragging.value && Math.hypot(x, y) < 7) return;
    if (!dragging.value && Math.abs(y) > Math.abs(x)) {
      reset();
      return;
    }
    if (!dragging.value) {
      element.value?.setPointerCapture?.(event.pointerId);
      dragging.value = true;
      suppressClick.value = true;
    }
    shift.value = x;
    if (event.cancelable) event.preventDefault();
  }
  async function end(event: PointerEvent) {
    if (event.pointerId !== pointer?.id) return;
    const threshold = Math.min(
      110,
      Math.max(44, (element.value?.offsetWidth ?? 240) * 0.26),
    );
    if (!dragging.value || Math.abs(shift.value) < threshold) {
      reset();
      return;
    }
    const accepted = await dismiss(event);
    if (!accepted) reset();
    else pointer = undefined;
  }
  function leave(event: PointerEvent) {
    if (pointer?.id === event.pointerId && !dragging.value) reset();
  }
  return { shift, dragging, suppressClick, reset, start, move, end, leave };
}
