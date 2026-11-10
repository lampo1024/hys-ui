import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  useId,
  watch,
  type CSSProperties,
  type HTMLAttributes,
} from "vue";
import { useHysControlState } from "./formContext";
import { useChoiceModel } from "./choiceModel";
import { overlayOwnerKey } from "./overlayManager";
import {
  useFloating,
  type FloatingAnchor,
  type FloatingPosition,
} from "./useFloating";
import type {
  HysPopupSurfaceContext,
  HysPopupSurfaceProps,
  HysPopupReference,
} from "./popupSurface";
const length = (value: number | string | undefined) =>
  typeof value === "number"
    ? Number.isFinite(value)
      ? Math.max(0, value) + "px"
      : undefined
    : value;
const wait = (value: number | undefined) =>
  Number.isFinite(value) ? Math.max(0, Math.min(30000, value!)) : 0;
const controls =
  'button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
export function usePopupSurface(
  props: HysPopupSurfaceProps,
  kind: "tooltip" | "popover",
  emit: (name: string, ...args: any[]) => void,
) {
  const wrapper = ref<HTMLElement>(),
    referenceElement = shallowRef<HTMLElement>(),
    panel = ref<HTMLElement>(),
    id = useId() + "-popup",
    titleId = id + "-title";
  const { disabled } = useHysControlState(props),
    owner = inject(overlayOwnerKey, undefined),
    active = ref(true),
    suspended = ref(false),
    ever = ref(false);
  const model = useChoiceModel(
    {
      get modelValue() {
        return props.open ?? props.modelValue;
      },
    },
    () => props.defaultOpen ?? false,
  );
  const available = computed(
    () => active.value && !disabled.value && owner?.value !== false,
  );
  const external = computed<HysPopupReference | undefined>(() =>
    typeof props.reference === "function" ? props.reference() : props.reference,
  );
  const actualReference = computed(() => {
    const value = external.value;
    return value instanceof HTMLElement
      ? value
      : (value?.contextElement ?? referenceElement.value ?? wrapper.value);
  });
  const nativeReference = computed(
    () =>
      !!referenceElement.value &&
      (referenceElement.value.matches(controls) ||
        !!referenceElement.value.querySelector(controls)),
  );
  function focusReference() {
    const root = actualReference.value;
    (root?.matches(controls)
      ? root
      : (root?.querySelector<HTMLElement>(controls) ?? wrapper.value)
    )?.focus({ preventScroll: true });
  }
  function restoreReferenceFocus() {
    floating.restoringFocus.value = true;
    try {
      focusReference();
    } finally {
      floating.restoringFocus.value = false;
    }
  }
  const anchor = computed<FloatingAnchor | undefined>(() => {
    const value = external.value ?? referenceElement.value ?? wrapper.value;
    if (!value) return;
    return {
      getBoundingClientRect: () => value.getBoundingClientRect(),
      contains: (node) =>
        !!actualReference.value?.contains(node) ||
        !!wrapper.value?.contains(node),
      focus: focusReference,
      get isConnected() {
        return actualReference.value?.isConnected ?? !!external.value;
      },
    };
  });
  const teleportTo = computed(() => {
    const to = props.appendTo;
    if (to instanceof HTMLElement) return to;
    if (typeof to === "string") {
      try {
        return document.querySelector(to) ?? document.body;
      } catch {
        return document.body;
      }
    }
    return document.body;
  });
  const arrowStyle = ref<CSSProperties>({});
  function position(info: FloatingPosition) {
    const horizontal =
        info.placement.startsWith("left") || info.placement.startsWith("right"),
      size = horizontal ? info.height : info.width;
    const pad = Number.isFinite(props.arrowOffset)
      ? Math.max(6, props.arrowOffset!)
      : 10;
    const center = horizontal
      ? info.anchor.top + info.anchor.height / 2 - info.y
      : info.anchor.left + info.anchor.width / 2 - info.x;
    arrowStyle.value = {
      [horizontal ? "top" : "left"]:
        Math.max(Math.min(pad, size / 2), Math.min(center, size - pad)) + "px",
    };
  }
  const floating = useFloating(anchor, panel, {
    get placement() {
      return props.placement;
    },
    get gap() {
      return props.offset ?? (kind === "tooltip" ? 7 : 8);
    },
    get autoAdjustOverflow() {
      return props.autoAdjustOverflow;
    },
    get closeOnEscape() {
      return props.closeOnEscape;
    },
    get closeOnOutside() {
      return props.closeOnOutside;
    },
    closeOnTab: kind === "tooltip",
    get strategy() {
      return props.appendTo === false || teleportTo.value !== document.body
        ? "absolute"
        : "fixed";
    },
    width: () => props.width,
    maxWidth: () =>
      length(props.maxWidth) ?? (kind === "tooltip" ? "320px" : "360px"),
    zIndex: () => props.zIndex,
    onPosition: position,
    requestOpen(value, restore) {
      void request(value, restore);
      return false;
    },
  });
  let showTimer: ReturnType<typeof setTimeout> | undefined,
    hideTimer: ReturnType<typeof setTimeout> | undefined,
    autoTimer: ReturnType<typeof setTimeout> | undefined;
  let observer: ResizeObserver | undefined,
    externalNode: HTMLElement | undefined,
    cycle = 0,
    entered = -1,
    left = -1;
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
  function sync() {
    if (
      available.value &&
      !suspended.value &&
      model.current.value &&
      anchor.value?.isConnected
    ) {
      ever.value = true;
      void floating.show(true);
    } else floating.close(false, true);
  }
  async function request(value: boolean, restore = false) {
    clearDelays();
    if (
      !active.value ||
      (value &&
        (!available.value ||
          floating.restoringFocus.value ||
          !anchor.value?.isConnected))
    )
      return false;
    if (!value) resetReasons();
    suspended.value = false;
    let accepted = Object.is(model.current.value, value);
    if (!accepted)
      accepted = await model.commit(
        value,
        (v) => {
          emit("update:open", v);
          emit("update:modelValue", v);
        },
        () => {},
      );
    if (!active.value) return false;
    if (accepted) {
      if (!value) {
        floating.close(false, true);
        if (restore && anchor.value?.isConnected) {
          restoreReferenceFocus();
        }
      } else sync();
    }
    return accepted;
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
      if (!held() && floating.isTop()) void request(false);
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
    return [...root.querySelectorAll<HTMLElement>(controls)].filter(
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
  function detachObserver() {
    observer?.disconnect();
    observer = undefined;
  }
  function observe() {
    detachObserver();
    if (
      !floating.open.value ||
      !panel.value ||
      typeof ResizeObserver === "undefined"
    )
      return;
    observer = new ResizeObserver(floating.schedule);
    observer.observe(panel.value);
    if (actualReference.value) observer.observe(actualReference.value);
  }
  const nativeEvents = {
    pointerenter: pointerEnter,
    pointerleave: pointerLeave,
    focusin: focusIn,
    focusout: focusOut,
    click,
    contextmenu,
    keydown: key,
  } as const;
  let externalAria: Record<string, string | null> | undefined;
  function syncExternalAria() {
    if (!externalNode || !externalAria) return;
    if (kind === "tooltip") {
      const text = floating.open.value
        ? [externalAria["aria-describedby"], id].filter(Boolean).join(" ")
        : externalAria["aria-describedby"];
      if (text) externalNode.setAttribute("aria-describedby", text);
      else externalNode.removeAttribute("aria-describedby");
    } else {
      externalNode.setAttribute(
        "aria-haspopup",
        externalAria["aria-haspopup"] ?? "dialog",
      );
      externalNode.setAttribute("aria-expanded", String(floating.open.value));
      const target = floating.open.value ? id : externalAria["aria-controls"];
      if (target) externalNode.setAttribute("aria-controls", target);
      else externalNode.removeAttribute("aria-controls");
    }
  }
  function detachExternal() {
    if (externalNode)
      for (const [name, handler] of Object.entries(nativeEvents))
        externalNode.removeEventListener(name, handler as EventListener);
    if (externalNode && externalAria)
      for (const [key, value] of Object.entries(externalAria)) {
        if (value === null) externalNode.removeAttribute(key);
        else externalNode.setAttribute(key, value);
      }
    externalAria = undefined;
    externalNode = undefined;
  }
  function attachExternal() {
    detachExternal();
    if (!active.value || !external.value) return;
    externalNode = actualReference.value;
    if (externalNode && wrapper.value?.contains(externalNode)) {
      externalNode = undefined;
      return;
    }
    if (externalNode) {
      externalAria = Object.fromEntries(
        [
          "aria-describedby",
          "aria-controls",
          "aria-expanded",
          "aria-haspopup",
        ].map((key) => [key, externalNode!.getAttribute(key)]),
      );
      syncExternalAria();
    }
    for (const [name, handler] of Object.entries(nativeEvents))
      externalNode?.addEventListener(name, handler as EventListener);
  }
  function cleanup() {
    clearDelays();
    clearAuto();
    resetReasons();
    detachExternal();
    detachObserver();
    document.removeEventListener("keydown", tab, true);
    floating.close(false, true);
  }
  watch(
    model.current,
    () => {
      suspended.value = false;
      sync();
    },
    { flush: "post" },
  );
  watch(
    [available, wrapper, external],
    () => {
      if (!available.value) {
        clearDelays();
        clearAuto();
        resetReasons();
      }
      sync();
      attachExternal();
    },
    { flush: "post", immediate: true },
  );
  watch(
    () => owner?.value,
    (value) => {
      if (value === false) {
        suspended.value = true;
        cleanup();
      }
    },
    { flush: "sync" },
  );
  watch(() => props.autoClose, startAuto);
  watch(
    [actualReference, external],
    () => {
      clearDelays();
      resetReasons();
      floating.schedule();
      attachExternal();
    },
    { flush: "post" },
  );
  watch(
    () => props.trigger,
    () => {
      clearDelays();
      resetReasons();
    },
  );
  watch(
    () => [
      props.placement,
      props.offset,
      props.autoAdjustOverflow,
      props.width,
      props.maxWidth,
      props.maxHeight,
      props.appendTo,
      props.arrowOffset,
    ],
    floating.schedule,
    { flush: "post" },
  );
  watch([floating.open, panel, actualReference], observe, { flush: "post" });
  watch(
    floating.open,
    (value) => {
      cycle++;
      syncExternalAria();
      emit("visibleChange", value);
      emit("openChange", value);
      emit(value ? "show" : "hide");
      document.removeEventListener("keydown", tab, true);
      if (value) {
        ever.value = true;
        document.addEventListener("keydown", tab, true);
        startAuto();
      } else {
        clearDelays();
        clearAuto();
        resetReasons();
        detachObserver();
      }
    },
    { flush: "sync" },
  );
  async function afterEnter() {
    const token = cycle;
    await nextTick();
    if (
      active.value &&
      floating.open.value &&
      token === cycle &&
      entered !== token
    ) {
      entered = token;
      emit("opened");
    }
  }
  async function afterLeave() {
    const token = cycle;
    await nextTick();
    if (
      active.value &&
      !floating.open.value &&
      token === cycle &&
      left !== token
    ) {
      left = token;
      emit("closed");
    }
  }
  function inactive() {
    suspended.value = true;
    cleanup();
  }
  onMounted(() => {
    sync();
    attachExternal();
  });
  onActivated(() => {
    active.value = true;
    attachExternal();
  });
  onDeactivated(() => {
    active.value = false;
    suspended.value = true;
    cleanup();
  });
  onBeforeUnmount(() => {
    active.value = false;
    cleanup();
  });
  const mounted = computed(
    () =>
      floating.open.value ||
      props.forceRender ||
      (props.destroyOnHide === false && ever.value),
  );
  const skinStyle = computed<CSSProperties>(() => {
    const dark =
      (props.effect ?? (kind === "tooltip" ? "dark" : "light")) === "dark";
    return {
      "--hys-ui-popup-surface":
        props.color ||
        (dark
          ? "#172744"
          : "var(--hys-ui-surface,var(--hys-ui-theme-surface))"),
      "--hys-ui-popup-color":
        props.textColor ||
        (dark ? "#fff" : "var(--hys-ui-text,var(--hys-ui-theme-text))"),
      "--hys-ui-popup-border":
        props.color ||
        (dark ? "#172744" : "var(--hys-ui-border,var(--hys-ui-theme-border))"),
    };
  });
  const style = computed<CSSProperties>(() => ({
    ...props.overlayStyle,
    ...floating.style.value,
    ...skinStyle.value,
    overflow: "visible",
    maxWidth: `min(${length(props.maxWidth) ?? (kind === "tooltip" ? "320px" : "360px")},calc(100vw - 20px))`,
    minWidth: props.width !== undefined ? "0" : undefined,
  }));
  const contentStyle = computed<CSSProperties>(() => ({
    ...props.contentStyle,
    maxHeight:
      props.maxHeight !== undefined
        ? `min(${length(props.maxHeight)},calc(100vh - 20px))`
        : "calc(100vh - 20px)",
  }));
  const scope = computed<HysPopupSurfaceContext>(() => ({
    open: floating.open.value,
    show: () => request(true),
    close: () => request(false),
    toggle: () => request(!floating.open.value),
    updatePosition: floating.schedule,
  }));
  const wrapperAttrs = computed<HTMLAttributes>(() => ({
    tabindex: external.value
      ? -1
      : nativeReference.value
        ? undefined
        : disabled.value
          ? -1
          : (props.triggerTabindex ?? 0),
    role:
      kind === "popover" && !nativeReference.value && !external.value
        ? "button"
        : undefined,
    "aria-disabled": (!nativeReference.value && disabled.value) || undefined,
    ...(nativeReference.value
      ? {}
      : kind === "tooltip"
        ? { "aria-describedby": floating.open.value ? id : undefined }
        : {
            "aria-controls": floating.open.value ? id : undefined,
            "aria-expanded": floating.open.value,
            "aria-haspopup": "dialog",
          }),
  }));
  return {
    wrapper,
    referenceElement,
    panel,
    actualReference,
    nativeReference,
    id,
    titleId,
    open: floating.open,
    placement: floating.placement,
    active: computed(() => active.value && owner?.value !== false),
    mounted,
    teleportTo,
    arrowStyle,
    style,
    contentStyle,
    scope,
    wrapperAttrs,
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
    afterEnter,
    afterLeave,
    inactive,
    request,
    show: () => request(true),
    hide: () => request(false),
    toggle: () => request(!floating.open.value),
    updatePosition: floating.schedule,
    focus: () => anchor.value?.focus(),
  };
}
