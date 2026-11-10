import {
  computed,
  nextTick,
  onMounted,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
  type Ref,
} from "vue";
import { useChoiceModel } from "./choiceModel";
import {
  drawerVertical,
  type HysDrawerProps,
  type HysDrawerResizeOptions,
  type HysDrawerResizeInfo,
} from "./drawer";
export function useDrawerResize(
  props: HysDrawerProps,
  root: Ref<HTMLElement | undefined>,
  panel: Ref<HTMLElement | undefined>,
  shown: Readonly<Ref<boolean>>,
  fullscreen: Readonly<Ref<boolean>>,
  busy: Readonly<Ref<boolean>>,
  emit: (name: string, ...args: any[]) => void,
) {
  const model = useChoiceModel<number | null>(
    {
      get modelValue() {
        return props.resizeValue;
      },
    },
    () =>
      Number.isFinite(props.defaultResizeValue)
        ? Math.max(0, props.defaultResizeValue!)
        : null,
  );
  const resizing = ref(false),
    measured = ref(0),
    extent = ref(0),
    handle = ref<HTMLElement>(),
    vertical = computed(() => drawerVertical(props.placement));
  const resolvedSize = computed(() => {
      const value = model.current.value;
      if (typeof value !== "number" || !Number.isFinite(value)) return;
      const bounds = limits();
      return Math.max(bounds.min, Math.min(bounds.max, value));
    }),
    size = computed(() => resolvedSize.value ?? measured.value);
  const config = computed<HysDrawerResizeOptions>(() =>
    typeof props.resizable === "object" ? props.resizable : {},
  );
  const allowed = computed(
    () => shown.value && !fullscreen.value && !busy.value,
  );
  let live = true,
    frame = 0,
    measureFrame = 0,
    observer: ResizeObserver | undefined;
  type Gesture = {
    id: number;
    start: number;
    size: number;
    value: number;
    last: number;
    min: number;
    max: number;
    axis: "width" | "height";
    sign: number;
    target: HTMLElement;
    style: string;
    cursor: string;
    selection: string;
    activated: boolean;
  };
  let gesture: Gesture | undefined;
  function length(
    value: number | string | undefined,
    available: number,
  ): number | undefined {
    if (typeof value === "number")
      return Number.isFinite(value) ? value : undefined;
    if (
      typeof value !== "string" ||
      !/^\s*\d+(?:\.\d+)?(?:px|%)?\s*$/.test(value)
    )
      return;
    const number = parseFloat(value);
    return value.trim().endsWith("%") ? (available * number) / 100 : number;
  }
  function available() {
    const box = root.value?.getBoundingClientRect();
    const actual = vertical.value ? box?.height : box?.width;
    return Math.max(
      1,
      (actual && actual > 0 ? actual : undefined) ??
        (vertical.value
          ? document.documentElement.clientHeight || window.innerHeight
          : document.documentElement.clientWidth || window.innerWidth),
    );
  }
  function limits(availableSize = extent.value || available()) {
    const max = Math.max(
        1,
        Math.min(
          availableSize,
          length(config.value.maxSize, availableSize) ?? availableSize,
        ),
      ),
      min = Math.min(
        max,
        Math.max(1, length(config.value.minSize, availableSize) ?? 160),
      );
    return { min, max };
  }
  function measure() {
    if (!live || !shown.value || gesture || !panel.value) return;
    extent.value = available();
    const box = panel.value.getBoundingClientRect();
    measured.value = vertical.value ? box.height : box.width;
  }
  function scheduleMeasure() {
    if (measureFrame) cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(() => {
      measureFrame = 0;
      measure();
    });
  }
  function paint() {
    frame = 0;
    const g = gesture;
    if (!g || !g.activated || !panel.value) return;
    if (g.last === g.value) return;
    g.last = g.value;
    panel.value.style[g.axis] = g.value + "px";
    handle.value?.setAttribute("aria-valuenow", String(Math.round(g.value)));
    emit("resize", g.value);
  }
  function detach() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
    window.removeEventListener("blur", cancel);
    window.removeEventListener("keydown", escape, true);
  }
  async function commit(value: number | null) {
    if (!live || !allowed.value) return false;
    if (value === model.current.value) return true;
    const accepted = await model.commit(
      value,
      (next) => emit("update:resizeValue", next),
      () => {},
    );
    return accepted && live && allowed.value;
  }
  async function stop(cancelled = false) {
    const g = gesture;
    if (!g) return false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    const notify = !cancelled && g.activated && g.last !== g.value;
    gesture = undefined;
    resizing.value = false;
    detach();
    document.documentElement.style.cursor = g.cursor;
    document.documentElement.style.userSelect = g.selection;
    try {
      if (g.target.hasPointerCapture?.(g.id))
        g.target.releasePointerCapture(g.id);
    } catch {}
    if (panel.value) {
      panel.value.style[g.axis] = g.style;
    }
    if (notify) emit("resize", g.value);
    const accepted = !cancelled && g.activated ? await commit(g.value) : false;
    if (g.activated) {
      await nextTick();
      if (live) {
        measure();
        emit("resizeEnd", cancelled || !accepted ? size.value : g.value, {
          placement: props.placement ?? "right",
          cancelled,
          accepted,
        } satisfies HysDrawerResizeInfo);
      }
    }
    return accepted;
  }
  function cancel() {
    void stop(true);
  }
  function escape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      cancel();
    } else if (event.key === "Tab") cancel();
  }
  function move(event: PointerEvent) {
    const g = gesture;
    if (!g || event.pointerId !== g.id) return;
    const delta =
      ((g.axis === "width" ? event.clientX : event.clientY) - g.start) * g.sign;
    if (!g.activated) {
      if (Math.abs(delta) < 4) return;
      g.activated = true;
      resizing.value = true;
      emit("resizeStart", g.size);
      if (gesture !== g) return;
    }
    g.value = Math.max(g.min, Math.min(g.max, g.size + delta));
    if (!frame) frame = requestAnimationFrame(paint);
  }
  function up(event: PointerEvent) {
    if (gesture && event.pointerId === gesture.id) void stop(false);
  }
  function start(event: PointerEvent) {
    if (
      !props.resizable ||
      !allowed.value ||
      !live ||
      event.button !== 0 ||
      event.isPrimary === false ||
      !panel.value
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    void stop(true);
    const availableSize = available(),
      bounds = limits(availableSize),
      box = panel.value.getBoundingClientRect(),
      axis = vertical.value ? "height" : "width",
      target = event.currentTarget as HTMLElement,
      base = axis === "width" ? box.width : box.height;
    extent.value = availableSize;
    measured.value = base;
    gesture = {
      id: event.pointerId,
      start: axis === "width" ? event.clientX : event.clientY,
      size: base,
      value: base,
      last: base,
      ...bounds,
      axis,
      sign:
        props.placement === "right" || props.placement === "bottom" ? -1 : 1,
      target,
      style: panel.value.style[axis],
      cursor: document.documentElement.style.cursor,
      selection: document.documentElement.style.userSelect,
      activated: false,
    };
    target.focus({ preventScroll: true });
    try {
      target.setPointerCapture(event.pointerId);
    } catch {}
    document.documentElement.style.cursor = vertical.value
      ? "ns-resize"
      : "ew-resize";
    document.documentElement.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", escape, true);
  }
  async function resizeTo(value: number | string) {
    if (!live || !allowed.value) return false;
    const availableSize = available(),
      raw = length(value, availableSize);
    if (raw === undefined) return false;
    const bounds = limits(availableSize),
      next = Math.max(bounds.min, Math.min(bounds.max, raw));
    extent.value = availableSize;
    return commit(next);
  }
  async function reset() {
    if (gesture) await stop(true);
    return commit(null);
  }
  async function keyboard(event: KeyboardEvent) {
    if (
      !props.resizable ||
      !allowed.value ||
      event.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    const keys = vertical.value
      ? ["ArrowUp", "ArrowDown"]
      : ["ArrowLeft", "ArrowRight"];
    if (![...keys, "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    measure();
    const bounds = limits(),
      step = Number.isFinite(config.value.step)
        ? Math.max(1, config.value.step!)
        : 10,
      positive =
        props.placement === "left"
          ? "ArrowRight"
          : props.placement === "right"
            ? "ArrowLeft"
            : props.placement === "top"
              ? "ArrowDown"
              : "ArrowUp";
    const next =
      event.key === "Home"
        ? bounds.min
        : event.key === "End"
          ? bounds.max
          : size.value +
            (event.key === positive ? 1 : -1) *
              step *
              (event.shiftKey ? 10 : 1);
    emit("resizeStart", size.value);
    const accepted = await resizeTo(next);
    if (live) {
      measure();
      emit("resize", size.value);
      emit("resizeEnd", size.value, {
        placement: props.placement ?? "right",
        cancelled: false,
        accepted,
      } satisfies HysDrawerResizeInfo);
    }
  }
  function viewport() {
    cancel();
    scheduleMeasure();
  }
  function observeRoot() {
    observer?.disconnect();
    observer = undefined;
    if (
      live &&
      shown.value &&
      typeof ResizeObserver !== "undefined" &&
      root.value &&
      props.contained
    ) {
      observer = new ResizeObserver(viewport);
      observer.observe(root.value);
    }
  }
  function attach() {
    if (!live || !shown.value) return;
    window.addEventListener("resize", viewport);
    window.visualViewport?.addEventListener("resize", viewport);
    observeRoot();
    scheduleMeasure();
  }
  function detachViewport() {
    observer?.disconnect();
    observer = undefined;
    window.removeEventListener("resize", viewport);
    window.visualViewport?.removeEventListener("resize", viewport);
    cancelAnimationFrame(measureFrame);
    measureFrame = 0;
  }
  function cleanup() {
    live = false;
    void stop(true);
    detachViewport();
  }
  watch(
    () => [props.placement, props.width, props.height, props.size],
    () => {
      cancel();
      if (props.resizeValue === undefined) model.reset();
      void nextTick(scheduleMeasure);
    },
  );
  watch(
    () => props.resizeValue,
    () => {
      cancel();
      scheduleMeasure();
    },
  );
  watch([allowed, () => props.resizable], () => {
    if (!allowed.value || !props.resizable) cancel();
  });
  watch(
    () => [config.value.minSize, config.value.maxSize],
    () => {
      cancel();
      scheduleMeasure();
    },
  );
  watch(shown, (value) => {
    if (value) void nextTick(attach);
    else {
      cancel();
      detachViewport();
    }
  });
  watch([root, () => props.contained], observeRoot, { flush: "post" });
  onMounted(attach);
  onActivated(() => {
    live = true;
    attach();
  });
  onDeactivated(cleanup);
  onBeforeUnmount(cleanup);
  return {
    handle,
    resizing,
    size,
    vertical,
    limits,
    model,
    resolvedSize,
    start,
    stop,
    keyboard,
    resizeTo,
    reset,
    measure,
    resetAfterClose: () => {
      if (props.resetSizeOnClose !== false && props.resizeValue === undefined)
        model.reset();
    },
  };
}
