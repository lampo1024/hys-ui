import {
  ref,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  watch,
  type Ref,
} from "vue";
import { useHysControlState } from "./formContext";
import { registerOverlay } from "./overlayManager";
export type Placement =
  "bottom-start" | "bottom-end" | "top-start" | "top-end" | "right" | "left";
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
    requestOpen?: (open: boolean) => boolean | void;
  } = {},
) {
  const { disabled } = useHysControlState({});
  const open = ref(false);
  const restoringFocus = ref(false);
  const style = ref<Record<string, string>>({
    position: "fixed",
    top: "0px",
    left: "0px",
    visibility: "hidden",
  });
  const placement = ref<Placement>(options.placement ?? "bottom-start");
  const gap = options.gap ?? 8,
    pad = options.padding ?? 10;
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
    const vw = document.documentElement.clientWidth,
      vh = document.documentElement.clientHeight;
    const matchedWidth = Math.min(a.width, Math.max(0, vw - 2 * pad));
    const widthMode =
      typeof options.matchWidth === "function"
        ? options.matchWidth()
        : options.matchWidth;
    const explicitWidth = options.width?.(),
      cssWidth =
        typeof explicitWidth === "number"
          ? Math.max(0, explicitWidth) + "px"
          : explicitWidth;
    if (cssWidth !== undefined) {
      panel.value.style.width = cssWidth;
      panel.value.style.minWidth = "0";
      panel.value.style.maxWidth = `calc(100vw - ${pad * 2}px)`;
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
    const p = panel.value.getBoundingClientRect();
    const w = Math.min(p.width, Math.max(0, vw - 2 * pad)),
      h = Math.min(p.height, Math.max(0, vh - 2 * pad));
    let place = options.placement ?? "bottom-start";
    const below = vh - a.bottom - gap,
      above = a.top - gap;
    if (place.startsWith("bottom") && below < h && above > below)
      place = place.replace("bottom", "top") as Placement;
    else if (place.startsWith("top") && above < h && below > above)
      place = place.replace("top", "bottom") as Placement;
    else if (
      place === "right" &&
      vw - a.right - gap < w &&
      a.left > vw - a.right
    )
      place = "left";
    else if (place === "left" && a.left - gap < w && vw - a.right > a.left)
      place = "right";
    let x = place.endsWith("end") ? a.right - w : a.left;
    let y = place.startsWith("top") ? a.top - h - gap : a.bottom + gap;
    if (place === "right" || place === "left") {
      x = place === "right" ? a.right + gap : a.left - w - gap;
      y = a.top + (a.height - h) / 2;
    }
    x = Math.max(pad, Math.min(x, vw - w - pad));
    y = Math.max(pad, Math.min(y, vh - h - pad));
    placement.value = place;
    style.value = {
      ...(cssWidth !== undefined
        ? { width: cssWidth, minWidth: "0" }
        : widthMode === true
          ? { width: `${matchedWidth}px`, minWidth: "0" }
          : widthMode === "min"
            ? { width: "max-content", minWidth: `${matchedWidth}px` }
            : {}),
      position: "fixed",
      left: `${Math.round(x)}px`,
      top: `${Math.round(y)}px`,
      visibility: "visible",
      zIndex: "1200",
      maxWidth: `calc(100vw - ${pad * 2}px)`,
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
    if (!isTop?.()) return;
    if (
      !anchor.value?.contains(e.target as Node) &&
      !panel.value?.contains(e.target as Node)
    )
      close();
  }
  function key(e: KeyboardEvent) {
    if (!open.value || !isTop?.()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      close(true);
    } else if (e.key === "Tab") {
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
    isTop = undefined;
  }
  function close(restore = false, force = false) {
    if (!force && open.value && options.requestOpen?.(false) === false) return;
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
    if (disabled.value) return;
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
    const entry = registerOverlay("floating", () => close(true));
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
  onBeforeUnmount(() => {
    generation++;
    detach();
  });
  return {
    open,
    style,
    placement,
    update,
    show,
    close,
    toggle,
    restoringFocus,
  };
}
