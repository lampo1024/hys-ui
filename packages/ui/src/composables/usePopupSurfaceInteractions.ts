import { computed, type Ref } from "vue";
import type { HysPopupSurfaceProps } from "./popupSurface";
import type { FloatingAnchor, useFloating } from "./useFloating";

export const popupFocusControls =
  'button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

export function usePopupSurfaceInteractions(
  props: HysPopupSurfaceProps,
  kind: "tooltip" | "popover",
  {
    available,
    anchor,
    actualReference,
    panel,
    floating,
    restoreReferenceFocus,
    request,
  }: {
    available: Readonly<Ref<boolean>>;
    anchor: Readonly<Ref<FloatingAnchor | undefined>>;
    actualReference: Readonly<Ref<HTMLElement | undefined>>;
    panel: Readonly<Ref<HTMLElement | undefined>>;
    floating: Pick<
      ReturnType<typeof useFloating>,
      "open" | "isTop" | "restoringFocus"
    >;
    restoreReferenceFocus: () => void;
    request: (open: boolean) => Promise<boolean>;
  },
) {
  const wait = (value: number | undefined) =>
    Number.isFinite(value) ? Math.max(0, Math.min(30000, value!)) : 0;
  let showTimer: ReturnType<typeof setTimeout> | undefined,
    hideTimer: ReturnType<typeof setTimeout> | undefined,
    autoTimer: ReturnType<typeof setTimeout> | undefined;
  let hoverTrigger = false,
    hoverPanel = false,
    focusTrigger = false,
    focusPanel = false,
    pinned = false;
  const triggers = computed(() => {
    const value =
      props.trigger ?? (kind === "tooltip" ? ["hover", "focus"] : ["click"]);
    const values = Array.isArray(value) ? value : [value];
    return new Set(values.includes("manual") ? [] : values);
  });
  function clearDelays() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    showTimer = hideTimer = undefined;
  }
  function clearAuto() {
    clearTimeout(autoTimer);
    autoTimer = undefined;
  }
  function resetReasons() {
    hoverTrigger = hoverPanel = focusTrigger = focusPanel = pinned = false;
  }
  function scheduleShow() {
    clearTimeout(hideTimer);
    hideTimer = undefined;
    if (
      !available.value ||
      floating.restoringFocus.value ||
      floating.open.value ||
      showTimer
    )
      return;
    const delay = wait(props.showDelay);
    if (delay)
      showTimer = setTimeout(() => {
        showTimer = undefined;
        void request(true);
      }, delay);
    else void request(true);
  }
  function held() {
    return (
      pinned ||
      hoverTrigger ||
      (props.enterable !== false && hoverPanel) ||
      (triggers.value.has("focus") && focusTrigger) ||
      (props.enterable !== false && focusPanel)
    );
  }
  function scheduleHide() {
    clearTimeout(showTimer);
    showTimer = undefined;
    clearTimeout(hideTimer);
    hideTimer = undefined;
    if (held() || !floating.open.value) return;
    const hide = () => {
      hideTimer = undefined;
      // Hover and focus belong to this popup even when another overlay is above it.
      if (!held() && floating.open.value) void request(false);
    };
    const delay = wait(props.hideDelay);
    if (delay) hideTimer = setTimeout(hide, delay);
    else hide();
  }
  function pointerEnter() {
    if (!triggers.value.has("hover")) return;
    hoverTrigger = true;
    scheduleShow();
  }
  function pointerLeave() {
    if (!triggers.value.has("hover")) return;
    hoverTrigger = false;
    scheduleHide();
  }
  function panelEnter() {
    if (props.enterable === false) return;
    hoverPanel = true;
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
  function panelLeave() {
    hoverPanel = false;
    if (triggers.value.has("hover")) scheduleHide();
  }
  function focusIn(event: FocusEvent) {
    if (panel.value?.contains(event.target as Node)) return;
    if (floating.restoringFocus.value) return;
    focusTrigger = true;
    if (triggers.value.has("focus")) scheduleShow();
  }
  function focusOut(event: FocusEvent) {
    if (panel.value?.contains(event.target as Node)) return;
    const next = event.relatedTarget as Node | null;
    if (anchor.value?.contains(next)) return;
    focusTrigger = false;
    if (panel.value?.contains(next) && props.enterable !== false) {
      focusPanel = true;
      return;
    }
    if (triggers.value.has("focus") || triggers.value.has("hover"))
      scheduleHide();
  }
  function panelFocusIn() {
    if (props.enterable !== false) focusPanel = true;
  }
  function panelFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (panel.value?.contains(next)) return;
    focusPanel = false;
    if (anchor.value?.contains(next)) {
      focusTrigger = true;
      return;
    }
    if (triggers.value.has("focus") || triggers.value.has("hover"))
      scheduleHide();
  }
  function click(event: MouseEvent) {
    if (panel.value?.contains(event.target as Node)) return;
    if (!triggers.value.has("click") || !available.value) return;
    pinned = floating.open.value
      ? !pinned &&
        ((hoverTrigger && triggers.value.has("hover")) ||
          (focusTrigger && triggers.value.has("focus")))
      : true;
    void request(pinned);
  }
  function contextmenu(event: MouseEvent) {
    if (panel.value?.contains(event.target as Node)) return;
    if (!triggers.value.has("contextmenu") || !available.value) return;
    event.preventDefault();
    pinned = true;
    void request(true);
  }
  function key(event: KeyboardEvent) {
    if (panel.value?.contains(event.target as Node)) return;
    if (!triggers.value.size || !available.value || event.defaultPrevented)
      return;
    const target = event.target as HTMLElement;
    if (target.closest('input,textarea,select,[contenteditable="true"]'))
      return;
    if (
      event.key === "F10" &&
      event.shiftKey &&
      triggers.value.has("contextmenu")
    ) {
      event.preventDefault();
      pinned = true;
      void request(true);
      return;
    }
    if (
      !(props.triggerKeys ?? ["Enter", " "]).some(
        (key) => key === event.key || (key === "Space" && event.key === " "),
      )
    )
      return;
    // Native buttons already generate click on Enter/Space. Their own handlers must run once.
    if (triggers.value.has("click") && target.closest("button,a[href],input"))
      return;
    event.preventDefault();
    pinned = !floating.open.value;
    void request(pinned);
  }
  function focusables(root: ParentNode) {
    return [...root.querySelectorAll<HTMLElement>(popupFocusControls)].filter(
      (el) =>
        el.tabIndex >= 0 &&
        !el.matches(":disabled") &&
        !el.closest('[inert],[aria-hidden="true"]') &&
        !!el.getClientRects().length &&
        getComputedStyle(el).visibility !== "hidden",
    );
  }
  function adjacent(backward: boolean) {
    const source = actualReference.value,
      all = focusables(document).filter((el) => !panel.value?.contains(el));
    const index = all.findIndex((el) => el === source || source?.contains(el));
    const next = index < 0 ? undefined : all[index + (backward ? -1 : 1)];
    next?.focus();
    return !!next;
  }
  async function tab(event: KeyboardEvent) {
    if (
      event.key !== "Tab" ||
      kind !== "popover" ||
      !floating.open.value ||
      !floating.isTop()
    )
      return;
    const target = event.target as Node,
      inside = panel.value?.contains(target),
      atTrigger = anchor.value?.contains(target);
    if (!inside && !atTrigger) return;
    const items = panel.value ? focusables(panel.value) : [];
    if (
      atTrigger &&
      !event.shiftKey &&
      props.enterable !== false &&
      items.length
    ) {
      event.preventDefault();
      items[0].focus();
      return;
    }
    if (
      inside &&
      target !== (event.shiftKey ? items[0] : items.at(-1)) &&
      items.length
    )
      return;
    event.preventDefault();
    const accepted = await request(false);
    if (accepted) {
      if (inside && event.shiftKey) restoreReferenceFocus();
      else if (!adjacent(event.shiftKey)) restoreReferenceFocus();
    }
  }
  function startAuto() {
    clearAuto();
    const delay = wait(props.autoClose);
    if (floating.open.value && delay)
      autoTimer = setTimeout(() => {
        autoTimer = undefined;
        void request(false);
      }, delay);
  }
  function reset() {
    clearDelays();
    resetReasons();
  }
  return {
    clearDelays,
    clearAuto,
    resetReasons,
    reset,
    startAuto,
    tab,
    handlers: {
      pointerEnter,
      pointerLeave,
      panelEnter,
      panelLeave,
      focusIn,
      focusOut,
      panelFocusIn,
      panelFocusOut,
      click,
      contextmenu,
      key,
    },
  };
}
