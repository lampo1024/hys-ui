interface DragSettings {
  vertical: boolean;
  direction: 1 | -1;
  available: number;
  initial: number;
  constrain: (value: number) => number;
}
interface Gesture extends DragSettings {
  pointer: number;
  handle: HTMLElement;
  origin: number;
  latest: number;
  reported: number;
  frame?: number;
}

export function useSplitPaneDrag(
  update: (value: number) => void,
  ended: (value: number, cancelled: boolean, notify: boolean) => void,
) {
  let drag: Gesture | undefined;
  const coordinate = (event: PointerEvent, vertical: boolean) =>
    vertical ? event.clientY : event.clientX;

  function start(event: PointerEvent, settings: DragSettings) {
    if (drag || event.button !== 0 || settings.available <= 0) return false;
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.focus({ preventScroll: true });
    drag = {
      ...settings,
      pointer: event.pointerId,
      handle,
      origin: coordinate(event, settings.vertical),
      latest: settings.initial,
      reported: settings.initial,
    };
    try {
      handle.setPointerCapture?.(event.pointerId);
    } catch {
      // Window listeners still handle pointers without capture.
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", escape, true);
    return true;
  }
  function move(event: PointerEvent) {
    const gesture = drag;
    if (!gesture || event.pointerId !== gesture.pointer) return;
    const delta = coordinate(event, gesture.vertical) - gesture.origin;
    gesture.latest = delta === 0 ? gesture.initial : gesture.constrain(
      gesture.initial + gesture.direction * delta / gesture.available * 100,
    );
    if (gesture.frame === undefined) {
      gesture.frame = requestAnimationFrame(() => report(gesture));
    }
  }
  function report(gesture: Gesture) {
    gesture.frame = undefined;
    if (gesture.latest === gesture.reported) return;
    gesture.reported = gesture.latest;
    update(gesture.latest);
  }
  function up(event: PointerEvent) {
    if (event.pointerId === drag?.pointer) finish(false);
  }
  function cancel(event: PointerEvent) {
    if (event.pointerId === drag?.pointer) finish(true);
  }
  function escape(event: KeyboardEvent) {
    if (event.key !== "Escape" || !drag) return;
    event.preventDefault();
    event.stopPropagation();
    finish(true);
  }
  function finish(cancelled: boolean, notify = true) {
    const gesture = drag;
    if (!gesture) return;
    drag = undefined;
    if (gesture.frame !== undefined) cancelAnimationFrame(gesture.frame);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
    window.removeEventListener("keydown", escape, true);
    if (gesture.handle.hasPointerCapture?.(gesture.pointer)) {
      gesture.handle.releasePointerCapture(gesture.pointer);
    }
    if (!cancelled) report(gesture);
    ended(gesture.latest, cancelled, notify);
  }
  return { start, cancel, finish, active: () => !!drag };
}
