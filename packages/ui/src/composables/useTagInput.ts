import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  useAttrs,
  useId,
  watch,
  type Ref,
} from "vue";
import { fieldKey, formKey, useHysControlState } from "./formContext";
import { useChoiceModel, useChoiceNativeReset } from "./choiceModel";
import {
  splitTags,
  type HysTagInputProps,
  type HysTagInputReason,
  type HysTagInputInvalid,
} from "./tagInput";
export function useTagInput(
  props: HysTagInputProps,
  emit: (event: string, ...args: any[]) => void,
) {
  const attrs = useAttrs(),
    field = inject(fieldKey, undefined),
    form = inject(formKey, undefined),
    control = useHysControlState(props),
    element = ref<HTMLElement>(),
    input = ref<HTMLInputElement>(),
    draft = ref(""),
    pending = ref(false),
    composing = ref(false),
    focused = ref(false),
    errorId = useId();
  let version = 0,
    job: AbortController | undefined,
    live = true,
    expectedValues: readonly string[] | undefined;
  const same = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);
  function cancel() {
    version++;
    job?.abort();
    job = undefined;
    pending.value = false;
    expectedValues = undefined;
    stopDrag();
  }
  const model = useChoiceModel<readonly string[]>(
      props,
      () => [...(props.defaultValue ?? [])],
      same,
      cancel,
    ),
    values = computed(() =>
      Array.isArray(model.current.value)
        ? model.current.value.filter((v) => typeof v === "string")
        : [],
    ),
    locked = computed(() => control.disabled.value || !!props.readonly);
  const maximum = computed(() =>
      props.max === Infinity
        ? Infinity
        : Number.isFinite(props.max)
          ? Math.max(0, Math.floor(props.max!))
          : 10,
    ),
    status = computed(() =>
      props.error || field?.invalid?.value
        ? "error"
        : (props.status ?? field?.status?.value),
    ),
    token = useId(),
    drag = ref<{ index: number; values: string[] }>(),
    drop = ref<{ index: number; after: boolean }>();
  function validate(trigger: "change" | "blur") {
    if (trigger === "change" && form?.model.value) return;
    if (props.validateEvent !== false && !form?.resetting.value)
      void field?.validate?.(trigger);
  }
  async function commit(next: string[]) {
    return model.commit(
      next,
      (value) => emit("update:modelValue", [...value]),
      (value) => emit("change", [...value]),
      true,
    );
  }
  function invalid(
    value: string,
    reason: HysTagInputInvalid["reason"],
    error?: unknown,
  ) {
    emit("reject", value);
    emit("invalid", {
      value,
      reason,
      ...(error
        ? { error: error instanceof Error ? error : new Error(String(error)) }
        : {}),
    });
  }
  async function add(
    value?: string | string[],
    reason: HysTagInputReason = "api",
  ) {
    if (!live || locked.value || pending.value || composing.value) return false;
    const original = draft.value,
      source = value ?? original,
      candidates = Array.isArray(source)
        ? source
        : splitTags(source, props.delimiters ?? props.separator),
      next = [...values.value],
      added: string[] = [],
      remaining: string[] = [];
    const controller = new AbortController(),
      ticket = ++version;
    job = controller;
    pending.value = true;
    const current = () =>
      ticket === version && !controller.signal.aborted && live && !locked.value;
    try {
      for (const raw of candidates) {
        if (!current()) return false;
        const candidate = props.trim === false ? raw : raw.trim();
        if (!candidate) continue;
        let rejection: HysTagInputInvalid["reason"] | undefined;
        if (
          !props.allowDuplicates &&
          next.some((v) =>
            props.caseSensitive === false
              ? v.toLocaleLowerCase() === candidate.toLocaleLowerCase()
              : v === candidate,
          )
        )
          rejection = "duplicate";
        else if (next.length >= maximum.value) rejection = "max";
        else if (
          props.maxlength !== undefined &&
          candidate.length > props.maxlength
        )
          rejection = "maxlength";
        else if (
          props.minlength !== undefined &&
          candidate.length < props.minlength
        )
          rejection = "minlength";
        if (rejection) {
          invalid(candidate, rejection);
          remaining.push(candidate);
          if (!current()) return false;
          continue;
        }
        try {
          const check = props.beforeAdd?.(candidate, {
              signal: controller.signal,
              values: [...next],
              reason,
            }),
            result =
              check && typeof (check as Promise<unknown>).then === "function"
                ? await check
                : check;
          if (!current()) return false;
          if (result === false) {
            invalid(candidate, "guard");
            remaining.push(candidate);
            continue;
          }
        } catch (error) {
          if (!current()) return false;
          invalid(candidate, "error", error);
          remaining.push(candidate);
          continue;
        }
        if (!current()) return false;
        next.push(candidate);
        added.push(candidate);
      }
      if (!current() || !added.length) return false;
      // Keep legacy request events; acceptedChange and form validation require acceptance.
      for (const tag of added) emit("add", tag);
      if (!current()) return false;
      expectedValues = next;
      const accepted = await commit(next);
      if (!current() || !accepted) return false;
      if (value === undefined && draft.value === original)
        draft.value = remaining.join(
          typeof props.separator === "string" && props.separator
            ? props.separator
            : ", ",
        );
      emit("acceptedChange", [...values.value]);
      validate("change");
      return true;
    } finally {
      if (ticket === version) {
        job = undefined;
        pending.value = false;
        expectedValues = undefined;
      }
    }
  }
  async function remove(index: number) {
    if (
      !live ||
      locked.value ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= values.value.length
    )
      return false;
    cancel();
    const value = values.value[index],
      next = values.value.filter((_, i) => i !== index);
    const request = commit(next);
    emit("remove", value);
    const accepted = await request;
    if (accepted) {
      emit("acceptedChange", [...values.value]);
      validate("change");
    }
    return accepted;
  }
  async function clear() {
    if (!live || locked.value) return false;
    cancel();
    const original = draft.value;
    if (!values.value.length) {
      draft.value = "";
      if (original) emit("clear");
      return !!original;
    }
    const accepted = await commit([]);
    if (accepted) {
      if (draft.value === original) draft.value = "";
      emit("clear");
      emit("acceptedChange", []);
      validate("change");
    }
    return accepted;
  }
  async function move(from: number, to: number) {
    if (
      !live ||
      locked.value ||
      !props.draggable ||
      ![from, to].every(Number.isInteger) ||
      from < 0 ||
      to < 0 ||
      from >= values.value.length ||
      to >= values.value.length ||
      from === to
    )
      return false;
    cancel();
    const next = [...values.value],
      item = next.splice(from, 1)[0];
    next.splice(to, 0, item);
    emit("reorder", from, to, [...next]);
    const accepted = await commit(next);
    if (accepted) {
      emit("acceptedChange", [...values.value]);
      validate("change");
    }
    return accepted;
  }
  function focus(options?: FocusOptions) {
    if (live && !control.disabled.value) input.value?.focus(options);
  }
  function nativeInput(event: Event) {
    draft.value = (event.target as HTMLInputElement).value;
    emit("input", draft.value);
    if (composing.value || (event as InputEvent).isComposing) return;
    if (props.delimiters && splitTags(draft.value, props.delimiters).length > 1)
      void add(undefined, "separator");
  }
  function compositionEnd(event: CompositionEvent) {
    composing.value = false;
    draft.value = (event.target as HTMLInputElement).value;
    emit("compositionend", event);
  }
  function pasted(event: ClipboardEvent) {
    if (locked.value || composing.value || !props.delimiters) return;
    const text = event.clipboardData?.getData("text/plain");
    if (!text) return;
    const node = event.target as HTMLInputElement,
      next =
        draft.value.slice(0, node.selectionStart ?? draft.value.length) +
        text +
        draft.value.slice(node.selectionEnd ?? draft.value.length);
    if (splitTags(next, props.delimiters).length < 2) return;
    event.preventDefault();
    draft.value = next;
    emit("input", next);
    void add(undefined, "paste");
  }
  function key(event: KeyboardEvent) {
    if (
      event.isComposing ||
      event.keyCode === 229 ||
      composing.value ||
      locked.value
    )
      return;
    const keys = Array.isArray(props.trigger)
        ? props.trigger
        : [props.trigger ?? "Enter"],
      key = event.key === " " ? "Space" : event.key;
    if (keys.includes(key) && draft.value.trim()) {
      if (key !== "Tab") event.preventDefault();
      void add(undefined, "keyboard");
      return;
    }
    if (event.key === "Backspace" && !draft.value && values.value.length) {
      event.preventDefault();
      void remove(values.value.length - 1);
    } else if (
      event.key === "ArrowLeft" &&
      !draft.value &&
      values.value.length
    ) {
      event.preventDefault();
      focusTag(values.value.length - 1);
    } else if (event.key === "Escape" && pending.value) {
      event.preventDefault();
      cancel();
    }
  }
  function focusTag(index: number) {
    if (!live || control.disabled.value) return;
    const node = element.value?.querySelector<HTMLElement>(
      '[data-tag-index="' + index + '"]',
    );
    if (node) node.focus();
    else focus();
  }
  async function tagKey(event: KeyboardEvent, index: number) {
    if (locked.value || event.isComposing) return;
    if (
      props.draggable &&
      event.altKey &&
      ["ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      event.preventDefault();
      const to = index + (event.key === "ArrowLeft" ? -1 : 1);
      if (await move(index, to)) {
        await nextTick();
        focusTag(to);
      }
      return;
    }
    if (["Backspace", "Delete"].includes(event.key)) {
      event.preventDefault();
      if (await remove(index)) {
        await nextTick();
        focusTag(Math.min(index, values.value.length - 1));
      }
      return;
    }
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const to =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? values.value.length - 1
            : index + (event.key === "ArrowLeft" ? -1 : 1);
      if (to >= 0 && to < values.value.length) focusTag(to);
      else focus();
    }
  }
  function inside(target: Node | null, extra?: HTMLElement) {
    return (
      !!target &&
      (!!element.value?.contains(target) || !!extra?.contains(target))
    );
  }
  function focusIn(event: FocusEvent) {
    if (!focused.value) {
      focused.value = true;
      emit("focus", event);
    }
  }
  function focusOut(event: FocusEvent, extra?: HTMLElement) {
    void nextTick(() => {
      if (!live || inside(document.activeElement, extra)) return;
      if (focused.value) {
        focused.value = false;
        emit("blur", event);
        if (props.addOnBlur && !composing.value) void add(undefined, "blur");
        validate("blur");
      }
    });
  }
  function stopDrag() {
    drag.value = undefined;
    drop.value = undefined;
    document.removeEventListener("keydown", dragKey, true);
    window.removeEventListener("blur", stopDrag);
  }
  function dragKey(event: KeyboardEvent) {
    if (event.key === "Escape") stopDrag();
  }
  function dragStart(event: DragEvent, index: number) {
    if (
      locked.value ||
      pending.value ||
      !props.draggable ||
      (event.target as HTMLElement).closest("button,input,a")
    ) {
      event.preventDefault();
      return;
    }
    cancel();
    drag.value = { index, values: [...values.value] };
    event.dataTransfer?.setData("application/x-hys-tag-input", token);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    document.addEventListener("keydown", dragKey, true);
    window.addEventListener("blur", stopDrag);
  }
  function dragOver(event: DragEvent, index: number) {
    if (!drag.value || locked.value || !same(drag.value.values, values.value))
      return;
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    drop.value = { index, after: event.clientX > rect.left + rect.width / 2 };
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }
  async function dragDrop(event: DragEvent) {
    if (
      !drag.value ||
      !drop.value ||
      locked.value ||
      !same(drag.value.values, values.value)
    )
      return;
    if (event.dataTransfer?.getData("application/x-hys-tag-input") !== token)
      return;
    event.preventDefault();
    const from = drag.value.index,
      position = drop.value.index + (drop.value.after ? 1 : 0),
      to = position - (from < position ? 1 : 0);
    await move(from, to);
    stopDrag();
  }
  useChoiceNativeReset(
    element,
    () => {
      cancel();
      model.reset();
      draft.value = "";
      composing.value = false;
      focused.value = false;
    },
    undefined,
    () => props.form,
  );
  watch(
    values,
    (next, previous) => {
      if (
        !same(next, previous) &&
        (!expectedValues || !same(next, expectedValues))
      ) {
        if (job) cancel();
        else stopDrag();
      }
    },
    { flush: "sync" },
  );
  watch(
    () => [
      control.disabled.value,
      props.readonly,
      props.beforeAdd,
      props.max,
      props.delimiters,
      props.separator,
    ],
    cancel,
    { flush: "sync" },
  );
  watch(
    () => form?.resetting.value,
    (value) => {
      if (value) {
        cancel();
        model.reset();
        draft.value = "";
        composing.value = false;
      }
    },
    { flush: "sync" },
  );
  onMounted(() => {
    if (props.autofocus) focus();
  });
  onActivated(() => {
    live = true;
  });
  function stop() {
    live = false;
    cancel();
    composing.value = false;
    focused.value = false;
  }
  onDeactivated(stop);
  onBeforeUnmount(stop);
  const context = computed(() => ({
      values: values.value,
      draft: draft.value,
      disabled: control.disabled.value,
      readonly: !!props.readonly,
      pending: pending.value,
      add: (value?: string | string[]) => add(value),
      clear,
    })),
    tags = computed(() => {
      const occurrences = new Map<string, number>();
      return values.value.map((value, index) => {
        const n = occurrences.get(value) ?? 0;
        occurrences.set(value, n + 1);
        return { value, index, key: JSON.stringify([value, n]) };
      });
    });
  return {
    attrs,
    field,
    control,
    element,
    input,
    errorId,
    draft,
    pending,
    composing,
    focused,
    values,
    status,
    maximum,
    context,
    tags,
    drag,
    drop,
    add,
    remove,
    clear,
    move,
    focus,
    nativeInput,
    compositionEnd,
    pasted,
    key,
    tagKey,
    focusIn,
    focusOut,
    stopDrag,
    dragStart,
    dragOver,
    dragDrop,
    setDraft: (value: string) => {
      if (live && !locked.value) draft.value = value;
    },
  };
}
