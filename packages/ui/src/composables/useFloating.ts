import {
  ref,
  computed,
  shallowRef,
  inject,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  watch,
  type Ref,
} from "vue";
import { useHysControlState } from "./formContext";
import { popupSize } from "../motion/popup";
import { registerOverlay, overlayOwnerKey } from "./overlayManager";
export type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";
export interface FloatingPosition {
  anchor: DOMRect;
  width: number;
  height: number;
  x: number;
  y: number;
  placement: Placement;
}
export interface FloatingAnchor {
  getBoundingClientRect(): DOMRect;
  contains(node: Node | null): boolean;
  focus(): void;
  readonly isConnected: boolean;
}
export function useFloating(
  anchor: Readonly<Ref<FloatingAnchor | undefined>>,
  panel: Ref<HTMLElement | undefined>,
  options: {
    placement?: Placement;
    gap?: number;
    padding?: number;
    matchWidth?: boolean | "min" | (() => boolean | "min");
    width?: () => number | string | undefined;
    maxWidth?: () => number | string | undefined;
    requestOpen?: (open: boolean, restoreFocus?: boolean) => boolean | void;
    closeOnTab?: boolean;
    closeOnEscape?: boolean;
    closeOnOutside?: boolean;
    autoAdjustOverflow?: boolean;
    strategy?: "fixed" | "absolute";
    zIndex?: () => number | undefined;
    onPosition?: (position: FloatingPosition) => void;
  } = {},
) {
  const { disabled } = useHysControlState({});
  const ownerVisible = inject(overlayOwnerKey, undefined);
  const open = ref(false);
  const registration = shallowRef<ReturnType<typeof registerOverlay>>();
  const restoringFocus = ref(false);
  const style = ref<Record<string, string>>({
    position: "fixed",
    top: "0px",
    left: "0px",
    visibility: "hidden",
  });
  const placement = ref<Placement>(options.placement ?? "bottom-start");
  let raf = 0,
    unregister: (() => void) | undefined,
    isTop: (() => boolean) | undefined,
    generation = 0;
  function update() {
    if (!open.value || !anchor.value || !panel.value) return;
    const a = anchor.value.getBoundingClientRect();
    if (!a.width && !a.height) {
      close();
      return;
    }
    const gap = Number.isFinite(options.gap) ? options.gap! : 8,
      pad = Number.isFinite(options.padding)
        ? Math.max(0, options.padding!)
        : 10,
      vw = document.documentElement.clientWidth,
      vh = document.documentElement.clientHeight;
    const matchedWidth = Math.min(a.width, Math.max(0, vw - 2 * pad));
    const widthMode =
      typeof options.matchWidth === "function"
        ? options.matchWidth()
        : options.matchWidth;
    const limit = options.maxWidth?.();
    const maximum =
      limit !== undefined &&
      (typeof limit !== "number" || Number.isFinite(limit))
        ? `min(${typeof limit === "number" ? Math.max(0, limit) + "px" : limit},calc(100vw - ${pad * 2}px))`
        : `calc(100vw - ${pad * 2}px)`;
    const explicitWidth = options.width?.(),
      cssWidth =
        typeof explicitWidth === "number"
          ? Number.isFinite(explicitWidth)
            ? Math.max(0, explicitWidth) + "px"
            : undefined
          : explicitWidth;
    if (cssWidth !== undefined) {
      panel.value.style.width = cssWidth;
      panel.value.style.minWidth = "0";
      panel.value.style.maxWidth = maximum;
    } else if (widthMode === true) {
      panel.value.style.width = `${matchedWidth}px`;
      panel.value.style.minWidth = "0";
      panel.value.style.maxWidth = `${matchedWidth}px`;
    }
    if (cssWidth === undefined && widthMode === "min") {
      panel.value.style.width = "max-content";
      panel.value.style.minWidth = `${matchedWidth}px`;
      panel.value.style.maxWidth = `calc(100vw - ${pad * 2}px)`;
    }
    const p = popupSize(panel.value);
    const w = Math.min(p.width, Math.max(0, vw - 2 * pad)),
      h = Math.min(p.height, Math.max(0, vh - 2 * pad));
    let place = options.placement ?? "bottom-start";
    const below = vh - a.bottom - gap,
      above = a.top - gap;
    const adjust = options.autoAdjustOverflow !== false;
    if (adjust && place.startsWith("bottom") && below < h && above > below)
      place = place.replace("bottom", "top") as Placement;
    else if (adjust && place.startsWith("top") && above < h && below > above)
      place = place.replace("top", "bottom") as Placement;
    else if (
      adjust &&
      place.startsWith("right") &&
      vw - a.right - gap < w &&
      a.left > vw - a.right
    )
      place = place.replace("right", "left") as Placement;
    else if (
      adjust &&
      place.startsWith("left") &&
      a.left - gap < w &&
      vw - a.right > a.left
    )
      place = place.replace("left", "right") as Placement;
    let x = place.endsWith("end")
      ? a.right - w
      : place.endsWith("start")
        ? a.left
        : a.left + (a.width - w) / 2;
    let y = place.startsWith("top") ? a.top - h - gap : a.bottom + gap;
    if (place.startsWith("right") || place.startsWith("left")) {
      x = place.startsWith("right") ? a.right + gap : a.left - w - gap;
      y = place.endsWith("start")
        ? a.top
        : place.endsWith("end")
          ? a.bottom - h
          : a.top + (a.height - h) / 2;
    }
    x = Math.max(pad, Math.min(x, vw - w - pad));
    y = Math.max(pad, Math.min(y, vh - h - pad));
    placement.value = place;
    options.onPosition?.({
      anchor: a,
      width: w,
      height: h,
      x,
      y,
      placement: place,
    });
    if (options.strategy === "absolute") {
      const parent = panel.value.offsetParent as HTMLElement | null;
      if (
        parent &&
        parent !== document.body &&
        parent !== document.documentElement
      ) {
        const origin = parent.getBoundingClientRect();
        x += parent.scrollLeft - origin.left - parent.clientLeft;
        y += parent.scrollTop - origin.top - parent.clientTop;
      } else {
        x += window.scrollX;
        y += window.scrollY;
      }
    }
    style.value = {
      ...(cssWidth !== undefined
        ? { width: cssWidth, minWidth: "0" }
        : widthMode === true
          ? { width: `${matchedWidth}px`, minWidth: "0" }
          : widthMode === "min"
            ? { width: "max-content", minWidth: `${matchedWidth}px` }
            : {}),
      position: options.strategy ?? "fixed",
      left: `${Math.round(x)}px`,
      top: `${Math.round(y)}px`,
      visibility: "visible",
      zIndex: "1200",
      maxWidth: maximum,
      maxHeight: `calc(100vh - ${pad * 2}px)`,
      overflowY: "auto",
      overscrollBehavior: "contain",
    };
  }
  function schedule() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }
  function outside(e: PointerEvent) {
    if (!isTop?.() || options.closeOnOutside === false) return;
    if (
      !anchor.value?.contains(e.target as Node) &&
      !panel.value?.contains(e.target as Node)
    )
      close();
  }
  function key(e: KeyboardEvent) {
    if (!open.value || !isTop?.()) return;
    if (e.key === "Escape" && options.closeOnEscape !== false) {
      e.preventDefault();
      e.stopImmediatePropagation();
      close(true);
    } else if (e.key === "Tab" && options.closeOnTab !== false) {
      const focused = document.activeElement;
      if (anchor.value?.contains(focused)) {
        close();
        return;
      }
      if (panel.value?.contains(focused)) {
        const buttons = Array.from(
          panel.value.querySelectorAll<HTMLElement>(
            'a[href],button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])',
          ),
        ).filter(
          (element) =>
            element.getClientRects().length && !element.closest("[inert]"),
        );
        if (
          !buttons.length ||
          focused === (e.shiftKey ? buttons[0] : buttons.at(-1))
        )
          close(true);
      }
    }
  }
  function detach() {
    document.removeEventListener("pointerdown", outside, true);
    document.removeEventListener("keydown", key, true);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("scroll", schedule, true);
    window.visualViewport?.removeEventListener("resize", schedule);
    window.visualViewport?.removeEventListener("scroll", schedule);
    cancelAnimationFrame(raf);
    unregister?.();
    unregister = undefined;
    registration.value = undefined;
    isTop = undefined;
  }
  function close(restore = false, force = false) {
    if (!force && open.value && options.requestOpen?.(false, restore) === false)
      return;
    generation++;
    if (!open.value) return;
    open.value = false;
    detach();
    if (restore && anchor.value?.isConnected) {
      restoringFocus.value = true;
      try {
        anchor.value.focus();
      } finally {
        restoringFocus.value = false;
      }
    }
  }
  async function show(force = false) {
    if (disabled.value || ownerVisible?.value === false) return;
    if (open.value) {
      schedule();
      return;
    }
    if (!force && options.requestOpen?.(true) === false) return;
    const token = ++generation;
    open.value = true;
    style.value = {
      position: "fixed",
      top: "0px",
      left: "0px",
      visibility: "hidden",
    };
    await nextTick();
    if (token !== generation || !open.value) return;
    const entry = registerOverlay(
      "floating",
      () => close(true),
      options.zIndex,
    );
    registration.value = entry;
    unregister = entry.unregister;
    isTop = entry.isTop;
    update();
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", key, true);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
  }
  function toggle() {
    return open.value ? close() : show();
  }
  watch(
    disabled,
    (value) => {
      if (value) close(false, true);
    },
    { flush: "sync" },
  );
  onDeactivated(() => close(false, true));
  watch(
    () => ownerVisible?.value,
    (value) => {
      if (value === false) close(false, true);
    },
    { flush: "sync" },
  );
  onBeforeUnmount(() => {
    generation++;
    detach();
  });
  return {
    open,
    style: computed(() => ({
      ...style.value,
      zIndex: String(registration.value?.zIndex.value ?? 1200),
    })),
    placement,
    update,
    show,
    close,
    toggle,
    restoringFocus,
    schedule,
    isTop: () => isTop?.() ?? false,
  };
}
