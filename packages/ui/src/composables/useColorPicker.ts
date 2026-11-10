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
  useAttrs,
  useId,
  watch,
} from "vue";
import { fieldKey, formKey, useHysControlState } from "./formContext";
import { useChoiceModel, useChoiceNativeReset } from "./choiceModel";
import { useFloating } from "./useFloating";
import { overlayOwnerKey } from "./overlayManager";
import {
  colorClamp,
  colorCss,
  formatColor,
  parseColor,
  sameColor,
  type HysColor,
  type HysColorPickerProps,
  type HysColorPickerContext,
} from "./color";
export function useColorPicker(
  props: HysColorPickerProps,
  emit: (name: string, ...args: any[]) => void,
) {
  const attrs = useAttrs(),
    field = inject(fieldKey, undefined),
    form = inject(formKey, undefined),
    owner = inject(overlayOwnerKey, undefined),
    control = useHysControlState(props),
    element = ref<HTMLElement>(),
    trigger = ref<HTMLElement>(),
    input = ref<HTMLInputElement>(),
    panel = ref<HTMLElement>(),
    live = ref(true),
    draft = ref(""),
    working = ref<HysColor>({ h: 0, s: 0, v: 0, a: 1 }),
    hasColor = ref(false),
    focused = ref(false),
    errorId = useId(),
    panelId = useId();
  let epoch = 0,
    initial = props.defaultValue ?? "",
    frame = 0,
    point: { x: number; y: number } | undefined,
    publishVersion = 0,
    validationHolds = 0;
  type Gesture = {
    node: HTMLElement;
    id: number;
    kind: "palette" | "hue" | "alpha";
    rect: DOMRect;
    value: string;
    color: HysColor;
    hasColor: boolean;
    lastRequest: string;
    releaseValidation: () => void;
  };
  const gesture = shallowRef<Gesture>();
  const model = useChoiceModel<string>(
      props,
      () => initial,
      Object.is,
      () => {
        epoch++;
        stopGesture(false);
        sync();
      },
    ),
    value = computed(() => model.current.value ?? ""),
    locked = computed(() => control.disabled.value || !!props.readonly),
    format = computed(() => props.format ?? (props.showAlpha ? "rgb" : "hex")),
    serialized = computed(() =>
      hasColor.value
        ? formatColor(working.value, format.value, !!props.showAlpha)
        : "",
    ),
    css = computed(() => colorCss(working.value)),
    valid = computed(
      () =>
        !!parseColor(draft.value) ||
        (!draft.value.trim() && (!value.value || !!props.clearable)),
    ),
    dirty = computed(
      () =>
        !sameColor(
          hasColor.value ? working.value : undefined,
          parseColor(value.value),
        ),
    ),
    status = computed(() =>
      props.error || !valid.value || field?.invalid?.value
        ? "error"
        : (props.status ?? field?.status?.value),
    );
  const floating = useFloating(trigger, panel, {
    get placement() {
      return props.placement ?? "bottom-start";
    },
    get strategy() {
      return props.appendTo === false || teleportTo.value !== document.body
        ? "absolute"
        : "fixed";
    },
    width: () => props.popupWidth ?? 288,
    closeOnTab: true,
    requestOpen(next, restore) {
      if (!next && restore && gesture.value) {
        void stopGesture(true);
        return false;
      }
      emit("update:open", next);
      return props.open === undefined;
    },
  });
  const open = computed(
      () => live.value && (props.inline || floating.open.value),
    ),
    teleportTo = computed(() => {
      const to = props.appendTo;
      if (to === false || !to) return document.body;
      if (to instanceof HTMLElement) return to;
      try {
        return document.querySelector(to) ?? document.body;
      } catch {
        return document.body;
      }
    });
  const defaultPresets = [
      "#3867f5",
      "#8955ea",
      "#ec4899",
      "#ef4444",
      "#f59e0b",
      "#22a06b",
      "#06b6d4",
      "#172a4d",
      "#ffffff",
      "#000000",
    ],
    presets = computed(() =>
      (props.presets ?? defaultPresets).flatMap((value, index) => {
        const parsed = parseColor(value);
        return parsed
          ? [
              {
                value,
                color: colorCss(parsed),
                parsed,
                key: index + ":" + value,
              },
            ]
          : [];
      }),
    );
  function sync() {
    const parsed = parseColor(value.value);
    hasColor.value = !!parsed;
    if (parsed) working.value = { ...parsed };
    draft.value = value.value;
  }
  sync();
  function validate(trigger: "change" | "blur") {
    if (trigger === "change" && form?.model.value && !validationHolds) return;
    if (props.validateEvent !== false && !form?.resetting.value)
      void field?.validate?.(trigger);
  }
  async function publish(final = false) {
    if (!live.value || locked.value) return false;
    const requested = serialized.value,
      ticket = ++publishVersion,
      token = epoch;
    if (!requested && !props.clearable && value.value) return false;
    if (requested === value.value) {
      if (final) validate("change");
      return true;
    }
    if (gesture.value) gesture.value.lastRequest = requested;
    const accepted = await model.commit(
      requested,
      (v) => emit("update:modelValue", v),
      (v) => emit("change", v),
    );
    if (!live.value || ticket !== publishVersion || token !== epoch)
      return false;
    if (!accepted && !gesture.value) {
      sync();
      return false;
    }
    if (accepted && final) validate("change");
    return accepted;
  }
  async function setColor(raw: string) {
    if (!live.value || locked.value) return false;
    const parsed = parseColor(raw);
    if (!parsed) {
      if (!raw.trim() && props.clearable) return clear();
      emit("invalid", raw);
      return false;
    }
    working.value = { ...parsed };
    hasColor.value = true;
    draft.value = serialized.value;
    emit("activeChange", serialized.value);
    return props.immediate === false ? true : publish(true);
  }
  async function commitText() {
    if (!live.value || locked.value) return false;
    const text = draft.value.trim();
    if (!text) {
      if (props.clearable) return clear();
      sync();
      return false;
    }
    return setColor(text);
  }
  function preview(color: HysColor, final = false) {
    if (!live.value || locked.value) return;
    working.value = color;
    hasColor.value = true;
    draft.value = serialized.value;
    emit("activeChange", serialized.value);
    if (props.immediate !== false) void publish(final);
  }
  async function confirm() {
    if (!live.value || locked.value || !valid.value) {
      if (!valid.value) emit("invalid", draft.value);
      return false;
    }
    const parsed = parseColor(draft.value);
    if (parsed) {
      working.value = { ...parsed };
      hasColor.value = true;
    } else hasColor.value = false;
    const accepted = await publish(true);
    if (accepted) {
      emit("confirm", value.value);
      await hide(false);
    }
    return accepted;
  }
  async function clear() {
    if (!live.value || locked.value || !props.clearable) return false;
    epoch++;
    stopGesture(false);
    hasColor.value = false;
    draft.value = "";
    const accepted = await publish(true);
    if (accepted) emit("clear");
    return accepted;
  }
  function cancel() {
    if (!live.value) return;
    epoch++;
    stopGesture(false);
    sync();
    emit("cancel");
    void hide(false);
  }
  async function show() {
    if (!live.value || control.disabled.value || owner?.value === false)
      return false;
    if (props.inline) return true;
    await floating.show();
    await nextTick();
    if (!floating.open.value) return false;
    panel.value
      ?.querySelector<HTMLElement>("[role=slider]")
      ?.focus({ preventScroll: true });
    return true;
  }
  async function hide(restore = true) {
    if (props.inline) return false;
    floating.close(restore);
    await nextTick();
    return !floating.open.value;
  }
  function focus(options?: FocusOptions) {
    if (live.value && !control.disabled.value) {
      const target = props.inline
        ? panel.value?.querySelector<HTMLElement>('[role="slider"]')
        : (input.value ?? trigger.value);
      target?.focus(options);
    }
  }
  function blur() {
    const node = document.activeElement as HTMLElement | null;
    if (inside(node)) node?.blur();
  }
  function inside(target: Node | null) {
    return (
      !!target &&
      (!!element.value?.contains(target) || !!panel.value?.contains(target))
    );
  }
  function focusIn(event: FocusEvent) {
    if (!focused.value) {
      focused.value = true;
      emit("focus", event);
    }
  }
  function focusOut(event: FocusEvent) {
    void nextTick(() => {
      if (!live.value || inside(document.activeElement)) return;
      if (focused.value) {
        focused.value = false;
        emit("blur", event);
        validate("blur");
      }
    });
  }
  function updatePoint(x: number, y: number) {
    const g = gesture.value;
    if (!g || locked.value || !live.value) return;
    const ratio = colorClamp((x - g.rect.left) / g.rect.width),
      next = { ...working.value };
    if (g.kind === "palette") {
      next.s = ratio;
      next.v = 1 - colorClamp((y - g.rect.top) / g.rect.height);
    } else if (g.kind === "hue") next.h = ratio * 359;
    else next.a = ratio;
    if (
      ["h", "s", "v", "a"].every(
        (key) =>
          Math.abs(
            next[key as keyof HysColor] - working.value[key as keyof HysColor],
          ) < 1e-7,
      ) &&
      hasColor.value
    )
      return;
    preview(next);
  }
  function flush() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    const p = point;
    point = undefined;
    if (p) updatePoint(p.x, p.y);
  }
  function gestureEnvironment() {
    void stopGesture(false);
    sync();
  }
  function attachGesture() {
    document.addEventListener("keydown", gestureKey, true);
    window.addEventListener("resize", gestureEnvironment);
    window.addEventListener("scroll", gestureEnvironment, true);
    window.addEventListener("blur", gestureEnvironment);
  }
  function detachGesture() {
    document.removeEventListener("keydown", gestureKey, true);
    window.removeEventListener("resize", gestureEnvironment);
    window.removeEventListener("scroll", gestureEnvironment, true);
    window.removeEventListener("blur", gestureEnvironment);
  }
  function gestureKey(event: KeyboardEvent) {
    if (event.key === "Escape" && gesture.value) {
      event.preventDefault();
      event.stopPropagation();
      void stopGesture(true);
    }
  }
  function start(event: PointerEvent, kind: Gesture["kind"]) {
    if (
      !live.value ||
      locked.value ||
      event.button !== 0 ||
      event.isPrimary === false
    )
      return;
    const node = event.currentTarget as HTMLElement,
      rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    event.preventDefault();
    stopGesture(false);
    node.focus({ preventScroll: true });
    const release = field?.deferChangeValidation?.();
    let released = false;
    if (release) validationHolds++;
    gesture.value = {
      node,
      id: event.pointerId,
      kind,
      rect,
      value: value.value,
      color: { ...working.value },
      hasColor: hasColor.value,
      lastRequest: value.value,
      releaseValidation() {
        if (!released && release) {
          validationHolds--;
          release();
        }
        released = true;
      },
    };
    try {
      node.setPointerCapture(event.pointerId);
    } catch {}
    attachGesture();
    updatePoint(event.clientX, event.clientY);
  }
  function move(event: PointerEvent) {
    if (!gesture.value || gesture.value.id !== event.pointerId) return;
    point = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(flush);
  }
  async function end(event: PointerEvent) {
    const g = gesture.value;
    if (!g || g.id !== event.pointerId) return;
    flush();
    gesture.value = undefined;
    detachGesture();
    try {
      if (g.node.hasPointerCapture(g.id)) g.node.releasePointerCapture(g.id);
    } catch {}
    try {
      if (props.immediate !== false) await publish(true);
    } finally {
      g.releaseValidation();
    }
  }
  async function stopGesture(restore: boolean) {
    const g = gesture.value;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    point = undefined;
    gesture.value = undefined;
    detachGesture();
    if (!g) return;
    try {
      if (g.node.hasPointerCapture(g.id)) g.node.releasePointerCapture(g.id);
    } catch {}
    try {
      if (restore && live.value && !locked.value) {
        working.value = { ...g.color };
        hasColor.value = g.hasColor;
        draft.value = g.value;
        emit("activeChange", serialized.value);
        if (
          props.immediate !== false &&
          (value.value === g.lastRequest || value.value === g.value)
        ) {
          const accepted = await model.commit(
            g.value,
            (v) => emit("update:modelValue", v),
            (v) => emit("change", v),
          );
          if (!accepted && value.value !== g.value) sync();
        }
      }
    } finally {
      g.releaseValidation();
    }
  }
  function pointerCancel(event: PointerEvent) {
    if (gesture.value?.id === event.pointerId) void stopGesture(true);
  }
  function keyboard(event: KeyboardEvent, kind: Gesture["kind"]) {
    if (
      locked.value ||
      !live.value ||
      event.isComposing ||
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    const next = { ...working.value },
      step = event.shiftKey || event.key.startsWith("Page") ? 10 : 1,
      negative = ["ArrowLeft", "ArrowDown", "PageDown"].includes(event.key);
    if (kind === "palette") {
      if (event.key === "Home") next.s = 0;
      else if (event.key === "End") next.s = 1;
      else if (["ArrowLeft", "ArrowRight"].includes(event.key))
        next.s = colorClamp(
          next.s + (event.key === "ArrowLeft" ? -step : step) / 100,
        );
      else next.v = colorClamp(next.v + (negative ? -step : step) / 100);
    } else {
      const name = kind === "hue" ? "h" : "a",
        max = kind === "hue" ? 359 : 1;
      next[name] =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? max
            : colorClamp(
                next[name] +
                  (negative ? -step : step) * (kind === "hue" ? 1 : 0.01),
                0,
                max,
              );
    }
    preview(next, true);
  }
  watch(
    () => props.open,
    async (next) => {
      if (!live.value || props.inline) return;
      if (next && !control.disabled.value) {
        await floating.show(true);
      } else if (next === false) floating.close(false, true);
    },
    { flush: "post" },
  );
  watch(floating.open, (next) => {
    if (next) {
      if (
        props.immediate !== false ||
        (!dirty.value && draft.value === value.value)
      )
        sync();
    } else {
      epoch++;
      stopGesture(false);
      sync();
    }
    emit("visibleChange", next);
  });
  watch(
    value,
    () => {
      if (!gesture.value && !dirty.value) sync();
    },
    { flush: "post" },
  );
  watch(
    () => [
      control.disabled.value,
      props.readonly,
      props.inline,
      props.appendTo,
      props.showAlpha,
      props.format,
      props.immediate,
      props.placement,
      props.popupWidth,
    ],
    () => {
      epoch++;
      stopGesture(false);
      sync();
      if (control.disabled.value) floating.close(false, true);
      if (props.inline) floating.close(false, true);
      else if (floating.open.value) floating.schedule();
    },
    { flush: "sync" },
  );
  useChoiceNativeReset(
    element,
    () => {
      epoch++;
      stopGesture(false);
      model.reset();
      sync();
      floating.close(false, true);
    },
    undefined,
    () => props.form,
  );
  watch(
    () => form?.resetting.value,
    (next) => {
      if (next) {
        epoch++;
        stopGesture(false);
        model.reset();
        sync();
        floating.close(false, true);
      }
    },
    { flush: "sync" },
  );
  function deactivate() {
    live.value = false;
    epoch++;
    publishVersion++;
    stopGesture(false);
    floating.close(false, true);
    focused.value = false;
  }
  onMounted(() => {
    if (props.autofocus) focus();
    if (!props.inline) {
      if (props.open) void floating.show(true);
      else if (props.defaultOpen && props.open === undefined) void show();
    }
  });
  onActivated(() => {
    live.value = true;
    sync();
  });
  onDeactivated(deactivate);
  onBeforeUnmount(deactivate);
  const context = computed<HysColorPickerContext>(() => ({
    value: value.value,
    draft: draft.value,
    color: { ...working.value },
    disabled: control.disabled.value,
    readonly: !!props.readonly,
    valid: valid.value,
    dirty: dirty.value,
    setColor,
    confirm,
    cancel,
    clear,
    show,
    hide,
  }));
  return {
    attrs,
    field,
    control,
    element,
    trigger,
    input,
    panel,
    live,
    draft,
    working,
    hasColor,
    focused,
    errorId,
    panelId,
    value,
    locked,
    format,
    serialized,
    css,
    valid,
    dirty,
    status,
    floating,
    open,
    teleportTo,
    presets,
    context,
    gesture,
    sync,
    publish,
    setColor,
    commitText,
    confirm,
    clear,
    cancel,
    show,
    hide,
    focus,
    blur,
    focusIn,
    focusOut,
    start,
    move,
    end,
    pointerCancel,
    keyboard,
  };
}
