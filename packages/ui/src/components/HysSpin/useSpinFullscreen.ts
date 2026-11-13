import { nextTick, onBeforeUnmount, shallowRef, watch, type Ref } from "vue";
import {
  lockBodyScroll,
  registerOverlay,
} from "../../composables/overlayManager";

const focusable =
  'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';

export function useSpinFullscreen(
  panel: Ref<HTMLElement | undefined>,
  options: {
    lock(): boolean;
    trap(): boolean;
    zIndex(): number | undefined;
    escape(): void;
  },
) {
  const overlay = shallowRef<ReturnType<typeof registerOverlay>>();
  let release: (() => void) | undefined;
  let origin: HTMLElement | undefined;
  let surface: HTMLElement | undefined;
  function key(event: KeyboardEvent) {
    if (!overlay.value?.isTop() || !panel.value) return;
    if (event.key === "Escape") {
      event.stopImmediatePropagation();
      options.escape();
    } else if (event.key === "Tab") {
      const list = [
        ...panel.value.querySelectorAll<HTMLElement>(focusable),
      ].filter(
        (node) =>
          !node.closest("[inert],[hidden]") && node.getClientRects().length,
      );
      const current = document.activeElement;
      const boundary = event.shiftKey ? list[0] : list.at(-1);
      if (
        !list.length ||
        !panel.value.contains(current) ||
        current === boundary ||
        current === panel.value
      ) {
        event.preventDefault();
        (list[event.shiftKey ? list.length - 1 : 0] ?? panel.value).focus({
          preventScroll: true,
        });
      }
    }
  }
  function focus(event: FocusEvent) {
    if (
      overlay.value?.isTop() &&
      panel.value &&
      !panel.value.contains(event.target as Node)
    )
      panel.value.focus({ preventScroll: true });
  }
  function detach() {
    if (!overlay.value) return;
    const restore =
      overlay.value.isTop() &&
      (surface?.contains(document.activeElement) ||
        document.activeElement === document.body);
    overlay.value.unregister();
    overlay.value = undefined;
    document.removeEventListener("keydown", key, true);
    document.removeEventListener("focusin", focus, true);
    if (restore && origin?.isConnected) origin.focus({ preventScroll: true });
    origin = undefined;
    surface = undefined;
  }
  watch(
    [options.lock, panel],
    ([active, element]) => {
      if (active && element && !release) release = lockBodyScroll();
      if (!active || !element) {
        release?.();
        release = undefined;
      }
    },
    { flush: "post" },
  );
  watch(
    [options.trap, panel],
    ([active, element]) => {
      if (!active || !element) {
        detach();
        return;
      }
      if (overlay.value) return;
      origin =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : undefined;
      const entry = registerOverlay("dialog", options.escape, options.zIndex);
      overlay.value = entry;
      surface = element;
      document.addEventListener("keydown", key, true);
      document.addEventListener("focusin", focus, true);
      void nextTick(() => {
        if (overlay.value === entry && entry.isTop())
          element.focus({ preventScroll: true });
      });
    },
    { flush: "post" },
  );
  onBeforeUnmount(() => {
    detach();
    release?.();
  });
  return overlay;
}
