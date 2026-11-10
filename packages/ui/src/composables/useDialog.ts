import {
  computed,
  ref,
  shallowRef,
  nextTick,
  watch,
  onActivated,
  onDeactivated,
  onBeforeUnmount,
  inject,
  provide,
  type Ref,
} from "vue";
import {
  lockBodyScroll,
  registerOverlay,
  overlayOwnerKey,
} from "./overlayManager";
const focusable =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
interface DialogOptions {
  lockScroll?: () => boolean;
  trapFocus?: () => boolean;
  restoreFocus?: () => boolean;
  initialFocus?: () => HTMLElement | false | undefined;
  zIndex?: () => number | undefined;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  childVisible?: () => boolean;
}
export function useDialog(
  open: Ref<boolean>,
  dialog: Ref<HTMLElement | undefined>,
  close: () => void,
  options: DialogOptions = {},
) {
  const lifecycle = ref(true),
    parent = inject(overlayOwnerKey, undefined),
    active = computed(() => lifecycle.value && parent?.value !== false),
    visible = computed(() => open.value && active.value);
  provide(
    overlayOwnerKey,
    computed(() => visible.value && options.childVisible?.() !== false),
  );
  const registration = shallowRef<ReturnType<typeof registerOverlay>>();
  const zIndex = computed(
    () => registration.value?.zIndex.value ?? options.zIndex?.() ?? 100,
  );
  let previous: HTMLElement | null = null,
    unlock: (() => void) | undefined,
    generation = 0;
  function candidates() {
    return Array.from(
      dialog.value?.querySelectorAll<HTMLElement>(focusable) ?? [],
    ).filter(
      (el) =>
        el.tabIndex >= 0 &&
        el.getClientRects().length > 0 &&
        getComputedStyle(el).visibility !== "hidden" &&
        !el.closest('[inert],[aria-hidden="true"]'),
    );
  }
  function focusFirst() {
    (candidates()[0] ?? dialog.value)?.focus({ preventScroll: true });
  }
  function key(event: KeyboardEvent) {
    if (!visible.value || !registration.value?.isTop() || !dialog.value) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || options.trapFocus?.() === false) return;
    const items = candidates();
    if (!items.length) {
      event.preventDefault();
      dialog.value.focus({ preventScroll: true });
      return;
    }
    const first = items[0],
      last = items[items.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === dialog.value ||
        !dialog.value.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        !dialog.value.contains(document.activeElement))
    ) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }
  function focusInside(event: FocusEvent) {
    if (
      visible.value &&
      registration.value?.isTop() &&
      options.trapFocus?.() !== false &&
      event.target instanceof Node &&
      !dialog.value?.contains(event.target)
    )
      focusFirst();
  }
  function syncLock() {
    if (visible.value && options.lockScroll?.() !== false) {
      unlock ??= lockBodyScroll();
    } else {
      unlock?.();
      unlock = undefined;
    }
  }
  function cleanup() {
    const wasTop = registration.value?.isTop() ?? false;
    registration.value?.unregister();
    registration.value = undefined;
    unlock?.();
    unlock = undefined;
    document.removeEventListener("keydown", key, true);
    document.removeEventListener("focusin", focusInside, true);
    return wasTop;
  }
  function restore(target: HTMLElement | null, token: number, wasTop: boolean) {
    void nextTick(() => {
      if (
        token !== generation ||
        !active.value ||
        !wasTop ||
        options.restoreFocus?.() === false
      )
        return;
      const event = new Event("hys-ui-close-auto-focus", { cancelable: true });
      options.onCloseAutoFocus?.(event);
      if (!event.defaultPrevented && target?.isConnected)
        target.focus({ preventScroll: true });
    });
  }
  watch(
    visible,
    async (value) => {
      const token = ++generation;
      if (value) {
        cleanup();
        previous =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        registration.value = registerOverlay("dialog", close, options.zIndex);
        syncLock();
        document.addEventListener("keydown", key, true);
        document.addEventListener("focusin", focusInside, true);
        await nextTick();
        if (token !== generation || !visible.value) return;
        const event = new Event("hys-ui-open-auto-focus", { cancelable: true });
        options.onOpenAutoFocus?.(event);
        const requested = options.initialFocus?.();
        const usable =
          requested instanceof HTMLElement &&
          requested.isConnected &&
          requested.getClientRects().length > 0 &&
          getComputedStyle(requested).visibility !== "hidden" &&
          !requested.closest('[inert],[aria-hidden="true"]') &&
          !(requested as HTMLInputElement).disabled
            ? requested
            : undefined;
        if (!event.defaultPrevented && requested !== false)
          (
            usable ??
            dialog.value?.querySelector<HTMLElement>("[autofocus]") ??
            candidates()[0] ??
            dialog.value
          )?.focus({ preventScroll: true });
      } else restore(previous, token, cleanup());
    },
    { immediate: true, flush: "post" },
  );
  watch(() => options.lockScroll?.(), syncLock);
  onActivated(() => (lifecycle.value = true));
  onDeactivated(() => {
    lifecycle.value = false;
    generation++;
    cleanup();
  });
  onBeforeUnmount(() => {
    const target = previous,
      wasTop = cleanup(),
      allowed = active.value && options.restoreFocus?.() !== false;
    lifecycle.value = false;
    generation++;
    if (allowed && wasTop)
      void nextTick(() => {
        if (target?.isConnected) target.focus({ preventScroll: true });
      });
  });
  return { active, zIndex, focus: focusFirst };
}
