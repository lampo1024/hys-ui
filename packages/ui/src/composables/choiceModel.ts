import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUpdated,
  shallowRef,
  watch,
  type Ref,
} from "vue";
import { formKey } from "./formContext";
export function useChoiceModel<V>(
  props: { modelValue?: V },
  initial: () => V,
  equal: (a: V, b: V) => boolean = Object.is,
  invalidated?: () => void,
) {
  const local = shallowRef<V>(initial()),
    form = inject(formKey, undefined),
    current = computed<V>(() =>
      props.modelValue === undefined ? local.value : props.modelValue,
    );
  let live = true,
    version = 0,
    expected: { value: V; version: number } | undefined;
  function invalidate() {
    version++;
    expected = undefined;
    invalidated?.();
  }
  async function commit(
    value: V,
    update: (value: V) => void,
    change: (value: V) => void,
    notifyOnRequest = false,
  ) {
    if (!live || equal(current.value, value)) return false;
    const ticket = ++version;
    expected = { value, version: ticket };
    if (props.modelValue === undefined) local.value = value;
    update(value);
    if (notifyOnRequest) change(value);
    await nextTick();
    if (!live || ticket !== version) return false;
    expected = undefined;
    if (!equal(current.value, value)) return false;
    if (!notifyOnRequest) change(value);
    return true;
  }
  function reset() {
    invalidate();
    if (props.modelValue === undefined) local.value = initial();
  }
  watch(
    () => props.modelValue,
    (value) => {
      if (expected && equal(value as V, expected.value)) return;
      invalidate();
    },
    { flush: "sync" },
  );
  watch(
    () => form?.resetting.value,
    (value) => {
      if (value) invalidate();
    },
    { flush: "sync" },
  );
  onActivated(() => {
    live = true;
  });
  onDeactivated(() => {
    live = false;
    invalidate();
  });
  onBeforeUnmount(() => {
    live = false;
    invalidate();
  });
  return { current, commit, reset, invalidate, isLive: () => live };
}
export function useChoiceNativeReset(
  element: Ref<HTMLElement | undefined>,
  reset: () => void,
  sync?: () => void,
  formId?: () => string | undefined,
) {
  let live = true,
    owner: HTMLFormElement | undefined,
    version = 0;
  function onReset(event: Event) {
    const ticket = version;
    queueMicrotask(() => {
      if (!live || ticket !== version || event.defaultPrevented) return;
      reset();
      void nextTick(() => sync?.());
    });
  }
  function detach() {
    version++;
    owner?.removeEventListener("reset", onReset);
    owner = undefined;
  }
  function attach() {
    if (!live) return;
    const id = formId?.(),
      node = id
        ? document.getElementById(id)
        : (element.value as HTMLInputElement | undefined)?.form ||
          element.value?.closest("form");
    const next = node instanceof HTMLFormElement ? node : undefined;
    if (next === owner) return;
    detach();
    owner = next;
    owner?.addEventListener("reset", onReset);
  }
  onMounted(attach);
  onUpdated(attach);
  onActivated(() => {
    live = true;
    attach();
  });
  onDeactivated(() => {
    live = false;
    detach();
  });
  onBeforeUnmount(() => {
    live = false;
    detach();
  });
}
