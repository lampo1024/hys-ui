import {
  computed,
  onMounted,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
  type Ref,
} from "vue";

export function useGanttLabelResize(options: {
  width: () => number;
  min: () => number;
  max: () => number;
  enabled: () => boolean;
  available: Ref<number>;
  live: () => boolean;
  start: () => void;
  update: (width: number) => void;
  commit: (width: number) => void;
}) {
  const valid = (value: number, fallback: number) =>
    Number.isFinite(value) && value > 0 ? value : fallback;
  const initial = valid(options.width(), 270);
  const local = ref(initial),
    resizing = ref(false);
  const maximum = computed(() =>
    Math.floor(
      Math.min(
        Math.max(valid(options.min(), 120), valid(options.max(), 600)),
        options.available.value > 0
          ? Math.max(
              40,
              options.available.value -
                Math.max(80, Math.min(160, options.available.value / 2)),
            )
          : Infinity,
      ),
    ),
  );
  const minimum = computed(() =>
    Math.min(valid(options.min(), 120), maximum.value),
  );
  const clamp = (value: number) =>
    Math.round(Math.min(maximum.value, Math.max(minimum.value, value)));
  const width = computed(() => clamp(local.value));
  watch(options.width, (value) => (local.value = valid(value, 270)));
  let capture:
    | { element: HTMLElement; pointerId: number; x: number; width: number }
    | undefined;
  let frame: number | undefined,
    pending = initial;
  const set = (value: number) => {
    const next = clamp(value);
    if (next === width.value) return;
    local.value = next;
    options.update(next);
  };
  function flush() {
    frame = undefined;
    if (capture && options.live()) set(pending);
  }
  function release() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    const current = capture;
    capture = undefined;
    resizing.value = false;
    if (current?.element.hasPointerCapture?.(current.pointerId))
      current.element.releasePointerCapture(current.pointerId);
  }
  function cancel() {
    const previous = capture?.width;
    release();
    if (previous !== undefined) set(previous);
  }
  function down(event: PointerEvent) {
    if (!options.enabled() || !options.live() || event.button !== 0) return;
    options.start();
    release();
    const element = event.currentTarget as HTMLElement;
    capture = {
      element,
      pointerId: event.pointerId,
      x: event.clientX,
      width: width.value,
    };
    pending = width.value;
    resizing.value = true;
    element.setPointerCapture(event.pointerId);
    element.focus({ preventScroll: true });
  }
  function move(event: PointerEvent) {
    if (!capture || event.pointerId !== capture.pointerId) return;
    pending = capture.width + event.clientX - capture.x;
    if (frame === undefined) frame = requestAnimationFrame(flush);
  }
  function up(event: PointerEvent) {
    if (!capture || event.pointerId !== capture.pointerId) return;
    if (event.type === "pointercancel") {
      cancel();
      return;
    }
    const previous = capture.width;
    pending = previous + event.clientX - capture.x;
    if (frame !== undefined) cancelAnimationFrame(frame);
    flush();
    release();
    if (width.value !== previous) options.commit(width.value);
  }
  function key(event: KeyboardEvent) {
    if (event.key === "Escape" && capture) {
      event.preventDefault();
      event.stopPropagation();
      cancel();
      return;
    }
    if (
      !options.enabled() ||
      !options.live() ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    options.start();
    const previous = width.value,
      step = event.shiftKey ? 50 : 10;
    set(
      event.key === "Home"
        ? minimum.value
        : event.key === "End"
          ? maximum.value
          : previous + (event.key === "ArrowLeft" ? -step : step),
    );
    if (width.value !== previous) options.commit(width.value);
  }
  function reset() {
    if (!options.enabled() || !options.live()) return;
    options.start();
    cancel();
    const previous = width.value;
    set(initial);
    if (width.value !== previous) options.commit(width.value);
  }
  watch(options.enabled, (enabled) => {
    if (!enabled) cancel();
  });
  const attach = () => window.addEventListener("blur", cancel);
  const detach = () => {
    window.removeEventListener("blur", cancel);
    cancel();
  };
  onMounted(attach);
  onActivated(attach);
  onDeactivated(detach);
  onBeforeUnmount(() => {
    window.removeEventListener("blur", cancel);
    release();
  });
  return {
    width,
    minimum,
    maximum,
    resizing,
    down,
    move,
    up,
    cancel,
    key,
    reset,
  };
}
