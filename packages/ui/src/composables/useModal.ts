import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
  type Ref,
} from "vue";
import { useChoiceModel } from "./choiceModel";
import { useDialog } from "./useDialog";
import { useHysRootAttrs } from "../config";
import { useModalInteraction } from "./useModalInteraction";
import type {
  HysModalProps,
  HysModalActionContext,
  HysModalCloseReason,
} from "./modal";
export function useModal(
  props: HysModalProps,
  dialog: Ref<HTMLElement | undefined>,
  emit: (name: string, ...args: any[]) => void,
  options: { interaction?: boolean } = {},
) {
  const model = useChoiceModel(
      {
        get modelValue() {
          return props.open === undefined ? props.modelValue : props.open;
        },
      },
      () => !!props.defaultOpen,
    ),
    full = useChoiceModel(
      {
        get modelValue() {
          return props.fullscreen;
        },
      },
      () => !!props.defaultFullscreen,
    ),
    fullscreen = computed(() => !!full.current.value),
    live = ref(true),
    suspended = ref(false),
    shown = ref(false),
    engaged = ref(false),
    rendered = ref(false),
    leaving = ref(false),
    error = ref("");
  const skin = useHysRootAttrs(),
    reduced = ref(false),
    pending = shallowRef<{
      kind: "confirm" | "close";
      context: HysModalActionContext;
      controller: AbortController;
    }>();
  const confirming = computed(
      () => pending.value?.kind === "confirm" || !!props.confirmLoading,
    ),
    closing = computed(
      () =>
        pending.value?.kind === "close" ||
        leaving.value ||
        (shown.value && !model.current.value),
    ),
    busy = computed(() => confirming.value || closing.value || !!props.loading),
    motion = computed(
      () =>
        skin.value["data-hys-motion"] !== "off" &&
        !reduced.value &&
        props.transition !== false &&
        props.transition !== "none" &&
        props.transitionDuration !== 0,
    );
  let visibilityTimer: ReturnType<typeof setTimeout> | undefined,
    visibilityGeneration = 0,
    cycle = 0,
    openedCycle = -1,
    closeCycle = -1,
    layoutAnimation: Animation | undefined,
    media: MediaQueryList | undefined;
  const interaction = useModalInteraction(
    props,
    dialog,
    shown,
    fullscreen,
    emit,
    {
      beforeStart: cancelLayoutMotion,
      motion: () => motion.value,
      enabled: options.interaction !== false,
    },
  );
  const alpha = (value: number) =>
    Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
  function cancelLayoutMotion() {
    layoutAnimation?.cancel();
    layoutAnimation = undefined;
  }
  function initialFocus(): HTMLElement | false | undefined {
    const requested = props.initialFocus;
    if (requested === false) return false;
    if (requested instanceof HTMLElement)
      return requested.isConnected ? requested : undefined;
    if (requested === "dialog") return dialog.value;
    if (requested === "confirm" || requested === "cancel")
      return (
        dialog.value?.querySelector<HTMLElement>(
          `[data-hys-modal-${requested}]:not(:disabled)`,
        ) ?? undefined
      );
    if (requested && requested !== "auto") {
      try {
        return dialog.value?.querySelector<HTMLElement>(requested) ?? undefined;
      } catch {
        return undefined;
      }
    }
    return (
      dialog.value?.querySelector<HTMLElement>(
        '[autofocus],input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),select:not([disabled]),[data-hys-modal-initial-focus]',
      ) ??
      dialog.value?.querySelector<HTMLElement>(
        ".hys-ui-dialog-body button:not(:disabled),.hys-ui-dialog-body a[href],[data-hys-modal-cancel]:not(:disabled),[data-hys-modal-confirm]:not(:disabled)",
      ) ??
      dialog.value
    );
  }
  const state = useDialog(
    engaged,
    dialog,
    () => {
      if (interaction.gesturing.value) {
        interaction.stop(true);
        return;
      }
      if (props.closeOnEscape !== false) void requestClose("escape");
    },
    {
      lockScroll: () =>
        props.lockScroll ?? !(props.modal === false && props.modalPenetrable),
      trapFocus: () =>
        props.trapFocus ?? !(props.modal === false && props.modalPenetrable),
      restoreFocus: () => props.restoreFocus !== false,
      initialFocus,
      zIndex: () => props.zIndex,
      childVisible: () => shown.value,
      onOpenAutoFocus: (event) => emit("openAutoFocus", event),
      onCloseAutoFocus: (event) => emit("closeAutoFocus", event),
    },
  );
  function cancelWork() {
    pending.value?.controller.abort();
    pending.value = undefined;
  }
  function start(
    kind: "confirm" | "close",
    reason: HysModalCloseReason,
    event?: Event,
  ) {
    const controller = new AbortController(),
      job = {
        kind,
        context: { reason, event, signal: controller.signal },
        controller,
      };
    pending.value = job;
    error.value = "";
    return job;
  }
  const valid = (job: NonNullable<typeof pending.value>) =>
    live.value &&
    state.active.value &&
    shown.value &&
    pending.value === job &&
    !job.context.signal.aborted;
  function report(
    problem: unknown,
    kind: "confirm" | "close",
    context: HysModalActionContext,
  ) {
    const fallback = "操作未完成，请重试";
    try {
      error.value =
        typeof props.errorText === "function"
          ? String(props.errorText(problem, kind))
          : (props.errorText ?? fallback);
    } catch {
      error.value = fallback;
    }
    emit(kind === "confirm" ? "confirmError" : "closeError", problem, context);
  }
  async function requestValue(value: boolean) {
    if (!live.value || !state.active.value) return false;
    if (model.current.value === value) return true;
    return model.commit(
      value,
      (next) => {
        emit("update:open", next);
        emit("update:modelValue", next);
      },
      () => {},
    );
  }
  async function requestClose(
    reasonOrEvent: HysModalCloseReason | Event = "button",
    event?: Event,
  ) {
    const reason = typeof reasonOrEvent === "string" ? reasonOrEvent : "button";
    if (typeof reasonOrEvent !== "string") event = reasonOrEvent;
    if (reason === "confirm") return confirm(event);
    if (
      !live.value ||
      !state.active.value ||
      !shown.value ||
      closing.value ||
      (confirming.value && !props.closeWhileConfirming)
    )
      return false;
    if (pending.value) cancelWork();
    const job = start("close", reason, event);
    try {
      if (
        props.beforeClose &&
        (await props.beforeClose(reason, job.context)) === false
      )
        return false;
      if (!valid(job)) return false;
      emit("cancel", job.context);
      emit("close");
      return await requestValue(false);
    } catch (problem) {
      if (valid(job)) report(problem, "close", job.context);
      return false;
    } finally {
      if (pending.value === job) pending.value = undefined;
    }
  }
  async function confirm(event?: Event) {
    if (
      !live.value ||
      !state.active.value ||
      !shown.value ||
      busy.value ||
      props.confirmDisabled ||
      props.okButtonProps?.disabled
    )
      return false;
    const job = start("confirm", "confirm", event);
    try {
      if (
        props.beforeConfirm &&
        (await props.beforeConfirm(job.context)) === false
      )
        return false;
      if (!valid(job)) return false;
      if (
        props.closeOnConfirm !== false &&
        props.beforeClose &&
        (await props.beforeClose("confirm", job.context)) === false
      )
        return false;
      if (!valid(job)) return false;
      emit("ok", job.context);
      if (props.closeOnConfirm === false) return true;
      emit("close");
      return await requestValue(false);
    } catch (problem) {
      if (valid(job)) report(problem, "confirm", job.context);
      return false;
    } finally {
      if (pending.value === job) pending.value = undefined;
    }
  }
  const delay = (value: number | undefined) =>
    Number.isFinite(value) ? Math.max(0, Math.min(30000, value!)) : 0;
  function applyDesired() {
    clearTimeout(visibilityTimer);
    const token = ++visibilityGeneration;
    if (!live.value || !state.active.value || suspended.value) {
      cancelLayoutMotion();
      cancelWork();
      interaction.stop(true);
      shown.value = false;
      engaged.value = false;
      leaving.value = false;
      return;
    }
    const next = !!model.current.value;
    if (!next) cancelWork();
    if (next === shown.value) return;
    const apply = () => {
      if (
        token !== visibilityGeneration ||
        !live.value ||
        !state.active.value ||
        suspended.value
      )
        return;
      if (next) {
        cycle++;
        openedCycle = -1;
        closeCycle = -1;
        leaving.value = false;
        rendered.value = true;
        error.value = "";
        engaged.value = true;
        shown.value = true;
        emit("open");
        emit("visibleChange", true);
      } else {
        cancelLayoutMotion();
        leaving.value = true;
        closeCycle = cycle;
        interaction.stop(true);
        shown.value = false;
        if (!motion.value) engaged.value = false;
        emit("visibleChange", false);
      }
    };
    const wait = delay(next ? props.openDelay : props.closeDelay);
    if (wait) visibilityTimer = setTimeout(apply, wait);
    else apply();
  }
  async function afterEnter() {
    const token = cycle;
    await nextTick();
    await nextTick();
    if (live.value && shown.value && token === cycle && openedCycle !== token) {
      openedCycle = token;
      emit("opened");
    }
  }
  async function afterLeave() {
    const token = closeCycle;
    if (!leaving.value || shown.value || token < 0) return;
    engaged.value = false;
    leaving.value = false;
    if (props.destroyOnClose !== false && !props.forceRender)
      rendered.value = false;
    if (props.resetPositionOnClose !== false) interaction.resetPosition();
    if (props.resetSizeOnClose !== false) interaction.resetSize();
    await nextTick();
    await nextTick();
    if (live.value && !shown.value && cycle === token && closeCycle === token) {
      closeCycle = -1;
      emit("closed");
      emit("afterClose");
    }
  }
  async function show() {
    if (!live.value || !state.active.value) return false;
    suspended.value = false;
    const accepted = await requestValue(true);
    if (accepted) applyDesired();
    return accepted;
  }
  async function setFullscreen(value: boolean) {
    if (!live.value || !shown.value) return false;
    interaction.stop(true);
    if (full.current.value === value) return true;
    const element = dialog.value;
    const from = element?.getBoundingClientRect();
    const fromRadius = element ? getComputedStyle(element).borderRadius : "0px";
    cancelLayoutMotion();
    const accepted = await full.commit(
      value,
      (next) => emit("update:fullscreen", next),
      (next) => emit("fullscreenChange", next),
    );
    if (accepted && !value) {
      interaction.clampViewport();
      await nextTick();
    }
    if (
      accepted &&
      motion.value &&
      element &&
      from &&
      shown.value &&
      live.value &&
      typeof element.animate === "function"
    ) {
      const to = element.getBoundingClientRect(),
        style = getComputedStyle(element);
      if (to.width > 0 && to.height > 0) {
        const base = style.transform === "none" ? "" : style.transform;
        const animation = element.animate(
          [
            {
              transformOrigin: "0 0",
              transform: `translate(${from.left - to.left}px,${from.top - to.top}px) ${base} scale(${from.width / to.width},${from.height / to.height})`,
              borderRadius: fromRadius,
            },
            {
              transformOrigin: "0 0",
              transform: base || "none",
              borderRadius: style.borderRadius,
            },
          ],
          {
            duration: Math.max(
              0,
              Math.min(1000, props.transitionDuration ?? 220),
            ),
            easing: "cubic-bezier(.22,1,.36,1)",
          },
        );
        layoutAnimation = animation;
        animation.onfinish = () => {
          if (layoutAnimation === animation) layoutAnimation = undefined;
        };
        animation.oncancel = animation.onfinish;
      }
    }
    return accepted;
  }
  function key(event: KeyboardEvent) {
    if (
      props.draggable &&
      event.altKey &&
      event.key === "Home" &&
      !event.defaultPrevented &&
      !event.isComposing
    ) {
      event.preventDefault();
      interaction.resetPosition();
      return;
    }
    if (
      props.confirmOnCtrlEnter &&
      (event.ctrlKey || event.metaKey) &&
      event.key === "Enter" &&
      !event.isComposing &&
      event.keyCode !== 229
    ) {
      event.preventDefault();
      void confirm(event);
    }
  }
  let maskStart: { id: number; x: number; y: number } | undefined;
  function maskDown(event: PointerEvent) {
    if (event.target === event.currentTarget && event.button === 0)
      maskStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    else maskStart = undefined;
  }
  function maskUp(event: PointerEvent) {
    const start = maskStart;
    maskStart = undefined;
    if (
      start &&
      start.id === event.pointerId &&
      event.target === event.currentTarget &&
      Math.hypot(start.x - event.clientX, start.y - event.clientY) < 6 &&
      props.closeOnMask !== false
    )
      void requestClose("mask", event);
  }
  function mediaChange(event: MediaQueryListEvent) {
    reduced.value = event.matches;
  }
  function cleanup() {
    cancelLayoutMotion();
    live.value = false;
    suspended.value = true;
    visibilityGeneration++;
    clearTimeout(visibilityTimer);
    cancelWork();
    interaction.stop(true);
    shown.value = false;
    engaged.value = false;
    leaving.value = false;
    media?.removeEventListener("change", mediaChange);
    if (props.destroyOnClose !== false && !props.forceRender)
      rendered.value = false;
    if (model.current.value) {
      emit("update:open", false);
      emit("update:modelValue", false);
    }
  }
  watch(
    model.current,
    (value, previous) => {
      if (value && value !== previous) suspended.value = false;
      applyDesired();
    },
    { immediate: true, flush: "sync" },
  );
  watch([state.active, live, suspended], applyDesired, { flush: "post" });
  watch(
    () => [props.beforeClose, props.beforeConfirm],
    () => cancelWork(),
  );
  watch(motion, (value) => {
    if (!value) cancelLayoutMotion();
    if (!value && leaving.value) void afterLeave();
  });
  onMounted(() => {
    media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    reduced.value = !!media?.matches;
    media?.addEventListener("change", mediaChange);
  });
  onActivated(() => {
    live.value = true;
    interaction.activate();
    media?.addEventListener("change", mediaChange);
  });
  onDeactivated(cleanup);
  onBeforeUnmount(cleanup);
  return {
    model,
    alpha,
    fullscreen,
    live,
    state,
    shown,
    engaged,
    rendered,
    leaving,
    error,
    confirming,
    closing,
    busy,
    motion,
    interaction,
    show,
    requestClose,
    confirm,
    cancel: (event?: Event) =>
      props.cancelDisabled || props.cancelButtonProps?.disabled
        ? Promise.resolve(false)
        : requestClose("cancel", event),
    setFullscreen,
    toggleFullscreen: () => setFullscreen(!fullscreen.value),
    afterEnter,
    afterLeave,
    key,
    maskDown,
    maskUp,
  };
}
