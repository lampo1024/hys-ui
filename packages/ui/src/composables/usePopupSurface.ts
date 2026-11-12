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
import {
  popupFocusControls,
  usePopupSurfaceInteractions,
} from "./usePopupSurfaceInteractions";
import { createPopupReferenceBinding } from "./popupReferenceBinding";
const length = (value: number | string | undefined) =>
  typeof value === "number"
    ? Number.isFinite(value)
      ? Math.max(0, value) + "px"
      : undefined
    : value;
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
      (referenceElement.value.matches(popupFocusControls) ||
        !!referenceElement.value.querySelector(popupFocusControls)),
  );
  function focusReference() {
    const root = actualReference.value;
    (root?.matches(popupFocusControls)
      ? root
      : (root?.querySelector<HTMLElement>(popupFocusControls) ?? wrapper.value)
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
  const interactions = usePopupSurfaceInteractions(props, kind, {
    available,
    anchor,
    actualReference,
    panel,
    floating,
    restoreReferenceFocus,
    request,
  });
  const { handlers, tab } = interactions;
  const externalBinding = createPopupReferenceBinding(kind, id, {
    pointerenter: handlers.pointerEnter,
    pointerleave: handlers.pointerLeave,
    focusin: handlers.focusIn,
    focusout: handlers.focusOut,
    click: handlers.click,
    contextmenu: handlers.contextmenu,
    keydown: handlers.key,
  });
  function attachExternal() {
    const node = active.value && external.value ? actualReference.value : undefined;
    externalBinding.attach(
      node && !wrapper.value?.contains(node) ? node : undefined,
      floating.open.value,
    );
  }
  let observer: ResizeObserver | undefined,
    cycle = 0,
    entered = -1,
    left = -1;
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
    interactions.clearDelays();
    if (
      !active.value ||
      (value &&
        (!available.value ||
          floating.restoringFocus.value ||
          !anchor.value?.isConnected))
    )
      return false;
    if (!value) interactions.resetReasons();
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
  function cleanup() {
    interactions.reset();
    interactions.clearAuto();
    externalBinding.detach();
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
        interactions.reset();
        interactions.clearAuto();
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
  watch(() => props.autoClose, interactions.startAuto);
  watch(
    [actualReference, external],
    () => {
      interactions.reset();
      floating.schedule();
      attachExternal();
    },
    { flush: "post" },
  );
  watch(
    () => props.trigger,
    () => {
      interactions.reset();
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
      externalBinding.syncAria(value);
      emit("visibleChange", value);
      emit("openChange", value);
      emit(value ? "show" : "hide");
      document.removeEventListener("keydown", tab, true);
      if (value) {
        ever.value = true;
        document.addEventListener("keydown", tab, true);
        interactions.startAuto();
      } else {
        interactions.reset();
        interactions.clearAuto();
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
    ...handlers,
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
