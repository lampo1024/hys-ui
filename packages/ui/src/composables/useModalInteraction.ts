import {
  computed,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
  type Ref,
} from "vue";
import {
  modalLength,
  modalWidth,
  type HysModalProps,
  type HysModalPosition,
  type HysModalSize,
} from "./modal";
export function useModalInteraction(
  props: HysModalProps,
  dialog: Ref<HTMLElement | undefined>,
  visible: Readonly<Ref<boolean>>,
  fullscreen: Readonly<Ref<boolean>>,
  emit: (name: string, ...args: any[]) => void,
  options: { beforeStart?: () => void; motion?: () => boolean } = {},
) {
  const position = shallowRef<HysModalPosition>({ x: 0, y: 0 }),
    dimensions = shallowRef<HysModalSize>(),
    dragging = ref(false),
    resizing = ref(false),
    pressed = ref(false),
    previewing = ref(false),
    previewLayer = ref<HTMLElement>();
  let frame = 0,
    releaseAnimation: Animation | undefined,
    live = true,
    gesture:
      | {
          kind: "drag" | "resize";
          pointerId: number;
          startX: number;
          startY: number;
          x: number;
          y: number;
          position: HysModalPosition;
          size: HysModalSize;
          dimensions: HysModalSize | undefined;
          previewPosition: HysModalPosition;
          previewDimensions: HysModalSize | undefined;
          screen: { width: number; height: number };
          bounds: ReturnType<typeof sizeBounds>;
          dirty: boolean;
          preview: boolean;
          activated: boolean;
          box: DOMRect;
          handleBoxes: DOMRect[] | undefined;
          target: HTMLElement;
        }
      | undefined;
  const finite = (value: number, fallback = 0) =>
    Number.isFinite(value) ? value : fallback;
  function resetPosition() {
    if (
      !gesture &&
      releaseAnimation &&
      position.value.x === 0 &&
      position.value.y === 0
    )
      return;
    stop(true);
    const from = position.value;
    position.value = { x: 0, y: 0 };
    paint(position.value, undefined, false, true);
    animateRelease(from, position.value);
  }
  function resetSize() {
    if (!gesture && releaseAnimation && dimensions.value === undefined) return;
    stop(true);
    const element = dialog.value,
      changed = dimensions.value !== undefined;
    const from =
      changed && live && visible.value && !fullscreen.value
        ? element?.getBoundingClientRect()
        : undefined;
    dimensions.value = undefined;
    if (!changed || fullscreen.value) return;
    paint(position.value, undefined, true, true);
    if (from && element && canAnimate()) {
      const to = element.getBoundingClientRect();
      if (to.width > 0 && to.height > 0) {
        const base = `translate3d(${position.value.x}px,${position.value.y}px,0)`;
        runAnimation([
          {
            transformOrigin: "0 0",
            transform: `translate(${from.left - to.left}px,${from.top - to.top}px) ${base} scale(${from.width / to.width},${from.height / to.height})`,
          },
          { transformOrigin: "0 0", transform: base },
        ]);
      }
    }
  }
  const viewport = () => ({
    width:
      dialog.value?.parentElement?.clientWidth ||
      document.documentElement.clientWidth ||
      window.innerWidth,
    height:
      dialog.value?.parentElement?.clientHeight ||
      document.documentElement.clientHeight ||
      window.innerHeight,
  });
  function bounded(
    next: HysModalPosition,
    box: DOMRect,
    original = position.value,
    screen = viewport(),
    handleBoxes?: readonly DOMRect[],
  ) {
    if (props.overflow) {
      if (props.keepHandleVisible === false) return next;
      const handles =
        handleBoxes ?? moveHandles().map((el) => el.getBoundingClientRect());
      if (handles.length) {
        let maxLeft = -Infinity,
          minRight = Infinity,
          minTop = Infinity,
          maxBottom = -Infinity;
        for (const handle of handles) {
          maxLeft = Math.max(maxLeft, handle.left);
          minRight = Math.min(minRight, handle.right);
          minTop = Math.min(minTop, handle.top);
          maxBottom = Math.max(maxBottom, handle.bottom);
        }
        return {
          x: Math.max(
            8 - maxLeft + original.x,
            Math.min(screen.width - 8 - minRight + original.x, next.x),
          ),
          y: Math.max(
            8 - minTop + original.y,
            Math.min(screen.height - 8 - maxBottom + original.y, next.y),
          ),
        };
      }
      return next;
    }
    const { width, height } = screen,
      minX = 8 - box.left + original.x,
      maxX = width - 8 - box.right + original.x,
      minY = 8 - box.top + original.y,
      maxY = height - 8 - box.bottom + original.y;
    return {
      x:
        minX > maxX
          ? (minX + maxX) / 2
          : Math.max(minX, Math.min(maxX, next.x)),
      y:
        minY > maxY
          ? Math.max(
              minY,
              Math.min(next.y, minY + Math.max(0, box.height - 40)),
            )
          : Math.max(minY, Math.min(maxY, next.y)),
    };
  }
  function setPosition(next: HysModalPosition) {
    if (!live || !visible.value || fullscreen.value || !dialog.value) return;
    stop(true);
    position.value = bounded(
      { x: finite(next.x), y: finite(next.y) },
      dialog.value.getBoundingClientRect(),
    );
    paint(position.value, undefined, false, true);
  }
  function sizeBounds(box?: DOMRect, screen = viewport()) {
    const width = props.overflow
        ? Math.max(240, props.maxWidth ?? 6000)
        : Math.max(0, screen.width - (box?.left ?? 8) - 8),
      height = props.overflow
        ? 6000
        : Math.max(0, screen.height - (box?.top ?? 8) - 8);
    const maxWidth = Math.min(
      width,
      Math.max(120, finite(props.maxWidth ?? width, width)),
    );
    const numericMaxHeight =
      typeof props.maxHeight === "number"
        ? props.maxHeight
        : typeof props.maxHeight === "string" &&
            /^\d+(\.\d+)?px$/.test(props.maxHeight)
          ? parseFloat(props.maxHeight)
          : height;
    const maxHeight = Math.min(
      height,
      Math.max(0, finite(numericMaxHeight, height)),
    );
    return {
      minWidth: Math.min(
        maxWidth,
        Math.max(120, finite(props.minWidth ?? 280, 280)),
      ),
      maxWidth,
      minHeight: Math.min(
        maxHeight,
        Math.max(80, finite(props.minHeight ?? 160, 160)),
      ),
      maxHeight,
    };
  }
  function setSize(next: HysModalSize) {
    if (!live || !visible.value || fullscreen.value) return;
    stop(true);
    const b = sizeBounds();
    dimensions.value = {
      width: Math.max(
        b.minWidth,
        Math.min(b.maxWidth, finite(next.width, b.minWidth)),
      ),
      height: Math.max(
        b.minHeight,
        Math.min(b.maxHeight, finite(next.height, b.minHeight)),
      ),
    };
    void nextTick(clampViewport);
  }
  function flush() {
    frame = 0;
    const current = gesture;
    if (!current || !live || !visible.value || !current.dirty) return;
    current.dirty = false;
    const dx = current.x - current.startX,
      dy = current.y - current.startY;
    if (current.kind === "drag") {
      current.previewPosition = bounded(
        { x: current.position.x + dx, y: current.position.y + dy },
        current.box,
        current.position,
        current.screen,
        current.handleBoxes,
      );
      paint(current.previewPosition);
      emit("drag", current.previewPosition);
    } else {
      const b = current.bounds,
        next = {
          width: Math.max(
            b.minWidth,
            Math.min(b.maxWidth, current.size.width + dx),
          ),
          height: Math.max(
            b.minHeight,
            Math.min(b.maxHeight, current.size.height + dy),
          ),
        };
      current.previewDimensions = next;
      current.previewPosition = {
        x: current.position.x + (next.width - current.size.width) / 2,
        y:
          current.position.y +
          (props.centered === false
            ? 0
            : (next.height - current.size.height) / 2),
      };
      paint(current.previewPosition, next, true);
      emit("resize", next);
    }
  }
  // Pointer updates touch only this layer. Commit Vue state once when the gesture ends.
  function paint(
    next: HysModalPosition,
    size?: HysModalSize,
    resize = false,
    force = false,
  ) {
    if (!force && !resize && gesture?.preview) {
      if (previewLayer.value)
        previewLayer.value.style.transform = `translate3d(${next.x - gesture.position.x}px,${next.y - gesture.position.y}px,0)`;
      return;
    }
    const element = dialog.value;
    if (!element) return;
    element.style.setProperty("--hys-ui-modal-x", next.x + "px");
    element.style.setProperty("--hys-ui-modal-y", next.y + "px");
    if (resize) {
      element.style.width = modalLength(size?.width ?? modalWidth(props)) ?? "";
      element.style.height = modalLength(size?.height ?? props.height) ?? "";
    }
  }
  function cancelRelease() {
    releaseAnimation?.cancel();
    releaseAnimation = undefined;
  }
  function canAnimate() {
    return (
      live &&
      visible.value &&
      !fullscreen.value &&
      options.motion?.() !== false &&
      !!dialog.value?.animate
    );
  }
  function runAnimation(frames: Keyframe[]) {
    cancelRelease();
    const element = dialog.value;
    if (!canAnimate() || !element) return;
    const animation = element.animate(frames, {
      duration: Math.max(0, Math.min(1000, props.transitionDuration ?? 200)),
      easing: "cubic-bezier(.22,1,.36,1)",
    });
    releaseAnimation = animation;
    animation.onfinish = () => {
      if (releaseAnimation === animation) {
        releaseAnimation = undefined;
        void nextTick(clampViewport);
      }
    };
    animation.oncancel = () => {
      if (releaseAnimation === animation) releaseAnimation = undefined;
    };
  }
  function animateRelease(from: HysModalPosition, to: HysModalPosition) {
    cancelRelease();
    const element = dialog.value;
    if (
      !live ||
      !visible.value ||
      fullscreen.value ||
      options.motion?.() === false ||
      !element?.animate ||
      (from.x === to.x && from.y === to.y)
    )
      return;
    const transform = (p: HysModalPosition) =>
      `translate3d(${p.x}px,${p.y}px,0)`;
    runAnimation([
      { transform: transform(from) },
      { transform: transform(to) },
    ]);
  }
  function move(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (event.pointerType !== "touch" && event.buttons === 0) {
      stop(true);
      return;
    }
    if (!gesture.activated) {
      if (
        Math.hypot(
          event.clientX - gesture.startX,
          event.clientY - gesture.startY,
        ) < threshold()
      )
        return;
      activateGesture(gesture);
    }
    event.preventDefault();
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    gesture.dirty = true;
    if (!frame) frame = requestAnimationFrame(flush);
  }
  function stop(cancel = false) {
    if (!gesture) {
      if (cancel) cancelRelease();
      return;
    }
    cancelAnimationFrame(frame);
    frame = 0;
    const current = gesture;
    if (!cancel && current.activated) flush();
    const nextPosition = cancel ? current.position : current.previewPosition;
    const nextSize = cancel ? current.dimensions : current.previewDimensions;
    if (current.activated)
      paint(nextPosition, nextSize, current.kind === "resize", true);
    if (!cancel && current.preview && current.activated)
      animateRelease(current.position, nextPosition);
    if (current.activated) position.value = nextPosition;
    if (current.kind === "resize" && current.activated)
      dimensions.value = nextSize;
    gesture = undefined;
    dragging.value = false;
    resizing.value = false;
    pressed.value = false;
    previewing.value = false;
    document.removeEventListener("pointermove", move, true);
    document.removeEventListener("pointerup", up, true);
    document.removeEventListener("pointercancel", cancelPointer, true);
    window.removeEventListener("blur", cancelPointer);
    current.target.removeEventListener("lostpointercapture", cancelPointer);
    try {
      current.target.releasePointerCapture?.(current.pointerId);
    } catch {}
    if (
      current.activated &&
      !cancel &&
      current.kind === "drag" &&
      live &&
      visible.value
    ) {
      const screen = viewport(),
        inView = (el: HTMLElement) => {
          const b = el.getBoundingClientRect();
          return (
            b.left >= 0 &&
            b.right <= screen.width &&
            b.top >= 0 &&
            b.bottom <= screen.height
          );
        };
      if (!inView(current.target))
        moveHandles().find(inView)?.focus({ preventScroll: true });
    }
    if (current.activated)
      emit(
        current.kind === "drag" ? "dragEnd" : "resizeEnd",
        current.kind === "drag"
          ? position.value
          : (dimensions.value ?? current.size),
        { cancelled: cancel },
      );
  }
  function up(event: PointerEvent) {
    if (gesture && event.pointerId === gesture.pointerId) {
      if (
        !gesture.activated &&
        Math.hypot(
          event.clientX - gesture.startX,
          event.clientY - gesture.startY,
        ) >= threshold()
      )
        activateGesture(gesture);
      gesture.x = event.clientX;
      gesture.y = event.clientY;
      gesture.dirty = true;
      stop();
    }
  }
  function cancelPointer() {
    stop(true);
  }
  const threshold = () =>
    Number.isFinite(props.dragThreshold)
      ? Math.max(0, props.dragThreshold!)
      : 6;
  function activateGesture(current: NonNullable<typeof gesture>) {
    if (current.activated) return;
    current.activated = true;
    pressed.value = false;
    dragging.value = current.kind === "drag";
    resizing.value = current.kind === "resize";
    previewing.value = current.preview;
    if (current.preview)
      void nextTick(() => {
        if (gesture !== current || !previewLayer.value) return;
        Object.assign(previewLayer.value.style, {
          left: current.box.left + "px",
          top: current.box.top + "px",
          width: current.box.width + "px",
          height: current.box.height + "px",
        });
        paint(current.previewPosition);
      });
    current.target.focus({ preventScroll: true });
    try {
      current.target.setPointerCapture?.(current.pointerId);
    } catch {}
    current.target.addEventListener("lostpointercapture", cancelPointer);
    emit(
      current.kind === "drag" ? "dragStart" : "resizeStart",
      current.kind === "drag" ? position.value : current.size,
    );
  }
  function start(event: PointerEvent, kind: "drag" | "resize") {
    if (
      !live ||
      !visible.value ||
      fullscreen.value ||
      event.button !== 0 ||
      !dialog.value ||
      (kind === "drag" && !props.draggable) ||
      (kind === "resize" && !props.resizable)
    )
      return;
    if (
      kind === "drag" &&
      (event.target as Element).closest(
        'button,a,input,select,textarea,[contenteditable="true"],[data-hys-modal-no-drag]',
      ) &&
      !(event.currentTarget as HTMLElement).hasAttribute(
        "data-hys-modal-drag-handle",
      )
    )
      return;
    stop(true);
    options.beforeStart?.();
    const box = dialog.value.getBoundingClientRect(),
      screen = viewport(),
      target = event.currentTarget as HTMLElement;
    gesture = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      position: { ...position.value },
      size: { width: box.width, height: box.height },
      dimensions: dimensions.value ? { ...dimensions.value } : undefined,
      previewPosition: { ...position.value },
      previewDimensions: dimensions.value,
      screen,
      bounds: sizeBounds(box, screen),
      dirty: false,
      preview: kind === "drag" && props.dragMode === "preview",
      activated: false,
      box,
      handleBoxes: props.overflow
        ? moveHandles().map((el) => el.getBoundingClientRect())
        : undefined,
      target,
    };
    pressed.value = kind === "drag" && threshold() > 0;
    if (!pressed.value) {
      event.preventDefault();
      activateGesture(gesture);
    }
    document.addEventListener("pointermove", move, {
      capture: true,
      passive: false,
    });
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", cancelPointer, true);
    window.addEventListener("blur", cancelPointer);
  }
  function headerKey(event: KeyboardEvent) {
    if (
      !live ||
      !visible.value ||
      fullscreen.value ||
      !props.draggable ||
      !event.altKey ||
      event.target !== event.currentTarget ||
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    const amount = event.shiftKey ? 50 : 10;
    emit("dragStart", position.value);
    if (event.key === "Home") resetPosition();
    else
      setPosition({
        x:
          position.value.x +
          (event.key === "ArrowRight"
            ? amount
            : event.key === "ArrowLeft"
              ? -amount
              : 0),
        y:
          position.value.y +
          (event.key === "ArrowDown"
            ? amount
            : event.key === "ArrowUp"
              ? -amount
              : 0),
      });
    emit("drag", position.value);
    emit("dragEnd", position.value, { cancelled: false });
  }
  function resizeKey(event: KeyboardEvent) {
    if (
      !live ||
      !visible.value ||
      fullscreen.value ||
      !props.resizable ||
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        event.key,
      ) ||
      !dialog.value
    )
      return;
    event.preventDefault();
    const box = dialog.value.getBoundingClientRect(),
      size = dimensions.value ?? { width: box.width, height: box.height },
      amount = event.shiftKey ? 50 : 10;
    emit("resizeStart", size);
    if (event.key === "Home") resetSize();
    else
      setSize({
        width:
          size.width +
          (event.key === "ArrowRight"
            ? amount
            : event.key === "ArrowLeft"
              ? -amount
              : 0),
        height:
          size.height +
          (event.key === "ArrowDown"
            ? amount
            : event.key === "ArrowUp"
              ? -amount
              : 0),
      });
    emit("resize", dimensions.value ?? size);
    emit("resizeEnd", dimensions.value ?? size, { cancelled: false });
  }
  function clampViewport() {
    if (
      !live ||
      !visible.value ||
      fullscreen.value ||
      !dialog.value ||
      gesture ||
      releaseAnimation
    )
      return;
    const next = bounded(position.value, dialog.value.getBoundingClientRect());
    if (next.x !== position.value.x || next.y !== position.value.y) {
      position.value = next;
      paint(next, undefined, false, true);
    }
  }
  function cleanup() {
    live = false;
    stop(true);
    window.removeEventListener("resize", resizeViewport);
    cancelAnimationFrame(frame);
  }
  watch([visible, fullscreen], () => {
    if (!visible.value || fullscreen.value) stop(true);
    else void nextTick(clampViewport);
  });
  watch(
    () => props.dragMode,
    () => stop(true),
  );
  watch(
    [
      () => props.keepHandleVisible,
      () => props.overflow,
      () => props.headerSize,
      () => props.headerHeight,
    ],
    () => {
      stop(true);
      void nextTick(clampViewport);
    },
  );
  watch(
    () => options.motion?.(),
    (value) => {
      if (value === false) cancelRelease();
    },
  );
  watch([() => props.width, () => props.height, () => props.size], () => {
    stop(true);
    resetSize();
    void nextTick(clampViewport);
  });
  function resizeViewport() {
    stop(true);
    clampViewport();
  }
  function moveHandles() {
    return [
      ...(dialog.value?.querySelectorAll<HTMLElement>(
        ":scope > .hys-ui-dialog-head [data-hys-modal-drag-handle]",
      ) ?? []),
    ];
  }
  onMounted(() => window.addEventListener("resize", resizeViewport));
  onDeactivated(cleanup);
  onBeforeUnmount(cleanup);
  return {
    position,
    dimensions,
    previewing,
    previewLayer,
    getPosition: () => gesture?.previewPosition ?? position.value,
    getDimensions: () => gesture?.previewDimensions ?? dimensions.value,
    dragging,
    resizing,
    gesturing: computed(
      () => pressed.value || dragging.value || resizing.value,
    ),
    start,
    stop,
    headerKey,
    resizeKey,
    resetPosition,
    resetSize,
    setPosition,
    setSize,
    clampViewport,
    activate() {
      live = true;
      window.addEventListener("resize", resizeViewport);
    },
  };
}
