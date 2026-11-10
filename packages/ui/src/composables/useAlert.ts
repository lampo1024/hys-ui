import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
  useAttrs,
  type ComputedRef,
} from "vue";
import { useHysRootAttrs } from "../config";
import {
  feedbackNumber,
  type HysAlertProps,
  type HysAlertSlotContext,
} from "./feedback";
export function useAlert(
  props: HysAlertProps,
  emit: (name: string, ...args: any[]) => void,
) {
  const attrs = useAttrs(),
    skin = useHysRootAttrs(),
    element = ref<HTMLElement>(),
    local = ref(props.defaultVisible ?? true),
    live = ref(true),
    closing = ref(false),
    reduced = ref(false);
  const visible = computed(
    () => props.visible ?? props.modelValue ?? local.value,
  );
  const tone = computed(
    () => props.tone ?? (props.banner ? "warning" : "info"),
  );
  const duration = computed(() =>
    !live.value ||
    reduced.value ||
    skin.value["data-hys-motion"] === "off" ||
    props.transition === "none"
      ? 0
      : feedbackNumber(props.transitionDuration, 180, 0, 1500),
  );
  let version = 0,
    expected: boolean | undefined,
    controller: AbortController | undefined,
    media: MediaQueryList | undefined,
    listening = false;
  const left = new WeakMap<Element, number>();
  function invalidate() {
    version++;
    expected = undefined;
    controller?.abort();
    controller = undefined;
    closing.value = false;
  }
  const updateReduced = () => (reduced.value = !!media?.matches);
  function observe() {
    if (listening || !live.value) return;
    media ??= window.matchMedia?.("(prefers-reduced-motion: reduce)");
    updateReduced();
    media?.addEventListener("change", updateReduced);
    listening = true;
  }
  function stop() {
    invalidate();
    media?.removeEventListener("change", updateReduced);
    listening = false;
  }
  function request(value: boolean) {
    local.value = value;
    expected = value;
    emit("update:visible", value);
    emit("update:modelValue", value);
  }
  async function close(reason: "button" | "api" = "api", event?: Event) {
    if (!live.value || !visible.value || props.disabled || closing.value)
      return false;
    const token = ++version,
      job = new AbortController();
    controller = job;
    closing.value = true;
    const context = { reason, event, signal: job.signal };
    emit("closeRequest", context);
    try {
      if (token !== version || job.signal.aborted) return false;
      if (props.beforeClose && (await props.beforeClose(context)) === false)
        return false;
      if (
        token !== version ||
        job.signal.aborted ||
        !live.value ||
        !visible.value ||
        props.disabled
      )
        return false;
      request(false);
      emit("close");
      await nextTick();
      return token === version && live.value && !visible.value;
    } catch (error) {
      if (token === version && live.value && !job.signal.aborted)
        emit(
          "closeError",
          error instanceof Error ? error : new Error(String(error)),
        );
      return false;
    } finally {
      if (token === version) {
        expected = undefined;
        closing.value = false;
        controller = undefined;
      }
    }
  }
  async function show() {
    if (!live.value || props.disabled) return false;
    invalidate();
    const token = version;
    if (visible.value) return true;
    request(true);
    await nextTick();
    if (token === version) expected = undefined;
    return token === version && live.value && visible.value;
  }
  watch(
    () => [props.visible, props.modelValue],
    () => {
      if (expected !== undefined && visible.value === expected) return;
      invalidate();
    },
    { flush: "sync" },
  );
  watch(
    visible,
    (value) => {
      if (live.value) emit("visibleChange", value);
    },
    { flush: "sync" },
  );
  watch(
    () => props.title,
    () => {
      invalidate();
      local.value = true;
    },
  );
  watch(
    () => [props.disabled, props.beforeClose],
    () => invalidate(),
    { flush: "sync" },
  );
  function beforeLeave(node: Element) {
    left.set(node, version);
    const el = node as HTMLElement;
    el.style.setProperty(
      "--hys-ui-alert-height",
      el.getBoundingClientRect().height + "px",
    );
    el.setAttribute("aria-hidden", "true");
    el.removeAttribute("role");
    el.inert = true;
  }
  function afterLeave(node: Element) {
    if (left.get(node) === version && live.value && !visible.value)
      emit("afterClose");
    left.delete(node);
  }
  function restore(node: Element) {
    const el = node as HTMLElement;
    el.style.removeProperty("--hys-ui-alert-height");
    if (attrs["aria-hidden"] !== undefined)
      el.setAttribute("aria-hidden", String(attrs["aria-hidden"]));
    else el.removeAttribute("aria-hidden");
    el.inert = attrs.inert === true || attrs.inert === "";
    el.setAttribute(
      "role",
      typeof attrs.role === "string"
        ? attrs.role
        : tone.value === "danger"
          ? "alert"
          : "status",
    );
    left.delete(node);
  }
  onMounted(observe);
  onActivated(() => {
    live.value = true;
    observe();
  });
  onDeactivated(() => {
    live.value = false;
    stop();
  });
  onBeforeUnmount(() => {
    live.value = false;
    stop();
  });
  const scope: ComputedRef<HysAlertSlotContext> = computed(() => ({
    tone: tone.value,
    visible: visible.value,
    closing: closing.value,
    disabled: !!props.disabled,
    close: () => close(),
  }));
  return {
    skin,
    element,
    live,
    visible,
    tone,
    duration,
    closing,
    scope,
    close,
    show,
    beforeLeave,
    afterLeave,
    restore,
  };
}
